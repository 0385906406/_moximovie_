import { useEffect, useState , memo } from "react";
import { movieService } from "@/services/movieService";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { Link } from "react-router";
import type { Movie } from "@/types/movie";

// ── Skeleton landscape card ──
function SkeletonCard() {
    return (
        <div style={{ width: "clamp(180px, 48vw, 452px)" }} className="flex-shrink-0">
            {/* Thumbnail */}
            <div className="w-full rounded-xl bg-white/6 animate-pulse" style={{ aspectRatio: "16/7" }} />
            {/* Info */}
            <div className="flex items-start gap-3 mt-3 px-1">
                <div className="hidden lg:block w-14 h-[84px] rounded-xl bg-white/6 animate-pulse shrink-0 -mt-10" />
                <div className="flex-1 space-y-2">
                    <div className="h-3 bg-white/6 rounded animate-pulse w-4/5" />
                    <div className="h-2.5 bg-white/5 rounded animate-pulse w-3/5" />
                    <div className="h-2.5 bg-white/5 rounded animate-pulse w-2/5" />
                </div>
            </div>
        </div>
    );
}

function CinemaMoviesSection() {
    const [dataCinemaMovies, setDataCinemaMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDatas = async () => {
            setLoading(true);
            try {
                const data = await movieService.dataCinemaMovies();
                setDataCinemaMovies(data);
            } catch (e) {
                console.error("Fetch cinema movies error", e);
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
                    {/* Accent tím — cinema/rạp */}
                    <div className="w-1 h-5 sm:h-7 rounded-full bg-gradient-to-b from-purple-400 to-violet-600 shrink-0" />
                    <div>
                        <h2 className="text-sm sm:text-lg xl:text-xl font-black text-white leading-tight">
                            Mãn Nhãn với Phim Chiếu Rạp
                        </h2>
                        <p className="hidden sm:block text-[11px] text-gray-500 mt-0.5">
                            Trải nghiệm phim rạp đỉnh cao ngay tại nhà
                        </p>
                    </div>
                </div>

                <Link
                    to="/loc-phim?type_list=phim-chieu-rap"
                    className="group flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors duration-300 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-white/8 hover:border-white/20 bg-white/3 hover:bg-white/8"
                >
                    <span className="hidden sm:inline">Xem thêm</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                        className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-300">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                    </svg>
                </Link>
            </div>

            {/* ── CONTENT ── */}
            {loading ? (
                <div className="flex gap-3 overflow-hidden">
                    {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : (
                <Swiper
                    className="cinema-swiper"
                    slidesPerView="auto"
                    spaceBetween={10}
                    modules={[Navigation]}
                    navigation={{ hideOnClick: true }}
                    breakpoints={{
                        480:  { spaceBetween: 12 },
                        640:  { spaceBetween: 14 },
                        1024: { spaceBetween: 16 },
                    }}
                >
                    {dataCinemaMovies.map((movie) => (
                        <SwiperSlide
                            key={movie._id}
                            style={{ width: "clamp(180px, 48vw, 452px)" }}
                        >
                            <div className="group cursor-pointer w-full">

                                {/* ── THUMBNAIL LANDSCAPE ── */}
                                <Link to={`/phim/${movie.slug}`}>
                                    <div
                                        className="relative w-full rounded-xl overflow-hidden"
                                        style={{ aspectRatio: "16/7" }}
                                    >
                                        <img
                                            src={`https://phimimg.com/${movie.thumb_url}`}
                                            alt={movie.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            loading="lazy"
                                        />

                                        {/* Gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                                        {/* Hover play */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 flex items-center justify-center scale-75 group-hover:scale-100 transition-transform duration-300">
                                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white translate-x-[1px]">
                                                    <path d="M8 5.14v14l11-7-11-7z" />
                                                </svg>
                                            </div>
                                        </div>

                                        {/* Badges đáy */}
                                        <div className="absolute bottom-0 inset-x-0 p-1.5 sm:p-2.5">
                                            <div className="flex items-center gap-1">
                                                {movie.chieurap && (
                                                    <span className="flex-1 py-0.5 px-1 text-[7px] sm:text-[9px] font-bold rounded-md bg-purple-500/30 border border-purple-400/40 text-purple-300 text-center backdrop-blur-sm truncate">
                                                        Chiếu Rạp
                                                    </span>
                                                )}
                                                {movie.time && (
                                                    <span className="hidden sm:flex flex-1 py-0.5 px-1 text-[9px] font-medium rounded-md bg-white/10 border border-white/15 text-gray-300 text-center backdrop-blur-sm truncate justify-center">
                                                        {movie.time}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Link>

                                {/* ── INFO BLOCK ── */}
                                <div className="flex items-start gap-2 sm:gap-3 mt-2 sm:mt-3 px-0.5 relative">

                                    {/* Mini poster — chỉ desktop, nhô lên trên thumbnail */}
                                    <Link to={`/phim/${movie.slug}`} className="hidden lg:block shrink-0">
                                        <div className="w-16 xl:w-20 rounded-xl overflow-hidden shadow-xl -mt-10 xl:-mt-12 ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-105">
                                            <img
                                                src={`https://phimimg.com/${movie.poster_url}`}
                                                alt={movie.name}
                                                className="w-full aspect-[2/3] object-cover"
                                                loading="lazy"
                                            />
                                        </div>
                                    </Link>

                                    {/* Text info */}
                                    <div className="min-w-0 flex-1">
                                        <Link to={`/phim/${movie.slug}`}>
                                            <h3
                                                className="text-[11px] sm:text-sm text-white font-semibold truncate group-hover:text-purple-300 transition-colors duration-300 leading-snug"
                                                dangerouslySetInnerHTML={{ __html: movie.name ?? "" }}
                                            />
                                        </Link>
                                        <Link to={`/phim/${movie.slug}`}>
                                            <p
                                                className="text-[9px] sm:text-[11px] text-gray-500 truncate mt-0.5"
                                                dangerouslySetInnerHTML={{ __html: movie.origin_name ?? "" }}
                                            />
                                        </Link>
                                        <div className="flex items-center gap-1.5 mt-1 text-[9px] sm:text-[11px] text-gray-500 flex-wrap">
                                            {movie.quality && (
                                                <span className="text-white font-semibold">{movie.quality}</span>
                                            )}
                                            {movie.year && (
                                                <>
                                                    <span className="text-gray-700">•</span>
                                                    <span>{movie.year}</span>
                                                </>
                                            )}
                                            {movie.episode_current && (
                                                <>
                                                    <span className="text-gray-700">•</span>
                                                    <span className="text-purple-400 font-medium truncate">{movie.episode_current}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            )}

            <style>{`
                @media (max-width: 639px) {
                    .cinema-swiper .swiper-button-next,
                    .cinema-swiper .swiper-button-prev { display: none !important; }
                }
                .cinema-swiper .swiper-button-next,
                .cinema-swiper .swiper-button-prev {
                    width: 32px; height: 32px; border-radius: 50%;
                    background: rgba(255,255,255,0.08); backdrop-filter: blur(8px);
                    border: 1px solid rgba(255,255,255,0.12);
                    transition: all 0.25s ease; top: 33%;
                }
                .cinema-swiper .swiper-button-next:hover,
                .cinema-swiper .swiper-button-prev:hover {
                    background: rgba(167,139,250,0.15); border-color: rgba(167,139,250,0.4);
                }
                .cinema-swiper .swiper-button-next::after,
                .cinema-swiper .swiper-button-prev::after { font-size: 11px; font-weight: 900; color: white; }
                .cinema-swiper .swiper-button-disabled { opacity: 0 !important; }
                .cinema-swiper { overflow: hidden !important; }
                .cinema-swiper .swiper-wrapper { overflow: visible; }
            `}</style>
        </div>
    );
}
export default memo(CinemaMoviesSection);
