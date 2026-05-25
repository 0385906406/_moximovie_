import React, { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import { playlistService } from "@/services/playlistService";
import { watchHistoryService } from "@/services/watchHistoryService";
import { favoriteService } from "@/services/favoriteService";

import { Button } from "@/components/ui/button";
import SEO from "@/components/frontend/SEO";

import type { FavoriteMovie } from "@/types/favorite";
import type { PlaylistMovie } from "@/types/playlist";
import type { WatchHistoryItem } from "@/types/watchHistoryItem";
import type { User } from "@/types/user";
import { ThreeDot } from "react-loading-indicators";

// ===============================
//         TAB COMPONENTS
// ===============================
interface AccountTabProps {
    user: User;
}

interface FavoriteTabProps {
    userId: string;
}

interface ListTabProps {
    userId: string;
}

type WatchingTabProps = {
    userId?: string | null;
};

const AccountTab: React.FC<AccountTabProps> = ({ user }) => {
    return (
        <div>
            <SEO
                title="Trang Cá Nhân | Quản Lý Thông Tin & Yêu Thích | MoxiMovie"
                description="Trang cá nhân của bạn tại MoxiMovie: quản lý thông tin tài khoản, danh sách phim yêu thích, lịch sử xem phim. Trải nghiệm xem phim Vietsub HD mượt mà, cập nhật liên tục."
                canonical="https://www.moximovie.click/profile"
            />

            <h2 className="text-2xl font-semibold mb-2">Tài khoản</h2>
            <p className="text-gray-400 mb-6">Cập nhật thông tin tài khoản</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                {/* Form bên trái */}
                <div className="col-span-2 flex flex-col gap-5">

                    <div>
                        <label className="text-sm text-gray-300">Email</label>
                        <input
                            className="w-full bg-[#1A1B20] mt-1 rounded px-3 py-2 outline-none"
                            value={user?.email}
                            readOnly
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-300">Tên hiển thị</label>
                        <input
                            className="w-full bg-[#1A1B20] mt-1 rounded px-3 py-2 outline-none"
                            defaultValue={user?.displayName}
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-300">Giới tính</label>
                        <div className="flex gap-4 mt-2">
                            <label className="flex items-center gap-2">
                                <input type="radio" name="gender" /> Nam
                            </label>
                            <label className="flex items-center gap-2">
                                <input type="radio" name="gender" /> Nữ
                            </label>
                            <label className="flex items-center gap-2">
                                <input type="radio" name="gender" defaultChecked /> Không xác định
                            </label>
                        </div>
                    </div>

                    <button className="bg-yellow-400 text-black px-6 py-2 rounded font-semibold w-max hover:bg-yellow-300">
                        Cập nhật
                    </button>

                    <p className="text-sm mt-4">
                        Đặt mật khẩu, nhấn vào{" "}
                        <span className="text-yellow-400 cursor-pointer">đây</span>
                    </p>
                </div>

                {/* Avatar bên phải */}
                <div className="flex flex-col items-center">
                    <img
                        src="/avt-default.jpg"
                        className="w-[120px] h-[120px] rounded-full border-4 border-white"
                    />
                    <p className="text-sm text-gray-300 mt-3">Ảnh có sẵn</p>
                </div>
            </div>
        </div>
    );
};

const FavoriteTab: React.FC<FavoriteTabProps> = ({ userId }) => {
    const [favorites, setFavorites] = useState<FavoriteMovie[]>([]); // items là object movie lưu trong favorites (movieId, title, poster_url, ...)
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        // chỉ chạy khi userId có giá trị
        if (!userId) {
            setFavorites([]);
            setLoading(false);
            return;
        }

        let mounted = true;
        const loadFavorites = async () => {
            setLoading(true);
            try {
                const res = await favoriteService.getFavoritesByUser(userId);
                // API trả về: { movies: [...] }
                const movies = res?.movies ?? [];
                if (!mounted) return;
                setFavorites(movies);
            } catch (error) {
                console.error("loadFavorites error:", error);
                toast.error("Không thể tải danh sách yêu thích");
            } finally {
                if (mounted) setLoading(false);
            }
        };

        loadFavorites();

        return () => {
            mounted = false;
        };
    }, [userId]);

    if (loading) return <div className="col-span-full flex items-center justify-center py-20">
        <ThreeDot variant="bounce" color="#32cd32" size="medium" text="" textColor="" />
    </div>;

    return (
        <div>

            <h2 className="text-2xl font-semibold mb-3">Yêu thích</h2>
            {favorites.length === 0 ? (
                <p className="text-gray-400">Danh sách phim yêu thích của bạn trống.</p>
            ) : (
                <>
                    <p className="text-gray-400 mb-5">Danh sách phim yêu thích của bạn.</p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {favorites.map((movie) => {
                            return (
                                <div className="relative group rounded-[5.28px] overflow-hidden transition hover:scale-[1.02]">
                                    {/* Nút xóa */}
                                    <button
                                        className="absolute top-2 right-2 z-10 w-6 h-6 flex items-center justify-center bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition"
                                        onClick={async (e) => {
                                            e.preventDefault(); // tránh click link
                                            try {
                                                await favoriteService.toggleFavorite(userId, movie); // toggle
                                                setFavorites((prev) => prev.filter((m) => m.movieId !== movie.movieId));
                                                toast.success("Đã xoá khỏi yêu thích");
                                            } catch (err) {
                                                console.error(err);
                                                toast.error("Xoá thất bại, thử lại");
                                            }
                                        }}
                                    >
                                        ✕
                                    </button>

                                    <Link to={`/phim/${movie.slug}`}>
                                        <div className="aspect-2/3 w-full bg-white/5 relative">
                                            {movie.poster_url ? (
                                                <img
                                                    src={movie.poster_url}
                                                    alt={movie.title}
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                    width={400}
                                                    height={600}
                                                />
                                            ) : (
                                                <div className="w-full h-full grid place-items-center text-xs text-gray-500">No image</div>
                                            )}
                                        </div>

                                        <div className="p-3">
                                            <div className="text-sm text-white text-center line-clamp-1">
                                                {movie.title}
                                            </div>
                                            <div className="text-sm text-white text-center line-clamp-1">
                                                {movie.origin_name}
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};

const ListTab: React.FC<ListTabProps> = ({ userId }) => {
    const [playlists, setPlaylists] = useState<PlaylistMovie[]>([]);
    const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    // Fetch playlists từ backend
    const fetchPlaylists = useCallback(async () => {
        if (!userId) return;
        try {
            setLoading(true);
            const res = await playlistService.getPlaylistsByUser(userId);
            const playlistsData: PlaylistMovie[] = Array.isArray(res) ? res : res?.playlists ?? [];
            setPlaylists(playlistsData);
            setSelectedPlaylistId(playlistsData?.[0]?._id ?? null);
        } catch (error) {
            console.error("Lỗi khi lấy playlists:", error);
            setPlaylists([]);
            setSelectedPlaylistId(null);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchPlaylists();
    }, [fetchPlaylists]);

    const selectedPlaylist = playlists.find(p => p._id === selectedPlaylistId) ?? null;

    // ===========================
    //      XÓA PHIM
    // ===========================
    const handleRemoveMovie = async (movieId: string) => {
        if (!selectedPlaylistId) return;

        try {
            // Optimistic update
            setPlaylists(prev =>
                prev.map(p =>
                    p._id === selectedPlaylistId
                        ? { ...p, movies: p.movies.filter(m => m.movieId !== movieId) }
                        : p
                )
            );

            // Gọi backend
            await playlistService.toggleMovieInPlaylist(selectedPlaylistId, { movieId });

            toast.success("Đã xóa phim khỏi playlist");
        } catch (error) {
            console.error("Xóa phim thất bại:", error);
            toast.error("Xóa phim thất bại, vui lòng thử lại");
            // Rollback: refetch lại playlist
            fetchPlaylists();
        }
    };

    if (loading) return <div className="col-span-full flex items-center justify-center py-20">
        <ThreeDot variant="bounce" color="#32cd32" size="medium" text="" textColor="" />
    </div>;

    return (
        <div>

            <h2 className="text-2xl font-semibold mb-3">Danh sách</h2>
            <p className="text-gray-400 mb-5">Các danh sách phát của bạn.</p>

            {/* Tabs */}
            <div className="flex space-x-3 overflow-x-auto mb-5">
                {playlists.map(pl => (
                    <div key={pl._id} className="relative flex items-center space-x-1">
                        {/* Nút tab chính */}
                        <button
                            className={`py-2 text-sm font-medium border-b-2 transition-colors ${pl._id === selectedPlaylistId
                                ? "border-yellow-400 text-yellow-400"
                                : "border-transparent text-gray-300 hover:text-white"
                                }`}
                            onClick={() => setSelectedPlaylistId(pl._id)}
                        >
                            {pl.name}
                        </button>

                        <button
                            className="
    ml-1 w-5 h-5 flex items-center justify-center
    rounded-[5.28px] bg-gray-100 text-gray-600 border border-gray-300
    hover:bg-red-500 hover:text-white transition-all duration-200 transform hover:scale-110
    shadow-md
  "
                            onClick={(e) => {
                                e.stopPropagation();

                                // hiện toast confirm
                                toast("Bạn có chắc muốn xóa playlist?", {
                                    duration: Infinity, // giữ toast để người dùng chọn
                                    action: {
                                        label: "Xóa",
                                        onClick: async () => {
                                            try {
                                                await playlistService.deletePlaylist(pl._id);
                                                toast.success("Đã xóa playlist");
                                                fetchPlaylists();
                                            } catch (err) {
                                                console.error(err);
                                                toast.error("Xóa playlist thất bại");
                                            }
                                        },
                                    },
                                    cancel: {
                                        label: "Hủy",
                                        onClick: () => {
                                            toast("Hủy xóa");
                                        },
                                    },
                                });
                            }}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>

            {/* Movies in selected playlist */}
            {selectedPlaylist?.movies?.length ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {selectedPlaylist.movies.map(movie => (
                        <div
                            key={movie.movieId}
                            className="group relative rounded-[5px] overflow-hidden transition hover:scale-[1.02]"
                        >
                            {/* Nút xóa */}
                            <button
                                className="absolute top-2 right-2 z-10 w-6 h-6 flex items-center justify-center bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition"
                                onClick={() => handleRemoveMovie(movie.movieId)}
                            >
                                ✕
                            </button>

                            <Link to={`/phim/${movie.slug}`}>
                                <div className="aspect-2/3 w-full bg-white/5 relative">
                                    {movie.poster_url ? (
                                        <img
                                            src={movie.poster_url}
                                            alt={movie.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full grid place-items-center text-xs text-gray-500">
                                            No image
                                        </div>
                                    )}
                                </div>
                                <div className="p-2 text-center">
                                    <div className="text-sm text-white line-clamp-1">{movie.title}</div>
                                    <div className="text-xs text-gray-300 line-clamp-1">{movie.origin_name}</div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-400">Playlist trống.</p>
            )}
        </div>
    );
};

const WatchingTab: React.FC<WatchingTabProps> = ({ userId }) => {
    const [histories, setHistories] = useState<WatchHistoryItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        // nếu chưa đăng nhập thì khỏi gọi API
        if (!userId) {
            setHistories([]);
            setLoading(false);
            return;
        }

        let mounted = true;

        const loadHistories = async () => {
            setLoading(true);
            try {
                const res = await watchHistoryService.getUserHistories(userId);
                if (!mounted) return;

                const list = res?.data?.histories ?? [];
                setHistories(list);
            } catch (err) {
                console.error("load watch histories error:", err);
                toast.error("Không thể tải danh sách xem tiếp");
            } finally {
                if (mounted) setLoading(false);
            }
        };

        void loadHistories();

        return () => {
            mounted = false;
        };
    }, [userId]);

    if (loading) return <div className="col-span-full flex items-center justify-center py-20">
        <ThreeDot variant="bounce" color="#32cd32" size="medium" text="" textColor="" />
    </div>;

    // lọc những history có movie snapshot cho chắc ăn
    const validHistories = histories.filter((h) => h.movie);

    return (
        <div>

            <h2 className="text-2xl font-semibold mb-3">Xem tiếp</h2>

            {!userId ? (
                <p className="text-gray-400">
                    Vui lòng đăng nhập để xem danh sách phim đang xem dở.
                </p>
            ) : validHistories.length === 0 ? (
                <p className="text-gray-400">
                    Bạn chưa xem dở phim nào.
                </p>
            ) : (
                <>
                    <p className="text-gray-400 mb-5">
                        Các phim bạn đang xem dở.
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {validHistories.map((item) => {
                            const movie = item.movie!;
                            const lastEpisode =
                                item.episodes[item.episodes.length - 1];

                            return (
                                <div
                                    key={item._id}
                                    className="relative group rounded-[5.28px] overflow-hidden transition hover:scale-[1.02]"
                                >
                                    {/* Nếu sau này ông muốn nút xoá lịch sử thì thêm button ở đây */}

                                    <Link to={`/phim/${movie.slug}`}>
                                        <div className="aspect-2/3 w-full bg-white/5 relative">
                                            {movie.poster_url ? (
                                                <img
                                                    src={movie.poster_url}
                                                    alt={movie.title}
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                    width={400}
                                                    height={600}
                                                />
                                            ) : (
                                                <div className="w-full h-full grid place-items-center text-xs text-gray-500">
                                                    No image
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-3">
                                            <div className="text-sm text-white text-center line-clamp-1">
                                                {movie.title}
                                            </div>
                                            {movie.origin_name && (
                                                <div className="text-xs text-gray-300 text-center line-clamp-1">
                                                    {movie.origin_name}
                                                </div>
                                            )}

                                            {lastEpisode && (
                                                <div className="text-xs text-yellow-300 text-center mt-1">
                                                    Tiếp tục: {lastEpisode.episodeId}
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};

const NotificationTab = () => (
    <div>
        <h2 className="text-2xl font-semibold mb-3">Thông báo</h2>
        <p className="text-gray-400">Thông báo về phim và cập nhật tài khoản.</p>
    </div>
);


// ===============================
//        MAIN PAGE COMPONENT
// ===============================

const ProfilePage = () => {
    const user = useAuthStore((s) => s.user);

    // danh sách tab
    const [tab, setTab] = useState("account");

    const { signOut } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut();
            navigate("/signin");
        } catch (error) {
            console.error(error);
        };
    };

    return (
        <div className="mx-auto flex max-w-8xl flex gap-10 py-10 px-3 lg:px-20 mt-18 text-white">

            {/* ========================================
                        SIDEBAR
            ======================================== */}
            <div className="w-[260px] bg-[#14151A] rounded-[5.28px] px-5 py-6 flex flex-col justify-between">

                <div>
                    <h3 className="text-xl font-semibold mb-6">Quản lý tài khoản</h3>

                    <div className="flex flex-col gap-2 text-sm">

                        <button onClick={() => setTab("favorite")}
                            className={`py-2 px-3 text-left rounded-[5.28px] transition ${tab === "favorite" ? "bg-[#1F1F28] text-yellow-300" : "hover:bg-[#1F1F28]"
                                }`}
                        >❤️ Yêu thích</button>

                        <button onClick={() => setTab("list")}
                            className={`py-2 px-3 text-left rounded-[5.28px] transition ${tab === "list" ? "bg-[#1F1F28] text-yellow-300" : "hover:bg-[#1F1F28]"
                                }`}
                        ><i className={`fa-bookmark fa-regular text-yellow-300`} /> Danh sách</button>

                        <button onClick={() => setTab("watching")}
                            className={`py-2 px-3 text-left rounded-[5.28px] transition ${tab === "watching" ? "bg-[#1F1F28] text-yellow-300" : "hover:bg-[#1F1F28]"
                                }`}
                        >⏱ Xem tiếp</button>

                        <button onClick={() => setTab("notification")}
                            className={`py-2 px-3 text-left rounded-[5.28px] transition ${tab === "notification" ? "bg-[#1F1F28] text-yellow-300" : "hover:bg-[#1F1F28]"
                                }`}
                        >🔔 Thông báo</button>

                        <button onClick={() => setTab("account")}
                            className={`py-2 px-3 text-left rounded-[5.28px] transition ${tab === "account" ? "bg-[#1F1F28] text-yellow-300" : "hover:bg-[#1F1F28]"
                                }`}
                        >⚙️ Tài khoản</button>

                    </div>
                </div>

                {/* avatar + user info */}
                <div className="flex flex-col items-center mt-6">
                    <img
                        src="/avt-default.jpg"
                        className="w-[70px] h-[70px] rounded-full border"
                    />
                    <p className="mt-3 font-medium">{user?.displayName}</p>
                    <p className="text-sm text-gray-400">{user?.email}</p>

                    <Button onClick={handleLogout} className="bg-transparent mt-4 text-sm text-red-400 hover:text-red-300">
                        ⟵ Thoát
                    </Button>
                </div>
            </div>


            {/* ========================================
                        RIGHT CONTENT
            ======================================== */}
            <div className="flex-1">

                {tab === "account" && user && <AccountTab user={user} />}
                {tab === "favorite" && user?._id && <FavoriteTab userId={user._id} />}
                {tab === "list" && user?._id && <ListTab userId={user._id} />}
                {tab === "watching" && user?._id && <WatchingTab userId={user._id} />}
                {tab === "notification" && <NotificationTab />}

            </div>
        </div>
    );
};

export default ProfilePage;