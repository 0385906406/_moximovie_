import Link from "next/link";
import { AlertTriangle, Copyright, ExternalLink, Megaphone } from "lucide-react";
import SEO from "@/components/frontend/SEO";
import { SITE_URL } from "@/lib/movieImage";

/* Kênh liên hệ chính (trang Facebook đang dùng ở chân trang) */
const FACEBOOK = "https://www.facebook.com/tiemnhonhaDahee";

const TOPICS = [
    { icon: <Megaphone size={20} />, title: "Hợp tác quảng cáo", desc: "Đặt banner, giới thiệu sản phẩm/dịch vụ tới người xem MoxiMovie." },
    { icon: <AlertTriangle size={20} />, title: "Báo lỗi phim", desc: "Phim không xem được, sai tập, thiếu phụ đề — gửi kèm tên phim và tập." },
    { icon: <Copyright size={20} />, title: "Bản quyền", desc: "Chủ sở hữu muốn gỡ nội dung: gửi link trang phim và giấy tờ chứng minh." },
];

export default function ContactPage() {
    return (
        <div className="relative z-10 max-w-4xl mx-auto px-4 pt-28 pb-16 text-white">
            <SEO
                title="Liên hệ & Quảng cáo | MoxiMovie"
                description="Liên hệ MoxiMovie: hợp tác quảng cáo, báo lỗi phim, yêu cầu về bản quyền."
                canonical={`${SITE_URL}/lien-he-quang-cao`}
            />

            <p className="text-[11px] uppercase tracking-[0.25em] text-[#22d3a5] font-semibold">Liên hệ</p>
            <h1 className="mt-2 text-3xl sm:text-4xl font-bold">Liên hệ &amp; Quảng cáo</h1>
            <p className="mt-4 text-[15px] leading-relaxed text-white/65">
                Nhắn tin cho chúng tôi qua trang Facebook — thường trả lời trong 24 giờ.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {TOPICS.map(t => (
                    <div key={t.title} className="rounded-2xl p-5 bg-white/[0.03] border border-white/[0.07]">
                        <span className="text-[#22d3a5]">{t.icon}</span>
                        <h2 className="mt-2 text-[15px] font-semibold">{t.title}</h2>
                        <p className="mt-1 text-[13px] text-white/55 leading-relaxed">{t.desc}</p>
                    </div>
                ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
                <a href={FACEBOOK} target="_blank" rel="noopener noreferrer"
                    className="h-12 px-6 rounded-xl flex items-center gap-2 text-[14px] font-semibold bg-[#1877f2] text-white hover:brightness-110">
                    Nhắn tin qua Facebook <ExternalLink size={15} />
                </a>
                <Link href="/gioi-thieu" className="h-12 px-5 rounded-xl flex items-center text-[14px] text-white/75 bg-white/[0.06] border border-white/10 hover:bg-white/10">
                    Về MoxiMovie
                </Link>
            </div>
        </div>
    );
}
