import { cn } from "@/lib/utils/cn";

export default function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const getVisiblePages = () => {
    const pages: (number | "ellipsis")[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    pages.push(1);

    if (page > 3) {
      pages.push("ellipsis");
    }

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    for (let i = start; i <= end; i++) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }

    if (page < totalPages - 2) {
      pages.push("ellipsis");
    }

    if (!pages.includes(totalPages)) {
      pages.push(totalPages);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="flex items-center gap-1">
      <button
        className={cn(
          "flex h-7 items-center justify-center rounded px-2 text-[12px] font-medium transition-colors duration-150",
          page === 1
            ? "cursor-not-allowed text-text-muted"
            : "text-text-secondary hover:bg-white/[0.04] hover:text-text-primary"
        )}
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
      >
        <svg
          className="mr-1 h-3 w-3"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M7.5 9L4.5 6L7.5 3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Prev
      </button>

      <div className="flex items-center gap-0.5">
        {visiblePages.map((pageNum, index) =>
          pageNum === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="flex h-7 w-7 items-center justify-center text-[12px] text-text-muted"
            >
              ...
            </span>
          ) : (
            <button
              key={pageNum}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded text-[12px] font-medium transition-colors duration-150",
                pageNum === page
                  ? "bg-white/[0.08] text-text-primary"
                  : "text-text-secondary hover:bg-white/[0.04] hover:text-text-primary"
              )}
              onClick={() => onPageChange(pageNum)}
              aria-label={`Page ${pageNum}`}
              aria-current={pageNum === page ? "page" : undefined}
            >
              {pageNum}
            </button>
          )
        )}
      </div>

      <button
        className={cn(
          "flex h-7 items-center justify-center rounded px-2 text-[12px] font-medium transition-colors duration-150",
          page === totalPages
            ? "cursor-not-allowed text-text-muted"
            : "text-text-secondary hover:bg-white/[0.04] hover:text-text-primary"
        )}
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
      >
        Next
        <svg
          className="ml-1 h-3 w-3"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M4.5 3L7.5 6L4.5 9"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
