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
    /* Phòng xem chung: nhận thẻ <video> để đồng bộ; bật syncMode thì không tự tua tới vị trí xem dở đã lưu */
    onVideo?: (video: HTMLVideoElement | null) => void;
    syncMode?: boolean;
    /* Tự mở rèm và phát khi tải xong (trình duyệt cho phép vì người xem đã tương tác với trang) */
    autoStart?: boolean;
}
