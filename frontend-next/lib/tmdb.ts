/* ── Dữ liệu bổ sung từ TMDB cho trang phim: điểm, diễn viên, trailer, phim tương tự ──
   Chạy trên server (page.tsx), cache 1 ngày → mỗi phim chỉ gọi TMDB tối đa 1 lần/ngày. */

const TMDB_API = "https://api.themoviedb.org/3";
/* Key đặt trong biến môi trường TMDB_API_KEY (Vercel → Settings → Environment Variables; máy dev: file .env.local).
   Không ghi key thẳng vào code. Chưa đặt → không gọi TMDB, trang phim vẫn hiện bình thường, chỉ thiếu phần này. */
const TMDB_KEY = process.env.TMDB_API_KEY;
export const TMDB_IMG = "https://image.tmdb.org/t/p";

export interface TmdbCast {
    id: number;
    name: string;
    character?: string;
    profile: string | null;
}

export interface TmdbSimilar {
    id: number;
    type: "movie" | "tv";
    title: string;
    poster: string | null;
    year?: string;
    vote: number;
}

export interface TmdbExtras {
    id: number;
    type: "movie" | "tv";
    voteAverage: number;
    voteCount: number;
    tagline?: string;
    runtime?: number;
    seasons?: number;
    episodes?: number;
    cast: TmdbCast[];
    trailer: { key: string; name: string } | null;
    similar: TmdbSimilar[];
}

interface RawVideo { site: string; type: string; key: string; name: string; iso_639_1: string; official?: boolean }
interface RawPerson { id: number; name: string; character?: string; roles?: { character?: string }[]; profile_path: string | null; order?: number }
interface RawTitle { id: number; title?: string; name?: string; poster_path: string | null; release_date?: string; first_air_date?: string; vote_average?: number }

/* Ưu tiên trailer tiếng Việt → trailer chính thức → teaser */
function pickTrailer(videos: RawVideo[]) {
    const yt = videos.filter(v => v.site === "YouTube");
    const score = (v: RawVideo) =>
        (v.type === "Trailer" ? 4 : v.type === "Teaser" ? 2 : 0) +
        (v.iso_639_1 === "vi" ? 3 : 0) +
        (v.official ? 1 : 0);
    const best = yt.sort((a, b) => score(b) - score(a))[0];
    return best && score(best) >= 2 ? { key: best.key, name: best.name } : null;
}

export async function getTmdbExtras(tmdb?: { id?: string | number; type?: string } | null): Promise<TmdbExtras | null> {
    const id = Number(tmdb?.id);
    const type = tmdb?.type === "tv" ? "tv" : tmdb?.type === "movie" ? "movie" : null;
    if (!TMDB_KEY || !id || !type) return null;

    const append = type === "tv" ? "aggregate_credits,videos,recommendations,similar" : "credits,videos,recommendations,similar";
    const url = `${TMDB_API}/${type}/${id}?api_key=${TMDB_KEY}&language=vi-VN&append_to_response=${append}&include_video_language=vi,en,null`;

    try {
        const res = await fetch(url, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(6000) });
        if (!res.ok) return null;
        const j = await res.json();

        const people: RawPerson[] = (type === "tv" ? j.aggregate_credits?.cast : j.credits?.cast) ?? [];
        const cast = people
            .slice()
            .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
            .slice(0, 16)
            .map(p => ({
                id: p.id,
                name: p.name,
                character: p.character || p.roles?.[0]?.character || undefined,
                profile: p.profile_path,
            }));

        const titles: RawTitle[] = (j.recommendations?.results?.length ? j.recommendations.results : j.similar?.results) ?? [];
        const similar = titles
            .filter(t => t.poster_path)
            .slice(0, 12)
            .map((t): TmdbSimilar => ({
                id: t.id,
                type,
                title: t.title || t.name || "",
                poster: t.poster_path,
                year: (t.release_date || t.first_air_date || "").slice(0, 4) || undefined,
                vote: Math.round((t.vote_average ?? 0) * 10) / 10,
            }));

        return {
            id,
            type,
            voteAverage: Math.round((j.vote_average ?? 0) * 10) / 10,
            voteCount: j.vote_count ?? 0,
            tagline: j.tagline || undefined,
            runtime: j.runtime || (j.episode_run_time?.[0] ?? undefined),
            seasons: j.number_of_seasons,
            episodes: j.number_of_episodes,
            cast,
            trailer: pickTrailer(j.videos?.results ?? []),
            similar,
        };
    } catch {
        return null;
    }
}
