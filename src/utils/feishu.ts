// 飞书多维表格 API 客户端
// tenant_access_token 获取/缓存 + 去重写入记录

import axios from "axios";
import { config } from "../config.js";
import logger from "./logger.js";

// ==================== 常量 ====================

const FEISHU_API_BASE = "https://open.feishu.cn/open-apis";
// 提前 10 分钟视为过期（token 有效期 2 小时）
const SAFETY_MARGIN_MS = 10 * 60 * 1000;
// 飞书批量操作单次最多 500 条
const BATCH_SIZE = 500;
// search API 单页最多 500 条
const SEARCH_PAGE_SIZE = 500;
// 去重时间窗口：只对比最近 7 天的数据
const DEDUP_WINDOW_DAYS = 7;

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

// ==================== 去重查询 ====================

/**
 * 获取指定平台已存在的 url.link → record_id 映射
 * 按 platform 过滤后分页拉取，本地提取 link
 */
async function getExistingLinks(
  token: string,
  platforms: string[],
): Promise<Map<string, string>> {
  const { FEISHU_BITABLE_APP_TOKEN: appToken, FEISHU_BITABLE_TABLE_ID: tableId } = config;
  const linkMap = new Map<string, string>(); // link → record_id

  // 飞书 DateTime 字段不支持 isGreater 等过滤，改为客户端过滤
  const oneWeekAgoMs = Date.now() - DEDUP_WINDOW_DAYS * 24 * 3600 * 1000;

  for (const platform of platforms) {
    let pageToken: string | undefined;

    try {
      do {
        const body: Record<string, unknown> = {
          field_names: ["url", "updateTime"],
          filter: {
            conjunction: "and",
            conditions: [
              { field_name: "platform", operator: "is", value: [platform] },
            ],
          },
          page_size: SEARCH_PAGE_SIZE,
        };
        if (pageToken) body.page_token = pageToken;

        const response = await axios.post(
          `${FEISHU_API_BASE}/bitable/v1/apps/${appToken}/tables/${tableId}/records/search`,
          body,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            proxy: false,
            timeout: 15000,
          },
        );

        if (response.data.code !== 0) {
          logger.error(`❌ [FEISHU] 查询已有记录失败(${response.data.code}): ${response.data.msg}`);
          break;
        }

        const items = response.data.data?.items ?? [];
        for (const item of items) {
          const link = item.fields?.url?.link;
          const updateTime = item.fields?.updateTime;
          // 客户端过滤：只保留最近 N 天内的记录
          if (link && item.record_id && typeof updateTime === "number" && updateTime >= oneWeekAgoMs) {
            linkMap.set(link, item.record_id);
          }
        }

        pageToken = response.data.data?.has_more ? response.data.data.page_token : undefined;
      } while (pageToken);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`❌ [FEISHU] 查询平台「${platform}」已有记录异常: ${msg}`);
      // 查询失败不阻塞，该平台视为无已有记录（全部新增）
    }

    const platformCount = [...linkMap.entries()].filter(([, rid]) => rid).length;
    logger.info(`🔍 [FEISHU] 平台「${platform}」近 ${DEDUP_WINDOW_DAYS} 天有 ${platformCount} 条记录（去重用）`);
  }

  return linkMap;
}

// ==================== 写入记录 ====================

/**
 * 去重写入记录到飞书多维表格
 * - 新记录 → batch_create
 * - 已存在（url.link 重复）→ batch_update updateTime 为当前时间
 * @returns { created: number, updated: number }
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

  // 1. 提取当前批次涉及的平台
  const platforms = [...new Set(
    records.map((r) => String(r.fields.platform || "")).filter(Boolean),
  )];

  // 2. 查询这些平台已有的 link → record_id
  const existingLinks = await getExistingLinks(token, platforms);

  // 3. 分类：新记录 vs 重复记录
  const newRecords: Array<{ fields: Record<string, unknown> }> = [];
  const duplicateUpdates: Array<{ record_id: string; fields: Record<string, unknown> }> = [];
  const now = Date.now();

  for (const record of records) {
    const urlField = record.fields.url as { link?: string } | undefined;
    const link = urlField?.link;

    if (link && existingLinks.has(link)) {
      // 重复：更新既有记录的 updateTime
      duplicateUpdates.push({
        record_id: existingLinks.get(link)!,
        fields: { updateTime: now },
      });
    } else {
      newRecords.push(record);
    }
  }

  logger.info(`🔍 [FEISHU] 去重结果: ${newRecords.length} 条新增, ${duplicateUpdates.length} 条重复（更新 updateTime）`);

  let totalCreated = 0;
  let totalUpdated = 0;

  // 4. 批量写入新记录
  for (let i = 0; i < newRecords.length; i += BATCH_SIZE) {
    const batch = newRecords.slice(i, i + BATCH_SIZE);
    logger.info(`📝 [FEISHU] 批量写入 ${batch.length} 条新记录 (${i + 1}-${i + batch.length}/${newRecords.length})`);

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
    totalCreated += written;
    logger.info(`✅ [FEISHU] 批次写入成功: ${written} 条`);
  }

  // 5. 批量更新重复记录的 updateTime
  for (let i = 0; i < duplicateUpdates.length; i += BATCH_SIZE) {
    const batch = duplicateUpdates.slice(i, i + BATCH_SIZE);
    logger.info(`🔄 [FEISHU] 批量更新 ${batch.length} 条重复记录 updateTime`);

    const response = await axios.post(
      `${FEISHU_API_BASE}/bitable/v1/apps/${appToken}/tables/${tableId}/records/batch_update`,
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
      logger.error(`❌ [FEISHU] 批量更新失败(${response.data.code}): ${response.data.msg}`);
    } else {
      const updated = response.data.data?.records?.length ?? 0;
      totalUpdated += updated;
      logger.info(`✅ [FEISHU] 批次更新成功: ${updated} 条`);
    }
  }

  logger.info(`✅ [FEISHU] 完成: 新增 ${totalCreated} 条, 更新 ${totalUpdated} 条`);
  return totalCreated;
}
