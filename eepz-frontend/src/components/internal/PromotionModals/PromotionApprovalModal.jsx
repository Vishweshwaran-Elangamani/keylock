import "../../../styles/internal/PromotionDetailsModal.css";
const PromotionDetailsModal = ({ show, onHide, promotion }) => {
  if (!show) return null;
  return (
    <>
      <div className="pdm-backdrop" onClick={onHide} />
      <div className="pdm-modal-wrapper">
        <div className="pdm-modal-dialog">
          {/* Modal Header */}
          <div className="pdm-modal-header">
            <h5 className="pdm-header-title">
              <i className="bi bi-info-circle"></i>
              Promotion Details
            </h5>
            <button type="button" className="pdm-close-button" onClick={onHide}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          {/* Modal Body */}
          <div className="pdm-modal-body">
            {/* Employee Information */}
            <div className="pdm-details-section">
              <h6 className="pdm-section-title">Employee Information</h6>
              <div className="pdm-details-grid">
                <div className="pdm-detail-item">
                  <span className="pdm-detail-label">Employee Name:</span>
                  <span className="pdm-detail-value">
                    {promotion.employeeName || "N/A"}
                  </span>
                </div>
                <div className="pdm-detail-item">
                  <span className="pdm-detail-label">Department:</span>
                  <span className="pdm-detail-value">
                    {promotion.departmentName || "N/A"}
                  </span>
                </div>
              </div>
            </div>
            {/* Role Change Details */}
            <div className="pdm-details-section">
              <h6 className="pdm-section-title">Role Change Details</h6>
              <div className="pdm-details-grid">
                <div className="pdm-detail-item">
                  <span className="pdm-detail-label">Current Role:</span>
                  <span className="pdm-detail-value">
                    {promotion.oldRole || "N/A"}
                  </span>
                </div>
                <div className="pdm-detail-item">
                  <span className="pdm-detail-label">New Role:</span>
                  <span className="pdm-detail-value">
                    {promotion.newRole ||
                      promotion.positionName ||
                      promotion.opportunityName ||
                      "N/A"}
                  </span>
                </div>
                <div className="pdm-detail-item">
                  <span className="pdm-detail-label">Promotion Date:</span>
                  <span className="pdm-detail-value">
                    {promotion.promotionDate
                      ? new Date(promotion.promotionDate).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
                <div className="pdm-detail-item">
                  <span className="pdm-detail-label">Status:</span>
                  <span
                    className={`pdm-status-badge ${getStatusBadgeClass(
                      promotion.status
                    )}`}
                  >
                    {promotion.status}
                  </span>
                </div>
              </div>
            </div>
            {/* Justification - Conditional */}
            {promotion.justification && (
              <div className="pdm-details-section">
                <h6 className="pdm-section-title">Justification</h6>
                <p className="pdm-remarks-text">{promotion.justification}</p>
              </div>
            )}
            {/* HR Remarks - Conditional */}
            {promotion.remarks && (
              <div className="pdm-details-section">
                <h6 className="pdm-section-title">HR Remarks</h6>
                <p className="pdm-remarks-text">{promotion.remarks}</p>
              </div>
            )}
            {/* Approval Remarks - Conditional */}
            {promotion.approvalRemarks && (
              <div className="pdm-details-section">
                <h6 className="pdm-section-title">Approval Remarks</h6>
                <p className="pdm-remarks-text">{promotion.approvalRemarks}</p>
              </div>
            )}
            {/* Timeline */}
            <div className="pdm-details-section">
              <h6 className="pdm-section-title">Timeline</h6>
              <div className="pdm-details-grid">
                {promotion.createdAt && (
                  <div className="pdm-detail-item">
                    <span className="pdm-detail-label">Created:</span>
                    <span className="pdm-detail-value">
                      {new Date(promotion.createdAt).toLocaleString()}
                    </span>
                  </div>
                )}
                {promotion.approvedAt && (
                  <div className="pdm-detail-item">
                    <span className="pdm-detail-label">Approved:</span>
                    <span className="pdm-detail-value">
                      {new Date(promotion.approvedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Modal Footer */}
          <div className="pdm-modal-footer">
            <button type="button" className="pdm-btn-close" onClick={onHide}>
              <i className="bi bi-x-circle"></i>
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
const getStatusBadgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case "approved":
      return "approved";
    case "rejected":
      return "rejected";
    case "pending_hr_approval":
    case "pending hr approval":
      return "pending";
    case "pending_leadership_approval":
    case "pending leadership approval":
      return "warning";
    default:
      return "rejected";
  }
};
export default PromotionDetailsModal;
