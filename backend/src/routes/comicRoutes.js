import express from "express";
import axios from "axios";

const router = express.Router();

const COMIC_API = "https://otruyenapi.com";
const APP_DOMAIN_CDN_IMAGE = "https://img.otruyenapi.com";

/**
 * =========================
 * ROUTES
 * =========================
 */

// Comic List
router.get("/list", async (req, res) => {
    try {
        const { page = 1 } = req.query;

        const response = await axios.get(
            `${COMIC_API}/v1/api/danh-sach/truyen-moi`,
            { params: { page } }
        );

        const { data } = response.data;

        res.json({
            items: data.items.map(item => ({
                ...item,
                thumb_full: `${APP_DOMAIN_CDN_IMAGE}/uploads/comics/${item.thumb_url}`,
            })),
            pagination: data.params.pagination,
        });
    } catch (err) {
        console.error("Comic API error:", err.message);
        res.status(500).json({ message: "Failed to fetch comics" });
    }
});

router.get("/category/:slug", async (req, res) => {
    try {
        const { page = 1 } = req.query;
        const { slug } = req.params;

        const response = await axios.get(
            `${COMIC_API}/v1/api/the-loai/${slug}`,
            { params: { page } }
        );

        const { data } = response.data;

        res.json({
            items: data.items.map(item => ({
                ...item,
                thumb_full: `${APP_DOMAIN_CDN_IMAGE}/uploads/comics/${item.thumb_url}`,
            })),
            pagination: data.params.pagination,
        });
    } catch (err) {
        console.error("Comic API error:", err.message);
        res.status(500).json({ message: "Failed to fetch comics" });
    }
});

router.get("/search", async (req, res) => {
    try {
        const { keyword = "", page = 1 } = req.query;

        if (!keyword) {
            return res.status(400).json({ message: "Keyword is required" });
        }

        const response = await axios.get(
            `${COMIC_API}/v1/api/tim-kiem`,
            {
                params: {
                    keyword,
                    page,
                },
            }
        );

        const { data } = response.data;

        res.json({
            items: data.items.map(item => ({
                ...item,
                thumb_full: `${APP_DOMAIN_CDN_IMAGE}/uploads/comics/${item.thumb_url}`,
            })),
            pagination: data.params.pagination,
        });
    } catch (err) {
        console.error("Comic Search API error:", err.message);
        res.status(500).json({ message: "Failed to search comics" });
    }
});

router.get("/detail/:slug", async (req, res) => {
    try {
        const { slug } = req.params;

        const response = await axios.get(
            `${COMIC_API}/v1/api/truyen-tranh/${slug}`
        );

        const item = response.data.data.item;

        if (item) {
            item.thumb_full = `${APP_DOMAIN_CDN_IMAGE}/uploads/comics/${item.thumb_url}`;
        }

        res.json(item || {});
    } catch (err) {
        console.error("Comic detail error:", err.message);
        res.status(500).json({ message: "Failed to fetch comic detail" });
    }
});

export default router;