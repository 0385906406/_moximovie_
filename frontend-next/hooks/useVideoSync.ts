"use client";

/* ── Đồng bộ thẻ <video> với phòng xem chung (trình phát riêng, nguồn có m3u8) ──
   - Chủ phòng: mỗi lần phát/dừng/tua/đổi tốc độ → gửi trạng thái ngay; đang phát thì gửi nhịp 3 giây/lần.
   - Thành viên: tính vị trí mong đợi theo giờ máy chủ Ably rồi bám theo:
       lệch > 1.5 giây → tua thẳng (tua dư một chút để bù thời gian tải);
       lệch 0.15–1.5 giây → chỉnh tốc độ theo độ lệch (tối đa ±10%) để bắt kịp êm, không giật.
     Thành viên tự bấm phát/dừng/tua: nếu chủ phòng cho phép → gửi yêu cầu cho chủ phòng, không thì trả về đúng vị trí. */

import { useEffect, useRef, useState } from "react";
import type { WatchRoom } from "./useWatchRoom";
import type { ControlRequest } from "@/lib/watchParty/types";

export type SyncStatus = "need-tap" | "synced" | "catching-up" | "paused" | "host-offline" | "idle";

const HEARTBEAT_MS = 3000;
const HARD_DRIFT = 1.5;
const SOFT_DRIFT = 0.15;
/* Tua tới vị trí + 0.5 giây: video mất chừng đó để tải xong đoạn mới */
const SEEK_LEAD = 0.5;

/* ── Gỡ kẹt video ──
   Video HLS đôi khi kẹt sau khi tua (đứng mãi ở trạng thái "đang tua" hoặc thời gian không chạy dù đang phát),
   dù dữ liệu đã tải xong. Cách gỡ chuẩn: đẩy nhẹ vị trí lên 0.1 giây. Kiểm tra mỗi giây, kẹt quá 3 giây thì gỡ. */
function watchStall(video: HTMLVideoElement, shouldPlay: () => boolean, nudge: (t: number) => void) {
    let lastT = video.currentTime;
    let since = 0;
    const id = window.setInterval(() => {
        const stuck = video.seeking || (shouldPlay() && !video.paused && !video.ended && video.currentTime === lastT);
        lastT = video.currentTime;
        if (!stuck) { since = 0; return; }
        if (!since) { since = Date.now(); return; }
        if (Date.now() - since >= 3000) {
            since = Date.now();
            nudge(video.currentTime + 0.1);
        }
    }, 1000);
    return () => window.clearInterval(id);
}

export interface SyncInfo {
    status: SyncStatus;
    /* Độ lệch so với phòng (giây, dương = đang nhanh hơn), null khi không đo được */
    drift: number | null;
    /* Thành viên bấm "Đồng bộ ngay": tua thẳng tới vị trí của phòng */
    resync: () => void;
}

interface Args {
    video: HTMLVideoElement | null;
    room: WatchRoom;
    /* Tập đang hiện trên máy này khớp với tập của phòng chưa */
    onRightEpisode: boolean;
    onBlocked?: () => void;
    onRequestSent?: (req: ControlRequest) => void;
}

export function useVideoSync({ video, room, onRightEpisode, onBlocked, onRequestSent }: Args): SyncInfo {
    const [status, setStatus] = useState<SyncStatus>("idle");
    const [drift, setDrift] = useState<number | null>(null);
    const resyncRef = useRef<() => void>(() => {});
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
        /* Đang tải dở (sự kiện waiting) → coi như tạm dừng để thành viên chờ, không chạy vượt lên trước.
           Dựa vào sự kiện, không dựa vào readyState (với HLS giá trị này dao động cả khi đang phát bình thường) */
        let buffering = false;
        const send = () => {
            const r = roomRef.current;
            if (!r.room || !armed) return;
            void r.publishSync({
                ver: r.room.ver, ep: r.room.ep,
                playing: !video.paused && !video.ended && !buffering,
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
        /* Hết tải: có trình duyệt không bắn "playing" sau khi tua → dựa thêm vào việc thời gian thật sự chạy tiếp */
        let waitingAt = 0;
        const onWaiting = () => { if (!video.paused) { buffering = true; waitingAt = video.currentTime; send(); } };
        const resume = () => { if (buffering) { buffering = false; send(); } };
        const onTimeUpdate = () => { if (buffering && !video.paused && video.currentTime > waitingAt + 0.15) resume(); };
        const onPause = () => { buffering = false; };
        video.addEventListener("waiting", onWaiting);
        video.addEventListener("playing", resume);
        video.addEventListener("timeupdate", onTimeUpdate);
        video.addEventListener("pause", onPause);
        const beat = window.setInterval(() => { if (!video.paused) send(); }, HEARTBEAT_MS);
        const stopWatch = watchStall(video, () => !video.paused, t => { video.currentTime = t; });
        setStatus("synced");
        return () => {
            video.removeEventListener("play", onFirstPlay);
            events.forEach(e => video.removeEventListener(e, send));
            video.removeEventListener("waiting", onWaiting);
            video.removeEventListener("playing", resume);
            video.removeEventListener("timeupdate", onTimeUpdate);
            video.removeEventListener("pause", onPause);
            window.clearInterval(beat);
            stopWatch();
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

        /* Thao tác do chính máy làm để bám theo phòng (tua/dừng/phát) được đánh dấu,
           để sự kiện tương ứng không bị hiểu nhầm là người xem tự bấm.
           (Không dùng khoảng thời gian: video tải chậm thì sự kiện "seeked" đến muộn → nhầm thành người xem tua
           → gửi yêu cầu cho chủ phòng → chủ phòng tua lại → vòng lặp làm cả phòng kẹt.) */
        let ownSeeks = 0, ownSeekAt = 0, ownPause = false, ownPlay = false;
        const seekTo = (t: number) => { ownSeeks++; ownSeekAt = Date.now(); video.currentTime = t; };
        const pauseSelf = () => { if (!video.paused) { ownPause = true; video.pause(); } };
        const playSelf = () => {
            if (!video.paused) return;
            ownPlay = true;
            video.play().catch((err: DOMException) => {
                ownPlay = false;
                /* Chỉ khi trình duyệt chặn tự phát mới cần người xem bấm.
                   Lỗi khác (vd. AbortError: bị ngắt bởi lệnh tua/dừng) → nhịp sau thử phát lại */
                if (err?.name === "NotAllowedError") { gestured.current = false; setStatus("need-tap"); }
            });
        };

        const apply = () => {
            const r = roomRef.current;
            if (!r.hostOnline) { setStatus("host-offline"); return; }
            const e = expected();
            if (!e) { setStatus("idle"); return; }
            if (!gestured.current) { setStatus("need-tap"); return; }
            if (video.readyState < 1) return;
            /* Đang tua/đang tải dữ liệu → không chỉnh vị trí liên tục gây giật.
               Nhưng phòng đang phát thì vẫn bấm phát: video bị dừng giữa lúc tua có thể kẹt ở trạng thái "đang tua" mãi */
            if (video.seeking || (e.pb.playing && video.readyState < 3 && Date.now() - lastHardSeek < 4000)) {
                if (e.pb.playing) playSelf();
                return;
            }
            const { pb, pos } = e;
            const drift = video.currentTime - pos;
            /* Hiện độ lệch (làm tròn 0.1 giây để không render liên tục) */
            setDrift(Math.round(drift * 10) / 10);

            if (!pb.playing) {
                pauseSelf();
                if (Math.abs(drift) > 0.5) seekTo(pos);
                video.playbackRate = pb.rate;
                setStatus("paused");
                return;
            }
            if (Math.abs(drift) > HARD_DRIFT) {
                lastHardSeek = Date.now();
                seekTo(pos + SEEK_LEAD);
                video.playbackRate = pb.rate;
                setStatus("catching-up");
            } else if (Math.abs(drift) > SOFT_DRIFT) {
                /* Lệch càng nhiều chỉnh càng mạnh, tối đa ±10% (tai người gần như không nhận ra) */
                const factor = Math.min(1.1, Math.max(0.9, 1 - drift * 0.2));
                video.playbackRate = pb.rate * factor;
                setStatus("catching-up");
            } else {
                video.playbackRate = pb.rate;
                setStatus("synced");
            }
            playSelf();
        };

        /* Thành viên tự thao tác trên trình phát (bỏ qua các thao tác do máy tự làm ở trên) */
        const onLocal = (kind: "play" | "pause" | "seeked") => () => {
            if (kind === "play") gestured.current = true;
            if (kind === "play" && ownPlay) { ownPlay = false; return; }
            if (kind === "pause" && ownPause) { ownPause = false; return; }
            if (kind === "seeked" && ownSeeks > 0) {
                /* Nhiều lần tua liền nhau có thể chỉ ra 1 sự kiện seeked → quá 10 giây thì xoá đếm */
                ownSeeks = Date.now() - ownSeekAt > 10_000 ? 0 : ownSeeks - 1;
                return;
            }
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
        resyncRef.current = () => {
            const e = expected();
            if (!e) return;
            gestured.current = true;
            lastHardSeek = Date.now();
            seekTo(e.pos + (e.pb.playing ? SEEK_LEAD : 0));
            apply();
        };
        const tick = window.setInterval(apply, 500);
        const stopWatch = watchStall(video, () => !!roomRef.current.playback?.playing, seekTo);
        apply();
        return () => {
            video.removeEventListener("play", onPlay);
            video.removeEventListener("pause", onPause);
            video.removeEventListener("seeked", onSeeked);
            video.removeEventListener("moxi-sync", apply);
            window.clearInterval(tick);
            stopWatch();
            video.playbackRate = 1;
            resyncRef.current = () => {};
        };
    }, [video, isHost, onRightEpisode]);

    /* Có trạng thái mới từ chủ phòng → áp dụng ngay, không chờ nhịp 1 giây */
    useEffect(() => {
        if (!video || isHost) return;
        video.dispatchEvent(new Event("moxi-sync"));
    }, [room.playback, video, isHost]);

    return { status, drift: isHost ? null : drift, resync: () => resyncRef.current() };
}
