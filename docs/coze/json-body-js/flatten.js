// Coze 代码节点：合并循环结果，移除 data 层级，输出扁平数组
// 输入 params.input: 循环节点的聚合输出（可能是 JSON 字符串或数组）
// 输出 output: 扁平化后的数组，每条只含 6 个字段

async function main({ params }: Args): Promise<Output> {
    // 兼容 JSON 字符串和数组
    const raw = params.input;
    const list = typeof raw === "string" ? JSON.parse(raw) : (raw || []);

    // 确保是数组
    const arr = Array.isArray(list) ? list : [list];

    // 展平：如果元素含 data 数组则展开，否则直接取元素本身
    const output = arr.flatMap((group: any) => {
        const parsed = typeof group === "string" ? JSON.parse(group) : group;
        const items = Array.isArray(parsed.data) ? parsed.data : [parsed];
        return items.map((item: any) => ({
            platform: item.platform || "",
            updateTime: item.updateTime || "",
            title: item.title || "",
            desc: item.desc || "",
            cover: item.cover || "",
            url: item.url || "",
        }));
    });

    return { output };
}
