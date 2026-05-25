import { movieService } from "@/services/movieService";
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */
interface Genre { id: number; name: string; }
interface CastMember { id: number; name: string; character: string; profile_path: string | null; }
interface Video { id: string; key: string; name: string; type: string; site: string; }

interface MovieDetail {
    id: number;
    title: string;
    original_title: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date: string;
    vote_average: number;
    vote_count: number;
    runtime: number | null;
    genres: Genre[];
    status: string;
    tagline: string;
    budget: number;
    revenue: number;
    spoken_languages: { english_name: string }[];
    production_countries: { name: string }[];
}

/* ══════════════════════════════════════════════════════════
   STYLES  — yellow → green
══════════════════════════════════════════════════════════ */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700;800&display=swap');

.cmd-root * { box-sizing: border-box; }

@keyframes cmdPageIn {
    from { opacity:0; transform:translateY(20px) scale(0.99); }
    to   { opacity:1; transform:none; }
}
@keyframes cmdFadeUp {
    from { opacity:0; transform:translateY(16px); }
    to   { opacity:1; transform:translateY(0); }
}
@keyframes cmdSlideLeft {
    from { opacity:0; transform:translateX(-20px); }
    to   { opacity:1; transform:translateX(0); }
}
@keyframes cmdSlideRight {
    from { opacity:0; transform:translateX(20px); }
    to   { opacity:1; transform:translateX(0); }
}

@keyframes cmdShimmer {
    0%   { background-position: -600px 0; }
    100% { background-position:  600px 0; }
}
.cmd-skeleton {
    background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
    background-size: 600px 100%;
    animation: cmdShimmer 1.6s ease-in-out infinite;
    border-radius: 12px;
}

@keyframes cmdKenBurns {
    from { transform: scale(1) translate(0,0); }
    to   { transform: scale(1.06) translate(-1%,-0.5%); }
}
.cmd-backdrop-img {
    animation: cmdKenBurns 18s linear forwards;
}

/* countdown pulse — green */
@keyframes cmdCountPulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.35); }
    50%     { box-shadow: 0 0 0 8px rgba(34,197,94,0); }
}
.cmd-count-pulse { animation: cmdCountPulse 2.5s ease-in-out infinite; }

@keyframes cmdRingDraw {
    from { stroke-dashoffset: 283; }
}
.cmd-ring { animation: cmdRingDraw 1.2s 0.5s cubic-bezier(0.16,1,0.3,1) both; }

.cmd-cast-card {
    transition: all 0.28s cubic-bezier(0.16,1,0.3,1);
}
.cmd-cast-card:hover {
    transform: translateY(-5px) scale(1.04);
    box-shadow: 0 12px 32px rgba(0,0,0,0.6);
}

/* genre badge — green tint */
.cmd-genre {
    transition: all 0.2s ease;
    cursor: default;
}
.cmd-genre:hover {
    transform: translateY(-2px) scale(1.05);
    background: rgba(34,197,94,0.18) !important;
    border-color: rgba(34,197,94,0.5) !important;
}

.cmd-stat {
    transition: all 0.22s cubic-bezier(0.16,1,0.3,1);
}
.cmd-stat:hover {
    transform: translateY(-3px);
    background: rgba(255,255,255,0.07) !important;
    border-color: rgba(255,255,255,0.18) !important;
}

/* trailer button — green */
.cmd-trailer-btn {
    transition: all 0.22s cubic-bezier(0.16,1,0.3,1);
    position: relative; overflow: hidden;
}
.cmd-trailer-btn::before {
    content:''; position:absolute; inset:0; border-radius:inherit;
    background: linear-gradient(135deg, rgba(255,255,255,0.12), transparent);
    opacity:0; transition: opacity 0.2s;
}
.cmd-trailer-btn:hover::before { opacity:1; }
.cmd-trailer-btn:hover { transform: translateY(-2px) scale(1.02); }
.cmd-trailer-btn:active { transform: scale(0.97); }

.cmd-back-btn {
    transition: all 0.2s ease;
}
.cmd-back-btn:hover { transform: translateX(-3px); color: #4ade80 !important; }

.cmd-scroll::-webkit-scrollbar { height: 4px; width: 4px; }
.cmd-scroll::-webkit-scrollbar-track { background: transparent; }
.cmd-scroll::-webkit-scrollbar-thumb { background: rgba(34,197,94,0.25); border-radius: 4px; }

.cmd-noise {
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.88' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
    background-size: 128px 128px;
}

@keyframes cmdModalIn {
    from { opacity:0; transform:scale(0.95); }
    to   { opacity:1; transform:scale(1); }
}
.cmd-modal { animation: cmdModalIn 0.3s cubic-bezier(0.16,1,0.3,1) both; }
`;

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
const IMG_BASE = "https://image.tmdb.org/t/p";

function formatDate(s?: string) {
    if (!s) return "Chưa xác định";
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function daysUntil(s?: string): number | null {
    if (!s) return null;
    return Math.ceil((new Date(s).getTime() - Date.now()) / 86400000);
}

function formatMoney(n: number) {
    if (!n) return "Chưa tiết lộ";
    if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
    return `$${n.toLocaleString()}`;
}

function formatRuntime(min: number | null) {
    if (!min) return null;
    return `${Math.floor(min / 60)}h ${min % 60}p`;
}

/* ══════════════════════════════════════════════════════════
   RATING RING — green accent
══════════════════════════════════════════════════════════ */
function RatingRing({ score }: { score: number }) {
    const r = 45;
    const circ = 2 * Math.PI * r;
    const dash = circ * (score / 10);
    const color = score >= 7 ? "#22c55e" : score >= 5 ? "#4ade80" : "#86efac";

    return (
        <div className="relative flex items-center justify-center" style={{ width: 100, height: 100 }}>
            <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(34,197,94,0.12)" strokeWidth="8" />
                <circle
                    cx="50" cy="50" r={r} fill="none"
                    stroke={color} strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${circ}`}
                    strokeDashoffset="0"
                    className="cmd-ring"
                    style={{ strokeDashoffset: circ, transition: "stroke-dashoffset 0s" } as React.CSSProperties}
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: "1.6rem", color, lineHeight: 1 }}>
                    {score.toFixed(1)}
                </span>
                <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: "0.55rem", color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    TMDB
                </span>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   COUNTDOWN — green numbers
══════════════════════════════════════════════════════════ */
function CountdownCard({ releaseDate }: { releaseDate: string }) {
    const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 });
    const isPast = new Date(releaseDate).getTime() <= Date.now();

    useEffect(() => {
        if (isPast) return;
        const tick = () => {
            const diff = new Date(releaseDate).getTime() - Date.now();
            if (diff <= 0) return;
            setTime({
                d: Math.floor(diff / 86400000),
                h: Math.floor((diff % 86400000) / 3600000),
                m: Math.floor((diff % 3600000) / 60000),
                s: Math.floor((diff % 60000) / 1000),
            });
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [releaseDate, isPast]);

    if (isPast) return (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
            style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)" }}>
            <span style={{ fontSize: "1.1rem" }}>🎬</span>
            <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: "0.85rem", fontWeight: 700, color: "#22c55e" }}>
                Đang chiếu / Đã ra mắt
            </span>
        </div>
    );

    return (
        <div>
            <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
                Đếm ngược ra mắt
            </p>
            <div className="flex gap-2">
                {[["d", "Ngày"], ["h", "Giờ"], ["m", "Phút"], ["s", "Giây"]].map(([key, label]) => (
                    <div key={key} className="cmd-count-pulse flex flex-col items-center px-3 py-2.5 rounded-xl"
                        style={{ background: "rgba(34,197,94,0.07)", border: "1.5px solid rgba(34,197,94,0.3)", minWidth: 56 }}>
                        <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: "1.8rem", color: "#4ade80", lineHeight: 1 }}>
                            {String(time[key as keyof typeof time]).padStart(2, "0")}
                        </span>
                        <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: "0.55rem", color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>
                            {label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   TRAILER MODAL
══════════════════════════════════════════════════════════ */
function TrailerModal({ videoKey, onClose }: { videoKey: string; onClose: () => void }) {
    useEffect(() => {
        const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", fn);
        return () => document.removeEventListener("keydown", fn);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(12px)" }}
            onClick={onClose}
        >
            <div className="cmd-modal w-full max-w-4xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-end mb-3">
                    <button onClick={onClose}
                        className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                        style={{ fontFamily: "'Outfit',sans-serif", fontSize: "0.82rem" }}>
                        <span>Đóng</span>
                        <span className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>✕</span>
                    </button>
                </div>
                <div style={{ aspectRatio: "16/9", borderRadius: 16, overflow: "hidden" }}>
                    <iframe
                        src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0`}
                        allow="autoplay; fullscreen"
                        className="w-full h-full"
                        style={{ border: "none" }}
                    />
                </div>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function CommingMovieDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [movie,    setMovie]    = useState<MovieDetail | null>(null);
    const [cast,     setCast]     = useState<CastMember[]>([]);
    const [videos,   setVideos]   = useState<Video[]>([]);
    const [loading,  setLoading]  = useState(true);
    const [trailer,  setTrailer]  = useState<string | null>(null);
    const [imgReady, setImgReady] = useState(false);

    const styleRef = useRef(false);

    useEffect(() => {
        if (!styleRef.current) {
            const s = document.createElement("style");
            s.textContent = STYLES;
            document.head.appendChild(s);
            styleRef.current = true;
        }
    }, []);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        setImgReady(false);
        window.scrollTo({ top: 0, behavior: "smooth" });

        movieService.dataCommingMovieDetail(Number(id))
            .then(({ detail, credits, videos }) => {
                setMovie(detail);
                setCast((credits.cast ?? []).slice(0, 12));

                const trailers = (videos.results ?? [])
                    .filter((v: Video) => v.type === "Trailer" && v.site === "YouTube");

                if (!trailers.length) {
                    const key = import.meta.env.VITE_TMDB_API_KEY ?? "";
                    fetch(`https://api.themoviedb.org/3/movie/${id}/videos?api_key=${key}&language=en-US`)
                        .then(r => r.json())
                        .then(en => setVideos(
                            (en.results ?? []).filter((v: Video) => v.type === "Trailer" && v.site === "YouTube")
                        ));
                } else {
                    setVideos(trailers);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    /* ── Skeleton ── */
    if (loading) return (
        <div className="cmd-root w-full min-h-screen" style={{ background: "#080a12" }}>
            <div className="w-full h-[50vh] cmd-skeleton" style={{ borderRadius: 0 }} />
            <div className="max-w-6xl mx-auto px-4 -mt-32 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
                    <div className="cmd-skeleton hidden lg:block" style={{ aspectRatio: "2/3", borderRadius: 16 }} />
                    <div className="space-y-4 pt-40 lg:pt-0">
                        {[70, 50, 85, 40, 60].map((w, i) => (
                            <div key={i} className="cmd-skeleton h-4 rounded-full" style={{ width: `${w}%`, animationDelay: `${i * 80}ms` }} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    if (!movie) return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4" style={{ background: "#080a12" }}>
            <div style={{ fontSize: "3rem" }}>🎬</div>
            <p style={{ fontFamily: "'Outfit',sans-serif", color: "rgba(255,255,255,0.5)" }}>Không tìm thấy thông tin phim</p>
            <button onClick={() => navigate(-1)} className="cmd-back-btn"
                style={{ fontFamily: "'Outfit',sans-serif", color: "#4ade80", fontSize: "0.85rem" }}>
                ← Quay lại
            </button>
        </div>
    );

    const backdropUrl  = movie.backdrop_path ? `${IMG_BASE}/original${movie.backdrop_path}` : null;
    const posterUrl    = movie.poster_path   ? `${IMG_BASE}/w500${movie.poster_path}`        : null;
    const days         = daysUntil(movie.release_date);
    const mainTrailer  = videos[0];

    return (
        <div className="cmd-root w-full min-h-screen" style={{ background: "#080a12", fontFamily: "'Outfit',sans-serif" }}>

            {/* ── Backdrop hero ── */}
            <div className="relative w-full overflow-hidden" style={{ height: "clamp(300px,55vw,620px)" }}>
                {backdropUrl && (
                    <img
                        src={backdropUrl} alt=""
                        className="cmd-backdrop-img absolute inset-0 w-full h-full object-cover object-center"
                        onLoad={() => setImgReady(true)}
                        style={{ opacity: imgReady ? 1 : 0, transition: "opacity 0.8s ease" }}
                    />
                )}
                {/* Overlays */}
                <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(8,10,18,0.4) 0%, rgba(8,10,18,0.2) 40%, rgba(8,10,18,0.85) 75%, rgba(8,10,18,1) 100%)" }} />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(8,10,18,0.7) 0%, transparent 50%)" }} />
                {/* subtle green ambient on left */}
                <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 10% 80%, rgba(34,197,94,0.06) 0%, transparent 55%)" }} />
                <div className="cmd-noise absolute inset-0 opacity-[0.03] pointer-events-none" />

                {/* Back button */}
                <div className="absolute top-4 left-4 z-20" style={{ animation: "cmdFadeUp 0.4s ease both" }}>
                    <button onClick={() => navigate(-1)}
                        className="cmd-back-btn flex items-center gap-2 px-4 py-2 rounded-xl"
                        style={{ background: "rgba(8,10,18,0.7)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", fontSize: "0.82rem", fontWeight: 500 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        Quay lại
                    </button>
                </div>

                {/* Status badge — all green */}
                <div className="absolute top-4 right-4 z-20" style={{ animation: "cmdFadeUp 0.4s 0.1s ease both" }}>
                    {days !== null && days > 0 ? (
                        <span className="px-3 py-1.5 rounded-full text-xs font-bold"
                            style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.4)", color: "#4ade80", letterSpacing: "0.08em" }}>
                            🎬 {days} ngày nữa
                        </span>
                    ) : (
                        <span className="px-3 py-1.5 rounded-full text-xs font-bold"
                            style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)", color: "#22c55e", letterSpacing: "0.08em" }}>
                            ✅ Đang chiếu
                        </span>
                    )}
                </div>
            </div>

            {/* ── Main content ── */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6" style={{ marginTop: "clamp(-120px,-18vw,-160px)", position: "relative", zIndex: 10 }}>
                <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8 xl:gap-12">

                    {/* ── POSTER ── */}
                    <div style={{ animation: "cmdSlideLeft 0.65s 0.1s cubic-bezier(0.16,1,0.3,1) both" }}>
                        <div className="rounded-2xl overflow-hidden shadow-2xl"
                            style={{ aspectRatio: "2/3", background: "#14172a", border: "1px solid rgba(34,197,94,0.12)" }}>
                            {posterUrl ? (
                                <img src={posterUrl} alt={movie.title} className="w-full h-full object-cover" loading="eager" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-5xl">🎬</div>
                            )}
                        </div>
                    </div>

                    {/* ── INFO ── */}
                    <div className="space-y-6 pt-4 lg:pt-16" style={{ animation: "cmdSlideRight 0.65s 0.15s cubic-bezier(0.16,1,0.3,1) both" }}>

                        {/* Title */}
                        <div>
                            {movie.tagline && (
                                <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: "0.78rem", fontWeight: 500, color: "#4ade80", fontStyle: "italic", marginBottom: 8, opacity: 0.85 }}>
                                    "{movie.tagline}"
                                </p>
                            )}
                            <h1 style={{ fontFamily: "'Bebas Neue',cursive", fontSize: "clamp(2rem,5vw,3.5rem)", color: "#fff", letterSpacing: "0.04em", lineHeight: 1.05 }}>
                                {movie.title}
                            </h1>
                            {movie.original_title !== movie.title && (
                                <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: "0.9rem", color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
                                    {movie.original_title}
                                </p>
                            )}
                        </div>

                        {/* Genres — green tint */}
                        <div className="flex flex-wrap gap-2">
                            {movie.genres.map(g => (
                                <span key={g.id} className="cmd-genre px-3 py-1 rounded-full text-xs font-600"
                                    style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", color: "#86efac", fontWeight: 600 }}>
                                    {g.name}
                                </span>
                            ))}
                        </div>

                        {/* Rating + meta */}
                        <div className="flex flex-wrap items-center gap-6">
                            <RatingRing score={movie.vote_average} />
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span style={{ fontSize: "1rem" }}>📅</span>
                                    <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>
                                        <strong style={{ color: "#fff" }}>Ngày chiếu:</strong> {formatDate(movie.release_date)}
                                    </span>
                                </div>
                                {movie.runtime && (
                                    <div className="flex items-center gap-2">
                                        <span style={{ fontSize: "1rem" }}>⏱️</span>
                                        <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>
                                            <strong style={{ color: "#fff" }}>Thời lượng:</strong> {formatRuntime(movie.runtime)}
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <span style={{ fontSize: "1rem" }}>⭐</span>
                                    <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>
                                        <strong style={{ color: "#fff" }}>{movie.vote_count.toLocaleString()}</strong> lượt đánh giá
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Countdown */}
                        <CountdownCard releaseDate={movie.release_date} />

                        {/* Trailer button — green gradient */}
                        {mainTrailer && (
                            <button
                                onClick={() => setTrailer(mainTrailer.key)}
                                className="cmd-trailer-btn flex items-center gap-3 px-6 py-3 rounded-xl"
                                style={{
                                    background: "linear-gradient(135deg, #22c55e, #16a34a)",
                                    color: "#fff", fontWeight: 800, fontSize: "0.9rem",
                                    border: "none", cursor: "pointer",
                                    boxShadow: "0 6px 24px rgba(34,197,94,0.30)",
                                }}
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                                    <path d="M8 5.14v14l11-7-11-7z" />
                                </svg>
                                Xem Trailer
                                {videos.length > 1 && (
                                    <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold"
                                        style={{ background: "rgba(0,0,0,0.25)", color: "#fff" }}>
                                        +{videos.length - 1}
                                    </span>
                                )}
                            </button>
                        )}

                        {/* Overview */}
                        {movie.overview && (
                            <div>
                                <h3 style={{ fontFamily: "'Bebas Neue',cursive", fontSize: "1.1rem", color: "#fff", letterSpacing: "0.06em", marginBottom: 10 }}>
                                    NỘI DUNG PHIM
                                </h3>
                                <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.75 }}>
                                    {movie.overview}
                                </p>
                            </div>
                        )}

                        {/* Stats grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                { label: "Ngân sách", value: formatMoney(movie.budget),                      icon: "💰" },
                                { label: "Doanh thu", value: formatMoney(movie.revenue),                     icon: "💵" },
                                { label: "Quốc gia",  value: movie.production_countries[0]?.name ?? "—",    icon: "🌍" },
                                { label: "Ngôn ngữ",  value: movie.spoken_languages[0]?.english_name ?? "—",icon: "🗣️" },
                            ].map((s, i) => (
                                <div key={i} className="cmd-stat rounded-xl p-3"
                                    style={{
                                        background: "rgba(34,197,94,0.04)",
                                        border: "1px solid rgba(34,197,94,0.1)",
                                        animation: `cmdFadeUp 0.4s ${0.3 + i * 0.06}s ease both`,
                                    }}>
                                    <div style={{ fontSize: "1.2rem", marginBottom: 4 }}>{s.icon}</div>
                                    <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>{s.label}</div>
                                    <div style={{ fontSize: "0.82rem", color: "#fff", fontWeight: 600 }}>{s.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── CAST ── */}
                {cast.length > 0 && (
                    <div className="mt-12 mb-6" style={{ animation: "cmdFadeUp 0.5s 0.5s ease both" }}>
                        <h3 style={{ fontFamily: "'Bebas Neue',cursive", fontSize: "1.4rem", color: "#fff", letterSpacing: "0.06em", marginBottom: 20 }}>
                            DIỄN VIÊN
                        </h3>
                        <div className="cmd-scroll flex gap-3 overflow-x-auto pb-3">
                            {cast.map((c, i) => (
                                <div key={c.id} className="cmd-cast-card flex-shrink-0 rounded-xl overflow-hidden"
                                    style={{
                                        width: 100, background: "#14172a",
                                        border: "1px solid rgba(34,197,94,0.1)",
                                        animation: `cmdFadeUp 0.4s ${0.5 + i * 0.04}s ease both`,
                                    }}>
                                    {c.profile_path ? (
                                        <img src={`${IMG_BASE}/w185${c.profile_path}`} alt={c.name}
                                            className="w-full object-cover" style={{ aspectRatio: "2/3" }} loading="lazy" />
                                    ) : (
                                        <div className="w-full flex items-center justify-center text-3xl"
                                            style={{ aspectRatio: "2/3", background: "rgba(34,197,94,0.04)" }}>🎭</div>
                                    )}
                                    <div className="p-2">
                                        <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</p>
                                        <p style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.4)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.character}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── ALL TRAILERS ── */}
                {videos.length > 1 && (
                    <div className="mt-8 mb-12" style={{ animation: "cmdFadeUp 0.5s 0.6s ease both" }}>
                        <h3 style={{ fontFamily: "'Bebas Neue',cursive", fontSize: "1.4rem", color: "#fff", letterSpacing: "0.06em", marginBottom: 16 }}>
                            TẤT CẢ TRAILER & VIDEO
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {videos.map((v, i) => (
                                <button key={v.id}
                                    onClick={() => setTrailer(v.key)}
                                    className="cmd-trailer-btn relative rounded-xl overflow-hidden text-left"
                                    style={{
                                        border: "1px solid rgba(34,197,94,0.12)",
                                        animation: `cmdFadeUp 0.4s ${0.6 + i * 0.06}s ease both`,
                                        cursor: "pointer",
                                    }}>
                                    <img
                                        src={`https://img.youtube.com/vi/${v.key}/mqdefault.jpg`}
                                        alt={v.name} className="w-full object-cover" style={{ aspectRatio: "16/9" }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center"
                                        style={{ background: "rgba(0,0,0,0.4)" }}>
                                        <div className="w-12 h-12 rounded-full flex items-center justify-center"
                                            style={{ background: "rgba(34,197,94,0.88)", boxShadow: "0 4px 20px rgba(34,197,94,0.35)" }}>
                                            <svg viewBox="0 0 24 24" fill="#fff" width="18" height="18">
                                                <path d="M8 5.14v14l11-7-11-7z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-2.5"
                                        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)" }}>
                                        <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.name}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Trailer modal ── */}
            {trailer && <TrailerModal videoKey={trailer} onClose={() => setTrailer(null)} />}
        </div>
    );
}