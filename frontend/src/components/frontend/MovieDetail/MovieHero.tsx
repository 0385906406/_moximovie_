import React from "react";

interface MovieHeroProps {
    movieName?: string;
    thumbUrl?: string;
    isPlayerOpen: boolean;
    onClosePlayer: () => void;
}

/**
 * MovieHero: xử lý phần nền phía trên:
 * - Nếu đang mở player -> hiển thị VideoPlayer
 * - Nếu không -> hiển thị backdrop + overlay + hiệu ứng
 */
const MovieHero: React.FC<MovieHeroProps> = ({
    movieName,
    thumbUrl,
}) => {
    return (
        <div className="relative w-full h-60 sm:h-[430px] lg:h-[590px] xl:h-[792px] overflow-hidden text-white select-none bg-[#282b3a] z-10">
            {/* Ảnh nền phim */}
            <img
                src={thumbUrl}
                alt={movieName}
                className="
                            absolute inset-0 w-full h-full 
                            object-cover object-center
                            opacity-0
                            transition-opacity duration-700
                            cursor-pointer
                        "
                loading="lazy"
                onLoad={(e) => {
                    e.currentTarget.style.opacity = "1";
                }}
            />

            {/* OVERLAY TỔNG HỢP */}
            <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
                {/* 1️⃣ Overlay tối */}
                <div className="absolute inset-0 bg-black/20" />

                {/* 2️⃣ Radial light (trung tâm sáng) */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_70%,rgba(0,0,0,0.9)_100%)]" />

                {/* 3️⃣ Pattern chấm chấm + gradient */}
                <div className="absolute inset-0 opacity-100 mix-blend-soft-light bg-[radial-gradient(circle,rgba(255,255,255,0.22)_1px,transparent_0)] bg-[length:3px_3px]" />
            </div>

            {/* Gradient 4 góc */}
            <div
                className="pointer-events-none absolute inset-0 z-10"
                style={{
                    background: `radial-gradient(
            ellipse at top left, rgba(25,27,36,0.8) 0%, transparent 50%),
            radial-gradient(ellipse at top right, rgba(25,27,36,0.8) 0%, transparent 50%),
            radial-gradient(ellipse at bottom left, rgba(25,27,36,0.8) 0%, transparent 50%),
            radial-gradient(ellipse at bottom right, rgba(25,27,36,0.8) 0%, transparent 50%)`
                }}
            />

            {/* Pattern chấm */}
            <div
                className="
                            pointer-events-none absolute inset-0 opacity-[0.18]
                            bg-[radial-gradient(circle,rgba(255,255,255,0.16)_1px,transparent_0)] z-30
                        "
            />
        </div>
    );
};

export default MovieHero;