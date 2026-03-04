// Coze 工作流触发路由
// 挂载到 /coze 路径下

import { Hono } from "hono";
import { config } from "./config.js";
import { runWorkflow } from "./utils/coze.js";

const cozeApp = new Hono();

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

export default cozeApp;
