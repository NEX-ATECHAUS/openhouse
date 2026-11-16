"use client";

// The one page control, shown under any list that runs past a page. Previous
// and Next with the running count between them, hidden when everything fits on
// a single page. Shared, so the email logs and the client's contact and job
// lists all page with the same widget rather than lookalikes.

export const PAGE_SIZE = 10;

export function Pager({
  page,
  total,
  onPage,
  pageSize = PAGE_SIZE,
}: {
  page: number;
  total: number;
  onPage: (next: number) => void;
  pageSize?: number;
}) {
  if (total <= pageSize) {
    return null;
  }
  const from = page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, total);
  return (
    <div className="pager">
      <button
        type="button"
        className="button ghost small"
        onClick={() => onPage(page - 1)}
        disabled={page === 0}
      >
        Previous
      </button>
      <span className="pager-count">
        {from} to {to} of {total}
      </span>
      <button
        type="button"
        className="button ghost small"
        onClick={() => onPage(page + 1)}
        disabled={to >= total}
      >
        Next
      </button>
    </div>
  );
}
