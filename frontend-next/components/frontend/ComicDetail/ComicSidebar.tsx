import React from "react";
import type { Comic } from "@/types/comic";
import Chip from "./Chip";

interface ComicSidebarProps {
    comic: Comic;
}

/**
 * ComicSidebar: hiển thị poster + thông tin cơ bản + mô tả truyện
 * Layout:
 * - Desktop: poster trái, thông tin + mô tả phải
 * - Tablet/Mobile: poster trên, thông tin + mô tả dưới
 */
const ComicSidebar: React.FC<ComicSidebarProps> = ({ comic }) => {
    return (
        <aside className="rounded-3xl p-4 sm:p-6 lg:p-8 bg-white/5 backdrop-blur-md ring-1 ring-white/10 shadow-2xl">
            {/* Flex layout: mặc định dọc, lg:flex-row ngang */}
            <div className="flex flex-col lg:flex-row gap-4">
                {/* Poster */}
                <div className="flex-shrink-0">
                    <img
                        src={comic.thumb_full}
                        alt={comic.name}
                        className="w-36 sm:w-36 lg:w-40 xl:w-55 rounded-lg shadow-xl object-cover"
                        loading="lazy"
                    />
                </div>

                {/* Info bên phải (desktop) hoặc dưới (mobile) */}
                <div className="flex-1">
                    {/* Tên truyện */}
                    <h2 className="text-2xl text-white font-bold line-clamp-2">{comic.name}</h2>

                    {/* Thông tin cơ bản */}
                    <div className="flex flex-wrap gap-2 mt-3 text-sm text-gray-200">
                        {comic.updatedAt && <Chip>{new Date(comic.updatedAt).getFullYear()}</Chip>}
                        {comic.author?.length > 0 && <Chip>{comic.author.join(", ")}</Chip>}
                        {comic.status && <Chip>{comic.status === "ongoing" ? "Đang ra" : "Hoàn thành"}</Chip>}
                    </div>

                    {/* Thể loại */}
                    <div className="flex flex-wrap gap-2 mt-4">
                        {comic.category?.length
                            ? comic.category.map((c, i) => (
                                <Chip small key={i}>
                                    {c.name}
                                </Chip>
                            ))
                            : <Chip small>Đang cập nhật</Chip>}
                    </div>

                    {/* Mô tả */}
                    {comic.content && (
                        <div className="mt-5 text-gray-200 text-sm leading-relaxed whitespace-pre-line line-clamp-18">
                            <div dangerouslySetInnerHTML={{ __html: comic.content }} />
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default ComicSidebar;