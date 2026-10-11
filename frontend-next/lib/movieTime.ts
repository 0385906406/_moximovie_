/* Thời lượng phim: API trả chuỗi ("109 phút", "60 phút / tập", "1 giờ 30 phút"), dữ liệu cũ có thể là số phút */

/* → số phút, không đọc được thì 0 */
export function toMinutes(time?: string | number | null): number {
    if (typeof time === "number") return time > 0 ? time : 0;
    const s = String(time ?? "").toLowerCase();
    const h = Number(s.match(/(\d+)\s*(giờ|gio|h)/)?.[1] ?? 0);
    const m = Number(s.match(/(\d+)\s*(phút|phut|p\b|m\b)/)?.[1] ?? 0);
    return h * 60 + m || Number(s.match(/^\s*(\d+)\s*$/)?.[1] ?? 0);
}

/* Nhãn hiển thị đầy đủ: giữ nguyên chuỗi của API ("60 phút / tập"), số phút thì thêm " phút" */
export function durationLabel(time?: string | number | null): string {
    if (typeof time === "number") return time > 0 ? `${time} phút` : "";
    const s = String(time ?? "").trim();
    return /^\d+$/.test(s) ? `${s} phút` : s;
}
