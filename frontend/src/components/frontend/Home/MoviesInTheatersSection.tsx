import { useEffect, useState , memo } from "react";
import { movieService } from "@/services/movieService";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { Link } from "react-router";

// ── Type riêng — release_date là string "YYYY-MM-DD" ──
interface TheaterMovie {
    id: string;
    title?: string;
    name?: string;
    original_title?: string;
    poster_path?: string;
    release_date?: string;
    vote_average?: number;
}

function formatDate(dateStr?: string): string | null {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatScore(score?: number): string | null {
    if (!score || score === 0) return null;
    return score.toFixed(1);
}

// ── Skeleton ──
function SkeletonCard() {
    return (
        <div style={{ width: "clamp(100px, 28vw, 210px)" }} className="flex-shrink-0">
            <div className="w-full rounded-xl bg-white/6 animate-pulse" style={{ aspectRatio: "2/3" }} />
            <div className="mt-2 space-y-1.5 px-1">
                <div className="h-2.5 bg-white/6 rounded-full animate-pulse w-4/5 mx-auto" />
                <div className="h-2 bg-white/5 rounded-full animate-pulse w-3/5 mx-auto" />
            </div>
        </div>
    );
}

function MoviesInTheatersSection() {
    const [dataMoviesInTheaters, setDataMoviesInTheaters] = useState<TheaterMovie[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDatas = async () => {
            setLoading(true);
            try {
                const data = await movieService.dataMoviesInTheaters();
                setDataMoviesInTheaters(data);
            } catch (e) {
                console.error("Fetch movies in theaters error", e);
            } finally {
                setLoading(false);
            }
        };
        fetchDatas();
    }, []);

    return (
        <div className="w-full pt-4 pb-6 px-3 lg:px-5 xl:px-6 overflow-hidden">

            {/* ── HEADER ── */}
            <div className="flex items-center justify-between mb-4 sm:mb-5">
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Accent đỏ — phân biệt với "Sắp Chiếu" vàng */}
                    <div className="w-1 h-5 sm:h-7 rounded-full bg-gradient-to-b from-red-400 to-rose-600 shrink-0" />
                    <div>
                        <h2 className="text-sm sm:text-lg xl:text-xl font-black text-white leading-tight">
                            Phim Đang Chiếu Rạp
                        </h2>
                        <p className="hidden sm:block text-[11px] text-gray-500 mt-0.5">
                            Những bộ phim đang hot trên màn ảnh rộng
                        </p>
                    </div>
                </div>

                {/* Live badge đỏ */}
                <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-red-400/25 bg-red-400/8 text-red-400 text-[9px] sm:text-[11px] font-semibold whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse shrink-0" />
                    <span>Đang chiếu</span>
                </div>
            </div>

            {/* ── CONTENT ── */}
            {loading ? (
                <div className="flex gap-2 sm:gap-3 overflow-hidden">
                    {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : (
                <Swiper
                    className="theaters-swiper"
                    slidesPerView="auto"
                    spaceBetween={8}
                    modules={[Navigation]}
                    navigation={{ hideOnClick: true }}
                    breakpoints={{
                        480:  { spaceBetween: 10 },
                        640:  { spaceBetween: 12 },
                        1024: { spaceBetween: 14 },
                    }}
                >
                    {dataMoviesInTheaters.map((movie) => {
                        const releaseLabel = formatDate(movie.release_date);
                        const score = formatScore(movie.vote_average);

                        return (
                            <SwiperSlide
                                key={movie.id}
                                style={{ width: "clamp(100px, 28vw, 210px)" }}
                            >
                                <Link to={`/phim-rap/${movie.id ?? movie.id}`} className="group block w-full">

                                    {/* ── POSTER ── */}
                                    <div
                                        className="relative w-full rounded-xl overflow-hidden"
                                        style={{ aspectRatio: "2/3" }}
                                    >
                                        <img
                                            src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                                            alt={movie.title ?? movie.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            loading="lazy"
                                        />

                                        {/* Gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

                                        {/* Play — desktop only */}
                                        <div className="hidden sm:flex absolute inset-0 items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                            <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white translate-x-[1px]">
                                                    <path d="M8 5.14v14l11-7-11-7z" />
                                                </svg>
                                            </div>
                                        </div>

                                        {/* Score badge góc trên trái */}
                                        {score && (
                                            <div className="absolute top-1.5 left-1.5">
                                                <div className="flex items-center gap-0.5 px-1 py-0.5 sm:px-1.5 sm:py-1 rounded-lg bg-black/70 backdrop-blur-sm border border-yellow-400/40">
                                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-400 shrink-0">
                                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                    </svg>
                                                    <span className="text-yellow-400 font-black text-[9px] sm:text-[11px] leading-none">{score}</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Bottom badges */}
                                        <div className="absolute bottom-0 inset-x-0 p-1.5 sm:p-2.5">
                                            <div className="flex items-center gap-1">
                                                <span className="flex-1 py-0.5 px-0.5 text-[7px] sm:text-[9px] font-semibold rounded-md bg-red-500/30 border border-red-400/40 text-red-300 text-center backdrop-blur-sm truncate">
                                                    Đang chiếu
                                                </span>
                                                {releaseLabel && (
                                                    <span className="hidden sm:flex flex-1 py-0.5 px-0.5 text-[9px] font-medium rounded-md bg-white/10 border border-white/15 text-gray-300 text-center backdrop-blur-sm truncate justify-center">
                                                        {releaseLabel}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── TITLE ── */}
                                    <div className="mt-1.5 sm:mt-2.5 px-0.5 text-center">
                                        <h3
                                            className="text-[10px] sm:text-[12px] lg:text-[13px] text-white font-semibold truncate group-hover:text-red-300 transition-colors duration-300 leading-snug"
                                            dangerouslySetInnerHTML={{ __html: movie.title ?? movie.name ?? "" }}
                                        />
                                        <p
                                            className="text-[8px] sm:text-[10px] text-gray-500 truncate mt-0.5"
                                            dangerouslySetInnerHTML={{ __html: movie.original_title ?? "" }}
                                        />
                                    </div>
                                </Link>
                            </SwiperSlide>
                        );
                    })}
                </Swiper>
            )}

            <style>{`
                @media (max-width: 639px) {
                    .theaters-swiper .swiper-button-next,
                    .theaters-swiper .swiper-button-prev { display: none !important; }
                }
                .theaters-swiper .swiper-button-next,
                .theaters-swiper .swiper-button-prev {
                    width: 32px; height: 32px; border-radius: 50%;
                    background: rgba(255,255,255,0.08); backdrop-filter: blur(8px);
                    border: 1px solid rgba(255,255,255,0.12);
                    transition: all 0.25s ease; top: 38%;
                }
                .theaters-swiper .swiper-button-next:hover,
                .theaters-swiper .swiper-button-prev:hover {
                    background: rgba(248,113,113,0.15); border-color: rgba(248,113,113,0.4);
                }
                .theaters-swiper .swiper-button-next::after,
                .theaters-swiper .swiper-button-prev::after { font-size: 11px; font-weight: 900; color: white; }
                .theaters-swiper .swiper-button-disabled { opacity: 0 !important; }
                .theaters-swiper { overflow: hidden !important; }
                .theaters-swiper .swiper-wrapper { overflow: visible; }
            `}</style>
        </div>
    );
}
export default memo(MoviesInTheatersSection);
