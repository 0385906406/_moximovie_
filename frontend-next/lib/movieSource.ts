/* ── Nguồn phim: phimapi (trong nước) hoặc VodPhim (nước ngoài) ──
   Lưu trong cookie để cả server (trang render sẵn) và client (movieService) dùng chung 1 nguồn.
   Máy mới vào (chưa có cookie) → mặc định máy chủ trong nước; người xem tự đổi ở nút cài đặt góc dưới.
   Hai nguồn có slug khác nhau → cả web phải dùng cùng 1 nguồn, không trộn. */

export type MovieSource = "phimapi" | "vodphim";

export const SOURCE_COOKIE = "moxi_source";
export const DEFAULT_SOURCE: MovieSource = "phimapi";
export const SOURCE_MAX_AGE = 60 * 60 * 24 * 365;

export const SOURCE_INFO: Record<MovieSource, { label: string; region: string; desc: string }> = {
    phimapi: {
        label: "Máy chủ trong nước",
        region: "Việt Nam",
        desc: "Kho phim lớn, trình phát riêng của MoxiMovie (rèm, ánh sáng nền, chọn chất lượng). Có thể bị chặn khi ở nước ngoài.",
    },
    vodphim: {
        label: "Máy chủ quốc tế",
        region: "Nước ngoài",
        desc: "Xem được khi ở nước ngoài hoặc khi máy chủ trong nước bị chặn. Kho phim ít hơn, dùng trình phát nhúng.",
    },
};

export function parseSource(value?: string | null): MovieSource | null {
    return value === "phimapi" || value === "vodphim" ? value : null;
}

/* ── Client ── */
export function getClientSource(): MovieSource {
    if (typeof document === "undefined") return DEFAULT_SOURCE;
    const m = document.cookie.match(new RegExp(`(?:^|; )${SOURCE_COOKIE}=([^;]*)`));
    return parseSource(m?.[1]) ?? DEFAULT_SOURCE;
}

export function setClientSource(source: MovieSource) {
    document.cookie = `${SOURCE_COOKIE}=${source}; path=/; max-age=${SOURCE_MAX_AGE}; samesite=lax`;
}
