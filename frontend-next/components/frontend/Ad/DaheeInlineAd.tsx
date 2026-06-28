import React from "react";

type DaheeInlineAdProps = {
    shopName?: string;
    tagline?: string;
    description?: string;
    buttonLabel?: string;
    onClick?: () => void;
};

const DaheeInlineAd: React.FC<DaheeInlineAdProps> = ({
    shopName = "Tiệm Nhỏ Nhà Dahee",
    tagline = "Outfit nữ vibe Hàn, lên hình như nữ chính phim.",
    description = "Quần áo được chọn kỹ, chụp thật 100%, phối sẵn theo dáng người và hoàn cảnh: đi chơi, đi làm, hẹn hò.",
    buttonLabel = "Ghé shop quần áo",
    onClick,
}) => {
    return (
        <section className="w-full px-4 py-6 sm:px-6 lg:px-8">
            <div
                className="
                    mx-auto max-w-6xl overflow-hidden rounded-[5.28px]
                    border border-[#e7d7c4]/80 bg-[#f8f1e8]
                    shadow-[0_18px_45px_rgba(15,23,42,0.18)]
                "
            >
                <div className="flex flex-col gap-5 p-4 sm:flex-row sm:p-6">
                    {/* Text bên trái */}
                    <div className="flex-1 space-y-3">
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#a26a35]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#e19b60]" />
                            Đối tác thời trang
                        </span>

                        <h3 className="text-base font-semibold text-[#3f2616] sm:text-lg">
                            {shopName}
                        </h3>

                        <p className="text-sm font-medium text-[#6b3c1f]">
                            {tagline}
                        </p>

                        <p className="text-xs leading-relaxed text-[#7b6450] sm:text-[13px]">
                            {description}
                        </p>

                        <div className="pt-2">
                            <button
                                onClick={
                                    onClick ??
                                    (() => {
                                        window.open("https://daheeshop.vercel.app", "_blank");
                                    })
                                }
                                className="
                                    dahee-btn group
                                "
                            >
                                <div className="dahee-btn-inner">
                                    <span
                                        className="dahee-btn-shine"
                                        aria-hidden="true"
                                    />
                                    <span className="whitespace-nowrap">
                                        {buttonLabel}
                                    </span>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Ảnh / mockup bên phải */}
                    <div className="flex flex-1 items-center justify-center">
                        <div
                            className="
                                relative h-32 w-full max-w-xs overflow-hidden
                                rounded-2xl bg-[#e9d7c4]
                                shadow-[0_14px_36px_rgba(148,112,75,0.45)]
                            "
                        >
                            <img
                                src="/QC01.jpg"
                                alt={`Outfit nổi bật từ Tiệm Nhỏ Nhà Dahee`}
                                className="h-full w-full object-cover"
                            />
                            {/* tag nhỏ trên ảnh */}
                            <div className="absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-white/90">
                                Lookbook mới
                            </div>
                            <div className="absolute bottom-3 right-3 rounded-full bg-white/85 px-3 py-1 text-[10px] font-medium text-[#5a3822]">
                                Ảnh chụp thực tế
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default DaheeInlineAd;