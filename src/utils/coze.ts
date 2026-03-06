// Coze JWT 鉴权 + 工作流 API 调用
// 服务类应用：私钥签名 JWT → 换取 access_token → 调用工作流
// 免用户授权，服务端自主完成

import fs from "fs";
import path from "path";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import axios from "axios";
import { config } from "../config.js";
import logger from "./logger.js";

// ==================== 类型 ====================

interface CozeWorkflowResponse {
  code: number;
  msg: string;
  data: string;
}

// ==================== 常量 ====================

// Coze 实际 token 有效期约 1 小时（不论请求多长），强制 50 分钟内刷新
const TOKEN_MAX_CACHE_MS = 50 * 60 * 1000;
// 提前 5 分钟视为过期
const SAFETY_MARGIN_MS = 5 * 60 * 1000;
// access_token 请求的有效期（秒）
const TOKEN_DURATION_SECONDS = 86400;

// ==================== 私钥加载 ====================

const privateKeyPath = path.join(process.cwd(), "src/coze-JWT-auth-private-key/private_key.pem");
const privateKey = fs.readFileSync(privateKeyPath, "utf-8");
logger.info(`🔑 [COZE] 私钥已加载: ${privateKeyPath}`);

// ==================== JWT 签名 ====================

/**
 * 生成 RS256 签名的 JWT
 */
function generateJWT(): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: config.COZE_CLIENT_ID,
    aud: "api.coze.cn",
    iat: now,
    exp: now + 3600,
    jti: `${now}:${crypto.randomBytes(16).toString("hex")}`,
  };
  return jwt.sign(payload, privateKey, {
    algorithm: "RS256",
    header: { alg: "RS256", typ: "JWT", kid: config.COZE_PUBLIC_KEY_ID },
  });
}

// ==================== Token 管理 ====================

let cachedToken: { access_token: string; expires_at: number } | null = null;
let fetchingPromise: Promise<string> | null = null;

/**
 * 用 JWT 换取 access_token
 */
async function fetchAccessToken(): Promise<{ access_token: string; expires_in: number }> {
  const jwtToken = generateJWT();
  logger.info("🔄 [COZE] 用 JWT 换取 access_token...");

  const response = await axios.post(
    "https://api.coze.cn/api/permission/oauth2/token",
    {
      duration_seconds: TOKEN_DURATION_SECONDS,
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    },
    {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        "Content-Type": "application/json",
      },
      // api.coze.cn 是国内 API，禁用代理避免重定向循环
      proxy: false,
    },
  ).catch((err) => {
    logger.error(`❌ [COZE] access_token 获取失败: status=${err.response?.status}, data=${JSON.stringify(err.response?.data)}, message=${err.message}`);
    throw err;
  });

  const { access_token, expires_in } = response.data;
  logger.info(`✅ [COZE] access_token 获取成功，有效期 ${expires_in} 秒`);
  return { access_token, expires_in };
}

/**
 * 获取有效的 access_token（自动续期）
 * 内存缓存 + 并发锁，过期直接重新签发 JWT
 */
export async function getValidAccessToken(): Promise<string> {
  // 1. 内存缓存有效
  if (cachedToken && cachedToken.expires_at > Date.now()) {
    return cachedToken.access_token;
  }

  // 2. 并发锁：正在获取中，等待结果
  if (fetchingPromise) {
    return fetchingPromise;
  }

  // 3. 签发 JWT 获取新 token
  fetchingPromise = (async () => {
    try {
      const { access_token, expires_in } = await fetchAccessToken();
      const serverExpiresMs = expires_in * 1000 - SAFETY_MARGIN_MS;
      cachedToken = {
        access_token,
        expires_at: Date.now() + Math.min(serverExpiresMs, TOKEN_MAX_CACHE_MS),
      };
      logger.info(`🔑 [COZE] token 缓存 ${Math.min(serverExpiresMs, TOKEN_MAX_CACHE_MS) / 60000} 分钟（服务端返回 ${expires_in}s）`);
      return access_token;
    } finally {
      fetchingPromise = null;
    }
  })();

  return fetchingPromise;
}

// ==================== 状态查询 ====================

/**
 * 返回 Coze JWT 鉴权状态（同步）
 */
export function getCozeStatus(): { configured: boolean; hasToken: boolean; tokenExpiresAt: number | null } {
  return {
    configured: !!(config.COZE_CLIENT_ID && config.COZE_PUBLIC_KEY_ID),
    hasToken: !!(cachedToken && cachedToken.expires_at > Date.now()),
    tokenExpiresAt: cachedToken?.expires_at ?? null,
  };
}

// ==================== 工作流调用 ====================

/**
 * 触发 Coze 工作流
 */
export async function runWorkflow(
  workflowId: string = config.COZE_WORKFLOW_ID,
  parameters: Record<string, unknown> = {},
  timeoutMs: number = 15 * 60 * 1000,
): Promise<CozeWorkflowResponse> {
  const callAPI = async (token: string) => {
    return axios.post<CozeWorkflowResponse>(
      "https://api.coze.cn/v1/workflow/run",
      { workflow_id: workflowId, parameters },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: timeoutMs,
        proxy: false,
      },
    );
  };

  let accessToken = await getValidAccessToken();
  logger.info(`🚀 [COZE] 触发工作流: ${workflowId}`);

  try {
    const response = await callAPI(accessToken);
    logger.info(`✅ [COZE] 工作流执行完成: code=${response.data.code}`);
    return response.data;
  } catch (err) {
    // 401 表示 token 已失效（Coze 可能比预期更早过期），清除缓存重试一次
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      logger.warn("⚠️ [COZE] 工作流调用 401，清除 token 缓存并重试...");
      cachedToken = null;
      accessToken = await getValidAccessToken();
      const response = await callAPI(accessToken);
      logger.info(`✅ [COZE] 工作流重试成功: code=${response.data.code}`);
      return response.data;
    }
    throw err;
  }
}
