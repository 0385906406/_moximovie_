"use client";

import { useEffect, useRef } from "react";

/*
 * Hiệu ứng dùng chung cho trang /phimhay — 1 bộ lắng nghe cho cả trang (event delegation):
 *  - .movie-card: nghiêng 3D + vệt sáng theo chuột. Chỉ card đang rê mới có transform
 *    → không biến 150+ card thành layer GPU (xem ghi chú ở .movie-card trong globals.css).
 *  - [data-spotlight]: đèn rọi theo chuột trên nền khối.
 *  - [data-parallax]: đặt --px/--py (-1..1) theo vị trí chuột trong khối (Slider dùng).
 *  - Thanh tiến trình cuộn ở mép trên.
 * Máy cảm ứng hoặc bật "giảm chuyển động" → chỉ giữ thanh tiến trình.
 */
export default function HomeFx() {
    const barRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const bar = barRef.current;
        const fancy =
            window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
            !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        let raf = 0;
        let lastEvent: PointerEvent | null = null;
        let tilted: HTMLElement | null = null;
        let lit: HTMLElement | null = null;
        let par: HTMLElement | null = null;
        let flip = 1;

        const resetTilt = () => {
            if (!tilted) return;
            tilted.classList.remove("fx-tilt");
            tilted.style.removeProperty("--rx");
            tilted.style.removeProperty("--ry");
            tilted = null;
        };

        const frame = () => {
            raf = 0;
            /* Thanh tiến trình */
            if (bar) {
                const max = document.documentElement.scrollHeight - window.innerHeight;
                bar.style.transform = `scaleX(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`;
            }
            const e = lastEvent;
            if (!fancy || !e) return;
            const target = e.target as Element | null;

            /* Nghiêng card */
            const card = target?.closest?.<HTMLElement>(".movie-card") ?? null;
            if (card !== tilted) resetTilt();
            if (card) {
                const r = card.getBoundingClientRect();
                const x = (e.clientX - r.left) / r.width;
                const y = (e.clientY - r.top) / r.height;
                /* Khung đã lật ngang (Top 10) thì đảo chiều nghiêng cho đúng hướng chuột */
                /* Khung đã lật ngang (Top 10) thì đảo chiều nghiêng cho đúng hướng chuột — đọc 1 lần khi vào card */
                if (card !== tilted) flip = getComputedStyle(card).scale.startsWith("-1") ? -1 : 1;
                card.style.setProperty("--rx", `${((0.5 - y) * 12).toFixed(2)}deg`);
                card.style.setProperty("--ry", `${((x - 0.5) * 14 * flip).toFixed(2)}deg`);
                card.style.setProperty("--gx", `${(flip < 0 ? 1 - x : x) * 100}%`);
                card.style.setProperty("--gy", `${y * 100}%`);
                card.classList.add("fx-tilt");
                tilted = card;
            }

            /* Đèn rọi */
            const spot = target?.closest?.<HTMLElement>("[data-spotlight]") ?? null;
            if (spot !== lit) { lit?.classList.remove("fx-lit"); lit = spot; spot?.classList.add("fx-lit"); }
            if (spot) {
                const r = spot.getBoundingClientRect();
                spot.style.setProperty("--sx", `${e.clientX - r.left}px`);
                spot.style.setProperty("--sy", `${e.clientY - r.top}px`);
            }

            /* Parallax */
            const p = target?.closest?.<HTMLElement>("[data-parallax]") ?? null;
            if (p !== par && par) { par.style.setProperty("--px", "0"); par.style.setProperty("--py", "0"); }
            par = p;
            if (p) {
                const r = p.getBoundingClientRect();
                p.style.setProperty("--px", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
                p.style.setProperty("--py", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
            }
        };
        const request = () => { if (!raf) raf = requestAnimationFrame(frame); };
        const onMove = (e: PointerEvent) => { if (e.pointerType === "mouse") { lastEvent = e; request(); } };
        const onLeave = () => {
            lastEvent = null;
            resetTilt();
            lit?.classList.remove("fx-lit"); lit = null;
            if (par) { par.style.setProperty("--px", "0"); par.style.setProperty("--py", "0"); par = null; }
        };

        request();
        window.addEventListener("scroll", request, { passive: true });
        window.addEventListener("resize", request);
        if (fancy) {
            document.addEventListener("pointermove", onMove, { passive: true });
            document.documentElement.addEventListener("pointerleave", onLeave);
        }
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("scroll", request);
            window.removeEventListener("resize", request);
            document.removeEventListener("pointermove", onMove);
            document.documentElement.removeEventListener("pointerleave", onLeave);
            onLeave();
        };
    }, []);

    /* Thanh tiến trình cuộn */
    return (
        <div className="fixed inset-x-0 top-0 h-[2px] z-[70] pointer-events-none" aria-hidden>
            <div ref={barRef} className="fx-progress h-full origin-left" style={{ transform: "scaleX(0)" }} />
        </div>
    );
}

/* Nền: vài mảng màu trôi chậm — đặt trong khối "relative isolate" của trang (nằm dưới nội dung).
   Tách khỏi HomeFx vì thanh tiến trình phải ở ngoài khối isolate để không bị thanh thông báo (z-60) che */
export function HomeAmbient() {
    return (
        <div className="fx-ambient absolute inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
            <span style={{ top: "4%",  left: "-12%", width: 820, height: 820, background: "radial-gradient(circle, rgba(34,211,165,0.10), transparent 65%)", animationDuration: "26s" }} />
            <span style={{ top: "22%", right: "-14%", width: 760, height: 760, background: "radial-gradient(circle, rgba(56,189,248,0.08), transparent 65%)", animationDuration: "32s", animationDelay: "-8s" }} />
            <span style={{ top: "48%", left: "-10%", width: 700, height: 700, background: "radial-gradient(circle, rgba(129,140,248,0.07), transparent 65%)", animationDuration: "29s", animationDelay: "-14s" }} />
            <span style={{ top: "72%", right: "-8%", width: 780, height: 780, background: "radial-gradient(circle, rgba(34,211,165,0.08), transparent 65%)", animationDuration: "35s", animationDelay: "-5s" }} />
        </div>
    );
}
