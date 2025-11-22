import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

const Pagination = ({ pagination, onPageChange }) => {
  const {
    pageNumber,
    totalPages,
    hasPreviousPage,
    hasNextPage,
    totalCount,
    pageSize,
  } = pagination;

  // Calculate showing range
  const startItem = (pageNumber - 1) * pageSize + 1;
  const endItem = Math.min(pageNumber * pageSize, totalCount);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first, last, current and nearby pages
      if (pageNumber <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (pageNumber >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(pageNumber - 1);
        pages.push(pageNumber);
        pages.push(pageNumber + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        marginTop: "1.5rem",
        padding: "1rem",
        background: "#fff",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
      }}
    >
      {/* Info */}
      <div
        style={{
          fontSize: "0.875rem",
          color: "#6c757d",
          textAlign: "center",
        }}
      >
        Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of{" "}
        <strong>{totalCount}</strong> items
      </div>

      {/* Pagination Controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "0.5rem",
          flexWrap: "wrap",
        }}
      >
        {/* First Page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={!hasPreviousPage}
          style={{
            padding: "0.5rem",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            background: hasPreviousPage ? "#fff" : "#f8f9fa",
            color: hasPreviousPage ? "#212529" : "#6c757d",
            cursor: hasPreviousPage ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            transition: "all 0.2s",
          }}
          title="First page"
        >
          <ChevronsLeft size={16} />
        </button>

        {/* Previous Page */}
        <button
          onClick={() => onPageChange(pageNumber - 1)}
          disabled={!hasPreviousPage}
          style={{
            padding: "0.5rem 1rem",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            background: hasPreviousPage ? "#fff" : "#f8f9fa",
            color: hasPreviousPage ? "#212529" : "#6c757d",
            cursor: hasPreviousPage ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
            fontSize: "0.875rem",
            fontWeight: "500",
            transition: "all 0.2s",
          }}
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        {/* Page Numbers */}
        {pageNumbers.map((page, index) => (
          <button
            key={index}
            onClick={() => page !== "..." && onPageChange(page)}
            disabled={page === "..." || page === pageNumber}
            style={{
              padding: "0.5rem 0.75rem",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              background: page === pageNumber ? "rgb(39, 35, 92)" : "#fff",
              color: page === pageNumber ? "#fff" : "#212529",
              cursor:
                page === "..." || page === pageNumber ? "default" : "pointer",
              fontSize: "0.875rem",
              fontWeight: page === pageNumber ? "600" : "400",
              minWidth: "2.5rem",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (page !== "..." && page !== pageNumber) {
                e.target.style.background = "#f8f9fa";
              }
            }}
            onMouseLeave={(e) => {
              if (page !== "..." && page !== pageNumber) {
                e.target.style.background = "#fff";
              }
            }}
          >
            {page}
          </button>
        ))}

        {/* Next Page */}
        <button
          onClick={() => onPageChange(pageNumber + 1)}
          disabled={!hasNextPage}
          style={{
            padding: "0.5rem 1rem",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            background: hasNextPage ? "#fff" : "#f8f9fa",
            color: hasNextPage ? "#212529" : "#6c757d",
            cursor: hasNextPage ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
            fontSize: "0.875rem",
            fontWeight: "500",
            transition: "all 0.2s",
          }}
        >
          Next
          <ChevronRight size={16} />
        </button>

        {/* Last Page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={!hasNextPage}
          style={{
            padding: "0.5rem",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            background: hasNextPage ? "#fff" : "#f8f9fa",
            color: hasNextPage ? "#212529" : "#6c757d",
            cursor: hasNextPage ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            transition: "all 0.2s",
          }}
          title="Last page"
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
