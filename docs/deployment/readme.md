# DailyHotApi 部署文档

> 版本: v1.0 | 更新时间: 2026-03-01

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
│  └─ 缓存: Redis + NodeCache                       │
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

### 3.1 拉取代码

```bash
cd /var/www
git clone <仓库地址> dailyhot-api
cd dailyhot-api
```

### 3.2 安装依赖 & 构建

```bash
pnpm install
pnpm run build
```

### 3.3 配置环境变量

```bash
cp .env.example .env
vim .env
```

修改以下配置：

```env
PORT=15000

ALLOWED_DOMAIN="*"
ALLOWED_HOST=""

REDIS_HOST="127.0.0.1"
REDIS_PORT=6379
REDIS_PASSWORD=""
REDIS_DB=0

CACHE_TTL=3600
REQUEST_TIMEOUT=6000
USE_LOG_FILE=true
RSS_MODE=false
DISALLOW_ROBOT=true
```

### 3.4 更新 PM2 配置

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

### 3.5 启动服务

```bash
# 启动
pm2 start ecosystem.config.cjs

# 验证
curl http://localhost:15000/bilibili | head -c 200

# 设置开机自启
pm2 startup
pm2 save
```

### 3.6 配置 Nginx + SSL

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

### 3.7 DNS 配置

在域名 DNS 管理中添加 A 记录：

| 记录类型 | 主机记录 | 记录值 |
|---------|---------|--------|
| A | dailyhot | 115.190.207.149 |

### 3.8 验证

```bash
# HTTPS 访问
curl https://dailyhot.runfast.xyz/weibo | head -c 200

# 查看所有平台
curl https://dailyhot.runfast.xyz/all
```

---

## 4. 更新部署

```bash
cd /var/www/dailyhot-api

# 方式一：使用 deploy.sh
bash deploy.sh

# 方式二：手动
git pull
pnpm install
pnpm run build
pm2 restart daily-hot
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
# API 健康检查
curl -s https://dailyhot.runfast.xyz/bilibili | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f'Status: {d[\"code\"]}, Items: {d[\"total\"]}, Cache: {d[\"fromCache\"]}')
"

# PM2 进程状态
pm2 show daily-hot

# Nginx 状态
curl -I https://dailyhot.runfast.xyz/weibo

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
├── logs/                       # 运行日志
├── .env                        # 环境配置
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

### SSL 证书过期

```bash
# 检查过期时间
sudo certbot certificates

# 手动续期
sudo certbot renew
sudo nginx -s reload
```

---

## 10. Docker 部署（备选方案）

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
