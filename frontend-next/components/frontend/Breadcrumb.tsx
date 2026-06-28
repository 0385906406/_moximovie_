"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbProps {
    episodeLabel?: string;
}

const LABEL_MAP: Record<string, string> = {
    "phimhay":        "Trang chủ",
    "phim-le":        "Phim Lẻ",
    "phim-bo":        "Phim Bộ",
    "hoat-hinh":      "Hoạt Hình",
    "phim-chieu-rap": "Chiếu Rạp",
    "loc-phim":       "Lọc Phim",
    "tim-kiem":       "Tìm Kiếm",
    "phim":           "Phim",
    "xem-phim":       "Xem Phim",
    "the-loai":       "Thể Loại",
    "quoc-gia":       "Quốc Gia",
    "thong-tin":      "Tài Khoản",
    "bai-viet":       "Bài Viết",
};

function label(segment: string) {
    return LABEL_MAP[segment] ?? decodeURIComponent(segment).replace(/-/g, " ");
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ episodeLabel }) => {
    const pathname = usePathname();
    const segments = pathname.split("/").filter(Boolean);

    // Chỉ hiện tối đa 2 segment sau home để tránh dài
    const shown = segments.slice(0, 2);

    return (
        <nav
            className="relative w-full mx-auto z-30 mt-[88px] sm:mt-28 lg:mt-28 xl:mt-28 flex items-center lg:px-5 xl:px-6 px-3 py-3"
            aria-label="Breadcrumb"
        >
            <ol className="flex items-center gap-1 text-[12px] text-white/40 flex-wrap">
                {/* Home */}
                <li className="flex items-center gap-1">
                    <Link href="/phimhay" className="flex items-center gap-1 hover:text-white/70 transition-colors">
                        <Home size={12} className="shrink-0" />
                        <span>Trang chủ</span>
                    </Link>
                </li>

                {shown.map((seg, i) => {
                    const isLast = i === shown.length - 1 && !episodeLabel;
                    const href   = "/" + segments.slice(0, i + 1).join("/");
                    const text   = label(seg);

                    return (
                        <li key={i} className="flex items-center gap-1">
                            <ChevronRight size={11} className="text-white/20 shrink-0" />
                            {isLast ? (
                                <span className="text-white/70 font-medium truncate max-w-[180px] sm:max-w-xs">{text}</span>
                            ) : (
                                <Link href={href} className="hover:text-white/70 transition-colors truncate max-w-[160px]">{text}</Link>
                            )}
                        </li>
                    );
                })}

                {episodeLabel && (
                    <li className="flex items-center gap-1">
                        <ChevronRight size={11} className="text-white/20 shrink-0" />
                        <span className="text-[#22d3a5] font-semibold">{episodeLabel}</span>
                    </li>
                )}
            </ol>
        </nav>
    );
};

export default Breadcrumb;
