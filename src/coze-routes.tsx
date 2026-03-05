// Coze 工作流触发 + 调度管理路由
// 挂载到 /coze 路径下

import { Hono } from "hono";
import { config } from "./config.js";
import { runWorkflow } from "./utils/coze.js";
import {
  getAllTasks,
  createTask,
  updateTask,
  deleteTask,
  executeTask,
} from "./utils/coze-scheduler.js";
import CozeScheduler from "./views/CozeScheduler.js";

const cozeApp = new Hono();

// ==================== 工作流直接触发 ====================

/**
 * POST /coze/workflow/run
 * 触发 Coze 工作流（需要 API Key 鉴权）
 */
cozeApp.post("/workflow/run", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const workflowId = (body as Record<string, string>).workflow_id || config.COZE_WORKFLOW_ID;
  const parameters = (body as Record<string, unknown>).parameters || {};

  const result = await runWorkflow(workflowId, parameters as Record<string, unknown>);
  return c.json({ code: 200, data: result });
});

// ==================== 调度配置页面 ====================

/**
 * GET /coze/scheduler
 * 调度配置页面（免鉴权，通过 PUBLIC_PATHS 放行）
 */
cozeApp.get("/scheduler", (c) => {
  return c.html(<CozeScheduler apiKey={config.API_KEY} />);
});

// ==================== 调度任务 CRUD API ====================

/**
 * GET /coze/scheduler/tasks
 * 获取所有调度任务
 */
cozeApp.get("/scheduler/tasks", async (c) => {
  const tasks = await getAllTasks();
  return c.json({ code: 200, data: tasks });
});

/**
 * POST /coze/scheduler/tasks
 * 创建调度任务
 */
cozeApp.post("/scheduler/tasks", async (c) => {
  const body = await c.req.json();
  const task = await createTask(body as {
    type: "recurring" | "once";
    platform: string;
    limit?: string;
    intervalHours?: number;
    enabled?: boolean;
  });
  return c.json({ code: 200, data: task });
});

/**
 * PATCH /coze/scheduler/tasks/:id
 * 更新调度任务
 */
cozeApp.patch("/scheduler/tasks/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const task = await updateTask(id, body as Record<string, unknown>);
  return c.json({ code: 200, data: task });
});

/**
 * DELETE /coze/scheduler/tasks/:id
 * 删除调度任务
 */
cozeApp.delete("/scheduler/tasks/:id", async (c) => {
  const id = c.req.param("id");
  await deleteTask(id);
  return c.json({ code: 200, message: "已删除" });
});

// ==================== 单次立即执行 ====================

/**
 * POST /coze/scheduler/execute
 * 立即执行（不保存为循环任务）
 */
cozeApp.post("/scheduler/execute", async (c) => {
  const body = await c.req.json();
  const { platform, limit } = body as { platform: string; limit?: string };

  if (!platform) {
    return c.json({ code: 400, message: "platform 不能为空" }, 400);
  }

  const result = await executeTask({ platform, limit });
  return c.json({ code: 200, data: result });
});

export default cozeApp;
