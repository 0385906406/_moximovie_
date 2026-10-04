"use client";

import React, { useEffect, useState } from "react";
import { movieService } from "@/services/movieService";
import MovieCard from "../MovieCard";
import { ThreeDot } from "react-loading-indicators";
import Link from "next/link";
import { Play } from "lucide-react";
import type { Episode } from "@/types/episode";
import type { Movie } from "@/types/movie";
import ServerSwitcher from "./ServerSwitcher";
import type { Server } from "@/types/server";
import MovieImage from "@/components/frontend/MovieImage";
import { serverTone } from "@/lib/serverTone";
import Image from "next/image";
import type { TmdbCast } from "@/lib/tmdb";

type TabKey = "tap-phim" | "the-loai" | "dao-dien" | "dien-vien";

const TMDB_IMG = "https://image.tmdb.org/t/p";

interface MovieTabsProps {
    tab: TabKey;
    onChangeTab: (tab: TabKey) => void;

    movie: Movie;
    servers: Server[];
    /* Diễn viên có ảnh (từ phimapi/TMDB). Không có → tab hiện danh sách tên từ movie.actor */
    cast?: TmdbCast[];

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
    cast,
    isEpisodeWatched,
    onPlayEpisode,
    currentEpisode,
}) => {
    /* Hình ảnh của bộ phim (tối đa 5 ảnh ngang). Không có thì không hiện mục này */
    const [stills, setStills] = useState<string[]>([]);
    useEffect(() => {
        let alive = true;
        movieService.dataImages(movie.slug)
            .then((d: { images?: { type: string; file_path: string }[]; image_sizes?: { backdrop?: { w780?: string } } } | null) => {
                const base = d?.image_sizes?.backdrop?.w780;
                const urls = (d?.images ?? [])
                    .filter(img => img.type === "backdrop" && img.file_path)
                    .slice(0, 5)
                    .map(img => `${base ?? "https://image.tmdb.org/t/p/w780"}${img.file_path}`);
                if (alive) setStills(urls);
            })
            .catch(() => { if (alive) setStills([]); });
        return () => { alive = false; };
    }, [movie.slug]);

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
                                                    ${serverTone(s.server_name).bg} rounded-lg overflow-hidden`
                                                    }
                                                >
                                                    {/* Ảnh nền: chỉ chiếm 65% bên phải */}
                                                    <MovieImage
                                                        plain movie={movie} prefer="poster"
                                                        alt={ep.name ?? ""}
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
                                                        ${serverTone(s.server_name).bg} rounded-lg`
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
                                                                        {serverTone(s.server_name).label}
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

                    {stills.length > 0 && (
                        <>
                            <p className="text-white text-[14px] font-medium leading-relaxed whitespace-pre-line mt-5">Hình ảnh</p>
                            <section className="mt-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                                {stills.map((src, i) => (
                                    <div key={src} className="relative rounded-lg overflow-hidden bg-[#141722] border border-white/[0.06]" style={{ aspectRatio: "16/9" }}>
                                        <Image
                                            src={src}
                                            alt={`${movie.name} - ảnh ${i + 1}`}
                                            fill
                                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                            className="object-cover"
                                        />
                                    </div>
                                ))}
                            </section>
                        </>
                    )}

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
                                href={`/loc-phim?category=${cat.slug}&page=1`}
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
                (cast?.length ? (
                    <div className="mt-2 grid gap-4 grid-cols-[repeat(auto-fill,minmax(96px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(112px,1fr))]">
                        {cast.map((p) => (
                            <Link
                                key={p.id}
                                href={`/tim-kiem?keyword=${encodeURIComponent(p.name)}`}
                                className="group text-center"
                            >
                                <div className="relative w-[84px] h-[84px] sm:w-[96px] sm:h-[96px] mx-auto rounded-full overflow-hidden ring-2 ring-white/10 group-hover:ring-green-400/70 transition-all duration-300">
                                    {p.profile ? (
                                        <Image
                                            src={`${TMDB_IMG}/w185${p.profile}`}
                                            alt={p.name}
                                            fill
                                            sizes="96px"
                                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                    ) : (
                                        <span className="absolute inset-0 flex items-center justify-center bg-[#1b1e29] text-white/50 text-2xl font-bold">
                                            {p.name.charAt(0)}
                                        </span>
                                    )}
                                </div>
                                <p className="mt-2 text-white/90 text-[12.5px] font-semibold leading-tight line-clamp-2 group-hover:text-green-400 transition-colors">{p.name}</p>
                                {p.character && <p className="mt-0.5 text-white/40 text-[11px] leading-tight line-clamp-1">{p.character}</p>}
                            </Link>
                        ))}
                    </div>
                ) : movie.actor?.length ? (
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