// Coze 代码节点（JS）：将 flatten 输出包裹为飞书 add_records 的 [{"fields": {...}}] 格式
// 仅做层级/格式调整，不修改字段值，不强行赋值
// 输入 params.input: flatten.js 输出的扁平数组
// 输出 records: 飞书 add_records 所需格式

async function main({ params }) {
    const raw = params.input;
    const list = typeof raw === "string" ? JSON.parse(raw) : (raw || []);
    const arr = Array.isArray(list) ? list : [list];

    const records = arr.map((item) => {
        const fields = { ...item };
        // 飞书多选字段需要数组格式："美股" → ["美股"]，"" → []
        if (typeof fields.sort === "string") {
            fields.sort = fields.sort ? [fields.sort] : [];
        }
        // 评分字段除以100：80 → 0.8
        if (typeof fields["perler-beads-score"] === "number") {
            fields["perler-beads-score"] = fields["perler-beads-score"] / 100;
        }
        if (typeof fields["us-stocks-score"] === "number") {
            fields["us-stocks-score"] = fields["us-stocks-score"] / 100;
        }
        // 飞书超链接字段需要对象格式："https://..." → {"link": "https://...", "text": "标题"}
        if (typeof fields.url === "string") {
            fields.url = fields.url ? { link: fields.url, text: fields.title || fields.url } : {};
        }
        return { fields };
    });

    return { records };
}
