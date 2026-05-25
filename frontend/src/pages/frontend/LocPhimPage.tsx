import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "react-router";

import Breadcrumb from "@/components/frontend/Breadcrumb";
import MovieSearch from "@/components/frontend/MovieSearch";
import Pagination from "@/components/frontend/Pagination";
import MovieCard from "@/components/frontend/MovieCard";
import SEO from "@/components/frontend/SEO";

import type { Movie } from "@/types/movie";

import { movieService } from "@/services/movieService";
import DaheeInlineAd from "@/components/frontend/Ad/DaheeInlineAd";

interface PaginationData {
    current_page: number;
    last_page: number;
}

// ── Skeleton ──
function SkeletonCard() {
    return (
        <div className="flex flex-col gap-2">
            <div className="w-full aspect-[2/3] rounded-xl bg-white/5 animate-pulse" />
            <div className="h-3 bg-white/5 rounded animate-pulse w-4/5" />
            <div className="h-2.5 bg-white/5 rounded animate-pulse w-3/5" />
        </div>
    );
}

// ── Reveal khi scroll ──
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
                transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.97)",
                transition: `opacity 0.5s ease ${(index % 8) * 45}ms, transform 0.5s ease ${(index % 8) * 45}ms`,
            }}
        >
            <MovieCard movie={movie} />
        </div>
    );
}

// ── Label hiển thị filter đang active ──
const TYPE_LABELS: Record<string, string> = {
    "phim-le": "Phim Lẻ",
    "phim-bo": "Phim Bộ",
    "hoat-hinh": "Hoạt Hình",
    "tv-shows": "TV Shows",
};

export default function LocPhimPage() {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const [pagination, setPagination] = useState<PaginationData>({ current_page: 1, last_page: 1 });
    const [totalMovies, setTotalMovies] = useState<number | null>(null);

    const page        = Number(searchParams.get("page") || 1);
    const type_list   = searchParams.get("type_list") || "phim-le";
    const country     = searchParams.get("country") || "";
    const category    = searchParams.get("category") || "";
    const year        = searchParams.get("year") || "";
    const sort_lang   = searchParams.get("sort_lang") || "";

    /* ── Fetch ── */
    const fetchMovies = useCallback(async () => {
        setLoading(true);
        try {
            const res = await movieService.dataFilterMovie({
                type_list,
                page,
                country,
                category,
                year,
                sort_lang,
                limit: 32,
            });
            setMovies(res.items ?? []);
            setPagination({
                current_page: res.pagination?.currentPage ?? page,
                last_page: res.pagination?.totalPages ?? 1,
            });
            if (res.pagination?.totalItems) setTotalMovies(res.pagination.totalItems);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [searchParams]);

    useEffect(() => { fetchMovies(); }, [searchParams]);

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }, [searchParams]);

    const handleChangePage = (p: number) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set("page", String(p));
        setSearchParams(newParams);
    };

    // Tính các filter đang active để hiển thị badge
    const activeFilters: { key: string; label: string }[] = [];
    if (country)   activeFilters.push({ key: "country",   label: `🌏 ${country}` });
    if (category)  activeFilters.push({ key: "category",  label: `🎭 ${category}` });
    if (year)      activeFilters.push({ key: "year",       label: `📅 ${year}` });
    if (sort_lang) activeFilters.push({ key: "sort_lang",  label: `🔤 ${sort_lang}` });

    const pageTitle = TYPE_LABELS[type_list] ?? "Lọc Phim";

    return (
        <div className="w-full mt-20 text-white">
            <SEO
                title="Lọc Phim | Tìm Phim Vietsub HD Nhanh & Chính Xác | MoxiMovie"
                description="Lọc phim nhanh chóng theo năm, thể loại, quốc gia. Xem phim Vietsub HD 1080p chất lượng cao tại MoxiMovie."
                canonical="https://www.moximovie.click/loc-phim"
            />

            <Breadcrumb />

            {/* ── PAGE HEADER ── */}
            <div
                className="px-3 lg:px-5 xl:px-6 pt-4 pb-5"
                style={{ animation: "fadeSlideDown 0.5s ease both" }}
            >
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2.5 mb-2">
                            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-yellow-400 to-orange-500 shrink-0" />
                            <span className="text-yellow-400 text-xs font-bold tracking-widest uppercase">
                                Kết quả lọc
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black leading-tight">
                            {pageTitle}
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            {totalMovies
                                ? `${totalMovies.toLocaleString()} bộ phim · Trang ${pagination.current_page}/${pagination.last_page}`
                                : `Trang ${pagination.current_page} / ${pagination.last_page}`}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── SEARCH ── */}
            <div
                className="px-1 lg:px-2 xl:px-0 mb-6"
                style={{ animation: "fadeSlideDown 0.5s ease 0.08s both" }}
            >
                <MovieSearch />
            </div>

            {/* ── MOVIE GRID ── */}
            <section className="px-3 lg:px-5 xl:px-6">
                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4">
                        {Array.from({ length: 16 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : movies.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-16 h-16 rounded-2xl border border-white/8 bg-white/3 flex items-center justify-center mb-4 text-2xl">
                            🔍
                        </div>
                        <p className="text-gray-400 font-medium">Không tìm thấy phim</p>
                        <p className="text-gray-600 text-sm mt-1">Thử thay đổi bộ lọc nhé!</p>
                        {activeFilters.length > 0 && (
                            <button
                                onClick={() => setSearchParams({ type_list, page: "1" })}
                                className="mt-4 px-4 py-2 text-xs rounded-lg border border-yellow-400/30 bg-yellow-400/10 text-yellow-300 hover:bg-yellow-400/20 transition-all"
                            >
                                Xóa bộ lọc
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4">
                        {movies.map((movie, index) => (
                            <AnimatedCard key={movie._id} movie={movie} index={index} />
                        ))}
                    </div>
                )}
            </section>

            {/* ── PAGINATION ── */}
            {!loading && movies.length > 0 && (
                <div className="mt-10 mb-6" style={{ animation: "fadeSlideUp 0.4s ease both" }}>
                    <Pagination
                        currentPage={pagination.current_page}
                        lastPage={pagination.last_page}
                        onChangePage={handleChangePage}
                    />
                </div>
            )}

            <DaheeInlineAd />

            <style>{`
                @keyframes fadeSlideDown {
                    from { opacity: 0; transform: translateY(-14px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeSlideUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}