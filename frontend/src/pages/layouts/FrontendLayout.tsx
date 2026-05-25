// layouts/FrontendLayout.tsx
import { Outlet } from "react-router";

import Footer from "@/components/frontend/Footer";
import Navbar from "@/components/frontend/Navbar";
import ReadStoryButton from "@/components/frontend/ReadStoryButton";
import ScrollToTopButton from "@/components/frontend/ScrollToTopButton";

export default function FrontendLayout() {
    return (
        <div className="flex flex-col min-h-screen bg-[#191B24]">
            <ReadStoryButton />
            <ScrollToTopButton />
            <Navbar />
            <div className="flex-1">
                <Outlet />
            </div>
            <Footer />
        </div>
    );
}