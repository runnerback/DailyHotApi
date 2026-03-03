# DailyHotApi 使用指南

> 版本: v1.1 | 更新时间: 2026-03-03

聚合热榜 API 服务，从 56 个平台抓取热门/热搜数据，提供统一 JSON 和 RSS 输出。

## 目录

- [通用参数](./query-params.md) — 所有接口共用的查询参数
- [响应格式](./response-format.md) — JSON / RSS 响应结构说明
- [平台接口列表](./endpoints.md) — 全部 56 个平台总览及专属参数
- [使用示例](./examples.md) — cURL / JavaScript / Python 调用示例

---

## 快速开始

### 1. 启动服务

```bash
pnpm install
pnpm run dev        # 开发模式，端口 15000
```

### 2. 鉴权

生产环境启用了 API Key 鉴权，请求须携带 `X-API-Key` Header：

```bash
curl -H "X-API-Key: your-secret-key-here" http://localhost:15000/weibo
```

- 未携带或 Key 错误 → `401 Unauthorized`
- 本地开发 → `.env` 中设置 `API_KEY_ENABLE=false` 关闭鉴权

### 3. 调用接口

```
GET http://localhost:15000/{平台名}
Header: X-API-Key: your-key
```

各平台路由和参数详见 [平台接口列表](./endpoints.md)，更多语言示例见 [使用示例](./examples.md)。
