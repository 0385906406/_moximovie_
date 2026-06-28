"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface TickerMovie {
    country: string;
    name: string;
    slug: string;
}

const FALLBACK: TickerMovie[] = [
    { country: "Hàn Quốc", name: "Đang tải phim mới...", slug: "" },
];

export default function AnnouncementBar() {
    const [movies, setMovies] = useState<TickerMovie[]>(FALLBACK);

    useEffect(() => {
        const load = async () => {
            try {
                const [r1, r2] = await Promise.all([
                    fetch("https://phimapi.com/v1/api/danh-sach/phim-bo?sort_field=modified&sort_type=desc&limit=15"),
                    fetch("https://phimapi.com/v1/api/danh-sach/phim-le?sort_field=modified&sort_type=desc&limit=15"),
                ]);
                const [d1, d2] = await Promise.all([r1.json(), r2.json()]);
                const items: TickerMovie[] = [
                    ...(d1?.data?.items ?? []),
                    ...(d2?.data?.items ?? []),
                ]
                    .filter((m) => m.country?.[0]?.name && m.name && m.slug)
                    .map((m) => ({
                        country: m.country[0].name as string,
                        name: m.name as string,
                        slug: m.slug as string,
                    }));
                if (items.length) setMovies(items);
            } catch {
                /* keep fallback */
            }
        };
        load();
    }, []);

    const track = [...movies, ...movies];

    return (
        <>
            <style>{`
                .ann-bar {
                    position: fixed;
                    top: 0; left: 0; right: 0;
                    height: 32px;
                    z-index: 60;
                    background: #05070d;
                    border-bottom: 1px solid rgba(34,211,165,0.14);
                    display: flex;
                    align-items: center;
                    overflow: hidden;
                }

                .ann-live {
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    height: 100%;
                    padding: 0 14px;
                    background: linear-gradient(90deg, rgba(34,211,165,0.18), rgba(34,211,165,0.08));
                    border-right: 1px solid rgba(34,211,165,0.18);
                    font-size: 9.5px;
                    font-weight: 800;
                    letter-spacing: 0.2em;
                    text-transform: uppercase;
                    color: #22d3a5;
                    white-space: nowrap;
                }
                .ann-live-dot {
                    width: 5px; height: 5px;
                    border-radius: 50%;
                    background: #22d3a5;
                    box-shadow: 0 0 6px rgba(34,211,165,0.9);
                    animation: annDotBlink 1.4s ease-in-out infinite;
                    flex-shrink: 0;
                }
                @keyframes annDotBlink {
                    0%,100% { opacity: 1; transform: scale(1); }
                    50%     { opacity: 0.2; transform: scale(0.8); }
                }

                .ann-scroll-area {
                    flex: 1;
                    overflow: hidden;
                    position: relative;
                    height: 100%;
                    display: flex;
                    align-items: center;
                }
                .ann-scroll-area::before,
                .ann-scroll-area::after {
                    content: '';
                    position: absolute;
                    top: 0; bottom: 0;
                    width: 48px;
                    z-index: 2;
                    pointer-events: none;
                }
                .ann-scroll-area::before {
                    left: 0;
                    background: linear-gradient(90deg, #05070d, transparent);
                }
                .ann-scroll-area::after {
                    right: 0;
                    background: linear-gradient(270deg, #05070d, transparent);
                }

                .ann-track {
                    display: flex;
                    align-items: center;
                    white-space: nowrap;
                    animation: annScroll 70s linear infinite;
                    will-change: transform;
                }
                .ann-track:hover { animation-play-state: paused; }

                .ann-item {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    padding: 0 24px;
                    font-size: 12px;
                    flex-shrink: 0;
                    line-height: 1;
                    text-decoration: none;
                    cursor: pointer;
                }
                .ann-item:hover .ann-name {
                    color: #fff;
                    text-decoration: underline;
                    text-underline-offset: 2px;
                }
                .ann-country {
                    color: #22d3a5;
                    font-weight: 700;
                    font-size: 11px;
                    white-space: nowrap;
                }
                .ann-colon {
                    color: rgba(34,211,165,0.4);
                    font-weight: 600;
                }
                .ann-name {
                    color: rgba(255,255,255,0.55);
                    white-space: nowrap;
                    transition: color 0.15s;
                    max-width: 220px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .ann-sep {
                    color: rgba(34,211,165,0.22);
                    font-size: 10px;
                    padding: 0 4px;
                    flex-shrink: 0;
                }

                @keyframes annScroll {
                    from { transform: translateX(0); }
                    to   { transform: translateX(-50%); }
                }

                @media (max-width: 480px) {
                    .ann-live span:last-child { display: none; }
                    .ann-live { padding: 0 10px; }
                    .ann-item { font-size: 11px; padding: 0 16px; }
                    .ann-name { max-width: 140px; }
                }
            `}</style>

            <div className="ann-bar" role="marquee" aria-live="off">
                <div className="ann-live">
                    <span className="ann-live-dot" />
                    <span>Phim mới</span>
                </div>

                <div className="ann-scroll-area">
                    <div className="ann-track">
                        {track.map((m, i) =>
                            m.slug ? (
                                <Link key={i} href={`/phim/${m.slug}`} className="ann-item">
                                    <span className="ann-country">{m.country}</span>
                                    <span className="ann-colon">:</span>
                                    <span className="ann-name">{m.name}</span>
                                    <span className="ann-sep">✦</span>
                                </Link>
                            ) : (
                                <span key={i} className="ann-item">
                                    <span className="ann-country">{m.country}</span>
                                    <span className="ann-colon">:</span>
                                    <span className="ann-name">{m.name}</span>
                                    <span className="ann-sep">✦</span>
                                </span>
                            )
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
