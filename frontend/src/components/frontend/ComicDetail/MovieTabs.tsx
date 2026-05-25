import React from "react";
import { Play } from "lucide-react";
import type { Episode } from "@/types/episode";
import type { Movie } from "@/types/movie";

type TabKey = "tap-phim" | "the-loai" | "dao-dien" | "dien-vien";

interface MovieTabsProps {
    tab: TabKey;
    onChangeTab: (tab: TabKey) => void;

    movie: Movie;
    episodes: Episode[];
    isEpisodeWatched: (ep: Episode) => boolean;
    onPlayEpisode: (ep: Episode) => void;
}

/**
 * MovieTabs:
 * - Thanh tab (Tập phim / Thể loại / Đạo diễn / Diễn viên)
 * - Render nội dung tương ứng
 */
const MovieTabs: React.FC<MovieTabsProps> = ({
    tab,
    onChangeTab,
    movie,
    episodes,
    isEpisodeWatched,
    onPlayEpisode,
}) => {
    const tabs: { key: TabKey; label: string }[] = [
        { key: "tap-phim", label: "Tập phim" },
        { key: "the-loai", label: "Thể loại" },
        { key: "dao-dien", label: "Đạo diễn" },
        { key: "dien-vien", label: "Diễn viên" },
    ];

    return (
        <>
            {/* Thanh tab */}
            <div className="flex border-b border-white/10 mb-6">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.key
                                ? "border-yellow-400 text-yellow-400"
                                : "border-transparent text-gray-300 hover:text-white"
                            }`}
                        onClick={() => onChangeTab(t.key)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Nội dung từng tab */}
            {tab === "tap-phim" && (
                <div className="max-h-[520px] overflow-y-auto pr-2">
                    <div className="mt-2 grid gap-3 grid-cols-[repeat(auto-fit,minmax(120px,1fr))]">
                        {episodes.map((ep, i) => {
                            const watched = isEpisodeWatched(ep);
                            return (
                                <button
                                    key={ep.slug ?? i}
                                    onClick={() => onPlayEpisode(ep)}
                                    className={`w-full px-3 py-2.5 text-sm text-white rounded-[5.28px] flex items-center justify-center gap-1 whitespace-nowrap transition ${watched
                                            ? "bg-emerald-800 hover:bg-emerald-700"
                                            : "bg-[#1b1e29] hover:bg-[#262a38]"
                                        }`}
                                >
                                    <Play className="w-4 h-4 text-yellow-400" />
                                    {ep.name || `Tập ${i + 1}`}
                                    {watched && (
                                        <span className="ml-1 text-green-400 font-bold">
                                            ✓
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {tab === "the-loai" &&
                (movie.category?.length ? (
                    <div className="mt-2 grid gap-3 grid-cols-[repeat(auto-fit,minmax(120px,1fr))]">
                        {movie.category.map((cat, i) => (
                            <div
                                key={i}
                                className="w-full px-3 py-2.5 text-sm text-white rounded-[5.28px] text-center font-semibold bg-[#1b1e29] hover:bg-[#262a38] transition"
                            >
                                {cat.name}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-white italic">
                        Đang cập nhật danh sách thể loại...
                    </p>
                ))}

            {tab === "dao-dien" &&
                (movie.director?.length ? (
                    <div className="mt-2 grid gap-3 grid-cols-[repeat(auto-fit,minmax(120px,1fr))]">
                        {movie.director.map((d, i) => (
                            <div
                                key={i}
                                className="w-full px-3 py-2.5 text-sm text-white rounded-[5.28px] text-center font-semibold bg-[#1b1e29] hover:bg-[#262a38] transition"
                            >
                                {d}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-white italic">
                        Đang cập nhật đạo diễn...
                    </p>
                ))}

            {tab === "dien-vien" &&
                (movie.actor?.length ? (
                    <div className="mt-2 grid gap-3 grid-cols-[repeat(auto-fit,minmax(120px,1fr))]">
                        {movie.actor.map((a, i) => (
                            <div
                                key={i}
                                className="w-full px-3 py-2.5 text-sm text-white rounded-[5.28px] text-center font-semibold bg-[#1b1e29] hover:bg-[#262a38] transition"
                            >
                                {a}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-white italic">
                        Đang cập nhật danh sách diễn viên...
                    </p>
                ))}
        </>
    );
};

export default MovieTabs;