"use client";

/* ── Phòng xem chung: kết nối Ably + toàn bộ trạng thái phòng phía client ──
   Xem lib/watchParty/types.ts để biết giao thức (3 kênh control / chat / lobby). */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Ably from "ably";
import {
    channelName, colorFor, MAX_CHAT,
    type ChatMessage, type ControlRequest, type MemberData, type PlaybackState, type RoomState,
} from "@/lib/watchParty/types";

/* ── Danh tính trên máy này (không cần đăng nhập) ── */
const SECRET_KEY = "moxi_room_secret";
const NAME_KEY = "moxi_room_name";
const ticketKey = (code: string) => `moxi_room_ticket_${code}`;
const RECENT_KEY = "moxi_room_recent";
const pbKey = (code: string) => `moxi_room_pb_${code}`;
/* Chủ phòng mất kết nối quá lâu → người vào phòng sớm nhất tự nhận quyền để phòng tiếp tục */
const CLAIM_DELAY = 20_000;

const store = {
    get(k: string) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* bị chặn */ } },
    del(k: string) { try { localStorage.removeItem(k); } catch { /* bị chặn */ } },
};

export function getRoomSecret() {
    let s = store.get(SECRET_KEY);
    if (!s || !/^[A-Za-z0-9_-]{32,128}$/.test(s)) {
        const bytes = crypto.getRandomValues(new Uint8Array(32));
        s = btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        store.set(SECRET_KEY, s);
    }
    return s;
}
export const getSavedName = () => store.get(NAME_KEY) ?? "";
export const saveName = (name: string) => store.set(NAME_KEY, name);
export const saveHostTicket = (code: string, ticket: string) => store.set(ticketKey(code), ticket);
/* Trạng thái phòng lúc tạo — chủ phòng đưa lên Ably khi vào trang phòng (và dùng lại khi tải lại trang) */
export const saveRoomState = (code: string, state: RoomState) => store.set(`moxi_room_state_${code}`, JSON.stringify(state));

/* Phòng gần đây (trang /phong) */
export interface RecentRoom { code: string; movieName: string; poster?: string; at: number; host: boolean }
export function getRecentRooms(): RecentRoom[] {
    try { return JSON.parse(store.get(RECENT_KEY) ?? "[]"); } catch { return []; }
}
function rememberRoom(r: RecentRoom) {
    const list = [r, ...getRecentRooms().filter(x => x.code !== r.code)].slice(0, 6);
    store.set(RECENT_KEY, JSON.stringify(list));
}

export type RoomStatus =
    | "connecting" | "waiting" | "joined"
    | "not-found" | "banned" | "full" | "kicked" | "denied" | "closed" | "error";

export type Role = "host" | "member" | "waiting";

export interface Member extends MemberData { clientId: string; isHost: boolean; isMe: boolean }

type HostState = RoomState & { hostSince: number };

interface Options {
    onReaction?: (emoji: string, name: string) => void;
    onControlRequest?: (req: ControlRequest, from: string) => void;
}

export function useWatchRoom(code: string, name: string | null, opts: Options = {}) {
    const [status, setStatus] = useState<RoomStatus>("connecting");
    const statusRef = useRef<RoomStatus>("connecting");
    statusRef.current = status;
    const [error, setError] = useState<string>("");
    const [role, setRole] = useState<Role | null>(null);
    const [clientId, setClientId] = useState<string>("");
    const [room, setRoom] = useState<HostState | null>(null);
    const [hostId, setHostId] = useState<string>("");
    const [hostOnline, setHostOnline] = useState(true);
    const [playback, setPlayback] = useState<PlaybackState | null>(null);
    const [members, setMembers] = useState<Map<string, MemberData>>(new Map());
    const membersRef = useRef<Map<string, MemberData>>(new Map());
    membersRef.current = members;
    const [lobby, setLobby] = useState<Map<string, MemberData>>(new Map());
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    const ablyRef = useRef<Ably.Realtime | null>(null);
    const roleRef = useRef<Role | null>(null);
    const roomRef = useRef<HostState | null>(null);
    const playbackRef = useRef<PlaybackState | null>(null);
    const offsetRef = useRef(0);
    const optsRef = useRef(opts);
    optsRef.current = opts;
    const meRef = useRef<MemberData | null>(null);

    /* Giờ máy chủ Ably (ms) — mọi máy dùng chung mốc thời gian này để tính vị trí phát */
    const now = useCallback(() => Date.now() + offsetRef.current, []);

    const pushMessage = useCallback((m: ChatMessage) => {
        setMessages(prev => [...prev.slice(-199), m]);
    }, []);
    const systemMessage = useCallback((text: string) => {
        pushMessage({ id: `sys-${Date.now()}-${Math.random()}`, clientId: "", name: "", color: 0, text, at: Date.now(), system: true });
    }, [pushMessage]);

    /* ── Kết nối ── */
    useEffect(() => {
        if (!name) return;
        let disposed = false;
        const secret = getRoomSecret();
        meRef.current = { name, color: colorFor(name) };

        const realtime = new Ably.Realtime({
            /* Mỗi lần cần token (lúc đầu và khi gia hạn), server kiểm tra lại quyền: chủ phòng / thành viên / đang chờ */
            authCallback: async (_params, cb) => {
                try {
                    const res = await fetch("/api/rooms/token", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ code, secret, ticket: store.get(ticketKey(code)) }),
                    });
                    const j = await res.json();
                    /* Đang ở trong phòng mà chủ phòng tạm mất kết nối lúc gia hạn token → báo lỗi tạm,
                       Ably tự thử lại sau; không đẩy người xem ra khỏi phòng */
                    if (!res.ok && j.code === "not-found" && statusRef.current === "joined") {
                        cb(j.error ?? "host offline", null);
                        return;
                    }
                    if (!res.ok) {
                        if (!disposed) {
                            setStatus(j.code === "not-found" ? "not-found" : j.code === "banned" ? "banned" : j.code === "full" ? "full" : "error");
                            setError(j.error ?? "Không vào được phòng");
                        }
                        cb(j.error ?? "auth failed", null);
                        realtime.close();
                        return;
                    }
                    roleRef.current = j.role;
                    if (!disposed) { setRole(j.role); setClientId(j.clientId); }
                    cb(null, j.tokenRequest);
                } catch (e) {
                    cb(String(e), null);
                }
            },
            echoMessages: true,
            /* Chỉ dùng khi test (vd. "sandbox"); bỏ trống = máy chủ Ably thật */
            endpoint: process.env.NEXT_PUBLIC_ABLY_ENDPOINT || undefined,
        });
        ablyRef.current = realtime;

        const control = realtime.channels.get(channelName(code, "control"));
        const chat = realtime.channels.get(channelName(code, "chat"));
        const lobbyCh = realtime.channels.get(channelName(code, "lobby"));

        /* Đọc chủ phòng từ presence kênh control (người có hostSince mới nhất) */
        const refreshHost = async () => {
            const items = await control.presence.get();
            const hosts = items
                .filter(p => (p.data as HostState | undefined)?.v === 1)
                .sort((a, b) => ((b.data as HostState).hostSince ?? 0) - ((a.data as HostState).hostSince ?? 0));
            const h = hosts[0];
            if (disposed) return null;
            if (h) {
                roomRef.current = h.data as HostState;
                setRoom(h.data as HostState);
                setHostId(h.clientId ?? "");
                setHostOnline(true);
            } else {
                setHostOnline(false);
            }
            scheduleClaim(!!h);
            return h?.clientId ?? null;
        };

        /* ── Nhận quyền chủ phòng khi chủ phòng rời quá CLAIM_DELAY ──
           Mọi thành viên tính cùng 1 ứng viên (vào phòng sớm nhất); server kiểm tra lại trước khi cấp vé. */
        let claimTimer = 0;
        const scheduleClaim = (hostPresent: boolean) => {
            if (hostPresent || roleRef.current !== "member" || statusRef.current !== "joined") {
                window.clearTimeout(claimTimer);
                claimTimer = 0;
                return;
            }
            if (claimTimer) return;
            claimTimer = window.setTimeout(async () => {
                claimTimer = 0;
                try {
                    if (disposed || roleRef.current !== "member" || await refreshHost()) return;
                    const items = await chat.presence.get();
                    const candidate = items
                        .filter(p => p.clientId)
                        .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0) || String(a.clientId).localeCompare(String(b.clientId)))[0];
                    if (candidate?.clientId !== realtime.auth.clientId) { scheduleClaim(false); return; }
                    const res = await fetch("/api/rooms/claim", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ code, secret }),
                    });
                    if (!res.ok) { scheduleClaim(!!(await refreshHost())); return; }
                    const { ticket } = await res.json();
                    store.set(ticketKey(code), ticket);
                    await realtime.auth.authorize();
                    const base = roomRef.current;
                    /* roleRef đổi sau authorize() — TS không biết nên ép kiểu */
                    if (!base || (roleRef.current as Role | null) !== "host") return;
                    await becomeHost({ ...base, hostName: meRef.current?.name ?? "" });
                    systemMessage("Chủ phòng cũ đã rời — bạn được nhận quyền chủ phòng để phòng tiếp tục");
                } catch {
                    scheduleClaim(false);
                }
            }, CLAIM_DELAY);
        };

        const refreshMembers = async () => {
            const items = await chat.presence.get();
            if (disposed) return;
            const map = new Map<string, MemberData>();
            items.forEach(p => p.clientId && map.set(p.clientId, p.data as MemberData));
            setMembers(map);
        };

        const refreshLobby = async () => {
            const items = await lobbyCh.presence.get();
            if (disposed) return;
            const map = new Map<string, MemberData>();
            items.forEach(p => p.clientId && map.set(p.clientId, p.data as MemberData));
            setLobby(map);
        };

        const republish = async () => {
            const pb = playbackRef.current;
            if (!pb) return;
            const t = Date.now() + offsetRef.current;
            const position = pb.playing ? pb.position + ((t - pb.at) / 1000) * pb.rate : pb.position;
            const next = { ...pb, position, at: t };
            playbackRef.current = next;
            await control.publish("sync", next).catch(() => {});
        };

        /* Vào phòng với vai trò thành viên/chủ phòng: nghe chat + vào danh sách thành viên */
        const joinChat = async () => {
            await chat.subscribe("msg", m => {
                const d = m.data as { text: string; name: string; color: number };
                pushMessage({ id: m.id ?? `${m.timestamp}`, clientId: m.clientId ?? "", name: d.name, color: d.color, text: String(d.text).slice(0, MAX_CHAT), at: m.timestamp ?? Date.now() });
            });
            await chat.subscribe("react", m => {
                const d = m.data as { emoji: string; name: string };
                optsRef.current.onReaction?.(d.emoji, d.name);
            });
            await chat.subscribe("req", m => {
                if (roleRef.current === "host" && m.clientId) optsRef.current.onControlRequest?.(m.data as ControlRequest, m.clientId);
            });
            chat.presence.subscribe(["enter", "leave"], p => {
                const d = p.data as MemberData | undefined;
                if (d?.name && p.clientId !== realtime.auth.clientId) {
                    systemMessage(p.action === "enter" ? `${d.name} đã vào phòng` : `${d.name} đã rời phòng`);
                }
                /* Có người mới → chủ phòng gửi lại trạng thái phát để họ bắt kịp ngay (kể cả khi đang dừng) */
                if (p.action === "enter" && roleRef.current === "host") void republish();
                void refreshMembers();
            });
            chat.presence.subscribe("update", () => void refreshMembers());
            await chat.presence.enter(meRef.current);
            await refreshMembers();
        };

        const becomeHost = async (state: RoomState) => {
            const s: HostState = { ...state, hostSince: Date.now() + offsetRef.current };
            roomRef.current = s;
            setRoom(s);
            store.set(`moxi_room_state_${code}`, JSON.stringify(s));
            await control.presence.enter(s);
            lobbyCh.presence.subscribe(() => void refreshLobby());
            await refreshLobby();
            /* Tải lại trang / vừa nhận quyền: phát tiếp từ vị trí cũ của phòng */
            if (!playbackRef.current) {
                try { playbackRef.current = JSON.parse(store.get(pbKey(code)) ?? "null"); } catch { /* bỏ qua */ }
            }
            if (playbackRef.current) {
                setPlayback(playbackRef.current);
                await republish();
            }
        };

        const start = async () => {
            try {
                await new Promise<void>((resolve, reject) => {
                    realtime.connection.once("connected", () => resolve());
                    realtime.connection.once("failed", s => reject(s.reason));
                });
                try { offsetRef.current = (await realtime.time()) - Date.now(); } catch { /* giữ 0 */ }

                /* Sự kiện từ chủ phòng */
                await control.subscribe(m => {
                    /* Chỉ chủ phòng có quyền publish trên kênh này (server cấp quyền qua token) */
                    const me = realtime.auth.clientId;
                    switch (m.name) {
                        case "sync": {
                            const pb = m.data as PlaybackState;
                            playbackRef.current = pb;
                            setPlayback(pb);
                            store.set(pbKey(code), JSON.stringify(pb));
                            break;
                        }
                        case "admit":
                            if ((m.data as { clientId: string }).clientId === me && roleRef.current === "waiting") {
                                void (async () => {
                                    /* Server đọc danh sách được duyệt từ presence của chủ phòng — có thể trễ một chút → thử lại */
                                    for (let i = 0; i < 4 && roleRef.current === "waiting"; i++) {
                                        if (i) await new Promise(r => setTimeout(r, 1000));
                                        await realtime.auth.authorize().catch(() => {});
                                    }
                                    if (roleRef.current !== "member" || disposed) return;
                                    await lobbyCh.presence.leave().catch(() => {});
                                    await joinChat();
                                    if (!disposed) setStatus("joined");
                                })();
                            }
                            break;
                        case "kick": {
                            const d = m.data as { clientId: string; ban: boolean };
                            if (d.clientId === me) {
                                setStatus(roleRef.current === "waiting" ? "denied" : "kicked");
                                setError(roleRef.current === "waiting"
                                    ? "Chủ phòng đã từ chối cho bạn vào phòng"
                                    : d.ban ? "Bạn đã bị chủ phòng chặn khỏi phòng" : "Bạn đã bị chủ phòng mời ra khỏi phòng");
                                realtime.close();
                            }
                            break;
                        }
                        case "host-transfer": {
                            const d = m.data as { clientId: string; ticket: string };
                            if (d.clientId === me) {
                                store.set(ticketKey(code), d.ticket);
                                void realtime.auth.authorize().then(async () => {
                                    if (roomRef.current) await becomeHost({ ...roomRef.current, hostName: meRef.current?.name ?? "" });
                                    systemMessage("Bạn đã trở thành chủ phòng");
                                }).catch(() => {});
                            }
                            break;
                        }
                        case "closed":
                            if (roleRef.current !== "host") {
                                setStatus("closed");
                                setError("Chủ phòng đã đóng phòng");
                                realtime.close();
                            }
                            break;
                    }
                });
                control.presence.subscribe(() => void refreshHost());

                let r = roleRef.current;
                if (r === "host") {
                    /* Lúc mình vắng, quyền chủ phòng đã chuyển cho người khác → vào lại với vai trò thành viên */
                    const current = await refreshHost();
                    if (current && current !== realtime.auth.clientId) {
                        store.del(ticketKey(code));
                        await realtime.auth.authorize();
                        r = roleRef.current;
                    }
                }
                if (r === "host") {
                    /* Chủ phòng: lấy trạng thái lúc tạo phòng (hoặc trạng thái trước khi tải lại trang) */
                    const saved = store.get(`moxi_room_state_${code}`);
                    const existing = roomRef.current;
                    const init: RoomState | null = existing ?? (saved ? JSON.parse(saved) : null);
                    if (!init) throw new Error("Thiếu thông tin phòng");
                    await becomeHost(init);
                    await joinChat();
                    if (!disposed) setStatus("joined");
                } else {
                    await refreshHost();
                    if (!roomRef.current) {
                        setStatus("not-found");
                        setError("Phòng không tồn tại hoặc chủ phòng đã rời đi");
                        realtime.close();
                        return;
                    }
                    if (r === "waiting") {
                        await lobbyCh.presence.enter(meRef.current);
                        if (!disposed) setStatus("waiting");
                    } else {
                        await joinChat();
                        if (!disposed) setStatus("joined");
                        statusRef.current = "joined";
                        await refreshHost();
                    }
                }

                const st = roomRef.current;
                if (st) rememberRoom({ code, movieName: st.movieName, poster: st.poster, at: Date.now(), host: roleRef.current === "host" });
            } catch (e) {
                if (disposed) return;
                setStatus(s => (s === "connecting" ? "error" : s));
                setError(prev => prev || (e instanceof Error ? e.message : "Không kết nối được phòng"));
            }
        };
        void start();

        return () => {
            disposed = true;
            window.clearTimeout(claimTimer);
            realtime.close();
            ablyRef.current = null;
        };
    }, [code, name, pushMessage, systemMessage]);

    /* ── Hành động của chủ phòng ── */
    const control = () => ablyRef.current?.channels.get(channelName(code, "control"));
    const chatCh = () => ablyRef.current?.channels.get(channelName(code, "chat"));

    const updateRoom = useCallback(async (patch: Partial<RoomState>) => {
        if (roleRef.current !== "host" || !roomRef.current) return;
        /* Bật "duyệt người vào" → người đang ở trong phòng coi như đã được duyệt
           (không thì lần gia hạn token tới họ bị đẩy ra phòng chờ) */
        if (patch.approval && !roomRef.current.approval) {
            patch = { ...patch, allowed: [...new Set([...(patch.allowed ?? roomRef.current.allowed), ...membersRef.current.keys()])] };
        }
        const next = { ...roomRef.current, ...patch };
        roomRef.current = next;
        setRoom(next);
        store.set(`moxi_room_state_${code}`, JSON.stringify(next));
        await control()?.presence.update(next);
    }, [code]);

    const publishSync = useCallback(async (pb: Omit<PlaybackState, "at">) => {
        if (roleRef.current !== "host") return;
        const full: PlaybackState = { ...pb, at: now() };
        playbackRef.current = full;
        setPlayback(full);
        store.set(pbKey(code), JSON.stringify(full));
        await control()?.publish("sync", full);
    }, [now, code]);

    const setEpisode = useCallback(async (ver: number, ep: number) => {
        await updateRoom({ ver, ep });
        await publishSync({ ver, ep, playing: false, position: 0, rate: 1, epoch: (playbackRef.current?.epoch ?? 0) + 1 });
    }, [updateRoom, publishSync]);

    const admit = useCallback(async (id: string) => {
        if (!roomRef.current) return;
        await updateRoom({ allowed: [...new Set([...roomRef.current.allowed, id])] });
        await control()?.publish("admit", { clientId: id });
    }, [updateRoom]);

    const kick = useCallback(async (id: string, ban: boolean) => {
        const r = roomRef.current;
        if (!r) return;
        /* Song song: báo người bị mời ra ngay + cập nhật danh sách chặn (server dùng khi họ xin token lại) */
        await Promise.all([
            updateRoom({
                allowed: r.allowed.filter(x => x !== id),
                banned: ban ? [...new Set([...r.banned, id])] : r.banned,
            }),
            control()?.publish("kick", { clientId: id, ban }),
        ]);
    }, [updateRoom]);

    const transferHost = useCallback(async (target: string) => {
        const res = await fetch("/api/rooms/transfer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, secret: getRoomSecret(), ticket: store.get(ticketKey(code)), target }),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error ?? "Không chuyển được quyền");
        /* Tự duyệt mình trước khi giao quyền: phòng đang bật duyệt thì mình vẫn ở lại được với vai trò thành viên */
        const me = ablyRef.current?.auth.clientId;
        if (me && roomRef.current && !roomRef.current.allowed.includes(me)) {
            await updateRoom({ allowed: [...roomRef.current.allowed, me] });
        }
        await control()?.publish("host-transfer", { clientId: target, ticket: j.ticket });
        /* Chờ chủ phòng mới lên presence rồi mới rời — nếu rời trước, phòng sẽ tạm "không có chủ"
           và server từ chối cấp token thành viên cho mình. Quá 15 giây mà họ chưa lên thì giữ quyền. */
        const ok = await (async () => {
            for (let i = 0; i < 30; i++) {
                const items = await control()?.presence.get().catch(() => []) ?? [];
                if (items.some(p => p.clientId === target && (p.data as RoomState | undefined)?.v === 1)) return true;
                await new Promise(r => setTimeout(r, 500));
            }
            return false;
        })();
        if (!ok) throw new Error("Người nhận chưa phản hồi, hãy thử lại");
        /* Bỏ vé của mình, rời presence chủ phòng, lấy token thành viên */
        store.del(ticketKey(code));
        await control()?.presence.leave();
        /* Thành viên không có quyền vào kênh phòng chờ → rời trước khi đổi token */
        await ablyRef.current?.channels.get(channelName(code, "lobby")).detach().catch(() => {});
        await ablyRef.current?.auth.authorize();
        setRole("member");
        systemMessage("Bạn đã chuyển quyền chủ phòng");
    }, [code, systemMessage, updateRoom]);

    const closeRoom = useCallback(async () => {
        if (roleRef.current !== "host") return;
        await control()?.publish("closed", {});
        store.del(ticketKey(code));
        store.del(`moxi_room_state_${code}`);
        ablyRef.current?.close();
        setStatus("closed");
        setError("Bạn đã đóng phòng");
    }, [code]);

    /* ── Hành động của mọi người ── */
    const lastSent = useRef(0);
    const sendChat = useCallback(async (text: string) => {
        const t = text.trim().slice(0, MAX_CHAT);
        if (!t || !meRef.current) return false;
        if (Date.now() - lastSent.current < 600) return false;
        lastSent.current = Date.now();
        await chatCh()?.publish("msg", { text: t, name: meRef.current.name, color: meRef.current.color });
        return true;
    }, []);

    const lastReact = useRef(0);
    const sendReaction = useCallback(async (emoji: string) => {
        if (!meRef.current || Date.now() - lastReact.current < 400) return;
        lastReact.current = Date.now();
        await chatCh()?.publish("react", { emoji, name: meRef.current.name });
    }, []);

    const requestControl = useCallback(async (req: ControlRequest) => {
        await chatCh()?.publish("req", req);
    }, []);

    const memberList: Member[] = useMemo(() => {
        const list = [...members.entries()].map(([id, d]) => ({ ...d, clientId: id, isHost: id === hostId, isMe: id === clientId }));
        return list.sort((a, b) => Number(b.isHost) - Number(a.isHost) || Number(b.isMe) - Number(a.isMe) || a.name.localeCompare(b.name));
    }, [members, hostId, clientId]);

    const lobbyList: Member[] = useMemo(
        () => [...lobby.entries()].map(([id, d]) => ({ ...d, clientId: id, isHost: false, isMe: false })),
        [lobby],
    );

    return {
        status, error, role, clientId, room, hostId, hostOnline, playback, members: memberList, lobby: lobbyList, messages,
        isHost: role === "host",
        now, updateRoom, publishSync, setEpisode, admit, kick, transferHost, closeRoom,
        sendChat, sendReaction, requestControl,
    };
}

export type WatchRoom = ReturnType<typeof useWatchRoom>;
