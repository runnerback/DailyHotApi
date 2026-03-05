// Coze 工作流调度配置页面脚本

// 从 script 标签读取配置（服务端注入）
var scriptTag = document.currentScript || document.querySelector('script[data-api-key]');
var apiKey = scriptTag ? scriptTag.getAttribute("data-api-key") : "";
var PLATFORMS = [];
try { PLATFORMS = JSON.parse(scriptTag.getAttribute("data-platforms") || "[]"); } catch (e) { /* ignore */ }

function getHeaders() {
  var h = { "Content-Type": "application/json" };
  if (apiKey) h["X-API-Key"] = apiKey;
  return h;
}

function esc(s) {
  var el = document.createElement("span");
  el.textContent = s || "";
  return el.innerHTML;
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

// ==================== 平台选择器 ====================

function createPlatformPicker(prefix) {
  var selected = new Set();
  var gridEl = document.getElementById(prefix + "-grid");
  var tagsEl = document.getElementById(prefix + "-selected-tags");
  var searchEl = document.getElementById(prefix + "-search");

  function render(filter) {
    var keyword = (filter || "").toLowerCase();
    gridEl.innerHTML = PLATFORMS.filter(function(p) {
      if (!keyword) return true;
      return p.name.toLowerCase().indexOf(keyword) >= 0 ||
        p.route.toLowerCase().indexOf(keyword) >= 0 ||
        p.category.toLowerCase().indexOf(keyword) >= 0;
    }).map(function(p) {
      return '<label class="platform-item" title="' + p.category + '">' +
        '<input type="checkbox" value="' + p.route + '"' + (selected.has(p.route) ? " checked" : "") + '>' +
        '<span class="p-name">[' + p.region + '] ' + p.name + '</span>' +
        '</label>';
    }).join("");
  }

  function renderTags() {
    if (selected.size === 0) { tagsEl.innerHTML = ""; return; }
    tagsEl.innerHTML = Array.from(selected).map(function(route) {
      var p = PLATFORMS.find(function(x) { return x.route === route; });
      var name = p ? p.name : route;
      return '<span class="selected-tag">' + name +
        '<span class="remove" data-route="' + route + '">&times;</span></span>';
    }).join("");
  }

  // 复选框变化
  gridEl.addEventListener("change", function(e) {
    if (e.target.type !== "checkbox") return;
    if (e.target.checked) selected.add(e.target.value);
    else selected.delete(e.target.value);
    renderTags();
  });

  // 标签删除
  tagsEl.addEventListener("click", function(e) {
    var route = e.target.getAttribute("data-route");
    if (!route) return;
    selected.delete(route);
    render(searchEl.value);
    renderTags();
  });

  // 搜索
  searchEl.addEventListener("input", function() { render(searchEl.value); });

  // 全选/清空
  document.getElementById(prefix + "-select-all").addEventListener("click", function() {
    PLATFORMS.forEach(function(p) { selected.add(p.route); });
    render(searchEl.value);
    renderTags();
  });
  document.getElementById(prefix + "-clear-all").addEventListener("click", function() {
    selected.clear();
    render(searchEl.value);
    renderTags();
  });

  render();

  return {
    getSelected: function() { return Array.from(selected); },
    setSelected: function(routes) {
      selected.clear();
      routes.forEach(function(r) { selected.add(r); });
      render(searchEl.value);
      renderTags();
    },
    clear: function() {
      selected.clear();
      searchEl.value = "";
      render();
      renderTags();
    }
  };
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
      tbody.innerHTML = '<tr><td colspan="9" class="empty">暂无循环任务</td></tr>';
      return;
    }

    tbody.innerHTML = recurring.map(function(t) {
      // platform 路由名转中文显示
      var platformDisplay = t.platform.split(",").map(function(route) {
        var p = PLATFORMS.find(function(x) { return x.route === route; });
        return p ? p.name : route;
      }).join(", ");
      var resultText = t.lastResult
        ? "code=" + t.lastResult.code + " " + (t.lastResult.msg || "").substring(0, 30)
        : "-";
      // 开关按钮
      var toggleBtn = t.enabled
        ? '<button class="btn btn-on btn-sm" onclick="toggleTask(\'' + t.id + '\', false)">开启</button>'
        : '<button class="btn btn-off btn-sm" onclick="toggleTask(\'' + t.id + '\', true)">关闭</button>';
      return '<tr data-id="' + t.id + '">' +
        '<td title="' + t.platform + '">' + platformDisplay + '</td>' +
        '<td>' + t.limit + '</td>' +
        '<td>' + t.intervalHours + '</td>' +
        '<td class="time-text">' + formatTime(t.firstRunAt) + '</td>' +
        '<td>' + statusBadge(t.status) + '</td>' +
        '<td class="time-text">' + formatTime(t.lastRunAt) + '</td>' +
        '<td class="result-text" title="' + resultText + '">' + resultText + '</td>' +
        '<td>' + toggleBtn + '</td>' +
        '<td><button class="btn btn-danger btn-sm" onclick="deleteTask(\'' + t.id + '\')">删除</button></td>' +
        '</tr>';
    }).join("");
  } catch (e) {
    document.getElementById("recurring-tbody").innerHTML =
      '<tr><td colspan="9" class="empty">加载失败: ' + e.message + '</td></tr>';
  }
}

async function toggleTask(id, enabled) {
  await fetch("/coze/scheduler/tasks/" + id, {
    method: "PATCH", headers: getHeaders(),
    body: JSON.stringify({ enabled: enabled }),
  });
  loadTasks();
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
    // platform 路由名转中文
    var platformDisplay = l.platform.split(",").map(function(route) {
      var p = PLATFORMS.find(function(x) { return x.route === route; });
      return p ? p.name : route;
    }).join(", ");
    var resultFull = l.result
      ? "code=" + l.result.code + "\n" + (l.result.msg || "")
      : "执行中...";
    var resultShort = l.result
      ? "code=" + l.result.code + " " + (l.result.msg || "").substring(0, 20)
      : "执行中...";
    var tokenFull = l.result && l.result.randomToken ? l.result.randomToken : "";
    var tokenShort = tokenFull ? "token:" + tokenFull.substring(0, 8) + "..." : "";
    return '<div class="exec-log-item">' +
      '<span class="time-text">' + formatTime(l.startedAt) + '</span>' +
      '<span class="has-tip"><span class="truncate">' + platformDisplay + '</span><span class="tip">' + esc(l.platform) + '</span></span>' +
      '<span class="badge badge-' + (l.type === "recurring" ? "idle" : "success") + '" style="font-size:11px">' + (l.type === "recurring" ? "循环" : "单次") + '</span>' +
      statusBadge(l.status) +
      '<span class="has-tip"><span class="truncate">' + resultShort + '</span><span class="tip">' + esc(resultFull) + '</span></span>' +
      (tokenFull ? '<span class="has-tip"><span class="truncate">' + tokenShort + '</span><span class="tip">' + esc(tokenFull) + '</span></span>' : '') +
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

// ==================== 辅助：默认首次执行时间 ====================

function getDefaultFirstRunTime() {
  // 默认：当前时间往后 1 小时，取整到分钟
  var d = new Date(Date.now() + 3600 * 1000);
  d.setSeconds(0, 0);
  // datetime-local 格式: YYYY-MM-DDTHH:mm
  var pad = function(n) { return n < 10 ? "0" + n : "" + n; };
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
    "T" + pad(d.getHours()) + ":" + pad(d.getMinutes());
}

// ==================== DOM 事件绑定 ====================

document.addEventListener("DOMContentLoaded", function() {
  // 初始化平台选择器
  var oncePicker = createPlatformPicker("once");
  var modalPicker = createPlatformPicker("modal");

  // 先从 localStorage 缓存显示日志
  var cached = localStorage.getItem("scheduler_exec_logs");
  if (cached) {
    try { renderExecLog(JSON.parse(cached)); } catch (e) { /* ignore */ }
  }

  // 添加循环任务弹窗
  document.getElementById("btn-add-recurring").addEventListener("click", function() {
    document.getElementById("modal-title").textContent = "添加循环任务";
    modalPicker.clear();
    document.getElementById("modal-limit").value = "1";
    document.getElementById("modal-interval").value = "1";
    document.getElementById("modal-first-run").value = getDefaultFirstRunTime();
    document.getElementById("modal-task-id").value = "";
    document.getElementById("modal-overlay").classList.add("active");
  });

  // 取消弹窗
  document.getElementById("btn-modal-cancel").addEventListener("click", function() {
    document.getElementById("modal-overlay").classList.remove("active");
  });

  // 保存任务
  document.getElementById("btn-modal-save").addEventListener("click", async function() {
    var selectedPlatforms = modalPicker.getSelected();
    if (selectedPlatforms.length === 0) { alert("请至少选择一个平台"); return; }

    var firstRunValue = document.getElementById("modal-first-run").value;
    if (!firstRunValue) { alert("请设置首次执行时间"); return; }

    var payload = {
      type: "recurring",
      platform: selectedPlatforms.join(","),
      limit: document.getElementById("modal-limit").value || "1",
      intervalHours: parseFloat(document.getElementById("modal-interval").value) || 1,
      firstRunAt: new Date(firstRunValue).toISOString(),
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
    var selectedPlatforms = oncePicker.getSelected();
    if (selectedPlatforms.length === 0) { alert("请至少选择一个平台"); return; }
    var limit = document.getElementById("once-limit").value || "1";

    var btn = document.getElementById("btn-execute-once");
    btn.disabled = true;
    btn.textContent = "执行中...";

    try {
      await fetch("/coze/scheduler/execute", {
        method: "POST", headers: getHeaders(),
        body: JSON.stringify({ platform: selectedPlatforms.join(","), limit: limit }),
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
