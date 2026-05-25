import { useParams, useNavigate } from "react-router-dom";

import {
    useState,
    useEffect,
    useRef,
    useCallback,
    useMemo,
} from "react";

import type { Movie } from "@/types/movie";
import type { Server } from "@/types/server";
import type { Episode } from "@/types/episode";
// import type { PlaylistMovie } from "@/types/playlist";

import { movieService } from "@/services/movieService";
// import { favoriteService } from "@/services/favoriteService";
import { playlistService } from "@/services/playlistService";
import { watchHistoryService } from "@/services/watchHistoryService";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "sonner";

import Breadcrumb from "@/components/frontend/Breadcrumb";
import CreatePlaylistPopup from "@/components/frontend/CreatePlaylistPopup";
import SEO from "@/components/frontend/SEO";

import MovieTabs from "@/components/frontend/MovieDetail/MovieTabs";
import MovieActionsRow from "@/components/frontend/MovieDetail/MovieActionsRow";
import MovieSidebar from "@/components/frontend/MovieDetail/MovieSidebar";
import MovieHero from "@/components/frontend/MovieDetail/MovieHero";
import { useLocalWatched } from "@/hooks/useLocalWatched";

// ── helper ──
// const safeMovieObject = (m: Movie | null) => {
//     if (!m) return null;
//     return {
//         movieId: m._id,
//         slug: m.slug ?? "",
//         title: m.name || m.title || "",
//         origin_name: m.origin_name || "",
//         poster_url: m.poster_url || m.thumb_url || "",
//     };
// };

// ── Skeleton ──
function DetailSkeleton({ fading }: { fading: boolean }) {
    return (
        <div
            className="w-full absolute inset-0 z-40 pointer-events-none"
            style={{
                opacity: fading ? 0 : 1,
                transition: "opacity 0.7s cubic-bezier(0.22,1,0.36,1)",
            }}
        >
            {/* Shimmer overlay */}
            <div
                className="absolute inset-0 z-10 pointer-events-none"
                style={{
                    background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.025) 50%, transparent 60%)",
                    backgroundSize: "200% 100%",
                    animation: "skeletonShimmer 2.2s ease-in-out infinite",
                }}
            />

            <div className="animate-pulse">
                {/* Hero bar */}
                <div
                    className="w-full h-[340px] sm:h-[520px] xl:h-[620px]"
                    style={{
                        background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 60%, transparent 100%)",
                    }}
                />

                <div className="relative z-30 max-w-[1640px] mx-auto px-3 -mt-2.5 sm:-mt-[220px] lg:-mt-[220px] xl:-mt-[195px]">
                    <div className="grid grid-cols-1 lg:grid-cols-[440px_minmax(0,1fr)] gap-0">
                        {/* Sidebar skeleton */}
                        <div className="hidden lg:flex flex-col items-center pt-4 px-6 gap-4">
                            {/* Poster */}
                            <div
                                className="w-[220px] aspect-[2/3] rounded-2xl shadow-xl"
                                style={{
                                    background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)",
                                    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                                    animation: "skeletonPulse 2s ease-in-out infinite",
                                }}
                            />
                            <div className="w-full space-y-3 px-2 mt-2">
                                {[88, 72, 82, 58, 68, 48].map((w, i) => (
                                    <div
                                        key={i}
                                        className="h-2.5 rounded-full"
                                        style={{
                                            width: `${w}%`,
                                            background: "rgba(255,255,255,0.06)",
                                            animation: `skeletonPulse 2s ease-in-out ${i * 0.12}s infinite`,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Main skeleton */}
                        <div
                            className="rounded-tl-[3rem] rounded-tr-[1.25rem] rounded-br-[1.25rem] rounded-bl-[1.25rem] p-6 sm:p-8"
                            style={{ background: "rgb(25,27,36)" }}
                        >
                            {/* Action row */}
                            <div className="flex gap-3 mb-8">
                                {[130, 95, 95, 75].map((w, i) => (
                                    <div
                                        key={i}
                                        className="h-10 rounded-xl"
                                        style={{
                                            width: `${w}px`,
                                            background: "rgba(255,255,255,0.06)",
                                            animation: `skeletonPulse 2s ease-in-out ${i * 0.1}s infinite`,
                                        }}
                                    />
                                ))}
                            </div>
                            {/* Tabs */}
                            <div
                                className="flex gap-4 mb-6 pb-4"
                                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                            >
                                {[70, 60, 75, 65].map((w, i) => (
                                    <div
                                        key={i}
                                        className="h-3.5 rounded-full"
                                        style={{
                                            width: `${w}px`,
                                            background: "rgba(255,255,255,0.06)",
                                            animation: `skeletonPulse 2s ease-in-out ${i * 0.1}s infinite`,
                                        }}
                                    />
                                ))}
                            </div>
                            {/* Episode grid */}
                            <div className="flex flex-wrap gap-2">
                                {Array.from({ length: 36 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="h-8 rounded-lg"
                                        style={{
                                            width: `${48 + (i % 3) * 6}px`,
                                            background: "rgba(255,255,255,0.05)",
                                            animation: `skeletonPulse 2s ease-in-out ${i * 0.04}s infinite`,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Ambient orb background ──
function AmbientOrbs() {
    return (
        <div
            className="fixed inset-0 pointer-events-none overflow-hidden"
            style={{ zIndex: 0 }}
            aria-hidden
        >
            {/* Soft background tint derived from movie */}
            <div
                style={{
                    position: "absolute",
                    top: "-20%",
                    left: "-10%",
                    width: "55%",
                    height: "60%",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)",
                    filter: "blur(60px)",
                    animation: "orbDrift1 18s ease-in-out infinite",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    bottom: "10%",
                    right: "-15%",
                    width: "50%",
                    height: "50%",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(34,197,94,0.05) 0%, transparent 70%)",
                    filter: "blur(80px)",
                    animation: "orbDrift2 22s ease-in-out infinite",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    top: "40%",
                    left: "40%",
                    width: "30%",
                    height: "30%",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(236,72,153,0.04) 0%, transparent 70%)",
                    filter: "blur(50px)",
                    animation: "orbDrift3 15s ease-in-out infinite",
                }}
            />
        </div>
    );
}

// ── Floating particles ──
const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${5 + (i * 4.8) % 90}%`,
    top: `${10 + (i * 7.3) % 80}%`,
    size: 1.5 + (i % 3) * 0.8,
    dur: `${6 + (i % 5) * 2.5}s`,
    delay: `${(i * 0.7) % 6}s`,
    opacity: 0.12 + (i % 4) * 0.07,
}));

function FloatingParticles() {
    return (
        <div
            className="fixed inset-0 pointer-events-none overflow-hidden"
            style={{ zIndex: 1 }}
            aria-hidden
        >
            {PARTICLES.map((p) => (
                <div
                    key={p.id}
                    style={{
                        position: "absolute",
                        left: p.left,
                        top: p.top,
                        width: p.size,
                        height: p.size,
                        borderRadius: "50%",
                        background: `rgba(255,255,255,${p.opacity})`,
                        boxShadow: `0 0 ${p.size * 3}px rgba(255,255,255,${p.opacity * 0.6})`,
                        animationName: "particleFloat",
                        animationDuration: p.dur,
                        animationDelay: p.delay,
                        animationTimingFunction: "ease-in-out",
                        animationIterationCount: "infinite",
                    }}
                />
            ))}
        </div>
    );
}

export default function PhimDetailClient() {
    const navigate = useNavigate();

    // ── State (giữ nguyên 100%) ──
    const [movie, setMovie] = useState<Movie | null>(null);
    const [server, setServer] = useState<Server[]>([]);
    // const [playlists, setPlaylists] = useState<PlaylistMovie[]>([]);
    const [isPlayerOpen, setIsPlayerOpen] = useState(false);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [isPlaylistPopupOpen, setIsPlaylistPopupOpen] = useState(false);
    const [currentServerIndex] = useState(0);
    const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
    const [tab, setTab] = useState<"tap-phim" | "the-loai" | "dao-dien" | "dien-vien">("tap-phim");
    // const [isFavorite, setIsFavorite] = useState(false);
    const [loadingMovie, setLoadingMovie] = useState(true);
    // const [loadingPlaylists, setLoadingPlaylists] = useState(false);
    const [watchedList, setWatchedList] = useState<{ episodeId: string; watchedTime: number }[]>([]);

    // ── Cross-fade state ──
    const [contentReady, setContentReady] = useState(false);
    const [skeletonVisible, setSkeletonVisible] = useState(true);

    const playlistPopupRef = useRef<HTMLDivElement | null>(null);
    const createPlaylistPopupRef = useRef<HTMLDivElement | null>(null);

    const { slug } = useParams();
    const user = useAuthStore((s) => s.user);
    const { markWatched: markWatchedLocal, isWatched: isWatchedLocal } = useLocalWatched(slug);
    const userId = user?._id ?? "";

    // ── Cross-fade logic ──
    useEffect(() => {
        if (!loadingMovie && movie) {
            const t1 = setTimeout(() => setContentReady(true), 60);
            const t2 = setTimeout(() => setSkeletonVisible(false), 700);
            return () => { clearTimeout(t1); clearTimeout(t2); };
        } else {
            setContentReady(false);
            setSkeletonVisible(true);
        }
    }, [loadingMovie, movie]);

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }, [slug]);

    // const safeMovieData = useMemo(() => safeMovieObject(movie), [movie]);
    const currentServer = useMemo(() => server[currentServerIndex], [server, currentServerIndex]);
    const currentEpisodes: Episode[] = useMemo(() => currentServer?.server_data ?? [], [currentServer]);

    // ── Fetch movie ──
    useEffect(() => {
        if (!slug) return;
        let mounted = true;
        const fetchMovie = async () => {
            setLoadingMovie(true);
            try {
                const res = await movieService.dataDetailMovie(slug);
                if (!mounted) return;
                setMovie(res.movie ?? null);
                setServer(res.episodes ?? []);
            } catch (error) {
                console.error("Lỗi load phim:", error);
                toast.error("Không thể tải thông tin phim!");
            } finally {
                if (mounted) setLoadingMovie(false);
            }
        };
        fetchMovie();
        return () => { mounted = false; };
    }, [slug]);

    useEffect(() => {
        if (!userId || !movie?._id) return;
        const loadWatched = async () => {
            try {
                const res = await watchHistoryService.getWatched(userId, movie._id);
                setWatchedList(res?.data.watchedEpisodes ?? []);
            } catch (err) { console.error("load watched episodes failed", err); }
        };
        void loadWatched();
    }, [userId, movie?._id]);

    // const fetchPlaylists = useCallback(async (userIdParam?: string, movieId?: string) => {
    //     const uid = userIdParam || userId;
    //     if (!uid) return null;
    //     setLoadingPlaylists(true);
    //     try {
    //         const res = await playlistService.getPlaylistsByUser(uid, movieId);
    //         const data = res?.playlists ?? [];
    //         setPlaylists(data);
    //         return data;
    //     } catch (error) {
    //         console.error("fetchPlaylists error", error);
    //         toast.error("Không thể tải playlist, vui lòng thử lại!");
    //         return null;
    //     } finally {
    //         setLoadingPlaylists(false);
    //     }
    // }, [userId]);

    // useEffect(() => {
    //     if (!userId) return;
    //     void fetchPlaylists(userId, movie?._id);
    // }, [userId, movie?._id, fetchPlaylists]);

    useEffect(() => {
        if (!isPlaylistPopupOpen && !isPopupOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            if (isPlaylistPopupOpen && playlistPopupRef.current && !playlistPopupRef.current.contains(target))
                setIsPlaylistPopupOpen(false);
            if (isPopupOpen && createPlaylistPopupRef.current && !createPlaylistPopupRef.current.contains(target))
                setIsPopupOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isPlaylistPopupOpen, isPopupOpen]);

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }, [currentEpisode]);

    // ── Handlers (giữ nguyên 100%) ──
    const handlePlay = useCallback((ep: Episode, epIndex: number, serverIndex: number) => {
        if (!movie) return;
        navigate(`/xem-phim/${movie.slug}?ver=${serverIndex + 1}&ep=${epIndex + 1}`);
        setCurrentEpisode(ep);
        setIsPlayerOpen(true);
        markWatchedLocal(ep.slug);
        if (userId && movie._id) {
            watchHistoryService.markWatched(userId, movie._id, ep.slug, {
                movieId: movie._id,
                slug: movie.slug,
                title: movie.name || movie.title || "",
                origin_name: movie.origin_name || "",
                poster_url: movie.poster_url || movie.thumb_url || "",
            });
        }
    }, [navigate, movie, userId, markWatchedLocal]);

    const closePlayer = useCallback(() => {
        setIsPlayerOpen(false);
        setCurrentEpisode(null);
    }, []);

    // const toggleFavorite = useCallback(async () => {
    //     if (!userId) return toast.error("Vui lòng đăng nhập để yêu thích");
    //     if (!movie?._id) return toast.error("Oops! Phim không tồn tại hoặc đã bị xóa");
    //     const previous = isFavorite;
    //     setIsFavorite(!previous);
    //     const movieData = safeMovieData;
    //     if (!movieData) { setIsFavorite(previous); return toast.error("Không thể lấy dữ liệu phim"); }
    //     try {
    //         const res = await favoriteService.toggleFavorite(userId, movieData);
    //         if (res?.success === false) { setIsFavorite(previous); return toast.error(res.message || "Không thể cập nhật yêu thích"); }
    //         setIsFavorite(Boolean(res?.liked));
    //         if (res?.liked) toast.success("Đã thêm vào yêu thích");
    //         else toast.success("Đã xoá khỏi yêu thích");
    //     } catch (error) {
    //         console.error("toggleFavorite error", error);
    //         setIsFavorite(previous);
    //         toast.error("Có lỗi xảy ra!");
    //     }
    // }, [userId, movie?._id, safeMovieData, isFavorite]);

    const handleCreatePlaylist = useCallback(async (name: string) => {
        if (!userId) return toast.error("Vui lòng đăng nhập để tạo danh sách phát");
        if (!name.trim()) return toast.error("Tên playlist không hợp lệ");
        try {
            const res = await playlistService.createPlaylist(userId, name);
            if (res?.created === true) {
                toast.success("Tạo playlist thành công!");
                setIsPopupOpen(false);
            } else {
                toast.error(res?.message || "Không thể tạo playlist");
            }
        } catch (error) {
            console.error("createPlaylist error", error);
            toast.error("Có lỗi xảy ra, vui lòng thử lại");
        }
    }, [userId, movie?._id]);

    // const handleToggleMovieInPlaylist = useCallback(async (playlistId: string) => {
    //     if (!userId) return toast.error("Vui lòng đăng nhập để thêm vào playlist");
    //     if (!movie?._id) return toast.error("Phim không tồn tại");
    //     const movieData = safeMovieData;
    //     if (!movieData) return toast.error("Không thể lấy dữ liệu phim");
    //     setPlaylists((prev) => prev.map((p) => p._id === playlistId ? { ...p, added: !p.added } : p));
    //     try {
    //         const res = await playlistService.toggleMovieInPlaylist(playlistId, movieData);
    //         if (res?.inPlaylist === undefined) {
    //             await fetchPlaylists(userId, movie?._id);
    //             return toast.error(res?.message || "Không thể cập nhật playlist");
    //         }
    //         setPlaylists((prev) => prev.map((p) => p._id === playlistId
    //             ? { ...p, movies: res.playlist?.movies ?? p.movies, added: Boolean(res.inPlaylist) }
    //             : p
    //         ));
    //         if (res.inPlaylist) toast.success(`Đã thêm phim vào playlist "${res.playlist?.name || ""}"`);
    //         else {
    //             if (res?.message) toast.error(res.message);
    //             else toast.success(`Đã xóa phim khỏi playlist "${res.playlist?.name || ""}"`);
    //         }
    //     } catch (error) {
    //         console.error("toggleMovieInPlaylist error", error);
    //         await fetchPlaylists(userId, movie?._id);
    //         toast.error("Có lỗi xảy ra, vui lòng thử lại");
    //     }
    // }, [userId, movie?._id, safeMovieData, fetchPlaylists]);

    const isEpisodeWatched = useCallback(
        (ep: Episode) =>
            isWatchedLocal(ep.slug) || watchedList.some((w) => w.episodeId === ep.slug),
        [watchedList, isWatchedLocal]
    );

    // ── Empty state ──
    if (!loadingMovie && !movie && server.length === 0) {
        return (
            <div
                className="flex flex-col items-center justify-center w-full min-h-[70vh] text-white gap-6"
                style={{ animation: "contentIn 0.6s cubic-bezier(0.22,1,0.36,1) both" }}
            >
                {/* Glow ring */}
                <div className="relative">
                    <div
                        className="absolute inset-0 rounded-3xl scale-150"
                        style={{
                            background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)",
                            filter: "blur(24px)",
                            animation: "emptyGlow 3s ease-in-out infinite",
                        }}
                    />
                    <div
                        className="relative w-24 h-24 rounded-3xl flex items-center justify-center text-4xl shadow-2xl"
                        style={{
                            background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(34,197,94,0.08))",
                            border: "1px solid rgba(255,255,255,0.1)",
                            backdropFilter: "blur(12px)",
                        }}
                    >
                        🎬
                    </div>
                </div>

                <div className="text-center" style={{ animation: "contentIn 0.6s 0.15s ease both" }}>
                    <p className="font-bold text-lg tracking-tight">Không tìm thấy phim</p>
                    <p className="text-gray-500 text-sm mt-1.5">Phim có thể đã bị xóa hoặc không tồn tại</p>
                </div>

                <button
                    onClick={() => navigate(-1)}
                    className="group flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-medium"
                    style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        backdropFilter: "blur(12px)",
                        transition: "all 0.25s ease",
                        animation: "contentIn 0.6s 0.25s ease both",
                    }}
                    onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)";
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.2)";
                        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
                        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    }}
                >
                    <svg
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        className="w-4 h-4"
                        style={{ transition: "transform 0.25s ease" }}
                        onMouseEnter={e => (e.currentTarget as SVGElement).style.transform = "translateX(-3px)"}
                        onMouseLeave={e => (e.currentTarget as SVGElement).style.transform = "translateX(0)"}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Quay lại
                </button>
            </div>
        );
    }

    // ══════════════════════════════════════════════════════════
    //  RENDER CHÍNH
    // ══════════════════════════════════════════════════════════
    return (
        <>
            {movie && (
                <SEO
                    title={`${movie.name} (${movie.year}) - Xem ${movie.name} Vietsub HD Online | MoxiMovie`}
                    description={`Xem phim ${movie.name} (${movie.year}) Vietsub HD 1080p tại MoxiMovie. Thể loại: ${movie.category?.join(", ")}, Đạo diễn: ${movie.director || "Chưa có"}, Diễn viên: ${movie.actor?.slice(0, 5).join(", ")}. Trải nghiệm xem phim mượt mà, cập nhật nhanh, không quảng cáo độc hại.`}
                    canonical={`https://www.moximovie.click/phim/${movie.slug}`}
                    image={movie.thumb_url || "https://www.moximovie.click/default-og.jpg"}
                    type="movie"
                    name={movie.name}
                />
            )}

            {/* ── Ambient background effects ── */}
            <AmbientOrbs />
            <FloatingParticles />

            {/* ── SKELETON overlay ── */}
            {skeletonVisible && <DetailSkeleton fading={contentReady} />}

            {/* ── CONTENT ── */}
            <div
                style={{
                    opacity: contentReady ? 1 : 0,
                    transform: contentReady ? "translateY(0)" : "translateY(10px)",
                    transition: "opacity 0.65s cubic-bezier(0.22,1,0.36,1), transform 0.65s cubic-bezier(0.22,1,0.36,1)",
                    transitionDelay: "0.08s",
                    visibility: contentReady ? "visible" : "hidden",
                    position: "relative",
                    zIndex: 10,
                }}
            >
                {/* Mobile breadcrumb */}
                <div
                    className="flex sm:hidden lg:hidden xl:hidden"
                    style={{ animation: contentReady ? "contentIn 0.5s ease both" : "none" }}
                >
                    <Breadcrumb />
                </div>

                {/* Mobile episode indicator */}
                {currentEpisode && (
                    <div className="flex sm:hidden lg:hidden xl:hidden">
                        <nav
                            className="relative w-full mx-auto z-30 flex items-center px-3 pb-5 text-sm"
                            aria-label="Breadcrumb"
                        >
                            <span
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
                                style={{
                                    background: "rgba(34,197,94,0.1)",
                                    border: "1px solid rgba(34,197,94,0.25)",
                                    animation: "episodeBadgeIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
                                }}
                            >
                                <span
                                    className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0"
                                    style={{ animation: "dotPulse 1.8s ease-in-out infinite" }}
                                />
                                <span className="text-white font-semibold text-xs">{currentEpisode.name}</span>
                            </span>
                        </nav>
                    </div>
                )}

                {/* ── Hero ── */}
                <div
                    style={{
                        animation: contentReady ? "heroReveal 0.8s cubic-bezier(0.22,1,0.36,1) both" : "none",
                        position: "relative",
                    }}
                >
                    {/* Top edge highlight line */}
                    <div
                        aria-hidden
                        style={{
                            position: "absolute",
                            top: 0, left: 0, right: 0,
                            height: "1px",
                            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 30%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.12) 70%, transparent 100%)",
                            zIndex: 20,
                            animation: contentReady ? "lineReveal 1s ease 0.3s both" : "none",
                        }}
                    />
                    <MovieHero
                        movieName={movie?.name}
                        thumbUrl={movie?.thumb_url}
                        isPlayerOpen={isPlayerOpen}
                        onClosePlayer={closePlayer}
                    />
                </div>

                {/* ── Layout dưới hero ── */}
                <div
                    className="relative z-30 max-w-[1640px] mx-auto px-3 -mt-2.5 sm:-mt-[220px] lg:-mt-[220px] xl:-mt-[195px]"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-[440px_minmax(0,1fr)]">

                        {/* ── Sidebar ── */}
                        {movie && (
                            <div
                                style={{
                                    animation: contentReady ? "slideInLeft 0.7s cubic-bezier(0.22,1,0.36,1) 0.18s both" : "none",
                                    position: "relative",
                                }}
                            >
                                {/* Sidebar glow */}
                                <div
                                    aria-hidden
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        background: "radial-gradient(ellipse 70% 50% at 50% 30%, rgba(99,102,241,0.06), transparent)",
                                        pointerEvents: "none",
                                        zIndex: 0,
                                        animation: contentReady ? "glowBreath 5s ease-in-out infinite" : "none",
                                    }}
                                />
                                <MovieSidebar movie={movie} />
                            </div>
                        )}

                        {/* ── Main content panel ── */}
                        <section
                            className="rounded-tl-[3rem] rounded-tr-[1.25rem] rounded-br-[1.25rem] rounded-bl-[1.25rem] p-3 sm:p-8 lg:p-8 xl:p-8 relative overflow-hidden"
                            style={{
                                background: "rgb(25,27,36)",
                                animation: contentReady ? "panelReveal 0.7s cubic-bezier(0.22,1,0.36,1) 0.25s both" : "none",
                            }}
                        >
                            {/* ── Decorative corner accent (top-left rounded) ── */}
                            <div
                                aria-hidden
                                style={{
                                    position: "absolute",
                                    top: 0, left: 0,
                                    width: "180px", height: "180px",
                                    borderRadius: "3rem 0 0 0",
                                    background: "radial-gradient(circle at 0% 0%, rgba(99,102,241,0.08) 0%, transparent 70%)",
                                    pointerEvents: "none",
                                    animation: contentReady ? "glowBreath 6s ease-in-out infinite" : "none",
                                }}
                            />

                            {/* ── Top edge shimmer line ── */}
                            <div
                                aria-hidden
                                style={{
                                    position: "absolute",
                                    top: 0, left: "8%", right: "8%",
                                    height: "1px",
                                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1) 30%, rgba(255,255,255,0.16) 50%, rgba(255,255,255,0.1) 70%, transparent)",
                                    pointerEvents: "none",
                                    animation: contentReady ? "lineReveal 1s ease 0.5s both" : "none",
                                }}
                            />

                            {/* ── Subtle inner noise texture ── */}
                            <div
                                aria-hidden
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.018'/%3E%3C/svg%3E")`,
                                    backgroundSize: "200px 200px",
                                    mixBlendMode: "overlay",
                                    pointerEvents: "none",
                                    borderRadius: "inherit",
                                }}
                            />

                            {/* ── Action row ── */}
                            <div
                                ref={playlistPopupRef}
                                style={{
                                    animation: contentReady ? "contentIn 0.55s cubic-bezier(0.22,1,0.36,1) 0.35s both" : "none",
                                    position: "relative", zIndex: 10,
                                }}
                            >
                                <MovieActionsRow
                                    firstEpisode={currentEpisodes[0]}
                                    onPlayFirstEpisode={() =>
                                        currentEpisodes[0] && handlePlay(currentEpisodes[0], 0, currentServerIndex)
                                    }
                                    // onToggleFavorite={toggleFavorite}
                                    // onTogglePlaylistPopup={() => {
                                    //     setIsPlaylistPopupOpen((prev) => !prev);
                                    //     if (!isPlaylistPopupOpen && movie?._id) {
                                    //         void fetchPlaylists(userId, movie._id);
                                    //     }
                                    // }}
                                    // onCreatePlaylistClick={() => {
                                    //     setIsPopupOpen(true);
                                    //     setIsPlaylistPopupOpen(false);
                                    // }}
                                    // onToggleMovieInPlaylist={handleToggleMovieInPlaylist}
                                    // isFavorite={isFavorite}
                                    // isPlaylistPopupOpen={isPlaylistPopupOpen}
                                    // loadingPlaylists={loadingPlaylists}
                                    // playlists={playlists}
                                />
                            </div>

                            {/* ── Tabs divider ── */}
                            <div
                                aria-hidden
                                style={{
                                    height: "1px",
                                    margin: "0 -1px",
                                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07) 20%, rgba(255,255,255,0.07) 80%, transparent)",
                                    animation: contentReady ? "lineReveal 0.6s ease 0.55s both" : "none",
                                }}
                            />

                            {/* ── Tabs ── */}
                            {movie && (
                                <div
                                    style={{
                                        animation: contentReady ? "contentIn 0.55s cubic-bezier(0.22,1,0.36,1) 0.45s both" : "none",
                                        position: "relative", zIndex: 10,
                                    }}
                                >
                                    <MovieTabs
                                        tab={tab}
                                        onChangeTab={setTab}
                                        movie={movie}
                                        servers={server}
                                        currentEpisode={currentEpisode}
                                        onPlayEpisode={handlePlay}
                                        isEpisodeWatched={isEpisodeWatched}
                                    />
                                </div>
                            )}

                            {/* ── Bottom edge glow ── */}
                            <div
                                aria-hidden
                                style={{
                                    position: "absolute",
                                    bottom: 0, left: "20%", right: "20%",
                                    height: "1px",
                                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05) 40%, rgba(255,255,255,0.05) 60%, transparent)",
                                    pointerEvents: "none",
                                }}
                            />
                        </section>
                    </div>
                </div>
            </div>

            {/* ── Playlist popup ── */}
            <div ref={createPlaylistPopupRef}>
                <CreatePlaylistPopup
                    isOpen={isPopupOpen}
                    onClose={() => setIsPopupOpen(false)}
                    onCreate={handleCreatePlaylist}
                />
            </div>

            {/* ══════════════════════════════════════════
                ALL KEYFRAMES
            ══════════════════════════════════════════ */}
            <style>{`
                /* ── Page enter ── */
                @keyframes contentIn {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideInLeft {
                    from { opacity: 0; transform: translateX(-20px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                @keyframes heroReveal {
                    from { opacity: 0; transform: scale(1.012) translateY(-6px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes panelReveal {
                    from { opacity: 0; transform: translateY(20px) scale(0.995); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes lineReveal {
                    from { opacity: 0; transform: scaleX(0.4); }
                    to   { opacity: 1; transform: scaleX(1); }
                }
                @keyframes episodeBadgeIn {
                    from { opacity: 0; transform: translateX(-10px) scale(0.9); }
                    to   { opacity: 1; transform: translateX(0) scale(1); }
                }

                /* ── Ambient orbs ── */
                @keyframes orbDrift1 {
                    0%,100% { transform: translate(0,0) scale(1); }
                    33%     { transform: translate(3%,4%) scale(1.06); }
                    66%     { transform: translate(-2%,2%) scale(0.96); }
                }
                @keyframes orbDrift2 {
                    0%,100% { transform: translate(0,0) scale(1); }
                    40%     { transform: translate(-4%,-3%) scale(1.08); }
                    70%     { transform: translate(2%,2%) scale(0.94); }
                }
                @keyframes orbDrift3 {
                    0%,100% { transform: translate(0,0) scale(1); }
                    50%     { transform: translate(5%,-5%) scale(1.1); }
                }

                /* ── Particles ── */
                @keyframes particleFloat {
                    0%,100% { transform: translateY(0) translateX(0); opacity: var(--pop, 0.15); }
                    33%     { transform: translateY(-12px) translateX(5px); opacity: calc(var(--pop,0.15) * 1.6); }
                    66%     { transform: translateY(-6px) translateX(-4px); opacity: calc(var(--pop,0.15) * 0.7); }
                }

                /* ── Skeleton ── */
                @keyframes skeletonShimmer {
                    0%   { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
                @keyframes skeletonPulse {
                    0%,100% { opacity: 0.6; }
                    50%     { opacity: 1; }
                }

                /* ── Misc ── */
                @keyframes dotPulse {
                    0%,100% { opacity: 1; transform: scale(1); }
                    50%     { opacity: 0.5; transform: scale(0.7); }
                }
                @keyframes glowBreath {
                    0%,100% { opacity: 0.7; }
                    50%     { opacity: 1; }
                }
                @keyframes emptyGlow {
                    0%,100% { opacity: 0.6; transform: scale(1.5); }
                    50%     { opacity: 1; transform: scale(1.65); }
                }
            `}</style>
        </>
    );
}