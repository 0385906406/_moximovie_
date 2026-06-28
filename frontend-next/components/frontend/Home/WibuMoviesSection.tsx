"use client";

import { movieService } from "@/services/movieService";
import { useEffect, useRef, useState , memo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import type { Movie } from "@/types/movie";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

const STYLES = `
  .wb-section * { box-sizing: border-box; }

  .wb-card { transition: transform 0.32s cubic-bezier(0.16,1,0.3,1); }
  .wb-card:hover { transform: translateY(-6px); }
  .wb-card:hover .wb-thumb { transform: scale(1.07); }
  .wb-card:hover .wb-overlay { opacity: 1 !important; }
  .wb-card:hover .wb-play { opacity: 1 !important; transform: scale(1) !important; }
  .wb-card:hover .wb-info { opacity: 1 !important; transform: translateY(0) !important; }

  .wb-thumb   { transition: transform 0.42s cubic-bezier(0.16,1,0.3,1); }
  .wb-overlay { transition: opacity 0.3s ease; }
  .wb-play    { transition: all 0.3s cubic-bezier(0.16,1,0.3,1); }
  .wb-info    { transition: all 0.35s 0.05s cubic-bezier(0.16,1,0.3,1); }
  .wb-play:hover { background: rgba(244,114,182,1) !important; transform: scale(1.1) !important; }

  @keyframes wbShimmer {
    0%   { background-position: -600px 0 }
    100% { background-position:  600px 0 }
  }
  .wb-skeleton {
    background: linear-gradient(90deg, #1e2030 25%, #272a3d 50%, #1e2030 75%);
    background-size: 600px 100%;
    animation: wbShimmer 1.6s ease-in-out infinite;
    border-radius: 12px;
  }

  @keyframes wbLine { from { width:0 } to { width:44px } }
  .wb-title-line { animation: wbLine 0.8s 0.3s cubic-bezier(0.16,1,0.3,1) both; }

  @keyframes wbFadeUp { from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)} }
  .wb-slide-item { animation: wbFadeUp 0.45s cubic-bezier(0.16,1,0.3,1) both; }

  .wb-nav-btn { transition: all 0.2s cubic-bezier(0.16,1,0.3,1); }
  .wb-nav-btn:hover {
    background: rgba(244,114,182,0.12) !important;
    border-color: rgba(244,114,182,0.40) !important;
    color: #f472b6 !important;
    transform: scale(1.08);
  }
  .wb-nav-btn:active { transform: scale(0.94); }
  .wb-nav-btn:disabled { opacity: 0.2 !important; pointer-events: none; }
`;

const getBadgeStyle = (val?: string): React.CSSProperties => {
    const v = (val ?? "").toLowerCase();
    if (v.includes("full") || v.includes("fhd")) return { background: "linear-gradient(135deg,#8b5cf6,#6d28d9)" };
    if (v.includes("hd")) return { background: "linear-gradient(135deg,#3b82f6,#1d4ed8)" };
    if (v.includes("cam")) return { background: "linear-gradient(135deg,#ef4444,#b91c1c)" };
    if (v.includes("thuyết") || v.includes("thuyet")) return { background: "linear-gradient(135deg,#f97316,#c2410c)" };
    if (v.includes("sub") || v.includes("vietsub")) return { background: "linear-gradient(135deg,#22c55e,#15803d)" };
    return { background: "rgba(255,255,255,0.12)" };
};

const SkeletonCard = ({ delay }: { delay: number }) => (
    <div style={{ width: 200, animationDelay: `${delay}ms` }} className="wb-slide-item flex-shrink-0">
        <div className="wb-skeleton" style={{ width: 200, height: 113 }} />
        <div style={{ paddingTop: 10 }}>
            <div className="wb-skeleton" style={{ height: 13, width: "80%", borderRadius: 6, marginBottom: 7 }} />
            <div className="wb-skeleton" style={{ height: 10, width: "55%", borderRadius: 6 }} />
        </div>
    </div>
);

interface WbProps { initialData?: Movie[] }
function WibuMoviesSection({ initialData }: WbProps) {
    const [movies, setMovies] = useState<Movie[]>(initialData ?? []);
    const [loading, setLoading] = useState(!initialData?.length);
    const [isBeginning, setIsBeginning] = useState(true);
    const [isEnd, setIsEnd] = useState(false);
    const swiperRef = useRef<SwiperType | null>(null);
    const styleInjected = useRef(false);

    useEffect(() => {
        if (!styleInjected.current) {
            const tag = document.createElement("style");
            tag.textContent = STYLES;
            document.head.appendChild(tag);
            styleInjected.current = true;
        }
    }, []);

    useEffect(() => {
        if (initialData?.length) return;
        setLoading(true);
        movieService.dataAnimeMovies()
            .then(setMovies)
            .catch(e => console.error("Anime movies fetch error:", e))
            .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handlePrev = () => swiperRef.current?.slidePrev();
    const handleNext = () => swiperRef.current?.slideNext();

    return (
        <div className="wb-section relative w-full" style={{ padding: "clamp(18px,3vw,32px)" }}>

            {/* bg pattern */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.025]" style={{
                backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.35) 1px,transparent 0)",
                backgroundSize: "24px 24px",
            }} />
            {/* pink glow */}
            <div className="absolute pointer-events-none" style={{
                top: -60, left: -60, width: 220, height: 220, borderRadius: "50%",
                background: "radial-gradient(circle,rgba(244,114,182,0.1),transparent 70%)",
            }} />

            {/* ── Header ── */}
            <div className="relative z-10 flex items-center justify-between mb-5">
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="wb-title-line h-[3px] rounded-full"
                            style={{ background: "linear-gradient(90deg,#f472b6,#fb923c)", width: 0 }} />
                        <span style={{
                            fontFamily: "var(--font-primary)", fontSize: "0.62rem", fontWeight: 700,
                            color: "#f472b6", letterSpacing: "0.18em", textTransform: "uppercase",
                        }}>Anime</span>
                    </div>
                    <h2 style={{ fontFamily: "var(--font-primary)", fontSize: "clamp(1rem,3vw,1.7rem)", fontWeight: 700, color: "#fff", lineHeight: 1 }}>Wibu Chúa</h2>
                </div>

                {/* right: nav + xem tất cả */}
                <div className="flex items-center gap-3">
                    {!loading && (
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={handlePrev}
                                disabled={isBeginning}
                                className="wb-nav-btn flex items-center justify-center rounded-full"
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
                                className="wb-nav-btn flex items-center justify-center rounded-full"
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

                    {!loading && <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.1)" }} />}

                    <Link href="/hoat-hinh"
                        className="flex items-center gap-1.5 transition-all duration-200"
                        style={{ color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-primary)", fontSize: "0.78rem", fontWeight: 500 }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#f472b6")}
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
                        className="wb-swiper"
                        spaceBetween={14}
                        slidesPerView="auto"
                        onSwiper={swiper => {
                            swiperRef.current = swiper;
                            setIsBeginning(swiper.isBeginning);
                            setIsEnd(swiper.isEnd);
                        }}
                        onSlideChange={swiper => {
                            setIsBeginning(swiper.isBeginning);
                            setIsEnd(swiper.isEnd);
                        }}
                    >
                        {movies.map((movie, idx) => (
                            <SwiperSlide key={movie._id} style={{ width: "auto" }}>
                                <div
                                    className="wb-slide-item wb-card cursor-pointer"
                                    style={{ width: "clamp(160px,17vw,220px)", animationDelay: `${idx * 40}ms` }}
                                >
                                    <Link href={`/phim/${movie.slug}`} style={{ display: "block" }}>
                                        <div className="movie-card relative rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
                                            <Image
                                                src={`https://phimimg.com/${movie.thumb_url}`}
                                                alt={movie.name ?? ""} loading="lazy"
                                                fill
                                                sizes="(max-width: 640px) 45vw, 220px"
                                                quality={70}
                                                className="wb-thumb object-cover"
                                            />

                                            <div
                                                className="wb-overlay absolute inset-0 flex flex-col justify-between p-2"
                                                style={{
                                                    background: "linear-gradient(to top,rgba(10,11,18,0.95) 0%,rgba(10,11,18,0.4) 50%,rgba(10,11,18,0.15) 100%)",
                                                    opacity: 0,
                                                }}
                                            >
                                                <div className="flex justify-center items-center flex-1">
                                                    <div
                                                        className="wb-play flex items-center justify-center rounded-full"
                                                        style={{
                                                            width: 40, height: 40,
                                                            background: "rgba(244,114,182,0.9)",
                                                            boxShadow: "0 4px 20px rgba(244,114,182,0.45)",
                                                            opacity: 0, transform: "scale(0.7)",
                                                        }}
                                                    >
                                                        <svg width="12" height="14" viewBox="0 0 12 14" fill="#fff">
                                                            <path d="M11.5 7L.5 13.5V.5l11 6.5Z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <div className="wb-info" style={{ opacity: 0, transform: "translateY(6px)" }}>
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

                                            <div className="absolute bottom-0 left-0 flex">
                                                {movie.lang && (
                                                    <span style={{
                                                        fontFamily: "var(--font-primary)", fontSize: "0.6rem", fontWeight: 600,
                                                        color: "#fff", padding: "2px 7px", borderRadius: "0 4px 0 0",
                                                        background: "rgba(80,85,108,0.9)",
                                                    }}>{movie.lang}</span>
                                                )}
                                                {movie.quality && (
                                                    <span style={{
                                                        fontFamily: "var(--font-primary)", fontSize: "0.6rem", fontWeight: 700,
                                                        color: "#fff", padding: "2px 7px", borderRadius: "4px 4px 0 0",
                                                        ...getBadgeStyle(movie.quality),
                                                    }}>{movie.quality}</span>
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
                                                onMouseEnter={e => (e.currentTarget.style.color = "#f472b6")}
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
export default memo(WibuMoviesSection);
