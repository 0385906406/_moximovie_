"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import TrailerModal from "@/components/frontend/MovieDetail/TrailerModal";

/* Nút xem trailer (mở modal YouTube) cho trang phim chiếu rạp */
export default function TrailerButton({ trailer }: { trailer: { key: string; name: string } }) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button type="button" onClick={() => setOpen(true)}
                className="h-12 px-5 rounded-xl flex items-center gap-2 text-[14px] font-semibold text-white bg-white/[0.08] border border-white/15 hover:bg-white/[0.14] transition">
                <Play size={16} className="fill-current" /> Xem trailer
            </button>
            {open && <TrailerModal trailer={trailer} onClose={() => setOpen(false)} />}
        </>
    );
}
