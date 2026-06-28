"use client";

import { lazy, Suspense, useEffect, memo, useRef, useState } from "react";
import SEO from "@/components/frontend/SEO";
import type { Movie } from "@/types/movie";

import Slider from "@/components/frontend/Slider";
import KoreanMoviesSection from "@/components/frontend/Home/KoreanMoviesSection";
import ChinaMoviesSection from "@/components/frontend/Home/ChinaMoviesSection";
import VietNamMoviesSection from "@/components/frontend/Home/VietNamMoviesSection";
import WibuMoviesSection from "@/components/frontend/Home/WibuMoviesSection";

const CommingMoviesSection         = lazy(() => import("@/components/frontend/Home/CommingMoviesSection"));
const MoviesInTheatersSection      = lazy(() => import("@/components/frontend/Home/MoviesInTheatersSection"));
const NewMoviesSection             = lazy(() => import("@/components/frontend/Home/NewMoviesSection"));
const TopTVSeriesSection           = lazy(() => import("@/components/frontend/Home/TopTVSeriesSection"));
const CinemaMovieSection           = lazy(() => import("@/components/frontend/Home/CinemaMoviesSection"));
const TopMoviesSection             = lazy(() => import("@/components/frontend/Home/TopMoviesSection"));
const JapanMoviesSection           = lazy(() => import("@/components/frontend/Home/JapanMoviesSection"));
const ThailandMoviesSection        = lazy(() => import("@/components/frontend/Home/ThailandMoviesSection"));
const LatestAnimeCollectionSection = lazy(() => import("@/components/frontend/Home/LatestAnimeCollectionSection"));
const HongKongMoviesSection        = lazy(() => import("@/components/frontend/Home/HongKongMoviesSection"));
const GhostMoviesSection           = lazy(() => import("@/components/frontend/Home/GhostMoviesSection"));
const BrainTeaserSection           = lazy(() => import("@/components/frontend/Home/BrainTeaserWithCriminalsMoviesSection"));

/* ── Skeleton ── */
const SectionSkeleton = memo(() => (
    <div className="px-3 lg:px-5 xl:px-6 py-4">
        <div className="h-5 w-40 rounded bg-white/5 mb-4 animate-pulse" />
        <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 rounded-xl bg-white/5 animate-pulse"
                    style={{ width: 200, height: 113, animationDelay: `${i * 60}ms` }} />
            ))}
        </div>
    </div>
));
SectionSkeleton.displayName = "SectionSkeleton";

/* ── RevealSection — fade + slide lên khi vào viewport ── */
interface RevealProps {
    children: React.ReactNode;
    delay?: number;         // ms stagger
    threshold?: number;     // 0..1, bao nhiêu % phần tử phải trong viewport
}
const RevealSection = memo(({ children, delay = 0, threshold = 0.06 }: RevealProps) => {
    const ref  = useRef<HTMLDivElement>(null);
    const [shown, setShown] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    const t = setTimeout(() => setShown(true), delay);
                    io.disconnect();
                    return () => clearTimeout(t);
                }
            },
            { rootMargin: "0px 0px -40px 0px", threshold }
        );
        io.observe(el);
        return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div
            ref={ref}
            style={{
                opacity:   shown ? 1 : 0,
                transform: shown ? "translateY(0)" : "translateY(28px)",
                transition: `opacity 0.6s ease ${delay}ms, transform 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
                willChange: shown ? "auto" : "opacity, transform",
            }}
        >
            {children}
        </div>
    );
});
RevealSection.displayName = "RevealSection";

/* ── LazySection — load khi gần viewport + reveal animation ── */
interface LazySectionProps {
    children: React.ReactNode;
    loadMargin?: string;    // khoảng cách bắt đầu load
    delay?: number;
}
const LazySection = memo(({ children, loadMargin = "400px", delay = 0 }: LazySectionProps) => {
    const ref       = useRef<HTMLDivElement>(null);
    const [loaded,  setLoaded]  = useState(false);
    const [shown,   setShown]   = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        /* pre-load sớm — khi còn cách viewport loadMargin */
        const loadIo = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) { setLoaded(true); loadIo.disconnect(); } },
            { rootMargin: loadMargin }
        );
        /* animate khi thực sự vào viewport */
        const revealIo = new IntersectionObserver(
            ([e]) => {
                if (e.isIntersecting) {
                    const t = setTimeout(() => setShown(true), delay);
                    revealIo.disconnect();
                    return () => clearTimeout(t);
                }
            },
            { rootMargin: "0px 0px -40px 0px", threshold: 0.04 }
        );

        loadIo.observe(el);
        revealIo.observe(el);
        return () => { loadIo.disconnect(); revealIo.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div
            ref={ref}
            style={{
                opacity:   shown ? 1 : 0,
                transform: shown ? "translateY(0)" : "translateY(28px)",
                transition: `opacity 0.6s ease, transform 0.65s cubic-bezier(0.16,1,0.3,1)`,
                willChange: shown ? "auto" : "opacity, transform",
            }}
        >
            {loaded
                ? <Suspense fallback={<SectionSkeleton />}>{children}</Suspense>
                : <SectionSkeleton />}
        </div>
    );
});
LazySection.displayName = "LazySection";

/* ── Types ── */
export interface HomeInitialData {
    slider:  Movie[];
    korean:  Movie[];
    china:   Movie[];
    vietnam: Movie[];
    wibu:    Movie[];
}

/* ── Main client page ── */
export default function HomePageClient({ initialData }: { initialData: HomeInitialData }) {
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }, []);

    return (
        <>
            <SEO
                title="MoxiMovie – Xem Phim Mới | Phim Hay | Vietsub HD | Thuyết Minh"
                description="MoxiMovie - Trang xem phim mới, phim hay Vietsub HD. Cập nhật hơn 10.000+ phim chiếu rạp, phim bộ, phim lẻ chất lượng cao mỗi ngày."
                canonical="https://www.moximovie.click/phimhay"
                type="website"
            />

            {/* ── Slider: không cần reveal, xuất hiện ngay ── */}
            <Slider initialData={initialData.slider} />

            {/* ── 4 sections above fold: stagger reveal ngay sau slider ── */}
            <div className="mt-8 px-3 sm:px-5 xl:px-6">
                <div style={{
                    background: "linear-gradient(to bottom, #282b3a 0%, #282b3a 66%, #191B24 100%)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderBottom: "none",
                    borderRadius: 16,
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                    overflow: "hidden",
                }}>
                    <RevealSection delay={0}>
                        <KoreanMoviesSection initialData={initialData.korean} />
                    </RevealSection>
                    <RevealSection delay={80}>
                        <ChinaMoviesSection initialData={initialData.china} />
                    </RevealSection>
                    <RevealSection delay={160}>
                        <VietNamMoviesSection initialData={initialData.vietnam} />
                    </RevealSection>
                    <RevealSection delay={240}>
                        <WibuMoviesSection initialData={initialData.wibu} />
                    </RevealSection>
                </div>
            </div>

            {/* ── Below fold: load sớm, reveal khi scroll đến ── */}
            <LazySection loadMargin="600px"><CommingMoviesSection /></LazySection>
            <LazySection loadMargin="500px"><MoviesInTheatersSection /></LazySection>
            <LazySection loadMargin="500px"><NewMoviesSection /></LazySection>
            <LazySection loadMargin="500px"><TopTVSeriesSection /></LazySection>
            <LazySection loadMargin="400px"><CinemaMovieSection /></LazySection>
            <LazySection loadMargin="400px"><TopMoviesSection /></LazySection>
            <LazySection loadMargin="400px"><JapanMoviesSection /></LazySection>
            <LazySection loadMargin="400px"><ThailandMoviesSection /></LazySection>
            <LazySection loadMargin="300px"><LatestAnimeCollectionSection /></LazySection>
            <LazySection loadMargin="300px"><HongKongMoviesSection /></LazySection>
            <LazySection loadMargin="300px"><GhostMoviesSection /></LazySection>
            <LazySection loadMargin="300px"><BrainTeaserSection /></LazySection>
        </>
    );
}
