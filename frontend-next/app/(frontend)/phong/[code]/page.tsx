import type { Metadata } from "next";
import RoomClient from "./RoomClient";
import { getRoomInfo, realtimeConfigured } from "@/lib/watchParty/server";
import { normalizeRoomCode, roomTitle, ROOM_CODE_RE } from "@/lib/watchParty/types";
import { shareImageUrl, SITE_URL } from "@/lib/movieImage";

/* Link mời vào phòng khi gửi qua Facebook/Zalo/Messenger: hiện tên phòng, phim đang xem và poster */
export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
    const code = normalizeRoomCode((await params).code);
    const base: Metadata = { robots: { index: false, follow: false } };
    if (!ROOM_CODE_RE.test(code) || !realtimeConfigured()) return { ...base, title: "Phòng xem chung | MoxiMovie" };
    const info = await getRoomInfo(code).catch(() => null);
    const s = info?.state;
    if (!s) return { ...base, title: `Phòng ${code} | MoxiMovie` };
    const title = `${roomTitle(s)} — xem chung "${s.movieName}"`;
    const description = `${s.hostName} mời bạn vào phòng xem chung trên MoxiMovie. Mã phòng: ${code}.`;
    const image = shareImageUrl(s.poster) || `${SITE_URL}/default-og.jpg`;
    return {
        ...base,
        title: `${title} | MoxiMovie`,
        description,
        openGraph: { title, description, url: `${SITE_URL}/phong/${code}`, images: [{ url: image, width: 1200, height: 630 }], type: "website", locale: "vi_VN" },
        twitter: { card: "summary_large_image", title, description, images: [image] },
    };
}

export default function RoomPage() {
    return <RoomClient />;
}
