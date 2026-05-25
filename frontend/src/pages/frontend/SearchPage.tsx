// src/pages/SearchPage.tsx
import { useSearchParams } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import { Search } from "lucide-react";
import { movieService } from "@/services/movieService";
import type { Movie } from "@/types/movie";
import Breadcrumb from "@/components/frontend/Breadcrumb";
import MovieCard from "@/components/frontend/MovieCard";
import Pagination from "@/components/frontend/Pagination";
import SEO from "@/components/frontend/SEO";
import DaheeFacebookAd from "@/components/frontend/Ad/DaheeFacebookAd";

/* ══════════════════════════════════════════
   Skeleton card
══════════════════════════════════════════ */
function SkeletonCard() {
    return (
        <div className="flex flex-col gap-2">
            <div className="w-full aspect-[2/3] rounded-[6px] bg-white/[0.04] skeleton-shimmer" />
            <div className="h-2.5 bg-white/[0.04] rounded skeleton-shimmer w-4/5" />
            <div className="h-2 bg-white/[0.04] rounded skeleton-shimmer w-3/5" />
        </div>
    );
}

/* ══════════════════════════════════════════
   Reveal on scroll
══════════════════════════════════════════ */
function useRevealOnScroll() {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
            { threshold: 0.08 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    return { ref, visible };
}

function AnimatedCard({ movie, index }: { movie: Movie; index: number }) {
    const { ref, visible } = useRevealOnScroll();
    return (
        <div
            ref={ref}
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(18px)",
                transition: `opacity 0.5s cubic-bezier(.22,1,.36,1) ${(index % 8) * 45}ms,
                             transform 0.5s cubic-bezier(.22,1,.36,1) ${(index % 8) * 45}ms`,
            }}
        >
            <MovieCard movie={movie} />
        </div>
    );
}

/* ══════════════════════════════════════════
   Animated counter
══════════════════════════════════════════ */
function AnimatedCount({ value }: { value: number }) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        if (value === 0) return;
        const duration = 500;
        const startTime = performance.now();
        let raf: number;
        const tick = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1);
            setDisplay(Math.round(progress * value));
            if (progress < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [value]);
    return <>{display.toLocaleString()}</>;
}

/* ══════════════════════════════════════════
   Interface
══════════════════════════════════════════ */
interface PaginationState {
    current_page: number;
    last_page: number;
}

/* ══════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════ */
export default function SearchPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const keyword     = searchParams.get("keyword") ?? "";
    const pageFromUrl = Number(searchParams.get("page") || 1);

    const [query,      setQuery]      = useState(keyword);
    const [results,    setResults]    = useState<Movie[]>([]);
    const [loading,    setLoading]    = useState(false);
    const [totalItems, setTotalItems] = useState<number | null>(null);
    const [focused,    setFocused]    = useState(false);
    const [pagination, setPagination] = useState<PaginationState>({ current_page: 1, last_page: 1 });
    const inputRef = useRef<HTMLInputElement>(null);

    /* ── Fetch ── */
    const fetchResults = useCallback(async (kw: string, page: number) => {
        if (!kw.trim()) { setResults([]); setTotalItems(null); return; }
        setLoading(true);
        try {
            const res = await movieService.dataSearch(kw, page);
            setResults(res?.items ?? res ?? []);
            if (res?.pagination) {
                setPagination({
                    current_page: res.pagination.currentPage ?? page,
                    last_page:    res.pagination.totalPages  ?? 1,
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

    /* ── Handlers ── */
    const handleSearch = () => {
        if (!query.trim()) return;
        setSearchParams({ keyword: query.trim(), page: "1" });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") handleSearch();
    };

    const handleChangePage = (page: number) => {
        const p = new URLSearchParams(searchParams);
        p.set("page", page.toString());
        setSearchParams(p);
    };

    /* ══════════════════════════════════════════
       RENDER
    ══════════════════════════════════════════ */
    return (
        <div className="relative w-full mt-20 text-white min-h-screen">
            <SEO
                title={keyword ? `Tìm kiếm "${keyword}" | MoxiMovie` : "Tìm Kiếm Phim | MoxiMovie"}
                description={keyword ? `Kết quả tìm kiếm phim cho từ khóa "${keyword}" tại MoxiMovie.` : "Tìm kiếm phim Vietsub HD tại MoxiMovie."}
                canonical={`https://www.moximovie.click/tim-kiem${keyword ? `?keyword=${encodeURIComponent(keyword)}` : ""}`}
            />

            <Breadcrumb />

            {/* ══════════════════════════════════════════
                PAGE HEADER
            ══════════════════════════════════════════ */}
            <div className="px-3 lg:px-5 xl:px-6 pt-4 pb-5 header-animate">

                {/* eyebrow */}
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-px h-4 bg-white/30" />
                    <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-white/30">
                        Tìm Kiếm
                    </span>
                </div>

                {/* title */}
                <h1 className="text-2xl sm:text-[28px] font-black leading-tight tracking-tight">
                    {keyword ? (
                        <>
                            Kết quả cho{" "}
                            <span className="text-white/90 italic">"{keyword}"</span>
                        </>
                    ) : (
                        "Tìm Kiếm Phim"
                    )}
                </h1>

                {/* meta */}
                <div className="mt-1.5 h-5 text-[12px] font-mono text-white/25">
                    {keyword && !loading ? (
                        totalItems ? (
                            <span className="count-in">
                                <AnimatedCount value={totalItems} /> kết quả
                                <span className="mx-1.5 opacity-40">·</span>
                                trang {pagination.current_page}/{pagination.last_page}
                            </span>
                        ) : (
                            `trang ${pagination.current_page} / ${pagination.last_page}`
                        )
                    ) : loading ? (
                        <span className="inline-flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-1 h-1 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: "120ms" }} />
                            <span className="w-1 h-1 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: "240ms" }} />
                        </span>
                    ) : (
                        "nhập từ khóa để tìm kiếm"
                    )}
                </div>
            </div>

            {/* ══════════════════════════════════════════
                SEARCH BAR
            ══════════════════════════════════════════ */}
            <div className="px-3 lg:px-5 xl:px-6 mb-8 search-animate">
                <div className="relative max-w-xl">
                    {/* focus ring */}
                    <div className={`
                        absolute -inset-px rounded-[7px] transition-opacity duration-300
                        bg-gradient-to-r from-white/15 via-white/8 to-white/15
                        ${focused ? "opacity-100" : "opacity-0"}
                    `} />

                    <div className={`
                        relative flex items-center gap-3 rounded-[6px] border bg-white/[0.03]
                        px-4 py-0.5 transition-colors duration-200
                        ${focused ? "border-white/20" : "border-white/8"}
                    `}>
                        <Search
                            size={15}
                            className={`shrink-0 transition-colors duration-200 ${focused ? "text-white/60" : "text-white/25"}`}
                        />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onFocus={() => setFocused(true)}
                            onBlur={() => setFocused(false)}
                            placeholder="Tìm kiếm phim, diễn viên..."
                            autoFocus
                            className="flex-1 bg-transparent py-3 text-[13.5px] text-white placeholder:text-white/25 outline-none"
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                                className="shrink-0 w-4 h-4 flex items-center justify-center text-white/20 hover:text-white/50 transition-colors text-base leading-none"
                            >
                                ×
                            </button>
                        )}
                        {/* divider */}
                        <div className="w-px h-4 bg-white/10 shrink-0" />
                        <button
                            type="button"
                            onClick={handleSearch}
                            className="shrink-0 px-4 py-1.5 rounded-[4px] bg-white hover:bg-white/90 active:scale-95 text-black text-[11.5px] font-bold transition-all tracking-wide"
                        >
                            Tìm
                        </button>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════
                MOVIE GRID
            ══════════════════════════════════════════ */}
            <section className="relative z-10 px-3 lg:px-5 xl:px-6">
                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4">
                        {Array.from({ length: 16 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : results.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4">
                        {results.map((movie, index) => (
                            <AnimatedCard key={movie._id} movie={movie} index={index} />
                        ))}
                    </div>
                ) : keyword ? (
                    /* empty — có keyword */
                    <div className="flex flex-col items-center justify-center py-24 text-center empty-animate">
                        <div className="w-16 h-16 rounded-[8px] border border-white/8 bg-white/[0.03] flex items-center justify-center mb-5">
                            <Search size={22} className="text-white/20" />
                        </div>
                        <p className="text-white/50 font-semibold text-[14px]">
                            Không tìm thấy kết quả cho{" "}
                            <span className="text-white/70 italic">"{keyword}"</span>
                        </p>
                        <p className="text-white/20 text-[12.5px] mt-1.5 font-mono">thử từ khóa khác</p>
                    </div>
                ) : (
                    /* empty — chưa nhập */
                    <div className="flex flex-col items-center justify-center py-24 text-center empty-animate">
                        <div className="w-16 h-16 rounded-[8px] border border-white/8 bg-white/[0.03] flex items-center justify-center mb-5">
                            <Search size={22} className="text-white/20" />
                        </div>
                        <p className="text-white/40 font-semibold text-[14px]">Nhập từ khóa để bắt đầu</p>
                        <p className="text-white/18 text-[12px] mt-1.5 font-mono">hàng ngàn bộ phim đang chờ</p>
                    </div>
                )}
            </section>

            {/* ── Pagination ── */}
            {!loading && results.length > 0 && (
                <div className="mt-10 mb-6 pagination-animate">
                    <Pagination
                        currentPage={pagination.current_page}
                        lastPage={pagination.last_page}
                        onChangePage={handleChangePage}
                    />
                </div>
            )}

            <DaheeFacebookAd />

            <style>{`
                .header-animate     { animation: fadeDown 0.45s cubic-bezier(.22,1,.36,1) both; }
                .search-animate     { animation: fadeDown 0.45s cubic-bezier(.22,1,.36,1) 0.07s both; }
                .empty-animate      { animation: fadeUp   0.45s cubic-bezier(.22,1,.36,1) both; }
                .pagination-animate { animation: fadeUp   0.35s cubic-bezier(.22,1,.36,1) both; }
                .count-in           { animation: fadeUp   0.35s cubic-bezier(.22,1,.36,1) both; }

                @keyframes fadeDown {
                    from { opacity: 0; transform: translateY(-12px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                .skeleton-shimmer {
                    background: linear-gradient(90deg,
                        rgba(255,255,255,0.03) 25%,
                        rgba(255,255,255,0.07) 50%,
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