"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
    Play, Pause, Volume2, Volume1, VolumeX, Maximize, Minimize, PictureInPicture2,
    Settings, Check, ChevronRight, ChevronLeft, SkipForward, SkipBack, Gauge,
    Sparkles, ListVideo, Keyboard, X, RotateCcw, RotateCw, Layers,
} from "lucide-react";

export interface QualityOption {
    index: number;
    label: string;
}

export interface EpisodeLink {
    label: string;
    onGo: () => void;
}

interface Props {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    /* Khối bọc cả video + thanh điều khiển → toàn màn hình vẫn thấy thanh điều khiển riêng */
    containerRef: React.RefObject<HTMLDivElement | null>;
    qualities: QualityOption[];
    selectedQuality: number;
    onQualityChange: (idx: number) => void;
    /* Mốc thời gian vừa được khôi phục từ lần xem trước (giây), null nếu xem từ đầu */
    resumeFrom: number | null;
    onDismissResume: () => void;
    title?: string;
    subtitle?: string;
    prevEpisode?: EpisodeLink | null;
    nextEpisode?: EpisodeLink | null;
    ambientAvailable: boolean;
    ambient: boolean;
    onAmbientChange: (on: boolean) => void;
}

const SKIP = 10;
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const HIDE_DELAY = 2600;
const DOUBLE_TAP_MS = 300;
const HOLD_MS = 450;
const HOLD_RATE = 2;
const AUTO_NEXT_SECONDS = 6;
const PREFS_KEY = "player-prefs";
/* Đọc ở HlsPlayerWithFilter: vừa bấm chuyển tập → tập mới tự phát, không bắt bấm "Nhấn để xem" lại */
export const AUTOPLAY_FLAG = "player-autoplay";

type SkipFlash = { kind: "back" | "fwd"; amount: number; id: number };
type Hud = { icon: "volume" | "mute" | "speed"; text: string; ratio?: number; id: number };
type Menu = null | "main" | "speed" | "quality";

function fmt(t: number) {
    if (!isFinite(t) || t < 0) t = 0;
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = String(Math.floor(t % 60)).padStart(2, "0");
    return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

const speedLabel = (r: number) => (r === 1 ? "Bình thường" : `${r}x`);

/* Bấm chuột vào nút không giữ focus → phím Space không "bấm lại" nút vừa click mà vẫn phát/dừng video */
const noFocus = (e: React.PointerEvent) => { if (e.pointerType === "mouse") e.preventDefault(); };

const SHORTCUTS: [string, string][] = [
    ["Space / K", "Phát / tạm dừng"],
    ["← / J", "Lùi 10 giây"],
    ["→ / L", "Tua 10 giây"],
    ["↑ / ↓", "Tăng / giảm âm lượng"],
    ["M", "Tắt / bật tiếng"],
    ["F", "Toàn màn hình"],
    ["< / >", "Giảm / tăng tốc độ"],
    ["0 – 9", "Nhảy tới 0% – 90%"],
    ["Shift + N", "Tập tiếp theo"],
    ["Giữ chuột / giữ tay", "Tua nhanh 2x"],
    ["?", "Bảng phím tắt"],
];

export default function PlayerControls({
    videoRef, containerRef, qualities, selectedQuality, onQualityChange, resumeFrom, onDismissResume,
    title, subtitle, prevEpisode, nextEpisode, ambientAvailable, ambient, onAmbientChange,
}: Props) {
    const [playing,    setPlaying]    = useState(false);
    const [started,    setStarted]    = useState(false);
    const [current,    setCurrent]    = useState(0);
    const [duration,   setDuration]   = useState(0);
    const [buffered,   setBuffered]   = useState(0);
    const [volume,     setVolume]     = useState(1);
    const [muted,      setMuted]      = useState(false);
    const [rate,       setRate]       = useState(1);
    const [waiting,    setWaiting]    = useState(false);
    const [fullscreen, setFullscreen] = useState(false);
    const [pipOk,      setPipOk]      = useState(false);
    const [visible,    setVisible]    = useState(true);
    const [menu,       setMenu]       = useState<Menu>(null);
    const [menuDir,    setMenuDir]    = useState<"in" | "back">("in");
    const [scrub,      setScrub]      = useState<number | null>(null);   // tỉ lệ 0..1 khi đang kéo
    const [hover,      setHover]      = useState<number | null>(null);   // tỉ lệ 0..1 dưới con trỏ
    const [skipFlash,  setSkipFlash]  = useState<SkipFlash | null>(null);
    const [playFlash,  setPlayFlash]  = useState<{ kind: "play" | "pause"; id: number } | null>(null);
    const [hud,        setHud]        = useState<Hud | null>(null);
    const [holdFast,   setHoldFast]   = useState(false);
    const [showHelp,   setShowHelp]   = useState(false);
    const [endCard,    setEndCard]    = useState(false);
    const [autoNext,   setAutoNext]   = useState(true);

    const barRef      = useRef<HTMLDivElement>(null);
    const hideTimer   = useRef(0);
    const tapTimer    = useRef(0);
    const pressTimer  = useRef(0);
    const lastTap     = useRef(0);
    const lastPointer = useRef("mouse");
    const holding     = useRef(false);
    const holdPrevRate = useRef(1);
    const skipAcc     = useRef({ kind: "", amount: 0, at: 0 });
    const autoNextRef = useRef(autoNext);
    autoNextRef.current = autoNext;
    const nextRef = useRef(nextEpisode);
    nextRef.current = nextEpisode;

    const shown = visible || !playing || menu !== null || scrub !== null || endCard || showHelp;
    const shownRef = useRef(shown);
    shownRef.current = shown;
    const menuRef = useRef(menu);
    menuRef.current = menu;

    /* ── Đồng bộ trạng thái từ thẻ <video> ── */
    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;

        /* Khôi phục âm lượng, tốc độ, tự chuyển tập của lần trước */
        try {
            const p = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
            if (typeof p.volume === "number") v.volume = p.volume;
            if (typeof p.muted === "boolean") v.muted = p.muted;
            /* defaultPlaybackRate: đổi chất lượng = nạp nguồn mới, trình duyệt reset tốc độ về giá trị này */
            if (typeof p.rate === "number") { v.defaultPlaybackRate = p.rate; v.playbackRate = p.rate; }
            if (typeof p.autoNext === "boolean") setAutoNext(p.autoNext);
        } catch {}

        const sync = () => {
            setPlaying(!v.paused);
            if (!v.paused) setStarted(true);
            setCurrent(v.currentTime);
            setDuration(isFinite(v.duration) ? v.duration : 0);
            setVolume(v.volume);
            setMuted(v.muted);
            setRate(v.playbackRate);
        };
        const onBuffer = () => {
            const b = v.buffered;
            let end = 0;
            for (let i = 0; i < b.length; i++) {
                if (b.start(i) <= v.currentTime + 0.5 && b.end(i) >= v.currentTime) end = b.end(i);
            }
            setBuffered(end);
        };
        const savePrefs = () => {
            if (holding.current) return; /* tốc độ 2x lúc giữ tay chỉ là tạm thời */
            try {
                const prev = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
                localStorage.setItem(PREFS_KEY, JSON.stringify({ ...prev, volume: v.volume, muted: v.muted, rate: v.playbackRate }));
            } catch {}
        };
        const onWaiting = () => setWaiting(true);
        const onReady   = () => setWaiting(false);
        const onPlay    = () => setEndCard(false);
        const onEnded   = () => { if (nextRef.current) setEndCard(true); };

        const syncEvents = ["play", "pause", "timeupdate", "durationchange", "loadedmetadata", "volumechange", "ratechange"];
        const readyEvents = ["playing", "canplay", "pause", "seeked"];
        syncEvents.forEach(ev => v.addEventListener(ev, sync));
        readyEvents.forEach(ev => v.addEventListener(ev, onReady));
        v.addEventListener("progress", onBuffer);
        v.addEventListener("timeupdate", onBuffer);
        v.addEventListener("volumechange", savePrefs);
        v.addEventListener("ratechange", savePrefs);
        v.addEventListener("waiting", onWaiting);
        v.addEventListener("play", onPlay);
        v.addEventListener("ended", onEnded);

        sync();
        setPipOk(!!document.pictureInPictureEnabled);

        return () => {
            syncEvents.forEach(ev => v.removeEventListener(ev, sync));
            readyEvents.forEach(ev => v.removeEventListener(ev, onReady));
            v.removeEventListener("progress", onBuffer);
            v.removeEventListener("timeupdate", onBuffer);
            v.removeEventListener("volumechange", savePrefs);
            v.removeEventListener("ratechange", savePrefs);
            v.removeEventListener("waiting", onWaiting);
            v.removeEventListener("play", onPlay);
            v.removeEventListener("ended", onEnded);
        };
    }, [videoRef]);

    /* ── Hiện thanh điều khiển, tự ẩn sau HIDE_DELAY nếu đang phát ── */
    const poke = useCallback(() => {
        setVisible(true);
        clearTimeout(hideTimer.current);
        hideTimer.current = window.setTimeout(() => {
            const v = videoRef.current;
            if (v && !v.paused && !menuRef.current) setVisible(false);
        }, HIDE_DELAY);
    }, [videoRef]);

    useEffect(() => { if (playing) poke(); }, [playing, poke]);

    useEffect(() => () => {
        clearTimeout(hideTimer.current);
        clearTimeout(tapTimer.current);
        clearTimeout(pressTimer.current);
    }, []);

    /* Các hiệu ứng tạm thời tự tắt */
    useEffect(() => {
        if (!skipFlash) return;
        const t = setTimeout(() => setSkipFlash(null), 750);
        return () => clearTimeout(t);
    }, [skipFlash]);
    useEffect(() => {
        if (!playFlash) return;
        const t = setTimeout(() => setPlayFlash(null), 600);
        return () => clearTimeout(t);
    }, [playFlash]);
    useEffect(() => {
        if (!hud) return;
        const t = setTimeout(() => setHud(null), 900);
        return () => clearTimeout(t);
    }, [hud]);
    useEffect(() => {
        if (resumeFrom === null) return;
        const t = setTimeout(onDismissResume, 7000);
        return () => clearTimeout(t);
    }, [resumeFrom, onDismissResume]);

    /* ── Hành động ── */
    const togglePlay = useCallback(() => {
        const v = videoRef.current;
        if (!v) return;
        if (v.paused) { v.play().catch(() => {}); setPlayFlash({ kind: "play", id: Date.now() }); }
        else { v.pause(); setPlayFlash({ kind: "pause", id: Date.now() }); }
    }, [videoRef]);

    const skip = useCallback((delta: number) => {
        const v = videoRef.current;
        if (!v) return;
        const max = isFinite(v.duration) ? v.duration : Infinity;
        v.currentTime = Math.min(Math.max(v.currentTime + delta, 0), max);
        /* Bấm liên tục → cộng dồn: 10 → 20 → 30 giây */
        const now = Date.now();
        const kind = delta < 0 ? "back" : "fwd";
        const acc = skipAcc.current;
        if (acc.kind === kind && now - acc.at < 800) acc.amount += Math.abs(delta);
        else { acc.kind = kind; acc.amount = Math.abs(delta); }
        acc.at = now;
        setSkipFlash({ kind, amount: acc.amount, id: now });
    }, [videoRef]);

    const changeVolume = useCallback((val: number, showHud = false) => {
        const v = videoRef.current;
        if (!v) return;
        v.volume = val;
        v.muted = val === 0;
        if (showHud) setHud({ icon: val === 0 ? "mute" : "volume", text: `${Math.round(val * 100)}%`, ratio: val, id: Date.now() });
    }, [videoRef]);

    const toggleMute = useCallback((showHud = false) => {
        const v = videoRef.current;
        if (!v) return;
        if (v.muted || v.volume === 0) { v.muted = false; if (v.volume === 0) v.volume = 0.5; }
        else v.muted = true;
        if (showHud) setHud(v.muted
            ? { icon: "mute", text: "Đã tắt tiếng", id: Date.now() }
            : { icon: "volume", text: `${Math.round(v.volume * 100)}%`, ratio: v.volume, id: Date.now() });
    }, [videoRef]);

    const changeRate = useCallback((r: number, showHud = false) => {
        const v = videoRef.current;
        if (!v) return;
        v.defaultPlaybackRate = r;
        v.playbackRate = r;
        if (showHud) setHud({ icon: "speed", text: speedLabel(r), id: Date.now() });
    }, [videoRef]);

    const changeAutoNext = useCallback((on: boolean) => {
        setAutoNext(on);
        try {
            const prev = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
            localStorage.setItem(PREFS_KEY, JSON.stringify({ ...prev, autoNext: on }));
        } catch {}
    }, []);

    const goEpisode = useCallback((ep?: EpisodeLink | null) => {
        if (!ep) return;
        try { sessionStorage.setItem(AUTOPLAY_FLAG, "1"); } catch {}
        ep.onGo();
    }, []);

    const toggleFullscreen = useCallback(async () => {
        const el = containerRef.current;
        const v  = videoRef.current;
        if (document.fullscreenElement) {
            await document.exitFullscreen().catch(() => {});
            return;
        }
        if (el?.requestFullscreen) {
            await el.requestFullscreen().catch(() => {});
            /* Điện thoại: xoay ngang khi toàn màn hình (trình duyệt không hỗ trợ thì bỏ qua) */
            const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
            orientation?.lock?.("landscape").catch(() => {});
        } else {
            /* iPhone không cho khối div toàn màn hình → dùng trình phát gốc của iOS */
            (v as HTMLVideoElement & { webkitEnterFullscreen?: () => void } | null)?.webkitEnterFullscreen?.();
        }
    }, [containerRef, videoRef]);

    const togglePip = useCallback(async () => {
        const v = videoRef.current;
        if (!v) return;
        try {
            if (document.pictureInPictureElement) await document.exitPictureInPicture();
            else await v.requestPictureInPicture();
        } catch {}
    }, [videoRef]);

    useEffect(() => {
        const onChange = () => setFullscreen(!!document.fullscreenElement && document.fullscreenElement === containerRef.current);
        document.addEventListener("fullscreenchange", onChange);
        return () => document.removeEventListener("fullscreenchange", onChange);
    }, [containerRef]);

    const openMenu = (m: Menu, dir: "in" | "back" = "in") => { setMenuDir(dir); setMenu(m); };

    /* ── Phím tắt ── */
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            const t = e.target as HTMLElement | null;
            if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
            /* Đang focus nút bằng bàn phím (Tab) thì Space/Enter là bấm nút đó */
            if (t?.tagName === "BUTTON" && (e.key === " " || e.key === "Enter")) return;
            const v = videoRef.current;
            if (!v) return;

            if (e.key === "Escape") {
                if (showHelp || menuRef.current) { setShowHelp(false); setMenu(null); }
                return;
            }
            if (e.key === "?") { setShowHelp(s => !s); return; }
            if (e.shiftKey && e.key.toLowerCase() === "n") { goEpisode(nextRef.current); return; }
            if (/^[0-9]$/.test(e.key) && isFinite(v.duration)) {
                v.currentTime = (Number(e.key) / 10) * v.duration;
                poke();
                return;
            }

            const idx = SPEEDS.indexOf(v.playbackRate);
            switch (e.key.toLowerCase()) {
                case " ": case "k":          e.preventDefault(); togglePlay(); break;
                case "arrowleft": case "j":  e.preventDefault(); skip(-SKIP); break;
                case "arrowright": case "l": e.preventDefault(); skip(SKIP); break;
                case "arrowup":              e.preventDefault(); changeVolume(Math.min(1, +(v.volume + 0.05).toFixed(2)), true); break;
                case "arrowdown":            e.preventDefault(); changeVolume(Math.max(0, +(v.volume - 0.05).toFixed(2)), true); break;
                case "m":                    toggleMute(true); break;
                case "f":                    toggleFullscreen(); break;
                case ">":                    changeRate(SPEEDS[Math.min(SPEEDS.length - 1, (idx < 0 ? 2 : idx) + 1)], true); break;
                case "<":                    changeRate(SPEEDS[Math.max(0, (idx < 0 ? 2 : idx) - 1)], true); break;
                default: return;
            }
            poke();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [videoRef, togglePlay, skip, changeVolume, toggleMute, changeRate, toggleFullscreen, goEpisode, poke, showHelp]);

    /* ── Chạm/click vào vùng video ──
       Chuột: click = phát/dừng, double-click = toàn màn hình.
       Cảm ứng: chạm 1 lần = hiện/ẩn thanh điều khiển, chạm 2 lần bên trái/phải = tua 10 giây.
       Giữ chuột/giữ tay khi đang phát = tua nhanh 2x, thả ra trở lại bình thường. */
    const endHold = () => {
        clearTimeout(pressTimer.current);
        if (!holding.current) return false;
        holding.current = false;
        const v = videoRef.current;
        if (v) v.playbackRate = holdPrevRate.current;
        setHoldFast(false);
        return true;
    };

    const onSurfacePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        if (menu || showHelp) return;
        clearTimeout(pressTimer.current);
        pressTimer.current = window.setTimeout(() => {
            const v = videoRef.current;
            if (!v || v.paused) return;
            holding.current = true;
            holdPrevRate.current = v.playbackRate;
            v.playbackRate = HOLD_RATE;
            setHoldFast(true);
        }, HOLD_MS);
    };

    const onSurfacePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        lastPointer.current = e.pointerType;
        if (endHold()) return;
        if (showHelp) { setShowHelp(false); return; }
        if (menu) { setMenu(null); return; }

        if (e.pointerType === "mouse") {
            if (e.button !== 0) return;
            togglePlay();
            poke();
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const side = x < 0.35 ? -1 : x > 0.65 ? 1 : 0;
        const now = Date.now();

        if (side !== 0 && now - lastTap.current < DOUBLE_TAP_MS) {
            clearTimeout(tapTimer.current);
            lastTap.current = now;
            skip(side * SKIP);
            poke();
            return;
        }
        lastTap.current = now;
        clearTimeout(tapTimer.current);
        tapTimer.current = window.setTimeout(() => {
            const v = videoRef.current;
            if (shownRef.current && v && !v.paused) { clearTimeout(hideTimer.current); setVisible(false); }
            else poke();
        }, DOUBLE_TAP_MS);
    };

    const onSurfaceDoubleClick = () => {
        if (lastPointer.current === "mouse") toggleFullscreen();
    };

    /* ── Thanh tiến trình ── */
    const ratioAt = (clientX: number) => {
        const r = barRef.current?.getBoundingClientRect();
        if (!r || r.width === 0) return 0;
        return Math.min(Math.max((clientX - r.left) / r.width, 0), 1);
    };
    const onBarDown = (e: React.PointerEvent<HTMLDivElement>) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        const ratio = ratioAt(e.clientX);
        setScrub(ratio);
        setHover(ratio);
    };
    const onBarMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const ratio = ratioAt(e.clientX);
        setHover(ratio);
        if (scrub !== null) setScrub(ratio);
    };
    const onBarUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (scrub === null) return;
        const v = videoRef.current;
        const ratio = ratioAt(e.clientX);
        if (v && duration) v.currentTime = ratio * duration;
        setScrub(null);
        if (e.pointerType !== "mouse") setHover(null);
    };

    const progress = scrub ?? (duration ? current / duration : 0);
    const bufferedRatio = duration ? Math.min(buffered / duration, 1) : 0;
    const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
    const qualityLabel = qualities.find(q => q.index === selectedQuality)?.label ?? "Tự động";
    const remaining = Math.max(duration - progress * duration, 0);

    const btn = "pc-btn relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full text-white/90";

    return (
        <div
            className={`pc-layer absolute inset-0 z-30 select-none ${shown ? "" : "cursor-none"}`}
            /* Chỉ chuột thật: sau khi chạm, điện thoại bắn thêm mousemove giả → sẽ phá thao tác chạm để ẩn/hiện */
            onPointerMove={e => { if (e.pointerType === "mouse") poke(); }}
            onPointerLeave={e => {
                if (e.pointerType !== "mouse") return;
                const v = videoRef.current;
                if (v && !v.paused && !menu) setVisible(false);
            }}
        >
            {/* Vùng bấm phía trên video */}
            <div
                className="absolute inset-0"
                style={{ touchAction: "manipulation", WebkitTouchCallout: "none" }}
                onPointerDown={onSurfacePointerDown}
                onPointerUp={onSurfacePointerUp}
                onPointerCancel={endHold}
                onPointerLeave={endHold}
                onDoubleClick={onSurfaceDoubleClick}
                onContextMenu={e => e.preventDefault()}
            />

            {/* ── Thanh trên: tên phim ── */}
            <div className={`pc-top absolute inset-x-0 top-0 flex items-start justify-between gap-3 px-4 sm:px-5 pt-3 sm:pt-4 pb-10 pointer-events-none ${shown ? "pc-show" : ""}`}>
                <div className="min-w-0">
                    {title && <p className="text-white font-bold text-[13px] sm:text-[15px] truncate drop-shadow" dangerouslySetInnerHTML={{ __html: title }} />}
                    {subtitle && <p className="text-[#22d3a5] text-[11px] sm:text-[12px] font-semibold mt-0.5 truncate">{subtitle}</p>}
                </div>
                <button
                    onPointerDown={noFocus}
                    onClick={() => setShowHelp(true)}
                    className={`${btn} pc-tip pc-tip-left hidden sm:flex shrink-0 ${shown ? "pointer-events-auto" : ""}`}
                    data-tip="Phím tắt (?)"
                    aria-label="Phím tắt"
                >
                    <Keyboard className="w-[18px] h-[18px]" />
                </button>
            </div>

            {/* Đang tải đoạn video tiếp theo */}
            {waiting && playing && !holdFast && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <svg className="pc-spin w-14 h-14" viewBox="0 0 50 50" aria-hidden>
                        <defs>
                            <linearGradient id="pcSpin" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#22d3a5" />
                                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <circle cx="25" cy="25" r="20" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="4" />
                        <circle cx="25" cy="25" r="20" fill="none" stroke="url(#pcSpin)" strokeWidth="4" strokeLinecap="round" strokeDasharray="90 200" />
                    </svg>
                </div>
            )}

            {/* Nút phát lớn giữa màn hình khi đang dừng */}
            {started && !playing && !endCard && scrub === null && !showHelp && (
                <button
                    onPointerDown={noFocus}
                    onClick={togglePlay}
                    aria-label="Phát"
                    className="pc-bigplay absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-[#041a11]"
                >
                    <span className="pc-bigplay-ring absolute inset-0 rounded-full" />
                    <Play className="relative w-7 h-7 sm:w-8 sm:h-8 translate-x-[2px]" fill="currentColor" />
                </button>
            )}

            {/* Hiệu ứng tua (2 bên) — bấm liên tục thì số giây cộng dồn */}
            {skipFlash && (
                <div
                    key={skipFlash.id}
                    className={`pc-ripple absolute top-0 bottom-0 w-[40%] flex items-center justify-center pointer-events-none ${skipFlash.kind === "back" ? "left-0 rounded-r-[50%]" : "right-0 rounded-l-[50%]"}`}
                >
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-black/45 backdrop-blur-sm border border-white/10 flex flex-col items-center justify-center gap-1.5 text-white">
                        <div className={`flex ${skipFlash.kind === "back" ? "flex-row-reverse" : ""}`}>
                            {[0, 1, 2].map(i => (
                                <svg key={i} className="pc-chev w-5 h-5" style={{ animationDelay: `${i * 0.12}s` }} viewBox="0 0 24 24" fill="currentColor">
                                    <path d={skipFlash.kind === "back" ? "M16 5v14L5 12z" : "M8 5v14l11-7z"} />
                                </svg>
                            ))}
                        </div>
                        <span key={skipFlash.amount} className="pc-pop-num text-[14px] font-extrabold tracking-wide">
                            {skipFlash.kind === "back" ? "−" : "+"}{skipFlash.amount} giây
                        </span>
                    </div>
                </div>
            )}

            {/* Hiệu ứng phát/dừng (giữa) */}
            {playFlash && (
                <div key={playFlash.id} className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="pc-pop w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white">
                        {playFlash.kind === "play" ? <Play className="w-7 h-7 translate-x-[2px]" fill="currentColor" /> : <Pause className="w-7 h-7" fill="currentColor" />}
                    </div>
                </div>
            )}

            {/* HUD âm lượng / tốc độ */}
            {hud && (
                <div key={hud.id} className="pc-hud absolute left-1/2 top-[14%] -translate-x-1/2 flex items-center gap-2.5 px-4 py-2 rounded-full bg-black/65 backdrop-blur-md border border-white/10 text-white pointer-events-none">
                    {hud.icon === "speed" ? <Gauge className="w-4 h-4 text-[#22d3a5]" /> : hud.icon === "mute" ? <VolumeX className="w-4 h-4 text-[#22d3a5]" /> : <Volume2 className="w-4 h-4 text-[#22d3a5]" />}
                    {hud.ratio !== undefined && (
                        <div className="w-20 h-1 rounded-full bg-white/20 overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-[#10b981] to-[#38bdf8] transition-[width] duration-150" style={{ width: `${hud.ratio * 100}%` }} />
                        </div>
                    )}
                    <span className="text-[12px] font-bold tabular-nums">{hud.text}</span>
                </div>
            )}

            {/* Đang giữ để tua nhanh */}
            {holdFast && (
                <div className="pc-hud absolute left-1/2 top-4 -translate-x-1/2 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/65 backdrop-blur-md border border-white/10 text-white text-[12px] font-bold pointer-events-none">
                    {HOLD_RATE}x
                    <span className="flex">
                        {[0, 1].map(i => (
                            <svg key={i} className="pc-chev w-3 h-3" style={{ animationDelay: `${i * 0.15}s` }} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                        ))}
                    </span>
                </div>
            )}

            {/* Tiếp tục xem từ lần trước */}
            {resumeFrom !== null && (
                <div className="pc-slide-left absolute left-3 sm:left-4 bottom-[92px] sm:bottom-[104px] z-10 flex items-center gap-2 pl-3.5 pr-1.5 py-1.5 rounded-full bg-black/70 border border-white/10 text-[12px] text-white/85 backdrop-blur-md">
                    <RotateCcw className="w-3.5 h-3.5 text-[#22d3a5]" />
                    <span>Tiếp tục từ <b className="text-white tabular-nums">{fmt(resumeFrom)}</b></span>
                    <button
                        onPointerDown={noFocus}
                        onClick={() => { const v = videoRef.current; if (v) v.currentTime = 0; onDismissResume(); }}
                        className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-[#22d3a5] hover:text-[#041a11] text-white font-semibold transition-colors"
                    >
                        Xem từ đầu
                    </button>
                </div>
            )}

            {/* Hết tập → tập tiếp theo */}
            {endCard && nextEpisode && (
                <div className="pc-endcard absolute right-3 sm:right-5 bottom-[92px] sm:bottom-[104px] z-10 w-[260px] max-w-[calc(100%-24px)] p-3.5 rounded-2xl bg-[#0a0c14]/90 backdrop-blur-md border border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.6)]">
                    <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-white/40">Tập tiếp theo</p>
                    <p className="text-white font-bold text-[14px] mt-1 truncate">{nextEpisode.label}</p>
                    <div className="flex items-center gap-2 mt-3">
                        <button
                            onPointerDown={noFocus}
                            onClick={() => goEpisode(nextEpisode)}
                            className="relative flex-1 flex items-center justify-center gap-2 h-9 rounded-xl bg-gradient-to-r from-[#22d3a5] to-[#10b981] text-[#041a11] text-[12px] font-extrabold overflow-hidden hover:brightness-110 active:scale-[0.98] transition"
                        >
                            {autoNext && (
                                <svg className="w-5 h-5 -rotate-90" viewBox="0 0 24 24" aria-hidden>
                                    <circle cx="12" cy="12" r="9" fill="none" stroke="rgba(4,26,17,0.25)" strokeWidth="2.5" />
                                    <circle
                                        className="pc-countdown"
                                        cx="12" cy="12" r="9" fill="none" stroke="#041a11" strokeWidth="2.5" strokeLinecap="round"
                                        strokeDasharray="56.55" style={{ animationDuration: `${AUTO_NEXT_SECONDS}s` }}
                                        onAnimationEnd={() => { if (autoNextRef.current) goEpisode(nextRef.current); }}
                                    />
                                </svg>
                            )}
                            <SkipForward className="w-4 h-4" fill="currentColor" />
                            Xem ngay
                        </button>
                        <button
                            onPointerDown={noFocus}
                            onClick={() => setEndCard(false)}
                            className="h-9 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 text-[12px] font-semibold transition-colors"
                        >
                            Huỷ
                        </button>
                    </div>
                </div>
            )}

            {/* ── Thanh điều khiển dưới ── */}
            <div className={`pc-bottom absolute inset-x-0 bottom-0 px-2 sm:px-4 pb-1.5 sm:pb-2.5 pt-14 ${shown ? "pc-show" : ""}`}>
                {/* Thanh tiến trình */}
                <div
                    ref={barRef}
                    role="slider"
                    aria-label="Tua video"
                    aria-valuemin={0}
                    aria-valuemax={Math.round(duration)}
                    aria-valuenow={Math.round(progress * duration)}
                    aria-valuetext={`${fmt(progress * duration)} / ${fmt(duration)}`}
                    className={`pc-bar group/bar relative h-6 flex items-center cursor-pointer touch-none ${scrub !== null ? "pc-bar-active" : ""}`}
                    onPointerDown={onBarDown}
                    onPointerMove={onBarMove}
                    onPointerUp={onBarUp}
                    onPointerCancel={() => { setScrub(null); setHover(null); }}
                    onPointerLeave={() => { if (scrub === null) setHover(null); }}
                >
                    <div className="pc-track relative w-full rounded-full bg-white/15">
                        <div className="absolute inset-y-0 left-0 rounded-full bg-white/30 transition-[width] duration-300" style={{ width: `${bufferedRatio * 100}%` }} />
                        {hover !== null && (
                            <div className="absolute inset-y-0 left-0 rounded-full bg-white/20" style={{ width: `${hover * 100}%` }} />
                        )}
                        <div
                            className={`pc-fill absolute inset-y-0 left-0 rounded-full ${waiting && playing ? "pc-fill-wait" : ""}`}
                            style={{ width: `${progress * 100}%` }}
                        />
                        <div className="pc-knob absolute top-1/2 rounded-full" style={{ left: `${progress * 100}%` }} />
                    </div>
                    {hover !== null && duration > 0 && (
                        <div
                            className="pc-tooltip absolute bottom-full mb-2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-[#0a0c14]/95 border border-white/10 text-white text-[11.5px] font-bold tabular-nums pointer-events-none shadow-lg"
                            style={{ left: `clamp(28px, ${hover * 100}%, calc(100% - 28px))` }}
                        >
                            {fmt(hover * duration)}
                        </div>
                    )}
                </div>

                {/* Hàng nút */}
                <div className="flex items-center gap-0.5 sm:gap-1">
                    <button onPointerDown={noFocus} onClick={togglePlay} className={`${btn} pc-tip`} data-tip={playing ? "Tạm dừng (K)" : "Phát (K)"} aria-label={playing ? "Tạm dừng" : "Phát"}>
                        <span className="pc-icon-swap relative w-5 h-5">
                            <Pause className={`absolute inset-0 w-5 h-5 ${playing ? "pc-in" : "pc-out"}`} fill="currentColor" />
                            <Play className={`absolute inset-0 w-5 h-5 translate-x-[1px] ${playing ? "pc-out" : "pc-in"}`} fill="currentColor" />
                        </span>
                    </button>

                    {prevEpisode && (
                        <button onPointerDown={noFocus} onClick={() => goEpisode(prevEpisode)} className={`${btn} pc-tip hidden sm:flex`} data-tip={`Tập trước: ${prevEpisode.label}`} aria-label="Tập trước">
                            <SkipBack className="w-[18px] h-[18px]" fill="currentColor" />
                        </button>
                    )}
                    {nextEpisode && (
                        <button onPointerDown={noFocus} onClick={() => goEpisode(nextEpisode)} className={`${btn} pc-tip`} data-tip={`Tập tiếp: ${nextEpisode.label} (Shift+N)`} aria-label="Tập tiếp theo">
                            <SkipForward className="w-[18px] h-[18px]" fill="currentColor" />
                        </button>
                    )}

                    <button onPointerDown={noFocus} onClick={() => skip(-SKIP)} className={`${btn} pc-tip pc-spin-l`} data-tip="Lùi 10 giây (←)" aria-label="Lùi 10 giây">
                        <RotateCcw className="pc-rot w-[22px] h-[22px]" strokeWidth={1.8} />
                        <span className="absolute text-[8px] font-extrabold mt-[1px]">{SKIP}</span>
                    </button>
                    <button onPointerDown={noFocus} onClick={() => skip(SKIP)} className={`${btn} pc-tip pc-spin-r`} data-tip="Tua 10 giây (→)" aria-label="Tua 10 giây">
                        <RotateCw className="pc-rot w-[22px] h-[22px]" strokeWidth={1.8} />
                        <span className="absolute text-[8px] font-extrabold mt-[1px]">{SKIP}</span>
                    </button>

                    {/* Âm lượng: thanh trượt chỉ hiện trên máy tính, điện thoại dùng nút cứng */}
                    <div className="group/vol flex items-center">
                        <button onPointerDown={noFocus} onClick={() => toggleMute()} className={`${btn} pc-tip`} data-tip="Tắt tiếng (M)" aria-label="Tắt/bật tiếng">
                            <VolumeIcon className="w-5 h-5" />
                        </button>
                        <div className="pc-vol hidden sm:flex items-center overflow-hidden">
                            <input
                                type="range" min={0} max={1} step={0.05}
                                value={muted ? 0 : volume}
                                onChange={e => changeVolume(Number(e.target.value))}
                                aria-label="Âm lượng"
                                className="pc-range w-20 mx-1.5"
                                style={{ "--pc-val": `${(muted ? 0 : volume) * 100}%` } as React.CSSProperties}
                            />
                        </div>
                    </div>

                    <span className="ml-1 sm:ml-2 text-[11px] sm:text-[12.5px] text-white/90 tabular-nums whitespace-nowrap font-medium">
                        {fmt(progress * duration)}
                        <span className="text-white/35"> / {fmt(duration)}</span>
                        {duration > 0 && <span className="hidden md:inline text-white/35"> · còn {fmt(remaining)}</span>}
                    </span>

                    <div className="flex-1" />

                    {rate !== 1 && (
                        <span className="pc-badge mr-0.5 px-2 py-0.5 rounded-full bg-[#22d3a5]/15 border border-[#22d3a5]/30 text-[#22d3a5] text-[10.5px] font-extrabold tabular-nums">
                            {rate}x
                        </span>
                    )}

                    {/* Cài đặt */}
                    <div className="relative">
                        <button
                            onPointerDown={noFocus}
                            onClick={() => (menu ? setMenu(null) : openMenu("main"))}
                            className={`${btn} ${menu ? "" : "pc-tip"}`}
                            data-tip="Cài đặt"
                            aria-label="Cài đặt"
                            aria-expanded={menu !== null}
                        >
                            <Settings className={`w-5 h-5 transition-transform duration-500 ${menu ? "rotate-[120deg] text-[#22d3a5]" : ""}`} />
                        </button>
                        {menu && (
                            <div
                                className="pc-menu absolute bottom-full right-0 mb-3 w-[250px] rounded-2xl overflow-hidden bg-[#0a0c14]/[0.94] backdrop-blur-xl border border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.7)]"
                                onPointerUp={e => e.stopPropagation()}
                            >
                                <div key={menu} className={menuDir === "in" ? "pc-page-in" : "pc-page-back"}>
                                    {menu === "main" && (
                                        <div className="py-1.5">
                                            <MenuRow icon={<Gauge className="w-4 h-4" />} label="Tốc độ phát" value={speedLabel(rate)} onClick={() => openMenu("speed")} />
                                            {qualities.length > 1 && (
                                                <MenuRow icon={<Layers className="w-4 h-4" />} label="Chất lượng" value={qualityLabel} onClick={() => openMenu("quality")} />
                                            )}
                                            {nextEpisode !== undefined && (
                                                <MenuToggle icon={<ListVideo className="w-4 h-4" />} label="Tự chuyển tập" on={autoNext} onChange={changeAutoNext} />
                                            )}
                                            {ambientAvailable && (
                                                <MenuToggle icon={<Sparkles className="w-4 h-4" />} label="Hiệu ứng Ambient" on={ambient} onChange={onAmbientChange} />
                                            )}
                                        </div>
                                    )}
                                    {menu === "speed" && (
                                        <SubMenu title="Tốc độ phát" onBack={() => openMenu("main", "back")}>
                                            {SPEEDS.map((s, i) => (
                                                <MenuItem key={s} index={i} active={s === rate} onClick={() => { changeRate(s); openMenu("main", "back"); }}>
                                                    {speedLabel(s)}
                                                </MenuItem>
                                            ))}
                                        </SubMenu>
                                    )}
                                    {menu === "quality" && (
                                        <SubMenu title="Chất lượng" onBack={() => openMenu("main", "back")}>
                                            {qualities.map((q, i) => (
                                                <MenuItem key={q.index} index={i} active={q.index === selectedQuality} onClick={() => { setMenu(null); onQualityChange(q.index); }}>
                                                    {q.label}
                                                </MenuItem>
                                            ))}
                                        </SubMenu>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {pipOk && (
                        <button onPointerDown={noFocus} onClick={togglePip} className={`${btn} pc-tip hidden sm:flex`} data-tip="Cửa sổ nổi" aria-label="Xem cửa sổ nổi">
                            <PictureInPicture2 className="w-5 h-5" />
                        </button>
                    )}
                    <button onPointerDown={noFocus} onClick={toggleFullscreen} className={`${btn} pc-tip pc-tip-left pc-grow`} data-tip={fullscreen ? "Thoát toàn màn hình (F)" : "Toàn màn hình (F)"} aria-label="Toàn màn hình">
                        {fullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* ── Bảng phím tắt ── */}
            {showHelp && (
                <div className="pc-fade absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onPointerUp={() => setShowHelp(false)}>
                    <div className="pc-scale w-full max-w-[380px] max-h-full overflow-y-auto rounded-2xl bg-[#0a0c14]/95 border border-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.7)] p-4 sm:p-5" onPointerUp={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-3">
                            <p className="flex items-center gap-2 text-white font-bold text-[14px]"><Keyboard className="w-4 h-4 text-[#22d3a5]" /> Phím tắt</p>
                            <button onPointerDown={noFocus} onClick={() => setShowHelp(false)} className="w-7 h-7 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition" aria-label="Đóng">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="space-y-1">
                            {SHORTCUTS.map(([k, d], i) => (
                                <div key={k} className="pc-row flex items-center justify-between gap-4 py-1.5 text-[12.5px]" style={{ animationDelay: `${i * 25}ms` }}>
                                    <span className="text-white/70">{d}</span>
                                    <kbd className="shrink-0 px-2 py-0.5 rounded-md bg-white/10 border border-white/15 border-b-2 text-white text-[11px] font-bold">{k}</kbd>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <style>{PLAYER_CSS}</style>
        </div>
    );
}

/* ══════════════════════════════════════════════
   MENU
══════════════════════════════════════════════ */
function MenuRow({ icon, label, value, onClick }: { icon: React.ReactNode; label: string; value: string; onClick: () => void }) {
    return (
        <button onPointerDown={noFocus} onClick={onClick} className="pc-mrow w-full flex items-center gap-3 px-3.5 py-2.5 text-[12.5px] text-white/85 hover:bg-white/[0.06] transition-colors">
            <span className="text-white/55">{icon}</span>
            <span className="flex-1 text-left">{label}</span>
            <span className="text-white/45 text-[12px]">{value}</span>
            <ChevronRight className="w-4 h-4 text-white/35" />
        </button>
    );
}

function MenuToggle({ icon, label, on, onChange }: { icon: React.ReactNode; label: string; on: boolean; onChange: (on: boolean) => void }) {
    return (
        <button onPointerDown={noFocus} onClick={() => onChange(!on)} role="switch" aria-checked={on} className="pc-mrow w-full flex items-center gap-3 px-3.5 py-2.5 text-[12.5px] text-white/85 hover:bg-white/[0.06] transition-colors">
            <span className="text-white/55">{icon}</span>
            <span className="flex-1 text-left">{label}</span>
            <span className={`relative w-9 h-5 rounded-full transition-colors duration-300 ${on ? "bg-[#22d3a5]" : "bg-white/20"}`}>
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ${on ? "translate-x-4" : ""}`} style={{ transitionTimingFunction: "cubic-bezier(0.34,1.56,0.64,1)" }} />
            </span>
        </button>
    );
}

function SubMenu({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
    return (
        <div>
            <button onPointerDown={noFocus} onClick={onBack} className="w-full flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.07] text-[12.5px] font-bold text-white hover:bg-white/[0.04] transition-colors">
                <ChevronLeft className="w-4 h-4" />
                {title}
            </button>
            <div className="py-1 max-h-[220px] overflow-y-auto">{children}</div>
        </div>
    );
}

function MenuItem({ active, index, onClick, children }: { active: boolean; index: number; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            onPointerDown={noFocus}
            onClick={onClick}
            className={`pc-mrow w-full flex items-center justify-between gap-3 px-3.5 py-2 text-[12.5px] transition-colors hover:bg-white/[0.06] ${active ? "text-[#22d3a5] font-bold" : "text-white/75"}`}
            style={{ animationDelay: `${index * 22}ms` }}
        >
            <span>{children}</span>
            {active && <Check className="pc-check w-4 h-4 shrink-0" strokeWidth={2.5} />}
        </button>
    );
}

/* ══════════════════════════════════════════════
   CSS — gom 1 chỗ, class tiền tố pc-
══════════════════════════════════════════════ */
const PLAYER_CSS = `
.pc-top, .pc-bottom {
    opacity: 0; pointer-events: none;
    transition: opacity .35s ease, transform .45s cubic-bezier(.16,1,.3,1);
}
.pc-top    { transform: translateY(-10px); background: linear-gradient(to bottom, rgba(0,0,0,.7), rgba(0,0,0,.25) 60%, transparent); }
.pc-bottom { transform: translateY(10px);  background: linear-gradient(to top, rgba(0,0,0,.88) 0%, rgba(0,0,0,.5) 50%, transparent 100%); }
.pc-top.pc-show, .pc-bottom.pc-show { opacity: 1; transform: none; }
.pc-bottom.pc-show { pointer-events: auto; }

/* Nút: phát sáng nhẹ khi rê, nhún khi bấm */
.pc-btn { transition: background-color .2s ease, color .2s ease, transform .15s ease; }
.pc-btn:hover { background: rgba(255,255,255,.12); color: #fff; }
.pc-btn:hover svg { filter: drop-shadow(0 0 6px rgba(34,211,165,.55)); }
.pc-btn:active { transform: scale(.88); }
.pc-spin-l:active .pc-rot { transform: rotate(-60deg); }
.pc-spin-r:active .pc-rot { transform: rotate(60deg); }
.pc-rot { transition: transform .25s cubic-bezier(.34,1.56,.64,1); }
.pc-grow:hover svg { transform: scale(1.15); transition: transform .2s ease; }

/* Tooltip của nút (chỉ máy tính có chuột) */
@media (hover: hover) {
    .pc-tip::after {
        content: attr(data-tip);
        position: absolute; bottom: calc(100% + 10px); left: 50%;
        transform: translate(-50%, 6px) scale(.92);
        padding: 5px 9px; border-radius: 8px; white-space: nowrap;
        background: rgba(10,12,20,.95); border: 1px solid rgba(255,255,255,.1);
        color: #fff; font-size: 11px; font-weight: 600;
        opacity: 0; pointer-events: none;
        transition: opacity .18s ease, transform .22s cubic-bezier(.16,1,.3,1);
    }
    .pc-top .pc-tip::after { bottom: auto; top: calc(100% + 8px); transform: translate(-50%, -6px) scale(.92); }
    .pc-tip-left::after { left: auto; right: 0; transform: translate(0, 6px) scale(.92); }
    .pc-top .pc-tip-left::after { transform: translate(0, -6px) scale(.92); }
    .pc-tip:hover::after { opacity: 1; transform: translate(-50%, 0) scale(1); }
    .pc-tip-left:hover::after { transform: translate(0, 0) scale(1); }
}

/* Đổi icon phát/dừng: xoay + phóng */
.pc-icon-swap svg { transition: opacity .25s ease, transform .35s cubic-bezier(.34,1.56,.64,1); }
.pc-icon-swap .pc-in  { opacity: 1; transform: none; }
.pc-icon-swap .pc-out { opacity: 0; transform: scale(.4) rotate(-90deg); }

/* Thanh tiến trình */
.pc-track { height: 3px; transition: height .2s cubic-bezier(.16,1,.3,1); }
.pc-bar:hover .pc-track, .pc-bar-active .pc-track { height: 6px; }
.pc-fill {
    background: linear-gradient(90deg, #10b981, #22d3a5 55%, #38bdf8);
    box-shadow: 0 0 12px rgba(34,211,165,.55);
}
.pc-fill-wait {
    background: linear-gradient(90deg, #10b981, #22d3a5, #38bdf8, #22d3a5, #10b981);
    background-size: 200% 100%;
    animation: pcShimmer 1.2s linear infinite;
}
.pc-knob {
    width: 14px; height: 14px; margin: -7px 0 0 -7px;
    background: #fff; box-shadow: 0 0 0 4px rgba(34,211,165,.35), 0 0 16px rgba(34,211,165,.8);
    transform: scale(0); transition: transform .22s cubic-bezier(.34,1.56,.64,1);
}
.pc-bar:hover .pc-knob { transform: scale(1); }
.pc-bar-active .pc-knob { transform: scale(1.25); }
.pc-tooltip { animation: pcTipIn .18s cubic-bezier(.16,1,.3,1); }

/* Thanh âm lượng mở ra khi rê vào nút loa */
.pc-vol { max-width: 0; opacity: 0; transition: max-width .35s cubic-bezier(.16,1,.3,1), opacity .25s ease; }
.group\\/vol:hover .pc-vol, .pc-vol:focus-within { max-width: 110px; opacity: 1; }
.pc-range { -webkit-appearance: none; appearance: none; height: 4px; border-radius: 99px; cursor: pointer; outline: none;
    background: linear-gradient(90deg, #22d3a5 var(--pc-val), rgba(255,255,255,.25) var(--pc-val)); }
.pc-range::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; border-radius: 50%; background: #fff;
    box-shadow: 0 0 0 3px rgba(34,211,165,.35); transition: transform .15s ease; }
.pc-range::-webkit-slider-thumb:hover { transform: scale(1.25); }
.pc-range::-moz-range-thumb { width: 12px; height: 12px; border: none; border-radius: 50%; background: #fff; box-shadow: 0 0 0 3px rgba(34,211,165,.35); }

/* Nút phát lớn */
.pc-bigplay {
    background: linear-gradient(135deg, #22d3a5, #0fb489);
    box-shadow: 0 0 44px rgba(34,211,165,.5), 0 10px 32px rgba(0,0,0,.5);
    animation: pcPopIn .4s cubic-bezier(.34,1.56,.64,1);
    transition: transform .25s cubic-bezier(.34,1.56,.64,1);
}
.pc-bigplay:hover { scale: 1.1; } /* Tailwind v4 dùng thuộc tính translate riêng → chỉ đổi scale */
.pc-bigplay-ring { border: 2px solid rgba(34,211,165,.5); animation: pcRing 1.8s ease-out infinite; }

/* Hiệu ứng tua / phát / HUD */
.pc-ripple { background: radial-gradient(ellipse at center, rgba(0,0,0,.35), rgba(0,0,0,.12) 60%, transparent 80%); animation: pcRipple .75s ease forwards; }
.pc-layer kbd { font-family: inherit; }
.pc-chev { opacity: .25; animation: pcChev .6s ease-in-out infinite; }
.pc-pop-num { animation: pcPopIn .3s cubic-bezier(.34,1.56,.64,1); }
.pc-pop { animation: pcPop .6s ease forwards; }
.pc-hud { animation: pcHud .9s ease forwards; }
.pc-badge { animation: pcPopIn .3s cubic-bezier(.34,1.56,.64,1); }
.pc-spin { animation: pcRotate .9s linear infinite; }

/* Thông báo / thẻ tập tiếp theo */
.pc-slide-left { animation: pcSlideLeft .5s cubic-bezier(.16,1,.3,1); }
.pc-endcard { animation: pcSlideUp .5s cubic-bezier(.16,1,.3,1); }
.pc-countdown { stroke-dashoffset: 56.55; animation: pcCount linear forwards; }

/* Menu cài đặt */
.pc-menu { transform-origin: bottom right; animation: pcMenu .28s cubic-bezier(.16,1,.3,1); }
.pc-page-in   { animation: pcPageIn .28s cubic-bezier(.16,1,.3,1); }
.pc-page-back { animation: pcPageBack .28s cubic-bezier(.16,1,.3,1); }
.pc-mrow { animation: pcRowIn .3s cubic-bezier(.16,1,.3,1) both; }
.pc-check { animation: pcPopIn .3s cubic-bezier(.34,1.56,.64,1); }

/* Bảng phím tắt */
.pc-fade  { animation: pcFadeIn .2s ease; }
.pc-scale { animation: pcScaleIn .3s cubic-bezier(.16,1,.3,1); }
.pc-row   { animation: pcRowIn .35s cubic-bezier(.16,1,.3,1) both; }

@keyframes pcShimmer  { to { background-position: -200% 0; } }
@keyframes pcTipIn    { from { opacity: 0; transform: translateY(4px) scale(.9); } }
@keyframes pcPopIn    { from { opacity: 0; transform: scale(.6); } }
@keyframes pcRing     { 0% { transform: scale(1); opacity: .9; } 100% { transform: scale(1.6); opacity: 0; } }
@keyframes pcRipple   { 0% { opacity: .85; } 60% { opacity: 1; } 100% { opacity: 0; } }
@keyframes pcChev     { 0%, 100% { opacity: .25; } 50% { opacity: 1; } }
@keyframes pcPop      { 0% { opacity: 0; transform: scale(.7); } 20% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(1.3); } }
@keyframes pcHud      { 0% { opacity: 0; transform: translateY(-6px) scale(.95); } 15% { opacity: 1; transform: none; } 80% { opacity: 1; } 100% { opacity: 0; } }
@keyframes pcRotate   { to { transform: rotate(360deg); } }
@keyframes pcSlideLeft{ from { opacity: 0; transform: translateX(-24px); } }
@keyframes pcSlideUp  { from { opacity: 0; transform: translateY(20px) scale(.96); } }
@keyframes pcCount    { to { stroke-dashoffset: 0; } }
@keyframes pcMenu     { from { opacity: 0; transform: scale(.9) translateY(8px); } }
@keyframes pcPageIn   { from { opacity: 0; transform: translateX(24px); } }
@keyframes pcPageBack { from { opacity: 0; transform: translateX(-24px); } }
@keyframes pcRowIn    { from { opacity: 0; transform: translateY(6px); } }
@keyframes pcFadeIn   { from { opacity: 0; } }
@keyframes pcScaleIn  { from { opacity: 0; transform: scale(.94) translateY(8px); } }

@media (prefers-reduced-motion: reduce) {
    .pc-layer *, .pc-layer *::before, .pc-layer *::after { animation-duration: 1ms !important; animation-iteration-count: 1 !important; transition-duration: 1ms !important; }
    /* Đếm ngược tự chuyển tập vẫn giữ đủ thời gian */
    .pc-layer .pc-countdown { animation-duration: ${AUTO_NEXT_SECONDS}s !important; }
}
`;
