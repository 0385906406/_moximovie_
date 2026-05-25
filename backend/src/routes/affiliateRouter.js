// src/routes/affiliateRouter.js
import express from "express";

const router = express.Router();

const SHOPEE_URL      = "https://s.shopee.vn/AACZVSQTrY";
const COOLDOWN_MS     = 60 * 60 * 1000; // 1 tiếng
const lastOpenMap     = new Map();       // lưu theo IP

router.get("/shopee", (req, res) => {
    const ip   = req.headers["x-forwarded-for"]?.split(",")[0].trim()
                 || req.socket.remoteAddress;
    const now  = Date.now();
    const last = lastOpenMap.get(ip) ?? 0;

    if (now - last < COOLDOWN_MS) {
        // Đã mở rồi → đóng tab luôn bằng HTML
        return res.send(`<script>window.close();</script>`);
    }

    lastOpenMap.set(ip, now);

    // ✅ 302 redirect → browser mobile không block
    res.redirect(302, SHOPEE_URL);
});

export default router;