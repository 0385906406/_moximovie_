"use client";

import { useEffect, useState , memo } from "react";
import { movieService } from "@/services/movieService";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Movie } from "@/types/movie";
import Link from "next/link";
import Image from "next/image";

// ── Skeleton ──
function SkeletonCard() {
    return (
        <div style={{ width: "clamp(140px, 38vw, 296px)" }} className="flex-shrink-0">
            {/* Poster skeleton */}
            <div className="w-full rounded-xl bg-white/6 animate-pulse" style={{ aspectRatio: "2/3" }} />
            {/* Info row skeleton */}
            <div className="flex items-start gap-3 mt-3 px-1">
                <div className="w-10 h-10 bg-white/6 rounded animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="h-3 bg-white/6 rounded animate-pulse w-4/5" />
                    <div className="h-2.5 bg-white/5 rounded animate-pulse w-3/5" />
                    <div className="h-2.5 bg-white/5 rounded animate-pulse w-2/5" />
                </div>
            </div>
        </div>
    );
}

function TopTVSeriesSection() {
    const [dataTopTVSeries, setDataTopTVSeries] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDatas = async () => {
            setLoading(true);
            try {
                const data = await movieService.dataTopTVSeries();
                setDataTopTVSeries(data);
            } catch (e) {
                console.error("Fetch top TV series error", e);
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
                    {/* Accent vàng — Top 10 */}
                    <div className="w-1 h-5 sm:h-7 rounded-full bg-gradient-to-b from-yellow-400 to-amber-600 shrink-0" />
                    <div>
                        <h2 style={{ fontFamily: "var(--font-primary)", fontSize: "clamp(1rem,3vw,1.7rem)", fontWeight: 700, color: "#fff", lineHeight: 1 }}>
                            Top 10 Phim Bộ Hôm Nay
                        </h2>
                        <p className="hidden sm:block text-[11px] text-gray-500 mt-0.5">
                            Bảng xếp hạng phim bộ được xem nhiều nhất
                        </p>
                    </div>
                </div>

                {/* Rank badge */}
                <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-yellow-400/25 bg-yellow-400/8 text-yellow-400 text-[9px] sm:text-[11px] font-bold whitespace-nowrap">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 shrink-0">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <span>Top 10</span>
                </div>
            </div>

            {/* ── CONTENT ── */}
            {loading ? (
                <div className="flex gap-2 sm:gap-3 overflow-hidden">
                    {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : (
                <Swiper
                    className="top-tvseries-swiper"
                    slidesPerView="auto"
                    spaceBetween={8}
                    modules={[Navigation]}
                    navigation={{ hideOnClick: true }}
                    breakpoints={{
                        480: { spaceBetween: 10 },
                        640: { spaceBetween: 12 },
                        1024: { spaceBetween: 14 },
                    }}
                >
                    {dataTopTVSeries.map((movie, i) => (
                        <SwiperSlide
                            key={movie._id}
                            style={{ width: "clamp(140px, 38vw, 296px)" }}
                        >
                            <div className="group cursor-pointer w-full">

                                {/* ── POSTER với flip chẵn/lẻ GIỮ NGUYÊN ── */}
                                <Link href={`/phim/${movie.slug}`}>
                                    <div
                                        className={`movie-card poster-mask relative w-full overflow-hidden rounded-xl ${i % 2 !== 0 ? "scale-x-[-1]" : ""}`}
                                        style={{ aspectRatio: "2/3" }}
                                    >
                                        {/* Ảnh — không cần lật riêng vì wrapper đã lật */}
                                        <Image
                                            src={`https://phimimg.com/${movie.poster_url}`}
                                            alt={movie.name}
                                            fill
                                            sizes="(max-width: 640px) 30vw, 200px"
                                            quality={70}
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                            loading="lazy"
                                        />

                                        {/* Gradient đáy */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                                        {/* Hover play — counter-lật để không bị mirror */}
                                        <div
                                            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
                                            style={i % 2 !== 0 ? { transform: "scaleX(-1)" } : undefined}
                                        >
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 flex items-center justify-center scale-75 group-hover:scale-100 transition-transform duration-300">
                                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white translate-x-[1px]">
                                                    <path d="M8 5.14v14l11-7-11-7z" />
                                                </svg>
                                            </div>
                                        </div>

                                        {/* Badges đáy — counter-lật để chữ không bị ngược */}
                                        <div
                                            className="absolute bottom-0 inset-x-0 p-1.5 sm:p-2.5"
                                            style={i % 2 !== 0 ? { transform: "scaleX(-1)" } : undefined}
                                        >
                                            <div className="flex items-center gap-1">
                                                {movie.lang && (
                                                    <span className="flex-1 py-0.5 px-0.5 text-[7px] sm:text-[9px] font-medium rounded-md bg-white/10 border border-white/15 text-gray-300 text-center backdrop-blur-sm truncate">
                                                        {movie.lang}
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
                                </Link>

                                {/* ── INFO ROW: số thứ tự + tên phim ── */}
                                <div className="flex items-start gap-2 sm:gap-3 mt-2 sm:mt-3 px-0.5">
                                    {/* Số thứ tự — giữ nguyên gradient vàng */}
                                    <div
                                        className="shrink-0 font-extrabold italic leading-none select-none pt-0.5"
                                        style={{
                                            fontSize: "clamp(1.8rem, 6vw, 3.2rem)",
                                            background: "linear-gradient(39deg, rgba(254,207,89,1), rgba(255,241,204,1))",
                                            WebkitBackgroundClip: "text",
                                            WebkitTextFillColor: "transparent",
                                        }}
                                    >
                                        {i + 1}
                                    </div>

                                    {/* Thông tin phim */}
                                    <div className="min-w-0 flex-1">
                                        <Link href={`/phim/${movie.slug}`}>
                                            <h3
                                                className="text-[11px] sm:text-sm text-white font-semibold truncate group-hover:text-yellow-300 transition-colors duration-300 leading-snug"
                                                dangerouslySetInnerHTML={{ __html: movie.name ?? "" }}
                                            />
                                        </Link>
                                        <Link href={`/phim/${movie.slug}`}>
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
                                                    <span className="text-green-400 font-medium truncate">{movie.episode_current}</span>
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
                    .top-tvseries-swiper .swiper-button-next,
                    .top-tvseries-swiper .swiper-button-prev { display: none !important; }
                }
                .top-tvseries-swiper .swiper-button-next,
                .top-tvseries-swiper .swiper-button-prev {
                    width: 32px; height: 32px; border-radius: 50%;
                    background: rgba(255,255,255,0.08); backdrop-filter: blur(8px);
                    border: 1px solid rgba(255,255,255,0.12);
                    transition: all 0.25s ease; top: 35%;
                }
                .top-tvseries-swiper .swiper-button-next:hover,
                .top-tvseries-swiper .swiper-button-prev:hover {
                    background: rgba(250,204,21,0.15); border-color: rgba(250,204,21,0.4);
                }
                .top-tvseries-swiper .swiper-button-next::after,
                .top-tvseries-swiper .swiper-button-prev::after { font-size: 11px; font-weight: 900; color: white; }
                .top-tvseries-swiper .swiper-button-disabled { opacity: 0 !important; }
                .top-tvseries-swiper { overflow: hidden !important; }
                .top-tvseries-swiper .swiper-wrapper { overflow: visible; }
            `}</style>
        </div>
    );
}
export default memo(TopTVSeriesSection);
