"use client";

import { movieService } from "@/services/movieService";
import { useCallback, useEffect, useRef, useState, memo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "@/lib/swiperStaticSlides";
import type { Swiper as SwiperType } from "swiper";
import type { Movie } from "@/types/movie";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MovieImage from "@/components/frontend/MovieImage";


const getBadgeClass = (val?: string) => {
    const v = (val ?? "").toLowerCase();
    if (v.includes("full") || v.includes("fhd")) return "badge-fhd";
    if (v.includes("hd")) return "badge-hd";
    if (v.includes("cam")) return "badge-cam";
    if (v.includes("thuyết") || v.includes("thuyet")) return "badge-thuyetminh";
    if (v.includes("sub") || v.includes("vietsub")) return "badge-vietsub";
    return "badge-default";
};

const SkeletonCard = ({ delay }: { delay: number }) => (
    <div style={{ width: 200, animationDelay: `${delay}ms` }} className="kr-slide-item flex-shrink-0">
        <div className="kr-skeleton" style={{ width: 200, height: 113 }} />
        <div style={{ paddingTop: 10 }}>
            <div className="kr-skeleton" style={{ height: 13, width: "80%", borderRadius: 6, marginBottom: 7 }} />
            <div className="kr-skeleton" style={{ height: 10, width: "55%", borderRadius: 6 }} />
        </div>
    </div>
);

interface KrProps { initialData?: Movie[] }
function KoreanMoviesSection({ initialData }: KrProps) {
    const [movies, setMovies] = useState<Movie[]>(initialData ?? []);
    const [loading, setLoading] = useState(!initialData?.length);
    const [isBeginning, setIsBeginning] = useState(true);
    const [isEnd, setIsEnd] = useState(false);
    const swiperRef = useRef<SwiperType | null>(null);


    useEffect(() => {
        if (initialData?.length) return;
        setLoading(true);
        movieService.dataKoreanMovies()
            .then(setMovies)
            .catch(e => console.error("Korean movies fetch error:", e))
            .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handlePrev = useCallback(() => swiperRef.current?.slidePrev(), []);
    const handleNext = useCallback(() => swiperRef.current?.slideNext(), []);

    return (
        <div className="kr-section relative w-full" style={{ padding: "clamp(18px,3vw,32px)", paddingBottom: "0px" }}>

            {/* bg pattern */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.025]" style={{
                backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.35) 1px,transparent 0)",
                backgroundSize: "24px 24px",
            }} />
            {/* purple glow */}
            <div className="absolute pointer-events-none" style={{
                top: -60, left: -60, width: 220, height: 220, borderRadius: "50%",
                background: "radial-gradient(circle,rgba(139,92,246,0.12),transparent 70%)",
            }} />

            {/* ── Header ── */}
            <div className="relative z-10 flex items-center justify-between mb-5">
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="kr-title-line h-[3px] rounded-full"
                            style={{ background: "linear-gradient(90deg,#a78bfa,#7c3aed)", width: 0 }} />
                        <span style={{
                            fontFamily: "var(--font-primary)", fontSize: "0.62rem", fontWeight: 700,
                            color: "#a78bfa", letterSpacing: "0.18em", textTransform: "uppercase",
                        }}>K-Drama</span>
                    </div>
                    <h2 style={{ fontFamily: "var(--font-primary)", fontSize: "clamp(1rem,3vw,1.7rem)", fontWeight: 700, color: "#fff", lineHeight: 1 }}>Phim Hàn Quốc Mới</h2>
                </div>

                {/* right side: nav buttons + xem tất cả */}
                <div className="flex items-center gap-3">
                    {/* custom prev/next */}
                    {!loading && (
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={handlePrev}
                                disabled={isBeginning}
                                className="kr-nav-btn flex items-center justify-center rounded-full"
                                style={{
                                    width: 32, height: 32,
                                    background: "rgba(14,15,24,0.75)",
                                    border: "1px solid rgba(255,255,255,0.10)",
                                    color: "rgba(255,255,255,0.65)",
                                    backdropFilter: "blur(8px)",
                                    cursor: "pointer",
                                }}
                                aria-label="Trước"
                            >
                                <ChevronLeft size={15} strokeWidth={2.5} />
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={isEnd}
                                className="kr-nav-btn flex items-center justify-center rounded-full"
                                style={{
                                    width: 32, height: 32,
                                    background: "rgba(14,15,24,0.75)",
                                    border: "1px solid rgba(255,255,255,0.10)",
                                    color: "rgba(255,255,255,0.65)",
                                    backdropFilter: "blur(8px)",
                                    cursor: "pointer",
                                }}
                                aria-label="Tiếp"
                            >
                                <ChevronRight size={15} strokeWidth={2.5} />
                            </button>
                        </div>
                    )}

                    {/* divider */}
                    {!loading && <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.1)" }} />}

                    <Link href="/loc-phim?country=han-quoc&type_list=phim-bo&page=1"
                        className="flex items-center gap-1.5 transition-all duration-200"
                        style={{ color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-primary)", fontSize: "0.78rem", fontWeight: 500 }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#a78bfa")}
                        onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
                    >
                        Xem tất cả
                        <ChevronRight size={12} strokeWidth={2.5} />
                    </Link>
                </div>
            </div>

            {/* ── Content ── */}
            <div className="relative z-10">
                {loading ? (
                    <div className="flex gap-4 overflow-hidden">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <SkeletonCard key={i} delay={i * 60} />
                        ))}
                    </div>
                ) : (
                    <Swiper
                        className="kr-swiper"
                        spaceBetween={14}
                        slidesPerView="auto"
                        onSwiper={swiper => {
                            swiperRef.current = swiper;
                            setIsBeginning(swiper.isBeginning);
                            setIsEnd(swiper.isEnd);
                        }}
                        /* Đổi kích thước cửa sổ → số phim vừa màn hình thay đổi, cập nhật lại nút trước/sau */
                        onResize={swiper => { setIsBeginning(swiper.isBeginning); setIsEnd(swiper.isEnd); }}
                        onSlideChange={swiper => {
                            setIsBeginning(swiper.isBeginning);
                            setIsEnd(swiper.isEnd);
                        }}
                    >
                        {movies.map((movie, idx) => (
                            <SwiperSlide key={movie._id} style={{ width: "auto" }}>
                                <div
                                    className="kr-slide-item kr-card cursor-pointer"
                                    style={{ width: "clamp(160px,17vw,220px)", animationDelay: `${idx * 40}ms` }}
                                >
                                    <Link href={`/phim/${movie.slug}`} style={{ display: "block" }}>
                                        <div className="movie-card relative rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
                                            <MovieImage
                                                movie={movie} prefer="thumb"
                                                alt={movie.name ?? ""} loading="lazy"
                                                fill
                                                sizes="(max-width: 640px) 45vw, 220px"
                                                quality={70}
                                                className="kr-thumb object-cover"
                                            />

                                            {/* Hover overlay */}
                                            <div
                                                className="kr-overlay absolute inset-0 flex flex-col justify-between p-2"
                                                style={{
                                                    background: "linear-gradient(to top,rgba(10,11,18,0.95) 0%,rgba(10,11,18,0.4) 50%,rgba(10,11,18,0.15) 100%)",
                                                    opacity: 0,
                                                }}
                                            >
                                                <div className="flex justify-center items-center flex-1">
                                                    <div
                                                        className="kr-play flex items-center justify-center rounded-full"
                                                        style={{
                                                            width: 40, height: 40,
                                                            background: "rgba(167,139,250,0.9)",
                                                            boxShadow: "0 4px 20px rgba(167,139,250,0.45)",
                                                            opacity: 0, transform: "scale(0.7)",
                                                        }}
                                                    >
                                                        <svg width="12" height="14" viewBox="0 0 12 14" fill="#fff">
                                                            <path d="M11.5 7L.5 13.5V.5l11 6.5Z" />
                                                        </svg>
                                                    </div>
                                                </div>

                                                <div className="kr-info" style={{ opacity: 0, transform: "translateY(6px)" }}>
                                                    <p style={{
                                                        fontFamily: "var(--font-primary)", fontSize: "0.62rem",
                                                        color: "rgba(255,255,255,0.7)", lineHeight: 1.4,
                                                        overflow: "hidden", display: "-webkit-box",
                                                        WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                                                    }}
                                                        dangerouslySetInnerHTML={{ __html: movie.origin_name ?? "" }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Badges */}
                                            <div className="absolute bottom-0 left-0 flex">
                                                {movie.lang && (
                                                    <span style={{
                                                        fontFamily: "var(--font-primary)", fontSize: "0.6rem", fontWeight: 600,
                                                        color: "#fff", padding: "2px 7px", borderRadius: "0 4px 0 0",
                                                        background: "rgba(80,85,108,0.9)",
                                                    }}>{movie.lang}</span>
                                                )}
                                                {movie.quality && (
                                                    <span
                                                        className={getBadgeClass(movie.quality)}
                                                        style={{
                                                            fontFamily: "var(--font-primary)", fontSize: "0.6rem", fontWeight: 700,
                                                            color: "#fff", padding: "2px 7px", borderRadius: "4px 4px 0 0",
                                                        }}
                                                    >{movie.quality}</span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>

                                    <div style={{ paddingTop: 10, paddingLeft: 2, paddingRight: 2 }}>
                                        <Link href={`/phim/${movie.slug}`}>
                                            <h3
                                                style={{
                                                    fontFamily: "var(--font-primary)", fontSize: "0.82rem",
                                                    fontWeight: 600, color: "#fff", lineHeight: 1.35,
                                                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                                    transition: "color 0.2s",
                                                }}
                                                onMouseEnter={e => (e.currentTarget.style.color = "#a78bfa")}
                                                onMouseLeave={e => (e.currentTarget.style.color = "#fff")}
                                                dangerouslySetInnerHTML={{ __html: movie.name ?? "" }}
                                            />
                                        </Link>
                                        <p style={{
                                            fontFamily: "var(--font-primary)", fontSize: "0.68rem",
                                            color: "rgba(255,255,255,0.4)", marginTop: 4,
                                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                        }}
                                            dangerouslySetInnerHTML={{ __html: movie.origin_name ?? "" }}
                                        />
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                )}
            </div>
        </div>
    );
}
export default memo(KoreanMoviesSection);
