import React from "react";
import { X } from "lucide-react";
// import VideoPlayer from "@/components/frontend/MovieDetail/VideoPlayer";
import type { Episode } from "@/types/episode";
import Breadcrumb from "../Breadcrumb";
import HlsPlayerWithFilter from "./HlsPlayerWithFilter";

interface MovieHeroProps {
    movieName?: string;
    thumbUrl?: string;
    isPlayerOpen: boolean;
    currentEpisode: Episode | null;
    onClosePlayer: () => void;
}

/**
 * MovieHero: xử lý phần nền phía trên:
 * - Nếu đang mở player -> hiển thị VideoPlayer
 * - Nếu không -> hiển thị backdrop + overlay + hiệu ứng
 */
const MovieHero: React.FC<MovieHeroProps> = ({
    movieName,
    thumbUrl,
    isPlayerOpen,
    currentEpisode,
    onClosePlayer,
}) => {
    return (
        <div className="relative w-full h-60 sm:h-[430px] lg:h-[590px] xl:h-[792px] overflow-hidden text-white select-none bg-[#282b3a] z-20">
            {/* Breadcrumb sẽ để ở ngoài, component cha tự render */}
            <div className="hidden sm:flex lg:flex xl:flex">
                <Breadcrumb />
            </div>

            {isPlayerOpen && currentEpisode ? (
                // Khi player mở: full layer ở giữa
                <div className="absolute inset-0 flex justify-center sm:mt-18 lg:mt-18 xl:18 h-[220px] sm:h-[430px] md:h-[360px] lg:h-[520px] xl:h-[720px] z-50">
                    <div
                        className="
                            relative w-full max-w-[1640px]
                            bg-black shadow-2xl ring-1 ring-white/10
                            rounded-xl
                            h-[220px]
                            sm:h-[260px]
                            md:h-[360px]
                            lg:h-[520px]
                            xl:h-[720px]
                            lg:max-w-[1640px]
                            xl:max-w-none
                        "
                    >
                        {/* <VideoPlayer src={currentEpisode.link_embed || ""} /> */}
                        <HlsPlayerWithFilter src={currentEpisode.link_m3u8 || ""} />

                        <button
                            onClick={onClosePlayer}
                            className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white p-2 z-50 rounded-md"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Ảnh nền phim */}
                    <img
                        src={thumbUrl}
                        alt={movieName}
                        className="
                            absolute inset-0 w-full h-full 
                            object-cover object-center
                            opacity-0
                            transition-opacity duration-700
                            cursor-pointer
                        "
                        loading="lazy"
                        onLoad={(e) => {
                            e.currentTarget.style.opacity = "1";
                        }}
                    />

                    {/* Overlay tối + radial light */}
                    <div className="pointer-events-none absolute inset-0">
                        <div className="absolute inset-0 bg-black/35" />

                        <div
                            className="
                                absolute inset-0
                                bg-[radial-gradient(circle_at_center,transparent_70%,rgba(0,0,0,0.9)_100%)]
                            "
                        />
                    </div>

                    {/* Gradient đáy */}
                    <div
                        className="
                            pointer-events-none absolute inset-x-0 bottom-0 h-1/8
                            bg-linear-to-b from-transparent via-[#191B24]/97 to-[#191B24]
                        "
                    />

                    {/* Pattern chấm */}
                    <div
                        className="
                            pointer-events-none absolute inset-0 opacity-[0.18]
                            bg-[radial-gradient(circle,rgba(255,255,255,0.16)_1px,transparent_0)] z-30
                        "
                    />
                </>
            )}
        </div>
    );
};

export default MovieHero;