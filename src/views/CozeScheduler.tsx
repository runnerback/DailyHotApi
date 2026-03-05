import type { FC } from "hono/jsx";
import { platforms } from "../data/platforms.js";

const CozeScheduler: FC<{ apiKey?: string }> = ({ apiKey }) => {
  const platformsJson = JSON.stringify(platforms.map((p) => ({
    route: p.route.slice(1), // 去掉开头的 /
    name: p.name,
    region: p.region,
    category: p.category,
  })));
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
          .btn-on { background: var(--success); color: #fff; }
          .btn-on:hover { opacity: 0.85; }
          .btn-off { background: var(--badge-idle); color: var(--muted); }
          .btn-off:hover { background: var(--hover-bg); }
          .form-row { display: flex; gap: 12px; align-items: flex-end; margin-bottom: 12px; flex-wrap: wrap; }
          .form-group { display: flex; flex-direction: column; gap: 4px; }
          .form-group label { font-size: 12px; color: var(--muted); font-weight: 500; }
          .form-group input:not([type="checkbox"]), .form-group select {
            padding: 6px 10px; border: 1px solid var(--input-border);
            border-radius: 6px; font-size: 14px; background: var(--input-bg);
            color: var(--text); outline: none; min-width: 120px;
          }
          .form-group input:not([type="checkbox"]):focus, .form-group select:focus {
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
          .exec-log-item .has-tip {
            position: relative; cursor: default; display: inline-block; max-width: 200px;
          }
          .exec-log-item .has-tip .truncate {
            display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            font-size: 12px; color: var(--muted);
          }
          .exec-log-item .has-tip .tip {
            display: none; position: absolute; bottom: 130%; left: 50%; transform: translateX(-50%);
            background: var(--card-bg); border: 1px solid var(--border); border-radius: 6px;
            padding: 8px 12px; font-size: 12px; white-space: pre-wrap; word-break: break-all;
            max-width: 600px; min-width: 200px; z-index: 50; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            color: var(--text); line-height: 1.5; user-select: text; cursor: text;
            pointer-events: auto;
          }
          .exec-log-item .has-tip:hover .tip { display: block; }
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
          .modal .form-group input:not([type="checkbox"]), .modal .form-group select { width: 100%; }
          .modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }
          .btn-cancel { background: var(--badge-idle); color: var(--text); }
          .platform-picker { border: 1px solid var(--input-border); border-radius: 6px; max-height: 240px; overflow-y: auto; padding: 8px; }
          .platform-picker .picker-toolbar { display: flex; gap: 8px; margin-bottom: 8px; align-items: center; }
          .platform-picker .picker-toolbar input {
            flex: 1; padding: 4px 8px; border: 1px solid var(--input-border);
            border-radius: 4px; font-size: 13px; background: var(--input-bg); color: var(--text); outline: none;
          }
          .platform-picker .picker-toolbar a { font-size: 12px; color: var(--primary); cursor: pointer; white-space: nowrap; }
          .platform-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 4px; }
          .platform-item {
            display: flex; align-items: center; gap: 6px; padding: 4px 6px;
            border-radius: 4px; cursor: pointer; font-size: 13px; user-select: none;
          }
          .platform-item:hover { background: var(--hover-bg); }
          .platform-item input[type="checkbox"] { margin: 0; cursor: pointer; width: 14px; min-width: 14px; flex-shrink: 0; }
          .platform-item .p-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .selected-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; min-height: 24px; }
          .selected-tag {
            display: inline-flex; align-items: center; gap: 2px; padding: 2px 8px;
            background: var(--badge-success); color: var(--success); border-radius: 10px; font-size: 12px;
          }
          .selected-tag .remove { cursor: pointer; font-size: 14px; line-height: 1; }
          .hint { font-size: 11px; color: var(--muted); margin-top: 2px; }
        `}</style>
      </head>
      <body>
        <div className="header">
          <h1>Coze 工作流调度配置</h1>
        </div>

        {/* 循环任务 */}
        <div className="section">
          <div className="section-title" style="display:flex;justify-content:space-between;align-items:center;">
            <span>循环任务</span>
            <button className="btn btn-primary btn-sm" id="btn-add-recurring">+ 添加</button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Platform</th>
                <th>Limit</th>
                <th>间隔(h)</th>
                <th>首次执行</th>
                <th>状态</th>
                <th>上次执行</th>
                <th>结果</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody id="recurring-tbody">
              <tr><td colSpan={9} className="empty">加载中...</td></tr>
            </tbody>
          </table>
        </div>

        {/* 单次执行 */}
        <div className="section">
          <div className="section-title">单次执行</div>
          <div className="form-group" style="margin-bottom:12px">
            <label>选择平台 *</label>
            <div className="platform-picker" id="once-picker">
              <div className="picker-toolbar">
                <input type="text" placeholder="搜索平台..." id="once-search" />
                <a id="once-select-all">全选</a>
                <a id="once-clear-all">清空</a>
              </div>
              <div className="platform-grid" id="once-grid"></div>
            </div>
            <div className="selected-tags" id="once-selected-tags"></div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Limit</label>
              <input type="number" id="once-limit" value="1" min="1" max="100" style="width:80px" />
              <span className="hint">每个平台抓取的信息条数</span>
            </div>
            <button className="btn btn-success" id="btn-execute-once">立即执行</button>
          </div>
        </div>

        {/* 执行日志 */}
        <div className="section">
          <div className="section-title">执行日志</div>
          <div className="exec-log" id="exec-log"></div>
        </div>

        {/* 添加/编辑弹窗 */}
        <div className="modal-overlay" id="modal-overlay">
          <div className="modal">
            <h3 id="modal-title">添加循环任务</h3>
            <div className="form-group">
              <label>选择平台 *</label>
              <div className="platform-picker" id="modal-picker">
                <div className="picker-toolbar">
                  <input type="text" placeholder="搜索平台..." id="modal-search" />
                  <a id="modal-select-all">全选</a>
                  <a id="modal-clear-all">清空</a>
                </div>
                <div className="platform-grid" id="modal-grid"></div>
              </div>
              <div className="selected-tags" id="modal-selected-tags"></div>
            </div>
            <div className="form-group">
              <label>Limit（1-100）</label>
              <input type="number" id="modal-limit" value="1" min="1" max="100" />
              <span className="hint">每个平台抓取的信息条数</span>
            </div>
            <div className="form-group">
              <label>执行间隔（小时，0.1-24）</label>
              <input type="number" id="modal-interval" value="1" min="0.1" max="24" step="0.1" />
              <span className="hint">支持小数，如 0.5 = 30分钟</span>
            </div>
            <div className="form-group">
              <label>首次执行时间 *</label>
              <div style="display:flex;gap:4px;align-items:center;">
                <input type="number" id="modal-first-hour" min="0" max="23" placeholder="时" style="width:60px;text-align:center;" />
                <span style="font-size:16px;font-weight:600;">:</span>
                <input type="number" id="modal-first-minute" min="0" max="59" placeholder="分" style="width:60px;text-align:center;" />
              </div>
              <span className="hint">今天的执行起始时间（如已过则立即执行），之后按间隔重复</span>
            </div>
            <input type="hidden" id="modal-task-id" />
            <div className="modal-actions">
              <button className="btn btn-cancel" id="btn-modal-cancel">取消</button>
              <button className="btn btn-primary" id="btn-modal-save">保存</button>
            </div>
          </div>
        </div>

        <script src="/scheduler.js" data-api-key={apiKey || ""} data-platforms={platformsJson}></script>
      </body>
    </html>
  );
};

export default CozeScheduler;
