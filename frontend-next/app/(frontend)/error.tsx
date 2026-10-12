"use client";

import Link from "next/link";
import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

/* Lỗi bất ngờ khi hiển thị một trang: giữ thanh menu, cho thử lại thay vì trắng màn hình */
export default function FrontendError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => { console.error(error); }, [error]);

    return (
        <div className="relative z-10 min-h-[70vh] flex items-center justify-center px-4 pt-28 pb-16">
            <title>Có lỗi xảy ra | MoxiMovie</title>
            <div className="w-full max-w-md text-center rounded-3xl p-8 bg-[#1f2230] border border-white/[0.07]">
                <div className="text-5xl" aria-hidden>🎞️</div>
                <h1 className="mt-4 text-xl font-bold text-white">Cuộn phim bị kẹt rồi!</h1>
                <p className="mt-2 text-[13.5px] text-white/55 leading-relaxed">
                    Trang này gặp lỗi khi tải. Thử lại, hoặc nếu máy chủ phim đang chậm, đổi máy chủ ở nút ⚙ góc dưới.
                </p>
                {error.digest && <p className="mt-2 text-[11px] text-white/25">Mã lỗi: {error.digest}</p>}
                <div className="mt-6 flex justify-center gap-3">
                    <button type="button" onClick={reset}
                        className="h-11 px-5 rounded-xl flex items-center gap-2 text-[14px] font-semibold bg-[#22d3a5] text-[#041a11] hover:brightness-110">
                        <RotateCcw size={16} /> Thử lại
                    </button>
                    <Link href="/phimhay" className="h-11 px-5 rounded-xl flex items-center text-[14px] text-white/75 bg-white/[0.06] border border-white/10 hover:bg-white/10">
                        Về trang chủ
                    </Link>
                </div>
            </div>
        </div>
    );
}
