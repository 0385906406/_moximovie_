import { NextResponse } from "next/server";

export const revalidate = 300; // Vercel cache 5 phút

const PHIM = "https://phimapi.com/v1/api/danh-sach";

async function fetchPhim(path: string) {
    try {
        const res = await fetch(`${PHIM}/${path}`, { next: { revalidate: 300 } });
        if (!res.ok) return [];
        const json = await res.json();
        return json?.data?.items ?? [];
    } catch {
        return [];
    }
}

export async function GET() {
    const [slider, korean, china, vietnam, wibu] = await Promise.all([
        fetchPhim("phim-le?page=1&sort_field=modified&sort_type=desc&year=2026&limit=10"),
        fetchPhim("phim-bo?sort_field=modified&sort_type=desc&limit=10&country=han-quoc"),
        fetchPhim("phim-bo?sort_field=modified&sort_type=desc&limit=10&country=trung-quoc"),
        fetchPhim("phim-bo?sort_field=modified&sort_type=desc&limit=10&country=viet-nam"),
        fetchPhim("hoat-hinh?sort_field=modified&sort_type=desc&limit=10&country=nhat-ban"),
    ]);

    return NextResponse.json({ slider, korean, china, vietnam, wibu }, {
        headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" },
    });
}
