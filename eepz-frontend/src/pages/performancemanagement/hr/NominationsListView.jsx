import React from "react";

function NominationsListView({
  groupedRewards,
  paginatedRewards,
  viewMode,
  activeTab,
  viewEmployeeList,
  currentPage,
  setCurrentPage,
  totalPages,
  styles,
}) {
  if (groupedRewards.length === 0) {
    return (
      <div className={styles.hrNominationEmptyState}>
        <h5 className={styles.hrNominationEmptyTitle}>
          No {activeTab.toLowerCase()} nominations
        </h5>
        <p className={styles.hrNominationEmptyText}>
          Check back later or switch to another tab
        </p>
      </div>
    );
  }

  return (
    <>
      {viewMode === "table" ? (
        <>
          <div className={styles.hrNominationTableWrapper}>
            <table className={styles.hrNominationTable}>
              <thead className={styles.hrNominationTableHead}>
                <tr>
                  <th
                    className={`${styles.hrNominationTableTh} ${styles.hrNominationTableThLeft}`}
                  >
                    Reward Type
                  </th>
                  <th
                    className={`${styles.hrNominationTableTh} ${styles.hrNominationTableThCenter}`}
                  >
                    Nominated Employees
                  </th>
                  <th
                    className={`${styles.hrNominationTableTh} ${styles.hrNominationTableThCenter}`}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedRewards.map((reward) => (
                  <tr
                    key={reward.rewardName}
                    className={styles.hrNominationTableRow}
                  >
                    <td className={styles.hrNominationTableTd}>
                      <div className={styles.hrNominationRewardInfo}>
                        <div className={styles.hrNominationRewardIcon}>
                          <i className="bi bi-award-fill" />
                        </div>
                        <div>
                          <div className={styles.hrNominationRewardName}>
                            {reward.rewardName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td
                      className={`${styles.hrNominationTableTd} ${styles.hrNominationTableTdCenter}`}
                    >
                      <div className={styles.hrNominationEmployeeCountBadge}>
                        <i className="bi bi-people-fill" />
                        {reward.totalCount}
                      </div>
                    </td>
                    <td className={styles.hrNominationTableTd}>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          justifyContent: "center",
                        }}
                      >
                        <button
                          onClick={() => viewEmployeeList(reward)}
                          title="View Employees"
                          className={styles.hrNominationTableViewButton}
                        >
                          View Nominations
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <nav
              aria-label="Page navigation"
              className={styles.hrNominationPagination}
            >
              <ul className="pagination justify-content-center">
                <li
                  className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                >
                  <button
                    className={`page-link ${styles.hrNominationPaginationButton}`}
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    First
                  </button>
                </li>
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum =
                    currentPage - 2 + i > 0 ? currentPage - 2 + i : 1;
                  return pageNum <= totalPages ? (
                    <li
                      key={pageNum}
                      className={`page-item ${
                        currentPage === pageNum ? "active" : ""
                      }`}
                    >
                      <button
                        className={`page-link ${
                          styles.hrNominationPaginationButton
                        } ${
                          currentPage === pageNum
                            ? styles.hrNominationPaginationButtonActive
                            : ""
                        }`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    </li>
                  ) : null;
                })}
                <li
                  className={`page-item ${
                    currentPage === totalPages ? "disabled" : ""
                  }`}
                >
                  <button
                    className={`page-link ${styles.hrNominationPaginationButton}`}
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    Last
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </>
      ) : (
        <>
          <div className="row g-3 mb-3">
            {paginatedRewards.map((reward) => (
              <div key={reward.rewardName} className="col-md-6 col-lg-4">
                <div className={styles.hrNominationGridCard}>
                  <div className={styles.hrNominationGridCardIcon}>
                    <i className="bi bi-award-fill" />
                  </div>

                  <h5 className={styles.hrNominationGridCardTitle}>
                    {reward.rewardName}
                  </h5>

                  {reward.rewardCategory && (
                    <p className={styles.hrNominationGridCardCategory}>
                      {reward.rewardCategory}
                    </p>
                  )}

                  <div className={styles.hrNominationGridCardCount}>
                    <i
                      className={`bi bi-people-fill ${styles.hrNominationGridCardCountIcon}`}
                    />
                    <div>
                      <div className={styles.hrNominationGridCardCountValue}>
                        {reward.totalCount}
                      </div>
                      <div className={styles.hrNominationGridCardCountLabel}>
                        Nominated Employees
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => viewEmployeeList(reward)}
                    className={styles.hrNominationGridCardButton}
                  >
                    <i className="bi bi-eye" /> View Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <nav
              aria-label="Page navigation"
              className={styles.hrNominationPagination}
            >
              <ul className="pagination justify-content-center">
                <li
                  className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                >
                  <button
                    className={`page-link ${styles.hrNominationPaginationButton}`}
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    First
                  </button>
                </li>
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum =
                    currentPage - 2 + i > 0 ? currentPage - 2 + i : 1;
                  return pageNum <= totalPages ? (
                    <li
                      key={pageNum}
                      className={`page-item ${
                        currentPage === pageNum ? "active" : ""
                      }`}
                    >
                      <button
                        className={`page-link ${
                          styles.hrNominationPaginationButton
                        } ${
                          currentPage === pageNum
                            ? styles.hrNominationPaginationButtonActive
                            : ""
                        }`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    </li>
                  ) : null;
                })}
                <li
                  className={`page-item ${
                    currentPage === totalPages ? "disabled" : ""
                  }`}
                >
                  <button
                    className={`page-link ${styles.hrNominationPaginationButton}`}
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    Last
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </>
      )}
    </>
  );
}

export default NominationsListView;
