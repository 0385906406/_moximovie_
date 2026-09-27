"use client";

import { useCallback, useRef } from "react";

/*
 * Animation CSS chạy vô hạn (particle, pulse, shimmer...) vẫn tốn CPU mỗi frame dù đang ở ngoài màn hình.
 * Gắn ref này vào khối chứa → khi khối ra khỏi màn hình sẽ có data-offscreen,
 * CSS trong globals.css tạm dừng mọi animation bên trong. Cuộn tới gần thì chạy lại.
 *
 * Trả về callback ref (không phải useRef) để observer tự gắn lại khi phần tử đổi,
 * vd. component render <div> lúc đang tải rồi mới render <section> thật.
 */
export function usePauseOffscreen<T extends HTMLElement>(margin = "200px", onChange?: (visible: boolean) => void) {
    /* Giữ callback mới nhất mà không phải tạo lại observer */
    const cb = useRef(onChange);
    cb.current = onChange;
    const io = useRef<IntersectionObserver | null>(null);

    return useCallback((el: T | null) => {
        io.current?.disconnect();
        io.current = null;
        if (!el) return;
        io.current = new IntersectionObserver(
            ([e]) => {
                el.toggleAttribute("data-offscreen", !e.isIntersecting);
                cb.current?.(e.isIntersecting);
            },
            { rootMargin: margin },
        );
        io.current.observe(el);
    }, [margin]);
}
