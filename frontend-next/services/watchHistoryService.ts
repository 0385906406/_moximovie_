// services/watchHistoryService.ts
import api from "@/lib/axios";
import type { MovieSnapshot } from "@/types/movieSnapshot";

export const watchHistoryService = {
    markWatched(
        userId: string,
        movieId: string,
        episodeId: string,
        movieData?: MovieSnapshot
    ) {
        return api.post(`/watch-history/${userId}/${movieId}`, {
            episodeId,
            movie: movieData,
        });
    },

    getWatched(userId: string, movieId: string) {
        return api.get(`/watch-history/${userId}/${movieId}`);
    },

    // lấy tất cả phim user đã xem (để dùng cho tab Xem tiếp)
    getUserHistories(userId: string) {
        return api.get(`/watch-history/${userId}`);
    },
};
