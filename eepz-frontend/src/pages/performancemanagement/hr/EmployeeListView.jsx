import React from "react";
import Breadcrumb from "../../../components/common/Breadcrumb";

function EmployeeListView({
  selectedRewardName,
  selectedRewardEmployees,
  activeTab,
  viewDetails,
  openApproveModal,
  openRejectModal,
  handleNominationsClick,
  styles,
}) {
  return (
    <div className="container-fluid">
      <div
        onClick={(e) => {
          const target = e.target;
          if (
            target.textContent === "Nominations" ||
            target.closest('[data-breadcrumb="nominations"]')
          ) {
            handleNominationsClick(e);
          }
        }}
      >
        <Breadcrumb
          items={[
            { label: "Performance", path: "/hr/dashboard/performance" },
            {
              label: "Nominations",
              path: "/hr/dashboard/performance/nominations",
              isClickable: true,
              onClick: handleNominationsClick,
            },
            { label: selectedRewardName, path: null },
          ]}
        />
      </div>

      <div className={styles.hrNominationEmployeeHeader}>
        <div>
          <h4 className={styles.hrNominationEmployeeHeaderTitle}>
            {selectedRewardName}
          </h4>
          <p className={styles.hrNominationEmployeeHeaderSubtitle}>
            {selectedRewardEmployees.length} employee(s) nominated
          </p>
        </div>
        <div className={styles.hrNominationEmployeeHeaderBadge}>
          {selectedRewardEmployees.length}
        </div>
      </div>

      <div className="row g-3">
        {selectedRewardEmployees.map((employee) => (
          <div key={employee.nominationId} className="col-md-6">
            <div className={styles.hrNominationEmployeeCard}>
              <div className={styles.hrNominationEmployeeCardHeader}>
                <div className={styles.hrNominationEmployeeAvatar}>
                  {employee.nomineeName.charAt(0).toUpperCase()}
                </div>
                <div className={styles.hrNominationEmployeeInfo}>
                  <h6 className={styles.hrNominationEmployeeName}>
                    {employee.nomineeName}
                  </h6>
                  <p className={styles.hrNominationEmployeeEmail}>
                    {employee.nomineeEmail}
                  </p>
                </div>
              </div>

              <div className={styles.hrNominationEmployeeInfoGrid}>
                <div className={styles.hrNominationEmployeeInfoBox}>
                  <span className={styles.hrNominationEmployeeInfoLabel}>
                    Department
                  </span>
                  <p className={styles.hrNominationEmployeeInfoValue}>
                    {employee.nomineeDepartmentName}
                  </p>
                </div>
                <div className={styles.hrNominationEmployeeInfoBox}>
                  <span className={styles.hrNominationEmployeeInfoLabel}>
                    Submitted
                  </span>
                  <p className={styles.hrNominationEmployeeInfoValue}>
                    {new Date(employee.submittedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {employee.justification && (
                <div className={styles.hrNominationEmployeeJustification}>
                  <p className={styles.hrNominationEmployeeJustificationText}>
                    {employee.justification}
                  </p>
                </div>
              )}

              <div className={styles.hrNominationEmployeeActions}>
                <button
                  onClick={() => viewDetails(employee.nominationId)}
                  title="View Details"
                  className={`${styles.hrNominationEmployeeActionBtn} ${styles.hrNominationEmployeeActionBtnView}`}
                >
                  <i className="bi bi-eye" />
                </button>
                {activeTab === "Pending" && (
                  <>
                    <button
                      onClick={() => openApproveModal(employee.nominationId)}
                      title="Approve"
                      className={`${styles.hrNominationEmployeeActionBtn} ${styles.hrNominationEmployeeActionBtnApprove}`}
                    >
                      <i className="bi bi-check-circle" />
                    </button>
                    <button
                      onClick={() => openRejectModal(employee.nominationId)}
                      title="Reject"
                      className={`${styles.hrNominationEmployeeActionBtn} ${styles.hrNominationEmployeeActionBtnReject}`}
                    >
                      <i className="bi bi-x-circle" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default EmployeeListView;
