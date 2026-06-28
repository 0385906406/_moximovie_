"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Play, Info } from "lucide-react";
import type { Movie } from "@/types/movie";
import Image from "next/image";

interface Props {
    movie: Movie;
    children: React.ReactNode;
}

function formatTime(minutes: number) {
    if (!minutes) return null;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ""}` : `${m}m`;
}

export function MovieHoverPopup({ movie, children }: Props) {
    const thumb = movie.thumb_url ? `https://phimimg.com/${movie.thumb_url}`
                : movie.poster_url ? `https://phimimg.com/${movie.poster_url}` : "";

    const wrapRef    = useRef<HTMLDivElement>(null);
    const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [hovered,   setHovered]   = useState(false);
    const [popupW,    setPopupW]    = useState(300);
    const [popupTop,  setPopupTop]  = useState(0);
    const [popupLeft, setPopupLeft] = useState(0);

    const calcPosition = useCallback((rect: DOMRect, pw: number) => {
        // center horizontally over card, clamp to viewport
        const cx = rect.left + rect.width / 2;
        let left = cx - pw / 2;
        if (left < 12)                          left = rect.left;
        if (left + pw > window.innerWidth - 12) left = rect.right - pw;

        // center vertically relative to card, clamp to viewport
        const estimatedH = Math.round(pw * 0.5625 + 160);
        let top = rect.top + rect.height / 2 - estimatedH / 2;
        if (top < 8)                                         top = 8;
        if (top + estimatedH > window.innerHeight - 8)       top = window.innerHeight - estimatedH - 8;

        return { left, top };
    }, []);

    const handleEnter = useCallback(() => {
        if (leaveTimer.current) clearTimeout(leaveTimer.current);
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
        if (wrapRef.current) {
            const rect = wrapRef.current.getBoundingClientRect();
            // nhân 2.1x nhưng cap 380px — tránh popup khổng lồ với card to
            const pw   = Math.min(380, Math.max(260, Math.round(rect.width * 2.1)));
            const { left, top } = calcPosition(rect, pw);
            setPopupW(pw);
            setPopupTop(top);
            setPopupLeft(left);
        }
        hoverTimer.current = setTimeout(() => setHovered(true), 180);
    }, [calcPosition]);

    const handleLeave = useCallback(() => {
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
        leaveTimer.current = setTimeout(() => setHovered(false), 80);
    }, []);

    const cancelLeave = useCallback(() => {
        if (leaveTimer.current) clearTimeout(leaveTimer.current);
    }, []);

    useEffect(() => {
        if (!hovered) return;
        const update = () => {
            if (!wrapRef.current) return;
            const rect = wrapRef.current.getBoundingClientRect();
            const pw   = popupW;
            const { left, top } = calcPosition(rect, pw);
            setPopupTop(top);
            setPopupLeft(left);
        };
        window.addEventListener("scroll", update, { passive: true });
        return () => window.removeEventListener("scroll", update);
    }, [hovered, popupW, calcPosition]);

    return (
        <div ref={wrapRef} onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
            {children}

            {hovered && createPortal(
                <div
                    onMouseEnter={cancelLeave}
                    onMouseLeave={handleLeave}
                    style={{
                        position:   "fixed",
                        top:        popupTop,
                        left:       popupLeft,
                        width:      popupW,
                        zIndex:     9999,
                        background: "#0f1117",
                    }}
                    className="rounded-xl overflow-hidden border border-white/[0.1] shadow-[0_32px_64px_-8px_rgba(0,0,0,0.9)] animate-[fadeScale_0.18s_ease-out_forwards]"
                >
                    {/* Backdrop */}
                    <div className="relative w-full overflow-hidden" style={{ aspectRatio: "16/9" }}>
                        {thumb ? (
                            <Image src={thumb} alt={movie.name} fill sizes="(max-width: 768px) 85vw, 380px" quality={75} className="object-cover" />
                        ) : (
                            <div className="w-full h-full bg-[#1a1d27]" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1117] via-[#0f1117]/10 to-transparent" />
                        {movie.quality && (
                            <span className="absolute top-3 left-3 px-2 py-0.5 text-[11px] font-bold text-black bg-[#00A98F] rounded">
                                {movie.quality}
                            </span>
                        )}
                        {movie.episode_current && movie.type === "series" && (
                            <span className="absolute top-3 right-3 px-2 py-0.5 text-[11px] font-semibold text-white bg-black/70 backdrop-blur rounded">
                                {movie.episode_current}
                            </span>
                        )}
                    </div>

                    {/* Info */}
                    <div className="px-4 pt-3 pb-4 flex flex-col gap-3">
                        <div>
                            <p className="text-white font-bold text-[15px] leading-snug line-clamp-1"
                                dangerouslySetInnerHTML={{ __html: movie.name }} />
                            {movie.origin_name && (
                                <p className="text-gray-400 text-[13px] line-clamp-1 mt-0.5"
                                    dangerouslySetInnerHTML={{ __html: movie.origin_name }} />
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <Link href={`/phim/${movie.slug}`}
                                className="flex items-center gap-2 px-4 py-2 bg-[#00A98F] hover:bg-[#00c4a7] text-white rounded-lg text-[13px] font-semibold transition-colors duration-150"
                            >
                                <Play size={13} fill="white" strokeWidth={0} />
                                Xem ngay
                            </Link>
                            <Link href={`/phim/${movie.slug}`}
                                className="flex items-center gap-2 px-4 py-2 bg-white/[0.1] hover:bg-white/[0.18] text-white rounded-lg text-[13px] font-semibold transition-colors duration-150 border border-white/[0.12]"
                            >
                                <Info size={13} />
                                Chi tiết
                            </Link>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap text-[12px] text-[#a0a8b8]">
                            {movie.year && <span>{movie.year}</span>}
                            {movie.time > 0 && (
                                <><span className="text-[#3a3f50]">·</span><span>{formatTime(movie.time)}</span></>
                            )}
                            {movie.lang && (
                                <><span className="text-[#3a3f50]">·</span><span>{movie.lang}</span></>
                            )}
                        </div>

                        {movie.category?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {movie.category.slice(0, 3).map(cat => (
                                    <span key={cat.id}
                                        className="px-2.5 py-1 text-[11px] font-medium text-[#a0a8b8] bg-white/[0.07] border border-white/[0.08] rounded-md">
                                        {cat.name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
