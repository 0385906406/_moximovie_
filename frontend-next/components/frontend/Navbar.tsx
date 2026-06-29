"use client";

import Link from "next/link"
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
const theme = process.env.NEXT_PUBLIC_ASSET_THEME || 'Default';
import { MenuIcon, Search, ChevronDown, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import NavbarSidebar from "./NavbarSidebar";

import type { NavbarItem, NavbarItemProps } from "@/types/navbar";
import { movieService } from "@/services/movieService";
import type { Movie } from "@/types/movie";
import { categories } from "@/data/category";
import { countries } from "@/data/country";
import { ThreeDot } from "react-loading-indicators";

const NavbarItem = ({ to, children, isActive }: NavbarItemProps) => (
    <Button
        asChild
        variant="link"
        className={cn(
            "h-auto bg-transparent rounded-full px-3 text-[13px] font-medium text-white/80 hover:text-green-300 transition-colors duration-200",
            isActive && "text-green-300"
        )}
    >
        <Link href={to}>{children}</Link>
    </Button>
);

const navbarItems: NavbarItem[] = [
    { to: "/phim-le",   children: "Phim Lẻ" },
    { to: "/phim-bo",   children: "Phim Bộ" },
    { to: "/hoat-hinh", children: "Hoạt Hình" },
    { to: "/the-loai",  children: "Thể loại ▾" },
    { to: "/quoc-gia",  children: "Quốc gia ▾" },
];

const DEBOUNCE_MS = 500;

const NAV_LINKS = [
    { to: "/phim-le",   label: "Phim Lẻ" },
    { to: "/phim-bo",   label: "Phim Bộ" },
    { to: "/hoat-hinh", label: "Hoạt Hình" },
];

const Navbar = () => {
    const pathname = usePathname();
    const logoPath = `/${theme}/logo.png`;

    const searchRef        = useRef<HTMLDivElement | null>(null);
    const categoryMenuRef  = useRef<HTMLDivElement | null>(null);
    const countriesMenuRef = useRef<HTMLDivElement | null>(null);
    const debounceTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
    const mobileDebounce   = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [visible,            setVisible]            = useState(true);
    const [atTop,              setAtTop]              = useState(true);
    const [query,              setQuery]              = useState("");
    const [dataSearch,         setDataSearch]         = useState<Movie[]>([]);
    const [loading,            setLoading]            = useState(false);
    const [isSearchOpen,       setIsSearchOpen]       = useState(false);
    const [isCategoryOpen,     setIsCategoryOpen]     = useState(false);
    const [isCountriesOpen,    setIsCountriesOpen]    = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const [isSidebarOpen,      setIsSidebarOpen]      = useState(false);

    const router = useRouter();

    /* ── Scroll ── */
    useEffect(() => {
        const fn = () => { setVisible(true); setAtTop(window.scrollY < 50); };
        window.addEventListener("scroll", fn);
        return () => window.removeEventListener("scroll", fn);
    }, []);

    /* ── Khóa body scroll khi mobile search overlay mở ── */
    useEffect(() => {
        document.body.style.overflow = isMobileSearchOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [isMobileSearchOpen]);

    /* ── Click outside ── */
    useEffect(() => {
        if (!isSearchOpen && !isCategoryOpen && !isCountriesOpen) return;
        const fn = (e: MouseEvent) => {
            const t = e.target as Node;
            if (isSearchOpen    && searchRef.current        && !searchRef.current.contains(t))        setIsSearchOpen(false);
            if (isCategoryOpen  && categoryMenuRef.current  && !categoryMenuRef.current.contains(t))  setIsCategoryOpen(false);
            if (isCountriesOpen && countriesMenuRef.current && !countriesMenuRef.current.contains(t)) setIsCountriesOpen(false);
        };
        document.addEventListener("mousedown", fn);
        return () => document.removeEventListener("mousedown", fn);
    }, [isSearchOpen, isCategoryOpen, isCountriesOpen]);

    /* ── Debounce search desktop ── */
    useEffect(() => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        if (!query.trim()) { setDataSearch([]); setIsSearchOpen(false); return; }
        debounceTimer.current = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await movieService.dataSearch(query);
                setDataSearch(res.items || []);
                setIsSearchOpen(true);
            } finally { setLoading(false); }
        }, DEBOUNCE_MS);
        return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
    }, [query]);

    /* ── Debounce search mobile ── */
    const handleMobileQueryChange = (value: string) => {
        setQuery(value);
        if (mobileDebounce.current) clearTimeout(mobileDebounce.current);
        if (!value.trim()) { setDataSearch([]); return; }
        mobileDebounce.current = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await movieService.dataSearch(value);
                setDataSearch(res.items || []);
            } finally { setLoading(false); }
        }, DEBOUNCE_MS);
    };

    const goHome = () => {
        if (pathname !== "/phimhay") {
            router.push("/phimhay");
            setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: "smooth" }), 50);
        } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const goToSearchPage = (q: string) => {
        if (!q.trim()) return;
        setIsSearchOpen(false);
        setIsMobileSearchOpen(false);
        router.push(`/tim-kiem?keyword=${encodeURIComponent(q.trim())}`);
    };

    /* ── Search result item ── */
    const SearchItem = ({ item, onClick }: { item: Movie; onClick: () => void }) => (
        <Link href={`/phim/${item.slug}`}
            onClick={onClick}
            className="flex w-full items-center gap-3 px-3 py-2.5 hover:bg-white/[0.05] transition-colors cursor-pointer group"
        >
            <img
                src={`https://phimimg.com/${item.poster_url}`}
                alt={item.name}
                className="w-[44px] h-[60px] object-cover rounded-md flex-shrink-0 opacity-90 group-hover:opacity-100 transition-opacity"
            />
            <div className="flex flex-col overflow-hidden gap-0.5 flex-1">
                <h4 className="truncate text-white/90 text-[13px] font-medium leading-snug"
                    dangerouslySetInnerHTML={{ __html: item.name ?? "" }} />
                <div className="text-white/40 text-[11px] truncate"
                    dangerouslySetInnerHTML={{ __html: item.origin_name ?? "" }} />
                <div className="flex gap-2 items-center mt-0.5">
                    {item.year && <span className="text-[10px] text-white/30">{item.year}</span>}
                    {item.quality && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-[#22d3a5]/30 text-[#22d3a5] bg-[#22d3a5]/8">
                            {item.quality}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );

    const ViewAllBtn = ({ q }: { q: string }) => (
        <div className="border-t border-white/[0.07] px-3 py-2.5">
            <button
                onClick={() => goToSearchPage(q)}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[12px] font-semibold text-[#22d3a5] hover:bg-[#22d3a5]/8 transition-colors"
            >
                <Search size={12} />
                Xem tất cả kết quả cho &quot;{q}&quot;
            </button>
        </div>
    );

    /* ══════════════════════════════════════════════════════════
       RENDER
    ══════════════════════════════════════════════════════════ */
    return (
        <>
            <style>{`
                /* Nav link indicator */
                .nb-navlink {
                    position: relative;
                    padding-bottom: 2px;
                }
                .nb-navlink::after {
                    content: '';
                    position: absolute;
                    bottom: -3px; left: 50%; right: 50%;
                    height: 2px; border-radius: 99px;
                    background: linear-gradient(90deg, #22d3a5, #38bdf8);
                    transition: left 0.28s cubic-bezier(0.16,1,0.3,1), right 0.28s cubic-bezier(0.16,1,0.3,1);
                    opacity: 0;
                }
                .nb-navlink:hover::after { left: 10px; right: 10px; opacity: 0.7; }
                .nb-navlink.nb-active::after { left: 10px; right: 10px; opacity: 1; }

                /* Dropdown open animation */
                .nb-dropdown {
                    animation: nbDropIn 0.22s cubic-bezier(0.16,1,0.3,1);
                    transform-origin: top center;
                }
                @keyframes nbDropIn {
                    from { opacity: 0; transform: translateY(-6px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }

                /* Search focus ring */
                .nb-search-input:focus {
                    box-shadow: 0 0 0 1px rgba(34,211,165,0.45), 0 0 18px rgba(34,211,165,0.12);
                }

                /* Mobile search slide in */
                .nb-mobile-search {
                    animation: nbSearchIn 0.22s cubic-bezier(0.16,1,0.3,1);
                }
                @keyframes nbSearchIn {
                    from { opacity: 0; transform: translateY(-8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            <nav className={cn(
                "fixed inset-x-0 top-8 z-40 transition-all duration-300",
                !visible && "-translate-y-full",
                atTop
                    ? "bg-gradient-to-b from-black/75 via-black/30 to-transparent"
                    : "bg-[#05070b]/90 backdrop-blur-2xl border-b border-white/[0.06] shadow-[0_4px_40px_rgba(0,0,0,0.55)]"
            )}>
                <div className="mx-auto flex h-16 max-w-8xl items-center justify-between px-3 lg:px-5 xl:px-6">

                    {/* ── Left: Logo ── */}
                    <div className="flex flex-1 items-center">
                        <button onClick={goHome} className="flex items-center gap-2 cursor-pointer shrink-0 group">
                            <img
                                src={logoPath}
                                alt="logo"
                                className="h-8 w-auto object-contain transition-opacity duration-200 group-hover:opacity-80"
                                style={{ filter: "drop-shadow(0 0 10px rgba(34,211,165,0.25))" }}
                            />
                        </button>
                    </div>

                    {/* ── Sidebar mobile ── */}
                    <NavbarSidebar
                        items={navbarItems}
                        user={null}
                        open={isSidebarOpen}
                        onOpenChange={setIsSidebarOpen}
                    />

                    {/* ── Center: Menu desktop ── */}
                    <div className="hidden flex-1 items-center justify-center xl:flex">
                        <div className="flex items-center gap-1">
                            {NAV_LINKS.map(({ to, label }) => (
                                <Link
                                    key={to}
                                    href={to}
                                    className={cn(
                                        "nb-navlink whitespace-nowrap px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200",
                                        pathname === to
                                            ? "nb-active text-[#22d3a5]"
                                            : "text-white/70 hover:text-white hover:bg-white/[0.05]"
                                    )}
                                >
                                    {label}
                                </Link>
                            ))}

                            {/* Thể loại */}
                            <div ref={categoryMenuRef} className="relative">
                                <button
                                    onClick={() => { setIsCategoryOpen(p => !p); setIsCountriesOpen(false); }}
                                    className={cn(
                                        "flex items-center gap-1.5 whitespace-nowrap px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200",
                                        isCategoryOpen
                                            ? "text-[#22d3a5] bg-[#22d3a5]/10"
                                            : "text-white/70 hover:text-white hover:bg-white/[0.05]"
                                    )}
                                >
                                    Thể Loại
                                    <ChevronDown size={13} className={cn("transition-transform duration-200", isCategoryOpen && "rotate-180")} />
                                </button>
                                {isCategoryOpen && (
                                    <div className="nb-dropdown absolute top-full left-1/2 -translate-x-1/2 mt-3 w-72 rounded-2xl border border-white/[0.08] bg-[#0a0d14]/96 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden z-50">
                                        <div className="px-4 py-2.5 border-b border-white/[0.06]">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#22d3a5]/70">Thể Loại</span>
                                        </div>
                                        <div className="p-2 grid grid-cols-2 gap-0.5">
                                            {categories.map((cat, i) => (
                                                <Link key={i} href={`/loc-phim?category=${cat.value}`}
                                                    onClick={() => setIsCategoryOpen(false)}
                                                    className="px-3 py-2 rounded-xl text-[12.5px] text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors">
                                                    {cat.label}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Quốc gia */}
                            <div ref={countriesMenuRef} className="relative">
                                <button
                                    onClick={() => { setIsCountriesOpen(p => !p); setIsCategoryOpen(false); }}
                                    className={cn(
                                        "flex items-center gap-1.5 whitespace-nowrap px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200",
                                        isCountriesOpen
                                            ? "text-[#22d3a5] bg-[#22d3a5]/10"
                                            : "text-white/70 hover:text-white hover:bg-white/[0.05]"
                                    )}
                                >
                                    Quốc Gia
                                    <ChevronDown size={13} className={cn("transition-transform duration-200", isCountriesOpen && "rotate-180")} />
                                </button>
                                {isCountriesOpen && (
                                    <div className="nb-dropdown absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[400px] rounded-2xl border border-white/[0.08] bg-[#0a0d14]/96 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden z-50">
                                        <div className="px-4 py-2.5 border-b border-white/[0.06]">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#22d3a5]/70">Quốc Gia</span>
                                        </div>
                                        <div className="p-2 grid grid-cols-3 gap-0.5">
                                            {countries.map((cat, i) => (
                                                <Link key={i} href={`/loc-phim?country=${cat.value}`}
                                                    onClick={() => setIsCountriesOpen(false)}
                                                    className="px-3 py-2 rounded-xl text-[12.5px] text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors">
                                                    {cat.label}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Link
                                href="/tim-kiem"
                                className={cn(
                                    "nb-navlink whitespace-nowrap px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200",
                                    pathname === "/tim-kiem"
                                        ? "nb-active text-[#22d3a5]"
                                        : "text-white/70 hover:text-white hover:bg-white/[0.05]"
                                )}
                            >
                                Tìm Kiếm
                            </Link>
                        </div>
                    </div>

                    {/* ── Right: Search + User ── */}
                    <div className="hidden flex-1 items-center justify-end xl:flex gap-2">
                        {/* Search desktop */}
                        <div ref={searchRef} className="relative w-[260px]">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35 pointer-events-none z-10">
                                <Search size={14} />
                            </span>
                            <input
                                type="text"
                                placeholder="Tìm kiếm phim…"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") goToSearchPage(query); }}
                                onFocus={() => { if (dataSearch.length > 0) setIsSearchOpen(true); }}
                                className="nb-search-input w-full rounded-full border border-white/[0.1] bg-white/[0.06] pl-9 pr-9 py-2 text-[13px] text-white placeholder:text-white/30 outline-none transition-all duration-200 focus:border-[#22d3a5]/50 focus:bg-white/[0.08]"
                            />
                            {loading ? (
                                <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
                                    <svg className="w-3.5 h-3.5 text-[#22d3a5] animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                    </svg>
                                </span>
                            ) : query ? (
                                <button
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                                    onClick={() => { setQuery(""); setDataSearch([]); setIsSearchOpen(false); }}
                                >
                                    <X size={13} />
                                </button>
                            ) : null}

                            {/* Dropdown */}
                            {isSearchOpen && (
                                <div className="nb-dropdown absolute right-0 left-auto mt-2 w-[340px] rounded-2xl border border-white/[0.08] bg-[#0a0d14]/96 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl max-h-[340px] overflow-y-auto text-white">
                                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
                                        <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">
                                            Kết quả &quot;{query}&quot;
                                        </span>
                                    </div>
                                    {loading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <ThreeDot variant="bounce" color="#22d3a5" size="small" text="" textColor="" />
                                        </div>
                                    ) : dataSearch.length > 0 ? (
                                        <>
                                            {dataSearch.map((item) => (
                                                <SearchItem key={item._id} item={item}
                                                    onClick={() => { setQuery(item.name); setIsSearchOpen(false); }} />
                                            ))}
                                            <ViewAllBtn q={query} />
                                        </>
                                    ) : (
                                        <div className="px-4 py-6 text-[12px] text-white/35 text-center">
                                            Không tìm thấy phim nào
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Mobile: search + menu ── */}
                    <div className="flex items-center gap-1.5 xl:hidden">
                        <button
                            className="w-9 h-9 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/[0.07] transition-all"
                            onClick={() => { setIsMobileSearchOpen(p => !p); setDataSearch([]); setQuery(""); }}
                        >
                            <Search size={17} />
                        </button>
                        <button
                            className="w-9 h-9 flex items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.06] text-white hover:bg-white/[0.1] transition-all"
                            onClick={() => setIsSidebarOpen(p => !p)}
                        >
                            <MenuIcon size={18} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* ══════════════════════════════════════════════════════════
                Mobile search overlay
            ══════════════════════════════════════════════════════════ */}
            {isMobileSearchOpen && (
                <div className="nb-mobile-search fixed inset-x-0 top-[72px] z-40 bg-[#05070b]/96 backdrop-blur-2xl border-b border-white/[0.07] xl:hidden shadow-[0_8px_40px_rgba(0,0,0,0.6)]">
                    {/* Input row */}
                    <div className="px-3 pt-3 pb-2.5 flex items-center gap-2">
                        <button type="button" onClick={() => setIsMobileSearchOpen(false)}
                            className="w-8 h-8 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/[0.07] transition-all shrink-0">
                            <X size={16} />
                        </button>
                        <div className="relative flex-1">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35 pointer-events-none z-10">
                                <Search size={14} />
                            </span>
                            {loading && (
                                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 z-10">
                                    <svg className="w-3.5 h-3.5 text-[#22d3a5] animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                    </svg>
                                </span>
                            )}
                            <input
                                type="text"
                                placeholder="Tìm kiếm phim, diễn viên…"
                                value={query}
                                autoFocus
                                onChange={(e) => handleMobileQueryChange(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") goToSearchPage(query); }}
                                className="nb-search-input w-full rounded-full border border-white/[0.1] bg-white/[0.06] pl-9 pr-4 py-2.5 text-[14px] text-white placeholder:text-white/30 outline-none focus:border-[#22d3a5]/50 transition-all"
                            />
                        </div>
                    </div>

                    {/* Results */}
                    <div className="max-h-[60vh] overflow-y-auto overscroll-contain pb-4">
                        <div className="flex items-center justify-between px-4 py-2 border-t border-white/[0.06]">
                            <span className="text-[11px] font-semibold text-white/35 uppercase tracking-wider">
                                {query ? `Kết quả "${query}"` : "Nhập để tìm kiếm"}
                            </span>
                            {query && (
                                <button onClick={() => { setQuery(""); setDataSearch([]); }}
                                    className="text-[11px] text-white/30 hover:text-white/60 transition-colors">
                                    Xóa
                                </button>
                            )}
                        </div>
                        <div className="py-1">
                            {loading ? (
                                <div className="flex items-center justify-center py-10">
                                    <ThreeDot variant="bounce" color="#22d3a5" size="small" text="" textColor="" />
                                </div>
                            ) : dataSearch.length > 0 ? (
                                <>
                                    {dataSearch.map((item) => (
                                        <SearchItem key={item._id} item={item}
                                            onClick={() => {
                                                setQuery(item.name);
                                                setIsSearchOpen(false);
                                                setIsMobileSearchOpen(false);
                                            }}
                                        />
                                    ))}
                                    <ViewAllBtn q={query} />
                                </>
                            ) : query ? (
                                <div className="px-4 py-6 text-[12px] text-white/35 text-center">
                                    Không tìm thấy phim nào
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar;
