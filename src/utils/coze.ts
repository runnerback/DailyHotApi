// Coze OAuth token 管理 + 工作流 API 调用
// 授权码模式：首次浏览器授权 → refresh_token 自动续期
// Token 持久化到 Redis，PM2 重启不丢失

import axios from "axios";
import { config } from "../config.js";
import { redis, ensureRedisConnection } from "./cache.js";
import logger from "./logger.js";

// ==================== 类型 ====================

interface CozeTokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number; // access_token 到期绝对时间戳(ms)
}

interface CozeWorkflowResponse {
  code: number;
  msg: string;
  data: string;
}

// ==================== 常量 ====================

const REDIS_KEY = "coze:token";
// 提前 2 分钟视为过期（access_token 有效期 15 分钟）
const SAFETY_MARGIN_MS = 2 * 60 * 1000;

// ==================== 内存缓存 + 并发锁 ====================

let cachedToken: CozeTokenData | null = null;
let refreshingPromise: Promise<CozeTokenData> | null = null;

// ==================== Redis 存取 ====================

async function saveTokenToRedis(token: CozeTokenData): Promise<void> {
  await ensureRedisConnection();
  await redis.set(REDIS_KEY, JSON.stringify(token));
  logger.info("🔑 [COZE] Token 已保存到 Redis");
}

async function loadTokenFromRedis(): Promise<CozeTokenData | null> {
  await ensureRedisConnection();
  const raw = await redis.get(REDIS_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as CozeTokenData;
}

// ==================== OAuth ====================

/**
 * 生成 Coze OAuth 授权页面 URL
 */
export function getAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: config.COZE_CLIENT_ID,
    redirect_uri: config.COZE_REDIRECT_URL,
    response_type: "code",
    state,
  });
  return `https://www.coze.cn/api/permission/oauth2/authorize?${params.toString()}`;
}

/**
 * 用授权码换取 access_token + refresh_token
 */
export async function exchangeCodeForToken(code: string): Promise<CozeTokenData> {
  logger.info("🔄 [COZE] 用授权码换取 token...");
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: config.COZE_CLIENT_ID,
    client_secret: config.COZE_CLIENT_SECRET,
    redirect_uri: config.COZE_REDIRECT_URL,
  });

  const response = await axios.post(
    "https://api.coze.cn/api/permission/oauth2/token",
    params.toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
  );

  const { access_token, refresh_token, expires_in } = response.data;
  const tokenData: CozeTokenData = {
    access_token,
    refresh_token,
    expires_at: Date.now() + expires_in * 1000 - SAFETY_MARGIN_MS,
  };

  cachedToken = tokenData;
  await saveTokenToRedis(tokenData);
  logger.info(`✅ [COZE] 授权成功，access_token 有效期 ${expires_in} 秒`);
  return tokenData;
}

// ==================== Token 管理 ====================

/**
 * 用 refresh_token 刷新 access_token
 */
async function refreshAccessToken(refreshToken: string): Promise<CozeTokenData> {
  logger.info("🔄 [COZE] 刷新 access_token...");
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: config.COZE_CLIENT_ID,
    client_secret: config.COZE_CLIENT_SECRET,
  });

  const response = await axios.post(
    "https://api.coze.cn/api/permission/oauth2/token",
    params.toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
  );

  const { access_token, refresh_token, expires_in } = response.data;
  const tokenData: CozeTokenData = {
    access_token,
    refresh_token,
    expires_at: Date.now() + expires_in * 1000 - SAFETY_MARGIN_MS,
  };

  cachedToken = tokenData;
  await saveTokenToRedis(tokenData);
  logger.info(`✅ [COZE] access_token 刷新成功，有效期 ${expires_in} 秒`);
  return tokenData;
}

/**
 * 获取有效的 access_token（自动刷新）
 * 优先级：内存缓存 → Redis → 刷新 → 抛错要求重新授权
 */
export async function getValidAccessToken(): Promise<string> {
  const now = Date.now();

  // 1. 内存缓存有效
  if (cachedToken && cachedToken.expires_at > now) {
    return cachedToken.access_token;
  }

  // 2. 并发锁：正在刷新中，等待结果
  if (refreshingPromise) {
    const token = await refreshingPromise;
    return token.access_token;
  }

  // 3. 内存无缓存，从 Redis 加载
  if (!cachedToken) {
    cachedToken = await loadTokenFromRedis();
  }

  // 4. Redis 也没有 token，需要重新授权
  if (!cachedToken) {
    throw new Error("未授权：请先访问 /coze/authorize 完成 OAuth 授权");
  }

  // 5. access_token 过期，用 refresh_token 刷新
  if (cachedToken.expires_at <= now) {
    refreshingPromise = (async () => {
      try {
        return await refreshAccessToken(cachedToken!.refresh_token);
      } finally {
        refreshingPromise = null;
      }
    })();
    const token = await refreshingPromise;
    return token.access_token;
  }

  return cachedToken.access_token;
}

// ==================== 工作流调用 ====================

/**
 * 触发 Coze 工作流
 */
export async function runWorkflow(
  workflowId: string = config.COZE_WORKFLOW_ID,
  parameters: Record<string, unknown> = {},
): Promise<CozeWorkflowResponse> {
  const accessToken = await getValidAccessToken();

  logger.info(`🚀 [COZE] 触发工作流: ${workflowId}`);
  const response = await axios.post<CozeWorkflowResponse>(
    "https://api.coze.cn/v1/workflow/run",
    { workflow_id: workflowId, parameters },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      timeout: 60000,
    },
  );

  logger.info(`✅ [COZE] 工作流执行完成: code=${response.data.code}`);
  return response.data;
}
