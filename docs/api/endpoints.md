# 平台接口列表

> 版本: v1.1 | 更新时间: 2026-03-02
>
> 基础地址: `http://localhost:15000`
> 所有接口均为 `GET` 请求
> 生产环境需携带 `X-API-Key` Header 鉴权
> 通用参数见 [query-params.md](./query-params.md)

---

## 平台总览（56 个）

| # | 路由 | 平台名称 | 地区 | 领域 | 有 type 参数 |
|---|------|---------|------|------|:---:|
| 1 | `/weibo` | 微博 | 国内 | 社交媒体、热搜 | |
| 2 | `/zhihu` | 知乎 | 国内 | 问答社区、知识分享 | |
| 3 | `/zhihu-daily` | 知乎日报 | 国内 | 深度阅读、每日推荐 | |
| 4 | `/baidu` | 百度 | 国内 | 搜索引擎、综合热搜 | ✓ |
| 5 | `/douyin` | 抖音 | 国内 | 短视频、娱乐 | |
| 6 | `/kuaishou` | 快手 | 国内 | 短视频、娱乐 | |
| 7 | `/tieba` | 百度贴吧 | 国内 | 社区论坛、兴趣讨论 | |
| 8 | `/toutiao` | 今日头条 | 国内 | 新闻聚合、信息流 | |
| 9 | `/bilibili` | 哔哩哔哩 | 国内 | 视频平台、ACG文化 | ✓ |
| 10 | `/acfun` | AcFun | 国内 | 视频平台、弹幕 | ✓ |
| 11 | `/github` | GitHub | 国外 | 开源代码、开发者社区 | ✓ |
| 12 | `/hellogithub` | HelloGitHub | 国内 | 开源项目推荐 | ✓ |
| 13 | `/hackernews` | Hacker News | 国外 | 科技新闻、创业 | |
| 14 | `/producthunt` | Product Hunt | 国外 | 新产品发现、创业 | |
| 15 | `/juejin` | 稀土掘金 | 国内 | 开发者技术社区 | ✓ |
| 16 | `/csdn` | CSDN | 国内 | 开发者技术博客 | |
| 17 | `/51cto` | 51CTO | 国内 | IT 技术运维 | |
| 18 | `/v2ex` | V2EX | 国内 | 开发者/创意工作者社区 | ✓ |
| 19 | `/nodeseek` | NodeSeek | 国内 | VPS/主机讨论 | |
| 20 | `/linuxdo` | Linux.do | 国内 | Linux/技术社区 | |
| 21 | `/52pojie` | 吾爱破解 | 国内 | 逆向工程、安全技术 | ✓ |
| 22 | `/hostloc` | 全球主机交流 | 国内 | VPS/服务器讨论 | ✓ |
| 23 | `/sina` | 新浪 | 国内 | 综合门户、热榜 | ✓ |
| 24 | `/sina-news` | 新浪新闻 | 国内 | 综合新闻 | ✓ |
| 25 | `/netease-news` | 网易新闻 | 国内 | 综合新闻 | |
| 26 | `/qq-news` | 腾讯新闻 | 国内 | 综合新闻 | |
| 27 | `/thepaper` | 澎湃新闻 | 国内 | 时政新闻、深度报道 | |
| 28 | `/36kr` | 36氪 | 国内 | 创投、商业科技 | ✓ |
| 29 | `/nytimes` | 纽约时报 | 国外 | 国际新闻、深度报道 | ✓ |
| 30 | `/huxiu` | 虎嗅 | 国内 | 商业科技、深度分析 | |
| 31 | `/ifanr` | 爱范儿 | 国内 | 消费科技、数码 | |
| 32 | `/geekpark` | 极客公园 | 国内 | 科技创新、互联网 | |
| 33 | `/ithome` | IT之家 | 国内 | IT 数码新闻 | |
| 34 | `/ithome-xijiayi` | IT之家「喜加一」 | 国内 | 免费游戏资讯 | |
| 35 | `/sspai` | 少数派 | 国内 | 效率工具、数字生活 | ✓ |
| 36 | `/weread` | 微信读书 | 国内 | 电子书、阅读排行 | ✓ |
| 37 | `/jianshu` | 简书 | 国内 | 写作社区、博客 | |
| 38 | `/guokr` | 果壳 | 国内 | 科普知识 | |
| 39 | `/douban-movie` | 豆瓣电影 | 国内 | 电影评分、影评 | |
| 40 | `/douban-group` | 豆瓣小组 | 国内 | 兴趣小组、生活讨论 | |
| 41 | `/smzdm` | 什么值得买 | 国内 | 消费决策、优惠信息 | ✓ |
| 42 | `/dgtle` | 数字尾巴 | 国内 | 数码科技、生活方式 | |
| 43 | `/hupu` | 虎扑 | 国内 | 体育、社区论坛 | ✓ |
| 44 | `/coolapk` | 酷安 | 国内 | Android 应用、数码 | |
| 45 | `/ngabbs` | NGA | 国内 | 游戏玩家社区 | |
| 46 | `/newsmth` | 水木社区 | 国内 | 高校/高知社群论坛 | |
| 47 | `/lol` | 英雄联盟 | 国内 | 游戏官方公告 | |
| 48 | `/miyoushe` | 米游社 | 国内 | 米哈游游戏社区 | ✓ |
| 49 | `/genshin` | 原神 | 国内 | 游戏官方资讯 | ✓ |
| 50 | `/honkai` | 崩坏3 | 国内 | 游戏官方资讯 | ✓ |
| 51 | `/starrail` | 崩坏：星穹铁道 | 国内 | 游戏官方资讯 | ✓ |
| 52 | `/gameres` | GameRes 游资网 | 国内 | 游戏行业资讯 | |
| 53 | `/yystv` | 游研社 | 国内 | 游戏文化、评测 | |
| 54 | `/weatheralarm` | 中央气象台 | 国内 | 气象灾害预警 | ✓ |
| 55 | `/earthquake` | 中国地震台 | 国内 | 地震速报 | |
| 56 | `/history` | 历史上的今天 | 国内 | 历史事件 | |

**按领域分类统计**：

| 领域 | 数量 | 平台 |
|------|:---:|------|
| 社交媒体/热搜 | 6 | 微博、百度、抖音、快手、贴吧、头条 |
| 新闻资讯 | 10 | 新浪、新浪新闻、网易、腾讯、澎湃、36氪、纽约时报、虎嗅、爱范儿、极客公园 |
| 科技/开发 | 11 | GitHub、HelloGitHub、Hacker News、Product Hunt、掘金、CSDN、51CTO、V2EX、NodeSeek、Linux.do、IT之家 |
| 视频平台 | 2 | B站、AcFun |
| 社区论坛 | 6 | 知乎、吾爱破解、全球主机交流、虎扑、酷安、水木社区 |
| 阅读/生活 | 7 | 知乎日报、少数派、微信读书、简书、果壳、豆瓣电影、豆瓣小组 |
| 购物消费 | 2 | 什么值得买、数字尾巴 |
| 游戏 | 8 | 英雄联盟、米游社、原神、崩坏3、星穹铁道、NGA、GameRes、游研社 |
| 信息工具 | 4 | IT之家喜加一、气象预警、地震台、历史上的今天 |

---

## 综合/社交

### 微博 `/weibo`

微博热搜榜，实时更新。

```bash
GET /weibo
```

无额外参数。可通过 `.env` 设置 `FILTER_WEIBO_ADVERTISEMENT=true` 过滤广告。

---

### 知乎 `/zhihu`

知乎热榜。

```bash
GET /zhihu
```

可通过 `.env` 设置 `ZHIHU_COOKIE` 提升数据质量。

---

### 知乎日报 `/zhihu-daily`

知乎日报推荐。

```bash
GET /zhihu-daily
```

---

### 百度 `/baidu`

百度热搜榜。

```bash
GET /baidu
GET /baidu?type=novel
```

| type 值 | 说明 |
|---------|------|
| `realtime` | 实时热搜（默认） |
| `novel` | 小说热搜 |
| `movie` | 电影热搜 |
| `teleplay` | 电视剧热搜 |
| `car` | 汽车热搜 |
| `game` | 游戏热搜 |

---

### 抖音 `/douyin`

抖音热榜。

```bash
GET /douyin
```

---

### 快手 `/kuaishou`

快手热榜。

```bash
GET /kuaishou
```

---

### 百度贴吧 `/tieba`

百度贴吧热议。

```bash
GET /tieba
```

---

### 今日头条 `/toutiao`

今日头条热榜。

```bash
GET /toutiao
```

---

## 视频平台

### 哔哩哔哩 `/bilibili`

B站排行榜，支持分区筛选。需要 WBI 签名（自动处理）。

```bash
GET /bilibili
GET /bilibili?type=4
```

| type 值 | 说明 |
|---------|------|
| `0` | 全站（默认） |
| `1` | 动画 |
| `3` | 音乐 |
| `4` | 游戏 |
| `5` | 娱乐 |
| `188` | 科技 |
| `119` | 鬼畜 |
| `129` | 舞蹈 |
| `155` | 时尚 |
| `160` | 生活 |
| `168` | 国创相关 |
| `181` | 影视 |

---

### AcFun `/acfun`

AcFun 排行榜，支持频道和时间筛选。

```bash
GET /acfun
GET /acfun?type=59&range=7days
```

**type（频道）：**

| type 值 | 说明 |
|---------|------|
| `-1` | 综合（默认） |
| `155` | 番剧 |
| `1` | 动画 |
| `60` | 娱乐 |
| `201` | 生活 |
| `58` | 音乐 |
| `123` | 舞蹈·偶像 |
| `59` | 游戏 |
| `70` | 科技 |
| `68` | 影视 |
| `69` | 体育 |
| `125` | 鱼塘 |

**range（时间范围）：**

| range 值 | 说明 |
|---------|------|
| `24hr` | 24小时 |
| `7days` | 7天 |
| `30days` | 30天 |

---

## 科技/开发

### GitHub Trending `/github`

GitHub 趋势项目。

```bash
GET /github
GET /github?type=weekly
```

| type 值 | 说明 |
|---------|------|
| `daily` | 日榜（默认） |
| `weekly` | 周榜 |
| `monthly` | 月榜 |

额外返回字段: `language`, `stars`, `forks`, `owner`, `repo`

---

### HelloGitHub `/hellogithub`

HelloGitHub 开源项目推荐。

```bash
GET /hellogithub
GET /hellogithub?sort=all
```

| sort 值 | 说明 |
|---------|------|
| `featured` | 精选（默认） |
| `all` | 全部 |

---

### Hacker News `/hackernews`

Hacker News 热门。

```bash
GET /hackernews
```

---

### Product Hunt `/producthunt`

Product Hunt 每日产品。

```bash
GET /producthunt
```

---

### 稀土掘金 `/juejin`

掘金文章排行榜，支持分区筛选。

```bash
GET /juejin
GET /juejin?type=6809637767543259144
```

type 值为掘金分区 ID，接口会动态返回可用分区列表（通过响应中的 `params` 字段）。

---

### CSDN `/csdn`

CSDN 热门排行。

```bash
GET /csdn
```

---

### 51CTO `/51cto`

51CTO 推荐内容。

```bash
GET /51cto
```

---

### V2EX `/v2ex`

V2EX 话题排行。

```bash
GET /v2ex
GET /v2ex?type=latest
```

| type 值 | 说明 |
|---------|------|
| `hot` | 热门主题（默认） |
| `latest` | 最新主题 |

---

### NodeSeek `/nodeseek`

NodeSeek 最新帖子。

```bash
GET /nodeseek
```

---

### Linux.do `/linuxdo`

Linux.do 热门帖子。

```bash
GET /linuxdo
```

---

### 吾爱破解 `/52pojie`

吾爱破解论坛热帖。

```bash
GET /52pojie
GET /52pojie?type=new
```

| type 值 | 说明 |
|---------|------|
| `digest` | 最新精华（默认） |
| `hot` | 最新热门 |
| `new` | 最新回复 |

---

### 全球主机交流 `/hostloc`

HostLoc 论坛帖子。

```bash
GET /hostloc
GET /hostloc?type=digest
```

| type 值 | 说明 |
|---------|------|
| `hot` | 最新热门（默认） |
| `digest` | 最新精华 |
| `new` | 最新回复 |
| `newthread` | 最新发表 |

---

## 新闻资讯

### 新浪 `/sina`

新浪热榜，支持多个分类。

```bash
GET /sina
GET /sina?type=ent
```

| type 值 | 说明 |
|---------|------|
| `all` | 新浪热榜（默认） |
| `hotcmnt` | 热议榜 |
| `minivideo` | 视频热榜 |
| `ent` | 娱乐热榜 |
| `ai` | AI热榜 |
| `auto` | 汽车热榜 |
| `mother` | 育儿热榜 |
| `fashion` | 时尚热榜 |
| `travel` | 旅游热榜 |
| `esg` | ESG热榜 |

---

### 新浪新闻 `/sina-news`

新浪新闻排行榜，多分类。

```bash
GET /sina-news
GET /sina-news?type=7
```

| type 值 | 说明 |
|---------|------|
| `1` | 总排行（默认） |
| `2` | 视频排行 |
| `3` | 图片排行 |
| `4` | 国内新闻 |
| `5` | 国际新闻 |
| `6` | 社会新闻 |
| `7` | 体育新闻 |
| `8` | 财经新闻 |
| `9` | 娱乐新闻 |
| `10` | 科技新闻 |
| `11` | 军事新闻 |

---

### 网易新闻 `/netease-news`

网易新闻热点。

```bash
GET /netease-news
```

---

### 腾讯新闻 `/qq-news`

腾讯新闻热点。

```bash
GET /qq-news
```

---

### 澎湃新闻 `/thepaper`

澎湃新闻热榜。

```bash
GET /thepaper
```

---

### 36氪 `/36kr`

36氪热榜，多排行类型。

```bash
GET /36kr
GET /36kr?type=video
```

| type 值 | 说明 |
|---------|------|
| `hot` | 人气榜（默认） |
| `video` | 视频榜 |
| `comment` | 热议榜 |
| `collect` | 收藏榜 |

---

### 纽约时报 `/nytimes`

纽约时报，支持中文网和全球版。

```bash
GET /nytimes
GET /nytimes?type=global
```

| type 值 | 说明 |
|---------|------|
| `china` | 中文网（默认） |
| `global` | 全球版 |

---

### 虎嗅 `/huxiu`

虎嗅 24 小时热文。

```bash
GET /huxiu
```

---

### 爱范儿 `/ifanr`

爱范儿热门资讯。

```bash
GET /ifanr
```

---

### 极客公园 `/geekpark`

极客公园最新资讯。

```bash
GET /geekpark
```

---

### IT之家 `/ithome`

IT之家热门新闻。

```bash
GET /ithome
```

---

### IT之家「喜加一」 `/ithome-xijiayi`

IT之家免费游戏资讯。

```bash
GET /ithome-xijiayi
```

---

## 生活/阅读

### 少数派 `/sspai`

少数派文章推荐，支持分类。

```bash
GET /sspai
GET /sspai?type=应用推荐
```

| type 值 | 说明 |
|---------|------|
| `热门文章` | 热门文章（默认） |
| `应用推荐` | 应用推荐 |
| `生活方式` | 生活方式 |
| `效率技巧` | 效率技巧 |
| `少数派播客` | 少数派播客 |

> type 值为中文，需 URL 编码：`?type=%E5%BA%94%E7%94%A8%E6%8E%A8%E8%8D%90`

---

### 微信读书 `/weread`

微信读书排行榜。

```bash
GET /weread
GET /weread?type=general_book_rising_list
```

| type 值 | 说明 |
|---------|------|
| `rising` | 飙升榜（默认） |
| `general_book_rising_list` | 总榜飙升 |

---

### 简书 `/jianshu`

简书热门文章。

```bash
GET /jianshu
```

---

### 果壳 `/guokr`

果壳科普文章。

```bash
GET /guokr
```

---

### 豆瓣电影 `/douban-movie`

豆瓣新片排行。

```bash
GET /douban-movie
```

---

### 豆瓣讨论小组 `/douban-group`

豆瓣小组热门讨论。

```bash
GET /douban-group
```

---

### 什么值得买 `/smzdm`

什么值得买热门文章。

```bash
GET /smzdm
GET /smzdm?type=7
```

| type 值 | 说明 |
|---------|------|
| `1` | 今日热门（默认） |
| `7` | 周热门 |
| `30` | 月热门 |

---

### 数字尾巴 `/dgtle`

数字尾巴热门资讯。

```bash
GET /dgtle
```

---

## 社区/论坛

### 虎扑 `/hupu`

虎扑热帖，支持多板块。

```bash
GET /hupu
GET /hupu?type=6
```

| type 值 | 说明 |
|---------|------|
| `1` | 主干道（默认） |
| `6` | 恋爱区 |
| `11` | 校园区 |
| `12` | 历史区 |
| `612` | 摄影区 |

---

### 酷安 `/coolapk`

酷安热榜（需自动认证）。

```bash
GET /coolapk
```

---

### NGA `/ngabbs`

NGA 玩家社区热帖。

```bash
GET /ngabbs
```

---

### 水木社区 `/newsmth`

水木社区热门帖子。

```bash
GET /newsmth
```

---

## 游戏

### 英雄联盟 `/lol`

LOL 更新公告。

```bash
GET /lol
```

---

### 米游社 `/miyoushe`

米游社最新资讯，支持游戏分类。

```bash
GET /miyoushe
GET /miyoushe?type=2
```

| type 值 | 说明 |
|---------|------|
| `1` | 崩坏3（默认） |
| `2` | 原神 |
| `3` | 崩坏学园2 |
| `4` | 未定事件簿 |
| `5` | 大别野 |
| `6` | 崩坏：星穹铁道 |
| `8` | 绝区零 |

---

### 原神 `/genshin`

原神官方资讯。

```bash
GET /genshin
GET /genshin?type=2
```

| type 值 | 说明 |
|---------|------|
| `1` | 公告（默认） |
| `2` | 活动 |
| `3` | 资讯 |

---

### 崩坏3 `/honkai`

崩坏3 官方资讯。

```bash
GET /honkai
GET /honkai?type=2
```

| type 值 | 说明 |
|---------|------|
| `1` | 公告（默认） |
| `2` | 活动 |
| `3` | 资讯 |

---

### 崩坏：星穹铁道 `/starrail`

星穹铁道官方资讯。

```bash
GET /starrail
GET /starrail?type=2
```

| type 值 | 说明 |
|---------|------|
| `1` | 公告（默认） |
| `2` | 活动 |
| `3` | 资讯 |

---

### GameRes 游资网 `/gameres`

GameRes 游戏行业资讯。

```bash
GET /gameres
```

---

### 游研社 `/yystv`

游研社热门资讯。

```bash
GET /yystv
```

---

## 信息/工具

### 中央气象台预警 `/weatheralarm`

气象预警信息，支持按省份筛选。

```bash
GET /weatheralarm
GET /weatheralarm?province=广东省
```

| 参数 | 说明 |
|------|------|
| `province` | 省份名称，如"广东省"、"北京市"（需 URL 编码） |

---

### 中国地震台 `/earthquake`

最新地震信息。

```bash
GET /earthquake
```

---

### 历史上的今天 `/history`

历史上今天发生的事件。

```bash
GET /history
```
