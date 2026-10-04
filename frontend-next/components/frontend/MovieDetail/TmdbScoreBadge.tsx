import React from "react";
import { Star } from "lucide-react";

interface TmdbScoreBadgeProps {
    voteAverage: number;
    voteCount: number;
}

/* Điểm TMDB dạng thẻ nhỏ, để đặt cạnh nút hành động. Không có điểm thì không hiện */
const TmdbScoreBadge: React.FC<TmdbScoreBadgeProps> = ({ voteAverage, voteCount }) => {
    if (!(voteAverage > 0 && voteCount > 0)) return null;
    return (
        <div
            className="inline-flex items-center gap-2.5 rounded-full pl-2.5 pr-4 py-1.5"
            style={{
                background: "linear-gradient(135deg, rgba(34,211,165,0.18), rgba(34,211,165,0.04))",
                border: "1px solid rgba(34,211,165,0.4)",
                boxShadow: "0 0 20px rgba(34,211,165,0.12)",
            }}
        >
            <span
                className="flex items-center justify-center w-8 h-8 rounded-full"
                style={{ background: "rgba(34,211,165,0.18)", color: "#22d3a5" }}
            >
                <Star className="w-4 h-4" fill="currentColor" />
            </span>
            <div className="flex items-baseline gap-1">
                <span className="text-[20px] font-extrabold leading-none tabular-nums" style={{ color: "#22d3a5" }}>
                    {voteAverage.toFixed(1)}
                </span>
                <span className="text-[12px] font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>/10</span>
            </div>
            <div className="text-left leading-tight">
                <p className="text-[12.5px] font-semibold text-white">Điểm TMDB</p>
                <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.55)" }}>
                    {voteCount.toLocaleString("vi-VN")} lượt đánh giá
                </p>
            </div>
        </div>
    );
};

export default TmdbScoreBadge;
