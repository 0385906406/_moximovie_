"use client";

import { useEffect, useRef, useState } from "react";

export default function ScrollToTopButton() {
    const [visible, setVisible]   = useState(false);
    const [show, setShow]         = useState(false);
    const [progress, setProgress] = useState(0);
    const hideTimeout = useRef<number | null>(null);

    useEffect(() => {
        const update = () => {
            const scrollY  = window.scrollY;
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            setProgress(maxScroll > 0 ? Math.min(scrollY / maxScroll, 1) : 0);

            if (scrollY > 200) {
                setShow(true);
                setTimeout(() => setVisible(true), 10);
            } else {
                setVisible(false);
                if (hideTimeout.current) clearTimeout(hideTimeout.current);
                hideTimeout.current = window.setTimeout(() => setShow(false), 350);
            }
        };

        window.addEventListener("scroll", update, { passive: true });
        update();
        return () => {
            window.removeEventListener("scroll", update);
            if (hideTimeout.current) clearTimeout(hideTimeout.current);
        };
    }, []);

    if (!show) return null;

    const SIZE   = 44;
    const STROKE = 2.8;
    const R      = (SIZE - STROKE) / 2;
    const CIRC   = 2 * Math.PI * R;
    const dash   = CIRC * progress;

    return (
        <>
            <style>{`
                .stt-btn {
                    position: fixed;
                    bottom: 24px;
                    right: 20px;
                    width: ${SIZE}px;
                    height: ${SIZE}px;
                    cursor: pointer;
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: opacity 0.32s cubic-bezier(.48,1.4,.48,1),
                                transform 0.32s cubic-bezier(.48,1.4,.48,1);
                }
                .stt-svg {
                    position: absolute;
                    inset: 0;
                    transform: rotate(-90deg);
                }
                .stt-track {
                    fill: none;
                    stroke: rgba(34,211,165,0.14);
                    stroke-width: ${STROKE};
                }
                .stt-fill {
                    fill: none;
                    stroke: #22d3a5;
                    stroke-width: ${STROKE};
                    stroke-linecap: round;
                    transition: stroke-dasharray 0.18s linear;
                    filter: drop-shadow(0 0 4px rgba(34,211,165,0.7));
                }
                .stt-inner {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: rgba(10,12,20,0.92);
                    border: 1px solid rgba(34,211,165,0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #22d3a5;
                    backdrop-filter: blur(8px);
                    transition: background 0.2s, border-color 0.2s, transform 0.2s;
                }
                .stt-btn:hover .stt-inner {
                    background: rgba(34,211,165,0.15);
                    border-color: rgba(34,211,165,0.5);
                    transform: scale(1.1);
                }
                .stt-btn:hover .stt-fill {
                    filter: drop-shadow(0 0 7px rgba(34,211,165,1));
                }
            `}</style>

            <div
                className="stt-btn"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                title="Lên đầu trang"
                style={{
                    opacity:   visible ? 1 : 0,
                    transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.8)",
                    pointerEvents: visible ? "auto" : "none",
                }}
            >
                {/* circular progress ring */}
                <svg className="stt-svg" width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
                    <circle className="stt-track" cx={SIZE / 2} cy={SIZE / 2} r={R} />
                    <circle
                        className="stt-fill"
                        cx={SIZE / 2}
                        cy={SIZE / 2}
                        r={R}
                        strokeDasharray={`${dash} ${CIRC}`}
                    />
                </svg>

                {/* arrow icon */}
                <div className="stt-inner">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 19V5M5 12l7-7 7 7" />
                    </svg>
                </div>
            </div>
        </>
    );
}
