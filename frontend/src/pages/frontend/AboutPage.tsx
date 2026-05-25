import { useEffect, useRef, useState } from "react";
import Breadcrumb from "../../components/frontend/Breadcrumb";
import SEO from "@/components/frontend/SEO";

// Hook: fade-in khi scroll vào viewport
function useReveal() {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
            { threshold: 0.15 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return { ref, visible };
}

// Component block reveal
function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
    const { ref, visible } = useReveal();
    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(32px)",
                transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
            }}
        >
            {children}
        </div>
    );
}

// Số đếm tăng dần
function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
    const [count, setCount] = useState(0);
    const { ref, visible } = useReveal();

    useEffect(() => {
        if (!visible) return;
        let start = 0;
        const step = target / 60;
        const timer = setInterval(() => {
            start += step;
            if (start >= target) { setCount(target); clearInterval(timer); }
            else setCount(Math.floor(start));
        }, 16);
        return () => clearInterval(timer);
    }, [visible, target]);

    return (
        <span ref={ref}>
            {count.toLocaleString()}{suffix}
        </span>
    );
}

const features = [
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75.125V6.375c0-.621.504-1.125 1.125-1.125h17.25c.621 0 1.125.504 1.125 1.125v12m-3.75.125V6.375m0 12h1.5c.621 0 1.125-.504 1.125-1.125V6.375" />
            </svg>
        ),
        title: "Kho phim khổng lồ",
        desc: "Phim lẻ, phim bộ, hoạt hình, phim chiếu rạp — đủ thể loại, đủ quốc gia. Cập nhật mỗi ngày.",
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.25V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18V8.25m-18 0V6a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 6v2.25m-18 0h18M5.25 6h.008v.008H5.25V6zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM8.25 6h.008v.008H8.25V6zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM11.25 6h.008v.008h-.008V6zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
        ),
        title: "Chất lượng HD – 4K",
        desc: "Stream mượt mà với chất lượng từ HD đến 4K. Vietsub & Thuyết minh rõ ràng, không lag.",
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
            </svg>
        ),
        title: "Mọi thiết bị",
        desc: "Tối ưu hoàn toàn cho điện thoại, tablet và máy tính. Giao diện thích nghi mọi màn hình.",
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
            </svg>
        ),
        title: "Tìm kiếm thông minh",
        desc: "Lọc phim theo thể loại, quốc gia, năm phát hành. Tìm đúng phim bạn muốn trong vài giây.",
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
        ),
        title: "Hoàn toàn miễn phí",
        desc: "Không cần đăng ký, không tính phí. Xem phim thoải mái mà không lo về chi phí ẩn.",
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
        ),
        title: "Cập nhật liên tục",
        desc: "Phim mới được cập nhật ngay khi phát hành. Không bỏ lỡ bất kỳ tập hay bộ phim nào.",
    },
];

const stats = [
    { value: 10000, suffix: "+", label: "Bộ phim" },
    { value: 50, suffix: "+", label: "Thể loại" },
    { value: 100, suffix: "+", label: "Quốc gia" },
    { value: 0, suffix: "đ", label: "Chi phí" },
];

export default function AboutPage() {
    useEffect(() => {
        if (typeof window !== "undefined") {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    }, []);

    return (
        <>
            <SEO
                title="Giới Thiệu MoxiMovie – Nền Tảng Giải Trí Phim Trực Tuyến Vietsub HD"
                description="MoxiMovie là nền tảng giải trí phim trực tuyến với kho phim đa dạng, giao diện thân thiện, tốc độ tải nhanh và nội dung được cập nhật liên tục mỗi ngày."
                canonical="https://www.moximovie.click/gioi-thieu"
                type="website"
            />

            <Breadcrumb />

            <div className="w-full text-white overflow-hidden">

                {/* ── HERO ── */}
                <section className="relative min-h-[420px] flex items-center justify-center px-4 py-24 overflow-hidden">
                    {/* Ambient glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-green-500/10 blur-[100px] pointer-events-none" />
                    <div className="absolute bottom-0 right-1/4 w-[300px] h-[200px] rounded-full bg-yellow-400/5 blur-[80px] pointer-events-none" />

                    {/* Decorative film strip lines */}
                    <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-white/5 to-transparent" />
                    <div className="absolute right-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-white/5 to-transparent" />

                    <div className="relative z-10 text-center max-w-3xl mx-auto">
                        <div
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-green-400/30 bg-green-400/5 text-green-400 text-xs font-semibold tracking-widest uppercase mb-6"
                            style={{ animation: "fadeDown 0.6s ease both" }}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            Về chúng tôi
                        </div>

                        <h1
                            className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight mb-6"
                            style={{ animation: "fadeDown 0.6s ease 0.1s both" }}
                        >
                            Xem phim{" "}
                            <span className="relative inline-block">
                                <span className="text-green-400">đỉnh cao</span>
                                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-green-400 to-transparent rounded-full" />
                            </span>
                            <br />không giới hạn
                        </h1>

                        <p
                            className="text-gray-400 text-base sm:text-lg leading-relaxed max-w-xl mx-auto"
                            style={{ animation: "fadeDown 0.6s ease 0.2s both" }}
                        >
                            MoxiMovie được xây dựng với một mục tiêu duy nhất — mang đến trải nghiệm
                            xem phim tốt nhất, nhanh nhất và hoàn toàn miễn phí cho mọi người.
                        </p>
                    </div>
                </section>

                {/* ── STATS ── */}
                <section className="px-4 py-12 max-w-4xl mx-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {stats.map((s, i) => (
                            <Reveal key={i} delay={i * 80}>
                                <div className="group relative rounded-2xl border border-white/8 bg-white/3 hover:border-green-400/30 hover:bg-green-400/5 transition-all duration-500 p-6 text-center overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-green-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <div className="relative">
                                        <p className="text-3xl sm:text-4xl font-black text-white tabular-nums">
                                            <CountUp target={s.value} suffix={s.suffix} />
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1 font-medium tracking-wide uppercase">{s.label}</p>
                                    </div>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </section>

                {/* ── STORY ── */}
                <section className="px-4 py-12 max-w-4xl mx-auto">
                    <Reveal>
                        <div className="relative rounded-3xl border border-white/8 bg-white/2 p-8 sm:p-12 overflow-hidden">
                            {/* Corner accent */}
                            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-green-400/10 to-transparent rounded-3xl" />
                            <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-yellow-400/5 to-transparent rounded-3xl" />

                            <div className="relative">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-8 h-0.5 bg-green-400 rounded-full" />
                                    <span className="text-green-400 text-xs font-bold tracking-widest uppercase">Câu chuyện</span>
                                </div>

                                <h2 className="text-2xl sm:text-3xl font-bold mb-6 leading-snug">
                                    Sinh ra từ tình yêu<br />
                                    <span className="text-gray-400 font-normal">dành cho điện ảnh</span>
                                </h2>

                                <div className="space-y-4 text-gray-400 leading-relaxed text-sm sm:text-base">
                                    <p>
                                        MoxiMovie không chỉ là một trang xem phim — đây là không gian được xây dựng
                                        bởi những người thực sự yêu điện ảnh, hiểu rõ cảm giác tìm mãi không ra phim
                                        hay để xem cuối tuần.
                                    </p>
                                    <p>
                                        Chúng tôi tập trung vào điều quan trọng nhất: <span className="text-white font-medium">trải nghiệm người xem</span>.
                                        Giao diện tối giản, tốc độ tải nhanh, không làm phiền — chỉ cần mở lên và xem.
                                    </p>
                                    <p>
                                        Mỗi tính năng trên MoxiMovie đều được cân nhắc kỹ để bạn tìm được phim mình muốn
                                        trong vài giây, thay vì vài phút.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Reveal>
                </section>

                {/* ── FEATURES ── */}
                <section className="px-4 py-12 max-w-4xl mx-auto">
                    <Reveal>
                        <div className="flex items-center gap-3 mb-10">
                            <div className="w-8 h-0.5 bg-green-400 rounded-full" />
                            <span className="text-green-400 text-xs font-bold tracking-widest uppercase">Tính năng</span>
                        </div>
                    </Reveal>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {features.map((f, i) => (
                            <Reveal key={i} delay={i * 60}>
                                <div className="group relative h-full rounded-2xl border border-white/8 bg-white/2 p-6 hover:border-green-400/25 hover:bg-green-400/3 transition-all duration-500 overflow-hidden">
                                    {/* Hover glow */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-green-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />

                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-green-400 mb-4 group-hover:border-green-400/30 group-hover:bg-green-400/10 transition-all duration-300">
                                            {f.icon}
                                        </div>
                                        <h3 className="font-bold text-white mb-2 text-sm">{f.title}</h3>
                                        <p className="text-gray-500 text-xs leading-relaxed group-hover:text-gray-400 transition-colors duration-300">{f.desc}</p>
                                    </div>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </section>

                {/* ── ROADMAP / MISSION ── */}
                <section className="px-4 py-12 max-w-4xl mx-auto">
                    <Reveal>
                        <div className="flex items-center gap-3 mb-10">
                            <div className="w-8 h-0.5 bg-yellow-400 rounded-full" />
                            <span className="text-yellow-400 text-xs font-bold tracking-widest uppercase">Định hướng</span>
                        </div>
                    </Reveal>

                    <div className="relative pl-6 border-l border-white/8 space-y-10">
                        {[
                            {
                                phase: "Hiện tại",
                                color: "bg-green-400",
                                title: "Nền tảng vững chắc",
                                desc: "Kho phim 10.000+, giao diện mượt mà, tìm kiếm thông minh và trải nghiệm xem không gián đoạn trên mọi thiết bị.",
                            },
                            {
                                phase: "Sắp tới",
                                color: "bg-yellow-400",
                                title: "Cá nhân hóa trải nghiệm",
                                desc: "Gợi ý phim thông minh theo sở thích, danh sách xem sau, theo dõi tiến trình và thông báo phim mới.",
                            },
                            {
                                phase: "Tương lai",
                                color: "bg-white/30",
                                title: "Cộng đồng phim ảnh",
                                desc: "Nơi để những người yêu phim kết nối, chia sẻ review và khám phá những bộ phim ẩn xứng đáng được biết đến hơn.",
                            },
                        ].map((item, i) => (
                            <Reveal key={i} delay={i * 120}>
                                <div className="relative">
                                    {/* dot */}
                                    <div className={`absolute -left-[29px] top-1 w-3 h-3 rounded-full ${item.color} ring-4 ring-[rgb(13,15,20)]`} />

                                    <span className={`text-[10px] font-bold tracking-widest uppercase ${i === 0 ? "text-green-400" : i === 1 ? "text-yellow-400" : "text-gray-600"}`}>
                                        {item.phase}
                                    </span>
                                    <h3 className="text-white font-bold mt-1 mb-2">{item.title}</h3>
                                    <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </section>

                {/* ── CTA / THANK YOU ── */}
                <section className="px-4 py-16 max-w-4xl mx-auto">
                    <Reveal>
                        <div className="relative rounded-3xl overflow-hidden border border-white/8">
                            {/* Background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-green-400/8 via-transparent to-yellow-400/5" />
                            <div className="absolute top-0 right-0 w-64 h-64 bg-green-400/5 rounded-full blur-3xl" />

                            <div className="relative p-10 sm:p-14 text-center">
                                {/* Film reel icon */}
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl border border-white/10 bg-white/5 mb-6">
                                    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-green-400" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m2.25-2.25h-2.25m2.25 0c0 .621.504 1.125 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-5.25 0h5.25" />
                                    </svg>
                                </div>

                                <h2 className="text-2xl sm:text-3xl font-black mb-4 leading-tight">
                                    Cảm ơn bạn đã chọn<br />
                                    <span className="text-green-400">MoxiMovie</span>
                                </h2>

                                <p className="text-gray-400 text-sm sm:text-base max-w-lg mx-auto leading-relaxed mb-8">
                                    Mỗi lượt xem, mỗi phản hồi của bạn là động lực để chúng tôi không ngừng
                                    cải thiện. Chúc bạn những giờ phim thật vui và trọn vẹn! 🎬
                                </p>

                                <a
                                    href="/phimhay"
                                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-green-400 text-black font-bold text-sm hover:bg-green-300 transition-all duration-300 hover:shadow-[0_0_30px_rgba(74,222,128,0.4)] hover:-translate-y-0.5"
                                >
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                        <path d="M8 5.14v14l11-7-11-7z" />
                                    </svg>
                                    Khám phá ngay
                                </a>
                            </div>
                        </div>
                    </Reveal>
                </section>
            </div>

            <style>{`
                @keyframes fadeDown {
                    from { opacity: 0; transform: translateY(-16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </>
    );
}