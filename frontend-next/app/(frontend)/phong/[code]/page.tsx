"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ThreeDot } from "react-loading-indicators";
import { ArrowLeft, Crown, MessageCircle, Settings2, Users, WifiOff } from "lucide-react";

import { getSavedName, saveName, useWatchRoom, type WatchRoom } from "@/hooks/useWatchRoom";
import { useAuthStore } from "@/stores/useAuthStore";
import { movieApi } from "@/lib/movieApi";
import { MAX_NAME, normalizeRoomCode, ROOM_CODE_RE, type ControlRequest, type RoomInfo } from "@/lib/watchParty/types";
import RoomPlayer, { episodeLabel, type FloatingReaction } from "@/components/watchParty/RoomPlayer";
import ChatPanel, { Avatar } from "@/components/watchParty/ChatPanel";
import MembersPanel from "@/components/watchParty/MembersPanel";
import RoomSettings, { InviteBox } from "@/components/watchParty/RoomSettings";
import MovieImage from "@/components/frontend/MovieImage";
import type { Movie } from "@/types/movie";
import type { Server } from "@/types/server";

/* ══════════════════════════════════════════════
   Trang phòng xem chung /phong/ABC123
   1. Chưa có tên hiển thị → hỏi tên (xem trước phòng: ai làm chủ, đang xem gì)
   2. Kết nối → chờ duyệt (nếu chủ phòng bật) → vào phòng
══════════════════════════════════════════════ */
export default function RoomPage() {
    const params = useParams();
    const code = normalizeRoomCode(String(params.code ?? ""));
    const [name, setName] = useState<string | null>(null);
    const [ready, setReady] = useState(false);

    /* Đã có tên lưu trên máy → vào thẳng */
    useEffect(() => {
        const saved = getSavedName();
        if (saved) setName(saved);
        setReady(true);
    }, []);

    if (!ROOM_CODE_RE.test(code)) {
        return <Screen title="Mã phòng không hợp lệ" desc="Mã phòng gồm 6 ký tự, ví dụ: K7M2QX." action={<BackToRooms />} />;
    }
    if (!ready) return <Loading />;
    if (!name) return <NameGate code={code} onJoin={n => { saveName(n); setName(n); }} />;
    return <Room code={code} name={name} onRename={() => setName(null)} />;
}

/* ── Hỏi tên trước khi vào ── */
function NameGate({ code, onJoin }: { code: string; onJoin: (name: string) => void }) {
    const user = useAuthStore(s => s.user);
    const [value, setValue] = useState("");
    const [info, setInfo] = useState<RoomInfo | null>(null);

    useEffect(() => { setValue(getSavedName() || user?.displayName || ""); }, [user]);
    useEffect(() => {
        fetch(`/api/rooms/${code}`).then(r => (r.ok ? r.json() : null)).then(setInfo).catch(() => setInfo(null));
    }, [code]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const n = value.trim().slice(0, MAX_NAME);
        if (n.length < 2) { toast.error("Tên cần ít nhất 2 ký tự"); return; }
        onJoin(n);
    };

    return (
        <Shell>
            <div className="w-full max-w-md mx-auto rounded-3xl p-6 sm:p-7 bg-[#1f2230] border border-white/[0.07] shadow-2xl">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#22d3a5] font-semibold">Phòng xem chung</p>
                <h1 className="mt-1 text-2xl font-bold text-white">Vào phòng <span className="font-mono tracking-[0.15em]">{code}</span></h1>

                {info?.state ? (
                    <div className="mt-5 flex gap-3 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                        <div className="relative w-14 aspect-[2/3] rounded-lg overflow-hidden shrink-0 bg-white/5">
                            <MovieImage movie={{ poster_url: info.state.poster }} prefer="poster" alt="" fill sizes="96px" className="object-cover" />
                        </div>
                        <div className="min-w-0 text-[13px] text-white/60 leading-relaxed">
                            <p className="text-white font-semibold truncate">{info.state.movieName}</p>
                            <p>Chủ phòng: <span className="text-white/85">{info.state.hostName}</span></p>
                            {info.state.approval && <p className="text-[#f6d46b]">Cần chủ phòng duyệt khi vào</p>}
                        </div>
                    </div>
                ) : info && !info.hostOnline ? (
                    <p className="mt-5 text-[13px] text-[#f6d46b] leading-relaxed">Phòng chưa mở hoặc chủ phòng đang offline. Bạn vẫn có thể thử vào.</p>
                ) : null}

                <form onSubmit={submit} className="mt-5 flex flex-col gap-3">
                    <label className="text-[12.5px] text-white/55" htmlFor="wp-name">Tên hiển thị trong phòng</label>
                    <input id="wp-name" autoFocus value={value} onChange={e => setValue(e.target.value)} maxLength={MAX_NAME}
                        placeholder="Ví dụ: Minh Anh"
                        className="h-11 px-4 rounded-xl text-[14px] text-white bg-white/[0.05] border border-white/10 outline-none focus:border-[#22d3a5]/60 transition" />
                    <button type="submit" className="h-11 rounded-xl text-[14px] font-semibold bg-[#22d3a5] text-[#041a11] hover:brightness-110 transition">
                        Vào phòng
                    </button>
                </form>
            </div>
        </Shell>
    );
}

/* ── Phòng ── */
type Tab = "chat" | "members" | "settings";

function Room({ code, name, onRename }: { code: string; name: string; onRename: () => void }) {
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [reactions, setReactions] = useState<FloatingReaction[]>([]);
    const membersRef = useRef<WatchRoom["members"]>([]);
    const roomRef = useRef<WatchRoom | null>(null);

    const onReaction = useCallback((emoji: string, who: string) => {
        const id = Date.now() + Math.random();
        setReactions(list => [...list.slice(-20), { id, emoji, name: who, x: 8 + Math.random() * 84 }]);
        window.setTimeout(() => setReactions(list => list.filter(x => x.id !== id)), 3000);
    }, []);

    /* Chủ phòng nhận yêu cầu điều khiển từ thành viên (khi đã cho phép) */
    const onControlRequest = useCallback((req: ControlRequest, from: string) => {
        const room = roomRef.current;
        if (!room?.room?.allowControl) return;
        const who = membersRef.current.find(m => m.clientId === from)?.name ?? "Ai đó";
        const v = videoRef.current;
        /* Trình phát nhúng (không có thẻ video): "phát" = cả phòng nạp lại từ vị trí được yêu cầu */
        if (!v) {
            if (req.action !== "play") return;
            const pb = room.playback;
            const pos = typeof req.position === "number" ? req.position
                : !pb ? 0 : pb.playing ? pb.position + (room.now() - pb.at) / 1000 : pb.position;
            void room.publishSync({ ver: room.room.ver, ep: room.room.ep, playing: true, position: Math.max(0, pos), rate: 1, epoch: (pb?.epoch ?? 0) + 1 });
            toast(`${who} đã bấm phát cho cả phòng`);
            return;
        }
        if (req.action === "play") { void v.play().catch(() => {}); toast(`${who} đã bấm phát`); }
        if (req.action === "pause") { v.pause(); toast(`${who} đã tạm dừng`); }
        if (req.action === "seek" && typeof req.position === "number") { v.currentTime = Math.max(0, req.position); toast(`${who} đã tua phim`); }
    }, []);

    const room = useWatchRoom(code, name, { onReaction, onControlRequest });
    roomRef.current = room;
    membersRef.current = room.members;

    const [tab, setTab] = useState<Tab>("chat");
    const [movie, setMovie] = useState<Movie | null>(null);
    const [servers, setServers] = useState<Server[]>([]);
    const source = room.room?.source;
    const slug = room.room?.slug;

    /* Phim của phòng lấy theo nguồn của phòng (không theo nguồn đang chọn trên máy này) */
    useEffect(() => {
        if (!source || !slug) return;
        let alive = true;
        movieApi(source).detail(slug)
            .then(d => { if (alive) { setMovie(d.movie); setServers(d.episodes ?? []); } })
            .catch(() => toast.error("Không tải được thông tin phim"));
        return () => { alive = false; };
    }, [source, slug]);

    /* Có người xin vào → báo chủ phòng */
    const lobbyCount = room.lobby.length;
    const prevLobby = useRef(0);
    useEffect(() => {
        if (room.isHost && lobbyCount > prevLobby.current) toast.info("Có người đang chờ duyệt vào phòng", { action: { label: "Xem", onClick: () => setTab("members") } });
        prevLobby.current = lobbyCount;
    }, [lobbyCount, room.isHost]);

    const head = <><title>{`Phòng ${code} - Xem chung | MoxiMovie`}</title><meta name="robots" content="noindex" /></>;

    switch (room.status) {
        case "connecting":
            return <>{head}<Loading text="Đang vào phòng…" /></>;
        case "waiting":
            return (
                <>{head}
                    <Screen
                        title="Đang chờ chủ phòng duyệt"
                        desc={`Chủ phòng ${room.room?.hostName ?? ""} sẽ thấy yêu cầu của bạn và cho bạn vào. Cứ để trang này mở nhé.`}
                        icon={<ThreeDot variant="pulsate" color="#22d3a5" size="small" text="" textColor="" />}
                        action={<button type="button" onClick={() => router.push("/phong")} className="text-[13px] text-white/60 hover:text-white">Huỷ</button>}
                    />
                </>
            );
        case "joined":
            break;
        default:
            return (
                <>{head}
                    <Screen
                        title={room.status === "closed" ? "Phòng đã đóng" : room.status === "not-found" ? "Không tìm thấy phòng" : "Không vào được phòng"}
                        desc={room.error || "Có lỗi xảy ra, hãy thử lại."}
                        action={<BackToRooms />}
                    />
                </>
            );
    }

    const r = room.room;
    const ver = r?.ver ?? 0;
    const ep = r?.ep ?? 0;
    const episodes = servers[ver]?.server_data ?? [];

    return (
        <div className="relative z-10 max-w-[1500px] mx-auto px-3 sm:px-4 pt-24 sm:pt-28 pb-12">
            {head}

            {/* ── Thanh trên ── */}
            <div className="flex items-center gap-3 flex-wrap mb-4">
                <Link href="/phong" className="h-9 px-3 rounded-xl flex items-center gap-1.5 text-[13px] text-white/65 hover:text-white bg-white/[0.06] border border-white/10">
                    <ArrowLeft size={15} /> Rời phòng
                </Link>
                <div className="min-w-0 flex-1">
                    <h1 className="text-[17px] sm:text-[19px] font-bold text-white truncate">{r?.movieName}</h1>
                    <p className="text-[12.5px] text-white/45">
                        {episodes.length > 1 && <>{episodeLabel(episodes[ep]?.name, ep)} · </>}
                        Chủ phòng <span className="text-[#f6d46b]">{r?.hostName}</span>
                    </p>
                </div>
                <InviteBox code={code} />
            </div>

            {!room.hostOnline && !room.isHost && (
                <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] text-[#f6d46b] bg-[#f6d46b]/[0.08] border border-[#f6d46b]/20">
                    <WifiOff size={15} /> Chủ phòng đang mất kết nối. Phim vẫn chạy; nếu sau 20 giây chưa quay lại, người vào phòng sớm nhất sẽ tự nhận quyền chủ phòng.
                </div>
            )}

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
                {/* ── Trình phát + danh sách tập ── */}
                <div className="min-w-0">
                    <div className="relative w-full rounded-2xl mb-12"
                        style={{ aspectRatio: "16/9", boxShadow: "0 0 0 1px rgba(255,255,255,0.07), 0 24px 80px rgba(0,0,0,0.8)" }}>
                        {movie ? (
                            <RoomPlayer room={room} movie={movie} servers={servers} videoRef={videoRef} reactions={reactions} />
                        ) : (
                            <div className="absolute inset-0 rounded-2xl bg-black flex items-center justify-center"><ThreeDot variant="bounce" color="#22d3a5" size="small" text="" textColor="" /></div>
                        )}
                    </div>

                    {episodes.length > 1 && (
                        <EpisodePicker room={room} servers={servers} />
                    )}
                </div>

                {/* ── Bảng bên: chat / thành viên / phòng ── */}
                <aside className="flex flex-col rounded-2xl bg-[#1b1e2a]/95 border border-white/[0.07] overflow-hidden h-[560px] lg:h-[calc(100vh-150px)] lg:max-h-[760px] lg:sticky lg:top-24">
                    <div className="flex border-b border-white/[0.07] shrink-0">
                        <TabButton active={tab === "chat"} onClick={() => setTab("chat")} icon={<MessageCircle size={15} />} label="Trò chuyện" />
                        <TabButton active={tab === "members"} onClick={() => setTab("members")} icon={<Users size={15} />}
                            label={`Thành viên ${room.members.length}`} dot={room.isHost && lobbyCount > 0} />
                        <TabButton active={tab === "settings"} onClick={() => setTab("settings")} icon={room.isHost ? <Settings2 size={15} /> : <Crown size={15} />} label="Phòng" />
                    </div>
                    <div className="flex-1 min-h-0">
                        {tab === "chat" && <ChatPanel room={room} />}
                        {tab === "members" && <MembersPanel room={room} />}
                        {tab === "settings" && <RoomSettings room={room} code={code} />}
                    </div>
                    <div className="shrink-0 flex items-center justify-between gap-2 px-3 py-2 border-t border-white/[0.07] text-[12px] text-white/40">
                        <span className="flex items-center gap-2 min-w-0">
                            <Avatar name={name} color={room.members.find(m => m.isMe)?.color ?? 0} size={22} />
                            <span className="truncate">{name}{room.isHost && " · chủ phòng"}</span>
                        </span>
                        <button type="button" onClick={onRename} className="hover:text-white shrink-0">Đổi tên</button>
                    </div>
                </aside>
            </div>
        </div>
    );
}

function EpisodePicker({ room, servers }: { room: WatchRoom; servers: Server[] }) {
    const r = room.room;
    const ver = r?.ver ?? 0;
    const ep = r?.ep ?? 0;
    const list = servers[ver]?.server_data ?? [];
    const pick = (v: number, e: number) => {
        if (!room.isHost) { toast.info("Chỉ chủ phòng đổi tập được"); return; }
        if (v === ver && e === ep) return;
        void room.setEpisode(v, e);
    };
    return (
        <div className="rounded-2xl p-4 bg-[#1b1e2a]/80 border border-white/[0.06]">
            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                <h2 className="text-[14px] font-semibold text-white">Danh sách tập</h2>
                {servers.length > 1 && (
                    <div className="flex gap-1.5 flex-wrap">
                        {servers.map((s, i) => (
                            <button key={i} type="button" onClick={() => pick(i, 0)} disabled={!room.isHost && i !== ver}
                                className={`h-7 px-2.5 rounded-lg text-[11.5px] font-medium transition ${i === ver ? "bg-[#22d3a5] text-[#041a11]" : "bg-white/[0.06] text-white/60 hover:bg-white/10 disabled:opacity-40"}`}>
                                {s.server_name ?? `Server ${i + 1}`}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            {!room.isHost && <p className="text-[12px] text-white/35 -mt-1 mb-3">Chủ phòng chọn tập cho cả phòng.</p>}
            <div className="grid grid-cols-5 sm:grid-cols-8 xl:grid-cols-10 gap-1.5 max-h-56 overflow-y-auto pr-1">
                {list.map((e, i) => (
                    <button key={`${e.slug}-${i}`} type="button" onClick={() => pick(ver, i)} aria-current={i === ep}
                        className={`h-9 rounded-lg text-[12px] font-medium truncate px-1 transition ${i === ep
                            ? "bg-[#22d3a5] text-[#041a11] shadow-[0_0_14px_rgba(34,211,165,0.35)]"
                            : room.isHost ? "bg-white/[0.06] text-white/70 hover:bg-white/10" : "bg-white/[0.04] text-white/40 cursor-default"}`}>
                        {String(e.name ?? i + 1).replace(/^tập\s*/i, "")}
                    </button>
                ))}
            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon, label, dot }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; dot?: boolean }) {
    return (
        <button type="button" onClick={onClick} aria-pressed={active}
            className={`relative flex-1 h-11 flex items-center justify-center gap-1.5 text-[12.5px] font-medium border-b-2 transition ${active ? "border-[#22d3a5] text-[#22d3a5]" : "border-transparent text-white/50 hover:text-white"}`}>
            {icon}<span className="truncate">{label}</span>
            {dot && <span className="absolute top-2.5 right-3 w-2 h-2 rounded-full bg-[#f6d46b]" />}
        </button>
    );
}

/* ── Màn hình trạng thái ── */
function Shell({ children }: { children: React.ReactNode }) {
    return <div className="relative z-10 min-h-[70vh] flex items-center px-4 pt-28 pb-16">{children}</div>;
}

function Screen({ title, desc, action, icon }: { title: string; desc: string; action?: React.ReactNode; icon?: React.ReactNode }) {
    return (
        <Shell>
            <div className="w-full max-w-md mx-auto text-center rounded-3xl p-7 bg-[#1f2230] border border-white/[0.07]">
                {icon && <div className="flex justify-center mb-3">{icon}</div>}
                <h1 className="text-xl font-bold text-white">{title}</h1>
                <p className="mt-2 text-[13.5px] text-white/55 leading-relaxed">{desc}</p>
                {action && <div className="mt-5 flex justify-center">{action}</div>}
            </div>
        </Shell>
    );
}

function Loading({ text = "Đang tải…" }: { text?: string }) {
    return (
        <Shell>
            <div className="mx-auto flex flex-col items-center gap-3 text-[13px] text-white/50">
                <ThreeDot variant="bounce" color="#22d3a5" size="medium" text="" textColor="" />
                {text}
            </div>
        </Shell>
    );
}

function BackToRooms() {
    return (
        <Link href="/phong" className="h-10 px-5 rounded-xl flex items-center text-[13.5px] font-semibold bg-[#22d3a5] text-[#041a11] hover:brightness-110">
            Về trang phòng xem chung
        </Link>
    );
}
