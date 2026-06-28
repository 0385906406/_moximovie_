import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            { protocol: "https", hostname: "phimimg.com" },
            { protocol: "https", hostname: "image.tmdb.org" },
            { protocol: "https", hostname: "www.moximovie.click" },
            { protocol: "https", hostname: "cdn.dribbble.com" },
        ],
    },
};

export default nextConfig;
