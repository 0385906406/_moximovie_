import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
interface Category { slug: string; name: string; }
type SearchMode = "keyword" | "category";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@400;500;600;700&display=swap');

  .cs-root * { box-sizing: border-box; }

  @keyframes csSlideDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:none} }
  .cs-filter-box { animation: csSlideDown 0.3s cubic-bezier(0.16,1,0.3,1) both; }

  .cs-pill {
    transition: all 0.2s ease;
    font-family: 'Outfit', sans-serif;
    font-size: 0.72rem; font-weight: 500;
    padding: 4px 12px; border-radius: 6px;
    cursor: pointer; border: 1px solid transparent;
  }
  .cs-pill:not(.active):hover {
    background: rgba(16,185,129,0.08);
    border-color: rgba(16,185,129,0.2);
    color: #6ee7b7;
  }
  .cs-pill.active {
    background: rgba(16,185,129,0.12);
    border-color: rgba(16,185,129,0.35);
    color: #10b981;
  }

  .cs-tab { transition: all 0.2s ease; font-family: 'Outfit', sans-serif; font-size: 0.8rem; font-weight: 600; cursor: pointer; border: none; }
  .cs-tab.active { background: linear-gradient(135deg,#10b981,#059669); color: #021a12; }
  .cs-tab:not(.active) { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.6); border: 1px solid rgba(255,255,255,0.08); }
  .cs-tab:not(.active):hover { background: rgba(16,185,129,0.1); color: #6ee7b7; border-color: rgba(16,185,129,0.25); }

  .cs-input {
    width: 100%; padding: 10px 14px; border-radius: 10px;
    background: rgba(255,255,255,0.04); border: 1.5px solid rgba(255,255,255,0.08);
    color: #fff; font-family: 'Outfit', sans-serif; font-size: 0.85rem;
    outline: none; transition: border-color 0.2s, box-shadow 0.2s;
  }
  .cs-input:focus { border-color: rgba(16,185,129,0.45); box-shadow: 0 0 0 3px rgba(16,185,129,0.1); }
  .cs-input::placeholder { color: rgba(255,255,255,0.25); }

  .cs-btn-primary {
    background: linear-gradient(135deg,#10b981,#059669);
    color: #021a12; border: none; border-radius: 8px;
    font-family: 'Outfit', sans-serif; font-size: 0.82rem; font-weight: 800;
    padding: 9px 20px; cursor: pointer;
    box-shadow: 0 4px 14px rgba(16,185,129,0.35);
    transition: all 0.2s ease;
  }
  .cs-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(16,185,129,0.5); }
  .cs-btn-primary:active { transform: scale(0.97); }

  .cs-btn-secondary {
    background: rgba(255,255,255,0.05); border: 1.5px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.6); border-radius: 8px;
    font-family: 'Outfit', sans-serif; font-size: 0.82rem; font-weight: 600;
    padding: 9px 18px; cursor: pointer;
    transition: all 0.2s ease;
  }
  .cs-btn-secondary:hover { background: rgba(255,255,255,0.08); color: #fff; }

  .cs-toggle {
    display: inline-flex; align-items: center; gap: 8px;
    font-family: 'Outfit', sans-serif; font-size: 0.8rem; font-weight: 600;
    color: rgba(255,255,255,0.6);
    background: rgba(255,255,255,0.04); border: 1.5px solid rgba(255,255,255,0.08);
    border-radius: 8px; padding: 7px 14px; cursor: pointer;
    transition: all 0.2s ease;
  }
  .cs-toggle:hover { background: rgba(16,185,129,0.08); border-color: rgba(16,185,129,0.25); color: #6ee7b7; }
  .cs-toggle.open { border-color: rgba(16,185,129,0.35); color: #10b981; }
`;

let styleInjectedCS = false;

export default function ComicSearch() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [mode, setMode] = useState<SearchMode>("keyword");
    const [keyword, setKeyword] = useState(searchParams.get("keyword") || "");
    const [selectedCategory, setSelCat] = useState<string | null>(searchParams.get("category"));
    const [categories, setCategories] = useState<Category[]>([]);
    const [filterVisible, setFilterVisible] = useState(true);
    
    useEffect(() => {
        if (!styleInjectedCS) {
            const s = document.createElement("style");
            s.textContent = STYLES;
            document.head.appendChild(s);
            styleInjectedCS = true;
        }
    }, []);

    useEffect(() => {
        fetch("https://otruyenapi.com/v1/api/the-loai")
            .then(r => r.json())
            .then(json => {
                if (json?.data?.items)
                    setCategories(json.data.items.map((c: any) => ({ slug: c.slug, name: c.name })));
            })
            .catch(e => console.error("Fetch category failed:", e));
    }, []);

    const applyFilters = () => {
        const qs = new URLSearchParams();
        if (mode === "keyword" && keyword.trim()) {
            qs.set("keyword", keyword.trim());
            navigate(`/doc-truyen?${qs.toString()}`);
            return;
        }
        if (mode === "category" && selectedCategory) {
            qs.set("category", selectedCategory);
            navigate(`/doc-truyen?${qs.toString()}`);
            return;
        }
        navigate("/doc-truyen");
    };

    /* Tabs + Actions — wrapped in affiliate link if not limit reached */
    const TabsEl = (
        <div className="flex gap-2">
            <button className={`cs-tab px-4 py-1.5 rounded-lg ${mode === "keyword" ? "active" : ""}`}
                onClick={() => { setMode("keyword"); setSelCat(null); }}>
                🔍 Tìm theo tên
            </button>
            <button className={`cs-tab px-4 py-1.5 rounded-lg ${mode === "category" ? "active" : ""}`}
                onClick={() => { setMode("category"); setKeyword(""); }}>
                🏷️ Theo thể loại
            </button>
        </div>
    );

    const ActionsEl = (
        <div className="flex justify-end gap-2.5 pt-1">
            <button className="cs-btn-primary" onClick={applyFilters}>
                <span className="flex items-center gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" />
                    </svg>
                    Lọc kết quả
                </span>
            </button>
            <button className="cs-btn-secondary" onClick={() => setFilterVisible(false)}>
                Đóng
            </button>
        </div>
    );

    return (
        <main className="cs-root w-full mx-auto lg:px-5 xl:px-6 px-3">

            {/* ── Toggle button ── */}
            <div className="mb-4 flex items-center gap-3">
                <button
                    onClick={() => setFilterVisible(v => !v)}
                    className={`cs-toggle ${filterVisible ? "open" : ""}`}
                >
                    <svg
                        width="14" height="14" viewBox="0 0 24 24" fill="currentColor"
                        style={{ transition: "transform 0.3s ease", transform: filterVisible ? "rotate(180deg)" : "none" }}
                    >
                        <path d="M7 10l5 5 5-5z" />
                    </svg>
                    Bộ lọc tìm kiếm
                </button>

                {/* current filter indicator */}
                {(keyword || selectedCategory) && (
                    <span style={{
                        background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)",
                        color: "#10b981", padding: "3px 10px", borderRadius: 999,
                        fontFamily: "'Outfit',sans-serif", fontSize: "0.68rem", fontWeight: 600,
                    }}>
                        {keyword ? `"${keyword}"` : categories.find(c => c.slug === selectedCategory)?.name}
                    </span>
                )}
            </div>

            {/* ── Filter box ── */}
            {filterVisible && (
                <div className="cs-filter-box space-y-4 rounded-xl p-5" style={{
                    background: "linear-gradient(160deg,#0f1420,#0a0e18)",
                    border: "1px solid rgba(16,185,129,0.1)",
                    boxShadow: "0 16px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)",
                }}>

                    {/* Header */}
                    <div className="flex items-center gap-3 pb-1" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <div className="w-[3px] h-5 rounded-full" style={{ background: "linear-gradient(#10b981,#059669)" }} />
                        <span style={{
                            fontFamily: "'Bebas Neue',cursive", fontSize: "1rem",
                            color: "#fff", letterSpacing: "0.08em",
                        }}>Tìm kiếm truyện</span>
                    </div>

                    {/* Tabs */}
                    {TabsEl}

                    {/* Keyword input */}
                    {mode === "keyword" && (
                        <div>
                            <label style={{
                                display: "block", marginBottom: 8,
                                fontFamily: "'Outfit',sans-serif", fontSize: "0.75rem",
                                fontWeight: 600, color: "rgba(255,255,255,0.45)", letterSpacing: "0.1em", textTransform: "uppercase",
                            }}>Tên truyện</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    className="cs-input"
                                    placeholder="Nhập tên truyện..."
                                    value={keyword}
                                    onChange={e => setKeyword(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && applyFilters()}
                                />
                                <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                                    width="14" height="14" viewBox="0 0 24 24" fill="rgba(255,255,255,0.25)">
                                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                                </svg>
                            </div>
                        </div>
                    )}

                    {/* Category pills */}
                    {mode === "category" && (
                        <div>
                            <label style={{
                                display: "block", marginBottom: 10,
                                fontFamily: "'Outfit',sans-serif", fontSize: "0.75rem",
                                fontWeight: 600, color: "rgba(255,255,255,0.45)", letterSpacing: "0.1em", textTransform: "uppercase",
                            }}>Thể loại</label>
                            <div className="flex flex-wrap" style={{ gap: 6 }}>
                                {categories.map(cat => (
                                    <button
                                        key={cat.slug}
                                        className={`cs-pill ${selectedCategory === cat.slug ? "active" : ""}`}
                                        onClick={() => setSelCat(selectedCategory === cat.slug ? null : cat.slug)}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    {ActionsEl}
                </div>
            )}
        </main>
    );
}