import express from "express";
import axios from "axios";
import { create } from "xmlbuilder2";

const router = express.Router();

/**
 * =====================
 * CONFIG
 * =====================
 */
const SITE_URL = process.env.SITE_URL || "https://moximovie.com";
const PHIM_API = "https://phimapi.com";

// sitemap cache
let cachedSitemap = null;
let lastBuildTime = 0;
const CACHE_TIME = 1000 * 60 * 30; // 30 phút

const TODAY = new Date().toISOString();

/**
 * Helper build movie url
 */
const movieUrl = (slug) => `${SITE_URL}/phim/${slug}.html`;

/**
 * =====================
 * ROBOTS.TXT
 * =====================
 */
router.get("/robots.txt", (req, res) => {
    res.type("text/plain");
    res.send(`
User-agent: *
Allow: /

Disallow: /api/
Disallow: /login
Disallow: /signup
Disallow: /signin
Disallow: /admin
Disallow: /*?*
Disallow: /*&*

Sitemap: ${SITE_URL}/sitemap.xml
    `.trim());
});

/**
 * =====================
 * SITEMAP.XML
 * =====================
 */
router.get("/sitemap.xml", async (req, res) => {
    try {
        // ✅ dùng cache
        if (cachedSitemap && Date.now() - lastBuildTime < CACHE_TIME) {
            res.type("application/xml");
            return res.send(cachedSitemap);
        }

        const root = create({ version: "1.0", encoding: "UTF-8" })
            .ele("urlset", {
                xmlns: "http://www.sitemaps.org/schemas/sitemap/0.9"
            });

        /**
         * ===========
         * TRANG TĨNH
         * ===========
         */
        const staticPages = [
            { loc: SITE_URL, priority: 1.0 },
            { loc: `${SITE_URL}/phim-le.html`, priority: 0.9 },
            { loc: `${SITE_URL}/phim-bo.html`, priority: 0.9 },
            { loc: `${SITE_URL}/hoat-hinh.html`, priority: 0.9 },
            { loc: `${SITE_URL}/gioi-thieu.html`, priority: 0.8 },
            { loc: `${SITE_URL}/lien-he-quang-cao.html`, priority: 0.8 },
        ];

        staticPages.forEach(page => {
            root.ele("url")
                .ele("loc").txt(page.loc).up()
                .ele("lastmod").txt(TODAY).up()
                .ele("changefreq").txt("daily").up()
                .ele("priority").txt(page.priority).up()
                .up();
        });

        /**
         * ===========
         * PHIM
         * ===========
         */
        const types = ["phim-le", "phim-bo", "hoat-hinh", "phim-chieu-rap"];
        const countries = ["han-quoc", "viet-nam", "nhat-ban"];

        for (const type of types) {
            for (const country of countries) {
                const apiUrl = `${PHIM_API}/v1/api/danh-sach/${type}?countru=${country}&year=2025&page=1&page=1&sort_field=modified&sort_type=desc&limit=50`;
                const response = await axios.get(apiUrl);

                const items = response.data?.data?.items || [];

                items.forEach(movie => {
                    root.ele("url")
                        .ele("loc").txt(movieUrl(movie.slug)).up()
                        .ele("lastmod").txt(
                            movie.modified?.time
                                ? new Date(movie.modified.time).toISOString()
                                : TODAY
                        ).up()
                        .ele("changefreq").txt("weekly").up()
                        .ele("priority").txt("0.7").up()
                        .up();
                });
            }
        }

        const xml = root.end({ prettyPrint: true });

        // cache lại
        cachedSitemap = xml;
        lastBuildTime = Date.now();

        const xmlClean = xml.replace(/<script[\s\S]*?<\/script>/gi, '');
        res.type("application/xml");
        res.send(xmlClean);

    } catch (err) {
        console.error("Sitemap error:", err.message);
        res.status(500).send("Failed to generate sitemap");
    }
});

export default router;