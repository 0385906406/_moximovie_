"use client";

import React, { useRef, useState, useCallback } from "react";
const theme = process.env.NEXT_PUBLIC_ASSET_THEME || "Default";

const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

// Chiều dài dây “gốc” (pixel) – để tính stretch
const BASE_ROPE_LENGTH = 48;
const MAX_STRETCH = 26;   // dây căng tối đa thêm
const MAX_ANGLE = 75;     // giới hạn xoay trái/phải

const HangingLogo: React.FC = () => {
    const wrapperRef = useRef<HTMLDivElement | null>(null);

    const [angle, setAngle] = useState(0);      // độ xoay logo (deg)
    const [stretch, setStretch] = useState(0);  // độ kéo dài dây (px)
    const [isDragging, setIsDragging] = useState(false);

    // lưu góc cuối cùng để dùng khi rebound
    const lastAngleRef = useRef(0);

    const dragStateRef = useRef<{
        originX: number;
        originY: number;
    } | null>(null);

    const handlePointerDown = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (!wrapperRef.current) return;

            const rect = wrapperRef.current.getBoundingClientRect();

            // điểm treo (đỉnh dây)
            dragStateRef.current = {
                originX: rect.left + rect.width / 2,
                originY: rect.top,
            };

            setIsDragging(true);

            // đảm bảo nhận move/up kể cả khi chuột ra khỏi element
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
        },
        []
    );

    const handlePointerMove = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (!isDragging || !dragStateRef.current) return;

            const { originX, originY } = dragStateRef.current;
            const dx = e.clientX - originX;
            const dy = e.clientY - originY;

            // Góc chỉ dựa vào kéo ngang:
            // kéo sang phải -> dx dương -> góc dương -> xoay về bên phải
            const newAngle = clamp(dx / 3, -MAX_ANGLE, MAX_ANGLE);

            // Độ căng = khoảng cách - chiều dài dây gốc
            const distance = Math.sqrt(dx * dx + dy * dy);
            const extra = Math.max(0, distance - BASE_ROPE_LENGTH);
            const newStretch = clamp(extra, 0, MAX_STRETCH);

            lastAngleRef.current = newAngle;
            setAngle(newAngle);
            setStretch(newStretch);
        },
        [isDragging]
    );

    const handlePointerUp = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (!isDragging) return;
            setIsDragging(false);

            try {
                (e.target as HTMLElement).releasePointerCapture(e.pointerId);
            } catch {
                // ignore
            }

            const currentAngle = lastAngleRef.current;

            // 1. cho dây thu lại (stretch -> 0)
            setStretch(0);

            // 2. bắn sang phía NGƯỢC LẠI một chút (rebound nhẹ)
            const reboundAngle = -currentAngle * 0.4;
            setAngle(reboundAngle);
            lastAngleRef.current = reboundAngle;

            // 3. rồi dần dần quay về 0 độ (center) sau một chút
            setTimeout(() => {
                setAngle(0);
                lastAngleRef.current = 0;
            }, 260);
        },
        [isDragging]
    );

    // Trạng thái nghỉ (để cho CSS intro animation tự chạy)
    const isRest = !isDragging && angle === 0 && stretch === 0;

    // style cho toàn cụm treo
    const wrapperStyle: React.CSSProperties = isRest
        ? {
            // để trống transform → CSS animation `.hanging-logo-cycle`
            // sẽ xử lý intro (rơi xuống + lắc lư)
        }
        : {
            transform: `rotate(${angle}deg)`,
            transformOrigin: "top center",
            transition: isDragging
                ? "none"
                : "transform 0.5s cubic-bezier(0.22, 0.61, 0.36, 1)",
        };

    // dây dài hơn khi kéo xuống
    const ropeStyle: React.CSSProperties = {
        transformOrigin: "top center",
        transform: `scaleY(${1 + stretch / 30})`,
        transition: isDragging
            ? "none"
            : "transform 0.5s cubic-bezier(0.22, 0.61, 0.36, 1)",
    };

    // logo tụt xuống tí khi kéo
    const cardStyle: React.CSSProperties = {
        transform: `translateY(${stretch}px)`,
        transition: isDragging
            ? "none"
            : "transform 0.5s cubic-bezier(0.22, 0.61, 0.36, 1)",
    };

    return (
        <div
            ref={wrapperRef}
            className="hanging-logo-cycle flex flex-col items-center cursor-pointer select-none"
            style={wrapperStyle}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        >
            {/* Cụm gim + dây */}
            <div className="flex flex-col items-center">
                {/* Gim */}
                <div
                    className="
                        w-3 h-3 
                        rounded-full 
                        bg-amber-300 
                        shadow-[0_0_10px_rgba(252,211,77,0.9)] 
                        border border-amber-100
                        mb-0.5
                    "
                />

                {/* Dây */}
                <div
                    className="
                        h-10 w-[2px] 
                        bg-gradient-to-b
                        from-amber-100/90 via-white/80 to-amber-400/80
                    "
                    style={ropeStyle}
                />
            </div>

            {/* Logo card */}
            <div
                className="
                    hanging-logo-card
                    mt-1
                    min-w-[190px]
                    rounded-[6px] 
                    px-3 py-2 
                    text-[12px] sm:text-[13px]
                    text-white
                    w-55
                    font-medium
                    shadow-[0_10px_25px_rgba(0,0,0,0.8)]
                    flex items-center justify-center gap-1
                    border border-white/15
                    backdrop-blur-md
                "
                style={cardStyle}
            >
                <span className="text-[13px] sm:text-[14px]">🎬</span>
                <span className="text-shadow-soft">
                    {theme == "NewYear" ? "Chúc mừng năm mới 2026 " : "Chúc bạn xem phim vui vẻ!"}
                </span>
            </div>
        </div>
    );
};

export default HangingLogo;