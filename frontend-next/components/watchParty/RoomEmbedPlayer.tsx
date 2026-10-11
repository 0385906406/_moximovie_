"use client";

import { useEffect, useState } from "react";
import PlayerCurtain, { CURTAIN_OPEN_MS } from "@/components/frontend/MovieDetailPlay/PlayerCurtain";
import type { WatchRoom } from "@/hooks/useWatchRoom";

/*
 * Trình phát nhúng trong phòng (nguồn VodPhim, không có m3u8).
 * Iframe khác domain → không đọc/điều khiển được video bên trong, nên chỉ đồng bộ được:
 *   - tập phim (đổi tập → mọi người đổi theo),
 *   - thời điểm bắt đầu: chủ phòng bấm "Phát cùng lúc" (epoch tăng) → iframe của mọi người nạp lại
 *     với tham số t = vị trí tính theo giờ máy chủ.
 */
interface Props {
    src: string;
    subtitle?: string;
    room: WatchRoom;
}

function withStart(src: string, seconds: number) {
    try {
        const url = new URL(src);
        if (seconds > 1) url.searchParams.set("t", String(Math.floor(seconds)));
        else url.searchParams.delete("t");
        return url.toString();
    } catch {
        return src;
    }
}

export default function RoomEmbedPlayer({ src, subtitle, room }: Props) {
    const [curtain, setCurtain] = useState<"closed" | "opening" | "open">("closed");
    const [frameSrc, setFrameSrc] = useState("");
    const pb = room.playback;
    const epoch = pb?.epoch ?? 0;

    /* Vị trí hiện tại của phòng (giây) */
    const roomPosition = () => {
        if (!pb) return 0;
        return pb.playing ? pb.position + (room.now() - pb.at) / 1000 : pb.position;
    };

    /* Đổi tập → khép rèm chờ bấm */
    useEffect(() => { setCurtain("closed"); setFrameSrc(""); }, [src]);

    /* Chủ phòng bấm "Phát cùng lúc" → ai đã mở rèm thì nạp lại đúng vị trí */
    useEffect(() => {
        if (curtain === "closed") return;
        setFrameSrc(withStart(src, roomPosition()));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [epoch]);

    const open = () => {
        setFrameSrc(withStart(src, roomPosition()));
        setCurtain("opening");
        window.setTimeout(() => setCurtain("open"), CURTAIN_OPEN_MS);
    };

    return (
        <div className="absolute inset-0 isolate overflow-hidden rounded-2xl bg-black">
            {frameSrc && (
                <iframe
                    key={frameSrc}
                    src={frameSrc}
                    title="Trình phát phim"
                    className="absolute inset-0 w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                    allowFullScreen
                    referrerPolicy="origin"
                />
            )}
            {curtain !== "open" && (
                <PlayerCurtain
                    state={curtain === "opening" ? "opening" : "closed"}
                    subtitle={subtitle}
                    loading={false}
                    onPlay={open}
                />
            )}
        </div>
    );
}
