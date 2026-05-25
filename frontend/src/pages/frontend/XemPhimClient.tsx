import { Link, useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useLocalWatched } from "@/hooks/useLocalWatched";

import type { Movie } from "@/types/movie";
import type { Episode } from "@/types/episode";

import { movieService } from "@/services/movieService";
import { toast } from "sonner";

import SEO from "@/components/frontend/SEO";
import { ThreeDot } from "react-loading-indicators";
import HlsPlayerWithFilter from "@/components/frontend/MovieDetailPlay/HlsPlayerWithFilter";
import type { Server } from "@/types/server";

/* ══════════════════════════════════════════════
   CONFIG
══════════════════════════════════════════════ */
const EP_LIMIT   = 36;

/* ══════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════ */
export default function XemPhimClient() {
    const [movie,            setMovie]            = useState<Movie | null>(null);
    const [currentEpisode,   setCurrentEpisode]   = useState<Episode | null>(null);
    const [servers,          setServers]          = useState<Server[]>([]);
    const [loading,          setLoading]          = useState(true);
    const [showAllEps,       setShowAllEps]       = useState(false);
    const [showAllEpsMobile, setShowAllEpsMobile] = useState(false);

    const { slug }         = useParams();
    const [searchParams]   = useSearchParams();
    const { markWatched, isWatched } = useLocalWatched(slug);

    const verIndex = Math.max(Number(searchParams.get("ver") ?? 1) - 1, 0);
    const epIndex  = Math.max(Number(searchParams.get("ep")  ?? 1) - 1, 0);

    const isSeries        = Number(movie?.episode_total ?? 1) > 1;
    const currentServerData = servers[verIndex]?.server_data ?? [];

    useEffect(() => { setShowAllEps(false); setShowAllEpsMobile(false); }, [slug, verIndex]);
    useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [slug, currentEpisode]);

    /* ── Auto-mark tập đang xem là đã xem ── */
    useEffect(() => {
        if (currentEpisode?.slug) markWatched(currentEpisode.slug);
    }, [currentEpisode?.slug, markWatched]);

    /* ── Fetch phim ── */
    useEffect(() => {
        if (!slug) return;
        const fetch = async () => {
            setLoading(true);
            try {
                const res       = await movieService.dataDetailMovie(slug);
                const movieData = res.movie   ?? null;
                const eps       = res.episodes ?? [];
                setServers(eps);
                setMovie(movieData);

                const safeVer = Math.min(Math.max(verIndex, 0), eps.length - 1);
                const server  = eps[safeVer];
                if (!server?.server_data?.length) { setCurrentEpisode(null); return; }

                const series = Number(movieData?.episode_total ?? 1) > 1;
                const ep     = series
                    ? server.server_data[Math.min(Math.max(epIndex, 0), server.server_data.length - 1)] ?? null
                    : server.server_data[0];
                setCurrentEpisode(ep);
            } catch (err) {
                console.error(err);
                toast.error("Không thể tải dữ liệu phim");
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [slug, verIndex, epIndex]);

    /* ────────────────────────────────────────── */
    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <ThreeDot variant="bounce" color="#32cd32" size="medium" text="" textColor="" />
        </div>
    );

    if (!movie || !currentEpisode) return (
        <div className="flex items-center justify-center min-h-[60vh] text-gray-400">
            Không có dữ liệu phim
        </div>
    );

    const activeOutOfLimit = epIndex >= EP_LIMIT;
    const hasMore          = currentServerData.length > EP_LIMIT;

    const visibleEpsSidebar = (showAllEps    || !hasMore || activeOutOfLimit) ? currentServerData : currentServerData.slice(0, EP_LIMIT);
    const visibleEpsMobile  = (showAllEpsMobile || !hasMore || activeOutOfLimit) ? currentServerData : currentServerData.slice(0, EP_LIMIT);

    const ShowMoreBtn = ({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) => (
        <button
            onClick={onToggle}
            className="mt-2 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 transition border border-dashed border-white/10"
        >
            {isOpen ? (
                <><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>Thu gọn</>
            ) : (
                <><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>Xem thêm {currentServerData.length - EP_LIMIT} tập</>
            )}
        </button>
    );

    return (
        <>
            <SEO
                title={`${movie.name} (${movie.year}) - Xem phim HD`}
                description={`Xem ${movie.name} Vietsub HD`}
                canonical={`https://www.moximovie.click/xem-phim/${movie.slug}`}
                image={movie.thumb_url}
                type="movie"
                name={movie.name}
            />

            {/* BREADCRUMB */}
            <nav className="max-w-[1400px] mx-auto px-4 mt-20 mb-3 text-sm text-gray-400">
                <ol className="flex items-center gap-3 flex-wrap">
                    <li>
                        <Link to={`/phim/${movie.slug}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 ring-1 ring-white/10 transition text-gray-300 hover:text-white">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                <path d="M15 18l-6-6 6-6" />
                            </svg>
                            <span className="text-xs">Quay lại</span>
                        </Link>
                    </li>
                    <li className="text-white/30">/</li>
                    <li className="text-white font-medium text-sm truncate max-w-[300px] sm:max-w-none">
                        {movie?.name}
                        {isSeries && <span className="ml-2 text-green-400 font-semibold">Tập {epIndex + 1}</span>}
                    </li>
                </ol>
            </nav>

            {/* LAYOUT CHÍNH */}
            <div className="max-w-[1400px] mx-auto px-2 sm:px-3">
                <div className={`flex gap-3 ${isSeries ? "flex-col xl:flex-row" : "flex-col"}`}>

                    {/* PLAYER */}
                    <div className={isSeries ? "xl:flex-1 min-w-0" : "w-full"}>
                        <div className="relative w-full aspect-video bg-black rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.7)] ring-1 ring-white/10">
                            {currentEpisode.link_m3u8 && (
                                <HlsPlayerWithFilter src={currentEpisode.link_m3u8} poster={movie.thumb_url} />
                            )}
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        </div>

                        {isSeries && (
                            <div className="mt-3 flex items-center gap-2 px-1">
                                <span className="w-1 h-4 rounded-full bg-green-400 inline-block shrink-0" />
                                <p className="text-sm text-gray-300">
                                    Đang xem: <span className="text-white font-semibold">{currentEpisode.name ?? `Tập ${epIndex + 1}`}</span>
                                </p>
                            </div>
                        )}
                    </div>

                    {/* SIDEBAR xl */}
                    {isSeries && servers.length > 0 && (
                        <aside className="xl:w-[300px] shrink-0 hidden xl:block">
                            <div className="bg-[rgb(20,22,30)] rounded-xl ring-1 ring-white/10 overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                                    <h3 className="text-sm font-semibold text-white tracking-wide">Danh sách tập</h3>
                                    <span className="text-xs text-gray-500">{currentServerData.length} tập</span>
                                </div>

                                {servers.length > 1 && (
                                    <div className="flex gap-2 px-4 pt-3 pb-1 flex-wrap">
                                        {servers.map((sv, idx) => (
                                            <Link key={idx}
                                                to={`/xem-phim/${movie.slug}?ver=${idx + 1}&ep=${verIndex === idx ? epIndex + 1 : 1}`}
                                                className={`px-2.5 py-1 text-[11px] rounded-md font-medium transition ${verIndex === idx ? "bg-green-400 text-black" : "bg-white/10 text-gray-400 hover:bg-white/15 hover:text-white"}`}>
                                                {sv.server_name ?? `Server ${idx + 1}`}
                                            </Link>
                                        ))}
                                    </div>
                                )}

                                <div className="overflow-y-auto max-h-[512px] px-3 py-3 flex flex-col gap-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                    {visibleEpsSidebar.map((ep, idx) => {
                                        const isActive  = idx === epIndex;
                                        const watched   = !isActive && isWatched(ep.slug);
                                        return (
                                            <Link
                                                key={ep.slug ?? idx}
                                                to={`/xem-phim/${movie.slug}?ver=${verIndex + 1}&ep=${idx + 1}`}
                                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition group ${
                                                    isActive
                                                        ? "bg-green-400/15 ring-1 ring-green-400/40 text-green-300"
                                                        : watched
                                                        ? "hover:bg-white/5 text-green-400/70 hover:text-green-400"
                                                        : "hover:bg-white/5 text-gray-400 hover:text-white"
                                                }`}
                                            >
                                                <span className={`text-[11px] font-bold w-6 text-center shrink-0 ${isActive ? "text-green-400" : watched ? "text-green-400/60" : "text-gray-600 group-hover:text-gray-400"}`}>
                                                    {idx + 1}
                                                </span>
                                                <span className="truncate flex-1 text-[13px]">{ep.name ?? `Tập ${idx + 1}`}</span>
                                                {isActive ? (
                                                    <span className="shrink-0 flex gap-[3px] items-end h-4">
                                                        <span className="w-[3px] bg-green-400 rounded-full animate-[soundbar_0.8s_ease-in-out_infinite]" style={{ height: "40%" }} />
                                                        <span className="w-[3px] bg-green-400 rounded-full animate-[soundbar_0.8s_ease-in-out_0.2s_infinite]" style={{ height: "100%" }} />
                                                        <span className="w-[3px] bg-green-400 rounded-full animate-[soundbar_0.8s_ease-in-out_0.4s_infinite]" style={{ height: "60%" }} />
                                                    </span>
                                                ) : watched ? (
                                                    <span className="shrink-0 text-[11px] font-bold text-green-400/70">✓</span>
                                                ) : null}
                                            </Link>
                                        );
                                    })}

                                    {hasMore && !activeOutOfLimit && (
                                        <ShowMoreBtn isOpen={showAllEps} onToggle={() => setShowAllEps(p => !p)} />
                                    )}
                                </div>
                            </div>
                        </aside>
                    )}
                </div>

                {/* MOBILE/TABLET grid */}
                {isSeries && servers.length > 0 && (
                    <div className="mt-4 xl:hidden">
                        <div className="bg-[rgb(20,22,30)] rounded-xl ring-1 ring-white/10 p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-white">Danh sách tập</h3>
                                <span className="text-xs text-gray-500">{currentServerData.length} tập</span>
                            </div>

                            {servers.length > 1 && (
                                <div className="flex gap-2 mb-3 flex-wrap">
                                    {servers.map((sv, idx) => (
                                        <Link key={idx}
                                            to={`/xem-phim/${movie.slug}?ver=${idx + 1}&ep=${verIndex === idx ? epIndex + 1 : 1}`}
                                            className={`px-2.5 py-1 text-[11px] rounded-md font-medium transition ${verIndex === idx ? "bg-green-400 text-black" : "bg-white/10 text-gray-400 hover:bg-white/15 hover:text-white"}`}>
                                            {sv.server_name ?? `Server ${idx + 1}`}
                                        </Link>
                                    ))}
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2">
                                {visibleEpsMobile.map((ep, idx) => {
                                    const isActive = idx === epIndex;
                                    const watched  = !isActive && isWatched(ep.slug);
                                    return (
                                        <Link
                                            key={ep.slug ?? idx}
                                            to={`/xem-phim/${movie.slug}?ver=${verIndex + 1}&ep=${idx + 1}`}
                                            className={`relative px-3 py-1.5 text-xs rounded-lg font-medium transition ${
                                                isActive
                                                    ? "bg-green-400 text-black shadow-[0_0_12px_rgba(74,222,128,0.4)]"
                                                    : watched
                                                    ? "bg-green-400/10 text-green-400 ring-1 ring-green-400/35 hover:bg-green-400/20"
                                                    : "bg-white/8 text-gray-300 hover:bg-white/15 hover:text-white ring-1 ring-white/10"
                                            }`}
                                        >
                                            {ep.name ?? `${idx + 1}`}
                                            {watched && (
                                                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-green-400 flex items-center justify-center text-[8px] font-bold text-black leading-none">✓</span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>

                            {hasMore && !activeOutOfLimit && (
                                <ShowMoreBtn isOpen={showAllEpsMobile} onToggle={() => setShowAllEpsMobile(p => !p)} />
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* INFO PHIM */}
            <section className="w-full mt-6">
                <div className="max-w-[1400px] mx-auto px-4 py-6">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="w-1 h-5 rounded-full bg-green-400 shrink-0" />
                        <h2 className="text-base font-semibold text-white">Thông tin phim</h2>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="shrink-0">
                            <img src={movie.poster_url} alt={movie.name}
                                className="w-28 sm:w-32 md:w-36 aspect-[2/3] rounded-xl shadow-2xl object-cover ring-1 ring-white/10" />
                        </div>

                        <div className="flex-1 text-white min-w-0">
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight">{movie.name}</h1>

                            {movie.origin_name && <p className="text-sm text-green-400 mt-1 font-medium">{movie.origin_name}</p>}

                            <div className="flex flex-wrap gap-2 mt-3">
                                {movie.quality && <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-md bg-green-400/15 text-green-300 ring-1 ring-green-400/30">{movie.quality}</span>}
                                {movie.year    && <span className="px-2.5 py-0.5 text-[11px] rounded-md bg-white/10 text-gray-300">{movie.year}</span>}
                                {movie.time    && <span className="px-2.5 py-0.5 text-[11px] rounded-md bg-white/10 text-gray-300">{movie.time}</span>}
                            </div>

                            {movie.category?.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {movie.category.map((c: any, i: number) => (
                                        <span key={i} className="px-3 py-1 rounded-md text-xs bg-white/8 hover:bg-white/15 transition text-gray-300 ring-1 ring-white/10 cursor-default">{c.name}</span>
                                    ))}
                                </div>
                            )}

                            <p className="text-sm text-gray-400 mt-4 line-clamp-3 max-w-3xl leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: movie.content ?? "" }} />

                            <Link to={`/phim/${movie.slug}`}
                                className="inline-flex items-center gap-1.5 text-green-400 text-sm mt-4 hover:text-green-300 transition group">
                                Xem thông tin đầy đủ
                                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 18l6-6-6-6" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <style>{`
                @keyframes soundbar {
                    0%, 100% { transform: scaleY(0.4); }
                    50%      { transform: scaleY(1); }
                }
            `}</style>
        </>
    );
}