/* ── Bản "đồng bộ được" cho phòng nguồn VodPhim ──
   VodPhim chỉ có trình phát nhúng (không điều khiển được) → phòng không đồng bộ được vị trí xem.
   Nếu phim này cũng có trên phimapi (có link m3u8) thì phòng dùng trình phát riêng với link đó → đồng bộ đầy đủ.
   Chỉ nhận khi trùng mã TMDB (và mùa với phim bộ) để chắc chắn là cùng một phim. */

import { vodDetail } from "@/lib/vodApi";
import { phimDetail, phimSearch } from "@/lib/phimApi";

/* Cache 1 giờ (không để lâu hơn: phimapi đôi khi chặn tạm khi bị gọi dồn, trả trang lỗi thay vì dữ liệu) */
const init = { next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) };

type AnyMovie = { slug?: string; tmdb?: { id?: string | number; type?: string; season?: number | null } } | null | undefined;
type Servers = { server_data?: { link_m3u8?: string }[] }[];

const hasM3u8 = (episodes: Servers) => episodes.some(s => s.server_data?.some(e => !!e.link_m3u8));

export async function findPhimapiMirror(vodSlug: string): Promise<string | null> {
    const { movie } = await vodDetail(vodSlug, init);
    const tmdbId = String(movie?.tmdb?.id ?? movie?.tmdb_id ?? "");
    if (!movie || !tmdbId) return null;
    const season = Number(movie.tmdb?.season ?? movie.season ?? 0) || null;

    const sameMovie = (m: AnyMovie) => {
        if (!m?.tmdb?.id || String(m.tmdb.id) !== tmdbId) return false;
        const s = Number(m.tmdb.season ?? 0) || null;
        return !season || !s || s === season;
    };
    const confirm = async (slug: string) => {
        try {
            const d = await phimDetail(slug, init);
            return sameMovie(d.movie) && hasM3u8(d.episodes) ? (d.movie.slug as string) : null;
        } catch {
            return null;
        }
    };

    /* 1. Thường 2 nguồn đặt slug giống nhau */
    const bySlug = await confirm(vodSlug);
    if (bySlug) return bySlug;

    /* 2. Tìm theo tên gốc rồi tên tiếng Việt, chỉ nhận kết quả trùng mã TMDB */
    for (const keyword of [movie.origin_name, movie.name].filter(Boolean) as string[]) {
        try {
            const { items } = await phimSearch(keyword, 1, 10, init);
            for (const it of items) {
                if (!sameMovie(it) || !it.slug) continue;
                const found = await confirm(it.slug);
                if (found) return found;
            }
        } catch { /* thử từ khoá tiếp */ }
    }
    return null;
}
