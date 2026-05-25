import mongoose from "mongoose";

export async function connectDB() {
    const uri = process.env.MONGODB_CONNECTTIONSTRING;
    if (!uri) throw new Error("Missing MONGODB_CONNECTTIONSTRING");

    // cho query chặt chẽ hơn
    mongoose.set("strictQuery", true);

    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000
        });

        const dbName = mongoose.connection.name;
        console.log(`[Mongo] connected DB → ${dbName}`);
    } catch (err) {
        console.error("[Mongo] connection error:", err.message);
        throw err;
    }

    // events để biết khi nào đứt
    mongoose.connection.on("error", e => console.error("[Mongo] error:", e.message));
    mongoose.connection.on("disconnected", () => console.warn("[Mongo] disconnected"));
}