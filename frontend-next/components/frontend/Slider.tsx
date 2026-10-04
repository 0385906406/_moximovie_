"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { increaseAffiliateCount } from "@/helpers/affiliateHelper";
import Link from "next/link";
import { movieService } from "@/services/movieService";
import type { Movie } from "@/types/movie";
import type { Category } from "@/types/category";
import { ThreeDot } from "react-loading-indicators";
import MovieImage from "@/components/frontend/MovieImage";
import { getImageProps } from "next/image";
import { movieImageSources } from "@/lib/movieImage";
import { usePauseOffscreen } from "@/hooks/usePauseOffscreen";
import { Eye, Calendar } from "lucide-react";

const INTERVAL     = 7000;
const SWIPE_THRESH = 50;
const DRAG_THRESH  = 70;

const FLOATS = [
    { top: "15%", left: "10%",  size: 8, color: "#2DD4BF", delay: "0s"   },
    { top: "70%", left: "8%",   size: 6, color: "#6366F1", delay: "-4s"  },
    { top: "25%", left: "45%",  size: 5, color: "#2DD4BF", delay: "-8s"  },
    { top: "80%", left: "55%",  size: 7, color: "#2DD4BF", delay: "-12s" },
    { top: "35%", left: "88%",  size: 5, color: "#6366F1", delay: "-2s"  },
    { top: "60%", left: "92%",  size: 4, color: "#38BDF8", delay: "-6s"  },
    { top: "10%", left: "70%",  size: 4, color: "#2DD4BF", delay: "-10s" },
    { top: "90%", left: "30%",  size: 5, color: "#6366F1", delay: "-14s" },
];

/* Tải trước đúng bản đã resize mà slide sẽ dùng (cùng srcset/sizes) */
function preloadSlide(m: Movie) {
    const src = movieImageSources(m, "thumb")[0];
    if (!src) return;
    const { props } = getImageProps({ src, alt: "", fill: true, sizes: "100vw", quality: 80 });
    const img = new Image();
    img.sizes = "100vw";
    if (props.srcSet) img.srcset = props.srcSet;
    img.src = props.src;
}

/* Tên phim từ API có thể chứa &amp; &#39;… → giải mã để tách từng chữ (hiệu ứng chữ hiện dần) */
function decodeEntities(s: string) {
    return s
        .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
        .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
        .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

/* ── Affiliate wrapper ──
   Khai báo ngoài Slider: khai báo bên trong thì mỗi lần đổi slide React coi là component mới
   → gỡ/dựng lại nút "Xem phim" của cả 10 slide */
function AffiliateWrap({
    children,
    className = "",
    limitReached,
    onLimitReached,
}: {
    children: React.ReactNode;
    className?: string;
    limitReached: boolean;
    onLimitReached: () => void;
}) {
    if (limitReached) return <div className={className}>{children}</div>;
    /* span thay vì <a>: bên trong đã có <Link> (là thẻ <a>), <a> lồng <a> là HTML sai → lỗi hydration */
    return (
        <span
            className={className}
            onClick={() => {
                const data = increaseAffiliateCount();
                if (data.count >= data.max) onLimitReached();
            }}
        >
            {children}
        </span>
    );
}

type Nav = { active: number; prev: number; dir: 1 | -1; n: number };

const Slider: React.FC<{ initialData?: Movie[] }> = ({ initialData }) => {
    const [slides, setSlides] = useState<Movie[]>(() => {
        if (!initialData?.length) return [];
        return initialData.map((m: Movie) => ({
            ...m,
            category: Array.isArray(m.category)
                ? [...new Map(m.category.map((c: Category) => [c.id, c])).values()]
                : [],
        }));
    });
    /* active: slide đang hiện · prev: slide vừa rời đi (chạy hiệu ứng ra) · dir: hướng chuyển · n: đếm lần chuyển */
    const [nav, setNav]         = useState<Nav>({ active: 0, prev: -1, dir: 1, n: 0 });
    const [loading, setLoading] = useState(!initialData?.length);
    const [paused, setPaused]   = useState(false);
    const [isLimitReached, setIsLimitReached] = useState(false);
    const { active, prev, dir, n: progKey } = nav;

    const touchX = useRef(0);
    const drag = useRef({ on: false, x: 0, dx: 0, moved: false });
    const sectionRef = useRef<HTMLElement | null>(null);
    const pauseRef = usePauseOffscreen<HTMLElement>("0px");
    const setSection = useCallback((el: HTMLElement | null) => { sectionRef.current = el; pauseRef(el); }, [pauseRef]);

    /* ── Fetch ── */
    useEffect(() => {
        if (initialData?.length) {
            slides.slice(0, 4).forEach(preloadSlide);
            return;
        }
        movieService.dataSlider()
            .then((data: Movie[]) => {
                const mapped = data.map((m: Movie) => ({
                    ...m,
                    category: Array.isArray(m.category)
                        ? [...new Map(m.category.map((c: Category) => [c.id, c])).values()]
                        : [],
                }));
                setSlides(mapped);
                mapped.slice(0, 4).forEach(preloadSlide);
            })
            .catch(e => console.error("Fetch slider error:", e))
            .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const goTo = useCallback((idx: number, forceDir?: 1 | -1) => {
        const total = slides.length;
        if (!total) return;
        const next = ((idx % total) + total) % total;
        setNav(s => s.active === next ? s : {
            active: next,
            prev: s.active,
            dir: forceDir ?? (next > s.active ? 1 : -1),
            n: s.n + 1,
        });
    }, [slides.length]);

    /* ── Auto-advance: chuyển slide khi thanh tiến trình chạy hết (onAnimationEnd bên dưới).
       Hover hoặc cuộn khỏi màn hình → animation tạm dừng → cả thanh lẫn việc chuyển slide cùng dừng. ── */
    const advance = useCallback(() => {
        if (slides.length <= 1) return;
        setNav(s => ({ active: (s.active + 1) % slides.length, prev: s.active, dir: 1, n: s.n + 1 }));
    }, [slides.length]);

    /* ── Preload next ── */
    useEffect(() => {
        if (!slides.length) return;
        preloadSlide(slides[(active + 1) % slides.length]);
    }, [active, slides]);

    /* ── Keyboard ── */
    useEffect(() => {
        const fn = (e: KeyboardEvent) => {
            /* Đang gõ trong ô tìm kiếm thì mũi tên để di chuyển con trỏ, không được đổi slide */
            const t = e.target as HTMLElement | null;
            if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
            if (e.key === "ArrowLeft")  goTo(active - 1, -1);
            if (e.key === "ArrowRight") goTo(active + 1, 1);
        };
        document.addEventListener("keydown", fn);
        return () => document.removeEventListener("keydown", fn);
    }, [active, goTo]);

    /* ── Touch ── */
    const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; };
    const onTouchEnd   = (e: React.TouchEvent) => {
        const delta = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(delta) > SWIPE_THRESH) goTo(active + (delta < 0 ? 1 : -1), delta < 0 ? 1 : -1);
    };

    /* ── Kéo chuột: slide nhích theo tay (--drag), thả quá ngưỡng thì chuyển ── */
    const onPointerDown = (e: React.PointerEvent) => {
        if (e.pointerType !== "mouse" || e.button !== 0) return;
        if ((e.target as HTMLElement).closest("button, a, .sl-thumbs")) return;
        drag.current = { on: true, x: e.clientX, dx: 0, moved: false };
        sectionRef.current?.classList.add("sl-dragging");
    };
    useEffect(() => {
        const move = (e: PointerEvent) => {
            const d = drag.current;
            if (!d.on) return;
            d.dx = e.clientX - d.x;
            if (Math.abs(d.dx) > 5) d.moved = true;
            sectionRef.current?.style.setProperty("--drag", String(Math.max(-1, Math.min(1, d.dx / 400))));
        };
        const up = () => {
            const d = drag.current;
            if (!d.on) return;
            d.on = false;
            sectionRef.current?.classList.remove("sl-dragging");
            sectionRef.current?.style.setProperty("--drag", "0");
            if (Math.abs(d.dx) > DRAG_THRESH) goTo(active + (d.dx < 0 ? 1 : -1), d.dx < 0 ? 1 : -1);
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
        return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    }, [active, goTo]);

    const onAffiliateClick = useCallback(() => setIsLimitReached(true), []);

    /* ── Loading / empty states ── */
    if (loading) return (
        <div className="sl-h w-full flex items-center justify-center bg-[#191B24]">
            <ThreeDot variant="bounce" color="#2DD4BF" size="medium" text="" textColor="" />
        </div>
    );
    if (!slides.length) return <div className="sl-h w-full bg-[#191B24]" />;

    const total = slides.length;
    const pad = (x: number) => String(x).padStart(2, "0");

    return (
        <>
            <style>{SLIDER_CSS}</style>

            <section
                ref={setSection}
                className="sl-h sl-root relative w-full overflow-hidden select-none bg-[#191B24]"
                style={{ zIndex: 30, "--drag": 0 } as React.CSSProperties}
                data-parallax
                /* Chỉ có data-dir sau lần chuyển đầu tiên → lúc mới tải trang slide đầu không chạy hiệu ứng quét */
                data-dir={progKey > 0 ? dir : undefined}
                aria-roledescription="carousel"
                aria-label="Phim nổi bật"
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
                onFocus={() => setPaused(true)}
                onBlur={() => setPaused(false)}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
                onPointerDown={onPointerDown}
                /* Vừa kéo xong thì không tính là bấm link */
                onClickCapture={e => { if (drag.current.moved) { e.preventDefault(); e.stopPropagation(); drag.current.moved = false; } }}
            >
                {/* ── Slides xếp chồng: slide đang hiện quét vào, slide cũ thu nhỏ lùi ra ── */}
                {slides.map((slide, i) => {
                    const state = i === active ? "active" : i === prev ? "prev" : "idle";
                    const words = decodeEntities(slide.name ?? "").split(/\s+/).filter(Boolean);
                    const cats = Array.isArray(slide.category) ? slide.category.slice(0, 3) : [];
                    return (
                        <article
                            key={slide._id ?? i}
                            className="sl-slide"
                            data-state={state}
                            role="group"
                            aria-roledescription="slide"
                            aria-label={`${i + 1} / ${total}`}
                            aria-hidden={state !== "active"}
                        >
                            {/* Không gắn key theo lần chuyển: CSS animation tự chạy lại khi data-state đổi, gắn key sẽ tải lại ảnh → chớp */}
                            <div className="sl-media">
                                <MovieImage
                                    movie={slide} prefer="thumb"
                                    alt={slide.name ?? ""}
                                    fill
                                    sizes="100vw"
                                    quality={80}
                                    priority={i === 0}
                                    className="sl-bg"
                                    style={{ objectFit: "cover", objectPosition: "center", filter: "saturate(0.8) brightness(0.9)" }}
                                />
                            </div>

                            {/* Phủ tối bên trái + mờ dần xuống đáy về màu nền trang */}
                            <div aria-hidden className="sl-shade" />
                            {/* Vệt sáng quét ngang khi slide vào */}
                            {state === "active" && <div aria-hidden key={`sw${progKey}`} className="sl-sweep" />}

                            {/* Poster 3D nổi bên phải (máy tính) */}
                            {state !== "idle" && (
                                <div aria-hidden className="sl-poster-wrap">
                                    <div className="sl-poster">
                                        <MovieImage movie={slide} prefer="poster" alt="" fill sizes="260px" quality={75} className="object-cover" />
                                        <span className="sl-poster-glare" />
                                    </div>
                                </div>
                            )}

                            {/* Nội dung */}
                            <div className="sl-inner">
                                <div className="sl-content">
                                    <span className="sl-eyebrow">
                                        <span className="sl-eyedot" aria-hidden />
                                        {slide.country?.[0]?.name && (
                                            <>
                                                <span>{slide.country[0].name}</span>
                                                <span className="text-white/25">·</span>
                                            </>
                                        )}
                                        <span>{cats[0]?.name ?? "Phim mới"}</span>
                                    </span>

                                    <h2 className="sl-title" aria-label={decodeEntities(slide.name ?? "")}>
                                        {words.map((w, wi) => (
                                            <span key={wi} className="sl-w" aria-hidden>
                                                <span style={{ "--i": wi } as React.CSSProperties}>{w}</span>
                                            </span>
                                        ))}
                                    </h2>


                                    {slide.origin_name && (
                                        <p className="sl-lead" dangerouslySetInnerHTML={{ __html: slide.origin_name }} />
                                    )}

                                    <div className="sl-meta">
                                        {slide.quality && (
                                            <span className="sl-q" style={{ "--c": 0 } as React.CSSProperties}>{slide.quality}</span>
                                        )}
                                        {(slide.year || slide.time) && (
                                            <span className="sl-stat" style={{ "--c": 1 } as React.CSSProperties}>
                                                <Calendar size={12} />
                                                {[slide.year, slide.time].filter(Boolean).join(" · ")}
                                            </span>
                                        )}
                                        {(slide as Movie & { view?: number }).view ? (
                                            <span className="sl-stat sl-stat-hot" style={{ "--c": 2 } as React.CSSProperties}>
                                                <Eye size={12} />
                                                {((slide as Movie & { view?: number }).view ?? 0).toLocaleString("vi-VN")} lượt xem
                                            </span>
                                        ) : null}
                                        {cats.length > 0 && (
                                            <span className="sl-genres">
                                                {cats.map((cat, ci) => (
                                                    <span key={cat.id} className="sl-genre" style={{ "--c": ci + 3 } as React.CSSProperties}>{cat.name}</span>
                                                ))}
                                            </span>
                                        )}
                                    </div>

                                    <div className="sl-btns">
                                        <AffiliateWrap limitReached={isLimitReached} onLimitReached={onAffiliateClick}>
                                            <Link href={`/xem-phim/${slide.slug}`} className="sl-cta-fill" tabIndex={state === "active" ? 0 : -1}>
                                                <span className="sl-cta-shine" aria-hidden />
                                                <span className="sl-cta-play" aria-hidden>
                                                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5l11 7-11 7z" /></svg>
                                                </span>
                                                <span className="hidden sm:inline">Xem phim</span>
                                            </Link>
                                        </AffiliateWrap>
                                        <Link href={`/phim/${slide.slug}`} className="sl-cta-ghost" tabIndex={state === "active" ? 0 : -1}>
                                            <span className="hidden sm:inline">Chi tiết</span>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                                <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 8v4m0 4h.01" />
                                            </svg>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </article>
                    );
                })}

                {/* Chấm sáng trôi (dịch theo chuột qua [data-parallax]) */}
                <div aria-hidden className="sl-orbs">
                    {FLOATS.map((f, i) => (
                        <span key={i} className="sl-float" style={{ top: f.top, left: f.left, width: f.size, height: f.size, background: f.color, boxShadow: `0 0 16px ${f.color}`, animationDelay: f.delay }} />
                    ))}
                </div>

                {/* Nút trái/phải dạng kính — hiện khi rê chuột vào slider */}
                <button type="button" className="sl-arrow sl-arrow-l" onClick={() => goTo(active - 1, -1)} aria-label="Slide trước">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <button type="button" className="sl-arrow sl-arrow-r" onClick={() => goTo(active + 1, 1)} aria-label="Slide tiếp">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>

                {/* Bộ đếm 01 / 10 — số lăn khi đổi slide */}
                <div className="sl-counter" aria-hidden>
                    <span className="sl-counter-cur"><span key={progKey} className={dir > 0 ? "sl-roll-up" : "sl-roll-down"}>{pad(active + 1)}</span></span>
                    <span className="sl-counter-sep" />
                    <span className="sl-counter-total">{pad(total)}</span>
                </div>

                {/* Chấm (điện thoại) */}
                <div className="sl-dots" role="tablist" aria-label="Chọn slide">
                    {slides.map((s, i) => (
                        <button key={s._id ?? i} type="button" role="tab" aria-selected={i === active} aria-label={`Slide ${i + 1}`} onClick={() => goTo(i)} className="sl-dot-btn">
                            <span className={`sl-dot ${i === active ? "is-on" : ""}`}>
                                {i === active && <span key={progKey} className="sl-dot-fill" style={{ animationDuration: `${INTERVAL}ms`, animationPlayState: paused ? "paused" : "running" }} />}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Dải thumbnail (máy tính) */}
                <div className="sl-thumbs" role="tablist" aria-label="Chọn slide">
                    {slides.map((s, i) => (
                        <button
                            key={s._id ?? i}
                            type="button"
                            role="tab"
                            className={`sl-thumb-btn ${i === active ? "is-on" : ""}`}
                            aria-selected={i === active}
                            aria-label={s.name ?? `Slide ${i + 1}`}
                            onClick={() => goTo(i)}
                        >
                            <MovieImage
                                movie={s} prefer="thumb"
                                alt=""
                                width={80}
                                height={45}
                                /* Ghi rõ kích thước: Tailwind đặt img { height: auto } → ảnh bị đổi 1 chiều, Next cảnh báo */
                                style={{ width: 80, height: 45, objectFit: "cover", display: "block" }}
                            />
                            {i === active && (
                                <span key={progKey} className="sl-thumb-fill" aria-hidden style={{ animationDuration: `${INTERVAL}ms`, animationPlayState: paused ? "paused" : "running" }} />
                            )}
                            <span className="sl-thumb-tip" dangerouslySetInnerHTML={{ __html: s.name ?? "" }} />
                        </button>
                    ))}
                </div>

                {/* Thanh tiến trình lớn — hết thanh thì tự chuyển slide */}
                <div aria-hidden className="sl-progress">
                    <div
                        key={progKey}
                        onAnimationEnd={advance}
                        className="sl-progress-fill"
                        style={{ animationDuration: `${INTERVAL}ms`, animationPlayState: paused ? "paused" : "running" }}
                    />
                </div>
            </section>
        </>
    );
};

export default Slider;

/* ══════════════════════════════════════════════
   CSS
══════════════════════════════════════════════ */
const EASE = "cubic-bezier(.22,1,.36,1)";
const SLIDER_CSS = `
.sl-h { height: 600px; }
@media (max-width: 1179px) { .sl-h { height: 520px; } }
@media (max-width: 767px)  { .sl-h { height: 440px; } }

/* ── Slide xếp chồng ── */
.sl-slide { position: absolute; inset: 0; overflow: hidden; visibility: hidden; }
.sl-slide[data-state="active"] { visibility: visible; z-index: 3; }
.sl-slide[data-state="prev"]   { visibility: visible; z-index: 2; }

/* Vào: quét theo hướng chuyển (clip-path), ra: thu nhỏ + tối + trượt ngược */
.sl-root[data-dir="1"]  .sl-slide[data-state="active"] { animation: slWipeNext 1.05s ${EASE} both; }
.sl-root[data-dir="-1"] .sl-slide[data-state="active"] { animation: slWipePrev 1.05s ${EASE} both; }
.sl-root[data-dir="1"]  .sl-slide[data-state="prev"]   { animation: slOutNext 1.05s ${EASE} both; }
.sl-root[data-dir="-1"] .sl-slide[data-state="prev"]   { animation: slOutPrev 1.05s ${EASE} both; }
@keyframes slWipeNext { from { clip-path: inset(0 0 0 100%); } to { clip-path: inset(0 0 0 0); } }
@keyframes slWipePrev { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
@keyframes slOutNext  { from { transform: none; filter: brightness(1); } to { transform: translateX(-12%) scale(.92); filter: brightness(.35); } }
@keyframes slOutPrev  { from { transform: none; filter: brightness(1); } to { transform: translateX(12%) scale(.92); filter: brightness(.35); } }
/* Lần đầu tải trang: không quét, chỉ hiện dần */
.sl-root:not([data-dir]) .sl-slide[data-state="active"] { animation: none; }

/* Ảnh nền: zoom chậm + nhích theo tay khi kéo */
.sl-media { position: absolute; inset: 0; transform: translateX(calc(var(--drag) * 40px)); transition: transform .5s ${EASE}; }
.sl-dragging .sl-media { transition: none; }
.sl-slide[data-state="active"] .sl-bg { animation: slKenIn 9s cubic-bezier(.2,.6,.3,1) both; }
@keyframes slKenIn { from { transform: scale(1.18) translate(2%, 1%); } to { transform: scale(1.03); } }

.sl-shade {
    position: absolute; inset: 0; z-index: 2; pointer-events: none;
    background:
        linear-gradient(90deg, rgba(25,27,36,.98) 0%, rgba(25,27,36,.92) 30%, rgba(25,27,36,.62) 52%, rgba(25,27,36,.15) 74%, rgba(25,27,36,.3) 100%),
        linear-gradient(to bottom, rgba(25,27,36,.35) 0%, transparent 22%, transparent 58%, rgba(25,27,36,1) 100%);
}
.sl-sweep {
    position: absolute; inset: 0; z-index: 3; pointer-events: none;
    background: linear-gradient(105deg, transparent 38%, rgba(94,234,212,.16) 48%, rgba(255,255,255,.22) 50%, rgba(94,234,212,.16) 52%, transparent 62%);
    transform: translateX(-100%);
    animation: slSweep 1.4s ${EASE} .35s forwards;
}
@keyframes slSweep { to { transform: translateX(100%); } }

/* ── Poster 3D bên phải ── */
.sl-poster-wrap {
    position: absolute; z-index: 4; right: 9%; top: 50%; width: 230px; aspect-ratio: 2 / 3;
    perspective: 1000px; pointer-events: none;
    transform: translateY(-58%) translate(calc(var(--px, 0) * 14px), calc(var(--py, 0) * 10px));
    transition: transform .8s ${EASE};
}
@media (max-width: 1179px) { .sl-poster-wrap { display: none; } }
.sl-poster {
    position: absolute; inset: 0; border-radius: 16px; overflow: hidden;
    transform: rotateY(calc(-16deg + var(--px, 0) * 10deg)) rotateX(calc(4deg + var(--py, 0) * -8deg));
    box-shadow: 0 0 0 1px rgba(255,255,255,.12), 0 30px 70px rgba(0,0,0,.65), 0 0 60px rgba(34,211,165,.22);
    -webkit-box-reflect: below 12px linear-gradient(transparent 70%, rgba(0,0,0,.25));
    transition: transform .8s ${EASE};
}
.sl-slide[data-state="active"] .sl-poster { animation: slPosterIn 1.2s ${EASE} .25s both; }
.sl-slide[data-state="prev"] .sl-poster-wrap { animation: slPosterOut .7s ease both; }
@keyframes slPosterIn  { from { opacity: 0; transform: translateX(120px) translateZ(-200px) rotateY(-50deg); } }
@keyframes slPosterOut { to { opacity: 0; } }
.sl-poster-glare { position: absolute; inset: 0; background: linear-gradient(125deg, rgba(255,255,255,.28), transparent 40%); mix-blend-mode: soft-light; }

/* ── Nội dung ── */
.sl-inner {
    position: relative; z-index: 5; height: 100%;
    display: flex; flex-direction: column; justify-content: center;
    padding: 48px 80px 104px;
    transform: translate(calc(var(--px, 0) * -10px + var(--drag) * 60px), calc(var(--py, 0) * -6px));
    transition: transform .6s ${EASE};
}
.sl-dragging .sl-inner { transition: none; }
@media (max-width: 1179px) { .sl-inner { padding: 40px 56px 96px; } }
@media (max-width: 767px)  { .sl-inner { padding: 104px 20px 64px; justify-content: flex-end; } } /* chừa chỗ thanh menu cố định phía trên */
.sl-content { max-width: 640px; }
@media (min-width: 1180px) { .sl-content { max-width: min(640px, 52vw); } }

.sl-eyebrow { display: inline-flex; align-items: center; gap: 10px; margin-bottom: 18px; color: #2DD4BF;
    font-size: 10px; font-weight: 700; letter-spacing: .22em; text-transform: uppercase; }
.sl-eyedot { width: 8px; height: 8px; border-radius: 50%; background: #2DD4BF; box-shadow: 0 0 10px #2DD4BF; animation: sl-pulse 2s ease-in-out infinite; }

.sl-title {
    font-size: clamp(24px, 4vw, 48px); line-height: 1.12; font-weight: 800; letter-spacing: -.5px;
    margin-bottom: 14px; filter: drop-shadow(0 4px 20px rgba(0,0,0,.55));
    display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
    padding-bottom: .08em;
}
.sl-w { display: inline-block; overflow: hidden; vertical-align: top; margin-right: .26em; padding-bottom: .1em; }
.sl-w > span {
    display: inline-block;
    background: linear-gradient(100deg, #7dd3fc 0%, #7dd3fc 40%, #f0fdfa 50%, #5eead4 60%, #7dd3fc 100%);
    background-size: 300% 100%; background-position: 100% 0;
    -webkit-background-clip: text; background-clip: text; color: transparent;
}
.sl-slide[data-state="active"] .sl-w > span {
    animation:
        slWordIn .9s ${EASE} calc(.3s + var(--i) * .07s) both,
        slWordShine 5.5s ease-in-out calc(1.6s + var(--i) * .12s) infinite;
}
@keyframes slWordIn    { from { transform: translateY(110%) rotate(4deg); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes slWordShine { 0%, 55% { background-position: 100% 0; } 85%, 100% { background-position: 0% 0; } }

.sl-lead { color: rgba(255,255,255,.55); font-size: 14px; line-height: 1.65; margin-bottom: 20px; font-style: italic;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
@media (max-width: 767px) { .sl-lead { display: none; } }

.sl-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 10px 14px; margin-bottom: 26px; }
.sl-q { font-size: 10.5px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: #04221b;
    padding: 5px 10px; border-radius: 6px; background: linear-gradient(135deg, #5eead4, #22d3a5);
    box-shadow: 0 0 18px rgba(34,211,165,.35); line-height: 1; }
.sl-stat { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; line-height: 1;
    color: rgba(255,255,255,.6); }
.sl-stat svg { color: #2DD4BF; flex-shrink: 0; }
.sl-stat-hot { color: rgba(255,255,255,.85); font-weight: 600; }
.sl-genres { display: flex; flex-wrap: wrap; gap: 6px; }
.sl-genre { font-size: 11px; font-weight: 500; line-height: 1; padding: 6px 11px; border-radius: 999px;
    color: rgba(255,255,255,.8); background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1);
    transition: background .25s, border-color .25s, color .25s; }
.sl-genre:hover { background: rgba(45,212,191,.12); border-color: rgba(45,212,191,.45); color: #fff; }
@media (max-width: 767px) { .sl-genre:nth-child(n+3) { display: none; } }

.sl-btns { display: flex; align-items: center; gap: 12px; }
.sl-cta-fill {
    position: relative; overflow: hidden; display: inline-flex; align-items: center; gap: 10px;
    padding: 8px 22px 8px 8px; border-radius: 999px; background: linear-gradient(135deg, #5eead4, #22d3a5 55%, #10b981);
    color: #042f2e; font-size: 12px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase;
    box-shadow: 0 8px 30px rgba(45,212,191,.4), inset 0 1px 0 rgba(255,255,255,.45);
    transition: transform .3s cubic-bezier(.34,1.56,.64,1), box-shadow .3s ease;
}
.sl-cta-fill:hover { transform: translateY(-2px) scale(1.04); box-shadow: 0 14px 44px rgba(45,212,191,.6), inset 0 1px 0 rgba(255,255,255,.45); }
.sl-cta-fill:active { transform: scale(.97); }
.sl-cta-play { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
    background: rgba(4,47,46,.9); color: #5eead4; transition: transform .4s cubic-bezier(.34,1.56,.64,1); }
.sl-cta-play svg { width: 13px; height: 13px; margin-left: 2px; }
.sl-cta-fill:hover .sl-cta-play { transform: rotate(360deg) scale(1.08); }
@media (max-width: 639px) { .sl-cta-fill { padding: 8px; } }
.sl-cta-shine { position: absolute; inset: 0; background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,.55) 50%, transparent 65%);
    transform: translateX(-120%); animation: slCtaShine 3.2s ease-in-out 2s infinite; }
@keyframes slCtaShine { 0% { transform: translateX(-120%); } 40%, 100% { transform: translateX(120%); } }
.sl-cta-ghost {
    display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px; border-radius: 999px;
    border: 1px solid rgba(255,255,255,.2); color: rgba(255,255,255,.72); background: rgba(255,255,255,.04);
    font-size: 12px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase;
    transition: border-color .25s, color .25s, background .25s, transform .25s;
}
.sl-cta-ghost:hover { border-color: rgba(45,212,191,.55); color: #2DD4BF; background: rgba(45,212,191,.08); transform: translateY(-2px); }

/* Nội dung hiện lần lượt */
.sl-slide[data-state="active"] .sl-eyebrow { animation: slRevealX .7s ${EASE} .15s both; }
.sl-slide[data-state="active"] .sl-lead    { animation: slUp .7s ${EASE} .55s both; }
.sl-slide[data-state="active"] .sl-q,
.sl-slide[data-state="active"] .sl-stat,
.sl-slide[data-state="active"] .sl-genre { animation: slPop .55s cubic-bezier(.34,1.56,.64,1) calc(.65s + var(--c) * .07s) both; }
.sl-slide[data-state="active"] .sl-btns > * { animation: slUp .7s ${EASE} .85s both; }
.sl-slide[data-state="active"] .sl-btns > *:nth-child(2) { animation-delay: .95s; }
.sl-slide[data-state="prev"] .sl-inner { animation: slContentOut .5s ease both; }
@keyframes slRevealX { from { clip-path: inset(0 100% 0 0); opacity: 0; } to { clip-path: inset(0 0 0 0); opacity: 1; } }
@keyframes slUp      { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes slPop     { from { opacity: 0; transform: scale(.6) translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes slContentOut { to { opacity: 0; transform: translateY(-16px); } }

/* ── Chấm sáng trôi ── */
.sl-orbs { position: absolute; inset: 0; z-index: 4; pointer-events: none;
    transform: translate(calc(var(--px, 0) * 22px), calc(var(--py, 0) * 14px)); transition: transform .8s ${EASE}; }
.sl-float { position: absolute; display: block; border-radius: 50%; opacity: .7; animation: sl-drift 20s ease-in-out infinite; }
@keyframes sl-drift { 0%,100% { transform: translate(0,0); } 25% { transform: translate(10px,-15px); } 50% { transform: translate(-8px,10px); } 75% { transform: translate(12px,8px); } }
@keyframes sl-pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .42; transform: scale(.76); } }
@keyframes sl-progress { from { transform: scaleX(0); } to { transform: scaleX(1); } }

/* ── Nút trái/phải ── */
.sl-arrow {
    position: absolute; top: 50%; z-index: 8; width: 50px; height: 50px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center; color: #fff; cursor: pointer;
    background: rgba(15,20,30,.45); border: 1px solid rgba(255,255,255,.14);
    backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
    opacity: 0; transition: opacity .35s ease, transform .35s ${EASE}, background .25s, border-color .25s;
}
.sl-arrow svg { width: 20px; height: 20px; transition: transform .3s ${EASE}; }
.sl-arrow-l { left: 18px; transform: translate(-12px, -50%); }
.sl-arrow-r { right: 18px; transform: translate(12px, -50%); }
.sl-root:hover .sl-arrow, .sl-arrow:focus-visible { opacity: 1; transform: translate(0, -50%); }
.sl-arrow:hover { background: rgba(34,211,165,.22); border-color: rgba(34,211,165,.6); box-shadow: 0 0 24px rgba(34,211,165,.35); }
.sl-arrow-l:hover svg { transform: translateX(-3px); }
.sl-arrow-r:hover svg { transform: translateX(3px); }
.sl-arrow:active { transform: translate(0, -50%) scale(.9) !important; }
@media (max-width: 767px) { .sl-arrow { display: none; } }

/* ── Bộ đếm ── */
.sl-counter { position: absolute; z-index: 7; left: 80px; bottom: 34px; display: flex; align-items: center; gap: 12px;
    font-variant-numeric: tabular-nums; pointer-events: none; }
@media (max-width: 1179px) { .sl-counter { left: 56px; } }
@media (max-width: 767px)  { .sl-counter { display: none; } }
.sl-counter-cur { display: inline-block; height: 30px; overflow: hidden; font-size: 26px; line-height: 30px; font-weight: 900; color: #fff; }
.sl-counter-cur > span { display: inline-block; }
.sl-counter-sep { width: 36px; height: 2px; border-radius: 2px; background: linear-gradient(90deg, #22d3a5, rgba(255,255,255,.2)); }
.sl-counter-total { font-size: 13px; font-weight: 700; color: rgba(255,255,255,.4); }
.sl-roll-up   { animation: slRollUp .6s ${EASE} both; }
.sl-roll-down { animation: slRollDown .6s ${EASE} both; }
@keyframes slRollUp   { from { transform: translateY(100%); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes slRollDown { from { transform: translateY(-100%); opacity: 0; } to { transform: none; opacity: 1; } }

/* ── Chấm (điện thoại) ── */
.sl-dots { position: absolute; left: 50%; bottom: 0; z-index: 7; transform: translateX(-50%); display: flex; align-items: center; gap: 6px; padding-bottom: 20px; }
@media (min-width: 768px) { .sl-dots { display: none; } }
.sl-dot-btn { padding: 6px 2px; background: transparent; border: none; }
.sl-dot { position: relative; display: block; width: 8px; height: 8px; border-radius: 99px; overflow: hidden;
    background: rgba(255,255,255,.3); transition: width .45s ${EASE}, background .3s; }
.sl-dot.is-on { width: 30px; background: rgba(255,255,255,.2); }
.sl-dot-fill { position: absolute; inset: 0; background: #22d3a5; transform-origin: left; animation: sl-progress linear forwards; }

/* ── Dải thumbnail (máy tính) ── */
.sl-thumbs { position: absolute; right: 32px; bottom: 30px; z-index: 7; display: flex; align-items: flex-end; gap: 8px; perspective: 600px; }
@media (max-width: 767px) { .sl-thumbs { display: none; } }
.sl-thumb-btn {
    position: relative; padding: 0; border: none; cursor: pointer; border-radius: 8px; background: #111;
    box-shadow: 0 0 0 1.5px rgba(255,255,255,.12); opacity: .55; filter: grayscale(.4);
    transition: transform .4s cubic-bezier(.34,1.56,.64,1), opacity .3s, filter .3s, box-shadow .3s;
}
.sl-thumb-btn img { border-radius: 8px; }
.sl-thumb-btn:hover { opacity: 1; filter: none; transform: translateY(-6px) rotateX(10deg) scale(1.08); }
.sl-thumb-btn.is-on { opacity: 1; filter: none; transform: translateY(-4px) scale(1.14);
    box-shadow: 0 0 0 2px #22d3a5, 0 10px 26px rgba(34,211,165,.45); }
.sl-thumb-fill { position: absolute; left: 0; right: 0; bottom: 0; height: 3px; border-radius: 0 0 8px 8px;
    background: linear-gradient(90deg, #10b981, #5eead4); transform-origin: left; animation: sl-progress linear forwards; }
.sl-thumb-tip {
    position: absolute; bottom: calc(100% + 10px); left: 50%; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    padding: 5px 10px; border-radius: 8px; background: rgba(10,13,20,.94); border: 1px solid rgba(255,255,255,.1);
    color: #fff; font-size: 11px; font-weight: 600; pointer-events: none;
    opacity: 0; transform: translate(-50%, 6px) scale(.94); transition: opacity .2s, transform .25s ${EASE};
}
.sl-thumb-btn:hover .sl-thumb-tip { opacity: 1; transform: translate(-50%, 0) scale(1); }

/* ── Thanh tiến trình lớn ── */
.sl-progress { position: absolute; left: 0; right: 0; bottom: 0; height: 3px; z-index: 8; background: rgba(255,255,255,.07); overflow: hidden; }
.sl-progress-fill { height: 100%; width: 100%; transform: scaleX(0); transform-origin: left;
    background: linear-gradient(90deg, #10b981, #22d3a5, #38bdf8); box-shadow: 0 0 12px rgba(34,211,165,.6);
    animation-name: sl-progress; animation-timing-function: linear; animation-fill-mode: forwards; }

.sl-root { cursor: grab; }
.sl-root.sl-dragging { cursor: grabbing; }
.sl-root a, .sl-root button { cursor: pointer; }

@media (prefers-reduced-motion: reduce) {
    .sl-root *, .sl-root *::before, .sl-root *::after { animation-duration: 1ms !important; animation-delay: 0s !important; transition-duration: 1ms !important; }
    .sl-progress-fill, .sl-thumb-fill, .sl-dot-fill { animation-duration: ${INTERVAL}ms !important; }
    .sl-float, .sl-eyedot, .sl-cta-shine { animation: none !important; }
}
`;
