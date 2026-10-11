import axios from "axios";
import { movieApi, typeFromTypeList, type ListQuery } from "@/lib/movieApi";
import { getClientSource } from "@/lib/movieSource";

/* ── In-memory cache với TTL 5 phút (theo từng nguồn phim) ── */
const _cache = new Map<string, { data: unknown; ts: number }>();
const TTL = 5 * 60 * 1000;

async function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const fullKey = `${getClientSource()}:${key}`;
    const hit = _cache.get(fullKey);
    if (hit && Date.now() - hit.ts < TTL) return hit.data as T;
    const data = await fn();
    _cache.set(fullKey, { data, ts: Date.now() });
    return data;
}

/* Nguồn phim người xem đang chọn (cookie moxi_source) */
const api = () => movieApi(getClientSource());

/* Tham số lọc danh sách: page, limit, category, country, year, sort */
export type ListParams = Omit<ListQuery, "type">;

/* Danh sách 10 phim cho các mục ở trang chủ */
const section = (key: string, query: ListQuery) =>
    cached(key, () => api().list({ limit: 10, ...query }).then(r => r.items));

/* Mục "Top": VodPhim sắp xếp được theo lượt xem; phimapi thì giữ như cũ (phim mới, trang 2 với phim lẻ) */
const topQuery = (type: "single" | "tv"): ListQuery => api().source === "vodphim"
    ? { type, sort: "view" }
    : { type, page: type === "single" ? 2 : 1 };

/* Thể loại/quốc gia lấy chung 1 lần */
const taxonomies = () => cached("taxonomies", () => api().taxonomies());

export const movieService = {

    dataSlider: () => section("slider", { type: "single", year: 2026 }),

    dataSearch: async (keyword: string, page: number = 1, limit: number = 24) => {
        const { items, pagination } = await api().search(keyword, page, limit);
        return {
            items,
            pagination: {
                currentPage: pagination?.currentPage ?? page,
                totalPages: pagination?.totalPages ?? Math.ceil((pagination?.totalItems ?? 0) / limit),
                totalItems: pagination?.totalItems ?? 0,
                limit,
            }
        };
    },

    dataKoreanMovies:   () => section("korean",   { type: "tv", country: "han-quoc" }),
    dataChinaMovies:    () => section("china",    { type: "tv", country: "trung-quoc" }),
    dataVietNamMovies:  () => section("vietnam",  { type: "tv", country: "viet-nam" }),
    dataJapanMovies:    () => section("japan",    { type: "tv", country: "nhat-ban" }),
    dataThaiLandMovies: () => section("thailand", { type: "tv", country: "thai-lan" }),
    dataHongKongMovies: () => section("hongkong", { type: "tv", country: "hong-kong" }),

    /* TMDB đi qua route server /api/tmdb (key nằm ở biến môi trường, không ở client) */
    dataCommingMovies:    () => cached("coming",   () => axios.get(`/api/tmdb`, { params: { action: "upcoming" } }).then(r => r.data?.results || [])),
    dataMoviesInTheaters: () => cached("theaters", () => axios.get(`/api/tmdb`, { params: { action: "now_playing" } }).then(r => r.data?.results || [])),

    dataNewMovies:    () => section("new-movies", { type: "single" }),
    dataTopTVSeries:  () => section("top-tv",     topQuery("tv")),
    dataTopNewMovies: () => section("top-movies", topQuery("single")),
    dataCinemaMovies: () => section("cinema",     { type: "theater" }),
    dataAnimeMovies:  () => section("anime",      { type: "animation", country: "nhat-ban" }),
    dataGhostMovies:  () => section("ghost",      { type: "single", category: "kinh-di" }),
    dataBrainTeaserWithCriminalsMovies: () => section("brainstormer", { type: "single", category: "hinh-su" }),

    /* type_list giữ tên cũ trên URL (phim-le, phim-bo, hoat-hinh, phim-chieu-rap, tv-shows).
       Không có type_list → lọc theo thể loại/quốc gia/năm trên mọi loại phim */
    dataFilterMovie: async (params: {
        type_list?: string;
        page?: number;
        sort?: ListQuery["sort"];
        sort_lang?: string;
        category?: string;
        country?: string;
        year?: string;
        limit?: number;
    }) => {
        const { type_list, sort_lang, ...rest } = params;
        const { items, pagination } = await api().list({ ...rest, type: typeFromTypeList(type_list), lang: sort_lang });
        return { items, pagination, type_list };
    },

    dataGenres:    () => taxonomies().then(t => t.categories),
    dataCountries: () => taxonomies().then(t => t.countries),

    dataByGenre:   (slug: string, params: ListParams = {}) => api().list({ ...params, category: slug }),
    dataByCountry: (slug: string, params: ListParams = {}) => api().list({ ...params, country: slug }),
    dataByYear:    (year: number, params: ListParams = {}) => api().list({ ...params, year }),

    dataDetailMovie: (slug: string) => api().detail(slug),
};
