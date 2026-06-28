"use client";

import { useState } from "react";

interface VideoPlayerProps {
    src: string;
    showLogo?: boolean;
    logoSrc?: string;
}

export default function VideoPlayer({
    src,
    showLogo = true,
    logoSrc = "/logo_dahee.jpg",
}: VideoPlayerProps) {
    const [overlayHidden, setOverlayHidden] = useState(false);

    if (!src) return null;

    const handlePlayClick = () => {
        // Nếu cần mở link quảng cáo, bỏ comment dòng dưới:
        window.open("https://daheeshop.vercel.app/", "_blank", "noopener,noreferrer");

        setOverlayHidden(true);
    };

    return (
        <div className="relative w-full h-full z-50">
            {/* Video */}
            <iframe
                src={src}
                className="w-full h-full border-0"
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                referrerPolicy="no-referrer"
                loading="lazy"
            />

            {/* Overlay bắt buộc bấm nút play */}
            {!overlayHidden && (
                <div
                    className="
                        absolute inset-0 z-20
                        flex items-center justify-center
                    "
                >
                    <button
                        onClick={handlePlayClick}
                        className="
                                        w-14 h-14 sm:w-16 sm:h-16
                                        rounded-full
                                        bg-[#f6d46b]
                                        flex items-center justify-center
                                        shadow-[0_10px_30px_rgba(0,0,0,0.6)]
                                        hover:bg-[#ffce4a]
                                        transition
                                    "
                    >
                        <span className="text-black text-xl ml-0.5">▶</span>
                    </button>
                </div>
            )}

            {/* 2 nút Dahee bên phải như cũ */}
            {showLogo && (
                <div
                    className="
                        absolute bottom-16 right-3 z-30
                        hidden sm:flex lg:flex xl:flex flex-col items-stretch gap-2
                        max-w-[260px]
                    "
                >
                    {/* Fanpage */}
                    <a
                        href="https://www.facebook.com/tiemnhonhadahee"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="
                            dahee-chip dahee-chip-fb
                            flex w-full items-center gap-2
                        "
                    >
                        <div className="h-6 w-6 flex items-center justify-center rounded-full bg-[#1877f2]">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                className="h-3.5 w-3.5 text-white"
                            >
                                <path
                                    fill="currentColor"
                                    d="M13 21v-7h2.2a1 1 0 0 0 .98-.8l.5-3A1 1 0 0 0 15.7 9H13V7.2c0-.6.4-1 1-1h1.9a1 1 0 0 0 1-1V3.6A.6.6 0 0 0 16.3 3H14a4 4 0 0 0-4 4v2H8.6a1 1 0 0 0-1 .9L7.3 13a1 1 0 0 0 1 .9H10v7h3Z"
                                />
                            </svg>
                        </div>
                        <span className="text-[11px] font-semibold text-[#4b2e1c]">
                            Fanpage Tiệm Nhỏ Nhà Dahee
                        </span>
                    </a>

                    {/* Web shop */}
                    <a
                        href="https://daheeshop.vercel.app"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="
                            dahee-chip dahee-chip-shop
                            flex w-full items-center gap-2
                        "
                    >
                        <div
                            className="
                                h-6 w-6 overflow-hidden rounded-full
                                border border-[#f4d0aa]
                                bg-[#fef7ee]
                                shadow-sm
                            "
                        >
                            <img
                                src={logoSrc}
                                alt="Tiệm Nhỏ Nhà Dahee"
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <span className="text-[11px] font-semibold text-[#4b2e1c]">
                            Tiệm Nhỏ Nhà Dahee
                        </span>
                    </a>
                </div>
            )}
        </div>
    );
}   