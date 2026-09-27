/*
 * Thẻ SEO dùng tính năng có sẵn của React 19: <title>, <meta>, <link> render ở đâu cũng được
 * React tự đưa lên <head> — kể cả khi render trên server, nên Google đọc được ngay từ HTML.
 * (Trước dùng react-helmet: chỉ chạy trên trình duyệt + cảnh báo UNSAFE_componentWillMount với React 19.)
 */

interface SEOProps {
    title: string;
    description: string;
    canonical: string;
    image?: string;
    type?: "website" | "movie" | "collection";
    name?: string; // tên ngắn gọn cho schema
}

export default function SEO({
    title,
    description,
    canonical,
    image = "https://www.moximovie.click/default-og.jpg",
    type = "website",
    name,
}: SEOProps) {
    const schemaType =
        type === "movie" ? "Movie" : type === "collection" ? "CollectionPage" : "WebPage";

    const schema = {
        "@context": "https://schema.org",
        "@type": schemaType,
        name: name || title.split("|")[0].trim(),
        description: description,
        url: canonical,
        image: image,
        publisher: {
            "@type": "Organization",
            name: "MoxiMovie",
            logo: {
                "@type": "ImageObject",
                url: "https://www.moximovie.click/NewYear/favicon.ico",
            },
        },
    };

    return (
        <>
            {/* Basic */}
            <title>{title}</title>
            <meta name="description" content={description} />
            <link rel="canonical" href={canonical} />

            {/* OG */}
            <meta property="og:locale" content="vi_VN" />
            <meta property="og:type" content="website" />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:url" content={canonical} />
            <meta property="og:site_name" content="MoxiMovie" />
            <meta property="og:image" content={image} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />

            {/* Schema — "<" được escape để nội dung (tên phim...) không thể đóng thẻ script */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
            />

            {/* Không preload ảnh OG: ảnh này dành cho Facebook/Zalo khi chia sẻ link,
                người xem trang không cần → preload chỉ tốn băng thông */}
        </>
    );
}
