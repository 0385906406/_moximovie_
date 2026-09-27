import { DetailSkeleton } from "./PhimDetailClient";

/* Hiện ngay khi bấm vào phim, trong lúc server tải dữ liệu */
export default function Loading() {
    return (
        <div className="relative min-h-screen">
            <DetailSkeleton fading={false} />
        </div>
    );
}
