"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Crown, LogIn, MessageCircle, Play, ShieldCheck, Users } from "lucide-react";
import { getRecentRooms, type RecentRoom } from "@/hooks/useWatchRoom";
import { normalizeRoomCode, ROOM_CODE_LENGTH, ROOM_CODE_RE } from "@/lib/watchParty/types";
import MovieImage from "@/components/frontend/MovieImage";

/* Trang /phong: vào phòng bằng mã + hướng dẫn tạo phòng + phòng gần đây */
export default function RoomsHome() {
    const router = useRouter();
    const [code, setCode] = useState("");
    const [recent, setRecent] = useState<RecentRoom[]>([]);
    useEffect(() => { setRecent(getRecentRooms()); }, []);

    const valid = ROOM_CODE_RE.test(code);
    const join = (e: React.FormEvent) => {
        e.preventDefault();
        if (valid) router.push(`/phong/${code}`);
    };

    return (
        <div className="relative z-10 max-w-5xl mx-auto px-4 pt-28 pb-16">
            <title>Phòng xem chung | MoxiMovie</title>
            <meta name="description" content="Tạo phòng xem phim chung với bạn bè: phát cùng lúc, trò chuyện, thả cảm xúc." />

            <header className="text-center max-w-2xl mx-auto">
                <p className="text-[11px] uppercase tracking-[0.25em] text-[#22d3a5] font-semibold">Mới</p>
                <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-white">Phòng xem chung</h1>
                <p className="mt-3 text-[14.5px] text-white/55 leading-relaxed">
                    Xem phim cùng bạn bè ở bất cứ đâu: phim phát cùng lúc trên máy mọi người, vừa xem vừa trò chuyện và thả cảm xúc.
                </p>
            </header>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
                {/* Vào bằng mã */}
                <form onSubmit={join} className="rounded-3xl p-6 bg-[#1f2230] border border-white/[0.07] flex flex-col">
                    <span className="w-11 h-11 rounded-2xl flex items-center justify-center bg-[#22d3a5]/12 text-[#22d3a5]"><LogIn size={20} /></span>
                    <h2 className="mt-4 text-lg font-semibold text-white">Vào phòng bằng mã</h2>
                    <p className="mt-1 text-[13px] text-white/50">Nhập mã {ROOM_CODE_LENGTH} ký tự bạn bè gửi cho bạn, hoặc mở thẳng link mời.</p>
                    <div className="mt-5 flex gap-2">
                        <input
                            value={code}
                            onChange={e => setCode(normalizeRoomCode(e.target.value))}
                            placeholder="VD: K7M2QX"
                            aria-label="Mã phòng"
                            autoComplete="off"
                            spellCheck={false}
                            className="flex-1 min-w-0 h-12 px-4 rounded-xl font-mono text-[18px] tracking-[0.3em] uppercase text-white placeholder:text-white/25 placeholder:tracking-normal placeholder:font-sans placeholder:text-[14px] bg-white/[0.05] border border-white/10 outline-none focus:border-[#22d3a5]/60 transition"
                        />
                        <button type="submit" disabled={!valid}
                            className="h-12 px-5 rounded-xl text-[14px] font-semibold bg-[#22d3a5] text-[#041a11] disabled:opacity-30 hover:brightness-110 transition">
                            Vào
                        </button>
                    </div>
                </form>

                {/* Tạo phòng */}
                <div className="rounded-3xl p-6 bg-[#1f2230] border border-white/[0.07] flex flex-col">
                    <span className="w-11 h-11 rounded-2xl flex items-center justify-center bg-[#f6d46b]/12 text-[#f6d46b]"><Crown size={20} /></span>
                    <h2 className="mt-4 text-lg font-semibold text-white">Tạo phòng của bạn</h2>
                    <ol className="mt-2 text-[13px] text-white/55 leading-relaxed list-decimal pl-4 space-y-1">
                        <li>Mở phim muốn xem rồi vào trang xem phim.</li>
                        <li>Bấm nút <b className="text-white">Xem chung</b> dưới trình phát.</li>
                        <li>Gửi mã phòng hoặc link mời cho bạn bè.</li>
                    </ol>
                    <Link href="/phimhay" className="mt-auto pt-5">
                        <span className="h-12 rounded-xl flex items-center justify-center gap-2 text-[14px] font-semibold text-white bg-white/[0.07] border border-white/10 hover:bg-white/10 transition">
                            <Play size={16} /> Chọn phim để tạo phòng
                        </span>
                    </Link>
                </div>
            </div>

            {recent.length > 0 && (
                <section className="mt-10">
                    <h2 className="text-[13px] uppercase tracking-wider font-semibold text-white/40 mb-3">Phòng gần đây</h2>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {recent.map(r => (
                            <Link key={r.code} href={`/phong/${r.code}`}
                                className="flex gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-[#22d3a5]/40 transition">
                                <span className="relative w-12 aspect-[2/3] rounded-lg overflow-hidden shrink-0 bg-white/5">
                                    <MovieImage movie={{ poster_url: r.poster }} prefer="poster" alt="" fill sizes="96px" className="object-cover" />
                                </span>
                                <span className="min-w-0 text-[12.5px] text-white/50">
                                    <span className="block text-[14px] text-white font-medium truncate">{r.movieName}</span>
                                    <span className="font-mono tracking-[0.15em] text-white/70">{r.code}</span>
                                    {r.host && <span className="ml-2 text-[#f6d46b]">· bạn là chủ phòng</span>}
                                    <span className="block">{new Date(r.at).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}</span>
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            <section className="mt-12 grid gap-4 sm:grid-cols-3">
                {[
                    { icon: <Play size={18} />, title: "Phát cùng lúc", desc: "Chủ phòng bấm phát, dừng, tua — máy mọi người chạy theo, tự bắt kịp nếu bị lệch." },
                    { icon: <MessageCircle size={18} />, title: "Trò chuyện & cảm xúc", desc: "Nhắn tin trong phòng và thả biểu tượng cảm xúc bay trên khung phim." },
                    { icon: <ShieldCheck size={18} />, title: "Chủ phòng quản lý", desc: "Duyệt người vào, mời ra, chặn, giao quyền chủ phòng hoặc cho mọi người cùng điều khiển." },
                ].map(f => (
                    <div key={f.title} className="rounded-2xl p-5 bg-white/[0.03] border border-white/[0.06]">
                        <span className="text-[#22d3a5]">{f.icon}</span>
                        <h3 className="mt-2 text-[14.5px] font-semibold text-white">{f.title}</h3>
                        <p className="mt-1 text-[12.5px] text-white/50 leading-relaxed">{f.desc}</p>
                    </div>
                ))}
            </section>
            <p className="mt-6 text-center text-[12px] text-white/30 flex items-center justify-center gap-1.5"><Users size={13} /> Tối đa 30 người mỗi phòng.</p>
        </div>
    );
}
