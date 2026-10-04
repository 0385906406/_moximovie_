import { NextRequest, NextResponse } from "next/server";

/* Proxy TMDB chạy trên server: key lấy từ TMDB_API_KEY, client không bao giờ thấy key.
   Chỉ cho phép các action đã liệt kê dưới đây (không phải proxy mở). */
export const revalidate = 3600;

const TMDB_API = "https://api.themoviedb.org/3";
const TMDB_KEY = process.env.TMDB_API_KEY;

type TrailerResult = { key: string | null };

async function tmdb(path: string, params: Record<string, string> = {}) {
    const sp = new URLSearchParams({ api_key: TMDB_KEY ?? "", ...params });
    const res = await fetch(`${TMDB_API}${path}?${sp}`, {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error(`TMDB ${res.status}`);
    return res.json();
}

export async function GET(req: NextRequest) {
    if (!TMDB_KEY) {
        return NextResponse.json({ error: "TMDB_API_KEY chưa được cấu hình" }, { status: 503 });
    }

    const sp = req.nextUrl.searchParams;
    const action = sp.get("action");

    try {
        if (action === "upcoming" || action === "now_playing") {
            const path = action === "upcoming" ? "/movie/upcoming" : "/movie/now_playing";
            const data = await tmdb(path, { language: "vi-VN", region: "VN", page: "1" });
            return NextResponse.json({ results: data?.results ?? [] });
        }

        /* Tìm trailer YouTube cho phim: tìm theo tên → lấy video của kết quả đầu tiên */
        if (action === "trailer") {
            const type = sp.get("type") === "series" ? "tv" : "movie";
            const query = sp.get("query") ?? "";
            const year = sp.get("year") ?? "";
            if (!query) return NextResponse.json<TrailerResult>({ key: null });

            const search: Record<string, string> = { language: "en-US", query };
            if (year) search.year = year;
            const sd = await tmdb(`/search/${type}`, search);
            const id = sd?.results?.[0]?.id;
            if (!id) return NextResponse.json<TrailerResult>({ key: null });

            const vd = await tmdb(`/${type}/${id}/videos`);
            const videos: { type: string; site: string; key: string }[] = vd?.results ?? [];
            const t = videos.find(x => x.type === "Trailer" && x.site === "YouTube")
                ?? videos.find(x => x.site === "YouTube");
            return NextResponse.json<TrailerResult>({ key: t?.key ?? null });
        }

        return NextResponse.json({ error: "action không hợp lệ" }, { status: 400 });
    } catch {
        return NextResponse.json({ error: "Không lấy được dữ liệu TMDB" }, { status: 502 });
    }
}
