"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, Suspense } from "react";
import { useLocalWatched } from "@/hooks/useLocalWatched";

import type { Movie }   from "@/types/movie";
import type { Episode } from "@/types/episode";
import type { Server }  from "@/types/server";

import { movieService } from "@/services/movieService";
import { toast }        from "sonner";

import SEO                from "@/components/frontend/SEO";
import { ThreeDot }       from "react-loading-indicators";
import HlsPlayerWithFilter from "@/components/frontend/MovieDetailPlay/HlsPlayerWithFilter";

/* ══════════════════════════════════════════════
   BACKDROP
══════════════════════════════════════════════ */
function WatchBackdrop({ thumbUrl }: { thumbUrl?: string }) {
    if (!thumbUrl) return null;
    return (
        <div aria-hidden className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={thumbUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover select-none"
                style={{ filter: "blur(80px) brightness(0.18) saturate(1.3)", transform: "scale(1.1)" }}
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(6,8,16,0.55) 0%, rgba(6,8,16,0.75) 50%, rgba(6,8,16,0.97) 100%)" }} />
        </div>
    );
}

/* ══════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════ */
function XemPhimClient() {
    const [movie,            setMovie]            = useState<Movie | null>(null);
    const [currentEpisode,   setCurrentEpisode]   = useState<Episode | null>(null);
    const [servers,          setServers]          = useState<Server[]>([]);
    const [loading,      setLoading]      = useState(true);
    const [playerHeight, setPlayerHeight] = useState(0);
    const [epSearch,     setEpSearch]     = useState("");
    const playerRef    = useRef<HTMLDivElement>(null);
    const sidebarListRef = useRef<HTMLDivElement>(null);

    const { slug: _slug }  = useParams();
    const slug             = _slug as string;
    const searchParams     = useSearchParams();
    const { markWatched, isWatched } = useLocalWatched(slug);

    const verIndex = Math.max(Number(searchParams.get("ver") ?? 1) - 1, 0);
    const epIndex  = Math.max(Number(searchParams.get("ep")  ?? 1) - 1, 0);

    const isSeries         = movie?.type === "series" || movie?.movie === "series" || Number(movie?.episode_total) > 1;
    const currentServerData = servers[verIndex]?.server_data ?? [];

    useEffect(() => { setEpSearch(""); }, [slug, verIndex]);
    useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [slug, currentEpisode]);

    /* Đo chiều cao player sau khi dữ liệu load xong — chạy lại mỗi khi loading đổi */
    useEffect(() => {
        if (loading) return;
        const el = playerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(entries => {
            setPlayerHeight(entries[0]?.contentRect.height ?? 0);
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, [loading]);

    /* Auto-scroll sidebar to active episode */
    useEffect(() => {
        if (loading || !sidebarListRef.current) return;
        const active = sidebarListRef.current.querySelector<HTMLElement>('[data-active="true"]');
        if (active) active.scrollIntoView({ block: "center", behavior: "smooth" });
    }, [loading, epIndex]);

    useEffect(() => {
        if (currentEpisode?.slug) markWatched(currentEpisode.slug);
    }, [currentEpisode?.slug, markWatched]);

    useEffect(() => {
        if (!slug) return;
        const fetchData = async () => {
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

                const series = movieData?.type === "series" || movieData?.movie === "series" || Number(movieData?.episode_total) > 1;
                const ep = series
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
        fetchData();
    }, [slug, verIndex, epIndex]);

    /* ── Loading ── */
    if (loading) return (
        <>
            <WatchBackdrop />
            <div className="relative z-10 flex items-center justify-center min-h-[60vh]">
                <ThreeDot variant="bounce" color="#22d3a5" size="medium" text="" textColor="" />
            </div>
        </>
    );

    if (!movie || !currentEpisode) return (
        <div className="relative z-10 flex items-center justify-center min-h-[60vh] text-gray-400">
            Không có dữ liệu phim
        </div>
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

            <WatchBackdrop thumbUrl={movie.thumb_url} />

            <div className="relative z-10 anim-fadeup">

                {/* ── BREADCRUMB ── */}
                <div className="max-w-[1400px] mx-auto px-4 pt-28 pb-4">
                    <div className="flex items-center gap-3 flex-wrap">
                        <Link href={`/phim/${movie.slug}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/60 hover:text-white transition"
                            style={{
                                background: "rgba(255,255,255,0.07)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                backdropFilter: "blur(8px)",
                            }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                                <path d="M15 18l-6-6 6-6" />
                            </svg>
                            Quay lại
                        </Link>

                        <span className="text-white/20 text-sm">/</span>

                        <span className="text-white/75 text-sm font-medium truncate max-w-[200px] sm:max-w-sm">
                            {movie.name}
                        </span>

                        {isSeries && (
                            <>
                                <span className="text-white/20 text-sm">/</span>
                                <span className="text-sm font-semibold" style={{ color: "#22d3a5" }}>
                                    {currentEpisode.name ?? `Tập ${epIndex + 1}`}
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {/* ── PLAYER + SIDEBAR ── */}
                <div className="max-w-[1400px] mx-auto px-2 sm:px-4">
                    <div className={isSeries ? "xl:flex xl:gap-3 xl:items-start" : ""}>

                        {/* Player */}
                        <div ref={playerRef} className={isSeries ? "xl:flex-1 min-w-0" : ""}>
                            <div
                                className="relative w-full rounded-2xl overflow-hidden"
                                style={{
                                    aspectRatio: "16/9",
                                    boxShadow: "0 0 0 1px rgba(255,255,255,0.07), 0 24px 80px rgba(0,0,0,0.8), 0 0 60px rgba(34,211,165,0.06)",
                                }}
                            >
                                {currentEpisode.link_m3u8 && (
                                    <HlsPlayerWithFilter
                                        src={currentEpisode.link_m3u8}
                                        poster={movie.thumb_url}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Episode sidebar (xl+) — grid item stretches to match player row height */}
                        {isSeries && servers.length > 0 && (
                            <aside
                                className="hidden xl:flex flex-col xl:w-[300px] shrink-0 rounded-2xl overflow-hidden"
                                style={{
                                    height: playerHeight > 0 ? playerHeight : undefined,
                                    background: "rgba(12,14,24,0.88)",
                                    backdropFilter: "blur(16px)",
                                    border: "1px solid rgba(255,255,255,0.07)",
                                    boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
                                }}
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between px-4 py-3.5 shrink-0"
                                    style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4" style={{ color: "#22d3a5" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M9 19V6l12-3v13" strokeLinecap="round" strokeLinejoin="round" />
                                            <circle cx="6" cy="18" r="3" />
                                            <circle cx="18" cy="16" r="3" />
                                        </svg>
                                        <h3 className="text-[13px] font-semibold text-white">Danh sách tập</h3>
                                    </div>
                                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md"
                                        style={{ background: "rgba(34,211,165,0.12)", color: "#22d3a5" }}>
                                        {currentServerData.length} tập
                                    </span>
                                </div>

                                {/* Server tabs */}
                                {servers.length > 1 && (
                                    <div className="flex gap-2 px-4 pt-3 pb-1 flex-wrap shrink-0">
                                        {servers.map((sv, idx) => (
                                            <Link key={idx}
                                                href={`/xem-phim/${movie.slug}?ver=${idx + 1}&ep=${verIndex === idx ? epIndex + 1 : 1}`}
                                                className="px-2.5 py-1 text-[11px] rounded-lg font-medium transition"
                                                style={verIndex === idx
                                                    ? { background: "#22d3a5", color: "#04110d" }
                                                    : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.08)" }
                                                }>
                                                {sv.server_name ?? `Server ${idx + 1}`}
                                            </Link>
                                        ))}
                                    </div>
                                )}

                                {/* Search box — chỉ hiện khi có nhiều tập */}
                                {currentServerData.length > 12 && (
                                    <div className="px-3 pt-2 pb-1 shrink-0">
                                        <div className="relative">
                                            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                                                style={{ color: "rgba(255,255,255,0.3)" }}
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="11" cy="11" r="8" />
                                                <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
                                            </svg>
                                            <input
                                                type="text"
                                                placeholder="Tìm tập..."
                                                value={epSearch}
                                                onChange={e => setEpSearch(e.target.value)}
                                                className="w-full pl-8 pr-8 py-1.5 text-[12px] rounded-lg outline-none transition"
                                                style={{
                                                    background: "rgba(255,255,255,0.06)",
                                                    border: epSearch ? "1px solid rgba(34,211,165,0.4)" : "1px solid rgba(255,255,255,0.08)",
                                                    color: "#fff",
                                                    caretColor: "#22d3a5",
                                                }}
                                            />
                                            {epSearch && (
                                                <button
                                                    onClick={() => setEpSearch("")}
                                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 flex items-center justify-center rounded-full transition hover:opacity-80"
                                                    style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}
                                                >
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-2.5 h-2.5">
                                                        <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Episode list — scrolls within player-locked height */}
                                <div ref={sidebarListRef} className="flex-1 min-h-0 overflow-y-auto px-3 py-2"
                                    style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
                                    <div className="flex flex-col gap-0.5">
                                        {currentServerData.filter((ep, idx) => {
                                            if (!epSearch.trim()) return true;
                                            const q = epSearch.trim().toLowerCase();
                                            return (ep.name ?? "").toLowerCase().includes(q) || String(idx + 1).includes(q);
                                        }).map((ep) => {
                                            const idx = currentServerData.indexOf(ep);
                                            const isActive = idx === epIndex;
                                            const watched  = !isActive && isWatched(ep.slug);
                                            return (
                                                <Link
                                                    key={ep.slug ?? idx}
                                                    href={`/xem-phim/${movie.slug}?ver=${verIndex + 1}&ep=${idx + 1}`}
                                                    data-active={isActive}
                                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm ep-item${isActive ? " ep-item-active" : ""}`}
                                                    style={isActive
                                                        ? { background: "rgba(34,211,165,0.13)", border: "1px solid rgba(34,211,165,0.25)" }
                                                        : { border: "1px solid transparent" }
                                                    }
                                                >
                                                    <span className="text-[11px] font-bold w-6 text-center shrink-0 leading-none"
                                                        style={{ color: isActive ? "#22d3a5" : watched ? "rgba(34,211,165,0.5)" : "rgba(255,255,255,0.25)" }}>
                                                        {idx + 1}
                                                    </span>

                                                    <span className="truncate flex-1 text-[13px]"
                                                        style={{ color: isActive ? "rgba(255,255,255,0.95)" : watched ? "rgba(34,211,165,0.65)" : "rgba(255,255,255,0.5)" }}>
                                                        {ep.name ?? `Tập ${idx + 1}`}
                                                    </span>

                                                    {isActive ? (
                                                        <span className="shrink-0 flex gap-[3px] items-end h-3.5">
                                                            <span className="w-[2.5px] rounded-full animate-[soundbar_0.8s_ease-in-out_infinite]" style={{ height: "40%", background: "#22d3a5" }} />
                                                            <span className="w-[2.5px] rounded-full animate-[soundbar_0.8s_ease-in-out_0.2s_infinite]" style={{ height: "100%", background: "#22d3a5" }} />
                                                            <span className="w-[2.5px] rounded-full animate-[soundbar_0.8s_ease-in-out_0.4s_infinite]" style={{ height: "60%", background: "#22d3a5" }} />
                                                        </span>
                                                    ) : watched ? (
                                                        <span className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black"
                                                            style={{ background: "rgba(34,211,165,0.15)", color: "#22d3a5" }}>✓</span>
                                                    ) : null}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            </aside>
                        )}
                    </div>

                    {/* ── Currently watching label (below the flex row) ── */}
                    {isSeries && (
                        <div className="mt-3 flex items-center justify-between px-1">
                            <div className="flex items-center gap-2.5">
                                <span className="flex gap-[3px] items-end h-4 shrink-0">
                                    <span className="w-[3px] rounded-full animate-[soundbar_0.9s_ease-in-out_infinite]" style={{ height: "40%", background: "#22d3a5" }} />
                                    <span className="w-[3px] rounded-full animate-[soundbar_0.9s_ease-in-out_0.2s_infinite]" style={{ height: "100%", background: "#22d3a5" }} />
                                    <span className="w-[3px] rounded-full animate-[soundbar_0.9s_ease-in-out_0.4s_infinite]" style={{ height: "65%", background: "#22d3a5" }} />
                                </span>
                                <p className="text-sm text-white/50">
                                    Đang xem:&nbsp;
                                    <span className="text-white font-semibold">
                                        {currentEpisode.name ?? `Tập ${epIndex + 1}`}
                                    </span>
                                </p>
                            </div>
                            <span className="text-[11px] text-white/25 hidden sm:block">
                                Kéo thanh tiến trình để tua phim
                            </span>
                        </div>
                    )}

                    {/* ── MOBILE/TABLET episode list ── */}
                    {isSeries && servers.length > 0 && (
                        <div className="mt-4 xl:hidden">
                            <div className="rounded-2xl overflow-hidden"
                                style={{
                                    background: "rgba(12,14,24,0.88)",
                                    backdropFilter: "blur(16px)",
                                    border: "1px solid rgba(255,255,255,0.07)",
                                }}>
                                <div className="flex items-center justify-between px-4 py-3"
                                    style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                                    <h3 className="text-[13px] font-semibold text-white">Danh sách tập</h3>
                                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md"
                                        style={{ background: "rgba(34,211,165,0.12)", color: "#22d3a5" }}>
                                        {currentServerData.length} tập
                                    </span>
                                </div>

                                <div className="px-4 pt-3 pb-4">
                                    {servers.length > 1 && (
                                        <div className="flex gap-2 mb-3 flex-wrap">
                                            {servers.map((sv, idx) => (
                                                <Link key={idx}
                                                    href={`/xem-phim/${movie.slug}?ver=${idx + 1}&ep=${verIndex === idx ? epIndex + 1 : 1}`}
                                                    className="px-2.5 py-1 text-[11px] rounded-lg font-medium transition"
                                                    style={verIndex === idx
                                                        ? { background: "#22d3a5", color: "#04110d" }
                                                        : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.08)" }
                                                    }>
                                                    {sv.server_name ?? `Server ${idx + 1}`}
                                                </Link>
                                            ))}
                                        </div>
                                    )}

                                    {/* Scrollable episode grid — fixed height */}
                                    <div className="relative">
                                        <div
                                            className="overflow-y-auto"
                                            style={{
                                                maxHeight: "216px",
                                                scrollbarWidth: "thin",
                                                scrollbarColor: "rgba(255,255,255,0.1) transparent",
                                            }}
                                        >
                                            <div className="grid grid-cols-5 sm:grid-cols-7 gap-1.5 pb-1">
                                                {currentServerData.map((ep, idx) => {
                                                    const isActive = idx === epIndex;
                                                    const watched  = !isActive && isWatched(ep.slug);
                                                    const label    = ep.name ?? `${idx + 1}`;
                                                    return (
                                                        <Link
                                                            key={ep.slug ?? idx}
                                                            href={`/xem-phim/${movie.slug}?ver=${verIndex + 1}&ep=${idx + 1}`}
                                                            title={label}
                                                            className="relative flex items-center justify-center py-2 text-[11px] rounded-xl font-medium transition text-center overflow-hidden"
                                                            style={isActive
                                                                ? { background: "#22d3a5", color: "#04110d", boxShadow: "0 0 14px rgba(34,211,165,0.35)" }
                                                                : watched
                                                                ? { background: "rgba(34,211,165,0.1)", color: "rgba(34,211,165,0.8)", border: "1px solid rgba(34,211,165,0.25)" }
                                                                : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.08)" }
                                                            }
                                                        >
                                                            <span className="truncate px-1 max-w-full">{label}</span>
                                                            {watched && !isActive && (
                                                                <span className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full flex items-center justify-center text-[7px] font-black leading-none"
                                                                    style={{ background: "#22d3a5", color: "#04110d" }}>✓</span>
                                                            )}
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        {/* Fade at bottom to hint scrollability */}
                                        <div className="absolute bottom-0 inset-x-0 h-8 pointer-events-none rounded-b-xl"
                                            style={{ background: "linear-gradient(to top, rgba(12,14,24,0.9), transparent)" }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── INFO PHIM ── */}
                <section className="max-w-[1400px] mx-auto px-4 mt-8 mb-12 anim-fadeup" style={{ animationDelay: "0.1s" }}>
                    <div className="rounded-2xl px-5 sm:px-7 py-6"
                        style={{
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.07)",
                        }}>
                        <div className="flex gap-5 sm:gap-6 items-start">

                            {/* Poster */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={movie.poster_url}
                                alt={movie.name}
                                className="poster-img shrink-0 w-[80px] sm:w-[100px] rounded-xl object-cover"
                                style={{ aspectRatio: "2/3", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}
                            />

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <h1 className="text-base sm:text-lg md:text-xl font-bold text-white leading-snug">
                                    {movie.name}
                                </h1>
                                {movie.origin_name && (
                                    <p className="text-xs mt-0.5 italic" style={{ color: "rgba(255,255,255,0.35)" }}>
                                        {movie.origin_name}
                                    </p>
                                )}

                                {/* Tags */}
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                    {movie.quality && (
                                        <span className="tag-badge px-2 py-0.5 text-[11px] font-bold rounded"
                                            style={{ background: "rgba(34,211,165,0.12)", color: "#22d3a5" }}>
                                            {movie.quality}
                                        </span>
                                    )}
                                    {movie.year && <span className="tag-badge px-2 py-0.5 text-[11px] rounded" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)" }}>{movie.year}</span>}
                                    {movie.time > 0 && <span className="tag-badge px-2 py-0.5 text-[11px] rounded" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)" }}>{movie.time} phút</span>}
                                    {movie.lang && <span className="tag-badge px-2 py-0.5 text-[11px] rounded" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)" }}>{movie.lang}</span>}
                                    {isSeries && movie.episode_current && (
                                        <span className="tag-badge px-2 py-0.5 text-[11px] rounded" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)" }}>
                                            {movie.episode_current}{movie.episode_total ? ` / ${movie.episode_total}` : ""}
                                        </span>
                                    )}
                                </div>

                                {/* Meta rows */}
                                <div className="mt-3 flex flex-col gap-1.5">
                                    {movie.director?.filter(Boolean).length > 0 && (
                                        <div className="flex gap-2 text-[12px] min-w-0">
                                            <span className="shrink-0 w-[68px] text-right" style={{ color: "rgba(255,255,255,0.28)" }}>Đạo diễn</span>
                                            <span className="truncate" style={{ color: "rgba(255,255,255,0.6)" }}>{movie.director.filter(Boolean).join(", ")}</span>
                                        </div>
                                    )}
                                    {movie.actor?.filter(Boolean).length > 0 && (
                                        <div className="flex gap-2 text-[12px] min-w-0">
                                            <span className="shrink-0 w-[68px] text-right" style={{ color: "rgba(255,255,255,0.28)" }}>Diễn viên</span>
                                            <span className="line-clamp-1" style={{ color: "rgba(255,255,255,0.6)" }}>
                                                {movie.actor.filter(Boolean).slice(0, 6).join(", ")}
                                                {movie.actor.filter(Boolean).length > 6 && "..."}
                                            </span>
                                        </div>
                                    )}
                                    {movie.country?.length > 0 && (
                                        <div className="flex gap-2 text-[12px] min-w-0">
                                            <span className="shrink-0 w-[68px] text-right" style={{ color: "rgba(255,255,255,0.28)" }}>Quốc gia</span>
                                            <span style={{ color: "rgba(255,255,255,0.6)" }}>{movie.country.map((c: { name: string }) => c.name).join(", ")}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Genres */}
                                {movie.category?.length > 0 && (
                                    <div className="flex gap-2 text-[12px] min-w-0 mt-1.5">
                                        <span className="shrink-0 w-[68px] text-right" style={{ color: "rgba(255,255,255,0.28)" }}>Thể loại</span>
                                        <div className="flex flex-wrap gap-1">
                                            {movie.category.map((c: { name: string; slug: string }, i: number) => (
                                                <Link key={i} href={`/loc-phim?category=${c.slug}&page=1`}
                                                    className="genre-link hover:text-white"
                                                    style={{ color: "rgba(34,211,165,0.6)" }}>
                                                    {c.name}{i < movie.category.length - 1 ? "," : ""}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Description */}
                                {movie.content && (
                                    <p className="text-[12px] mt-4 leading-relaxed line-clamp-3"
                                        style={{ color: "rgba(255,255,255,0.38)" }}
                                        dangerouslySetInnerHTML={{ __html: movie.content }} />
                                )}

                                <Link href={`/phim/${movie.slug}`}
                                    className="inline-flex items-center gap-1.5 mt-4 text-[12px] font-medium transition hover:opacity-80"
                                    style={{ color: "rgba(34,211,165,0.65)" }}>
                                    Xem trang chi tiết
                                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <style>{`
                @keyframes soundbar {
                    0%, 100% { transform: scaleY(0.4); }
                    50%      { transform: scaleY(1); }
                }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(14px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                @keyframes pulseGlow {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(34,211,165,0); }
                    50%      { box-shadow: 0 0 0 4px rgba(34,211,165,0.12); }
                }
                .anim-fadeup  { animation: fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both; }
                .anim-fadein  { animation: fadeIn 0.35s ease both; }
                .ep-item { transition: background 0.18s, border-color 0.18s, transform 0.15s; }
                .ep-item:hover { transform: translateX(3px); }
                .ep-item-active { animation: pulseGlow 2.4s ease-in-out infinite; }
                .poster-img { transition: transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s; }
                .poster-img:hover { transform: scale(1.04); box-shadow: 0 16px 40px rgba(0,0,0,0.65); }
                .tag-badge { transition: opacity 0.15s, transform 0.15s; }
                .tag-badge:hover { opacity: 0.85; transform: translateY(-1px); }
                .genre-link { transition: color 0.15s; }
            `}</style>
        </>
    );
}

export default function Page() {
    return <Suspense fallback={null}><XemPhimClient /></Suspense>;
}
