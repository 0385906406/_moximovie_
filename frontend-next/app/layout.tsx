import type { Metadata } from "next";
import { Be_Vietnam_Pro, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const beVietnamPro = Be_Vietnam_Pro({
    subsets: ["latin", "vietnamese"],
    weight: ["400", "500", "600", "700", "800"],
    variable: "--font-be-vietnam-pro",
    display: "swap",
});

const spaceGrotesk = Space_Grotesk({
    subsets: ["latin"],
    weight: ["500", "700"],
    variable: "--font-space-grotesk",
    display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    weight: ["500"],
    variable: "--font-jetbrains-mono",
    display: "swap",
});

/* title/description KHÔNG đặt ở đây: mỗi trang tự render qua components/frontend/SEO.tsx
   (React 19 đưa lên <head>). Đặt cả 2 nơi sẽ ra 2 thẻ <title>/description trùng nhau. */
export const metadata: Metadata = {
    metadataBase: new URL("https://www.moximovie.click"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="vi" className={`${beVietnamPro.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
            <body>
                <Toaster richColors />
                {children}
            </body>
        </html>
    );
}
