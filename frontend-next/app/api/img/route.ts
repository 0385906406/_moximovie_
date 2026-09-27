import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";

/* ── Chỉ resize ảnh từ các host này (tránh bị lợi dụng làm proxy) ── */
const ALLOWED_HOSTS = new Set([
    "phimimg.com",
    "img.phimapi.com",
    "image.tmdb.org",
    "img.otruyenapi.com",
    "sv1.otruyencdn.com",
    "res.cloudinary.com",
]);

/* ── Phải khớp với images.deviceSizes + images.imageSizes trong next.config.ts ── */
const WIDTHS = [96, 128, 256, 384, 640, 828, 1080, 1280, 1920];

const CACHE_FOREVER = "public, max-age=31536000, s-maxage=31536000, immutable";

function snapWidth(w: number) {
    return WIDTHS.find(x => x >= w) ?? WIDTHS[WIDTHS.length - 1];
}

/* Không tối ưu được → trả về ảnh gốc, web không bị vỡ ảnh */
function fallback(url: string) {
    const res = NextResponse.redirect(url, 302);
    res.headers.set("Cache-Control", "public, max-age=300, s-maxage=300");
    return res;
}

export async function GET(req: NextRequest) {
    const params = req.nextUrl.searchParams;
    const raw = params.get("url");
    if (!raw) return new NextResponse("Missing url", { status: 400 });

    let target: URL;
    try {
        target = new URL(raw);
    } catch {
        return new NextResponse("Invalid url", { status: 400 });
    }
    if (target.protocol !== "https:" && target.protocol !== "http:") {
        return new NextResponse("Invalid url", { status: 400 });
    }
    if (!ALLOWED_HOSTS.has(target.hostname)) return fallback(target.href);

    const width = snapWidth(Number(params.get("w")) || 384);
    const quality = Math.min(90, Math.max(40, Number(params.get("q")) || 70));

    try {
        const upstream = await fetch(target.href, { signal: AbortSignal.timeout(8000) });
        /* Ảnh gốc không tồn tại → báo lỗi luôn để client chuyển sang ảnh dự phòng */
        if (upstream.status === 404 || upstream.status === 410) {
            return new NextResponse("Not found", { status: 404, headers: { "Cache-Control": "public, max-age=3600, s-maxage=3600" } });
        }
        if (!upstream.ok) return fallback(target.href);

        const input = Buffer.from(await upstream.arrayBuffer());
        const output = await sharp(input)
            .resize({ width, withoutEnlargement: true })
            .webp({ quality })
            .toBuffer();

        return new NextResponse(new Uint8Array(output), {
            headers: {
                "Content-Type": "image/webp",
                "Cache-Control": CACHE_FOREVER,
            },
        });
    } catch {
        return fallback(target.href);
    }
}
