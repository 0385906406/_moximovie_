import { useEffect, useRef, useState } from "react";
import Breadcrumb from "../../components/frontend/Breadcrumb";
import SEO from "@/components/frontend/SEO";

// ── Reveal on scroll ──
function useReveal() {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
            { threshold: 0.12 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    return { ref, visible };
}

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
    const { ref, visible } = useReveal();
    return (
        <div ref={ref} className={className} style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(28px)",
            transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
        }}>
            {children}
        </div>
    );
}

// ── Contact cards ──
const contactItems = [
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
        ),
        label: "Email hỗ trợ",
        value: "support@moximovie.com",
        sub: "Phản hồi trong 24h",
        color: "text-green-400",
        border: "hover:border-green-400/30",
        glow: "group-hover:bg-green-400/5",
        href: "mailto:support@moximovie.com",
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3h16.5M3.75 3v.75A.75.75 0 003 4.5H2.25A.75.75 0 001.5 5.25v13.5A.75.75 0 002.25 19.5H4.5m16.5 0H19.5M3.75 3h.375c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125H3.75M19.5 19.5v.75a.75.75 0 01-.75.75h-13.5a.75.75 0 01-.75-.75v-.75m14.25-16.5h.375c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125H19.5m0-3.75v3.75M4.5 7.5v9m15-9v9" />
            </svg>
        ),
        label: "Email quảng cáo",
        value: "ads@moximovie.com",
        sub: "Hợp tác & truyền thông",
        color: "text-yellow-400",
        border: "hover:border-yellow-400/30",
        glow: "group-hover:bg-yellow-400/5",
        href: "mailto:ads@moximovie.com",
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
            </svg>
        ),
        label: "Facebook Page",
        value: "MoxiMovie Official",
        sub: "Theo dõi & nhắn tin",
        color: "text-blue-400",
        border: "hover:border-blue-400/30",
        glow: "group-hover:bg-blue-400/5",
        href: "https://facebook.com",
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        label: "Giờ làm việc",
        value: "9:00 – 22:00",
        sub: "Tất cả các ngày trong tuần",
        color: "text-purple-400",
        border: "hover:border-purple-400/30",
        glow: "group-hover:bg-purple-400/5",
        href: null,
    },
];

// ── Ad packages ──
const adPackages = [
    {
        name: "Banner",
        desc: "Header, Sidebar, Footer — hiển thị liên tục trên toàn bộ trang web.",
        icon: "🖼️",
    },
    {
        name: "Pop-up / In-Video",
        desc: "Quảng cáo xuất hiện trong luồng nội dung, tiếp cận người xem trực tiếp.",
        icon: "📺",
    },
    {
        name: "Theo từ khóa",
        desc: "Nhắm đúng đối tượng tìm kiếm thể loại, diễn viên hoặc quốc gia phim.",
        icon: "🔍",
    },
    {
        name: "Bài PR / Review",
        desc: "Đặt bài viết giới thiệu sản phẩm, thương hiệu lồng ghép nội dung phim.",
        icon: "✍️",
    },
    {
        name: "Gói độc quyền",
        desc: "Tùy chỉnh hoàn toàn theo yêu cầu chiến dịch và ngân sách của bạn.",
        icon: "⭐",
    },
];

export default function ContactPage() {
    useEffect(() => {
        if (typeof window !== "undefined") {
            window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
        }
    }, []);

    return (
        <>
            <SEO
                title="Liên Hệ & Quảng Cáo | MoxiMovie – Hợp Tác, Góp Ý, Đặt Quảng Cáo"
                description="Liên hệ với MoxiMovie để gửi góp ý, hỗ trợ kỹ thuật hoặc hợp tác quảng cáo. Chúng tôi cung cấp dịch vụ quảng cáo uy tín, hiệu quả, tiếp cận hàng ngàn người dùng yêu phim."
                canonical="https://www.moximovie.click/lien-he-quang-cao"
                type="website"
            />

            <Breadcrumb />

            <div className="w-full text-white overflow-hidden">

                {/* ── HERO ── */}
                <section className="relative px-4 py-20 flex flex-col items-center justify-center text-center overflow-hidden">
                    {/* Ambient */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[260px] bg-green-400/8 rounded-full blur-[90px] pointer-events-none" />
                    <div className="absolute bottom-0 right-1/3 w-[250px] h-[180px] bg-yellow-400/5 rounded-full blur-[70px] pointer-events-none" />

                    <div className="relative z-10 max-w-2xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-green-400/30 bg-green-400/5 text-green-400 text-xs font-bold tracking-widest uppercase mb-6"
                            style={{ animation: "fadeDown 0.5s ease both" }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            Liên hệ với chúng tôi
                        </div>

                        <h1 className="text-4xl sm:text-5xl font-black leading-[1.1] tracking-tight mb-5"
                            style={{ animation: "fadeDown 0.5s ease 0.1s both" }}>
                            Hãy cùng{" "}
                            <span className="relative inline-block">
                                <span className="text-green-400">kết nối</span>
                                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-green-400 to-transparent rounded-full" />
                            </span>
                        </h1>

                        <p className="text-gray-400 text-base leading-relaxed"
                            style={{ animation: "fadeDown 0.5s ease 0.2s both" }}>
                            Dù bạn cần hỗ trợ kỹ thuật, muốn hợp tác quảng cáo hay đơn giản là muốn góp ý —
                            chúng tôi luôn lắng nghe.
                        </p>
                    </div>
                </section>

                {/* ── CONTACT CARDS ── */}
                <section className="px-4 pb-12 max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {contactItems.map((item, i) => (
                            <Reveal key={i} delay={i * 70}>
                                {item.href ? (
                                    <a href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined}
                                        rel="noopener noreferrer"
                                        className={`group relative flex items-start gap-4 p-6 rounded-2xl border border-white/8 bg-white/2 ${item.border} transition-all duration-400 overflow-hidden cursor-pointer block`}>
                                        <div className={`absolute inset-0 ${item.glow} transition-all duration-400`} />
                                        <div className={`relative shrink-0 w-11 h-11 rounded-xl border border-white/8 bg-white/5 flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform duration-300`}>
                                            {item.icon}
                                        </div>
                                        <div className="relative">
                                            <p className="text-xs text-gray-500 font-medium tracking-wide uppercase mb-1">{item.label}</p>
                                            <p className={`font-bold text-sm text-white group-hover:${item.color} transition-colors duration-300`}>{item.value}</p>
                                            <p className="text-xs text-gray-600 mt-0.5">{item.sub}</p>
                                        </div>
                                    </a>
                                ) : (
                                    <div className={`group relative flex items-start gap-4 p-6 rounded-2xl border border-white/8 bg-white/2 ${item.border} transition-all duration-400 overflow-hidden`}>
                                        <div className={`absolute inset-0 ${item.glow} transition-all duration-400`} />
                                        <div className={`relative shrink-0 w-11 h-11 rounded-xl border border-white/8 bg-white/5 flex items-center justify-center ${item.color}`}>
                                            {item.icon}
                                        </div>
                                        <div className="relative">
                                            <p className="text-xs text-gray-500 font-medium tracking-wide uppercase mb-1">{item.label}</p>
                                            <p className="font-bold text-sm text-white">{item.value}</p>
                                            <p className="text-xs text-gray-600 mt-0.5">{item.sub}</p>
                                        </div>
                                    </div>
                                )}
                            </Reveal>
                        ))}
                    </div>
                </section>

                {/* ── AD PACKAGES ── */}
                <section className="px-4 pb-12 max-w-4xl mx-auto">
                    <Reveal>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-8 h-0.5 bg-yellow-400 rounded-full" />
                            <span className="text-yellow-400 text-xs font-bold tracking-widest uppercase">Hợp tác quảng cáo</span>
                        </div>
                    </Reveal>

                    <Reveal delay={60}>
                        <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-2xl">
                            MoxiMovie tiếp cận hàng nghìn người dùng yêu thích phim ảnh mỗi ngày.
                            Chúng tôi cung cấp các gói quảng cáo linh hoạt cho cá nhân và doanh nghiệp.
                        </p>
                    </Reveal>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {adPackages.map((pkg, i) => (
                            <Reveal key={i} delay={i * 60}>
                                <div className="group relative rounded-xl border border-white/8 bg-white/2 hover:border-yellow-400/25 hover:bg-yellow-400/3 p-5 transition-all duration-400 overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 rounded-xl" />
                                    <div className="relative">
                                        <span className="text-2xl mb-3 block">{pkg.icon}</span>
                                        <h3 className="text-white font-bold text-sm mb-2">{pkg.name}</h3>
                                        <p className="text-gray-500 text-xs leading-relaxed group-hover:text-gray-400 transition-colors duration-300">{pkg.desc}</p>
                                    </div>
                                </div>
                            </Reveal>
                        ))}
                    </div>

                    {/* Info cần cung cấp */}
                    <Reveal delay={100}>
                        <div className="mt-6 rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-6">
                            <div className="flex items-start gap-3">
                                <div className="shrink-0 w-8 h-8 rounded-lg bg-yellow-400/15 flex items-center justify-center text-yellow-400 mt-0.5">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-yellow-300 font-semibold text-sm mb-2">Khi liên hệ quảng cáo, vui lòng cung cấp:</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                        {["Loại quảng cáo mong muốn", "Ngân sách dự kiến", "Thời gian triển khai", "Tệp khách hàng mục tiêu"].map((item, i) => (
                                            <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                                                <span className="w-1 h-1 rounded-full bg-yellow-400 shrink-0" />
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Reveal>
                </section>

                {/* ── BÁO LỖI ── */}
                <section className="px-4 pb-12 max-w-4xl mx-auto">
                    <Reveal>
                        <div className="relative rounded-2xl border border-white/8 bg-white/2 p-7 overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />
                            <div className="relative flex flex-col sm:flex-row items-start gap-5">
                                <div className="shrink-0 w-12 h-12 rounded-xl border border-white/8 bg-white/5 flex items-center justify-center text-red-400">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-5 h-0.5 bg-red-400 rounded-full" />
                                        <span className="text-red-400 text-xs font-bold tracking-widest uppercase">Báo lỗi kỹ thuật</span>
                                    </div>
                                    <h3 className="text-white font-bold text-base mb-2">Gặp sự cố khi xem phim?</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed mb-4">
                                        Nếu bạn phát hiện lỗi phát video, link hỏng hay bất kỳ sự cố nào, hãy gửi
                                        mô tả chi tiết đến email bên dưới. Chúng tôi sẽ xử lý trong thời gian sớm nhất.
                                    </p>
                                    <a href="mailto:support@moximovie.com"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-red-400/30 hover:bg-red-400/5 transition-all duration-300 text-sm text-white font-medium group">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-red-400">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                        </svg>
                                        support@moximovie.com
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-gray-500 group-hover:translate-x-0.5 transition-transform duration-300">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </Reveal>
                </section>

                {/* ── CẢM ƠN ── */}
                <section className="px-4 pb-16 max-w-4xl mx-auto">
                    <Reveal>
                        <div className="relative rounded-3xl border border-white/8 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-400/6 via-transparent to-yellow-400/4" />
                            <div className="absolute top-0 right-0 w-56 h-56 bg-green-400/5 rounded-full blur-3xl pointer-events-none" />

                            <div className="relative p-10 sm:p-14 text-center">
                                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl border border-white/10 bg-white/5 mb-5">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-green-400">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                                    </svg>
                                </div>

                                <h2 className="text-2xl sm:text-3xl font-black mb-3">
                                    Cảm ơn vì đã đồng hành<br />
                                    <span className="text-green-400">cùng MoxiMovie</span>
                                </h2>

                                <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
                                    Mọi góp ý và phản hồi đều giúp chúng tôi trở nên tốt hơn mỗi ngày.
                                    Chúc bạn những giờ giải trí thật vui! 🎬
                                </p>
                            </div>
                        </div>
                    </Reveal>
                </section>
            </div>

            <style>{`
                @keyframes fadeDown {
                    from { opacity: 0; transform: translateY(-14px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </>
    );
}