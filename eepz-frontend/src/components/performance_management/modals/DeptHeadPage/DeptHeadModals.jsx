import React from "react";
export const ApproveModal = ({
  showApproveModal,
  selectedEmployee,
  approvingEmployeeId,
  handleModalClose,
  handleApproveSubmit,
  getAvgRating,
}) => {
  if (!showApproveModal || !selectedEmployee) return null;

  return (
    <>
      <div className="dp-modal-backdrop"></div>
      <div className="dp-modal-wrapper">
        <div className="dp-modal-dialog dp-modal-bordered">
          <div className="dp-modal-header dp-modal-header-primary">
            <div className="dp-modal-title">
              <span>Approve Employee Assessment</span>
            </div>
            <button
              type="button"
              onClick={handleModalClose}
              disabled={approvingEmployeeId}
              aria-label="Close"
              className="dp-modal-close-btn dp-modal-close-primary"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          <div className="dp-modal-body">
            <div className="dp-details-box">
              <h6 className="dp-details-title">
                <i className="bi bi-person-badge me-2"></i>
                Employee Information
              </h6>
              <div className="dp-details-grid">
                <div className="dp-detail-row">
                  <div className="dp-detail-label">Employee Name:</div>
                  <div className="dp-detail-value">
                    <strong>{selectedEmployee.employeeName}</strong>
                  </div>
                </div>
                <div className="dp-detail-row">
                  <div className="dp-detail-label">Project:</div>
                  <div className="dp-detail-value">
                    {selectedEmployee.projectName}
                  </div>
                </div>
                <div className="dp-detail-row">
                  <div className="dp-detail-label">Avg Employee Rating:</div>
                  <div className="dp-detail-value">
                    <span className="dp-rating-badge emp-rating">
                      {getAvgRating(
                        selectedEmployee.competencies,
                        "employeeRating"
                      )}
                    </span>
                  </div>
                </div>
                <div className="dp-detail-row">
                  <div className="dp-detail-label">Avg L1 Rating:</div>
                  <div className="dp-detail-value">
                    <span className="dp-rating-badge l1-rating">
                      {getAvgRating(selectedEmployee.competencies, "l1Rating")}
                    </span>
                  </div>
                </div>
                <div className="dp-detail-row">
                  <div className="dp-detail-label">Avg L2 Rating:</div>
                  <div className="dp-detail-value">
                    <span className="dp-rating-badge l2-rating">
                      {getAvgRating(selectedEmployee.competencies, "l2Rating")}
                    </span>
                  </div>
                </div>
                <div className="dp-detail-row">
                  <div className="dp-detail-label">Goals Assigned:</div>
                  <div className="dp-detail-value">
                    <span className="dp-goals-badge">
                      <i className="bi bi-bullseye"></i>
                      {selectedEmployee.goals?.length || 0} Goals
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="dp-info-alert">
              <i className="bi bi-info-circle"></i>
              <div>
                <strong>Note:</strong> Approving this assessment will finalize
                the performance review process. The employee will be notified
                via system notification.
              </div>
            </div>
          </div>

          <div className="dp-modal-footer dp-modal-footer-approve">
            <button
              type="button"
              className="dp-btn-cancel"
              onClick={handleModalClose}
              disabled={approvingEmployeeId}
            >
              Cancel
            </button>
            <button
              type="button"
              className="dp-btn-submit dp-btn-success"
              onClick={handleApproveSubmit}
              disabled={approvingEmployeeId}
            >
              {approvingEmployeeId ? (
                <>
                  <span className="dp-spinner"></span> Approving...
                </>
              ) : (
                <>Approve Assessment</>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
export const DetailsModal = ({
  showDetailsModal,
  approvedDetails,
  selectedEmployee,
  attachments,
  loadingAttachments,
  handleModalClose,
  handleDownloadAttachment,
  getAvgRating,
  formatFileSize,
  getAvgChecklistProgress,
}) => {
  const displayData = approvedDetails || selectedEmployee;
  if (!showDetailsModal || !displayData) return null;

  return (
    <>
      <div className="dp-modal-backdrop dp-modal-backdrop-blur"></div>
      <div className="dp-modal-wrapper dp-modal-wrapper-large">
        <div className="dp-modal-dialog dp-modal-dialog-large dp-modal-bordered">
          <div className="dp-modal-header dp-modal-header-primary">
            <div className="dp-modal-title">
              <i className="bi bi-file-text-fill"></i>
              {approvedDetails
                ? "Approved Assessment Details"
                : "Assessment Details"}
            </div>
            <button
              type="button"
              onClick={handleModalClose}
              aria-label="Close"
              className="dp-modal-close-btn dp-modal-close-primary"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          <div className="dp-details-modal-body">
            <div className="dp-details-cards-wrapper">
              <div className="dp-details-info-card">
                <h5 className="dp-details-card-title">
                  <i className="bi bi-person-badge"></i>
                  Employee Info
                </h5>
                <div className="dp-details-card-content">
                  <div className="dp-details-employee-name">
                    {displayData.employeeName}
                  </div>
                  <div className="dp-details-project-name">
                    {displayData.projectName}
                  </div>
                  {displayData.goals && (
                    <div className="dp-details-goals-count">
                      <i className="bi bi-bullseye"></i>&nbsp;Goals:&nbsp;
                      <b>{displayData.goals?.length || 0}</b>
                    </div>
                  )}
                </div>
              </div>

              <div className="dp-details-rating-card">
                <h5 className="dp-details-card-title">
                  <i className="bi bi-star-half"></i>
                  Average Ratings
                </h5>
                <div className="dp-details-ratings-list">
                  <div className="dp-details-rating-item">
                    <span className="dp-details-rating-label">
                      <i className="bi bi-person"></i>&nbsp;Employee
                    </span>
                    <span className="dp-details-rating-value dp-rating-emp">
                      {getAvgRating(displayData.competencies, "employeeRating")}
                    </span>
                  </div>
                  <div className="dp-details-rating-item">
                    <span className="dp-details-rating-label">
                      <i className="bi bi-1-circle"></i>&nbsp;L1
                    </span>
                    <span className="dp-details-rating-value dp-rating-l1">
                      {getAvgRating(displayData.competencies, "l1Rating")}
                    </span>
                  </div>
                  <div className="dp-details-rating-item">
                    <span className="dp-details-rating-label">
                      <i className="bi bi-2-circle"></i>&nbsp;L2
                    </span>
                    <span className="dp-details-rating-value dp-rating-l2">
                      {getAvgRating(displayData.competencies, "l2Rating")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="dp-details-section-card">
              <div className="dp-details-section-title">
                <i className="bi bi-grid"></i>
                Competencies Breakdown
              </div>
              <div className="dp-inner-table-wrapper">
                <table className="dp-inner-table">
                  <thead>
                    <tr>
                      <th>Competency</th>
                      <th>Employee Rating</th>
                      <th>Employee Comments</th>
                      <th>L1 Reviewer</th>
                      <th>L1 Rating</th>
                      <th>L1 Comments</th>
                      <th>L2 Reviewer</th>
                      <th>L2 Rating</th>
                      <th>L2 Comments</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayData.competencies &&
                    displayData.competencies.length > 0 ? (
                      displayData.competencies.map((c, idx) => (
                        <tr key={idx}>
                          <td>{c.competencyName}</td>
                          <td>
                            <strong className="emp-rating">
                              {c.employeeRating || "-"}
                            </strong>
                          </td>
                          <td>{c.employeeComments || "-"}</td>
                          <td>{c.l1ReviewerName || "No L1"}</td>
                          <td>
                            <strong className="l1-rating">
                              {c.l1Rating || "-"}
                            </strong>
                          </td>
                          <td>{c.l1Comments || "-"}</td>
                          <td>{c.l2ReviewerName || "No L2"}</td>
                          <td>
                            <strong className="l2-rating">
                              {c.l2Rating || "-"}
                            </strong>
                          </td>
                          <td>{c.l2Comments || "-"}</td>
                          <td>
                            <span
                              className={`dp-status-badge status-${c.status?.toLowerCase()}`}
                            >
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={10} className="dp-no-data">
                          No competencies found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="dp-details-section-card">
              <div className="dp-details-section-title">
                <i className="bi bi-paperclip"></i>
                Attachments
              </div>
              {loadingAttachments ? (
                <div className="dp-loading-attachments">
                  <div
                    className="spinner-border spinner-border-sm"
                    role="status"
                  >
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p>Loading attachments...</p>
                </div>
              ) : attachments.length === 0 ? (
                <p className="dp-no-data">No attachments found.</p>
              ) : (
                <div className="dp-attachments-list">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.attachmentId}
                      className="dp-attachment-item"
                    >
                      <div className="dp-attachment-info">
                        <div className="dp-attachment-filename">
                          {attachment.fileName}
                        </div>
                        <div className="dp-attachment-meta">
                          {formatFileSize(attachment.fileSize)} • Uploaded{" "}
                          {new Date(attachment.uploadedAt).toLocaleDateString()}
                        </div>
                        {attachment.attachmentNote && (
                          <div className="dp-attachment-note">
                            {attachment.attachmentNote}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          handleDownloadAttachment(attachment.attachmentId)
                        }
                        className="dp-attachment-download-btn"
                      >
                        <i className="bi bi-download"></i> Download
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedEmployee && selectedEmployee.goals && (
              <div className="dp-details-section-card">
                <div className="dp-details-section-title">
                  <i className="bi bi-bullseye"></i>
                  Goals
                </div>
                {selectedEmployee.goals &&
                selectedEmployee.goals.length === 0 ? (
                  <p className="dp-no-data">No goals assigned.</p>
                ) : (
                  selectedEmployee.goals?.map((goal) => {
                    const latestProgressLog = goal.goalProgressLogs?.length
                      ? goal.goalProgressLogs.sort(
                          (a, b) =>
                            new Date(b.updatedOn) - new Date(a.updatedOn)
                        )[0]
                      : null;

                    const latestProgress = latestProgressLog
                      ? latestProgressLog.progressPercent
                      : 0;
                    const checklistProgress = getAvgChecklistProgress(
                      goal.goalChecklists
                    );
                    const overallProgress = latestProgress || checklistProgress;

                    return (
                      <div key={goal.goalId} className="dp-goal-card">
                        <div className="dp-goal-header">
                          <div>
                            <h5 className="dp-goal-title">{goal.goalTitle}</h5>
                            <p className="dp-goal-description">
                              {goal.goalDescription}
                            </p>
                          </div>
                          <span
                            className={`dp-goal-status-badge status-${goal.goalstatus?.toLowerCase()}`}
                          >
                            {goal.goalstatus}
                          </span>
                        </div>
                        <div className="dp-progress-container">
                          <div className="dp-progress-label">
                            <span>Progress</span>
                            <span className="dp-progress-value">
                              {overallProgress}%
                            </span>
                          </div>
                          <div className="dp-progress-bar-bg">
                            <div
                              className="dp-progress-bar-fill"
                              style={{ width: `${overallProgress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div className="dp-modal-footer dp-modal-footer-bottom">
            <button
              type="button"
              className="dp-btn-cancel"
              onClick={handleModalClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
