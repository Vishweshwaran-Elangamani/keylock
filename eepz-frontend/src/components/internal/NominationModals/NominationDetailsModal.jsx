import React from "react";
import "../../../styles/internal/NominationDetailsModal.css";
const NominationDetailsModal = ({ show, onHide, nomination }) => {
  if (!show || !nomination) return null;
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };
  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "status-active";
      case "rejected":
        return "status-inactive";
      case "pending":
      case "pending_manager_review":
      case "pending_dept_head_approval":
        return "status-pending";
      default:
        return "status-inactive";
    }
  };
  return (
    <>
      <div className="ndm-backdrop" onClick={onHide} />
      <div className="ndm-modal-container">
        <div className="ndm-modal-dialog">
          {/* HEADER - Fixed */}
          <div className="ndm-modal-header">
            <div className="ndm-header-title">
              <i className="bi bi-info-circle"></i>
              Nomination Details
            </div>
            <button
              type="button"
              onClick={onHide}
              aria-label="Close"
              className="ndm-close-button"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          {/* BODY - Scrollable */}
          <div className="ndm-modal-body">
            {/* Top Section - Opportunity & Nominee Information in 2 Columns */}
            <div className="ndm-top-section">
              {/* LEFT COLUMN - Opportunity Information */}
              <div className="ndm-info-card opportunity">
                <h6 className="ndm-card-heading opportunity">
                  <i className="bi bi-briefcase"></i>
                  Opportunity Information
                </h6>
                <div>
                  <label className="ndm-card-label">Opportunity Name:</label>
                  <p className="ndm-card-value opportunity">
                    {nomination.opportunityName || "N/A"}
                  </p>
                </div>
              </div>
              {/* RIGHT COLUMN - Nominee Information */}
              <div className="ndm-info-card nominee">
                <h6 className="ndm-card-heading nominee">
                  <i className="bi bi-person"></i>
                  Nominee Information
                </h6>
                <div>
                  <label className="ndm-card-label">Nominee Name:</label>
                  <p className="ndm-card-value nominee">
                    {nomination.nomineeName || "N/A"}
                  </p>
                </div>
              </div>
            </div>
            {/* Nomination Details */}
            <div className="ndm-details-section">
              <h6 className="ndm-details-heading">
                <i className="bi bi-file-text"></i>
                Nomination Details
              </h6>
              <div className="ndm-details-grid">
                <div className="ndm-details-item">
                  <label>Nominated By:</label>
                  <p>{nomination.nominatedByName || "N/A"}</p>
                </div>
                <div className="ndm-details-item">
                  <label>Nomination Type:</label>
                  <p>
                    {nomination.nominationType
                      ?.replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase()) || "N/A"}
                  </p>
                </div>
                <div className="ndm-details-item">
                  <label>Submitted Date:</label>
                  <p>{formatDate(nomination.submittedAt)}</p>
                </div>
                <div className="ndm-details-item">
                  <label>Status:</label>
                  <p>
                    <span
                      className={`status-badge ${getStatusBadgeClass(
                        nomination.status
                      )}`}
                    >
                      {nomination.status
                        ?.replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase()) || "N/A"}
                    </span>
                  </p>
                </div>
              </div>
              {nomination.justification && (
                <div className="ndm-justification-container">
                  <label className="ndm-card-label">Justification:</label>
                  <p className="ndm-justification-text">
                    {nomination.justification}
                  </p>
                </div>
              )}
            </div>
            {/* Review Information (if available) */}
            {(nomination.reviewRemarks || nomination.reviewedByName) && (
              <div className="ndm-review-section">
                <h6 className="ndm-review-heading">
                  <i className="bi bi-chat-left-text"></i>
                  Review Information
                </h6>
                {nomination.reviewedByName && (
                  <div className="ndm-review-item">
                    <label>Reviewed By:</label>
                    <p className="ndm-review-value">
                      {nomination.reviewedByName}
                    </p>
                  </div>
                )}
                {nomination.reviewedAt && (
                  <div className="ndm-review-item">
                    <label>Reviewed At:</label>
                    <p className="ndm-review-value">
                      {formatDate(nomination.reviewedAt)}
                    </p>
                  </div>
                )}
                {nomination.reviewRemarks && (
                  <div className="ndm-review-item">
                    <label>Review Remarks:</label>
                    <p className="ndm-review-remarks">
                      {nomination.reviewRemarks}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* FOOTER - Fixed */}
          <div className="ndm-modal-footer">
            <button type="button" onClick={onHide} className="ndm-btn-close">
              <i className="bi bi-x-circle"></i> Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
export default NominationDetailsModal;
