"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import type { Segment } from "@/types/segment";
import type { HlsPlayerProps } from "@/types/hlsPlayerProps";

interface VariantLevel {
    index: number;
    label: string;
    height?: number;
    bandwidth?: number;
    url: string;
}

/* ══════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════ */
const HlsPlayerWithFilter: React.FC<HlsPlayerProps> = ({ src, poster }) => {
    const videoRef   = useRef<HTMLVideoElement | null>(null);
    const hlsRef     = useRef<Hls | null>(null);
    const blobUrlRef = useRef<string | null>(null);
    const qualityRef = useRef<HTMLDivElement>(null);

    const [loading,          setLoading]          = useState(false);
    const [error,            setError]            = useState<string | null>(null);
    const [overlayHidden,    setOverlayHidden]    = useState(false);
    const [showQuality,      setShowQuality]      = useState(false);

    /* Quality state */
    const [variantLevels,   setVariantLevels]   = useState<VariantLevel[]>([]);
    const [selectedVariant, setSelectedVariant] = useState<number>(0);
    const [variantUrl,      setVariantUrl]      = useState<string>("");

    /* Playlist state */
    const [originalPlaylist, setOriginalPlaylist] = useState<string>("");
    const [filteredSegments, setFilteredSegments] = useState<Segment[]>([]);

    /* ──────────────────────────────────────────
       Effect A: src changes → fetch master, detect variants
    ────────────────────────────────────────── */
    useEffect(() => {
        setLoading(true);
        setError(null);
        setOverlayHidden(false);
        setShowQuality(false);
        setVariantLevels([]);
        setSelectedVariant(0);
        setVariantUrl("");
        setOriginalPlaylist("");
        setFilteredSegments([]);

        let canceled = false;
        const load = async () => {
            try {
                const text = await fetchText(src);
                if (canceled) return;

                if (text.includes("#EXT-X-STREAM-INF")) {
                    /* Master playlist → parse all quality variants */
                    const variants = parseVariants(text, src);
                    setVariantLevels(variants);
                    setVariantUrl(variants[0]?.url ?? src);
                } else {
                    /* Direct media playlist, no quality choice */
                    setVariantUrl(src);
                }
            } catch {
                if (!canceled) setVariantUrl(src); /* fallback */
            }
        };
        load();
        return () => { canceled = true; };
    }, [src]);

    /* ──────────────────────────────────────────
       Effect B: variantUrl changes → fetch + filter media playlist
    ────────────────────────────────────────── */
    useEffect(() => {
        if (!variantUrl) return;
        let canceled = false;
        setLoading(true);
        setError(null);
        setOriginalPlaylist("");
        setFilteredSegments([]);

        const load = async () => {
            try {
                let url = variantUrl;
                let text = await fetchText(url);
                if (canceled) return;

                /* Nested master (rare) */
                if (text.includes("#EXT-X-STREAM-INF")) {
                    const uri = getFirstVariantUri(text);
                    if (uri) {
                        url  = new URL(uri, variantUrl).toString();
                        text = await fetchText(url);
                        if (canceled) return;
                    }
                }

                setOriginalPlaylist(text);
                const parsed   = parseSegments(text, url);
                const filtered = parsed.filter(seg => !seg.uri.includes("/adjump/"));
                setFilteredSegments(filtered);
            } catch (err: unknown) {
                if (!canceled) setError((err as Error)?.message ?? "Tải playlist thất bại");
            } finally {
                if (!canceled) setLoading(false);
            }
        };
        load();
        return () => { canceled = true; };
    }, [variantUrl]);

    /* ── Save progress ── */
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !src) return;
        const KEY = `hls-progress-${src}`;
        let last = 0;
        const save = () => {
            const t = Math.floor(video.currentTime);
            if (t - last >= 5) { localStorage.setItem(KEY, t.toString()); last = t; }
        };
        video.addEventListener("timeupdate", save);
        return () => video.removeEventListener("timeupdate", save);
    }, [src]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        const clear = () => localStorage.removeItem(`hls-progress-${src}`);
        video.addEventListener("ended", clear);
        return () => video.removeEventListener("ended", clear);
    }, [src]);

    /* ──────────────────────────────────────────
       Effect C: build filtered HLS blob + attach player
    ────────────────────────────────────────── */
    useEffect(() => {
        if (!videoRef.current || !originalPlaylist || filteredSegments.length === 0) return;

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
            const hls = new Hls({ enableWorker: true });
            hlsRef.current = hls;
            hls.on(Hls.Events.MANIFEST_PARSED, restoreTime);
            hls.on(Hls.Events.ERROR, (_, data) => {
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR: hls.startLoad(); break;
                        case Hls.ErrorTypes.MEDIA_ERROR:   hls.recoverMediaError(); break;
                        default: setError("Lỗi phát video"); hls.destroy();
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
            if (hlsRef.current)     { hlsRef.current.destroy();               hlsRef.current     = null; }
            if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null; }
        };
    }, [originalPlaylist, filteredSegments, src]);

    /* ── Quality change ── */
    const handleQualityChange = useCallback((idx: number) => {
        /* Save current time so it restores after re-load */
        if (videoRef.current && videoRef.current.currentTime > 0) {
            localStorage.setItem(`hls-progress-${src}`, Math.floor(videoRef.current.currentTime).toString());
        }
        setSelectedVariant(idx);
        setVariantUrl(variantLevels[idx].url);
        setShowQuality(false);
    }, [src, variantLevels]);

    /* ── Close quality dropdown on outside click ── */
    useEffect(() => {
        if (!showQuality) return;
        const handler = (e: MouseEvent) => {
            if (qualityRef.current && !qualityRef.current.contains(e.target as Node))
                setShowQuality(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [showQuality]);

    const qualityLabel = variantLevels.length > 1 && variantLevels[selectedVariant]
        ? variantLevels[selectedVariant].label
        : "AUTO";

    /* ── RENDER ── */
    return (
        <div className="relative w-full h-full bg-black overflow-hidden">
            <video
                ref={videoRef}
                controls
                poster={poster}
                className="w-full h-full object-contain bg-black"
            />

            {/* ── Quality selector — only shows when playing + multiple qualities available ── */}
            {overlayHidden && variantLevels.length > 1 && (
                <div ref={qualityRef} className="absolute top-3 right-3 z-40">
                    <button
                        onClick={() => setShowQuality(p => !p)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold tracking-wide transition-all duration-150"
                        style={{
                            background: showQuality ? "rgba(34,211,165,0.92)" : "rgba(0,0,0,0.72)",
                            backdropFilter: "blur(10px)",
                            border: showQuality ? "1px solid rgba(34,211,165,0.4)" : "1px solid rgba(255,255,255,0.18)",
                            color: showQuality ? "#041a11" : "#fff",
                            boxShadow: "0 2px 12px rgba(0,0,0,0.5)",
                        }}
                    >
                        {/* Gear icon */}
                        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3" />
                            <path strokeLinecap="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                        </svg>
                        <span>{qualityLabel}</span>
                        <svg className={`w-3 h-3 shrink-0 transition-transform duration-150 ${showQuality ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {/* Dropdown */}
                    {showQuality && (
                        <div
                            className="absolute top-full right-0 mt-1.5 rounded-xl overflow-hidden py-1 min-w-[140px]"
                            style={{
                                background: "rgba(10,12,20,0.97)",
                                backdropFilter: "blur(16px)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
                                animation: "qDrop 0.15s ease",
                            }}
                        >
                            <p className="px-3.5 pt-2 pb-1 text-[10px] font-semibold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>
                                Chất lượng
                            </p>
                            {variantLevels.map(v => {
                                const isActive = v.index === selectedVariant;
                                return (
                                    <button
                                        key={v.index}
                                        onClick={() => handleQualityChange(v.index)}
                                        className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-[12.5px] transition-colors duration-100 hover:bg-white/5"
                                        style={{
                                            color: isActive ? "#22d3a5" : "rgba(255,255,255,0.72)",
                                            background: isActive ? "rgba(34,211,165,0.08)" : "transparent",
                                            fontWeight: isActive ? 700 : 400,
                                        }}
                                    >
                                        <span>{v.label}</span>
                                        {isActive && (
                                            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#22d3a5" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ── Play overlay ── */}
            {!overlayHidden && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
                    {poster && (
                        <img src={poster} alt=""
                            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                            style={{ filter: "blur(28px) brightness(0.3) saturate(1.2)", transform: "scale(1.08)" }}
                        />
                    )}
                    <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.45)" }} />

                    <button
                        className="relative z-10 group flex flex-col items-center gap-4"
                        onClick={() => {
                            setOverlayHidden(true);
                            videoRef.current?.play().catch(() => {});
                        }}
                    >
                        <div className="relative flex items-center justify-center">
                            <span className="absolute w-28 h-28 rounded-full border border-[#22d3a5]/20 animate-ping" style={{ animationDuration: "2s" }} />
                            <span className="absolute w-20 h-20 rounded-full border border-[#22d3a5]/30" />
                            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                                style={{
                                    background: "linear-gradient(135deg,#22d3a5,#0fb489)",
                                    boxShadow: "0 0 40px rgba(34,211,165,0.45), 0 8px 32px rgba(0,0,0,0.5)",
                                }}>
                                {loading ? (
                                    <svg className="w-7 h-7 text-[#041a11] animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                                        <path d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor" />
                                    </svg>
                                ) : (
                                    <svg className="w-7 h-7 sm:w-8 sm:h-8 text-[#041a11] translate-x-[2px]" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M8 5.14v14l11-7-11-7z" />
                                    </svg>
                                )}
                            </div>
                        </div>
                        <span className="relative text-sm text-white/65 font-medium tracking-widest uppercase select-none"
                            style={{ letterSpacing: "0.2em" }}>
                            {loading ? "Đang tải…" : "Nhấn để xem phim"}
                        </span>
                    </button>
                </div>
            )}

            {/* ── Error ── */}
            {error && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-medium"
                    style={{
                        background: "rgba(239,68,68,0.9)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid rgba(239,68,68,0.4)",
                        boxShadow: "0 4px 20px rgba(239,68,68,0.3)",
                        animation: "fdSlide 0.3s ease",
                    }}>
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path strokeLinecap="round" d="M12 8v4M12 16h.01" />
                    </svg>
                    {error}
                </div>
            )}

            <style>{`
                @keyframes fdSlide {
                    from { opacity:0; transform:translate(-50%,-8px); }
                    to   { opacity:1; transform:translate(-50%,0); }
                }
                @keyframes qDrop {
                    from { opacity:0; transform:translateY(-6px) scale(0.97); }
                    to   { opacity:1; transform:translateY(0) scale(1); }
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
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
}

/* Parse all #EXT-X-STREAM-INF variants from master playlist */
function parseVariants(text: string, baseUrl: string): VariantLevel[] {
    const lines = text.split("\n");
    const variants: VariantLevel[] = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line.startsWith("#EXT-X-STREAM-INF:")) continue;
        const bandwidth = parseInt(line.match(/BANDWIDTH=(\d+)/)?.[1] ?? "0");
        const res       = line.match(/RESOLUTION=\d+x(\d+)/);
        const height    = res ? parseInt(res[1]) : 0;
        const next      = lines[i + 1]?.trim();
        if (!next || next.startsWith("#")) continue;
        const url = toAbsoluteUrl(next, baseUrl);
        variants.push({ index: variants.length, label: "", height, bandwidth, url });
    }
    /* Sort highest quality first */
    variants.sort((a, b) => (b.height ?? 0) - (a.height ?? 0));
    variants.forEach((v, i) => {
        v.index = i;
        v.label = v.height && v.height > 0 ? `${v.height}p` : `Nguồn ${i + 1}`;
    });
    return variants;
}

function getFirstVariantUri(text: string): string | null {
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith("#EXT-X-STREAM-INF")) {
            const next = lines[i + 1]?.trim();
            if (next && !next.startsWith("#")) return next;
        }
    }
    return null;
}

function toAbsoluteUrl(uri: string, base: string): string {
    if (!uri || /^https?:\/\//i.test(uri)) return uri;
    return new URL(uri, base).toString();
}

function parseSegments(text: string, playlistUrl: string): Segment[] {
    const lines = text.split("\n");
    const segs: Segment[] = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line.startsWith("#EXTINF:")) continue;
        const duration = parseFloat(line.split(":")[1].split(",")[0]);
        const rawUri   = lines[i + 1]?.trim() || "";
        if (rawUri && !rawUri.startsWith("#")) {
            const uri = toAbsoluteUrl(rawUri, playlistUrl);
            segs.push({ duration, uri, isAd: uri.includes("/adjump/") });
        }
    }
    return segs;
}

function buildFilteredPlaylist(original: string, segs: Segment[]): string {
    const headers = original.split("\n")
        .map(l => l.trim())
        .filter(l => l && l.startsWith("#") && !l.startsWith("#EXTINF:") && !l.startsWith("#EXT-X-ENDLIST"));
    const result = [...headers];
    for (const s of segs) { result.push(`#EXTINF:${s.duration},`); result.push(s.uri); }
    result.push("#EXT-X-ENDLIST");
    return result.join("\n") + "\n";
}

export default HlsPlayerWithFilter;
