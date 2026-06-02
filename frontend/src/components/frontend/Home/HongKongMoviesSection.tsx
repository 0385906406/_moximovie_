import { useEffect, useState , memo } from "react";
import { movieService } from "@/services/movieService";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { Link } from "react-router";
import type { Movie } from "@/types/movie";
import { MovieHoverPopup } from "@/components/frontend/MovieHoverPopup";

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

function HongKongMoviesSection() {
    const [dataHongKongMovies, setDataHongKongMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDatas = async () => {
            setLoading(true);
            try {
                const data = await movieService.dataHongKongMovies();
                setDataHongKongMovies(data);
            } catch (e) {
                console.error("Fetch HongKong movies error", e);
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
                    {/* Accent vàng gold — gợi cảm giác điện ảnh HK kinh điển */}
                    <div className="w-1 h-5 sm:h-7 rounded-full bg-gradient-to-b from-amber-400 to-yellow-600 shrink-0" />
                    <div>
                        <h2 className="text-sm sm:text-lg xl:text-xl font-black text-white leading-tight">
                            Điện Ảnh Hồng Kông ở Chỗ Này Này
                        </h2>
                        <p className="hidden sm:block text-[11px] text-gray-500 mt-0.5">
                            Kinh điển & mới nhất từ điện ảnh Hồng Kông
                        </p>
                    </div>
                </div>

                <Link
                    to="/loc-phim?country=hong-kong"
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
                <div className="flex gap-2 sm:gap-3 overflow-hidden">
                    {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : (
                <Swiper
                    className="hongkong-swiper"
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
                    {dataHongKongMovies.map((movie) => (
                        <SwiperSlide
                            key={movie._id}
                            style={{ width: "clamp(100px, 28vw, 210px)" }}
                        >
                            <MovieHoverPopup movie={movie}>
                                <Link to={`/phim/${movie.slug}`}>
                                    <div className="group cursor-pointer w-full">

                                        {/* POSTER */}
                                        <div className="relative w-full rounded-xl overflow-hidden" style={{ aspectRatio: "2/3" }}>
                                            <img
                                                src={`https://phimimg.com/${movie.poster_url}`}
                                                alt={movie.name}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                loading="lazy"
                                            />

                                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

                                            {/* Play hover */}
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 flex items-center justify-center scale-75 group-hover:scale-100 transition-transform duration-300">
                                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white translate-x-[1px]">
                                                        <path d="M8 5.14v14l11-7-11-7z" />
                                                    </svg>
                                                </div>
                                            </div>

                                            {/* Chiếu rạp badge */}
                                            {movie.chieurap && (
                                                <div className="absolute top-1.5 right-1.5">
                                                    <span className="px-1.5 py-0.5 text-[7px] sm:text-[9px] font-bold rounded-md bg-red-500/80 text-white backdrop-blur-sm">
                                                        Chiếu Rạp
                                                    </span>
                                                </div>
                                            )}

                                            {/* Badges đáy */}
                                            <div className="absolute bottom-0 inset-x-0 p-1.5 sm:p-2.5">
                                                <div className="flex items-center gap-1">
                                                    {movie.quality && (
                                                        <span className="flex-1 py-0.5 px-0.5 text-[7px] sm:text-[9px] font-bold rounded-md bg-amber-500/25 border border-amber-400/30 text-amber-300 text-center backdrop-blur-sm truncate">
                                                            {movie.quality}
                                                        </span>
                                                    )}
                                                    {movie.time && (
                                                        <span className="hidden sm:flex flex-1 py-0.5 px-0.5 text-[9px] font-medium rounded-md bg-white/10 border border-white/15 text-gray-300 text-center backdrop-blur-sm truncate justify-center">
                                                            {movie.time}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* TITLE */}
                                        <div className="mt-1.5 sm:mt-2.5 px-0.5 text-center">
                                            <h3
                                                className="text-[10px] sm:text-[12px] lg:text-[13px] text-white font-semibold truncate group-hover:text-amber-300 transition-colors duration-300 leading-snug"
                                                dangerouslySetInnerHTML={{ __html: movie.name ?? "" }}
                                            />
                                            <p
                                                className="text-[8px] sm:text-[10px] text-gray-500 truncate mt-0.5"
                                                dangerouslySetInnerHTML={{ __html: movie.origin_name ?? "" }}
                                            />
                                        </div>
                                    </div>
                                </Link>
                            </MovieHoverPopup>
                        </SwiperSlide>
                    ))}
                </Swiper>
            )}

            <style>{`
                @media (max-width: 639px) {
                    .hongkong-swiper .swiper-button-next,
                    .hongkong-swiper .swiper-button-prev { display: none !important; }
                }
                .hongkong-swiper .swiper-button-next,
                .hongkong-swiper .swiper-button-prev {
                    width: 32px; height: 32px; border-radius: 50%;
                    background: rgba(255,255,255,0.08); backdrop-filter: blur(8px);
                    border: 1px solid rgba(255,255,255,0.12);
                    transition: all 0.25s ease; top: 38%;
                }
                .hongkong-swiper .swiper-button-next:hover,
                .hongkong-swiper .swiper-button-prev:hover {
                    background: rgba(251,191,36,0.15); border-color: rgba(251,191,36,0.4);
                }
                .hongkong-swiper .swiper-button-next::after,
                .hongkong-swiper .swiper-button-prev::after { font-size: 11px; font-weight: 900; color: white; }
                .hongkong-swiper .swiper-button-disabled { opacity: 0 !important; }
                .hongkong-swiper { overflow: hidden !important; }
                .hongkong-swiper .swiper-wrapper { overflow: visible; }
            `}</style>
        </div>
    );
}
export default memo(HongKongMoviesSection);
