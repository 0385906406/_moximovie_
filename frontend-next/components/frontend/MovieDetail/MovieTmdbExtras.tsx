"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Star, Users, Clapperboard, Sparkles, Clock, Layers, ChevronLeft, ChevronRight } from "lucide-react";
import type { TmdbExtras } from "@/lib/tmdb";

/* Không import hằng số từ lib/tmdb (file đó có API key dùng trên server) */
const IMG = "https://image.tmdb.org/t/p";

/* Hiện dần khi cuộn tới */
function useReveal<T extends HTMLElement>() {
    const ref = useRef<T>(null);
    const [shown, setShown] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const io = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { setShown(true); io.disconnect(); }
        }, { rootMargin: "0px 0px -60px 0px" });
        io.observe(el);
        return () => io.disconnect();
    }, []);
    return { ref, shown };
}

function SectionTitle({ icon, children, extra }: { icon: React.ReactNode; children: React.ReactNode; extra?: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-3 mb-3.5">
            <h3 className="flex items-center gap-2 text-white font-bold text-[15px] sm:text-base">
                <span className="w-7 h-7 rounded-lg bg-[#22d3a5]/10 border border-[#22d3a5]/20 text-[#22d3a5] flex items-center justify-center">{icon}</span>
                {children}
            </h3>
            {extra}
        </div>
    );
}

/* ── Vòng điểm TMDB ── */
function ScoreRing({ score }: { score: number }) {
    const r = 22;
    const c = 2 * Math.PI * r;
    const pct = Math.min(Math.max(score / 10, 0), 1);
    const color = score >= 7 ? "#22d3a5" : score >= 5 ? "#facc15" : "#f87171";
    return (
        <div className="relative w-[60px] h-[60px] shrink-0">
            <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
                <circle cx="28" cy="28" r={r} fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                <circle
                    className="tx-ring"
                    cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={c}
                    style={{ "--tx-off": `${c * (1 - pct)}`, "--tx-c": `${c}`, filter: `drop-shadow(0 0 6px ${color}88)` } as React.CSSProperties}
                />
            </svg>
            <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                <span className="text-white font-extrabold text-[15px] tabular-nums">{score.toFixed(1)}</span>
                <span className="text-white/40 text-[8px] font-bold tracking-wider mt-0.5">TMDB</span>
            </span>
        </div>
    );
}

/* ── Trailer: chỉ tải YouTube khi bấm (trang nhẹ, không cookie YouTube khi chưa xem) ── */
function Trailer({ trailer }: { trailer: NonNullable<TmdbExtras["trailer"]> }) {
    const [playing, setPlaying] = useState(false);
    return (
        <div className="tx-trailer relative w-full rounded-2xl overflow-hidden bg-black border border-white/[0.07] shadow-[0_16px_48px_rgba(0,0,0,0.45)]" style={{ aspectRatio: "16/9" }}>
            {playing ? (
                <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&rel=0&modestbranding=1`}
                    title={trailer.name}
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                />
            ) : (
                <button onClick={() => setPlaying(true)} className="group absolute inset-0 w-full h-full" aria-label={`Xem trailer: ${trailer.name}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={`https://i.ytimg.com/vi/${trailer.key}/hqdefault.jpg`}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                        <span className="tx-ping absolute w-20 h-20 rounded-full border-2 border-[#22d3a5]/50" />
                        <span className="relative w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-[#22d3a5] to-[#0fb489] text-[#041a11] shadow-[0_0_40px_rgba(34,211,165,0.5)] transition-transform duration-300 group-hover:scale-110">
                            <Play className="w-7 h-7 translate-x-[2px]" fill="currentColor" />
                        </span>
                    </span>
                    <span className="absolute left-4 right-4 bottom-3.5 text-left">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-red-600/90 text-white text-[10px] font-extrabold tracking-wider mb-1.5">TRAILER</span>
                        <span className="block text-white font-semibold text-[13px] sm:text-sm truncate">{trailer.name}</span>
                    </span>
                </button>
            )}
        </div>
    );
}

/* ── Dàn diễn viên: cuộn ngang, có nút trái/phải trên máy tính ── */
function CastRow({ cast }: { cast: TmdbExtras["cast"] }) {
    const scroller = useRef<HTMLDivElement>(null);
    const scrollBy = (dir: number) => scroller.current?.scrollBy({ left: dir * scroller.current.clientWidth * 0.8, behavior: "smooth" });
    const navBtn = "hidden sm:flex w-8 h-8 rounded-full items-center justify-center bg-white/[0.06] border border-white/10 text-white/70 hover:text-white hover:bg-[#22d3a5]/20 hover:border-[#22d3a5]/40 transition";
    return (
        <>
            <SectionTitle
                icon={<Users className="w-4 h-4" />}
                extra={cast.length > 5 && (
                    <div className="flex gap-1.5">
                        <button onClick={() => scrollBy(-1)} className={navBtn} aria-label="Trước"><ChevronLeft className="w-4 h-4" /></button>
                        <button onClick={() => scrollBy(1)} className={navBtn} aria-label="Tiếp"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                )}
            >
                Diễn viên
            </SectionTitle>
            <div ref={scroller} className="tx-scroll flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
                {cast.map((p, i) => (
                    <Link
                        key={p.id}
                        href={`/tim-kiem?keyword=${encodeURIComponent(p.name)}`}
                        className="tx-item group shrink-0 w-[92px] sm:w-[104px] snap-start text-center"
                        style={{ animationDelay: `${Math.min(i, 10) * 45}ms` }}
                    >
                        <div className="relative w-[80px] h-[80px] sm:w-[92px] sm:h-[92px] mx-auto rounded-full overflow-hidden ring-2 ring-white/10 group-hover:ring-[#22d3a5]/70 transition-all duration-300 group-hover:shadow-[0_0_24px_rgba(34,211,165,0.35)]">
                            {p.profile ? (
                                <Image
                                    src={`${IMG}/w185${p.profile}`}
                                    alt={p.name}
                                    fill
                                    sizes="96px"
                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                            ) : (
                                <span className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1e2433] to-[#141722] text-white/50 text-2xl font-bold">
                                    {p.name.charAt(0)}
                                </span>
                            )}
                        </div>
                        <p className="mt-2 text-white/90 text-[12px] font-semibold leading-tight line-clamp-2 group-hover:text-[#22d3a5] transition-colors">{p.name}</p>
                        {p.character && <p className="mt-0.5 text-white/40 text-[10.5px] leading-tight line-clamp-1">{p.character}</p>}
                    </Link>
                ))}
            </div>
        </>
    );
}

/* ── Phim tương tự: bấm vào → tìm phim đó trên web ── */
function SimilarGrid({ items }: { items: TmdbExtras["similar"] }) {
    return (
        <>
            <SectionTitle icon={<Sparkles className="w-4 h-4" />}>Phim tương tự</SectionTitle>
            <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-6 gap-2.5 sm:gap-3.5">
                {items.map((m, i) => (
                    <Link
                        key={m.id}
                        href={`/tim-kiem?keyword=${encodeURIComponent(m.title)}`}
                        className="tx-item group block"
                        style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                    >
                        <div className="relative rounded-xl overflow-hidden bg-[#141722] border border-white/[0.06] group-hover:border-[#22d3a5]/40 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_12px_32px_rgba(0,0,0,0.5),0_0_0_1px_rgba(34,211,165,0.2)]" style={{ aspectRatio: "2/3" }}>
                            <Image
                                src={`${IMG}/w342${m.poster}`}
                                alt={m.title}
                                fill
                                sizes="(max-width: 640px) 32vw, (max-width: 1280px) 22vw, 180px"
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-70 group-hover:opacity-100 transition-opacity" />
                            {m.vote > 0 && (
                                <span className="absolute top-1.5 left-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-black/70 text-[10px] font-bold text-yellow-300">
                                    <Star className="w-2.5 h-2.5" fill="currentColor" /> {m.vote.toFixed(1)}
                                </span>
                            )}
                            <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <span className="w-11 h-11 rounded-full bg-[#22d3a5]/90 text-[#041a11] flex items-center justify-center scale-75 group-hover:scale-100 transition-transform duration-300 shadow-[0_0_24px_rgba(34,211,165,0.5)]">
                                    <Play className="w-5 h-5 translate-x-[1px]" fill="currentColor" />
                                </span>
                            </span>
                        </div>
                        <p className="mt-1.5 text-white/85 text-[11.5px] sm:text-[12.5px] font-semibold leading-tight line-clamp-2 group-hover:text-[#22d3a5] transition-colors">{m.title}</p>
                        {m.year && <p className="text-white/35 text-[10.5px] mt-0.5">{m.year}</p>}
                    </Link>
                ))}
            </div>
        </>
    );
}

export default function MovieTmdbExtras({ data }: { data: TmdbExtras }) {
    const { ref, shown } = useReveal<HTMLDivElement>();
    const hasScore = data.voteAverage > 0 && data.voteCount > 0;

    return (
        <div ref={ref} className={`tx-root relative mt-6 sm:mt-8 space-y-8 ${shown ? "tx-shown" : ""}`}>
            {/* ── Điểm + thông tin nhanh ── */}
            {(hasScore || data.tagline || data.runtime || data.seasons) && (
                <div className="tx-item flex items-center gap-4 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-white/[0.04] to-transparent border border-white/[0.06]">
                    {hasScore && <ScoreRing score={data.voteAverage} />}
                    <div className="min-w-0 flex-1">
                        {hasScore && (
                            <p className="text-white/80 text-[12.5px]">
                                Điểm người xem trên TMDB · <span className="text-white/50">{data.voteCount.toLocaleString("vi-VN")} lượt đánh giá</span>
                            </p>
                        )}
                        {data.tagline && <p className="mt-1 text-white/55 text-[13px] italic line-clamp-2">&ldquo;{data.tagline}&rdquo;</p>}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {data.runtime ? (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.06] text-white/60 text-[11px]"><Clock className="w-3 h-3" /> {data.runtime} phút{data.type === "tv" ? "/tập" : ""}</span>
                            ) : null}
                            {data.seasons ? (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.06] text-white/60 text-[11px]"><Layers className="w-3 h-3" /> {data.seasons} mùa · {data.episodes} tập</span>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}

            {data.trailer && (
                <section className="tx-item">
                    <SectionTitle icon={<Clapperboard className="w-4 h-4" />}>Trailer</SectionTitle>
                    <Trailer trailer={data.trailer} />
                </section>
            )}

            {data.cast.length > 0 && (
                <section className="tx-item"><CastRow cast={data.cast} /></section>
            )}

            {data.similar.length > 0 && (
                <section className="tx-item"><SimilarGrid items={data.similar} /></section>
            )}

            <p className="text-white/25 text-[10.5px]">Dữ liệu diễn viên, trailer và gợi ý từ TMDB.</p>

            <style>{`
                .tx-root .tx-item { opacity: 0; transform: translateY(16px); }
                .tx-shown .tx-item { animation: txIn .6s cubic-bezier(.16,1,.3,1) both; }
                .tx-shown > .tx-item:nth-child(2) { animation-delay: .08s; }
                .tx-shown > .tx-item:nth-child(3) { animation-delay: .16s; }
                .tx-shown > .tx-item:nth-child(4) { animation-delay: .24s; }
                .tx-ring { stroke-dashoffset: var(--tx-c); }
                .tx-shown .tx-ring { animation: txRing 1.4s cubic-bezier(.16,1,.3,1) .2s forwards; }
                .tx-ping { animation: txPing 1.8s ease-out infinite; }
                .tx-scroll { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.15) transparent; }
                .tx-scroll::-webkit-scrollbar { height: 4px; }
                .tx-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,.15); border-radius: 99px; }
                @keyframes txIn   { to { opacity: 1; transform: none; } }
                @keyframes txRing { to { stroke-dashoffset: var(--tx-off); } }
                @keyframes txPing { 0% { transform: scale(1); opacity: .9; } 100% { transform: scale(1.6); opacity: 0; } }
                @media (prefers-reduced-motion: reduce) {
                    .tx-root .tx-item { opacity: 1; transform: none; animation: none !important; }
                    .tx-ring { stroke-dashoffset: var(--tx-off); animation: none !important; }
                    .tx-ping { animation: none; }
                }
            `}</style>
        </div>
    );
}
