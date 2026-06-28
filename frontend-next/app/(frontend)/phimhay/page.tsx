"use client";

import { lazy, Suspense, useState, useRef, useEffect, memo } from "react";
import SEO from "@/components/frontend/SEO";
import LoadingVideo from "@/components/frontend/LoadingVideo";

/* ══════════════════════════════════════════════════════
   EAGER — hiện ngay, above the fold
══════════════════════════════════════════════════════ */
import Slider from "@/components/frontend/Slider";
import KoreanMoviesSection from "@/components/frontend/Home/KoreanMoviesSection";
import ChinaMoviesSection from "@/components/frontend/Home/ChinaMoviesSection";
import VietNamMoviesSection from "@/components/frontend/Home/VietNamMoviesSection";
import WibuMoviesSection from "@/components/frontend/Home/WibuMoviesSection";

/* ══════════════════════════════════════════════════════
   LAZY — dưới fold, load khi cần
══════════════════════════════════════════════════════ */
const CommingMoviesSection = lazy(() => import("@/components/frontend/Home/CommingMoviesSection"));
const MoviesInTheatersSection = lazy(() => import("@/components/frontend/Home/MoviesInTheatersSection"));
const NewMoviesSection = lazy(() => import("@/components/frontend/Home/NewMoviesSection"));
const TopTVSeriesSection = lazy(() => import("@/components/frontend/Home/TopTVSeriesSection"));
const CinemaMovieSection = lazy(() => import("@/components/frontend/Home/CinemaMoviesSection"));
const TopMoviesSection = lazy(() => import("@/components/frontend/Home/TopMoviesSection"));
const JapanMoviesSection = lazy(() => import("@/components/frontend/Home/JapanMoviesSection"));
const ThailandMoviesSection = lazy(() => import("@/components/frontend/Home/ThailandMoviesSection"));
const LatestAnimeCollectionSection = lazy(() => import("@/components/frontend/Home/LatestAnimeCollectionSection"));
const HongKongMoviesSection = lazy(() => import("@/components/frontend/Home/HongKongMoviesSection"));
const GhostMoviesSection = lazy(() => import("@/components/frontend/Home/GhostMoviesSection"));
const BrainTeaserSection = lazy(() => import("@/components/frontend/Home/BrainTeaserWithCriminalsMoviesSection"));

/* ══════════════════════════════════════════════════════
   SKELETON — placeholder khi chưa hiện
══════════════════════════════════════════════════════ */
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

/* ══════════════════════════════════════════════════════
   LAZY SECTION — chỉ render khi gần viewport
══════════════════════════════════════════════════════ */
interface LazySectionProps {
    children: React.ReactNode;
    rootMargin?: string;
}

const LazySection = memo(({ children, rootMargin = "400px" }: LazySectionProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (visible) return;

        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    io.disconnect();
                }
            },
            { rootMargin }
        );
        io.observe(el);
        return () => io.disconnect();
    }, [visible, rootMargin]);

    return (
        <div ref={ref}>
            {visible
                ? <Suspense fallback={<SectionSkeleton />}>{children}</Suspense>
                : <SectionSkeleton />
            }
        </div>
    );
});

/* ══════════════════════════════════════════════════════
   HOMEPAGE
══════════════════════════════════════════════════════ */
const HomePage = () => {
    const shouldShowIntro = false;
    const [showLoading, setShowLoading] = useState(shouldShowIntro);

    /* scroll to top */
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }, []);

    /* intro timer */
    useEffect(() => {
        if (!shouldShowIntro) return;
        const t = setTimeout(() => {
            setShowLoading(false);
            window.history.replaceState({}, document.title);
        }, 3000);
        return () => clearTimeout(t);
    }, [shouldShowIntro]);

    /* lock body scroll during intro */
    useEffect(() => {
        document.body.style.overflow = showLoading ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [showLoading]);

    return (
        <>
            <SEO
                title="MoxiMovie – Xem Phim Mới | Phim Hay | Vietsub HD | Thuyết Minh"
                description="MoxiMovie - Trang xem phim mới, phim hay Vietsub HD. Cập nhật hơn 10.000+ phim chiếu rạp, phim bộ, phim lẻ chất lượng cao mỗi ngày."
                canonical="https://www.moximovie.click/"
                type="website"
            />

            <LoadingVideo visible={showLoading} />

            {/* ── ABOVE FOLD — render ngay, không lazy ── */}
            <Slider />

            {/* ── Drama block (eager — ngay dưới slider) ── */}
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
                    <KoreanMoviesSection />
                    <ChinaMoviesSection />
                    <VietNamMoviesSection />
                    <WibuMoviesSection />
                </div>
            </div>

            {/* ══════════════════════════════════════════
                BELOW FOLD — lazy render từng section
                rootMargin lớn = prefetch sớm hơn
            ══════════════════════════════════════════ */}

            <LazySection rootMargin="600px">
                <CommingMoviesSection />
            </LazySection>

            <LazySection rootMargin="500px">
                <MoviesInTheatersSection />
            </LazySection>

            <LazySection rootMargin="500px">
                <NewMoviesSection />
            </LazySection>

            <LazySection rootMargin="500px">
                <TopTVSeriesSection />
            </LazySection>

            <LazySection rootMargin="400px">
                <CinemaMovieSection />
            </LazySection>

            <LazySection rootMargin="400px">
                <TopMoviesSection />
            </LazySection>

            <LazySection rootMargin="400px">
                <JapanMoviesSection />
            </LazySection>

            <LazySection rootMargin="400px">
                <ThailandMoviesSection />
            </LazySection>

            <LazySection rootMargin="300px">
                <LatestAnimeCollectionSection />
            </LazySection>

            <LazySection rootMargin="300px">
                <HongKongMoviesSection />
            </LazySection>

            <LazySection rootMargin="300px">
                <GhostMoviesSection />
            </LazySection>

            <LazySection rootMargin="300px">
                <BrainTeaserSection />
            </LazySection>
        </>
    );
};

export default HomePage;