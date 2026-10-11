"use client";

import { useState } from "react";
import { Crown, MoreHorizontal, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "./ChatPanel";
import type { Member, WatchRoom } from "@/hooks/useWatchRoom";
import { MAX_MEMBERS } from "@/lib/watchParty/types";

export default function MembersPanel({ room }: { room: WatchRoom }) {
    return (
        <div className="h-full overflow-y-auto px-3 py-3 flex flex-col gap-4">
            {/* Phòng chờ (chỉ chủ phòng thấy) */}
            {room.isHost && room.room?.approval && (
                <section>
                    <h3 className="text-[11px] uppercase tracking-wider font-semibold text-white/35 mb-2 px-1">
                        Đang chờ duyệt {room.lobby.length > 0 && <span className="text-[#f6d46b]">({room.lobby.length})</span>}
                    </h3>
                    {room.lobby.length === 0 ? (
                        <p className="text-[12.5px] text-white/30 px-1">Chưa có ai xin vào.</p>
                    ) : (
                        <ul className="flex flex-col gap-1.5">
                            {room.lobby.map(m => (
                                <li key={m.clientId} className="flex items-center gap-2.5 p-2 rounded-xl bg-[#f6d46b]/[0.06] border border-[#f6d46b]/20">
                                    <Avatar name={m.name} color={m.color} />
                                    <span className="flex-1 min-w-0 truncate text-[13.5px] text-white">{m.name}</span>
                                    <button type="button" onClick={() => room.admit(m.clientId)} aria-label={`Cho ${m.name} vào`}
                                        className="h-8 px-2.5 rounded-lg text-[12px] font-semibold bg-[#22d3a5] text-[#041a11] flex items-center gap-1 hover:brightness-110">
                                        <UserCheck size={14} /> Duyệt
                                    </button>
                                    <button type="button" onClick={() => room.kick(m.clientId, false)} aria-label={`Từ chối ${m.name}`}
                                        className="h-8 w-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10">
                                        <UserX size={15} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            )}

            <section>
                <h3 className="text-[11px] uppercase tracking-wider font-semibold text-white/35 mb-2 px-1">
                    Trong phòng ({room.members.length}/{MAX_MEMBERS})
                </h3>
                <ul className="flex flex-col gap-1">
                    {room.members.map(m => <MemberRow key={m.clientId} m={m} room={room} />)}
                </ul>
            </section>
        </div>
    );
}

function MemberRow({ m, room }: { m: Member; room: WatchRoom }) {
    const [menu, setMenu] = useState(false);
    const canManage = room.isHost && !m.isMe;

    const act = async (fn: () => Promise<void>, done: string) => {
        setMenu(false);
        try { await fn(); toast.success(done); } catch (e) { toast.error(e instanceof Error ? e.message : "Không thực hiện được"); }
    };

    return (
        <li className="relative flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/[0.04]">
            <Avatar name={m.name} color={m.color} />
            <span className="flex-1 min-w-0">
                <span className="flex items-center gap-1.5">
                    <span className="truncate text-[13.5px] text-white">{m.name}</span>
                    {m.isMe && <span className="text-[10.5px] text-white/35">(bạn)</span>}
                </span>
                {m.isHost && (
                    <span className="flex items-center gap-1 text-[11px] text-[#f6d46b]"><Crown size={11} /> Chủ phòng</span>
                )}
            </span>
            {canManage && (
                <>
                    <button type="button" onClick={() => setMenu(v => !v)} aria-label={`Tuỳ chọn cho ${m.name}`} aria-expanded={menu}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/45 hover:text-white hover:bg-white/10">
                        <MoreHorizontal size={16} />
                    </button>
                    {menu && (
                        <div className="absolute right-2 top-11 z-20 w-48 p-1 rounded-xl bg-[#232633] border border-white/10 shadow-2xl" role="menu">
                            <MenuItem onClick={() => act(() => room.transferHost(m.clientId), `${m.name} giờ là chủ phòng`)}>
                                <Crown size={14} /> Giao quyền chủ phòng
                            </MenuItem>
                            <MenuItem onClick={() => act(() => room.kick(m.clientId, false), `Đã mời ${m.name} ra khỏi phòng`)}>
                                <UserX size={14} /> Mời ra khỏi phòng
                            </MenuItem>
                            <MenuItem danger onClick={() => act(() => room.kick(m.clientId, true), `Đã chặn ${m.name}`)}>
                                <UserX size={14} /> Chặn khỏi phòng
                            </MenuItem>
                        </div>
                    )}
                </>
            )}
        </li>
    );
}

function MenuItem({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
    return (
        <button type="button" role="menuitem" onClick={onClick}
            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12.5px] text-left transition ${danger ? "text-red-300 hover:bg-red-500/10" : "text-white/80 hover:bg-white/10"}`}>
            {children}
        </button>
    );
}
