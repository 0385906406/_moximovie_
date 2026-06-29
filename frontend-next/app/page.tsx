"use client";

import SEO from "@/components/frontend/SEO";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

const theme = process.env.NEXT_PUBLIC_ASSET_THEME || "Default";

/* ── Enhanced particle canvas with shooting stars ── */
function ParticleCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        let w = (canvas.width = window.innerWidth);
        let h = (canvas.height = window.innerHeight);
        const onResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
        window.addEventListener("resize", onResize);

        const COLORS = ["34,211,165", "56,189,248", "167,139,250", "251,146,60", "244,114,182", "74,222,128"];

        /* stars */
        const stars = Array.from({ length: 140 }, () => ({
            x: Math.random() * 1920, y: Math.random() * 1080,
            r: Math.random() * 1.4 + 0.15,
            alpha: Math.random() * 0.6 + 0.1,
            pulse: Math.random() * Math.PI * 2,
            pulseSpeed: Math.random() * 0.02 + 0.008,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
        }));

        /* shooting stars */
        type Meteor = { x: number; y: number; vx: number; vy: number; len: number; alpha: number; life: number; maxLife: number };
        const meteors: Meteor[] = [];
        const spawnMeteor = () => {
            const angle = (Math.random() * 30 + 20) * (Math.PI / 180);
            const speed = Math.random() * 8 + 6;
            meteors.push({
                x: Math.random() * w, y: Math.random() * h * 0.4,
                vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                len: Math.random() * 120 + 60,
                alpha: Math.random() * 0.6 + 0.4,
                life: 0, maxLife: Math.random() * 60 + 40,
            });
        };

        let raf: number;
        let frame = 0;
        const draw = () => {
            ctx.clearRect(0, 0, w, h);
            frame++;

            /* spawn meteor occasionally */
            if (frame % 180 === 0 && Math.random() > 0.4) spawnMeteor();

            /* draw stars */
            stars.forEach(s => {
                s.pulse += s.pulseSpeed;
                const a = s.alpha * (0.5 + 0.5 * Math.sin(s.pulse));
                const sx = (s.x / 1920) * w;
                const sy = (s.y / 1080) * h;
                ctx.beginPath();
                ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${s.color},${a})`;
                ctx.fill();
                /* glow on bright stars */
                if (s.r > 1.1 && a > 0.4) {
                    ctx.beginPath();
                    ctx.arc(sx, sy, s.r * 3, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${s.color},${a * 0.12})`;
                    ctx.fill();
                }
            });

            /* draw meteors */
            for (let i = meteors.length - 1; i >= 0; i--) {
                const m = meteors[i];
                m.life++;
                if (m.life > m.maxLife) { meteors.splice(i, 1); continue; }
                const progress = m.life / m.maxLife;
                const a = m.alpha * Math.sin(progress * Math.PI);
                const tailX = m.x - m.vx * (m.len / 10);
                const tailY = m.y - m.vy * (m.len / 10);
                const grad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
                grad.addColorStop(0, `rgba(255,255,255,0)`);
                grad.addColorStop(0.7, `rgba(200,240,255,${a * 0.5})`);
                grad.addColorStop(1, `rgba(255,255,255,${a})`);
                ctx.beginPath();
                ctx.moveTo(tailX, tailY);
                ctx.lineTo(m.x, m.y);
                ctx.strokeStyle = grad;
                ctx.lineWidth = 1.5;
                ctx.stroke();
                m.x += m.vx; m.y += m.vy;
            }

            raf = requestAnimationFrame(draw);
        };
        draw();
        return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
    }, []);
    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />;
}

/* ── Cycling typewriter ── */
const CYCLE_WORDS = [
    { text: "đỉnh cao",    color: "#22d3a5" },
    { text: "vietsub HD",  color: "#a78bfa" },
    { text: "4K siêu nét", color: "#fb923c" },
    { text: "chất lượng",  color: "#38bdf8" },
    { text: "không ads",   color: "#f472b6" },
];

function useCyclingTypewriter(started = true) {
    const [wordIdx, setWordIdx] = useState(0);
    const [displayed, setDisplayed] = useState("");
    const [phase, setPhase] = useState<"typing" | "pause" | "deleting">("typing");

    useEffect(() => {
        if (!started) return;
        const word = CYCLE_WORDS[wordIdx].text;

        if (phase === "typing") {
            if (displayed.length < word.length) {
                const t = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 80);
                return () => clearTimeout(t);
            } else {
                const t = setTimeout(() => setPhase("pause"), 1600);
                return () => clearTimeout(t);
            }
        }

        if (phase === "pause") {
            const t = setTimeout(() => setPhase("deleting"), 400);
            return () => clearTimeout(t);
        }

        if (phase === "deleting") {
            if (displayed.length > 0) {
                const t = setTimeout(() => setDisplayed(d => d.slice(0, -1)), 45);
                return () => clearTimeout(t);
            } else {
                setWordIdx(i => (i + 1) % CYCLE_WORDS.length);
                setPhase("typing");
            }
        }
    }, [started, phase, displayed, wordIdx]);

    return { text: displayed, color: CYCLE_WORDS[wordIdx].color };
}

/* ── Aurora — 6 blobs đa màu ── */
function Aurora() {
    return (
        <div className="absolute inset-0 z-[2] pointer-events-none overflow-hidden">
            <div className="absolute rounded-full" style={{ width: 900, height: 900, top: "-20%", left: "-15%", background: "radial-gradient(circle, #22d3a5 0%, transparent 65%)", opacity: 0.13, animation: "auroraDrift1 20s ease-in-out infinite alternate", filter: "blur(70px)" }} />
            <div className="absolute rounded-full" style={{ width: 700, height: 700, top: "20%", right: "-18%", background: "radial-gradient(circle, #818cf8 0%, transparent 65%)", opacity: 0.11, animation: "auroraDrift2 25s ease-in-out infinite alternate", filter: "blur(80px)" }} />
            <div className="absolute rounded-full" style={{ width: 600, height: 600, bottom: "-15%", left: "25%", background: "radial-gradient(circle, #4ade80 0%, transparent 65%)", opacity: 0.09, animation: "auroraDrift3 17s ease-in-out infinite alternate", filter: "blur(65px)" }} />
            <div className="absolute rounded-full" style={{ width: 500, height: 500, top: "5%", left: "40%", background: "radial-gradient(circle, #38bdf8 0%, transparent 65%)", opacity: 0.08, animation: "auroraDrift4 28s ease-in-out infinite alternate", filter: "blur(90px)" }} />
            <div className="absolute rounded-full" style={{ width: 550, height: 550, bottom: "10%", right: "5%", background: "radial-gradient(circle, #f472b6 0%, transparent 65%)", opacity: 0.07, animation: "auroraDrift5 22s ease-in-out infinite alternate", filter: "blur(75px)" }} />
            <div className="absolute rounded-full" style={{ width: 400, height: 400, top: "55%", left: "5%", background: "radial-gradient(circle, #fb923c 0%, transparent 65%)", opacity: 0.06, animation: "auroraDrift6 30s ease-in-out infinite alternate", filter: "blur(60px)" }} />
        </div>
    );
}

/* ── Film grain overlay ── */
function FilmGrain() {
    return (
        <svg className="absolute inset-0 w-full h-full z-[5] pointer-events-none opacity-[0.035]" xmlns="http://www.w3.org/2000/svg">
            <filter id="grain">
                <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
                <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>
    );
}

/* ── Neon rings behind content ── */
function NeonRings() {
    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[6] pointer-events-none">
            <div className="absolute rounded-full" style={{ width: 520, height: 520, top: "50%", left: "50%", transform: "translate(-50%,-50%)", border: "1px solid rgba(34,211,165,0.07)", animation: "ringPulse 4s ease-in-out infinite" }} />
            <div className="absolute rounded-full" style={{ width: 720, height: 720, top: "50%", left: "50%", transform: "translate(-50%,-50%)", border: "1px solid rgba(56,189,248,0.05)", animation: "ringPulse 4s ease-in-out 1s infinite" }} />
            <div className="absolute rounded-full" style={{ width: 920, height: 920, top: "50%", left: "50%", transform: "translate(-50%,-50%)", border: "1px solid rgba(129,140,248,0.04)", animation: "ringPulse 4s ease-in-out 2s infinite" }} />
        </div>
    );
}

function Scanlines() {
    return <div className="absolute inset-0 z-[4] pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.04) 2px,rgba(0,0,0,0.04) 3px)" }} />;
}

function FilmStrip({ side }: { side: "left" | "right" }) {
    return (
        <div className={`hidden sm:flex absolute top-0 bottom-0 ${side === "left" ? "left-0" : "right-0"} w-8 z-20 flex-col justify-around items-center py-4 opacity-[0.1]`}>
            {Array.from({ length: 22 }).map((_, i) => (
                <div key={i} className="w-4 h-3 rounded-sm border border-white/30 bg-black/40" />
            ))}
        </div>
    );
}

const GENRES = ["Action", "Romance", "Thriller", "Sci-Fi", "Horror", "Comedy", "Drama", "Fantasy", "Mystery", "K-Drama"];
function FloatingBadges() {
    return (
        <div className="hidden sm:block">
            {GENRES.map((g, i) => (
                <div key={g} className="absolute text-[10px] font-semibold px-2.5 py-1 rounded-full border border-white/8 bg-white/[0.03] text-white/18 pointer-events-none select-none"
                    style={{
                        top: `${8 + (i * 9) % 82}%`,
                        left: i % 2 === 0 ? `${1 + (i * 6) % 12}%` : undefined,
                        right: i % 2 !== 0 ? `${1 + (i * 5) % 13}%` : undefined,
                        animation: `floatBadge ${4.5 + i * 0.4}s ease-in-out ${i * 0.25}s infinite alternate`,
                    }}
                >{g}</div>
            ))}
        </div>
    );
}

function GridOverlay() {
    return <div className="absolute inset-0 z-[3] pointer-events-none opacity-[0.022]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.6) 1px,transparent 1px)", backgroundSize: "80px 80px" }} />;
}

/* ════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════ */
const HomeIntro: React.FC = () => {
    const logoPath = `/${theme}/logo.png`;
    const router = useRouter();
    const [entered, setEntered] = useState(false);
    const [btnHover, setBtnHover] = useState(false);
    const [ripple, setRipple] = useState(false);

    const { text: typed, color: typedColor } = useCyclingTypewriter(entered);

    useEffect(() => {
        const t = setTimeout(() => setEntered(true), 120);
        return () => clearTimeout(t);
    }, []);

    const goToMovie = useCallback(() => {
        setRipple(true);
        setTimeout(() => router.push("/phimhay"), 340);
    }, [router]);

    const anim = (delay: number) => ({
        opacity: entered ? 1 : 0,
        transform: entered ? "translateY(0)" : "translateY(18px)",
        transition: `opacity 0.65s ease ${delay}s, transform 0.65s ease ${delay}s`,
    });

    return (
        <>
            <SEO
                title="MoxiMovie – Xem Phim Mới | Phim Hay | Vietsub HD | Thuyết Minh"
                description="MoxiMovie - Trang xem phim mới, phim hay Vietsub HD. Cập nhật hơn 10.000+ phim chiếu rạp, phim bộ, phim lẻ chất lượng cao mỗi ngày."
                canonical="https://www.moximovie.click/"
                type="website"
            />

            <div className="relative w-full min-h-screen overflow-hidden text-white select-none bg-[#060810]">
                <img src="/home_background.webp" alt=""
                    className="absolute inset-0 w-full h-full object-cover object-center opacity-[0.18]"
                    style={{ animation: "bgZoom 24s ease-in-out infinite alternate" }}
                />
                {/* vignette */}
                <div className="absolute inset-0 z-[1]" style={{ background: "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 20%, rgba(6,8,16,0.92) 70%, #060810 100%)" }} />
                <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#060810] to-transparent z-[2]" />
                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#060810] to-transparent z-[2]" />

                <Aurora />
                <GridOverlay />
                <Scanlines />
                <FilmGrain />
                <FilmStrip side="left" />
                <FilmStrip side="right" />
                <FloatingBadges />
                <ParticleCanvas />
                <NeonRings />

                {/* center glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[7]"
                    style={{ width: 600, height: 600, background: "radial-gradient(circle, rgba(34,211,165,0.09) 0%, rgba(56,189,248,0.04) 40%, transparent 70%)", animation: "glowPulse 6s ease-in-out infinite" }}
                />

                {/* ── Content ── */}
                <div className="relative z-30 min-h-screen flex items-center justify-center px-5 sm:px-8 py-10 sm:py-16">
                    <div className="w-full max-w-sm sm:max-w-lg mx-auto text-center">

                        {/* Top line */}
                        <div style={{
                            opacity: entered ? 1 : 0,
                            transform: entered ? "scaleX(1)" : "scaleX(0)",
                            transition: "opacity 0.6s ease, transform 0.7s cubic-bezier(0.16,1,0.3,1)",
                        }} className="w-10 h-px mx-auto mb-5 sm:mb-6 rounded-full bg-gradient-to-r from-transparent via-[#22d3a5] to-transparent" />

                        {/* Logo */}
                        <div style={anim(0.1)}>
                            <div className="relative inline-block mb-4 sm:mb-5">
                                <div className="absolute inset-0 rounded-2xl blur-2xl bg-[#22d3a5]/15 scale-150" />
                                <img src={logoPath} alt="MoxiMovie"
                                    className="relative h-8 sm:h-10 mx-auto object-contain"
                                    style={{ filter: "drop-shadow(0 0 16px rgba(34,211,165,0.55))" }}
                                />
                            </div>
                        </div>

                        {/* Live badge */}
                        <div style={anim(0.2)}>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#22d3a5]/25 bg-[#22d3a5]/6 text-[#22d3a5] text-[9px] sm:text-[10px] font-bold tracking-widest uppercase mb-4 sm:mb-5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#22d3a5] animate-pulse" />
                                10.000+ phim · Vietsub HD · Miễn phí
                            </div>
                        </div>

                        {/* Headline */}
                        <div style={anim(0.3)}>
                            <h1 className="text-[1.65rem] sm:text-4xl lg:text-5xl font-black leading-[1.25] tracking-tight mb-2">
                                <span className="block">
                                    Xem phim{" "}
                                    <span style={{ color: typedColor, transition: "color 0.4s ease" }}>
                                        {typed}
                                    </span>
                                </span>
                                <span className="block">mi&#7877;n ph&#237;</span>
                            </h1>
                            <p className="text-gray-500 text-xs sm:text-base leading-relaxed max-w-xs sm:max-w-sm mx-auto mb-6 sm:mb-8">
                                Kho phim HD–4K, Vietsub & Thuyết Minh đầy đủ — không quảng cáo, không đăng ký.
                            </p>
                        </div>

                        {/* CTA Button */}
                        <div style={anim(0.42)}>
                            <div className="relative inline-block">
                                {btnHover && (
                                    <>
                                        <span className="absolute inset-0 rounded-xl bg-[#22d3a5]/20 animate-ping" />
                                        <span className="absolute -inset-1.5 rounded-xl bg-[#22d3a5]/10 animate-ping" style={{ animationDelay: "0.15s" }} />
                                    </>
                                )}
                                {ripple && <span className="absolute inset-0 rounded-xl animate-ping bg-[#22d3a5]/30" />}
                                <button
                                    onClick={goToMovie}
                                    onMouseEnter={() => setBtnHover(true)}
                                    onMouseLeave={() => setBtnHover(false)}
                                    className="relative inline-flex items-center gap-2.5 px-8 py-3 rounded-xl font-bold text-sm text-black overflow-hidden"
                                    style={{
                                        background: btnHover
                                            ? "linear-gradient(135deg,#6ee7b7,#22d3a5,#38bdf8)"
                                            : "linear-gradient(135deg,#22d3a5,#10b981)",
                                        boxShadow: btnHover
                                            ? "0 0 32px rgba(34,211,165,0.55), 0 6px 20px rgba(0,0,0,0.4)"
                                            : "0 0 16px rgba(34,211,165,0.28), 0 4px 14px rgba(0,0,0,0.35)",
                                        transform: btnHover ? "scale(1.04) translateY(-1px)" : "scale(1)",
                                        transition: "background 0.3s, box-shadow 0.3s, transform 0.2s",
                                    }}
                                >
                                    <span className="absolute inset-0 pointer-events-none"
                                        style={{
                                            background: "linear-gradient(105deg,transparent 38%,rgba(255,255,255,0.28) 50%,transparent 62%)",
                                            animation: btnHover ? "btnShimmer 0.7s ease" : "none",
                                        }}
                                    />
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 relative z-10 shrink-0">
                                        <path d="M8 5.14v14l11-7-11-7z" />
                                    </svg>
                                    <span className="relative z-10">Xem ngay</span>
                                </button>
                            </div>
                        </div>

                        {/* Divider */}
                        <div style={{ ...anim(0.55), opacity: entered ? 0.3 : 0 }} className="flex items-center gap-3 max-w-[200px] sm:max-w-[240px] mx-auto mt-8 sm:mt-10 mb-4 sm:mb-6">
                            <div className="flex-1 h-px bg-white/10" />
                            <span className="text-white/30 text-[9px] sm:text-[10px] tracking-widest uppercase font-semibold">Thống kê</span>
                            <div className="flex-1 h-px bg-white/10" />
                        </div>

                        {/* Stats */}
                        <div style={anim(0.65)} className="flex items-center justify-center gap-5 sm:gap-8">
                            {[
                                { num: "10K+", label: "Bộ phim", icon: "🎬" },
                                { num: "HD–4K", label: "Chất lượng", icon: "✨" },
                                { num: "0đ", label: "Chi phí", icon: "🎁" },
                            ].map((s, i) => (
                                <div key={i} className="text-center cursor-default">
                                    <div className="text-base sm:text-lg mb-0.5" style={{ animation: `floatStat ${2.5 + i * 0.4}s ease-in-out ${i * 0.3}s infinite alternate` }}>{s.icon}</div>
                                    <p className="text-white font-black text-base sm:text-lg leading-none">{s.num}</p>
                                    <p className="text-gray-600 text-[9px] sm:text-[10px] mt-0.5 tracking-widest uppercase">{s.label}</p>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>
            </div>

            <style>{`
                @keyframes bgZoom { from { transform:scale(1.05); } to { transform:scale(1.14); } }
                @keyframes glowPulse {
                    0%,100% { opacity:0.5; transform:translate(-50%,-50%) scale(1); }
                    50%     { opacity:1;   transform:translate(-50%,-50%) scale(1.18); }
                }
                @keyframes shimmerText {
                    0%   { background-position: 0% 50%; }
                    100% { background-position: 200% 50%; }
                }
                @keyframes floatBadge {
                    from { transform:translateY(0) rotate(-1deg); opacity:0.2; }
                    to   { transform:translateY(-10px) rotate(1deg); opacity:0.08; }
                }
                @keyframes btnShimmer {
                    from { transform:translateX(-120%); }
                    to   { transform:translateX(220%); }
                }
                @keyframes bounceDown {
                    0%,100% { transform:translateY(0); }
                    50%     { transform:translateY(5px); }
                }
                @keyframes auroraDrift1 {
                    from { transform:translate(0,0) scale(1); }
                    to   { transform:translate(90px,70px) scale(1.18); }
                }
                @keyframes auroraDrift2 {
                    from { transform:translate(0,0) scale(1); }
                    to   { transform:translate(-70px,90px) scale(0.88); }
                }
                @keyframes auroraDrift3 {
                    from { transform:translate(0,0) scale(1); }
                    to   { transform:translate(55px,-50px) scale(1.12); }
                }
                @keyframes auroraDrift4 {
                    from { transform:translate(0,0) scale(1); }
                    to   { transform:translate(-40px,-70px) scale(1.08); }
                }
                @keyframes auroraDrift5 {
                    from { transform:translate(0,0) scale(1); }
                    to   { transform:translate(60px,-30px) scale(0.92); }
                }
                @keyframes auroraDrift6 {
                    from { transform:translate(0,0) scale(1); }
                    to   { transform:translate(-50px,60px) scale(1.1); }
                }
                @keyframes ringPulse {
                    0%,100% { opacity:0.4; transform:translate(-50%,-50%) scale(1); }
                    50%     { opacity:1;   transform:translate(-50%,-50%) scale(1.04); }
                }
                @keyframes floatStat {
                    from { transform:translateY(0); }
                    to   { transform:translateY(-5px); }
                }
            `}</style>
        </>
    );
};

export default HomeIntro;
