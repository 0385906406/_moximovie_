import React from "react";
import { Link } from "react-router";
import type { Movie } from "@/types/movie";
import Chip from "./Chip";

interface MovieSidebarProps {
    movie: Movie;
}

/**
 * MovieSidebar: hiển thị poster + thông tin cơ bản + mô tả phim
 * Chỉ nhận data từ props, không chứa logic fetch.
 */
const MovieSidebar: React.FC<MovieSidebarProps> = ({ movie }) => {
    return (
        <aside className="rounded-tl-[1.25rem] rounded-tr-[3rem] rounded-br-[1.25rem] rounded-bl-[1.25rem] p-3 sm:p-8 lg:p-8 xl:p-8 bg-[rgb(25,27,36)]">
            <div className="gap-6">
                <img
                    src={movie.poster_url}
                    alt={movie.name}
                    className="w-40 h-60 rounded-[5.28px] shadow-xl object-cover"
                    loading="lazy"
                />
                <div className="min-w-0">
                    {/* Tên phim (có thể là HTML từ API nên dùng dangerouslySetInnerHTML) */}
                    <h2
                        className="text-2xl text-white font-bold mt-3"
                        dangerouslySetInnerHTML={{
                            __html: movie.name ?? "",
                        }}
                    />
                    {/* Tên gốc */}
                    {movie.origin_name && (
                        <p
                            className="text-sm text-green-400 italic mt-3"
                            dangerouslySetInnerHTML={{
                                __html: movie.origin_name ?? "",
                            }}
                        />
                    )}

                    <div className="flex flex-wrap gap-2 mt-4">
                        {movie.category?.length ? (
                            movie.category.map((c, i) => (
                                <Link
                                    key={i}
                                    to={`/loc-phim?category=${c.slug}&page=1`}
                                    className={`px-2 py-1 bg-white/10 rounded-[5.28px] text-white text-[11px]`}
                                >
                                    {c.name}
                                </Link>
                            ))
                        ) : (
                            <Chip small>Đang cập nhật</Chip>
                        )}
                    </div>
                </div>
            </div>

            {(movie.type === "series" && movie.status === "ongoing") && (
                <div className="flex gap-2 text-[12px] text-[#ff8300] mt-5 border border-[#ff83001a] rounded-lg px-3 py-2 items-center w-max bg-[#ff83001a]">
                    <svg
                        className="h-4 w-4 animate-spin text-[#ff8300]"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        />
                    </svg>

                    <span>
                        Đã chiếu: {movie.episode_current} / <b>{movie.episode_total}</b> tập
                    </span>
                </div>
            )}

            {(movie.type === "series" && movie.status === "completed") && (
                <div className="flex gap-2 text-[12px] text-[#22cb4c] mt-5 border border-[#22cb4c1a] rounded-lg px-3 py-2 items-center w-max bg-[#22cb4c1a]">
                    <i className="fa-solid fa-circle-check"></i>

                    <span>
                        {movie.episode_current} tập
                    </span>
                </div>
            )}

            <p className="text-white text-[14px] font-medium leading-relaxed whitespace-pre-line mt-5 line-clamp-18">Giới thiệu:</p>
            {/* Nội dung phim */}
            <p
                className="text-gray-200/80 text-[13px] leading-relaxed whitespace-pre-line line-clamp-18"
                dangerouslySetInnerHTML={{
                    __html: movie.content ?? "",
                }}
            />

            <div className="flex mt-5 gap-2">
                <p className="text-white text-[14px] font-medium leading-relaxed whitespace-pre-line line-clamp-18">Năm:</p>
                <Link
                    to={`/loc-phim?year=${movie.year}&page=1`}
                    className="
                        text-gray-200/80 text-[13px] leading-relaxed 
                        whitespace-pre-line line-clamp-18 cursor-pointer
                        hover:text-green-400 hover:underline transition-colors duration-200
                    "
                >
                    {movie.year ? movie.year : "Đang cập nhật"}
                </Link>
            </div>

            <div className="flex mt-5 gap-2">
                <p className="text-white text-[14px] font-medium leading-relaxed whitespace-pre-line line-clamp-18">Tập hiện tại:</p>
                <p
                    className="text-gray-200/80 text-[13px] leading-relaxed whitespace-pre-line line-clamp-18"
                >
                    {movie.episode_current ? movie.episode_current : "Đang cập nhật"}
                </p>
            </div>

            <div className="flex mt-5 gap-2">
                <p className="text-white text-[14px] font-medium leading-relaxed whitespace-pre-line line-clamp-18">Tổng số tập:</p>
                <p
                    className="text-gray-200/80 text-[13px] leading-relaxed whitespace-pre-line line-clamp-18"
                >
                    {movie.episode_total} tập
                </p>
            </div>

            <div className="flex mt-5 gap-2">
                <p className="text-white text-[14px] font-medium leading-relaxed whitespace-pre-line line-clamp-18">Thời lượng:</p>
                <p
                    className="text-gray-200/80 text-[13px] leading-relaxed whitespace-pre-line line-clamp-18"
                >
                    {movie.time}
                </p>
            </div>

            <div className="flex mt-5 gap-2">
                <p className="text-white text-[14px] font-medium leading-relaxed whitespace-pre-line line-clamp-18">Quốc gia:</p>
                <div className="text-gray-200/80 text-[13px] leading-relaxed whitespace-pre-line line-clamp-18">
                    <div className="flex flex-wrap gap-2">
                        {movie.country?.length ? (
                            movie.country.map((c, i) => (
                                <Link
                                    key={i}
                                    to={`/loc-phim?country=${c.slug}&page=1`}
                                    className="
                                        text-gray-200/80 text-[13px] leading-relaxed 
                                        whitespace-pre-line line-clamp-18 cursor-pointer
                                        hover:text-green-400 hover:underline transition-colors duration-200
                                    "
                                >
                                    {c.name ? c.name : "Đang cập nhật"}
                                </Link>
                            ))
                        ) : (
                            "Đang cập nhật"
                        )}
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default MovieSidebar;