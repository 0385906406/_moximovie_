import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, Search, Star } from "lucide-react";
import { getTmdbExtras, getTmdbMovieBasic, TMDB_IMG } from "@/lib/tmdb";
import { movieApi } from "@/lib/movieApi";
import { getServerSource } from "@/lib/movieSource.server";
import { SITE_URL } from "@/lib/movieImage";
import SEO from "@/components/frontend/SEO";
import TrailerButton from "@/components/frontend/CinemaMovie/TrailerButton";
import MovieTmdbExtras from "@/components/frontend/MovieDetail/MovieTmdbExtras";

export const revalidate = 3600;

/* Phim này đã có trên web chưa: tìm theo tên rồi so mã TMDB (tránh nhầm phim trùng tên) */
async function findOnSite(id: number, titles: string[]) {
    const api = movieApi(await getServerSource());
    for (const title of titles.filter(Boolean)) {
        try {
            const { items } = await api.search(title, 1, 10, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(6000) });
            const hit = items.find(m => String(m?.tmdb?.id) === String(id));
            if (hit?.slug) return hit.slug as string;
        } catch { /* thử tên khác */ }
    }
    return null;
}

const fmtDate = (d: string) => (d ? new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "");

/* Trang phim đang chiếu rạp / sắp chiếu (dữ liệu TMDB) — trước đây link này dẫn tới trang 404 */
export default async function CinemaMoviePage({ params }: { params: Promise<{ id: string }> }) {
    const id = Number((await params).id);
    if (!Number.isInteger(id) || id <= 0) notFound();
    const [movie, extras] = await Promise.all([getTmdbMovieBasic(id), getTmdbExtras({ id, type: "movie" })]);
    if (!movie) notFound();
    const slug = await findOnSite(id, [movie.title, movie.originalTitle]);
    const released = !!movie.releaseDate && new Date(movie.releaseDate) <= new Date();
    const desc = movie.overview || `Thông tin phim ${movie.title}: ngày khởi chiếu, trailer, diễn viên.`;

    return (
        <div className="relative">
            <SEO
                title={`${movie.title}${movie.originalTitle && movie.originalTitle !== movie.title ? ` (${movie.originalTitle})` : ""} - Phim chiếu rạp | MoxiMovie`}
                description={desc.slice(0, 300)}
                canonical={`${SITE_URL}/phim-rap/${id}`}
                image={movie.backdrop ? `${TMDB_IMG}/w1280${movie.backdrop}` : movie.poster ? `${TMDB_IMG}/w780${movie.poster}` : undefined}
                type="movie"
                name={movie.title}
            />

            {/* Ảnh nền */}
            {movie.backdrop && (
                <div aria-hidden className="absolute inset-x-0 top-0 h-[70vh] overflow-hidden pointer-events-none">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`${TMDB_IMG}/w1280${movie.backdrop}`} alt="" className="w-full h-full object-cover opacity-30" />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#191B24]/40 via-[#191B24]/70 to-[#191B24]" />
                </div>
            )}

            <div className="relative z-10 max-w-6xl mx-auto px-4 pt-28 pb-16">
                <div className="flex flex-col md:flex-row gap-6 md:gap-10">
                    <div className="w-44 sm:w-56 md:w-64 shrink-0 mx-auto md:mx-0">
                        <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-white/5 shadow-[0_24px_60px_rgba(0,0,0,0.7)] border border-white/10">
                            {movie.poster && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={`${TMDB_IMG}/w500${movie.poster}`} alt={movie.title} className="w-full h-full object-cover" />
                            )}
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-semibold ${released ? "bg-red-500/15 text-red-300 border border-red-400/30" : "bg-[#f6d46b]/12 text-[#f6d46b] border border-[#f6d46b]/30"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${released ? "bg-red-400 animate-pulse" : "bg-[#f6d46b]"}`} />
                            {released ? "Đang chiếu rạp" : "Sắp chiếu"}
                        </span>
                        <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-white leading-tight">{movie.title}</h1>
                        {movie.originalTitle && movie.originalTitle !== movie.title && (
                            <p className="mt-1 text-white/45 italic">{movie.originalTitle}</p>
                        )}

                        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13.5px] text-white/65">
                            {movie.releaseDate && <span className="flex items-center gap-1.5"><CalendarDays size={15} /> Khởi chiếu {fmtDate(movie.releaseDate)}</span>}
                            {extras?.runtime ? <span className="flex items-center gap-1.5"><Clock size={15} /> {extras.runtime} phút</span> : null}
                            {extras && extras.voteCount > 0 && (
                                <span className="flex items-center gap-1.5 text-[#f6d46b]">
                                    <Star size={15} className="fill-current" /> {extras.voteAverage.toFixed(1)}
                                    <span className="text-white/40">({extras.voteCount.toLocaleString("vi-VN")} đánh giá)</span>
                                </span>
                            )}
                        </div>
                        {movie.genres.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {movie.genres.map(g => <span key={g} className="px-2.5 py-1 rounded-lg text-[12px] text-white/70 bg-white/[0.06] border border-white/10">{g}</span>)}
                            </div>
                        )}

                        {movie.overview && <p className="mt-5 text-[14.5px] leading-relaxed text-white/70 max-w-3xl">{movie.overview}</p>}

                        <div className="mt-6 flex flex-wrap gap-3">
                            {slug ? (
                                <Link href={`/phim/${slug}`} className="h-12 px-6 rounded-xl flex items-center gap-2 text-[14px] font-semibold bg-[#22d3a5] text-[#041a11] hover:brightness-110 transition">
                                    ▶ Xem ngay trên MoxiMovie
                                </Link>
                            ) : (
                                <Link href={`/tim-kiem?keyword=${encodeURIComponent(movie.title)}`} className="h-12 px-5 rounded-xl flex items-center gap-2 text-[14px] font-semibold bg-[#22d3a5] text-[#041a11] hover:brightness-110 transition">
                                    <Search size={16} /> Tìm phim này
                                </Link>
                            )}
                            {extras?.trailer && <TrailerButton trailer={extras.trailer} />}
                        </div>
                        {!slug && (
                            <p className="mt-3 text-[12.5px] text-white/40">Phim đang/sắp chiếu ngoài rạp — sẽ có trên MoxiMovie khi có bản chiếu online.</p>
                        )}
                    </div>
                </div>

                {/* Diễn viên, phim tương tự (dùng lại khối của trang phim) */}
                {extras && (extras.cast.length > 0 || extras.similar.length > 0) && (
                    <div className="mt-10">
                        <MovieTmdbExtras data={extras} />
                    </div>
                )}
            </div>
        </div>
    );
}
