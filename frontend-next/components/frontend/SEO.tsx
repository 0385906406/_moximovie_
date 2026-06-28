import { Helmet } from "react-helmet";

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

    return (
        <Helmet>
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

            {/* Schema */}
            <script type="application/ld+json">
                {JSON.stringify({
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
                })}
            </script>

            {/* Preload */}
            <link rel="preload" href={image} as="image" />
        </Helmet>
    );
}