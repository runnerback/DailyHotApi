# CLAUDE.md

> 版本: v1.9 | 更新时间: 2026-03-15

本文件为 Claude Code 在此代码库工作时提供指导。

## 项目概述

DailyHotApi 是一个聚合热榜 API 服务，从 60+ 中外平台抓取热门/热搜数据，提供统一 JSON 和 RSS 输出。

- **框架**: Hono 4.x（轻量级 Web 框架）
- **语言**: TypeScript（ESNext target）
- **运行时**: Node.js >= 20
- **缓存**: Redis（主）+ NodeCache（降级）
- **包管理**: pnpm
- **端口**: 15000（本地 .env 配置）

## 开发命令

```bash
pnpm install                 # 安装依赖
pnpm run dev                 # 开发模式（tsx watch 热重载）
pnpm run dev:cache           # 开发模式（启用缓存）
pnpm run build               # TypeScript 编译到 /dist
pnpm run start               # 运行编译产物（development）
pnpm run start:prod          # 运行编译产物（production，启用 cron 调度）
pnpm run lint                # ESLint 检查
pnpm run format              # Prettier 格式化
```

### 部署

```bash
# Docker
docker-compose up -d

# PM2（ECS 生产环境）
pm2 start 'pnpm run start:prod' --name daily-hot
pm2 save
```

## 架构

### 目录结构

```
src/
├── index.ts              # 入口：启动 Hono 服务器
├── app.tsx               # 应用配置：中间件、路由挂载、错误处理
├── config.ts             # 环境变量配置加载（dotenv）
├── registry.ts           # 动态路由注册（自动发现 routes/ 下的文件）
├── routes/               # 60+ 平台路由处理器（每个平台一个文件）
├── utils/
│   ├── getData.ts        # Axios HTTP 客户端（带缓存层）
│   ├── cache.ts          # 双层缓存（Redis + NodeCache 降级）
│   ├── getRSS.ts         # RSS Feed 生成
│   ├── logger.ts         # Winston 日志
│   ├── getTime.ts        # 时间格式化
│   ├── getNum.ts         # 数字解析
│   ├── parseRSS.ts       # RSS 解析
│   ├── auth.ts           # API Key 鉴权中间件
│   ├── kuaidaili.ts      # 快代理（KuaiDaiLi）代理管理
│   ├── coze.ts           # Coze JWT 鉴权 + 工作流 API 调用
│   ├── coze-scheduler.ts # Coze 工作流定时调度服务（Redis 存储 + setTimeout/setInterval）
│   ├── feishu.ts         # 飞书多维表格 API（tenant_access_token + batch_create）
│   └── getToken/         # 平台认证（Bilibili WBI、Weread、Coolapk）
├── coze-routes.tsx       # Coze 路由（工作流触发 + 调度任务 CRUD）
├── coze-JWT-auth-private-key/  # Coze 服务类应用私钥（.gitignore）
├── views/                # JSX 页面（首页、平台列表、调度配置、错误页、404）
└── public/
    └── scheduler.js      # 调度配置页面前端脚本（外部 JS，避免 CSP 问题）
```

### 核心模式

**动态路由注册** (`registry.ts`):
- 自动扫描 `src/routes/` 目录
- 文件名即路由路径（如 `bilibili.ts` → `GET /bilibili`）
- 特殊端点 `GET /all` 返回所有可用路由列表（JSON）
- 特殊端点 `GET /endpoints` 平台接口列表页面（HTML 表格，含 type 参数详情 tooltip）

**路由处理器模式** (每个 route 文件):
```typescript
export const handleRoute = async (c: ListContext, noCache: boolean) => {
  const listData = await getList(options, noCache);
  return {
    name: "platform-name",
    title: "平台名称",
    type: "热榜",
    data: ListItem[],  // 标准化数据
    // ...metadata
  };
};
```

**标准化数据格式** (`ListItem`):
```typescript
{
  id: string | number,
  title: string,
  cover?: string,
  author?: string,
  desc?: string,
  hot: number,
  timestamp: number,
  url: string,
  mobileUrl: string
}
```

**缓存策略** (`cache.ts`):
1. 优先 Redis（分布式，持久化）
2. 降级 NodeCache（内存，进程级）
3. 使用 Flatted 处理循环引用序列化
4. 默认 TTL: 3600 秒

**HTTP 客户端** (`getData.ts`):
- Axios + 请求/响应拦截器
- User-Agent 轮换防封
- 自动集成缓存层
- 可配置超时（默认 6000ms）
- 国外站点：环境变量 http_proxy/https_proxy
- 国内站点：快代理（KDL_ENABLE=true 时）通过 https-proxy-agent 隧道

**快代理** (`kuaidaili.ts`):
- 私密代理 API 获取 IP（30 分钟有效期，5 分钟安全余量）
- 内存缓存 + 并发锁，避免重复 API 调用
- 请求失败自动废弃 IP，下次请求获取新 IP

### 查询参数

所有路由支持:
- `?cache=false` — 跳过缓存
- `?limit=N` — 限制返回条数
- `?rss=true` — 输出 RSS 格式
- `?type=N` — 平台特定过滤器

### API 响应格式

```json
{
  "code": 200,
  "name": "bilibili",
  "title": "哔哩哔哩",
  "type": "热榜",
  "total": 30,
  "updateTime": "2024-03-01T12:00:00Z",
  "fromCache": false,
  "data": [...]
}
```

## 常见开发任务

### 添加新平台路由

1. 在 `src/routes/` 创建 `{platform}.ts`
2. 导出 `handleRoute` 函数，返回 `RouterData`
3. 路由自动注册，无需手动配置

### 添加平台认证

1. 在 `src/utils/getToken/` 创建认证模块
2. 在路由中调用认证函数获取 token
3. 如需环境变量，在 `.env` 和 `config.ts` 中添加

### 修改缓存行为

- 全局 TTL: `.env` 中的 `CACHE_TTL`
- 单路由: 在 `getData()` 调用时传入自定义 TTL
- Redis 配置: `.env` 中的 `REDIS_*` 变量

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | 6688（本地用 15000） | 服务端口 |
| `ALLOWED_DOMAIN` | `*` | CORS 允许域名 |
| `REDIS_HOST` | 127.0.0.1 | Redis 地址 |
| `REDIS_PORT` | 6379 | Redis 端口 |
| `CACHE_TTL` | 3600 | 缓存秒数 |
| `REQUEST_TIMEOUT` | 6000 | 请求超时(ms) |
| `USE_LOG_FILE` | true | 是否写日志文件 |
| `RSS_MODE` | false | 默认 RSS 输出 |
| `API_KEY_ENABLE` | false | 是否启用 API Key 鉴权 |
| `API_KEY` | 空 | API 密钥（`API_KEY_ENABLE=true` 时必填） |
| `KDL_ENABLE` | false | 是否启用快代理（国内站点） |
| `KDL_SECRET_ID` | 空 | 快代理 SecretId |
| `KDL_SIGNATURE` | 空 | 快代理 SecretKey |
| `KDL_USERNAME` | 空 | 快代理用户名（代理认证） |
| `KDL_PASSWORD` | 空 | 快代理密码（代理认证） |
| `COZE_CLIENT_ID` | 空 | Coze 服务类应用 ID |
| `COZE_PUBLIC_KEY_ID` | 空 | Coze JWT 公钥指纹 |
| `COZE_SPACE_ID` | 空 | Coze 工作空间 ID |
| `COZE_WORKFLOW_ID` | 空 | Coze 工作流 ID |
| `FEISHU_APP_ID` | 空 | 飞书自建应用 APP ID |
| `FEISHU_APP_SECRET` | 空 | 飞书自建应用 APP Secret |
| `FEISHU_BITABLE_APP_TOKEN` | 空 | 飞书多维表格 app_token（注意：非 wiki_token） |
| `FEISHU_BITABLE_TABLE_ID` | 空 | 飞书多维表格 table_id |

## API 鉴权

生产环境通过 `X-API-Key` Header 鉴权，中间件位于 `src/utils/auth.ts`。

- **ECS 生产环境**：`.env` 设置 `API_KEY_ENABLE=true` + `API_KEY=密钥`
- **本地开发环境**：`.env` 设置 `API_KEY_ENABLE=false`，无需携带 Key
- **免鉴权路径**：`/`、`/all`、`/endpoints`、`/coze/scheduler`、`/scheduler.js`、`/robots.txt`、`/favicon.ico`、`/favicon.png`

```bash
# 生产环境请求示例
curl -H "X-API-Key: your-key" https://dailyhot.runfast.xyz/bilibili
```

## 环境配置管理

项目维护两份环境配置文件，区分开发和生产环境：

| 文件 | 用途 | `API_KEY_ENABLE` | `KDL_ENABLE` |
|------|------|------------------|--------------|
| `.env` | 本地开发 | `false` | `false` |
| `.env.production` | ECS 生产 | `true` | `true` |

- 两份文件均已加入 `.gitignore`
- 部署方式一（dist only）：不影响 ECS `.env`
- 部署方式二（全量）：rsync 排除 `.env`，上传后 `mv .env.production .env`

## Coze 集成

### JWT 鉴权 + 工作流触发

DailyHotApi 通过 Coze JWT 鉴权（服务类应用）主动触发 Coze 工作流（如 `get_news_to_feishu`），免用户授权。

**核心文件**：
- `src/utils/coze.ts` — JWT 签名 + access_token 获取（内存缓存 + 并发锁）+ 工作流 API 调用
- `src/utils/coze-scheduler.ts` — 定时调度服务（Redis Hash 存储 + setTimeout/setInterval 定时执行）
- `src/coze-routes.tsx` — 工作流触发路由 + 调度任务 CRUD API，挂载到 `/coze` 路径
- `src/views/CozeScheduler.tsx` — 调度配置页面（服务端渲染 HTML）
- `public/scheduler.js` — 调度页面前端交互脚本
- `src/coze-JWT-auth-private-key/private_key.pem` — RSA 私钥（.gitignore）

**路由**：

| 路由 | 方法 | 鉴权 | 说明 |
|------|------|------|------|
| `/coze/workflow/run` | POST | 需 API Key | 触发 Coze 工作流 |
| `/coze/scheduler` | GET | 免鉴权（页面） | 调度配置页面 |
| `/coze/scheduler/tasks` | GET | 需 API Key | 获取所有调度任务 |
| `/coze/scheduler/tasks` | POST | 需 API Key | 创建调度任务 |
| `/coze/scheduler/tasks/:id` | PATCH | 需 API Key | 更新任务（开关/编辑） |
| `/coze/scheduler/tasks/:id` | DELETE | 需 API Key | 删除任务 |
| `/coze/scheduler/execute` | POST | 需 API Key | 立即执行单次任务 |
| `/coze/scheduler/logs` | GET | 需 API Key | 获取执行日志（最近 20 条） |

**Token 策略**（参照官方 Coze JS SDK 默认值）：
- 私钥签名 JWT（RS256，exp=1h）→ 换取 access_token（duration_seconds=900，即 15 分钟）
- 内存缓存上限 10 分钟（TOKEN_MAX_CACHE_MS），提前 2 分钟视为过期（SAFETY_MARGIN_MS）
- 401 重试兜底：工作流调用 401 时清除缓存、重新签发 JWT 重试一次
- 无需浏览器授权、无需 refresh_token、无需 Redis 存储

**使用示例**：
```bash
curl -X POST https://dailyhot.runfast.xyz/coze/workflow/run \
  -H "X-API-Key: your-key" -H "Content-Type: application/json" -d '{}'
```

### 工作流定时调度

通过 Web 页面管理 Coze 工作流定时触发任务，无需修改代码。

**页面入口**：首页「定时任务」按钮 或直接访问 `/coze/scheduler`

**功能**：
- **循环任务**：配置 platform、limit、执行间隔（0.1-24h，支持小数）、首次执行时间，setTimeout/setInterval 定时执行
- **单次任务**：填写 platform、limit，点击「立即执行」（fire-and-forget，不阻塞 UI）
- **任务管理**：开关按钮（●绿/○灰）、删除、状态/结果查看、10 秒自动刷新

**工作流参数**：
- 输入：`api`(string, 固定 dailyhot URL)、`limit`(string, 1-100)、`platform`(string, 逗号分隔, 必填)、`randomToken`(UUID, 自动生成)
- 输出：`output`(Array\<Object\>, to-feishu-records.js 的输出，由 Server 端写入飞书)、`randomToken`(string)
- 超时：默认 15 分钟（`runWorkflow` 第三个参数可配置）

**存储**：
- 任务配置：Redis Hash `coze:scheduler:tasks`（field=taskId, value=JSON）
- 执行日志：Redis List `coze:scheduler:exec-logs`（LPUSH + LTRIM，保留最近 50 条）

**环境行为**：
- `NODE_ENV=development`：不启动定时任务（仅支持手动执行）
- `NODE_ENV=production`：自动启动定时任务，服务重启后从 Redis 恢复任务

**页面鉴权**：
- 页面本身 `/coze/scheduler` 免鉴权（PUBLIC_PATHS）
- API Key 由服务端渲染时注入 `<script data-api-key>` 属性，用户无感

**持久化**：
- 循环任务配置：Redis 持久化，刷新/跨设备一致
- 执行日志（循环 + 单次）：Redis List 持久化，前端 `localStorage` 缓存用于即时显示
- 刷新页面先显示 localStorage 缓存，再从服务端同步最新数据

### Coze 工作流脚本

`docs/coze/` 目录包含 Coze 工作流集成资源：

- `http-node-guide.md` — HTTP 请求节点配置指南
- `json-body-js/normalize.js` — 响应归一化（提取 6 字段：platform、updateTime、title、desc、cover、url）
- `json-body-js/flatten.js` — 循环结果合并（移除 data 层级，输出扁平数组）
- `json-body-js/to-feishu-records.js` — 转换为飞书多维表格 `{fields}` 格式（Coze 最后一个处理节点）
- `json-body-js/count-feishu-records.js` — 已弃用（统计功能已迁移至 Server 端 `feishu.ts`）
- `feishu-bitable-api-reference.md` — 飞书多维表格 API 参考文档

> 注意：Coze HTTP 节点返回的 body 是 JSON 字符串，代码中需 `JSON.parse` 处理。

### 飞书多维表格写入

Coze 工作流处理完数据后，Server 端直接调用飞书 API 将结果写入多维表格，替代了原来 Coze 内置的飞书写入节点。

**核心文件**：`src/utils/feishu.ts`

**数据流**：
```
Coze 工作流 → normalize → flatten → to-feishu-records → 结束节点
  返回 {output: [{fields: {...}}, ...], randomToken}
       ↓
coze-scheduler.ts executeTask() 接收
       ↓
feishu.ts batchCreateRecords(output)
       ↓
去重检查（按 platform 查近 7 天已有记录，比对 url.link）
  ├─ 不重复 → batch_create 新增
  └─ 重复   → batch_update 更新 updateTime 为 now
       ↓
统计新增/更新数量 → 返回 total
```

**去重机制**：
- 写入前按 `platform` 字段查询飞书已有记录（search API）
- 仅对比最近 7 天内的数据（`DEDUP_WINDOW_DAYS=7`，客户端过滤 `updateTime`）
- 以 `url.link` 为去重键：link 相同视为重复
- 重复记录不重新写入，仅更新其 `updateTime` 为当前时间
- 飞书 DateTime 字段不支持 `isGreater` 等过滤运算符，需拉取后客户端过滤

**Token 策略**：
- `tenant_access_token`（应用身份），有效期 2 小时
- 内存缓存 + 并发锁，提前 10 分钟视为过期
- 与 Coze token 管理同模式

**权限要求**：
- 飞书开放平台：应用需开通 `bitable:app` 权限
- 文档级别：应用需通过「更多 → 添加文档应用」添加为多维表格协作者（可编辑）
- 注意：普通「添加协作者」入口只能搜用户，不能添加应用

**wiki 嵌套多维表格的 token 转换**：
- wiki URL 中的 token 是 `wiki_token`，不是 bitable 的 `app_token`
- 需通过 `GET /open-apis/wiki/v2/spaces/get_node?token={wiki_token}` 获取 `obj_token`
- `obj_token` 才是 bitable API 所需的 `app_token`，配置到 `FEISHU_BITABLE_APP_TOKEN`

**飞书 API 已知限制**：
- `url`（超链接）字段：search API 的 `is`/`contains` 只匹配 `text` 显示文本，无法按 `link` 过滤
- `DateTime` 字段：search API 不支持 `isGreater`/`isGreaterEqual` 等比较运算符，需客户端过滤
- 批量操作：单次最多 500 条，50 QPS（代码已自动分批）

**字段格式（飞书特殊要求）**：
- 超链接：`{ link: "https://...", text: "显示文本" }`
- 多选：`["选项1", "选项2"]`
- 日期：毫秒时间戳 `1677206443000`
- 评分/进度：`0~1` 的小数

## 重要约定

1. **包管理**: 使用 pnpm（项目含 pnpm-lock.yaml）
2. **路由文件命名**: 文件名即 URL 路径，保持小写
3. **数据标准化**: 所有路由返回统一 `ListItem` 结构
4. **错误处理**: 路由内 try-catch + logger 记录
5. **日志**: Winston 日志输出到 `logs/` 目录（error.log + logger.log，各 1MB 上限）
6. **中文语言**: 中文回复、中文写文档、中文写注释
