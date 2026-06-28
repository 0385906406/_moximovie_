"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { increaseAffiliateCount } from "@/helpers/affiliateHelper";
import Link from "next/link";
import { movieService } from "@/services/movieService";
import type { Movie } from "@/types/movie";
import type { Category } from "@/types/category";
import { ThreeDot } from "react-loading-indicators";
import NextImage from "next/image";

const INTERVAL     = 7000;
const SWIPE_THRESH = 50;

const FLOATS = [
    { top: "15%", left: "10%",  size: 8, color: "#2DD4BF", delay: "0s"   },
    { top: "70%", left: "8%",   size: 6, color: "#6366F1", delay: "-4s"  },
    { top: "25%", left: "45%",  size: 5, color: "#2DD4BF", delay: "-8s"  },
    { top: "80%", left: "55%",  size: 7, color: "#2DD4BF", delay: "-12s" },
    { top: "35%", left: "88%",  size: 5, color: "#6366F1", delay: "-2s"  },
    { top: "60%", left: "92%",  size: 4, color: "#FCD34D", delay: "-6s"  },
    { top: "10%", left: "70%",  size: 4, color: "#2DD4BF", delay: "-10s" },
    { top: "90%", left: "30%",  size: 5, color: "#6366F1", delay: "-14s" },
];

function preloadImage(src: string) {
    const img = new Image();
    img.src = src;
}

const Slider: React.FC<{ initialData?: Movie[] }> = ({ initialData }) => {
    const [slides, setSlides] = useState<Movie[]>(() => {
        if (!initialData?.length) return [];
        return initialData.map((m: Movie) => ({
            ...m,
            category: Array.isArray(m.category)
                ? [...new Map(m.category.map((c: Category) => [c.id, c])).values()]
                : [],
        }));
    });
    const [active, setActive]   = useState(0);
    const [loading, setLoading] = useState(!initialData?.length);
    const [paused, setPaused]   = useState(false);
    const [progKey, setProgKey] = useState(0);
    const [isLimitReached, setIsLimitReached] = useState(false);

    const touchX = useRef(0);

    /* ── Fetch ── */
    useEffect(() => {
        if (initialData?.length) {
            slides.slice(0, 4).forEach(m => preloadImage(`https://phimimg.com/${m.thumb_url}`));
            return;
        }
        movieService.dataSlider()
            .then((data: Movie[]) => {
                const mapped = data.map((m: Movie) => ({
                    ...m,
                    category: Array.isArray(m.category)
                        ? [...new Map(m.category.map((c: Category) => [c.id, c])).values()]
                        : [],
                }));
                setSlides(mapped);
                mapped.slice(0, 4).forEach(m =>
                    preloadImage(`https://phimimg.com/${m.thumb_url}`)
                );
            })
            .catch(e => console.error("Fetch slider error:", e))
            .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const goTo = useCallback((idx: number) => {
        const n = slides.length;
        if (!n) return;
        setActive(((idx % n) + n) % n);
        setProgKey(k => k + 1);
    }, [slides.length]);

    /* ── Auto-advance ── */
    useEffect(() => {
        if (paused || slides.length <= 1) return;
        const t = setTimeout(() => {
            setActive(a => (a + 1) % slides.length);
            setProgKey(k => k + 1);
        }, INTERVAL);
        return () => clearTimeout(t);
    }, [active, paused, slides.length]);

    /* ── Preload next ── */
    useEffect(() => {
        if (!slides.length) return;
        preloadImage(`https://phimimg.com/${slides[(active + 1) % slides.length].thumb_url}`);
    }, [active, slides]);

    /* ── Keyboard ── */
    useEffect(() => {
        const fn = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft")  goTo(active - 1);
            if (e.key === "ArrowRight") goTo(active + 1);
        };
        document.addEventListener("keydown", fn);
        return () => document.removeEventListener("keydown", fn);
    }, [active, goTo]);

    /* ── Touch ── */
    const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; };
    const onTouchEnd   = (e: React.TouchEvent) => {
        const delta = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(delta) > SWIPE_THRESH) goTo(active + (delta < 0 ? 1 : -1));
    };

    /* ── Affiliate wrapper ── */
    const AffiliateWrap = ({
        children,
        className = "",
    }: {
        children: React.ReactNode;
        className?: string;
    }) => {
        if (isLimitReached) return <div className={className}>{children}</div>;
        return (
            <a
                rel="noopener noreferrer"
                className={className}
                onClick={() => {
                    const data = increaseAffiliateCount();
                    if (data.count >= data.max) setIsLimitReached(true);
                }}
            >
                {children}
            </a>
        );
    };

    /* ── Loading / empty states ── */
    if (loading) return (
        <div className="sl-h w-full flex items-center justify-center bg-[#191B24]">
            <ThreeDot variant="bounce" color="#2DD4BF" size="medium" text="" textColor="" />
        </div>
    );
    if (!slides.length) return <div className="sl-h w-full bg-[#191B24]" />;

    const total = slides.length;

    return (
        <>
            <style>{`
                /* heights */
                .sl-h { height: 600px; }
                @media (max-width: 1179px) { .sl-h { height: 520px; } }
                @media (max-width: 767px)  { .sl-h { height: 440px; } }

                /* keyframes */
                @keyframes sl-drift {
                    0%,100% { transform: translate(0,0); }
                    25%     { transform: translate(10px,-15px); }
                    50%     { transform: translate(-8px,10px); }
                    75%     { transform: translate(12px,8px); }
                }
                @keyframes sl-pulse {
                    0%,100% { opacity:1; transform:scale(1); }
                    50%     { opacity:0.42; transform:scale(0.76); }
                }
                @keyframes sl-progress {
                    from { width:0; }
                    to   { width:100%; }
                }
                @keyframes sl-fadeUp {
                    from { opacity:0; transform:translateY(16px); }
                    to   { opacity:1; transform:translateY(0); }
                }
                @keyframes sl-revealX {
                    from { clip-path:inset(0 100% 0 0); }
                    to   { clip-path:inset(0 0 0 0); }
                }

                /* floating orbs */
                .sl-float  { animation: sl-drift 20s ease-in-out infinite; will-change: transform; }
                .sl-eyedot { animation: sl-pulse 2s ease-in-out infinite; }

                /* content entry — triggers when article gets data-active */
                .sl-slide[data-active] .sl-eyebrow { animation: sl-revealX 0.55s cubic-bezier(.22,1,.36,1) 0.05s both; }
                .sl-slide[data-active] .sl-title   { animation: sl-fadeUp  0.65s cubic-bezier(.22,1,.36,1) 0.15s both; }
                .sl-slide[data-active] .sl-lead    { animation: sl-fadeUp  0.60s cubic-bezier(.22,1,.36,1) 0.25s both; }
                .sl-slide[data-active] .sl-meta    { animation: sl-fadeUp  0.55s cubic-bezier(.22,1,.36,1) 0.35s both; }
                .sl-slide[data-active] .sl-btns    { animation: sl-fadeUp  0.55s cubic-bezier(.22,1,.36,1) 0.43s both; }

                /* tab pill */
                .sl-tab-bar {
                    display: block; height: 10px; border-radius: 100px;
                    transition: width 400ms ease, background 400ms ease, border-color 400ms ease;
                }

                /* inner layout */
                .sl-inner {
                    position: relative; z-index: 3; height: 100%;
                    display: flex; flex-direction: column; justify-content: center;
                    padding: 48px 80px 96px;
                }
                @media (max-width: 1179px) { .sl-inner { padding: 40px 52px 88px; } }
                @media (max-width: 767px)  { .sl-inner { padding: 24px 20px 72px; } }

                /* text clamp */
                .sl-title {
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .sl-lead {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                @media (max-width: 767px) { .sl-lead { display: none; } }

                /* CTA buttons */
                .sl-cta-fill {
                    transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s;
                }
                .sl-cta-fill:hover {
                    transform: translateY(-2px) scale(1.02);
                    background: #5EEAD4 !important;
                    box-shadow: 0 8px 32px rgba(45,212,191,0.55) !important;
                }
                .sl-cta-fill:active { transform: translateY(0) scale(0.98); }

                .sl-cta-ghost {
                    transition: border-color 0.2s, color 0.2s, background 0.2s;
                }
                .sl-cta-ghost:hover {
                    border-color: rgba(45,212,191,0.5) !important;
                    color: #2DD4BF !important;
                    background: rgba(45,212,191,0.06) !important;
                }

                /* reduced motion */
                @media (prefers-reduced-motion: reduce) {
                    .sl-track  { transition: none !important; }
                    .sl-float, .sl-eyedot { animation: none !important; }
                }
            `}</style>

            <section
                className="sl-h relative w-full overflow-hidden select-none bg-[#191B24]"
                style={{ zIndex: 30 }}
                aria-roledescription="carousel"
                aria-label="Phim nổi bật"
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
                onFocus={() => setPaused(true)}
                onBlur={() => setPaused(false)}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
            >
                {/* Layer 1 — dot texture */}
                <div
                    aria-hidden
                    style={{
                        position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
                        backgroundImage: [
                            "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.03) 1px, transparent 1px)",
                            "radial-gradient(circle at 60% 70%, rgba(255,255,255,0.03) 1px, transparent 1px)",
                            "radial-gradient(circle at 80% 40%, rgba(255,255,255,0.03) 1px, transparent 1px)",
                        ].join(", "),
                        backgroundSize: "60px 60px, 80px 80px, 100px 100px",
                    }}
                />

                {/* Layer 2 — floating orbs */}
                <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }}>
                    {FLOATS.map((f, i) => (
                        <span
                            key={i}
                            className="sl-float"
                            style={{
                                position: "absolute",
                                top: f.top, left: f.left,
                                width: f.size, height: f.size,
                                borderRadius: "50%",
                                background: f.color,
                                boxShadow: `0 0 16px ${f.color}`,
                                animationDelay: f.delay,
                                display: "block",
                            }}
                        />
                    ))}
                </div>

                {/* Layer 3 — horizontal slide track */}
                <div
                    className="sl-track"
                    style={{
                        position: "absolute", top: 0, bottom: 0, left: 0,
                        zIndex: 4, display: "flex",
                        width: `${total * 100}%`,
                        transform: `translateX(-${active * (100 / total)}%)`,
                        transition: "transform 600ms cubic-bezier(0.65, 0, 0.35, 1)",
                        willChange: "transform",
                    }}
                >
                    {slides.map((slide, i) => {
                        const isActive = i === active;
                        return (
                            <article
                                key={slide._id ?? i}
                                className="sl-slide"
                                data-active={isActive || undefined}
                                role="group"
                                aria-roledescription="slide"
                                aria-label={`${i + 1} / ${total}`}
                                aria-hidden={!isActive}
                                style={{
                                    flex: `0 0 ${100 / total}%`,
                                    position: "relative", height: "100%", overflow: "hidden",
                                }}
                            >
                                {/* Background image */}
                                <NextImage
                                    src={`https://phimimg.com/${slide.thumb_url}`}
                                    alt={slide.name ?? ""}
                                    fill
                                    sizes="100vw"
                                    quality={80}
                                    priority={i === 0}
                                    style={{
                                        objectFit: "cover", objectPosition: "center",
                                        filter: "saturate(0.72) brightness(0.92)",
                                        zIndex: 1,
                                    }}
                                />

                                {/* Overlay: left-heavy navy + bottom fade to page bg */}
                                <div
                                    aria-hidden
                                    style={{
                                        position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
                                        background: [
                                            "linear-gradient(90deg, rgba(25,27,36,0.99) 0%, rgba(25,27,36,0.95) 32%, rgba(25,27,36,0.68) 54%, rgba(25,27,36,0.18) 74%, rgba(25,27,36,0.30) 100%)",
                                            "linear-gradient(to bottom, rgba(25,27,36,0.28) 0%, transparent 22%, transparent 60%, rgba(25,27,36,1) 100%)",
                                        ].join(", "),
                                    }}
                                />

                                {/* Slide content */}
                                <div className="sl-inner">
                                    <div style={{ maxWidth: 660 }}>

                                        {/* Eyebrow */}
                                        <span
                                            className="sl-eyebrow"
                                            style={{
                                                display: "inline-flex", alignItems: "center", gap: 10,
                                                color: "#2DD4BF", marginBottom: 20,
                                                fontSize: 10, fontWeight: 700,
                                                letterSpacing: "0.22em", textTransform: "uppercase",
                                            }}
                                        >
                                            <span
                                                className="sl-eyedot"
                                                aria-hidden
                                                style={{
                                                    display: "block",
                                                    width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                                                    background: "#2DD4BF", boxShadow: "0 0 10px #2DD4BF",
                                                }}
                                            />
                                            {slide.country?.[0]?.name && (
                                                <>
                                                    <span>{slide.country[0].name}</span>
                                                    <span style={{ color: "rgba(255,255,255,0.22)" }}>·</span>
                                                </>
                                            )}
                                            <span>
                                                {(Array.isArray(slide.category) && slide.category[0]?.name) ?? "Phim mới"}
                                            </span>
                                        </span>

                                        {/* Movie title */}
                                        <h1
                                            className="sl-title"
                                            style={{
                                                color: "#7DD3FC",
                                                fontSize: "clamp(22px, 3.8vw, 42px)",
                                                lineHeight: 1.2, fontWeight: 800,
                                                letterSpacing: "-0.4px", marginBottom: 14,
                                                textShadow: "0 2px 24px rgba(0,0,0,0.55)",
                                            }}
                                            dangerouslySetInnerHTML={{ __html: slide.name ?? "" }}
                                        />

                                        {/* Origin name as lead */}
                                        {slide.origin_name && (
                                            <p
                                                className="sl-lead"
                                                style={{
                                                    color: "rgba(255,255,255,0.52)",
                                                    fontSize: 14, lineHeight: 1.65,
                                                    marginBottom: 20, fontStyle: "italic",
                                                }}
                                                dangerouslySetInnerHTML={{ __html: slide.origin_name }}
                                            />
                                        )}

                                        {/* Meta row */}
                                        <div
                                            className="sl-meta"
                                            style={{
                                                display: "flex", alignItems: "center",
                                                flexWrap: "wrap", gap: 10, marginBottom: 28,
                                            }}
                                        >
                                            {slide.quality && (
                                                <span style={{
                                                    fontSize: 9, fontWeight: 700,
                                                    letterSpacing: "0.18em", textTransform: "uppercase",
                                                    padding: "3px 10px", borderRadius: 2,
                                                    border: "1px solid rgba(45,212,191,0.38)",
                                                    color: "#2DD4BF", background: "rgba(45,212,191,0.07)",
                                                }}>
                                                    {slide.quality}
                                                </span>
                                            )}
                                            {(slide.year || slide.time) && (
                                                <span style={{
                                                    fontSize: 11, fontWeight: 500,
                                                    letterSpacing: "0.06em",
                                                    color: "rgba(255,255,255,0.30)",
                                                }}>
                                                    {[slide.year, slide.time].filter(Boolean).join(" · ")}
                                                </span>
                                            )}
                                            {Array.isArray(slide.category) && slide.category.slice(0, 3).map(cat => (
                                                <span key={cat.id} style={{
                                                    fontSize: 10, fontWeight: 500,
                                                    padding: "3px 11px",
                                                    border: "1px solid rgba(255,255,255,0.12)",
                                                    borderRadius: 20,
                                                    color: "rgba(255,255,255,0.30)",
                                                }}>
                                                    {cat.name}
                                                </span>
                                            ))}
                                        </div>

                                        {/* CTA buttons */}
                                        <div className="sl-btns" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                            <AffiliateWrap>
                                                <Link href={`/xem-phim/${slide.slug}`}>
                                                    <button
                                                        className="sl-cta-fill"
                                                        style={{
                                                            display: "inline-flex", alignItems: "center", gap: 8,
                                                            padding: "11px 24px", borderRadius: 3, border: "none",
                                                            background: "#2DD4BF", color: "#06234C",
                                                            fontSize: 11, fontWeight: 700,
                                                            letterSpacing: "0.15em", textTransform: "uppercase",
                                                            cursor: "pointer",
                                                            boxShadow: "0 4px 22px rgba(45,212,191,0.38)",
                                                        }}
                                                    >
                                                        <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 11, height: 11, flexShrink: 0 }}>
                                                            <path d="M8 5l11 7-11 7z" />
                                                        </svg>
                                                        <span className="hidden sm:inline">XEM PHIM</span>
                                                    </button>
                                                </Link>
                                            </AffiliateWrap>

                                            <Link href={`/phim/${slide.slug}`}>
                                                <button
                                                    className="sl-cta-ghost"
                                                    style={{
                                                        display: "inline-flex", alignItems: "center",
                                                        justifyContent: "center",
                                                        padding: "10px 20px", borderRadius: 3,
                                                        background: "transparent",
                                                        border: "1px solid rgba(255,255,255,0.18)",
                                                        color: "rgba(255,255,255,0.48)",
                                                        fontSize: 11, fontWeight: 600,
                                                        letterSpacing: "0.12em", textTransform: "uppercase",
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    <span className="hidden sm:inline">CHI TIẾT</span>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:hidden" style={{ width: 14, height: 14 }}>
                                                        <circle cx="12" cy="12" r="10" />
                                                        <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
                                                    </svg>
                                                </button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>

                {/* Dot / pill tab indicators */}
                <div
                    role="tablist"
                    aria-label="Chọn slide"
                    style={{
                        position: "absolute",
                        left: "50%", transform: "translateX(-50%)",
                        bottom: 0, zIndex: 5,
                        display: "flex", alignItems: "center", gap: 8, paddingBottom: 20,
                    }}
                >
                    {slides.map((s, i) => (
                        <button
                            key={s._id ?? i}
                            type="button"
                            role="tab"
                            aria-selected={i === active}
                            aria-label={`Slide ${i + 1}`}
                            onClick={() => goTo(i)}
                            style={{
                                padding: "6px 3px",
                                background: "transparent", border: "none",
                                cursor: "pointer",
                                display: "flex", alignItems: "center",
                            }}
                        >
                            <span
                                className="sl-tab-bar"
                                style={{
                                    width:      i === active ? 28 : 10,
                                    background: i === active ? "#22d3a5" : "rgba(255,255,255,0.26)",
                                    border:     `1.5px solid ${i === active ? "#22d3a5" : "rgba(255,255,255,0.42)"}`,
                                }}
                            />
                        </button>
                    ))}
                </div>

                {/* Progress bar */}
                <div
                    aria-hidden
                    style={{
                        position: "absolute", bottom: 0, left: 0, right: 0,
                        height: 4, zIndex: 6,
                        background: "rgba(255,255,255,0.07)", overflow: "hidden",
                    }}
                >
                    <div
                        key={progKey}
                        style={{
                            height: "100%", width: 0,
                            background: "linear-gradient(90deg, #10b981, #22d3a5, #10b981)",
                            boxShadow: "0 0 12px rgba(34,211,165,0.45)",
                            animationName: "sl-progress",
                            animationDuration: `${INTERVAL}ms`,
                            animationTimingFunction: "linear",
                            animationFillMode: "forwards",
                            animationIterationCount: "1",
                            animationPlayState: paused ? "paused" : "running",
                        } as React.CSSProperties}
                    />
                </div>
            </section>
        </>
    );
};

export default Slider;
