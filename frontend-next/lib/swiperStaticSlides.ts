import { Swiper } from "swiper";
import type { SwiperModule } from "swiper/types";

/*
 * Với slidesPerView: "auto", Swiper gọi swiper.update() MỖI KHI 1 ảnh trong slider tải xong
 * (đo lại kích thước mọi slide → ép trình duyệt tính lại layout cả trang). Trang chủ có hàng trăm ảnh
 * nên việc này lặp lại hàng trăm lần trong lúc cuộn → giật.
 *
 * Các slider phim dùng ảnh `fill` (position: absolute trong khung aspect-ratio cố định) nên ảnh tải xong
 * KHÔNG làm đổi kích thước slide → bỏ listener này là an toàn. Đổi kích thước thật (resize) vẫn do
 * ResizeObserver của Swiper xử lý.
 */
const StaticSlides: SwiperModule = ({ swiper, on }) => {
    on("init", () => {
        const imgs = Array.from(swiper.el.querySelectorAll("img"));
        if (!imgs.every(img => getComputedStyle(img).position === "absolute")) return;
        const onLoad = (swiper as unknown as { onLoad?: EventListener }).onLoad;
        if (onLoad) swiper.el.removeEventListener("load", onLoad, { capture: true });
    });
};

Swiper.use([StaticSlides]);
