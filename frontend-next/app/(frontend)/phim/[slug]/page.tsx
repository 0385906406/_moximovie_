import PhimDetailClient, { type PhimDetailInitialData } from "./PhimDetailClient";
import { getTmdbExtras, type TmdbExtras } from "@/lib/tmdb";
import { movieApi } from "@/lib/movieApi";
import { phimCast, phimStills } from "@/lib/phimApi";
import { getServerSource } from "@/lib/movieSource.server";

export const revalidate = 300;

/* Tải phim trên server (cache 5 phút) → HTML trả về đã có tên phim, mô tả, tập phim.
   Lỗi/không thấy phim → trả null, component client tự tải lại như trước. */
async function getMovie(slug: string): Promise<PhimDetailInitialData | null> {
    /* slug giữ nguyên như trên URL để khớp với useParams() bên client; chỉ giải mã khi gọi API */
    const apiSlug = decodeURIComponent(slug);
    try {
        const source = await getServerSource();
        const { movie, episodes } = await movieApi(source).detail(apiSlug, {
            next: { revalidate: 300 },
            signal: AbortSignal.timeout(8000),
        });
        if (!movie) return null;

        /* TMDB lỗi/chậm thì trang vẫn hiện bình thường, chỉ thiếu điểm/diễn viên/trailer/ảnh/phim tương tự.
           Nguồn phimapi có sẵn diễn viên + ảnh (không cần key TMDB) → ưu tiên, thiếu thì lấy của TMDB */
        const slow = { next: { revalidate: 86400 }, signal: AbortSignal.timeout(6000) };
        const [tmdbExtras, cast, stills] = await Promise.all([
            getTmdbExtras(movie.tmdb),
            source === "phimapi" ? phimCast(apiSlug, slow) : Promise.resolve([]),
            source === "phimapi" ? phimStills(apiSlug, slow) : Promise.resolve([]),
        ]);
        const tmdb: TmdbExtras | null = tmdbExtras || cast.length || stills.length
            ? {
                id: 0, type: "movie", voteAverage: 0, voteCount: 0, trailer: null, similar: [],
                ...tmdbExtras,
                cast: cast.length ? cast : tmdbExtras?.cast ?? [],
                stills: stills.length ? stills : tmdbExtras?.stills ?? [],
            }
            : null;
        return { slug, movie, episodes, tmdb };
    } catch {
        return null;
    }
}

export default async function PhimDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const initialData = await getMovie(slug);
    return <PhimDetailClient initialData={initialData} />;
}
