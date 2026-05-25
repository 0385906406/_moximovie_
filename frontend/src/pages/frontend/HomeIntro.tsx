import SEO from "@/components/frontend/SEO";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const theme = import.meta.env.VITE_APP_ASSET_THEME || "Default";

// ── Particle canvas ──
function ParticleCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let w = canvas.width = window.innerWidth;
        let h = canvas.height = window.innerHeight;

        const resize = () => {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
        };
        window.addEventListener("resize", resize);

        // Particles
        const particles = Array.from({ length: 80 }, () => ({
            x: Math.random() * w,
            y: Math.random() * h,
            r: Math.random() * 1.5 + 0.3,
            dx: (Math.random() - 0.5) * 0.4,
            dy: -Math.random() * 0.6 - 0.2,
            alpha: Math.random() * 0.5 + 0.1,
            pulse: Math.random() * Math.PI * 2,
        }));

        let raf: number;
        const draw = () => {
            ctx.clearRect(0, 0, w, h);
            particles.forEach((p) => {
                p.pulse += 0.02;
                p.x += p.dx;
                p.y += p.dy;
                if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
                if (p.x < -5) p.x = w + 5;
                if (p.x > w + 5) p.x = -5;

                const a = p.alpha * (0.7 + 0.3 * Math.sin(p.pulse));
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(74, 222, 128, ${a})`;
                ctx.fill();
            });
            raf = requestAnimationFrame(draw);
        };
        draw();

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />
    );
}

// ── Film strip decoration ──
function FilmStrip({ side }: { side: "left" | "right" }) {
    const holes = Array.from({ length: 20 });
    return (
        <div className={`absolute top-0 bottom-0 ${side === "left" ? "left-0" : "right-0"} w-10 z-20 flex flex-col justify-around items-center py-4 opacity-20`}>
            {holes.map((_, i) => (
                <div key={i} className="w-5 h-4 rounded-sm border border-white/40 bg-black/60" />
            ))}
        </div>
    );
}

// ── Floating movie genre badges ──
const GENRES = ["Action", "Romance", "Thriller", "Fantasy", "Horror", "Sci-Fi", "Comedy", "Drama"];

function FloatingBadges() {
    return (
        <>
            {GENRES.map((g, i) => (
                <div
                    key={g}
                    className="absolute text-[11px] font-semibold px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/30 backdrop-blur-sm pointer-events-none"
                    style={{
                        top: `${10 + (i * 11) % 80}%`,
                        left: i % 2 === 0 ? `${2 + (i * 7) % 15}%` : undefined,
                        right: i % 2 !== 0 ? `${2 + (i * 5) % 15}%` : undefined,
                        animation: `floatBadge ${4 + i * 0.5}s ease-in-out ${i * 0.3}s infinite alternate`,
                    }}
                >
                    {g}
                </div>
            ))}
        </>
    );
}

const HomeIntro: React.FC = () => {
    const logoPath = `/${theme}/logo.png`;
    const navigate = useNavigate();
    const [entered, setEntered] = useState(false);
    const [btnHover, setBtnHover] = useState(false);

    useEffect(() => {
        // Trigger staggered entrance
        const t = setTimeout(() => setEntered(true), 100);
        return () => clearTimeout(t);
    }, []);

    const goToHome = () => {
        navigate("/phimhay", { state: { fromLanding: true } });
    };

    return (
        <>
            <SEO
                title="MoxiMovie – Xem Phim Mới | Phim Hay | Vietsub HD | Thuyết Minh"
                description="MoxiMovie - Trang xem phim mới, phim hay Vietsub HD. Cập nhật hơn 10.000+ phim chiếu rạp, phim bộ, phim lẻ chất lượng cao mỗi ngày."
                canonical="https://www.moximovie.click/"
                type="website"
            />

            <div className="relative w-full min-h-screen overflow-hidden text-white select-none bg-[#060810]">

                {/* ── Background image ── */}
                <img
                    src="/home_background.webp"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover object-center opacity-30 scale-105"
                    style={{ animation: "bgZoom 20s ease-in-out infinite alternate" }}
                />

                {/* ── Radial vignette ── */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(6,8,16,0.95)_100%)] z-[1]" />

                {/* ── Top + bottom fade ── */}
                <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#060810] to-transparent z-[2]" />
                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#060810] to-transparent z-[2]" />

                {/* ── Film strips ── */}
                <FilmStrip side="left" />
                <FilmStrip side="right" />

                {/* ── Floating genre badges ── */}
                <FloatingBadges />

                {/* ── Particle rain ── */}
                <ParticleCanvas />

                {/* ── Ambient green glow center ── */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full z-[3] pointer-events-none"
                    style={{
                        background: "radial-gradient(circle, rgba(74,222,128,0.08) 0%, transparent 70%)",
                        animation: "glowPulse 4s ease-in-out infinite",
                    }}
                />

                {/* ── MAIN CONTENT ── */}
                <div className="relative z-30 min-h-screen flex items-center justify-center px-4">
                    <div className="w-full max-w-2xl mx-auto text-center">

                        {/* Scan line effect bar */}
                        <div
                            className="w-16 h-0.5 mx-auto mb-8 rounded-full bg-gradient-to-r from-transparent via-green-400 to-transparent"
                            style={{
                                opacity: entered ? 1 : 0,
                                transform: entered ? "scaleX(1)" : "scaleX(0)",
                                transition: "opacity 0.6s ease, transform 0.6s ease",
                            }}
                        />

                        {/* Logo */}
                        <div
                            style={{
                                opacity: entered ? 1 : 0,
                                transform: entered ? "translateY(0)" : "translateY(-20px)",
                                transition: "opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s",
                            }}
                        >
                            <div className="relative inline-block mb-8">
                                {/* Glow ring behind logo */}
                                <div className="absolute inset-0 rounded-2xl blur-2xl bg-green-400/20 scale-150" />
                                <img
                                    src={logoPath}
                                    alt="MoxiMovie Logo"
                                    className="relative h-12 mx-auto object-contain drop-shadow-[0_0_20px_rgba(74,222,128,0.6)]"
                                />
                            </div>
                        </div>

                        {/* Badge */}
                        <div
                            style={{
                                opacity: entered ? 1 : 0,
                                transform: entered ? "translateY(0)" : "translateY(10px)",
                                transition: "opacity 0.6s ease 0.25s, transform 0.6s ease 0.25s",
                            }}
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-green-400/30 bg-green-400/8 text-green-400 text-xs font-bold tracking-widest uppercase mb-6">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                10.000+ bộ phim · Vietsub HD · Miễn phí
                            </div>
                        </div>

                        {/* Heading */}
                        <div
                            style={{
                                opacity: entered ? 1 : 0,
                                transform: entered ? "translateY(0)" : "translateY(20px)",
                                transition: "opacity 0.7s ease 0.35s, transform 0.7s ease 0.35s",
                            }}
                        >
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight mb-6">
                                Xem phim
                                <br />
                                <span
                                    className="relative inline-block"
                                    style={{
                                        background: "linear-gradient(135deg, #4ade80 0%, #22d3ee 50%, #4ade80 100%)",
                                        backgroundSize: "200% 100%",
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                        animation: "shimmerText 3s linear infinite",
                                    }}
                                >
                                    đỉnh cao
                                </span>
                                {" "}miễn phí
                            </h1>
                        </div>

                        {/* Description */}
                        <div
                            style={{
                                opacity: entered ? 1 : 0,
                                transform: entered ? "translateY(0)" : "translateY(16px)",
                                transition: "opacity 0.6s ease 0.5s, transform 0.6s ease 0.5s",
                            }}
                        >
                            <p className="text-gray-400 text-base sm:text-lg leading-relaxed max-w-lg mx-auto mb-10">
                                Kho phim HD–4K, Vietsub & Thuyết Minh đầy đủ.
                                Xem mượt, cập nhật nhanh, không lo gián đoạn.
                            </p>
                        </div>

                        {/* CTA Button */}
                        <div
                            style={{
                                opacity: entered ? 1 : 0,
                                transform: entered ? "translateY(0) scale(1)" : "translateY(16px) scale(0.95)",
                                transition: "opacity 0.6s ease 0.65s, transform 0.6s ease 0.65s",
                            }}
                        >
                            <div className="relative inline-block">
                                {/* Outer pulse rings */}
                                {btnHover && (
                                    <>
                                        <span className="absolute inset-0 rounded-full bg-green-400/20 animate-ping" />
                                        <span className="absolute -inset-2 rounded-full bg-green-400/10 animate-ping" style={{ animationDelay: "0.15s" }} />
                                    </>
                                )}

                                <button
                                    onClick={goToHome}
                                    onMouseEnter={() => setBtnHover(true)}
                                    onMouseLeave={() => setBtnHover(false)}
                                    className="relative inline-flex items-center gap-3 px-10 py-4 sm:px-12 sm:py-5 rounded-full font-bold text-base sm:text-lg text-black overflow-hidden transition-all duration-300"
                                    style={{
                                        background: btnHover
                                            ? "linear-gradient(135deg, #86efac, #4ade80, #22d3ee)"
                                            : "linear-gradient(135deg, #4ade80, #22c55e)",
                                        boxShadow: btnHover
                                            ? "0 0 40px rgba(74,222,128,0.6), 0 8px 32px rgba(0,0,0,0.4)"
                                            : "0 0 20px rgba(74,222,128,0.3), 0 4px 16px rgba(0,0,0,0.3)",
                                        transform: btnHover ? "scale(1.05) translateY(-2px)" : "scale(1) translateY(0)",
                                    }}
                                >
                                    {/* Shimmer overlay */}
                                    <span
                                        className="absolute inset-0 pointer-events-none"
                                        style={{
                                            background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)",
                                            animation: btnHover ? "btnShimmer 0.8s ease" : "none",
                                        }}
                                    />
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 translate-x-[1px] relative z-10">
                                        <path d="M8 5.14v14l11-7-11-7z" />
                                    </svg>
                                    <span className="relative z-10">Xem Ngay</span>
                                </button>
                            </div>
                        </div>

                        {/* Bottom stats */}
                        <div
                            className="flex items-center justify-center gap-6 mt-12"
                            style={{
                                opacity: entered ? 1 : 0,
                                transition: "opacity 0.6s ease 0.85s",
                            }}
                        >
                            {[
                                { num: "10K+", label: "Bộ phim" },
                                { num: "HD–4K", label: "Chất lượng" },
                                { num: "0đ", label: "Chi phí" },
                            ].map((s, i) => (
                                <div key={i} className="text-center">
                                    <p className="text-white font-black text-xl">{s.num}</p>
                                    <p className="text-gray-600 text-xs mt-0.5 tracking-wide uppercase">{s.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Scroll hint */}
                        <div
                            className="mt-12 flex flex-col items-center gap-2"
                            style={{
                                opacity: entered ? 0.4 : 0,
                                transition: "opacity 0.6s ease 1.1s",
                                animation: entered ? "bounceDown 2s ease-in-out 1.5s infinite" : "none",
                            }}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-gray-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes bgZoom {
                    from { transform: scale(1.05); }
                    to   { transform: scale(1.12); }
                }
                @keyframes glowPulse {
                    0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
                    50%       { opacity: 1;   transform: translate(-50%, -50%) scale(1.15); }
                }
                @keyframes shimmerText {
                    0%   { background-position: 0% 50%; }
                    100% { background-position: 200% 50%; }
                }
                @keyframes floatBadge {
                    from { transform: translateY(0px) rotate(-1deg); opacity: 0.3; }
                    to   { transform: translateY(-12px) rotate(1deg); opacity: 0.15; }
                }
                @keyframes btnShimmer {
                    from { transform: translateX(-100%); }
                    to   { transform: translateX(200%); }
                }
                @keyframes bounceDown {
                    0%, 100% { transform: translateY(0); }
                    50%       { transform: translateY(6px); }
                }
            `}</style>
        </>
    );
};

export default HomeIntro;