import Link from "next/link";
import { Film, MessageCircle, MonitorSmartphone, ShieldCheck, Sparkles, Users } from "lucide-react";
import SEO from "@/components/frontend/SEO";
import { SITE_URL } from "@/lib/movieImage";

const FEATURES = [
    { icon: <Film size={20} />, title: "Kho phim cập nhật mỗi ngày", desc: "Phim lẻ, phim bộ, hoạt hình, phim chiếu rạp — Vietsub, thuyết minh, lồng tiếng." },
    { icon: <Users size={20} />, title: "Phòng xem chung", desc: "Tạo phòng, gửi mã cho bạn bè: phim phát cùng lúc, vừa xem vừa trò chuyện." },
    { icon: <Sparkles size={20} />, title: "Trình phát riêng", desc: "Chọn chất lượng, xem tiếp chỗ đang dừng, ánh sáng nền theo khung hình." },
    { icon: <MonitorSmartphone size={20} />, title: "Mọi thiết bị", desc: "Máy tính, điện thoại, máy tính bảng — giao diện tối ưu cho từng màn hình." },
];

export default function AboutPage() {
    return (
        <div className="relative z-10 max-w-4xl mx-auto px-4 pt-28 pb-16 text-white">
            <SEO
                title="Giới thiệu | MoxiMovie"
                description="MoxiMovie — trang xem phim online Vietsub HD, cập nhật phim mới mỗi ngày, có phòng xem chung với bạn bè."
                canonical={`${SITE_URL}/gioi-thieu`}
            />

            <p className="text-[11px] uppercase tracking-[0.25em] text-[#22d3a5] font-semibold">Về chúng tôi</p>
            <h1 className="mt-2 text-3xl sm:text-4xl font-bold">Giới thiệu MoxiMovie</h1>
            <p className="mt-4 text-[15px] leading-relaxed text-white/65">
                MoxiMovie là trang xem phim online miễn phí dành cho người Việt: giao diện gọn gàng, ít quảng cáo,
                cập nhật phim mới hằng ngày và có thể xem cùng bạn bè ở bất cứ đâu.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {FEATURES.map(f => (
                    <div key={f.title} className="rounded-2xl p-5 bg-white/[0.03] border border-white/[0.07]">
                        <span className="text-[#22d3a5]">{f.icon}</span>
                        <h2 className="mt-2 text-[15px] font-semibold">{f.title}</h2>
                        <p className="mt-1 text-[13px] text-white/55 leading-relaxed">{f.desc}</p>
                    </div>
                ))}
            </div>

            <section className="mt-10 rounded-2xl p-6 bg-[#1f2230] border border-white/[0.07]">
                <h2 className="flex items-center gap-2 text-lg font-semibold"><ShieldCheck size={20} className="text-[#f6d46b]" /> Nguồn nội dung &amp; bản quyền</h2>
                <p className="mt-3 text-[14px] leading-relaxed text-white/65">
                    MoxiMovie không lưu trữ phim trên máy chủ của mình. Toàn bộ nội dung được tổng hợp từ các nguồn
                    công khai trên Internet; thông tin phim, diễn viên, ảnh và trailer lấy từ TMDB.
                </p>
                <p className="mt-3 text-[14px] leading-relaxed text-white/65">
                    Nếu bạn là chủ sở hữu bản quyền và muốn gỡ một nội dung, hãy liên hệ — chúng tôi sẽ xử lý sớm nhất có thể.
                </p>
                <Link href="/lien-he-quang-cao" className="mt-4 inline-flex items-center gap-2 h-10 px-4 rounded-xl text-[13.5px] font-semibold bg-[#22d3a5] text-[#041a11] hover:brightness-110">
                    <MessageCircle size={16} /> Liên hệ với chúng tôi
                </Link>
            </section>
        </div>
    );
}
