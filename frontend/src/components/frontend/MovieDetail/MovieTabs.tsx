import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import { Play } from "lucide-react";
import type { Episode } from "@/types/episode";
import type { Movie } from "@/types/movie";
import ServerSwitcher from "./ServerSwitcher";
import type { Server } from "@/types/server";
import MovieCard from "../MovieCard";
import { movieService } from "@/services/movieService";
import { ThreeDot } from "react-loading-indicators";

type TabKey = "tap-phim" | "the-loai" | "dao-dien" | "dien-vien";

interface MovieTabsProps {
    tab: TabKey;
    onChangeTab: (tab: TabKey) => void;

    movie: Movie;
    servers: Server[];

    onPlayEpisode: (
        ep: Episode,
        epIndex: number,
        serverIndex: number
    ) => void;

    isEpisodeWatched: (ep: Episode) => boolean;
    currentEpisode?: Episode | null;
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
    servers,
    isEpisodeWatched,
    onPlayEpisode,
    currentEpisode,
}) => {
    const tabs: { key: TabKey; label: string }[] = [
        { key: "tap-phim", label: "Tập phim" },
        { key: "the-loai", label: "Thể loại" },
        { key: "dao-dien", label: "Đạo diễn" },
        { key: "dien-vien", label: "Diễn viên" },
    ];
    const [serverIndex, setServerIndex] = useState(0);
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(false);
    const currentServer = servers[serverIndex];
    const episodes = currentServer?.server_data ?? [];

    const country = movie.country?.map(c => c.slug).join(",") ?? "";
    const category = movie.category?.map(c => c.slug).join(",") ?? "";

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const res = await movieService.dataFilterMovie({
                country,
                category,
                limit: 16,
            });
            setMovies(res.items);
            setLoading(false);
        };

        load();
    }, [country, category]);

    return (
        <>
            {/* Thanh tab */}
            <div className="flex border-b border-white/10 mb-6">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.key
                            ? "border-green-400 text-green-400"
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
                <>
                    {/* Chọn server */}
                    {(movie.episode_total != "1" && movie.episode_current != "Full") && (
                        <ServerSwitcher
                            servers={servers}
                            currentIndex={serverIndex}
                            onChange={(idx) => setServerIndex(idx)}
                        />
                    )}

                    <div className="max-h-[400px] overflow-y-auto pr-2 pt-4">
                        {(movie.episode_total === "1" && movie.episode_current === "Full") ? (
                            <>
                                <div className="
                                grid gap-6
                                grid-cols-1
                                md:grid-cols-1
                                xl:grid-cols-3
                                place-items-center
                            ">
                                    {servers.map((s, idx) => {
                                        const ep = s.server_data?.[0];
                                        if (!ep) return null;

                                        return (
                                            <button
                                                key={s.server_name}
                                                onClick={() => onPlayEpisode(ep, 0, idx)}
                                                className="w-full text-left transition-all duration-300 hover:-translate-y-2"
                                            >
                                                {/* CARD */}
                                                <div
                                                    className={`                                                    
                                                    relative
                                                    h-[260px] sm:h-[349.33px] lg:h-[200.33px] xl:w-[349.33px] xl:h-[182.77px] overflow-hidden
                                                    ${(s.server_name == "#Hà Nội (Vietsub)") ? "bg-[#565868]" : ((s.server_name == "#Hà Nội (Lồng Tiếng)") ? "bg-[#1d2e79]" : (s.server_name == "#Hà Nội (Thuyết Minh)") ? "bg-[#297447]" : "bg-[#565868]")} rounded-lg overflow-hidden`
                                                    }
                                                >
                                                    {/* Ảnh nền: chỉ chiếm 65% bên phải */}
                                                    <img
                                                        src={movie.poster_url}
                                                        alt={ep.name}
                                                        className="
                                                            absolute inset-y-0 right-0
                                                            w-[35%] h-full
                                                            object-cover object-center
                                                            opacity-0
                                                            transition-opacity duration-700
                                                            cursor-pointer rounded-tr-lg rounded-br-lg
                                                        "
                                                        style={{
                                                            WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, black 30%, black 100%)',
                                                            WebkitMaskRepeat: 'no-repeat',
                                                            WebkitMaskSize: 'cover',
                                                            maskImage: 'linear-gradient(90deg, transparent 0%, black 30%, black 100%)',
                                                            maskRepeat: 'no-repeat',
                                                            maskSize: 'cover',
                                                        }}
                                                        onLoad={(e) => {
                                                            e.currentTarget.style.opacity = "1";
                                                        }}
                                                    />

                                                    {/* OVERLAY: gradient giống style bạn gửi */}
                                                    <div className="pointer-events-none absolute inset-0 z-0 rounded-lg">
                                                        <div
                                                            className={`                                                        
                                                        absolute inset-0
                                                        opacity-30
                                                        mix-blend-soft-light
                                                        ${(s.server_name == "#Hà Nội (Vietsub)") ? "bg-[#565868]" : ((s.server_name == "#Hà Nội (Lồng Tiếng)") ? "bg-[#1d2e79]" : (s.server_name == "#Hà Nội (Thuyết Minh)") ? "bg-[#297447]" : "bg-[#565868]")} rounded-lg`
                                                            }
                                                        />
                                                    </div>

                                                    {/* NỘI DUNG BÊN TRÁI */}
                                                    <div className="relative z-10 flex flex-col h-full rounded-lg">
                                                        {/* Khối text lớn bên trái */}
                                                        <div className="flex-1 flex items-center rounded-lg">
                                                            <div className="w-full max-w-2xl px-4 sm:px-8 space-y-4 sm:space-y-5">
                                                                <div>
                                                                    <p
                                                                        className="
                                                                    text-[10px] sm:text-[15px] lg:text-[16px] xl:text-[14px]
                                                                    text-white
                                                                "
                                                                    >
                                                                        {(s.server_name == "#Hà Nội (Vietsub)") ? "Phụ đề" : ((s.server_name == "#Hà Nội (Lồng Tiếng)") ? "Lồng tiếng" : (s.server_name == "#Hà Nội (Thuyết Minh)") ? "Thuyết minh" : "Khác")}
                                                                    </p>
                                                                </div>
                                                                {/* Tên phim */}
                                                                <div className="flex flex-wrap gap-2 text-white text-base sm:text-[20px] lg:text-[20px] xl:text-[18px] sm:text-xs font-medium lg:text-[16.8px]">
                                                                    {movie.name}
                                                                </div>

                                                                {/* Hàng badge trên: IMDb / tuổi / năm / phần / tập… tuỳ bạn map */}
                                                                <div className="flex flex-wrap gap-2 text-[11px] sm:text-[16px] lg:text-[14px] text-white font-medium">
                                                                    <span className="px-[11.2px] py-[4.8px] rounded-[5px] bg-white text-black font-semibold">
                                                                        Xem bản này
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="mt-2 grid gap-3 grid-cols-[repeat(auto-fit,minmax(120px,1fr))]">
                                    {episodes.map((ep, i) => {
                                        const watched = isEpisodeWatched(ep);
                                        const isWatching = currentEpisode?.slug === ep.slug;
                                        return (
                                            <button
                                                key={ep.slug ?? i}
                                                onClick={() => onPlayEpisode(ep, i, serverIndex)}
                                                style={
                                                    watched && !isWatching
                                                        ? {
                                                            background: "rgba(74,222,128,0.10)",
                                                            border: "1px solid rgba(74,222,128,0.45)",
                                                            color: "#4ade80",
                                                        }
                                                        : isWatching
                                                        ? {
                                                            background: "rgba(74,222,128,0.18)",
                                                            border: "1px solid #4ade80",
                                                            color: "#86efac",
                                                            boxShadow: "0 0 10px rgba(74,222,128,0.25)",
                                                        }
                                                        : {}
                                                }
                                                className={`relative w-full px-3 py-2.5 text-sm rounded-[5.28px]
                                                    flex items-center justify-center gap-1
                                                    transition-all duration-200
                                                    ${!watched && !isWatching
                                                        ? "bg-[#1b1e29] hover:bg-[#262a38] text-white border border-transparent"
                                                        : ""
                                                    }
                                                `}
                                            >
                                                {/* checkmark badge top-right */}
                                                {watched && !isWatching && (
                                                    <span
                                                        className="absolute top-1 right-1.5 text-[10px] font-bold leading-none"
                                                        style={{ color: "#4ade80" }}
                                                    >
                                                        ✓
                                                    </span>
                                                )}

                                                <span className="flex items-center gap-1">
                                                    <Play
                                                        className={`w-3.5 h-3.5 ${isWatching ? "animate-bounce" : ""}`}
                                                        style={{ color: isWatching ? "#86efac" : watched ? "#4ade80" : "#4ade80" }}
                                                    />
                                                    <span className="font-medium">{ep.name || `Tập ${i + 1}`}</span>
                                                </span>

                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div >

                    <p className="text-white text-[14px] font-medium leading-relaxed whitespace-pre-line mt-5 line-clamp-18">Đề xuất cho bạn</p>
                    <section className="mt-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4">
                        {loading ? (
                            <div className="col-span-full flex items-center justify-center py-20">
                                <ThreeDot variant="bounce" color="#32cd32" size="medium" text="" textColor="" />
                            </div>
                        ) : movies.length === 0 ? (
                            <p className="text-gray-400 col-span-full text-center py-8">Không có phim</p>
                        ) : (
                            movies.map(movie => <MovieCard key={movie._id} movie={movie} />)
                        )}
                    </section>
                </>
            )}

            {
                tab === "the-loai" &&
                (movie.category?.length ? (
                    <div className="mt-2 grid gap-3 grid-cols-[repeat(auto-fit,minmax(120px,1fr))]">
                        {movie.category.map((cat, i) => (
                            <Link
                                key={i}
                                to={`/loc-phim?category=${cat.slug}&page=1`}
                                className="w-full px-3 py-2.5 text-sm text-white rounded-[5.28px] text-center font-semibold bg-[#1b1e29] hover:bg-[#262a38] transition"
                            >
                                {cat.name}
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p className="text-white italic">
                        Đang cập nhật danh sách thể loại...
                    </p>
                ))
            }

            {
                tab === "dao-dien" &&
                (movie.director?.length ? (
                    <div className="mt-2 grid gap-3 grid-cols-[repeat(auto-fit,minmax(120px,1fr))]">
                        {movie.director.map((d, i) => (
                            <a
                                key={i}
                                href={`https://www.google.com/search?q=${encodeURIComponent(d)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full px-3 py-2.5 text-sm text-white rounded-[5.28px] text-center font-semibold bg-[#1b1e29] hover:bg-[#262a38] transition"
                            >
                                {d}
                            </a>
                        ))}
                    </div>
                ) : (
                    <p className="text-white italic">
                        Đang cập nhật đạo diễn...
                    </p>
                ))
            }

            {
                tab === "dien-vien" &&
                (movie.actor?.length ? (
                    <div className="mt-2 grid gap-3 grid-cols-[repeat(auto-fit,minmax(120px,1fr))]">
                        {movie.actor.map((a, i) => (
                            <a
                                key={i}
                                href={`https://www.google.com/search?q=${encodeURIComponent(a)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full px-3 py-2.5 text-sm text-white rounded-[5.28px] text-center font-semibold bg-[#1b1e29] hover:bg-[#262a38] transition"
                            >
                                {a}
                            </a>
                        ))}
                    </div>
                ) : (
                    <p className="text-white italic">
                        Đang cập nhật danh sách diễn viên...
                    </p>
                ))
            }
        </>
    );
};

export default MovieTabs;