"use client";

import { useEffect } from "react";

/* Lỗi ở các trang nằm ngoài nhóm (frontend) — vd. trang giới thiệu "/" */
export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => { console.error(error); }, [error]);

    return (
        <main className="min-h-screen flex items-center justify-center px-4 bg-[#191B24] text-white">
            <title>Có lỗi xảy ra | MoxiMovie</title>
            <div className="w-full max-w-md text-center rounded-3xl p-8 bg-[#1f2230] border border-white/[0.07]">
                <div className="text-5xl" aria-hidden>🎞️</div>
                <h1 className="mt-4 text-xl font-bold">Cuộn phim bị kẹt rồi!</h1>
                <p className="mt-2 text-[13.5px] text-white/55">Trang gặp lỗi khi tải, bạn thử lại nhé.</p>
                <div className="mt-6 flex justify-center gap-3">
                    <button type="button" onClick={reset} className="h-11 px-5 rounded-xl text-[14px] font-semibold bg-[#22d3a5] text-[#041a11] hover:brightness-110">Thử lại</button>
                    <a href="/phimhay" className="h-11 px-5 rounded-xl flex items-center text-[14px] text-white/75 bg-white/[0.06] border border-white/10">Về trang chủ</a>
                </div>
            </div>
        </main>
    );
}
