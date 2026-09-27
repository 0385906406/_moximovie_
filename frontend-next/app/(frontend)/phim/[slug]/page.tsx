import PhimDetailClient, { type PhimDetailInitialData } from "./PhimDetailClient";
import { getTmdbExtras } from "@/lib/tmdb";

export const revalidate = 300;

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
        /* TMDB lỗi/chậm thì trang vẫn hiện bình thường, chỉ thiếu phần diễn viên/trailer */
        const tmdb = await getTmdbExtras(json.movie.tmdb);
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
