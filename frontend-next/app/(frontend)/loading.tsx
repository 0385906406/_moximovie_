/* Màn chờ khi chuyển trang (trang render trên server đang tải dữ liệu phim).
   Chỉ CSS, giữ thanh menu ở trên; khung giả có cùng bố cục với lưới phim để trang không bị nhảy khi tải xong. */
export default function Loading() {
    return (
        <div className="relative z-10 max-w-[1400px] mx-auto px-4 pt-28 pb-16" aria-busy="true" aria-label="Đang tải">
            <div className="h-7 w-56 rounded-lg bg-white/[0.06] animate-pulse" />
            <div className="mt-2 h-4 w-80 max-w-full rounded bg-white/[0.04] animate-pulse" />
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-2">
                        <div className="w-full aspect-[2/3] rounded-xl bg-white/[0.05] animate-pulse" style={{ animationDelay: `${(i % 6) * 80}ms` }} />
                        <div className="h-3 w-4/5 rounded bg-white/[0.05] animate-pulse" />
                        <div className="h-2.5 w-3/5 rounded bg-white/[0.04] animate-pulse" />
                    </div>
                ))}
            </div>
        </div>
    );
}
