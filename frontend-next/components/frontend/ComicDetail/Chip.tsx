import React from "react";

interface ChipProps {
    children: React.ReactNode;
    small?: boolean;
}

/**
 * Chip hiển thị tag nhỏ (quốc gia, năm, season, ...)
 * Dùng React.memo để tránh re-render khi props không đổi.
 */
const Chip: React.FC<ChipProps> = React.memo(function Chip({ children, small = false }) {
    return (
        <span
            className={`px-2 py-1 bg-white/10 rounded-[5.28px] text-white ${small ? "text-[11px]" : ""
                }`}
        >
            {children}
        </span>
    );
});

export default Chip;