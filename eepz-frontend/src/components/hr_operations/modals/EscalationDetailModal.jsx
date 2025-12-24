import React from "react";
import "../../../styles/hr_operations/hr/EscalationDetailModal.css";

const EscalationDetailModal = ({
  show,
  onHide,
  escalation,
  getSeverityBadge,
  getStatusBadge,
}) => {
  if (!show || !escalation) return null;

  // Custom Badge Component
  const CustomBadge = ({ variant, children }) => {
    const variantClass = `edm-badge edm-badge-${variant || "secondary"}`;

    return <span className={variantClass}>{children}</span>;
  };

  return (
    <>
      <div className="edm-backdrop" onClick={onHide} />

      <div className="edm-modal-container">
        <div className="edm-modal-dialog">
          {/* HEADER - Fixed */}
          <div className="edm-modal-header">
            <div className="edm-header-title">
              <i className="bi bi-exclamation-triangle"></i>
              SLA Escalation Details
            </div>
            <button
              type="button"
              onClick={onHide}
              aria-label="Close"
              className="edm-close-button"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* BODY - Scrollable */}
          <div className="edm-modal-body">
            {/* Detail Grid */}
            <div className="edm-detail-grid">
              {/* Employee Name */}
              <div className="edm-detail-item">
                <label className="edm-detail-label">Employee Name:</label>
                <span className="edm-detail-value">
                  {escalation.employeeName || "N/A"}
                </span>
              </div>

              {/* Employee ID */}
              <div className="edm-detail-item">
                <label className="edm-detail-label">Employee ID:</label>
                <span className="edm-detail-value">
                  {escalation.employeeUserId}
                </span>
              </div>

              {/* Email */}
              <div className="edm-detail-item">
                <label className="edm-detail-label">Email:</label>
                <span className="edm-detail-value">
                  {escalation.employeeEmail || "N/A"}
                </span>
              </div>

              {/* SLA Type */}
              <div className="edm-detail-item">
                <label className="edm-detail-label">SLA Type:</label>
                <span className="edm-detail-value">
                  {escalation.slaType || "N/A"}
                </span>
              </div>

              {/* Escalation Level */}
              <div className="edm-detail-item">
                <label className="edm-detail-label">Escalation Level:</label>
                <span className="edm-detail-value">
                  {escalation.escalationLevel}
                </span>
              </div>

              {/* Severity */}
              <div className="edm-detail-item">
                <label className="edm-detail-label">Severity:</label>
                <div>
                  <CustomBadge variant={getSeverityBadge(escalation.severity)}>
                    {escalation.severity}
                  </CustomBadge>
                </div>
              </div>

              {/* Status */}
              <div className="edm-detail-item">
                <label className="edm-detail-label">Status:</label>
                <div>
                  <CustomBadge
                    variant={getStatusBadge(escalation.escalationStatus)}
                  >
                    {escalation.escalationStatus}
                  </CustomBadge>
                </div>
              </div>

              {/* Days Overdue */}
              <div className="edm-detail-item">
                <label className="edm-detail-label">Days Overdue:</label>
                <span className="edm-detail-value-danger">
                  {escalation.daysOverdue} days
                </span>
              </div>

              {/* SLA Deadline */}
              <div className="edm-detail-item">
                <label className="edm-detail-label">SLA Deadline:</label>
                <span className="edm-detail-value">
                  {new Date(escalation.slaDeadline).toLocaleDateString()}
                </span>
              </div>

              {/* Escalated To */}
              <div className="edm-detail-item">
                <label className="edm-detail-label">Escalated To:</label>
                <span className="edm-detail-value">
                  {escalation.escalatedToName || "N/A"}
                </span>
              </div>

              {/* Escalated At */}
              <div className="edm-detail-item">
                <label className="edm-detail-label">Escalated At:</label>
                <span className="edm-detail-value">
                  {new Date(escalation.submittedAt).toLocaleString()}
                </span>
              </div>

              {/* Submitted By */}
              <div className="edm-detail-item">
                <label className="edm-detail-label">Submitted By:</label>
                <span className="edm-detail-value">
                  {escalation.submittedByName || "N/A"}
                </span>
              </div>

              {/* Reason - Full Width */}
              <div className="edm-text-box-section">
                <label className="edm-detail-label">Reason:</label>
                <p className="edm-text-box">{escalation.reason}</p>
              </div>

              {/* Description - Full Width (Conditional) */}
              {escalation.description && (
                <div className="edm-text-box-section">
                  <label className="edm-detail-label">Description:</label>
                  <p className="edm-text-box">{escalation.description}</p>
                </div>
              )}

              {/* Resolution Details (Conditional) */}
              {escalation.resolvedAt && (
                <>
                  {/* Resolved At */}
                  <div className="edm-detail-item">
                    <label className="edm-detail-label">Resolved At:</label>
                    <span className="edm-detail-value">
                      {new Date(escalation.resolvedAt).toLocaleString()}
                    </span>
                  </div>

                  {/* Resolved By */}
                  <div className="edm-detail-item">
                    <label className="edm-detail-label">Resolved By:</label>
                    <span className="edm-detail-value">
                      {escalation.resolvedByName || "N/A"}
                    </span>
                  </div>

                  {/* Resolution Comments (Conditional) */}
                  {escalation.resolutionComments && (
                    <div className="edm-text-box-section">
                      <label className="edm-detail-label">
                        Resolution Comments:
                      </label>
                      <p className="edm-resolution-box">
                        {escalation.resolutionComments}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* FOOTER - Fixed */}
          <div className="edm-modal-footer">
            <button type="button" onClick={onHide} className="edm-btn-close">
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EscalationDetailModal;
