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

// 加载循环任务
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

// 切换开关
async function toggleTask(id, enabled) {
  await fetch("/coze/scheduler/tasks/" + id, {
    method: "PATCH", headers: getHeaders(),
    body: JSON.stringify({ enabled: enabled }),
  });
}

// 删除任务
async function deleteTask(id) {
  if (!confirm("确定要删除此任务？")) return;
  await fetch("/coze/scheduler/tasks/" + id, {
    method: "DELETE", headers: getHeaders(),
  });
  loadTasks();
}

// 单次执行记录
var execLogs = [];

function renderExecLog() {
  var el = document.getElementById("exec-log");
  el.innerHTML = execLogs.slice(0, 10).map(function(l) {
    return '<div class="exec-log-item">' +
      '<span class="time-text">' + l.time + '</span>' +
      '<span>' + l.platform + '</span>' +
      statusBadge(l.status) +
      '<span class="result-text">' + (l.msg || "执行中...") + '</span>' +
      (l.randomToken ? '<span class="result-text" title="' + l.randomToken + '">token:' + l.randomToken.substring(0, 8) + '...</span>' : '') +
    '</div>';
  }).join("");
}

// DOM 加载完成后绑定事件
document.addEventListener("DOMContentLoaded", function() {
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

    var logItem = {
      time: new Date().toLocaleString("zh-CN"),
      platform: platform, status: "running", msg: "",
    };
    execLogs.unshift(logItem);
    renderExecLog();

    try {
      var res = await fetch("/coze/scheduler/execute", {
        method: "POST", headers: getHeaders(),
        body: JSON.stringify({ platform: platform, limit: limit }),
      });
      var json = await res.json();
      var data = json.data || {};
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

  // 点击遮罩关闭弹窗
  document.getElementById("modal-overlay").addEventListener("click", function(e) {
    if (e.target === e.currentTarget) {
      e.currentTarget.classList.remove("active");
    }
  });

  // 初始加载 + 定时刷新
  loadTasks();
  setInterval(loadTasks, 10000);
});
