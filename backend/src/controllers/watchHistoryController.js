import WatchHistory from "../models/WatchHistory.js";

/**
 * GET /api/watch-history/:userId/:movieId
 * Lấy danh sách tập đã xem của user với movie
 */
export const getWatched = async (req, res) => {
    try {
        const { userId, movieId } = req.params;
        const history = await WatchHistory.findOne({ userId, movieId });
        res.json({
            success: true,
            watchedEpisodes: history?.episodes || []
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

/**
 * GET /api/watch-history/:userId
 * Lấy toàn bộ lịch sử xem của 1 user (mọi phim)
 */
export const getUserWatchHistory = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "userId required",
            });
        }

        // Lấy tất cả history của user, sort theo cập nhật mới nhất
        const histories = await WatchHistory.find({ userId })
            .sort({ updatedAt: -1 })
            .lean();

        return res.json({
            success: true,
            histories,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Lỗi server",
        });
    }
};

/**
 * POST /api/watch-history/:userId/:movieId
 * Ghi lại một tập phim đã xem
 * body: { episodeId }
 */
export const markWatched = async (req, res) => {
    try {
        const { userId, movieId } = req.params;
        const { episodeId, movie } = req.body; // nhận thêm movie snapshot từ FE

        if (!episodeId) {
            return res.status(400).json({
                success: false,
                message: "episodeId required",
            });
        }

        let history = await WatchHistory.findOne({ userId, movieId });

        if (!history) {
            history = new WatchHistory({
                userId,
                movieId,
                episodes: [],
            });

            // nếu có gửi movie từ FE thì gán luôn
            if (movie) {
                history.movie = {
                    movieId: movie.movieId || movieId,
                    slug: movie.slug,
                    title: movie.title,
                    origin_name: movie.origin_name,
                    poster_url: movie.poster_url,
                };
            }
        } else if (movie) {
            // optional: update lại info phim nếu có thay đổi (title mới, poster mới...)
            history.movie = {
                movieId: movie.movieId || movieId,
                slug: movie.slug,
                title: movie.title,
                origin_name: movie.origin_name,
                poster_url: movie.poster_url,
            };
        }

        const epIndex = history.episodes.findIndex(
            (e) => e.episodeId === episodeId
        );
        if (epIndex < 0) {
            history.episodes.push({ episodeId });
        }

        await history.save();

        res.json({
            success: true,
            history,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Lỗi server",
        });
    }
};