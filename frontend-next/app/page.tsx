import SEO from "@/components/frontend/SEO";
import CinemaIntro, { type IntroMovie } from "@/components/frontend/Intro/CinemaIntro";

export const revalidate = 300;

const PHIM_API = "https://phimapi.com/v1/api/danh-sach";

interface ApiItem {
    name?: string;
    slug?: string;
    poster_url?: string;
    thumb_url?: string;
    year?: number;
}

async function fetchList(path: string): Promise<ApiItem[]> {
    try {
        const res = await fetch(`${PHIM_API}/${path}`, { next: { revalidate: 300 }, signal: AbortSignal.timeout(6000) });
        if (!res.ok) return [];
        const json = await res.json();
        return json?.data?.items ?? [];
    } catch {
        return [];
    }
}

/* Trang giới thiệu kiểu rạp chiếu phim: poster thật lấy trên server (cache 5 phút),
   hiệu ứng cuộn chạy ở components/frontend/Intro/CinemaIntro.tsx */
export default async function HomeIntro() {
    const [cinema, series] = await Promise.all([
        fetchList("phim-chieu-rap?sort_field=modified&sort_type=desc&limit=10"),
        fetchList("phim-bo?sort_field=modified&sort_type=desc&limit=10"),
    ]);

    /* Xen kẽ phim chiếu rạp và phim bộ cho vòng poster đa dạng */
    const mixed: ApiItem[] = [];
    for (let i = 0; i < Math.max(cinema.length, series.length); i++) {
        if (cinema[i]) mixed.push(cinema[i]);
        if (series[i]) mixed.push(series[i]);
    }
    const seen = new Set<string>();
    const movies: IntroMovie[] = mixed
        .filter(m => m.slug && m.name && m.poster_url && !seen.has(m.slug) && seen.add(m.slug))
        .slice(0, 14)
        .map(m => ({ name: m.name!, slug: m.slug!, poster_url: m.poster_url, thumb_url: m.thumb_url, year: m.year }));

    return (
        <>
            <SEO
                title="MoxiMovie – Xem Phim Mới | Phim Hay | Vietsub HD | Thuyết Minh"
                description="MoxiMovie - Trang xem phim mới, phim hay Vietsub HD. Cập nhật hơn 10.000+ phim chiếu rạp, phim bộ, phim lẻ chất lượng cao mỗi ngày."
                canonical="https://www.moximovie.click/"
                type="website"
            />
            <CinemaIntro movies={movies} />
        </>
    );
}
