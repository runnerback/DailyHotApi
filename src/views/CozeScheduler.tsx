import type { FC } from "hono/jsx";
import { html } from "hono/html";

const CozeScheduler: FC = () => {
  return (
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Coze 工作流调度配置</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          :root {
            --text: #333; --bg: #fff; --card-bg: #fff; --border: #e5e7eb;
            --header-bg: #f9fafb; --hover-bg: #f3f4f6; --primary: #2563eb;
            --primary-hover: #1d4ed8; --success: #059669; --danger: #dc2626;
            --warning: #d97706; --muted: #6b7280; --input-bg: #fff;
            --input-border: #d1d5db; --badge-idle: #e5e7eb; --badge-running: #fef3c7;
            --badge-success: #d1fae5; --badge-failed: #fee2e2;
          }
          @media (prefers-color-scheme: dark) {
            :root {
              --text: #e5e7eb; --bg: #111827; --card-bg: #1f2937; --border: #374151;
              --header-bg: #111827; --hover-bg: #374151; --primary: #60a5fa;
              --primary-hover: #3b82f6; --success: #34d399; --danger: #f87171;
              --warning: #fbbf24; --muted: #9ca3af; --input-bg: #374151;
              --input-border: #4b5563; --badge-idle: #374151; --badge-running: #78350f;
              --badge-success: #064e3b; --badge-failed: #7f1d1d;
            }
          }
          body {
            font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
            background: var(--bg); color: var(--text);
            padding: 32px 20px; max-width: 900px; margin: 0 auto;
          }
          .header { display: flex; align-items: center; gap: 12px; margin-bottom: 32px; }
          .header a { color: var(--muted); text-decoration: none; font-size: 14px; }
          .header a:hover { color: var(--primary); }
          .header h1 { font-size: 22px; flex: 1; }
          .section { margin-bottom: 36px; }
          .section-title {
            font-size: 16px; font-weight: 600; margin-bottom: 12px;
            padding-bottom: 8px; border-bottom: 2px solid var(--border);
          }
          table { width: 100%; border-collapse: collapse; font-size: 14px; }
          thead th {
            background: var(--header-bg); text-align: left; padding: 10px 12px;
            border-bottom: 2px solid var(--border); font-weight: 600; white-space: nowrap;
          }
          tbody tr { border-bottom: 1px solid var(--border); }
          tbody tr:hover { background: var(--hover-bg); }
          tbody td { padding: 8px 12px; }
          .badge {
            display: inline-block; padding: 2px 10px; border-radius: 10px;
            font-size: 12px; font-weight: 500;
          }
          .badge-idle { background: var(--badge-idle); }
          .badge-running { background: var(--badge-running); color: var(--warning); }
          .badge-success { background: var(--badge-success); color: var(--success); }
          .badge-failed { background: var(--badge-failed); color: var(--danger); }
          .btn {
            display: inline-flex; align-items: center; gap: 4px;
            padding: 6px 14px; border: none; border-radius: 6px;
            font-size: 13px; cursor: pointer; font-weight: 500; transition: all 0.15s;
          }
          .btn-primary { background: var(--primary); color: #fff; }
          .btn-primary:hover { background: var(--primary-hover); }
          .btn-danger { background: var(--danger); color: #fff; }
          .btn-danger:hover { opacity: 0.85; }
          .btn-success { background: var(--success); color: #fff; }
          .btn-success:hover { opacity: 0.85; }
          .btn-sm { padding: 4px 10px; font-size: 12px; }
          .btn:disabled { opacity: 0.5; cursor: not-allowed; }
          .toggle {
            position: relative; display: inline-block; width: 40px; height: 22px; cursor: pointer;
          }
          .toggle input { opacity: 0; width: 0; height: 0; }
          .toggle .slider {
            position: absolute; inset: 0; background: var(--badge-idle);
            border-radius: 22px; transition: 0.2s;
          }
          .toggle .slider::before {
            content: ""; position: absolute; height: 16px; width: 16px;
            left: 3px; bottom: 3px; background: #fff;
            border-radius: 50%; transition: 0.2s;
          }
          .toggle input:checked + .slider { background: var(--success); }
          .toggle input:checked + .slider::before { transform: translateX(18px); }
          .form-row { display: flex; gap: 12px; align-items: flex-end; margin-bottom: 12px; flex-wrap: wrap; }
          .form-group { display: flex; flex-direction: column; gap: 4px; }
          .form-group label { font-size: 12px; color: var(--muted); font-weight: 500; }
          .form-group input, .form-group select {
            padding: 6px 10px; border: 1px solid var(--input-border);
            border-radius: 6px; font-size: 14px; background: var(--input-bg);
            color: var(--text); outline: none; min-width: 120px;
          }
          .form-group input:focus, .form-group select:focus {
            border-color: var(--primary); box-shadow: 0 0 0 2px rgba(37,99,235,0.15);
          }
          .empty { text-align: center; padding: 24px; color: var(--muted); font-size: 14px; }
          .result-text { font-size: 12px; color: var(--muted); max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .time-text { font-size: 12px; color: var(--muted); white-space: nowrap; }
          .exec-log { margin-top: 16px; }
          .exec-log-item {
            padding: 8px 12px; border: 1px solid var(--border); border-radius: 6px;
            margin-bottom: 8px; font-size: 13px; display: flex; gap: 12px; align-items: center;
          }
          .modal-overlay {
            display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.4);
            z-index: 100; align-items: center; justify-content: center;
          }
          .modal-overlay.active { display: flex; }
          .modal {
            background: var(--card-bg); border-radius: 12px; padding: 24px;
            min-width: 380px; max-width: 90vw; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          }
          .modal h3 { margin-bottom: 16px; font-size: 18px; }
          .modal .form-group { margin-bottom: 12px; }
          .modal .form-group input, .modal .form-group select { width: 100%; }
          .modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }
          .btn-cancel { background: var(--badge-idle); color: var(--text); }
        `}</style>
      </head>
      <body>
        <div className="header">
          <h1>Coze 工作流调度配置</h1>
        </div>

        {/* 循环任务 */}
        <div className="section">
          <table>
            <thead>
              <tr>
                <th>Platform</th>
                <th>Limit</th>
                <th>间隔(h)</th>
                <th>状态</th>
                <th>上次执行</th>
                <th>结果</th>
                <th>开关</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody id="recurring-tbody">
              <tr><td colSpan={8} className="empty">加载中...</td></tr>
            </tbody>
          </table>
        </div>

        {/* 单次任务 */}
        <div className="section">
          <div className="section-title">单次任务</div>
          <div className="form-row">
            <div className="form-group">
              <label>Platform *</label>
              <input type="text" id="once-platform" placeholder="douyin,sina,baidu" />
            </div>
            <div className="form-group">
              <label>Limit</label>
              <input type="number" id="once-limit" value="1" min="1" max="100" style="width:80px" />
            </div>
            <button className="btn btn-success" id="btn-execute-once">立即执行</button>
          </div>
          <div className="exec-log" id="exec-log"></div>
        </div>

        {/* 添加/编辑弹窗 */}
        <div className="modal-overlay" id="modal-overlay">
          <div className="modal">
            <h3 id="modal-title">添加循环任务</h3>
            <div className="form-group">
              <label>Platform *（逗号分隔，如 douyin,sina,baidu）</label>
              <input type="text" id="modal-platform" placeholder="douyin,sina,baidu" />
            </div>
            <div className="form-group">
              <label>Limit（1-100）</label>
              <input type="number" id="modal-limit" value="1" min="1" max="100" />
            </div>
            <div className="form-group">
              <label>执行间隔（小时）</label>
              <select id="modal-interval">
                <option value="1">每 1 小时</option>
                <option value="2">每 2 小时</option>
                <option value="3">每 3 小时</option>
                <option value="4">每 4 小时</option>
                <option value="6">每 6 小时</option>
                <option value="8">每 8 小时</option>
                <option value="12">每 12 小时</option>
                <option value="24">每 24 小时</option>
              </select>
            </div>
            <input type="hidden" id="modal-task-id" />
            <div className="modal-actions">
              <button className="btn btn-cancel" id="btn-modal-cancel">取消</button>
              <button className="btn btn-primary" id="btn-modal-save">保存</button>
            </div>
          </div>
        </div>

        {html`<script>
          // 从 URL 获取 API Key（生产环境需要 ?key=xxx）
          const urlParams = new URLSearchParams(location.search);
          const apiKey = urlParams.get("key") || "";

          function headers() {
            const h = { "Content-Type": "application/json" };
            if (apiKey) h["X-API-Key"] = apiKey;
            return h;
          }

          function statusBadge(status) {
            const map = { idle: "空闲", running: "运行中", success: "成功", failed: "失败" };
            return '<span class="badge badge-' + status + '">' + (map[status] || status) + '</span>';
          }

          function formatTime(iso) {
            if (!iso) return "-";
            const d = new Date(iso);
            return d.toLocaleString("zh-CN", { month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit", second:"2-digit" });
          }

          // 加载循环任务
          async function loadTasks() {
            try {
              const res = await fetch("/coze/scheduler/tasks", { headers: headers() });
              const json = await res.json();
              const tasks = json.data || [];
              const recurring = tasks.filter(t => t.type === "recurring");
              const tbody = document.getElementById("recurring-tbody");

              if (recurring.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="empty">暂无循环任务</td></tr>';
                return;
              }

              tbody.innerHTML = recurring.map(t => {
                const resultText = t.lastResult
                  ? 'code=' + t.lastResult.code + ' ' + (t.lastResult.msg || '').substring(0, 30)
                  : '-';
                return '<tr data-id="' + t.id + '">' +
                  '<td>' + t.platform + '</td>' +
                  '<td>' + t.limit + '</td>' +
                  '<td>' + t.intervalHours + '</td>' +
                  '<td>' + statusBadge(t.status) + '</td>' +
                  '<td class="time-text">' + formatTime(t.lastRunAt) + '</td>' +
                  '<td class="result-text" title="' + resultText + '">' + resultText + '</td>' +
                  '<td><label class="toggle"><input type="checkbox" ' + (t.enabled ? 'checked' : '') +
                    ' onchange="toggleTask(\'' + t.id + '\', this.checked)"><span class="slider"></span></label></td>' +
                  '<td><button class="btn btn-danger btn-sm" onclick="deleteTask(\'' + t.id + '\')">删除</button></td>' +
                  '</tr>';
              }).join("");
            } catch (e) {
              document.getElementById("recurring-tbody").innerHTML =
                '<tr><td colspan="8" class="empty">加载失败: ' + e.message + '</td></tr>';
            }
          }

          // 切换开关
          async function toggleTask(id, enabled) {
            await fetch("/coze/scheduler/tasks/" + id, {
              method: "PATCH", headers: headers(),
              body: JSON.stringify({ enabled }),
            });
          }

          // 删除任务
          async function deleteTask(id) {
            if (!confirm("确定要删除此任务？")) return;
            await fetch("/coze/scheduler/tasks/" + id, {
              method: "DELETE", headers: headers(),
            });
            loadTasks();
          }

          // 添加弹窗
          document.getElementById("btn-add-recurring").addEventListener("click", () => {
            document.getElementById("modal-title").textContent = "添加循环任务";
            document.getElementById("modal-platform").value = "";
            document.getElementById("modal-limit").value = "1";
            document.getElementById("modal-interval").value = "1";
            document.getElementById("modal-task-id").value = "";
            document.getElementById("modal-overlay").classList.add("active");
          });

          document.getElementById("btn-modal-cancel").addEventListener("click", () => {
            document.getElementById("modal-overlay").classList.remove("active");
          });

          document.getElementById("btn-modal-save").addEventListener("click", async () => {
            const platform = document.getElementById("modal-platform").value.trim();
            if (!platform) { alert("Platform 不能为空"); return; }

            const payload = {
              type: "recurring",
              platform,
              limit: document.getElementById("modal-limit").value || "1",
              intervalHours: parseInt(document.getElementById("modal-interval").value),
              enabled: true,
            };

            const taskId = document.getElementById("modal-task-id").value;
            if (taskId) {
              await fetch("/coze/scheduler/tasks/" + taskId, {
                method: "PATCH", headers: headers(), body: JSON.stringify(payload),
              });
            } else {
              await fetch("/coze/scheduler/tasks", {
                method: "POST", headers: headers(), body: JSON.stringify(payload),
              });
            }

            document.getElementById("modal-overlay").classList.remove("active");
            loadTasks();
          });

          // 单次执行
          let execLogs = [];
          document.getElementById("btn-execute-once").addEventListener("click", async () => {
            const platform = document.getElementById("once-platform").value.trim();
            if (!platform) { alert("Platform 不能为空"); return; }
            const limit = document.getElementById("once-limit").value || "1";

            const btn = document.getElementById("btn-execute-once");
            btn.disabled = true;
            btn.textContent = "执行中...";

            const logItem = {
              time: new Date().toLocaleString("zh-CN"),
              platform, status: "running", msg: "",
            };
            execLogs.unshift(logItem);
            renderExecLog();

            try {
              const res = await fetch("/coze/scheduler/execute", {
                method: "POST", headers: headers(),
                body: JSON.stringify({ platform, limit }),
              });
              const json = await res.json();
              const data = json.data || {};
              logItem.status = data.code === 0 ? "success" : "failed";
              logItem.msg = "code=" + data.code + " " + (data.msg || "");
              logItem.randomToken = data.randomToken;
            } catch (e) {
              logItem.status = "failed";
              logItem.msg = e.message;
            }

            btn.disabled = false;
            btn.textContent = "立即执行";
            renderExecLog();
          });

          function renderExecLog() {
            const el = document.getElementById("exec-log");
            el.innerHTML = execLogs.slice(0, 10).map(l =>
              '<div class="exec-log-item">' +
                '<span class="time-text">' + l.time + '</span>' +
                '<span>' + l.platform + '</span>' +
                statusBadge(l.status) +
                '<span class="result-text">' + (l.msg || "执行中...") + '</span>' +
                (l.randomToken ? '<span class="result-text" title="' + l.randomToken + '">token:' + l.randomToken.substring(0, 8) + '...</span>' : '') +
              '</div>'
            ).join("");
          }

          // 点击遮罩关闭弹窗
          document.getElementById("modal-overlay").addEventListener("click", (e) => {
            if (e.target === e.currentTarget) {
              e.currentTarget.classList.remove("active");
            }
          });

          // 初始加载 + 定时刷新
          loadTasks();
          setInterval(loadTasks, 10000);
        </script>`}
      </body>
    </html>
  );
};

export default CozeScheduler;
