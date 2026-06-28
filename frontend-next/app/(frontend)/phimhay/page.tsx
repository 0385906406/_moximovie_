import HomePageClient from "@/components/frontend/HomePageClient";
import type { Movie } from "@/types/movie";

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
        fetchSection("phim-le?page=1&sort_field=modified&sort_type=desc&year=2026&limit=10"),
        fetchSection("phim-bo?sort_field=modified&sort_type=desc&limit=10&country=han-quoc&year=2025"),
        fetchSection("phim-bo?sort_field=modified&sort_type=desc&limit=10&country=trung-quoc&year=2025"),
        fetchSection("phim-bo?sort_field=modified&sort_type=desc&limit=10&country=viet-nam&year=2025"),
        fetchSection("hoat-hinh?sort_field=modified&sort_type=desc&limit=10&country=nhat-ban"),
    ]);

    return (
        <HomePageClient
            initialData={{ slider, korean, china, vietnam, wibu }}
        />
    );
}
