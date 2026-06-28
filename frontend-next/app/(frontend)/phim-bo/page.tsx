"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import Breadcrumb from "@/components/frontend/Breadcrumb";
import MovieSearch from "@/components/frontend/MovieSearch";
import Pagination from "@/components/frontend/Pagination";
import MovieCard from "@/components/frontend/MovieCard";
import SEO from "@/components/frontend/SEO";

import type { Movie } from "@/types/movie";

import { movieService } from "@/services/movieService";
import DaheeFacebookAd from "@/components/frontend/Ad/DaheeFacebookAd";

interface PaginationState {
    current_page: number;
    last_page: number;
}

// ── Skeleton card ──
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
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
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

function PhimBoPage() {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(false);
    const searchParams = useSearchParams()
    const router = useRouter();
    const [pagination, setPagination] = useState<PaginationState>({ current_page: 1, last_page: 1 });
    const [totalMovies, setTotalMovies] = useState<number | null>(null);

    const pageFromUrl = Number(searchParams.get("page") || 1);

    /* ── Fetch ── */
    const fetchMovies = useCallback(async (page: number) => {
        setLoading(true);
        try {
            const res = await movieService.dataFilterMovie({
                type_list: "phim-bo",
                page,
                year: "2025",
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
    }, []);

    useEffect(() => {
        fetchMovies(pageFromUrl);
    }, [searchParams, fetchMovies]);

    /* ── Scroll top ── */
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }, [searchParams]);

    /* ── Pagination handler ── */
    const handleChangePage = (page: number) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set("page", page.toString());
        router.push(`?${newParams.toString()}`);
    };

    return (
        <div className="w-full mt-28 text-white">
            <SEO
                title="Phim Bộ | Xem Phim Bộ Mới Nhất Vietsub HD | MoxiMovie"
                description="Xem phim bộ mới nhất, phim dài tập Vietsub HD 1080p tại MoxiMovie. Kho phim bộ lớn, cập nhật nhanh, xem mượt, không quảng cáo độc hại."
                canonical="https://www.moximovie.click/phim-bo"
            />

            <Breadcrumb />

            {/* ── PAGE HEADER ── */}
            <div
                className="px-3 lg:px-5 xl:px-6 pt-2 pb-5 flex items-center justify-between gap-3"
                style={{ animation: "fadeSlideDown 0.5s ease both" }}
            >
                <h1 className="text-xl sm:text-2xl font-bold leading-tight text-white">
                    Phim Bộ Mới Nhất
                </h1>
                {totalMovies ? (
                    <span className="text-[12px] text-white/35 whitespace-nowrap shrink-0">
                        {totalMovies.toLocaleString()} phim &middot; Trang {pagination.current_page}/{pagination.last_page}
                    </span>
                ) : null}
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
                        {Array.from({ length: 16 }).map((_, i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </div>
                ) : movies.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-16 h-16 rounded-2xl border border-white/8 bg-white/3 flex items-center justify-center mb-4 text-2xl">
                            🎬
                        </div>
                        <p className="text-gray-400 font-medium">Không tìm thấy phim</p>
                        <p className="text-gray-600 text-sm mt-1">Thử thay đổi bộ lọc nhé!</p>
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
                <div
                    className="mt-10 mb-6"
                    style={{ animation: "fadeSlideUp 0.4s ease both" }}
                >
                    <Pagination
                        currentPage={pagination.current_page}
                        lastPage={pagination.last_page}
                        onChangePage={handleChangePage}
                    />
                </div>
            )}

            <DaheeFacebookAd />

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

export default function Page() {
    return <Suspense fallback={null}><PhimBoPage /></Suspense>;
}
