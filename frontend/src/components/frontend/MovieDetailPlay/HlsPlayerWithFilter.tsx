import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import type { Segment } from "@/types/segment";
import type { HlsPlayerProps } from "@/types/hlsPlayerProps";

const api =
    import.meta.env.MODE === "development"
        ? "http://localhost:2004/api"
        : "https://moximovie-production.up.railway.app/api";
/* ══════════════════════════════════════════════
   AFFILIATE CONFIG
══════════════════════════════════════════════ */
const SHOPEE_KEY      = "shopee_last_open";
const SHOPEE_COOLDOWN = 1 * 60 * 60 * 1000;   // 1 tiếng

/* ── Mở Shopee affiliate (chỉ mobile, cooldown 1h) ── */
function openShopeeOnMobile() {
    if (window.innerWidth >= 768) return;

    const now      = Date.now();
    const lastOpen = Number(localStorage.getItem(SHOPEE_KEY) ?? 0);
    if (now - lastOpen < SHOPEE_COOLDOWN) return;

    localStorage.setItem(SHOPEE_KEY, String(now));

    // ✅ Mở URL backend — browser cho phép vì là direct click handler
    // Backend sẽ redirect 302 sang Shopee
    window.open(
        `${api}/affiliate/shopee`,
        "_blank",
        "noopener noreferrer"
    );
}

// const MONETAG_COOLDOWN  = 2 * 60 * 60 * 1000;
// const MONETAG_KEY       = "monetag_last_load";
// const MONETAG_SCRIPT_ID = "monetag-script"; // ← ID check script đã có chưa

// const loadMonetag = () => {
//     // ✅ Script đã có trong DOM → không load lại, tránh trigger liên tục
//     if (document.getElementById(MONETAG_SCRIPT_ID)) return;

//     const now      = Date.now();
//     const lastLoad = Number(localStorage.getItem(MONETAG_KEY) ?? 0);
//     if (now - lastLoad < MONETAG_COOLDOWN) return;

//     localStorage.setItem(MONETAG_KEY, String(now));

//     const s        = document.createElement("script");
//     s.id           = MONETAG_SCRIPT_ID; // ← gắn ID
//     s.src          = "https://al5sm.com/tag.min.js";
//     s.dataset.zone = "10440596";
//     s.async        = true;
//     document.body.appendChild(s);
// };

/* ══════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════ */
const HlsPlayerWithFilter: React.FC<HlsPlayerProps> = ({
    src,
    poster,
    showLogo = true,
    logoSrc  = "/logo_dahee.jpg",
}) => {
    const videoRef    = useRef<HTMLVideoElement | null>(null);
    const hlsRef      = useRef<Hls | null>(null);
    const blobUrlRef  = useRef<string | null>(null);

    const [loading,           setLoading]           = useState(false);
    const [error,             setError]             = useState<string | null>(null);
    const [,                  setSegments]          = useState<Segment[]>([]);
    const [filteredSegments,  setFilteredSegments]  = useState<Segment[]>([]);
    const [originalPlaylist,  setOriginalPlaylist]  = useState<string>("");
    const [overlayHidden,     setOverlayHidden]     = useState(false);
    const [compactLogo,       setCompactLogo]       = useState(false);
    const [playHovered,       setPlayHovered]       = useState(false);

    if (!src) return null;

    /* ── 1) Fetch playlist ── */
    useEffect(() => {
        let canceled = false;
        setLoading(true);
        setError(null);
        setOverlayHidden(false);

        const load = async () => {
            try {
                let playlistUrl  = src;
                let playlistText = await fetchText(playlistUrl);
                if (canceled) return;

                if (playlistText.includes("#EXT-X-STREAM-INF")) {
                    const variantUri = getFirstVariantUri(playlistText);
                    if (!variantUri) throw new Error("Không tìm thấy variant trong master playlist");
                    playlistUrl  = new URL(variantUri, src).toString();
                    playlistText = await fetchText(playlistUrl);
                    if (canceled) return;
                }

                setOriginalPlaylist(playlistText);
                const parsed   = parseSegments(playlistText, playlistUrl);
                setSegments(parsed);
                const filtered = parsed.filter(seg => !seg.uri.includes("/adjump/"));
                setFilteredSegments(filtered);
            } catch (err: any) {
                if (canceled) return;
                setError(err?.message || "Fetch playlist failed");
            } finally {
                if (!canceled) setLoading(false);
            }
        };

        load();
        return () => { canceled = true; };
    }, [src]);

    /* ── Save progress ── */
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !src) return;
        const KEY = `hls-progress-${src}`;
        let lastSaved = 0;
        const save = () => {
            const cur = Math.floor(video.currentTime);
            if (cur - lastSaved >= 5) { localStorage.setItem(KEY, cur.toString()); lastSaved = cur; }
        };
        video.addEventListener("timeupdate", save);
        return () => video.removeEventListener("timeupdate", save);
    }, [src]);

    /* ── Clear progress on ended ── */
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        const clear = () => localStorage.removeItem(`hls-progress-${src}`);
        video.addEventListener("ended", clear);
        return () => video.removeEventListener("ended", clear);
    }, [src]);

    /* ── 2) Build playlist + Hls.js ── */
    useEffect(() => {
        if (!videoRef.current || !originalPlaylist || filteredSegments.length === 0) return;

        if (hlsRef.current)   { hlsRef.current.destroy();            hlsRef.current  = null; }
        if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null; }

        const filteredText = buildFilteredPlaylist(originalPlaylist, filteredSegments);
        const blob    = new Blob([filteredText], { type: "application/vnd.apple.mpegurl" });
        const blobUrl = URL.createObjectURL(blob);
        blobUrlRef.current = blobUrl;

        const video    = videoRef.current;
        const PROG_KEY = `hls-progress-${src}`;

        const restoreTime = () => {
            const saved = localStorage.getItem(PROG_KEY);
            if (!saved || !video) return;
            const t = parseFloat(saved);
            if (video.duration && t > video.duration - 10) return;
            video.currentTime = t;
        };

        if (Hls.isSupported()) {
            const hls = new Hls();
            hlsRef.current = hls;
            hls.on(Hls.Events.MANIFEST_PARSED, restoreTime);
            hls.on(Hls.Events.ERROR, (_, data) => {
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR: hls.startLoad(); break;
                        case Hls.ErrorTypes.MEDIA_ERROR:   hls.recoverMediaError(); break;
                        default: setError("HLS fatal error"); hls.destroy();
                    }
                }
            });
            hls.loadSource(blobUrl);
            hls.attachMedia(video);
        } else if (video.canPlayType("application/vnd.apple.mpegURL")) {
            video.src = blobUrl;
            video.addEventListener("loadedmetadata", restoreTime, { once: true });
        } else {
            setError("Trình duyệt không hỗ trợ HLS");
        }

        return () => {
            if (hlsRef.current)    hlsRef.current.destroy();
            if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
        };
    }, [originalPlaylist, filteredSegments, src]);

    /* ══════════════════════════════════════════════
       RENDER
    ══════════════════════════════════════════════ */
    return (
        <div className="relative w-full h-full z-20 overflow-hidden bg-black">
            <video
                ref={videoRef}
                controls
                poster={poster}
                className="w-full h-full object-cover bg-black"
            />

            {/* ── OVERLAY NÚT PLAY ── */}
            {!overlayHidden && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/50 backdrop-blur-[2px]">
                    {poster && (
                        <img src={poster} alt=""
                            className="absolute inset-0 w-full h-full object-cover opacity-20 scale-105 blur-sm pointer-events-none select-none" />
                    )}

                    <div className="relative flex items-center justify-center">
                        <span className="absolute w-24 h-24 rounded-full bg-green-400/20 animate-ping" />
                        <span className="absolute w-10 h-10 rounded-full bg-green-400/10" />

                        <button
                            onClick={() => {
                                setOverlayHidden(true);
                                // loadMonetag();
                                openShopeeOnMobile(); // ← Shopee (chỉ mobile, cooldown 1h)
                                videoRef.current?.play().catch(() => {});
                            }}
                            onMouseEnter={() => setPlayHovered(true)}
                            onMouseLeave={() => setPlayHovered(false)}
                            className={`
                                relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-full
                                flex items-center justify-center
                                shadow-[0_8px_32px_rgba(0,0,0,0.5)]
                                transition-all duration-300 cursor-pointer
                                ${playHovered
                                    ? "bg-green-300 scale-110 shadow-[0_0_40px_rgba(250,204,21,0.5)]"
                                    : "bg-green-400 scale-100"}
                            `}
                        >
                            {loading ? (
                                <svg className="w-7 h-7 text-black animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                </svg>
                            ) : (
                                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-black" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M8 5.14v14l11-7-11-7z" />
                                </svg>
                            )}
                        </button>
                    </div>

                    <p className="relative mt-5 text-sm text-white/70 font-medium tracking-wide select-none">
                        {loading ? "Đang tải phim…" : "Nhấn để xem phim"}
                    </p>
                </div>
            )}

            {/* ── 2 NÚT DAHEE BÊN PHẢI ── */}
            {showLogo && (
                <div className="absolute bottom-28 right-0 z-30 hidden sm:flex lg:flex xl:flex">
                    <div className={`
                        relative flex flex-col gap-2
                        transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
                        ${compactLogo ? "translate-x-[70px]" : "translate-x-[14px]"}
                    `}>
                        {/* Toggle */}
                        <button
                            onClick={() => setCompactLogo(!compactLogo)}
                            title={compactLogo ? "Mở rộng" : "Thu gọn"}
                            className="absolute left-[-26px] top-1/2 -translate-y-1/2 z-10 h-9 w-5 flex items-center justify-center rounded-l-full border border-[#f4d0aa]/60 shadow-md transition-all duration-300 hover:brightness-105"
                            style={{ background: "linear-gradient(160deg, #f8f1e8, #ecdfc8)" }}
                        >
                            <svg className={`h-3 w-3 text-[#6b3d1e] transition-transform duration-300 ${compactLogo ? "" : "rotate-180"}`}
                                fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        {/* Fanpage */}
                        <a href="https://www.facebook.com/tiemnhonhadahee" target="_blank" rel="noopener noreferrer"
                            className="group flex items-center gap-2.5 pl-2 pr-4 py-2 rounded-l-2xl border border-[#f4d0aa]/50 shadow-lg backdrop-blur-sm transition-all duration-300 hover:brightness-105 hover:shadow-xl hover:-translate-y-px overflow-hidden"
                            style={{ background: "linear-gradient(135deg, #fdf6ed, #f5e0c5)" }}>
                            <div className="h-7 w-7 flex items-center justify-center rounded-full bg-[#1877f2] shrink-0 shadow-sm">
                                <svg viewBox="0 0 24 24" className="h-4 w-4 text-white">
                                    <path fill="currentColor" d="M13 21v-7h2.2a1 1 0 0 0 .98-.8l.5-3A1 1 0 0 0 15.7 9H13V7.2c0-.6.4-1 1-1h1.9a1 1 0 0 0 1-1V3.6A.6.6 0 0 0 16.3 3H14a4 4 0 0 0-4 4v2H8.6a1 1 0 0 0-1 .9L7.3 13a1 1 0 0 0 1 .9H10v7h3Z" />
                                </svg>
                            </div>
                            <span className={`text-[11px] font-semibold text-[#4b2e1c] whitespace-nowrap transition-all duration-300 ${compactLogo ? "opacity-0 w-0 pointer-events-none" : "opacity-100 w-auto"}`}>
                                Fanpage Tiệm Nhỏ Nhà Dahee
                            </span>
                        </a>

                        {/* Web shop */}
                        <a href="https://daheeshop.vercel.app" target="_blank" rel="noopener noreferrer"
                            className="group flex items-center gap-2.5 pl-2 pr-4 py-2 rounded-l-2xl border border-[#f4d0aa]/50 shadow-lg backdrop-blur-sm transition-all duration-300 hover:brightness-105 hover:shadow-xl hover:-translate-y-px overflow-hidden"
                            style={{ background: "linear-gradient(135deg, #fdf6ed, #f5e0c5)" }}>
                            <div className="h-7 w-7 overflow-hidden rounded-full border border-[#f4d0aa] bg-[#fef7ee] shadow-sm shrink-0">
                                <img src={logoSrc} alt="Tiệm Nhỏ Nhà Dahee" className="h-full w-full object-cover" />
                            </div>
                            <span className={`text-[11px] font-semibold text-[#4b2e1c] whitespace-nowrap transition-all duration-300 ${compactLogo ? "opacity-0 w-0 pointer-events-none" : "opacity-100 w-auto"}`}>
                                Tiệm Nhỏ Nhà Dahee
                            </span>
                        </a>
                    </div>
                </div>
            )}

            {/* ── ERROR TOAST ── */}
            {error && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/90 backdrop-blur-sm shadow-lg border border-red-400/30 text-white text-xs font-medium animate-[fadeSlideDown_0.3s_ease]">
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path strokeLinecap="round" d="M12 8v4M12 16h.01" />
                    </svg>
                    {error}
                </div>
            )}

            <style>{`
                @keyframes fadeSlideDown {
                    from { opacity: 0; transform: translate(-50%, -8px); }
                    to   { opacity: 1; transform: translate(-50%, 0); }
                }
            `}</style>
        </div>
    );
};

/* ══════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════ */
async function fetchText(url: string): Promise<string> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} - ${url}`);
    return res.text();
}

function getFirstVariantUri(text: string): string | null {
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith("#EXT-X-STREAM-INF")) {
            const next = lines[i + 1]?.trim();
            if (next && !next.startsWith("#")) return next;
        }
    }
    return null;
}

function toAbsoluteUrl(uri: string, playlistUrl: string): string {
    if (!uri) return uri;
    if (/^https?:\/\//i.test(uri)) return uri;
    return new URL(uri, playlistUrl).toString();
}

function parseSegments(text: string, playlistUrl: string): Segment[] {
    const lines    = text.split("\n");
    const segments: Segment[] = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith("#EXTINF:")) {
            const duration = parseFloat(line.split(":")[1].split(",")[0]);
            const rawUri   = lines[i + 1]?.trim() || "";
            if (rawUri && !rawUri.startsWith("#")) {
                const absoluteUri = toAbsoluteUrl(rawUri, playlistUrl);
                segments.push({ duration, uri: absoluteUri, isAd: absoluteUri.includes("/adjump/") });
            }
        }
    }
    return segments;
}

function buildFilteredPlaylist(originalText: string, filteredSegments: Segment[]): string {
    const lines       = originalText.split("\n");
    const headerLines: string[] = [];
    for (const line of lines) {
        const t = line.trim();
        if (!t || !t.startsWith("#")) continue;
        if (t.startsWith("#EXTINF:") || t.startsWith("#EXT-X-ENDLIST")) continue;
        headerLines.push(t);
    }
    const result = [...headerLines];
    for (const seg of filteredSegments) {
        result.push(`#EXTINF:${seg.duration},`);
        result.push(seg.uri);
    }
    result.push("#EXT-X-ENDLIST");
    return result.join("\n") + "\n";
}

export default HlsPlayerWithFilter;