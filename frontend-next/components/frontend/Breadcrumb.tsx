"use client";

import React from "react";
import Link from "next/link"
import { usePathname } from "next/navigation";

interface BreadcrumbProps {
    episodeLabel?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ episodeLabel }) => {
    const pathname = usePathname();
    const paths = pathname.split("/").filter(Boolean);

    return (
        <nav
            className="
                relative w-full mx-auto z-30
                mt-[88px] sm:mt-28 lg:mt-28 xl:mt-28
                flex items-center
                lg:px-5 xl:px-6 px-3 py-5
                text-sm text-gray-400
            "
            aria-label="Breadcrumb"
        >
            <ol className="flex gap-2 items-center">
                {/* Trang chủ */}
                <li className="flex items-center">
                    <Link href="/phimhay" className="text-white/80 hover:text-white">
                        Trang chủ
                    </Link>
                </li>

                {/* Các segment từ URL */}
                {paths.map((path, index) => {
                    const isLast = index === paths.length - 1;

                    const displayName = decodeURIComponent(path)
                        .replace(/-/g, " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase());

                    return (
                        <li
                            key={index}
                            className="flex items-center max-w-[200px] sm:max-w-xs"
                        >
                            <span className="mx-2 text-white/80">/</span>

                            {isLast ? (
                                <span className="relative inline-flex items-center max-w-full">
                                    {/* Text */}
                                    <span
                                        className={`text-white font-semibold truncate ${episodeLabel ? "" : "pr-6"}`}
                                        title={displayName}
                                    >
                                        {displayName}
                                    </span>

                                    {/* 👉 THÊM TẬP PHIM Ở CUỐI */}
                                    {episodeLabel && (
                                        <li className="flex items-center pr-6">
                                            <span className="mx-2 text-white/80">/</span>
                                            <span
                                                className="
                                                    text-yellow-300 font-semibold
                                                    py-0.5
                                                "
                                            >
                                                {episodeLabel}
                                            </span>
                                        </li>
                                    )}
                                </span>
                            ) : (
                                <Link href={`/${paths.slice(0, index + 1).join("/")}`}
                                    className="text-white/80 hover:text-white truncate max-w-full"
                                    title={displayName}
                                >
                                    {displayName}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default Breadcrumb;