import AnnouncementBar, { type TickerMovie } from "@/components/frontend/AnnouncementBar";

const PHIM_API = "https://phimapi.com/v1/api/danh-sach";

async function fetchItems(path: string) {
    try {
        const res = await fetch(`${PHIM_API}/${path}`, { next: { revalidate: 300 } });
        if (!res.ok) return [];
        const json = await res.json();
        return json?.data?.items ?? [];
    } catch {
        return [];
    }
}

/* Tải danh sách phim cho thanh chữ chạy trên server, cache 5 phút.
   Layout bọc component này trong <Suspense> → API chậm cũng không chặn trang. */
export default async function AnnouncementBarServer() {
    const [series, single] = await Promise.all([
        fetchItems("phim-bo?sort_field=modified&sort_type=desc&limit=15"),
        fetchItems("phim-le?sort_field=modified&sort_type=desc&limit=15"),
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
