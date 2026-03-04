# DailyHotApi 部署文档

> 版本: v1.6 | 更新时间: 2026-03-04

---

## ⚠️ 重要警告：禁止在 ECS 上执行 tsc 编译

> **2026-03-01 事故记录**：首次部署时在 ECS（1.9GB 内存）上执行 `pnpm run build`（tsc 编译），
> TypeScript 编译器内存占用飙升，耗尽系统内存，导致 OOM Killer 杀死 sshd 进程，
> ECS 完全失联，只能通过控制台强制重启恢复。

### 根因分析

| 因素 | 说明 |
|------|------|
| **ECS 内存不足** | 总共 1.9GB，已有 5 个 PM2 进程占用约 400MB，可用不到 800MB |
| **tsc 内存开销大** | TypeScript 编译 60+ 路由文件，内存峰值远超可用空间 |
| **无 swap 分区** | ECS 未配置 swap，内存耗尽后 OOM Killer 直接杀进程 |
| **sshd 被误杀** | OOM Killer 选择杀 sshd，导致远程连接中断，无法恢复 |

### 正确做法

```bash
# ✅ 本地构建，rsync 上传编译产物
pnpm run build                    # 本地执行
rsync -avz --delete dist/ root@115.190.207.149:/var/www/dailyhot-api/dist/
ssh root@115.190.207.149 "pm2 restart daily-hot"

# ❌ 绝对禁止在 ECS 上执行以下命令
# pnpm run build
# tsc
# npx tsc
```

### 通用原则

- **所有 TypeScript 项目**：本地/CI 编译 → rsync 上传 `dist/` → ECS 只运行 JS
- **ECS 只做运行时**：运行 Node.js 产物、Nginx、Redis、PM2，不做编译
- **内存敏感操作**（npm install 大量依赖、构建、压缩等）一律在本地完成

---

## 1. 项目架构概览

```
用户浏览器 (HTTPS)
    ↓
┌─── ECS (115.190.207.149) ─────────────────────────┐
│  Nginx (443/80)                                    │
│  https://dailyhot.runfast.xyz                      │
│  ├─ / → 反向代理到 localhost:15000                  │
│  └─ SSL: Let's Encrypt (Certbot 自动续期)          │
│                                                    │
│  DailyHotApi (PM2: daily-hot)                      │
│  ├─ 端口: 15000                                    │
│  ├─ 框架: Hono 4.x + TypeScript                   │
│  ├─ 缓存: Redis + NodeCache                       │
│  └─ Coze JWT: 服务类应用免授权鉴权                   │
│                                                    │
│  Redis Server                                      │
│  └─ 端口: 6379 (localhost)                         │
└────────────────────────────────────────────────────┘
```

| 服务 | 技术栈 | 端口 | 说明 |
|------|--------|------|------|
| Nginx | 反向代理 + SSL | 443/80 | HTTPS 终端、反代到 Node |
| DailyHotApi | Hono + Node.js 20 | 15000 | 热榜聚合 API |
| Redis | 缓存 | 6379 | 数据缓存层 |

---

## 2. 前置条件

### ECS 服务器

| 项目 | 值 |
|------|-----|
| **IP** | `115.190.207.149` |
| **OS** | Ubuntu 22.04 |
| **Node.js** | >= 20 |
| **域名** | `dailyhot.runfast.xyz` |

### 需要安装

```bash
# Node.js 20 (如已安装可跳过)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# pnpm
npm install -g pnpm

# PM2
npm install -g pm2

# Redis
sudo apt-get install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Certbot (如已安装可跳过)
sudo apt-get install -y certbot python3-certbot-nginx
```

---

## 3. 首次部署

### 3.1 本地构建 & 上传到 ECS

> **禁止在 ECS 上执行 `pnpm run build`**，详见文档顶部警告。

```bash
# === 本地操作 ===
cd CrawlerData/DailyHotApi

# 安装依赖 & 构建
pnpm install
pnpm run build

# 上传整个项目到 ECS（首次部署）
rsync -avz --exclude node_modules --exclude .git --exclude logs \
  ./ root@115.190.207.149:/var/www/dailyhot-api/

# === ECS 操作 ===
ssh root@115.190.207.149
cd /var/www/dailyhot-api

# ECS 上只安装生产依赖（不编译）
pnpm install --prod
```

### 3.3 配置环境变量

项目维护两份环境配置文件：

| 文件 | 用途 | `API_KEY_ENABLE` | `KDL_ENABLE` |
|------|------|------------------|--------------|
| `.env` | 本地开发 | `false` | `false` |
| `.env.production` | ECS 生产 | `true` | `true` |

首次部署时，将 `.env.production` 重命名为 `.env`：

```bash
cd /var/www/dailyhot-api
mv .env.production .env
```

> 后续更新部署（方式二）会自动完成重命名，无需手动操作。

### 3.4 上传 Coze 私钥文件

Coze JWT 鉴权需要 RSA 私钥文件，该文件不在 git 中（已 .gitignore）。

```bash
# 本地上传私钥到 ECS
rsync -avz src/coze-JWT-auth-private-key/ \
  root@115.190.207.149:/var/www/dailyhot-api/src/coze-JWT-auth-private-key/
```

### 3.5 更新 PM2 配置

项目自带的 `ecosystem.config.cjs` 需更新端口：

```bash
# 直接使用以下命令启动（覆盖配置中的端口）
pm2 start ecosystem.config.cjs --name daily-hot --env production
```

或修改 `ecosystem.config.cjs`：

```js
module.exports = {
  apps: [{
    name: 'daily-hot',
    script: 'npm',
    args: 'start',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 15000
    }
  }]
}
```

### 3.6 启动服务

```bash
# 启动
pm2 start ecosystem.config.cjs

# 验证
curl http://localhost:15000/bilibili | head -c 200

# 设置开机自启
pm2 startup
pm2 save
```

### 3.7 配置 Nginx + SSL

```bash
# 复制 Nginx 配置
sudo cp docs/deployment/nginx/dailyhot.runfast.xyz.conf \
  /etc/nginx/sites-available/dailyhot.runfast.xyz.conf

# 启用站点
sudo ln -s /etc/nginx/sites-available/dailyhot.runfast.xyz.conf \
  /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 申请 SSL 证书
sudo certbot --nginx -d dailyhot.runfast.xyz

# 重载 Nginx
sudo nginx -s reload
```

### 3.8 DNS 配置

在域名 DNS 管理中添加 A 记录：

| 记录类型 | 主机记录 | 记录值 |
|---------|---------|--------|
| A | dailyhot | 115.190.207.149 |

### 3.9 验证

```bash
# HTTPS 访问（需携带 API Key）
curl -H "X-API-Key: your-secret-key-here" https://dailyhot.runfast.xyz/weibo | head -c 200

# 不带 Key 应返回 401
curl https://dailyhot.runfast.xyz/weibo
# {"code":401,"message":"Unauthorized"}

# 查看所有平台（免鉴权）
curl https://dailyhot.runfast.xyz/all

# 平台接口列表页面（免鉴权）
# https://dailyhot.runfast.xyz/endpoints
```

---

## 4. 更新部署

> **所有构建操作在本地完成，ECS 只接收编译产物。**

```bash
# === 本地操作 ===
cd CrawlerData/DailyHotApi

# 拉取最新代码 & 构建
git pull
pnpm install
pnpm run build

# 方式一：只上传编译产物（推荐，速度快）
rsync -avz --delete dist/ root@115.190.207.149:/var/www/dailyhot-api/dist/
ssh root@115.190.207.149 "pm2 restart daily-hot"

# 方式二：上传完整项目（依赖有变更时使用）
# 注意：排除 .env 避免覆盖生产配置，.env.production 上传后会被重命名为 .env
rsync -avz --exclude node_modules --exclude .git --exclude logs --exclude .env \
  ./ root@115.190.207.149:/var/www/dailyhot-api/
ssh root@115.190.207.149 "cd /var/www/dailyhot-api && mv .env.production .env && pnpm install --prod && pm2 restart daily-hot"
```

```bash
# ❌ 禁止在 ECS 上执行（会导致内存耗尽、服务器失联）
# pnpm run build
# tsc
# npx tsc
```

---

## 5. 运维命令

### PM2 管理

```bash
pm2 list                  # 查看所有进程
pm2 logs daily-hot        # 查看日志
pm2 logs daily-hot --lines 100  # 最近 100 行
pm2 restart daily-hot     # 重启
pm2 stop daily-hot        # 停止
pm2 delete daily-hot      # 删除
pm2 monit                 # 监控面板
```

### Nginx 管理

```bash
sudo nginx -t             # 测试配置
sudo nginx -s reload      # 重载配置
sudo systemctl status nginx   # 查看状态
sudo tail -f /var/log/nginx/dailyhot.access.log  # 访问日志
sudo tail -f /var/log/nginx/dailyhot.error.log   # 错误日志
```

### Redis 管理

```bash
redis-cli ping            # 连通性测试
redis-cli info memory     # 内存使用
redis-cli dbsize          # 缓存键数量
redis-cli flushdb         # 清空缓存（谨慎）
```

### SSL 证书

```bash
# 查看证书信息
sudo certbot certificates

# 手动续期
sudo certbot renew

# 自动续期（Certbot 已自动配置 cron）
sudo systemctl status certbot.timer
```

---

## 6. 健康检查

```bash
# API 健康检查（需携带 API Key）
curl -s -H "X-API-Key: your-secret-key-here" https://dailyhot.runfast.xyz/bilibili | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f'Status: {d[\"code\"]}, Items: {d[\"total\"]}, Cache: {d[\"fromCache\"]}')
"

# PM2 进程状态
pm2 show daily-hot

# Nginx 状态（需携带 API Key）
curl -I -H "X-API-Key: your-secret-key-here" https://dailyhot.runfast.xyz/weibo

# Redis 连接
redis-cli ping
```

---

## 7. 端口一览

| 端口 | 服务 | 说明 |
|------|------|------|
| 80 | Nginx | HTTP → 301 重定向到 HTTPS |
| 443 | Nginx | HTTPS 终端，反代到 15000 |
| 15000 | DailyHotApi | Hono API 服务 |
| 6379 | Redis | 缓存服务 |

---

## 8. 目录结构（ECS）

```
/var/www/dailyhot-api/          # 项目根目录
├── dist/                       # 编译产物
├── src/                        # 源码
│   ├── utils/coze.ts           # Coze JWT 鉴权 + 工作流调用
│   ├── coze-routes.ts          # Coze 工作流路由
│   └── coze-JWT-auth-private-key/  # RSA 私钥（需手动上传）
├── logs/                       # 运行日志
├── .env                        # 环境配置（含 COZE_* 变量）
├── ecosystem.config.cjs        # PM2 配置
└── deploy.sh                   # 部署脚本

/etc/nginx/sites-available/
└── dailyhot.runfast.xyz.conf   # Nginx 配置

/var/log/nginx/
├── dailyhot.access.log         # 访问日志
└── dailyhot.error.log          # 错误日志
```

---

## 9. 常见问题

### API 请求超时

```
❌ [ERROR] timeout of 6000ms exceeded
```

- 检查目标平台是否可达：`curl -I https://weibo.com`
- 增加超时时间：`.env` 中 `REQUEST_TIMEOUT=10000`
- 确认 ECS 出站网络正常

### Redis 连接失败

```
Redis connection failed
```

- 检查 Redis 服务：`sudo systemctl status redis-server`
- 确认配置：`redis-cli -h 127.0.0.1 -p 6379 ping`
- 应用会自动降级到 NodeCache，不影响功能

### 502 Bad Gateway

- PM2 进程可能未运行：`pm2 list`
- 端口是否正确：`curl http://localhost:15000/all`
- 查看 PM2 日志：`pm2 logs daily-hot`

### ECS 内存耗尽 / SSH 失联

```
OOM Killer → sshd 被杀 → SSH 无法连接
```

**原因**：在 ECS 上执行了内存密集操作（如 tsc 编译）

**恢复方法**：
1. 登录云服务商控制台
2. 强制停止 ECS 实例（非重启，因为重启可能因内存不足卡住）
3. 等待实例完全停止后重新启动
4. SSH 重新连接

**预防**：
- 永远不要在 ECS 上执行 `tsc` / `pnpm run build`
- 本地构建 → rsync 上传 `dist/`
- 参见文档顶部「禁止在 ECS 上执行 tsc 编译」章节

### Coze 工作流调用失败

```
❌ [COZE] access_token 获取失败
```

- **私钥文件缺失**：确认 `src/coze-JWT-auth-private-key/private_key.pem` 存在
- **配置错误**：检查 `.env` 中 `COZE_CLIENT_ID` 和 `COZE_PUBLIC_KEY_ID` 是否正确
- **Coze 服务类应用权限**：确认 Coze 开放平台应用已配置工作流调用权限

### SSL 证书过期

```bash
# 检查过期时间
sudo certbot certificates

# 手动续期
sudo certbot renew
sudo nginx -s reload
```

---

## 10. Coze 集成

### 鉴权方式

JWT 鉴权（服务类应用），免用户授权。私钥签名 JWT → 换取 access_token → 调用工作流。

### 环境变量

| 变量 | 说明 |
|------|------|
| `COZE_CLIENT_ID` | Coze 服务类应用 ID |
| `COZE_PUBLIC_KEY_ID` | JWT 公钥指纹 |
| `COZE_SPACE_ID` | Coze 工作空间 ID |
| `COZE_WORKFLOW_ID` | 默认工作流 ID |

### 私钥文件

- 路径：`src/coze-JWT-auth-private-key/private_key.pem`
- 已加入 `.gitignore`，部署时需手动上传到 ECS
- RSA 2048 位，RS256 签名算法

### 路由

| 路由 | 方法 | 鉴权 | 说明 |
|------|------|------|------|
| `/coze/workflow/run` | POST | 需 API Key | 触发 Coze 工作流 |

### Token 策略

- 私钥签名 JWT → 换取 access_token（最大 24 小时有效期）
- 内存缓存 + 提前 5 分钟自动续期
- 无需浏览器授权、无需 refresh_token、无需 Redis 存储

### 使用示例

```bash
# 触发工作流（免授权，直接调用）
curl -X POST https://dailyhot.runfast.xyz/coze/workflow/run \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## 11. Docker 部署（备选方案）

如需容器化部署，项目已提供 Docker 配置：

```bash
# 修改 docker-compose.yml 端口映射为 15000
# ports: "15000:15000"
# environment: PORT=15000

docker-compose up -d --build

# 查看状态
docker-compose ps
docker-compose logs -f
```

> 推荐使用 PM2 部署，便于与 Nginx + Certbot 配合。
