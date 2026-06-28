"use client";

import React from "react";
import { motion } from "framer-motion";

type ChristmasInlineBannerProps = {
    title?: string;
    subtitle?: string;
    message?: string;
};

const theme = process.env.NEXT_PUBLIC_ASSET_THEME || "Default";

const ChristmasInlineBanner: React.FC<ChristmasInlineBannerProps> = ({
    title = "Merry Christmas 2025",
    subtitle = "Giáng Sinh An Lành – Yêu Thương Đong Đầy",
    message = "Kính chúc bạn và gia đình một mùa Giáng Sinh ấm áp, an vui và tràn ngập hạnh phúc.",
}) => {
    return (
        <section className="relative w-full px-4 py-10 sm:px-6 lg:px-8 z-30">
            {/* === SANTA / LINH VẬT NOEL === */}
            <motion.img
                src={`${theme}/Image-Mini/christmas-santa-team.png`}
                alt="Santa Claus"
                className="
                    absolute -top-10 sm:-top-24 lg:-top-20
                    left-1/2 w-36 sm:w-48
                    -translate-x-1/2 z-30
                    drop-shadow-[0_10px_25px_rgba(255,255,255,0.4)]
                "
                animate={{ y: [0, -8, 0], rotate: [0, 2, -2, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            />

            {/* === CARD CHÍNH === */}
            <div
                className="
                    relative mx-auto max-w-6xl
                    rounded-xl
                    mt-10 sm:-mt-6 lg:-mt-14 xl:-mt-16
                    border border-white/20
                    bg-[linear-gradient(180deg,#0f2a44,#123a5c,#1f6f8b)]
                    shadow-[0_25px_60px_rgba(0,40,80,0.6)]
                "
            >
                {/* ánh sáng lạnh Noel */}
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(200,230,255,0.35),_transparent_60%)]" />

                <div className="relative flex flex-col gap-6 p-5 sm:flex-row sm:p-8">
                    {/* === TEXT TRÁI === */}
                    <div className="flex-1 space-y-3 text-white">
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-[11px] font-semibold uppercase tracking-widest text-white">
                            🎄 Christmas 2025
                        </span>

                        <motion.h3
                            className="text-xl sm:text-2xl font-extrabold tracking-wide text-white"
                            animate={{
                                textShadow: [
                                    "0 0 6px rgba(180,220,255,0.6)",
                                    "0 0 14px rgba(120,200,255,0.9)",
                                    "0 0 6px rgba(180,220,255,0.6)",
                                ],
                            }}
                            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                        >
                            {title}
                        </motion.h3>

                        <p className="text-sm sm:text-base font-semibold text-emerald-200">
                            {subtitle}
                        </p>

                        <p className="text-xs sm:text-sm leading-relaxed text-white/90">
                            {message}
                        </p>
                    </div>

                    {/* === ẢNH PHẢI === */}
                    <div className="relative flex flex-1 items-center justify-center">
                        <motion.div
                            className="relative w-40 max-w-xs"
                            animate={{ y: [0, -4, 0] }}
                            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                        >
                            <img
                                src={`${theme}/Image-Mini/christmas-family.png`}
                                alt="Gia đình sum vầy Giáng Sinh"
                                className="h-full w-full object-cover drop-shadow-lg"
                            />
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ChristmasInlineBanner;