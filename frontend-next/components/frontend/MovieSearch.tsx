"use client";

import { useState, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { categories } from "@/data/category";
import { countries } from "@/data/country";

type Filters = {
    country: string[];
    type: string[];
    category: string[];
    versions: string[];
    year: string[];
};

const PATH_TYPE_MAP: Record<string, string> = {
    "/phim-le": "phim-le",
    "/phim-bo": "phim-bo",
    "/hoat-hinh": "hoat-hinh",
    "/phim-chieu-rap": "phim-chieu-rap",
};

const TYPE_ITEMS = [
    { value: "", label: "Tất cả" },
    { value: "phim-le", label: "Phim lẻ" },
    { value: "phim-bo", label: "Phim bộ" },
    { value: "hoat-hinh", label: "Hoạt hình" },
    { value: "phim-chieu-rap", label: "Chiếu rạp" },
];

const VERSION_ITEMS = [
    { value: "", label: "Tất cả" },
    { value: "vietsub", label: "Vietsub" },
    { value: "thuyet-minh", label: "Thuyết minh" },
    { value: "long-tieng", label: "Lồng tiếng" },
];

/* single-select fields */
const SINGLE = new Set<keyof Filters>(["type", "year"]);

export default function MovieSearch() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();

    const [filters, setFilters] = useState<Filters>({
        country: [""], type: [""], category: [""], versions: [""], year: [""],
    });
    const [open, setOpen] = useState(false);

    const years = useMemo(() =>
        Array.from({ length: 2026 - 2010 + 1 }, (_, i) => String(2026 - i)), []);

    const toCSV = (arr: string[]) => arr.filter(Boolean).join(",");
    const fromCSV = (s: string | null) => s ? s.split(",").filter(Boolean) : [""];

    useEffect(() => {
        if (pathname !== "/loc-phim") return;
        const qType = searchParams.get("type_list");
        setFilters({
            country:  fromCSV(searchParams.get("country")),
            category: fromCSV(searchParams.get("category")),
            year:     fromCSV(searchParams.get("year")),
            type:     qType !== null ? fromCSV(qType) : [PATH_TYPE_MAP[pathname] ?? ""],
            versions: fromCSV(searchParams.get("versions")),
        });
    }, [pathname, searchParams]);

    const toggle = (key: keyof Filters, value: string) => {
        setFilters(prev => {
            const isAll = value === "" || value === "Tất cả";
            const cur = prev[key];
            let next: string[];
            if (SINGLE.has(key)) {
                next = isAll ? [""] : [value];
            } else {
                next = isAll
                    ? [""]
                    : cur.includes(value)
                        ? cur.filter(v => v !== value)
                        : [...cur.filter(v => v !== ""), value];
                if (next.length === 0) next = [""];
            }
            return { ...prev, [key]: next };
        });
    };

    const apply = () => {
        const qs = new URLSearchParams();
        if (toCSV(filters.country))  qs.set("country",   toCSV(filters.country));
        if (toCSV(filters.category)) qs.set("category",  toCSV(filters.category));
        if (toCSV(filters.versions)) qs.set("versions",  toCSV(filters.versions));
        if (toCSV(filters.year))     qs.set("year",      toCSV(filters.year));
        if (toCSV(filters.type))     qs.set("type_list", toCSV(filters.type));
        qs.set("page", "1");
        router.push(`/loc-phim?${qs.toString()}`);
        setOpen(false);
    };

    const reset = () => {
        setFilters({ country: [""], type: [""], category: [""], versions: [""], year: [""] });
    };

    const activeCount = Object.values(filters).filter(a => a.some(Boolean)).length;

    /* ── Pill ── */
    const Pill = ({ selected, onClick, children }: {
        selected: boolean; onClick: () => void; children: React.ReactNode;
    }) => (
        <button
            onClick={onClick}
            className="ms-pill py-1.5 rounded-lg text-[12px] font-medium transition-all duration-150 select-none text-center shrink-0"
            style={selected ? {
                background: "rgba(34,211,165,0.15)",
                color: "#22d3a5",
                border: "1px solid rgba(34,211,165,0.4)",
                boxShadow: "0 0 8px rgba(34,211,165,0.12)",
            } : {
                background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.45)",
                border: "1px solid rgba(255,255,255,0.07)",
            }}
        >
            {children}
        </button>
    );

    /* ── Row — cellW = độ rộng của label dài nhất trong nhóm ── */
    const Row = ({ label, children, cellW }: { label: string; children: React.ReactNode; cellW: string }) => (
        <div className="flex gap-3 items-start">
            <span className="shrink-0 w-[76px] text-right text-[11px] font-semibold uppercase tracking-wider pt-[5px]"
                style={{ color: "rgba(255,255,255,0.28)" }}>
                {label}
            </span>
            <div className="ms-row-pills flex flex-wrap gap-1.5"
                style={{ "--cell-w": cellW } as React.CSSProperties}>
                {children}
            </div>
        </div>
    );

    return (
        <div className="w-full px-3 lg:px-5 xl:px-6">

            {/* ── Toggle button ── */}
            <button
                onClick={() => setOpen(v => !v)}
                className="flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-semibold transition-all duration-200 select-none"
                style={open
                    ? { background: "rgba(34,211,165,0.12)", color: "#22d3a5", border: "1px solid rgba(34,211,165,0.3)" }
                    : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.09)" }
                }
            >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
                </svg>
                <span>Bộ lọc</span>
                {activeCount > 0 && !open && (
                    <span className="w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center"
                        style={{ background: "#22d3a5", color: "#041a11" }}>
                        {activeCount}
                    </span>
                )}
                <svg className={`w-3 h-3 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* ── Panel ── */}
            {open && (
                <div
                    className="relative mt-2 rounded-2xl p-5 flex flex-col gap-4 overflow-hidden"
                    style={{
                        zIndex: 9999,
                        background: "#191B24",
                        border: "1px solid rgba(255,255,255,0.07)",
                        boxShadow: "0 24px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)",
                        animation: "msOpen 0.22s cubic-bezier(0.22,1,0.36,1)",
                    }}
                >
                    {/* animated gradient blobs */}
                    <div aria-hidden className="ms-blob ms-blob-1 pointer-events-none absolute rounded-full"
                        style={{ width: 420, height: 420, top: "-30%", left: "-10%",
                            background: "radial-gradient(circle, rgba(34,211,165,0.13) 0%, transparent 70%)" }} />
                    <div aria-hidden className="ms-blob ms-blob-2 pointer-events-none absolute rounded-full"
                        style={{ width: 380, height: 380, bottom: "-25%", right: "-8%",
                            background: "radial-gradient(circle, rgba(99,102,241,0.11) 0%, transparent 70%)" }} />
                    <div aria-hidden className="ms-blob ms-blob-3 pointer-events-none absolute rounded-full"
                        style={{ width: 280, height: 280, top: "30%", left: "40%",
                            background: "radial-gradient(circle, rgba(244,63,94,0.07) 0%, transparent 70%)" }} />
                    {/* animated top border */}
                    <div aria-hidden className="ms-topline pointer-events-none absolute top-0 inset-x-0 h-px rounded-t-2xl" />
                    {/* "Phim chiếu rạp" = dài nhất */}
                    <Row label="Loại phim" cellW="120px">
                        {TYPE_ITEMS.map(item => (
                            <Pill key={item.value}
                                selected={filters.type.includes(item.value)}
                                onClick={() => toggle("type", item.value || "Tất cả")}>
                                {item.label}
                            </Pill>
                        ))}
                    </Row>

                    <div className="h-px ml-[88px]" style={{ background: "rgba(255,255,255,0.05)" }} />

                    {/* "Thuyết minh" = dài nhất */}
                    <Row label="Phiên bản" cellW="104px">
                        {VERSION_ITEMS.map(item => (
                            <Pill key={item.value}
                                selected={filters.versions.includes(item.value)}
                                onClick={() => toggle("versions", item.value || "Tất cả")}>
                                {item.label}
                            </Pill>
                        ))}
                    </Row>

                    <div className="h-px ml-[88px]" style={{ background: "rgba(255,255,255,0.05)" }} />

                    {/* tất cả 4 ký tự, "Tất cả" = 6 */}
                    <Row label="Năm" cellW="64px">
                        <Pill selected={filters.year.includes("")} onClick={() => toggle("year", "Tất cả")}>Tất cả</Pill>
                        {years.map(y => (
                            <Pill key={y} selected={filters.year.includes(y)} onClick={() => toggle("year", y)}>{y}</Pill>
                        ))}
                    </Row>

                    <div className="h-px ml-[88px]" style={{ background: "rgba(255,255,255,0.05)" }} />

                    {/* "Quốc Gia Khác" = dài nhất */}
                    <Row label="Quốc gia" cellW="120px">
                        {countries.map((c, i) => (
                            <Pill key={`${c.value}-${i}`}
                                selected={filters.country.includes(c.value)}
                                onClick={() => toggle("country", c.value || "Tất cả")}>
                                {c.label}
                            </Pill>
                        ))}
                    </Row>

                    <div className="h-px ml-[88px]" style={{ background: "rgba(255,255,255,0.05)" }} />

                    {/* "Chính Kịch" = dài nhất */}
                    <Row label="Thể loại" cellW="96px">
                        {categories.map((c, i) => (
                            <Pill key={`${c.value}-${i}`}
                                selected={filters.category.includes(c.value)}
                                onClick={() => toggle("category", c.value || "Tất cả")}>
                                {c.label}
                            </Pill>
                        ))}
                    </Row>

                    {/* ── Footer ── */}
                    <div className="flex items-center justify-between pt-1 ml-[88px]">
                        <button onClick={reset}
                            className="text-[12px] flex items-center gap-1.5 transition-opacity hover:opacity-70"
                            style={{ color: "rgba(255,255,255,0.3)" }}>
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                <path strokeLinecap="round" d="M3 3v5h5" />
                            </svg>
                            Đặt lại
                        </button>
                        <div className="flex gap-2">
                            <button onClick={() => setOpen(false)}
                                className="h-8 px-4 rounded-lg text-[12px] font-medium transition hover:bg-white/5"
                                style={{ color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                Đóng
                            </button>
                            <button onClick={apply}
                                className="h-8 px-5 rounded-lg text-[12px] font-bold transition hover:opacity-90 active:scale-95"
                                style={{ background: "#22d3a5", color: "#041a11" }}>
                                Lọc kết quả
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes msOpen {
                    from { opacity: 0; transform: translateY(-10px) scale(0.98); }
                    to   { opacity: 1; transform: translateY(0)  scale(1); }
                }
                @keyframes blobDrift1 {
                    0%,100% { transform: translate(0,0) scale(1); }
                    33%     { transform: translate(6%,8%) scale(1.08); }
                    66%     { transform: translate(-4%,5%) scale(0.95); }
                }
                @keyframes blobDrift2 {
                    0%,100% { transform: translate(0,0) scale(1); }
                    40%     { transform: translate(-7%,-6%) scale(1.1); }
                    70%     { transform: translate(5%,-3%) scale(0.93); }
                }
                @keyframes blobDrift3 {
                    0%,100% { transform: translate(0,0) scale(1); }
                    50%     { transform: translate(-8%,10%) scale(1.15); }
                }
                @keyframes borderShift {
                    0%   { background-position: 0% 50%; }
                    50%  { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .ms-blob-1 { animation: blobDrift1 9s ease-in-out infinite; }
                .ms-blob-2 { animation: blobDrift2 11s ease-in-out infinite; }
                .ms-blob-3 { animation: blobDrift3 13s ease-in-out infinite; }
                .ms-topline {
                    background: linear-gradient(90deg, transparent, #22d3a5, #6366f1, #f43f5e, #22d3a5, transparent);
                    background-size: 300% 100%;
                    animation: borderShift 5s linear infinite;
                    opacity: 0.5;
                }
                .ms-row-pills .ms-pill {
                    width: var(--cell-w, auto);
                }
                .ms-pill:hover {
                    border-color: rgba(255,255,255,0.18) !important;
                    color: rgba(255,255,255,0.75) !important;
                    transform: translateY(-1px);
                }
                .ms-pill:active { transform: scale(0.96); }
            `}</style>
        </div>
    );
}
