"use client";

import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
import { toast } from "sonner";
import { Play, RefreshCw } from "lucide-react";
import HlsPlayerWithFilter from "@/components/frontend/MovieDetailPlay/HlsPlayerWithFilter";
import RoomEmbedPlayer from "./RoomEmbedPlayer";
import { useVideoSync, type SyncStatus } from "@/hooks/useVideoSync";
import { vodPlayerUrl } from "@/lib/vodApi";
import { movieImageSources } from "@/lib/movieImage";
import { serverTone } from "@/lib/serverTone";
import type { WatchRoom } from "@/hooks/useWatchRoom";
import type { Movie } from "@/types/movie";
import type { Server } from "@/types/server";

export interface FloatingReaction { id: number; emoji: string; name: string; x: number }

interface Props {
    room: WatchRoom;
    movie: Movie;
    servers: Server[];
    videoRef: MutableRefObject<HTMLVideoElement | null>;
    reactions: FloatingReaction[];
    /* Phòng nguồn VodPhim: bản cùng phim trên phimapi (có m3u8) để đồng bộ được vị trí xem */
    mirrorServers?: Server[] | null;
}

const STATUS_TEXT: Record<SyncStatus, string> = {
    "need-tap": "Bấm phát để xem cùng mọi người",
    synced: "Đang đồng bộ với phòng",
    "catching-up": "Đang bắt kịp chủ phòng…",
    paused: "Chủ phòng đang tạm dừng",
    "host-offline": "Chủ phòng mất kết nối — chờ quay lại…",
    idle: "Chờ chủ phòng bắt đầu phát",
};

export const episodeLabel = (name: string | undefined, idx: number) =>
    name ? (/^full$/i.test(name) ? "Full" : `Tập ${name.replace(/^tập\s*/i, "")}`) : `Tập ${idx + 1}`;

/* "Tập 03" / "3" → 3; "Full" → 1 */
function episodeNumber(name?: string) {
    if (!name || /^full$/i.test(name.trim())) return 1;
    return Number(name.match(/\d+/)?.[0] ?? NaN);
}

/* Tập tương ứng trên bản phimapi: cùng loại server (Vietsub/Thuyết minh/Lồng tiếng) nếu có, cùng số tập */
function mirrorEpisode(mirror: Server[] | null | undefined, serverName: string | undefined, epName: string | undefined) {
    if (!mirror?.length) return null;
    const label = serverTone(serverName).label;
    const ordered = [...mirror].sort((a, b) => Number(serverTone(b.server_name).label === label) - Number(serverTone(a.server_name).label === label));
    const num = episodeNumber(epName);
    for (const s of ordered) {
        const list = s.server_data ?? [];
        const found = list.length === 1 && num === 1 ? list[0] : list.find(e => episodeNumber(e.name) === num);
        if (found?.link_m3u8) return found;
    }
    return null;
}

export default function RoomPlayer({ room, movie, servers, videoRef, reactions, mirrorServers }: Props) {
    const r = room.room;
    const ver = Math.min(r?.ver ?? 0, Math.max(servers.length - 1, 0));
    const list = servers[ver]?.server_data ?? [];
    const ep = Math.min(r?.ep ?? 0, Math.max(list.length - 1, 0));
    const episode = list[ep];
    /* Nguồn có m3u8 sẵn → dùng luôn; nguồn VodPhim → thử bản phimapi; máy này không tải được bản đó → trình phát nhúng */
    const [mirrorFailed, setMirrorFailed] = useState(false);
    const mirrorEp = episode?.link_m3u8 ? null : mirrorEpisode(mirrorServers, servers[ver]?.server_name, episode?.name);
    const hlsSrc = episode?.link_m3u8 || (!mirrorFailed && mirrorEp?.link_m3u8) || "";
    const useHls = !!hlsSrc;
    const usingMirror = useHls && !episode?.link_m3u8;
    const onFatalError = useCallback(() => {
        if (!usingMirror) return;
        setMirrorFailed(true);
        toast.info("Máy bạn không tải được trình phát đồng bộ, chuyển sang trình phát nhúng");
    }, [usingMirror]);
    const subtitle = list.length > 1 ? episodeLabel(episode?.name, ep) : servers[ver]?.server_name;

    const [video, setVideo] = useVideoState(videoRef);

    /* Thông báo gọn, không spam khi thành viên bấm liên tục */
    const lastToast = useRef(0);
    const onBlocked = useCallback(() => {
        if (Date.now() - lastToast.current < 4000) return;
        lastToast.current = Date.now();
        toast.info("Chỉ chủ phòng điều khiển được việc phát phim");
    }, []);
    const onRequestSent = useCallback(() => {
        if (Date.now() - lastToast.current < 2500) return;
        lastToast.current = Date.now();
        toast.success("Đã gửi yêu cầu tới chủ phòng");
    }, []);

    const { status, drift, resync } = useVideoSync({ video: useHls ? video : null, room, onRightEpisode: true, onBlocked, onRequestSent });

    /* Chủ phòng: hết tập → tự sang tập sau cho cả phòng */
    useEffect(() => {
        if (!video || !room.isHost || !useHls) return;
        const onEnded = () => {
            if (ep + 1 < list.length) {
                void room.setEpisode(ver, ep + 1);
                toast.success(`Chuyển sang ${episodeLabel(list[ep + 1]?.name, ep + 1)}`);
            }
        };
        video.addEventListener("ended", onEnded);
        return () => video.removeEventListener("ended", onEnded);
    }, [video, room, useHls, ver, ep, list]);

    /* Trình phát nhúng: chủ phòng bấm để mọi người cùng bắt đầu */
    const startTogether = (fromStart: boolean) => {
        /* Thành viên (được phép điều khiển) → gửi yêu cầu, chủ phòng áp dụng cho cả phòng */
        if (!room.isHost) {
            void room.requestControl(fromStart ? { action: "play", position: 0 } : { action: "play" });
            toast.success("Đã gửi yêu cầu tới chủ phòng");
            return;
        }
        const pb = room.playback;
        const pos = fromStart || !pb ? 0 : pb.playing ? pb.position + (room.now() - pb.at) / 1000 : pb.position;
        void room.publishSync({ ver, ep, playing: true, position: pos, rate: 1, epoch: (pb?.epoch ?? 0) + 1 });
        toast.success(fromStart ? "Mọi người bắt đầu xem từ đầu" : "Đã đồng bộ lại vị trí cho cả phòng");
    };

    if (!episode) {
        return <div className="absolute inset-0 rounded-2xl bg-black flex items-center justify-center text-white/40 text-sm">Phim chưa có tập để xem</div>;
    }

    return (
        <>
            {useHls ? (
                <HlsPlayerWithFilter
                    key={`${ver}-${ep}`}
                    src={hlsSrc}
                    onFatalError={onFatalError}
                    poster={movieImageSources(movie, "thumb")[0]}
                    subtitle={subtitle}
                    onVideo={setVideo}
                    syncMode
                    autoStart={hasActivated()}
                />
            ) : (
                <RoomEmbedPlayer key={`${ver}-${ep}`} src={vodPlayerUrl(episode)} subtitle={subtitle} room={room} />
            )}

            {/* Cảm xúc bay lên */}
            <div aria-hidden className="pointer-events-none absolute inset-0 z-[45] overflow-hidden rounded-2xl">
                {reactions.map(x => (
                    <span key={x.id} className="wp-float absolute bottom-6 flex flex-col items-center" style={{ left: `${x.x}%` }}>
                        <span className="text-[34px] drop-shadow-lg">{x.emoji}</span>
                        <span className="text-[10.5px] font-medium text-white/90 px-1.5 rounded bg-black/40 mt-0.5 max-w-[90px] truncate">{x.name}</span>
                    </span>
                ))}
            </div>
            <style>{`
                .wp-float { animation: wpFloat 3s cubic-bezier(.2,.6,.4,1) forwards; }
                @keyframes wpFloat {
                    0% { transform: translateY(0) scale(.6); opacity: 0; }
                    12% { transform: translateY(-20px) scale(1.1); opacity: 1; }
                    100% { transform: translateY(-260px) scale(1); opacity: 0; }
                }
            `}</style>

            {/* Trạng thái đồng bộ + nút cho trình phát nhúng (nằm ngay dưới khung phát) */}
            <div className="absolute left-0 right-0 top-full mt-2 flex items-center justify-between gap-2 flex-wrap">
                {useHls ? (
                    <span className="flex items-center gap-2 text-[12px] text-white/50">
                        <span className={`w-2 h-2 rounded-full ${status === "synced" ? "bg-[#22d3a5]" : status === "host-offline" ? "bg-red-400" : "bg-[#f6d46b]"} ${status === "synced" ? "animate-pulse" : ""}`} />
                        {room.isHost
                            ? (room.room?.allowControl ? "Bạn là chủ phòng — mọi người cùng điều khiển được" : "Bạn đang điều khiển phòng — mọi người xem theo bạn")
                            : STATUS_TEXT[status]}
                        {!room.isHost && room.room?.allowControl && status !== "need-tap" && <span className="text-[#22d3a5]/80 hidden sm:inline">· bạn cũng phát/dừng/tua được</span>}
                        {/* Độ lệch với phòng + nút bắt kịp ngay (thành viên) */}
                        {!room.isHost && drift !== null && (status === "synced" || status === "catching-up") && (
                            <span className={`tabular-nums ${Math.abs(drift) <= 0.3 ? "text-white/35" : "text-[#f6d46b]"}`}>
                                · lệch {Math.abs(drift).toFixed(1)} giây
                            </span>
                        )}
                        {!room.isHost && (status === "catching-up" || (drift !== null && Math.abs(drift) > 0.3)) && (
                            <button type="button" onClick={resync}
                                className="ml-1 h-7 px-2.5 rounded-lg text-[11.5px] font-semibold bg-[#22d3a5]/15 text-[#22d3a5] border border-[#22d3a5]/30 hover:bg-[#22d3a5]/25">
                                Đồng bộ ngay
                            </button>
                        )}
                    </span>
                ) : (
                    <span className="text-[12px] text-white/45">
                        Phim này chỉ có trình phát nhúng: chỉ đồng bộ được tập phim và lúc bắt đầu.
                    </span>
                )}
                {!useHls && (room.isHost || room.room?.allowControl) && (
                    <span className="flex gap-2">
                        <button type="button" onClick={() => startTogether(true)}
                            className="h-8 px-3 rounded-lg text-[12px] font-semibold bg-[#22d3a5] text-[#041a11] flex items-center gap-1.5 hover:brightness-110">
                            <Play size={13} /> Phát cùng lúc
                        </button>
                        {room.playback?.playing && (
                            <button type="button" onClick={() => startTogether(false)}
                                className="h-8 px-3 rounded-lg text-[12px] text-white/80 bg-white/[0.07] border border-white/10 flex items-center gap-1.5 hover:bg-white/10">
                                <RefreshCw size={13} /> Đồng bộ lại
                            </button>
                        )}
                    </span>
                )}
            </div>
        </>
    );
}

/* Người xem đã bấm/chạm vào trang chưa (trình duyệt chỉ cho tự phát có tiếng sau lần tương tác đầu) */
function hasActivated() {
    if (typeof navigator === "undefined") return false;
    return !!(navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive;
}

/* Giữ thẻ video vừa ở state (để hook đồng bộ chạy lại) vừa ở ref (để trang xử lý yêu cầu điều khiển) */
function useVideoState(ref: MutableRefObject<HTMLVideoElement | null>) {
    const [video, set] = useState<HTMLVideoElement | null>(null);
    const setVideo = useCallback((v: HTMLVideoElement | null) => { ref.current = v; set(v); }, [ref, set]);
    return [video, setVideo] as const;
}
