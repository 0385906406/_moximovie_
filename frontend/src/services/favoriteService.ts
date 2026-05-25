import api from "@/lib/axios";

export const favoriteService = {
    /** Kiểm tra xem một movie có được user thích hay chưa */
    checkFavorite: async (userId: string, movieId: string) => {
        const res = await api.get(`/favorites/check`, {
            params: { userId, movieId },
            withCredentials: true
        });
        return res.data; // { liked: true/false }
    },

    /** Lấy danh sách phim yêu thích của 1 user */
    getFavoritesByUser: async (userId: string) => {
        const res = await api.get(`/favorites/${userId}`, {
            withCredentials: true
        });
        return res.data; // { movies: [...] }
    },

    /** Thêm hoặc xoá phim trong danh sách yêu thích (toggle) */
    toggleFavorite: async (userId: string, movie: any) => {
        const res = await api.post(
            `/favorites/toggle`,
            { userId, movie },
            { withCredentials: true }
        );
        return res.data; // { liked: true/false, movies: [...] }
    },

    /** Xoá khỏi yêu thích (nếu bạn vẫn muốn giữ API này) */
    removeFavorite: async (userId: string, movieId: string) => {
        const res = await api.delete(`/favorites`, {
            data: { userId, movieId },
            withCredentials: true
        });
        return res.data; // { liked: false, movies: [...] }
    }
};