import AnnouncementBar, { type TickerMovie } from "@/components/frontend/AnnouncementBar";
import { movieApi } from "@/lib/movieApi";
import type { MovieSource } from "@/lib/movieSource";
import { getServerSource } from "@/lib/movieSource.server";

async function fetchItems(source: MovieSource, type: "single" | "tv") {
    try {
        const { items } = await movieApi(source).list({ type, limit: 15 }, { next: { revalidate: 300 } });
        return items;
    } catch {
        return [];
    }
}

/* Tải danh sách phim cho thanh chữ chạy trên server, cache 5 phút.
   Layout bọc component này trong <Suspense> → API chậm cũng không chặn trang. */
export default async function AnnouncementBarServer() {
    const source = await getServerSource();
    const [series, single] = await Promise.all([
        fetchItems(source, "tv"),
        fetchItems(source, "single"),
    ]);

    const movies: TickerMovie[] = [...series, ...single]
        .filter((m) => m.country?.[0]?.name && m.name && m.slug)
        .map((m) => ({
            country: m.country[0].name as string,
            name: m.name as string,
            slug: m.slug as string,
        }));

    return <AnnouncementBar movies={movies} />;
}
