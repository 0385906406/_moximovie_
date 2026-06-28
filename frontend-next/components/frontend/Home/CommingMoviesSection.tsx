"use client";

import { useEffect, useState , memo } from "react";
import { movieService } from "@/services/movieService";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import Link from "next/link";
import Image from "next/image";

// ── Type riêng cho coming movie — release_date là string "YYYY-MM-DD" ──
interface CommingMovie {
    id: string;
    title?: string;
    name?: string;
    original_title?: string;
    poster_path?: string;
    release_date?: string; // ← string, không phải number
}

// ── Helpers ──
function formatDate(dateStr?: string): string | null {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function daysUntil(dateStr?: string): string | null {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    const diff = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? String(diff) : null;
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

function CommingMoviesSection() {
    const [dataCommingMovies, setDataCommingMovies] = useState<CommingMovie[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDatas = async () => {
            setLoading(true);
            try {
                const data = await movieService.dataCommingMovies();
                setDataCommingMovies(data);
            } catch (e) {
                console.error("Fetch coming movies error", e);
            } finally {
                setLoading(false);
            }
        };
        fetchDatas();
    }, []);

    return (
        <div className="w-full pt-4 pb-6 px-3 lg:px-5 xl:px-6 overflow-hidden">

            {/* HEADER */}
            <div className="flex items-center justify-between mb-4 sm:mb-5">
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-1 h-5 sm:h-7 rounded-full bg-gradient-to-b from-yellow-400 to-orange-500 shrink-0" />
                    <div>
                        <h2 style={{ fontFamily: "var(--font-primary)", fontSize: "clamp(1rem,3vw,1.7rem)", fontWeight: 700, color: "#fff", lineHeight: 1 }}>
                            Phim Sắp Chiếu Rạp
                        </h2>
                        <p className="hidden sm:block text-[11px] text-gray-500 mt-0.5">
                            Đừng bỏ lỡ những bom tấn sắp ra mắt
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-yellow-400/25 bg-yellow-400/8 text-yellow-400 text-[9px] sm:text-[11px] font-semibold whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse shrink-0" />
                    <span>Sắp ra mắt</span>
                </div>
            </div>

            {/* CONTENT */}
            {loading ? (
                <div className="flex gap-2 sm:gap-3 overflow-hidden">
                    {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : (
                <Swiper
                    className="comming-swiper"
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
                    {dataCommingMovies.map((movie) => {
                        const days = daysUntil(movie.release_date);
                        const releaseLabel = formatDate(movie.release_date);

                        return (
                            <SwiperSlide
                                key={movie.id}
                                style={{ width: "clamp(100px, 28vw, 210px)" }}
                            >
                                <Link href={`/phim-rap/${movie.id ?? movie.id}`} className="group block w-full">

                                    {/* POSTER */}
                                    <div className="movie-card relative w-full rounded-xl overflow-hidden" style={{ aspectRatio: "2/3" }}>
                                        <Image
                                            src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                                            alt={movie.title ?? movie.name ?? ""}
                                            fill
                                            sizes="(max-width: 640px) 30vw, 200px"
                                            quality={70}
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                            loading="lazy"
                                        />

                                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

                                        {/* Play — desktop only */}
                                        <div className="hidden sm:flex absolute inset-0 items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                            <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white translate-x-[1px]">
                                                    <path d="M8 5.14v14l11-7-11-7z" />
                                                </svg>
                                            </div>
                                        </div>

                                        {/* Countdown */}
                                        {days && (
                                            <div className="absolute top-1.5 left-1.5">
                                                <div className="flex flex-col items-center px-1 py-0.5 sm:px-2 sm:py-1.5 rounded-lg bg-black/70 backdrop-blur-sm border border-yellow-400/40">
                                                    <span className="text-yellow-400 font-black text-xs sm:text-base leading-none">{days}</span>
                                                    <span className="text-yellow-400/70 text-[6px] sm:text-[8px] font-bold tracking-widest uppercase leading-none mt-0.5">ngày</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Bottom badges */}
                                        <div className="absolute bottom-0 inset-x-0 p-1.5 sm:p-2.5">
                                            <div className="flex items-center gap-1">
                                                <span className="flex-1 py-0.5 px-0.5 text-[7px] sm:text-[9px] font-semibold rounded-md bg-yellow-400/25 border border-yellow-400/30 text-yellow-300 text-center backdrop-blur-sm truncate">
                                                    Sắp chiếu
                                                </span>
                                                {releaseLabel && (
                                                    <span className="hidden sm:flex flex-1 py-0.5 px-0.5 text-[9px] font-medium rounded-md bg-white/10 border border-white/15 text-gray-300 text-center backdrop-blur-sm truncate justify-center">
                                                        {releaseLabel}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* TITLE */}
                                    <div className="mt-1.5 sm:mt-2.5 px-0.5 text-center">
                                        <h3
                                            className="text-[10px] sm:text-[12px] lg:text-[13px] text-white font-semibold truncate group-hover:text-yellow-300 transition-colors duration-300 leading-snug"
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
                    .comming-swiper .swiper-button-next,
                    .comming-swiper .swiper-button-prev { display: none !important; }
                }
                .comming-swiper .swiper-button-next,
                .comming-swiper .swiper-button-prev {
                    width: 32px; height: 32px; border-radius: 50%;
                    background: rgba(255,255,255,0.08); backdrop-filter: blur(8px);
                    border: 1px solid rgba(255,255,255,0.12);
                    transition: all 0.25s ease; top: 38%;
                }
                .comming-swiper .swiper-button-next:hover,
                .comming-swiper .swiper-button-prev:hover {
                    background: rgba(250,204,21,0.15); border-color: rgba(250,204,21,0.4);
                }
                .comming-swiper .swiper-button-next::after,
                .comming-swiper .swiper-button-prev::after { font-size: 11px; font-weight: 900; color: white; }
                .comming-swiper .swiper-button-disabled { opacity: 0 !important; }
                .comming-swiper { overflow: hidden !important; }
                .comming-swiper .swiper-wrapper { overflow: visible; }
            `}</style>
        </div>
    );
}
export default memo(CommingMoviesSection);
