"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Users, X } from "lucide-react";
import { getClientSource } from "@/lib/movieSource";
import { MAX_NAME, MAX_ROOM_NAME } from "@/lib/watchParty/types";
import { getRoomSecret, getSavedName, saveHostTicket, saveName, saveRoomState } from "@/hooks/useWatchRoom";
import { useAuthStore } from "@/stores/useAuthStore";

interface Props {
    slug: string;
    movieName: string;
    /* server (ver) và tập (ep) đang xem, đếm từ 0 */
    ver: number;
    ep: number;
    onClose: () => void;
}

/* Hộp thoại tạo phòng xem chung từ trang xem phim */
export default function CreateRoomDialog({ slug, movieName, ver, ep, onClose }: Props) {
    const router = useRouter();
    const user = useAuthStore(s => s.user);
    const [name, setName] = useState("");
    const [roomName, setRoomName] = useState("");
    const [approval, setApproval] = useState(false);
    const [allowControl, setAllowControl] = useState(true);
    const [busy, setBusy] = useState(false);

    useEffect(() => { setName(getSavedName() || user?.displayName || ""); }, [user]);
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) onClose(); };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [busy, onClose]);

    const create = async (e: React.FormEvent) => {
        e.preventDefault();
        const n = name.trim().slice(0, MAX_NAME);
        if (n.length < 2) { toast.error("Tên cần ít nhất 2 ký tự"); return; }
        setBusy(true);
        try {
            const res = await fetch("/api/rooms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ secret: getRoomSecret(), source: getClientSource(), slug, ver, ep, name: n, roomName: roomName.trim(), approval, allowControl }),
            });
            const j = await res.json();
            if (!res.ok) throw new Error(j.error ?? "Không tạo được phòng");
            saveName(n);
            saveHostTicket(j.code, j.ticket);
            saveRoomState(j.code, j.state);
            router.push(`/phong/${j.code}`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Không tạo được phòng");
            setBusy(false);
        }
    };

    /* Gắn thẳng vào <body>: nằm trong trang xem phim (có lớp z-index riêng) thì bị thanh menu đè lên */
    return createPortal(
        <div className="fixed inset-0 z-[100000] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="wp-create-title">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !busy && onClose()} />
            <form onSubmit={create}
                className="relative w-full sm:max-w-md max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-6 bg-[#1f2230] border border-white/[0.08] shadow-2xl">
                <button type="button" onClick={onClose} aria-label="Đóng" disabled={busy}
                    className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-white/45 hover:text-white hover:bg-white/10">
                    <X size={16} />
                </button>
                <span className="w-11 h-11 rounded-2xl flex items-center justify-center bg-[#22d3a5]/12 text-[#22d3a5]"><Users size={20} /></span>
                <h2 id="wp-create-title" className="mt-4 text-xl font-bold text-white">Tạo phòng xem chung</h2>
                <p className="mt-1 text-[13px] text-white/50 leading-relaxed">
                    Cùng xem <b className="text-white/85">{movieName}</b> với bạn bè. Bạn là chủ phòng: chọn tập, duyệt người vào, quản lý phòng.
                </p>

                <label htmlFor="wp-room-name-new" className="block mt-5 text-[12.5px] text-white/55">Tên phòng <span className="text-white/30">(không bắt buộc)</span></label>
                <input id="wp-room-name-new" autoFocus value={roomName} onChange={e => setRoomName(e.target.value)} maxLength={MAX_ROOM_NAME}
                    placeholder={`Phòng của ${name.trim() || "bạn"}`}
                    className="mt-1.5 w-full h-11 px-4 rounded-xl text-[14px] text-white bg-white/[0.05] border border-white/10 outline-none focus:border-[#22d3a5]/60 transition" />

                <label htmlFor="wp-host-name" className="block mt-4 text-[12.5px] text-white/55">Tên hiển thị của bạn <span className="text-white/30">(hiện trong nhóm chat)</span></label>
                <input id="wp-host-name" value={name} onChange={e => setName(e.target.value)} maxLength={MAX_NAME}
                    placeholder="Ví dụ: Minh Anh"
                    className="mt-1.5 w-full h-11 px-4 rounded-xl text-[14px] text-white bg-white/[0.05] border border-white/10 outline-none focus:border-[#22d3a5]/60 transition" />

                <label className="mt-4 flex items-start gap-3 cursor-pointer select-none">
                    <input type="checkbox" checked={allowControl} onChange={e => setAllowControl(e.target.checked)} className="mt-1 w-4 h-4 accent-[#22d3a5]" />
                    <span>
                        <span className="block text-[13.5px] text-white">Mọi người cùng điều khiển</span>
                        <span className="block text-[12px] text-white/45">Ai trong phòng cũng phát/dừng/tua được cho cả phòng. Tắt thì chỉ bạn điều khiển.</span>
                    </span>
                </label>

                <label className="mt-3 flex items-start gap-3 cursor-pointer select-none">
                    <input type="checkbox" checked={approval} onChange={e => setApproval(e.target.checked)} className="mt-1 w-4 h-4 accent-[#22d3a5]" />
                    <span>
                        <span className="block text-[13.5px] text-white">Duyệt người vào phòng</span>
                        <span className="block text-[12px] text-white/45">Ai có mã/link cũng phải chờ bạn cho vào. Đổi lại được trong phòng.</span>
                    </span>
                </label>

                <button type="submit" disabled={busy}
                    className="mt-6 w-full h-11 rounded-xl text-[14px] font-semibold bg-[#22d3a5] text-[#041a11] disabled:opacity-50 hover:brightness-110 transition">
                    {busy ? "Đang tạo phòng…" : "Tạo phòng"}
                </button>
            </form>
        </div>,
        document.body,
    );
}
