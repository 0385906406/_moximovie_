import { NextRequest, NextResponse } from "next/server";
import { assertCode, issueToken, errorResponse } from "@/lib/watchParty/server";

export const dynamic = "force-dynamic";

/* Token Ably cho 1 người trong phòng (gọi lại mỗi lần token sắp hết hạn).
   Vai trò (chủ phòng / thành viên / đang chờ duyệt) do server quyết định. */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const code = assertCode(body.code);
        const { role, clientId, tokenRequest } = await issueToken(code, body.secret, body.ticket);
        return NextResponse.json({ role, clientId, tokenRequest }, { headers: { "Cache-Control": "no-store" } });
    } catch (e) {
        return errorResponse(e);
    }
}
