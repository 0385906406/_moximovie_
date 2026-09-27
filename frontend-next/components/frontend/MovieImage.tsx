"use client";

import Image, { type ImageProps } from "next/image";
import { useCallback, useState } from "react";
import { Film } from "lucide-react";
import { movieImageSources, type MovieImageFields, type MovieImageKind } from "@/lib/movieImage";

type Props = Omit<ImageProps, "src" | "onError"> & {
    movie: MovieImageFields;
    /* "poster" = ảnh dọc, "thumb" = ảnh ngang. Lỗi/thiếu thì tự đổi sang loại còn lại */
    prefer: MovieImageKind;
    /* Dùng thẻ <img> thường thay vì next/image (vd. ảnh nhỏ trong dropdown) */
    plain?: boolean;
};

/**
 * Ảnh phim có fallback: prefer → loại còn lại → placeholder.
 */
export default function MovieImage({ movie, prefer, plain, alt, fill, className, style, ...rest }: Props) {
    const sources = movieImageSources(movie, prefer);
    const key = sources.join("|");

    /* Gắn idx với bộ ảnh hiện tại → đổi phim (vd. slider) thì tự reset về ảnh đầu */
    const [failed, setFailed] = useState({ key, idx: 0 });
    const idx = failed.key === key ? failed.idx : 0;
    const src = sources[idx];

    const next = useCallback(() => setFailed({ key, idx: idx + 1 }), [key, idx]);

    /* <img> SSR có thể lỗi trước khi React hydrate → onError không bắn, kiểm tra lại khi mount */
    const plainRef = useCallback((img: HTMLImageElement | null) => {
        if (img && img.complete && img.naturalWidth === 0) next();
    }, [next]);

    if (!src) {
        return (
            <div
                className={fill ? "absolute inset-0 flex items-center justify-center" : `flex items-center justify-center ${className ?? ""}`}
                style={{ background: "#141722", ...(fill ? {} : { width: rest.width, height: rest.height, ...style }) }}
                role="img"
                aria-label={alt}
            >
                <Film size={24} className="text-white/15" />
            </div>
        );
    }

    if (plain) {
        const { width, height, loading, onLoad } = rest;
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                key={src}
                ref={plainRef}
                src={src}
                alt={alt}
                width={width as number | undefined}
                height={height as number | undefined}
                loading={loading}
                className={className}
                style={style}
                onLoad={onLoad}
                onError={next}
            />
        );
    }

    return (
        <Image
            key={src}
            src={src}
            alt={alt}
            fill={fill}
            className={className}
            style={style}
            onError={next}
            {...rest}
        />
    );
}
