import axios from "axios";

const COMIC_API = "https://otruyenapi.com";
const APP_DOMAIN_CDN_IMAGE = "https://img.otruyenapi.com";

const buildItems = (items: any[]) =>
    items.map(item => ({
        ...item,
        thumb_full: `${APP_DOMAIN_CDN_IMAGE}/uploads/comics/${item.thumb_url}`,
    }));

export const comicService = {
    dataList: async (page = 1) => {
        const { data } = await axios.get(`${COMIC_API}/v1/api/danh-sach/truyen-moi`, {
            params: { page },
        });
        return {
            items: buildItems(data.data.items),
            pagination: data.data.params.pagination,
        };
    },

    dataSearch: async (keyword: string, page = 1) => {
        const { data } = await axios.get(`${COMIC_API}/v1/api/tim-kiem`, {
            params: { keyword, page },
        });
        return {
            items: buildItems(data.data.items),
            pagination: data.data.params.pagination,
        };
    },

    dataDetailCategory: async (slug: string, page = 1) => {
        const { data } = await axios.get(`${COMIC_API}/v1/api/the-loai/${slug}`, {
            params: { page },
        });
        return {
            items: buildItems(data.data.items),
            pagination: data.data.params.pagination,
        };
    },

    dataDetailComic: async (slug: string) => {
        const { data } = await axios.get(`${COMIC_API}/v1/api/truyen-tranh/${slug}`);
        const item = data.data.item;
        if (item) item.thumb_full = `${APP_DOMAIN_CDN_IMAGE}/uploads/comics/${item.thumb_url}`;
        return item || {};
    },
};