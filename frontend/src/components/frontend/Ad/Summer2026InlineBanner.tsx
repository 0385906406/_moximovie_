import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";

const theme = import.meta.env.VITE_APP_ASSET_THEME || "Default";

type Summer2026InlineBannerProps = {
    title?: string;
    subtitle?: string;
    message?: string;
};

/* ─────────────────────────────────────────────────────────────────────
   Canvas 1 — Floating Bubbles + Sparkles
───────────────────────────────────────────────────────────────────── */
const ParticleCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d")!;
        let raf: number;

        const resize = () => {
            canvas.width  = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        type P = {
            x: number; y: number; vx: number; vy: number;
            r: number; alpha: number; color: string;
            type: "bubble" | "star" | "spark";
            life: number; maxLife: number;
        };

        const COLORS = ["#00e5ff","#ffe066","#ff6b6b","#a8ff78","#ffffff","#ffb347","#c77dff"];

        const spawn = (): P => {
            const type = Math.random() < 0.45
                ? "bubble"
                : Math.random() < 0.6 ? "star" : "spark";
            return {
                x: Math.random() * canvas.width,
                y: canvas.height + 12,
                vx: (Math.random() - 0.5) * 0.9,
                vy: -(0.35 + Math.random() * 1.3),
                r: type === "bubble" ? 3 + Math.random() * 9 : 2 + Math.random() * 5,
                alpha: 0.55 + Math.random() * 0.45,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                type,
                life: 0,
                maxLife: 110 + Math.random() * 200,
            };
        };

        const particles: P[] = Array.from({ length: 70 }, spawn);

        const drawStar = (x: number, y: number, r: number, color: string) => {
            ctx.save();
            ctx.translate(x, y);
            for (let i = 0; i < 4; i++) {
                ctx.rotate(Math.PI / 4);
                ctx.beginPath();
                ctx.moveTo(0, -r * 0.3);
                ctx.lineTo(0, -r * 2.4);
                ctx.strokeStyle = color;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
            ctx.restore();
        };

        const tick = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (const p of particles) {
                p.x += p.vx;
                p.y += p.vy;
                p.life++;

                const prog  = p.life / p.maxLife;
                const fade  = prog < 0.12 ? prog / 0.12 : prog > 0.78 ? 1 - (prog - 0.78) / 0.22 : 1;
                ctx.globalAlpha = p.alpha * fade;

                if (p.type === "bubble") {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    ctx.strokeStyle = p.color;
                    ctx.lineWidth = 1.4;
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(p.x - p.r * 0.3, p.y - p.r * 0.35, p.r * 0.28, 0, Math.PI * 2);
                    ctx.fillStyle = "rgba(255,255,255,0.75)";
                    ctx.fill();
                } else if (p.type === "star") {
                    drawStar(p.x, p.y, p.r, p.color);
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r * 0.4, 0, Math.PI * 2);
                    ctx.fillStyle = p.color;
                    ctx.fill();
                } else {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r * 0.55, 0, Math.PI * 2);
                    ctx.fillStyle = p.color;
                    ctx.fill();
                    ctx.shadowBlur  = 6;
                    ctx.shadowColor = p.color;
                    ctx.fill();
                    ctx.shadowBlur  = 0;
                }

                if (p.life >= p.maxLife) Object.assign(p, spawn());
            }
            ctx.globalAlpha = 1;
            raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);
        return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
    }, []);

    return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 w-full h-full z-10" />;
};

/* ─────────────────────────────────────────────────────────────────────
   Canvas 2 — Multi-layer Animated Ocean Waves
───────────────────────────────────────────────────────────────────── */
const WaveCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d")!;
        let raf: number;
        let t = 0;

        const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
        resize();
        window.addEventListener("resize", resize);

        const wave = (
            yBase: number, amp: number, freq: number,
            phase: number, c1: string, c2: string, alpha: number
        ) => {
            const W = canvas.width, H = canvas.height;
            ctx.beginPath();
            ctx.moveTo(0, H);
            for (let x = 0; x <= W; x += 4) {
                const y = yBase
                    + Math.sin((x / W) * freq * Math.PI * 2 + t + phase) * amp
                    + Math.sin((x / W) * freq * 1.65 * Math.PI * 2 + t * 1.35 + phase) * amp * 0.45;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(W, H);
            ctx.closePath();
            const g = ctx.createLinearGradient(0, yBase - amp, 0, H);
            g.addColorStop(0, c1);
            g.addColorStop(1, c2);
            ctx.fillStyle = g;
            ctx.globalAlpha = alpha;
            ctx.fill();
            ctx.globalAlpha = 1;
        };

        const tick = () => {
            t += 0.013;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const H = canvas.height;
            wave(H * 0.60, 20, 1.3, 0,   "rgba(0,210,255,0.60)", "rgba(0,80,200,0.22)",  1);
            wave(H * 0.70, 15, 1.9, 1.1, "rgba(0,240,255,0.38)", "rgba(0,110,220,0.10)", 1);
            wave(H * 0.80, 10, 2.4, 2.4, "rgba(255,255,255,0.20)","rgba(0,190,255,0.05)",1);
            wave(H * 0.88,  7, 3.0, 3.8, "rgba(255,255,255,0.10)","transparent",          1);
            raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);
        return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
    }, []);

    return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 w-full h-full z-10" />;
};

/* ─────────────────────────────────────────────────────────────────────
   Main Banner Component
───────────────────────────────────────────────────────────────────── */
const Summer2026InlineBanner: React.FC<Summer2026InlineBannerProps> = ({
    title   = "Hè Mà Không Xem Phim Là Thiếu Gì Đó!",
    subtitle = "Kho Phim Khổng Lồ – Mobile, TV, Mọi Lúc Mọi Nơi",
    message  = "Hàng nghìn bộ phim đang nằm chờ bạn. Điện thoại, TV, máy tính — màn hình nào cũng chiếu được. Hè này bạn chỉ cần lo một việc: chọn phim thôi!",
}) => {

    const content = (
        <section className="relative w-full px-3 py-14 sm:px-6 lg:px-8 z-30">

            {/* ── Surfer mascot trên nóc ── */}
            <motion.div
                className="absolute -top-12 sm:-top-16 left-1/2 -translate-x-1/2 z-40 w-32 sm:w-44 pointer-events-none"
                animate={{ y: [0, -12, 4, -8, 0], rotate: [-4, 5, -3, 4, -4] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
                <img
                    src={`${theme}/Image-Mini/surfer.png`}
                    alt="Surfer"
                    className="w-full h-full object-contain"
                    style={{ filter: "drop-shadow(0 8px 24px rgba(0,200,255,0.7))" }}
                />
            </motion.div>

            {/* ── Card container ── */}
            <div
                className="relative mx-auto max-w-6xl rounded-2xl overflow-hidden mt-10 sm:mt-8 lg:mt-2"
                style={{
                    boxShadow: [
                        "0 0 0 1px rgba(0,230,255,0.3)",
                        "0 30px 80px rgba(0,80,200,0.5)",
                        "0 0 60px rgba(255,150,30,0.2) inset",
                    ].join(", "),
                }}
            >
                {/* ── BG: deep ocean → golden sunset ── */}
                <div
                    className="absolute inset-0 z-0"
                    style={{
                        background:
                            "linear-gradient(135deg,#04071a 0%,#0a1e5e 20%,#0077b6 48%,#e88c1a 72%,#c1121f 100%)",
                    }}
                />

                {/* ── Diagonal light slash ── */}
                <div
                    className="pointer-events-none absolute inset-0 z-0"
                    style={{
                        background:
                            "linear-gradient(158deg, transparent 42%, rgba(255,200,40,0.18) 42%, rgba(255,90,20,0.12) 58%, transparent 58%)",
                    }}
                />

                {/* ── Sun radial glow (top-right) ── */}
                <motion.div
                    className="pointer-events-none absolute z-0"
                    style={{
                        right: "6%", top: "8%",
                        width: 220, height: 220,
                        borderRadius: "50%",
                        background:
                            "radial-gradient(circle, rgba(255,230,60,0.6) 0%, rgba(255,140,30,0.25) 45%, transparent 68%)",
                    }}
                    animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                />

                {/* ── Spinning sun rays ── */}
                <motion.svg
                    className="pointer-events-none absolute z-0 opacity-25"
                    style={{ right: "3%", top: "4%", width: 200, height: 200 }}
                    viewBox="0 0 200 200"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
                >
                    {Array.from({ length: 16 }).map((_, i) => (
                        <line
                            key={i}
                            x1="100" y1="100"
                            x2={100 + 94 * Math.cos((i * 22.5 * Math.PI) / 180)}
                            y2={100 + 94 * Math.sin((i * 22.5 * Math.PI) / 180)}
                            stroke="#ffe066"
                            strokeWidth={i % 4 === 0 ? "3" : "1.2"}
                            strokeLinecap="round"
                        />
                    ))}
                </motion.svg>

                {/* ── Deep blue aurora shimmer (left) ── */}
                <motion.div
                    className="pointer-events-none absolute z-0"
                    style={{
                        left: "-5%", top: "20%",
                        width: 280, height: 180,
                        borderRadius: "50%",
                        background:
                            "radial-gradient(ellipse, rgba(0,220,255,0.22) 0%, transparent 70%)",
                        filter: "blur(18px)",
                    }}
                    animate={{ x: [0, 20, 0], opacity: [0.6, 1, 0.6] }}
                    transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                />

                {/* ── Wave canvas ── */}
                <WaveCanvas />

                {/* ── Particle canvas ── */}
                <ParticleCanvas />

                {/* ── Film strip top ── */}
                <div className="absolute top-0 left-0 right-0 z-20 flex h-[14px] overflow-hidden">
                    {Array.from({ length: 50 }).map((_, i) => (
                        <div
                            key={i}
                            className="flex-shrink-0 h-full"
                            style={{
                                width: "4%",
                                background: i % 2 === 0
                                    ? "rgba(0,0,0,0.7)"
                                    : "rgba(255,255,255,0.06)",
                                borderRight: "1px solid rgba(255,255,255,0.1)",
                            }}
                        />
                    ))}
                </div>

                {/* ══════════════ MAIN CONTENT ══════════════ */}
                <div className="relative z-30 flex flex-col gap-6 p-5 pt-8 sm:flex-row sm:p-8 sm:pt-10">

                    {/* ── LEFT TEXT ── */}
                    <div className="flex-1 space-y-4 text-white">

                        {/* Label badge */}
                        <motion.div
                            initial={{ opacity: 0, x: -24 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                            className="flex items-center gap-3"
                        >
                            <span
                                className="rounded-full px-3 py-[5px] text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#1a0500]"
                                style={{
                                    background: "linear-gradient(90deg,#ff9a3c,#ffe066,#ff6b6b)",
                                    boxShadow: "0 3px 16px rgba(255,140,50,0.6)",
                                }}
                            >
                                🎬 Hè 2026
                            </span>
                            <motion.div
                                className="h-px rounded"
                                style={{
                                    background: "linear-gradient(90deg,rgba(255,200,60,0.9),transparent)",
                                    width: 56,
                                }}
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ delay: 0.5, duration: 0.7 }}
                            />
                        </motion.div>

                        {/* Title — neon glow */}
                        <motion.h3
                            className="text-xl sm:text-[1.75rem] font-black leading-tight"
                            style={{ fontFamily: "'Nunito Black', 'Nunito', sans-serif" }}
                            animate={{
                                textShadow: [
                                    "0 0 18px rgba(255,220,50,0.9), 0 0 40px rgba(255,100,30,0.5)",
                                    "0 0 24px rgba(0,230,255,1), 0 0 55px rgba(0,120,255,0.6)",
                                    "0 0 18px rgba(255,220,50,0.9), 0 0 40px rgba(255,100,30,0.5)",
                                ],
                            }}
                            transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                        >
                            {title}
                        </motion.h3>

                        {/* Subtitle — cyan neon */}
                        <motion.p
                            className="text-[11px] sm:text-sm font-bold tracking-wide"
                            style={{ color: "#7df9ff", textShadow: "0 0 12px rgba(0,240,255,0.7)" }}
                            animate={{ opacity: [0.75, 1, 0.75] }}
                            transition={{ repeat: Infinity, duration: 2.5 }}
                        >
                            ⚡ {subtitle}
                        </motion.p>

                        {/* Message */}
                        <p className="text-[11px] sm:text-sm leading-relaxed text-white/75 max-w-sm">
                            {message}
                        </p>

                        {/* Feature chips */}
                        <div className="flex flex-wrap gap-2 pt-1">
                            {[
                                { icon: "📱", label: "Mobile & TV" },
                                { icon: "🎞️", label: "Kho Phim Khổng Lồ" },
                                { icon: "🆓", label: "Miễn Phí" },
                                { icon: "👑", label: "VIP Xịn Sò" },
                            ].map((chip, i) => (
                                <motion.span
                                    key={chip.label}
                                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-[5px] text-[10px] font-bold"
                                    style={{
                                        background: "rgba(255,255,255,0.07)",
                                        border: "1px solid rgba(0,230,255,0.35)",
                                        backdropFilter: "blur(10px)",
                                        boxShadow: "0 2px 12px rgba(0,200,255,0.18)",
                                        color: "#d4f8ff",
                                    }}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.25 + i * 0.1 }}
                                >
                                    {chip.icon} {chip.label}
                                </motion.span>
                            ))}
                        </div>

                        {/* CTA */}
                        <motion.div
                            className="inline-block pt-1"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            whileHover={{ scale: 1.06 }}
                            whileTap={{ scale: 0.96 }}
                        >
                            <span
                                className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.15em] cursor-pointer select-none text-[#1a0400]"
                                style={{
                                    background: "linear-gradient(90deg,#ff9a3c,#ffe066,#ff6b6b,#ff9a3c)",
                                    backgroundSize: "300% 100%",
                                    animation: "btnShimmer 3s linear infinite",
                                    boxShadow: "0 5px 24px rgba(255,120,50,0.65), 0 0 0 1px rgba(255,220,80,0.4)",
                                }}
                            >
                                🎬 Xem Ngay Thôi!
                            </span>
                        </motion.div>
                    </div>

                    {/* ── RIGHT VISUAL ── */}
                    <div className="relative flex flex-1 items-center justify-center min-h-[150px]">

                        {/* Outer glow ring */}
                        <motion.div
                            className="absolute rounded-full pointer-events-none"
                            style={{
                                width: 180, height: 180,
                                background: "radial-gradient(circle, rgba(0,230,255,0.30) 0%, transparent 68%)",
                            }}
                            animate={{ scale: [1, 1.22, 1], opacity: [0.45, 0.9, 0.45] }}
                            transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut" }}
                        />

                        {/* Orbiting star */}
                        <motion.div
                            className="absolute pointer-events-none"
                            style={{ width: 10, height: 10 }}
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
                        >
                            <div
                                className="absolute rounded-full"
                                style={{
                                    width: 10, height: 10,
                                    background: "#ffe066",
                                    boxShadow: "0 0 14px #ffe066, 0 0 28px rgba(255,220,60,0.5)",
                                    top: -82, left: -5,
                                }}
                            />
                        </motion.div>

                        {/* Second orbiting spark */}
                        <motion.div
                            className="absolute pointer-events-none"
                            style={{ width: 7, height: 7 }}
                            animate={{ rotate: -360 }}
                            transition={{ repeat: Infinity, duration: 7, ease: "linear" }}
                        >
                            <div
                                className="absolute rounded-full"
                                style={{
                                    width: 7, height: 7,
                                    background: "#ff6b6b",
                                    boxShadow: "0 0 10px #ff6b6b",
                                    top: 75, left: -4,
                                }}
                            />
                        </motion.div>

                        {/* Main image */}
                        <motion.div
                            className="relative z-10 w-36 sm:w-60"
                            animate={{ y: [0, -9, 3, -6, 0] }}
                            transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
                        >
                            <img
                                src={`${theme}/logo.png`}
                                alt="Xem phim mùa hè"
                                className="w-full h-full object-contain"
                                style={{ filter: "drop-shadow(0 12px 32px rgba(0,210,255,0.55))" }}
                            />
                        </motion.div>

                        {/* Floating emoji icons */}
                        {[
                            { e: "🎬", x: "6%",  y: "8%",  d: 0 },
                            { e: "", x: "78%", y: "12%", d: 0.6 },
                            { e: "⭐", x: "8%",  y: "72%", d: 1.1 },
                            { e: "🏄", x: "76%", y: "72%", d: 0.35 },
                            { e: "🌊", x: "42%", y: "88%", d: 0.85 },
                        ].map((f) => (
                            <motion.span
                                key={f.e}
                                className="absolute text-xl select-none pointer-events-none"
                                style={{ left: f.x, top: f.y }}
                                animate={{ y: [0, -7, 0], opacity: [0.65, 1, 0.65] }}
                                transition={{ repeat: Infinity, duration: 2.6, delay: f.d, ease: "easeInOut" }}
                            >
                                {f.e}
                            </motion.span>
                        ))}
                    </div>
                </div>

                {/* ── Film strip bottom ── */}
                <div className="absolute bottom-0 left-0 right-0 z-20 flex h-[10px] overflow-hidden">
                    {Array.from({ length: 50 }).map((_, i) => (
                        <div
                            key={i}
                            className="flex-shrink-0 h-full"
                            style={{
                                width: "4%",
                                background: i % 2 === 0
                                    ? "rgba(0,0,0,0.65)"
                                    : "rgba(255,255,255,0.05)",
                                borderRight: "1px solid rgba(255,255,255,0.08)",
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* ── Global keyframes ── */}
            <style>{`
                @keyframes btnShimmer {
                    0%   { background-position: 200% center; }
                    100% { background-position: -200% center; }
                }
            `}</style>
        </section>
    );

    return <>{content}</>;
};

export default Summer2026InlineBanner;