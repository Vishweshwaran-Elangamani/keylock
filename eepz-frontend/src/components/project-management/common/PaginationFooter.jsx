import { useState, useRef, useEffect } from "react";
import "../../../styles/projectmanagement/components/PaginationFooter.css";
 
const PaginationFooter = ({
  totalItems,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage,
}) => {
  const [showItemsDropdown, setShowItemsDropdown] = useState(false);
  const itemsDropdownRef = useRef(null);
 
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
 
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        itemsDropdownRef.current &&
        !itemsDropdownRef.current.contains(event.target)
      ) {
        setShowItemsDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
 
  const getPageNumbers = () => {
    const pages = [];
 
    if (totalPages <= 3) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
 
    if (currentPage <= 2) {
      return [1, 2, 3];
    }
 
    if (currentPage >= totalPages - 1) {
      return [totalPages - 2, totalPages - 1, totalPages];
    }
 
    return [currentPage - 1, currentPage, currentPage + 1];
  };
 
  return (
    <div className="pagination-footer-container">
      <div className="pagination-footer-info">
        <span className="pagination-footer-label">Show</span>
 
        <div
          ref={itemsDropdownRef}
          className="pagination-footer-dropdown-wrapper"
        >
          <button
            type="button"
            onClick={() => setShowItemsDropdown(!showItemsDropdown)}
            className="pagination-footer-items-button"
          >
            <span>{itemsPerPage}</span>
            <i
              className={`bi bi-chevron-${
                showItemsDropdown ? "up" : "down"
              } pagination-footer-chevron`}
            ></i>
          </button>
 
          {showItemsDropdown && (
            <div className="pagination-footer-dropdown">
              {[5, 10, 25, 50].map((size) => (
                <div
                  key={size}
                  onClick={() => {
                    setItemsPerPage(size);
                    setCurrentPage(1);
                    setShowItemsDropdown(false);
                  }}
                  className={`pagination-footer-option ${
                    itemsPerPage === size ? "pagination-footer-active" : ""
                  }`}
                >
                  {size}
                </div>
              ))}
            </div>
          )}
        </div>
 
        <span className="pagination-footer-label">entries</span>
      </div>
 
      <div className="pagination-footer-status">
        Showing {indexOfFirstItem + 1} to{" "}
        {Math.min(indexOfLastItem, totalItems)} of {totalItems} entries
      </div>
 
      <nav className="pagination-footer-nav">
        <ul className="pagination-footer-pages">
          <li
            className={`pagination-footer-page-item ${currentPage === 1 ? "disabled" : ""}`}
          >
            <button
              className="pagination-footer-page-link"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
            >
              <i className="bi bi-chevron-left"></i>
            </button>
          </li>
 
          {getPageNumbers().map((page, index) => (
            <li
              key={index}
              className={`pagination-footer-page-item ${
                page === currentPage ? "active" : ""
              } ${typeof page !== "number" ? "disabled" : ""}`}
            >
              <button
                className="pagination-footer-page-link"
                onClick={() => typeof page === "number" && setCurrentPage(page)}
                disabled={typeof page !== "number"}
              >
                {page}
              </button>
            </li>
          ))}
 
          <li
            className={`pagination-footer-page-item ${
              currentPage === totalPages ? "disabled" : ""
            }`}
          >
            <button
              className="pagination-footer-page-link"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};
 
export default PaginationFooter;
 
 