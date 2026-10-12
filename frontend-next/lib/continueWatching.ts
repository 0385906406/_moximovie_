/* ── "Xem tiếp" kiểu Netflix ──
   Lưu trên trình duyệt (localStorage), không cần tài khoản. Mỗi phim 1 mục: tập đang xem + vị trí + thời lượng.
   Vị trí chính xác trong tập do trình phát tự lưu và tự tua tới khi mở lại (hls-progress-*);
   danh sách này chỉ để hiện hàng "Xem tiếp" và đưa người xem về đúng phim, đúng tập. */

import type { MovieSource } from "./movieSource";

export interface ContinueItem {
    source: MovieSource;
    slug: string;
    name: string;
    poster?: string;
    thumb?: string;
    /* server và tập, đếm từ 0 */
    ver: number;
    ep: number;
    /* "Tập 3", "Full" */
    epLabel: string;
    epCount: number;
    /* giây; duration = 0 khi chưa biết (vd. trình phát nhúng không đọc được) */
    position: number;
    duration: number;
    /* true = tập trước đã xem hết, mục này trỏ sang tập kế tiếp */
    nextUp?: boolean;
    updatedAt: number;
}

const KEY = "moxi_continue_v1";
const MAX = 24;
export const CONTINUE_EVENT = "moxi-continue-change";

const sameMovie = (a: { source: string; slug: string }, b: { source: string; slug: string }) => a.source === b.source && a.slug === b.slug;

export function getContinueList(): ContinueItem[] {
    try {
        const list = JSON.parse(localStorage.getItem(KEY) ?? "[]");
        return Array.isArray(list) ? list : [];
    } catch {
        return [];
    }
}

function write(list: ContinueItem[]) {
    try {
        localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
        window.dispatchEvent(new Event(CONTINUE_EVENT));
    } catch { /* hết chỗ / bị chặn */ }
}

export function getContinueItem(source: string, slug: string) {
    return getContinueList().find(x => sameMovie(x, { source, slug })) ?? null;
}

/* Thêm/cập nhật 1 phim, đưa lên đầu danh sách */
export function saveContinue(item: Omit<ContinueItem, "updatedAt">) {
    const rest = getContinueList().filter(x => !sameMovie(x, item));
    write([{ ...item, updatedAt: Date.now() }, ...rest]);
}

export function removeContinue(source: string, slug: string) {
    write(getContinueList().filter(x => !sameMovie(x, { source, slug })));
}

/* Đã gần hết tập: còn dưới 2 phút hoặc đã xem 95% */
export function isNearlyDone(position: number, duration: number) {
    return duration > 0 && (position >= duration * 0.95 || duration - position < 120);
}

/* "còn 12 phút" / "còn 1 giờ 5 phút" */
export function remainingLabel(position: number, duration: number) {
    if (!duration) return "";
    const min = Math.max(1, Math.round((duration - position) / 60));
    return min >= 60 ? `còn ${Math.floor(min / 60)} giờ ${min % 60 ? `${min % 60} phút` : ""}`.trim() : `còn ${min} phút`;
}
