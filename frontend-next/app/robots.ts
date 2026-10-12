import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/movieImage";

/* robots.txt: cho Google đọc toàn bộ trang phim, chặn API và phòng xem chung (phòng riêng tư, tạm thời) */
export default function robots(): MetadataRoute.Robots {
    return {
        rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/phong/"] }],
        sitemap: `${SITE_URL}/sitemap.xml`,
        host: SITE_URL,
    };
}
