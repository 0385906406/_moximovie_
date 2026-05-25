import express from "express";
import { createPlaylist, getPlaylistsByUser, toggleMovieInPlaylist, deletePlaylist } from "../controllers/playlistsControllers.js";

const router = express.Router();

router.get("/:userId", getPlaylistsByUser);
router.post("/", createPlaylist);
router.post("/toggle", toggleMovieInPlaylist);
router.delete("/:playlistId", deletePlaylist);

export default router;