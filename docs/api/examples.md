# 使用示例

> 以下示例均以 `http://localhost:15000` 为基础地址。

## cURL

```bash
# 微博热搜
curl http://localhost:15000/weibo

# B站游戏区 Top 10
curl "http://localhost:15000/bilibili?type=4&limit=10"

# GitHub 周趋势 RSS
curl "http://localhost:15000/github?type=weekly&rss=true"

# 强制刷新百度热搜
curl "http://localhost:15000/baidu?cache=false"

# 查看所有可用平台
curl http://localhost:15000/all
```

## JavaScript / TypeScript

### Fetch API

```typescript
// 获取微博热搜
const res = await fetch('http://localhost:15000/weibo');
const data = await res.json();

console.log(`共 ${data.total} 条热搜`);
data.data.forEach((item, i) => {
  console.log(`${i + 1}. ${item.title} - ${item.url}`);
});
```

### Axios

```typescript
import axios from 'axios';

const BASE_URL = 'http://localhost:15000';

// 获取B站排行
const { data } = await axios.get(`${BASE_URL}/bilibili`, {
  params: { type: '0', limit: 20 }
});

console.log(`${data.title} - ${data.type}`);
console.log(`更新时间: ${data.updateTime}`);
console.log(`缓存: ${data.fromCache ? '是' : '否'}`);

data.data.forEach(item => {
  console.log(`[${item.hot}] ${item.title}`);
});
```

### 封装工具函数

```typescript
const API_BASE = 'http://localhost:15000';

interface HotItem {
  id: string | number;
  title: string;
  desc?: string;
  cover?: string;
  author?: string;
  hot?: number;
  timestamp?: number;
  url: string;
  mobileUrl: string;
}

interface HotListResponse {
  code: number;
  name: string;
  title: string;
  type: string;
  total: number;
  updateTime: string;
  fromCache: boolean;
  data: HotItem[];
}

async function getHotList(
  platform: string,
  options?: { type?: string; limit?: number; cache?: boolean }
): Promise<HotListResponse> {
  const params = new URLSearchParams();
  if (options?.type) params.set('type', options.type);
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.cache === false) params.set('cache', 'false');

  const url = `${API_BASE}/${platform}?${params}`;
  const res = await fetch(url);
  return res.json();
}

// 使用
const weibo = await getHotList('weibo', { limit: 10 });
const bili = await getHotList('bilibili', { type: '4', cache: false });
const github = await getHotList('github', { type: 'weekly' });
```

## Python

```python
import requests

BASE_URL = "http://localhost:15000"

# 获取微博热搜
res = requests.get(f"{BASE_URL}/weibo")
data = res.json()

print(f"共 {data['total']} 条热搜 (缓存: {data['fromCache']})")
for i, item in enumerate(data["data"][:10], 1):
    print(f"{i}. {item['title']} - {item['url']}")
```

```python
# 带参数请求
res = requests.get(f"{BASE_URL}/bilibili", params={
    "type": "4",      # 游戏区
    "limit": "10",    # 前 10 条
    "cache": "false",  # 不使用缓存
})
data = res.json()

for item in data["data"]:
    print(f"[{item.get('hot', 'N/A')}] {item['title']}")
```

## 批量获取多平台

```typescript
// 并发获取多个平台热榜
const platforms = ['weibo', 'zhihu', 'bilibili', 'douyin', 'baidu'];

const results = await Promise.all(
  platforms.map(p => fetch(`http://localhost:15000/${p}`).then(r => r.json()))
);

results.forEach(data => {
  console.log(`\n=== ${data.title} (${data.type}) ===`);
  data.data.slice(0, 5).forEach((item, i) => {
    console.log(`  ${i + 1}. ${item.title}`);
  });
});
```

## RSS 订阅

所有接口都支持 RSS 输出，适用于 RSS 阅读器：

```
# 微博热搜 RSS
http://localhost:15000/weibo?rss=true

# GitHub 日趋势 RSS
http://localhost:15000/github?rss=true

# 知乎热榜 RSS
http://localhost:15000/zhihu?rss=true
```

在 RSS 阅读器（如 Inoreader、Feedly、NetNewsWire）中直接添加以上 URL 即可订阅。

## 获取所有可用平台

```typescript
const res = await fetch('http://localhost:15000/all');
const { routes, count } = await res.json();

console.log(`共 ${count} 个平台:`);
routes.forEach(route => {
  console.log(`  ${route.name} → http://localhost:15000${route.path}`);
});
```
