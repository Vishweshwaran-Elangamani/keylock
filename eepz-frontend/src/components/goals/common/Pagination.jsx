const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  loading = false,
  currentPageItems = 0,
  pageSize = 9,
}) => {
  const isLastPage = currentPageItems < pageSize || currentPage >= totalPages;

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "2rem 1rem",
      }}
    >
      <ul
        className="pagination"
        style={{
          display: "flex",
          gap: "0.5rem",
          listStyle: "none",
          padding: 0,
          margin: 0,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {/* Previous Button */}
        <li
          className="page-item"
          style={{
            opacity: currentPage === 1 || loading ? 0.5 : 1,
            transition: "all 0.3s ease",
          }}
        >
          <button
            className="page-link"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            style={{
              padding: "0.6rem 0.9rem",
              fontSize: "0.95rem",
              fontWeight: 500,
              borderRadius: "8px",
              border: "1px solid #e0e0e0",
              backgroundColor: currentPage === 1 ? "#f5f5f5" : "#fff",
              color: currentPage === 1 ? "#999" : "#0d6efd",
              cursor: currentPage === 1 || loading ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "40px",
              minHeight: "40px",
            }}
            onMouseEnter={(e) => {
              if (currentPage !== 1 && !loading) {
                e.target.style.backgroundColor = "#0d6efd";
                e.target.style.color = "#fff";
                e.target.style.borderColor = "#0d6efd";
                e.target.style.transform = "translateX(-2px)";
              }
            }}
            onMouseLeave={(e) => {
              if (currentPage !== 1 && !loading) {
                e.target.style.backgroundColor = "#fff";
                e.target.style.color = "#0d6efd";
                e.target.style.borderColor = "#e0e0e0";
                e.target.style.transform = "translateX(0)";
              }
            }}
            title="Previous Page"
          >
            <i className="bi bi-chevron-left"></i>
          </button>
        </li>

        {/* Divider */}
        <div
          style={{
            width: "1px",
            height: "24px",
            backgroundColor: "#e0e0e0",
            margin: "0 0.5rem",
          }}
        ></div>

        {/* Current Page Display */}
        <li className="page-item" style={{ listStyle: "none" }}>
          <div
            style={{
              padding: "0.6rem 1.2rem",
              fontSize: "0.95rem",
              fontWeight: 600,
              borderRadius: "8px",
              backgroundColor: "#f0f7ff",
              border: "2px solid #0d6efd",
              color: "#0d6efd",
              minWidth: "50px",
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "40px",
            }}
          >
            {currentPage}
          </div>
        </li>

        {/* Divider */}
        <div
          style={{
            width: "1px",
            height: "24px",
            backgroundColor: "#e0e0e0",
            margin: "0 0.5rem",
          }}
        ></div>

        {/* Next Button */}
        <li
          className="page-item"
          style={{
            opacity: isLastPage || loading ? 0.5 : 1,
            transition: "all 0.3s ease",
          }}
        >
          <button
            className="page-link"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={isLastPage || loading}
            style={{
              padding: "0.6rem 0.9rem",
              fontSize: "0.95rem",
              fontWeight: 500,
              borderRadius: "8px",
              border: "1px solid #e0e0e0",
              backgroundColor: isLastPage ? "#f5f5f5" : "#fff",
              color: isLastPage ? "#999" : "#0d6efd",
              cursor: isLastPage || loading ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "40px",
              minHeight: "40px",
            }}
            onMouseEnter={(e) => {
              if (!isLastPage && !loading) {
                e.target.style.backgroundColor = "#0d6efd";
                e.target.style.color = "#fff";
                e.target.style.borderColor = "#0d6efd";
                e.target.style.transform = "translateX(2px)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isLastPage && !loading) {
                e.target.style.backgroundColor = "#fff";
                e.target.style.color = "#0d6efd";
                e.target.style.borderColor = "#e0e0e0";
                e.target.style.transform = "translateX(0)";
              }
            }}
            title="Next Page"
          >
            <i className="bi bi-chevron-right"></i>
          </button>
        </li>

        {/* Loading Indicator */}
        {loading && (
          <li className="page-item" style={{ listStyle: "none", marginLeft: "1rem" }}>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.85rem",
                color: "#6c757d",
              }}
            >
              <span
                className="spinner-border spinner-border-sm"
                role="status"
                style={{
                  width: "16px",
                  height: "16px",
                  borderWidth: "2px",
                }}
              >
                <span className="visually-hidden">Loading...</span>
              </span>
              Loading...
            </span>
          </li>
        )}
      </ul>

      <style jsx>{`
        @media (max-width: 576px) {
          nav {
            padding: 1.5rem 0.5rem !important;
          }
        }
      `}</style>
    </nav>
  );
};

export default Pagination;
