/* ── Nguồn phimapi (trong nước) — https://phimapi.com ──
   Dùng qua lib/movieApi.ts. Giao diện được viết theo dữ liệu của nguồn này, chỉ cần chuẩn hoá vài chỗ nhỏ. */

import type { FetchInit, ListQuery, ListType, MovieList, Taxonomy } from "./movieApi";
import type { TmdbCast } from "./tmdb";

export const PHIM_API = "https://phimapi.com";
const PHIM_V1 = `${PHIM_API}/v1/api`;

/* Loại phim chung → đường dẫn danh sách của phimapi */
const TYPE_PATH: Record<ListType, string> = {
    single: "phim-le",
    tv: "phim-bo",
    theater: "phim-chieu-rap",
    animation: "hoat-hinh",
    tvshows: "tv-shows",
};

const first = (v?: string | number) => String(v ?? "").split(",")[0].trim();

/* episode_total của phimapi lúc là số (12), lúc là chuỗi ("12") → luôn là chuỗi để so sánh "1" đúng */
function normalizeMovie<T extends Record<string, any>>(m: T): T {
    if (!m || typeof m !== "object") return m;
    return { ...m, episode_total: m.episode_total === undefined || m.episode_total === null ? m.episode_total : String(m.episode_total) };
}

function toList(json: any): MovieList {
    const data = json?.data;
    return {
        items: Array.isArray(data?.items) ? data.items.map(normalizeMovie) : [],
        pagination: data?.params?.pagination ?? null,
    };
}

function buildQuery(params: Record<string, unknown>) {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
    }
    const q = sp.toString();
    return q ? `?${q}` : "";
}

async function getJson(url: string, init?: FetchInit) {
    const res = await fetch(url, init);
    if (!res.ok) throw new Error(`phimapi ${res.status} ${url}`);
    return res.json();
}

/* Danh sách có lọc. Có loại phim → /danh-sach/{loại}; không có → theo thể loại/quốc gia/năm.
   phimapi không sắp xếp theo lượt xem (sort_field=view bị bỏ qua) → dùng modified.time */
export async function phimList(query: ListQuery = {}, init?: FetchInit): Promise<MovieList> {
    const { type, sort, lang, category, country, year, page, limit } = query;
    const params: Record<string, unknown> = {
        page, limit, category, country, year,
        sort_field: sort === "year" ? "year" : "modified.time",
        sort_type: "desc",
        sort_lang: lang,
    };
    let path: string;
    if (type) path = `/danh-sach/${TYPE_PATH[type]}`;
    else if (category) { path = `/the-loai/${first(category)}`; delete params.category; }
    else if (country) { path = `/quoc-gia/${first(country)}`; delete params.country; }
    else if (year) { path = `/nam/${first(year)}`; delete params.year; }
    else path = "/danh-sach/phim-le";
    return toList(await getJson(`${PHIM_V1}${path}${buildQuery(params)}`, init));
}

export async function phimSearch(keyword: string, page = 1, limit = 24, init?: FetchInit): Promise<MovieList> {
    return toList(await getJson(`${PHIM_V1}/tim-kiem${buildQuery({ keyword, page, limit })}`, init));
}

export async function phimDetail(slug: string, init?: FetchInit): Promise<{ movie: any | null; episodes: any[] }> {
    const json = await getJson(`${PHIM_API}/phim/${encodeURIComponent(slug)}`, init);
    return {
        movie: json?.movie ? normalizeMovie(json.movie) : null,
        episodes: Array.isArray(json?.episodes) ? json.episodes : [],
    };
}

export async function phimTaxonomies(init?: FetchInit): Promise<{ categories: Taxonomy[]; countries: Taxonomy[] }> {
    const pick = (json: any): Taxonomy[] => (json?.data?.items ?? json ?? [])
        .filter((x: any) => x?.slug && x?.name)
        .map((x: any) => ({ id: String(x._id ?? x.id ?? x.slug), name: x.name, slug: x.slug }));
    const [cats, countries] = await Promise.all([
        getJson(`${PHIM_API}/the-loai`, init),
        getJson(`${PHIM_API}/quoc-gia`, init),
    ]);
    return { categories: pick(cats), countries: pick(countries) };
}

/* Diễn viên có ảnh (endpoint /peoples). Lỗi hoặc rỗng → [] để dùng diễn viên từ TMDB.
   profile chỉ là đường dẫn TMDB ("/abc.jpg") giống lib/tmdb.ts — MovieTabs tự ghép kích thước ảnh */
export async function phimCast(slug: string, init?: FetchInit): Promise<TmdbCast[]> {
    try {
        const json = await getJson(`${PHIM_V1}/phim/${encodeURIComponent(slug)}/peoples`, init);
        const people: any[] = json?.data?.peoples ?? [];
        return people
            .filter(p => p.known_for_department === "Acting")
            .slice(0, 16)
            .map(p => ({
                id: p.tmdb_people_id,
                name: p.name,
                character: p.character || undefined,
                profile: p.profile_path || null,
            }));
    } catch {
        return [];
    }
}

/* Ảnh ngang của phim (endpoint /images), tối đa 5 ảnh. Lỗi → [] */
export async function phimStills(slug: string, init?: FetchInit): Promise<string[]> {
    try {
        const json = await getJson(`${PHIM_V1}/phim/${encodeURIComponent(slug)}/images`, init);
        const base: string = json?.data?.image_sizes?.backdrop?.w780 ?? "https://image.tmdb.org/t/p/w780";
        const images: { type: string; file_path: string }[] = json?.data?.images ?? [];
        return images
            .filter(img => img.type === "backdrop" && img.file_path)
            .slice(0, 5)
            .map(img => `${base}${img.file_path}`);
    } catch {
        return [];
    }
}
