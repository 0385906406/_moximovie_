import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        name: {
            type: String,
            required: true,
        },

        // giống favoriteSchema
        movies: [
            {
                movieId: { type: String, required: true },
                slug: { type: String },
                title: { type: String },
                origin_name: { type: String },
                poster_url: { type: String },
            }
        ],
    },
    { timestamps: true }
);

const Playlist = mongoose.model("Playlist", playlistSchema);
export default Playlist;