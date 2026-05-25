import { memo } from "react";
import { Link } from "react-router";
import type { Movie } from "@/types/movie";

type MovieCardProps = {
    movie: Movie;
};

function MovieCard({ movie }: MovieCardProps) {
    const poster = movie.poster_url ? `https://phimimg.com/${movie.poster_url}` : "";

    return (
        <Link
            to={`/phim/${movie.slug}`}
            key={movie._id}
            className="group rounded-[5.28px] overflow-hidden transition hover:scale-[1.02]"
        >
            <div className="aspect-[2/3] w-full bg-white/5 relative">
                {poster ? (
                    <img
                        src={poster}
                        alt={movie.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        width={400}
                        height={600}
                    />
                ) : (
                    <div className="w-full h-full grid place-items-center text-xs text-gray-500">No image</div>
                )}

                {/* Overlay hover */}
                <div
                    className="
            absolute inset-0
            flex items-center justify-center
            bg-black/60
            opacity-0
            group-hover:opacity-100
            transition-opacity duration-200
        "
                >
                    <div
                        className="
                flex items-center gap-2
                px-4 py-2
                bg-emerald-500 text-black
                rounded-[5.28px]
                text-sm font-semibold
            "
                    >
                        Xem phim
                    </div>
                </div>

                {/* gradient đáy */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent" />

                {/* năm */}
                <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 z-10
                    px-3 py-1 text-xs text-white bg-gray-700 backdrop-blur
                    ring-1 ring-white/10"
                >
                    {movie.year ?? "2025"}
                </div>
            </div>

            <div className="p-3">
                <div className="text-sm text-white text-center line-clamp-2" dangerouslySetInnerHTML={{ __html: movie.name }}></div>
                <div className="text-sm text-white text-center line-clamp-2" dangerouslySetInnerHTML={{ __html: movie.origin_name ?? "null" }}></div>
            </div>
        </Link>
    );
}

export default memo(MovieCard);