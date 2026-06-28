import Footer from "@/components/frontend/Footer";
import Navbar from "@/components/frontend/Navbar";
import AnnouncementBar from "@/components/frontend/AnnouncementBar";
import ReadStoryButton from "@/components/frontend/ReadStoryButton";
import ScrollToTopButton from "@/components/frontend/ScrollToTopButton";

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col min-h-screen bg-[#191B24]">
            <AnnouncementBar />
            <ReadStoryButton />
            <ScrollToTopButton />
            <Navbar />
            <div className="flex-1">
                {children}
            </div>
            <Footer />
        </div>
    );
}
