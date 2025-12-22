import { useRef, useState, useEffect } from "react";
import styles from "../../../styles/goals/components/Pagination.module.css";

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  loading = false,
  totalItems = 0,
  itemsPerPage = 10,
  onItemsPerPageChange,
  pageSizeOptions = [5, 10, 25, 50],
}) => {
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const sizeDropdownRef = useRef(null);

  const indexOfLastItem = Math.min(currentPage * itemsPerPage, totalItems);
  const indexOfFirstItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;

  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sizeDropdownRef.current &&
        !sizeDropdownRef.current.contains(event.target)
      ) {
        setShowSizeDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

  const pageNumbers = getPageNumbers();

  return (
    <div className={`pagination-container ${styles.container}`}>
      <div className={`pagination-info ${styles.info}`}>
        <span className={`pagination-label ${styles.label}`}>Show</span>
        <div ref={sizeDropdownRef} className={styles.sizeDropdownWrapper}>
          <button
            type="button"
            onClick={() => !loading && setShowSizeDropdown(!showSizeDropdown)}
            disabled={loading}
            className={`${styles.sizeButton} ${loading ? styles.disabled : ""}`}
          >
            <span>{itemsPerPage}</span>
            <i
              className={`bi bi-chevron-${showSizeDropdown ? "up" : "down"} ${styles.chevron}`}
            ></i>
          </button>

          {showSizeDropdown && !loading && (
            <div className={styles.sizeDropdown}>
              {pageSizeOptions.map((size) => (
                <div
                  key={size}
                  onClick={() => {
                    onItemsPerPageChange?.(size);
                    onPageChange(1);
                    setShowSizeDropdown(false);
                  }}
                  className={`${styles.sizeOption} ${
                    itemsPerPage === size ? styles.active : ""
                  }`}
                >
                  {size}
                </div>
              ))}
            </div>
          )}
        </div>
        <span className={`pagination-label ${styles.label}`}>entries</span>
      </div>

      <div className={`pagination-status ${styles.status}`}>
        Showing <strong>{indexOfFirstItem}</strong> to{" "}
        <strong>{indexOfLastItem}</strong> of <strong>{totalItems}</strong> items
        {loading && (
          <span className={`pagination-loading ${styles.loading}`}>
            <span className="spinner-border spinner-border-sm" role="status">
              <span className="visually-hidden">Loading...</span>
            </span>
          </span>
        )}
      </div>

      <nav className={`pagination-nav ${styles.nav}`}>
        <ul className={`pagination ${styles.pagination}`}>
          <li className={`page-item ${!hasPreviousPage ? "disabled" : ""}`}>
            <button
              className={`page-link ${styles.pageLink}`}
              onClick={() => onPageChange(1)}
              disabled={!hasPreviousPage || loading}
              title="First page"
            >
              <i className="bi bi-chevron-double-left"></i>
            </button>
          </li>

          <li className={`page-item ${!hasPreviousPage ? "disabled" : ""}`}>
            <button
              className={`page-link nav-btn ${styles.pageLink} ${styles.navBtn}`}
              onClick={() => onPageChange(currentPage - 1)}
              disabled={!hasPreviousPage || loading}
            >
              <i className="bi bi-chevron-left"></i>
              <span className={`nav-text ${styles.navText}`}>Previous</span>
            </button>
          </li>

          {pageNumbers.map((page, index) => (
            <li
              key={index}
              className={`page-item page-number ${
                page === currentPage ? "active" : ""
              } ${typeof page !== "number" ? "disabled ellipsis" : ""} ${
                styles.pageNumber
              }`}
            >
              <button
                className={`page-link ${styles.pageLink}`}
                onClick={() => typeof page === "number" && onPageChange(page)}
                disabled={typeof page !== "number" || loading}
              >
                {page}
              </button>
            </li>
          ))}

          <li className={`page-item ${!hasNextPage ? "disabled" : ""}`}>
            <button
              className={`page-link nav-btn ${styles.pageLink} ${styles.navBtn}`}
              onClick={() => onPageChange(currentPage + 1)}
              disabled={!hasNextPage || loading}
            >
              <span className={`nav-text ${styles.navText}`}>Next</span>
              <i className="bi bi-chevron-right"></i>
            </button>
          </li>

          <li className={`page-item ${!hasNextPage ? "disabled" : ""}`}>
            <button
              className={`page-link ${styles.pageLink}`}
              onClick={() => onPageChange(totalPages)}
              disabled={!hasNextPage || loading}
              title="Last page"
            >
              <i className="bi bi-chevron-double-right"></i>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Pagination;
