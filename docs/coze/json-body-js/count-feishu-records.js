// Coze 代码节点（JS）：统计成功写入飞书多维表格的记录数量
// 放在「写入飞书」节点之后
// 输入 params.input: 飞书 add_records 返回的 data（包含 records 数组）
// 输出 total: 写入总数, summary: 可读摘要

async function main({ params }) {
    const raw = params.input;
    const data = typeof raw === "string" ? JSON.parse(raw) : (raw || {});

    // 飞书 add_records 返回 { records: [{ record_id, fields }, ...] }
    const records = Array.isArray(data.records) ? data.records : [];
    const total = records.length;

    return {
        total,
        summary: `成功写入飞书 ${total} 条记录`,
    };
}
