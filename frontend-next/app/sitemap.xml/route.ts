import { indexXml, sitemapFiles } from "@/lib/sitemap";

/* Sitemap gốc: danh sách các file sitemap con (/sitemaps/...). Cache 1 ngày */
export const revalidate = 86400;

export async function GET() {
    const xml = indexXml(await sitemapFiles());
    return new Response(xml, {
        headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400" },
    });
}
