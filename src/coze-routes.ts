// Coze OAuth 回调 + 工作流触发路由
// 挂载到 /coze 路径下

import { Hono } from "hono";
import { config } from "./config.js";
import logger from "./utils/logger.js";
import { getAuthorizeUrl, exchangeCodeForToken, runWorkflow } from "./utils/coze.js";

const cozeApp = new Hono();

/**
 * GET /coze/authorize
 * 重定向到 Coze OAuth 授权页面
 */
cozeApp.get("/authorize", (c) => {
  const state = crypto.randomUUID();
  const authorizeUrl = getAuthorizeUrl(state);
  logger.info(`🔗 [COZE] 重定向到授权页面, state=${state}`);
  return c.redirect(authorizeUrl);
});

/**
 * GET /coze/callback
 * Coze OAuth 回调，用授权码换取 token
 */
cozeApp.get("/callback", async (c) => {
  const code = c.req.query("code");
  if (!code) {
    return c.json({ code: 400, message: "缺少授权码 code" }, 400);
  }

  const tokenData = await exchangeCodeForToken(code);
  logger.info("✅ [COZE] OAuth 授权完成，token 已保存");
  return c.json({
    code: 200,
    message: "OAuth 授权成功，token 已保存",
    expires_at: new Date(tokenData.expires_at).toISOString(),
  });
});

/**
 * POST /coze/workflow/run
 * 手动触发 Coze 工作流（需要 API Key 鉴权）
 */
cozeApp.post("/workflow/run", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const workflowId = (body as Record<string, string>).workflow_id || config.COZE_WORKFLOW_ID;
  const parameters = (body as Record<string, unknown>).parameters || {};

  const result = await runWorkflow(workflowId, parameters as Record<string, unknown>);
  return c.json({ code: 200, data: result });
});

export default cozeApp;
