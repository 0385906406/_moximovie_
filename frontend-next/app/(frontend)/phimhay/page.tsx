import HomePageClient from "@/components/frontend/HomePageClient";
import type { Movie } from "@/types/movie";
import { getHotMovies } from "@/lib/hotMovies";
import { movieApi, type ListQuery } from "@/lib/movieApi";
import type { MovieSource } from "@/lib/movieSource";
import { getServerSource } from "@/lib/movieSource.server";

export const revalidate = 300;

async function fetchSection(source: MovieSource, query: ListQuery): Promise<Movie[]> {
    try {
        const { items } = await movieApi(source).list({ limit: 10, ...query }, { next: { revalidate: 300 } });
        return items;
    } catch {
        return [];
    }
}

export default async function PhimHayPage() {
    const source = await getServerSource();
    const [slider, korean, china, vietnam, wibu] = await Promise.all([
        getHotMovies(source) as unknown as Promise<Movie[]>,
        fetchSection(source, { type: "tv", country: "han-quoc" }),
        fetchSection(source, { type: "tv", country: "trung-quoc" }),
        fetchSection(source, { type: "tv", country: "viet-nam" }),
        fetchSection(source, { type: "animation", country: "nhat-ban" }),
    ]);

    return (
        <HomePageClient
            initialData={{ slider, korean, china, vietnam, wibu, source }}
        />
    );
}
