import axios from "axios";
import type { Movie } from "@/types/movie";
import type { Category } from "@/types/category";
import type { Country } from "@/types/country";

const PHIM_API = "https://phimapi.com";
const PHIM_V1 = `${PHIM_API}/v1/api`;

/* ── In-memory cache với TTL 5 phút ── */
const _cache = new Map<string, { data: unknown; ts: number }>();
const TTL = 5 * 60 * 1000;

async function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const hit = _cache.get(key);
    if (hit && Date.now() - hit.ts < TTL) return hit.data as T;
    const data = await fn();
    _cache.set(key, { data, ts: Date.now() });
    return data;
}

/* Tham số lọc danh sách theo tài liệu: page, limit (tối đa 64), category, country, year, sort_field, sort_type, sort_lang */
export type ListParams = {
    page?: number;
    limit?: number;
    category?: string;
    country?: string;
    year?: string;
    sort_field?: "modified.time" | "_id" | "year";
    sort_type?: "desc" | "asc";
    sort_lang?: "vietsub" | "thuyet-minh" | "long-tieng";
};

/* Gọi endpoint danh sách, trả về items + pagination (đọc từ data.params.pagination) */
const fetchList = async (path: string, params: ListParams = {}) => {
    const res = await axios.get(`${PHIM_V1}${path}`, {
        params: { sort_field: "modified.time", sort_type: "desc", ...params },
    });
    const data = res.data?.data;
    return {
        items: data?.items || [],
        pagination: data?.params?.pagination || null,
    };
};

export const movieService = {

    dataSlider: () => cached("slider", async () => {
        const res = await axios.get(`${PHIM_API}/v1/api/danh-sach/phim-le?page=1&sort_field=modified.time&sort_type=desc&year=2026&limit=10`);
        return res.data.data.items.map((movie: Movie) => ({
            ...movie,
            category: Array.isArray(movie.category)
                ? movie.category.map((c: Category) => ({ id: c.id, name: c.name, slug: c.slug }))
                : [],
            country: Array.isArray(movie.country)
                ? movie.country.map((c: Country) => ({ ...c }))
                : [],
        }));
    }),

    dataSearch: async (keyword: string, page: number = 1, limit: number = 24) => {
        const res = await axios.get(`${PHIM_API}/v1/api/tim-kiem`, { params: { keyword, page, limit } });
        const data = res.data?.data;
        return {
            items: data?.items || [],
            pagination: {
                currentPage: page,
                totalPages: Math.ceil((data?.params?.pagination?.totalItems || 0) / limit),
                totalItems: data?.params?.pagination?.totalItems || 0,
                limit,
            }
        };
    },

    dataKoreanMovies:   () => cached("korean",    () => axios.get(`${PHIM_API}/v1/api/danh-sach/phim-bo?sort_field=modified.time&sort_type=desc&limit=10&country=han-quoc`).then(r => r.data?.data?.items || [])),
    dataChinaMovies:    () => cached("china",     () => axios.get(`${PHIM_API}/v1/api/danh-sach/phim-bo?sort_field=modified.time&sort_type=desc&limit=10&country=trung-quoc`).then(r => r.data?.data?.items || [])),
    dataVietNamMovies:  () => cached("vietnam",   () => axios.get(`${PHIM_API}/v1/api/danh-sach/phim-bo?sort_field=modified.time&sort_type=desc&limit=10&country=viet-nam`).then(r => r.data?.data?.items || [])),
    dataJapanMovies:    () => cached("japan",     () => axios.get(`${PHIM_API}/v1/api/danh-sach/phim-bo?sort_field=modified.time&sort_type=desc&limit=10&country=nhat-ban`).then(r => r.data?.data?.items || [])),
    dataThaiLandMovies: () => cached("thailand",  () => axios.get(`${PHIM_API}/v1/api/danh-sach/phim-bo?sort_field=modified.time&sort_type=desc&limit=10&country=thai-lan`).then(r => r.data?.data?.items || [])),
    dataHongKongMovies: () => cached("hongkong",  () => axios.get(`${PHIM_API}/v1/api/danh-sach/phim-bo?sort_field=modified.time&sort_type=desc&limit=10&country=hong-kong`).then(r => r.data?.data?.items || [])),

    /* TMDB đi qua route server /api/tmdb (key nằm ở biến môi trường, không ở client) */
    dataCommingMovies:    () => cached("coming",   () => axios.get(`/api/tmdb`, { params: { action: "upcoming" } }).then(r => r.data?.results || [])),
    dataMoviesInTheaters: () => cached("theaters", () => axios.get(`/api/tmdb`, { params: { action: "now_playing" } }).then(r => r.data?.results || [])),

    dataNewMovies:    () => cached("new-movies",  () => axios.get(`${PHIM_API}/v1/api/danh-sach/phim-le?sort_field=modified.time&sort_type=desc&limit=10`).then(r => r.data?.data?.items || [])),
    dataTopTVSeries:  () => cached("top-tv",      () => axios.get(`${PHIM_API}/v1/api/danh-sach/phim-bo?sort_field=modified.time&sort_type=desc&limit=10`).then(r => r.data?.data?.items || [])),
    dataTopNewMovies: () => cached("top-movies",  () => axios.get(`${PHIM_API}/v1/api/danh-sach/phim-le?sort_field=modified.time&sort_type=desc&limit=10&page=2`).then(r => r.data?.data?.items || [])),
    dataCinemaMovies: () => cached("cinema",      () => axios.get(`${PHIM_API}/v1/api/danh-sach/phim-chieu-rap?sort_field=modified.time&sort_type=desc&limit=10`).then(r => r.data?.data?.items || [])),
    dataAnimeMovies:  () => cached("anime",       () => axios.get(`${PHIM_API}/v1/api/danh-sach/hoat-hinh?sort_field=modified.time&sort_type=desc&limit=10&country=nhat-ban`).then(r => r.data?.data?.items || [])),
    dataGhostMovies:  () => cached("ghost",       () => axios.get(`${PHIM_API}/v1/api/danh-sach/phim-le?sort_field=modified.time&sort_type=desc&limit=10&category=kinh-di`).then(r => r.data?.data?.items || [])),
    dataBrainTeaserWithCriminalsMovies: () => cached("brainstormer", () => axios.get(`${PHIM_API}/v1/api/danh-sach/phim-le?sort_field=modified.time&sort_type=desc&limit=10&category=hinh-su`).then(r => r.data?.data?.items || [])),

    dataFilterMovie: async (params: {
        type_list?: string;
        page?: number;
        sort_field?: string;
        sort_lang?: string;
        sort_type?: string;
        category?: string;
        country?: string;
        year?: string;
        limit?: number;
    }) => {
        const { type_list = "phim-le", ...rest } = params;
        const res = await axios.get(`${PHIM_API}/v1/api/danh-sach/${type_list}`, { params: rest });
        return {
            items: res.data?.data?.items || [],
            pagination: res.data?.data?.params?.pagination || null,
            type_list,
            params: res.data?.data?.params || {},
        };
    },

    /* ── Theo tài liệu API mới ── */

    dataHome: () => cached("home", () => axios.get(`${PHIM_V1}/home`).then(r => r.data?.data?.items || [])),

    dataGenres:    () => cached("genres",    () => axios.get(`${PHIM_API}/the-loai`).then(r => r.data?.data?.items || [])),
    dataCountries: () => cached("countries", () => axios.get(`${PHIM_API}/quoc-gia`).then(r => r.data?.data?.items || [])),
    dataYears:     () => cached("years",     () => axios.get(`${PHIM_API}/nam-phat-hanh`).then(r => r.data?.data?.items || [])),

    dataByGenre:   (slug: string, params: ListParams = {}) => fetchList(`/the-loai/${slug}`, params),
    dataByCountry: (slug: string, params: ListParams = {}) => fetchList(`/quoc-gia/${slug}`, params),
    dataByYear:    (year: number, params: ListParams = {}) => fetchList(`/nam/${year}`, params),

    dataPeoples:  (slug: string) => cached(`peoples-${slug}`,  () => axios.get(`${PHIM_V1}/phim/${slug}/peoples`).then(r => r.data?.data ?? null)),
    dataImages:   (slug: string) => cached(`images-${slug}`,   () => axios.get(`${PHIM_V1}/phim/${slug}/images`).then(r => r.data?.data ?? null)),
    dataKeywords: (slug: string) => cached(`keywords-${slug}`, () => axios.get(`${PHIM_V1}/phim/${slug}/keywords`).then(r => r.data?.data?.keywords ?? [])),

    dataDetailMovie: async (slug: string) => {
        const res = await axios.get(`${PHIM_API}/phim/${slug}`);
        return res.data || {};
    },
};