/* ── Giao diện chung cho 2 nguồn phim (lib/phimApi.ts, lib/vodApi.ts) ──
   Cả hai nhận cùng tham số và trả cùng dạng dữ liệu (theo quy ước cũ của phimapi),
   nên trang/component chỉ cần gọi movieApi(source).list(...) mà không quan tâm nguồn nào. */

import type { MovieSource } from "./movieSource";
import * as phim from "./phimApi";
import * as vod from "./vodApi";

export type FetchInit = RequestInit & { next?: { revalidate?: number } };

/* Loại phim chung cho 2 nguồn */
export type ListType = "single" | "tv" | "theater" | "animation" | "tvshows";

export interface ListQuery {
    page?: number;
    limit?: number;
    category?: string;
    country?: string;
    year?: string | number;
    type?: ListType;
    /* view: chỉ VodPhim sắp xếp được; phimapi bỏ qua và dùng modified.time */
    sort?: "modified.time" | "year" | "view";
    /* vietsub | thuyet-minh | long-tieng — chỉ phimapi lọc được */
    lang?: string;
}

export interface Pagination {
    totalItems: number;
    totalItemsPerPage: number;
    currentPage: number;
    totalPages: number;
}

export interface MovieList<T = any> {
    items: T[];
    pagination: Pagination | null;
}

export interface Taxonomy { id: string; name: string; slug: string }

export interface MovieApi {
    source: MovieSource;
    list(query?: ListQuery, init?: FetchInit): Promise<MovieList>;
    search(keyword: string, page?: number, limit?: number, init?: FetchInit): Promise<MovieList>;
    detail(slug: string, init?: FetchInit): Promise<{ movie: any | null; episodes: any[] }>;
    taxonomies(init?: FetchInit): Promise<{ categories: Taxonomy[]; countries: Taxonomy[] }>;
    /* Lọc được nhiều giá trị "a,b" cho quốc gia/thể loại không */
    multiFilter: boolean;
    /* Lọc theo phiên bản (vietsub/thuyết minh/lồng tiếng) không */
    langFilter: boolean;
}

const APIS: Record<MovieSource, MovieApi> = {
    phimapi: {
        source: "phimapi",
        list: phim.phimList,
        search: phim.phimSearch,
        detail: phim.phimDetail,
        taxonomies: phim.phimTaxonomies,
        multiFilter: true,
        langFilter: true,
    },
    vodphim: {
        source: "vodphim",
        list: vod.vodList,
        search: vod.vodSearch,
        detail: vod.vodDetail,
        taxonomies: vod.vodTaxonomies,
        multiFilter: false,
        langFilter: false,
    },
};

export function movieApi(source: MovieSource): MovieApi {
    return APIS[source];
}

/* type_list trên URL (/loc-phim?type_list=phim-le, /phim-bo...) → loại phim chung */
const TYPE_LIST: Record<string, ListType> = {
    "phim-le": "single",
    "phim-bo": "tv",
    "phim-chieu-rap": "theater",
    "hoat-hinh": "animation",
    "tv-shows": "tvshows",
};

export function typeFromTypeList(typeList?: string): ListType | undefined {
    return typeList ? TYPE_LIST[typeList] : undefined;
}
