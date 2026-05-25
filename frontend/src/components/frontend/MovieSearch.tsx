import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

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

export default function MovieSearch() {
    const location = useLocation();
    const pathname = location.pathname;
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [filters, setFilters] = useState<Filters>({
        country: [""],
        type: [""],
        category: [""],
        versions: [""],
        year: [""],
    });
    const [filterVisible, setFilterVisible] = useState(false);

    const years = useMemo(() => Array.from({ length: 2026 - 2010 + 1 }, (_, i) => 2026 - i), []);

    const toCSV = (arr: string[]) => (Array.isArray(arr) ? arr.filter(Boolean).join(",") : "");
    const fromCSV = (s: string | null) => (s ? s.split(",").filter(Boolean) : [""]);

    // init từ URL + fetch đầu
    useEffect(() => {
        if (pathname !== "/loc-phim") return;

        const defaultType = PATH_TYPE_MAP[pathname] ?? "";
        const qType = searchParams.get("type_list");

        const init: Filters = {
            country: fromCSV(searchParams.get("country")),
            category: fromCSV(searchParams.get("category")),
            year: fromCSV(searchParams.get("year")),
            type: qType !== null ? fromCSV(qType) : [defaultType],
            versions: fromCSV(searchParams.get("versions")),
        };

        setFilters(init);
    }, [pathname, searchParams]);

    // nút Lọc kết quả
    const applyFilters = () => {
        const qs = new URLSearchParams();
        if (toCSV(filters.country)) qs.set("country", toCSV(filters.country));
        if (toCSV(filters.category)) qs.set("category", toCSV(filters.category));
        if (toCSV(filters.versions)) qs.set("versions", toCSV(filters.versions));
        if (toCSV(filters.year)) qs.set("year", toCSV(filters.year));
        if (toCSV(filters.type)) qs.set("type_list", toCSV(filters.type));
        qs.set("page", "1");

        navigate(`/loc-phim?${qs.toString()}`);
    };

    const singleSelectFields: (keyof Filters)[] = ["type", "year"]; // chỉ chọn 1 item

    const handleFilterClick = (key: keyof Filters, value: string) => {
        setFilters((prev) => {
            const isAll = value === "Tất cả";
            const prevValues = prev[key];

            let next: string[];
            if (singleSelectFields.includes(key)) {
                next = isAll ? [""] : [value];
            } else {
                next = isAll
                    ? [""]
                    : prevValues.includes(value)
                        ? prevValues.filter((v) => v !== value)
                        : [...prevValues.filter((v) => v !== ""), value];
                if (next.length === 0) next = [""];
            }

            return { ...prev, [key]: next };
        });
    };

    const versions = ["", "vietsub", "thuyet-minh", "long-tieng"];

    const Pill = ({
        selected,
        children,
        onClick,
    }: {
        selected: boolean;
        children: React.ReactNode;
        onClick: () => void;
    }) => (
        <button
            onClick={onClick}
            className={`px-1 py-1 rounded-[5.28px] text-sm transition
            flex items-center justify-center
            ${selected ? "border border-white/30 text-green-400" : "text-gray-200 hover:bg-emerald-500/10"}
        `}
        >
            {children}
        </button>
    );

    const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
        <div className="grid grid-cols-12 gap-3 items-start">
            <div className="col-span-12 md:col-span-2">
                <span className="inline-block text-gray-300 text-sm font-semibold mt-1">{label}</span>
            </div>
            <div className="col-span-12 md:col-span-10 flex flex-wrap gap-2">{children}</div>
        </div>
    );

    return (
        <main className="w-full mx-auto lg:px-5 xl:px-6 px-3 text-sm text-gray-400">
            {/* header bộ lọc */}
            <div className="py-[0] pr-[10px] mb-4 rounded-[5.28px] flex items-center justify-between z-30">
                <button className="inline-flex items-center gap-2 text-gray-200 bg-[#191B24] pb-1 pr-2 rounded-[5.28px]" onClick={() => setFilterVisible((v) => !v)}>
                    <span className={`inline-block transition-transform ${filterVisible ? "rotate-90" : ""}`}>▶</span>
                    <span className="font-medium">Bộ lọc</span>
                </button>
            </div>

            {/* container bộ lọc */}
            <div className={`${filterVisible ? "block" : "hidden"} z-20 space-y-5 rounded-[5.28px] border border-white/10 bg-[#05070b]/98 p-4 md:p-5 mt-[-25px] w-full md:w-auto`}>
                <Row label="Quốc gia:">
                    {countries.map((c, idx) => (
                        <Pill key={`${c.value}-${idx}`} selected={filters.country.includes(c.value)} onClick={() => handleFilterClick("country", c.value || "Tất cả")}>
                            {c.label}
                        </Pill>
                    ))}
                </Row>

                <Row label="Loại phim:">
                    {[
                        { value: "", label: "Tất cả" },
                        { value: "phim-le", label: "Phim lẻ" },
                        { value: "phim-bo", label: "Phim bộ" },
                        { value: "hoat-hinh", label: "Hoạt hình" },
                        { value: "phim-chieu-rap", label: "Phim chiếu rạp" },
                    ].map((item, idx) => (
                        <Pill
                            key={`type-${idx}`}
                            selected={filters.type.includes(item.value)}
                            onClick={() => handleFilterClick("type", item.value || "Tất cả")}
                        >
                            {item.label}
                        </Pill>
                    ))}
                </Row>

                <Row label="Thể loại:">
                    {categories.map((g, idx) => (
                        <Pill key={`cat-${g.value}-${idx}`} selected={filters.category.includes(g.value)} onClick={() => handleFilterClick("category", g.value || "Tất cả")}>
                            {g.label}
                        </Pill>
                    ))}
                </Row>

                <Row label="Phiên bản:">
                    {versions.map((v, idx) => {
                        const text = v === "vietsub" ? "Phim có Vietsub" : v === "thuyet-minh" ? "Phim có Thuyết Minh" : v === "long-tieng" ? "Phim có Lồng Tiếng" : "Tất cả";
                        const selected = filters.versions.includes(v);
                        return (
                            <Pill key={`ver-${v}-${idx}`} selected={selected} onClick={() => handleFilterClick("versions", v || "Tất cả")}>
                                {text}
                            </Pill>
                        );
                    })}
                </Row>

                <Row label="Năm sản xuất:">
                    <Pill selected={filters.year.includes("")} onClick={() => handleFilterClick("year", "Tất cả")}>
                        Tất cả
                    </Pill>
                    {years.map((y) => {
                        const s = filters.year.includes(String(y));
                        return (
                            <Pill key={`year-${y}`} selected={s} onClick={() => handleFilterClick("year", y.toString())}>
                                {y}
                            </Pill>
                        );
                    })}
                </Row>

                <div className="flex justify-end gap-3 pt-1">
                    <button type="button" className="h-9 px-4 rounded-[5.28px] bg-emerald-500 text-black font-semibold" onClick={() => {
                        applyFilters();
                        setFilterVisible(false);
                    }}>
                        Lọc kết quả
                    </button>
                    <button type="button" className="h-9 px-4 rounded-[5.28px] border border-gray-600 text-gray-200" onClick={() => setFilterVisible(false)}>
                        Đóng
                    </button>
                </div>
            </div>
        </main>
    );
}