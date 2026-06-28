import React from "react";
import { Play } from "lucide-react";
import type { Episode } from "@/types/episode";

interface MovieActionsRowProps {
    firstEpisode?: Episode | null;
    onPlayFirstEpisode?: () => void;
}

const MovieActionsRow: React.FC<MovieActionsRowProps> = ({
    firstEpisode,
    onPlayFirstEpisode,
}) => {
    return (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6 pr-3 py-2">
            {firstEpisode && onPlayFirstEpisode && (
                <button
                    onClick={onPlayFirstEpisode}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-black font-semibold bg-linear-to-r from-[#fed766] to-[#fff1cc] shadow hover:brightness-110 transition"
                >
                    <Play className="w-5 h-5" />
                    <span>Xem</span>
                </button>
            )}
        </div>
    );
};

export default MovieActionsRow;
