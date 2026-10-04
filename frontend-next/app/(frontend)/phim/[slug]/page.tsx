import PhimDetailClient, { type PhimDetailInitialData } from "./PhimDetailClient";
import { getTmdbExtras, type TmdbCast } from "@/lib/tmdb";

export const revalidate = 300;

/* Diễn viên lấy từ phimapi (endpoint /peoples); lỗi hoặc rỗng → trả [] để dùng diễn viên từ TMDB */
async function getPhimCast(slug: string): Promise<TmdbCast[]> {
    try {
        const res = await fetch(`https://phimapi.com/v1/api/phim/${encodeURIComponent(decodeURIComponent(slug))}/peoples`, {
            next: { revalidate: 86400 },
            signal: AbortSignal.timeout(6000),
        });
        if (!res.ok) return [];
        const json = await res.json();
        const base: string = json?.data?.profile_sizes?.w185 ?? "https://image.tmdb.org/t/p/w185";
        const people: any[] = json?.data?.peoples ?? [];
        return people
            .filter(p => p.known_for_department === "Acting")
            .slice(0, 16)
            .map(p => ({
                id: p.tmdb_people_id,
                name: p.name,
                character: p.character || undefined,
                profile: p.profile_path ? `${base}${p.profile_path}` : null,
            }));
    } catch {
        return [];
    }
}

/* Tải phim trên server (cache 5 phút) → HTML trả về đã có tên phim, mô tả, tập phim.
   Lỗi/không thấy phim → trả null, component client tự tải lại như trước. */
async function getMovie(slug: string): Promise<PhimDetailInitialData | null> {
    /* slug giữ nguyên như trên URL để khớp với useParams() bên client; chỉ giải mã khi gọi API */
    try {
        const res = await fetch(`https://phimapi.com/phim/${encodeURIComponent(decodeURIComponent(slug))}`, {
            next: { revalidate: 300 },
            signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) return null;
        const json = await res.json();
        if (!json?.movie) return null;
        /* TMDB lỗi/chậm thì trang vẫn hiện bình thường, chỉ thiếu điểm/trailer/phim tương tự */
        const [tmdbExtras, phimCast] = await Promise.all([
            getTmdbExtras(json.movie.tmdb),
            getPhimCast(slug),
        ]);
        /* Ưu tiên diễn viên của phimapi; nếu không có thì giữ diễn viên từ TMDB */
        const tmdb = phimCast.length
            ? { id: 0, type: "movie" as const, voteAverage: 0, voteCount: 0, ...tmdbExtras, cast: phimCast, trailer: tmdbExtras?.trailer ?? null, similar: tmdbExtras?.similar ?? [] }
            : tmdbExtras;
        return { slug, movie: json.movie, episodes: json.episodes ?? [], tmdb };
    } catch {
        return null;
    }
}

export default async function PhimDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const initialData = await getMovie(slug);
    return <PhimDetailClient initialData={initialData} />;
}
