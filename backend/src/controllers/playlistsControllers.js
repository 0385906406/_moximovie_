import Playlist from "../models/Playlist.js";

/**
 * Tạo playlist mới (tối đa 5 playlist / user)
 */
export const createPlaylist = async (req, res) => {
    try {
        const { userId, name } = req.body;

        if (!userId || !name) {
            return res.status(400).json({ message: "Thiếu userId hoặc name" });
        }

        // Kiểm tra trùng tên
        const existing = await Playlist.findOne({ userId, name });
        if (existing) {
            return res.status(200).json({
                created: false,
                message: "Tên playlist đã tồn tại, hãy chọn tên khác"
            });
        }

        // Giới hạn 5 playlist
        const count = await Playlist.countDocuments({ userId });
        if (count >= 5) {
            return res.status(200).json({
                created: false,
                success: false,
                message: "Bạn chỉ được tạo tối đa 5 playlist"
            });
        }

        // Tạo playlist mới
        const playlist = await Playlist.create({
            userId,
            name,
            movies: []
        });

        return res.status(201).json({
            created: true,
            playlist
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};



/**
 * Thêm hoặc xoá phim trong playlist
 * playlist tối đa 10 phim
 * movies là array of OBJECT
 */
export const toggleMovieInPlaylist = async (req, res) => {
    try {
        const { playlistId, movie } = req.body;
        if (!playlistId || !movie) {
            return res.status(400).json({ message: "Thiếu playlistId hoặc movie" });
        }

        const playlist = await Playlist.findById(playlistId);
        if (!playlist) return res.status(404).json({ message: "Playlist không tồn tại" });

        const index = playlist.movies.findIndex(m => m.movieId === movie.movieId);

        if (index >= 0) {
            // Xoá phim
            playlist.movies.splice(index, 1);
            await playlist.save();

            return res.status(200).json({
                inPlaylist: false,
                playlist,
            });
        }

        // Kiểm tra số phim
        if (playlist.movies.length >= 10) {
            return res.status(400).json({
                inPlaylist: false,
                message: "Playlist chỉ được chứa tối đa 10 phim"
            });
        }

        playlist.movies.push(movie);
        await playlist.save();

        return res.status(200).json({
            inPlaylist: true,
            playlist,
        });

    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};


/**
 * Lấy tất cả playlist theo user
 * Nếu có movieId → thêm field added = true/false
 */
export const getPlaylistsByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { movieId } = req.query;

        let playlists = await Playlist.find({ userId })
            .sort({ createdAt: -1 })
            .lean();

        // Nếu cần kiểm tra movie đã có trong từng playlist chưa
        if (movieId) {
            playlists = playlists.map((playlist) => ({
                ...playlist,
                added: playlist.movies.some((m) => m.movieId === movieId)
            }));
        }

        return res.status(200).json({
            playlists
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

export const deletePlaylist = async (req, res) => {
    try {
        const { playlistId } = req.params;
        if (!playlistId) {
            return res.status(400).json({ message: "Thiếu playlistId" });
        }

        const playlist = await Playlist.findById(playlistId);
        if (!playlist) {
            return res.status(404).json({ message: "Playlist không tồn tại" });
        }

        await Playlist.findByIdAndDelete(playlistId);

        return res.status(200).json({
            success: true,
            message: "Playlist đã được xóa"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Lỗi hệ thống" });
    }
};