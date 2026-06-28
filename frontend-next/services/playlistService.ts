import api from "@/lib/axios";

export const playlistService = {
    /** 
     * 🟢 Tạo playlist mới
     * POST /playlist
     * Body: { userId, name }
     * Response: { created: true/false, playlist?, message? }
     */
    createPlaylist: async (userId: string, name: string) => {
        const res = await api.post(
            "/playlists",
            { userId, name },
            { withCredentials: true }
        );
        return res.data;
    },

    /**
     * 🟢 Lấy tất cả playlist của user
     * GET /playlist/:userId
     * Response: { hasPlaylists: boolean, playlists: [] }
     */
    getPlaylistsByUser: async (userId: string, movieId?: string) => {
        const res = await api.get(`/playlists/${userId}`, {
            params: { movieId },  // gửi movieId dưới dạng query
            withCredentials: true,
        });
        return res.data;
    },

    /**
     * 🟢 Thêm hoặc xoá phim trong playlist
     * POST /playlist/toggle
     * Body: { playlistId, movieId }
     * Response:
     *   - Nếu thêm: { inPlaylist: true, playlist }
     *   - Nếu xoá: { inPlaylist: false, playlist }
     *   - Nếu quá 10 phim: { inPlaylist: false, message: "...max 10..." }
     */
    toggleMovieInPlaylist: async (playlistId: string, movie: any) => {
        // movie: { movieId, slug, title, origin_name, poster_url }
        const res = await api.post(
            "/playlists/toggle",
            { playlistId, movie },
            { withCredentials: true }
        );
        return res.data;
    },

    /**
     * 🟢 Xóa playlist
     * DELETE /playlists/:playlistId
     * Response: { success: true/false, message? }
     */
    deletePlaylist: async (playlistId: string) => {
        const res = await api.delete(`/playlists/${playlistId}`, {
            withCredentials: true,
        });
        return res.data;
    },
};