import React from "react";

interface PaginationProps {
    currentPage: number;
    lastPage: number;
    onChangePage: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    lastPage,
    onChangePage,
}) => {
    if (lastPage <= 1) return null;

    const pages: number[] = [];

    // luôn có trang 1
    pages.push(1);

    const start = Math.max(2, currentPage - 2);
    const end = Math.min(lastPage - 1, currentPage + 2);

    for (let i = start; i <= end; i++) {
        pages.push(i);
    }

    // luôn có trang cuối (nếu > 1)
    if (lastPage > 1) {
        pages.push(lastPage);
    }

    return (
        <div className="flex justify-center mt-8 gap-1">
            {/* Prev */}
            <button
                disabled={currentPage <= 1}
                onClick={() => onChangePage(currentPage - 1)}
                aria-label="Trang trước"
                className="px-3 py-1 rounded-[5.28px] border border-emerald-500 text-white hover:bg-emerald-500/10 disabled:opacity-40"
            >
                «
            </button>

            {pages.map((page, index) => {
                const prev = pages[index - 1];

                if (prev && page - prev > 1) {
                    return (
                        <span key={`gap-${page}`} className="px-2 text-gray-400">
                            …
                        </span>
                    );
                }

                const active = page === currentPage;

                return (
                    <button
                        key={page}
                        disabled={active}
                        aria-current={active ? "page" : undefined}
                        onClick={() => onChangePage(page)}
                        className={`px-3 py-1 rounded-[5.28px] border transition
                            ${
                                active
                                    ? "bg-emerald-500 text-black border-emerald-500 cursor-default"
                                    : "border-emerald-500 text-gray-200 hover:bg-emerald-500/10"
                            }`}
                    >
                        {page}
                    </button>
                );
            })}

            {/* Next */}
            <button
                disabled={currentPage >= lastPage}
                onClick={() => onChangePage(currentPage + 1)}
                aria-label="Trang sau"
                className="px-3 py-1 rounded-[5.28px] border border-emerald-500 text-white hover:bg-emerald-500/10 disabled:opacity-40"
            >
                »
            </button>
        </div>
    );
};

export default Pagination;