# 通用查询参数

所有平台接口都支持以下查询参数，可自由组合。

> 生产环境需携带 `X-API-Key` Header 鉴权，详见 [使用指南](./README.md)。

## 鉴权

| Header | 说明 |
|--------|------|
| `X-API-Key` | API 密钥，生产环境必传，本地开发可通过 `API_KEY_ENABLE=false` 关闭 |

```bash
curl -H "X-API-Key: your-key" http://localhost:15000/weibo
```

## 参数列表

### `cache` — 缓存控制

| 值 | 说明 |
|----|------|
| 不传（默认） | 优先返回缓存数据（TTL 默认 3600 秒） |
| `false` | 跳过缓存，获取最新数据 |

```bash
# 强制刷新数据
GET /weibo?cache=false
```

### `limit` — 限制返回条数

返回前 N 条数据。不传则返回全部。

```bash
# 只返回前 10 条
GET /bilibili?limit=10
```

### `rss` — RSS 格式输出

| 值 | 说明 |
|----|------|
| 不传（默认） | 返回 JSON |
| `true` | 返回 RSS XML（Content-Type: application/xml） |

```bash
# 获取微博热搜的 RSS 订阅
GET /weibo?rss=true
```

RSS 输出支持标准 RSS 阅读器订阅，包含 Media RSS 扩展（缩略图等）。

### `type` — 平台分类筛选

不同平台支持不同的 type 值，详见 [平台接口列表](./endpoints.md)。

```bash
# 哔哩哔哩音乐排行
GET /bilibili?type=3

# GitHub 周趋势
GET /github?type=weekly

# 百度小说热搜
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
