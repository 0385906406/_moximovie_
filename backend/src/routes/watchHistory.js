import express from "express";
import { getUserWatchHistory, getWatched, markWatched } from "../controllers/watchHistoryController.js";

const router = express.Router();

// GET: lấy tập đã xem
router.get("/:userId/:movieId", getWatched);

// lấy tất cả phim user đã xem
router.get("/:userId", getUserWatchHistory);

// POST: đánh dấu tập đã xem
router.post("/:userId/:movieId", markWatched);

export default router;