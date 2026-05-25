import { useState, useEffect, useRef, useCallback , memo } from "react";
import type { TouchEvent, MouseEvent } from "react";
import { Link } from "react-router-dom";
import { movieService } from "@/services/movieService";
import type { Movie } from "@/types/movie";

const SLIDE_INTERVAL = 10000;
const SWIPE_THRESHOLD = 50;

/* ─── Green accent palette ───────────────────
   Primary:  #22d3a5  (teal-green)
   Glow:     #10b981  (emerald)
   Accent2:  #86efac  (light green)
   Dark bg:  #060d0b
────────────────────────────────────────────── */

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700;800&display=swap');

  .as-root * { box-sizing: border-box; }

  /* ── slide transitions ── */
  @keyframes asSlideInL  { from{opacity:0;transform:translateX(70px) scale(0.97)} to{opacity:1;transform:none} }
  @keyframes asSlideInR  { from{opacity:0;transform:translateX(-70px) scale(0.97)} to{opacity:1;transform:none} }
  @keyframes asSlideOutL { from{opacity:1;transform:none} to{opacity:0;transform:translateX(-70px) scale(0.97)} }
  @keyframes asSlideOutR { from{opacity:1;transform:none} to{opacity:0;transform:translateX(70px) scale(0.97)} }
  .as-in-l  { animation: asSlideInL  0.7s cubic-bezier(0.16,1,0.3,1) forwards }
  .as-in-r  { animation: asSlideInR  0.7s cubic-bezier(0.16,1,0.3,1) forwards }
  .as-out-l { animation: asSlideOutL 0.7s cubic-bezier(0.16,1,0.3,1) forwards }
  .as-out-r { animation: asSlideOutR 0.7s cubic-bezier(0.16,1,0.3,1) forwards }

  /* ── content stagger ── */
  @keyframes asUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
  .as-s1 { animation: asUp 0.55s 0.05s cubic-bezier(0.16,1,0.3,1) both }
  .as-s2 { animation: asUp 0.55s 0.13s cubic-bezier(0.16,1,0.3,1) both }
  .as-s3 { animation: asUp 0.55s 0.22s cubic-bezier(0.16,1,0.3,1) both }
  .as-s4 { animation: asUp 0.55s 0.32s cubic-bezier(0.16,1,0.3,1) both }
  .as-s5 { animation: asUp 0.55s 0.40s cubic-bezier(0.16,1,0.3,1) both }

  /* ── Ken Burns ── */
  @keyframes asKB { from{transform:scale(1) translate(0,0)} to{transform:scale(1.08) translate(-1.2%,-0.6%)} }
  .as-kb { animation: asKB var(--dur,10s) linear forwards }

  /* ── progress bar ── */
  @keyframes asProgress { from{transform:scaleX(0)} to{transform:scaleX(1)} }
  .as-progress { transform-origin:left; animation: asProgress var(--dur,10s) linear forwards }

  /* ── play button glow ── */
  @keyframes asGlow {
    0%,100%{ box-shadow:0 0 0 0 rgba(34,211,165,0.45), 0 6px 24px rgba(34,211,165,0.3) }
    50%    { box-shadow:0 0 0 12px rgba(34,211,165,0), 0 8px 32px rgba(34,211,165,0.6) }
  }
  .as-play-glow { animation: asGlow 2.6s ease-in-out infinite }

  /* ── floating particles ── */
  @keyframes asFloat {
    0%   { transform:translateY(0) rotate(0deg); opacity:0 }
    10%  { opacity:0.9 }
    88%  { opacity:0.3 }
    100% { transform:translateY(-80px) rotate(25deg); opacity:0 }
  }
  .as-particle { animation: asFloat linear infinite; position:absolute; pointer-events:none }

  /* ── badge ping ── */
  @keyframes asPing { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.6);opacity:0.4} }
  .as-ping { animation: asPing 1.5s ease-in-out infinite }

  /* ── scanline sweep ── */
  @keyframes asScan { 0%{transform:translateY(-100%)} 100%{transform:translateY(200%)} }
  .as-scanline::after {
    content:''; position:absolute; inset-inline:0; height:35%;
    background:linear-gradient(to bottom,transparent,rgba(34,211,165,0.025),transparent);
    animation: asScan 7s linear infinite; pointer-events:none; z-index:7;
  }

  /* ── noise ── */
  .as-noise {
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.88' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23f)' opacity='1'/%3E%3C/svg%3E");
    background-repeat:repeat; background-size:140px 140px;
  }

  /* ── arrow buttons ── */
  .as-arrow { transition:all 0.22s ease }
  .as-arrow:hover { transform:scale(1.15); background:rgba(34,211,165,0.14)!important; border-color:rgba(34,211,165,0.5)!important; color:#22d3a5!important }

  /* ── thumbnail strip ── */
  .as-strip::-webkit-scrollbar { display:none }
  .as-strip { -ms-overflow-style:none; scrollbar-width:none }

  /* ── thumb shimmer ── */
  @keyframes asShimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
  .as-shimmer::after {
    content:''; position:absolute; inset:0; border-radius:inherit;
    background:linear-gradient(90deg,transparent,rgba(34,211,165,0.35),transparent);
    background-size:200% 100%;
    animation:asShimmer 2.2s linear infinite; pointer-events:none;
  }

  /* ── thumb card ── */
  .as-thumb { transition:all 0.38s cubic-bezier(0.16,1,0.3,1) }
  .as-thumb:not(.active):hover { opacity:0.82!important; transform:translateY(-4px) scale(1.06)!important }

  /* ── title line ── */
  @keyframes asTitleLine { from{width:0} to{width:48px} }
  .as-title-line { animation:asTitleLine 0.9s 0.2s cubic-bezier(0.16,1,0.3,1) both }

  /* ── hexagon grid bg ── */
  .as-hex-bg {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='48'%3E%3Cpath d='M14 0L28 8v16L14 32 0 24V8z' fill='none' stroke='rgba(34,211,165,0.04)' stroke-width='1'/%3E%3C/svg%3E");
    background-size: 28px 48px;
  }
`;

/* ── deterministic particles ── */
const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    left: `${4 + (i * 6.1) % 92}%`,
    bottom: `${3 + (i * 9.3) % 38}%`,
    size: 1.5 + (i % 4) * 0.8,
    dur: `${3 + (i % 6)}s`,
    delay: `${(i * 0.35) % 4.5}s`,
    shape: i % 4 === 0 ? 'diamond' : 'circle',
    color: i % 4 === 0 ? '#22d3a5' : i % 4 === 1 ? '#86efac' : i % 4 === 2 ? '#10b981' : '#6ee7b7',
}));

const BgImage = ({ src, alt }: { src: string; alt: string }) => (
    <img
        src={src} alt={alt} draggable={false}
        className="as-kb absolute inset-0 w-full h-full object-cover object-top select-none"
        style={{ '--dur': `${SLIDE_INTERVAL}ms` } as React.CSSProperties}
    />
);

/* ────────────────────────────────────────── */
const LatestAnimeCollectionSection = () => {
    const [datas, setDatas] = useState<Movie[]>([]);
    const [current, setCurrent] = useState(0);
    const [prevIdx, setPrevIdx] = useState<number | null>(null);
    const [dir, setDir] = useState<"left" | "right">("left");
    const [isAnimating, setAnim] = useState(false);
    const [progressKey, setPK] = useState(0);

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const dragStartX = useRef<number | null>(null);
    const thumbsRef = useRef<HTMLDivElement>(null);
    const styleInj = useRef(false);

    /* inject CSS */
    useEffect(() => {
        if (styleInj.current) return;
        const s = document.createElement("style");
        s.textContent = STYLES;
        document.head.appendChild(s);
        styleInj.current = true;
    }, []);

    useEffect(() => { movieService.dataAnimeMovies().then(setDatas); }, []);

    const startInterval = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            setDir("left");
            setCurrent(c => (c + 1) % (datas.length || 1));
            setPK(k => k + 1);
        }, SLIDE_INTERVAL);
    }, [datas.length]);

    useEffect(() => {
        if (!datas.length) return;
        startInterval();
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [datas.length, startInterval]);

    const changeTo = useCallback((direction: "left" | "right", target?: number) => {
        if (isAnimating || !datas.length) return;
        const next = target !== undefined
            ? target
            : direction === "left"
                ? (current + 1) % datas.length
                : (current - 1 + datas.length) % datas.length;
        setDir(direction);
        setPrevIdx(current);
        setAnim(true);
        setCurrent(next);
        setPK(k => k + 1);
        setTimeout(() => { setPrevIdx(null); setAnim(false); }, 750);
        startInterval();
        if (thumbsRef.current) {
            const el = thumbsRef.current.children[next] as HTMLElement;
            el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        }
    }, [isAnimating, datas.length, current, startInterval]);

    /* swipe */
    const onTS = (e: TouchEvent<HTMLDivElement>) => { dragStartX.current = e.touches[0].clientX; };
    const onTM = (e: TouchEvent<HTMLDivElement>) => {
        if (!dragStartX.current) return;
        const dx = e.touches[0].clientX - dragStartX.current;
        if (Math.abs(dx) > SWIPE_THRESHOLD) { changeTo(dx < 0 ? "left" : "right"); dragStartX.current = null; }
    };
    const onMD = (e: MouseEvent<HTMLDivElement>) => { dragStartX.current = e.clientX; };
    const onMM = (e: MouseEvent<HTMLDivElement>) => {
        if (!dragStartX.current) return;
        const dx = e.clientX - dragStartX.current;
        if (Math.abs(dx) > SWIPE_THRESHOLD) { changeTo(dx < 0 ? "left" : "right"); dragStartX.current = null; }
    };
    const clrDrag = () => { dragStartX.current = null; };

    if (!datas.length) return <div className="w-full" style={{ height: 560 }} />;

    const slide = datas[current];
    const prevSlide = prevIdx !== null ? datas[prevIdx] : null;
    const inCls = dir === "left" ? "as-in-l" : "as-in-r";
    const outCls = dir === "left" ? "as-out-l" : "as-out-r";

    return (
        <div className="as-root w-full px-3 sm:px-5 xl:px-6 pt-4 pb-10">

            {/* ── Section header ── */}
            <div className="flex items-end justify-between mb-5">
                <div>
                    <div className="flex items-center gap-2.5 mb-1.5">
                        <div className="as-title-line h-[3px] rounded-full"
                            style={{ background: 'linear-gradient(90deg,#22d3a5,#10b981)', width: 0 }} />
                        <span style={{
                            fontFamily: "'Outfit',sans-serif", color: '#22d3a5',
                            fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
                        }}>— Collection</span>
                    </div>
                    <h2 style={{
                        fontFamily: "'Bebas Neue',cursive",
                        fontSize: 'clamp(1.7rem,3.2vw,2.4rem)',
                        color: '#fff', letterSpacing: '0.05em', lineHeight: 1,
                    }}>Kho Tàng Anime Mới Nhất</h2>
                </div>
                <Link to="/hoat-hinh"
                    className="mb-1 flex items-center gap-1.5 transition-colors duration-300"
                    style={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit',sans-serif", fontSize: '0.78rem', fontWeight: 500 }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#22d3a5')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
                >
                    Xem tất cả <i className="fa-solid fa-angle-right text-[10px]" />
                </Link>
            </div>

            {/* ── Main stage ── */}
            <div
                className="relative w-full rounded-2xl overflow-hidden select-none cursor-grab active:cursor-grabbing as-scanline"
                style={{ height: 'clamp(260px,44vw,620px)', background: '#060d0b' }}
                onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={clrDrag}
                onMouseDown={onMD} onMouseMove={onMM} onMouseUp={clrDrag} onMouseLeave={clrDrag}
            >
                {/* BG images */}
                {prevSlide && (
                    <div key={`p-${prevIdx}`} className={`absolute inset-0 ${outCls}`}>
                        <BgImage src={`https://phimimg.com/${prevSlide.thumb_url}`} alt="" />
                    </div>
                )}
                <div key={`c-${current}`} className={`absolute inset-0 ${isAnimating ? inCls : ''}`}>
                    <BgImage src={`https://phimimg.com/${slide.thumb_url}`} alt={slide.name ?? ''} />
                </div>

                {/* Noise grain */}
                <div className="as-noise absolute inset-0 z-[3] pointer-events-none opacity-[0.04]" />

                {/* Hex grid */}
                <div className="as-hex-bg absolute inset-0 z-[3] pointer-events-none" />

                {/* Gradient overlays */}
                <div className="absolute inset-0 z-[5] pointer-events-none">
                    <div style={{ background: 'linear-gradient(108deg,#060d0b 0%,#060d0bdd 26%,#060d0b66 50%,transparent 70%)' }} className="absolute inset-0" />
                    <div style={{ background: 'linear-gradient(to top,#060d0b 0%,#060d0bbb 15%,transparent 42%)' }} className="absolute inset-0" />
                    <div style={{ background: 'linear-gradient(to bottom,#060d0b44 0%,transparent 22%)' }} className="absolute inset-0" />
                    {/* green tint */}
                    <div style={{ background: 'radial-gradient(ellipse 55% 75% at 18% 65%,rgba(16,185,129,0.07),transparent)' }} className="absolute inset-0" />
                    <div style={{ background: 'radial-gradient(ellipse 40% 50% at 80% 20%,rgba(34,211,165,0.04),transparent)' }} className="absolute inset-0" />
                </div>

                {/* Particles */}
                <div className="absolute inset-0 z-[6] overflow-hidden pointer-events-none">
                    {PARTICLES.map(p => (
                        <div key={p.id} className="as-particle"
                            style={{
                                left: p.left, bottom: p.bottom,
                                width: p.size, height: p.size,
                                background: p.color,
                                borderRadius: p.shape === 'diamond' ? '2px' : '50%',
                                transform: p.shape === 'diamond' ? 'rotate(45deg)' : undefined,
                                animationDuration: p.dur, animationDelay: p.delay,
                            }} />
                    ))}
                </div>

                {/* ── Content ── */}
                <div key={`ct-${current}`} className="absolute inset-0 z-20 flex flex-col justify-end pb-7 px-5 sm:px-8 lg:px-10">
                    <div className="max-w-[58%]" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(8px,1.4vw,14px)' }}>

                        {/* Badge row */}
                        <div className="as-s1 flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 rounded-full" style={{
                                background: 'rgba(34,211,165,0.1)', border: '1px solid rgba(34,211,165,0.3)',
                                color: '#22d3a5', padding: '3px 11px',
                                fontFamily: "'Outfit',sans-serif", fontSize: '0.62rem', fontWeight: 700,
                                letterSpacing: '0.12em', textTransform: 'uppercase',
                            }}>
                                <span className="as-ping w-1.5 h-1.5 rounded-full" style={{ background: '#22d3a5' }} />
                                Mới cập nhật
                            </span>
                            {slide.year && (
                                <span style={{
                                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'rgba(255,255,255,0.5)', padding: '3px 10px', borderRadius: 999,
                                    fontFamily: "'Outfit',sans-serif", fontSize: '0.62rem', fontWeight: 500,
                                }}>{slide.year}</span>
                            )}
                        </div>

                        {/* Title */}
                        <div className="as-s2">
                            <h1 style={{
                                fontFamily: "'Outfit',sans-serif",
                                fontSize: 'clamp(1.6rem,4.2vw,3.4rem)',
                                color: '#fff', lineHeight: 1.02,
                                textShadow: '0 2px 28px rgba(0,0,0,0.95)',
                                letterSpacing: '0.03em',
                            }} dangerouslySetInnerHTML={{ __html: slide.name ?? "" }} />
                            <p style={{
                                fontFamily: "'Outfit',sans-serif",
                                fontSize: 'clamp(0.62rem,1.3vw,0.82rem)',
                                color: '#22d3a5', fontWeight: 500, marginTop: 3, opacity: 0.85,
                            }} dangerouslySetInnerHTML={{ __html: slide.origin_name ?? "" }} />
                        </div>

                        {/* Genres */}
                        <div className="as-s3 flex flex-wrap" style={{ gap: 5 }}>
                            {Array.isArray(slide.category) && slide.category.slice(0, 4).map(c => (
                                <span key={c.id} style={{
                                    fontFamily: "'Outfit',sans-serif", fontSize: '0.63rem', fontWeight: 500,
                                    padding: '2px 9px', borderRadius: 5,
                                    background: 'rgba(34,211,165,0.07)', border: '1px solid rgba(34,211,165,0.18)',
                                    color: 'rgba(255,255,255,0.6)',
                                }}>{c.name}</span>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="as-s4 flex items-center" style={{ gap: 10 }}>
                            <Link to={`/phim/${slide.slug}`}>
                                <button className="as-play-glow flex items-center gap-2 rounded-full transition-transform duration-150 hover:scale-105 active:scale-95"
                                    style={{
                                        background: 'linear-gradient(135deg,#22d3a5,#10b981)',
                                        color: '#02100d', padding: '10px 22px',
                                        fontFamily: "'Outfit',sans-serif", fontSize: '0.82rem', fontWeight: 800,
                                        letterSpacing: '0.02em', border: 'none', cursor: 'pointer',
                                    }}>
                                    <svg width="11" height="13" viewBox="0 0 11 13" fill="currentColor">
                                        <path d="M10.5 6.5L.5 12.5V.5l10 6Z" />
                                    </svg>
                                    Xem ngay
                                </button>
                            </Link>
                            <Link to={`/phim/${slide.slug}`}>
                                <button className="flex items-center justify-center rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
                                    style={{
                                        width: 40, height: 40,
                                        background: 'rgba(34,211,165,0.07)', border: '1.5px solid rgba(34,211,165,0.22)',
                                        color: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)',
                                        fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer',
                                    }}>i</button>
                            </Link>

                            {/* pill dots */}
                            <div className="as-s5 flex items-center" style={{ gap: 5, marginLeft: 6 }}>
                                {datas.slice(0, Math.min(datas.length, 10)).map((_, i) => (
                                    <button key={i}
                                        onClick={() => changeTo(i > current ? "left" : "right", i)}
                                        style={{
                                            width: i === current ? 24 : 6, height: 6, borderRadius: 3, border: 'none',
                                            background: i === current ? '#22d3a5' : 'rgba(255,255,255,0.2)',
                                            cursor: 'pointer', padding: 0,
                                            transition: 'all 0.38s cubic-bezier(0.16,1,0.3,1)',
                                            boxShadow: i === current ? '0 0 10px rgba(34,211,165,0.7)' : 'none',
                                        }} />
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 z-30" style={{ height: 2, background: 'rgba(255,255,255,0.06)' }}>
                    <div key={`pb-${progressKey}`} className="as-progress h-full"
                        style={{ '--dur': `${SLIDE_INTERVAL}ms`, background: 'linear-gradient(90deg,#22d3a5,#10b981)' } as React.CSSProperties} />
                </div>
            </div>

            {/* ── Thumbnail strip ── */}
            <div className="relative mt-4">

                {/* edge fades */}
                <div className="absolute left-0 top-0 bottom-0 w-10 z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-10 z-10 pointer-events-none" />

                {/* scroll container — justify-center */}
                <div ref={thumbsRef} className="as-strip flex justify-center overflow-x-auto py-2 px-4" style={{ gap: 7 }}>
                    {datas.map((item, i) => {
                        const isActive = i === current;
                        return (
                            <div
                                key={item._id ?? i}
                                onClick={() => changeTo(i > current ? "left" : "right", i)}
                                className={`as-thumb relative flex-shrink-0 rounded-xl overflow-hidden cursor-pointer ${isActive ? "active as-shimmer" : ""}`}
                                style={{
                                    width: isActive ? 'clamp(50px,6vw,72px)' : 'clamp(42px,5vw,60px)',
                                    height: isActive ? 'clamp(72px,9vw,108px)' : 'clamp(60px,7.5vw,90px)',
                                    opacity: isActive ? 1 : 0.42,
                                    alignSelf: 'flex-end',
                                    boxShadow: isActive
                                        ? '0 0 0 2px #22d3a5, 0 0 22px rgba(34,211,165,0.45), 0 8px 24px rgba(0,0,0,0.8)'
                                        : '0 3px 10px rgba(0,0,0,0.55)',
                                }}
                            >
                                <img
                                    src={`https://phimimg.com/${item.poster_url || item.thumb_url}`}
                                    alt={item.name ?? ""} loading="lazy"
                                    className="w-full h-full object-cover"
                                />

                                {/* gradient */}
                                <div className="absolute inset-0 pointer-events-none" style={{
                                    background: isActive
                                        ? 'linear-gradient(to top,rgba(6,13,11,0.95) 0%,rgba(6,13,11,0.1) 48%,transparent 100%)'
                                        : 'linear-gradient(to top,rgba(0,0,0,0.65) 0%,transparent 65%)',
                                }} />

                                {/* active top line */}
                                {isActive && (
                                    <div className="absolute top-0 left-0 right-0 h-[2px] z-10"
                                        style={{ background: 'linear-gradient(90deg,transparent,#22d3a5 35%,#22d3a5 65%,transparent)' }} />
                                )}

                                {/* active bottom title */}
                                {isActive && (
                                    <div className="absolute bottom-0 left-0 right-0 px-1 pb-1.5 pt-3 z-10">
                                        <p style={{
                                            fontFamily: "'Outfit',sans-serif", fontSize: '0.55rem', fontWeight: 700,
                                            color: '#22d3a5', lineHeight: 1.25, textAlign: 'center',
                                            overflow: 'hidden', display: '-webkit-box',
                                            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                                        }}>{item.name}</p>
                                    </div>
                                )}

                                {/* inactive number */}
                                {!isActive && (
                                    <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-1 z-10">
                                        <span style={{
                                            fontFamily: "'Bebas Neue',cursive",
                                            fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1,
                                        }}>{i + 1}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* bottom glow line */}
                <div className="mx-auto mt-2" style={{
                    height: 1, width: '50%',
                    background: 'linear-gradient(90deg,transparent,rgba(34,211,165,0.2),transparent)',
                }} />
            </div>

        </div>
    );
};

export default memo(LatestAnimeCollectionSection);