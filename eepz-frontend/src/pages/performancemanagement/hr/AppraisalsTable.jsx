import React from "react";
import { PaginationDropdown } from "./HRViewAppraisalsUtils";

function AppraisalsTable({
  currentItems,
  summaryRows,
  indexOfFirstItem,
  indexOfLastItem,
  currentPage,
  setCurrentPage,
  rowsPerPage,
  setRowsPerPage,
  totalPages,
  handleViewDetails,
  statusBadge,
  styles,
}) {
  function getPageNumbers() {
    const pages = [];
    const maxPagesToShow = 5;
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages
        );
      }
    }
    return pages;
  }

  return (
    <div className={styles.hrViewAssessmentTableCard}>
      <div className={styles.hrViewAssessmentTableWrapper}>
        <table className={styles.hrViewAssessmentTable}>
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Project Name</th>
              <th>Emp Avg</th>
              <th>L1 Reviewer</th>
              <th>L1 Avg</th>
              <th>L2 Reviewer</th>
              <th>L2 Avg</th>
              <th>Status</th>
              <th className={styles.textCenter}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan={9} className={styles.hrViewAssessmentEmptyState}>
                  <i className="bi bi-inbox"></i>
                  <p>No appraisals match your filters</p>
                </td>
              </tr>
            ) : (
              currentItems.map((row) => (
                <tr key={row.key}>
                  <td>{row.employeeName}</td>
                  <td>{row.projectName}</td>
                  <td>{row.empAvg}</td>
                  <td>{row.l1ReviewerName}</td>
                  <td>{row.l1Avg}</td>
                  <td>{row.l2ReviewerName}</td>
                  <td>{row.l2Avg}</td>
                  <td>{statusBadge(row.status)}</td>
                  <td>
                    <div className={styles.hrViewAssessmentActionButtons}>
                      <button
                        className={`${styles.hrViewAssessmentActionBtn} ${styles.hrViewAssessmentBtnView}`}
                        title="View Details"
                        onClick={() => handleViewDetails(row)}
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.hrViewAssessmentPaginationContainer}>
        <div className={styles.hrViewAssessmentPaginationInfo}>
          <span className={styles.hrViewAssessmentPaginationLabel}>Show</span>
          <PaginationDropdown
            value={rowsPerPage}
            onChange={(val) => {
              setRowsPerPage(Number(val));
              setCurrentPage(1);
            }}
            options={[5, 10, 25, 50]}
          />
          <span className={styles.hrViewAssessmentPaginationLabel}>
            entries
          </span>
        </div>
        <div className={styles.hrViewAssessmentPaginationStatus}>
          Showing {summaryRows.length === 0 ? 0 : indexOfFirstItem + 1} to{" "}
          {Math.min(indexOfLastItem, summaryRows.length)} of{" "}
          {summaryRows.length} entries
        </div>
        <nav className={styles.hrViewAssessmentPaginationNav}>
          <ul className={styles.hrViewAssessmentPagination}>
            <li
              className={`${styles.hrViewAssessmentPageItem}${
                currentPage === 1 ? ` ${styles.hrViewAssessmentDisabled}` : ""
              }`}
            >
              <button
                className={styles.hrViewAssessmentPageLink}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <i className="bi bi-chevron-left"></i>
              </button>
            </li>
            {getPageNumbers().map((page, idx) => (
              <li
                key={idx}
                className={`${styles.hrViewAssessmentPageItem}${
                  page === currentPage
                    ? ` ${styles.hrViewAssessmentActive}`
                    : ""
                } ${
                  typeof page !== "number"
                    ? ` ${styles.hrViewAssessmentDisabled}`
                    : ""
                }`}
              >
                <button
                  className={styles.hrViewAssessmentPageLink}
                  onClick={() =>
                    typeof page === "number" && setCurrentPage(page)
                  }
                  disabled={typeof page !== "number"}
                >
                  {page}
                </button>
              </li>
            ))}
            <li
              className={`${styles.hrViewAssessmentPageItem}${
                currentPage === totalPages
                  ? ` ${styles.hrViewAssessmentDisabled}`
                  : ""
              }`}
            >
              <button
                className={styles.hrViewAssessmentPageLink}
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}

export default AppraisalsTable;
