import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "../../../styles/projectmanagement/components/Pagination.css";

const Pagination = ({
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  totalItems,
  onPageChange,
}) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
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

  if (totalPages <= 1) return null;

  return (
    <div className="pg-wrap d-flex justify-content-between align-items-center mt-3 pt-3 border-top px-3">
      <div className="pg-info text-muted small">
        Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of{" "}
        {totalItems}
      </div>

      <nav className="pg-nav">
        <ul className="pagination pagination-sm mb-0 pg-pagination">
          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
            <button
              className="page-link d-flex align-items-center justify-content-center pg-nav-btn"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
              type="button"
            >
              <ChevronLeft size={16} />
            </button>
          </li>

          {getPageNumbers().map((page, index) =>
            page === "..." ? (
              <li key={`ellipsis-${index}`} className="page-item disabled">
                <span className="page-link pg-ellipsis">...</span>
              </li>
            ) : (
              <li
                key={page}
                className={`page-item ${currentPage === page ? "active" : ""}`}
              >
                <button
                  className="page-link pg-page-btn"
                  onClick={() => onPageChange(page)}
                  type="button"
                >
                  {page}
                </button>
              </li>
            )
          )}

          <li
            className={`page-item ${
              currentPage === totalPages ? "disabled" : ""
            }`}
          >
            <button
              className="page-link d-flex align-items-center justify-content-center pg-nav-btn"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next page"
              type="button"
            >
              <ChevronRight size={16} />
            </button>
          </li>
        </ul>
      </nav>

      <div className="pg-page-status text-muted small">
        Page {currentPage} of {totalPages}
      </div>
    </div>
  );
};

export default Pagination;
