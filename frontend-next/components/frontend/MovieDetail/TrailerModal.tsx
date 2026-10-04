"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Play } from "lucide-react";

interface TrailerModalProps {
    trailer: { key: string; name: string };
    onClose: () => void;
}

/* Modal trailer hiện giữa màn hình. Render qua portal để không bị hiệu ứng của trang làm lệch vị trí.
   Đóng bằng nút X, bấm ra nền ngoài, hoặc phím Esc. */
const TrailerModal: React.FC<TrailerModalProps> = ({ trailer, onClose }) => {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [onClose]);

    if (typeof document === "undefined") return null;

    return createPortal(
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Trailer phim"
            onClick={onClose}
            className="tm-backdrop fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6"
        >
            <div
                className="tm-card relative w-full max-w-4xl overflow-hidden rounded-2xl"
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: "linear-gradient(180deg, rgba(30,34,48,0.96), rgba(12,14,22,0.98))",
                    border: "1px solid rgba(34,211,165,0.22)",
                    boxShadow: "0 40px 120px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03) inset, 0 0 60px rgba(34,211,165,0.08)",
                }}
            >
                {/* Thanh tiêu đề */}
                <div className="flex items-center gap-3 px-4 sm:px-5 py-3 border-b border-white/[0.07]">
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gradient-to-r from-red-600 to-red-500 text-white text-[11px] font-extrabold tracking-[0.18em] shadow-[0_0_18px_rgba(239,68,68,0.45)]">
                        <Play className="w-3 h-3" fill="currentColor" />
                        TRAILER
                    </span>
                    <p className="flex-1 min-w-0 truncate text-white font-semibold text-[14px] sm:text-[15px]">{trailer.name}</p>
                    <button
                        onClick={onClose}
                        aria-label="Đóng trailer"
                        className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-white/[0.06] border border-white/10 text-white/70 hover:text-white hover:bg-[#22d3a5]/20 hover:border-[#22d3a5]/40 transition"
                    >
                        <X className="w-4.5 h-4.5" />
                    </button>
                </div>

                {/* Khung video */}
                <div className="relative w-full bg-black" style={{ aspectRatio: "16/9" }}>
                    <iframe
                        className="absolute inset-0 w-full h-full"
                        src={`https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&rel=0&modestbranding=1`}
                        title={`Trailer: ${trailer.name}`}
                        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                        allowFullScreen
                    />
                </div>

                {/* Chân modal */}
                <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-2.5 text-[11.5px] text-white/40">
                    <span>Trailer chính thức từ TMDB</span>
                    <span className="hidden sm:inline">Nhấn <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/70 font-mono">Esc</kbd> để đóng</span>
                </div>
            </div>

            <style>{`
                .tm-backdrop { background: rgba(4,6,12,0.82); backdrop-filter: blur(8px); animation: tmFade .25s ease both; }
                .tm-card { animation: tmPop .35s cubic-bezier(.16,1,.3,1) both; }
                @keyframes tmFade { from { opacity: 0; } to { opacity: 1; } }
                @keyframes tmPop { from { opacity: 0; transform: translateY(18px) scale(.96); } to { opacity: 1; transform: none; } }
                @media (prefers-reduced-motion: reduce) {
                    .tm-backdrop, .tm-card { animation: none; }
                }
            `}</style>
        </div>,
        document.body
    );
};

export default TrailerModal;
