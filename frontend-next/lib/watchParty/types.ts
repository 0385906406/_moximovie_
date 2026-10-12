/* ── Phòng xem chung: kiểu dữ liệu + giao thức dùng chung cho server và client ──

   Không dùng database. Mỗi phòng là 3 kênh Ably:
   - room:{CODE}:control — chỉ chủ phòng được publish và vào presence. Presence data của chủ phòng = RoomState
                           (phim, tập, quyền...), server đọc lại để kiểm tra quyền vào phòng.
                           Sự kiện "sync" = trạng thái phát (đang phát/dừng, vị trí).
   - room:{CODE}:chat    — thành viên đã vào phòng: chat, thả cảm xúc, xin điều khiển, presence = danh sách thành viên.
   - room:{CODE}:lobby   — phòng chờ khi chủ phòng bật "duyệt người vào".
   Quyền trên từng kênh do server cấp qua token Ably (app/api/rooms/token), client không tự nâng quyền được. */

import type { MovieSource } from "@/lib/movieSource";

/* Mã phòng 6 ký tự, bỏ các ký tự dễ nhầm (0/O, 1/I/L) */
export const ROOM_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const ROOM_CODE_LENGTH = 6;
export const ROOM_CODE_RE = new RegExp(`^[${ROOM_CODE_ALPHABET}]{${ROOM_CODE_LENGTH}}$`);

export const MAX_MEMBERS = 30;
export const MAX_NAME = 24;
export const MAX_ROOM_NAME = 40;
export const MAX_CHAT = 300;

export const channelName = (code: string, kind: "control" | "chat" | "lobby") => `room:${code}:${kind}`;

export function normalizeRoomCode(input: string) {
    return input.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, ROOM_CODE_LENGTH);
}

/* Trạng thái phòng — presence data của chủ phòng trên kênh control */
export interface RoomState {
    v: 1;
    /* Tên phòng do chủ phòng đặt (khác tên hiển thị của từng người). Phòng cũ chưa có → dùng roomTitle() */
    roomName?: string;
    source: MovieSource;
    slug: string;
    movieName: string;
    poster?: string;
    /* server (ver) và tập (ep), đếm từ 0 */
    ver: number;
    ep: number;
    /* Bật: người mới phải chờ chủ phòng duyệt */
    approval: boolean;
    /* Bật: thành viên được bấm phát/dừng/tua (gửi yêu cầu cho chủ phòng) */
    allowControl: boolean;
    /* clientId được duyệt / bị chặn */
    allowed: string[];
    banned: string[];
    hostName: string;
    createdAt: number;
}

/* Trạng thái phát chủ phòng gửi đi (sự kiện "sync") */
export interface PlaybackState {
    ver: number;
    ep: number;
    playing: boolean;
    /* Vị trí (giây) tại thời điểm `at` (giờ máy chủ Ably, ms) */
    position: number;
    at: number;
    rate: number;
    /* Tăng mỗi lần chủ phòng đổi tập / bấm "Phát cùng lúc" → trình phát nhúng nạp lại cho mọi người */
    epoch: number;
}

/* Thông tin công khai của phòng (GET /api/rooms/[code]) */
export interface RoomInfo {
    code: string;
    hostOnline: boolean;
    state: Omit<RoomState, "allowed" | "banned"> | null;
}

/* Presence data của thành viên trên kênh chat / lobby */
export interface MemberData {
    name: string;
    avatar?: string;
    color: number;
}

export interface ChatMessage {
    id: string;
    clientId: string;
    name: string;
    color: number;
    text: string;
    at: number;
    system?: boolean;
}

/* Sự kiện trên kênh control (chỉ chủ phòng gửi) */
export type ControlEvent =
    | { name: "sync"; data: PlaybackState }
    | { name: "kick"; data: { clientId: string; ban: boolean } }
    | { name: "admit"; data: { clientId: string } }
    | { name: "host-transfer"; data: { clientId: string; ticket: string } }
    | { name: "closed"; data: Record<string, never> };

/* Thành viên xin điều khiển (khi chủ phòng bật allowControl) */
export interface ControlRequest {
    action: "play" | "pause" | "seek";
    position?: number;
}

export const REACTIONS = ["😂", "😍", "😱", "😭", "👏", "🔥", "💀", "❤️"] as const;

/* Tên phòng để hiển thị: tên chủ phòng đặt, chưa đặt thì "Phòng của <chủ phòng>" */
export function roomTitle(s: { roomName?: string; hostName?: string } | null | undefined) {
    return s?.roomName?.trim() || (s?.hostName ? `Phòng của ${s.hostName}` : "Phòng xem chung");
}

/* Màu avatar theo tên, ổn định giữa các máy */
export function colorFor(text: string) {
    let h = 0;
    for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return h % 360;
}
