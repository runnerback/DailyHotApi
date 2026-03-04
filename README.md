# DailyHot API

> 版本: v2.0 | 更新时间: 2026-03-04

聚合热门数据的 API 接口，支持 56 个中外平台的热榜/热搜数据，提供统一 JSON 和 RSS 输出。

- **线上地址**: https://dailyhot.runfast.xyz
- **平台列表**: https://dailyhot.runfast.xyz/endpoints

## 特性

- 56 个平台热榜聚合，统一数据格式
- 支持 JSON 和 RSS 两种输出
- Redis + NodeCache 双层缓存
- API Key 鉴权（生产环境）
- Coze JWT 工作流集成
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

## 文档

| 文档 | 说明 |
|------|------|
| [CLAUDE.md](CLAUDE.md) | 项目架构、开发指南、环境变量 |
| [docs/deployment/readme.md](docs/deployment/readme.md) | ECS 部署、运维、常见问题 |
| [docs/api/endpoints.md](docs/api/endpoints.md) | 56 个平台接口详细说明 |
| [docs/api/query-params.md](docs/api/query-params.md) | 通用查询参数 |
