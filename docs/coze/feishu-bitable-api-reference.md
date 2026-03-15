# 飞书多维表格 API 参考文档

> 目标：将当前 Coze Flow 写入飞书多维表格的功能，迁移到 DailyHotApi Server 端直接完成。

---

## 1. 当前架构 vs 目标架构

### 当前（Coze Flow）

```
定时触发 → Coze 工作流 → HTTP 节点请求 DailyHotApi
→ normalize.js → flatten.js → to-feishu-records.js
→ 飞书 add_records API → count-feishu-records.js
```

**痛点**：依赖 Coze 平台、多层 JS 脚本变换、调试困难、无法灵活控制写入逻辑。

### 目标（Server 端直连）

```
DailyHotApi 定时任务 / API 触发
→ 获取各平台热榜数据（已有）
→ 数据标准化（复用现有 ListItem）
→ 飞书 tenant_access_token 鉴权
→ 飞书 Bitable batch_create API 直接写入
```

**优势**：去除 Coze 中间层，数据变换在 TypeScript 中完成，可复用现有缓存/调度系统。

---

## 2. 鉴权：获取 tenant_access_token

### 请求

```
POST https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal
Content-Type: application/json

{
  "app_id": "cli_xxxxxxxx",
  "app_secret": "xxxxxxxxxx"
}
```

### 响应

```json
{
  "code": 0,
  "msg": "ok",
  "tenant_access_token": "t-xxxxxxxx",
  "expire": 7200
}
```

### 要点

| 项目 | 说明 |
|------|------|
| 有效期 | 2 小时（7200 秒） |
| 刷新策略 | 剩余 < 30 分钟时重新获取，新旧 token 短期内同时有效 |
| 使用方式 | 后续所有 API 请求头加 `Authorization: Bearer <token>` |
| 适用场景 | 后端服务调用（应用身份），需要应用是文档协作者 |

---

## 3. 路径参数说明

**Base URL**：`https://open.feishu.cn/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}`

从多维表格 URL 中提取：

```
https://xxx.feishu.cn/base/PtRdbPjCFa5Og5sry0lcD1yPnKg?table=tblVBqxDbGXOJZPv&view=vewjgHC22S
                            ↑ app_token                       ↑ table_id          ↑ view_id
```

---

## 4. 记录 CRUD 操作

### 4.1 新增单条记录

```
POST /bitable/v1/apps/{app_token}/tables/{table_id}/records
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

{
  "fields": {
    "平台": "哔哩哔哩",
    "标题": "热门视频标题",
    "热度": 52345,
    "更新时间": 1677206443000,
    "链接": { "link": "https://...", "text": "查看" }
  }
}
```

**响应**：

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "record": {
      "record_id": "recXXXXXX",
      "fields": { ... }
    }
  }
}
```

**限流**：10 QPS

---

### 4.2 批量新增记录

```
POST /bitable/v1/apps/{app_token}/tables/{table_id}/records/batch_create
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

{
  "records": [
    {
      "fields": {
        "平台": "微博",
        "标题": "热搜标题1",
        "热度": 5234567
      }
    },
    {
      "fields": {
        "平台": "微博",
        "标题": "热搜标题2",
        "热度": 3456789
      }
    }
  ]
}
```

**限制**：每次最多 500 条，50 QPS

---

### 4.3 查询记录（推荐用 search）

#### List（GET，简单查询）

```
GET /bitable/v1/apps/{app_token}/tables/{table_id}/records
  ?page_size=100
  &page_token=
  &field_names=["平台","标题","热度"]
  &filter=CurrentValue.[平台]="微博"
  &sort=["更新时间 desc"]
```

**限流**：10 QPS / 1000 QPM，单次最多 500 条

#### Search（POST，推荐）

```
POST /bitable/v1/apps/{app_token}/tables/{table_id}/records/search
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

{
  "field_names": ["平台", "标题", "热度", "更新时间"],
  "filter": {
    "conjunction": "and",
    "conditions": [
      {
        "field_name": "平台",
        "operator": "is",
        "value": ["微博"]
      }
    ]
  },
  "sort": [
    { "field_name": "更新时间", "desc": true }
  ],
  "page_size": 100,
  "page_token": ""
}
```

**Filter 操作符**：`is`, `isNot`, `contains`, `doesNotContain`, `isEmpty`, `isNotEmpty`, `isGreater`, `isLess`, `isGreaterEqual`, `isLessEqual`

**Conjunction**：`"and"` 或 `"or"`

**限流**：20 QPS，单次最多 500 条

---

### 4.4 获取单条记录

```
GET /bitable/v1/apps/{app_token}/tables/{table_id}/records/{record_id}
Authorization: Bearer <tenant_access_token>
```

**限流**：20 QPS

---

### 4.5 更新记录

```
PUT /bitable/v1/apps/{app_token}/tables/{table_id}/records/{record_id}
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

{
  "fields": {
    "热度": 9999999
  }
}
```

**限流**：10 QPS

---

### 4.6 批量更新记录

```
POST /bitable/v1/apps/{app_token}/tables/{table_id}/records/batch_update
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

{
  "records": [
    {
      "record_id": "recXXXXXX",
      "fields": { "热度": 100 }
    },
    {
      "record_id": "recYYYYYY",
      "fields": { "热度": 200 }
    }
  ]
}
```

**限制**：每次最多 500 条，50 QPS

---

### 4.7 删除记录

```
DELETE /bitable/v1/apps/{app_token}/tables/{table_id}/records/{record_id}
Authorization: Bearer <tenant_access_token>
```

---

### 4.8 批量删除记录

```
POST /bitable/v1/apps/{app_token}/tables/{table_id}/records/batch_delete
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

{
  "records": ["recXXXXXX", "recYYYYYY"]
}
```

**限制**：每次最多 500 条，50 QPS

---

## 5. 字段类型与 JSON 值格式

| 字段类型 | JSON 写入格式 | 示例 |
|----------|--------------|------|
| 文本 | `"string"` | `"热搜标题"` |
| 数字 | `number` | `52345` |
| 单选 | `"option_name"` | `"科技"` |
| 多选 | `["opt1", "opt2"]` | `["国内", "热点"]` |
| 日期 | `timestamp_ms` | `1677206443000` |
| 复选框 | `boolean` | `true` |
| 人员 | `[{"id": "ou_xxx"}]` | — |
| 超链接 | `{"link": "url", "text": "显示文本"}` | `{"link": "https://...", "text": "查看"}` |
| 附件 | `[{"file_token": "xxx"}]` | 需先上传获取 token |
| 评分 | `number (0~1)` | `0.8`（4/5 星） |
| 进度 | `number (0~1)` | `0.5`（50%） |
| 货币 | `number` | `99.99` |
| 电话 | `"string"` | `"13012345678"` |
| 邮箱 | `"string"` | `"user@example.com"` |
| 条码 | `"string"` | `"978-7-111-48565-0"` |
| 关联 | `["record_id"]` | `["recXXXXXX"]` |
| 地理位置 | `"lng,lat"` | `"116.397755,39.903179"` |
| 公式/查找引用 | — | 只读，不可写入 |
| 创建/修改时间 | — | 只读，自动生成 |
| 自动编号 | — | 只读，自动生成 |

---

## 6. 限流汇总

| 操作 | QPS | 单次最大记录数 |
|------|-----|---------------|
| 单条增/改 | 10 | 1 |
| 单条查询 | 20 | 1 |
| 搜索 (search) | 20 | 500 |
| 列表 (list) | 10 | 500 |
| 批量增/改 | 50 | 500 |
| 批量删除 | 50 | 500 |

---

## 7. 当前 Coze 数据变换映射（迁移参考）

当前 Coze Flow 中 `to-feishu-records.js` 做的字段映射：

```
DailyHotApi ListItem        →  飞书多维表格字段
─────────────────────────────────────────────
title (来自 response.title) →  platform（平台名）
updateTime                  →  updateTime（日期，毫秒时间戳）
item.title                  →  title（标题，文本）
item.desc                   →  desc（描述，文本）
item.cover                  →  cover（封面，文本/超链接）
item.url                    →  url（链接，超链接格式 {link, text}）
```

**特殊转换**：
- 多选字段：字符串 → 数组 `"美股" → ["美股"]`
- 评分字段：除以 100 `"80" → 0.8`
- 超链接字段：`"https://..." → { link: "https://...", text: "标题" }`

---

## 8. Server 端实现要点

### 需要的环境变量（新增）

```env
FEISHU_APP_ID=cli_xxxxxxxx
FEISHU_APP_SECRET=xxxxxxxxxx
FEISHU_BITABLE_APP_TOKEN=PtRdbPjCFa5Og5sry0lcD1yPnKg
FEISHU_BITABLE_TABLE_ID=tblVBqxDbGXOJZPv
```

### 核心模块设计

```
src/utils/feishu.ts
├── getAccessToken()          # 获取/缓存 tenant_access_token
├── batchCreateRecords()      # 批量写入（复用现有 ListItem → fields 映射）
├── searchRecords()           # 查询记录
├── batchUpdateRecords()      # 批量更新
└── batchDeleteRecords()      # 批量删除
```

### Token 缓存策略

可参考现有 `coze.ts` 的 token 缓存模式：
- 内存缓存 + 过期时间
- 安全余量提前刷新（如提前 10 分钟）
- 并发锁防止重复请求

### 与现有调度系统集成

复用 `coze-scheduler.ts` 的定时任务机制，新增任务类型或直接在 executeTask 中调用飞书写入。

---

## 9. 飞书应用权限要求

应用需要以下权限（在飞书开放平台控制台配置）：

| 权限 | 说明 |
|------|------|
| `bitable:app` | 多维表格读写 |
| `bitable:app:readonly`（可选） | 仅读取 |

应用必须被添加为多维表格的**协作者**才能通过 `tenant_access_token` 访问。

---

*文档基于飞书开放平台官方 API 文档整理，适用于 Server 端直接调用场景。*
