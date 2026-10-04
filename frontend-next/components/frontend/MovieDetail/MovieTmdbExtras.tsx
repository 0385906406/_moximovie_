"use client";

import { useEffect, useRef, useState } from "react";

import type { TmdbExtras } from "@/lib/tmdb";

/* Không import hằng số từ lib/tmdb (file đó có API key dùng trên server) */
const IMG = "https://image.tmdb.org/t/p";

/* Hiện dần khi cuộn tới */
function useReveal<T extends HTMLElement>() {
    const ref = useRef<T>(null);
    const [shown, setShown] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const io = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { setShown(true); io.disconnect(); }
        }, { rootMargin: "0px 0px -60px 0px" });
        io.observe(el);
        return () => io.disconnect();
    }, []);
    return { ref, shown };
}

function SectionTitle({ icon, children, extra }: { icon: React.ReactNode; children: React.ReactNode; extra?: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-3 mb-3.5">
            <h3 className="flex items-center gap-2 text-white font-bold text-[15px] sm:text-base">
                <span className="w-7 h-7 rounded-lg bg-[#22d3a5]/10 border border-[#22d3a5]/20 text-[#22d3a5] flex items-center justify-center">{icon}</span>
                {children}
            </h3>
            {extra}
        </div>
    );
}

export default function MovieTmdbExtras({ data }: { data: TmdbExtras }) {
    const { ref, shown } = useReveal<HTMLDivElement>();

    return (
        <div ref={ref} className={`tx-root relative mt-6 sm:mt-8 space-y-8 ${shown ? "tx-shown" : ""}`}>
            {/* ── Điểm + thông tin nhanh ── */}
            {data.tagline && (
                <div className="tx-item flex items-center gap-4 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-white/[0.04] to-transparent border border-white/[0.06]">
                    <div className="min-w-0 flex-1">
                        {data.tagline && <p className="mt-1 text-white/55 text-[13px] italic line-clamp-2">&ldquo;{data.tagline}&rdquo;</p>}
                    </div>
                </div>
            )}

            <style>{`
                .tx-root .tx-item { opacity: 0; transform: translateY(16px); }
                .tx-shown .tx-item { animation: txIn .6s cubic-bezier(.16,1,.3,1) both; }
                .tx-shown > .tx-item:nth-child(2) { animation-delay: .08s; }
                .tx-shown > .tx-item:nth-child(3) { animation-delay: .16s; }
                .tx-shown > .tx-item:nth-child(4) { animation-delay: .24s; }
                .tx-scroll { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.15) transparent; }
                .tx-scroll::-webkit-scrollbar { height: 4px; }
                .tx-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,.15); border-radius: 99px; }
                @keyframes txIn   { to { opacity: 1; transform: none; } }
                @media (prefers-reduced-motion: reduce) {
                    .tx-root .tx-item { opacity: 1; transform: none; animation: none !important; }
                }
            `}</style>
        </div>
    );
}
