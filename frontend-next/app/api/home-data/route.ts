import { NextRequest, NextResponse } from "next/server";
import { movieApi, type ListQuery } from "@/lib/movieApi";
import { parseSource, type MovieSource } from "@/lib/movieSource";
import { getServerSource } from "@/lib/movieSource.server";

export const revalidate = 300; // Vercel cache 5 phút

async function fetchPhim(source: MovieSource, query: ListQuery) {
    try {
        const { items } = await movieApi(source).list({ limit: 10, ...query }, { next: { revalidate: 300 } });
        return items;
    } catch {
        return [];
    }
}

/* ?source=phimapi|vodphim; bỏ trống → theo cookie/vị trí người xem */
export async function GET(req: NextRequest) {
    const source = parseSource(req.nextUrl.searchParams.get("source")) ?? await getServerSource();
    const [slider, korean, china, vietnam, wibu] = await Promise.all([
        fetchPhim(source, { type: "single", year: 2026 }),
        fetchPhim(source, { type: "tv", country: "han-quoc" }),
        fetchPhim(source, { type: "tv", country: "trung-quoc" }),
        fetchPhim(source, { type: "tv", country: "viet-nam" }),
        fetchPhim(source, { type: "animation", country: "nhat-ban" }),
    ]);

    return NextResponse.json({ slider, korean, china, vietnam, wibu }, {
        headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" },
    });
}
