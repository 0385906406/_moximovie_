"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { MAX_CHAT, REACTIONS, type ChatMessage } from "@/lib/watchParty/types";
import type { WatchRoom } from "@/hooks/useWatchRoom";

const time = (ms: number) => new Date(ms).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

export default function ChatPanel({ room }: { room: WatchRoom }) {
    const [text, setText] = useState("");
    const listRef = useRef<HTMLDivElement>(null);
    const stick = useRef(true);

    /* Tự cuộn xuống tin mới, trừ khi người xem đang cuộn lên đọc tin cũ */
    useEffect(() => {
        const el = listRef.current;
        if (el && stick.current) el.scrollTop = el.scrollHeight;
    }, [room.messages]);

    const send = async () => {
        if (await room.sendChat(text)) setText("");
    };

    return (
        <div className="flex flex-col h-full min-h-0">
            <div
                ref={listRef}
                onScroll={e => {
                    const el = e.currentTarget;
                    stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
                }}
                className="flex-1 min-h-0 overflow-y-auto px-3 py-3 flex flex-col gap-2"
            >
                {room.messages.length === 0 && (
                    <p className="m-auto text-center text-[12.5px] text-white/30 px-6 leading-relaxed">
                        Chưa có tin nhắn. Chào mọi người một câu đi! 👋
                    </p>
                )}
                {room.messages.map(m => <Message key={m.id} m={m} mine={m.clientId === room.clientId} host={m.clientId === room.hostId} />)}
            </div>

            {/* Thả cảm xúc: hiện bay lên trên khung phim của mọi người */}
            <div className="flex items-center gap-1 px-3 pt-2 pb-1 border-t border-white/[0.06] overflow-x-auto">
                {REACTIONS.map(e => (
                    <button key={e} type="button" onClick={() => room.sendReaction(e)} aria-label={`Thả ${e}`}
                        className="w-8 h-8 shrink-0 rounded-lg text-[17px] hover:bg-white/10 active:scale-90 transition">
                        {e}
                    </button>
                ))}
            </div>

            <form className="flex items-center gap-2 px-3 pb-3 pt-1" onSubmit={e => { e.preventDefault(); void send(); }}>
                <input
                    value={text}
                    onChange={e => setText(e.target.value)}
                    maxLength={MAX_CHAT}
                    placeholder="Nhắn gì đó…"
                    aria-label="Tin nhắn"
                    className="flex-1 min-w-0 h-10 px-3.5 rounded-xl text-[13.5px] text-white placeholder:text-white/30 bg-white/[0.05] border border-white/[0.08] outline-none focus:border-[#22d3a5]/50 transition"
                />
                <button type="submit" disabled={!text.trim()} aria-label="Gửi"
                    className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center bg-[#22d3a5] text-[#041a11] disabled:opacity-30 transition hover:brightness-110">
                    <Send size={16} />
                </button>
            </form>
        </div>
    );
}

function Message({ m, mine, host }: { m: ChatMessage; mine: boolean; host: boolean }) {
    if (m.system) {
        return <p className="text-center text-[11.5px] text-white/35 py-0.5">{m.text}</p>;
    }
    return (
        <div className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}>
            <Avatar name={m.name} color={m.color} size={28} />
            <div className={`max-w-[78%] flex flex-col ${mine ? "items-end" : "items-start"}`}>
                <span className="text-[11px] text-white/40 mb-0.5 flex items-center gap-1">
                    {!mine && <span className="font-medium" style={{ color: `hsl(${m.color} 70% 70%)` }}>{m.name}</span>}
                    {host && !mine && <span className="text-[9.5px] px-1 rounded bg-[#f6d46b]/15 text-[#f6d46b]">Chủ phòng</span>}
                    <span>{time(m.at)}</span>
                </span>
                <p className={`px-3 py-2 rounded-2xl text-[13.5px] leading-snug break-words whitespace-pre-wrap ${mine
                    ? "bg-[#22d3a5]/15 text-white rounded-tr-md"
                    : "bg-white/[0.06] text-white/90 rounded-tl-md"}`}>
                    {m.text}
                </p>
            </div>
        </div>
    );
}

export function Avatar({ name, color, size = 32 }: { name: string; color: number; size?: number }) {
    const letter = name.trim().charAt(0).toUpperCase() || "?";
    return (
        <span aria-hidden className="shrink-0 rounded-full flex items-center justify-center font-semibold select-none"
            style={{ width: size, height: size, fontSize: size * 0.42, background: `hsl(${color} 45% 28%)`, color: `hsl(${color} 80% 82%)` }}>
            {letter}
        </span>
    );
}
