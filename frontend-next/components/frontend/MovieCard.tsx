"use client";

import { memo, useRef, useState, useCallback, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Play, Clock, CalendarDays, Film, PlayCircle } from "lucide-react";
import type { Movie } from "@/types/movie";
import MovieImage from "@/components/frontend/MovieImage";
import { getImageProps } from "next/image";
import { movieImageSources } from "@/lib/movieImage";

/* ══════════════════════════════════
   TRAILER FETCH  (module-level cache)
══════════════════════════════════ */
const TMDB_KEY = "e65862b12156ee1397271e1894f00b2c";
const _trailerCache = new Map<string, string | null>();

async function fetchTrailerKey(movie: Movie): Promise<string | null> {
    const query = movie.origin_name || movie.name;
    const ck = `${query}|${movie.year}|${movie.type}`;
    if (_trailerCache.has(ck)) return _trailerCache.get(ck) as string | null;
    try {
        const mt = movie.type === "series" ? "tv" : "movie";
        const sp = new URLSearchParams({ api_key: TMDB_KEY, language: "en-US", query });
        if (movie.year) sp.set("year", String(movie.year));
        const sd = await fetch(`https://api.themoviedb.org/3/search/${mt}?${sp}`).then(r => r.json());
        const rid = sd.results?.[0]?.id;
        if (!rid) { _trailerCache.set(ck, null); return null; }
        const vd = await fetch(`https://api.themoviedb.org/3/${mt}/${rid}/videos?api_key=${TMDB_KEY}`).then(r => r.json());
        const t = (vd.results as { type: string; site: string; key: string }[])
            ?.find(x => x.type === "Trailer" && x.site === "YouTube")
            ?? vd.results?.find((x: { site: string; key: string }) => x.site === "YouTube");
        const key: string | null = t?.key ?? null;
        _trailerCache.set(ck, key);
        return key;
    } catch {
        _trailerCache.set(ck, null);
        return null;
    }
}

/* ══════════════════
   HELPERS
══════════════════ */
function formatTime(min: number) {
    if (!min) return null;
    const h = Math.floor(min / 60), m = min % 60;
    return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ""}` : `${m}m`;
}

function qualityStyle(q?: string): { bg: string; color: string } {
    const v = (q ?? "").toLowerCase();
    if (v.includes("full") || v.includes("fhd")) return { bg: "linear-gradient(135deg,#7c3aed,#6d28d9)", color: "#fff" };
    if (v.includes("hd"))    return { bg: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff" };
    if (v.includes("cam"))   return { bg: "linear-gradient(135deg,#dc2626,#b91c1c)", color: "#fff" };
    if (v.includes("sub"))   return { bg: "linear-gradient(135deg,#16a34a,#15803d)", color: "#fff" };
    if (v.includes("thuyet") || v.includes("thuyết")) return { bg: "linear-gradient(135deg,#ea580c,#c2410c)", color: "#fff" };
    return { bg: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.75)" };
}

/* ══════════════════════════════════
   POPUP TIMING (dùng chung mọi card)
══════════════════════════════════ */
const OPEN_DELAY  = 550;  // giữ chuột bao lâu thì mở popup
const WARM_DELAY  = 120;  // vừa đóng popup khác → mở nhanh khi lướt sang card kế
const WARM_WINDOW = 450;
const CLOSE_DELAY = 140;  // cho phép di chuột từ card sang popup mà không bị đóng
const POPUP_THUMB_SIZES = "420px";

/* Chỉ 1 popup mở tại 1 thời điểm */
let closeActive: (() => void) | null = null;
let lastCloseAt = 0;

/* Đang cuộn thì card lướt qua dưới con trỏ → không được bật popup */
let lastScrollAt = 0;
if (typeof window !== "undefined") {
    window.addEventListener("scroll", () => { lastScrollAt = Date.now(); }, { passive: true, capture: true });
}

/* Điện thoại/tablet không có hover thật → không mở popup (tap vào card là vào trang phim) */
const canHover = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/* Tải trước ảnh ngang của popup trong lúc chờ mở → popup hiện ra là có ảnh ngay, không bị ô đen */
const _preloaded = new Set<string>();
function preloadPopupThumb(movie: Movie) {
    const src = movieImageSources(movie, "thumb")[0];
    if (!src || _preloaded.has(src)) return;
    _preloaded.add(src);
    const { props } = getImageProps({ src, alt: "", fill: true, sizes: POPUP_THUMB_SIZES, quality: 80 });
    const img = new Image();
    img.sizes = POPUP_THUMB_SIZES;
    if (props.srcSet) img.srcset = props.srcSet;
    img.src = props.src;
}

type Phase = "closed" | "open" | "closing";
interface Geo { top: number; left: number; width: number; originX: number; originY: number; fromScale: number }

function calcGeo(rect: DOMRect, height: number): Geo {
    const width = Math.round(Math.min(420, Math.max(280, rect.width * 2.3)));
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const left = Math.min(Math.max(cx - width / 2, 8), window.innerWidth - width - 8);
    const top  = Math.min(Math.max(cy - height / 2, 8), window.innerHeight - height - 8);

    /* Popup bắt đầu đúng bằng kích thước card rồi phóng to ra → cảm giác card "nở" thành popup */
    return { top, left, width, originX: cx - left, originY: cy - top, fromScale: rect.width / width };
}

/* ══════════════════════════════════
   MOVIE CARD
══════════════════════════════════ */
/* priority: card ở hàng đầu (ảnh lớn nhất lúc mở trang — LCP) → tải ngay, không lazy */
function MovieCard({ movie, priority = false }: { movie: Movie; priority?: boolean }) {

    const wrapRef    = useRef<HTMLDivElement>(null);
    const popupRef   = useRef<HTMLDivElement>(null);
    const enterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const readyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [phase, setPhase] = useState<Phase>("closed");
    const phaseRef = useRef<Phase>("closed");
    phaseRef.current = phase;

    const [geo, setGeo] = useState<Geo | null>(null);
    /* undefined = fetching | null = no trailer | string = YT key */
    const [trailerKey,   setTrailerKey]   = useState<string | null | undefined>(undefined);
    const [thumbHovered, setThumbHovered] = useState(false);
    const [trailerOn,    setTrailerOn]    = useState(false);  // iframe đã mount (giữ nguyên tới khi đóng popup)
    const [trailerReady, setTrailerReady] = useState(false);  // iframe đã load xong → mới hiện, tránh chớp đen

    const clearTimer = (t: React.MutableRefObject<ReturnType<typeof setTimeout> | null>) => {
        if (t.current) { clearTimeout(t.current); t.current = null; }
    };

    const close = useCallback(() => {
        clearTimer(enterTimer);
        clearTimer(leaveTimer);
        if (phaseRef.current === "open") setPhase("closing");
        lastCloseAt = Date.now();
        if (closeActive === close) closeActive = null;
    }, []);

    const open = useCallback(() => {
        const el = wrapRef.current;
        if (!el || !el.matches(":hover") || Date.now() - lastScrollAt < 200) return;
        const rect = el.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;

        if (closeActive && closeActive !== close) closeActive();
        closeActive = close;

        setGeo(calcGeo(rect, rect.width * 2.3 * 0.5625 + 200));
        setPhase("open");
        fetchTrailerKey(movie).then(setTrailerKey);
    }, [close, movie]);

    const handleEnter = useCallback(() => {
        if (!canHover()) return;
        clearTimer(leaveTimer);
        if (phaseRef.current === "open" || enterTimer.current) return;
        preloadPopupThumb(movie);
        const warm = Date.now() - lastCloseAt < WARM_WINDOW;
        enterTimer.current = setTimeout(() => { enterTimer.current = null; open(); }, warm ? WARM_DELAY : OPEN_DELAY);
    }, [open, movie]);

    const handleLeave = useCallback(() => {
        clearTimer(enterTimer);
        if (phaseRef.current !== "open") return;
        clearTimer(leaveTimer);
        leaveTimer.current = setTimeout(close, CLOSE_DELAY);
    }, [close]);

    const cancelLeave = useCallback(() => clearTimer(leaveTimer), []);

    /* Đo chiều cao thật của popup trước khi vẽ → căn giữa chính xác, không tràn khỏi màn hình */
    useLayoutEffect(() => {
        if (phase !== "open" || !popupRef.current || !wrapRef.current) return;
        const next = calcGeo(wrapRef.current.getBoundingClientRect(), popupRef.current.offsetHeight);
        setGeo(g => (g && Math.abs(g.top - next.top) < 1 && Math.abs(g.left - next.left) < 1 ? g : next));
    }, [phase]);

    /* Cuộn trang / đổi kích thước → đóng popup thay vì đuổi theo card (tránh giật) */
    useEffect(() => {
        if (phase !== "open") return;
        window.addEventListener("scroll", close, { passive: true, capture: true });
        window.addEventListener("resize", close);
        window.addEventListener("blur", close);
        return () => {
            window.removeEventListener("scroll", close, { capture: true });
            window.removeEventListener("resize", close);
            window.removeEventListener("blur", close);
        };
    }, [phase, close]);

    /* Bắt đầu trailer khi rê vào vùng ảnh và đã có key */
    useEffect(() => {
        if (phase === "open" && thumbHovered && typeof trailerKey === "string") setTrailerOn(true);
    }, [phase, thumbHovered, trailerKey]);

    useEffect(() => () => {
        clearTimer(enterTimer);
        clearTimer(leaveTimer);
        clearTimer(readyTimer);
        if (closeActive === close) closeActive = null;
    }, [close]);

    const handleAnimationEnd = (e: React.AnimationEvent<HTMLDivElement>) => {
        if (e.target !== e.currentTarget || e.animationName !== "mcPopOut") return;
        clearTimer(readyTimer);
        setPhase("closed");
        setThumbHovered(false);
        setTrailerOn(false);
        setTrailerReady(false);
    };

    const qs = qualityStyle(movie.quality);
    const isSeries = movie.type === "series";
    const showTrailer = thumbHovered && trailerReady;
    const trailerLoading = thumbHovered && (trailerKey === undefined || (typeof trailerKey === "string" && !trailerReady));

    return (
        <div ref={wrapRef} onMouseEnter={handleEnter} onMouseLeave={handleLeave}>

            {/* ━━━━━━━━━━━━━━━━━
                BASE CARD
            ━━━━━━━━━━━━━━━━━ */}
            <Link href={`/phim/${movie.slug}`} className="group block">
                <div
                    className="mc-frame relative w-full aspect-[2/3] rounded-xl overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.04)", boxShadow: "0 4px 18px rgba(0,0,0,0.45)" }}
                >
                    {movie.poster_url || movie.thumb_url ? (
                        <MovieImage
                            movie={movie} prefer="poster" alt={movie.name} fill
                            sizes="(max-width: 640px) 33vw, (max-width: 1280px) 20vw, 14vw"
                            quality={75}
                            className="mc-zoom object-cover"
                            priority={priority}
                            loading={priority ? undefined : "lazy"}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Film size={26} className="text-white/15" />
                        </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/10 pointer-events-none" />

                    {/* Hover overlay + play */}
                    <div className="mc-fade absolute inset-0 flex items-center justify-center pointer-events-none"
                        style={{ background: "rgba(0,0,0,0.32)" }}>
                        <div className="mc-play w-11 h-11 rounded-full flex items-center justify-center"
                            style={{ background: "rgba(34,211,165,0.9)", boxShadow: "0 0 22px rgba(34,211,165,0.55)" }}>
                            <Play size={15} fill="white" strokeWidth={0} className="translate-x-[1px]" />
                        </div>
                    </div>

                    {movie.quality && (
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-[3px] rounded-md text-[10px] font-bold tracking-wide leading-none"
                            style={{ background: qs.bg, color: qs.color }}>
                            {movie.quality}
                        </span>
                    )}
                    {isSeries && movie.episode_current && (
                        <span className="absolute top-1.5 right-1.5 px-1.5 py-[3px] rounded-md text-[10px] font-semibold leading-none text-white"
                            style={{ background: "rgba(0,0,0,0.72)", border: "1px solid rgba(255,255,255,0.1)" }}>
                            {movie.episode_current}
                        </span>
                    )}
                    {movie.year && (
                        <span className="absolute bottom-1.5 right-2 text-[10px] font-mono text-white/45">{movie.year}</span>
                    )}
                </div>

                <div className="mt-2 px-0.5">
                    <p className="text-[13px] font-semibold text-white/90 leading-tight line-clamp-1 group-hover:text-[#22d3a5] transition-colors duration-200"
                        dangerouslySetInnerHTML={{ __html: movie.name }} />
                    {movie.origin_name && (
                        <p className="text-[11px] text-white/32 mt-[3px] line-clamp-1"
                            dangerouslySetInnerHTML={{ __html: movie.origin_name }} />
                    )}
                </div>
            </Link>

            {/* ━━━━━━━━━━━━━━━━━
                HOVER POPUP
                Nở ra từ đúng vị trí card, thu lại khi đóng.
                Trailer chỉ chạy khi rê chuột vào vùng ảnh.
            ━━━━━━━━━━━━━━━━━ */}
            {phase !== "closed" && geo && createPortal(
                <div
                    ref={popupRef}
                    onMouseEnter={cancelLeave}
                    onMouseLeave={handleLeave}
                    onAnimationEnd={handleAnimationEnd}
                    className={phase === "open" ? "mc-pop mc-pop-in" : "mc-pop mc-pop-out"}
                    style={{
                        top: geo.top,
                        left: geo.left,
                        width: geo.width,
                        transformOrigin: `${geo.originX}px ${geo.originY}px`,
                        "--mc-from": geo.fromScale,
                    } as React.CSSProperties}
                >
                    {/* ── Thumb / Trailer area ── */}
                    <Link
                        href={`/phim/${movie.slug}`}
                        className="relative block w-full overflow-hidden"
                        style={{ aspectRatio: "16/9", background: "#090b12" }}
                        onMouseEnter={() => setThumbHovered(true)}
                        onMouseLeave={() => setThumbHovered(false)}
                    >
                        <MovieImage
                            movie={movie} prefer="thumb" alt={movie.name} fill sizes={POPUP_THUMB_SIZES} quality={80}
                            loading="eager"
                            className="object-cover"
                            style={{ opacity: showTrailer ? 0 : 1, transition: "opacity 0.35s ease" }}
                        />

                        {/* Trailer — pointer-events:none để chuột vẫn thuộc về vùng ảnh */}
                        {trailerOn && typeof trailerKey === "string" && (
                            <iframe
                                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailerKey}&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1`}
                                allow="autoplay; encrypted-media"
                                title={`Trailer ${movie.name}`}
                                onLoad={() => {
                                    clearTimer(readyTimer);
                                    /* YouTube cần thêm chút thời gian sau onLoad mới bắt đầu phát */
                                    readyTimer.current = setTimeout(() => setTrailerReady(true), 450);
                                }}
                                className="absolute inset-0 w-full h-full"
                                style={{
                                    border: "none", pointerEvents: "none",
                                    opacity: showTrailer ? 1 : 0,
                                    transition: "opacity 0.35s ease",
                                }}
                            />
                        )}

                        {/* Gợi ý: rê vào để xem trailer */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none"
                            style={{ background: "rgba(0,0,0,0.18)", opacity: thumbHovered ? 0 : 1, transition: "opacity 0.25s ease" }}>
                            <div className="w-12 h-12 rounded-full flex items-center justify-center"
                                style={{ background: "rgba(34,211,165,0.85)", boxShadow: "0 0 28px rgba(34,211,165,0.45)" }}>
                                <Play size={18} fill="white" strokeWidth={0} className="translate-x-[1px]" />
                            </div>
                            {typeof trailerKey === "string" && (
                                <span className="text-[11px] text-white/70 font-medium tracking-wide">
                                    Di chuột vào để xem trailer
                                </span>
                            )}
                        </div>

                        {/* Đang tải trailer */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
                            style={{ background: "rgba(0,0,0,0.45)", opacity: trailerLoading ? 1 : 0, transition: "opacity 0.25s ease" }}>
                            <PlayCircle size={32} className="animate-pulse" style={{ color: "#22d3a5" }} />
                        </div>

                        {/* Không có trailer */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none"
                            style={{ background: "rgba(0,0,0,0.35)", opacity: thumbHovered && trailerKey === null ? 1 : 0, transition: "opacity 0.25s ease" }}>
                            <div className="w-12 h-12 rounded-full flex items-center justify-center"
                                style={{ background: "rgba(34,211,165,0.82)", boxShadow: "0 0 28px rgba(34,211,165,0.4)" }}>
                                <Play size={16} fill="white" strokeWidth={0} className="translate-x-[1px]" />
                            </div>
                            <span className="text-[11px] text-white/60 font-medium">Chưa có trailer</span>
                        </div>

                        {/* Bottom gradient fade */}
                        <div className="absolute inset-x-0 bottom-0 h-10 pointer-events-none"
                            style={{ background: "linear-gradient(to top,#0d1018,transparent)" }} />

                        {/* Badges */}
                        {movie.quality && (
                            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[11px] font-bold"
                                style={{ background: qs.bg, color: qs.color }}>
                                {movie.quality}
                            </span>
                        )}
                        {isSeries && movie.episode_current && (
                            <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white"
                                style={{ background: "rgba(0,0,0,0.75)", border: "1px solid rgba(255,255,255,0.12)" }}>
                                {movie.episode_current}
                            </span>
                        )}
                    </Link>

                    {/* ── Info section ── */}
                    <div className="mc-pop-info px-4 pt-3.5 pb-4 flex flex-col gap-2.5">
                        <div>
                            <p className="text-white font-bold text-[15px] leading-snug line-clamp-2"
                                dangerouslySetInnerHTML={{ __html: movie.name }} />
                            {movie.origin_name && (
                                <p className="text-white/36 text-[11.5px] mt-[3px] line-clamp-1"
                                    dangerouslySetInnerHTML={{ __html: movie.origin_name }} />
                            )}
                        </div>

                        <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />

                        {/* Meta */}
                        <div className="flex items-center gap-2.5 flex-wrap">
                            {movie.year && (
                                <span className="flex items-center gap-1 text-[11.5px] text-white/40">
                                    <CalendarDays size={11} />{movie.year}
                                </span>
                            )}
                            {movie.time > 0 && (
                                <span className="flex items-center gap-1 text-[11.5px] text-white/40">
                                    <Clock size={11} />{formatTime(movie.time)}
                                </span>
                            )}
                            {movie.lang && (
                                <span className="px-2 py-0.5 rounded text-[10.5px] font-medium"
                                    style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.52)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                    {movie.lang}
                                </span>
                            )}
                        </div>

                        {/* Categories */}
                        {movie.category?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {movie.category.slice(0, 4).map(cat => (
                                    <span key={cat.id}
                                        className="px-2 py-[3px] rounded text-[10.5px]"
                                        style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.42)", border: "1px solid rgba(255,255,255,0.07)" }}>
                                        {cat.name}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* CTA */}
                        <Link
                            href={`/phim/${movie.slug}`}
                            className="mc-cta flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-[13px]"
                            style={{
                                background: "linear-gradient(135deg,#22d3a5,#0fb489)",
                                color: "#041a11",
                                boxShadow: "0 4px 20px rgba(34,211,165,0.32)",
                                marginTop: 2,
                            }}
                        >
                            <Play size={13} fill="#041a11" strokeWidth={0} />
                            Xem ngay
                        </Link>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

export default memo(MovieCard);
