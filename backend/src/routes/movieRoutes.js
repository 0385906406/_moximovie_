import express from "express";
import axios from "axios";

const router = express.Router();

const PHIM_API = "https://phimapi.com";

const apiKey = process.env.TMDB_KEY;
/**
 * =========================
 * ROUTES
 * =========================
 */

// Slider
router.get("/slider", async (req, res) => {
    try {
        const response = await axios.get(
            `${PHIM_API}/v1/api/danh-sach/phim-le?page=1&sort_field=modified&sort_type=desc&year=2026&limit=10`
        );

        res.json(response.data.data.items);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch slider" });
    }
});

// Comming Movies
router.get("/coming-movies", async (req, res) => {
    try {
        const response = await axios.get(
            `https://api.themoviedb.org/3/movie/upcoming?api_key=${apiKey}&language=vi-VN&region=VN&page=1`
        );

        res.json(response.data?.results || []);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch data" });
    }
});

// Movies In Theaters
router.get("/movies-in-theaters", async (req, res) => {
    try {
        const response = await axios.get(
            `https://api.themoviedb.org/3/movie/now_playing?api_key=${apiKey}&language=vi-VN&region=VN&page=1`
        );

        res.json(response.data?.results || []);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch data" });
    }
});

// Sửa route để nhận id và fetch đúng
router.get("/coming-movie-detail", async (req, res) => {
    try {
        const { id } = req.query; // ← lấy id từ query
        if (!id) return res.status(400).json({ message: "Missing id" });

        // Fetch song song 3 endpoint
        const [detail, credits, videos] = await Promise.all([
            axios.get(`https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&language=vi-VN`),
            axios.get(`https://api.themoviedb.org/3/movie/${id}/credits?api_key=${apiKey}&language=vi-VN`),
            axios.get(`https://api.themoviedb.org/3/movie/${id}/videos?api_key=${apiKey}&language=vi-VN`),
        ]);

        res.json({
            detail:  detail.data,
            credits: credits.data,
            videos:  videos.data,
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch data" });
    }
});

// Search
router.get("/search", async (req, res) => {
    const { keyword, page = 1, limit = 16 } = req.query;

    // Validate params
    const currentPage = Math.max(1, parseInt(page) || 1);
    const pageLimit = Math.min(50, Math.max(1, parseInt(limit) || 16)); // giới hạn tối đa 50

    const url = `${PHIM_API}/v1/api/tim-kiem?keyword=${encodeURIComponent(
        keyword || ""
    )}&page=${currentPage}&limit=${pageLimit}`;

    const response = await axios.get(url);
    const data = response.data?.data;

    res.json({
        items: data?.items || [],
        pagination: {
            currentPage,
            totalPages: Math.ceil((data?.params?.pagination?.totalItems || 0) / pageLimit),
            totalItems: data?.params?.pagination?.totalItems || 0,
            limit: pageLimit,
            hasNextPage: currentPage < Math.ceil((data?.params?.pagination?.totalItems || 0) / pageLimit),
            hasPrevPage: currentPage > 1,
        },
    });
});

// Dữ liệu Phim Theo Nước
router.get("/country/:country", async (req, res) => {
    try {
        const { country } = req.params;
        const { year } = req.query;

        const qs = new URLSearchParams({
            page: "1",
            sort_field: "modified",
            sort_type: "desc",
            limit: "10",
            country,
        });

        if (year) qs.set("year", year);

        const response = await axios.get(
            `${PHIM_API}/v1/api/danh-sach/phim-bo?${qs.toString()}`
        );

        res.json(response.data?.data?.items || []);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch movies" });
    }
});

// Dữ liệu Phim Theo Kiểu
router.get("/type/:type", async (req, res) => {
    try {
        const { type } = req.params; // ✅ đúng
        const { limit, year, page, country, category } = req.query;

        const qs = new URLSearchParams({
            sort_field: "modified",
            sort_type: "desc", // ✅ đúng
            limit: limit ?? "10",
            page: page ?? 1,
            year: year ?? "",
            country: country ?? "",
            category: category ?? ""
        });

        const response = await axios.get(
            `${PHIM_API}/v1/api/danh-sach/${type}?${qs.toString()}`
        );

        res.json(response.data?.data?.items || []);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch movies" });
    }
});

// Filter nâng cao
router.get("/filter", async (req, res) => {
    try {
        const {
            type_list = "phim-le",
            page = 1,
            sort_field = "modified",
            sort_type = "desc",
            category,
            country,
            year,
            limit = 24,
            sort_lang,
        } = req.query;

        const qs = new URLSearchParams({
            page: String(page),
            sort_field,
            sort_type,
            limit: String(limit),
        });

        if (sort_lang) qs.set("sort_lang", sort_lang);
        if (category) qs.set("category", category);
        if (country) qs.set("country", country);
        if (year) qs.set("year", Number(year));

        const url = `${PHIM_API}/v1/api/danh-sach/${type_list}?${qs.toString()}`;

        const response = await axios.get(url);

        res.json({
            items: response.data?.data?.items || [],
            pagination: response.data?.data?.params?.pagination || null,
            type_list,
            params: response.data?.data?.params || {},
        });

    } catch (err) {
        console.error("Filter error:", err.message);
        res.status(500).json({
            items: [],
            pagination: null,
            type_list: req.query?.type_list || "phim-le",
            params: {},
        });
    }
});

// Chi tiết phim
router.get("/detail/:slug", async (req, res) => {
    const { slug } = req.params;
    const response = await axios.get(`${PHIM_API}/phim/${slug}`);
    res.json(response.data || {});
});
export default router;