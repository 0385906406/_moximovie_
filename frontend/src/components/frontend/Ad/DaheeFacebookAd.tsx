import React from "react";

type DaheeFacebookAdProps = {
    pageUrl?: string;
    shopName?: string;
    followersText?: string;
    buttonLabel?: string;
    coverSrc?: string;   // ảnh cover, ví dụ: "/dahee-fb-cover.jpg"
};

const DaheeFacebookAd: React.FC<DaheeFacebookAdProps> = ({
    pageUrl = "https://www.facebook.com/tiemnhonhadahee",
    shopName = "Tiệm Nhỏ Nhà Dahee - 다희",
    followersText = "864+ người theo dõi",
    buttonLabel = "Xem album trên Facebook",
    coverSrc = "/banner_dahee.jpg",
}) => {
    const handleClick = () => {
        if (pageUrl) {
            window.open(pageUrl, "_blank");
        }
    };

    return (
        <section className="w-full px-4 py-6 sm:px-6 lg:px-8">
            <div
                className="
                    mx-auto flex max-w-6xl flex-col overflow-hidden
                   rounded-[5.28px] border-none
                    bg-gradient-to-r from-[#cae4ff] via-[#e3f0ff] to-[#f5f9ff]
                    shadow-[0_18px_40px_rgba(15,23,42,0.25)]
                    sm:flex-row
                "
            >
                {/* Ảnh cover bên trái / trên mobile */}
                <div className="relative w-full bg-[#a8d4ff] sm:w-2/5">
                    <div className="h-32 w-full sm:h-full">
                        <img
                            src={coverSrc}
                            alt="Cover Tiệm Nhỏ Nhà Dahee"
                            className="h-full w-full object-cover"
                        />
                    </div>

                    {/* Gradient fade dưới cho chữ nếu cần sau này */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 to-transparent" />
                </div>

                {/* Nội dung bên phải */}
                <div className="flex w-full flex-1 flex-col gap-4 px-4 py-4 sm:px-6 sm:py-5">
                    {/* Header: avatar + tên page */}
                    <div className="flex items-center gap-3">
                        {/* Avatar tròn kiểu FB page */}
                        <div
                            className="
                                flex h-12 w-12 items-center justify-center
                                rounded-full bg-white p-[2px]
                                shadow-[0_10px_25px_rgba(15,23,42,0.35)]
                            "
                        >
                            <div className="flex h-full w-full items-center justify-center rounded-full bg-[#fff7ee] overflow-hidden">
                                {/* Thay bằng logo thật của bạn */}
                                <img
                                    src="/logo_dahee.jpg"
                                    alt="Logo Tiệm Nhỏ Nhà Dahee"
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-800/80">
                                PAGE CHÍNH THỨC
                            </span>
                            <span className="text-sm font-semibold text-slate-900 sm:text-base">
                                {shopName}
                            </span>
                            <span className="text-[11px] text-slate-700/80">
                                {followersText}
                            </span>
                        </div>
                    </div>

                    {/* Mô tả ngắn */}
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-900/90">
                            Outfit & phụ kiện xinh mỗi ngày, ảnh chụp thật, tone Hàn nhẹ nhàng.
                        </p>
                        <p className="text-xs text-slate-700/90 sm:text-[13px]">
                            Xem đầy đủ album, feedback khách, video try-on và mix đồ chi tiết trên Facebook.
                        </p>
                    </div>

                    {/* CTA */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <button
                            onClick={handleClick}
                            className="
                                inline-flex items-center justify-center gap-2
                                rounded-full bg-[#1877f2]
                                px-5 py-2.5 text-xs font-semibold text-white
                                shadow-[0_10px_25px_rgba(24,119,242,0.6)]
                                transition-transform duration-200
                                hover:translate-y-[-1px] hover:brightness-110
                                sm:text-sm
                            "
                        >
                            {/* icon facebook đơn giản */}
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/10">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    className="h-3.5 w-3.5"
                                >
                                    <path
                                        fill="currentColor"
                                        d="M13 21v-7h2.5a1 1 0 0 0 .98-.804l.5-3A1 1 0 0 0 16 9h-3V7a1 1 0 0 1 1-1h2a1 1 0 0 0 1-1V3.5A.5.5 0 0 0 16.5 3H14a4 4 0 0 0-4 4v2H8a1 1 0 0 0-1 .999L7 13a1 1 0 0 0 1 1h2v7h3z"
                                    />
                                </svg>
                            </span>
                            <span>{buttonLabel}</span>
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default DaheeFacebookAd;