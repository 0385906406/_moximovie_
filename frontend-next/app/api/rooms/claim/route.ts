import { NextRequest, NextResponse } from "next/server";
import { assertCode, claimHost, errorResponse } from "@/lib/watchParty/server";

export const dynamic = "force-dynamic";

/* Chủ phòng rời quá lâu → người vào phòng sớm nhất nhận quyền để phòng tiếp tục */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const code = assertCode(body.code);
        return NextResponse.json(await claimHost(code, body.secret), { headers: { "Cache-Control": "no-store" } });
    } catch (e) {
        return errorResponse(e);
    }
}
