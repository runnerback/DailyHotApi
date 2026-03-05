import type { FC } from "hono/jsx";
import { css, Style } from "hono/css";
import { platforms } from "../data/platforms.js";

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
