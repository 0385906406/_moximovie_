import React from "react";
import { motion } from "framer-motion";

const theme = import.meta.env.VITE_APP_ASSET_THEME || "Default";

type Summer2026InlineBannerProps = {
    title?: string;
    subtitle?: string;
    message?: string;
};

/* ─────────────────────────────────────────────────────────────────────
   Film Strip — authentic 35 mm perforations
───────────────────────────────────────────────────────────────────── */
const FilmStrip: React.FC<{ position: "top" | "bottom" }> = ({ position }) => (
    <div
        className={`absolute ${position}-0 left-0 right-0 z-20 flex items-center overflow-hidden`}
        style={{ height: 16, background: "rgba(0,0,0,0.72)", borderBottom: position === "top" ? "1px solid rgba(255,255,255,0.06)" : "none", borderTop: position === "bottom" ? "1px solid rgba(255,255,255,0.06)" : "none" }}
    >
        {Array.from({ length: 56 }).map((_, i) => (
            <div
                key={i}
                style={{
                    flexShrink: 0,
                    width: i % 3 === 2 ? 8 : 22,
                    height: i % 3 === 2 ? "100%" : 8,
                    background: i % 3 === 2 ? "transparent" : "rgba(255,255,255,0.09)",
                    borderRadius: i % 3 !== 2 ? 2 : 0,
                    margin: i % 3 === 2 ? "0 4px" : "0 1px",
                    alignSelf: "center",
                }}
            />
        ))}
    </div>
);

/* ─────────────────────────────────────────────────────────────────────
   Main Banner
───────────────────────────────────────────────────────────────────── */
const Summer2026InlineBanner: React.FC<Summer2026InlineBannerProps> = ({
    title   = "Hè Mà Không Xem Phim Là Thiếu Gì Đó",
    subtitle = "Kho phim khổng lồ — mobile, TV, mọi lúc mọi nơi",
    message  = "Hàng nghìn bộ phim đang chờ bạn. Xem trên điện thoại, TV hay máy tính đều được — không giới hạn, không cần cài đặt phức tạp.",
}) => (
    <section className="relative w-full px-3 py-14 sm:px-6 lg:px-8 -mt-40" style={{ zIndex: 30 }}>

        {/* ── Card ── */}
        <div
            className="relative mx-auto max-w-6xl rounded-2xl overflow-hidden"
            style={{
                boxShadow: "0 2px 0 rgba(255,255,255,0.06) inset, 0 32px 80px rgba(4,20,50,0.7), 0 0 0 1px rgba(255,255,255,0.07)",
            }}
        >
            {/* ── BG gradient — deep navy → ocean → golden horizon ── */}
            <div
                className="absolute inset-0"
                style={{
                    background: "linear-gradient(155deg, #020c1e 0%, #062340 22%, #0a4a8c 48%, #0d6fa0 66%, #a86010 84%, #6b1208 100%)",
                    zIndex: 0,
                }}
            />

            {/* ── Sun glow (top-right, barely animated) ── */}
            <motion.div
                className="pointer-events-none absolute"
                style={{
                    right: "5%", top: "6%",
                    width: 200, height: 200,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(210,140,40,0.55) 0%, rgba(180,90,20,0.22) 42%, transparent 68%)",
                    zIndex: 1,
                }}
                animate={{ scale: [1, 1.05, 1], opacity: [0.75, 1, 0.75] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            />

            {/* ── Left ambient light ── */}
            <div
                className="pointer-events-none absolute"
                style={{
                    left: "-4%", top: "15%",
                    width: 260, height: 160,
                    borderRadius: "50%",
                    background: "radial-gradient(ellipse, rgba(0,160,220,0.18) 0%, transparent 70%)",
                    filter: "blur(24px)",
                    zIndex: 1,
                }}
            />

            {/* ── Film strip top ── */}
            <FilmStrip position="top" />

            {/* ══════════════ MAIN CONTENT ══════════════ */}
            <div className="relative flex flex-col gap-6 p-5 pt-10 sm:flex-row sm:p-10 sm:pt-12" style={{ zIndex: 10 }}>

                {/* ── LEFT TEXT ── */}
                <div className="flex-1 space-y-4 text-white">

                    {/* Eyebrow label */}
                    <motion.div
                        className="flex items-center gap-3"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <span
                            className="rounded-sm px-3 py-[4px] text-[10px] font-bold uppercase tracking-[0.22em]"
                            style={{
                                fontFamily: "'Space Grotesk', sans-serif",
                                background: "rgba(210,140,40,0.18)",
                                border: "1px solid rgba(210,140,40,0.4)",
                                color: "#e8b050",
                            }}
                        >
                            Hè 2026
                        </span>
                        <div style={{ height: 1, width: 48, background: "linear-gradient(90deg, rgba(210,140,40,0.7), transparent)", borderRadius: 1 }} />
                    </motion.div>

                    {/* Title */}
                    <motion.h3
                        className="text-xl sm:text-[1.85rem] font-black leading-tight"
                        style={{
                            fontFamily: "'Be Vietnam Pro', sans-serif",
                            color: "#F0F7FF",
                            textShadow: "0 2px 20px rgba(0,0,0,0.55)",
                            letterSpacing: "-0.02em",
                        }}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, delay: 0.1 }}
                    >
                        {title}
                    </motion.h3>

                    {/* Subtitle */}
                    <motion.p
                        className="text-[12px] sm:text-sm font-semibold"
                        style={{
                            fontFamily: "'Be Vietnam Pro', sans-serif",
                            color: "rgba(52,212,184,0.9)",
                            letterSpacing: "0.02em",
                        }}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        {subtitle}
                    </motion.p>

                    {/* Message */}
                    <motion.p
                        className="text-[11px] sm:text-[13px] leading-relaxed max-w-sm"
                        style={{
                            fontFamily: "'Be Vietnam Pro', sans-serif",
                            color: "rgba(255,255,255,0.62)",
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        {message}
                    </motion.p>

                    {/* Feature chips */}
                    <motion.div
                        className="flex flex-wrap gap-2 pt-1"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.38 }}
                    >
                        {[
                            { icon: "📱", label: "Mobile & TV" },
                            { icon: "🎞", label: "Kho phim lớn" },
                            { icon: "✓",  label: "Miễn phí" },
                            { icon: "★",  label: "Nội dung VIP" },
                        ].map((chip) => (
                            <span
                                key={chip.label}
                                className="inline-flex items-center gap-1.5 rounded-full px-3 py-[5px] text-[10px] font-semibold"
                                style={{
                                    fontFamily: "'Be Vietnam Pro', sans-serif",
                                    background: "rgba(255,255,255,0.06)",
                                    border: "1px solid rgba(255,255,255,0.12)",
                                    backdropFilter: "blur(10px)",
                                    color: "rgba(255,255,255,0.72)",
                                }}
                            >
                                <span style={{ fontSize: 11 }}>{chip.icon}</span>
                                {chip.label}
                            </span>
                        ))}
                    </motion.div>

                    {/* CTA */}
                    <motion.div
                        className="inline-block pt-1"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.45 }}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.97 }}
                    >
                        <span
                            className="inline-flex items-center gap-2.5 px-6 py-[11px] text-[12px] font-bold uppercase tracking-[0.1em] cursor-pointer select-none rounded-[6px] text-white"
                            style={{
                                fontFamily: "'Be Vietnam Pro', sans-serif",
                                background: "linear-gradient(135deg, #6366F1, #4338CA)",
                                boxShadow: "0 4px 20px rgba(99,102,241,0.45), 0 1px 0 rgba(255,255,255,0.15) inset",
                                letterSpacing: "0.08em",
                                transition: "box-shadow 0.25s ease",
                            }}
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 13, height: 13, flexShrink: 0 }}>
                                <path d="M8 5l11 7-11 7z" />
                            </svg>
                            Xem Ngay
                            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>→</span>
                        </span>
                    </motion.div>
                </div>

                {/* ── RIGHT VISUAL ── */}
                <div className="relative flex flex-1 items-center justify-center min-h-[140px]">
                    {/* Soft glow behind logo */}
                    <div
                        className="absolute rounded-full pointer-events-none"
                        style={{
                            width: 200, height: 200,
                            background: "radial-gradient(circle, rgba(52,212,184,0.2) 0%, transparent 68%)",
                            filter: "blur(8px)",
                        }}
                    />

                    {/* Logo / main image */}
                    <motion.div
                        className="relative w-32 sm:w-52"
                        style={{ zIndex: 5 }}
                        animate={{ y: [0, -8, 2, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 5.5, ease: "easeInOut" }}
                    >
                        <img
                            src={`${theme}/logo.png`}
                            alt="Xem phim mùa hè"
                            className="w-full h-full object-contain"
                            style={{ filter: "drop-shadow(0 10px 28px rgba(0,180,220,0.45))" }}
                        />
                    </motion.div>

                    {/* Decorative ring */}
                    <motion.div
                        className="absolute pointer-events-none rounded-full"
                        style={{
                            width: 160, height: 160,
                            border: "1px solid rgba(52,212,184,0.18)",
                        }}
                        animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.9, 0.5] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    />
                    <motion.div
                        className="absolute pointer-events-none rounded-full"
                        style={{
                            width: 210, height: 210,
                            border: "1px solid rgba(210,140,40,0.12)",
                        }}
                        animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ repeat: Infinity, duration: 5.5, ease: "easeInOut", delay: 0.8 }}
                    />
                </div>
            </div>

            {/* ── Film strip bottom ── */}
            <FilmStrip position="bottom" />
        </div>

        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        `}</style>
    </section>
);

export default Summer2026InlineBanner;
