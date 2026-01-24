import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CustomDropdown from "./CustomDropdown";
import "../../../styles/projectmanagement/components/PaginationFooter.css";

const PaginationFooter = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions = [5, 10, 25, 50],
  showPageSizeDropdown = true,
  showStatusText = true,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const startIndex =
    totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  /* 🔒 ALWAYS COMPACT – ONLY 2 PAGE BOXES */
  const pageNumbers = useMemo(() => {
    if (totalPages === 1) return [1];

    if (currentPage === totalPages) {
      return [totalPages - 1, totalPages];
    }

    return [currentPage, currentPage + 1];
  }, [currentPage, totalPages]);

  const goToPage = (page) => {
    if (typeof page !== "number") return;
    const safePage = Math.max(1, Math.min(page, totalPages));
    onPageChange(safePage);
  };

  return (
    <div className="pf-pagination">
      {/* LEFT */}
      <div className="pf-pagination-info">
        {showPageSizeDropdown && (
          <>
            <span>Show</span>

            <div className="pf-rows-dropdown">
              <CustomDropdown
                name="itemsPerPage"
                value={itemsPerPage}
                options={pageSizeOptions.map((p) => ({
                  value: p,
                  label: p,
                }))}
                onChange={(_n, v) => {
                  onItemsPerPageChange(Number(v));
                  onPageChange(1);
                }}
                className="pf-rows-dd"
              />
            </div>

            <span>entries</span>
          </>
        )}
      </div>

      {/* CENTER */}
      {showStatusText && (
        <div className="pf-pagination-status">
          Showing {totalItems === 0 ? 0 : startIndex + 1} to {endIndex} of{" "}
          {totalItems} entries
        </div>
      )}

      {/* RIGHT */}
      {totalPages > 1 && (
        <nav className="pf-pagination-nav">
          <ul className="pf-pagination-list">
            <li className={`pf-page-item ${currentPage === 1 ? "disabled" : ""}`}>
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={14} />
              </button>
            </li>

            {pageNumbers.map((page) => (
              <li
                key={page}
                className={`pf-page-item ${
                  page === currentPage ? "active" : ""
                }`}
              >
                <button onClick={() => goToPage(page)}>{page}</button>
              </li>
            ))}

            <li
              className={`pf-page-item ${
                currentPage === totalPages ? "disabled" : ""
              }`}
            >
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={14} />
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
};

export default PaginationFooter;
