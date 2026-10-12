import { NextRequest, NextResponse } from "next/server";
import { findPhimapiMirror } from "@/lib/watchParty/mirror";

/* Phim VodPhim này có bản m3u8 trên phimapi không (để phòng xem chung đồng bộ được vị trí).
   Tìm thấy → cache 1 ngày ở CDN; không thấy → 10 phút (có thể do phimapi tạm chặn khi bị gọi dồn). */
export async function GET(req: NextRequest) {
    const slug = req.nextUrl.searchParams.get("slug")?.trim() ?? "";
    if (!slug || slug.length > 200) return NextResponse.json({ slug: null }, { status: 400 });
    let mirror: string | null = null;
    try { mirror = await findPhimapiMirror(slug); } catch { mirror = null; }
    return NextResponse.json({ slug: mirror }, {
        headers: { "Cache-Control": mirror ? "public, s-maxage=86400, stale-while-revalidate=86400" : "public, s-maxage=600" },
    });
}
