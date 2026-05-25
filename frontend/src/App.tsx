import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import { Toaster } from "sonner";

// Pages - Frontend (lazy loaded for code-splitting)
const HomeIntro            = lazy(() => import("./pages/frontend/HomeIntro"));
const HomePage             = lazy(() => import("./pages/frontend/HomePage"));
const PhimLePage           = lazy(() => import("./pages/frontend/PhimLePage"));
const PhimBoPage           = lazy(() => import("./pages/frontend/PhimBoPage"));
const PhimHoatHinhPage     = lazy(() => import("./pages/frontend/PhimHoatHinhPage"));
const LocPhimPage          = lazy(() => import("./pages/frontend/LocPhimPage"));
const BlogPage             = lazy(() => import("./pages/frontend/BlogPage"));
const BlogDetailPage       = lazy(() => import("./pages/frontend/BlogDetailPage"));
const AboutPage            = lazy(() => import("./pages/frontend/AboutPage"));
const ContactPage          = lazy(() => import("./pages/frontend/ContactPage"));
const PhimDetailClient     = lazy(() => import("./pages/frontend/PhimDetailPage"));
const XemPhimClient        = lazy(() => import("./pages/frontend/XemPhimClient"));
const CommingMovieDetailPage = lazy(() => import("./pages/frontend/Commingmoviedetailpage"));
const ReadComicPage        = lazy(() => import("./pages/frontend/ReadComicPage"));
const TruyenDetailPage     = lazy(() => import("./pages/frontend/TruyenDetailPage"));
const SearchPage           = lazy(() => import("./pages/frontend/SearchPage"));
const NotFoundPage         = lazy(() => import("./pages/frontend/NotFoundPage"));

import FrontendLayout from "./pages/layouts/FrontendLayout";

function PageLoader() {
    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0a0a0f" }}>
            <div style={{ width: 32, height: 32, border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "#10b981", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
    );
}

function App() {
    return (
        <>
            <Toaster richColors />
            <BrowserRouter>
                <Suspense fallback={<PageLoader />}>
                    <Routes>
                        <Route path="/" element={<HomeIntro />} />
                        <Route element={<FrontendLayout />}>
                            <Route path="/phimhay"          element={<HomePage />} />
                            <Route path="/phim"             element={<PhimLePage />} />
                            <Route path="/phim-le"          element={<PhimLePage />} />
                            <Route path="/phim-bo"          element={<PhimBoPage />} />
                            <Route path="/hoat-hinh"        element={<PhimHoatHinhPage />} />
                            <Route path="/loc-phim"         element={<LocPhimPage />} />
                            <Route path="/phim/:slug"       element={<PhimDetailClient />} />
                            <Route path="/xem-phim/:slug"   element={<XemPhimClient />} />
                            <Route path="/phim-rap/:id"     element={<CommingMovieDetailPage />} />
                            <Route path="/tim-kiem"         element={<SearchPage />} />
                            <Route path="/doc-truyen"       element={<ReadComicPage />} />
                            <Route path="/doc-truyen/:slug" element={<TruyenDetailPage />} />
                            <Route path="/bai-viet"         element={<BlogPage />} />
                            <Route path="/bai-viet/:slug"   element={<BlogDetailPage />} />
                            <Route path="/gioi-thieu"       element={<AboutPage />} />
                            <Route path="/lien-he-quang-cao" element={<ContactPage />} />
                        </Route>
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </Suspense>
            </BrowserRouter>
        </>
    );
}

export default App;
