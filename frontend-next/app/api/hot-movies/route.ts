import { NextRequest, NextResponse } from "next/server";
import { getHotMovies } from "@/lib/hotMovies";
import { parseSource } from "@/lib/movieSource";
import { getServerSource } from "@/lib/movieSource.server";

export const revalidate = 21600;

/* ?source=phimapi|vodphim; bỏ trống → theo cookie/vị trí người xem */
export async function GET(req: NextRequest) {
    const source = parseSource(req.nextUrl.searchParams.get("source")) ?? await getServerSource();
    const items = await getHotMovies(source);
    return NextResponse.json({ items }, {
        headers: { "Cache-Control": "s-maxage=21600, stale-while-revalidate=43200" },
    });
}
