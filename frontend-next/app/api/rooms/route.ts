import { NextRequest, NextResponse } from "next/server";
import { movieApi } from "@/lib/movieApi";
import { parseSource } from "@/lib/movieSource";
import { toMovieImgUrl } from "@/lib/movieImage";
import { ablyRest, clientIdFromSecret, errorResponse, getHost, hostTicket, randomCode, RoomError } from "@/lib/watchParty/server";
import { MAX_NAME, MAX_ROOM_NAME, type RoomState } from "@/lib/watchParty/types";

export const dynamic = "force-dynamic";

/* Tạo phòng: kiểm tra phim có thật trên nguồn đã chọn → cấp mã phòng + vé chủ phòng.
   Phòng chỉ "mở" khi chủ phòng kết nối và đưa trạng thái lên kênh control. */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const clientId = clientIdFromSecret(body.secret);
        const source = parseSource(body.source);
        const slug = typeof body.slug === "string" ? body.slug.trim() : "";
        if (!source || !slug) throw new RoomError(400, "Thiếu thông tin phim");
        const hostName = String(body.name ?? "").trim().slice(0, MAX_NAME);
        if (!hostName) throw new RoomError(400, "Hãy nhập tên hiển thị");
        const roomName = String(body.roomName ?? "").trim().slice(0, MAX_ROOM_NAME) || `Phòng của ${hostName}`;

        const { movie, episodes } = await movieApi(source).detail(slug, { signal: AbortSignal.timeout(8000) });
        if (!movie) throw new RoomError(404, "Không tìm thấy phim");
        const ver = Math.max(0, Math.min(Number(body.ver) || 0, Math.max(episodes.length - 1, 0)));
        const epCount = episodes[ver]?.server_data?.length ?? 0;
        if (!epCount) throw new RoomError(400, "Phim chưa có tập để xem");
        const ep = Math.max(0, Math.min(Number(body.ep) || 0, epCount - 1));

        ablyRest();
        let code = "";
        for (let i = 0; i < 5 && !code; i++) {
            const c = randomCode();
            if (!(await getHost(c))) code = c;
        }
        if (!code) throw new RoomError(503, "Không tạo được mã phòng, hãy thử lại");

        const state: RoomState = {
            v: 1,
            roomName,
            source,
            slug: movie.slug ?? slug,
            movieName: movie.name ?? slug,
            poster: toMovieImgUrl(movie.poster_url || movie.thumb_url) || undefined,
            ver,
            ep,
            approval: !!body.approval,
            /* Mặc định ai trong phòng cũng phát/dừng/tua được; chủ phòng tắt được */
            allowControl: body.allowControl !== false,
            allowed: [],
            banned: [],
            hostName,
            createdAt: Date.now(),
        };
        return NextResponse.json({ code, clientId, ticket: hostTicket(code, clientId), state });
    } catch (e) {
        return errorResponse(e);
    }
}
