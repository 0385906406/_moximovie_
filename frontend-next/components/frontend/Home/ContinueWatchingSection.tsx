"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import MovieImage from "@/components/frontend/MovieImage";
import { AUTOPLAY_FLAG } from "@/components/frontend/MovieDetailPlay/PlayerControls";
import { useMovieSource } from "@/hooks/useMovieSource";
import { CONTINUE_EVENT, getContinueList, remainingLabel, removeContinue, type ContinueItem } from "@/lib/continueWatching";

/* Hàng "Xem tiếp" kiểu Netflix: phim đang xem dở trên máy này (theo máy chủ phim đang chọn).
   Bấm → mở đúng tập, tự phát và tua tới chỗ đang dừng. Chưa xem gì thì không hiện. */
export default function ContinueWatchingSection() {
    const source = useMovieSource();
    const router = useRouter();
    const [items, setItems] = useState<ContinueItem[]>([]);
    const rowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const load = () => setItems(getContinueList().filter(x => x.source === source));
        load();
        window.addEventListener(CONTINUE_EVENT, load);
        window.addEventListener("storage", load);
        return () => {
            window.removeEventListener(CONTINUE_EVENT, load);
            window.removeEventListener("storage", load);
        };
    }, [source]);

    if (!items.length) return null;

    const open = (it: ContinueItem) => {
        /* Trình phát tự mở rèm và phát; vị trí xem dở do trình phát tự khôi phục */
        try { sessionStorage.setItem(AUTOPLAY_FLAG, "1"); } catch { /* bị chặn */ }
        router.push(`/xem-phim/${it.slug}?ver=${it.ver + 1}&ep=${it.ep + 1}`);
    };
    const scroll = (dir: 1 | -1) => rowRef.current?.scrollBy({ left: dir * rowRef.current.clientWidth * 0.8, behavior: "smooth" });

    return (
        <section className="px-3 sm:px-5 xl:px-6 mt-6" aria-labelledby="continue-title">
            <div className="flex items-center justify-between mb-3">
                <h2 id="continue-title" className="flex items-center gap-2.5 text-[18px] sm:text-[20px] font-bold text-white">
                    <span className="w-1 h-5 rounded-full bg-[#22d3a5]" />
                    Xem tiếp
                </h2>
                {items.length > 2 && (
                    <div className="hidden sm:flex gap-1.5">
                        <button type="button" onClick={() => scroll(-1)} aria-label="Cuộn trái" className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 bg-white/[0.06] hover:bg-white/[0.12] hover:text-white"><ChevronLeft size={16} /></button>
                        <button type="button" onClick={() => scroll(1)} aria-label="Cuộn phải" className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 bg-white/[0.06] hover:bg-white/[0.12] hover:text-white"><ChevronRight size={16} /></button>
                    </div>
                )}
            </div>

            <div ref={rowRef} className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {items.map(it => {
                    const pct = it.duration ? Math.min(100, Math.max(3, (it.position / it.duration) * 100)) : 0;
                    const sub = it.nextUp
                        ? `Tiếp theo: ${it.epLabel}`
                        : [it.epCount > 1 ? it.epLabel : "", remainingLabel(it.position, it.duration)].filter(Boolean).join(" · ");
                    return (
                        <div key={`${it.source}:${it.slug}`} className="group relative shrink-0 snap-start w-[72vw] sm:w-[300px] lg:w-[320px]">
                            <button type="button" onClick={() => open(it)} className="block w-full text-left" aria-label={`Xem tiếp ${it.name} ${it.epLabel}`}>
                                <div className="relative aspect-video rounded-xl overflow-hidden bg-white/5 border border-white/[0.06]">
                                    <MovieImage movie={{ thumb_url: it.thumb, poster_url: it.poster }} prefer="thumb" alt={it.name} fill sizes="(max-width: 640px) 72vw, 320px" className="object-cover transition duration-300 group-hover:scale-[1.04]" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                                    {/* Nút phát khi rê chuột */}
                                    <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                        <span className="w-12 h-12 rounded-full flex items-center justify-center bg-[#22d3a5] text-[#041a11] shadow-lg"><Play size={20} className="fill-current translate-x-[1px]" /></span>
                                    </span>
                                    {it.nextUp && (
                                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-[#f6d46b] text-[#2a1f00]">TẬP MỚI</span>
                                    )}
                                    <div className="absolute inset-x-0 bottom-0 px-3 pb-2.5">
                                        <p className="text-[14px] font-semibold text-white truncate drop-shadow">{it.name}</p>
                                        {sub && <p className="text-[11.5px] text-white/70 truncate">{sub}</p>}
                                    </div>
                                    {/* Thanh tiến độ */}
                                    {pct > 0 && (
                                        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
                                            <div className="h-full bg-[#22d3a5]" style={{ width: `${pct}%` }} />
                                        </div>
                                    )}
                                </div>
                            </button>
                            <button type="button" onClick={() => removeContinue(it.source, it.slug)} aria-label={`Bỏ ${it.name} khỏi Xem tiếp`} title="Bỏ khỏi Xem tiếp"
                                className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center bg-black/60 text-white/80 hover:bg-black/80 hover:text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
                                <X size={14} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
