import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true, // mỗi user chỉ có 1 document
        },
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

const Favorite = mongoose.model("Favorite", favoriteSchema);

export default Favorite;