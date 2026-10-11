/* ── Ảnh phim: poster (dọc) và thumb (ngang), cái này thiếu/lỗi thì dùng cái kia ── */

export type MovieImageKind = "poster" | "thumb";

export interface MovieImageFields {
    poster_url?: string | null;
    thumb_url?: string | null;
}

/* API phim thường trả URL đầy đủ; path tương đối (phimapi) thì ghép với phimimg.com.
   Riêng path dạng TMDB ("t/p/w780/abc.jpg") là ảnh của TMDB, không có trên phimimg.com */
export function toMovieImgUrl(path?: string | null) {
    const p = path?.trim();
    if (!p) return "";
    if (/^https?:\/\//.test(p)) return p;
    if (p.startsWith("//")) return `https:${p}`;
    const rel = p.replace(/^\/+/, "");
    if (/^t\/p\//.test(rel)) return `https://image.tmdb.org/${rel}`;
    return `https://phimimg.com/${rel}`;
}

/* Danh sách ảnh theo thứ tự ưu tiên: ảnh muốn dùng trước, ảnh còn lại làm dự phòng */
export function movieImageSources(movie: MovieImageFields, prefer: MovieImageKind) {
    const poster = toMovieImgUrl(movie.poster_url);
    const thumb = toMovieImgUrl(movie.thumb_url);
    const list = prefer === "poster" ? [poster, thumb] : [thumb, poster];
    return [...new Set(list.filter(Boolean))];
}
