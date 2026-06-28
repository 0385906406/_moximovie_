"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    UserCircle, Clock, Pencil, Check, X,
    Trash2, Film,
} from "lucide-react";
import { RECENT_KEY, type MovieMini } from "@/components/frontend/Navbar";

/* ── types ── */
type Tab = "thong-tin" | "xem-gan-day";
type MovieRecent = MovieMini & { watchedAt?: number };

/* ── helpers ── */
function isValidVietnameseName(v: string) {
    const t = v.trim();
    return t.length >= 4 && /^[\p{L}\s]+$/u.test(t) && t.split(/\s+/).filter(Boolean).length >= 2;
}

function timeAgo(ts?: number) {
    if (!ts) return "";
    const d = Math.floor((Date.now() - ts) / 1000);
    if (d < 60)    return "Vừa xong";
    if (d < 3600)  return `${Math.floor(d / 60)} phút trước`;
    if (d < 86400) return `${Math.floor(d / 3600)} giờ trước`;
    if (d < 604800) return `${Math.floor(d / 86400)} ngày trước`;
    return new Date(ts).toLocaleDateString("vi-VN");
}

function thumb(url?: string) {
    if (!url) return null;
    return url.startsWith("http") ? url : `https://phimimg.com/${url}`;
}

/* ══════════════════════════════════════════════════════
   TAB: THÔNG TIN
══════════════════════════════════════════════════════ */
function TabThongTin({ name, onNameChange, recCount }: {
    name: string;
    onNameChange: (n: string) => void;
    recCount: number;
}) {
    const [editing, setEditing] = useState(false);
    const [draft,   setDraft]   = useState(name);
    const [saved,   setSaved]   = useState(false);

    const initials = name.trim().split(" ").map(w => w[0]).slice(-2).join("").toUpperCase();

    const handleSave = () => {
        if (!isValidVietnameseName(draft)) return;
        const trimmed = draft.trim();
        localStorage.setItem("mxi_uname", trimmed);
        onNameChange(trimmed);
        setEditing(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleCancel = () => { setDraft(name); setEditing(false); };

    return (
        <div className="w-full">
            {/* Avatar + name card */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#0d1018] overflow-hidden mb-5">
                {/* Banner */}
                <div className="h-20 bg-gradient-to-br from-[#22d3a5]/25 via-[#38bdf8]/10 to-transparent relative">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(34,211,165,0.18),transparent_65%)]" />
                </div>

                <div className="px-5 pb-5 -mt-9">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#22d3a5] to-[#38bdf8] flex items-center justify-center text-xl font-black text-black ring-4 ring-[#0d1018] mb-3">
                        {initials}
                    </div>

                    {/* Name row */}
                    {editing ? (
                        <div className="mb-1">
                            <div className="flex items-center gap-2">
                                <input
                                    autoFocus
                                    value={draft}
                                    onChange={e => setDraft(e.target.value)}
                                    onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }}
                                    maxLength={40}
                                    className="flex-1 bg-white/5 border border-[#22d3a5]/40 rounded-lg px-3 py-2 text-sm font-semibold text-white outline-none focus:border-[#22d3a5] transition-colors"
                                    placeholder="Họ và tên..."
                                />
                                <button onClick={handleSave} disabled={!isValidVietnameseName(draft)}
                                    className="p-2 rounded-lg bg-[#22d3a5] text-black disabled:opacity-30 disabled:cursor-not-allowed">
                                    <Check size={15} />
                                </button>
                                <button onClick={handleCancel}
                                    className="p-2 rounded-lg bg-white/8 text-white/50 hover:bg-white/12">
                                    <X size={15} />
                                </button>
                            </div>
                            {draft.trim().length > 0 && !isValidVietnameseName(draft) && (
                                <p className="text-red-400/70 text-[11px] mt-1.5">Nhập đầy đủ họ và tên (VD: Nguyễn Văn An)</p>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-lg font-bold text-white">{name}</h2>
                            <button onClick={() => { setDraft(name); setEditing(true); }}
                                className="p-1.5 rounded-md text-white/25 hover:text-white/60 hover:bg-white/5 transition-all">
                                <Pencil size={12} />
                            </button>
                        </div>
                    )}

                    {saved && <p className="text-[#22d3a5] text-xs mb-1 animate-pulse">Đã lưu!</p>}
                    <p className="text-white/30 text-xs">Thành viên MoxiMovie</p>
                </div>
            </div>

            {/* Stats */}
            <Link href="?tab=xem-gan-day"
                className="flex flex-col items-center gap-1.5 py-5 rounded-xl border border-white/[0.07] bg-[#0d1018] transition-all hover:border-amber-400/25 hover:bg-amber-400/4 group">
                <div className="group-hover:scale-110 transition-transform"><Clock size={16} className="text-amber-400" /></div>
                <span className="text-2xl font-black text-white">{recCount}</span>
                <span className="text-white/30 text-xs">Xem gần đây</span>
            </Link>
        </div>
    );
}

/* ══════════════════════════════════════════════════════
   TAB: XEM GẦN ĐÂY
══════════════════════════════════════════════════════ */
function TabXemGanDay() {
    const [movies, setMovies] = useState<MovieRecent[]>([]);

    useEffect(() => {
        try { setMovies(JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]")); } catch { }
    }, []);

    const remove = (slug: string) => {
        const next = movies.filter(m => m.slug !== slug);
        setMovies(next);
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    };

    const clearAll = () => { setMovies([]); localStorage.removeItem(RECENT_KEY); };

    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <p className="text-white/40 text-sm">{movies.length} phim đã xem</p>
                {movies.length > 0 && (
                    <button onClick={clearAll}
                        className="flex items-center gap-1.5 text-xs text-white/25 hover:text-red-400 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-red-400/8 border border-transparent hover:border-red-400/15">
                        <Trash2 size={12} /> Xóa lịch sử
                    </button>
                )}
            </div>

            {movies.length === 0 ? (
                <EmptyState icon={<Clock size={28} className="text-white/15" />} text="Chưa có phim nào được xem" />
            ) : (
                <MovieGrid movies={movies} onRemove={remove} showTime />
            )}
        </div>
    );
}

/* ══════════════════════════════════════════════════════
   SHARED: MovieGrid + EmptyState
══════════════════════════════════════════════════════ */
function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/4 flex items-center justify-center">{icon}</div>
            <p className="text-white/25 text-sm">{text}</p>
            <Link href="/phimhay"
                className="px-5 py-2 rounded-full text-sm font-semibold bg-[#22d3a5] text-black hover:bg-[#1ab896] transition-colors">
                Khám phá phim
            </Link>
        </div>
    );
}

function MovieGrid({ movies, onRemove, showTime }: {
    movies: MovieRecent[];
    onRemove: (slug: string) => void;
    showTime: boolean;
}) {
    return (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3">
            {movies.map(m => {
                const t = thumb(m.thumb_url);
                return (
                    <div key={m.slug} className="group relative rounded-xl overflow-hidden border border-white/[0.07] bg-[#0d1018] hover:border-white/15 transition-all">
                        <Link href={`/phim/${m.slug}`}>
                            <div className="aspect-[2/3] overflow-hidden bg-white/5">
                                {t
                                    ? <img src={t} alt={m.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    : <div className="w-full h-full flex items-center justify-center"><Film size={22} className="text-white/15" /></div>
                                }
                                {/* play on hover */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center">
                                        <div className="w-0 h-0 border-y-[6px] border-y-transparent border-l-[10px] border-l-white ml-0.5" />
                                    </div>
                                </div>
                            </div>
                        </Link>

                        {m.quality && (
                            <span className="absolute top-1.5 left-1.5 text-[9px] font-bold bg-[#22d3a5] text-black px-1.5 py-0.5 rounded">
                                {m.quality}
                            </span>
                        )}
                        <button onClick={() => onRemove(m.slug)}
                            className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/60 text-white/30 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all">
                            <Trash2 size={11} />
                        </button>

                        <div className="px-2 py-2">
                            <Link href={`/phim/${m.slug}`}>
                                <p className="text-white/80 text-[11px] font-medium leading-snug line-clamp-2 hover:text-white transition-colors">{m.name}</p>
                            </Link>
                            <div className="flex items-center gap-1 mt-1">
                                {showTime && m.watchedAt
                                    ? <><Clock size={8} className="text-amber-400/50 shrink-0" /><span className="text-white/25 text-[10px]">{timeAgo(m.watchedAt)}</span></>
                                    : m.year ? <span className="text-white/25 text-[10px]">{m.year}</span> : null
                                }
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ══════════════════════════════════════════════════════
   SIDEBAR TAB ITEM
══════════════════════════════════════════════════════ */
const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "thong-tin",    label: "Thông tin",   icon: <UserCircle size={16} /> },
    { id: "xem-gan-day", label: "Xem gần đây", icon: <Clock size={16} /> },
];

/* ══════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════ */
export default function ThongTinPage() {
    return (
        <Suspense>
            <ThongTinInner />
        </Suspense>
    );
}

function ThongTinInner() {
    const router       = useRouter();
    const searchParams = useSearchParams();
    const tabParam     = (searchParams.get("tab") ?? "thong-tin") as Tab;
    const activeTab    = TABS.some(t => t.id === tabParam) ? tabParam : "thong-tin";

    const [name,     setName]     = useState("");
    const [recCount, setRecCount] = useState(0);

    useEffect(() => {
        const n = localStorage.getItem("mxi_uname") ?? "";
        if (!n) { router.replace("/"); return; }
        setName(n);
        try { setRecCount(JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]").length); } catch { }
    }, [router]);

    const handleNameChange = useCallback((n: string) => setName(n), []);

    const initials = name.trim().split(" ").map(w => w[0]).slice(-2).join("").toUpperCase();

    if (!name) return null;

    return (
        <main className="min-h-screen bg-[#0a0c14] text-white pt-28 pb-16">
            <div className="mx-auto max-w-8xl px-3 lg:px-5 xl:px-6">
                <div className="flex gap-5 items-start">

                    {/* ══════════════════════════════
                        SIDEBAR
                    ══════════════════════════════ */}
                    <aside className="hidden xl:block w-56 shrink-0 sticky top-24">
                        {/* User info */}
                        <div className="flex items-center gap-3 px-3 py-4 mb-2">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#22d3a5] to-[#38bdf8] flex items-center justify-center text-sm font-black text-black shrink-0 ring-2 ring-[#22d3a5]/20">
                                {initials}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-white text-sm font-semibold truncate leading-tight">{name.trim().split(" ").pop()}</p>
                                <p className="text-white/30 text-[10px] mt-0.5 truncate">{name}</p>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-white/[0.06] mx-3 mb-2" />

                        {/* Tabs */}
                        <nav className="flex flex-col gap-0.5">
                            {TABS.map(tab => (
                                <Link key={tab.id} href={`?tab=${tab.id}`}
                                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                        activeTab === tab.id
                                            ? "bg-[#22d3a5]/12 text-[#22d3a5] border border-[#22d3a5]/20"
                                            : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
                                    }`}>
                                    <span className={activeTab === tab.id ? "text-[#22d3a5]" : "text-white/30"}>
                                        {tab.icon}
                                    </span>
                                    {tab.label}
                                    {tab.id === "xem-gan-day" && recCount > 0 && <span className="ml-auto text-[10px] bg-white/8 text-white/35 px-1.5 py-0.5 rounded-full">{recCount}</span>}
                                </Link>
                            ))}
                        </nav>
                    </aside>

                    {/* ══════════════════════════════
                        CONTENT
                    ══════════════════════════════ */}
                    <div className="flex-1 min-w-0 pt-1">
                        {/* Mobile: tabs on top — ẩn khi sidebar desktop hiện */}
                        <div className="flex gap-1 mb-6 xl:hidden overflow-x-auto">
                            {TABS.map(tab => (
                                <Link key={tab.id} href={`?tab=${tab.id}`}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all flex-1 justify-center ${
                                        activeTab === tab.id
                                            ? "bg-[#22d3a5]/12 text-[#22d3a5] border border-[#22d3a5]/20"
                                            : "text-white/40 border border-white/[0.07] hover:bg-white/5"
                                    }`}>
                                    {tab.icon}
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </Link>
                            ))}
                        </div>

                        {/* Tab content */}
                        {activeTab === "thong-tin" && (
                            <TabThongTin name={name} onNameChange={handleNameChange} recCount={recCount} />
                        )}
                        {activeTab === "xem-gan-day" && <TabXemGanDay />}
                    </div>
                </div>
            </div>
        </main>
    );
}
