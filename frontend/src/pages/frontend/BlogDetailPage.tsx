import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";

import Breadcrumb from "@/components/frontend/Breadcrumb";
import SEO from "@/components/frontend/SEO";
import { blogList } from "@/data/blog";

export default function BlogDetailPage() {
    const { slug } = useParams<{ slug: string }>();
    const blog = blogList.find(item => item.slug === slug);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [slug]);

    if (!blog) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-white px-4">
                <h1 className="text-xl sm:text-2xl font-bold mb-2">
                    Bài viết không tồn tại
                </h1>
                <Link
                    to="/bai-viet"
                    className="text-sky-400 hover:underline"
                >
                    ← Quay lại danh sách bài viết
                </Link>
            </div>
        );
    }

    return (
        <>
            <SEO
                title={`${blog.title} | MoxiMovie`}
                description={blog.description}
                canonical={`https://www.moximovie.click/bai-viet/${blog.slug}`}
            />

            <Breadcrumb />

            <article className="w-full mx-auto px-3 sm:px-4 lg:px-6 xl:px-0 max-w-4xl text-white">

                {/* Title */}
                <h1 className="
                    text-2xl
                    sm:text-3xl
                    lg:text-4xl
                    font-bold
                    leading-snug
                    tracking-tight
                ">
                    {blog.title}
                </h1>

                {/* Meta */}
                <div className="
                    flex
                    flex-wrap
                    items-center
                    gap-3
                    text-xs
                    sm:text-sm
                    text-gray-400
                    mt-3
                ">
                    {blog.createdAt && (
                        <span>
                            📅 {new Date(blog.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                    )}
                    <span>📝 MoxiMovie</span>
                </div>

                {/* Thumbnail */}
                <div className="
                    mt-6
                    rounded-xl
                    overflow-hidden
                    border
                    border-white/10
                ">
                    <img
                        src={blog.thumbnail}
                        alt={blog.title}
                        className="
                            w-full
                            max-h-[420px]
                            object-cover
                        "
                        loading="lazy"
                    />
                </div>

                {/* Content */}
                <div
                    className="
                        prose
                        prose-invert
                        max-w-none
                        mt-8
                        text-gray-200
                        prose-p:leading-relaxed
                        prose-p:mb-4
                        prose-h2:text-white
                        prose-h2:mt-8
                        prose-h2:mb-3
                        prose-h2:border-l-4
                        prose-h2:border-sky-400
                        prose-h2:pl-3
                        prose-img:rounded-lg
                        prose-img:border
                        prose-img:border-white/10
                    "
                    dangerouslySetInnerHTML={{ __html: blog.content }}
                />

                {/* Footer */}
                <div className="
                    mt-12
                    pt-6
                    border-t
                    border-white/10
                    flex
                    justify-between
                    items-center
                ">
                    <Link
                        to="/bai-viet"
                        className="
                            inline-flex
                            items-center
                            gap-2
                            text-sky-400
                            hover:underline
                        "
                    >
                        ← Quay lại danh sách bài viết
                    </Link>

                    <span className="text-xs text-gray-500">
                        © MoxiMovie
                    </span>
                </div>

            </article>
        </>
    );
}