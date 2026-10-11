/* ── Phòng xem chung — phần chạy trên server (API routes) ──
   - Danh tính: client giữ 1 chuỗi bí mật (secret) trong máy; clientId = băm của secret.
     Server tự tính clientId → không ai giả danh được người khác (phải có secret của họ).
   - Chủ phòng: có "vé" (ticket) = HMAC(mã phòng + clientId) do server ký lúc tạo phòng.
   - Quyền vào phòng (duyệt, chặn, đủ người) kiểm tra lúc cấp token Ably, dựa trên presence của chủ phòng. */

import crypto from "node:crypto";
import * as Ably from "ably";
import { NextResponse } from "next/server";
import {
    channelName, MAX_MEMBERS, ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH, ROOM_CODE_RE,
    type RoomInfo, type RoomState,
} from "./types";

const ABLY_KEY = process.env.ABLY_API_KEY?.trim() ?? "";
/* Chỉ dùng khi test (vd. "sandbox"); bỏ trống = máy chủ Ably thật */
export const ABLY_ENDPOINT = process.env.NEXT_PUBLIC_ABLY_ENDPOINT || undefined;

export function realtimeConfigured() {
    return /^[^.:\s]+\.[^:\s]+:\S+$/.test(ABLY_KEY);
}

/* Khoá ký vé: ROOM_SECRET nếu có, không thì suy ra từ khoá Ably (không lộ ra ngoài) */
const SIGN_KEY = crypto.createHash("sha256").update(process.env.ROOM_SECRET || `moxi-room:${ABLY_KEY}`).digest();

let _rest: Ably.Rest | null = null;
export function ablyRest() {
    if (!realtimeConfigured()) throw new RoomError(503, "Máy chủ chưa cấu hình phòng xem chung (thiếu ABLY_API_KEY)");
    _rest ??= new Ably.Rest({ key: ABLY_KEY, endpoint: ABLY_ENDPOINT });
    return _rest;
}

export class RoomError extends Error {
    constructor(public status: number, message: string, public code?: string) { super(message); }
}

/* ── Danh tính ── */
const b64url = (buf: Buffer) => buf.toString("base64url");

export function clientIdFromSecret(secret: unknown): string {
    if (typeof secret !== "string" || !/^[A-Za-z0-9_-]{32,128}$/.test(secret)) {
        throw new RoomError(400, "Thiếu mã định danh của máy");
    }
    return "u_" + b64url(crypto.createHash("sha256").update(secret).digest()).slice(0, 20);
}

export function hostTicket(code: string, clientId: string) {
    return b64url(crypto.createHmac("sha256", SIGN_KEY).update(`host:${code}:${clientId}`).digest());
}

export function isHostTicket(code: string, clientId: string, ticket: unknown) {
    if (typeof ticket !== "string" || !ticket) return false;
    const a = Buffer.from(ticket);
    const b = Buffer.from(hostTicket(code, clientId));
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function assertCode(code: unknown): string {
    const c = String(code ?? "").toUpperCase();
    if (!ROOM_CODE_RE.test(c)) throw new RoomError(400, "Mã phòng không hợp lệ");
    return c;
}

export function randomCode() {
    const bytes = crypto.randomBytes(ROOM_CODE_LENGTH);
    return Array.from(bytes, b => ROOM_CODE_ALPHABET[b % ROOM_CODE_ALPHABET.length]).join("");
}

/* ── Đọc trạng thái phòng từ presence của chủ phòng ── */
type HostPresence = { clientId: string; state: RoomState & { hostSince?: number } };

async function presenceOf(channel: string) {
    const page = await ablyRest().channels.get(channel).presence.get();
    return page.items;
}

/* Chủ phòng hiện tại = người trên kênh control có hostSince mới nhất (sau khi chuyển quyền) */
export async function getHost(code: string): Promise<HostPresence | null> {
    const items = await presenceOf(channelName(code, "control"));
    const hosts = items
        .filter(p => p.data && typeof p.data === "object" && (p.data as RoomState).v === 1)
        .map(p => ({ clientId: p.clientId as string, state: p.data as HostPresence["state"] }))
        .sort((a, b) => (b.state.hostSince ?? 0) - (a.state.hostSince ?? 0));
    return hosts[0] ?? null;
}

export async function memberCount(code: string) {
    const items = await presenceOf(channelName(code, "chat"));
    return new Set(items.map(p => p.clientId)).size;
}

export async function getRoomInfo(code: string): Promise<RoomInfo> {
    const host = await getHost(code);
    if (!host) return { code, hostOnline: false, state: null };
    const { allowed: _a, banned: _b, ...pub } = host.state;
    return { code, hostOnline: true, state: pub };
}

/* ── Cấp token Ably theo vai trò ── */
type Role = "host" | "member" | "waiting";

const CAPS: Record<Role, (code: string) => Record<string, Ably.CapabilityOp[]>> = {
    host: code => ({
        [channelName(code, "control")]: ["publish", "subscribe", "presence"],
        [channelName(code, "chat")]: ["publish", "subscribe", "presence", "history"],
        [channelName(code, "lobby")]: ["subscribe", "presence"],
    }),
    member: code => ({
        [channelName(code, "control")]: ["subscribe"],
        [channelName(code, "chat")]: ["publish", "subscribe", "presence", "history"],
    }),
    /* Phòng chờ: chỉ vào lobby và nghe kênh control (để biết khi được duyệt / bị từ chối) */
    waiting: code => ({
        [channelName(code, "control")]: ["subscribe"],
        [channelName(code, "lobby")]: ["subscribe", "presence"],
    }),
};

/* Token chủ phòng ngắn hạn hơn không cần; thành viên 15 phút để lệnh chặn có hiệu lực nhanh khi gia hạn */
const TTL: Record<Role, number> = { host: 60 * 60_000, member: 15 * 60_000, waiting: 10 * 60_000 };

export async function issueToken(code: string, secret: unknown, ticket: unknown) {
    const clientId = clientIdFromSecret(secret);
    let role: Role;

    if (isHostTicket(code, clientId, ticket)) {
        role = "host";
    } else {
        const host = await getHost(code);
        if (!host) throw new RoomError(404, "Phòng không tồn tại hoặc chủ phòng đã rời đi", "not-found");
        const s = host.state;
        if (s.banned?.includes(clientId)) throw new RoomError(403, "Bạn đã bị chủ phòng chặn khỏi phòng này", "banned");
        if (s.approval && !s.allowed?.includes(clientId)) {
            role = "waiting";
        } else {
            if (await memberCount(code) >= MAX_MEMBERS) throw new RoomError(403, `Phòng đã đủ ${MAX_MEMBERS} người`, "full");
            role = "member";
        }
    }

    const tokenRequest = await ablyRest().auth.createTokenRequest({
        clientId,
        capability: JSON.stringify(CAPS[role](code)),
        ttl: TTL[role],
    });
    return { role, clientId, tokenRequest };
}

/* Lỗi → JSON { error } với mã HTTP phù hợp (dùng chung cho các route /api/rooms) */
export function errorResponse(e: unknown) {
    if (e instanceof RoomError) return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
    console.error("[rooms]", e);
    return NextResponse.json({ error: "Có lỗi xảy ra, hãy thử lại" }, { status: 500 });
}

/* ── Nhận quyền chủ phòng khi chủ phòng đã rời ──
   Chỉ khi kênh control không còn chủ phòng, và chỉ người vào phòng sớm nhất (presence lâu nhất) được nhận.
   Mọi thành viên tự tính cùng một ứng viên → không tranh nhau. */
export async function claimHost(code: string, secret: unknown) {
    const clientId = clientIdFromSecret(secret);
    if (await getHost(code)) throw new RoomError(409, "Phòng đang có chủ phòng", "has-host");
    const items = await presenceOf(channelName(code, "chat"));
    const candidate = items
        .filter(p => p.clientId)
        .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0) || String(a.clientId).localeCompare(String(b.clientId)))[0];
    if (!candidate || candidate.clientId !== clientId) throw new RoomError(403, "Bạn không phải người nhận quyền", "not-candidate");
    return { ticket: hostTicket(code, clientId) };
}
