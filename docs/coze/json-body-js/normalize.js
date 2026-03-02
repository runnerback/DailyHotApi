// Coze 代码节点：DailyHotApi 响应归一化
// 输入 params.DailyHotAPIbody: DailyHotApi 的 JSON 响应体（HTTP 请求节点的 body）
// 输出 ret: 精简后的结构化数据
//
// 输入示例:
// {
//   "code": 200,
//   "title": "哔哩哔哩",
//   "updateTime": "2026-03-01T10:48:22.000Z",
//   "data": [
//     { "title": "视频标题", "desc": "简介", "cover": "https://...", "url": "https://...", ... }
//   ]
// }
//
// 输出示例:
// {
//   "data": [
//     { "platform": "哔哩哔哩", "updateTime": "2026-03-01T10:48:22.000Z", "title": "视频标题", "desc": "简介", "cover": "https://...", "url": "https://..." }
//   ]
// }

async function main({ params }: Args): Promise<DailyHotAPIbody> {
    const raw = params.DailyHotAPIbody;
    const input = typeof raw === "string" ? JSON.parse(raw) : raw;
    const platform = input.title || "";
    const updateTime = input.updateTime || "";
    const items = input.data || [];

    const data = items.map((item: any) => ({
        platform,
        updateTime,
        title: item.title || "",
        desc: item.desc || "",
        cover: item.cover || "",
        url: item.url || "",
    }));

    const ret = { data };
    return ret;
}
