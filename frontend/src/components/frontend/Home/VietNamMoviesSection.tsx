import { movieService } from "@/services/movieService";
import { useEffect, useRef, useState , memo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import type { Movie } from "@/types/movie";
import { Link } from "react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@400;500;600;700&display=swap');

  .vn-section * { box-sizing: border-box; }

  .vn-card { transition: transform 0.32s cubic-bezier(0.16,1,0.3,1); }
  .vn-card:hover { transform: translateY(-6px); }
  .vn-card:hover .vn-thumb { transform: scale(1.07); }
  .vn-card:hover .vn-overlay { opacity: 1 !important; }
  .vn-card:hover .vn-play { opacity: 1 !important; transform: scale(1) !important; }
  .vn-card:hover .vn-info { opacity: 1 !important; transform: translateY(0) !important; }

  .vn-thumb   { transition: transform 0.42s cubic-bezier(0.16,1,0.3,1); }
  .vn-overlay { transition: opacity 0.3s ease; }
  .vn-play    { transition: all 0.3s cubic-bezier(0.16,1,0.3,1); }
  .vn-info    { transition: all 0.35s 0.05s cubic-bezier(0.16,1,0.3,1); }
  .vn-play:hover { background: rgba(248,113,113,1) !important; transform: scale(1.1) !important; }

  @keyframes vnShimmer {
    0%   { background-position: -600px 0 }
    100% { background-position:  600px 0 }
  }
  .vn-skeleton {
    background: linear-gradient(90deg, #1e2030 25%, #272a3d 50%, #1e2030 75%);
    background-size: 600px 100%;
    animation: vnShimmer 1.6s ease-in-out infinite;
    border-radius: 12px;
  }

  @keyframes vnLine { from { width:0 } to { width:44px } }
  .vn-title-line { animation: vnLine 0.8s 0.3s cubic-bezier(0.16,1,0.3,1) both; }

  @keyframes vnFadeUp { from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)} }
  .vn-slide-item { animation: vnFadeUp 0.45s cubic-bezier(0.16,1,0.3,1) both; }

  .vn-nav-btn { transition: all 0.2s cubic-bezier(0.16,1,0.3,1); }
  .vn-nav-btn:hover {
    background: rgba(248,113,113,0.12) !important;
    border-color: rgba(248,113,113,0.40) !important;
    color: #f87171 !important;
    transform: scale(1.08);
  }
  .vn-nav-btn:active { transform: scale(0.94); }
  .vn-nav-btn:disabled { opacity: 0.2 !important; pointer-events: none; }
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
    <div style={{ width: 200, animationDelay: `${delay}ms` }} className="vn-slide-item flex-shrink-0">
        <div className="vn-skeleton" style={{ width: 200, height: 113 }} />
        <div style={{ paddingTop: 10 }}>
            <div className="vn-skeleton" style={{ height: 13, width: "80%", borderRadius: 6, marginBottom: 7 }} />
            <div className="vn-skeleton" style={{ height: 10, width: "55%", borderRadius: 6 }} />
        </div>
    </div>
);

function VietNamMoviesSection() {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);
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
        setLoading(true);
        movieService.dataVietNamMovies()
            .then(setMovies)
            .catch(e => console.error("VietNam movies fetch error:", e))
            .finally(() => setLoading(false));
    }, []);

    const handlePrev = () => swiperRef.current?.slidePrev();
    const handleNext = () => swiperRef.current?.slideNext();

    return (
        <div className="vn-section relative w-full" style={{ padding: "clamp(18px,3vw,32px)", paddingBottom: "0px" }}>

            {/* bg pattern */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.025]" style={{
                backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.35) 1px,transparent 0)",
                backgroundSize: "24px 24px",
            }} />
            {/* red glow */}
            <div className="absolute pointer-events-none" style={{
                top: -60, left: -60, width: 220, height: 220, borderRadius: "50%",
                background: "radial-gradient(circle,rgba(220,38,38,0.1),transparent 70%)",
            }} />

            {/* ── Header ── */}
            <div className="relative z-10 flex items-center justify-between mb-5">
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="vn-title-line h-[3px] rounded-full"
                            style={{ background: "linear-gradient(90deg,#f87171,#dc2626)", width: 0 }} />
                        <span style={{
                            fontFamily: "'Outfit',sans-serif", fontSize: "0.62rem", fontWeight: 700,
                            color: "#f87171", letterSpacing: "0.18em", textTransform: "uppercase",
                        }}>V-Drama</span>
                    </div>
                    <h2
                        style={{
                            fontFamily: "'Outfit',sans-serif",
                            color: "white",
                            textTransform: "uppercase",
                            fontSize: "clamp(1.55rem,3vw,1.7rem)",
                            lineHeight: 1
                        }}
                    >Phim Việt Nam Mới</h2>
                </div>

                {/* right: nav + xem tất cả */}
                <div className="flex items-center gap-3">
                    {!loading && (
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={handlePrev}
                                disabled={isBeginning}
                                className="vn-nav-btn flex items-center justify-center rounded-full"
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
                                className="vn-nav-btn flex items-center justify-center rounded-full"
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

                    <Link
                        to="/loc-phim?country=viet-nam&type_list=phim-bo&page=1"
                        className="flex items-center gap-1.5 transition-all duration-200"
                        style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Outfit',sans-serif", fontSize: "0.78rem", fontWeight: 500 }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
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
                        className="vn-swiper"
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
                                    className="vn-slide-item vn-card cursor-pointer"
                                    style={{ width: "clamp(160px,17vw,220px)", animationDelay: `${idx * 40}ms` }}
                                >
                                    <Link to={`/phim/${movie.slug}`} style={{ display: "block" }}>
                                        <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
                                            <img
                                                src={`https://phimimg.com/${movie.thumb_url}`}
                                                alt={movie.name ?? ""} loading="lazy"
                                                className="vn-thumb w-full h-full object-cover"
                                            />

                                            <div
                                                className="vn-overlay absolute inset-0 flex flex-col justify-between p-2"
                                                style={{
                                                    background: "linear-gradient(to top,rgba(10,11,18,0.95) 0%,rgba(10,11,18,0.4) 50%,rgba(10,11,18,0.15) 100%)",
                                                    opacity: 0,
                                                }}
                                            >
                                                <div className="flex justify-center items-center flex-1">
                                                    <div
                                                        className="vn-play flex items-center justify-center rounded-full"
                                                        style={{
                                                            width: 40, height: 40,
                                                            background: "rgba(248,113,113,0.9)",
                                                            boxShadow: "0 4px 20px rgba(248,113,113,0.45)",
                                                            opacity: 0, transform: "scale(0.7)",
                                                        }}
                                                    >
                                                        <svg width="12" height="14" viewBox="0 0 12 14" fill="#fff">
                                                            <path d="M11.5 7L.5 13.5V.5l11 6.5Z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <div className="vn-info" style={{ opacity: 0, transform: "translateY(6px)" }}>
                                                    <p style={{
                                                        fontFamily: "'Outfit',sans-serif", fontSize: "0.62rem",
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
                                                        fontFamily: "'Outfit',sans-serif", fontSize: "0.6rem", fontWeight: 600,
                                                        color: "#fff", padding: "2px 7px", borderRadius: "0 4px 0 0",
                                                        background: "rgba(80,85,108,0.9)",
                                                    }}>{movie.lang}</span>
                                                )}
                                                {movie.quality && (
                                                    <span style={{
                                                        fontFamily: "'Outfit',sans-serif", fontSize: "0.6rem", fontWeight: 700,
                                                        color: "#fff", padding: "2px 7px", borderRadius: "4px 4px 0 0",
                                                        ...getBadgeStyle(movie.quality),
                                                    }}>{movie.quality}</span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>

                                    <div style={{ paddingTop: 10, paddingLeft: 2, paddingRight: 2 }}>
                                        <Link to={`/phim/${movie.slug}`}>
                                            <h3
                                                style={{
                                                    fontFamily: "'Outfit',sans-serif", fontSize: "0.82rem",
                                                    fontWeight: 600, color: "#fff", lineHeight: 1.35,
                                                    overflow: "hidden", display: "-webkit-box",
                                                    WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                                                    transition: "color 0.2s",
                                                }}
                                                onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
                                                onMouseLeave={e => (e.currentTarget.style.color = "#fff")}
                                                dangerouslySetInnerHTML={{ __html: movie.name ?? "" }}
                                            />
                                        </Link>
                                        <p style={{
                                            fontFamily: "'Outfit',sans-serif", fontSize: "0.68rem",
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
export default memo(VietNamMoviesSection);
