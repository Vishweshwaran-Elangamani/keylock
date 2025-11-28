const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  loading = false,
  totalItems = 0,
  itemsPerPage = 12,
  onItemsPerPageChange,
  pageSizeOptions = [5, 10, 25, 50],
}) => {
  // Calculate indices for display
  const indexOfLastItem = Math.min(currentPage * itemsPerPage, totalItems);
  const indexOfFirstItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalItems === 0) return null;

  return (
    <div className="pagination-container">
      {/* Items per page selector */}
      <div className="pagination-info">
        <span className="pagination-label">Show</span>
        <select
          className="pagination-select"
          value={itemsPerPage}
          onChange={(e) => {
            onItemsPerPageChange(Number(e.target.value));
            onPageChange(1); // Reset to first page when changing page size
          }}
          disabled={loading}
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <span className="pagination-label">entries</span>
      </div>

      {/* Status text */}
      <div className="pagination-status">
        Showing {indexOfFirstItem} to {indexOfLastItem} of {totalItems} entries
        {loading && (
          <span className="pagination-loading">
            <span className="spinner-border spinner-border-sm" role="status">
              <span className="visually-hidden">Loading...</span>
            </span>
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="pagination-nav">
        <ul className="pagination">
          {/* Previous Button */}
          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
            >
              <i className="bi bi-chevron-left"></i>
            </button>
          </li>

          {/* Page Numbers */}
          {getPageNumbers().map((page, index) => (
            <li
              key={index}
              className={`page-item ${page === currentPage ? "active" : ""} ${
                typeof page !== "number" ? "disabled ellipsis" : ""
              }`}
            >
              <button
                className="page-link"
                onClick={() => typeof page === "number" && onPageChange(page)}
                disabled={typeof page !== "number" || loading}
              >
                {page}
              </button>
            </li>
          ))}

          {/* Next Button */}
          <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          </li>
        </ul>
      </nav>

      <style>{`
        .pagination-container {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          gap: 1rem;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .pagination-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .pagination-label {
          font-size: 0.9rem;
          color: #6c757d;
          font-weight: 500;
        }

        .pagination-select {
          padding: 0.4rem 2rem 0.4rem 0.75rem;
          font-size: 0.9rem;
          font-weight: 500;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          background-color: #fff;
          color: #27235c;
          cursor: pointer;
          outline: none;
          transition: all 0.2s ease;
          appearance: none;
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 0.5rem center;
          background-size: 12px;
        }

        .pagination-select:hover {
          border-color: #27235c;
        }

        .pagination-select:focus {
          border-color: #27235c;
          box-shadow: 0 0 0 3px rgba(39, 35, 92, 0.15);
        }

        .pagination-select:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .pagination-status {
          font-size: 0.9rem;
          color: #6c757d;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .pagination-loading {
          display: inline-flex;
          align-items: center;
        }

        .pagination-loading .spinner-border {
          width: 14px;
          height: 14px;
          border-width: 2px;
          color: #27235c;
        }

        .pagination-nav {
          display: flex;
        }

        .pagination {
          display: flex;
          list-style: none;
          padding: 0;
          margin: 0;
          gap: 0.25rem;
        }

        .page-item {
          list-style: none;
        }

        .page-link {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 38px;
          height: 38px;
          padding: 0.4rem 0.75rem;
          font-size: 0.9rem;
          font-weight: 500;
          color: #27235c;
          background-color: #fff;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .page-link:hover:not(:disabled) {
          background-color: rgba(39, 35, 92, 0.08);
          border-color: #27235c;
          color: #27235c;
        }

        .page-item.active .page-link {
          background-color: #27235c;
          border-color: #27235c;
          color: #fff;
        }

        .page-item.active .page-link:hover {
          background-color: #1e1a47;
        }

        .page-item.disabled .page-link {
          opacity: 0.5;
          cursor: not-allowed;
          pointer-events: none;
        }

        .page-item.ellipsis .page-link {
          border: none;
          background: transparent;
          cursor: default;
          min-width: 30px;
        }

        .page-item.ellipsis .page-link:hover {
          background: transparent;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .pagination-container {
            flex-direction: column;
            gap: 1rem;
            padding: 1rem;
          }

          .pagination-info,
          .pagination-status,
          .pagination-nav {
            width: 100%;
            justify-content: center;
          }

          .pagination-status {
            text-align: center;
          }
        }

        @media (max-width: 480px) {
          .page-link {
            min-width: 34px;
            height: 34px;
            padding: 0.3rem 0.5rem;
            font-size: 0.85rem;
          }

          .pagination-select {
            padding: 0.35rem 1.75rem 0.35rem 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Pagination;