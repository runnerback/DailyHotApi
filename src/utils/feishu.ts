// 飞书多维表格 API 客户端
// tenant_access_token 获取/缓存 + 批量写入记录

import axios from "axios";
import { config } from "../config.js";
import logger from "./logger.js";

// ==================== 常量 ====================

const FEISHU_API_BASE = "https://open.feishu.cn/open-apis";
const SAFETY_MARGIN_MS = 10 * 60 * 1000;  // token 提前 10 分钟刷新
const BATCH_SIZE = 500;                    // 飞书批量操作上限

// ==================== Token 管理 ====================

let cachedToken: { access_token: string; expires_at: number } | null = null;
let fetchingPromise: Promise<string> | null = null;

async function fetchAccessToken(): Promise<string> {
  logger.info("🔄 [FEISHU] 获取 tenant_access_token...");

  const response = await axios.post(
    `${FEISHU_API_BASE}/auth/v3/tenant_access_token/internal`,
    { app_id: config.FEISHU_APP_ID, app_secret: config.FEISHU_APP_SECRET },
    { headers: { "Content-Type": "application/json" }, proxy: false, timeout: 10000 },
  ).catch((err) => {
    const detail = axios.isAxiosError(err)
      ? `status=${err.response?.status}, body=${JSON.stringify(err.response?.data)}`
      : err.message;
    logger.error(`❌ [FEISHU] token 请求失败: ${detail}`);
    throw err;
  });

  if (response.data.code !== 0) {
    throw new Error(`飞书 token 错误(${response.data.code}): ${response.data.msg}`);
  }

  const { tenant_access_token, expire } = response.data;
  cachedToken = {
    access_token: tenant_access_token,
    expires_at: Date.now() + expire * 1000 - SAFETY_MARGIN_MS,
  };
  logger.info(`✅ [FEISHU] token 获取成功，有效期 ${expire}s`);
  return tenant_access_token;
}

/**
 * 获取有效的 tenant_access_token（内存缓存 + 并发锁）
 */
export async function getFeishuAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expires_at > Date.now()) {
    return cachedToken.access_token;
  }
  if (fetchingPromise) return fetchingPromise;

  fetchingPromise = fetchAccessToken().finally(() => { fetchingPromise = null; });
  return fetchingPromise;
}

// ==================== 写入记录 ====================

/**
 * 批量写入记录到飞书多维表格
 * @param records - Coze to-feishu-records.js 输出的 [{fields: {...}}, ...] 格式
 * @returns 成功写入的记录数
 */
export async function batchCreateRecords(
  records: Array<{ fields: Record<string, unknown> }>,
): Promise<number> {
  if (!records?.length) {
    logger.warn("⚠️ [FEISHU] 无记录需要写入");
    return 0;
  }
  if (!config.FEISHU_APP_ID || !config.FEISHU_BITABLE_APP_TOKEN) {
    logger.warn("⚠️ [FEISHU] 飞书配置不完整，跳过写入");
    return 0;
  }

  const token = await getFeishuAccessToken();
  const baseUrl = `${FEISHU_API_BASE}/bitable/v1/apps/${config.FEISHU_BITABLE_APP_TOKEN}/tables/${config.FEISHU_BITABLE_TABLE_ID}`;
  const reqConfig = {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    proxy: false as const,
    timeout: 30000,
  };

  let totalWritten = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    logger.info(`📝 [FEISHU] 写入 ${batch.length} 条 (${i + 1}-${i + batch.length}/${records.length})`);

    const { data } = await axios.post(`${baseUrl}/records/batch_create`, { records: batch }, reqConfig);

    if (data.code !== 0) {
      logger.error(`❌ [FEISHU] 写入失败(${data.code}): ${data.msg}`);
      throw new Error(`飞书写入失败(${data.code}): ${data.msg}`);
    }

    const written = data.data?.records?.length ?? 0;
    totalWritten += written;
    logger.info(`✅ [FEISHU] 写入成功: ${written} 条`);
  }

  logger.info(`✅ [FEISHU] 全部完成: 共 ${totalWritten} 条`);
  return totalWritten;
}
