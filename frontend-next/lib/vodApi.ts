/* ── Nguồn VodPhim (nước ngoài) — https://vodphim.com/api-docs ──
   Dùng qua lib/movieApi.ts. Dữ liệu được chuẩn hoá về quy ước cũ của phimapi
   (type "single"/"series", chieurap, lang, tên tập "Tập 7") để giao diện không phải đổi. */

import type { FetchInit, ListQuery, ListType, MovieList } from "./movieApi";

export const VOD_API = "https://api.xink.pro/api/content";
export const VOD_PLAYER = "https://playembed.vip/player";

/* Loại phim chung → tham số lọc của VodPhim (hoạt hình, TV show là thể loại, không phải type) */
const TYPE_PARAMS: Record<ListType, Record<string, string>> = {
    single:    { type: "single" },
    tv:        { type: "tv" },
    theater:   { type: "theater" },
    animation: { category: "hoat-hinh" },
    tvshows:   { category: "chuong-trinh-truyen-hinh" },
};

/* Slug thể loại khác tên giữa 2 nguồn (danh sách tĩnh trong data/ theo phimapi) */
const CATEGORY_ALIAS: Record<string, string> = { "phim-18": "18-plus" };

/* "a,b" → "a": API không lọc được nhiều giá trị, lấy giá trị đầu */
const first = (v?: string | number) => (v === undefined || v === null ? "" : String(v).split(",")[0].trim());

const SUB_LABEL: Record<string, string> = { vietsub: "Vietsub", multisub: "Vietsub", thuyetminh: "Thuyết Minh", longtieng: "Lồng Tiếng" };

/* Chuẩn hoá 1 phim về quy ước cũ mà giao diện đang dùng:
   movie/tv → single/series, is_chieurap → chieurap, sub → lang,
   episode_total "12 Tập" → "12", phim lẻ episode_current "Hoàn tất" → "Full" */
export function normalizeMovie<T extends Record<string, any>>(m: T): T {
    if (!m || typeof m !== "object") return m;
    const type = m.type === "tv" ? "series" : m.type === "movie" ? "single" : m.type;
    const lang = m.lang || SUB_LABEL[String(m.sub ?? "").toLowerCase()] || "";
    const total = String(m.episode_total ?? "").match(/^\s*(\d+)/)?.[1] ?? m.episode_total;
    const current = type === "single" && /ho[aà]n t[aấ]t/i.test(String(m.episode_current ?? "")) ? "Full" : m.episode_current;
    return {
        ...m,
        type,
        episode_total: total,
        episode_current: current,
        chieurap: m.chieurap ?? !!m.is_chieurap,
        lang,
        tmdb: m.tmdb ?? (m.tmdb_id ? { id: m.tmdb_id, type: m.type === "tv" ? "tv" : "movie", season: m.season } : undefined),
    };
}

/* Tên tập: "7" → "Tập 7", "FULL" → "Full" (phimapi trả "Tập 07", "Full") */
function normalizeEpisodeName(name?: string) {
    const n = String(name ?? "").trim();
    if (/^\d+$/.test(n)) return `Tập ${n}`;
    if (/^full$/i.test(n)) return "Full";
    return n;
}

const normalizeServers = (episodes: any[]) => episodes.map(s => ({
    ...s,
    server_data: Array.isArray(s?.server_data)
        ? s.server_data.map((ep: any) => ({ ...ep, name: normalizeEpisodeName(ep?.name) }))
        : [],
}));

const normalizeList = (json: any): MovieList => ({
    items: Array.isArray(json?.items) ? json.items.map(normalizeMovie) : [],
    pagination: json?.pagination ?? null,
});

function buildQuery(params: Record<string, unknown>) {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        const s = first(v as string | number);
        if (s) sp.set(k, s);
    }
    const q = sp.toString();
    return q ? `?${q}` : "";
}

async function getJson(path: string, init?: FetchInit) {
    const res = await fetch(`${VOD_API}${path}`, init);
    if (!res.ok) throw new Error(`VodPhim ${res.status} ${path}`);
    return res.json();
}

/* Danh sách có lọc: /danh-sach/phim?category=&country=&year=&type=&sort=
   API chỉ lọc được 1 thể loại → hoạt hình/TV show thay cho thể loại đang chọn */
export async function vodList(query: ListQuery = {}, init?: FetchInit): Promise<MovieList> {
    const { type, sort = "modified.time", lang: _lang, ...rest } = query;
    const category = first(rest.category);
    const params = { ...rest, category: CATEGORY_ALIAS[category] ?? category, ...(type ? TYPE_PARAMS[type] : {}), sort };
    return normalizeList(await getJson(`/danh-sach/phim${buildQuery(params)}`, init));
}

/* Tìm kiếm theo tên */
export async function vodSearch(q: string, page = 1, limit = 24, init?: FetchInit): Promise<MovieList> {
    return normalizeList(await getJson(`/tim-kiem${buildQuery({ q, page, limit })}`, init));
}

/* Chi tiết phim + danh sách tập. Không có phim → { movie: null, episodes: [] } */
export async function vodDetail(slug: string, init?: FetchInit): Promise<{ movie: any | null; episodes: any[] }> {
    const res = await fetch(`${VOD_API}/phim/${encodeURIComponent(slug)}`, init);
    if (res.status === 404) return { movie: null, episodes: [] };
    if (!res.ok) throw new Error(`VodPhim ${res.status} /phim/${slug}`);
    const json = await res.json();
    return {
        movie: json?.movie ? normalizeMovie(json.movie) : null,
        episodes: Array.isArray(json?.episodes) ? normalizeServers(json.episodes) : [],
    };
}

/* Thể loại, quốc gia. Danh sách thể loại của API lẫn vài mục rác (slug có dấu cách, tên tiếng Anh) → lọc bỏ */
export async function vodTaxonomies(init?: FetchInit) {
    const json = await getJson("/taxonomies", init);
    const clean = (list: any[]) => (list ?? [])
        .filter(x => /^[a-z0-9-]+$/.test(x?.slug ?? "") && x?.name && !/^phim\s/i.test(x.name))
        .map(x => ({ id: String(x.id), name: String(x.name).trim(), slug: x.slug as string }));
    return {
        categories: clean(json?.categories),
        countries: clean(json?.countries),
    };
}

/* Link trình phát nhúng của 1 tập. next_ep: id tập sau (tự chuyển tập), t: giây bắt đầu */
export function vodPlayerUrl(ep: { episode_id?: string; link_embed?: string }, opts: { nextEpisodeId?: string; startAt?: number } = {}) {
    const base = ep.link_embed || (ep.episode_id ? `${VOD_PLAYER}/${ep.episode_id}` : "");
    if (!base) return "";
    try {
        const url = new URL(base);
        if (opts.nextEpisodeId) url.searchParams.set("next_ep", opts.nextEpisodeId);
        if (opts.startAt && opts.startAt > 0) url.searchParams.set("t", String(Math.floor(opts.startAt)));
        return url.toString();
    } catch {
        /* Link lỗi từ API → không hiện trình phát thay vì làm hỏng cả trang */
        return "";
    }
}
