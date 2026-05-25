import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { comicService } from "@/services/comicService";
import Breadcrumb from "@/components/frontend/Breadcrumb";
import ComicSidebar from "@/components/frontend/ComicDetail/ComicSidebar";
import type { Comic } from "@/types/comic";

interface ChapterImage { image_page: number; image_file: string; }
interface Chapter {
    _id: string; comic_name: string; chapter_name: string;
    chapter_title?: string; chapter_path: string; chapter_image: ChapterImage[];
}

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@400;500;600;700;800&display=swap');
  .cdp-root * { box-sizing: border-box; }

  /* chapter list item */
  .cdp-ch-item { transition: all 0.22s cubic-bezier(0.16,1,0.3,1); }
  .cdp-ch-item:hover { transform: translateX(6px); background: rgba(16,185,129,0.08) !important; }
  .cdp-ch-item.active { background: rgba(16,185,129,0.14) !important; border-left: 2px solid #10b981; }

  /* chapter images fade in */
  @keyframes cdpFadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
  .cdp-img-item { animation: cdpFadeIn 0.4s ease both; }

  /* scrollbar */
  .cdp-scroll::-webkit-scrollbar { width: 4px; }
  .cdp-scroll::-webkit-scrollbar-track { background: transparent; }
  .cdp-scroll::-webkit-scrollbar-thumb { background: rgba(16,185,129,0.4); border-radius: 4px; }
  .cdp-scroll::-webkit-scrollbar-thumb:hover { background: rgba(16,185,129,0.7); }

  /* skeleton */
  @keyframes cdpShimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  .cdp-skeleton {
    background: linear-gradient(90deg,#111520 25%,#1a2030 50%,#111520 75%);
    background-size: 400px 100%; border-radius: 8px;
    animation: cdpShimmer 1.6s ease-in-out infinite;
  }

  /* nav button */
  .cdp-nav-btn { transition: all 0.2s ease; }
  .cdp-nav-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(16,185,129,0.4)!important; }
  .cdp-nav-btn:active { transform: scale(0.97); }

  /* chapter panel slide in */
  @keyframes cdpSlideIn { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:none} }
  .cdp-chapter-panel { animation: cdpSlideIn 0.35s cubic-bezier(0.16,1,0.3,1) both; }
`;

let injected = false;

/* ── Loading skeleton ── */
const PageSkeleton = () => (
    <div className="cdp-root w-full px-3 lg:px-5 xl:px-6 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
            <div className="space-y-3">
                <div className="cdp-skeleton h-10 w-48" />
                <div className="cdp-skeleton h-[500px] w-full rounded-2xl" />
            </div>
            <div className="cdp-skeleton h-[600px] rounded-2xl" />
        </div>
    </div>
);

/* ── Chapter image viewer ── */
const ChapterViewer = ({ chapter, onClose }: { chapter: Chapter; onClose: () => void }) => (
    <div className="cdp-chapter-panel rounded-2xl overflow-hidden mb-6"
        style={{
            background: "linear-gradient(160deg,#0c111c,#080d15)",
            border: "1px solid rgba(16,185,129,0.12)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
        }}>
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid rgba(16,185,129,0.1)" }}>
            <div className="flex items-center gap-3">
                <div className="w-1 h-6 rounded-full" style={{ background: "linear-gradient(#10b981,#059669)" }} />
                <div>
                    <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Đang đọc</p>
                    <h2 style={{ fontFamily: "'Bebas Neue',cursive", fontSize: "1.15rem", color: "#fff", letterSpacing: "0.05em", lineHeight: 1.1 }}>
                        {chapter.comic_name} — Chương {chapter.chapter_name}
                        {chapter.chapter_title && <span style={{ color: "#10b981", marginLeft: 8, fontSize: "0.9rem" }}>{chapter.chapter_title}</span>}
                    </h2>
                </div>
            </div>
            <button onClick={onClose} className="cdp-nav-btn flex items-center justify-center rounded-full"
                style={{ width: 34, height: 34, background: "rgba(255,255,255,0.05)", border: "1.5px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: "1rem" }}>
                ✕
            </button>
        </div>

        {/* images */}
        <div className="cdp-scroll overflow-y-auto px-4 py-5 space-y-2" style={{ maxHeight: 680 }}>
            {chapter.chapter_image.map((img, i) => {
                const url = `https://sv1.otruyencdn.com/${chapter.chapter_path}/${img.image_file}`;
                return (
                    <img key={img.image_page}
                        src={url} alt={`Trang ${img.image_page}`}
                        className="cdp-img-item w-full rounded-lg shadow-lg"
                        style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
                    />
                );
            })}
        </div>
    </div>
);

export default function ComicDetailPage() {
    const { slug } = useParams();
    const [comic, setComic] = useState<Comic | null>(null);
    const [loading, setLoading] = useState(false);
    const [currentChapter, setCurrent] = useState<Chapter | null>(null);
    const [chapterLoading, setChLoading] = useState(false);
    const [searchCh, setSearchCh] = useState("");

    useEffect(() => {
        if (!injected) {
            const s = document.createElement("style");
            s.textContent = STYLES;
            document.head.appendChild(s);
            injected = true;
        }
    }, []);

    useEffect(() => {
        if (!slug) return;
        let mounted = true;
        setLoading(true);
        comicService.dataDetailComic(slug)
            .then(res => { if (mounted) setComic(res || null); })
            .catch(e => console.error(e))
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, [slug]);

    useEffect(() => {
        if (currentChapter) window.scrollTo({ top: 0, behavior: "smooth" });
    }, [currentChapter]);

    const handleClickChapter = async (apiUrl: string) => {
        setChLoading(true);
        try {
            const res = await fetch(apiUrl);
            const data = await res.json();
            if (data.status === "success") setCurrent(data.data.item);
        } catch (e) { console.error(e); }
        finally { setChLoading(false); }
    };

    const chapters = comic?.chapters?.[0]?.server_data ?? [];
    const filtered = chapters.filter(ch =>
        ch.chapter_name.toLowerCase().includes(searchCh.toLowerCase()) ||
        (ch.chapter_title ?? "").toLowerCase().includes(searchCh.toLowerCase())
    );

    /* nav helpers */
    const currentIdx = currentChapter
        ? chapters.findIndex(ch => ch.chapter_name === currentChapter.chapter_name)
        : -1;
    const hasPrev = currentIdx > 0;
    const hasNext = currentIdx !== -1 && currentIdx < chapters.length - 1;

    if (loading) return <PageSkeleton />;

    if (!comic) return (
        <div className="flex flex-col items-center justify-center w-full h-[300px] text-gray-400">
            <div style={{ fontSize: "2rem", marginBottom: 12 }}>📚</div>
            <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: "0.9rem" }}>Không tìm thấy truyện</p>
        </div>
    );

    return (
        <div className="cdp-root">
            <Breadcrumb />

            <div className="max-w-[1640px] mx-auto px-3 lg:px-5 xl:px-6 mt-4">
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-6">

                    {/* ── LEFT: chapter viewer + sidebar (mobile) ── */}
                    <div>
                        {/* chapter loading */}
                        {chapterLoading && (
                            <div className="rounded-2xl mb-6 overflow-hidden" style={{ border: "1px solid rgba(16,185,129,0.1)", background: "#0c111c" }}>
                                <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                    <div className="cdp-skeleton h-6 w-6 rounded-full" />
                                    <div className="cdp-skeleton h-5 w-48" />
                                </div>
                                <div className="p-5 space-y-3">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="cdp-skeleton w-full" style={{ height: 180 + (i % 3) * 40 }} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* chapter viewer */}
                        {currentChapter && !chapterLoading && (
                            <>
                                {/* prev/next nav */}
                                <div className="flex items-center justify-between mb-4 px-1">
                                    <button
                                        onClick={() => hasPrev && handleClickChapter(chapters[currentIdx - 1].chapter_api_data!)}
                                        disabled={!hasPrev}
                                        className="cdp-nav-btn flex items-center gap-2 rounded-lg px-4 py-2"
                                        style={{
                                            background: hasPrev ? "linear-gradient(135deg,#10b981,#059669)" : "rgba(255,255,255,0.04)",
                                            color: hasPrev ? "#021a12" : "rgba(255,255,255,0.2)",
                                            border: hasPrev ? "none" : "1px solid rgba(255,255,255,0.06)",
                                            fontFamily: "'Outfit',sans-serif", fontSize: "0.78rem", fontWeight: 700,
                                            cursor: hasPrev ? "pointer" : "not-allowed",
                                            boxShadow: hasPrev ? "0 4px 14px rgba(16,185,129,0.3)" : "none",
                                        }}>
                                        ← Chương trước
                                    </button>

                                    <span style={{
                                        fontFamily: "'Bebas Neue',cursive", fontSize: "0.95rem",
                                        color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em",
                                    }}>
                                        {currentIdx + 1} / {chapters.length}
                                    </span>

                                    <button
                                        onClick={() => hasNext && handleClickChapter(chapters[currentIdx + 1].chapter_api_data!)}
                                        disabled={!hasNext}
                                        className="cdp-nav-btn flex items-center gap-2 rounded-lg px-4 py-2"
                                        style={{
                                            background: hasNext ? "linear-gradient(135deg,#10b981,#059669)" : "rgba(255,255,255,0.04)",
                                            color: hasNext ? "#021a12" : "rgba(255,255,255,0.2)",
                                            border: hasNext ? "none" : "1px solid rgba(255,255,255,0.06)",
                                            fontFamily: "'Outfit',sans-serif", fontSize: "0.78rem", fontWeight: 700,
                                            cursor: hasNext ? "pointer" : "not-allowed",
                                            boxShadow: hasNext ? "0 4px 14px rgba(16,185,129,0.3)" : "none",
                                        }}>
                                        Chương sau →
                                    </button>
                                </div>

                                <ChapterViewer chapter={currentChapter} onClose={() => setCurrent(null)} />
                            </>
                        )}

                        {/* sidebar mobile */}
                        <div className="flex lg:hidden xl:hidden">
                            <ComicSidebar comic={comic} />
                        </div>
                    </div>

                    {/* ── RIGHT: chapter list ── */}
                    <aside className="rounded-2xl overflow-hidden flex flex-col"
                        style={{
                            background: "linear-gradient(160deg,#0c111c,#080d15)",
                            border: "1px solid rgba(16,185,129,0.1)",
                            boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
                            maxHeight: currentChapter ? 680 : 650,
                            position: "sticky", top: 16,
                        }}>

                        {/* header */}
                        <div className="px-5 py-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(16,185,129,0.08)" }}>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-1 h-5 rounded-full flex-shrink-0" style={{ background: "linear-gradient(#10b981,#059669)" }} />
                                <h2 style={{ fontFamily: "'Bebas Neue',cursive", fontSize: "1.1rem", color: "#fff", letterSpacing: "0.06em" }}>
                                    Danh sách chương
                                </h2>
                                <span className="ml-auto rounded-full px-2.5 py-0.5"
                                    style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981", fontFamily: "'Outfit',sans-serif", fontSize: "0.65rem", fontWeight: 700 }}>
                                    {chapters.length}
                                </span>
                            </div>

                            {/* search */}
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Tìm chương..."
                                    value={searchCh}
                                    onChange={e => setSearchCh(e.target.value)}
                                    style={{
                                        width: "100%", padding: "8px 14px 8px 36px",
                                        background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.07)",
                                        borderRadius: 8, color: "#fff", outline: "none",
                                        fontFamily: "'Outfit',sans-serif", fontSize: "0.78rem",
                                        transition: "border-color 0.2s",
                                    }}
                                    onFocus={e => (e.target.style.borderColor = "rgba(16,185,129,0.4)")}
                                    onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.07)")}
                                />
                                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                                    width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" strokeLinecap="round">
                                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                                </svg>
                            </div>
                        </div>

                        {/* list */}
                        <ul className="cdp-scroll overflow-y-auto flex-1 py-2 px-2">
                            {filtered.length === 0 && (
                                <li className="py-8 text-center" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "0.8rem", color: "rgba(255,255,255,0.3)" }}>
                                    Không tìm thấy chương
                                </li>
                            )}
                            {filtered.map((ch, idx) => {
                                const isActive = currentChapter?.chapter_name === ch.chapter_name;
                                return (
                                    <li key={idx}>
                                        <button
                                            onClick={() => ch.chapter_api_data && handleClickChapter(ch.chapter_api_data)}
                                            className={`cdp-ch-item w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 ${isActive ? "active" : ""}`}
                                            style={{ background: "transparent", border: "none", cursor: "pointer", borderLeft: isActive ? undefined : "2px solid transparent" }}
                                        >
                                            {/* index number */}
                                            <span className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                                                style={{
                                                    background: isActive ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.04)",
                                                    fontFamily: "'Bebas Neue',cursive", fontSize: "0.78rem",
                                                    color: isActive ? "#10b981" : "rgba(255,255,255,0.3)",
                                                    border: isActive ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(255,255,255,0.06)",
                                                }}>
                                                {chapters.findIndex(c => c.chapter_name === ch.chapter_name) + 1}
                                            </span>

                                            <div className="flex-1 min-w-0">
                                                <p style={{
                                                    fontFamily: "'Outfit',sans-serif", fontSize: "0.8rem", fontWeight: 600,
                                                    color: isActive ? "#10b981" : "rgba(255,255,255,0.85)",
                                                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                                }}>
                                                    Chương {ch.chapter_name}
                                                    {ch.filename && <span style={{ color: "rgba(255,255,255,0.35)", fontWeight: 400 }}> — {ch.filename}</span>}
                                                </p>
                                                {ch.chapter_title && (
                                                    <p style={{
                                                        fontFamily: "'Outfit',sans-serif", fontSize: "0.68rem",
                                                        color: isActive ? "#6ee7b7" : "rgba(255,255,255,0.35)",
                                                        marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                                    }}>
                                                        {ch.chapter_title}
                                                    </p>
                                                )}
                                            </div>

                                            {/* active indicator */}
                                            {isActive && (
                                                <svg width="10" height="10" viewBox="0 0 10 10" fill="#10b981">
                                                    <circle cx="5" cy="5" r="5" />
                                                </svg>
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </aside>

                    {/* sidebar desktop */}
                    <div className="hidden lg:flex xl:flex col-span-full">
                        <ComicSidebar comic={comic} />
                    </div>

                </div>
            </div>
        </div>
    );
}