// 飞书多维表格 API 客户端
// tenant_access_token 获取/缓存 + 批量写入记录

import axios from "axios";
import { config } from "../config.js";
import logger from "./logger.js";

// ==================== 常量 ====================

const FEISHU_API_BASE = "https://open.feishu.cn/open-apis";
// 提前 10 分钟视为过期（token 有效期 2 小时）
const SAFETY_MARGIN_MS = 10 * 60 * 1000;
// 飞书 batch_create 单次最多 500 条
const BATCH_SIZE = 500;

// ==================== Token 管理 ====================

let cachedToken: { access_token: string; expires_at: number } | null = null;
let fetchingPromise: Promise<string> | null = null;

/**
 * 获取 tenant_access_token
 */
async function fetchAccessToken(): Promise<{ access_token: string; expire: number }> {
  logger.info("🔄 [FEISHU] 获取 tenant_access_token...");

  const response = await axios.post(
    `${FEISHU_API_BASE}/auth/v3/tenant_access_token/internal`,
    {
      app_id: config.FEISHU_APP_ID,
      app_secret: config.FEISHU_APP_SECRET,
    },
    {
      headers: { "Content-Type": "application/json" },
      proxy: false,
      timeout: 10000,
    },
  ).catch((err) => {
    if (axios.isAxiosError(err)) {
      logger.error(`❌ [FEISHU] token 请求失败: status=${err.response?.status}, data=${JSON.stringify(err.response?.data)}, url=${err.config?.url}`);
    }
    throw err;
  });

  if (response.data.code !== 0) {
    throw new Error(`飞书 token 获取失败(${response.data.code}): ${response.data.msg}`);
  }

  const { tenant_access_token, expire } = response.data;
  logger.info(`✅ [FEISHU] tenant_access_token 获取成功，有效期 ${expire} 秒`);
  return { access_token: tenant_access_token, expire };
}

/**
 * 获取有效的 tenant_access_token（自动续期）
 * 内存缓存 + 并发锁
 */
export async function getFeishuAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expires_at > Date.now()) {
    return cachedToken.access_token;
  }

  if (fetchingPromise) return fetchingPromise;

  fetchingPromise = (async () => {
    try {
      const { access_token, expire } = await fetchAccessToken();
      cachedToken = {
        access_token,
        expires_at: Date.now() + expire * 1000 - SAFETY_MARGIN_MS,
      };
      return access_token;
    } finally {
      fetchingPromise = null;
    }
  })();

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
  if (!records || records.length === 0) {
    logger.warn("⚠️ [FEISHU] 无记录需要写入");
    return 0;
  }

  if (!config.FEISHU_APP_ID || !config.FEISHU_BITABLE_APP_TOKEN) {
    logger.warn("⚠️ [FEISHU] 飞书配置不完整，跳过写入");
    return 0;
  }

  const token = await getFeishuAccessToken();
  const { FEISHU_BITABLE_APP_TOKEN: appToken, FEISHU_BITABLE_TABLE_ID: tableId } = config;

  let totalWritten = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);

    logger.info(`📝 [FEISHU] 批量写入 ${batch.length} 条记录 (${i + 1}-${i + batch.length}/${records.length})`);

    const response = await axios.post(
      `${FEISHU_API_BASE}/bitable/v1/apps/${appToken}/tables/${tableId}/records/batch_create`,
      { records: batch },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        proxy: false,
        timeout: 30000,
      },
    );

    if (response.data.code !== 0) {
      logger.error(`❌ [FEISHU] 批量写入失败(${response.data.code}): ${response.data.msg}`);
      throw new Error(`飞书写入失败(${response.data.code}): ${response.data.msg}`);
    }

    const written = response.data.data?.records?.length ?? 0;
    totalWritten += written;
    logger.info(`✅ [FEISHU] 批次写入成功: ${written} 条`);
  }

  logger.info(`✅ [FEISHU] 全部写入完成: 共 ${totalWritten} 条`);
  return totalWritten;
}
