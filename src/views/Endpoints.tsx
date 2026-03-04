import type { FC } from "hono/jsx";
import { css, Style } from "hono/css";

// 56 个平台数据（来自 docs/api/endpoints.md）
const platforms = [
  { route: "/weibo", name: "微博", region: "国内", category: "社交媒体、热搜", hasType: false },
  { route: "/zhihu", name: "知乎", region: "国内", category: "问答社区、知识分享", hasType: false },
  { route: "/zhihu-daily", name: "知乎日报", region: "国内", category: "深度阅读、每日推荐", hasType: false },
  { route: "/baidu", name: "百度", region: "国内", category: "搜索引擎、综合热搜", hasType: true },
  { route: "/douyin", name: "抖音", region: "国内", category: "短视频、娱乐", hasType: false },
  { route: "/kuaishou", name: "快手", region: "国内", category: "短视频、娱乐", hasType: false },
  { route: "/tieba", name: "百度贴吧", region: "国内", category: "社区论坛、兴趣讨论", hasType: false },
  { route: "/toutiao", name: "今日头条", region: "国内", category: "新闻聚合、信息流", hasType: false },
  { route: "/bilibili", name: "哔哩哔哩", region: "国内", category: "视频平台、ACG文化", hasType: true },
  { route: "/acfun", name: "AcFun", region: "国内", category: "视频平台、弹幕", hasType: true },
  { route: "/github", name: "GitHub", region: "国外", category: "开源代码、开发者社区", hasType: true },
  { route: "/hellogithub", name: "HelloGitHub", region: "国内", category: "开源项目推荐", hasType: true },
  { route: "/hackernews", name: "Hacker News", region: "国外", category: "科技新闻、创业", hasType: false },
  { route: "/producthunt", name: "Product Hunt", region: "国外", category: "新产品发现、创业", hasType: false },
  { route: "/juejin", name: "稀土掘金", region: "国内", category: "开发者技术社区", hasType: true },
  { route: "/csdn", name: "CSDN", region: "国内", category: "开发者技术博客", hasType: false },
  { route: "/51cto", name: "51CTO", region: "国内", category: "IT 技术运维", hasType: false },
  { route: "/v2ex", name: "V2EX", region: "国内", category: "开发者/创意工作者社区", hasType: true },
  { route: "/nodeseek", name: "NodeSeek", region: "国内", category: "VPS/主机讨论", hasType: false },
  { route: "/linuxdo", name: "Linux.do", region: "国内", category: "Linux/技术社区", hasType: false },
  { route: "/52pojie", name: "吾爱破解", region: "国内", category: "逆向工程、安全技术", hasType: true },
  { route: "/hostloc", name: "全球主机交流", region: "国内", category: "VPS/服务器讨论", hasType: true },
  { route: "/sina", name: "新浪", region: "国内", category: "综合门户、热榜", hasType: true },
  { route: "/sina-news", name: "新浪新闻", region: "国内", category: "综合新闻", hasType: true },
  { route: "/netease-news", name: "网易新闻", region: "国内", category: "综合新闻", hasType: false },
  { route: "/qq-news", name: "腾讯新闻", region: "国内", category: "综合新闻", hasType: false },
  { route: "/thepaper", name: "澎湃新闻", region: "国内", category: "时政新闻、深度报道", hasType: false },
  { route: "/36kr", name: "36氪", region: "国内", category: "创投、商业科技", hasType: true },
  { route: "/nytimes", name: "纽约时报", region: "国外", category: "国际新闻、深度报道", hasType: true },
  { route: "/huxiu", name: "虎嗅", region: "国内", category: "商业科技、深度分析", hasType: false },
  { route: "/ifanr", name: "爱范儿", region: "国内", category: "消费科技、数码", hasType: false },
  { route: "/geekpark", name: "极客公园", region: "国内", category: "科技创新、互联网", hasType: false },
  { route: "/ithome", name: "IT之家", region: "国内", category: "IT 数码新闻", hasType: false },
  { route: "/ithome-xijiayi", name: "IT之家「喜加一」", region: "国内", category: "免费游戏资讯", hasType: false },
  { route: "/sspai", name: "少数派", region: "国内", category: "效率工具、数字生活", hasType: true },
  { route: "/weread", name: "微信读书", region: "国内", category: "电子书、阅读排行", hasType: true },
  { route: "/jianshu", name: "简书", region: "国内", category: "写作社区、博客", hasType: false },
  { route: "/guokr", name: "果壳", region: "国内", category: "科普知识", hasType: false },
  { route: "/douban-movie", name: "豆瓣电影", region: "国内", category: "电影评分、影评", hasType: false },
  { route: "/douban-group", name: "豆瓣小组", region: "国内", category: "兴趣小组、生活讨论", hasType: false },
  { route: "/smzdm", name: "什么值得买", region: "国内", category: "消费决策、优惠信息", hasType: true },
  { route: "/dgtle", name: "数字尾巴", region: "国内", category: "数码科技、生活方式", hasType: false },
  { route: "/hupu", name: "虎扑", region: "国内", category: "体育、社区论坛", hasType: true },
  { route: "/coolapk", name: "酷安", region: "国内", category: "Android 应用、数码", hasType: false },
  { route: "/ngabbs", name: "NGA", region: "国内", category: "游戏玩家社区", hasType: false },
  { route: "/newsmth", name: "水木社区", region: "国内", category: "高校/高知社群论坛", hasType: false },
  { route: "/lol", name: "英雄联盟", region: "国内", category: "游戏官方公告", hasType: false },
  { route: "/miyoushe", name: "米游社", region: "国内", category: "米哈游游戏社区", hasType: true },
  { route: "/genshin", name: "原神", region: "国内", category: "游戏官方资讯", hasType: true },
  { route: "/honkai", name: "崩坏3", region: "国内", category: "游戏官方资讯", hasType: true },
  { route: "/starrail", name: "崩坏：星穹铁道", region: "国内", category: "游戏官方资讯", hasType: true },
  { route: "/gameres", name: "GameRes 游资网", region: "国内", category: "游戏行业资讯", hasType: false },
  { route: "/yystv", name: "游研社", region: "国内", category: "游戏文化、评测", hasType: false },
  { route: "/weatheralarm", name: "中央气象台", region: "国内", category: "气象灾害预警", hasType: true },
  { route: "/earthquake", name: "中国地震台", region: "国内", category: "地震速报", hasType: false },
  { route: "/history", name: "历史上的今天", region: "国内", category: "历史事件", hasType: false },
];

const Endpoints: FC = () => {
  const pageClass = css`
    :-hono-global {
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      :root {
        --text-color: #333;
        --bg-color: #fff;
        --border-color: #e5e7eb;
        --header-bg: #f9fafb;
        --hover-bg: #f3f4f6;
        --link-color: #2563eb;
        --tag-bg: #dbeafe;
        --tag-color: #1d4ed8;
      }
      @media (prefers-color-scheme: dark) {
        :root {
          --text-color: #e5e7eb;
          --bg-color: #1f2937;
          --border-color: #374151;
          --header-bg: #111827;
          --hover-bg: #374151;
          --link-color: #60a5fa;
          --tag-bg: #1e3a5f;
          --tag-color: #93c5fd;
        }
      }
      body {
        font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
        background-color: var(--bg-color);
        color: var(--text-color);
        padding: 40px 20px;
        max-width: 1100px;
        margin: 0 auto;
      }
      h1 {
        font-size: 24px;
        margin-bottom: 6px;
      }
      .subtitle {
        color: #9ca3af;
        font-size: 14px;
        margin-bottom: 24px;
      }
      .back-link {
        display: inline-block;
        margin-bottom: 20px;
        color: var(--link-color);
        text-decoration: none;
        font-size: 14px;
      }
      .back-link:hover {
        text-decoration: underline;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
      }
      thead th {
        background-color: var(--header-bg);
        text-align: left;
        padding: 10px 12px;
        border-bottom: 2px solid var(--border-color);
        font-weight: 600;
        white-space: nowrap;
      }
      tbody tr {
        border-bottom: 1px solid var(--border-color);
      }
      tbody tr:hover {
        background-color: var(--hover-bg);
      }
      tbody td {
        padding: 8px 12px;
      }
      td.route-cell {
        font-family: "SF Mono", "Menlo", monospace;
        font-size: 13px;
      }
      td.route-cell a {
        color: var(--link-color);
        text-decoration: none;
      }
      td.route-cell a:hover {
        text-decoration: underline;
      }
      .tag {
        display: inline-block;
        background-color: var(--tag-bg);
        color: var(--tag-color);
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 12px;
      }
      .check {
        text-align: center;
      }
    }
  `;

  return (
    <html lang="zh-CN">
      <head>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta charset="utf-8" />
        <title>DailyHot API - 平台接口列表</title>
        <link rel="icon" href="/favicon.ico" />
        <Style>{pageClass}</Style>
      </head>
      <body>
        <a href="/" className="back-link">&larr; 返回首页</a>
        <h1>平台接口列表</h1>
        <p className="subtitle">共 {platforms.length} 个平台 | 所有接口均为 GET 请求</p>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>路由</th>
              <th>平台名称</th>
              <th>地区</th>
              <th>领域</th>
              <th>有 type 参数</th>
            </tr>
          </thead>
          <tbody>
            {platforms.map((p, i) => (
              <tr>
                <td>{i + 1}</td>
                <td className="route-cell">
                  <a href={p.route} target="_blank">{p.route}</a>
                </td>
                <td>{p.name}</td>
                <td><span className="tag">{p.region}</span></td>
                <td>{p.category}</td>
                <td className="check">{p.hasType ? "✓" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </body>
    </html>
  );
};

export default Endpoints;
