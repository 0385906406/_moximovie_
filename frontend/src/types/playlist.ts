export interface PlaylistMovieItem {
    movieId: string;
    slug: string;
    title: string;
    origin_name?: string;
    poster_url?: string;
}

export interface PlaylistMovie {
    _id: string;
    name: string;
    slug: string;
    movies: PlaylistMovieItem[];
    poster_url?: string;
    added: boolean;
}