import React, { useState } from "react";
import { motion } from "framer-motion";
import {
    increaseAffiliateCount,
} from "@/helpers/affiliateHelper";

const api =
    import.meta.env.MODE === "development"
        ? "http://localhost:2004/api"
        : "https://moximovie-production.up.railway.app/api";

type Tet2026InlineBannerProps = {
    title?: string;
    subtitle?: string;
    message?: string;
};
const theme = import.meta.env.VITE_APP_ASSET_THEME || "Default";

const Tet2026InlineBanner: React.FC<Tet2026InlineBannerProps> = ({
    title = "Chúc Mừng Năm Mới 2026",
    subtitle = "Xuân Giáp Thìn – Phúc Lộc Vẹn Toàn",
    message = "Kính chúc bạn và gia đình một năm mới an khang, thịnh vượng, vạn sự như ý.",

}) => {
    const [isLimitReached, setIsLimitReached] = useState(false);
    const content = (
        <section className="relative w-full px-4 py-10 sm:px-6 lg:px-8 z-30">
            {/* === LINH VẬT / MÚA LÂN TRÊN NÓC === */}
            <motion.img
                src={`${theme}/Image-Mini/tet-unicorn.png`} // đổi thành ảnh lân/rồng của bạn
                alt="Múa lân Tết"
                className="
                    absolute -top-10 sm:-top-30 lg:-top-18 left-1/2 w-36 sm:w-48
                    -translate-x-1/2 z-30
                    drop-shadow-xl
                "
                animate={{
                    y: [0, -8, 0],
                    rotate: [0, 2, -2, 0],
                }}
                transition={{
                    repeat: Infinity,
                    duration: 3,
                    ease: "easeInOut",
                }}
            />

            {/* === CARD CHÍNH === */}
            <div
                className="
                    relative mx-auto max-w-6xl
                    rounded-[10px]
                    mt-8 sm:-mt-6 lg:-mt-14 xl:-mt-16
                    border border-yellow-300/60
                    bg-[linear-gradient(180deg,#8b0000,#b11212,#f7c873)]
                    shadow-[0_25px_60px_rgba(120,0,0,0.45)]
                "
            >
                {/* ánh sáng nền */}
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_55%)]" />

                <div className="relative flex flex-col gap-6 p-5 sm:flex-row sm:p-8">
                    {/* === TEXT TRÁI === */}
                    <div className="flex-1 space-y-3 text-white">
                        <span className="inline-flex items-center gap-2 rounded-full bg-black/30 px-4 py-1 text-[11px] font-semibold uppercase tracking-widest">
                            🧧 Tết 2026
                        </span>

                        <motion.h3
                            className="text-xl sm:text-2xl font-extrabold tracking-wide"
                            animate={{
                                textShadow: [
                                    "0 0 6px rgba(255,255,255,0.6)",
                                    "0 0 14px rgba(255,215,0,0.9)",
                                    "0 0 6px rgba(255,255,255,0.6)",
                                ],
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: 3,
                                ease: "easeInOut",
                            }}
                        >
                            {title}
                        </motion.h3>

                        <p className="text-sm sm:text-base font-semibold text-yellow-200">
                            {subtitle}
                        </p>

                        <p className="text-xs sm:text-sm leading-relaxed text-white/90">
                            {message}
                        </p>
                    </div>

                    {/* === HÌNH TRANG TRÍ PHẢI === */}
                    <div className="relative flex flex-1 items-center justify-center">
                        <motion.div
                            className="
                                relative w-40 max-w-xs
                            "
                            animate={{
                                y: [0, -4, 0],
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: 4,
                                ease: "easeInOut",
                            }}
                        >
                            <img
                                src={`${theme}/Image-Mini/family.png`} // ảnh gia đình / chúc tết
                                alt="Gia đình sum vầy ngày Tết"
                                className="h-full w-full object-cover"
                            />
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );

    return isLimitReached ? (
        <>
            {content}
        </>
    ) : (
        <a
            href={`${api}/go-affiliate`}
            
            rel="noopener noreferrer"
            onClick={() => {
                const data = increaseAffiliateCount();

                if (data.count >= data.max) {
                    setIsLimitReached(true);
                }
            }}
        >
            {content}
        </a>
    );
};

export default Tet2026InlineBanner;