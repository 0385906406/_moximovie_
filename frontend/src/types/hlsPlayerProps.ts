export interface HlsPlayerProps {
    src: string;          // link .m3u8 gốc (có thể là master)
    poster?: string;
    showLogo?: boolean;
    logoSrc?: string;
}