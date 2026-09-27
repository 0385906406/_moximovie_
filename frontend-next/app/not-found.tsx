import Link from "next/link";

/*
 * Trang 404 kiểu rạp chiếu phim — "Suất chiếu không tồn tại".
 * Server component, toàn bộ hiệu ứng bằng CSS (không cần JS). Ô tìm phim là form GET thường.
 */

const theme = process.env.NEXT_PUBLIC_ASSET_THEME || "Default";

/* Bụi trong tia máy chiếu — cố định để server và client render giống nhau */
const DUST = Array.from({ length: 18 }, (_, i) => ({
    left: 40 + ((i * 29) % 20),
    top: 35 + ((i * 47) % 50),
    size: 1 + (i % 3),
    dur: 6 + (i % 5) * 1.6,
    delay: -((i * 1.1) % 7),
}));

export default function NotFound() {
    return (
        <>
            <title>404 – Suất chiếu không tồn tại | MoxiMovie</title>
            <meta name="robots" content="noindex" />

            <main className="nf-root">
                {/* Đèn sân khấu */}
                <div className="nf-spot nf-spot-l" aria-hidden />
                <div className="nf-spot nf-spot-r" aria-hidden />

                {/* Tia máy chiếu + bụi (nằm sau màn hình) */}
                <div className="nf-beam" aria-hidden>
                    {DUST.map((d, i) => (
                        <span key={i} style={{ left: `${d.left}%`, top: `${d.top}%`, width: d.size, height: d.size, animationDuration: `${d.dur}s`, animationDelay: `${d.delay}s` }} />
                    ))}
                </div>

                {/* Rèm */}
                <div className="nf-curtain nf-curtain-l" aria-hidden />
                <div className="nf-curtain nf-curtain-r" aria-hidden />
                <div className="nf-valance" aria-hidden />

                <div className="nf-stage">
                    {/* Logo */}
                    <Link href="/phimhay" className="nf-logo" aria-label="MoxiMovie">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`/${theme}/logo.png`} alt="MoxiMovie" />
                    </Link>

                    {/* ── Màn hình: đếm ngược mở đầu phim → 404 ── */}
                    <div className="nf-screen" aria-hidden>
                        <div className="nf-screen-inner">
                            {/* Đoạn đếm ngược (film leader) */}
                            <div className="nf-leader">
                                <div className="nf-leader-ring nf-leader-ring-1" />
                                <div className="nf-leader-ring nf-leader-ring-2" />
                                <div className="nf-leader-cross" />
                                <div className="nf-leader-hand" />
                                <span className="nf-num" style={{ animationDelay: "0s" }}>3</span>
                                <span className="nf-num" style={{ animationDelay: "-5s" }}>2</span>
                                <span className="nf-num" style={{ animationDelay: "-4s" }}>1</span>
                            </div>

                            {/* 404 nhiễu sóng */}
                            <div className="nf-404">
                                <span className="nf-404-text" data-text="404">404</span>
                                <span className="nf-404-sub">Không có tín hiệu</span>
                            </div>

                            <div className="nf-scratch" />
                            <div className="nf-noise" />
                            <div className="nf-vignette" />
                        </div>
                    </div>

                    {/* ── Vé bị xé ── */}
                    <section className="nf-ticket" aria-labelledby="nf-title">
                        <div className="nf-ticket-main">
                            <p className="nf-ticket-top">VÉ KHÔNG HỢP LỆ · LỖI 404</p>
                            <h1 id="nf-title" className="nf-title">
                                Suất chiếu này <span className="nf-grad">không tồn tại</span>
                            </h1>
                            <p className="nf-desc">
                                Có thể phim đã rời rạp, đường dẫn bị sai hoặc phòng chiếu đã đổi. Chọn suất khác nhé!
                            </p>

                            <form action="/tim-kiem" method="get" className="nf-search" role="search">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                                    <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" strokeLinecap="round" />
                                </svg>
                                <input name="keyword" type="search" placeholder="Tìm phim bạn muốn xem…" aria-label="Tìm phim" required />
                                <button type="submit">Tìm</button>
                            </form>

                            <div className="nf-actions">
                                <Link href="/phimhay" className="nf-btn nf-btn-main">
                                    <span className="nf-btn-shine" aria-hidden />
                                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5.14v14l11-7-11-7z" /></svg>
                                    Về rạp chính
                                </Link>
                                <Link href="/" className="nf-btn nf-btn-ghost">Trang chủ</Link>
                            </div>
                        </div>

                        <div className="nf-ticket-stub" aria-hidden>
                            <p>PHÒNG</p><b>404</b>
                            <p>GHẾ</p><b>—</b>
                            <div className="nf-barcode" />
                            <span className="nf-stamp">ĐÃ HUỶ</span>
                        </div>
                    </section>
                </div>

                {/* Hàng ghế */}
                <div className="nf-seats" aria-hidden>
                    {[12, 14].map((n, r) => (
                        <div key={r} className="nf-row" style={{ "--row": r } as React.CSSProperties}>
                            {Array.from({ length: n }).map((_, i) => <span key={i} />)}
                        </div>
                    ))}
                </div>

                <div className="nf-grain" aria-hidden />
            </main>

            <style>{CSS}</style>
        </>
    );
}

const EASE = "cubic-bezier(.16,1,.3,1)";
const CSS = `
.nf-root {
    position: relative; min-height: 100svh; overflow: hidden; color: #fff;
    display: flex; align-items: center; justify-content: center; padding: 88px 16px 150px;
    background: radial-gradient(ellipse 110% 75% at 50% 0%, #0f2029 0%, #0a0f18 55%, #05070b 100%);
    font-family: var(--font-be-vietnam-pro, system-ui), sans-serif;
}

/* ── Đèn sân khấu ── */
.nf-spot { position: absolute; top: -10%; width: 44vw; height: 120%; pointer-events: none; opacity: .5;
    background: linear-gradient(to bottom, rgba(94,234,212,.16), transparent 70%);
    clip-path: polygon(45% 0, 55% 0, 100% 100%, 0 100%); animation: nfSpot 7s ease-in-out infinite alternate; }
.nf-spot-l { left: -6%; transform-origin: top center; transform: rotate(-18deg); }
.nf-spot-r { right: -6%; transform-origin: top center; transform: rotate(18deg); animation-delay: -3.5s; }
@keyframes nfSpot { from { opacity: .3; } to { opacity: .6; } }

/* ── Tia máy chiếu ── */
.nf-beam { position: absolute; inset: 0; pointer-events: none;
    background: linear-gradient(to top, rgba(200,230,255,.12), rgba(200,230,255,.02) 65%, transparent);
    clip-path: polygon(47% 100%, 53% 100%, 82% 12%, 18% 12%); }
.nf-beam span { position: absolute; border-radius: 50%; background: rgba(255,255,255,.75); box-shadow: 0 0 4px #fff; animation: nfDust linear infinite; }
@keyframes nfDust { 0% { transform: translate(0,0); opacity: 0; } 20% { opacity: 1; } 100% { transform: translate(16px,-80px); opacity: 0; } }

/* ── Rèm ── */
.nf-curtain { position: absolute; top: 0; bottom: 0; width: 17vw; min-width: 70px; z-index: 3; pointer-events: none;
    background:
        linear-gradient(to bottom, rgba(0,0,0,.35), transparent 20%, transparent 75%, rgba(0,0,0,.6)),
        repeating-linear-gradient(90deg, #032b27 0px, #065a4d 20px, #0d8a74 30px, #065a4d 40px, #032b27 60px);
    box-shadow: inset 0 0 60px rgba(0,0,0,.6); animation: nfSway 8s ease-in-out infinite alternate; }
.nf-curtain-l { left: 0; transform-origin: top left; }
.nf-curtain-r { right: 0; transform-origin: top right; animation-delay: -4s; }
@keyframes nfSway { from { transform: skewX(0deg); } to { transform: skewX(1.2deg); } }
.nf-valance { position: absolute; left: 0; right: 0; top: 0; height: 56px; z-index: 4;
    background: radial-gradient(circle at 50% 0, transparent 24px, #04352f 25px) 0 16px / 52px 40px repeat-x, linear-gradient(to bottom, #06463d, #032b27);
    border-bottom: 3px solid #22d3a5; box-shadow: 0 6px 24px rgba(0,0,0,.6); }

/* ── Sân khấu ── */
.nf-stage { position: relative; z-index: 5; width: min(880px, 100%); display: flex; flex-direction: column; align-items: center; }
.nf-logo { margin-bottom: 18px; animation: nfFadeDown .8s ${EASE} both; }
.nf-logo img { height: 34px; filter: drop-shadow(0 0 18px rgba(34,211,165,.45)); transition: transform .3s ${EASE}; }
.nf-logo:hover img { transform: scale(1.06); }

/* ── Màn hình ── */
.nf-screen { width: min(760px, 100%); aspect-ratio: 2.1 / 1; perspective: 900px; animation: nfScreenIn 1.2s ${EASE} .1s both; }
@media (max-width: 640px) { .nf-screen { aspect-ratio: 16 / 10; } }
.nf-screen-inner {
    position: relative; width: 100%; height: 100%; overflow: hidden; border-radius: 8px;
    background: radial-gradient(ellipse at center, #d9e7e4 0%, #9fb7b2 55%, #5f7672 100%);
    box-shadow: 0 0 0 1px rgba(255,255,255,.1), 0 0 90px rgba(120,220,200,.22), 0 40px 100px rgba(0,0,0,.75);
    transform: rotateX(6deg); animation: nfFlicker 4s steps(1) infinite;
}
@keyframes nfScreenIn { from { opacity: 0; transform: translateY(24px) scale(.94); } }
@keyframes nfFlicker { 0%,100% { filter: brightness(1); } 31% { filter: brightness(1.08); } 32% { filter: brightness(.9); } 33% { filter: brightness(1.04); } 71% { filter: brightness(.95); } }

/* Film leader: hiện 0–3s mỗi chu kỳ 6s */
.nf-leader { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #1c2b29;
    animation: nfLeader 6s steps(1) infinite; }
@keyframes nfLeader { 0% { opacity: 1; } 50%, 100% { opacity: 0; } }
.nf-leader-ring { position: absolute; border-radius: 50%; border: 3px solid rgba(20,35,33,.75); }
.nf-leader-ring-1 { width: min(48%, 260px); aspect-ratio: 1; }
.nf-leader-ring-2 { width: min(40%, 216px); aspect-ratio: 1; border-width: 2px; }
.nf-leader-cross { position: absolute; inset: 0;
    background: linear-gradient(rgba(20,35,33,.6), rgba(20,35,33,.6)) center / 100% 2px no-repeat,
                linear-gradient(rgba(20,35,33,.6), rgba(20,35,33,.6)) center / 2px 100% no-repeat; }
.nf-leader-hand { position: absolute; width: min(48%, 260px); aspect-ratio: 1; border-radius: 50%;
    background: conic-gradient(rgba(20,35,33,.35) 0deg 90deg, transparent 90deg); animation: nfSweep 1s linear infinite; }
@keyframes nfSweep { to { transform: rotate(360deg); } }
.nf-num { position: absolute; font-size: clamp(64px, 14vw, 132px); font-weight: 900; line-height: 1; opacity: 0;
    font-family: Georgia, "Times New Roman", serif; animation: nfNum 6s steps(1) infinite; }
@keyframes nfNum { 0% { opacity: 1; } 16.66%, 100% { opacity: 0; } }

/* 404: hiện 3–6s mỗi chu kỳ */
.nf-404 { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: radial-gradient(ellipse at center, #0e1a1f, #05080c); animation: nf404Show 6s steps(1) infinite; }
@keyframes nf404Show { 0% { opacity: 0; } 50%, 100% { opacity: 1; } }
.nf-404-text { position: relative; font-size: clamp(80px, 18vw, 170px); font-weight: 900; line-height: 1; letter-spacing: -.04em;
    background: linear-gradient(135deg, #6ee7b7, #22d3a5 45%, #38bdf8); -webkit-background-clip: text; background-clip: text; color: transparent;
    filter: drop-shadow(0 0 30px rgba(34,211,165,.45)); animation: nfGlitch 2.2s steps(1) infinite; }
.nf-404-text::before, .nf-404-text::after { content: attr(data-text); position: absolute; inset: 0; background: inherit;
    -webkit-background-clip: text; background-clip: text; color: transparent; }
.nf-404-text::before { clip-path: inset(0 0 58% 0); transform: translateX(-4px); opacity: .8; animation: nfSlice 1.8s steps(1) infinite; }
.nf-404-text::after  { clip-path: inset(62% 0 0 0); transform: translateX(5px); opacity: .8; animation: nfSlice 1.4s steps(1) infinite reverse; }
@keyframes nfGlitch { 0%,100% { transform: none; } 12% { transform: translate(-3px, 1px) skewX(-6deg); } 14% { transform: none; } 56% { transform: translate(4px,-1px); } 58% { transform: none; } }
@keyframes nfSlice { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-8px); } 40% { transform: translateX(6px); } 60% { transform: translateX(-3px); } }
.nf-404-sub { margin-top: 6px; font-size: 11px; font-weight: 800; letter-spacing: .35em; text-transform: uppercase; color: rgba(94,234,212,.75); }

/* Vết xước, nhiễu, viền tối */
.nf-scratch { position: absolute; inset: 0; pointer-events: none; opacity: .5;
    background:
        linear-gradient(90deg, transparent 22%, rgba(0,0,0,.35) 22.15%, transparent 22.3%),
        linear-gradient(90deg, transparent 71%, rgba(255,255,255,.35) 71.1%, transparent 71.25%);
    animation: nfScratch .9s steps(3) infinite; }
@keyframes nfScratch { 0% { transform: translateX(0); } 33% { transform: translateX(-18px); } 66% { transform: translateX(26px); } 100% { transform: translateX(-6px); } }
.nf-noise { position: absolute; inset: -50%; pointer-events: none; opacity: .14;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    animation: nfNoise .5s steps(4) infinite; }
@keyframes nfNoise { 0% { transform: translate(0,0); } 25% { transform: translate(-5%,3%); } 50% { transform: translate(4%,-4%); } 75% { transform: translate(-3%,-2%); } 100% { transform: translate(2%,5%); } }
.nf-vignette { position: absolute; inset: 0; pointer-events: none; box-shadow: inset 0 0 120px rgba(0,0,0,.55); }

/* ── Vé ── */
.nf-ticket {
    position: relative; display: flex; width: min(700px, 100%); margin-top: -34px; border-radius: 20px; overflow: hidden;
    background: linear-gradient(135deg, rgba(18,28,38,.97), rgba(10,13,20,.97));
    border: 1px solid rgba(34,211,165,.25);
    box-shadow: 0 30px 80px rgba(0,0,0,.7), 0 0 60px rgba(34,211,165,.1);
    transform: rotate(-1.2deg); animation: nfTicketIn 1s ${EASE} .5s both;
    -webkit-mask: radial-gradient(circle 13px at 0 50%, transparent 98%, #000) left / 51% 100% no-repeat,
                  radial-gradient(circle 13px at 100% 50%, transparent 98%, #000) right / 51% 100% no-repeat;
            mask: radial-gradient(circle 13px at 0 50%, transparent 98%, #000) left / 51% 100% no-repeat,
                  radial-gradient(circle 13px at 100% 50%, transparent 98%, #000) right / 51% 100% no-repeat;
}
@keyframes nfTicketIn { from { opacity: 0; transform: translateY(40px) rotate(-6deg); } }
.nf-ticket-main { flex: 1; min-width: 0; padding: clamp(22px, 4vw, 32px); }
.nf-ticket-top { font-size: 10px; font-weight: 800; letter-spacing: .3em; color: #5eead4; }
.nf-title { margin-top: 8px; font-size: clamp(22px, 3.4vw, 34px); font-weight: 900; line-height: 1.15; }
.nf-grad { background: linear-gradient(90deg, #6ee7b7, #22d3a5 45%, #38bdf8); -webkit-background-clip: text; background-clip: text; color: transparent; white-space: nowrap; }
.nf-desc { margin-top: 8px; color: rgba(255,255,255,.58); font-size: 14px; line-height: 1.6; }

.nf-search { display: flex; align-items: center; gap: 8px; margin-top: 18px; padding: 5px 5px 5px 14px; border-radius: 14px;
    background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); transition: border-color .25s, box-shadow .25s; }
.nf-search:focus-within { border-color: rgba(34,211,165,.55); box-shadow: 0 0 0 3px rgba(34,211,165,.12); }
.nf-search svg { width: 16px; height: 16px; color: rgba(255,255,255,.4); flex-shrink: 0; }
.nf-search input { flex: 1; min-width: 0; background: transparent; border: none; outline: none; color: #fff; font-size: 14px; padding: 8px 0; }
.nf-search input::placeholder { color: rgba(255,255,255,.35); }
.nf-search button { padding: 9px 16px; border-radius: 10px; font-size: 13px; font-weight: 800; color: #041a11;
    background: linear-gradient(135deg, #6ee7b7, #22d3a5); transition: filter .2s, transform .15s; }
.nf-search button:hover { filter: brightness(1.08); }
.nf-search button:active { transform: scale(.96); }

.nf-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 16px; }
.nf-btn { position: relative; overflow: hidden; display: inline-flex; align-items: center; gap: 8px; padding: 12px 22px; border-radius: 12px;
    font-size: 13.5px; font-weight: 800; transition: transform .25s cubic-bezier(.34,1.56,.64,1), box-shadow .25s, background .25s, border-color .25s, color .25s; }
.nf-btn svg { width: 16px; height: 16px; }
.nf-btn-main { color: #041a11; background: linear-gradient(135deg, #6ee7b7, #22d3a5 50%, #10b981); box-shadow: 0 10px 32px rgba(34,211,165,.4); }
.nf-btn-main:hover { transform: translateY(-2px) scale(1.03); box-shadow: 0 14px 44px rgba(34,211,165,.55); }
.nf-btn-ghost { color: rgba(255,255,255,.8); border: 1px solid rgba(255,255,255,.18); background: rgba(255,255,255,.04); }
.nf-btn-ghost:hover { color: #5eead4; border-color: rgba(34,211,165,.5); background: rgba(34,211,165,.08); transform: translateY(-2px); }
.nf-btn-shine { position: absolute; inset: 0; background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,.5) 50%, transparent 65%);
    transform: translateX(-120%); animation: nfShine 3s ease-in-out 1.5s infinite; }
@keyframes nfShine { 0% { transform: translateX(-120%); } 45%, 100% { transform: translateX(120%); } }

.nf-ticket-stub { position: relative; width: 124px; flex-shrink: 0; padding: 24px 14px; text-align: center; border-left: 2px dashed rgba(34,211,165,.3);
    background: linear-gradient(180deg, rgba(34,211,165,.07), transparent); }
.nf-ticket-stub p { font-size: 9px; letter-spacing: .25em; color: rgba(255,255,255,.4); margin-top: 10px; }
.nf-ticket-stub b { display: block; font-size: 24px; font-weight: 900; color: #5eead4; }
.nf-barcode { height: 44px; margin-top: 16px; opacity: .55;
    background: repeating-linear-gradient(90deg, #5eead4 0 2px, transparent 2px 4px, #5eead4 4px 5px, transparent 5px 8px); }
.nf-stamp { position: absolute; left: 50%; top: 50%; padding: 4px 10px; border: 2px solid #f87171; border-radius: 6px;
    color: #f87171; font-size: 12px; font-weight: 900; letter-spacing: .15em; white-space: nowrap; opacity: 0;
    transform: translate(-50%, -50%) rotate(-18deg) scale(2); animation: nfStamp .5s cubic-bezier(.34,1.56,.64,1) 1.4s forwards; }
@keyframes nfStamp { to { opacity: .85; transform: translate(-50%, -50%) rotate(-18deg) scale(1); } }
@media (max-width: 560px) { .nf-ticket-stub { display: none; } .nf-ticket { -webkit-mask: none; mask: none; transform: none; } }

/* ── Ghế ── */
.nf-seats { position: absolute; left: 0; right: 0; bottom: -18px; z-index: 6; pointer-events: none; }
.nf-row { display: flex; justify-content: center; gap: 10px; transform: translateY(calc(var(--row) * 26px)) scale(calc(1 + var(--row) * .16)); }
.nf-row span { width: 56px; height: 48px; flex-shrink: 0; border-radius: 17px 17px 8px 8px;
    background: linear-gradient(to bottom, #1b2a3a, #0b111a 70%);
    box-shadow: inset 0 3px 0 rgba(94,234,212,.12), inset 0 -8px 12px rgba(0,0,0,.5), 0 -2px 10px rgba(0,0,0,.6); }
@media (max-width: 640px) { .nf-row { gap: 6px; } .nf-row span { width: 32px; height: 28px; border-radius: 10px 10px 5px 5px; } }

.nf-grain { position: absolute; inset: 0; z-index: 20; pointer-events: none; opacity: .05; mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }

@keyframes nfFadeDown { from { opacity: 0; transform: translateY(-12px); } }

@media (prefers-reduced-motion: reduce) {
    .nf-root *, .nf-root *::before, .nf-root *::after { animation: none !important; transition-duration: 1ms !important; }
    .nf-leader { opacity: 0; }
    .nf-404 { opacity: 1; }
    .nf-stamp { opacity: .85; transform: translate(-50%, -50%) rotate(-18deg); }
}
`;
