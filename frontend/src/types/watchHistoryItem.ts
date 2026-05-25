
import type { MovieSnapshot } from "./movieSnapshot";
import type { WatchedEpisode } from "./watchedEpisode";

export interface WatchHistoryItem {
    _id: string;
    userId: string;
    movieId: string;
    movie?: MovieSnapshot;
    episodes: WatchedEpisode[];
    createdAt: string;
    updatedAt: string;
};