import mongoose from "mongoose";

const WatchedEpisodeSchema = new mongoose.Schema({
    episodeId: { type: String, required: true },
}, { _id: false });

const MovieSnapshotSchema = new mongoose.Schema({
    movieId: { type: String, required: true },
    slug: { type: String, required: true },
    title: { type: String, required: true },
    origin_name: { type: String },
    poster_url: { type: String },
}, { _id: false });

const WatchHistorySchema = new mongoose.Schema({
    userId: { type: String, required: true },
    movieId: { type: String, required: true }, // vẫn giữ nếu ông muốn query nhanh
    movie: { type: MovieSnapshotSchema, required: false }, // snapshot info phim
    episodes: [WatchedEpisodeSchema],
}, { timestamps: true });

export default mongoose.model("WatchHistory", WatchHistorySchema);