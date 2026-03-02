# 通用查询参数

> 版本: v1.1 | 更新时间: 2026-03-02

所有平台接口都支持以下查询参数，可自由组合。鉴权方式见 [使用指南](./README.md)。

---

## 参数列表

### `cache` — 缓存控制

| 值 | 说明 |
|----|------|
| 不传（默认） | 优先返回缓存数据（TTL 默认 3600 秒） |
| `false` | 跳过缓存，获取最新数据 |

```bash
GET /weibo?cache=false
```

### `limit` — 限制返回条数

返回前 N 条数据。不传则返回全部。

```bash
GET /bilibili?limit=10
```

### `rss` — RSS 格式输出

| 值 | 说明 |
|----|------|
| 不传（默认） | 返回 JSON |
| `true` | 返回 RSS XML（Content-Type: application/xml） |

```bash
GET /weibo?rss=true
```

RSS 输出支持标准 RSS 阅读器订阅，包含 Media RSS 扩展（缩略图等）。

### `type` — 平台分类筛选

不同平台支持不同的 type 值，详见 [平台接口列表](./endpoints.md)。

```bash
GET /bilibili?type=3
GET /github?type=weekly
GET /baidu?type=novel
```

## 组合使用

参数可任意组合：

```bash
# B站游戏区 Top 5，不使用缓存
GET /bilibili?type=4&limit=5&cache=false

# GitHub 月趋势的 RSS 订阅
GET /github?type=monthly&rss=true
```
