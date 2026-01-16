import Button from "@/components/ui/Button";

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

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
      >
        Prev
      </Button>
      {pages.map((pageNumber) => (
        <button
          key={pageNumber}
          className={`h-8 w-8 rounded-md border text-[13px] transition-colors duration-150 ${
            pageNumber == page
              ? "border-accent bg-accent/15 text-text-primary"
              : "border-border text-text-secondary hover:border-accent/40 hover:text-text-primary"
          } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40`}
          onClick={() => onPageChange(pageNumber)}
        >
          {pageNumber}
        </button>
      ))}
      <Button
        variant="ghost"
        size="sm"
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}
