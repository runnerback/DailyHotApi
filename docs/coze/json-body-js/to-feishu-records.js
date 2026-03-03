// Coze 代码节点（JS）：将 flatten 输出包裹为飞书 add_records 的 [{"fields": {...}}] 格式
// 仅做层级/格式调整，不修改字段值，不强行赋值
// 输入 params.input: flatten.js 输出的扁平数组
// 输出 records: 飞书 add_records 所需格式

async function main({ params }) {
    const raw = params.input;
    const list = typeof raw === "string" ? JSON.parse(raw) : (raw || []);
    const arr = Array.isArray(list) ? list : [list];

    const records = arr.map((item) => ({
        fields: item,
    }));

    return { records };
}
