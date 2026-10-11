"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PlayerCurtain, { CURTAIN_OPEN_MS } from "./PlayerCurtain";

/*
 * Trình phát nhúng (iframe playembed.vip) — API VodPhim không có link m3u8.
 * Iframe khác domain nên không đọc được thời gian phát → "xem tiếp" là ước lượng:
 * đếm thời gian iframe mở trong lúc tab đang hiển thị, lưu localStorage, lần sau truyền vào tham số t.
 * Tạm dừng trong player thì vẫn bị đếm → luôn ghi "khoảng" và cho chọn "Xem từ đầu".
 */
interface Props {
    src: string;
    title?: string;
    subtitle?: string;
    /* Khoá lưu tiến độ (vd "slug:episode_id"). Bỏ trống = không lưu */
    progressKey?: string;
    /* Thời lượng ước tính (giây). Đếm gần hết thì coi như đã xem xong, xoá tiến độ */
    durationSec?: number;
}

const TICK = 5;
const MIN_RESUME = 30;
const PREFIX = "moxi_embed_progress_";

function readProgress(key?: string) {
    if (!key) return 0;
    try { return Number(localStorage.getItem(PREFIX + key)) || 0; } catch { return 0; }
}

function writeProgress(key: string, sec: number) {
    try {
        if (sec > 0) localStorage.setItem(PREFIX + key, String(Math.floor(sec)));
        else localStorage.removeItem(PREFIX + key);
    } catch { /* storage bị chặn — bỏ qua */ }
}

export function formatClock(sec: number) {
    const s = Math.floor(sec % 60), m = Math.floor(sec / 60) % 60, h = Math.floor(sec / 3600);
    const mm = h ? String(m).padStart(2, "0") : String(m);
    return `${h ? `${h}:` : ""}${mm}:${String(s).padStart(2, "0")}`;
}

export default function EmbedPlayer({ src, title, subtitle, progressKey, durationSec }: Props) {
    const [curtain, setCurtain] = useState<"closed" | "opening" | "open">("closed");
    const [loading, setLoading] = useState(false);
    const [resumeAt, setResumeAt] = useState(0);
    const [startAt, setStartAt] = useState(0);
    const [ready, setReady] = useState(false);
    const timer = useRef(0);

    /* Đổi tập → khép rèm, đọc tiến độ đã lưu, chưa nạp iframe cho tới khi bấm phát */
    useEffect(() => {
        clearTimeout(timer.current);
        setCurtain("closed");
        setLoading(false);
        setReady(false);
        const saved = readProgress(progressKey);
        setResumeAt(saved >= MIN_RESUME ? saved : 0);
    }, [src, progressKey]);
    useEffect(() => () => clearTimeout(timer.current), []);

    /* Đếm thời gian xem khi iframe đã tải và tab đang hiển thị */
    useEffect(() => {
        if (!ready || !progressKey) return;
        let pos = startAt;
        const id = window.setInterval(() => {
            if (document.visibilityState !== "visible") return;
            pos += TICK;
            const finished = durationSec && pos >= durationSec - 60;
            writeProgress(progressKey, finished ? 0 : pos);
            if (finished) window.clearInterval(id);
        }, TICK * 1000);
        return () => window.clearInterval(id);
    }, [ready, progressKey, startAt, durationSec]);

    const play = useCallback((from: number) => {
        setStartAt(from);
        setLoading(true);
        setCurtain("opening");
        clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setCurtain("open"), CURTAIN_OPEN_MS);
    }, []);

    const restart = () => {
        if (progressKey) writeProgress(progressKey, 0);
        setResumeAt(0);
    };

    const frameSrc = (() => {
        if (!startAt) return src;
        try {
            const url = new URL(src);
            url.searchParams.set("t", String(startAt));
            return url.toString();
        } catch {
            return src;
        }
    })();

    return (
        <div className="absolute inset-0 isolate overflow-hidden rounded-2xl bg-black">
            {curtain !== "closed" && (
                <iframe
                    key={frameSrc}
                    src={frameSrc}
                    title={title ? title.replace(/<[^>]+>/g, "") : "Trình phát phim"}
                    className="absolute inset-0 w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                    allowFullScreen
                    referrerPolicy="origin"
                    onLoad={() => { setLoading(false); setReady(true); }}
                />
            )}

            {curtain !== "open" && (
                <PlayerCurtain
                    state={curtain === "opening" ? "opening" : "closed"}
                    title={title}
                    subtitle={subtitle}
                    loading={loading}
                    onPlay={() => play(resumeAt)}
                />
            )}

            {/* Xem tiếp: nằm trên rèm, ẩn khi rèm bắt đầu mở */}
            {curtain === "closed" && resumeAt > 0 && (
                <div className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 p-1 rounded-full text-[11px] sm:text-xs whitespace-nowrap"
                    style={{ background: "rgba(5,7,11,0.78)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(10px)" }}>
                    <button type="button" onClick={() => play(resumeAt)}
                        className="px-3 py-1.5 rounded-full font-semibold transition hover:brightness-110"
                        style={{ background: "#22d3a5", color: "#041a11" }}>
                        Xem tiếp từ khoảng {formatClock(resumeAt)}
                    </button>
                    <button type="button" onClick={restart}
                        className="px-3 py-1.5 rounded-full font-medium text-white/60 hover:text-white transition">
                        Xem từ đầu
                    </button>
                </div>
            )}
        </div>
    );
}
