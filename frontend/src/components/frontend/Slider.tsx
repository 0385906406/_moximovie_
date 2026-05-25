import React, {
    useState,
    useEffect,
    useRef,
    useCallback,
} from "react";
import type { TouchEvent, MouseEvent } from "react";
import { increaseAffiliateCount } from "@/helpers/affiliateHelper";
import { Link } from "react-router-dom";
import { movieService } from "@/services/movieService";
import type { Movie } from "@/types/movie";
import { ThreeDot } from "react-loading-indicators";
import type { Category } from "@/types/category";

const SLIDE_INTERVAL = 6000;
const SWIPE_THRESHOLD = 50;

function preloadImage(src: string) {
    const img = new Image();
    img.src = src;
}

/* track previous index để giữ BG layer cũ trong lúc dissolve */
function usePrevious<T>(value: T) {
    const ref = useRef<T>(value);
    useEffect(() => { ref.current = value; }, [value]);
    return ref.current;
}

const Slider: React.FC = () => {
    const [slides, setSlides]     = useState<Movie[]>([]);
    const [current, setCurrent]   = useState(0);
    const [loading, setLoading]   = useState(true);
    const [isLimitReached, setIsLimitReached] = useState(false);
    const [contentKey, setContentKey]         = useState(0); // tăng để re-trigger CSS animations

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const dragStartX  = useRef<number | null>(null);
    const isAnimating = useRef(false);

    const prevIndex = usePrevious(current);

    /* ── Fetch ── */
    useEffect(() => {
        const fetchSlides = async () => {
            try {
                const data = await movieService.dataSlider();
                const mapped: Movie[] = data.map((movie: Movie) => ({
                    ...movie,
                    category: Array.isArray(movie.category)
                        ? [...new Map(movie.category.map((c: Category) => [c.id, c])).values()]
                        : [],
                }));
                setSlides(mapped);
                mapped.slice(0, 4).forEach((m) =>
                    preloadImage(`https://phimimg.com/${m.thumb_url}`)
                );
            } catch (err) {
                console.error("Fetch slider error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSlides();
    }, []);

    /* ── Autoplay ── */
    const startInterval = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            triggerChange((prev) => (prev + 1) % slides.length);
        }, SLIDE_INTERVAL);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slides.length]);

    useEffect(() => {
        if (!slides.length) return;
        startInterval();
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [slides.length, startInterval]);

    useEffect(() => {
        if (!slides.length) return;
        const next = (current + 1) % slides.length;
        preloadImage(`https://phimimg.com/${slides[next].thumb_url}`);
    }, [current, slides]);

    /* ── Dissolve transition ── */
    const triggerChange = useCallback(
        (indexFn: (prev: number) => number) => {
            if (isAnimating.current || !slides.length) return;
            isAnimating.current = true;
            /* nội dung fade ra trong 350ms, rồi slide đổi + content re-mount */
            setTimeout(() => {
                setCurrent(indexFn);
                setContentKey((k) => k + 1);
                setTimeout(() => { isAnimating.current = false; }, 600);
            }, 350);
        },
        [slides.length]
    );

    const goTo = useCallback(
        (i: number) => { triggerChange(() => i); startInterval(); },
        [triggerChange, startInterval]
    );
    const nextSlide = useCallback(() => {
        triggerChange((p) => (p + 1) % slides.length); startInterval();
    }, [slides.length, triggerChange, startInterval]);
    const prevSlide = useCallback(() => {
        triggerChange((p) => (p - 1 + slides.length) % slides.length); startInterval();
    }, [slides.length, triggerChange, startInterval]);

    /* ── Swipe ── */
    const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => { dragStartX.current = e.touches[0].clientX; };
    const handleTouchMove  = (e: TouchEvent<HTMLDivElement>) => {
        if (dragStartX.current === null) return;
        const delta = e.touches[0].clientX - dragStartX.current;
        if (Math.abs(delta) > SWIPE_THRESHOLD) {
            delta < 0 ? nextSlide() : prevSlide();
            dragStartX.current = null;
        }
    };
    const handleTouchEnd  = () => { dragStartX.current = null; };
    const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => { dragStartX.current = e.clientX; };
    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (dragStartX.current === null) return;
        const delta = e.clientX - dragStartX.current;
        if (Math.abs(delta) > SWIPE_THRESHOLD) {
            delta < 0 ? nextSlide() : prevSlide();
            dragStartX.current = null;
        }
    };
    const handleMouseUp = () => { dragStartX.current = null; };

    const swipeHandlers = {
        onTouchStart: handleTouchStart, onTouchMove: handleTouchMove, onTouchEnd: handleTouchEnd,
        onMouseDown:  handleMouseDown,  onMouseMove:  handleMouseMove, onMouseUp:   handleMouseUp,
        onMouseLeave: handleMouseUp,
    };

    /* ── Loading ── */
    if (loading) {
        return (
            <div className="w-full h-60 sm:h-[650px] xl:h-[850px] flex items-center justify-center bg-[#191B24]">
                <ThreeDot variant="bounce" color="#32cd32" size="medium" text="" textColor="" />
            </div>
        );
    }
    if (!slides.length) return <div className="w-full h-60 sm:h-[650px] xl:h-[850px] bg-[#191B24]" />;

    const slide = slides[current];

    /* ── Affiliate wrapper ── */
    const AffiliateWrap = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
        if (isLimitReached) return <div className={className}>{children}</div>;
        return (
            <a rel="noopener noreferrer" className={className}
                onClick={() => {
                    const data = increaseAffiliateCount();
                    if (data.count >= data.max) setIsLimitReached(true);
                }}>
                {children}
            </a>
        );
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400&display=swap');

                /* ── Progress bar ── */
                @keyframes sl-progress {
                    from { width: 0% }
                    to   { width: 100% }
                }
                /* ── Ken Burns ── */
                @keyframes sl-kenburns {
                    0%   { transform: scale(1)    translate(0, 0); }
                    100% { transform: scale(1.07) translate(-1.2%, 0.8%); }
                }
                /* ── BG cross-dissolve ── */
                @keyframes sl-bgFadeIn {
                    from { opacity: 0 }
                    to   { opacity: 1 }
                }
                /* ── Content stagger ── */
                @keyframes sl-fadeUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes sl-revealMask {
                    from { clip-path: inset(0 100% 0 0); }
                    to   { clip-path: inset(0 0 0 0); }
                }
                /* ── Watermark float ── */
                @keyframes sl-numFloat {
                    0%, 100% { transform: translateY(0px); }
                    50%      { transform: translateY(-10px); }
                }
                /* ── Grain noise ── */
                .sl-wrap::after {
                    content: ''; position: absolute; inset: 0; z-index: 9;
                    pointer-events: none;
                    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
                    opacity: 0.022; mix-blend-mode: overlay;
                }

                /* ── Animation classes ── */
                .sl-cat    { animation: sl-revealMask  0.55s cubic-bezier(.22,1,.36,1) 0.05s both; }
                .sl-title  { animation: sl-fadeUp      0.65s cubic-bezier(.22,1,.36,1) 0.12s both; }
                .sl-origin { animation: sl-fadeUp      0.65s cubic-bezier(.22,1,.36,1) 0.22s both; }
                .sl-divider{ animation: sl-revealMask  0.45s cubic-bezier(.22,1,.36,1) 0.30s both; }
                .sl-meta   { animation: sl-fadeUp      0.55s cubic-bezier(.22,1,.36,1) 0.38s both; }
                .sl-genres { animation: sl-fadeUp      0.55s cubic-bezier(.22,1,.36,1) 0.46s both; }
                .sl-btns   { animation: sl-fadeUp      0.55s cubic-bezier(.22,1,.36,1) 0.54s both; }

                /* ── Vertical tab transitions ── */
                .sl-vtab { transition: opacity 0.3s ease, transform 0.3s cubic-bezier(.22,1,.36,1); }
                .sl-vtab:hover:not(.active) { opacity: 0.7 !important; }
                .sl-vtab-thumb { transition: width 0.3s cubic-bezier(.22,1,.36,1), height 0.3s cubic-bezier(.22,1,.36,1); }
                .sl-vtab-line  { transition: height 0.35s cubic-bezier(.22,1,.36,1); }

                /* ── Button hover ── */
                .sl-btn-green {
                    transition: transform 0.22s cubic-bezier(.22,1,.36,1),
                                box-shadow 0.22s ease,
                                background 0.2s;
                }
                .sl-btn-green:hover {
                    transform: translateY(-2px) scale(1.02);
                    background: #86efac !important;
                    box-shadow: 0 8px 32px rgba(74,222,128,0.55) !important;
                }
                .sl-btn-green:active { transform: translateY(0) scale(0.98); }

                .sl-btn-outline {
                    transition: border-color 0.2s, color 0.2s, background 0.2s;
                }
                .sl-btn-outline:hover {
                    border-color: rgba(74,222,128,0.55) !important;
                    color: #4ade80 !important;
                    background: rgba(74,222,128,0.06) !important;
                }

                /* ── Nav button ── */
                .sl-nav { transition: border-color 0.22s, color 0.22s, background 0.22s, box-shadow 0.22s; }
                .sl-nav:hover {
                    border-color: rgba(74,222,128,0.5) !important;
                    color: #4ade80 !important;
                    background: rgba(74,222,128,0.08) !important;
                    box-shadow: 0 0 14px rgba(74,222,128,0.2) !important;
                }

                /* ── Vertical tab hover ── */
                .sl-vtab:hover .sl-vtab-thumb {
                    outline-color: rgba(74,222,128,0.35) !important;
                }
                .sl-vtab:hover .sl-vtab-num {
                    color: rgba(74,222,128,0.7) !important;
                }

                /* ── Mobile dot pulse when active ── */
                @keyframes sl-dotPulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(74,222,128,0.5); }
                    50%      { box-shadow: 0 0 0 4px rgba(74,222,128,0); }
                }
            `}</style>

            <div
                className="sl-wrap relative w-full h-60 sm:h-[650px] xl:h-[850px] overflow-hidden text-white select-none bg-[#191B24]"
                style={{ zIndex: 30 }}
                {...swipeHandlers}
            >
                {/* ── PROGRESS BAR (top, green) ── */}
                <div className="absolute top-0 left-0 right-0 z-50" style={{ height: "2px", background: "rgba(74,222,128,0.12)" }}>
                    <div
                        key={`prog-${current}`}
                        style={{
                            height: "100%",
                            background: "linear-gradient(90deg, rgba(74,222,128,0.7), #4ade80, rgba(74,222,128,0.7))",
                            borderRadius: "1px",
                            boxShadow: "0 0 8px rgba(74,222,128,0.55)",
                            animation: `sl-progress ${SLIDE_INTERVAL}ms linear forwards`,
                        }}
                    />
                </div>

                {/* ── BACKGROUND LAYERS (cross-dissolve) ── */}
                {slides.map((s, i) => {
                    const isCur  = i === current;
                    const isPrev = i === prevIndex && i !== current;
                    if (!isCur && !isPrev) return null;
                    return (
                        <div
                            key={s._id}
                            className="absolute inset-0"
                            style={{
                                zIndex: isCur ? 2 : 1,
                                opacity: isCur ? 1 : 0,
                                animation: isCur ? "sl-bgFadeIn 0.65s cubic-bezier(.22,1,.36,1) forwards" : undefined,
                            }}
                        >
                            <img
                                src={`https://phimimg.com/${s.thumb_url}`}
                                alt={s.name}
                                className="absolute inset-0 w-full h-full object-cover object-center"
                                style={{ animation: isCur ? `sl-kenburns ${SLIDE_INTERVAL}ms ease-in-out forwards` : undefined }}
                            />
                        </div>
                    );
                })}

                {/* ── OVERLAY STACK ── */}
                {/* 1. Dark veil */}
                <div className="pointer-events-none absolute inset-0 z-10 bg-black/40" />
                {/* 2. Vignette */}
                <div className="pointer-events-none absolute inset-0 z-10"
                    style={{ background: "radial-gradient(ellipse 90% 90% at center, transparent 28%, rgba(0,0,0,0.9) 100%)" }} />
                {/* 3. Left gradient (nền chữ) */}
                <div className="pointer-events-none absolute inset-y-0 left-0 w-3/5 z-10"
                    style={{ background: "linear-gradient(to right, rgba(25,27,36,0.92) 0%, rgba(25,27,36,0.5) 60%, transparent 100%)" }} />
                {/* 4. Bottom fade → #191B24 (cùng màu nền trang) */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10"
                    style={{
                        height: "52%",
                        background: "linear-gradient(to top, #191B24 0%, rgba(25,27,36,0.97) 25%, rgba(25,27,36,0.55) 62%, transparent 100%)",
                    }}
                />
                {/* 5. Dot pattern nhẹ */}
                <div className="pointer-events-none absolute inset-0 z-10"
                    style={{
                        opacity: 0.1,
                        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.14) 1px, transparent 0)",
                        backgroundSize: "28px 28px",
                    }}
                />

                {/* ── WATERMARK NUMBER (desktop) ── */}
                <div
                    className="hidden xl:block pointer-events-none absolute z-11"
                    style={{
                        right: "14%",
                        bottom: "-4%",
                        fontFamily: "'Playfair Display', serif",
                        fontSize: "clamp(200px, 24vw, 320px)",
                        fontWeight: 900,
                        lineHeight: 1,
                        letterSpacing: "-0.05em",
                        color: "rgba(255,255,255,0.035)",
                        userSelect: "none",
                        animation: "sl-numFloat 7s ease-in-out infinite",
                    }}
                >
                    {String(current + 1).padStart(2, "0")}
                </div>

                {/* ── RIGHT VERTICAL TABS (desktop) ── */}
                <div className="hidden xl:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 flex-col pr-6 gap-0.5">
                    {slides.map((item, i) => {
                        const isActive = i === current;
                        return (
                            <div
                                key={item._id ?? i}
                                onClick={() => goTo(i)}
                                className="sl-vtab relative flex items-center gap-3 cursor-pointer py-2.5"
                                style={{ opacity: isActive ? 1 : 0.3 }}
                            >
                                <span
                                    className="tabular-nums"
                                    style={{
                                        fontSize: 10, fontWeight: 600, letterSpacing: "0.1em",
                                        minWidth: 18, textAlign: "right",
                                        color: isActive ? "#4ade80" : "rgba(255,255,255,0.35)",
                                    }}
                                >
                                    {String(i + 1).padStart(2, "0")}
                                </span>
                                <div
                                    className="sl-vtab-thumb overflow-hidden"
                                    style={{
                                        width:  isActive ? 70 : 52,
                                        height: isActive ? 46 : 34,
                                        borderRadius: 3,
                                        outline: isActive ? "1px solid rgba(74,222,128,0.45)" : "none",
                                        outlineOffset: 2,
                                    }}
                                >
                                    <img
                                        src={`https://phimimg.com/${item.thumb_url}`}
                                        alt={item.name ?? ""}
                                        className="w-full h-full object-cover"
                                        style={{
                                            filter: isActive
                                                ? "brightness(1.05) saturate(1.1)"
                                                : "brightness(0.4) saturate(0.65)",
                                        }}
                                    />
                                </div>
                                {/* Active indicator line on far right edge */}
                                <div
                                    className="sl-vtab-line absolute right-0 top-1/2 -translate-y-1/2 rounded-sm"
                                    style={{
                                        width: 2,
                                        height: isActive ? 38 : 0,
                                        background: "#4ade80",
                                        boxShadow: isActive ? "0 0 10px rgba(74,222,128,0.7)" : "none",
                                    }}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* ── MOBILE DOT INDICATORS ── */}
                <div className="xl:hidden absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => goTo(i)}
                            className="rounded-full transition-all duration-300"
                            style={{
                                width:      i === current ? "20px" : "5px",
                                height:     "5px",
                                background: i === current ? "#4ade80" : "rgba(255,255,255,0.2)",
                                boxShadow: i === current ? "0 0 8px rgba(74,222,128,0.6)" : "none",
                                animation: i === current ? "sl-dotPulse 2s ease-in-out infinite" : "none",
                            }}
                        />
                    ))}
                </div>

                {/* ── NỘI DUNG CHÍNH ── */}
                <div
                    key={contentKey}
                    className="relative z-20 flex flex-col justify-end h-full pb-8 sm:pb-24 xl:pb-28 px-4 lg:px-5 xl:pl-16"
                    style={{ maxWidth: "min(660px, calc(100% - 160px))" }}
                >
                    {/* Category eyebrow */}
                    <div className="sl-cat hidden sm:flex items-center gap-2.5 mb-3">
                        <div style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(74,222,128,0.5)", flexShrink: 0, boxShadow: "0 0 6px rgba(74,222,128,0.4)" }} />
                        {slide.country?.length > 0 && (
                            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.42)" }}>
                                {slide.country.map((c) => c.name).join(", ")}
                            </span>
                        )}
                        {Array.isArray(slide.category) && slide.category[0] && (
                            <>
                                <div style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(74,222,128,0.5)", flexShrink: 0, boxShadow: "0 0 6px rgba(74,222,128,0.4)" }} />
                                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.42)" }}>
                                    {slide.category[0].name}
                                </span>
                            </>
                        )}
                    </div>

                    {/* Tên phim — Playfair Display serif */}
                    <h1
                        className="sl-title text-2xl sm:text-5xl xl:text-[clamp(52px,6vw,80px)]"
                        style={{
                            fontFamily: "'Playfair Display', serif",
                            fontWeight: 900,
                            lineHeight: 0.96,
                            letterSpacing: "-0.025em",
                            color: "#ffffff",
                            textShadow: "0 4px 32px rgba(0,0,0,0.75)",
                            margin: 0,
                        }}
                        dangerouslySetInnerHTML={{ __html: slide.name ?? "" }}
                    />

                    {/* Tên gốc — italic */}
                    {slide.origin_name && (
                        <div
                            className="sl-origin hidden sm:block mt-2 mb-3"
                            style={{
                                fontFamily: "'Playfair Display', serif",
                                fontStyle: "italic",
                                fontWeight: 400,
                                fontSize: "clamp(14px, 1.7vw, 20px)",
                                color: "rgba(255,255,255,0.32)",
                            }}
                            dangerouslySetInnerHTML={{ __html: slide.origin_name }}
                        />
                    )}

                    {/* Divider */}
                    <div
                        className="sl-divider hidden sm:block mb-4 rounded-full"
                        style={{ height: 1, width: 40, background: "#4ade80", boxShadow: "0 0 8px rgba(74,222,128,0.5)" }}
                    />

                    {/* Meta row */}
                    <div className="sl-meta hidden sm:flex items-center gap-3 flex-wrap mb-3">
                        {slide.quality && (
                            <span style={{
                                fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
                                padding: "3px 10px", borderRadius: 2,
                                border: "1px solid rgba(74,222,128,0.35)",
                                color: "#4ade80",
                                background: "rgba(74,222,128,0.07)",
                            }}>
                                {slide.quality}
                            </span>
                        )}
                        {(slide.year || slide.time) && (
                            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
                                {[slide.year, slide.time].filter(Boolean).join(" · ")}
                            </span>
                        )}
                    </div>

                    {/* Thể loại */}
                    {Array.isArray(slide.category) && slide.category.length > 0 && (
                        <div className="sl-genres hidden sm:flex flex-wrap gap-1.5 mb-5">
                            {slide.category.map((cat) => (
                                <span
                                    key={cat.id}
                                    style={{
                                        fontSize: 11, padding: "3px 12px",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        borderRadius: 20, color: "rgba(255,255,255,0.38)",
                                    }}
                                >
                                    {cat.name}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* BUTTONS */}
                    <div className="sl-btns flex items-center gap-2.5">
                        <Link to={`/phim/${slide.slug}`}>
                            <button
                                className="sl-btn-green flex items-center gap-2.5"
                                style={{
                                    padding: "12px 26px",
                                    background: "#4ade80",
                                    color: "#0d0f18",
                                    fontSize: 12,
                                    fontWeight: 800,
                                    letterSpacing: "0.1em",
                                    border: "none",
                                    borderRadius: 2,
                                    cursor: "pointer",
                                    boxShadow: "0 4px 22px rgba(74,222,128,0.38)",
                                }}
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 12, height: 12, flexShrink: 0 }}>
                                    <path d="M8 5l11 7-11 7z" />
                                </svg>
                                <span className="hidden sm:inline tracking-wider">XEM PHIM</span>
                            </button>
                        </Link>

                        <Link to={`/phim/${slide.slug}`}>
                            <button
                                className="sl-btn-outline flex items-center justify-center"
                                style={{
                                    padding: "11px 22px",
                                    background: "transparent",
                                    color: "rgba(255,255,255,0.55)",
                                    fontSize: 12,
                                    fontWeight: 500,
                                    letterSpacing: "0.08em",
                                    border: "1px solid rgba(255,255,255,0.18)",
                                    borderRadius: 2,
                                    cursor: "pointer",
                                }}
                            >
                                <span className="hidden sm:inline">CHI TIẾT</span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:hidden" style={{ width: 14, height: 14 }}>
                                    <circle cx="12" cy="12" r="10"/>
                                    <path strokeLinecap="round" d="M12 8v4m0 4h.01"/>
                                </svg>
                            </button>
                        </Link>
                    </div>
                </div>

                {/* ── BOTTOM NAV: prev / counter / next (desktop) ── */}
                <div className="hidden xl:flex absolute bottom-8 z-20 items-center gap-3"
                    style={{ right: "calc(14% + 36px)" }}>
                    <AffiliateWrap>
                        <button onClick={prevSlide} className="sl-nav"
                            style={{
                                width: 36, height: 36, borderRadius: "50%",
                                border: "1px solid rgba(255,255,255,0.14)", background: "transparent",
                                color: "rgba(255,255,255,0.4)", cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 13, height: 13 }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
                            </svg>
                        </button>
                    </AffiliateWrap>

                    <span style={{ fontSize: 11, letterSpacing: "0.1em", color: "rgba(255,255,255,0.28)", whiteSpace: "nowrap" }}>
                        {String(current + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
                    </span>

                    <AffiliateWrap>
                        <button onClick={nextSlide} className="sl-nav"
                            style={{
                                width: 36, height: 36, borderRadius: "50%",
                                border: "1px solid rgba(255,255,255,0.14)", background: "transparent",
                                color: "rgba(255,255,255,0.4)", cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 13, height: 13 }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6"/>
                            </svg>
                        </button>
                    </AffiliateWrap>
                </div>

                {/* ── PREV/NEXT ARROWS (mobile/tablet) ── */}
                <AffiliateWrap className="xl:hidden absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-30">
                    <button onClick={prevSlide} className="sl-nav"
                        style={{
                            width: 34, height: 34, borderRadius: "50%",
                            border: "1px solid rgba(255,255,255,0.15)",
                            background: "rgba(0,0,0,0.22)", backdropFilter: "blur(8px)",
                            color: "rgba(255,255,255,0.5)", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 13, height: 13 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
                        </svg>
                    </button>
                </AffiliateWrap>
                <AffiliateWrap className="xl:hidden absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-30">
                    <button onClick={nextSlide} className="sl-nav"
                        style={{
                            width: 34, height: 34, borderRadius: "50%",
                            border: "1px solid rgba(255,255,255,0.15)",
                            background: "rgba(0,0,0,0.22)", backdropFilter: "blur(8px)",
                            color: "rgba(255,255,255,0.5)", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 13, height: 13 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6"/>
                        </svg>
                    </button>
                </AffiliateWrap>
            </div>
        </>
    );
};

export default Slider;
