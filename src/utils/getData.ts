import type { Get, Post } from "../types.js";
import { config } from "../config.js";
import { getCache, setCache, delCache } from "./cache.js";
import logger from "./logger.js";
import axios, { type AxiosProxyConfig } from "axios";
import { HttpProxyAgent } from "http-proxy-agent";
import { HttpsProxyAgent } from "https-proxy-agent";
import { getKdlProxy, markProxyInvalid } from "./kuaidaili.js";

// 需要走代理的国外站点域名（其余国内站点禁用代理）
const PROXY_DOMAINS = [
  "github.com",
  "hellogithub.com",
  "abroad.hellogithub.com",
  "news.ycombinator.com",
  "www.producthunt.com",
  "www.nytimes.com",
  "rss.nytimes.com",
  "cn.nytimes.com",
];

/**
 * 判断 URL 是否需要走代理
 * 国外站点使用系统代理，国内站点禁用代理
 */
const needsProxy = (url: string): boolean => {
  try {
    const hostname = new URL(url).hostname;
    return PROXY_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`));
  } catch {
    return false;
  }
};

/**
 * 从环境变量解析代理配置
 * 支持 http_proxy / https_proxy / HTTP_PROXY / HTTPS_PROXY
 */
const getEnvProxy = (protocol: string): AxiosProxyConfig | false => {
  const envKey = protocol === "https:" ? "https_proxy" : "http_proxy";
  const proxyUrl = process.env[envKey] || process.env[envKey.toUpperCase()];
  if (!proxyUrl) return false;
  try {
    const parsed = new URL(proxyUrl);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port) || (parsed.protocol === "https:" ? 443 : 80),
      ...(parsed.username && { auth: { username: parsed.username, password: parsed.password } }),
      protocol: parsed.protocol.replace(":", ""),
    };
  } catch {
    return false;
  }
};

// 基础配置（默认禁用代理）
const request = axios.create({
  timeout: config.REQUEST_TIMEOUT,
  withCredentials: true,
  proxy: false,
});

// 请求拦截
request.interceptors.request.use(
  async (req) => {
    if (!req.params) req.params = {};
    if (req.url && needsProxy(req.url)) {
      // 国外站点：从环境变量读取代理配置
      const protocol = new URL(req.url).protocol;
      const proxyConfig = getEnvProxy(protocol);
      if (proxyConfig) {
        req.proxy = proxyConfig;
        logger.info(`🌐 [PROXY] ${req.url} → ${proxyConfig.host}:${proxyConfig.port}`);
      }
    } else if (req.url && config.KDL_ENABLE) {
      // 国内站点：使用快代理（通过 agent 实现 HTTPS 隧道）
      const kdlProxy = await getKdlProxy();
      if (kdlProxy) {
        const proxyUrl = `http://${config.KDL_USERNAME}:${config.KDL_PASSWORD}@${kdlProxy.ip}:${kdlProxy.port}`;
        req.httpAgent = new HttpProxyAgent(proxyUrl);
        req.httpsAgent = new HttpsProxyAgent(proxyUrl);
        logger.info(`🔄 [KDL] ${req.url} → ${kdlProxy.ip}:${kdlProxy.port}`);
      }
    }
    return req;
  },
  (error) => {
    logger.error("❌ [ERROR] request failed");
    return Promise.reject(error);
  },
);

// 响应拦截
request.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 快代理请求失败时标记代理无效
    const reqUrl = error.config?.url;
    if (reqUrl && config.KDL_ENABLE && !needsProxy(reqUrl) && error.config?.httpsAgent) {
      logger.warn(`⚠️ [KDL] 请求失败，已标记代理无效`);
      markProxyInvalid();
    }
    return Promise.reject(error);
  },
);

// GET
export const get = async (options: Get) => {
  const {
    url,
    headers,
    params,
    noCache,
    ttl = config.CACHE_TTL,
    originaInfo = false,
    responseType = "json",
  } = options;
  logger.info(`🌐 [GET] ${url}`);
  try {
    // 检查缓存
    if (noCache) await delCache(url);
    else {
      const cachedData = await getCache(url);
      if (cachedData) {
        logger.info("💾 [CHCHE] The request is cached");
        return {
          fromCache: true,
          updateTime: cachedData.updateTime,
          data: cachedData.data,
        };
      }
    }
    // 缓存不存在时请求接口
    const response = await request.get(url, { headers, params, responseType });
    const responseData = response?.data || response;
    // 存储新获取的数据到缓存
    const updateTime = new Date().toISOString();
    const data = originaInfo ? response : responseData;
    await setCache(url, { data, updateTime }, ttl);
    // 返回数据
    logger.info(`✅ [${response?.status}] request was successful`);
    return { fromCache: false, updateTime, data };
  } catch (error) {
    logger.error("❌ [ERROR] request failed");
    throw error;
  }
};

// POST
export const post = async (options: Post) => {
  const { url, headers, body, noCache, ttl = config.CACHE_TTL, originaInfo = false } = options;
  logger.info(`🌐 [POST] ${url}`);
  try {
    // 检查缓存
    if (noCache) await delCache(url);
    else {
      const cachedData = await getCache(url);
      if (cachedData) {
        logger.info("💾 [CHCHE] The request is cached");
        return { fromCache: true, updateTime: cachedData.updateTime, data: cachedData.data };
      }
    }
    // 缓存不存在时请求接口
    const response = await request.post(url, body, { headers });
    const responseData = response?.data || response;
    // 存储新获取的数据到缓存
    const updateTime = new Date().toISOString();
    const data = originaInfo ? response : responseData;
    if (!noCache) {
      await setCache(url, { data, updateTime }, ttl);
    }
    // 返回数据
    logger.info(`✅ [${response?.status}] request was successful`);
    return { fromCache: false, updateTime, data };
  } catch (error) {
    logger.error("❌ [ERROR] request failed");
    throw error;
  }
};
