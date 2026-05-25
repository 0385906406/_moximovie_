import { useNavigate } from "react-router-dom";

const ReadStoryButton = () => {
    const navigate = useNavigate();

    return (
        <div
            onClick={() => navigate("/doc-truyen")}
            title="Đọc truyện"
            className="
                group
                fixed bottom-5 left-5
                w-14 h-14
                rounded-xl
                cursor-pointer z-[9999]

                bg-gradient-to-br from-[#4a5178] to-[#151720]
                border border-white/10

                flex items-center justify-center
                shadow-[0_10px_30px_rgba(0,0,0,0.65)]

                transition-all duration-300 ease-out
                hover:scale-105
                hover:shadow-[0_0_30px_rgba(246,212,107,0.35)]
            "
        >
            {/* Tooltip chữ */}
            <span
                className="
                    absolute -top-12
                    px-1.5 py-1
                    text-[12px] font-medium
                    rounded-[5.28px]
                    whitespace-nowrap

                    bg-white text-black
                    border border-white/10
                    shadow-lg

                    opacity-0 translate-y-2
                    animate-hint
                    pointer-events-none
                "
            >
                📖 Đọc truyện
            </span>

            {/* Glow nền */}
            <div
                className="
                    absolute inset-0 rounded-xl
                    bg-[radial-gradient(circle_at_center,rgba(246,212,107,0.35),transparent_70%)]
                    blur-md
                    opacity-40
                    animate-glow
                "
            />

            {/* Icon sách */}
            <div className="relative w-12 h-12">
                <img
                    src="/book-transparent.gif"
                    alt="Đọc truyện"
                    className="
                        w-full h-full object-contain
                        transition-transform duration-300
                        group-hover:scale-110
                    "
                />
            </div>
        </div>
    );
};

export default ReadStoryButton;