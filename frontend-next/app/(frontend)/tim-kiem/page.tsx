"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { Search, X, TrendingUp, Film, Tv2, Globe2, Sparkles, ChevronRight } from "lucide-react";
import { movieService } from "@/services/movieService";
import type { Movie } from "@/types/movie";
import MovieCard from "@/components/frontend/MovieCard";
import Pagination from "@/components/frontend/Pagination";
import SEO from "@/components/frontend/SEO";


/* ─── Skeleton ─── */
function SkeletonCard() {
    return (
        <div className="flex flex-col gap-2">
            <div className="w-full aspect-[2/3] rounded-lg bg-white/[0.04] skeleton-shimmer" />
            <div className="h-2.5 bg-white/[0.04] rounded skeleton-shimmer w-4/5" />
            <div className="h-2 bg-white/[0.04] rounded skeleton-shimmer w-3/5" />
        </div>
    );
}

/* ─── Animated count ─── */
function AnimatedCount({ value }: { value: number }) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        if (value === 0) return;
        const duration = 600;
        const startTime = performance.now();
        let raf: number;
        const tick = (now: number) => {
            const p = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setDisplay(Math.round(eased * value));
            if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [value]);
    return <>{display.toLocaleString("vi-VN")}</>;
}

/* ─── Reveal on scroll ─── */
function useReveal() {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const io = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } },
            { threshold: 0.05 }
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);
    return { ref, visible };
}

function AnimatedCard({ movie, index }: { movie: Movie; index: number }) {
    const { ref, visible } = useReveal();
    return (
        <div
            ref={ref}
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(16px)",
                transition: `opacity 0.4s ease ${(index % 10) * 40}ms, transform 0.4s ease ${(index % 10) * 40}ms`,
            }}
        >
            <MovieCard movie={movie} />
        </div>
    );
}

const SUGGESTIONS = [
    { label: "Hành Động", icon: <Film size={12} />, q: "hành động" },
    { label: "Tình Cảm", icon: <Sparkles size={12} />, q: "tình cảm" },
    { label: "Kinh Dị", icon: <Film size={12} />, q: "kinh dị" },
    { label: "Hài Hước", icon: <Film size={12} />, q: "hài hước" },
    { label: "Viễn Tưởng", icon: <Globe2 size={12} />, q: "viễn tưởng" },
    { label: "Tâm Lý", icon: <Film size={12} />, q: "tâm lý" },
    { label: "Anime", icon: <Tv2 size={12} />, q: "anime" },
    { label: "Phim Bộ", icon: <Tv2 size={12} />, q: "phim bộ" },
];

const TRENDING = [
    "Đặc Công", "Đế Chế", "Hàn Quốc 2024", "Võ Lâm",
    "Thám Tử", "Gia Đình", "Lãng Mạn", "Phép Thuật",
];

interface PaginationState {
    current_page: number;
    last_page: number;
}

/* ════════════════════════════════════
   MAIN PAGE
════════════════════════════════════ */
function SearchPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const keyword = searchParams.get("keyword") ?? "";
    const pageFromUrl = Number(searchParams.get("page") || 1);

    const [query, setQuery] = useState(keyword);
    const [results, setResults] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalItems, setTotalItems] = useState<number | null>(null);
    const [focused, setFocused] = useState(false);
    const [pagination, setPagination] = useState<PaginationState>({ current_page: 1, last_page: 1 });
    const inputRef = useRef<HTMLInputElement>(null);

    const fetchResults = useCallback(async (kw: string, page: number) => {
        if (!kw.trim()) { setResults([]); setTotalItems(null); return; }
        setLoading(true);
        try {
            const res = await movieService.dataSearch(kw, page);
            setResults(res?.items ?? res ?? []);
            if (res?.pagination) {
                setPagination({
                    current_page: res.pagination.currentPage ?? page,
                    last_page: res.pagination.totalPages ?? 1,
                });
                setTotalItems(res.pagination.totalItems ?? null);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        setQuery(keyword);
        fetchResults(keyword, pageFromUrl);
    }, [keyword, pageFromUrl, fetchResults]);

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }, [searchParams]);

    const handleSearch = () => {
        if (!query.trim()) return;
        router.push(`?keyword=${encodeURIComponent(query.trim())}&page=1`);
    };
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") handleSearch();
    };
    const handleChangePage = (page: number) => {
        const p = new URLSearchParams(searchParams);
        p.set("page", page.toString());
        router.push(`?${p.toString()}`);
    };
    const handleSuggestion = (q: string) => {
        setQuery(q);
        router.push(`?keyword=${encodeURIComponent(q)}&page=1`);
    };

    const hasKeyword = keyword.trim().length > 0;
    const hasResults = results.length > 0;

    return (
        <div className="relative w-full min-h-screen text-white" style={{ backgroundColor: "#0a0c14" }}>
            <SEO
                title={keyword ? `Tìm kiếm "${keyword}" | MoxiMovie` : "Tìm Kiếm Phim | MoxiMovie"}
                description={keyword ? `Kết quả tìm kiếm phim cho từ khóa "${keyword}" tại MoxiMovie.` : "Tìm kiếm phim Vietsub HD tại MoxiMovie."}
                canonical={`https://www.moximovie.click/tim-kiem${keyword ? `?keyword=${encodeURIComponent(keyword)}` : ""}`}
            />

            {/* ══════════════════════════════
                HERO
            ══════════════════════════════ */}
            <div className="relative overflow-hidden" style={{
                background: "linear-gradient(180deg, #0f1326 0%, #0a0c14 100%)",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
            }}>
                {/* top glow blob */}
                <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[320px]"
                    style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(34,211,165,0.09) 0%, transparent 65%)" }} />

                {/* decorative grid lines */}
                <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
                        backgroundSize: "60px 60px",
                    }} />

                <div className="relative mx-auto max-w-3xl px-4 pt-36 pb-12 flex flex-col items-center text-center">

                    {/* badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6 fade-down"
                        style={{ background: "rgba(34,211,165,0.08)", border: "1px solid rgba(34,211,165,0.2)" }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#22d3a5] animate-pulse" />
                        <span className="text-[11px] font-semibold tracking-wider uppercase text-[#22d3a5]/80">
                            Tìm Kiếm
                        </span>
                    </div>

                    {/* heading */}
                    <h1 className="text-[28px] sm:text-[38px] font-black tracking-tight leading-tight mb-3 fade-down" style={{ animationDelay: "50ms" }}>
                        {hasKeyword ? (
                            <>
                                Kết quả cho{" "}
                                <span className="italic" style={{
                                    color: "#22d3a5",
                                    textShadow: "0 0 30px rgba(34,211,165,0.3)",
                                }}>
                                    &quot;{keyword}&quot;
                                </span>
                            </>
                        ) : (
                            <>
                                Khám phá{" "}
                                <span style={{
                                    background: "linear-gradient(135deg, #22d3a5 0%, #5eead4 100%)",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    backgroundClip: "text",
                                }}>
                                    hàng ngàn bộ phim
                                </span>
                            </>
                        )}
                    </h1>

                    {!hasKeyword && (
                        <p className="text-[14px] text-white/35 mb-8 fade-down" style={{ animationDelay: "90ms" }}>
                            Tìm kiếm phim, diễn viên, đạo diễn yêu thích của bạn
                        </p>
                    )}

                    {/* ── Search input ── */}
                    <div className="w-full max-w-xl fade-down" style={{ animationDelay: "120ms" }}>
                        <div
                            className="relative flex items-center gap-3 rounded-2xl px-5 py-1 transition-all duration-300"
                            style={{
                                background: "rgba(255,255,255,0.05)",
                                border: `1.5px solid ${focused ? "rgba(34,211,165,0.5)" : "rgba(255,255,255,0.1)"}`,
                                boxShadow: focused
                                    ? "0 0 0 4px rgba(34,211,165,0.08), 0 8px 40px rgba(0,0,0,0.5)"
                                    : "0 4px 24px rgba(0,0,0,0.4)",
                            }}
                        >
                            <Search size={16} style={{
                                color: focused ? "#22d3a5" : "rgba(255,255,255,0.3)",
                                transition: "color 0.2s",
                                flexShrink: 0,
                            }} />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onFocus={() => setFocused(true)}
                                onBlur={() => setFocused(false)}
                                placeholder="Nhập tên phim, diễn viên..."
                                autoFocus
                                className="flex-1 bg-transparent py-3.5 text-[14px] text-white placeholder:text-white/22 outline-none"
                            />
                            {query && (
                                <button
                                    type="button"
                                    onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                                    className="w-5 h-5 rounded-full flex items-center justify-center text-white/25 hover:text-white/55 transition-all"
                                >
                                    <X size={12} />
                                </button>
                            )}
                            <div className="w-px h-5 bg-white/[0.08] shrink-0" />
                            <button
                                type="button"
                                onClick={handleSearch}
                                className="shrink-0 px-5 py-2 rounded-xl font-bold text-[12px] tracking-wide transition-all active:scale-95 hover:brightness-110"
                                style={{
                                    background: "linear-gradient(135deg, #22d3a5 0%, #0fb489 100%)",
                                    color: "#071a14",
                                    boxShadow: "0 2px 12px rgba(34,211,165,0.25)",
                                }}
                            >
                                Tìm kiếm
                            </button>
                        </div>
                    </div>

                    {/* suggestion chips */}
                    {!hasKeyword && (
                        <div className="mt-5 flex flex-wrap justify-center gap-2 fade-up" style={{ animationDelay: "160ms" }}>
                            {SUGGESTIONS.map((s) => (
                                <button
                                    key={s.q}
                                    onClick={() => handleSuggestion(s.q)}
                                    className="chip-btn flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all hover:scale-105 active:scale-95"
                                    style={{
                                        background: "rgba(255,255,255,0.04)",
                                        border: "1px solid rgba(255,255,255,0.08)",
                                        color: "rgba(255,255,255,0.45)",
                                    }}
                                >
                                    {s.icon}
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ══════════════════════════════
                RESULT BAR
            ══════════════════════════════ */}
            {hasKeyword && (
                <div className="mx-auto max-w-8xl px-3 lg:px-5 xl:px-6 pt-6 pb-4 fade-down">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {loading ? (
                                <span className="flex items-center gap-1.5 text-[12.5px] text-white/30">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#22d3a5]/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#22d3a5]/60 animate-bounce" style={{ animationDelay: "110ms" }} />
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#22d3a5]/60 animate-bounce" style={{ animationDelay: "220ms" }} />
                                    <span className="ml-1.5">Đang tìm kiếm...</span>
                                </span>
                            ) : (
                                <span className="text-[12.5px] text-white/35 font-mono">
                                    {totalItems != null ? (
                                        <>
                                            <span className="text-white/65 font-bold text-[13px]">
                                                <AnimatedCount value={totalItems} />
                                            </span>{" "}kết quả
                                        </>
                                    ) : hasResults ? (
                                        <>Trang <span className="text-white/65">{pagination.current_page}</span> / {pagination.last_page}</>
                                    ) : (
                                        "Không có kết quả"
                                    )}
                                </span>
                            )}
                        </div>
                        {!loading && hasResults && pagination.last_page > 1 && (
                            <span className="text-[11.5px] font-mono text-white/20">
                                {pagination.current_page} / {pagination.last_page}
                            </span>
                        )}
                    </div>
                    <div className="mt-3 h-px" style={{ background: "linear-gradient(90deg, rgba(34,211,165,0.2), transparent)" }} />
                </div>
            )}

            {/* ══════════════════════════════
                CONTENT
            ══════════════════════════════ */}
            <div className="mx-auto max-w-8xl px-3 lg:px-5 xl:px-6 pb-20 pt-2">
                {loading ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3 sm:gap-4">
                        {Array.from({ length: 24 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : hasResults ? (
                    <>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3 sm:gap-4">
                            {results.map((movie, index) => (
                                <AnimatedCard key={movie._id} movie={movie} index={index} />
                            ))}
                        </div>
                        {pagination.last_page > 1 && (
                            <div className="mt-12">
                                <Pagination
                                    currentPage={pagination.current_page}
                                    lastPage={pagination.last_page}
                                    onChangePage={handleChangePage}
                                />
                            </div>
                        )}
                    </>
                ) : hasKeyword ? (
                    /* ── No results ── */
                    <div className="flex flex-col items-center py-20 text-center fade-up">
                        <div
                            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
                            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                        >
                            <Search size={28} className="text-white/15" />
                        </div>
                        <p className="text-[16px] font-semibold text-white/55 mb-1.5">Không tìm thấy kết quả</p>
                        <p className="text-[13px] text-white/22 mb-8">
                            Thử từ khóa khác hoặc kiểm tra lại chính tả
                        </p>
                        <div className="flex flex-col items-center gap-3">
                            <span className="flex items-center gap-1.5 text-[10.5px] font-mono uppercase tracking-widest text-white/18">
                                <TrendingUp size={10} />
                                Gợi ý tìm kiếm
                            </span>
                            <div className="flex flex-wrap justify-center gap-2 max-w-xs">
                                {TRENDING.map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => handleSuggestion(t)}
                                        className="chip-btn flex items-center gap-1 px-3.5 py-1.5 rounded-full text-[12px] font-medium text-white/40 transition-all"
                                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                                    >
                                        {t}
                                        <ChevronRight size={10} className="opacity-40" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ── Empty landing ── */
                    <div className="fade-up pt-4">
                        {/* Trending */}
                        <div className="mb-10">
                            <div className="flex items-center gap-2 mb-5">
                                <TrendingUp size={14} style={{ color: "#22d3a5" }} />
                                <span className="text-[12.5px] font-semibold text-white/40 tracking-wide uppercase">
                                    Tìm kiếm phổ biến
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2.5">
                                {TRENDING.map((t, i) => (
                                    <button
                                        key={t}
                                        onClick={() => handleSuggestion(t)}
                                        className="trending-chip flex items-center gap-2.5 px-4 py-2 rounded-xl text-[13px] font-medium transition-all hover:scale-105 active:scale-95"
                                        style={{
                                            background: "rgba(255,255,255,0.03)",
                                            border: "1px solid rgba(255,255,255,0.06)",
                                            color: "rgba(255,255,255,0.5)",
                                        }}
                                    >
                                        <span
                                            className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-bold shrink-0"
                                            style={{ background: "rgba(34,211,165,0.1)", color: "#22d3a5" }}
                                        >
                                            {i + 1}
                                        </span>
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Category grid */}
                        <div>
                            <div className="flex items-center gap-2 mb-5">
                                <Sparkles size={13} style={{ color: "#22d3a5" }} />
                                <span className="text-[12.5px] font-semibold text-white/40 tracking-wide uppercase">
                                    Thể loại nổi bật
                                </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {SUGGESTIONS.map((s) => (
                                    <button
                                        key={s.q}
                                        onClick={() => handleSuggestion(s.q)}
                                        className="category-card group flex items-center gap-3 px-4 py-4 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                                        style={{
                                            background: "rgba(255,255,255,0.025)",
                                            border: "1px solid rgba(255,255,255,0.06)",
                                        }}
                                    >
                                        <span
                                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all"
                                            style={{ background: "rgba(34,211,165,0.09)", color: "#22d3a5" }}
                                        >
                                            {s.icon}
                                        </span>
                                        <p className="text-[13px] font-semibold text-white/60">{s.label}</p>
                                        <ChevronRight size={13} className="ml-auto text-white/15 group-hover:text-[#22d3a5]/60 transition-colors shrink-0" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>


            <style>{`
                .fade-down { animation: fadeDown 0.5s cubic-bezier(.22,1,.36,1) both; }
                .fade-up   { animation: fadeUp   0.5s cubic-bezier(.22,1,.36,1) both; }

                @keyframes fadeDown {
                    from { opacity: 0; transform: translateY(-16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(14px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                .chip-btn:hover {
                    border-color: rgba(34,211,165,0.4) !important;
                    color: #22d3a5 !important;
                }
                .trending-chip:hover {
                    border-color: rgba(34,211,165,0.3) !important;
                    color: #22d3a5 !important;
                    background: rgba(34,211,165,0.04) !important;
                }
                .category-card:hover {
                    border-color: rgba(34,211,165,0.22) !important;
                    background: rgba(34,211,165,0.035) !important;
                }

                .skeleton-shimmer {
                    background: linear-gradient(90deg,
                        rgba(255,255,255,0.03) 25%,
                        rgba(255,255,255,0.065) 50%,
                        rgba(255,255,255,0.03) 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.8s infinite;
                }
                @keyframes shimmer {
                    from { background-position: 200% 0; }
                    to   { background-position: -200% 0; }
                }
            `}</style>
        </div>
    );
}

export default function Page() {
    return <Suspense fallback={null}><SearchPage /></Suspense>;
}
