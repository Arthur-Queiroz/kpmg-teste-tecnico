const PAGE_SIZE_OPTIONS = [5, 10, 25] as const;

/** Acima disso a lista de páginas passa a usar reticências. */
const MAX_PAGE_BUTTONS = 7;

export interface PaginationProps {
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function Pagination({
  page,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const isFirstPage = page <= 1;
  const isLastPage = page >= totalPages;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border bg-bg-subtle px-5 py-3.5">
      <label className="flex items-center gap-2 text-small text-text-muted">
        <span className="whitespace-nowrap">Itens por página</span>
        <select
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          className="h-9 cursor-pointer rounded-input border border-border bg-white px-2 text-small outline-none focus:border-accent focus:ring-3 focus:ring-accent/15"
        >
          {PAGE_SIZE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-center gap-4">
        <span className="text-small whitespace-nowrap text-text-muted">
          Página {page} de {totalPages}
        </span>

        <nav aria-label="Paginação" className="flex items-center gap-1.5">
          <ArrowButton
            direction="previous"
            disabled={isFirstPage}
            onClick={() => onPageChange(page - 1)}
          />

          {buildPageItems(page, totalPages).map((item, index) =>
            item === "ellipsis" ? (
              <span
                key={`ellipsis-${index}`}
                aria-hidden="true"
                className="px-1 text-small text-text-muted"
              >
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                aria-label={`Página ${item}`}
                aria-current={item === page ? "page" : undefined}
                className={`h-9 min-w-9 cursor-pointer rounded-input border px-2.5 text-small font-semibold tabular-nums transition-colors ${
                  item === page
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-white text-primary hover:border-primary"
                }`}
              >
                {item}
              </button>
            ),
          )}

          <ArrowButton
            direction="next"
            disabled={isLastPage}
            onClick={() => onPageChange(page + 1)}
          />
        </nav>
      </div>
    </div>
  );
}

interface ArrowButtonProps {
  direction: "previous" | "next";
  disabled: boolean;
  onClick: () => void;
}

function ArrowButton({ direction, disabled, onClick }: ArrowButtonProps) {
  const isPrevious = direction === "previous";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={isPrevious ? "Página anterior" : "Próxima página"}
      className="flex size-9 cursor-pointer items-center justify-center rounded-input border border-border bg-white text-primary transition-colors hover:border-primary disabled:cursor-not-allowed disabled:text-[#C3CBD8] disabled:hover:border-border"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={isPrevious ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
      </svg>
    </button>
  );
}

/**
 * Primeira e última página sempre visíveis, com uma janela ao redor da atual e
 * reticências nos vãos: `< 1 … 4 5 6 … 12 >`.
 */
function buildPageItems(
  page: number,
  totalPages: number,
): Array<number | "ellipsis"> {
  if (totalPages <= MAX_PAGE_BUTTONS) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const windowStart = Math.max(2, Math.min(page - 1, totalPages - 4));
  const windowEnd = Math.min(totalPages - 1, Math.max(page + 1, 5));

  const items: Array<number | "ellipsis"> = [1];

  if (windowStart > 2) {
    items.push("ellipsis");
  }

  for (let pageNumber = windowStart; pageNumber <= windowEnd; pageNumber += 1) {
    items.push(pageNumber);
  }

  if (windowEnd < totalPages - 1) {
    items.push("ellipsis");
  }

  items.push(totalPages);

  return items;
}
