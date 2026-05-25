import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import type { Segment } from "@/types/segment";
import type { HlsPlayerProps } from "@/types/hlsPlayerProps";

const HlsPlayerWithFilter: React.FC<HlsPlayerProps> = ({
    src,
    poster,
    showLogo = true,
    logoSrc = "/logo_dahee.jpg",
}) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const hlsRef = useRef<Hls | null>(null);
    const blobUrlRef = useRef<string | null>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [, setSegments] = useState<Segment[]>([]);
    const [filteredSegments, setFilteredSegments] = useState<Segment[]>([]);
    const [originalPlaylist, setOriginalPlaylist] = useState<string>("");

    const [overlayHidden, setOverlayHidden] = useState(false);
    const [compactLogo, setCompactLogo] = useState(false);

    if (!src) return null;

    /* ------------------ 1) Fetch playlist (master -> media) ------------------ */
    useEffect(() => {
        let canceled = false;
        setLoading(true);
        setError(null);
        setOverlayHidden(false); // mỗi lần đổi src thì show lại overlay

        const load = async () => {
            try {
                let playlistUrl = src;
                let playlistText = await fetchText(playlistUrl);
                if (canceled) return;

                // Nếu là master playlist (#EXT-X-STREAM-INF) → lấy variant đầu tiên
                if (playlistText.includes("#EXT-X-STREAM-INF")) {
                    const variantUri = getFirstVariantUri(playlistText);
                    if (!variantUri) {
                        throw new Error("Không tìm thấy variant trong master playlist");
                    }

                    playlistUrl = new URL(variantUri, src).toString();
                    playlistText = await fetchText(playlistUrl);
                    if (canceled) return;
                }

                setOriginalPlaylist(playlistText);

                const parsed = parseSegments(playlistText, playlistUrl);
                setSegments(parsed);

                // Lọc quảng cáo (ví dụ: chứa /adjump/)
                const filtered = parsed.filter(
                    (seg) => !seg.uri.includes("/adjump/")
                );
                setFilteredSegments(filtered);
            } catch (err: any) {
                if (canceled) return;
                console.error(err);
                setError(err?.message || "Fetch playlist failed");
            } finally {
                if (!canceled) setLoading(false);
            }
        };

        load();

        return () => {
            canceled = true;
        };
    }, [src]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !src) return;

        const STORAGE_KEY = `hls-progress-${src}`;
        let lastSaved = 0;

        const saveProgress = () => {
            const current = Math.floor(video.currentTime);
            if (current - lastSaved >= 5) {
                localStorage.setItem(STORAGE_KEY, current.toString());
                lastSaved = current;
            }
        };

        video.addEventListener("timeupdate", saveProgress);

        return () => {
            video.removeEventListener("timeupdate", saveProgress);
        };
    }, [src]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const clearProgress = () => {
            localStorage.removeItem(`hls-progress-${src}`);
        };

        video.addEventListener("ended", clearProgress);
        return () => video.removeEventListener("ended", clearProgress);
    }, [src]);

    /* ------------------ 2) Build playlist mới + Hls.js play ------------------ */
    useEffect(() => {
        if (!videoRef.current) return;
        if (!originalPlaylist) return;
        if (filteredSegments.length === 0) return;

        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }
        if (blobUrlRef.current) {
            URL.revokeObjectURL(blobUrlRef.current);
            blobUrlRef.current = null;
        }

        const filteredPlaylistText = buildFilteredPlaylist(
            originalPlaylist,
            filteredSegments
        );

        const blob = new Blob([filteredPlaylistText], {
            type: "application/vnd.apple.mpegurl",
        });

        const blobUrl = URL.createObjectURL(blob);
        blobUrlRef.current = blobUrl;

        const video = videoRef.current;
        const STORAGE_KEY = `hls-progress-${src}`;

        const restoreTime = () => {
            const saved = localStorage.getItem(STORAGE_KEY);
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
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            hls.recoverMediaError();
                            break;
                        default:
                            setError(`HLS fatal error`);
                            hls.destroy();
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
            if (hlsRef.current) hlsRef.current.destroy();
            if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
        };
    }, [originalPlaylist, filteredSegments, src]);

    /* ---------------------- Overlay nút play + UI Dahee ---------------------- */

    const handlePlayClick = () => {
        setOverlayHidden(true);

        // Bắt video play luôn sau khi bấm
        if (videoRef.current) {
            videoRef.current.play().catch((err) => {
                console.warn("Không auto play được:", err);
            });
        }
    };

    return (
        <div className="relative w-full h-full z-50">
            {/* Video HLS */}
            <video
                ref={videoRef}
                controls
                poster={poster}
                className="w-full h-full object-cover bg-black"
            />

            {/* Overlay bắt buộc bấm nút play */}
            {!overlayHidden && (
                <div
                    className="
                        absolute inset-0 z-20
                        flex items-center justify-center
                        bg-black/30
                    "
                >
                    <button
                        onClick={handlePlayClick}
                        disabled={loading}
                        className="
                            w-14 h-14 sm:w-16 sm:h-16
                            rounded-full
                            bg-[#f6d46b]
                            flex items-center justify-center
                            shadow-[0_10px_30px_rgba(0,0,0,0.6)]
                            hover:bg-[#ffce4a]
                            transition
                            disabled:opacity-60 disabled:cursor-not-allowed
                        "
                    >
                        <span className="text-black text-xl ml-0.5">
                            {loading ? "…" : "▶"}
                        </span>
                    </button>
                </div>
            )}

            {/* 2 nút Dahee bên phải */}
            {showLogo && (
                <div
                    className="
                        absolute bottom-32 right-3 z-30
                        hidden sm:flex lg:flex xl:flex
                    "
                >
                    <div
                        className={`
                            relative
                            flex flex-col gap-2
                            transition-transform duration-500
                            ease-[cubic-bezier(0.4,0,0.2,1)]
                            ${compactLogo ? "translate-x-[173px]" : "translate-x-[13px]"}
                        `}
                    >
                        {/* FANPAGE */}
                        <a
                            href="https://www.facebook.com/tiemnhonhadahee"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`dahee-chip dahee-chip-fb flex items-center gap-2 ${compactLogo ? "rounded-full" : ""}`}
                        >
                            <div className="h-6 w-6 flex items-center justify-center rounded-full bg-[#1877f2] shrink-0">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    className="h-3.5 w-3.5 text-white"
                                >
                                    <path
                                        fill="currentColor"
                                        d="M13 21v-7h2.2a1 1 0 0 0 .98-.8l.5-3A1 1 0 0 0 15.7 9H13V7.2c0-.6.4-1 1-1h1.9a1 1 0 0 0 1-1V3.6A.6.6 0 0 0 16.3 3H14a4 4 0 0 0-4 4v2H8.6a1 1 0 0 0-1 .9L7.3 13a1 1 0 0 0 1 .9H10v7h3Z"
                                    />
                                </svg>
                            </div>

                            <span
                                className={`
                                    text-[11px] font-semibold text-[#4b2e1c]
                                    whitespace-nowrap
                                    transition-all duration-400 ease-out
                                    ${compactLogo
                                        ? "opacity-0 translate-x-2 scale-95 pointer-events-none"
                                        : "opacity-100 translate-x-0 scale-100"}
                                `}
                            >
                                Fanpage Tiệm Nhỏ Nhà Dahee
                            </span>
                        </a>

                        {/* NÚT TOGGLE – NẰM GIỮA */}
                        <button
                            onClick={() => setCompactLogo(!compactLogo)}
                            title={compactLogo ? "Mở" : "Thu gọn"}
                            className="
                                absolute left-[-25px] top-1/2 -translate-y-1/2
                                h-8 w-4
                                flex items-center justify-center
                                rounded-l-full backdrop-blur
                                border border-[#f4d0aa]
                                shadow text-[#4b2e1c]
                                transition-all duration-300
                            "
                            style={{
                                background: "linear-gradient(120deg, #f8f1e8, #f2dfcc, #f8f1e8)",
                            }}
                        >
                            <svg
                                className={`
                                    h-3 w-3
                                    transition-transform duration-300
                                    ${compactLogo ? "" : "rotate-180"}
                                `}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                        </button>

                        {/* WEB SHOP */}
                        <a
                            href="https://daheeshop.vercel.app"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`dahee-chip dahee-chip-shop flex items-center gap-2 ${compactLogo ? "rounded-full" : ""}`}
                        >
                            <div className="h-6 w-6 overflow-hidden rounded-full border border-[#f4d0aa] bg-[#fef7ee] shadow-sm shrink-0">
                                <img
                                    src={logoSrc}
                                    alt="Tiệm Nhỏ Nhà Dahee"
                                    className="h-full w-full object-cover"
                                />
                            </div>

                            <span
                                className={`
                                    text-[11px] font-semibold text-[#4b2e1c]
                                    whitespace-nowrap
                                    transition-all duration-400 ease-out
                                    ${compactLogo
                                        ? "opacity-0 translate-x-2 scale-95 pointer-events-none"
                                        : "opacity-100 translate-x-0 scale-100"}
                                `}
                            >
                                Tiệm Nhỏ Nhà Dahee
                            </span>
                        </a>
                    </div>
                </div>
            )}

            {/* Góc nhỏ báo lỗi (nếu có) */}
            {error && (
                <div className="absolute top-3 left-3 z-30 rounded bg-red-600/90 px-3 py-1 text-xs text-white">
                    {error}
                </div>
            )}
        </div>
    );
};

/* -------------------------- Helpers giữ nguyên logic -------------------------- */

async function fetchText(url: string): Promise<string> {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`HTTP ${res.status} - ${url}`);
    }
    return res.text();
}

function getFirstVariantUri(text: string): string | null {
    const lines = text.split("\n");

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith("#EXT-X-STREAM-INF")) {
            const next = lines[i + 1]?.trim();
            if (next && !next.startsWith("#")) {
                return next;
            }
        }
    }

    return null;
}

function toAbsoluteUrl(uri: string, playlistUrl: string): string {
    if (!uri) return uri;
    if (/^https?:\/\//i.test(uri)) {
        return uri;
    }
    return new URL(uri, playlistUrl).toString();
}

function parseSegments(text: string, playlistUrl: string): Segment[] {
    const lines = text.split("\n");
    const segments: Segment[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith("#EXTINF:")) {
            const durationStr = line.split(":")[1].split(",")[0];
            const duration = parseFloat(durationStr);
            const rawUri = lines[i + 1]?.trim() || "";

            if (rawUri && !rawUri.startsWith("#")) {
                const absoluteUri = toAbsoluteUrl(rawUri, playlistUrl);
                const isAd = absoluteUri.includes("/adjump/");
                segments.push({ duration, uri: absoluteUri, isAd });
            }
        }
    }

    return segments;
}

function buildFilteredPlaylist(
    originalText: string,
    filteredSegments: Segment[]
): string {
    const lines = originalText.split("\n");

    const headerLines: string[] = [];
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // chỉ giữ tag
        if (!trimmed.startsWith("#")) continue;
        if (trimmed.startsWith("#EXTINF:")) continue;
        if (trimmed.startsWith("#EXT-X-ENDLIST")) continue;

        headerLines.push(trimmed);
    }

    const result: string[] = [];
    result.push(...headerLines);

    for (const seg of filteredSegments) {
        result.push(`#EXTINF:${seg.duration},`);
        result.push(seg.uri);
    }

    result.push("#EXT-X-ENDLIST");

    return result.join("\n") + "\n";
}

export default HlsPlayerWithFilter;
