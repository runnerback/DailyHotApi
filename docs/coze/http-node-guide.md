# Coze HTTP 请求节点接入 DailyHotApi 指南

> 版本: v1.0 | 更新时间: 2026-03-02

---

## 概述

在 Coze 工作流中通过「HTTP 请求」节点调用 DailyHotApi，获取各平台热榜数据。

---

## 节点配置

### 1. API URL（请求地址）

**格式**：

```
https://dailyhot.runfast.xyz/{平台名}
```

**示例**：

| 平台 | URL |
|------|-----|
| 微博热搜 | `https://dailyhot.runfast.xyz/weibo` |
| B站排行 | `https://dailyhot.runfast.xyz/bilibili` |
| 抖音热榜 | `https://dailyhot.runfast.xyz/douyin` |
| 知乎热榜 | `https://dailyhot.runfast.xyz/zhihu` |
| 百度热搜 | `https://dailyhot.runfast.xyz/baidu` |
| GitHub 趋势 | `https://dailyhot.runfast.xyz/github` |
| 所有平台列表 | `https://dailyhot.runfast.xyz/all` |

**请求方法**：选择 `GET`

---

### 2. 请求参数（Query Params）

所有参数均为可选，在 Coze 节点的「请求参数」区域以 Key-Value 形式填写：

| Key | Value 示例 | 说明 |
|-----|-----------|------|
| `limit` | `10` | 限制返回条数，不填则返回全部 |
| `type` | `4` | 平台分类筛选，不同平台值不同（见下方附录） |
| `cache` | `false` | 设为 `false` 跳过缓存获取最新数据，不填默认使用缓存 |

**配置截图对照**：

```
┌─────────────────────────────────────┐
│  请求参数                            │
│  ┌─────────┬───────────┐            │
│  │  Key    │  Value    │            │
│  ├─────────┼───────────┤            │
│  │  limit  │  10       │            │
│  │  type   │  0        │            │
│  └─────────┴───────────┘            │
└─────────────────────────────────────┘
```

> 如果不需要筛选，请求参数区域留空即可。

---

### 3. 请求头（Headers）

在「请求头」区域添加一行：

| Key | Value |
|-----|-------|
| `X-API-Key` | `8fab3d2598df5f63b5254f5882fe70cedefbfa417652ae07` |

**配置截图对照**：

```
┌─────────────────────────────────────────────────────────┐
│  请求头                                                  │
│  ┌────────────┬────────────────────────────────────────┐ │
│  │  Key       │  Value                                 │ │
│  ├────────────┼────────────────────────────────────────┤ │
│  │  X-API-Key │  8fab3d2598df5f63b5254f5882fe70cedefb… │ │
│  └────────────┴────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

> 这是必填项，不填会返回 401 错误。

---

### 4. 鉴权（Authorization）

选择 **「无需鉴权」/ 「None」**。

原因：我们已通过请求头 `X-API-Key` 完成鉴权，不需要 Coze 内置的 OAuth / Bearer Token 等鉴权方式。

```
┌─────────────────────────┐
│  鉴权方式                │
│  ☑ None（无需鉴权）      │
│  ☐ Bearer Token          │
│  ☐ Basic Auth            │
│  ☐ OAuth 2.0             │
└─────────────────────────┘
```

---

### 5. 请求体（Body）

选择 **「无」/ 「None」**。

GET 请求不需要请求体，此区域留空。

---

## 完整配置总结

| 配置项 | 填写内容 |
|--------|---------|
| **请求方法** | `GET` |
| **URL** | `https://dailyhot.runfast.xyz/weibo`（替换为目标平台） |
| **请求参数** | 可选：`limit=10`、`type=0`、`cache=false` |
| **请求头** | `X-API-Key: 8fab3d2598df5f63b5254f5882fe70cedefbfa417652ae07` |
| **鉴权** | None |
| **请求体** | None |

---

## 响应数据结构

HTTP 请求节点会收到如下 JSON 响应，可在后续节点中引用：

```json
{
  "code": 200,
  "name": "weibo",
  "title": "微博",
  "type": "热搜榜",
  "total": 50,
  "updateTime": "2026-03-02T10:00:00.000Z",
  "fromCache": true,
  "data": [
    {
      "id": "1",
      "title": "热搜话题标题",
      "desc": "话题描述",
      "hot": 5234567,
      "timestamp": 1740819600000,
      "url": "https://s.weibo.com/weibo?q=...",
      "mobileUrl": "https://m.weibo.cn/search?..."
    }
  ]
}
```

### 在后续节点中引用数据

常用引用路径（Coze 表达式语法）：

| 数据 | 引用路径 |
|------|---------|
| 状态码 | `{{node_name.code}}` |
| 平台名 | `{{node_name.title}}` |
| 数据条数 | `{{node_name.total}}` |
| 完整数据列表 | `{{node_name.data}}` |
| 第一条标题 | `{{node_name.data[0].title}}` |
| 第一条链接 | `{{node_name.data[0].url}}` |
| 第一条热度 | `{{node_name.data[0].hot}}` |

---

## 附录：常用平台 type 参数

### 哔哩哔哩 `/bilibili`

| type | 分区 |
|------|------|
| `0` | 全站（默认） |
| `1` | 动画 |
| `3` | 音乐 |
| `4` | 游戏 |
| `5` | 娱乐 |
| `188` | 科技 |

### 百度 `/baidu`

| type | 分类 |
|------|------|
| `realtime` | 实时热搜（默认） |
| `novel` | 小说 |
| `movie` | 电影 |
| `game` | 游戏 |

### GitHub `/github`

| type | 周期 |
|------|------|
| `daily` | 日榜（默认） |
| `weekly` | 周榜 |
| `monthly` | 月榜 |

### 36氪 `/36kr`

| type | 分类 |
|------|------|
| `hot` | 人气榜（默认） |
| `video` | 视频榜 |
| `comment` | 热议榜 |
| `collect` | 收藏榜 |

完整平台参数详见 [平台接口列表](../api/endpoints.md)。

---

## 常见问题

### 返回 401 Unauthorized

请求头中 `X-API-Key` 未填或填写错误，检查 Key 是否完整复制。

### 返回数据为空

- 部分平台可能临时不可用，换个平台测试
- 尝试 `cache=false` 获取最新数据

### 超时

DailyHotApi 默认请求超时 6 秒，Coze HTTP 节点建议设置超时为 **10 秒以上**。
