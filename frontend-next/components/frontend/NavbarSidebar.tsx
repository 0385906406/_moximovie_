"use client";

import Link from "next/link"
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { NavbarSidebarProps } from "@/types/navbar";
import { useEffect, useState } from "react";
import { categories } from "@/data/category";
import { countries } from "@/data/country";
import {
    Film,
    Tv2,
    Laugh,
    Tag,
    Globe,
    Info,
    Phone,
    ChevronDown,
    // User,
    // LogOut,
    // UserCircle2,
    Newspaper,
} from "lucide-react";

/* ── icon map cho từng route ── */
const ICON_MAP: Record<string, React.ReactNode> = {
    "/phim-le":            <Film size={16} />,
    "/phim-bo":            <Tv2 size={16} />,
    "/hoat-hinh":          <Laugh size={16} />,
    "/the-loai":           <Tag size={16} />,
    "/quoc-gia":           <Globe size={16} />,
    "/tim-kiem":           <Laugh size={16} />,
    "/bai-viet":           <Newspaper size={16} />,
    "/gioi-thieu":         <Info size={16} />,
    "/lien-he":            <Phone size={16} />,
    "/lien-he-quang-cao":  <Phone size={16} />,
};

/* ── Sub-menu accordion ── */
const AccordionMenu = ({
    label,
    icon,
    isOpen,
    onToggle,
    children,
}: {
    label: string;
    icon?: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}) => (
    <div>
        <button
            onClick={onToggle}
            className={cn(
                "w-full flex items-center justify-between px-5 py-3.5 text-[13.5px] font-semibold tracking-wide transition-colors duration-150",
                isOpen
                    ? "text-green-400 bg-white/5"
                    : "text-white/70 hover:text-white hover:bg-white/5"
            )}
        >
            <span className="flex items-center gap-3">
                <span className={cn("transition-colors", isOpen ? "text-green-400" : "text-white/40")}>
                    {icon}
                </span>
                {label}
            </span>
            <ChevronDown
                size={14}
                className={cn(
                    "transition-transform duration-200 text-white/40",
                    isOpen && "rotate-180 text-green-400"
                )}
            />
        </button>

        {/* Accordion body */}
        <div
            className={cn(
                "overflow-hidden transition-all duration-250",
                isOpen ? "max-h-[400px]" : "max-h-0"
            )}
        >
            <div className="overflow-y-auto overscroll-contain max-h-[380px] bg-black/30">
                {children}
            </div>
        </div>
    </div>
);

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
const NavbarSidebar = ({
    items,
    // user,
    open,
    onOpenChange,
}: NavbarSidebarProps) => {
    const pathname = usePathname();

    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isCountryOpen,  setIsCountryOpen]  = useState(false);
    // const [isUserOpen,     setIsUserOpen]     = useState(false);

    /* close all when sidebar closes */
    useEffect(() => {
        if (!open) {
            setIsCategoryOpen(false);
            setIsCountryOpen(false);
            // setIsUserOpen(false);
        }
    }, [open]);

    const close = () => onOpenChange(false);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="left"
                className="p-0 w-[300px] border-r border-white/10 bg-[#0a0d13] text-white flex flex-col"
            >
                {/* ── Header ── */}
                <SheetHeader className="px-5 py-4 border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-3">
                        {/* decorative accent bar */}
                        <div className="w-1 h-7 rounded-full bg-gradient-to-b from-green-400 to-green-600" />
                        <SheetTitle className="text-white text-[17px] font-bold tracking-tight">
                            Menu
                        </SheetTitle>
                    </div>
                </SheetHeader>

                {/* ── Nav items ── */}
                <ScrollArea className="flex-1 overflow-y-auto">
                    <div className="py-2">
                        {items.map((item) => {
                            const isActive = pathname === item.to;
                            const icon = ICON_MAP[item.to];

                            /* Thể loại */
                            if (item.to === "/the-loai") {
                                return (
                                    <AccordionMenu
                                        key={item.to}
                                        label="Thể Loại"
                                        icon={<Tag size={16} />}
                                        isOpen={isCategoryOpen}
                                        onToggle={() => setIsCategoryOpen(p => !p)}
                                    >
                                        <div className="grid grid-cols-2 gap-px p-2">
                                            {categories.map((cat) => (
                                                <Link
                                                    key={cat.value}
                                                    href={`/loc-phim?category=${cat.value}`}
                                                    onClick={close}
                                                    className="px-3 py-2 text-[12.5px] text-white/60 hover:text-green-400 hover:bg-white/5 rounded-[5px] transition-colors truncate"
                                                >
                                                    {cat.label}
                                                </Link>
                                            ))}
                                        </div>
                                    </AccordionMenu>
                                );
                            }

                            /* Quốc gia */
                            if (item.to === "/quoc-gia") {
                                return (
                                    <AccordionMenu
                                        key={item.to}
                                        label="Quốc Gia"
                                        icon={<Globe size={16} />}
                                        isOpen={isCountryOpen}
                                        onToggle={() => setIsCountryOpen(p => !p)}
                                    >
                                        <div className="grid grid-cols-2 gap-px p-2">
                                            {countries.map((cat) => (
                                                <Link
                                                    key={cat.value}
                                                    href={`/loc-phim?country=${cat.value}`}
                                                    onClick={close}
                                                    className="px-3 py-2 text-[12.5px] text-white/60 hover:text-green-400 hover:bg-white/5 rounded-[5px] transition-colors truncate"
                                                >
                                                    {cat.label}
                                                </Link>
                                            ))}
                                        </div>
                                    </AccordionMenu>
                                );
                            }

                            /* Normal link */
                            return (
                                <Link
                                    key={item.to}
                                    href={item.to}
                                    onClick={close}
                                    className={cn(
                                        "flex items-center gap-3 px-5 py-3.5 text-[13.5px] font-semibold tracking-wide transition-colors duration-150",
                                        isActive
                                            ? "text-green-400 bg-white/5 border-l-2 border-green-400"
                                            : "text-white/70 hover:text-white hover:bg-white/5 border-l-2 border-transparent"
                                    )}
                                >
                                    <span className={cn("transition-colors", isActive ? "text-green-400" : "text-white/40")}>
                                        {icon}
                                    </span>
                                    {item.children}
                                </Link>
                            );
                        })}
                    </div>

                    {/* ── Divider ── */}
                    <div className="mx-5 border-t border-white/10 my-1" />

                    {/* ── User block ── */}
                    {/* <div className="py-2">
                        {user ? (
                            <>
                                <AccordionMenu
                                    label={user.displayName ?? "Thành viên"}
                                    icon={<UserCircle2 size={16} />}
                                    isOpen={isUserOpen}
                                    onToggle={() => setIsUserOpen(p => !p)}
                                >
                                    <div className="px-3 pb-2 pt-1 space-y-0.5">
                                        <Link href="/profile"
                                            onClick={close}
                                            className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-white/60 hover:text-white hover:bg-white/5 rounded-[5px] transition-colors"
                                        >
                                            <User size={14} />
                                            Thông tin tài khoản
                                        </Link>
                                        <button
                                            onClick={close}
                                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-red-400 hover:bg-white/5 rounded-[5px] transition-colors text-left"
                                        >
                                            <LogOut size={14} />
                                            Đăng xuất
                                        </button>
                                    </div>
                                </AccordionMenu>
                            </>
                        ) : (
                            <Link href="/signin"
                                onClick={close}
                                className="flex items-center gap-3 px-5 py-3.5 text-[13.5px] font-semibold text-white/70 hover:text-white hover:bg-white/5 border-l-2 border-transparent transition-colors"
                            >
                                <span className="text-white/40"><User size={16} /></span>
                                Thành Viên
                            </Link>
                        )}
                    </div> */}

                    {/* ── Footer ── */}
                    <div className="px-5 py-4 mt-2">
                        <div className="text-[11px] text-white/20 text-center tracking-widest uppercase">
                            © MoxiMovie
                        </div>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
};

export default NavbarSidebar;