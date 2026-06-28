"use client";

import { useState, useEffect, useRef, useCallback, memo } from "react";
import type { TouchEvent, MouseEvent } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Play, Info } from "lucide-react";
import { movieService } from "@/services/movieService";
import type { Movie } from "@/types/movie";
import Image from "next/image";

const SLIDE_INTERVAL = 10000;
const SWIPE_THRESHOLD = 50;

const STYLES = `
  .as-root * { box-sizing: border-box; }

  .as-stage { height: 600px; }
  @media (max-width: 1179px) { .as-stage { height: 520px; } }
  @media (max-width: 767px)  { .as-stage { height: 440px; } }

  @keyframes asSlideInL  { from{opacity:0;transform:translateX(60px) scale(0.98)} to{opacity:1;transform:none} }
  @keyframes asSlideInR  { from{opacity:0;transform:translateX(-60px) scale(0.98)} to{opacity:1;transform:none} }
  @keyframes asSlideOutL { from{opacity:1;transform:none} to{opacity:0;transform:translateX(-60px) scale(0.98)} }
  @keyframes asSlideOutR { from{opacity:1;transform:none} to{opacity:0;transform:translateX(60px) scale(0.98)} }
  .as-in-l  { animation: asSlideInL  0.65s cubic-bezier(0.16,1,0.3,1) forwards }
  .as-in-r  { animation: asSlideInR  0.65s cubic-bezier(0.16,1,0.3,1) forwards }
  .as-out-l { animation: asSlideOutL 0.65s cubic-bezier(0.16,1,0.3,1) forwards }
  .as-out-r { animation: asSlideOutR 0.65s cubic-bezier(0.16,1,0.3,1) forwards }

  @keyframes asUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
  .as-s1 { animation: asUp 0.5s 0.05s cubic-bezier(0.16,1,0.3,1) both }
  .as-s2 { animation: asUp 0.5s 0.12s cubic-bezier(0.16,1,0.3,1) both }
  .as-s3 { animation: asUp 0.5s 0.20s cubic-bezier(0.16,1,0.3,1) both }
  .as-s4 { animation: asUp 0.5s 0.28s cubic-bezier(0.16,1,0.3,1) both }
  .as-s5 { animation: asUp 0.5s 0.36s cubic-bezier(0.16,1,0.3,1) both }

  @keyframes asKB { from{transform:scale(1) translate(0,0)} to{transform:scale(1.07) translate(-1%,-0.5%)} }
  .as-kb { animation: asKB var(--dur,10s) linear forwards }

  @keyframes asProgress { from{transform:scaleX(0)} to{transform:scaleX(1)} }
  .as-progress { transform-origin:left; animation: asProgress var(--dur,10s) linear forwards }

  @keyframes asPing { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.55);opacity:0.35} }
  .as-ping { animation: asPing 1.6s ease-in-out infinite }

  .as-strip::-webkit-scrollbar { display:none }
  .as-strip { -ms-overflow-style:none; scrollbar-width:none }

  .as-thumb { transition: all 0.35s cubic-bezier(0.16,1,0.3,1) }
  .as-thumb:not(.active):hover { opacity:0.75!important; transform:translateY(-3px) scale(1.05)!important }

  .as-arrow-btn { transition: all 0.2s ease }
  .as-arrow-btn:hover { background: rgba(34,211,165,0.15)!important; border-color: rgba(34,211,165,0.5)!important; color: #22d3a5!important }
`;

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "").trim();

function formatTime(minutes: number) {
    if (!minutes) return null;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ""}`.trim() : `${m}m`;
}

const BgImage = ({ src, alt }: { src: string; alt: string }) => (
    <Image
        src={src} alt={alt}
        fill
        sizes="100vw"
        quality={75}
        className="as-kb object-cover object-top select-none"
        style={{ "--dur": `${SLIDE_INTERVAL}ms` } as React.CSSProperties}
    />
);

/* ─────────────────────────────────────── */
const LatestAnimeCollectionSection = () => {
    const [datas, setDatas]       = useState<Movie[]>([]);
    const [current, setCurrent]   = useState(0);
    const [prevIdx, setPrevIdx]   = useState<number | null>(null);
    const [dir, setDir]           = useState<"left" | "right">("left");
    const [isAnimating, setAnim]  = useState(false);
    const [progressKey, setPK]    = useState(0);

    const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
    const dragStartX   = useRef<number | null>(null);
    const thumbsRef    = useRef<HTMLDivElement>(null);
    const styleInj     = useRef(false);

    useEffect(() => {
        if (styleInj.current) return;
        const s = document.createElement("style");
        s.textContent = STYLES;
        document.head.appendChild(s);
        styleInj.current = true;
    }, []);

    useEffect(() => { movieService.dataAnimeMovies().then(setDatas); }, []);

    const startInterval = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            setDir("left");
            setCurrent(c => (c + 1) % (datas.length || 1));
            setPK(k => k + 1);
        }, SLIDE_INTERVAL);
    }, [datas.length]);

    useEffect(() => {
        if (!datas.length) return;
        startInterval();
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [datas.length, startInterval]);

    const changeTo = useCallback((direction: "left" | "right", target?: number) => {
        if (isAnimating || !datas.length) return;
        const next = target !== undefined
            ? target
            : direction === "left"
                ? (current + 1) % datas.length
                : (current - 1 + datas.length) % datas.length;
        setDir(direction);
        setPrevIdx(current);
        setAnim(true);
        setCurrent(next);
        setPK(k => k + 1);
        setTimeout(() => { setPrevIdx(null); setAnim(false); }, 700);
        startInterval();
        if (thumbsRef.current) {
            const el = thumbsRef.current.children[next] as HTMLElement;
            el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        }
    }, [isAnimating, datas.length, current, startInterval]);

    const onTS  = (e: TouchEvent<HTMLDivElement>) => { dragStartX.current = e.touches[0].clientX; };
    const onTM  = (e: TouchEvent<HTMLDivElement>) => {
        if (!dragStartX.current) return;
        const dx = e.touches[0].clientX - dragStartX.current;
        if (Math.abs(dx) > SWIPE_THRESHOLD) { changeTo(dx < 0 ? "left" : "right"); dragStartX.current = null; }
    };
    const onMD  = (e: MouseEvent<HTMLDivElement>) => { dragStartX.current = e.clientX; };
    const onMM  = (e: MouseEvent<HTMLDivElement>) => {
        if (!dragStartX.current) return;
        const dx = e.clientX - dragStartX.current;
        if (Math.abs(dx) > SWIPE_THRESHOLD) { changeTo(dx < 0 ? "left" : "right"); dragStartX.current = null; }
    };
    const clrDrag = () => { dragStartX.current = null; };

    if (!datas.length) return <div className="w-full" style={{ height: 560 }} />;

    const slide     = datas[current];
    const prevSlide = prevIdx !== null ? datas[prevIdx] : null;
    const inCls     = dir === "left" ? "as-in-l" : "as-in-r";
    const outCls    = dir === "left" ? "as-out-l" : "as-out-r";
    const overview  = slide.content ? stripHtml(slide.content) : "";

    return (
        <div className="as-root w-full px-3 sm:px-5 xl:px-6 pt-4 pb-10">

            {/* ── Section header ── */}
            <div className="flex items-center justify-between mb-4">
                <h2 style={{ fontFamily: "var(--font-primary)", fontSize: "clamp(1rem,3vw,1.7rem)", fontWeight: 700, color: "#fff", lineHeight: 1 }}>Kho Tàng Anime Mới Nhất</h2>
                <Link href="/hoat-hinh"
                    className="flex items-center gap-1 transition-colors duration-200"
                    style={{ color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-primary)", fontSize: "0.78rem" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#22d3a5")}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
                >
                    Xem tất cả <ChevronRight size={14} />
                </Link>
            </div>

            {/* ── Main stage ── */}
            <div
                className="as-stage relative w-full overflow-hidden select-none cursor-grab active:cursor-grabbing"
                style={{ borderRadius: "5.28px", background: "#06090a" }}
                onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={clrDrag}
                onMouseDown={onMD} onMouseMove={onMM} onMouseUp={clrDrag} onMouseLeave={clrDrag}
            >
                {/* BG images */}
                {prevSlide && (
                    <div key={`p-${prevIdx}`} className={`absolute inset-0 ${outCls}`}>
                        <BgImage src={`https://phimimg.com/${prevSlide.thumb_url}`} alt="" />
                    </div>
                )}
                <div key={`c-${current}`} className={`absolute inset-0 ${isAnimating ? inCls : ""}`}>
                    <BgImage src={`https://phimimg.com/${slide.thumb_url}`} alt={slide.name ?? ""} />
                </div>

                {/* Gradient overlays */}
                <div className="absolute inset-0 z-[5] pointer-events-none">
                    <div style={{ background: "linear-gradient(105deg,#06090a 0%,#06090aee 28%,#06090a99 52%,transparent 72%)" }} className="absolute inset-0" />
                    <div style={{ background: "linear-gradient(to top,#06090a 0%,#06090aff 22%,#06090acc 35%,transparent 55%)" }} className="absolute inset-0" />
                    <div style={{ background: "linear-gradient(to bottom,#06090a55 0%,transparent 20%)" }} className="absolute inset-0" />
                </div>

                {/* ── Content ── */}
                <div key={`ct-${current}`} className="absolute inset-0 z-20 flex flex-col justify-end px-6 sm:px-10 lg:px-12" style={{ paddingBottom: "clamp(110px,16vw,150px)" }}>
                    <div style={{ maxWidth: "clamp(280px,54%,640px)", display: "flex", flexDirection: "column", gap: "clamp(8px,1.2vw,13px)" }}>

                        {/* Meta badges */}
                        <div className="as-s1 flex items-center gap-2 flex-wrap">
                            {/* IMDb-style badge */}
                            <span style={{
                                background: "#f5c518", color: "#000",
                                padding: "2px 8px", borderRadius: 4,
                                fontFamily: "var(--font-primary)", fontSize: "0.6rem", fontWeight: 800,
                                letterSpacing: "0.04em",
                            }}>IMDb</span>

                            {/* Age/rating badge */}
                            {slide.quality && (
                                <span style={{
                                    background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
                                    color: "rgba(255,255,255,0.85)", padding: "2px 8px", borderRadius: 4,
                                    fontFamily: "var(--font-primary)", fontSize: "0.6rem", fontWeight: 700,
                                    letterSpacing: "0.04em",
                                }}>{slide.quality}</span>
                            )}

                            {slide.year && (
                                <span style={{
                                    color: "rgba(255,255,255,0.6)",
                                    fontFamily: "var(--font-primary)", fontSize: "0.68rem", fontWeight: 500,
                                }}>{slide.year}</span>
                            )}

                            {slide.time > 0 && (
                                <span style={{
                                    color: "rgba(255,255,255,0.6)",
                                    fontFamily: "var(--font-primary)", fontSize: "0.68rem", fontWeight: 500,
                                }}>{formatTime(slide.time)}</span>
                            )}

                            {slide.episode_current && (
                                <span style={{
                                    background: "rgba(34,211,165,0.12)", border: "1px solid rgba(34,211,165,0.28)",
                                    color: "#22d3a5", padding: "2px 9px", borderRadius: 4,
                                    fontFamily: "var(--font-primary)", fontSize: "0.6rem", fontWeight: 700,
                                    display: "inline-flex", alignItems: "center", gap: 5,
                                }}>
                                    <span className="as-ping w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#22d3a5", flexShrink: 0 }} />
                                    {slide.episode_current}
                                </span>
                            )}
                        </div>

                        {/* Title */}
                        <div className="as-s2">
                            <h1 style={{
                                fontFamily: "var(--font-primary)",
                                fontSize: "clamp(1.5rem,3.8vw,3rem)",
                                fontWeight: 800,
                                color: "#fff", lineHeight: 1.05,
                                textShadow: "0 2px 24px rgba(0,0,0,0.9)",
                                letterSpacing: "-0.01em",
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                paddingTop: "0.06em", paddingBottom: "0.15em",
                            }} dangerouslySetInnerHTML={{ __html: slide.name ?? "" }} />
                            {slide.origin_name && (
                                <p style={{
                                    fontFamily: "var(--font-primary)",
                                    fontSize: "clamp(0.65rem,1.1vw,0.82rem)",
                                    color: "rgba(255,255,255,0.45)", fontWeight: 400, marginTop: 4,
                                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                    paddingTop: "0.06em", paddingBottom: "0.15em",
                                }} dangerouslySetInnerHTML={{ __html: slide.origin_name }} />
                            )}
                        </div>

                        {/* Genres */}
                        {Array.isArray(slide.category) && slide.category.length > 0 && (
                            <div className="as-s3 flex flex-wrap" style={{ gap: 5 }}>
                                {slide.category.slice(0, 4).map(c => (
                                    <span key={c.id} style={{
                                        fontFamily: "var(--font-primary)", fontSize: "0.63rem", fontWeight: 500,
                                        padding: "3px 10px", borderRadius: 4,
                                        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                                        color: "rgba(255,255,255,0.55)",
                                    }}>{c.name}</span>
                                ))}
                            </div>
                        )}

                        {/* Overview */}
                        {overview && (
                            <p className="as-s4" style={{
                                fontFamily: "var(--font-primary)",
                                fontSize: "clamp(0.68rem,1.05vw,0.8rem)",
                                color: "rgba(255,255,255,0.45)", lineHeight: 1.65, fontWeight: 400,
                                display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                            }}>{overview}</p>
                        )}

                        {/* Actions + dots */}
                        <div className="as-s5 flex items-center flex-wrap" style={{ gap: 10 }}>
                            {/* Play — filled */}
                            <Link href={`/phim/${slide.slug}`}>
                                <button
                                    className="flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-95"
                                    style={{
                                        width: 44, height: 44, borderRadius: "50%",
                                        background: "linear-gradient(135deg,#22d3a5,#10b981)",
                                        border: "none", cursor: "pointer",
                                        boxShadow: "0 0 0 0 rgba(34,211,165,0.45), 0 4px 18px rgba(34,211,165,0.4)",
                                    }}
                                >
                                    <Play size={16} fill="#02100d" strokeWidth={0} />
                                </button>
                            </Link>


                            {/* Info */}
                            <Link href={`/phim/${slide.slug}`}>
                                <button
                                    className="flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-95"
                                    style={{
                                        width: 40, height: 40, borderRadius: "50%",
                                        background: "rgba(255,255,255,0.07)",
                                        border: "1.5px solid rgba(255,255,255,0.18)",
                                        color: "rgba(255,255,255,0.75)", cursor: "pointer",
                                    }}
                                >
                                    <Info size={15} />
                                </button>
                            </Link>

                            {/* Dot indicators */}
                            <div className="flex items-center" style={{ gap: 5, marginLeft: 4 }}>
                                {datas.slice(0, Math.min(datas.length, 10)).map((_, i) => (
                                    <button key={i}
                                        onClick={e => { e.stopPropagation(); changeTo(i > current ? "left" : "right", i); }}
                                        style={{
                                            width: i === current ? 22 : 5, height: 5, borderRadius: 99, border: "none",
                                            background: i === current ? "#22d3a5" : "rgba(255,255,255,0.2)",
                                            cursor: "pointer", padding: 0,
                                            transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)",
                                            boxShadow: i === current ? "0 0 8px rgba(34,211,165,0.7)" : "none",
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                {/* ── Nav arrows ── */}
                <button
                    className="as-arrow-btn absolute left-3 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center"
                    style={{
                        width: 36, height: 36, borderRadius: "5.28px",
                        background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.12)",
                        color: "rgba(255,255,255,0.7)", cursor: "pointer",
                        backdropFilter: "blur(8px)",
                    }}
                    onClick={() => changeTo("right")}
                >
                    <ChevronLeft size={18} />
                </button>
                <button
                    className="as-arrow-btn absolute right-3 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center"
                    style={{
                        width: 36, height: 36, borderRadius: "5.28px",
                        background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.12)",
                        color: "rgba(255,255,255,0.7)", cursor: "pointer",
                        backdropFilter: "blur(8px)",
                    }}
                    onClick={() => changeTo("left")}
                >
                    <ChevronRight size={18} />
                </button>

                {/* ── Thumbnail strip — sát đáy stage ── */}
                <div className="absolute bottom-0 left-0 right-0 z-30">
                    <div ref={thumbsRef} className="as-strip flex justify-center overflow-x-auto px-4 pb-3 pt-2" style={{ gap: 6 }}>
                        {datas.map((item, i) => {
                            const isActive = i === current;
                            return (
                                <div
                                    key={item._id ?? i}
                                    onClick={() => changeTo(i > current ? "left" : "right", i)}
                                    className="as-thumb relative flex-shrink-0 overflow-hidden cursor-pointer"
                                    style={{
                                        borderRadius: "5.28px",
                                        width:     isActive ? "clamp(46px,5vw,64px)"  : "clamp(36px,4vw,52px)",
                                        height:    isActive ? "clamp(66px,7.5vw,96px)" : "clamp(52px,6vw,78px)",
                                        opacity:   isActive ? 1 : 0.45,
                                        alignSelf: "flex-end",
                                        boxShadow: isActive
                                            ? "0 0 0 2px #22d3a5, 0 0 16px rgba(34,211,165,0.45)"
                                            : "0 2px 6px rgba(0,0,0,0.6)",
                                        transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)",
                                    }}
                                >
                                    <Image
                                        src={`https://phimimg.com/${item.poster_url || item.thumb_url}`}
                                        alt={item.name ?? ""} loading="lazy"
                                        fill
                                        sizes="(max-width: 640px) 8vw, 64px"
                                        quality={70}
                                        className="object-cover"
                                    />
                                    {isActive && (
                                        <div className="absolute top-0 left-0 right-0 h-[2px] z-10"
                                            style={{ background: "linear-gradient(90deg,transparent,#22d3a5 30%,#22d3a5 70%,transparent)" }}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Progress bar */}
                    <div style={{ height: 2, background: "rgba(255,255,255,0.05)" }}>
                        <div key={`pb-${progressKey}`} className="as-progress h-full"
                            style={{ "--dur": `${SLIDE_INTERVAL}ms`, background: "linear-gradient(90deg,#10b981,#22d3a5,#10b981)" } as React.CSSProperties}
                        />
                    </div>
                </div>

            </div>

        </div>
    );
};

export default memo(LatestAnimeCollectionSection);
