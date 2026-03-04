import type { FC } from "hono/jsx";
import { css, Style } from "hono/css";

// 56 个平台数据（来自 docs/api/endpoints.md）
const platforms = [
  { route: "/weibo", name: "微博", region: "国内", category: "社交媒体、热搜", typeInfo: "" },
  { route: "/zhihu", name: "知乎", region: "国内", category: "问答社区、知识分享", typeInfo: "" },
  { route: "/zhihu-daily", name: "知乎日报", region: "国内", category: "深度阅读、每日推荐", typeInfo: "" },
  { route: "/baidu", name: "百度", region: "国内", category: "搜索引擎、综合热搜", typeInfo: "realtime(默认) | novel(小说) | movie(电影) | teleplay(电视剧) | car(汽车) | game(游戏)" },
  { route: "/douyin", name: "抖音", region: "国内", category: "短视频、娱乐", typeInfo: "" },
  { route: "/kuaishou", name: "快手", region: "国内", category: "短视频、娱乐", typeInfo: "" },
  { route: "/tieba", name: "百度贴吧", region: "国内", category: "社区论坛、兴趣讨论", typeInfo: "" },
  { route: "/toutiao", name: "今日头条", region: "国内", category: "新闻聚合、信息流", typeInfo: "" },
  { route: "/bilibili", name: "哔哩哔哩", region: "国内", category: "视频平台、ACG文化", typeInfo: "0(全站,默认) | 1(动画) | 3(音乐) | 4(游戏) | 5(娱乐) | 188(科技) | 119(鬼畜) | 129(舞蹈) | 155(时尚) | 160(生活) | 168(国创) | 181(影视)" },
  { route: "/acfun", name: "AcFun", region: "国内", category: "视频平台、弹幕", typeInfo: "type: -1(综合,默认) | 155(番剧) | 1(动画) | 60(娱乐) | 201(生活) | 58(音乐) | 123(舞蹈) | 59(游戏) | 70(科技) | 68(影视) | 69(体育) | 125(鱼塘)；range: 24hr | 7days | 30days" },
  { route: "/github", name: "GitHub", region: "国外", category: "开源代码、开发者社区", typeInfo: "daily(默认) | weekly | monthly" },
  { route: "/hellogithub", name: "HelloGitHub", region: "国内", category: "开源项目推荐", typeInfo: "sort: featured(默认) | all" },
  { route: "/hackernews", name: "Hacker News", region: "国外", category: "科技新闻、创业", typeInfo: "" },
  { route: "/producthunt", name: "Product Hunt", region: "国外", category: "新产品发现、创业", typeInfo: "" },
  { route: "/juejin", name: "稀土掘金", region: "国内", category: "开发者技术社区", typeInfo: "分区 ID（动态返回可用分区列表）" },
  { route: "/csdn", name: "CSDN", region: "国内", category: "开发者技术博客", typeInfo: "" },
  { route: "/51cto", name: "51CTO", region: "国内", category: "IT 技术运维", typeInfo: "" },
  { route: "/v2ex", name: "V2EX", region: "国内", category: "开发者/创意工作者社区", typeInfo: "hot(默认) | latest" },
  { route: "/nodeseek", name: "NodeSeek", region: "国内", category: "VPS/主机讨论", typeInfo: "" },
  { route: "/linuxdo", name: "Linux.do", region: "国内", category: "Linux/技术社区", typeInfo: "" },
  { route: "/52pojie", name: "吾爱破解", region: "国内", category: "逆向工程、安全技术", typeInfo: "digest(默认) | hot | new" },
  { route: "/hostloc", name: "全球主机交流", region: "国内", category: "VPS/服务器讨论", typeInfo: "hot(默认) | digest | new | newthread" },
  { route: "/sina", name: "新浪", region: "国内", category: "综合门户、热榜", typeInfo: "all(默认) | hotcmnt | minivideo | ent | ai | auto | mother | fashion | travel | esg" },
  { route: "/sina-news", name: "新浪新闻", region: "国内", category: "综合新闻", typeInfo: "1(总排行,默认) | 2(视频) | 3(图片) | 4(国内) | 5(国际) | 6(社会) | 7(体育) | 8(财经) | 9(娱乐) | 10(科技) | 11(军事)" },
  { route: "/netease-news", name: "网易新闻", region: "国内", category: "综合新闻", typeInfo: "" },
  { route: "/qq-news", name: "腾讯新闻", region: "国内", category: "综合新闻", typeInfo: "" },
  { route: "/thepaper", name: "澎湃新闻", region: "国内", category: "时政新闻、深度报道", typeInfo: "" },
  { route: "/36kr", name: "36氪", region: "国内", category: "创投、商业科技", typeInfo: "hot(默认) | video | comment | collect" },
  { route: "/nytimes", name: "纽约时报", region: "国外", category: "国际新闻、深度报道", typeInfo: "china(中文网,默认) | global(全球版)" },
  { route: "/huxiu", name: "虎嗅", region: "国内", category: "商业科技、深度分析", typeInfo: "" },
  { route: "/ifanr", name: "爱范儿", region: "国内", category: "消费科技、数码", typeInfo: "" },
  { route: "/geekpark", name: "极客公园", region: "国内", category: "科技创新、互联网", typeInfo: "" },
  { route: "/ithome", name: "IT之家", region: "国内", category: "IT 数码新闻", typeInfo: "" },
  { route: "/ithome-xijiayi", name: "IT之家「喜加一」", region: "国内", category: "免费游戏资讯", typeInfo: "" },
  { route: "/sspai", name: "少数派", region: "国内", category: "效率工具、数字生活", typeInfo: "热门文章(默认) | 应用推荐 | 生活方式 | 效率技巧 | 少数派播客" },
  { route: "/weread", name: "微信读书", region: "国内", category: "电子书、阅读排行", typeInfo: "rising(默认) | general_book_rising_list(总榜飙升)" },
  { route: "/jianshu", name: "简书", region: "国内", category: "写作社区、博客", typeInfo: "" },
  { route: "/guokr", name: "果壳", region: "国内", category: "科普知识", typeInfo: "" },
  { route: "/douban-movie", name: "豆瓣电影", region: "国内", category: "电影评分、影评", typeInfo: "" },
  { route: "/douban-group", name: "豆瓣小组", region: "国内", category: "兴趣小组、生活讨论", typeInfo: "" },
  { route: "/smzdm", name: "什么值得买", region: "国内", category: "消费决策、优惠信息", typeInfo: "1(今日,默认) | 7(周热门) | 30(月热门)" },
  { route: "/dgtle", name: "数字尾巴", region: "国内", category: "数码科技、生活方式", typeInfo: "" },
  { route: "/hupu", name: "虎扑", region: "国内", category: "体育、社区论坛", typeInfo: "1(主干道,默认) | 6(恋爱) | 11(校园) | 12(历史) | 612(摄影)" },
  { route: "/coolapk", name: "酷安", region: "国内", category: "Android 应用、数码", typeInfo: "" },
  { route: "/ngabbs", name: "NGA", region: "国内", category: "游戏玩家社区", typeInfo: "" },
  { route: "/newsmth", name: "水木社区", region: "国内", category: "高校/高知社群论坛", typeInfo: "" },
  { route: "/lol", name: "英雄联盟", region: "国内", category: "游戏官方公告", typeInfo: "" },
  { route: "/miyoushe", name: "米游社", region: "国内", category: "米哈游游戏社区", typeInfo: "1(崩坏3,默认) | 2(原神) | 3(崩坏学园2) | 4(未定事件簿) | 5(大别野) | 6(星穹铁道) | 8(绝区零)" },
  { route: "/genshin", name: "原神", region: "国内", category: "游戏官方资讯", typeInfo: "1(公告,默认) | 2(活动) | 3(资讯)" },
  { route: "/honkai", name: "崩坏3", region: "国内", category: "游戏官方资讯", typeInfo: "1(公告,默认) | 2(活动) | 3(资讯)" },
  { route: "/starrail", name: "崩坏：星穹铁道", region: "国内", category: "游戏官方资讯", typeInfo: "1(公告,默认) | 2(活动) | 3(资讯)" },
  { route: "/gameres", name: "GameRes 游资网", region: "国内", category: "游戏行业资讯", typeInfo: "" },
  { route: "/yystv", name: "游研社", region: "国内", category: "游戏文化、评测", typeInfo: "" },
  { route: "/weatheralarm", name: "中央气象台", region: "国内", category: "气象灾害预警", typeInfo: "province: 省份名称（如 广东省、北京市）" },
  { route: "/earthquake", name: "中国地震台", region: "国内", category: "地震速报", typeInfo: "" },
  { route: "/history", name: "历史上的今天", region: "国内", category: "历史事件", typeInfo: "" },
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
        --tag-domestic-bg: #dbeafe;
        --tag-domestic-color: #1d4ed8;
        --tag-foreign-bg: #fce7f3;
        --tag-foreign-color: #be185d;
        --tooltip-bg: #1f2937;
        --tooltip-color: #f9fafb;
      }
      @media (prefers-color-scheme: dark) {
        :root {
          --text-color: #e5e7eb;
          --bg-color: #1f2937;
          --border-color: #374151;
          --header-bg: #111827;
          --hover-bg: #374151;
          --link-color: #60a5fa;
          --tag-domestic-bg: #1e3a5f;
          --tag-domestic-color: #93c5fd;
          --tag-foreign-bg: #4a1942;
          --tag-foreign-color: #f0abfc;
          --tooltip-bg: #f9fafb;
          --tooltip-color: #1f2937;
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
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 12px;
      }
      .tag-domestic {
        background-color: var(--tag-domestic-bg);
        color: var(--tag-domestic-color);
      }
      .tag-foreign {
        background-color: var(--tag-foreign-bg);
        color: var(--tag-foreign-color);
      }
      .type-cell {
        text-align: center;
      }
      .type-badge {
        position: relative;
        display: inline-block;
        cursor: help;
        font-weight: 500;
      }
      .type-badge .tooltip {
        visibility: hidden;
        opacity: 0;
        position: absolute;
        bottom: 130%;
        left: 50%;
        transform: translateX(-50%);
        background-color: var(--tooltip-bg);
        color: var(--tooltip-color);
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: normal;
        line-height: 1.6;
        white-space: pre-wrap;
        min-width: 200px;
        max-width: 380px;
        text-align: left;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10;
        transition: opacity 0.15s;
        pointer-events: none;
      }
      .type-badge .tooltip::after {
        content: "";
        position: absolute;
        top: 100%;
        left: 50%;
        margin-left: -5px;
        border-width: 5px;
        border-style: solid;
        border-color: var(--tooltip-bg) transparent transparent transparent;
      }
      .type-badge:hover .tooltip {
        visibility: visible;
        opacity: 1;
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
              <th>type 参数</th>
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
                <td>
                  <span className={`tag ${p.region === "国内" ? "tag-domestic" : "tag-foreign"}`}>
                    {p.region}
                  </span>
                </td>
                <td>{p.category}</td>
                <td className="type-cell">
                  {p.typeInfo ? (
                    <span className="type-badge">
                      ✓
                      <span className="tooltip">{p.typeInfo}</span>
                    </span>
                  ) : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </body>
    </html>
  );
};

export default Endpoints;
