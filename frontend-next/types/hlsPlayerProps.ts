export interface PlayerEpisodeLink {
    label: string;
    onGo: () => void;
}

export interface HlsPlayerProps {
    src: string;
    poster?: string;
    /* Hiện ở thanh trên của trình phát */
    title?: string;
    subtitle?: string;
    /* null = phim bộ nhưng không có tập trước/sau; bỏ trống = phim lẻ */
    prevEpisode?: PlayerEpisodeLink | null;
    nextEpisode?: PlayerEpisodeLink | null;
}
