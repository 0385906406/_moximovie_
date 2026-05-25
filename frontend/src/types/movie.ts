import type { Category } from "./category";
import type { Country } from "./country";

export interface Movie {
    _id: string;
    slug: string;
    name: string;
    title: string;
    original_title: string;
    origin_name?: string;
    poster_url: string;
    poster_path: string;
    thumb_url: string;
    season: number;
    category: Category[];
    country: Country[];
    quality: string;
    time: number;
    episode_total: string;
    release_date: number;
    year: number;
    overview: string;
    episode_current: string;
    lang: string;
    chieurap: boolean;
    season_name: string;
    content: string;
    director: string[];
    actor: string[];
    movie: "single" | "series";
    type: "single" | "series";
    status: "ongoing" | "completed" | "upcoming";
    createdAt: string;
    updatedAt: string;
}