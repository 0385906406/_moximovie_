import axios from "axios";
import type { Movie } from "@/types/movie";
import type { Category } from "@/types/category";
import type { Country } from "@/types/country";

const PHIM_API = "https://phimapi.com";
const TMDB_API = "https://api.themoviedb.org/3";
const TMDB_KEY = "e65862b12156ee1397271e1894f00b2c";

export const movieService = {

    dataSlider: async () => {
        const res = await axios.get(`${PHIM_API}/v1/api/danh-sach/phim-le?page=1&sort_field=modified&sort_type=desc&year=2026&limit=10`);
        return res.data.data.items.map((movie: Movie) => ({
            ...movie,
            category: Array.isArray(movie.category)
                ? movie.category.map((c: Category) => ({ id: c.id, name: c.name, slug: c.slug }))
                : [],
            country: Array.isArray(movie.country)
                ? movie.country.map((c: Country) => ({ ...c }))
                : [],
        }));
    },

    dataSearch: async (keyword: string, page: number = 1, limit: number = 24) => {
        const res = await axios.get(`${PHIM_API}/v1/api/tim-kiem`, {
            params: { keyword, page, limit }
        });
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

    dataKoreanMovies: async () => {
        const res = await axios.get(`${PHIM_API}/v1/api/danh-sach/phim-bo?sort_field=modified&sort_type=desc&limit=10&country=han-quoc&year=2025`);
        return res.data?.data?.items || [];
    },

    dataChinaMovies: async () => {
        const res = await axios.get(`${PHIM_API}/v1/api/danh-sach/phim-bo?sort_field=modified&sort_type=desc&limit=10&country=trung-quoc&year=2025`);
        return res.data?.data?.items || [];
    },

    dataVietNamMovies: async () => {
        const res = await axios.get(`${PHIM_API}/v1/api/danh-sach/phim-bo?sort_field=modified&sort_type=desc&limit=10&country=viet-nam&year=2025`);
        return res.data?.data?.items || [];
    },

    dataJapanMovies: async () => {
        const res = await axios.get(`${PHIM_API}/v1/api/danh-sach/phim-bo?sort_field=modified&sort_type=desc&limit=10&country=nhat-ban&year=2025`);
        return res.data?.data?.items || [];
    },

    dataThaiLandMovies: async () => {
        const res = await axios.get(`${PHIM_API}/v1/api/danh-sach/phim-bo?sort_field=modified&sort_type=desc&limit=10&country=thai-lan&year=2025`);
        return res.data?.data?.items || [];
    },

    dataHongKongMovies: async () => {
        const res = await axios.get(`${PHIM_API}/v1/api/danh-sach/phim-bo?sort_field=modified&sort_type=desc&limit=10&country=hong-kong`);
        return res.data?.data?.items || [];
    },

    dataCommingMovies: async () => {
        const res = await axios.get(`${TMDB_API}/movie/upcoming?api_key=${TMDB_KEY}&language=vi-VN&region=VN&page=1`);
        return res.data?.results || [];
    },

    dataMoviesInTheaters: async () => {
        const res = await axios.get(`${TMDB_API}/movie/now_playing?api_key=${TMDB_KEY}&language=vi-VN&region=VN&page=1`);
        return res.data?.results || [];
    },

    dataCommingMovieDetail: async (id: number) => {
        const [detail, credits, videos] = await Promise.all([
            axios.get(`${TMDB_API}/movie/${id}?api_key=${TMDB_KEY}&language=vi-VN`),
            axios.get(`${TMDB_API}/movie/${id}/credits?api_key=${TMDB_KEY}&language=vi-VN`),
            axios.get(`${TMDB_API}/movie/${id}/videos?api_key=${TMDB_KEY}&language=vi-VN`),
        ]);
        return { detail: detail.data, credits: credits.data, videos: videos.data };
    },

    dataNewMovies: async () => {
        const res = await axios.get(`${PHIM_API}/v1/api/danh-sach/phim-le?sort_field=modified&sort_type=desc&limit=10&year=2025`);
        return res.data?.data?.items || [];
    },

    dataTopTVSeries: async () => {
        const res = await axios.get(`${PHIM_API}/v1/api/danh-sach/phim-bo?sort_field=modified&sort_type=desc&limit=10&year=2025`);
        return res.data?.data?.items || [];
    },

    dataTopNewMovies: async () => {
        const res = await axios.get(`${PHIM_API}/v1/api/danh-sach/phim-le?sort_field=modified&sort_type=desc&limit=10&page=2&year=2025`);
        return res.data?.data?.items || [];
    },

    dataCinemaMovies: async () => {
        const res = await axios.get(`${PHIM_API}/v1/api/danh-sach/phim-chieu-rap?sort_field=modified&sort_type=desc&limit=10&year=2025`);
        return res.data?.data?.items || [];
    },

    dataAnimeMovies: async () => {
        const res = await axios.get(`${PHIM_API}/v1/api/danh-sach/hoat-hinh?sort_field=modified&sort_type=desc&limit=15&country=nhat-ban&year=2025`);
        return res.data?.data?.items || [];
    },

    dataGhostMovies: async () => {
        const res = await axios.get(`${PHIM_API}/v1/api/danh-sach/phim-le?sort_field=modified&sort_type=desc&limit=10&category=kinh-di`);
        return res.data?.data?.items || [];
    },

    dataBrainTeaserWithCriminalsMovies: async () => {
        const res = await axios.get(`${PHIM_API}/v1/api/danh-sach/phim-le?sort_field=modified&sort_type=desc&limit=10&category=hinh-su`);
        return res.data?.data?.items || [];
    },

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

    dataDetailMovie: async (slug: string) => {
        const res = await axios.get(`${PHIM_API}/phim/${slug}`);
        return res.data || {};
    },
};