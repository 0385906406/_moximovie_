"use client";

/*
 * Rèm sân khấu phủ lên trình phát.
 *  - "closed":  rèm khép, đèn rọi lướt qua, nút phát ở giữa.
 *  - "opening": rèm kéo sang 2 bên (gom nếp + lượn nhẹ), diềm kéo lên, luồng sáng bừng ra từ khe giữa.
 * Khi mở xong, HlsPlayerWithFilter gỡ component này đi.
 */

export type CurtainState = "closed" | "opening";

export const CURTAIN_OPEN_MS = 1700;

interface Props {
    state: CurtainState;
    title?: string;
    subtitle?: string;
    loading: boolean;
    onPlay: () => void;
}

export default function PlayerCurtain({ state, title, subtitle, loading, onPlay }: Props) {
    const opening = state === "opening";
    return (
        <div className={`pcu-root absolute inset-0 z-[35] ${opening ? "pcu-opening" : ""}`} aria-hidden={opening}>
            {/* Luồng sáng từ khe giữa khi rèm bắt đầu mở */}
            <div className="pcu-burst" aria-hidden />

            <div className="pcu-panel pcu-left" aria-hidden><span className="pcu-edge" /></div>
            <div className="pcu-panel pcu-right" aria-hidden><span className="pcu-edge" /></div>
            <div className="pcu-valance" aria-hidden />

            {/* Đèn rọi lướt trên rèm lúc chờ */}
            <div className="pcu-spot" aria-hidden />

            {/* Nút phát + tên phim */}
            <div className="pcu-center">
                <button type="button" onClick={onPlay} className="pcu-play group" aria-label={loading ? "Đang tải" : "Mở màn và xem phim"} disabled={opening}>
                    <span className="pcu-ring pcu-ring-1" />
                    <span className="pcu-ring pcu-ring-2" />
                    <span className="pcu-btn">
                        {loading ? (
                            <svg className="w-7 h-7 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                                <path d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor" />
                            </svg>
                        ) : (
                            <svg className="w-7 h-7 sm:w-8 sm:h-8 translate-x-[2px]" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v14l11-7-11-7z" /></svg>
                        )}
                    </span>
                </button>
                <span className="pcu-hint">{loading ? "Đang chuẩn bị suất chiếu…" : "Nhấn để mở màn"}</span>
            </div>

            {title && (
                <div className="pcu-title">
                    {subtitle && <span className="pcu-badge">{subtitle}</span>}
                    <p dangerouslySetInnerHTML={{ __html: title }} />
                </div>
            )}

            <style>{CSS}</style>
        </div>
    );
}

const OPEN = `${CURTAIN_OPEN_MS}ms`;
const EASE = "cubic-bezier(.7,0,.25,1)";
const CSS = `
.pcu-root { overflow: hidden; background: #05070b; }
.pcu-opening { background: transparent; pointer-events: none; transition: background .4s ease; }

/* ── Cánh rèm ── */
.pcu-panel {
    position: absolute; top: 0; bottom: 0; width: 50.5%; z-index: 2;
    background:
        linear-gradient(to bottom, rgba(0,0,0,.35), transparent 22%, transparent 72%, rgba(0,0,0,.6)),
        repeating-linear-gradient(90deg, #032b27 0px, #065a4d 18px, #0d8a74 28px, #065a4d 38px, #032b27 56px);
    box-shadow: inset 0 0 60px rgba(0,0,0,.55);
    will-change: transform;
}
.pcu-left  { left: 0;  transform-origin: left center;  animation: pcuSwayL 6s ease-in-out infinite alternate; }
.pcu-right { right: 0; transform-origin: right center; animation: pcuSwayR 6s ease-in-out infinite alternate; }
/* Bóng tối ở mép khe giữa */
.pcu-edge { position: absolute; top: 0; bottom: 0; width: 28px; }
.pcu-left .pcu-edge  { right: 0; background: linear-gradient(90deg, transparent, rgba(0,0,0,.55)); }
.pcu-right .pcu-edge { left: 0;  background: linear-gradient(-90deg, transparent, rgba(0,0,0,.55)); }
@keyframes pcuSwayL { from { transform: skewY(0deg); } to { transform: skewY(.5deg); } }
@keyframes pcuSwayR { from { transform: skewY(0deg); } to { transform: skewY(-.5deg); } }

/* Mở: kéo sang 2 bên, gom nếp (scaleX), lượn nhẹ giữa chừng */
.pcu-opening .pcu-left  { animation: pcuOpenL ${OPEN} ${EASE} forwards; }
.pcu-opening .pcu-right { animation: pcuOpenR ${OPEN} ${EASE} forwards; }
@keyframes pcuOpenL {
    0%   { transform: translateX(0) scaleX(1) skewY(0); }
    45%  { transform: translateX(-38%) scaleX(.82) skewY(1.4deg); }
    100% { transform: translateX(-100%) scaleX(.45) skewY(0); }
}
@keyframes pcuOpenR {
    0%   { transform: translateX(0) scaleX(1) skewY(0); }
    45%  { transform: translateX(38%) scaleX(.82) skewY(-1.4deg); }
    100% { transform: translateX(100%) scaleX(.45) skewY(0); }
}

/* ── Diềm rèm ── */
.pcu-valance {
    position: absolute; left: 0; right: 0; top: 0; height: 13%; min-height: 34px; z-index: 3;
    background:
        radial-gradient(circle at 50% 0, transparent 18px, #04352f 19px) 0 100% / 40px 26px repeat-x,
        linear-gradient(to bottom, #06463d, #032b27);
    border-bottom: 2px solid #22d3a5;
    box-shadow: 0 6px 18px rgba(0,0,0,.55);
}
.pcu-opening .pcu-valance { animation: pcuValance ${OPEN} ${EASE} forwards; }
@keyframes pcuValance { 0%, 35% { transform: translateY(0); } 100% { transform: translateY(-130%); } }

/* ── Luồng sáng ── */
.pcu-burst {
    position: absolute; inset: 0; z-index: 1; opacity: 0; pointer-events: none;
    background: radial-gradient(ellipse 35% 80% at 50% 50%, rgba(180,255,235,.55), rgba(34,211,165,.18) 45%, transparent 75%);
}
.pcu-opening .pcu-burst { animation: pcuBurst ${OPEN} ease-out forwards; }
@keyframes pcuBurst { 0% { opacity: 0; transform: scaleX(.2); } 25% { opacity: 1; } 100% { opacity: 0; transform: scaleX(1.6); } }

/* ── Đèn rọi lướt ── */
.pcu-spot {
    position: absolute; top: -20%; bottom: -20%; width: 45%; z-index: 4; pointer-events: none;
    background: radial-gradient(ellipse at center, rgba(120,255,225,.14), transparent 65%);
    animation: pcuSpot 7s ease-in-out infinite alternate;
}
@keyframes pcuSpot { from { left: -10%; } to { left: 65%; } }
.pcu-opening .pcu-spot { opacity: 0; transition: opacity .4s ease; }

/* ── Nút phát ── */
.pcu-center { position: absolute; inset: 0; z-index: 5; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; }
.pcu-opening .pcu-center { animation: pcuCenterOut .45s ease forwards; }
@keyframes pcuCenterOut { to { opacity: 0; transform: scale(.7); } }
.pcu-play { position: relative; display: flex; align-items: center; justify-content: center; border: none; background: none; cursor: pointer; }
.pcu-btn {
    position: relative; width: 70px; height: 70px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
    color: #041a11; background: linear-gradient(135deg, #6ee7b7, #22d3a5 55%, #10b981);
    box-shadow: 0 0 44px rgba(34,211,165,.55), 0 10px 30px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.5);
    transition: transform .35s cubic-bezier(.34,1.56,.64,1), box-shadow .3s ease;
}
@media (min-width: 640px) { .pcu-btn { width: 84px; height: 84px; } }
.pcu-play:hover .pcu-btn { transform: scale(1.1); box-shadow: 0 0 64px rgba(34,211,165,.75), 0 10px 30px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.5); }
.pcu-play:active .pcu-btn { transform: scale(.95); }
.pcu-ring { position: absolute; border-radius: 50%; border: 2px solid rgba(94,234,212,.5); pointer-events: none; }
.pcu-ring-1 { inset: -10px; animation: pcuRing 2.2s ease-out infinite; }
.pcu-ring-2 { inset: -10px; animation: pcuRing 2.2s ease-out 1.1s infinite; }
@keyframes pcuRing { 0% { transform: scale(1); opacity: .9; } 100% { transform: scale(1.7); opacity: 0; } }
.pcu-hint { font-size: 12px; font-weight: 700; letter-spacing: .28em; text-transform: uppercase; color: rgba(255,255,255,.75);
    text-shadow: 0 2px 10px rgba(0,0,0,.6); }

/* ── Tên phim ── */
.pcu-title { position: absolute; left: 16px; right: 16px; bottom: 14px; z-index: 5; pointer-events: none; text-align: left;
    animation: pcuTitleIn .7s cubic-bezier(.16,1,.3,1) .15s both; }
@media (min-width: 640px) { .pcu-title { left: 24px; bottom: 22px; } }
.pcu-title p { color: #fff; font-weight: 800; font-size: clamp(14px, 2vw, 20px); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    text-shadow: 0 2px 14px rgba(0,0,0,.7); }
.pcu-badge { display: inline-block; margin-bottom: 6px; padding: 2px 8px; border-radius: 6px; font-size: 10.5px; font-weight: 800; letter-spacing: .04em;
    color: #5eead4; background: rgba(4,26,17,.6); border: 1px solid rgba(34,211,165,.4); }
.pcu-opening .pcu-title { animation: pcuCenterOut .4s ease forwards; }
@keyframes pcuTitleIn { from { opacity: 0; transform: translateY(10px); } }

@media (prefers-reduced-motion: reduce) {
    .pcu-root *, .pcu-root *::before, .pcu-root *::after { animation-duration: 1ms !important; animation-iteration-count: 1 !important; }
    .pcu-opening .pcu-left, .pcu-opening .pcu-right, .pcu-opening .pcu-valance { animation-duration: 300ms !important; }
    .pcu-spot, .pcu-ring { display: none; }
}
`;
