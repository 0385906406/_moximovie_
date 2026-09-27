/* Loader cho next/image: ảnh remote đi qua /api/img để resize + chuyển WebP.
   Không dùng /_next/image của Vercel vì gói Hobby giới hạn số lượt tối ưu ảnh. */
export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
    if (!/^https?:\/\//.test(src)) return `${src}?w=${width}`;
    return `/api/img?url=${encodeURIComponent(src)}&w=${width}&q=${quality ?? 70}`;
}
