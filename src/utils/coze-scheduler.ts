// Coze 工作流定时调度服务
// 任务存储于 Redis，使用 setTimeout/setInterval 定时执行

import crypto from "crypto";
import { config } from "../config.js";
import { runWorkflow } from "./coze.js";
import { batchCreateRecords } from "./feishu.js";
import { redis, ensureRedisConnection } from "./cache.js";
import logger from "./logger.js";

// ==================== 类型 ====================

export interface ScheduledTask {
  id: string;
  type: "recurring" | "once";
  platform: string;          // 必填，逗号分隔
  limit: string;             // 默认 "1"
  intervalHours: number;     // 循环任务：每 X 小时执行（支持 0.1-24 小数）
  enabled: boolean;          // 循环任务：开关
  status: "idle" | "running" | "success" | "failed";
  firstRunAt: string | null; // 首次执行时间（ISO）
  lastRunAt: string | null;
  lastResult: { code: number; msg: string; randomToken: string; total?: number } | null;
  createdAt: string;
}

export interface ExecLog {
  id: string;
  type: "recurring" | "once";
  taskId?: string;           // 循环任务关联 ID
  platform: string;
  limit: string;
  status: "running" | "success" | "failed";
  result?: { code: number; msg: string; randomToken: string; total?: number };
  startedAt: string;
  finishedAt?: string;
}

// ==================== 常量 ====================

const REDIS_KEY = "coze:scheduler:tasks";
const EXEC_LOGS_KEY = "coze:scheduler:exec-logs";
const MAX_EXEC_LOGS = 50;
const WORKFLOW_TIMEOUT_MS = 15 * 60 * 1000; // 15 分钟
const API_BASE_URL = "https://dailyhot.runfast.xyz";

// ==================== 定时任务管理 ====================

// taskId → 清理函数映射
const scheduledJobs = new Map<string, { clear: () => void }>();

// ==================== Redis 存储 ====================

async function saveTask(task: ScheduledTask): Promise<void> {
  await ensureRedisConnection();
  await redis.hset(REDIS_KEY, task.id, JSON.stringify(task));
}

async function loadTask(id: string): Promise<ScheduledTask | null> {
  await ensureRedisConnection();
  const raw = await redis.hget(REDIS_KEY, id);
  if (!raw) return null;
  return JSON.parse(raw) as ScheduledTask;
}

async function removeTask(id: string): Promise<void> {
  await ensureRedisConnection();
  await redis.hdel(REDIS_KEY, id);
}

// ==================== 执行日志 Redis 存储 ====================

async function pushExecLog(log: ExecLog): Promise<void> {
  await ensureRedisConnection();
  await redis.lpush(EXEC_LOGS_KEY, JSON.stringify(log));
  await redis.ltrim(EXEC_LOGS_KEY, 0, MAX_EXEC_LOGS - 1);
}

async function updateExecLog(id: string, updates: Partial<ExecLog>): Promise<void> {
  await ensureRedisConnection();
  const all = await redis.lrange(EXEC_LOGS_KEY, 0, -1);
  for (let i = 0; i < all.length; i++) {
    const log = JSON.parse(all[i]) as ExecLog;
    if (log.id === id) {
      Object.assign(log, updates);
      await redis.lset(EXEC_LOGS_KEY, i, JSON.stringify(log));
      return;
    }
  }
}

export async function getExecLogs(limit = 20): Promise<ExecLog[]> {
  await ensureRedisConnection();
  const raw = await redis.lrange(EXEC_LOGS_KEY, 0, limit - 1);
  return raw.map((r) => JSON.parse(r) as ExecLog);
}

// ==================== 任务 CRUD ====================

export async function getAllTasks(): Promise<ScheduledTask[]> {
  await ensureRedisConnection();
  const all = await redis.hgetall(REDIS_KEY);
  return Object.values(all).map((raw) => JSON.parse(raw) as ScheduledTask);
}

export async function createTask(input: {
  type: "recurring" | "once";
  platform: string;
  limit?: string;
  intervalHours?: number;
  enabled?: boolean;
  firstRunAt?: string;
}): Promise<ScheduledTask> {
  const task: ScheduledTask = {
    id: crypto.randomUUID(),
    type: input.type,
    platform: input.platform,
    limit: input.limit || "1",
    intervalHours: input.intervalHours || 1,
    enabled: input.enabled ?? true,
    status: "idle",
    firstRunAt: input.firstRunAt || null,
    lastRunAt: null,
    lastResult: null,
    createdAt: new Date().toISOString(),
  };

  await saveTask(task);
  logger.info(`📋 [SCHEDULER] 创建任务: ${task.id} (${task.type}, platform=${task.platform})`);

  // 循环任务：注册定时
  if (task.type === "recurring" && task.enabled && !isDevelopment()) {
    registerScheduledJob(task);
  }

  return task;
}

export async function updateTask(
  id: string,
  updates: Partial<Pick<ScheduledTask, "platform" | "limit" | "intervalHours" | "enabled" | "firstRunAt">>,
): Promise<ScheduledTask> {
  const task = await loadTask(id);
  if (!task) throw new Error(`任务不存在: ${id}`);

  const oldEnabled = task.enabled;
  const oldInterval = task.intervalHours;
  const oldFirstRunAt = task.firstRunAt;

  Object.assign(task, updates);
  await saveTask(task);

  // 循环任务：更新定时
  if (task.type === "recurring" && !isDevelopment()) {
    const needReschedule =
      (updates.intervalHours !== undefined && updates.intervalHours !== oldInterval) ||
      (updates.firstRunAt !== undefined && updates.firstRunAt !== oldFirstRunAt);
    const needToggle = updates.enabled !== undefined && updates.enabled !== oldEnabled;

    if (needReschedule || needToggle) {
      unregisterScheduledJob(id);
      if (task.enabled) {
        registerScheduledJob(task);
      }
    }
  }

  logger.info(`📋 [SCHEDULER] 更新任务: ${id}`);
  return task;
}

export async function deleteTask(id: string): Promise<void> {
  unregisterScheduledJob(id);
  await removeTask(id);
  logger.info(`📋 [SCHEDULER] 删除任务: ${id}`);
}

// ==================== 任务执行 ====================

export async function executeTask(taskOrInput: ScheduledTask | { platform: string; limit?: string }): Promise<{
  code: number;
  msg: string;
  randomToken: string;
  total?: number;
}> {
  const randomToken = crypto.randomUUID();
  const platform = taskOrInput.platform;
  const limit = taskOrInput.limit || "1";
  const isStoredTask = "id" in taskOrInput;

  // 写入执行日志（running 状态）
  const logId = crypto.randomUUID();
  const execLog: ExecLog = {
    id: logId,
    type: isStoredTask ? taskOrInput.type : "once",
    taskId: isStoredTask ? taskOrInput.id : undefined,
    platform,
    limit,
    status: "running",
    startedAt: new Date().toISOString(),
  };
  await pushExecLog(execLog);

  // 如果是保存的任务，更新状态
  if (isStoredTask) {
    taskOrInput.status = "running";
    await saveTask(taskOrInput);
  }

  logger.info(`🚀 [SCHEDULER] 执行任务: platform=${platform}, limit=${limit}, randomToken=${randomToken}`);

  try {
    const result = await runWorkflow(
      config.COZE_WORKFLOW_ID,
      { api: API_BASE_URL, limit, platform, randomToken },
      WORKFLOW_TIMEOUT_MS,
    );

    // result.data 是 JSON 字符串，Coze 结束节点返回 {output: [{fields: {...}}, ...], randomToken: "..."}
    let parsed: { output?: Array<{ fields: Record<string, unknown> }>; randomToken?: string; code?: number; msg?: string; total?: number } = {};
    try {
      parsed = JSON.parse(result.data);
    } catch {
      // data 不是 JSON，使用 result 顶层字段
    }

    // 将 Coze 输出写入飞书多维表格
    let feishuTotal = 0;
    if (parsed.output && Array.isArray(parsed.output) && parsed.output.length > 0) {
      try {
        feishuTotal = await batchCreateRecords(parsed.output);
        logger.info(`📊 [SCHEDULER] 飞书写入统计: 成功 ${feishuTotal}/${parsed.output.length} 条`);
      } catch (feishuErr) {
        const feishuMsg = feishuErr instanceof Error ? feishuErr.message : String(feishuErr);
        logger.error(`❌ [SCHEDULER] 飞书写入失败: ${feishuMsg}`);
      }
    }

    const taskResult = {
      code: parsed.code ?? result.code,
      msg: parsed.msg ?? result.msg ?? `飞书写入 ${feishuTotal} 条`,
      randomToken,
      total: feishuTotal,
    };

    if (isStoredTask) {
      taskOrInput.status = taskResult.code === 0 ? "success" : "failed";
      taskOrInput.lastRunAt = new Date().toISOString();
      taskOrInput.lastResult = taskResult;
      await saveTask(taskOrInput);
    }

    // 更新执行日志
    await updateExecLog(logId, {
      status: taskResult.code === 0 ? "success" : "failed",
      result: taskResult,
      finishedAt: new Date().toISOString(),
    });

    logger.info(`✅ [SCHEDULER] 任务完成: platform=${platform}, code=${taskResult.code}, randomToken=${randomToken}`);
    return taskResult;
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const taskResult = { code: -1, msg: errMsg, randomToken };

    if (isStoredTask) {
      taskOrInput.status = "failed";
      taskOrInput.lastRunAt = new Date().toISOString();
      taskOrInput.lastResult = taskResult;
      await saveTask(taskOrInput);
    }

    // 更新执行日志
    await updateExecLog(logId, {
      status: "failed",
      result: taskResult,
      finishedAt: new Date().toISOString(),
    });

    logger.error(`❌ [SCHEDULER] 任务失败: platform=${platform}, error=${errMsg}, randomToken=${randomToken}`);
    return taskResult;
  }
}

// ==================== 定时调度 ====================

function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

function registerScheduledJob(task: ScheduledTask): void {
  const intervalMs = task.intervalHours * 3600 * 1000;
  let timeoutRef: ReturnType<typeof setTimeout> | null = null;
  let intervalRef: ReturnType<typeof setInterval> | null = null;

  const runTask = async () => {
    logger.info(`⏰ [SCHEDULER] 定时触发: ${task.id} (platform=${task.platform})`);
    const latest = await loadTask(task.id);
    if (!latest || !latest.enabled) {
      logger.info(`⏭️ [SCHEDULER] 任务已禁用或不存在，跳过: ${task.id}`);
      return;
    }
    await executeTask(latest);
  };

  // 计算首次执行延迟
  let delayMs: number;
  if (task.lastRunAt) {
    // 已执行过：下次 = lastRunAt + interval
    const nextRun = new Date(task.lastRunAt).getTime() + intervalMs;
    delayMs = nextRun - Date.now();
    if (delayMs < 0) delayMs = 0;
  } else if (task.firstRunAt) {
    // 未执行过，有首次执行时间
    delayMs = new Date(task.firstRunAt).getTime() - Date.now();
    if (delayMs < 0) delayMs = 0;
  } else {
    // 无信息，等一个周期
    delayMs = intervalMs;
  }

  timeoutRef = setTimeout(async () => {
    await runTask();
    intervalRef = setInterval(runTask, intervalMs);
  }, delayMs);

  scheduledJobs.set(task.id, {
    clear: () => {
      if (timeoutRef) clearTimeout(timeoutRef);
      if (intervalRef) clearInterval(intervalRef);
    },
  });

  const nextRunAt = new Date(Date.now() + delayMs).toISOString();
  logger.info(`⏰ [SCHEDULER] 注册定时: ${task.id}, 下次执行≈${nextRunAt}, 间隔=${task.intervalHours}h`);
}

function unregisterScheduledJob(id: string): void {
  const job = scheduledJobs.get(id);
  if (job) {
    job.clear();
    scheduledJobs.delete(id);
    logger.info(`⏰ [SCHEDULER] 注销定时: ${id}`);
  }
}

// ==================== 启动 / 停止 ====================

export async function startScheduler(): Promise<void> {
  if (isDevelopment()) {
    logger.info("📋 [SCHEDULER] 开发环境，跳过定时任务启动");
    return;
  }

  logger.info("📋 [SCHEDULER] 启动调度器，加载 Redis 任务...");
  const tasks = await getAllTasks();
  let count = 0;

  for (const task of tasks) {
    if (task.type === "recurring" && task.enabled) {
      registerScheduledJob(task);
      count++;
    }
  }

  logger.info(`📋 [SCHEDULER] 调度器启动完成，加载 ${count} 个循环任务`);
}

export function stopScheduler(): void {
  for (const [id, job] of scheduledJobs) {
    job.clear();
    logger.info(`⏰ [SCHEDULER] 停止定时: ${id}`);
  }
  scheduledJobs.clear();
  logger.info("📋 [SCHEDULER] 调度器已停止");
}
