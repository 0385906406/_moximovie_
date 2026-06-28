"use client";

import { memo, useRef, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Play, Clock, CalendarDays, Film, PlayCircle } from "lucide-react";
import type { Movie } from "@/types/movie";
import Image from "next/image";

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
   MOVIE CARD
══════════════════════════════════ */
function MovieCard({ movie }: { movie: Movie }) {
    const poster = movie.poster_url ? `https://phimimg.com/${movie.poster_url}` : "";
    const thumb  = movie.thumb_url  ? `https://phimimg.com/${movie.thumb_url}`  : poster;

    const wrapRef    = useRef<HTMLDivElement>(null);
    const enterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [hovered,      setHovered]      = useState(false);
    const [pos,          setPos]          = useState({ top: 0, left: 0, width: 300 });
    /* undefined = fetching | null = no trailer | string = YT key */
    const [trailerKey,   setTrailerKey]   = useState<string | null | undefined>(undefined);
    const [thumbHovered, setThumbHovered] = useState(false);

    /* ── Center popup over the card ── */
    const calcPos = useCallback(() => {
        if (!wrapRef.current) return null;
        const rect = wrapRef.current.getBoundingClientRect();
        const pw = Math.max(280, Math.round(rect.width * 2.3));
        const cx = rect.left + rect.width / 2;

        let left = cx - pw / 2;
        if (left < 8)                          left = 8;
        if (left + pw > window.innerWidth - 8) left = window.innerWidth - pw - 8;

        const estimatedH = pw * 0.5625 + 215;
        let top = rect.top + rect.height / 2 - estimatedH / 2;
        if (top < 8)                                    top = 8;
        if (top + estimatedH > window.innerHeight - 8)  top = window.innerHeight - estimatedH - 8;

        return { top, left, width: pw };
    }, []);

    const handleEnter = useCallback(() => {
        if (leaveTimer.current) { clearTimeout(leaveTimer.current); leaveTimer.current = null; }
        if (enterTimer.current) return;
        enterTimer.current = setTimeout(() => {
            enterTimer.current = null;
            const p = calcPos();
            if (!p) return;
            setPos(p);
            setTrailerKey(undefined);
            setThumbHovered(false);
            setHovered(true);
            fetchTrailerKey(movie).then(k => setTrailerKey(k));
        }, 650);
    }, [calcPos, movie]);

    const handleLeave = useCallback(() => {
        if (enterTimer.current) { clearTimeout(enterTimer.current); enterTimer.current = null; }
        leaveTimer.current = setTimeout(() => {
            setHovered(false);
            setThumbHovered(false);
        }, 160);
    }, []);

    const cancelLeave = useCallback(() => {
        if (leaveTimer.current) { clearTimeout(leaveTimer.current); leaveTimer.current = null; }
    }, []);

    useEffect(() => () => {
        if (enterTimer.current) clearTimeout(enterTimer.current);
        if (leaveTimer.current) clearTimeout(leaveTimer.current);
    }, []);

    useEffect(() => {
        if (!hovered) return;
        const update = () => { const p = calcPos(); if (p) setPos(p); };
        window.addEventListener("scroll", update, { passive: true });
        return () => window.removeEventListener("scroll", update);
    }, [hovered, calcPos]);

    const qs = qualityStyle(movie.quality);
    const isSeries = movie.type === "series";

    /* Show iframe only when user hovers the thumb AND trailer key is ready */
    const showTrailer = thumbHovered && typeof trailerKey === "string";
    const ytSrc = showTrailer
        ? `https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailerKey}&modestbranding=1&rel=0&iv_load_policy=3`
        : null;

    return (
        <div ref={wrapRef} onMouseEnter={handleEnter} onMouseLeave={handleLeave}>

            {/* ━━━━━━━━━━━━━━━━━
                BASE CARD
            ━━━━━━━━━━━━━━━━━ */}
            <Link href={`/phim/${movie.slug}`} className="group block">
                <div
                    className="relative w-full aspect-[2/3] rounded-xl overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.04)", boxShadow: "0 4px 18px rgba(0,0,0,0.45)" }}
                >
                    {poster ? (
                        <Image
                            src={poster} alt={movie.name} fill
                            sizes="(max-width: 640px) 33vw, (max-width: 1280px) 20vw, 14vw"
                            quality={75}
                            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.07]"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Film size={26} className="text-white/15" />
                        </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/10 pointer-events-none" />

                    {/* Hover overlay + play */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                        style={{ background: "rgba(0,0,0,0.32)" }}>
                        <div className="w-11 h-11 rounded-full flex items-center justify-center scale-75 group-hover:scale-100 transition-transform duration-300"
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
                            style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.1)" }}>
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
                Centered over the card — covers it completely.
                Trailer plays only when user hovers the thumb area.
            ━━━━━━━━━━━━━━━━━ */}
            {hovered && typeof document !== "undefined" && createPortal(
                <div
                    onMouseEnter={cancelLeave}
                    onMouseLeave={handleLeave}
                    style={{
                        position: "fixed",
                        top: pos.top,
                        left: pos.left,
                        width: pos.width,
                        zIndex: 9999,
                        borderRadius: 16,
                        overflow: "hidden",
                        background: "linear-gradient(165deg,#181d2a 0%,#0d1018 100%)",
                        border: "1px solid rgba(255,255,255,0.09)",
                        boxShadow: "0 32px 90px rgba(0,0,0,0.95), 0 0 0 1px rgba(34,211,165,0.08), inset 0 1px 0 rgba(255,255,255,0.06)",
                        transformOrigin: "center center",
                        animation: "mcPop 0.22s cubic-bezier(.34,1.35,.64,1) forwards",
                    }}
                >
                    {/* ── Thumb / Trailer area ── */}
                    <div
                        className="relative w-full cursor-pointer"
                        style={{ aspectRatio: "16/9", background: "#090b12" }}
                        onMouseEnter={() => setThumbHovered(true)}
                        onMouseLeave={() => setThumbHovered(false)}
                    >
                        {/* Static thumbnail */}
                        {thumb ? (
                            <Image
                                src={thumb} alt={movie.name} fill sizes="420px" quality={80}
                                className="object-cover transition-opacity duration-300"
                                style={{ opacity: showTrailer ? 0 : 1 }}
                                priority
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center" style={{ background: "#131623" }}>
                                <Film size={32} className="text-white/10" />
                            </div>
                        )}

                        {/* Trailer iframe — pointer-events:none so mouse events pass to container */}
                        {ytSrc && (
                            <iframe
                                src={ytSrc}
                                allow="autoplay; encrypted-media"
                                allowFullScreen
                                className="absolute inset-0 w-full h-full z-10 transition-opacity duration-300"
                                style={{ border: "none", pointerEvents: "none", opacity: showTrailer ? 1 : 0 }}
                            />
                        )}

                        {/* Hint: hover to watch trailer */}
                        {!thumbHovered && trailerKey !== null && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 transition-opacity duration-200"
                                style={{ background: "rgba(0,0,0,0.18)", opacity: thumbHovered ? 0 : 1 }}>
                                <div className="w-13 h-13 rounded-full flex items-center justify-center"
                                    style={{ background: "rgba(34,211,165,0.85)", boxShadow: "0 0 28px rgba(34,211,165,0.45)" }}>
                                    <Play size={18} fill="white" strokeWidth={0} className="translate-x-[1px]" />
                                </div>
                                {trailerKey !== undefined && (
                                    <span className="text-[11px] text-white/60 font-medium tracking-wide">
                                        Di chuột vào để xem trailer
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Loading: fetching trailer key */}
                        {thumbHovered && trailerKey === undefined && (
                            <div className="absolute inset-0 flex items-center justify-center z-20"
                                style={{ background: "rgba(0,0,0,0.5)" }}>
                                <PlayCircle size={32} className="animate-pulse" style={{ color: "#22d3a5" }} />
                            </div>
                        )}

                        {/* No trailer available */}
                        {thumbHovered && trailerKey === null && (
                            <div className="absolute inset-0 flex items-center justify-center z-20"
                                style={{ background: "rgba(0,0,0,0.35)" }}>
                                <div className="w-12 h-12 rounded-full flex items-center justify-center"
                                    style={{ background: "rgba(34,211,165,0.82)", boxShadow: "0 0 28px rgba(34,211,165,0.4)" }}>
                                    <Play size={16} fill="white" strokeWidth={0} className="translate-x-[1px]" />
                                </div>
                            </div>
                        )}

                        {/* Bottom gradient fade */}
                        <div className="absolute inset-x-0 bottom-0 h-10 z-30 pointer-events-none"
                            style={{ background: "linear-gradient(to top,#0d1018,transparent)" }} />

                        {/* Badges */}
                        {movie.quality && (
                            <span className="absolute top-3 left-3 z-30 px-2.5 py-1 rounded-lg text-[11px] font-bold"
                                style={{ background: qs.bg, color: qs.color }}>
                                {movie.quality}
                            </span>
                        )}
                        {isSeries && movie.episode_current && (
                            <span className="absolute top-3 right-3 z-30 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white"
                                style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.12)" }}>
                                {movie.episode_current}
                            </span>
                        )}
                    </div>

                    {/* ── Info section ── */}
                    <div className="px-4 pt-3.5 pb-4 flex flex-col gap-2.5">
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
                            className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-[13px] transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
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

            <style>{`
                @keyframes mcPop {
                    from { opacity: 0; transform: scale(0.87); }
                    to   { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
}

export default memo(MovieCard);
