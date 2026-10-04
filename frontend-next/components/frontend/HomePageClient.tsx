"use client";

import { lazy, Suspense, useEffect, memo, useRef, useState } from "react";
import SEO from "@/components/frontend/SEO";
import "@/components/frontend/Home/home-sections.css";
import "@/components/frontend/Home/home-fx.css";
import HomeFx, { HomeAmbient } from "@/components/frontend/Home/HomeFx";
import MobileTabBar from "@/components/frontend/MobileTabBar";
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
/* animated=false: skeleton của section còn ở xa, không cần nhấp nháy (tốn CPU mỗi frame) */
const SectionSkeleton = memo(({ animated = true }: { animated?: boolean }) => (
    <div className="px-3 lg:px-5 xl:px-6 py-4">
        <div className={`h-5 w-40 rounded bg-white/5 mb-4 ${animated ? "animate-pulse" : ""}`} />
        <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`flex-shrink-0 rounded-xl bg-white/5 ${animated ? "animate-pulse" : ""}`}
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

/* ── Hàng đợi idle: mount trước từng section lúc trình duyệt rảnh (không phải lúc đang cuộn) ── */
const idleQueue: (() => void)[] = [];
let idleRunning = false;
function runIdle() {
    idleRunning = true;
    const ric = window.requestIdleCallback ?? ((cb: IdleRequestCallback) => window.setTimeout(() => cb({ didTimeout: true, timeRemaining: () => 0 }), 300));
    ric(() => {
        idleQueue.shift()?.();
        if (idleQueue.length) runIdle(); else idleRunning = false;
    });
}
function scheduleIdle(fn: () => void) {
    idleQueue.push(fn);
    if (!idleRunning) runIdle();
}
const IDLE_START_MS = 2000; // để trang đầu tiên tải xong, ảnh hiện ra rồi mới bắt đầu

/* ── LazySection — load khi gần viewport + reveal animation ── */
interface LazySectionProps {
    children: React.ReactNode;
    loadMargin?: string;    // khoảng cách bắt đầu load
    prefetch?: boolean;     // true: tự mount lúc rảnh (chỉ cho vài section đầu, tránh tải hết cùng lúc)
    delay?: number;
}
const LazySection = memo(({ children, loadMargin = "400px", delay = 0, prefetch = false }: LazySectionProps) => {
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

        /* Section ngoài màn hình → tạm dừng mọi animation CSS bên trong (xem [data-offscreen] trong globals.css) */
        const pauseIo = new IntersectionObserver(
            ([e]) => el.toggleAttribute("data-offscreen", !e.isIntersecting),
            { rootMargin: "200px" }
        );

        loadIo.observe(el);
        revealIo.observe(el);
        pauseIo.observe(el);

        /* Mount trước lúc rảnh → khi cuộn tới section đã sẵn sàng, không render giữa lúc cuộn */
        let alive = true;
        const idleT = prefetch ? window.setTimeout(() => scheduleIdle(() => { if (alive) setLoaded(true); }), IDLE_START_MS) : 0;
        return () => { alive = false; clearTimeout(idleT); loadIo.disconnect(); revealIo.disconnect(); pauseIo.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div
            ref={ref}
            data-spotlight
            className={shown ? "fx-shown" : undefined}
            style={{
                opacity:   shown ? 1 : 0,
                transform: shown ? "translateY(0)" : "translateY(28px)",
                transition: `opacity 0.6s ease, transform 0.65s cubic-bezier(0.16,1,0.3,1)`,
                willChange: shown ? "auto" : "opacity, transform",
            }}
        >
            {/* Đường sáng chạy ngang khi section hiện ra (home-fx.css) */}
            <span className="fx-reveal-line" aria-hidden />
            {loaded
                ? <Suspense fallback={<SectionSkeleton />}>{children}</Suspense>
                : <SectionSkeleton animated={false} />}
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
/* Không tự scrollTo(0) khi mount: Next đã tự lên đầu trang khi chuyển trang,
   còn khi bấm Back thì cần giữ nguyên vị trí cuộn cũ */
export default function HomePageClient({ initialData }: { initialData: HomeInitialData }) {
    return (
        <>
        {/* Thanh tiến trình + hiệu ứng chuột: ở ngoài khối isolate để không bị thanh thông báo che */}
        <HomeFx />
        {/* isolate: nền màu trôi (-z-10) nằm trên nền layout nhưng dưới nội dung */}
        <div className="relative isolate pb-[calc(60px+env(safe-area-inset-bottom))] md:pb-0">
            <HomeAmbient />
            <SEO
                title="MoxiMovie – Xem Phim Mới | Phim Hay | Vietsub HD | Thuyết Minh"
                description="MoxiMovie - Trang xem phim mới, phim hay Vietsub HD. Cập nhật hơn 10.000+ phim chiếu rạp, phim bộ, phim lẻ chất lượng cao mỗi ngày."
                canonical="https://www.moximovie.click/phimhay"
                type="website"
            />

            {/* Mỗi trang chỉ 1 thẻ h1 (tốt cho SEO); tiêu đề từng slide dùng h2 */}
            <h1 className="sr-only">MoxiMovie – Xem phim mới, phim hay Vietsub HD miễn phí</h1>

            {/* ── Slider: không cần reveal, xuất hiện ngay ── */}
            <Slider initialData={initialData.slider} />


            {/* ── 4 sections above fold: stagger reveal ngay sau slider ── */}
            <div className="mt-8 px-3 sm:px-5 xl:px-6">
                <div data-spotlight style={{
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
            <LazySection loadMargin="600px" prefetch><CommingMoviesSection /></LazySection>
            <LazySection loadMargin="500px" prefetch><MoviesInTheatersSection /></LazySection>
            <LazySection loadMargin="500px" prefetch><NewMoviesSection /></LazySection>
            <LazySection loadMargin="500px"><TopTVSeriesSection /></LazySection>
            <LazySection loadMargin="400px"><CinemaMovieSection /></LazySection>
            <LazySection loadMargin="400px"><TopMoviesSection /></LazySection>
            <LazySection loadMargin="400px"><JapanMoviesSection /></LazySection>
            <LazySection loadMargin="400px"><ThailandMoviesSection /></LazySection>
            <LazySection loadMargin="300px"><LatestAnimeCollectionSection /></LazySection>
            <LazySection loadMargin="300px"><HongKongMoviesSection /></LazySection>
            <LazySection loadMargin="300px"><GhostMoviesSection /></LazySection>
            <LazySection loadMargin="300px"><BrainTeaserSection /></LazySection>
        </div>
        <MobileTabBar />
        </>
    );
}
