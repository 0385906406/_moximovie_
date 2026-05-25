import express from "express";
import { 
    toggleFavorite,
    checkFavorite,
    getFavoritesByUser,
    removeFavorite 
} from "../controllers/favoritesControllers.js";

const router = express.Router();

// đặt route tĩnh lên trước
router.get("/check", checkFavorite);
router.get("/:userId", getFavoritesByUser);

router.post("/toggle", toggleFavorite);
router.delete("/", removeFavorite);

export default router;