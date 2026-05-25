import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
const theme = import.meta.env.VITE_APP_ASSET_THEME || 'Default';
import { MenuIcon, Search } from "lucide-react";
import { FaFacebookF } from "react-icons/fa";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNavigate } from "react-router";
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
        <Link to={to}>{children}</Link>
    </Button>
);

const navbarItems: NavbarItem[] = [
    { to: "/phim-le",   children: "Phim Lẻ" },
    { to: "/phim-bo",   children: "Phim Bộ" },
    { to: "/hoat-hinh", children: "Hoạt Hình" },
    { to: "/the-loai",  children: "Thể loại ▾" },
    { to: "/quoc-gia",  children: "Quốc gia ▾" },
    { to: "/gioi-thieu",children: "Giới Thiệu" },
    { to: "/lien-he",   children: "Liên Hệ" },
];

const DEBOUNCE_MS = 500;

const Navbar = () => {
    const location = useLocation();
    const pathname  = location.pathname;

    const user     = useAuthStore((s) => s.user);
    const logoPath = `/${theme}/logo.png`;

    const searchRef       = useRef<HTMLDivElement | null>(null);
    const categoryMenuRef = useRef<HTMLDivElement | null>(null);
    const countriesMenuRef= useRef<HTMLDivElement | null>(null);
    const userMenuRef     = useRef<HTMLDivElement | null>(null);
    const debounceTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
    const mobileDebounce  = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    const [isUserMenuOpen,     setIsUserMenuOpen]     = useState(false);

    // const { signOut } = useAuthStore();
    const navigate    = useNavigate();

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
        if (!isSearchOpen && !isCategoryOpen && !isCountriesOpen && !isUserMenuOpen) return;
        const fn = (e: MouseEvent) => {
            const t = e.target as Node;
            if (isSearchOpen    && searchRef.current        && !searchRef.current.contains(t))        setIsSearchOpen(false);
            if (isCategoryOpen  && categoryMenuRef.current  && !categoryMenuRef.current.contains(t))  setIsCategoryOpen(false);
            if (isCountriesOpen && countriesMenuRef.current && !countriesMenuRef.current.contains(t)) setIsCountriesOpen(false);
            if (isUserMenuOpen  && userMenuRef.current      && !userMenuRef.current.contains(t))      setIsUserMenuOpen(false);
        };
        document.addEventListener("mousedown", fn);
        return () => document.removeEventListener("mousedown", fn);
    }, [isSearchOpen, isCategoryOpen, isCountriesOpen, isUserMenuOpen]);

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

    /* ── Handlers ── */
    // const handleLogout = async () => {
    //     try { await signOut(); } catch (e) { console.error(e); }
    // };

    const goHome = () => {
        if (pathname !== "/phimhay") {
            navigate("/phimhay");
            setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: "smooth" }), 50);
        } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const goToSearchPage = (q: string) => {
        if (!q.trim()) return;
        setIsSearchOpen(false);
        setIsMobileSearchOpen(false);
        navigate(`/tim-kiem?keyword=${encodeURIComponent(q.trim())}`);
    };

    /* ── Search icon ── */
    const SearchIcon = (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none flex items-center justify-center">
            <Search size={16} />
        </span>
    );

    /* ── Spinner ── */
    const Spinner = (
        <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg className="w-4 h-4 text-green-400 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
        </span>
    );

    /* ── Search result item ── */
    const SearchItem = ({ item, onClick }: { item: Movie; onClick: () => void }) => (
        <Link
            to={`/phim/${item.slug}`}
            onClick={onClick}
            className="flex w-full items-center gap-3 px-3 py-2 hover:bg-white/5 transition-colors cursor-pointer"
        >
            <img
                src={`https://phimimg.com/${item.poster_url}`}
                alt={item.name}
                className="w-[50px] h-[67.5px] object-cover rounded-[5.28px] flex-shrink-0"
            />
            <div className="flex flex-col overflow-hidden gap-1">
                <h4 className="truncate text-white text-sm xl:text-[14px] font-normal leading-[1.5]"
                    dangerouslySetInnerHTML={{ __html: item.name ?? "" }} />
                <div className="text-white/50 xl:text-[12px] leading-[1.5]"
                    dangerouslySetInnerHTML={{ __html: item.origin_name ?? "" }} />
                <div className="flex flex-wrap gap-2 items-start">
                    <div className="text-white text-xs xl:text-[11.34px] font-semibold flex items-center"><span className="mr-1">•</span>{item.year}</div>
                    <div className="text-white text-xs xl:text-[11.34px] flex items-center"><span className="mr-1">•</span>{item.quality}</div>
                    <div className="text-white text-xs xl:text-[11.34px] flex items-center"><span className="mr-1">•</span>{item.time}</div>
                </div>
            </div>
        </Link>
    );

    /* ── View all button ── */
    const ViewAllBtn = ({ q }: { q: string }) => (
        <div className="border-t border-white/10 px-3 py-2">
            <button
                onClick={() => goToSearchPage(q)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold text-green-400 hover:bg-white/5 transition-colors"
            >
                <Search size={13} />
                Xem tất cả kết quả cho "{q}"
            </button>
        </div>
    );

    /* ══════════════════════════════════════════════════════════
       RENDER
    ══════════════════════════════════════════════════════════ */
    return (
        <>
            <nav className={cn(
                "fixed inset-x-0 top-0 z-40 transition-transform duration-300 transition-colors",
                !visible && "-translate-y-full",
                atTop ? "bg-transparent" : "bg-[#05070b]/98"
            )}>
                <div className="mx-auto flex h-18 max-w-8xl items-center justify-between px-3 lg:px-5 xl:px-6">

                    {/* ── Left: Logo + Search desktop ── */}
                    <div className="flex flex-1 items-center gap-4">
                        <button onClick={goHome} className="flex items-center gap-2 cursor-pointer">
                            <img src={logoPath} alt="logo" className="h-8 w-auto object-contain" />
                        </button>

                        <div ref={searchRef} className="relative hidden w-[320px] xl:block">
                            {SearchIcon}

                            <input
                                type="text"
                                placeholder="Tìm kiếm phim, diễn viên"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") goToSearchPage(query); }}
                                onFocus={() => { if (dataSearch.length > 0) setIsSearchOpen(true); }}
                                className="w-full rounded-[5.28px] border border-white/10 bg-white/5 px-9 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-green-400/70 focus:bg-white/10"
                            />

                            {loading && Spinner}

                            {/* Dropdown desktop */}
                            {isSearchOpen && (
                                <div className="absolute left-0 right-0 mt-2 rounded-[5.28px] border border-white/10 bg-[#05070b]/98 shadow-xl backdrop-blur-sm max-h-80 overflow-y-auto text-white">
                                    {/* Header */}
                                    <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
                                        <span className="text-xs font-semibold text-white/60">
                                            Kết quả cho "{query}"
                                        </span>
                                        <button
                                            onClick={() => { setQuery(""); setDataSearch([]); setIsSearchOpen(false); }}
                                            className="text-xs text-white/40 hover:text-white/70"
                                        >
                                            Xóa
                                        </button>
                                    </div>

                                    {loading ? (
                                        <div className="flex items-center justify-center py-10">
                                            <ThreeDot variant="bounce" color="#32cd32" size="medium" text="" textColor="" />
                                        </div>
                                    ) : dataSearch.length > 0 ? (
                                        <>
                                            {dataSearch.map((item) => (
                                                <SearchItem
                                                    key={item._id}
                                                    item={item}
                                                    onClick={() => { setQuery(item.name); setIsSearchOpen(false); }}
                                                />
                                            ))}
                                            <ViewAllBtn q={query} />
                                        </>
                                    ) : (
                                        <div className="px-3 py-4 text-xs text-white/50 text-center">
                                            Không tìm thấy phim nào.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Sidebar mobile ── */}
                    <NavbarSidebar
                        items={navbarItems}
                        user={user}
                        open={isSidebarOpen}
                        onOpenChange={setIsSidebarOpen}
                    />

                    {/* ── Center: Menu desktop ── */}
                    <div className="hidden flex-1 items-center justify-center xl:flex">
                        <div className="flex items-center">
                            {[
                                { to: "/phim-le",   label: "Phim Lẻ" },
                                { to: "/phim-bo",   label: "Phim Bộ" },
                                { to: "/hoat-hinh", label: "Hoạt Hình" },
                            ].map(({ to, label }) => (
                                <Button key={to} asChild variant="link"
                                    className={cn("h-auto bg-transparent rounded-full px-3 text-[13px] font-medium text-white/80 hover:text-green-300 transition-colors duration-200", pathname === to && "text-green-300")}>
                                    <Link to={to}>{label}</Link>
                                </Button>
                            ))}

                            {/* Thể loại */}
                            <div ref={categoryMenuRef} className="relative">
                                <Button
                                    onClick={() => setIsCategoryOpen(p => !p)}
                                    className={cn("h-auto bg-transparent rounded-full px-3 text-[13px] font-medium text-white/80 hover:text-green-300 hover:bg-transparent transition-colors duration-200 cursor-pointer", isCategoryOpen && "text-green-300")}
                                >
                                    Thể Loại <span className={`inline-block transition-transform text-[10px] ${isCategoryOpen ? "rotate-90" : ""}`}>▶</span>
                                </Button>
                                {isCategoryOpen && (
                                    <div className="absolute top-full left-3 mt-2 w-72 rounded-[5.28px] border border-white/10 bg-[#181b24]/95 backdrop-blur-xl shadow-[0_18px_40px_rgba(0,0,0,0.7)] text-xs text-white overflow-hidden z-50 p-3">
                                        <div className="flex flex-wrap gap-2">
                                            {categories.map((cat, i) => (
                                                <Link key={i} to={`/loc-phim?category=${cat.value}`}
                                                    onClick={() => setIsCategoryOpen(false)}
                                                    className="w-[calc(100%/2-4px)] text-left px-3 text-[13px] font-semibold py-2 rounded-[5.28px] hover:bg-white/5 hover:text-green-500">
                                                    {cat.label}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Quốc gia */}
                            <div ref={countriesMenuRef} className="relative">
                                <Button
                                    onClick={() => setIsCountriesOpen(p => !p)}
                                    className={cn("h-auto bg-transparent rounded-full px-3 text-[13px] font-medium text-white/80 hover:text-green-300 hover:bg-transparent transition-colors duration-200 cursor-pointer", isCountriesOpen && "text-green-300")}
                                >
                                    Quốc Gia <span className={`inline-block transition-transform text-[10px] ${isCountriesOpen ? "rotate-90" : ""}`}>▶</span>
                                </Button>
                                {isCountriesOpen && (
                                    <div className="absolute top-full left-3 mt-2 w-[400px] rounded-[5.28px] border border-white/10 bg-[#181b24]/95 backdrop-blur-xl shadow-[0_18px_40px_rgba(0,0,0,0.7)] text-xs text-white overflow-hidden z-50 p-3">
                                        <div className="grid grid-cols-3 gap-2">
                                            {countries.map((cat, i) => (
                                                <Link key={i} to={`/loc-phim?country=${cat.value}`}
                                                    onClick={() => setIsCountriesOpen(false)}
                                                    className="text-left px-3 text-[13px] font-semibold py-2 rounded-[5.28px] hover:bg-white/5 hover:text-green-500">
                                                    {cat.label}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {[
                                // { to: "/bai-viet",          label: "Bài Viết" },
                                { to: "/tim-kiem",        label: "Tìm Kiếm" },
                                { to: "/gioi-thieu",        label: "Giới Thiệu" },
                                { to: "/lien-he-quang-cao", label: "Liên Hệ" },
                            ].map(({ to, label }) => (
                                <Button key={to} asChild variant="link"
                                    className={cn("h-auto bg-transparent rounded-full px-3 text-[13px] font-medium text-white/80 hover:text-green-300 transition-colors duration-200", pathname === to && "text-green-300")}>
                                    <Link to={to}>{label}</Link>
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* ── Right: FB + User ── */}
                    <div className="hidden flex-1 items-center justify-end gap-4 xl:flex">
                        <Button asChild className="bg-transparent hover:bg-transparent px-0">
                            <a href="https://www.facebook.com/tiemnhonhaDahee" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                                <div className="bg-blue-600 text-white p-2 rounded-[5.28px] text-xl"><FaFacebookF /></div>
                                <div className="flex flex-col gap-[4.8px] text-[12px] leading-[1.1]">
                                    <span>Đồ Hàn-Trung</span>
                                    <strong className="text-[14px]">Order Now</strong>
                               
                                </div>
                            </a>
                        </Button>

                        {/* <div className="h-6 w-px bg-white" /> */}

                        {/* {user ? (
                            <div ref={userMenuRef} className="relative">
                                <Button
                                    onClick={() => setIsUserMenuOpen(p => !p)}
                                    className="flex items-center gap-2 rounded-[5.28px] bg-white px-4 py-1.5 text-xs font-semibold text-black cursor-pointer hover:bg-white"
                                >
                                    <User size={14} className="mr-1" />
                                    {user.displayName ?? "Thành viên"}
                                </Button>

                                {isUserMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-72 rounded-[5.28px] border border-white/10 bg-[#181b24]/95 backdrop-blur-xl shadow-[0_18px_40px_rgba(0,0,0,0.7)] text-xs text-white overflow-hidden z-50">
                                        <div className="pointer-events-none absolute -top-2 right-6 h-4 w-4 rotate-45 bg-[#181b24]/95 border-l border-t border-white/10" />
                                        <div className="px-4 pt-4 pb-3 border-b border-white/10">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-white/10 overflow-hidden flex items-center justify-center">
                                                    <UserCircle2 size={22} />
                                                </div>
                                                <span className="text-sm font-semibold">{user.displayName ?? "Thành viên"}</span>
                                            </div>
                                        </div>
                                        <div className="py-1 text-[13px]">
                                            <button type="button"
                                                onClick={() => { setIsUserMenuOpen(false); navigate("/profile"); }}
                                                className="flex w-full items-center gap-2 px-4 py-2 hover:bg-white/5 text-left">
                                                <User size={14} /><span>Thông tin tài khoản</span>
                                            </button>
                                        </div>
                                        <div className="h-px bg-white/10" />
                                        <button type="button" onClick={handleLogout}
                                            className="flex w-full items-center gap-2 px-4 py-2 text-[13px] text-red-400 hover:bg-white/5 text-left">
                                            <LogOut size={14} /><span>Đăng xuất</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Button asChild className="flex items-center gap-2 rounded-full bg-white px-5 py-1.5 text-xs font-semibold text-black hover:bg-white">
                                <Link to="/signin"><User size={14} className="mr-1" />Thành viên</Link>
                            </Button>
                        )} */}
                    </div>

                    {/* ── Mobile: search + menu ── */}
                    <div className="flex items-center gap-2 xl:hidden">
                        <button className="p-1.5 text-white/80"
                            onClick={() => { setIsMobileSearchOpen(p => !p); setDataSearch([]); setQuery(""); }}>
                            <Search size={18} />
                        </button>
                        <button className="rounded-[5.28px] bg-white/5 p-1.5 text-white"
                            onClick={() => setIsSidebarOpen(p => !p)}>
                            <MenuIcon size={20} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* ══════════════════════════════════════════════════════════
                Mobile search overlay
            ══════════════════════════════════════════════════════════ */}
            {isMobileSearchOpen && (
                <div className="fixed inset-x-0 top-16 z-40 bg-[#05070b]/98 border-b border-white/10 xl:hidden">

                    {/* Input row */}
                    <div className="px-3 pt-3 pb-2 flex items-center gap-2">
                        <button type="button" onClick={() => setIsMobileSearchOpen(false)}
                            className="p-1 text-white/70 hover:text-white">✕</button>

                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none z-10">
                                <Search size={16} />
                            </span>
                            {loading && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
                                    <svg className="w-4 h-4 text-green-400 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                    </svg>
                                </span>
                            )}
                            <input
                                type="text"
                                placeholder="Tìm kiếm phim, diễn viên"
                                value={query}
                                autoFocus
                                onChange={(e) => handleMobileQueryChange(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") goToSearchPage(query); }}
                                className="w-full rounded-[5.28px] border border-white/10 bg-white/5 px-10 py-2 text-base sm:text-sm text-white placeholder:text-white/40 outline-none focus:border-green-400/70 focus:bg-white/10"
                            />
                        </div>
                    </div>

                    {/* Results — overscroll-contain ngăn scroll lan ra trang nền */}
                    <div className="max-h-[60vh] overflow-y-auto overscroll-contain pb-3">
                        <div className="flex items-center justify-between px-4 py-2 border-t border-white/10">
                            <span className="text-xs font-semibold text-white/60">
                                {query ? `Kết quả cho "${query}"` : "Nhập để tìm kiếm"}
                            </span>
                            {query && (
                                <button onClick={() => { setQuery(""); setDataSearch([]); }}
                                    className="text-xs text-white/40 hover:text-white/70">
                                    Xóa
                                </button>
                            )}
                        </div>

                        <div className="py-1">
                            {loading ? (
                                <div className="flex items-center justify-center py-10">
                                    <ThreeDot variant="bounce" color="#32cd32" size="medium" text="" textColor="" />
                                </div>
                            ) : dataSearch.length > 0 ? (
                                <>
                                    {dataSearch.map((item) => (
                                        <SearchItem
                                            key={item._id}
                                            item={item}
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
                                <div className="px-3 py-4 text-xs text-white/50 text-center">
                                    Không tìm thấy phim nào.
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