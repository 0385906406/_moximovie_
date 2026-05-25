import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";

import Breadcrumb from "@/components/frontend/Breadcrumb";
import ComicSearch from "@/components/frontend/ComicSearch";
import Pagination from "@/components/frontend/Pagination";
import ComicCard from "@/components/frontend/ComicCard";
import SEO from "@/components/frontend/SEO";

import type { Comic } from "@/types/comic";

import { comicService } from "@/services/comicService";
import DaheeInlineAd from "@/components/frontend/Ad/DaheeInlineAd";
import { ThreeDot } from "react-loading-indicators";

interface PaginationData {
    current_page: number;
    last_page: number;
}

export default function ReadComicPage() {
    const [comics, setComics] = useState<Comic[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const [pagination, setPagination] = useState<PaginationData>({
        current_page: 1,
        last_page: 1,
    });

    // --- đọc URL và fetch phim ---
    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);

                const page = Number(searchParams.get("page") || 1);
                const category = searchParams.get("category") || "";
                const keyword = searchParams.get("keyword") || "";

                let res: any;

                if (category) {
                    res = await comicService.dataDetailCategory(category, page);
                } else if (keyword) {
                    res = await comicService.dataSearch(keyword, page);
                } else {
                    res = await comicService.dataList(page);
                }

                setComics(res.items || []);

                const pagination = res.pagination || {
                    totalItems: 0,
                    totalItemsPerPage: 24,
                    currentPage: 1,
                };

                const { totalItems, totalItemsPerPage, currentPage } = pagination;

                setPagination({
                    current_page: currentPage,
                    last_page: Math.ceil(totalItems / totalItemsPerPage),
                });
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [searchParams]);

    // ------------------------------
    // Scroll to top khi vào trang / slug thay đổi
    // ------------------------------
    useEffect(() => {
        if (typeof window !== "undefined") {
            window.scrollTo({
                top: 0,
                left: 0,
                behavior: "smooth",
            });
        }
    }, [searchParams]);

    // ---------------- RENDER ----------------
    return (
        <div className="w-full mt-20">
            <SEO
                title="Dữ liệu truyện tranh miễn phí mới nhất. Cập nhật nhanh chóng, chất lượng cao hình ảnh sắc nét"
                description="Website cung cấp truyện tranh miễn phí nhanh chất lượng cao. Nguồn truyện tranh chất lượng cao cập nhật nhanh nhất. API truyện tranh, Data truyện tranh miễn phí"
                canonical="https://www.moximovie.click/doc-truyen"
            />

            <Breadcrumb />
            <DaheeInlineAd />
            <ComicSearch />

            <section className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4 px-3 lg:px-5 xl:px-6">
                {loading ? (
                    <div className="col-span-full flex items-center justify-center py-20">
                        <ThreeDot variant="bounce" color="#32cd32" size="medium" text="" textColor="" />
                    </div>
                ) : comics.length === 0 ? (
                    <p className="text-gray-400 col-span-full text-center py-8">Không có truyện</p>
                ) : (
                    comics.map(comic => <ComicCard key={comic._id} comic={comic} />)
                )}
            </section>

            <Pagination
                currentPage={pagination.current_page}
                lastPage={pagination.last_page}
                onChangePage={(page) => {
                    const params = new URLSearchParams(searchParams);
                    params.set("page", String(page));
                    setSearchParams(params);
                }}
            />
        </div>
    );
}