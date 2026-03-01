# DailyHotApi 使用指南

聚合热榜 API 服务，从 60+ 平台抓取热门/热搜数据，提供统一 JSON 和 RSS 输出。

## 目录

- [快速开始](#快速开始)
- [通用参数](./query-params.md) — 所有接口共用的查询参数
- [响应格式](./response-format.md) — JSON / RSS 响应结构说明
- [平台接口列表](./endpoints.md) — 全部 56 个平台及其专属参数
- [使用示例](./examples.md) — 各语言调用示例

---

## 快速开始

### 1. 启动服务

```bash
# 安装依赖
pnpm install

# 开发模式（端口 15000）
pnpm run dev
```

### 2. 调用接口

所有接口格式统一：

```
GET http://localhost:15000/{平台名}
```

示例：

```bash
# 获取微博热搜
curl http://localhost:15000/weibo

# 获取哔哩哔哩全站排行
curl http://localhost:15000/bilibili

# 获取 GitHub 每日趋势
curl http://localhost:15000/github
```

### 3. 查看所有可用平台

```bash
curl http://localhost:15000/all
```

返回：
```json
{
  "code": 200,
  "count": 56,
  "routes": [
    { "name": "bilibili", "path": "/bilibili" },
    { "name": "weibo", "path": "/weibo" },
    ...
  ]
}
```

### 4. 常用查询参数

| 参数 | 说明 | 示例 |
|------|------|------|
| `cache` | 跳过缓存 | `?cache=false` |
| `limit` | 限制条数 | `?limit=10` |
| `rss` | RSS 格式输出 | `?rss=true` |
| `type` | 平台分类筛选 | `?type=1` |

详见 [通用参数文档](./query-params.md)。
