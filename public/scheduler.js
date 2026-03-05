// Coze 工作流调度配置页面脚本

// API Key：从 script 标签的 data-api-key 属性读取（服务端注入）
var scriptTag = document.currentScript || document.querySelector('script[data-api-key]');
var apiKey = scriptTag ? scriptTag.getAttribute("data-api-key") : "";

function getHeaders() {
  var h = { "Content-Type": "application/json" };
  if (apiKey) h["X-API-Key"] = apiKey;
  return h;
}

function statusBadge(status) {
  var map = { idle: "空闲", running: "运行中", success: "成功", failed: "失败" };
  return '<span class="badge badge-' + status + '">' + (map[status] || status) + '</span>';
}

function formatTime(iso) {
  if (!iso) return "-";
  var d = new Date(iso);
  return d.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// ==================== 循环任务 ====================

async function loadTasks() {
  try {
    var res = await fetch("/coze/scheduler/tasks", { headers: getHeaders() });
    var json = await res.json();
    var tasks = json.data || [];
    var recurring = tasks.filter(function(t) { return t.type === "recurring"; });
    var tbody = document.getElementById("recurring-tbody");

    if (recurring.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty">暂无循环任务</td></tr>';
      return;
    }

    tbody.innerHTML = recurring.map(function(t) {
      var resultText = t.lastResult
        ? "code=" + t.lastResult.code + " " + (t.lastResult.msg || "").substring(0, 30)
        : "-";
      return '<tr data-id="' + t.id + '">' +
        '<td>' + t.platform + '</td>' +
        '<td>' + t.limit + '</td>' +
        '<td>' + t.intervalHours + '</td>' +
        '<td>' + statusBadge(t.status) + '</td>' +
        '<td class="time-text">' + formatTime(t.lastRunAt) + '</td>' +
        '<td class="result-text" title="' + resultText + '">' + resultText + '</td>' +
        '<td><label class="toggle"><input type="checkbox" ' + (t.enabled ? "checked" : "") +
          ' onchange="toggleTask(\'' + t.id + '\', this.checked)"><span class="slider"></span></label></td>' +
        '<td><button class="btn btn-danger btn-sm" onclick="deleteTask(\'' + t.id + '\')">删除</button></td>' +
        '</tr>';
    }).join("");
  } catch (e) {
    document.getElementById("recurring-tbody").innerHTML =
      '<tr><td colspan="8" class="empty">加载失败: ' + e.message + '</td></tr>';
  }
}

async function toggleTask(id, enabled) {
  await fetch("/coze/scheduler/tasks/" + id, {
    method: "PATCH", headers: getHeaders(),
    body: JSON.stringify({ enabled: enabled }),
  });
}

async function deleteTask(id) {
  if (!confirm("确定要删除此任务？")) return;
  await fetch("/coze/scheduler/tasks/" + id, {
    method: "DELETE", headers: getHeaders(),
  });
  loadTasks();
}

// ==================== 执行日志 ====================

function renderExecLog(logs) {
  var el = document.getElementById("exec-log");
  if (!logs || logs.length === 0) {
    el.innerHTML = '';
    return;
  }
  el.innerHTML = logs.slice(0, 20).map(function(l) {
    var resultText = l.result
      ? "code=" + l.result.code + " " + (l.result.msg || "").substring(0, 30)
      : "执行中...";
    var tokenHtml = l.result && l.result.randomToken
      ? '<span class="result-text" title="' + l.result.randomToken + '">token:' + l.result.randomToken.substring(0, 8) + '...</span>'
      : '';
    return '<div class="exec-log-item">' +
      '<span class="time-text">' + formatTime(l.startedAt) + '</span>' +
      '<span>' + l.platform + '</span>' +
      '<span class="badge badge-' + (l.type === "recurring" ? "idle" : "success") + '" style="font-size:11px">' + (l.type === "recurring" ? "循环" : "单次") + '</span>' +
      statusBadge(l.status) +
      '<span class="result-text">' + resultText + '</span>' +
      tokenHtml +
    '</div>';
  }).join("");
}

async function loadExecLogs() {
  try {
    var res = await fetch("/coze/scheduler/logs", { headers: getHeaders() });
    var json = await res.json();
    var logs = json.data || [];
    localStorage.setItem("scheduler_exec_logs", JSON.stringify(logs));
    renderExecLog(logs);
  } catch (e) {
    // 静默失败，保留 localStorage 缓存的显示
  }
}

// ==================== DOM 事件绑定 ====================

document.addEventListener("DOMContentLoaded", function() {
  // 先从 localStorage 缓存显示日志（避免白屏）
  var cached = localStorage.getItem("scheduler_exec_logs");
  if (cached) {
    try { renderExecLog(JSON.parse(cached)); } catch (e) { /* ignore */ }
  }

  // 添加循环任务弹窗
  document.getElementById("btn-add-recurring").addEventListener("click", function() {
    document.getElementById("modal-title").textContent = "添加循环任务";
    document.getElementById("modal-platform").value = "";
    document.getElementById("modal-limit").value = "1";
    document.getElementById("modal-interval").value = "1";
    document.getElementById("modal-task-id").value = "";
    document.getElementById("modal-overlay").classList.add("active");
  });

  // 取消弹窗
  document.getElementById("btn-modal-cancel").addEventListener("click", function() {
    document.getElementById("modal-overlay").classList.remove("active");
  });

  // 保存任务
  document.getElementById("btn-modal-save").addEventListener("click", async function() {
    var platform = document.getElementById("modal-platform").value.trim();
    if (!platform) { alert("Platform 不能为空"); return; }

    var payload = {
      type: "recurring",
      platform: platform,
      limit: document.getElementById("modal-limit").value || "1",
      intervalHours: parseInt(document.getElementById("modal-interval").value),
      enabled: true,
    };

    var taskId = document.getElementById("modal-task-id").value;
    if (taskId) {
      await fetch("/coze/scheduler/tasks/" + taskId, {
        method: "PATCH", headers: getHeaders(), body: JSON.stringify(payload),
      });
    } else {
      await fetch("/coze/scheduler/tasks", {
        method: "POST", headers: getHeaders(), body: JSON.stringify(payload),
      });
    }

    document.getElementById("modal-overlay").classList.remove("active");
    loadTasks();
  });

  // 立即执行
  document.getElementById("btn-execute-once").addEventListener("click", async function() {
    var platform = document.getElementById("once-platform").value.trim();
    if (!platform) { alert("Platform 不能为空"); return; }
    var limit = document.getElementById("once-limit").value || "1";

    var btn = document.getElementById("btn-execute-once");
    btn.disabled = true;
    btn.textContent = "执行中...";

    try {
      await fetch("/coze/scheduler/execute", {
        method: "POST", headers: getHeaders(),
        body: JSON.stringify({ platform: platform, limit: limit }),
      });
    } catch (e) {
      // 静默，日志从服务端刷新
    }

    btn.disabled = false;
    btn.textContent = "立即执行";
    loadExecLogs();
  });

  // 点击遮罩关闭弹窗
  document.getElementById("modal-overlay").addEventListener("click", function(e) {
    if (e.target === e.currentTarget) {
      e.currentTarget.classList.remove("active");
    }
  });

  // 初始加载 + 定时刷新
  loadTasks();
  loadExecLogs();
  setInterval(function() { loadTasks(); loadExecLogs(); }, 10000);
});
