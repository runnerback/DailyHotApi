import axios from "axios";
import { config } from "../config.js";
import logger from "./logger.js";

// 缓存的代理信息
interface CachedProxy {
  ip: string;
  port: number;
  expireTime: number; // 到期绝对时间戳(ms)
}

// 快代理 API 响应
interface KdlApiResponse {
  code: number;
  msg: string;
  data: {
    count: number;
    proxy_list: string[];
    order_left_count: number;
  };
}

// 安全余量：提前 5 分钟视为过期，避免边界问题
const SAFETY_MARGIN_MS = 5 * 60 * 1000;

// 内存缓存
let cachedProxy: CachedProxy | null = null;

// 并发锁：避免多个请求同时触发 API 调用
let fetchingPromise: Promise<CachedProxy | null> | null = null;

/**
 * 从快代理 API 获取新 IP
 */
async function fetchProxyFromApi(): Promise<CachedProxy> {
  const response = await axios.get<KdlApiResponse>("https://dps.kdlapi.com/api/getdps", {
    params: {
      secret_id: config.KDL_SECRET_ID,
      signature: config.KDL_SIGNATURE,
      num: 1,
      pt: 1,
      format: "json",
      f_et: 1,
      sep: 1,
    },
    timeout: 10000,
    proxy: false,
  });

  if (response.data.code !== 0) {
    throw new Error(`快代理API错误(${response.data.code}): ${response.data.msg}`);
  }

  const proxyList = response.data.data?.proxy_list;
  if (!proxyList || proxyList.length === 0) {
    throw new Error("快代理API返回空列表");
  }

  logger.info(`🔑 [KDL] 剩余IP次数: ${response.data.data.order_left_count}`);

  // 解析格式: "ip:port,expire_seconds"
  const raw = proxyList[0];
  const match = raw.match(/^([\d.]+):(\d+),(\d+)$/);
  if (!match) {
    throw new Error(`无法解析快代理返回格式: ${raw}`);
  }

  const now = Date.now();
  const expireTs = parseInt(match[3]);

  const proxy: CachedProxy = {
    ip: match[1],
    port: parseInt(match[2]),
    expireTime: now + expireTs * 1000 - SAFETY_MARGIN_MS,
  };

  logger.info(`✅ [KDL] 获取新代理: ${proxy.ip}:${proxy.port} (有效期${expireTs}秒)`);
  return proxy;
}

/**
 * 获取有效的代理 IP（优先缓存）
 * 返回 null 表示获取失败，调用方应回退直连
 */
export async function getKdlProxy(): Promise<CachedProxy | null> {
  if (!config.KDL_ENABLE) return null;

  const now = Date.now();

  // 检查内存缓存是否有效
  if (cachedProxy && cachedProxy.expireTime > now) {
    const remainSec = Math.round((cachedProxy.expireTime - now) / 1000);
    logger.info(`🔄 [KDL] 使用缓存代理: ${cachedProxy.ip}:${cachedProxy.port} (剩余${remainSec}秒)`);
    return cachedProxy;
  }

  // 并发锁：正在获取中，等待结果
  if (fetchingPromise) return fetchingPromise;

  // 从 API 获取新 IP
  fetchingPromise = (async () => {
    try {
      logger.info("🔄 [KDL] 缓存中无有效代理，从API获取...");
      cachedProxy = await fetchProxyFromApi();
      return cachedProxy;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error(`❌ [KDL] 获取代理失败: ${msg}`);
      return null;
    } finally {
      fetchingPromise = null;
    }
  })();

  return fetchingPromise;
}

/**
 * 标记当前代理为无效（请求失败时调用）
 */
export function markProxyInvalid(): void {
  if (cachedProxy) {
    logger.warn(`⚠️ [KDL] 标记代理无效并移除: ${cachedProxy.ip}:${cachedProxy.port}`);
    cachedProxy = null;
  }
}
