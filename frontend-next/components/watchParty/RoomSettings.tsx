"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import type { WatchRoom } from "@/hooks/useWatchRoom";

export function roomLink(code: string) {
    return `${window.location.origin}/phong/${code}`;
}

/* Mã phòng + link mời: bấm để sao chép, điện thoại thì mở bảng chia sẻ */
export function InviteBox({ code, compact }: { code: string; compact?: boolean }) {
    const [copied, setCopied] = useState<"code" | "link" | null>(null);

    const copy = async (what: "code" | "link") => {
        try {
            await navigator.clipboard.writeText(what === "code" ? code : roomLink(code));
            setCopied(what);
            toast.success(what === "code" ? "Đã sao chép mã phòng" : "Đã sao chép link mời");
            window.setTimeout(() => setCopied(null), 1600);
        } catch {
            toast.error("Không sao chép được, hãy chép thủ công");
        }
    };

    const share = async () => {
        const data = { title: "Xem phim cùng mình trên MoxiMovie", text: `Vào phòng xem chung, mã phòng: ${code}`, url: roomLink(code) };
        if (navigator.share) {
            try { await navigator.share(data); } catch { /* người dùng huỷ */ }
        } else {
            void copy("link");
        }
    };

    return (
        <div className={`flex items-center gap-2 ${compact ? "" : "flex-wrap"}`}>
            <button type="button" onClick={() => copy("code")} title="Sao chép mã phòng"
                className="group h-9 pl-3 pr-2.5 rounded-xl flex items-center gap-2 bg-white/[0.06] border border-white/10 hover:border-[#22d3a5]/50 transition">
                <span className="text-[10.5px] uppercase tracking-wider text-white/40">Mã</span>
                <span className="font-mono text-[15px] font-semibold tracking-[0.18em] text-white">{code}</span>
                {copied === "code" ? <Check size={14} className="text-[#22d3a5]" /> : <Copy size={14} className="text-white/40 group-hover:text-white" />}
            </button>
            <button type="button" onClick={share}
                className="h-9 px-3.5 rounded-xl flex items-center gap-2 text-[13px] font-semibold bg-[#22d3a5] text-[#041a11] hover:brightness-110 transition">
                <Share2 size={14} /> Mời bạn bè
            </button>
        </div>
    );
}

export default function RoomSettings({ room, code }: { room: WatchRoom; code: string }) {
    const [confirmClose, setConfirmClose] = useState(false);
    const r = room.room;
    if (!r) return null;

    if (!room.isHost) {
        return (
            <div className="h-full overflow-y-auto px-4 py-4 flex flex-col gap-3 text-[13px] text-white/60 leading-relaxed">
                <p>Chủ phòng <b className="text-white">{r.hostName}</b> điều khiển việc phát phim và đổi tập.</p>
                <p>{r.allowControl
                    ? "Bạn được bấm phát/dừng/tua — yêu cầu sẽ được gửi tới chủ phòng và áp dụng cho cả phòng."
                    : "Bạn chỉ xem; nếu tự bấm dừng hay tua, trình phát sẽ tự quay về đúng vị trí của phòng."}</p>
                <div className="mt-2"><InviteBox code={code} /></div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto px-4 py-4 flex flex-col gap-4">
            <Toggle
                label="Duyệt người vào phòng"
                desc="Người có mã/link phải chờ bạn bấm duyệt mới được vào."
                on={r.approval}
                onChange={v => room.updateRoom({ approval: v })}
            />
            <Toggle
                label="Cho thành viên điều khiển"
                desc="Thành viên bấm phát/dừng/tua sẽ áp dụng cho cả phòng."
                on={r.allowControl}
                onChange={v => room.updateRoom({ allowControl: v })}
            />
            {r.banned.length > 0 && (
                <div className="flex items-center justify-between gap-3 text-[12.5px] text-white/50">
                    <span>Đã chặn {r.banned.length} người</span>
                    <button type="button" onClick={() => room.updateRoom({ banned: [] })} className="text-[#22d3a5] hover:underline">Bỏ chặn tất cả</button>
                </div>
            )}

            <div className="mt-auto pt-4 border-t border-white/[0.06]">
                {confirmClose ? (
                    <div className="flex flex-col gap-2">
                        <p className="text-[12.5px] text-white/60">Đóng phòng sẽ đưa mọi người ra ngoài. Chắc chắn?</p>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => room.closeRoom()} className="flex-1 h-9 rounded-xl text-[13px] font-semibold bg-red-500/90 text-white hover:bg-red-500">Đóng phòng</button>
                            <button type="button" onClick={() => setConfirmClose(false)} className="flex-1 h-9 rounded-xl text-[13px] text-white/70 bg-white/[0.06] hover:bg-white/10">Huỷ</button>
                        </div>
                    </div>
                ) : (
                    <button type="button" onClick={() => setConfirmClose(true)}
                        className="w-full h-9 rounded-xl text-[13px] font-medium text-red-300 bg-red-500/10 hover:bg-red-500/15 transition">
                        Đóng phòng
                    </button>
                )}
            </div>
        </div>
    );
}

function Toggle({ label, desc, on, onChange }: { label: string; desc: string; on: boolean; onChange: (v: boolean) => void }) {
    return (
        <label className="flex items-start gap-3 cursor-pointer select-none">
            <span className="flex-1">
                <span className="block text-[13.5px] font-medium text-white">{label}</span>
                <span className="block text-[12px] text-white/45 mt-0.5 leading-relaxed">{desc}</span>
            </span>
            <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
                className={`relative shrink-0 mt-0.5 w-10 h-6 rounded-full transition ${on ? "bg-[#22d3a5]" : "bg-white/15"}`}>
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
            </button>
        </label>
    );
}
