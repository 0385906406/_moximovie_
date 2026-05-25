import Favorite from "../models/Favorite.js";

/**
 * Lấy danh sách yêu thích của 1 user
 * GET /favorites/:userId
 */
export const getFavoritesByUser = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) return res.status(400).json({ message: "Thiếu userId" });

        const favorite = await Favorite.findOne({ userId }).lean();

        return res.status(200).json({
            movies: favorite?.movies || [],
        });
    } catch (error) {
        console.error("getFavoritesByUser error:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

/**
 * Thêm hoặc xoá phim trong danh sách yêu thích (toggle)
 * POST /favorites/toggle
 * body: { userId, movie }
 */
export const toggleFavorite = async (req, res) => {
    try {
        const { userId, movie } = req.body;
        if (!userId || !movie?.movieId) {
            return res.status(400).json({ message: "Thiếu dữ liệu" });
        }

        let favorite = await Favorite.findOne({ userId });

        // Nếu chưa có danh sách => tạo mới và thêm phim đầu tiên
        if (!favorite) {
            favorite = await Favorite.create({ userId, movies: [movie] });
            return res.status(201).json({ liked: true, movies: favorite.movies });
        }

        const index = favorite.movies.findIndex(m => m.movieId === movie.movieId);

        // Nếu phim đã tồn tại => XOÁ
        if (index >= 0) {
            favorite.movies.splice(index, 1);
            await favorite.save();

            return res.status(200).json({
                liked: false,
                movies: favorite.movies
            });
        }

        // Nếu chưa tồn tại => KIỂM TRA GIỚI HẠN
        if (favorite.movies.length >= 10) {
            return res.status(200).json({
                liked: false,
                success: false,
                message: "Chỉ được thích tối đa 10 phim"
            });
        }

        // Thêm phim mới
        favorite.movies.push(movie);
        await favorite.save();

        return res.status(200).json({
            liked: true,
            movies: favorite.movies
        });

    } catch (error) {
        console.error("toggleFavorite error:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

/**
 * Xoá phim khỏi danh sách yêu thích
 * DELETE /favorites
 * body: { userId, movieId }
 */
export const removeFavorite = async (req, res) => {
    try {
        const { userId, movieId } = req.body;

        if (!userId || !movieId) {
            return res.status(400).json({ message: "Thiếu dữ liệu" });
        }

        const favorite = await Favorite.findOne({ userId });
        if (!favorite) {
            return res.status(404).json({ message: "Không tìm thấy danh sách yêu thích" });
        }

        favorite.movies = favorite.movies.filter(m => m.movieId !== movieId);
        await favorite.save();

        return res.status(200).json({ liked: false, movies: favorite.movies });
    } catch (error) {
        console.error("removeFavorite error:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

/**
 * Kiểm tra xem user đã thích phim chưa
 * GET /favorites/check?userId=xxx&movieId=yyy
 */
export const checkFavorite = async (req, res) => {
    try {
        const { userId, movieId } = req.query;

        if (!userId || !movieId) return res.status(400).json({ message: "Thiếu dữ liệu" });

        const favorite = await Favorite.findOne({ userId });
        const liked = favorite?.movies.some(m => m.movieId === movieId) || false;

        return res.status(200).json({ liked });
    } catch (error) {
        console.error("checkFavorite error:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};