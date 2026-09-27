/* ── Ảnh phim: poster (dọc) và thumb (ngang), cái này thiếu/lỗi thì dùng cái kia ── */

export type MovieImageKind = "poster" | "thumb";

export interface MovieImageFields {
    poster_url?: string | null;
    thumb_url?: string | null;
}

/* phimapi trả về lúc thì URL đầy đủ, lúc thì path tương đối trên phimimg.com */
export function toMovieImgUrl(path?: string | null) {
    const p = path?.trim();
    if (!p) return "";
    if (/^https?:\/\//.test(p)) return p;
    if (p.startsWith("//")) return `https:${p}`;
    return `https://phimimg.com/${p.replace(/^\/+/, "")}`;
}

/* Danh sách ảnh theo thứ tự ưu tiên: ảnh muốn dùng trước, ảnh còn lại làm dự phòng */
export function movieImageSources(movie: MovieImageFields, prefer: MovieImageKind) {
    const poster = toMovieImgUrl(movie.poster_url);
    const thumb = toMovieImgUrl(movie.thumb_url);
    const list = prefer === "poster" ? [poster, thumb] : [thumb, poster];
    return [...new Set(list.filter(Boolean))];
}
