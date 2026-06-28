"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Breadcrumb from "@/components/frontend/Breadcrumb";
import SEO from "@/components/frontend/SEO";
import { blogList } from "@/data/blog";

// ── Reveal on scroll ──
function useReveal() {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
            { threshold: 0.1 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    return { ref, visible };
}

function Reveal({ children, delay = 0, className = "" }: {
    children: React.ReactNode; delay?: number; className?: string;
}) {
    const { ref, visible } = useReveal();
    return (
        <div ref={ref} className={className} style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(24px)",
            transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
        }}>
            {children}
        </div>
    );
}

export default function BlogPage() {
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    const featured = blogList[0];
    const rest = blogList.slice(1);

    return (
        <>
            <SEO
                title="Bài Viết & Review Phim Hay – Tin Tức Điện Ảnh | MoxiMovie"
                description="Tổng hợp bài review phim, phân tích nội dung, giải thích cái kết và tin tức điện ảnh mới nhất tại MoxiMovie."
                canonical="https://www.moximovie.click/bai-viet"
                type="website"
            />

            <Breadcrumb />

            <div className="w-full text-white overflow-hidden">

                {/* ── HEADER ── */}
                <div className="px-4 lg:px-5 xl:px-6 pt-6 pb-8 max-w-[1400px] mx-auto">
                    <div className="flex items-center gap-3 mb-2" style={{ animation: "fadeDown 0.5s ease both" }}>
                        <div className="w-7 h-0.5 bg-green-400 rounded-full" />
                        <span className="text-green-400 text-xs font-bold tracking-widest uppercase">Điện ảnh</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight" style={{ animation: "fadeDown 0.5s ease 0.08s both" }}>
                        Bài viết & Review phim
                    </h1>
                    <p className="text-gray-500 text-sm mt-2" style={{ animation: "fadeDown 0.5s ease 0.15s both" }}>
                        Phân tích, review và tin tức điện ảnh cập nhật liên tục
                    </p>
                </div>

                <div className="px-4 lg:px-5 xl:px-6 max-w-[1400px] mx-auto pb-16 space-y-10">

                    {/* ── FEATURED (bài đầu tiên) ── */}
                    {featured && (
                        <Reveal>
                            <Link href={`/bai-viet/${featured.slug}`} className="group block">
                                <div className="relative rounded-2xl overflow-hidden border border-white/8 hover:border-white/20 transition-all duration-500 bg-[rgb(16,18,26)]">
                                    <div className="flex flex-col lg:flex-row">
                                        {/* Thumbnail lớn */}
                                        <div className="relative lg:w-[55%] aspect-[16/9] lg:aspect-auto overflow-hidden flex-shrink-0">
                                            <img
                                                src={featured.thumbnail}
                                                alt={featured.title}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                            {/* Gradient overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[rgb(16,18,26)] hidden lg:block" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-[rgb(16,18,26)] via-transparent to-transparent lg:hidden" />

                                            {/* Badge nổi trên ảnh */}
                                            <div className="absolute top-4 left-4">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-400 text-black text-[11px] font-bold tracking-wide">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-black/40" />
                                                    Nổi bật
                                                </span>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 p-7 lg:p-10 flex flex-col justify-center">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="w-5 h-0.5 bg-green-400 rounded-full" />
                                                <span className="text-green-400 text-[11px] font-bold tracking-widest uppercase">Review</span>
                                            </div>

                                            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black leading-tight text-white group-hover:text-green-300 transition-colors duration-300 line-clamp-3 mb-4">
                                                {featured.title}
                                            </h2>

                                            <p className="text-gray-400 text-sm leading-relaxed line-clamp-3 mb-6">
                                                {featured.description}
                                            </p>

                                            <div className="flex items-center gap-2 text-green-400 text-sm font-semibold group/btn">
                                                Đọc bài viết
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </Reveal>
                    )}

                    {/* ── GRID CÁC BÀI CÒN LẠI ── */}
                    {rest.length > 0 && (
                        <div>
                            <Reveal>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-6 h-0.5 bg-white/20 rounded-full" />
                                    <span className="text-gray-500 text-xs font-bold tracking-widest uppercase">Tất cả bài viết</span>
                                    <div className="flex-1 h-px bg-white/5" />
                                    <span className="text-gray-600 text-xs">{rest.length} bài</span>
                                </div>
                            </Reveal>

                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                {rest.map((blog, i) => (
                                    <Reveal key={blog.id} delay={i * 55}>
                                        <Link href={`/bai-viet/${blog.slug}`} className="group block h-full">
                                            <div className="h-full flex flex-col rounded-xl overflow-hidden border border-white/8 bg-[rgb(16,18,26)] hover:border-white/18 hover:bg-[rgb(18,20,28)] transition-all duration-400">

                                                {/* Thumbnail */}
                                                <div className="relative w-full aspect-[16/9] overflow-hidden flex-shrink-0">
                                                    <img
                                                        src={blog.thumbnail}
                                                        alt={blog.title}
                                                        className="w-full h-full object-cover transition-transform duration-600 group-hover:scale-105"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-[rgb(16,18,26)] via-transparent to-transparent opacity-60" />
                                                </div>

                                                {/* Content */}
                                                <div className="flex flex-col flex-1 p-5">
                                                    {/* Tag */}
                                                    <div className="flex items-center gap-1.5 mb-3">
                                                        <div className="w-3 h-0.5 bg-green-400/60 rounded-full" />
                                                        <span className="text-green-400/70 text-[10px] font-bold tracking-widest uppercase">Review</span>
                                                    </div>

                                                    {/* Title */}
                                                    <h2 className="text-[14px] sm:text-[15px] font-bold text-gray-100 line-clamp-2 group-hover:text-white transition-colors duration-300 leading-snug mb-2">
                                                        {blog.title}
                                                    </h2>

                                                    {/* Description */}
                                                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed flex-1 group-hover:text-gray-400 transition-colors duration-300">
                                                        {blog.description}
                                                    </p>

                                                    {/* Footer */}
                                                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                                                        <span className="text-[11px] text-gray-600 font-medium">MoxiMovie</span>
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-400 group-hover:text-green-400 transition-colors duration-300">
                                                            Đọc tiếp
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-300">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                                                            </svg>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </Reveal>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty state */}
                    {blogList.length === 0 && (
                        <Reveal>
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <div className="w-16 h-16 rounded-2xl border border-white/8 bg-white/3 flex items-center justify-center mb-4 text-2xl">
                                    📝
                                </div>
                                <p className="text-gray-500 text-sm">Chưa có bài viết nào</p>
                                <p className="text-gray-600 text-xs mt-1">Quay lại sau nhé!</p>
                            </div>
                        </Reveal>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes fadeDown {
                    from { opacity: 0; transform: translateY(-12px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </>
    );
}