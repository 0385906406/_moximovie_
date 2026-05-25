import React from "react";
import { Play } from "lucide-react";
import type { Episode } from "@/types/episode";
// import type { PlaylistMovie } from "@/types/playlist";

interface MovieActionsRowProps {
    // dữ liệu tập đầu tiên để nút "Xem" hoạt động
    firstEpisode?: Episode | null;

    // xử lý hành động
    onPlayFirstEpisode?: () => void;
    // onToggleFavorite: () => void;
    // onTogglePlaylistPopup: () => void;
    // onCreatePlaylistClick: () => void;
    // onToggleMovieInPlaylist: (playlistId: string) => void;

    // // state
    // isFavorite: boolean;
    // isPlaylistPopupOpen: boolean;
    // loadingPlaylists: boolean;
    // playlists: PlaylistMovie[];
}

/**
 * MovieActionsRow:
 * - Hàng nút bấm: Xem, Yêu thích, Lưu
 * - Popup chọn playlist + nút tạo playlist mới
 * Tất cả logic toggle/fetch đã xử lý ở component cha.
 */
const MovieActionsRow: React.FC<MovieActionsRowProps> = ({
    firstEpisode,
    onPlayFirstEpisode,
    // onToggleFavorite,
    // onTogglePlaylistPopup,
    // onCreatePlaylistClick,
    // onToggleMovieInPlaylist,
    // isFavorite,
    // isPlaylistPopupOpen,
    // loadingPlaylists,
    // playlists,
}) => {
    return (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6 pr-3 py-2">
            {/* Nút Xem tập đầu */}
            {firstEpisode && onPlayFirstEpisode && (
                <button
                    onClick={onPlayFirstEpisode}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-black font-semibold bg-linear-to-r from-green-200 to-green-600 shadow hover:brightness-110 transition"
                >
                    <Play className="w-5 h-5" />
                    <span>Xem</span>
                </button>
            )}

            {/* Nút Yêu thích */}
            {/* <button
                onClick={onToggleFavorite}
                className={`group inline-flex items-center gap-2 px-3 py-2 text-sm transition hover:text-green-400 ${isFavorite ? "text-red-400" : "text-gray-200"
                    }`}
            >
                <Heart className="w-5 h-5" />
                <span>Yêu thích</span>
            </button> */}

            {/* Nút Lưu / Popup playlist */}
            {/* <div className="relative">
                <button
                    onClick={onTogglePlaylistPopup}
                    className="group inline-flex items-center gap-2 px-3 py-2 text-sm text-white  hover:text-green-400 transition"
                >
                    <i className="fa-bookmark fa-regular" />
                    <span>Lưu</span>
                </button>

                {isPlaylistPopupOpen && (
                    <div
                        className="
                            absolute top-full left-0 mt-2 w-72
                            rounded-[5.28px] border border-white/10
                            bg-[#05070b]/98 backdrop-blur-xl
                            shadow-[0_18px_40px_rgba(0,0,0,0.7)]
                            text-xs text-white
                            overflow-hidden
                            z-50
                            py-3
                        "
                    >
                        <div className="rounded-lg relative">
                            <h2 className="text-lg font-semibold mb-4 px-5 text-white">
                                Lưu vào...
                            </h2>

                            {loadingPlaylists ? (
                                <div className="px-5 pb-3 text-gray-400 text-sm">
                                    Đang tải playlist...
                                </div>
                            ) : (
                                <ul className="flex flex-col gap-2 max-h-40 overflow-y-auto mb-4">
                                    {playlists.map((playlist) => (
                                        <li
                                            key={playlist._id}
                                            onClick={() =>
                                                onToggleMovieInPlaylist(playlist._id)
                                            }
                                            className="flex justify-between items-center cursor-pointer px-5 py-2 hover:bg-gray-600 rounded text-white transition"
                                        >
                                            <span className="truncate max-w-[180px] text-sm">
                                                {playlist.name}
                                            </span>
                                            <i
                                                className={`fa-bookmark ${playlist.added
                                                        ? "fa-solid text-white"
                                                        : "fa-regular text-gray-400"
                                                    }`}
                                            />
                                        </li>
                                    ))}
                                    {playlists.length === 0 && (
                                        <li className="text-gray-400 text-sm text-center">
                                            Chưa có danh sách phát nào
                                        </li>
                                    )}
                                </ul>
                            )}

                            <div className="px-5 pt-3 border-t">
                                <button
                                    className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-white transition"
                                    onClick={onCreatePlaylistClick}
                                >
                                    <Plus className="w-5 h-5" />
                                    <span>Danh sách phát mới</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div> */}
        </div>
    );
};

export default MovieActionsRow;