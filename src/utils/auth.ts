import type { MiddlewareHandler } from "hono";
import { config } from "../config.js";
import logger from "./logger.js";

// 免鉴权路径
const PUBLIC_PATHS = ["/", "/robots.txt", "/favicon.ico", "/favicon.png"];

// API Key 鉴权中间件
const apiKeyAuth: MiddlewareHandler = async (c, next) => {
  // 未启用鉴权，直接放行
  if (!config.API_KEY_ENABLE) return await next();

  // 公开路径放行
  const path = c.req.path;
  if (PUBLIC_PATHS.includes(path)) return await next();

  // 校验 X-API-Key
  const apiKey = c.req.header("X-API-Key");
  if (apiKey === config.API_KEY) return await next();

  logger.warn(`🔒 [AUTH] 鉴权失败: ${c.req.method} ${path}`);
  return c.json({ code: 401, message: "Unauthorized" }, 401);
};

export default apiKeyAuth;
