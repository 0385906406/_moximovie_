"use client";

/* ── Đồng bộ thẻ <video> với phòng xem chung (trình phát riêng, nguồn có m3u8) ──
   - Chủ phòng: mỗi lần phát/dừng/tua/đổi tốc độ → gửi trạng thái ngay; đang phát thì gửi nhịp 8 giây/lần.
   - Thành viên: tính vị trí mong đợi theo giờ máy chủ Ably rồi bám theo:
       lệch > 2 giây → tua thẳng; lệch 0.35–2 giây → chỉnh nhẹ tốc độ (0.95×/1.05×) để bắt kịp mà không giật.
     Thành viên tự bấm phát/dừng/tua: nếu chủ phòng cho phép → gửi yêu cầu cho chủ phòng, không thì trả về đúng vị trí. */

import { useEffect, useRef, useState } from "react";
import type { WatchRoom } from "./useWatchRoom";
import type { ControlRequest } from "@/lib/watchParty/types";

export type SyncStatus = "need-tap" | "synced" | "catching-up" | "paused" | "host-offline" | "idle";

const HEARTBEAT_MS = 8000;
const HARD_DRIFT = 2;
const SOFT_DRIFT = 0.35;

interface Args {
    video: HTMLVideoElement | null;
    room: WatchRoom;
    /* Tập đang hiện trên máy này khớp với tập của phòng chưa */
    onRightEpisode: boolean;
    onBlocked?: () => void;
    onRequestSent?: (req: ControlRequest) => void;
}

export function useVideoSync({ video, room, onRightEpisode, onBlocked, onRequestSent }: Args): SyncStatus {
    const [status, setStatus] = useState<SyncStatus>("idle");
    const suppressUntil = useRef(0);
    const gestured = useRef(false);
    const roomRef = useRef(room);
    roomRef.current = room;
    const cbRef = useRef({ onBlocked, onRequestSent });
    cbRef.current = { onBlocked, onRequestSent };

    const isHost = room.isHost;

    /* ── Chủ phòng: phát trạng thái ── */
    useEffect(() => {
        if (!video || !isHost || !onRightEpisode) return;
        /* Chưa phát lần nào (vừa tải lại trang) → chưa gửi gì, để cả phòng không bị dừng theo máy mình.
           Đang phát sẵn (vừa nhận quyền chủ phòng) → gửi bình thường */
        let armed = !video.paused;
        const send = () => {
            const r = roomRef.current;
            if (!r.room || !armed) return;
            void r.publishSync({
                ver: r.room.ver, ep: r.room.ep,
                playing: !video.paused && !video.ended,
                position: video.currentTime,
                rate: video.playbackRate,
                epoch: r.playback?.epoch ?? 0,
            });
        };
        /* Lần phát đầu sau khi tải lại trang: nhảy tới vị trí hiện tại của phòng rồi mới gửi */
        let seekingToRoom = false;
        const onFirstPlay = () => {
            if (armed || seekingToRoom) return;
            const r = roomRef.current;
            const pb = r.playback;
            if (pb && r.room && pb.ep === r.room.ep && pb.ver === r.room.ver) {
                const pos = pb.playing ? pb.position + ((r.now() - pb.at) / 1000) * pb.rate : pb.position;
                if (Math.abs(video.currentTime - pos) > 2) {
                    /* Tua xong mới gửi, tránh gửi vị trí 0 làm cả phòng nhảy về đầu */
                    seekingToRoom = true;
                    video.addEventListener("seeked", () => { seekingToRoom = false; armed = true; send(); }, { once: true });
                    video.currentTime = pos;
                    return;
                }
            }
            /* Listener "send" đăng ký sau sẽ gửi ngay cho sự kiện play này */
            armed = true;
        };
        video.addEventListener("play", onFirstPlay);
        const events = ["play", "pause", "seeked", "ratechange"] as const;
        events.forEach(e => video.addEventListener(e, send));
        const beat = window.setInterval(() => { if (!video.paused) send(); }, HEARTBEAT_MS);
        setStatus("synced");
        return () => {
            video.removeEventListener("play", onFirstPlay);
            events.forEach(e => video.removeEventListener(e, send));
            window.clearInterval(beat);
        };
    }, [video, isHost, onRightEpisode]);

    /* ── Thành viên: bám theo chủ phòng ── */
    useEffect(() => {
        if (!video || isHost || !onRightEpisode) return;
        /* Đã tương tác với trang (vd. bấm phát tập trước) → trình duyệt cho tự phát tiếp */
        gestured.current = !video.paused || !!(navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive;
        let lastHardSeek = 0;

        const expected = () => {
            const pb = roomRef.current.playback;
            if (!pb) return null;
            const pos = pb.playing ? pb.position + ((roomRef.current.now() - pb.at) / 1000) * pb.rate : pb.position;
            return { pb, pos: Math.max(0, pos) };
        };

        const apply = () => {
            const r = roomRef.current;
            if (!r.hostOnline) { setStatus("host-offline"); return; }
            const e = expected();
            if (!e) { setStatus("idle"); return; }
            if (!gestured.current) { setStatus("need-tap"); return; }
            if (video.readyState < 1) return;
            /* Đang tua/đang tải dữ liệu → chờ, không chỉnh liên tục gây giật */
            if (video.seeking || (e.pb.playing && video.readyState < 3 && Date.now() - lastHardSeek < 4000)) return;
            const { pb, pos } = e;
            const drift = video.currentTime - pos;

            if (!pb.playing) {
                if (!video.paused) { suppressUntil.current = Date.now() + 800; video.pause(); }
                if (Math.abs(drift) > 0.5) { suppressUntil.current = Date.now() + 800; video.currentTime = pos; }
                video.playbackRate = pb.rate;
                setStatus("paused");
                return;
            }
            if (Math.abs(drift) > HARD_DRIFT) {
                lastHardSeek = Date.now();
                suppressUntil.current = Date.now() + 1200;
                video.currentTime = pos;
                video.playbackRate = pb.rate;
                setStatus("catching-up");
            } else if (Math.abs(drift) > SOFT_DRIFT) {
                video.playbackRate = pb.rate * (drift > 0 ? 0.95 : 1.05);
                setStatus("catching-up");
            } else {
                video.playbackRate = pb.rate;
                setStatus("synced");
            }
            if (video.paused) {
                suppressUntil.current = Date.now() + 800;
                video.play().catch(() => { gestured.current = false; setStatus("need-tap"); });
            }
        };

        /* Thành viên tự thao tác trên trình phát */
        const onLocal = (kind: "play" | "pause" | "seeked") => () => {
            if (kind === "play") gestured.current = true;
            if (Date.now() < suppressUntil.current) return;
            const r = roomRef.current;
            if (!r.playback) return;
            if (kind === "play" && r.playback.playing) { apply(); return; }
            if (r.room?.allowControl) {
                const req: ControlRequest = kind === "seeked"
                    ? { action: "seek", position: video.currentTime }
                    : { action: kind };
                void r.requestControl(req);
                cbRef.current.onRequestSent?.(req);
            } else {
                cbRef.current.onBlocked?.();
                apply();
            }
        };
        const onPlay = onLocal("play"), onPause = onLocal("pause"), onSeeked = onLocal("seeked");
        video.addEventListener("play", onPlay);
        video.addEventListener("pause", onPause);
        video.addEventListener("seeked", onSeeked);
        video.addEventListener("moxi-sync", apply);
        const tick = window.setInterval(apply, 1000);
        apply();
        return () => {
            video.removeEventListener("play", onPlay);
            video.removeEventListener("pause", onPause);
            video.removeEventListener("seeked", onSeeked);
            video.removeEventListener("moxi-sync", apply);
            window.clearInterval(tick);
            video.playbackRate = 1;
        };
    }, [video, isHost, onRightEpisode]);

    /* Có trạng thái mới từ chủ phòng → áp dụng ngay, không chờ nhịp 1 giây */
    useEffect(() => {
        if (!video || isHost) return;
        video.dispatchEvent(new Event("moxi-sync"));
    }, [room.playback, video, isHost]);

    return status;
}
