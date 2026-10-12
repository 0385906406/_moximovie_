"use client";

/* Ghi "Xem tiếp" khi đang xem phim (trang /xem-phim).
   - Trình phát riêng (có thẻ video): đọc vị trí thật, lưu 5 giây/lần và khi dừng.
   - Trình phát nhúng: không đọc được vị trí → dùng vị trí ước lượng EmbedPlayer đang lưu.
   Xem gần hết tập → chuyển sang "Tập tiếp theo"; hết tập cuối → xoá khỏi danh sách. */

import { useEffect } from "react";
import { getClientSource } from "@/lib/movieSource";
import { isNearlyDone, removeContinue, saveContinue } from "@/lib/continueWatching";
import { toMinutes } from "@/lib/movieTime";
import type { Movie } from "@/types/movie";
import type { Server } from "@/types/server";

const epLabel = (name: string | undefined, i: number) =>
    !name ? `Tập ${i + 1}` : /^full$/i.test(name) ? "Full" : `Tập ${name.replace(/^tập\s*/i, "")}`;

interface Args {
    movie: Movie | null;
    servers: Server[];
    ver: number;
    ep: number;
    /* Trình phát riêng */
    video: HTMLVideoElement | null;
    /* Trình phát nhúng: khoá tiến độ ước lượng (moxi_embed_progress_<key>) */
    embedKey?: string | null;
}

export function useContinueRecorder({ movie, servers, ver, ep, video, embedKey }: Args) {
    useEffect(() => {
        const list = servers[ver]?.server_data ?? [];
        if (!movie?.slug || !list[ep]) return;
        const source = getClientSource();
        const guess = toMinutes(movie.time) * 60;
        const base = {
            source, slug: movie.slug, name: movie.name,
            poster: movie.poster_url, thumb: movie.thumb_url,
            ver, epCount: list.length,
        };

        const record = (position: number, duration: number) => {
            /* Mới mở vài giây thì chưa tính là "đang xem" */
            if (!position || position < 10) return;
            if (isNearlyDone(position, duration)) {
                if (ep + 1 < list.length) {
                    saveContinue({ ...base, ep: ep + 1, epLabel: epLabel(list[ep + 1]?.name, ep + 1), position: 0, duration: 0, nextUp: true });
                } else {
                    removeContinue(source, movie.slug);
                }
                return;
            }
            saveContinue({ ...base, ep, epLabel: epLabel(list[ep]?.name, ep), position: Math.floor(position), duration: Math.floor(duration || guess), nextUp: false });
        };

        if (video) {
            let last = 0;
            const dur = () => (Number.isFinite(video.duration) && video.duration > 0 ? video.duration : guess);
            const onTime = () => {
                if (Date.now() - last < 5000) return;
                last = Date.now();
                record(video.currentTime, dur());
            };
            const onPause = () => record(video.currentTime, dur());
            const onEnded = () => record(dur(), dur());
            video.addEventListener("timeupdate", onTime);
            video.addEventListener("pause", onPause);
            video.addEventListener("ended", onEnded);
            return () => {
                onPause();
                video.removeEventListener("timeupdate", onTime);
                video.removeEventListener("pause", onPause);
                video.removeEventListener("ended", onEnded);
            };
        }

        if (embedKey) {
            const read = () => {
                try { record(Number(localStorage.getItem(`moxi_embed_progress_${embedKey}`)) || 0, guess); } catch { /* bị chặn */ }
            };
            const id = window.setInterval(read, 10_000);
            return () => { window.clearInterval(id); read(); };
        }
    }, [movie, servers, ver, ep, video, embedKey]);
}
