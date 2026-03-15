# DailyHot API

> 版本: v2.1 | 更新时间: 2026-03-15

聚合热门数据的 API 接口，支持 60+ 中外平台的热榜/热搜数据，提供统一 JSON 和 RSS 输出。

- **线上地址**: https://dailyhot.runfast.xyz
- **平台列表**: https://dailyhot.runfast.xyz/endpoints

## 特性

- 60+ 平台热榜聚合，统一数据格式
- 支持 JSON 和 RSS 两种输出
- Redis + NodeCache 双层缓存
- API Key 鉴权（生产环境）
- Coze 工作流集成 + 定时调度
- 飞书多维表格自动写入（Server 端直连飞书 API）
- Docker / PM2 部署

## 快速开始

```bash
pnpm install
pnpm run dev        # 开发模式，http://localhost:15000
```

## 部署

详见 [部署文档](docs/deployment/readme.md)。

```bash
# 本地构建 + 上传（禁止在 ECS 上执行 tsc）
pnpm run build
rsync -avz --delete dist/ root@115.190.207.149:/var/www/dailyhot-api/dist/
ssh root@115.190.207.149 "pm2 restart daily-hot"
```

## 架构

```
                    ┌─────────────────────────────────────────────┐
                    │            DailyHotApi Server               │
                    │                                             │
  HTTP Request ────→│  Hono 中间件 (compress/CORS/auth)           │
                    │       ↓                                     │
                    │  registry.ts → routes/{platform}.ts         │
                    │       ↓                                     │
                    │  getData.ts (Axios + 缓存 + 代理路由)       │
                    │       ↓                                     │
                    │  统一 JSON / RSS 响应                       │
                    └─────────────────────────────────────────────┘

                    ┌─────────────────────────────────────────────┐
                    │          Coze + 飞书集成                    │
                    │                                             │
  定时调度 ────────→│  coze-scheduler.ts (Redis 任务存储)         │
                    │       ↓                                     │
                    │  coze.ts (JWT 鉴权 → 触发 Coze 工作流)     │
                    │       ↓                                     │
                    │  Coze 工作流返回处理后的热榜数据             │
                    │       ↓                                     │
                    │  feishu.ts (tenant_access_token 鉴权)       │
                    │       ↓                                     │
                    │  飞书多维表格 batch_create API 写入          │
                    └─────────────────────────────────────────────┘
```

### 核心模块

| 模块 | 文件 | 职责 |
|------|------|------|
| 入口 | `src/index.ts` | 启动 Hono 服务 + Coze 调度器 |
| 应用 | `src/app.tsx` | 中间件链 + 路由挂载 + 错误处理 |
| 路由注册 | `src/registry.ts` | 扫描 `routes/` 目录，文件名即路径 |
| HTTP 客户端 | `src/utils/getData.ts` | Axios + 代理路由 + 缓存集成 |
| 双层缓存 | `src/utils/cache.ts` | Redis(主) + NodeCache(降级) |
| 鉴权 | `src/utils/auth.ts` | X-API-Key 中间件 |
| Coze 集成 | `src/utils/coze.ts` | JWT 签名 + 工作流 API 调用 |
| 定时调度 | `src/utils/coze-scheduler.ts` | Redis 持久化任务 + 定时执行 |
| 飞书写入 | `src/utils/feishu.ts` | tenant_access_token + batch_create |

## 文档

| 文档 | 说明 |
|------|------|
| [CLAUDE.md](CLAUDE.md) | 项目架构、开发指南、环境变量 |
| [docs/deployment/readme.md](docs/deployment/readme.md) | ECS 部署、运维、常见问题 |
| [docs/api/endpoints.md](docs/api/endpoints.md) | 60+ 平台接口详细说明 |
| [docs/api/query-params.md](docs/api/query-params.md) | 通用查询参数 |
| [docs/coze/feishu-bitable-api-reference.md](docs/coze/feishu-bitable-api-reference.md) | 飞书多维表格 API 参考 |
