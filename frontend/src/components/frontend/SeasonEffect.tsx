import { useMemo } from "react";
// Lấy giá trị biến môi trường (ví dụ trong Node.js/React)
const theme = import.meta.env.VITE_APP_ASSET_THEME || 'Default';

type Variant = "snow" | "leaf" | "rain";

type SeasonEffectProps = {
    count?: number;
    /** nếu truyền vào thì ép kiểu, nếu không thì auto theo tháng */
    variant?: Variant;
    zIndex?: number;
};

function detectVariantByMonth(): Variant {
    const month = new Date().getMonth(); // 0-11

    if ([10, 11, 0, 1].includes(month)) return "snow"; // đông
    if ([5, 6, 7].includes(month)) return "rain"; // hè
    if ([8, 9].includes(month)) return "leaf"; // thu

    return "snow"; // mặc định
}

export default function SeasonEffect({ count = 80, variant, zIndex = 40 }: SeasonEffectProps) {
    const today = new Date();

    // Kiểm tra có rơi lì xì không (Tết 2026)
    const isLuckyMoney =
        today >= new Date(2025, 11, 27) && today < new Date(2026, 2, 1);

    // Nếu là Tết, dùng lì xì; còn lại theo mùa hoặc variant truyền vào
    const activeVariant = isLuckyMoney
        ? "lucky-money"
        : variant ?? detectVariantByMonth();

    const particles = useMemo(
        () =>
            Array.from({ length: count }, (_, i) => {
                const size = Math.random() * 3 + 2; // 2px – 5px
                return {
                    id: i,
                    left: Math.random() * 100,
                    size,
                    duration: Math.random() * 10 + 10,
                    delay: Math.random() * -20,
                };
            }),
        [count]
    );

    return (
        <div className={`pointer-events-none fixed inset-0 z-${zIndex} overflow-hidden`}>
            {particles.map((p) =>
                isLuckyMoney ? (
                    <img
                        key={p.id}
                        src={`${theme}/Image-Mini/lucky-money.png`} // ảnh lì xì
                        className="season-particle"
                        style={{
                            left: `${p.left}%`,
                            width: p.size * 6,
                            height: p.size * 6,
                            animationDuration: `${p.duration}s`,
                            animationDelay: `${p.delay}s`,
                        }}
                    />
                ) : (
                    <div
                        key={p.id}
                        className={`season-particle season-${activeVariant}`} // snow, leaf, rain
                        style={{
                            left: `${p.left}%`,
                            width: p.size,
                            height: p.size,
                            animationDuration: `${p.duration}s`,
                            animationDelay: `${p.delay}s`,
                        }}
                    />
                )
            )}
        </div>
    );
}