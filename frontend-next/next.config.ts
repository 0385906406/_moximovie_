import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        /* Resize qua app/api/img/route.ts — xem lib/imageLoader.ts */
        loader: "custom",
        loaderFile: "./lib/imageLoader.ts",
        /* Ít kích thước → ít biến thể ảnh, cache hit cao hơn. Giữ khớp với WIDTHS trong route */
        deviceSizes: [640, 828, 1080, 1280, 1920],
        imageSizes: [96, 128, 256, 384],
        qualities: [70, 75, 80],
    },
};

export default nextConfig;
