# CLAUDE.md

> 版本: v1.1 | 更新时间: 2026-03-03

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
pnpm run start               # 运行编译产物
pnpm run lint                # ESLint 检查
pnpm run format              # Prettier 格式化
```

### 部署

```bash
# Docker
docker-compose up -d

# PM2
pm2 start ecosystem.config.cjs
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
│   └── getToken/         # 平台认证（Bilibili WBI、Weread、Coolapk）
└── views/                # JSX 页面（首页、错误页、404）
```

### 核心模式

**动态路由注册** (`registry.ts`):
- 自动扫描 `src/routes/` 目录
- 文件名即路由路径（如 `bilibili.ts` → `GET /bilibili`）
- 特殊端点 `GET /all` 返回所有可用路由列表

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

## API 鉴权

生产环境通过 `X-API-Key` Header 鉴权，中间件位于 `src/utils/auth.ts`。

- **ECS 生产环境**：`.env` 设置 `API_KEY_ENABLE=true` + `API_KEY=密钥`
- **本地开发环境**：`.env` 设置 `API_KEY_ENABLE=false`，无需携带 Key
- **免鉴权路径**：`/`、`/robots.txt`、`/favicon.ico`、`/favicon.png`

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

`docs/coze/` 目录包含 Coze 工作流集成资源：

- `http-node-guide.md` — HTTP 请求节点配置指南
- `json-body-js/normalize.js` — 响应归一化（提取 6 字段：platform、updateTime、title、desc、cover、url）
- `json-body-js/flatten.js` — 循环结果合并（移除 data 层级，输出扁平数组）

> 注意：Coze HTTP 节点返回的 body 是 JSON 字符串，代码中需 `JSON.parse` 处理。

## 重要约定

1. **包管理**: 使用 pnpm（项目含 pnpm-lock.yaml）
2. **路由文件命名**: 文件名即 URL 路径，保持小写
3. **数据标准化**: 所有路由返回统一 `ListItem` 结构
4. **错误处理**: 路由内 try-catch + logger 记录
5. **日志**: Winston 日志输出到 `logs/` 目录（error.log + logger.log，各 1MB 上限）
6. **中文语言**: 中文回复、中文写文档、中文写注释
