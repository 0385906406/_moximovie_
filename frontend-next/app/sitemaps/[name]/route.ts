import { LIST_TYPES, movieUrls, staticUrls, urlsetXml, type ListType } from "@/lib/sitemap";

/* File sitemap con: static.xml (trang cố định + bộ lọc) hoặc {loại}-{số}.xml (trang phim) */
export const revalidate = 86400;

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
    const name = (await params).name;
    let urls;
    if (name === "static.xml") {
        urls = staticUrls();
    } else {
        const m = name.match(/^([a-z-]+)-(\d{1,4})\.xml$/);
        const type = m?.[1] as ListType | undefined;
        const part = Number(m?.[2]);
        if (!type || !LIST_TYPES.includes(type) || !part) return new Response("Not found", { status: 404 });
        urls = await movieUrls(type, part);
    }
    return new Response(urlsetXml(urls), {
        headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400" },
    });
}
