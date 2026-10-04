/* Phim hot = top lượt xem trong nhóm phim mới cập nhật.
   API không có sắp xếp theo lượt xem (sort_field=view bị bỏ qua), nên lấy lượt xem từ trang chi tiết từng phim.
   Dùng chung cho /api/hot-movies và slider trang /phimhay. Kết quả cache 6 giờ phía server. */

const PHIM = "https://phimapi.com";
const LIMIT_EACH = 20; // mỗi nhóm (phim lẻ, phim bộ) lấy 20 phim gần đây
const TOP = 10;
const REVALIDATE = 21600;

export type HotMovie = Record<string, unknown> & { slug: string; view: number };

async function listRecent(type: string): Promise<{ slug: string }[]> {
    try {
        const res = await fetch(`${PHIM}/v1/api/danh-sach/${type}?sort_field=modified.time&sort_type=desc&limit=${LIMIT_EACH}`, {
            next: { revalidate: REVALIDATE },
        });
        if (!res.ok) return [];
        const json = await res.json();
        return json?.data?.items ?? [];
    } catch {
        return [];
    }
}

async function fetchDetail(slug: string): Promise<HotMovie | null> {
    try {
        const res = await fetch(`${PHIM}/phim/${encodeURIComponent(slug)}`, { next: { revalidate: REVALIDATE } });
        if (!res.ok) return null;
        const json = await res.json();
        if (!json?.movie) return null;
        return { ...json.movie, view: Number(json.movie.view) || 0 } as HotMovie;
    } catch {
        return null;
    }
}

export async function getHotMovies(): Promise<HotMovie[]> {
    const [le, bo] = await Promise.all([listRecent("phim-le"), listRecent("phim-bo")]);
    const slugs = Array.from(new Set([...le, ...bo].map(m => m.slug).filter(Boolean)));
    const details = (await Promise.all(slugs.map(fetchDetail))).filter((d): d is HotMovie => d !== null);
    return details.sort((a, b) => b.view - a.view).slice(0, TOP);
}
