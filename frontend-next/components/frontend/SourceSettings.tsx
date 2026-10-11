"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { getClientSource, setClientSource, SOURCE_INFO, type MovieSource } from "@/lib/movieSource";

/* Nút cài đặt góc dưới bên phải: chọn máy chủ phim (trong nước / quốc tế).
   Đổi máy chủ → tải lại trang; đang ở trang phim thì về /phimhay vì 2 nguồn có slug phim khác nhau. */
const ORDER: MovieSource[] = ["phimapi", "vodphim"];

export default function SourceSettings() {
    const [open, setOpen] = useState(false);
    const [source, setSource] = useState<MovieSource | null>(null);
    const [switching, setSwitching] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    useEffect(() => { setSource(getClientSource()); }, []);

    /* Bấm ra ngoài hoặc Esc → đóng */
    useEffect(() => {
        if (!open) return;
        const onDown = (e: PointerEvent) => {
            if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
        document.addEventListener("pointerdown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("pointerdown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    /* Trong phòng xem chung, phòng có nguồn riêng → ẩn nút (cũng tránh đè ô chat) */
    const inRoom = /^\/phong\/[^/]+/.test(pathname ?? "");

    const choose = (next: MovieSource) => {
        if (next === source || switching) { setOpen(false); return; }
        setClientSource(next);
        setSource(next);
        setSwitching(true);
        const onMoviePage = /^\/(phim|xem-phim)\/[^/]+/.test(pathname ?? "");
        if (onMoviePage) window.location.href = "/phimhay";
        else window.location.reload();
    };

    if (inRoom) return null;

    return (
        <div ref={rootRef} className="ss-root">
            <style>{CSS}</style>

            {open && (
                <div className="ss-panel" role="dialog" aria-label="Cài đặt máy chủ phim">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-[13px] font-semibold text-white">Máy chủ phim</p>
                        <button type="button" onClick={() => setOpen(false)} aria-label="Đóng"
                            className="w-6 h-6 flex items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/10 transition">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>
                    </div>
                    <p className="text-[11.5px] text-white/40 mb-3 leading-relaxed">
                        Không xem được phim hoặc trang tải chậm? Thử đổi sang máy chủ còn lại.
                    </p>

                    <div className="flex flex-col gap-2">
                        {ORDER.map(key => {
                            const info = SOURCE_INFO[key];
                            const active = key === source;
                            return (
                                <button key={key} type="button" onClick={() => choose(key)} disabled={switching}
                                    aria-pressed={active}
                                    className={`ss-option ${active ? "ss-active" : ""}`}>
                                    <span className="ss-radio" aria-hidden>{active && <span />}</span>
                                    <span className="flex-1 min-w-0 text-left">
                                        <span className="flex items-center gap-2 flex-wrap">
                                            <span className="text-[13px] font-semibold text-white">{info.label}</span>
                                            <span className="ss-badge">{info.region}</span>
                                        </span>
                                        <span className="block mt-1 text-[11.5px] leading-relaxed text-white/45">{info.desc}</span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {switching && (
                        <p className="mt-3 text-[11.5px] text-[#22d3a5]">Đang chuyển máy chủ…</p>
                    )}
                </div>
            )}

            <button type="button" className={`ss-btn ${open ? "ss-btn-open" : ""}`}
                onClick={() => setOpen(o => !o)}
                aria-expanded={open} aria-label="Cài đặt máy chủ phim" title="Cài đặt máy chủ phim">
                <svg className="ss-gear" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                {/* Chấm nhỏ cho biết đang dùng máy chủ quốc tế */}
                {source === "vodphim" && <span className="ss-dot" aria-hidden />}
            </button>
        </div>
    );
}

const CSS = `
.ss-root { position: fixed; right: 20px; bottom: 24px; z-index: 9999; }
@media (max-width: 767px) { .ss-root { bottom: calc(76px + env(safe-area-inset-bottom)); } }

.ss-btn {
    position: relative; width: 44px; height: 44px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    color: #22d3a5; background: rgba(10,12,20,0.92);
    border: 1px solid rgba(34,211,165,0.22);
    box-shadow: 0 8px 24px rgba(0,0,0,0.55);
    backdrop-filter: blur(8px);
    transition: background .2s, border-color .2s, transform .2s;
}
.ss-btn:hover, .ss-btn-open { background: rgba(34,211,165,0.15); border-color: rgba(34,211,165,0.5); transform: scale(1.06); }
.ss-gear { transition: transform .5s cubic-bezier(.22,1,.36,1); }
.ss-btn:hover .ss-gear, .ss-btn-open .ss-gear { transform: rotate(90deg); }
.ss-dot {
    position: absolute; top: 6px; right: 6px; width: 8px; height: 8px; border-radius: 50%;
    background: #f6d46b; box-shadow: 0 0 0 2px rgba(10,12,20,0.95);
}

.ss-panel {
    position: absolute; right: 0; bottom: 56px; width: min(320px, calc(100vw - 40px));
    padding: 14px; border-radius: 16px;
    background: #191B24; border: 1px solid rgba(255,255,255,0.08);
    box-shadow: 0 24px 64px rgba(0,0,0,0.8);
    animation: ssIn .22s cubic-bezier(.22,1,.36,1);
    transform-origin: bottom right;
}
@keyframes ssIn { from { opacity: 0; transform: translateY(8px) scale(.97); } to { opacity: 1; transform: none; } }

.ss-option {
    display: flex; gap: 10px; align-items: flex-start; width: 100%;
    padding: 10px 12px; border-radius: 12px; text-align: left;
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
    transition: background .15s, border-color .15s;
}
.ss-option:hover:not(:disabled) { background: rgba(255,255,255,0.06); }
.ss-option:disabled { cursor: wait; }
.ss-active { background: rgba(34,211,165,0.08); border-color: rgba(34,211,165,0.4); }
.ss-radio {
    flex-shrink: 0; margin-top: 2px; width: 16px; height: 16px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.25); display: flex; align-items: center; justify-content: center;
}
.ss-active .ss-radio { border-color: #22d3a5; }
.ss-radio span { width: 7px; height: 7px; border-radius: 50%; background: #22d3a5; }
.ss-badge {
    font-size: 10px; font-weight: 600; padding: 1px 6px; border-radius: 6px;
    color: rgba(255,255,255,0.55); background: rgba(255,255,255,0.07);
}
`;
