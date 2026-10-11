/* Phim hot = top lượt xem. Dùng chung cho /api/hot-movies và slider trang /phimhay. Kết quả cache 6 giờ phía server.
   - VodPhim sắp xếp được theo lượt xem (sort=view) → 1 lần gọi.
   - phimapi không sắp xếp theo lượt xem (sort_field=view bị bỏ qua) → lấy nhóm phim mới cập nhật,
     đọc lượt xem từ trang chi tiết từng phim rồi tự sắp xếp. */

import { movieApi } from "@/lib/movieApi";
import type { MovieSource } from "@/lib/movieSource";

const LIMIT_EACH = 20; // phimapi: mỗi nhóm (phim lẻ, phim bộ) lấy 20 phim gần đây
const TOP = 10;
const REVALIDATE = 21600;
const init = { next: { revalidate: REVALIDATE } };

export type HotMovie = Record<string, unknown> & { slug: string; view: number };

const withView = (m: any): HotMovie => ({ ...m, view: Number(m?.view) || 0 });

async function hotFromVod(): Promise<HotMovie[]> {
    const { items } = await movieApi("vodphim").list({ sort: "view", limit: TOP }, init);
    return items.filter(m => m?.slug).map(withView);
}

async function hotFromPhimapi(): Promise<HotMovie[]> {
    const api = movieApi("phimapi");
    const recent = (type: "single" | "tv") => api.list({ type, limit: LIMIT_EACH }, init).then(r => r.items).catch(() => []);
    const [le, bo] = await Promise.all([recent("single"), recent("tv")]);
    const slugs = Array.from(new Set([...le, ...bo].map(m => m.slug as string).filter(Boolean)));
    const details = await Promise.all(slugs.map(slug =>
        api.detail(slug, init).then(d => (d.movie ? withView(d.movie) : null)).catch(() => null),
    ));
    return details
        .filter((d): d is HotMovie => d !== null)
        .sort((a, b) => b.view - a.view)
        .slice(0, TOP);
}

export async function getHotMovies(source: MovieSource): Promise<HotMovie[]> {
    try {
        return source === "vodphim" ? await hotFromVod() : await hotFromPhimapi();
    } catch {
        return [];
    }
}
