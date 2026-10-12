/* ── Sitemap tự động ──
   Google không chạy JS của web để tìm phim → cần sitemap liệt kê từng trang phim.
   phimapi có ~30.000 phim: chia thành nhiều file nhỏ (mỗi file = PAGES_PER_FILE trang danh sách × 64 phim),
   mỗi file cache 1 ngày → Google tải dần, không gọi dồn phimapi (phimapi tạm chặn khi bị gọi dồn).
   Dùng nguồn phimapi vì đó là nguồn mặc định (Google không có cookie chọn máy chủ). */

import { categories } from "@/data/category";
import { countries } from "@/data/country";
import { SITE_URL } from "@/lib/movieImage";
import { PHIM_API } from "@/lib/phimApi";

export const LIST_TYPES = ["phim-le", "phim-bo", "hoat-hinh", "tv-shows"] as const;
export type ListType = (typeof LIST_TYPES)[number];
const PER_PAGE = 64;
export const PAGES_PER_FILE = 20;
const init = { next: { revalidate: 86400 }, signal: AbortSignal.timeout(10000) };

export interface SitemapUrl { loc: string; lastmod?: string; changefreq?: string; priority?: number }

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function urlsetXml(urls: SitemapUrl[]) {
    const body = urls.map(u =>
        `<url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}${u.changefreq ? `<changefreq>${u.changefreq}</changefreq>` : ""}${u.priority ? `<priority>${u.priority.toFixed(1)}</priority>` : ""}</url>`,
    ).join("");
    return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
}

export function indexXml(files: string[]) {
    const now = new Date().toISOString();
    const body = files.map(f => `<sitemap><loc>${esc(`${SITE_URL}/sitemaps/${f}`)}</loc><lastmod>${now}</lastmod></sitemap>`).join("");
    return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`;
}

async function listPage(type: ListType, page: number) {
    const res = await fetch(`${PHIM_API}/v1/api/danh-sach/${type}?page=${page}&limit=${PER_PAGE}&sort_field=modified.time&sort_type=desc`, init);
    if (!res.ok) throw new Error(`phimapi ${res.status}`);
    const text = await res.text();
    if (text.startsWith("<")) throw new Error("phimapi trả trang lỗi (bị chặn tạm thời)");
    const data = JSON.parse(text)?.data;
    return {
        items: (data?.items ?? []) as { slug?: string; modified?: { time?: string } }[],
        totalPages: Number(data?.params?.pagination?.totalPages) || 1,
    };
}

/* Danh sách file con: static.xml + {loại}-{số}.xml */
export async function sitemapFiles(): Promise<string[]> {
    const files = ["static.xml"];
    for (const type of LIST_TYPES) {
        try {
            const { totalPages } = await listPage(type, 1);
            const count = Math.ceil(totalPages / PAGES_PER_FILE);
            for (let i = 1; i <= count; i++) files.push(`${type}-${i}.xml`);
        } catch {
            files.push(`${type}-1.xml`);
        }
    }
    return files;
}

/* Trang cố định + trang lọc theo thể loại / quốc gia */
export function staticUrls(): SitemapUrl[] {
    const main: SitemapUrl[] = [
        { loc: `${SITE_URL}/`, changefreq: "daily", priority: 1 },
        { loc: `${SITE_URL}/phimhay`, changefreq: "hourly", priority: 1 },
        { loc: `${SITE_URL}/phim-le`, changefreq: "daily", priority: 0.9 },
        { loc: `${SITE_URL}/phim-bo`, changefreq: "daily", priority: 0.9 },
        { loc: `${SITE_URL}/hoat-hinh`, changefreq: "daily", priority: 0.9 },
        { loc: `${SITE_URL}/phong`, changefreq: "weekly", priority: 0.6 },
        { loc: `${SITE_URL}/bai-viet`, changefreq: "weekly", priority: 0.5 },
        { loc: `${SITE_URL}/doc-truyen`, changefreq: "daily", priority: 0.5 },
        { loc: `${SITE_URL}/gioi-thieu`, changefreq: "monthly", priority: 0.3 },
        { loc: `${SITE_URL}/lien-he-quang-cao`, changefreq: "monthly", priority: 0.3 },
    ];
    const filters: SitemapUrl[] = [
        ...categories.filter(c => c.value).map(c => ({ loc: `${SITE_URL}/loc-phim?category=${c.value}`, changefreq: "daily", priority: 0.7 })),
        ...countries.filter(c => c.value).map(c => ({ loc: `${SITE_URL}/loc-phim?country=${c.value}`, changefreq: "daily", priority: 0.7 })),
    ];
    return [...main, ...filters];
}

/* Trang phim của 1 file con: PAGES_PER_FILE trang danh sách, gọi lần lượt từng nhóm 4 trang */
export async function movieUrls(type: ListType, part: number): Promise<SitemapUrl[]> {
    const start = (part - 1) * PAGES_PER_FILE + 1;
    const pages = Array.from({ length: PAGES_PER_FILE }, (_, i) => start + i);
    const urls: SitemapUrl[] = [];
    for (let i = 0; i < pages.length; i += 4) {
        const results = await Promise.all(pages.slice(i, i + 4).map(p => listPage(type, p).catch(() => null)));
        for (const r of results) {
            for (const m of r?.items ?? []) {
                if (!m.slug) continue;
                urls.push({ loc: `${SITE_URL}/phim/${m.slug}`, lastmod: m.modified?.time?.slice(0, 10), changefreq: "weekly", priority: 0.8 });
            }
        }
        /* Hết phim (trang cuối) → dừng sớm */
        if (results.some(r => r && r.items.length < PER_PAGE)) break;
    }
    return urls;
}
