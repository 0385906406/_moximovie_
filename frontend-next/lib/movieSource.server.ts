/* Chỉ dùng ở server (next/headers) */
import { cookies } from "next/headers";
import { DEFAULT_SOURCE, parseSource, SOURCE_COOKIE, type MovieSource } from "./movieSource";

/* Nguồn phim của request hiện tại: theo cookie người xem đã chọn, chưa chọn → máy chủ trong nước.
   Gọi hàm này làm trang render theo từng request (dữ liệu API vẫn được cache qua fetch revalidate). */
export async function getServerSource(): Promise<MovieSource> {
    return parseSource((await cookies()).get(SOURCE_COOKIE)?.value) ?? DEFAULT_SOURCE;
}
