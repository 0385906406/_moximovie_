"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Home, Clapperboard, Tv, LayoutGrid, Search } from "lucide-react";

/* Thanh điều hướng đáy kiểu ứng dụng điện thoại. Chỉ hiện dưới 768px (md:hidden).
   Có safe-area để không bị thanh cử chỉ của iPhone/Android che. */
const TABS = [
    { href: "/phimhay", label: "Trang chủ", Icon: Home },
    { href: "/phim-le", label: "Phim lẻ", Icon: Clapperboard },
    { href: "/phim-bo", label: "Phim bộ", Icon: Tv },
    { href: "/loc-phim", label: "Thể loại", Icon: LayoutGrid },
    { href: "/tim-kiem", label: "Tìm kiếm", Icon: Search },
] as const;

export default function MobileTabBar() {
    const pathname = usePathname();
    /* Render qua portal lên body để luôn dính đáy màn hình, không bị phần tử cha có transform/filter làm lệch */
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;

    return createPortal(
        <nav
            aria-label="Điều hướng chính"
            className="md:hidden fixed inset-x-0 bottom-0 z-[80]"
            style={{
                background: "rgba(14,16,24,0.92)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                paddingBottom: "env(safe-area-inset-bottom)",
            }}
        >
            <ul className="grid grid-cols-5">
                {TABS.map(({ href, label, Icon }) => {
                    const active = pathname === href;
                    return (
                        <li key={href}>
                            <Link
                                href={href}
                                aria-current={active ? "page" : undefined}
                                className="relative flex flex-col items-center justify-center gap-1 h-[60px] text-[10.5px] font-semibold transition-colors"
                                style={{ color: active ? "#22d3a5" : "rgba(255,255,255,0.5)" }}
                            >
                                {active && (
                                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-b-full"
                                        style={{ background: "#22d3a5", boxShadow: "0 0 10px rgba(34,211,165,0.7)" }} />
                                )}
                                <Icon size={20} strokeWidth={active ? 2.4 : 2} />
                                <span>{label}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    , document.body);
}
