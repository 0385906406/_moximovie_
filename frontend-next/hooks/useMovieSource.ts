"use client";

import { useEffect, useState } from "react";
import { DEFAULT_SOURCE, getClientSource, type MovieSource } from "@/lib/movieSource";

/* Nguồn phim đang chọn. Đọc cookie sau khi mount để HTML render ở server và client giống nhau */
export function useMovieSource(): MovieSource {
    const [source, setSource] = useState<MovieSource>(DEFAULT_SOURCE);
    useEffect(() => { setSource(getClientSource()); }, []);
    return source;
}
