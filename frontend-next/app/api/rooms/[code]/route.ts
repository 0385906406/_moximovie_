import { NextRequest, NextResponse } from "next/server";
import { assertCode, getRoomInfo, errorResponse } from "@/lib/watchParty/server";

export const dynamic = "force-dynamic";

/* Thông tin công khai của phòng: có chủ phòng online không, đang xem phim gì */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
    try {
        const code = assertCode((await params).code);
        return NextResponse.json(await getRoomInfo(code), { headers: { "Cache-Control": "no-store" } });
    } catch (e) {
        return errorResponse(e);
    }
}
