import HomePageClient from "@/components/frontend/HomePageClient";
import type { Movie } from "@/types/movie";
import { getHotMovies } from "@/lib/hotMovies";

export const revalidate = 300;

const PHIM_API = "https://phimapi.com/v1/api/danh-sach";

async function fetchSection(path: string): Promise<Movie[]> {
    try {
        const res = await fetch(`${PHIM_API}/${path}`, { next: { revalidate: 300 } });
        if (!res.ok) return [];
        const json = await res.json();
        return json?.data?.items ?? [];
    } catch {
        return [];
    }
}

export default async function PhimHayPage() {
    const [slider, korean, china, vietnam, wibu] = await Promise.all([
        getHotMovies() as unknown as Promise<Movie[]>,
        fetchSection("phim-bo?sort_field=modified.time&sort_type=desc&limit=10&country=han-quoc"),
        fetchSection("phim-bo?sort_field=modified.time&sort_type=desc&limit=10&country=trung-quoc"),
        fetchSection("phim-bo?sort_field=modified.time&sort_type=desc&limit=10&country=viet-nam"),
        fetchSection("hoat-hinh?sort_field=modified.time&sort_type=desc&limit=10&country=nhat-ban"),
    ]);

    return (
        <HomePageClient
            initialData={{ slider, korean, china, vietnam, wibu }}
        />
    );
}
