import { NextResponse } from "next/server";
import { getHotMovies } from "@/lib/hotMovies";

export const revalidate = 21600;

export async function GET() {
    const items = await getHotMovies();
    return NextResponse.json({ items }, {
        headers: { "Cache-Control": "s-maxage=21600, stale-while-revalidate=43200" },
    });
}
