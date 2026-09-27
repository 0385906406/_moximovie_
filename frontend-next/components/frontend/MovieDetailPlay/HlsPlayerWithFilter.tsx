"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import type { Segment } from "@/types/segment";
import type { HlsPlayerProps } from "@/types/hlsPlayerProps";
import PlayerControls, { AUTOPLAY_FLAG } from "./PlayerControls";
import PlayerCurtain, { CURTAIN_OPEN_MS } from "./PlayerCurtain";

const AMBIENT_KEY = "player-ambient";

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
const HlsPlayerWithFilter: React.FC<HlsPlayerProps> = ({ src, poster, title, subtitle, prevEpisode, nextEpisode }) => {
    const videoRef   = useRef<HTMLVideoElement | null>(null);
    const hlsRef     = useRef<Hls | null>(null);
    const blobUrlRef = useRef<string | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const ambientRef = useRef<HTMLCanvasElement | null>(null);
    /* Đổi chất lượng cũng khôi phục vị trí xem → không hiện thông báo "tiếp tục từ" trong trường hợp đó */
    const switchingQuality = useRef(false);
    /* Vừa bấm chuyển tập từ trình phát → tập mới tự phát luôn */
    const autoStart = useRef(false);

    const [loading,          setLoading]          = useState(false);
    const [error,            setError]            = useState<string | null>(null);
    const [overlayHidden,    setOverlayHidden]    = useState(false);
    const [resumeFrom,       setResumeFrom]       = useState<number | null>(null);
    const dismissResume = useCallback(() => setResumeFrom(null), []);

    /* Rèm: closed (chờ) → opening (đang kéo, video đã phát phía sau) → open (gỡ rèm) */
    const [curtain, setCurtain] = useState<"closed" | "opening" | "open">("closed");
    const curtainTimer = useRef(0);
    const openCurtain = useCallback(() => {
        setCurtain("opening");
        clearTimeout(curtainTimer.current);
        curtainTimer.current = window.setTimeout(() => setCurtain("open"), CURTAIN_OPEN_MS);
    }, []);
    const closeCurtain = useCallback(() => {
        clearTimeout(curtainTimer.current);
        setCurtain("closed");
    }, []);
    useEffect(() => () => clearTimeout(curtainTimer.current), []);

    /* Ambient: ánh màu của video toả ra quanh khung phát (chỉ máy tính, tốn GPU) */
    const [ambientOk, setAmbientOk] = useState(false);
    const [ambient,   setAmbient]   = useState(true);

    useEffect(() => {
        try {
            if (sessionStorage.getItem(AUTOPLAY_FLAG)) {
                sessionStorage.removeItem(AUTOPLAY_FLAG);
                autoStart.current = true;
            }
        } catch {}
        setAmbientOk(window.matchMedia("(min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches);
        try {
            const saved = localStorage.getItem(AMBIENT_KEY);
            if (saved !== null) setAmbient(saved === "1");
        } catch {}
    }, []);

    const changeAmbient = useCallback((on: boolean) => {
        setAmbient(on);
        try { localStorage.setItem(AMBIENT_KEY, on ? "1" : "0"); } catch {}
    }, []);

    /* Vẽ khung hình thu nhỏ (64×36) lên canvas phía sau, ~8 lần/giây; CSS phóng to + làm mờ */
    useEffect(() => {
        if (!ambientOk || !ambient || !overlayHidden) return;
        const video = videoRef.current;
        const canvas = ambientRef.current;
        const ctx = canvas?.getContext("2d");
        if (!video || !canvas || !ctx) return;
        const paint = () => {
            if (video.readyState < 2) return;
            try { ctx.drawImage(video, 0, 0, canvas.width, canvas.height); } catch {}
        };
        let raf = 0, last = 0;
        const loop = (now: number) => {
            raf = requestAnimationFrame(loop);
            if (video.paused || now - last < 120) return;
            last = now;
            paint();
        };
        raf = requestAnimationFrame(loop);
        video.addEventListener("seeked", paint);
        video.addEventListener("loadeddata", paint);
        return () => {
            cancelAnimationFrame(raf);
            video.removeEventListener("seeked", paint);
            video.removeEventListener("loadeddata", paint);
        };
    }, [ambientOk, ambient, overlayHidden]);

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
        closeCurtain();
        setResumeFrom(null);
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
            if (autoStart.current) {
                autoStart.current = false;
                setOverlayHidden(true);
                openCurtain();
                video.play().catch(() => { setOverlayHidden(false); closeCurtain(); });
            }
            const saved = localStorage.getItem(PROG_KEY);
            if (!saved || !video) return;
            const t = parseFloat(saved);
            if (video.duration && t > video.duration - 10) return;
            video.currentTime = t;
            if (!switchingQuality.current && t > 5) setResumeFrom(t);
            switchingQuality.current = false;
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
        if (idx === selectedVariant) return;
        const video = videoRef.current;
        if (video && video.currentTime > 0) {
            localStorage.setItem(`hls-progress-${src}`, Math.floor(video.currentTime).toString());
        }
        switchingQuality.current = true;
        /* Đang xem thì đổi xong phát tiếp luôn */
        if (video && !video.paused) {
            const resume = () => video.play().catch(() => {});
            video.addEventListener("loadedmetadata", resume, { once: true });
        }
        setSelectedVariant(idx);
        setVariantUrl(variantLevels[idx].url);
    }, [src, variantLevels, selectedVariant]);

    /* ── RENDER ── */
    return (
        <div className="relative w-full h-full isolate" style={{ borderRadius: "inherit" }}>
            {ambientOk && (
                <canvas
                    ref={ambientRef}
                    width={64}
                    height={36}
                    aria-hidden
                    className="absolute pointer-events-none"
                    style={{
                        left: "-4%", top: "-7%", width: "108%", height: "114%", zIndex: -1,
                        filter: "blur(44px) saturate(1.5)",
                        opacity: ambient && overlayHidden ? 0.6 : 0,
                        transition: "opacity 1.2s ease",
                    }}
                />
            )}
        <div ref={containerRef} className="pc-root relative w-full h-full bg-black overflow-hidden" style={{ borderRadius: "inherit" }}>
            {/* Không dùng controls mặc định của trình duyệt: PlayerControls vẽ thanh điều khiển riêng.
                playsInline: iPhone không tự bật toàn màn hình khi bấm phát */}
            <video
                ref={videoRef}
                playsInline
                poster={poster}
                className="w-full h-full object-contain bg-black"
            />

            {overlayHidden && (
                <PlayerControls
                    videoRef={videoRef}
                    containerRef={containerRef}
                    qualities={variantLevels.map(v => ({ index: v.index, label: v.label }))}
                    selectedQuality={selectedVariant}
                    onQualityChange={handleQualityChange}
                    resumeFrom={resumeFrom}
                    onDismissResume={dismissResume}
                    title={title}
                    subtitle={subtitle}
                    prevEpisode={prevEpisode}
                    nextEpisode={nextEpisode}
                    ambientAvailable={ambientOk}
                    ambient={ambient}
                    onAmbientChange={changeAmbient}
                />
            )}

            {/* ── Rèm sân khấu: khép lúc chờ, bấm phát thì kéo rèm (PlayerCurtain.tsx) ── */}
            {curtain !== "open" && (
                <PlayerCurtain
                    state={curtain}
                    title={title}
                    subtitle={subtitle}
                    loading={loading}
                    onPlay={() => {
                        setOverlayHidden(true);
                        openCurtain();
                        videoRef.current?.play().catch(() => {});
                    }}
                />
            )}

            {/* ── Error ── */}
            {error && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-medium"
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
                    from { opacity:0; transform:translateY(-8px); }
                    to   { opacity:1; transform:none; }
                }
                .pc-root:fullscreen { border-radius: 0 !important; }
            `}</style>
        </div>
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
