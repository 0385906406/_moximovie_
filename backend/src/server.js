// src/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { connectDB } from './config/db.js';
import authRouter from './routes/authRoutes.js';
import userRoute from './routes/userRoute.js';
import tasksRoutes from './routes/tasksRoutes.js';
import favoritesRoutes from './routes/favoritesRoutes.js';
import playlistsRoutes from './routes/playlistsRoutes.js';
import watchHistory from './routes/watchHistory.js';
import movieRoutes from "./routes/movieRoutes.js";
import comicRoutes from "./routes/comicRoutes.js";
import affiliateRouter from "./routes/affiliateRouter.js";
import sitemapRoutes from "./routes/sitemapRoutes.js";
import { protectedRoute } from './middleware/authMiddleware.js';

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 4000;

// Middlewares nền tảng
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: process.env.CLIENT_URL, // chấp nhận frontend này
    credentials: true, // nếu có dùng cookie/token
}));

// Routes chính
// public routes
// SiteMapSeo
app.use("/", sitemapRoutes);
// End SiteMapSeo
app.use('/api/auth', authRouter);
app.use('/api/tasks', tasksRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/playlists', playlistsRoutes);
app.use("/api/watch-history", watchHistory);
app.use("/api/movies", movieRoutes);
app.use("/api/comics", comicRoutes);
app.use("/api/affiliate", affiliateRouter);

// private routes
app.use(protectedRoute);
app.use('/api/users', userRoute);

// Bắt lỗi JSON xấu để trả 400 gọn gàng
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && 'body' in err) {
        return res.status(400).json({ message: 'Invalid JSON', details: err.message });
    }
    next(err);
});

// Khởi động sau khi DB sẵn sàng
connectDB()
    .then(() => {
        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server running on ${PORT}`);
        });
    })
    .catch(err => {
        console.error('DB connect failed:', err.message);
        process.exit(1);
    });