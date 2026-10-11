import { NextRequest, NextResponse } from "next/server";
import { assertCode, clientIdFromSecret, hostTicket, isHostTicket, RoomError, errorResponse } from "@/lib/watchParty/server";

export const dynamic = "force-dynamic";

/* Chuyển quyền chủ phòng: chủ phòng hiện tại (có vé) xin vé cho người được chọn.
   Vé gắn với clientId của người nhận → người khác nhặt được cũng không dùng được. */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const code = assertCode(body.code);
        const clientId = clientIdFromSecret(body.secret);
        if (!isHostTicket(code, clientId, body.ticket)) throw new RoomError(403, "Chỉ chủ phòng mới chuyển quyền được");
        const target = String(body.target ?? "");
        if (!/^u_[A-Za-z0-9_-]{20}$/.test(target) || target === clientId) throw new RoomError(400, "Người nhận không hợp lệ");
        return NextResponse.json({ ticket: hostTicket(code, target) });
    } catch (e) {
        return errorResponse(e);
    }
}
