import { useRef, useState, useEffect } from "react";

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

  // Calculate indices for display
  const indexOfLastItem = Math.min(currentPage * itemsPerPage, totalItems);
  const indexOfFirstItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;

  // Derived navigation states
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  // Close dropdown when clicking outside
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

  const pageNumbers = getPageNumbers();

  return (
    <div className="pagination-container">
      {/* Items per page selector */}
      <div className="pagination-info">
        <span className="pagination-label">Show</span>
        
        {/* CUSTOM DROPDOWN */}
        <div ref={sizeDropdownRef} style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => !loading && setShowSizeDropdown(!showSizeDropdown)}
            disabled={loading}
            style={{
              padding: "0.4rem 0.75rem",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              fontSize: "0.875rem",
              cursor: loading ? "not-allowed" : "pointer",
              background: "#fff",
              color: "rgb(39, 35, 92)",
              minWidth: "70px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontWeight: "600",
              transition: "all 0.2s",
              opacity: loading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = "rgb(39, 35, 92)";
                e.currentTarget.style.color = "white";
                e.currentTarget.style.borderColor = "rgb(39, 35, 92)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.color = "rgb(39, 35, 92)";
                e.currentTarget.style.borderColor = "#e5e7eb";
              }
            }}
          >
            <span>{itemsPerPage}</span>
            <i
              className={`bi bi-chevron-${showSizeDropdown ? "up" : "down"}`}
              style={{ fontSize: "0.7rem", marginLeft: "0.5rem" }}
            ></i>
          </button>

          {showSizeDropdown && !loading && (
            <div
              style={{
                position: "absolute",
                bottom: "calc(100% + 4px)",
                left: 0,
                minWidth: "70px",
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                zIndex: 1000,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                overflow: "hidden",
              }}
            >
              {pageSizeOptions.map((size) => (
                <div
                  key={size}
                  onClick={() => {
                    onItemsPerPageChange?.(size);
                    onPageChange(1);
                    setShowSizeDropdown(false);
                  }}
                  style={{
                    padding: "0.5rem 0.75rem",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    color: "#212529",
                    textAlign: "center",
                    transition: "all 0.2s",
                    background: itemsPerPage === size ? "#f3f4f6" : "#fff",
                    fontWeight: itemsPerPage === size ? "600" : "500",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgb(39, 35, 92)";
                    e.currentTarget.style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      itemsPerPage === size ? "#f3f4f6" : "#fff";
                    e.currentTarget.style.color = "#212529";
                  }}
                >
                  {size}
                </div>
              ))}
            </div>
          )}
        </div>

        <span className="pagination-label">entries</span>
      </div>

      {/* Status text */}
      <div className="pagination-status">
        Showing <strong>{indexOfFirstItem}</strong> to{" "}
        <strong>{indexOfLastItem}</strong> of <strong>{totalItems}</strong> items
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
          {/* First Page */}
          <li className={`page-item ${!hasPreviousPage ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => onPageChange(1)}
              disabled={!hasPreviousPage || loading}
              title="First page"
            >
              <i className="bi bi-chevron-double-left"></i>
            </button>
          </li>

          {/* Previous Page */}
          <li className={`page-item ${!hasPreviousPage ? "disabled" : ""}`}>
            <button
              className="page-link nav-btn"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={!hasPreviousPage || loading}
            >
              <i className="bi bi-chevron-left"></i>
              <span className="nav-text">Previous</span>
            </button>
          </li>

          {/* Page Numbers */}
          {pageNumbers.map((page, index) => (
            <li
              key={index}
              className={`page-item page-number ${
                page === currentPage ? "active" : ""
              } ${typeof page !== "number" ? "disabled ellipsis" : ""}`}
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

          {/* Next Page */}
          <li className={`page-item ${!hasNextPage ? "disabled" : ""}`}>
            <button
              className="page-link nav-btn"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={!hasNextPage || loading}
            >
              <span className="nav-text">Next</span>
              <i className="bi bi-chevron-right"></i>
            </button>
          </li>

          {/* Last Page */}
          <li className={`page-item ${!hasNextPage ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => onPageChange(totalPages)}
              disabled={!hasNextPage || loading}
              title="Last page"
            >
              <i className="bi bi-chevron-double-right"></i>
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
          padding: 1.25rem 1.5rem;
          gap: 1rem;
          background: #fff;
          border-radius: 0 0 12px 12px;
          border-top: 1px solid #f3f4f6;
        }

        .pagination-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .pagination-label {
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
        }

        .pagination-status {
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 400;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .pagination-status strong {
          font-weight: 600;
          color: #212529;
        }

        .pagination-loading {
          display: inline-flex;
          align-items: center;
          margin-left: 0.5rem;
        }

        .pagination-loading .spinner-border {
          width: 14px;
          height: 14px;
          border-width: 2px;
          color: rgb(39, 35, 92);
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
          align-items: center;
        }

        .page-item {
          list-style: none;
        }

        .page-link {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 36px;
          height: 36px;
          padding: 0.4rem 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #212529;
          background-color: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          gap: 0.25rem;
        }

        .page-link:hover:not(:disabled) {
          background-color: rgb(39, 35, 92);
          border-color: rgb(39, 35, 92);
          color: #fff;
        }

        .page-link.nav-btn {
          padding: 0.4rem 0.75rem;
          min-width: auto;
        }

        .nav-text {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .page-item.active .page-link {
          background-color: rgb(39, 35, 92);
          border-color: rgb(39, 35, 92);
          color: #fff;
          font-weight: 600;
        }

        .page-item.active .page-link:hover {
          background-color: rgb(30, 26, 71);
          border-color: rgb(30, 26, 71);
        }

        .page-item.disabled .page-link {
          opacity: 0.4;
          cursor: not-allowed;
          pointer-events: none;
          background-color: #f9fafb;
          color: #9ca3af;
        }

        .page-item.ellipsis .page-link {
          border: none;
          background: transparent;
          cursor: default;
          min-width: 30px;
          pointer-events: none;
          color: #9ca3af;
        }

        .page-item.ellipsis .page-link:hover {
          background: transparent;
        }

        /* Hide page numbers on mobile, show only nav buttons */
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

          .page-item.page-number {
            display: none;
          }

          .nav-text {
            display: inline;
          }
        }

        @media (max-width: 480px) {
          .page-link {
            min-width: 32px;
            height: 32px;
            padding: 0.3rem 0.5rem;
            font-size: 0.8rem;
          }

          .page-link.nav-btn {
            padding: 0.3rem 0.5rem;
          }

          .nav-text {
            display: none;
          }

          .pagination-label {
            font-size: 0.8rem;
          }

          .pagination-status {
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Pagination;
