import type { FC } from "hono/jsx";
import { css, Style } from "hono/css";

const Layout: FC = (props) => {
  const globalClass = css`
    :-hono-global {
      * {
        margin: 0;
        padding: 0;
        user-select: none;
        box-sizing: border-box;
        -webkit-user-drag: none;
      }
      :root {
        --text-color: #000;
        --text-color-gray: #cbcbcb;
        --text-color-hover: #fff;
        --icon-color: #444;
      }
      @media (prefers-color-scheme: dark) {
        :root {
          --text-color: #fff;
          --text-color-gray: #cbcbcb;
          --text-color-hover: #3c3c3c;
          --icon-color: #cbcbcb;
        }
      }
      a {
        text-decoration: none;
        color: var(--text-color);
      }
      body {
        width: 100vw;
        height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        color: var(--text-color);
        background-color: var(--text-color-hover);
        font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei";
        transition:
          color 0.3s,
          background-color 0.3s;
      }
      main {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 20px;
        margin: 20px;
        height: 100%;
      }
      .img {
        width: 120px;
        height: 120px;
        margin-bottom: 20px;
      }
      .img img,
      .img svg {
        width: 100%;
        height: 100%;
      }
      .title {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 40px;
      }
      .title .title-text {
        font-size: 28px;
        font-weight: bold;
        margin-bottom: 12px;
        text-align: center;
      }
      .title .title-tip {
        font-size: 20px;
        opacity: 0.8;
      }
      .title .content {
        margin-top: 30px;
        display: flex;
        padding: 20px;
        border-radius: 12px;
        border: 1px dashed var(--text-color);
        user-select: text;
      }
      .control {
        display: flex;
        flex-direction: row;
        align-items: center;
      }
      .control button {
        display: flex;
        flex-direction: row;
        align-items: center;
        color: var(--text-color);
        border: var(--text-color) solid;
        background-color: var(--text-color-hover);
        border-radius: 8px;
        padding: 8px 12px;
        margin: 0 8px;
        transition:
          color 0.3s,
          background-color 0.3s;
        cursor: pointer;
      }
      .control button .btn-icon {
        width: 22px;
        height: 22px;
        margin-right: 8px;
      }
      .control button .btn-text {
        font-size: 14px;
      }
      .control button:hover {
        border: var(--text-color) solid;
        background: var(--text-color);
        color: var(--text-color-hover);
      }
      .control button i {
        margin-right: 6px;
      }
      footer {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        line-height: 30px;
        padding: 20px;
      }
      .coze-status {
        display: flex;
        align-items: center;
        margin-bottom: 20px;
        font-size: 14px;
        opacity: 0.7;
      }
      .status-label {
        margin-right: 4px;
      }
      .status-ok {
        color: #22c55e;
      }
      .status-err {
        color: #ef4444;
      }
      footer .power {
        font-size: 14px;
        opacity: 0.6;
      }
    }
  `;
  return (
    <html lang="zh-CN">
      <head>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta charset="utf-8" />
        <title>{props.title}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="今日热榜 API，一个聚合热门数据的 API 接口" />
        <Style>{globalClass}</Style>
      </head>
      <body>
        {props.children}
        <footer>
          <div class="power">Copyright &copy; DailyHotAPI</div>
        </footer>
      </body>
    </html>
  );
};

export default Layout;
