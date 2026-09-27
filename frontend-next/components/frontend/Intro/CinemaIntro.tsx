"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import MovieImage from "@/components/frontend/MovieImage";

export interface IntroMovie {
    name: string;
    slug: string;
    poster_url?: string;
    thumb_url?: string;
    year?: number;
}

const theme = process.env.NEXT_PUBLIC_ASSET_THEME || "Default";

/* Mốc cuộn (0 → 1 trên toàn bộ chiều dài trang) cho từng cảnh */
const STAGES = {
    curtain: [0.02, 0.22],   // rèm mở
    screen:  [0.14, 0.40],   // màn hình tiến lại gần, máy chiếu bật
    ring:    [0.42, 0.66],   // vòng poster hiện ra
    spin:    [0.42, 0.82],   // vòng poster xoay theo cuộn
    cta:     [0.76, 0.90],   // vé + nút Xem ngay
} as const;

const CAPTIONS = ["Mở màn", "Máy chiếu bật", "Tuyển tập phim", "Vào rạp"];

const SPIN_DEG = 260;          // cuộn hết cảnh vòng poster → xoay 260°
const DEG_PER_PX = 0.28;       // kéo 100px → xoay 28°
const AUTO_ADVANCE_MS = 3200;  // để yên bao lâu thì tự chuyển sang poster kế
const SCREEN_CYCLE_MS = 6000;  // màn hình chiếu tự đổi phim

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
const stage = (p: number, [a, b]: readonly [number, number]) => clamp01((p - a) / (b - a));

/* ── Ghế rạp ở tiền cảnh ── */
function Seats() {
    const rows = [13, 15, 17];
    return (
        <div className="ci-seats absolute inset-x-0 bottom-0 pointer-events-none" aria-hidden>
            {rows.map((n, r) => (
                <div key={r} className="ci-row flex justify-center" style={{ "--row": r } as React.CSSProperties}>
                    {Array.from({ length: n }).map((_, i) => (
                        <span key={i} className="ci-seat" />
                    ))}
                </div>
            ))}
        </div>
    );
}

/* ── Hạt bụi bay trong tia máy chiếu ── */
const DUST = Array.from({ length: 22 }, (_, i) => ({
    left: 38 + ((i * 37) % 24),
    top: 30 + ((i * 53) % 55),
    size: 1 + (i % 3),
    dur: 6 + (i % 5) * 1.7,
    delay: -((i * 1.3) % 8),
}));

export default function CinemaIntro({ movies }: { movies: IntroMovie[] }) {
    const rootRef = useRef<HTMLDivElement>(null);
    const ringWrapRef = useRef<HTMLDivElement>(null);
    const ringElRef = useRef<HTMLDivElement>(null);
    const spinRef = useRef(0);   // tiến độ xoay theo cuộn (0..1), cập nhật trong vòng cuộn
    const [caption, setCaption] = useState(0);
    const [ringOn, setRingOn] = useState(false);
    const [ctaOn, setCtaOn] = useState(false);
    const [front, setFront] = useState(0);

    const ring = movies.slice(0, 14);
    const n = Math.max(ring.length, 1);
    const step = 360 / n;
    /* Bán kính vòng để poster vừa khít nhau: (rộng/2) / tan(π/n), nới thêm 12% cho có khe */
    const radiusFactor = (1 / (2 * Math.tan(Math.PI / Math.max(n, 3)))) * 1.12;

    /* ── Vòng poster tương tác: góc người dùng xoay cộng thêm vào góc xoay theo cuộn ── */
    const phys = useRef({ user: 0, vel: 0, target: null as number | null, dragging: false, lastX: 0, lastT: 0, moved: 0, lastInteract: 0 });
    const totalAngle = (user: number) => spinRef.current * -SPIN_DEG + user;
    /* Góc user để poster gần nhất (lệch thêm offset poster) đứng chính giữa */
    const snapUser = (offset = 0) => {
        const u = phys.current.user;
        const t = totalAngle(u);
        return u + (Math.round(t / step) + offset) * step - t;
    };
    /* Poster i đứng giữa khi tổng góc ≡ -i·step */
    const frontOf = (user: number) => ((Math.round(-totalAngle(user) / step) % n) + n) % n;
    const rotateTo = (i: number) => {
        const ph = phys.current;
        const t = totalAngle(ph.user);
        const k = Math.round((t + i * step) / 360);
        ph.vel = 0;
        ph.target = ph.user + (-i * step + 360 * k - t);
        ph.lastInteract = performance.now();
    };
    const nudge = (dir: 1 | -1) => {
        const ph = phys.current;
        ph.vel = 0;
        ph.target = snapUser(-dir);   /* poster bên phải (index +1) nằm ở góc +step → giảm tổng góc */
        ph.lastInteract = performance.now();
    };

    /* ── Cuộn → biến CSS (không setState mỗi frame → không render lại React) ── */
    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const fine = window.matchMedia("(pointer: fine)").matches;

        let raf = 0;
        let mx = 0, my = 0, tx = 0, ty = 0;
        let lastCaption = -1, lastRing = false, lastCta = false;

        const update = () => {
            raf = 0;
            const rect = root.getBoundingClientRect();
            const total = rect.height - window.innerHeight;
            const p = total > 0 ? clamp01(-rect.top / total) : 0;

            const c = stage(p, STAGES.curtain);
            const s = stage(p, STAGES.screen);
            const r = stage(p, STAGES.ring);
            const sp = stage(p, STAGES.spin);
            const k = stage(p, STAGES.cta);

            const st = root.style;
            st.setProperty("--p", p.toFixed(4));
            st.setProperty("--c", c.toFixed(4));
            st.setProperty("--s", s.toFixed(4));
            st.setProperty("--r", r.toFixed(4));
            st.setProperty("--spin", sp.toFixed(4));
            spinRef.current = sp;
            st.setProperty("--k", k.toFixed(4));

            /* Chuột: nghiêng cảnh nhẹ, nội suy cho mượt */
            mx += (tx - mx) * 0.08;
            my += (ty - my) * 0.08;
            st.setProperty("--mx", mx.toFixed(4));
            st.setProperty("--my", my.toFixed(4));

            const cap = k > 0.2 ? 3 : r > 0.2 ? 2 : c > 0.6 ? 1 : 0;
            if (cap !== lastCaption) { lastCaption = cap; setCaption(cap); }
            const rOn = r > 0.5 && k < 0.6;
            if (rOn !== lastRing) { lastRing = rOn; setRingOn(rOn); }
            const kOn = k > 0.55;
            if (kOn !== lastCta) { lastCta = kOn; setCtaOn(kOn); }

            /* Chuột chưa tới đích thì chạy tiếp frame sau */
            if (Math.abs(tx - mx) > 0.001 || Math.abs(ty - my) > 0.001) raf = requestAnimationFrame(update);
        };
        const request = () => { if (!raf) raf = requestAnimationFrame(update); };

        const onMove = (e: PointerEvent) => {
            if (reduce || !fine) return;
            tx = (e.clientX / window.innerWidth) * 2 - 1;
            ty = (e.clientY / window.innerHeight) * 2 - 1;
            request();
        };

        update();
        window.addEventListener("scroll", request, { passive: true });
        window.addEventListener("resize", request);
        window.addEventListener("pointermove", onMove, { passive: true });
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("scroll", request);
            window.removeEventListener("resize", request);
            window.removeEventListener("pointermove", onMove);
        };
    }, []);

    /* ── Vật lý vòng poster: quán tính → dừng khớp poster → để yên thì tự chuyển poster ── */
    useEffect(() => {
        const el = ringElRef.current;
        if (!ringOn || !el) return;
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const ph = phys.current;
        ph.lastInteract = performance.now();
        let raf = 0, lastFront = -1;
        const tick = (now: number) => {
            raf = requestAnimationFrame(tick);
            if (!ph.dragging) {
                if (ph.target !== null) {
                    const d = ph.target - ph.user;
                    ph.user += reduce ? d : d * 0.14;
                    if (Math.abs(d) < 0.05) { ph.user = ph.target; ph.target = null; }
                } else if (Math.abs(ph.vel) > 0.05) {
                    ph.user += ph.vel;
                    ph.vel *= 0.93;
                    if (Math.abs(ph.vel) <= 0.05) { ph.vel = 0; ph.target = snapUser(); }
                } else if (!reduce && now - ph.lastInteract > AUTO_ADVANCE_MS) {
                    ph.target = snapUser(-1);
                    ph.lastInteract = now;
                }
            }
            el.style.setProperty("--user", `${ph.user.toFixed(3)}deg`);
            const f = frontOf(ph.user);
            if (f !== lastFront) { lastFront = f; setFront(f); }
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ringOn, n]);

    /* ── Kéo chuột / vuốt ngang để xoay (vuốt dọc vẫn cuộn trang nhờ touch-action: pan-y) ── */
    useEffect(() => {
        const wrap = ringWrapRef.current;
        if (!ringOn || !wrap) return;
        const ph = phys.current;
        const onMove = (e: PointerEvent) => {
            if (!ph.dragging) return;
            const now = performance.now();
            const dx = e.clientX - ph.lastX;
            ph.lastX = e.clientX;
            ph.moved += Math.abs(dx);
            ph.user += dx * DEG_PER_PX;
            const dt = Math.max(now - ph.lastT, 1);
            ph.vel = ph.vel * 0.5 + dx * DEG_PER_PX * (16 / dt) * 0.5;
            ph.lastT = now;
            ph.lastInteract = now;
        };
        const onUp = () => {
            if (!ph.dragging) return;
            ph.dragging = false;
            wrap.classList.remove("ci-grabbing");
            ph.lastInteract = performance.now();
            if (performance.now() - ph.lastT > 80 || Math.abs(ph.vel) < 0.3) { ph.vel = 0; ph.target = snapUser(); }
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
            window.removeEventListener("pointercancel", onUp);
        };
        const onDown = (e: PointerEvent) => {
            if (e.pointerType === "mouse" && e.button !== 0) return;
            if ((e.target as HTMLElement).closest(".ci-front")) return;   /* nút trong khung thông tin */
            ph.dragging = true;
            ph.lastX = e.clientX;
            ph.lastT = performance.now();
            ph.moved = 0;
            ph.vel = 0;
            ph.target = null;
            wrap.classList.add("ci-grabbing");
            window.addEventListener("pointermove", onMove);
            window.addEventListener("pointerup", onUp);
            window.addEventListener("pointercancel", onUp);
        };
        wrap.addEventListener("pointerdown", onDown);
        return () => {
            wrap.removeEventListener("pointerdown", onDown);
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
            window.removeEventListener("pointercancel", onUp);
            ph.dragging = false;
            wrap.classList.remove("ci-grabbing");
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ringOn, n]);

    const frontMovie = ring[front];

    /* ── Màn hình chiếu tự đổi phim: tự chuyển mỗi SCREEN_CYCLE_MS, tới vòng poster thì theo poster ở giữa ── */
    const [screen, setScreen] = useState({ cur: 0, prev: -1, n: 0 });
    const showScreen = (i: number) => setScreen(s => (s.cur === i ? s : { cur: i, prev: s.cur, n: s.n + 1 }));
    const screenMovie = ring[screen.cur];

    useEffect(() => {
        if (ringOn || ctaOn || ring.length < 2) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const t = window.setInterval(() => setScreen(s => ({ cur: (s.cur + 1) % ring.length, prev: s.cur, n: s.n + 1 })), SCREEN_CYCLE_MS);
        return () => clearInterval(t);
    }, [ringOn, ctaOn, ring.length]);

    useEffect(() => {
        if (ringOn) showScreen(front);
    }, [ringOn, front]);

    return (
        <div
            ref={rootRef}
            className="ci-root relative bg-[#05070b] text-white"
            style={{ "--c": 0, "--s": 0, "--r": 0, "--spin": 0, "--k": 0, "--p": 0, "--mx": 0, "--my": 0 } as React.CSSProperties}
        >
            <div className="ci-stage sticky top-0 h-[100svh] w-full overflow-hidden select-none">

                {/* ── Tường rạp + đèn tường ── */}
                <div className="ci-hall absolute inset-0" aria-hidden />
                <div className="ci-sconce ci-sconce-l" aria-hidden />
                <div className="ci-sconce ci-sconce-r" aria-hidden />

                {/* ── Màn hình 3D ── */}
                {/* ── Đèn rạp tắt dần + tia máy chiếu: nằm SAU màn hình để không phủ lên hình phim ── */}
                <div className="ci-dim absolute inset-0 pointer-events-none" aria-hidden />
                <div className="ci-beam absolute inset-0 pointer-events-none" aria-hidden>
                    <div className="ci-beam-cone" />
                    {DUST.map((d, i) => (
                        <span
                            key={i}
                            className="ci-dust"
                            style={{ left: `${d.left}%`, top: `${d.top}%`, width: d.size, height: d.size, animationDuration: `${d.dur}s`, animationDelay: `${d.delay}s` }}
                        />
                    ))}
                </div>

                <div className="ci-scene absolute inset-0" aria-hidden={ctaOn}>
                    <div className="ci-screen">
                        <div className="ci-screen-inner">
                            {/* Ảnh cũ nằm dưới, ảnh mới hiện dần đè lên khi đã tải xong → chuyển cảnh không bị chớp đen */}
                            {[screen.prev, screen.cur].map((idx, layer) => {
                                const m = ring[idx];
                                if (!m) return null;
                                return (
                                    <div key={`${idx}-${layer === 1 ? screen.n : "p"}`} className={`ci-shot ${layer === 0 ? "ci-shot-ready ci-shot-prev" : screen.n === 0 ? "ci-shot-ready" : ""}`}>
                                        <MovieImage
                                            movie={m} prefer="thumb"
                                            alt={layer === 1 ? m.name : ""}
                                            fill
                                            sizes="(max-width: 768px) 92vw, 72vw"
                                            quality={75}
                                            priority={idx === 0}
                                            className="object-cover"
                                            onLoad={e => (e.currentTarget as HTMLElement).closest(".ci-shot")?.classList.add("ci-shot-ready")}
                                        />
                                    </div>
                                );
                            })}
                            <div className="ci-screen-shade" />
                            <div className="ci-screen-scan" />
                            {screenMovie && (
                                <div className="ci-now absolute left-[5%] bottom-[9%] right-[5%]">
                                    <span className="ci-now-tag">● Đang chiếu</span>
                                    <div key={screen.cur} className="ci-now-text">
                                        <p className="ci-now-title" dangerouslySetInnerHTML={{ __html: screenMovie.name }} />
                                        {screenMovie.year && <p className="ci-now-year">{screenMovie.year}</p>}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Vòng poster 3D ── */}
                <div
                    ref={ringWrapRef}
                    className={`ci-ring-wrap absolute inset-0 ${ringOn ? "ci-on" : ""}`}
                    /* Vừa kéo xong thì không tính là bấm vào poster */
                    onClickCapture={e => { if (phys.current.moved > 6) { e.preventDefault(); e.stopPropagation(); } }}
                    onDragStart={e => e.preventDefault()}
                >
                    <div className="ci-ring-title">
                        <p className="ci-eyebrow">Tuyển tập hôm nay · <span className="ci-drag-hint">Kéo để xoay</span></p>
                        <h2>Hàng ngàn bộ phim <span className="ci-grad">đang chờ bạn</span></h2>
                    </div>
                    <div className="ci-ring-anchor">
                        <div ref={ringElRef} className="ci-ring" style={{ "--rad": `calc(var(--pw) * ${radiusFactor.toFixed(3)})` } as React.CSSProperties}>
                            <div className="ci-ring-spin">
                                {ring.map((m, i) => (
                                    <Link
                                        key={m.slug}
                                        href={`/phim/${m.slug}`}
                                        tabIndex={ringOn ? 0 : -1}
                                        draggable={false}
                                        className={`ci-card ${i === front ? "is-front" : ""}`}
                                        style={{ "--a": `${step * i}deg` } as React.CSSProperties}
                                        aria-label={i === front ? `Xem phim ${m.name}` : `Xoay tới ${m.name}`}
                                        /* Poster bên cạnh: xoay nó ra giữa; poster giữa: mở trang phim */
                                        onClick={e => { if (i !== front) { e.preventDefault(); rotateTo(i); } }}
                                    >
                                        <MovieImage
                                            movie={m} prefer="poster"
                                            alt={m.name}
                                            fill
                                            sizes="200px"
                                            quality={70}
                                            className="object-cover"
                                        />
                                        <span className="ci-card-shine" />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Phim đang ở giữa vòng ── */}
                    {frontMovie && (
                        <div className="ci-front">
                            <button type="button" onClick={() => nudge(-1)} className="ci-front-nav" tabIndex={ringOn ? 0 : -1} aria-label="Phim trước">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </button>
                            <div key={front} className="ci-front-info">
                                <p className="ci-front-name" dangerouslySetInnerHTML={{ __html: frontMovie.name }} />
                                <p className="ci-front-meta">
                                    {frontMovie.year && <span>{frontMovie.year}</span>}
                                    <span>{front + 1} / {n}</span>
                                </p>
                            </div>
                            <Link href={`/phim/${frontMovie.slug}`} tabIndex={ringOn ? 0 : -1} className="ci-front-go">Chi tiết</Link>
                            <button type="button" onClick={() => nudge(1)} className="ci-front-nav" tabIndex={ringOn ? 0 : -1} aria-label="Phim tiếp">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Rèm nhung ── */}
                <div className="ci-curtain ci-curtain-l" aria-hidden />
                <div className="ci-curtain ci-curtain-r" aria-hidden />
                <div className="ci-valance" aria-hidden />

                {/* ── Tên web (trước khi mở màn) ── */}
                <div className="ci-title absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none">
                    <p className="ci-eyebrow">MoxiMovie Cinema · Suất chiếu miễn phí</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/${theme}/logo.png`} alt="MoxiMovie" className="ci-logo" />
                    <h1 className="ci-h1">
                        Rạp phim <span className="ci-grad">của riêng bạn</span>
                    </h1>
                    <p className="ci-sub">Phim chiếu rạp, phim bộ, anime — Vietsub HD đến 4K, không cần đăng ký.</p>
                </div>

                {/* ── Ghế rạp ── */}
                <Seats />

                {/* ── Vé + nút Xem ngay (chỉ hiện ở cảnh cuối) ── */}
                <div className={`ci-cta absolute inset-0 flex items-center justify-center px-4 ${ctaOn ? "ci-on" : ""}`}>
                    <div className="ci-ticket">
                        <div className="ci-ticket-main">
                            <p className="ci-ticket-top">VÉ XEM PHIM · ADMIT ONE</p>
                            <h2 className="ci-ticket-h">Ghế của bạn <span className="ci-grad whitespace-nowrap">đã sẵn sàng</span></h2>
                            <p className="ci-ticket-sub">Hơn 10.000 bộ phim Vietsub &amp; Thuyết minh, cập nhật mỗi ngày.</p>
                            <div className="ci-stats">
                                <div><b>10K+</b><span>Bộ phim</span></div>
                                <div><b>4K</b><span>Chất lượng</span></div>
                                <div><b>0đ</b><span>Chi phí</span></div>
                            </div>
                            <Link href="/phimhay" prefetch tabIndex={ctaOn ? 0 : -1} aria-hidden={!ctaOn} className="ci-btn">
                                <span className="ci-btn-shine" />
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 relative"><path d="M8 5.14v14l11-7-11-7z" /></svg>
                                <span className="relative">Xem ngay</span>
                            </Link>
                        </div>
                        <div className="ci-ticket-stub" aria-hidden>
                            <p>PHÒNG</p><b>01</b>
                            <p>GHẾ</p><b>VIP</b>
                            <div className="ci-barcode" />
                        </div>
                    </div>
                </div>

                {/* ── Gợi ý cuộn ── */}
                <div className="ci-hint absolute left-1/2 bottom-8 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none" aria-hidden>
                    <span className="ci-mouse"><span /></span>
                    <span className="ci-hint-text text-[11px] tracking-[0.25em] uppercase text-white/60"><span className="ci-hint-mouse">Lăn chuột</span><span className="ci-hint-touch">Vuốt lên</span> để mở màn</span>
                </div>

                {/* ── Tiến trình kiểu cuộn phim + tên cảnh ── */}
                <div className="ci-progress absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden>
                    <div className="ci-progress-fill" />
                </div>
                {/* Tên cảnh: góc trên trái dưới diềm rèm (góc dưới bị hàng ghế che); ẩn trên điện thoại vì chồng lên tiêu đề */}
                <div className="hidden sm:block absolute left-8 top-[92px] z-[26] pointer-events-none" aria-hidden>
                    <p key={caption} className="ci-caption">
                        <span>0{caption + 1}</span> — {CAPTIONS[caption]}
                    </p>
                </div>

                <div className="ci-grain absolute inset-0 pointer-events-none" aria-hidden />
            </div>

            <style>{CSS}</style>
        </div>
    );
}

/* ══════════════════════════════════════════════
   CSS — mọi chuyển động theo cuộn đều tính từ biến --c --s --r --spin --k
══════════════════════════════════════════════ */
const CSS = `
.ci-root { height: 560vh; --pw: 200px; }
@media (max-width: 767px) { .ci-root { height: 480vh; --pw: 112px; } }

.ci-stage { perspective: 1100px; background: radial-gradient(ellipse 120% 80% at 50% 0%, #0f2029 0%, #0a0f18 55%, #05070b 100%); }
.ci-hall {
    background:
        repeating-linear-gradient(90deg, rgba(255,255,255,0.018) 0 2px, transparent 2px 120px),
        linear-gradient(to bottom, transparent 55%, rgba(0,0,0,0.6));
}
.ci-sconce { position: absolute; top: 34%; width: 220px; height: 320px; border-radius: 50%;
    background: radial-gradient(ellipse at center, rgba(34,211,165,0.16), transparent 65%);
    opacity: calc(1 - var(--s) * 0.85); }
.ci-sconce-l { left: -60px; } .ci-sconce-r { right: -60px; }

/* ── Màn hình ── */
.ci-scene { transform-style: preserve-3d; }
.ci-screen {
    position: absolute; left: 50%; top: 44%;
    width: min(76vw, 1180px); aspect-ratio: 2.1 / 1;
    transform:
        translate(-50%, -50%)
        translateZ(calc(-900px + var(--s) * 900px - var(--r) * 260px))
        rotateX(calc((1 - var(--s)) * 26deg + var(--my) * -2deg))
        rotateY(calc(var(--mx) * 4deg));
    opacity: clamp(0, calc(min(var(--s) * 1.8, 1) - var(--r) * 0.52 - var(--k) * 0.2), 1); /* sau vòng poster vẫn ~45% để thấy ảnh đổi */
    will-change: transform, opacity;
}
@media (max-width: 767px) { .ci-screen { width: 92vw; aspect-ratio: 16 / 9; top: 40%; } }
.ci-screen-inner {
    position: absolute; inset: 0; overflow: hidden; border-radius: 6px;
    box-shadow:
        0 0 0 1px rgba(255,255,255,0.08),
        0 0 80px rgba(120,180,255,0.18),
        0 0 220px rgba(34,211,165,0.12),
        0 40px 120px rgba(0,0,0,0.8);
    animation: ciFlicker 5s steps(1) infinite;
}
.ci-shot { position: absolute; inset: 0; opacity: 0; transition: opacity 1.2s ease; }
.ci-shot-ready { opacity: 1; }
.ci-shot:not(.ci-shot-prev) img { animation: ciKen 7s cubic-bezier(.2,.6,.3,1) forwards; }
.ci-now-text { animation: ciNowIn .7s cubic-bezier(.16,1,.3,1) .25s both; }
@keyframes ciKen   { from { transform: scale(1.1); } to { transform: scale(1.01); } }
@keyframes ciNowIn { from { opacity: 0; transform: translateY(10px); } }
.ci-screen-shade { position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.25) 100%),
                radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%); }
.ci-screen-scan { position: absolute; inset: 0; opacity: 0.25;
    background: repeating-linear-gradient(to bottom, rgba(255,255,255,0.05) 0 1px, transparent 1px 3px); }
.ci-now { opacity: clamp(0, calc(var(--s) * 3 - 2), 1); transform: translateY(calc((1 - var(--s)) * 20px)); }
.ci-now-tag { display: inline-block; font-size: 10px; font-weight: 800; letter-spacing: .2em; text-transform: uppercase;
    color: #ff4d5e; background: rgba(255,77,94,0.12); border: 1px solid rgba(255,77,94,0.35); padding: 3px 8px; border-radius: 6px; }
.ci-now-title { margin-top: 8px; font-size: clamp(18px, 3vw, 40px); font-weight: 900; line-height: 1.1; text-shadow: 0 4px 24px rgba(0,0,0,0.8); }
.ci-now-year { margin-top: 4px; color: rgba(255,255,255,0.55); font-size: 13px; font-weight: 600; }

/* ── Tia máy chiếu ── */
.ci-beam { opacity: clamp(0, calc(var(--s) * 1.3 - var(--r) * 0.8), 0.9); }
.ci-beam-cone { position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(200,225,255,0.22), rgba(200,225,255,0.04) 70%, transparent);
    clip-path: polygon(47% 100%, 53% 100%, 88% 18%, 12% 18%);
    animation: ciBeam 4s ease-in-out infinite; }
.ci-dust { position: absolute; border-radius: 50%; background: rgba(255,255,255,0.7); box-shadow: 0 0 4px rgba(255,255,255,0.8);
    animation: ciDust linear infinite; }

.ci-dim { background: rgba(0,0,0,1); opacity: calc(var(--s) * 0.55); }

/* ── Vòng poster ── */
.ci-ring-wrap { opacity: clamp(0, calc(var(--r) * 1.6 - var(--k) * 1.5), 1); pointer-events: none; perspective: 1100px; } /* opacity làm phẳng 3D của cha → cần perspective riêng */
.ci-ring-wrap.ci-on { pointer-events: auto; cursor: grab; touch-action: pan-y; }
.ci-ring-wrap.ci-grabbing { cursor: grabbing; }
.ci-ring-wrap.ci-grabbing .ci-card { transition: none; }
.ci-card img { -webkit-user-drag: none; user-select: none; }
.ci-card.is-front {
    transform: rotateY(var(--a)) translateZ(calc(var(--rad) + 40px));
    box-shadow: 0 0 0 2px #22d3a5, 0 0 50px rgba(34,211,165,0.5), 0 24px 60px rgba(0,0,0,0.7);
}
.ci-drag-hint { color: rgba(255,255,255,0.55); }
.ci-front {
    position: absolute; left: 50%; bottom: 15%; transform: translateX(-50%);
    display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 18px;
    width: min(460px, calc(100% - 32px));
    background: rgba(10,15,24,0.82); border: 1px solid rgba(34,211,165,0.22);
    box-shadow: 0 16px 48px rgba(0,0,0,0.55); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
    cursor: default;
}
@media (max-width: 767px) { .ci-front { bottom: 11%; } }
.ci-front-nav { width: 36px; height: 36px; flex-shrink: 0; border-radius: 12px; display: flex; align-items: center; justify-content: center;
    color: rgba(255,255,255,0.75); background: rgba(255,255,255,0.06); transition: background .2s, color .2s, transform .15s; }
.ci-front-nav:hover { background: rgba(34,211,165,0.18); color: #fff; }
.ci-front-nav:active { transform: scale(0.9); }
.ci-front-info { flex: 1; min-width: 0; animation: ciFrontIn .45s cubic-bezier(.16,1,.3,1); }
.ci-front-name { font-weight: 800; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ci-front-meta { display: flex; gap: 10px; margin-top: 2px; font-size: 11px; color: rgba(255,255,255,0.45); font-variant-numeric: tabular-nums; }
.ci-front-go { flex-shrink: 0; padding: 9px 14px; border-radius: 12px; font-size: 12px; font-weight: 800; color: #041a11;
    background: linear-gradient(135deg, #6ee7b7, #22d3a5); box-shadow: 0 6px 20px rgba(34,211,165,0.35); transition: transform .2s, filter .2s; }
.ci-front-go:hover { transform: translateY(-1px); filter: brightness(1.08); }
@keyframes ciFrontIn { from { opacity: 0; transform: translateY(6px); } }
.ci-ring-title { position: absolute; left: 0; right: 0; top: 9%; text-align: center; padding: 0 16px;
    transform: translateY(calc((1 - var(--r)) * 30px)); }
.ci-ring-title h2 { font-size: clamp(22px, 3.6vw, 44px); font-weight: 900; line-height: 1.15; margin-top: 6px; }
.ci-ring-anchor { position: absolute; left: 50%; top: 56%; width: 0; height: 0; transform-style: preserve-3d; }
.ci-ring {
    position: absolute; transform-style: preserve-3d;
    transform:
        translateZ(calc(var(--rad) * -1 - 120px + var(--r) * 120px))
        rotateX(calc(-7deg + var(--my) * 5deg))
        rotateY(calc(var(--spin) * -260deg + var(--user, 0deg) + var(--mx) * 6deg));
}
.ci-ring-spin { position: absolute; transform-style: preserve-3d; } /* tự xoay do JS lo (dừng khớp từng poster) */
.ci-card {
    position: absolute; display: block; overflow: hidden; border-radius: 12px;
    width: var(--pw); height: calc(var(--pw) * 1.5);
    left: calc(var(--pw) / -2); top: calc(var(--pw) * -0.75);
    transform: rotateY(var(--a)) translateZ(var(--rad));
    backface-visibility: hidden;
    background: #141722;
    box-shadow: 0 0 0 1px rgba(255,255,255,0.1), 0 20px 50px rgba(0,0,0,0.6);
    -webkit-box-reflect: below 10px linear-gradient(transparent 62%, rgba(0,0,0,0.28));
    transition: box-shadow .3s ease, filter .3s ease, transform .5s cubic-bezier(.16,1,.3,1);
}
.ci-card:hover { box-shadow: 0 0 0 2px #22d3a5, 0 0 40px rgba(34,211,165,0.55); filter: brightness(1.12); }
.ci-card-shine { position: absolute; inset: 0; background: linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.18) 50%, transparent 65%);
    transform: translateX(-100%); transition: transform .7s ease; }
.ci-card:hover .ci-card-shine { transform: translateX(100%); }

/* ── Rèm ── */
.ci-curtain {
    position: absolute; top: 0; bottom: 0; width: 51%; z-index: 20;
    background:
        linear-gradient(to bottom, rgba(0,0,0,0.35), transparent 18%, transparent 75%, rgba(0,0,0,0.55)),
        repeating-linear-gradient(90deg, #16060b 0px, #330d17 22px, #52172a 34px, #330d17 46px, #16060b 68px);
    box-shadow: inset 0 0 80px rgba(0,0,0,0.6);
    will-change: transform;
}
.ci-curtain-l { left: 0;  transform-origin: left center;
    transform: translateX(calc(var(--c) * -88%)) scaleX(calc(1 - var(--c) * 0.25)) skewY(calc(var(--c) * 1.5deg)); }
.ci-curtain-r { right: 0; transform-origin: right center;
    transform: translateX(calc(var(--c) * 88%)) scaleX(calc(1 - var(--c) * 0.25)) skewY(calc(var(--c) * -1.5deg)); }
.ci-curtain-l::after, .ci-curtain-r::after { content: ""; position: absolute; top: 0; bottom: 0; width: 40px;
    background: linear-gradient(90deg, rgba(0,0,0,0.5), transparent); }
.ci-curtain-l::after { right: 0; transform: scaleX(-1); } .ci-curtain-r::after { left: 0; }
.ci-valance { position: absolute; left: 0; right: 0; top: 0; height: 64px; z-index: 21;
    background:
        radial-gradient(circle at 50% 0, transparent 26px, #2a0a12 27px) 0 18px / 56px 46px repeat-x,
        linear-gradient(to bottom, #3a0f1a, #1c070c);
    border-bottom: 3px solid #a8845a;
    box-shadow: 0 6px 24px rgba(0,0,0,0.6);
    transform: translateY(calc(var(--c) * -40px)); }

/* ── Tiêu đề mở đầu ── */
.ci-title { z-index: 22; opacity: clamp(0, calc(1 - var(--c) * 1.8), 1);
    transform: scale(calc(1 + var(--c) * 0.25)) translateY(calc(var(--c) * -30px)); }
.ci-eyebrow { font-size: 11px; font-weight: 800; letter-spacing: .28em; text-transform: uppercase; color: #5eead4; }
.ci-logo { height: clamp(34px, 5vw, 52px); margin: 18px auto 14px; filter: drop-shadow(0 0 22px rgba(34,211,165,0.45)); animation: ciFloat 5s ease-in-out infinite; }
.ci-h1 { font-size: clamp(34px, 6.4vw, 84px); font-weight: 900; line-height: 1.02; letter-spacing: -0.02em; text-shadow: 0 8px 40px rgba(0,0,0,0.7); }
.ci-sub { margin-top: 16px; max-width: 560px; color: rgba(255,255,255,0.65); font-size: clamp(13px, 1.4vw, 17px); line-height: 1.6; }
.ci-grad { background: linear-gradient(90deg, #6ee7b7, #22d3a5 45%, #38bdf8); -webkit-background-clip: text; background-clip: text; color: transparent;
    background-size: 200% 100%; animation: ciGrad 6s ease-in-out infinite alternate; }

/* ── Ghế ── */
.ci-seats { z-index: 25; transform: translateY(calc(40px - var(--p) * 30px)); }
.ci-row { gap: 10px; margin-top: calc(var(--row) * -6px);
    transform: translateY(calc(var(--row) * 28px)) scale(calc(1 + var(--row) * 0.18)); }
.ci-seat { width: 58px; height: 50px; flex-shrink: 0; border-radius: 18px 18px 8px 8px;
    background: linear-gradient(to bottom, #1b2a3a, #0b111a 70%);
    box-shadow: inset 0 3px 0 rgba(94,234,212,0.12), inset 0 -8px 12px rgba(0,0,0,0.5), 0 -2px 10px rgba(0,0,0,0.6); }
@media (max-width: 767px) { .ci-row { gap: 6px; } .ci-seat { width: 34px; height: 30px; border-radius: 11px 11px 5px 5px; } }

/* ── Vé + nút ── */
.ci-cta { z-index: 30; opacity: var(--k); pointer-events: none;
    transform: translateY(calc((1 - var(--k)) * 50px)) scale(calc(0.9 + var(--k) * 0.1)); }
.ci-cta.ci-on { pointer-events: auto; }
.ci-ticket {
    display: flex; width: min(640px, 100%); border-radius: 22px; overflow: hidden;
    background: linear-gradient(135deg, rgba(18,28,38,0.96), rgba(10,13,20,0.96));
    border: 1px solid rgba(34,211,165,0.25);
    box-shadow: 0 40px 100px rgba(0,0,0,0.75), 0 0 80px rgba(34,211,165,0.12);
    transform: perspective(900px) rotateX(calc(var(--my) * -6deg)) rotateY(calc(var(--mx) * 8deg));
    /* lỗ bấm vé ở 2 cạnh */
    -webkit-mask: radial-gradient(circle 14px at 0 50%, transparent 98%, #000) left / 51% 100% no-repeat,
                  radial-gradient(circle 14px at 100% 50%, transparent 98%, #000) right / 51% 100% no-repeat;
            mask: radial-gradient(circle 14px at 0 50%, transparent 98%, #000) left / 51% 100% no-repeat,
                  radial-gradient(circle 14px at 100% 50%, transparent 98%, #000) right / 51% 100% no-repeat;
}
.ci-ticket-main { flex: 1; padding: clamp(22px, 4vw, 36px); text-align: left; }
.ci-ticket-top { font-size: 10px; font-weight: 800; letter-spacing: .3em; color: #5eead4; }
.ci-ticket-h { margin-top: 10px; font-size: clamp(24px, 3.4vw, 38px); font-weight: 900; line-height: 1.1; }
.ci-ticket-sub { margin-top: 10px; color: rgba(255,255,255,0.6); font-size: 14px; line-height: 1.55; }
.ci-stats { display: flex; gap: clamp(16px, 3vw, 30px); margin: 20px 0 24px; }
.ci-stats b { display: block; font-size: 20px; font-weight: 900; }
.ci-stats span { font-size: 10px; letter-spacing: .15em; text-transform: uppercase; color: rgba(255,255,255,0.45); }
.ci-btn { position: relative; overflow: hidden; display: inline-flex; align-items: center; gap: 10px;
    padding: 15px 34px; border-radius: 14px; font-weight: 900; font-size: 15px; letter-spacing: .04em; color: #041a11;
    background: linear-gradient(135deg, #6ee7b7, #22d3a5 50%, #10b981);
    box-shadow: 0 10px 40px rgba(34,211,165,0.45), inset 0 1px 0 rgba(255,255,255,0.5);
    transition: transform .25s cubic-bezier(.34,1.56,.64,1), box-shadow .25s ease; }
.ci-btn:hover { transform: translateY(-2px) scale(1.04); box-shadow: 0 16px 60px rgba(34,211,165,0.65), inset 0 1px 0 rgba(255,255,255,0.5); }
.ci-btn:active { transform: scale(0.97); }
.ci-btn-shine { position: absolute; inset: 0; background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.55) 50%, transparent 65%);
    animation: ciShine 2.8s ease-in-out infinite; }
.ci-ticket-stub { width: 128px; flex-shrink: 0; padding: 26px 16px; text-align: center; border-left: 2px dashed rgba(34,211,165,0.3);
    background: linear-gradient(180deg, rgba(34,211,165,0.08), transparent); }
.ci-ticket-stub p { font-size: 9px; letter-spacing: .25em; color: rgba(255,255,255,0.4); margin-top: 10px; }
.ci-ticket-stub b { display: block; font-size: 26px; font-weight: 900; color: #5eead4; }
.ci-barcode { height: 46px; margin-top: 18px; opacity: 0.6;
    background: repeating-linear-gradient(90deg, #5eead4 0 2px, transparent 2px 4px, #5eead4 4px 5px, transparent 5px 8px); }
@media (max-width: 560px) { .ci-ticket-stub { display: none; } .ci-ticket { -webkit-mask: none; mask: none; } }

/* ── Gợi ý cuộn, tiến trình, chú thích ── */
.ci-hint { z-index: 26; opacity: clamp(0, calc(1 - var(--p) * 10), 1); }
.ci-hint-touch { display: none; }
@media (hover: none) { .ci-hint-touch { display: inline; } .ci-hint-mouse { display: none; } }
.ci-mouse { width: 24px; height: 38px; border-radius: 14px; border: 2px solid rgba(255,255,255,0.55); display: flex; justify-content: center; padding-top: 7px; }
.ci-mouse span { width: 3px; height: 8px; border-radius: 3px; background: #5eead4; animation: ciWheel 1.6s ease-in-out infinite; }
.ci-progress { z-index: 26; width: 3px; height: 34vh; border-radius: 3px; background: rgba(255,255,255,0.1); overflow: hidden; }
.ci-progress-fill { width: 100%; height: 100%; transform-origin: top; transform: scaleY(var(--p));
    background: linear-gradient(to bottom, #22d3a5, #38bdf8); box-shadow: 0 0 12px rgba(34,211,165,0.6); }
.ci-caption { z-index: 26; font-size: 11px; font-weight: 700; letter-spacing: .22em; text-transform: uppercase; color: rgba(255,255,255,0.55); animation: ciCap .5s cubic-bezier(.16,1,.3,1); }
.ci-caption span { color: #5eead4; }
.ci-grain { z-index: 40; opacity: 0.05; mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }

@keyframes ciFlicker { 0%, 100% { filter: brightness(1); } 47% { filter: brightness(1.06); } 48% { filter: brightness(0.94); } 49% { filter: brightness(1.03); } }
@keyframes ciBeam  { 0%, 100% { opacity: 0.85; } 50% { opacity: 1; } }
@keyframes ciDust  { 0% { transform: translate(0, 0); opacity: 0; } 20% { opacity: 1; } 100% { transform: translate(18px, -90px); opacity: 0; } }
@keyframes ciFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
@keyframes ciGrad  { to { background-position: 100% 0; } }
@keyframes ciShine { 0% { transform: translateX(-120%); } 55%, 100% { transform: translateX(120%); } }
@keyframes ciWheel { 0% { transform: translateY(0); opacity: 1; } 70% { transform: translateY(12px); opacity: 0; } 100% { opacity: 0; } }
@keyframes ciCap   { from { opacity: 0; transform: translateY(8px); } }

@media (prefers-reduced-motion: reduce) {
    .ci-root *, .ci-root *::before, .ci-root *::after { animation: none !important; }
}
`;
