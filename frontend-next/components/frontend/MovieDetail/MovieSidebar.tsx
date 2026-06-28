"use client";

import React from "react";
import Link from "next/link";
import type { Movie } from "@/types/movie";

interface MovieSidebarProps {
    movie: Movie;
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-start gap-3 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <span className="text-[12px] font-medium shrink-0 w-[96px]" style={{ color: "rgba(255,255,255,0.38)" }}>
                {label}
            </span>
            <span className="text-[13px] text-white/80 leading-snug flex-1 min-w-0">
                {children}
            </span>
        </div>
    );
}

const MovieSidebar: React.FC<MovieSidebarProps> = ({ movie }) => {
    const posterSrc = movie.poster_url
        ? (movie.poster_url.startsWith("http") ? movie.poster_url : `https://phimimg.com/${movie.poster_url}`)
        : null;

    const isOngoing   = movie.type === "series" && movie.status === "ongoing";
    const isCompleted = movie.type === "series" && movie.status === "completed";

    return (
        <aside
            className="h-full flex flex-col rounded-tl-[1.25rem] rounded-tr-[3rem] rounded-br-[1.25rem] rounded-bl-[1.25rem] overflow-hidden"
            style={{
                background: "rgba(14,17,28,0.95)",
                backdropFilter: "blur(2px)",
                border: "1px solid rgba(255,255,255,0.07)",
            }}
        >
            {/* ── Poster + title header ── */}
            <div
                className="relative flex flex-col items-center px-6 pt-7 pb-6"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
                {/* Glow behind poster */}
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        top: "10%", left: "50%",
                        transform: "translateX(-50%)",
                        width: 160, height: 200,
                        borderRadius: "50%",
                        background: "radial-gradient(ellipse, rgba(34,211,165,0.12) 0%, transparent 70%)",
                        filter: "blur(32px)",
                        pointerEvents: "none",
                    }}
                />

                {/* Poster */}
                <div
                    className="relative w-36 rounded-xl overflow-hidden shrink-0"
                    style={{
                        aspectRatio: "2/3",
                        boxShadow: "0 16px 48px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.08)",
                    }}
                >
                    {posterSrc ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            src={posterSrc}
                            alt={movie.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: "#1a1d2e" }}>
                            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5">
                                <rect x="2" y="2" width="20" height="20" rx="3" />
                                <path d="M2 8h20M8 2v6" />
                            </svg>
                        </div>
                    )}

                    {/* Quality badge */}
                    {movie.quality && (
                        <span
                            className="absolute top-2 left-2 px-2 py-[3px] rounded-md text-[10px] font-bold leading-none"
                            style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff" }}
                        >
                            {movie.quality}
                        </span>
                    )}
                </div>

                {/* Title */}
                <h2
                    className="text-center text-[15px] font-bold text-white mt-4 leading-snug"
                    dangerouslySetInnerHTML={{ __html: movie.name ?? "" }}
                />
                {movie.origin_name && (
                    <p
                        className="text-center text-[12px] mt-1 italic line-clamp-1"
                        style={{ color: "#22d3a5", opacity: 0.75 }}
                        dangerouslySetInnerHTML={{ __html: movie.origin_name ?? "" }}
                    />
                )}

                {/* Categories */}
                {movie.category?.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                        {movie.category.map((c, i) => (
                            <Link
                                key={i}
                                href={`/loc-phim?category=${c.slug}&page=1`}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors duration-200 hover:text-[#22d3a5]"
                                style={{
                                    background: "rgba(255,255,255,0.07)",
                                    color: "rgba(255,255,255,0.55)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                }}
                            >
                                {c.name}
                            </Link>
                        ))}
                    </div>
                )}

                {/* Status badges */}
                {isOngoing && (
                    <div
                        className="flex items-center gap-2 mt-4 px-3 py-2 rounded-lg text-[12px] font-medium"
                        style={{ background: "rgba(255,131,0,0.1)", border: "1px solid rgba(255,131,0,0.2)", color: "#ff8300" }}
                    >
                        <svg className="w-3.5 h-3.5 animate-spin shrink-0" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                            <path d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor" />
                        </svg>
                        <span>Đã chiếu: {movie.episode_current} / <b>{movie.episode_total}</b> tập</span>
                    </div>
                )}
                {isCompleted && (
                    <div
                        className="flex items-center gap-2 mt-4 px-3 py-2 rounded-lg text-[12px] font-medium"
                        style={{ background: "rgba(34,203,76,0.1)", border: "1px solid rgba(34,203,76,0.2)", color: "#22cb4c" }}
                    >
                        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Hoàn tất · {movie.episode_current} tập</span>
                    </div>
                )}
            </div>

            {/* ── Description ── */}
            {movie.content && (
                <div className="px-6 pt-5 pb-1" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <p className="text-[10.5px] uppercase tracking-widest font-semibold mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                        Nội dung
                    </p>
                    <p
                        className="text-[13px] leading-relaxed line-clamp-6 pb-4"
                        style={{ color: "rgba(255,255,255,0.6)" }}
                        dangerouslySetInnerHTML={{ __html: movie.content ?? "" }}
                    />
                </div>
            )}

            {/* ── Info rows ── */}
            <div className="px-6 pt-2 pb-5 flex flex-col flex-1">
                {movie.year && (
                    <InfoRow label="Năm">
                        <Link
                            href={`/loc-phim?year=${movie.year}&page=1`}
                            className="hover:text-[#22d3a5] transition-colors duration-200"
                        >
                            {movie.year}
                        </Link>
                    </InfoRow>
                )}
                {movie.episode_current && (
                    <InfoRow label="Tập hiện tại">{movie.episode_current}</InfoRow>
                )}
                {movie.episode_total && (
                    <InfoRow label="Tổng số tập">{movie.episode_total} tập</InfoRow>
                )}
                {movie.time > 0 && (
                    <InfoRow label="Thời lượng">{movie.time} phút</InfoRow>
                )}
                {movie.lang && (
                    <InfoRow label="Ngôn ngữ">{movie.lang}</InfoRow>
                )}
                {movie.country?.length > 0 && (
                    <InfoRow label="Quốc gia">
                        <div className="flex flex-wrap gap-1.5">
                            {movie.country.map((c, i) => (
                                <Link
                                    key={i}
                                    href={`/loc-phim?country=${c.slug}&page=1`}
                                    className="hover:text-[#22d3a5] transition-colors duration-200"
                                >
                                    {c.name || "Đang cập nhật"}
                                </Link>
                            ))}
                        </div>
                    </InfoRow>
                )}
                {movie.director?.length > 0 && movie.director[0] && (
                    <InfoRow label="Đạo diễn">
                        <span className="line-clamp-2">{Array.isArray(movie.director) ? movie.director.join(", ") : movie.director}</span>
                    </InfoRow>
                )}
            </div>
        </aside>
    );
};

export default MovieSidebar;
