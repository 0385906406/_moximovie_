import React from "react";

type FashionAdOnMovieSiteProps = {
    shopName?: string;
    tagline?: string;
    description?: string;
    buttonLabel?: string;
    onClick?: () => void;
};

const FashionAdOnMovieSite: React.FC<FashionAdOnMovieSiteProps> = ({
    shopName = "Tiệm Nhỏ Nhà Dahee",
    tagline = "Khám phá vẻ đẹp tinh tế & nhẹ nhàng.",
    description = "Outfit nữ vibe Hàn, chụp thật, không filter, mix sẵn cho người bận rộn.",
    buttonLabel = "Xem shop quần áo",
    onClick,
}) => {
    return (
        <div className="relative z-30 px-4">
            <div
                className="
                    mx-auto flex max-w-6xl flex-col items-start gap-3
                    mt-8 sm:-mt-6 lg:-mt-6 xl:-mt-10
                    px-4 py-3
                    bg-[#f8f1e8]
                    sm:flex-row sm:items-center sm:justify-between
                    sm:px-6 sm:py-4 rounded-[5.28px]
                "
            >
                {/* Logo + tên shop */}
                <div className="flex items-center gap-3">
                    <div
                        className="
                            flex h-11 w-11 items-center justify-center
                            rounded-full bg-gradient-to-tr
                            from-[#f4d0aa] via-[#f8e1c7] to-[#f6c28b]
                            p-[2px] shadow-lg
                        "
                    >
                        {/* Khung tròn bên trong có viền nhẹ */}
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-[#fbe9d6] ring-1 ring-white/60 overflow-hidden">
                            <img
                                src="/logo_dahee.jpg"
                                alt="Logo Tiệm Nhỏ Nhà Dahee"
                                className="h-full w-full object-cover"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#a26a35]">
                            Đối tác thời trang
                        </span>
                        <span className="text-sm font-semibold text-[#4b2e1c] sm:text-base">
                            {shopName}
                        </span>
                    </div>
                </div>

                {/* Text giới thiệu */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#6b3c1f] sm:text-base">
                        {tagline}
                    </p>
                    <p className="mt-1 text-xs text-[#7b6450] sm:line-clamp-2">
                        {description}
                    </p>
                </div>

                {/* Nút sang web quần áo */}
                <div className="flex w-full flex-col items-stretch gap-1 sm:w-auto sm:items-end">
                    <button
                        onClick={
                            onClick ??
                            (() => {
                                window.open("https://daheeshop.vercel.app", "_blank");
                            })
                        }
                        className="dahee-btn group sm:px-0 sm:py-0"
                    >
                        <div className="dahee-btn-inner">
                            <span className="dahee-btn-shine" aria-hidden="true" />
                            <span className="whitespace-nowrap">
                                {buttonLabel}
                            </span>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FashionAdOnMovieSite;