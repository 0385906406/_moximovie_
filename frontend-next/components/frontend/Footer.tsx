"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const theme = process.env.NEXT_PUBLIC_ASSET_THEME || "Default";

// ── Reveal on scroll ──
function useReveal() {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
            },
            { threshold: 0.08 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    return { ref, visible };
}

function Reveal({
    children,
    delay = 0,
    className = "",
    direction = "up",
}: {
    children: React.ReactNode;
    delay?: number;
    className?: string;
    direction?: "up" | "left" | "right" | "fade";
}) {
    const { ref, visible } = useReveal();
    const transforms: Record<string, string> = {
        up:    "translateY(28px)",
        left:  "translateX(-24px)",
        right: "translateX(24px)",
        fade:  "scale(0.96)",
    };
    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "none" : transforms[direction],
                transition: `opacity 0.65s cubic-bezier(.22,1,.36,1) ${delay}ms, transform 0.65s cubic-bezier(.22,1,.36,1) ${delay}ms`,
            }}
        >
            {children}
        </div>
    );
}

// ── Animated counter ──
function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
    const [count, setCount] = useState(0);
    const { ref, visible } = useReveal();
    useEffect(() => {
        if (!visible) return;
        let start = 0;
        const duration = 1400;
        const step = Math.ceil(target / (duration / 16));
        const timer = setInterval(() => {
            start += step;
            if (start >= target) { setCount(target); clearInterval(timer); }
            else setCount(start);
        }, 16);
        return () => clearInterval(timer);
    }, [visible, target]);
    return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ── Particle dots background ──
function ParticleDots() {
    const particles = Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: Math.random() * 2 + 1,
        delay: Math.random() * 4,
        duration: Math.random() * 3 + 3,
    }));
    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="absolute rounded-full bg-green-400/20"
                    style={{
                        left: p.left,
                        top: p.top,
                        width: p.size,
                        height: p.size,
                        animation: `float-particle ${p.duration}s ${p.delay}s ease-in-out infinite alternate`,
                    }}
                />
            ))}
        </div>
    );
}

// ── Animated gradient line ──
function GradientLine() {
    return (
        <div className="relative w-full h-px overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/40 to-transparent" />
            <div
                className="absolute inset-0"
                style={{ animation: "shimmer-line 2.5s ease-in-out infinite" }}
            >
                <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            </div>
        </div>
    );
}

// ── Typing text effect ──
function TypingText({ texts }: { texts: string[] }) {
    const [idx, setIdx] = useState(0);
    const [displayed, setDisplayed] = useState("");
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const current = texts[idx];
        let timer: ReturnType<typeof setTimeout>;
        if (!deleting && displayed.length < current.length) {
            timer = setTimeout(() => setDisplayed(current.slice(0, displayed.length + 1)), 60);
        } else if (!deleting && displayed.length === current.length) {
            timer = setTimeout(() => setDeleting(true), 2200);
        } else if (deleting && displayed.length > 0) {
            timer = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 35);
        } else if (deleting && displayed.length === 0) {
            setDeleting(false);
            setIdx((i) => (i + 1) % texts.length);
        }
        return () => clearTimeout(timer);
    }, [displayed, deleting, idx, texts]);

    return (
        <span className="inline-flex items-center gap-1">
            <span className="text-green-400">{displayed}</span>
            <span
                className="inline-block w-0.5 h-4 bg-green-400 rounded-full"
                style={{ animation: "blink-cursor 1s step-end infinite" }}
            />
        </span>
    );
}

const LINKS = [
    { to: "/phim-le",           label: "Phim Lẻ",       icon: "🎬" },
    { to: "/phim-bo",           label: "Phim Bộ",        icon: "📺" },
    { to: "/hoat-hinh",         label: "Hoạt Hình",      icon: "✨" },
    { to: "/gioi-thieu",        label: "Giới Thiệu",     icon: "ℹ️" },
    { to: "/lien-he-quang-cao", label: "Liên Hệ",        icon: "📩" },
    { to: "/bai-viet",          label: "Bài Viết",       icon: "📝" },
];

const GENRES = [
    "Hành Động", "Tình Cảm", "Hài", "Kinh Dị",
    "Tâm Lý", "Khoa Học Viễn Tưởng", "Hoạt Hình", "Cổ Trang",
];

const STATS = [
    { label: "Phim", value: 12000, suffix: "+" },
    { label: "Vietsub", value: 99, suffix: "%" },
    { label: "Người dùng", value: 50, suffix: "K+" },
];

const TYPING_TEXTS = ["Phim Lẻ HD", "Phim Bộ Mới", "Hoạt Hình 4K", "Vietsub Chuẩn"];

const Footer = () => {
    const logoPath = `/${theme}/logo.png`;
    const [hoveredGenre, setHoveredGenre] = useState<string | null>(null);
    const [ripple, setRipple] = useState<{ x: number; y: number; id: number } | null>(null);

    function handleRipple(e: React.MouseEvent<HTMLDivElement>) {
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top, id: Date.now() });
        setTimeout(() => setRipple(null), 600);
    }

    return (
        <>
            {/* ── Keyframe styles ── */}
            <style>{`
                @keyframes float-particle {
                    from { transform: translateY(0px) translateX(0px); opacity: 0.15; }
                    to   { transform: translateY(-12px) translateX(6px); opacity: 0.5; }
                }
                @keyframes shimmer-line {
                    0%   { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }
                @keyframes blink-cursor {
                    0%, 100% { opacity: 1; }
                    50%       { opacity: 0; }
                }
                @keyframes pulse-glow {
                    0%, 100% { box-shadow: 0 0 8px 1px rgba(74,222,128,0.3); }
                    50%       { box-shadow: 0 0 18px 4px rgba(74,222,128,0.6); }
                }
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
                @keyframes ripple-expand {
                    from { transform: scale(0); opacity: 0.4; }
                    to   { transform: scale(4); opacity: 0; }
                }
                @keyframes flag-wave {
                    0%, 100% { transform: skewX(0deg) scaleX(1); }
                    25%       { transform: skewX(-2deg) scaleX(0.98); }
                    75%       { transform: skewX(2deg) scaleX(1.01); }
                }
                @keyframes gradient-shift {
                    0%   { background-position: 0% 50%; }
                    50%  { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                @keyframes slide-up-stat {
                    from { opacity: 0; transform: translateY(14px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .footer-link-hover {
                    position: relative;
                    overflow: hidden;
                }
                .footer-link-hover::after {
                    content: '';
                    position: absolute;
                    bottom: 0; left: 0;
                    width: 0; height: 1px;
                    background: linear-gradient(90deg, #4ade80, transparent);
                    transition: width 0.3s ease;
                }
                .footer-link-hover:hover::after { width: 100%; }
            `}</style>

            <footer className="relative mt-16 overflow-hidden bg-[#05070b] border-t border-white/5 text-white z-30">

                {/* ── Particle background ── */}
                <ParticleDots />

                {/* ── Ambient glow blobs ── */}
                <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[220px] rounded-full blur-[100px]"
                    style={{ background: "radial-gradient(ellipse, rgba(74,222,128,0.06) 0%, transparent 70%)" }} />
                <div className="pointer-events-none absolute bottom-0 right-1/4 w-[350px] h-[180px] rounded-full blur-[80px]"
                    style={{ background: "radial-gradient(ellipse, rgba(255,255,255,0.02) 0%, transparent 70%)" }} />
                <div className="pointer-events-none absolute top-1/2 left-0 w-[200px] h-[300px] rounded-full blur-[90px]"
                    style={{ background: "radial-gradient(ellipse, rgba(74,222,128,0.03) 0%, transparent 70%)" }} />

                {/* ── Animated top divider ── */}
                <GradientLine />

                <div className="w-full mx-auto px-4 sm:px-6 py-10 relative">

                    {/* ── BANNER PATRIOT ── */}
                    <Reveal delay={0} direction="left">
                        <div
                            className="flex items-center gap-2.5 bg-gradient-to-r from-red-900/60 to-red-800/20 border border-red-500/20 rounded-xl px-4 py-2.5 mb-8 w-fit backdrop-blur-sm cursor-default select-none"
                            style={{ transition: "transform 0.3s ease, box-shadow 0.3s ease" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "scale(1.02)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 20px rgba(239,68,68,0.15)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "scale(1)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
                        >
                            <img
                                src="/vn_flag.svg"
                                alt="VN"
                                className="w-5 h-5 shrink-0"
                                style={{ animation: "flag-wave 3s ease-in-out infinite" }}
                            />
                            <span className="text-sm text-red-100 font-medium">
                                Tự hào Việt Nam – đất nước của những con người kiên cường và đoàn kết!
                            </span>
                        </div>
                    </Reveal>

                    {/* ── STATS ROW ── */}
                    <Reveal delay={60} direction="up">
                        <div className="grid grid-cols-3 gap-3 mb-10">
                            {STATS.map((s, i) => (
                                <div
                                    key={s.label}
                                    className="relative flex flex-col items-center justify-center py-3 px-2 rounded-xl border border-white/6 bg-white/[0.02] backdrop-blur-sm overflow-hidden group cursor-default"
                                    style={{ animationDelay: `${i * 120}ms`, animation: "slide-up-stat 0.6s ease forwards" }}
                                >
                                    {/* Hover shimmer */}
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                        style={{ background: "linear-gradient(135deg, transparent 40%, rgba(74,222,128,0.05) 50%, transparent 60%)", backgroundSize: "200% 200%", animation: "gradient-shift 2s ease infinite" }} />
                                    <span className="text-lg sm:text-2xl font-black text-green-400 tabular-nums">
                                        <AnimatedNumber target={s.value} suffix={s.suffix} />
                                    </span>
                                    <span className="text-[10px] sm:text-xs text-gray-600 mt-0.5 tracking-wide">{s.label}</span>
                                </div>
                            ))}
                        </div>
                    </Reveal>

                    {/* ── MAIN GRID ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 mb-12">

                        {/* Col 1: Brand */}
                        <Reveal delay={80} direction="left" className="lg:col-span-2">
                            <div>
                                <Link href="/phimhay" className="inline-block group">
                                    <img
                                        src={logoPath}
                                        alt="MoxiMovie"
                                        className="h-10 mb-5 object-contain transition-all duration-300 group-hover:scale-105 group-hover:brightness-110"
                                    />
                                </Link>

                                {/* Typing tagline */}
                                <div className="text-sm text-gray-500 mb-3 h-6">
                                    Xem ngay: <TypingText texts={TYPING_TEXTS} />
                                </div>

                                <p className="text-gray-500 text-sm leading-relaxed max-w-sm">
                                    MoxiMovie — nền tảng xem phim online chất lượng cao miễn phí. Kho phim khổng lồ
                                    gồm phim lẻ, phim bộ, hoạt hình, phim chiếu rạp từ khắp nơi trên thế giới.
                                    Vietsub & Thuyết Minh đầy đủ, chất lượng HD–4K.
                                </p>

                                {/* Social + Ripple */}
                                <div className="flex gap-3 mt-6">
                                    <div className="relative overflow-hidden" onClick={handleRipple}>
                                        {ripple && (
                                            <span
                                                key={ripple.id}
                                                className="absolute rounded-full bg-blue-400/30 pointer-events-none"
                                                style={{
                                                    width: 80, height: 80,
                                                    left: ripple.x - 40, top: ripple.y - 40,
                                                    animation: "ripple-expand 0.6s ease-out forwards",
                                                }}
                                            />
                                        )}
                                        <a
                                            href="https://www.facebook.com/tiemnhonhaDahee"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-9 h-9 rounded-xl border border-white/8 bg-white/4 hover:bg-blue-500/20 hover:border-blue-400/40 flex items-center justify-center transition-all duration-300 group"
                                            style={{ position: "relative", zIndex: 1 }}
                                        >
                                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors">
                                                <path d="M13 21v-7h2.2a1 1 0 0 0 .98-.8l.5-3A1 1 0 0 0 15.7 9H13V7.2c0-.6.4-1 1-1h1.9a1 1 0 0 0 1-1V3.6A.6.6 0 0 0 16.3 3H14a4 4 0 0 0-4 4v2H8.6a1 1 0 0 0-1 .9L7.3 13a1 1 0 0 0 1 .9H10v7h3Z" />
                                            </svg>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </Reveal>

                        {/* Col 2: Navigation */}
                        <Reveal delay={160} direction="up">
                            <div>
                                <div className="flex items-center gap-2 mb-5">
                                    <div
                                        className="w-4 h-0.5 bg-green-400 rounded-full"
                                        style={{ animation: "pulse-glow 2s ease-in-out infinite" }}
                                    />
                                    <h3 className="text-xs font-bold text-white tracking-widest uppercase">Điều hướng</h3>
                                </div>
                                <ul className="space-y-1">
                                    {LINKS.map((link, i) => (
                                        <li key={link.to}>
                                            <Link href={link.to}
                                                className="footer-link-hover group flex items-center gap-2.5 text-sm text-gray-500 hover:text-white transition-colors duration-200 py-1.5 rounded-lg px-2 hover:bg-white/3"
                                                style={{ transitionDelay: `${i * 30}ms` }}
                                            >
                                                <span
                                                    className="w-5 h-5 rounded-md bg-white/4 group-hover:bg-green-400/15 flex items-center justify-center transition-all duration-300 group-hover:scale-110 text-[11px]"
                                                >
                                                    {link.icon}
                                                </span>
                                                <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                                                    {link.label}
                                                </span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </Reveal>

                        {/* Col 3: Thể loại */}
                        <Reveal delay={240} direction="right">
                            <div>
                                <div className="flex items-center gap-2 mb-5">
                                    <div
                                        className="w-4 h-0.5 bg-green-400 rounded-full"
                                        style={{ animation: "pulse-glow 2s ease-in-out infinite 0.5s" }}
                                    />
                                    <h3 className="text-xs font-bold text-white tracking-widest uppercase">Thể loại</h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {GENRES.map((g, i) => (
                                        <Link
                                            key={g}
                                            href={`/loc-phim?category=${g.toLowerCase().replace(/\s+/g, "-")}`}
                                            className="relative overflow-hidden px-2.5 py-1 text-[11px] rounded-lg border transition-all duration-300"
                                            style={{
                                                borderColor: hoveredGenre === g ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.08)",
                                                background: hoveredGenre === g ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.03)",
                                                color: hoveredGenre === g ? "rgb(74,222,128)" : "rgb(107,114,128)",
                                                transform: hoveredGenre === g ? "translateY(-2px) scale(1.05)" : "none",
                                                transitionDelay: `${i * 15}ms`,
                                            }}
                                            onMouseEnter={() => setHoveredGenre(g)}
                                            onMouseLeave={() => setHoveredGenre(null)}
                                        >
                                            {g}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </Reveal>
                    </div>

                    {/* ── BOTTOM BAR ── */}
                    <Reveal delay={340} direction="up">
                        <div className="relative overflow-hidden">
                            <GradientLine />
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5">
                                <p className="text-gray-600 text-xs text-center sm:text-left">
                                    © 2025 MoxiMovie – Cộng đồng mê phim
                                    <span
                                        className="text-red-500 mx-1 inline-block"
                                        style={{ animation: "pulse-glow 1.5s ease-in-out infinite" }}
                                    >❤</span>
                                    Tất cả quyền được bảo lưu.
                                </p>

                                {/* Status indicator */}
                                <div className="flex items-center gap-1.5 text-xs text-gray-700 group cursor-default">
                                    <div className="relative w-2 h-2">
                                        <span className="absolute inset-0 rounded-full bg-green-400 opacity-40 animate-ping" />
                                        <span
                                            className="absolute inset-0 rounded-full bg-green-400"
                                            style={{ animation: "pulse-glow 2s ease-in-out infinite" }}
                                        />
                                    </div>
                                    <span className="group-hover:text-green-400 transition-colors duration-300">
                                        Đang hoạt động
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </footer>
        </>
    );
};

export default Footer;