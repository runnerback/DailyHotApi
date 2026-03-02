# 响应格式

## JSON 响应（默认）

### 结构

```json
{
  "code": 200,
  "name": "bilibili",
  "title": "哔哩哔哩",
  "type": "热榜 · 全站",
  "description": "你所热爱的，就是你的生活",
  "params": {
    "type": {
      "name": "排行榜分区",
      "type": { "0": "全站", "1": "动画", "3": "音乐" }
    }
  },
  "link": "https://www.bilibili.com/v/popular/rank/all",
  "total": 100,
  "updateTime": "2026-03-01T10:48:22.000Z",
  "fromCache": false,
  "data": [
    {
      "id": 123456,
      "title": "视频标题",
      "desc": "视频简介",
      "cover": "https://example.com/cover.jpg",
      "author": "UP主名称",
      "hot": 1234567,
      "timestamp": 1740819600000,
      "url": "https://www.bilibili.com/video/BV...",
      "mobileUrl": "https://m.bilibili.com/video/BV..."
    }
  ]
}
```

### 字段说明

#### 顶层字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `code` | number | HTTP 状态码，200 = 成功 |
| `name` | string | 平台标识（与路由名一致） |
| `title` | string | 平台中文名 |
| `type` | string | 榜单分类名称 |
| `description` | string | 平台描述（可选） |
| `params` | object | 该接口支持的可选参数及其取值（可选） |
| `link` | string | 平台原始链接 |
| `total` | number | 返回数据条数 |
| `updateTime` | string | 数据更新时间（ISO 8601） |
| `fromCache` | boolean | 是否来自缓存 |
| `data` | array | 数据列表 |

#### `data` 数组中的条目（ListItem）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string \| number | 唯一标识 |
| `title` | string | 标题/话题 |
| `desc` | string | 描述/摘要（可选） |
| `cover` | string | 封面图 URL（可选） |
| `author` | string | 作者/来源（可选） |
| `hot` | number | 热度/播放量/点赞数（可选） |
| `timestamp` | number | Unix 时间戳，毫秒（可选） |
| `url` | string | 桌面端链接 |
| `mobileUrl` | string | 移动端链接 |

> 不同平台的 `data` 条目可能包含额外字段（如 GitHub 的 `language`、`stars`、`forks`），但以上字段是所有平台的标准字段。

#### `params` 字段

当接口支持分类参数时，`params` 字段会列出所有可选值，方便前端动态渲染筛选器：

```json
"params": {
  "type": {
    "name": "排行榜分区",
    "type": {
      "0": "全站",
      "1": "动画",
      "3": "音乐"
    }
  }
}
```

## RSS 响应

当请求添加 `?rss=true` 时，返回 RSS 2.0 XML：

```
Content-Type: application/xml; charset=utf-8
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>哔哩哔哩</title>
    <description>哔哩哔哩 热榜 · 全站 - 你所热爱的，就是你的生活</description>
    <link>https://www.bilibili.com/v/popular/rank/all</link>
    <language>zh</language>
    <item>
      <title>视频标题</title>
      <link>https://www.bilibili.com/video/BV...</link>
      <description>视频简介</description>
      <media:content url="https://example.com/cover.jpg" medium="image" />
      <media:thumbnail url="https://example.com/cover.jpg" />
    </item>
  </channel>
</rss>
```

可直接用于 RSS 阅读器订阅。

## 错误响应

```json
{
  "code": 500,
  "message": "获取数据失败"
}
```

| code | 说明 |
|------|------|
| 200 | 成功 |
| 401 | 未授权（API Key 缺失或错误） |
| 404 | 路由不存在 |
| 405 | 请求方法不允许（仅支持 GET） |
| 500 | 服务端错误（平台接口异常等） |

### 401 未授权示例

```json
{
  "code": 401,
  "message": "Unauthorized"
}
```

生产环境需在请求 Header 中携带 `X-API-Key`，详见 [使用指南](./README.md)。
