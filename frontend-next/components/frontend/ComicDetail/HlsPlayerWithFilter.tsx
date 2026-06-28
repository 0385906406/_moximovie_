"use client";

import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import type { Segment } from "@/types/segment";
import type { HlsPlayerProps } from "@/types/hlsPlayerProps";

const HlsPlayerWithFilter: React.FC<HlsPlayerProps> = ({ src, poster }) => {
    const videoRef    = useRef<HTMLVideoElement | null>(null);
    const hlsRef      = useRef<Hls | null>(null);
    const blobUrlRef  = useRef<string | null>(null);

    const [loading,          setLoading]          = useState(false);
    const [error,            setError]            = useState<string | null>(null);
    const [filteredSegments, setFilteredSegments] = useState<Segment[]>([]);
    const [originalPlaylist, setOriginalPlaylist] = useState<string>("");
    const [overlayHidden,    setOverlayHidden]    = useState(false);

    if (!src) return null;

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
                    if (!variantUri) throw new Error("Không tìm thấy variant playlist");
                    playlistUrl  = new URL(variantUri, src).toString();
                    playlistText = await fetchText(playlistUrl);
                    if (canceled) return;
                }

                setOriginalPlaylist(playlistText);
                const parsed   = parseSegments(playlistText, playlistUrl);
                const filtered = parsed.filter(seg => !seg.uri.includes("/adjump/"));
                setFilteredSegments(filtered);
            } catch (err: unknown) {
                if (canceled) return;
                setError((err as Error)?.message || "Tải playlist thất bại");
            } finally {
                if (!canceled) setLoading(false);
            }
        };

        load();
        return () => { canceled = true; };
    }, [src]);

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

    useEffect(() => {
        if (!videoRef.current || !originalPlaylist || filteredSegments.length === 0) return;

        if (hlsRef.current)     { hlsRef.current.destroy();               hlsRef.current  = null; }
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
            if (hlsRef.current)     hlsRef.current.destroy();
            if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
        };
    }, [originalPlaylist, filteredSegments, src]);

    return (
        <div className="relative w-full h-full bg-black overflow-hidden">
            <video
                ref={videoRef}
                controls
                poster={poster}
                className="w-full h-full object-contain bg-black"
            />

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
                        <span className="relative text-sm text-white/65 font-medium select-none" style={{ letterSpacing: "0.2em" }}>
                            {loading ? "Đang tải…" : "Nhấn để xem phim"}
                        </span>
                    </button>
                </div>
            )}

            {error && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-medium"
                    style={{
                        background: "rgba(239,68,68,0.9)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid rgba(239,68,68,0.4)",
                        boxShadow: "0 4px 20px rgba(239,68,68,0.3)",
                    }}>
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path strokeLinecap="round" d="M12 8v4M12 16h.01" />
                    </svg>
                    {error}
                </div>
            )}
        </div>
    );
};

async function fetchText(url: string): Promise<string> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
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
        if (line.startsWith("#EXTINF:")) {
            const duration = parseFloat(line.split(":")[1].split(",")[0]);
            const rawUri   = lines[i + 1]?.trim() || "";
            if (rawUri && !rawUri.startsWith("#")) {
                const uri = toAbsoluteUrl(rawUri, playlistUrl);
                segs.push({ duration, uri, isAd: uri.includes("/adjump/") });
            }
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
