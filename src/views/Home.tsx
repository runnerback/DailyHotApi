import type { FC } from "hono/jsx";
import { html } from "hono/html";
import Layout from "./Layout.js";

interface HomeProps {
  cozeConfigured: boolean;
  cozeHasToken: boolean;
}

const Home: FC<HomeProps> = ({ cozeConfigured, cozeHasToken }) => {
  return (
    <Layout title="DailyHot API">
      <main className="home">       
        <div className="title">
          <h1 className="title-text">DailyHot API</h1>
          <span className="title-tip">服务已正常运行</span>
        </div>
        <div className="coze-status">
          <span className="status-label">Coze JWT 鉴权：</span>
          {cozeConfigured ? (
            <span className="status-ok">
              已配置{cozeHasToken ? " · Token 有效" : ""}
            </span>
          ) : (
            <span className="status-err">未配置</span>
          )}
        </div>
        <div class="control">
          <button id="all-button">
            <svg
              className="btn-icon"
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M7.71 6.71a.996.996 0 0 0-1.41 0L1.71 11.3a.996.996 0 0 0 0 1.41L6.3 17.3a.996.996 0 1 0 1.41-1.41L3.83 12l3.88-3.88c.38-.39.38-1.03 0-1.41m8.58 0a.996.996 0 0 0 0 1.41L20.17 12l-3.88 3.88a.996.996 0 1 0 1.41 1.41l4.59-4.59a.996.996 0 0 0 0-1.41L17.7 6.7c-.38-.38-1.02-.38-1.41.01M8 13c.55 0 1-.45 1-1s-.45-1-1-1s-1 .45-1 1s.45 1 1 1m4 0c.55 0 1-.45 1-1s-.45-1-1-1s-1 .45-1 1s.45 1 1 1m4-2c-.55 0-1 .45-1 1s.45 1 1 1s1-.45 1-1s-.45-1-1-1"
              />
            </svg>
            <span className="btn-text">全部接口</span>
          </button>
        </div>
      </main>
      {html`
        <script>
          document.getElementById("all-button").addEventListener("click", () => {
            window.open("/endpoints", "_blank");
          });
        </script>
      `}
    </Layout>
  );
};

export default Home;
