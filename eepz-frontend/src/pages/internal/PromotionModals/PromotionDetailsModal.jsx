import "../../../styles/internal/NominationModal.css";

const PromotionDetailsModal = ({ show, onHide, promotion }) => {
  if (!show) return null;

  return (
    <>
      <div className="modal-backdrop-custom"></div>
      <div className="modal-wrapper-custom">
        <div className="modal-dialog-custom modal-dialog-large">
          <div className="modal-content-custom">
            <div className="modal-header-custom">
              <h5 className="modal-title-custom">
                <i className="bi bi-info-circle"></i>
                Promotion Details
              </h5>
              <button
                type="button"
                className="modal-close-btn"
                onClick={onHide}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="modal-body-custom">
              <div className="details-section">
                <h6 className="section-title">Employee Information</h6>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Employee Name:</span>
                    <span className="detail-value">{promotion.employeeName || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Department:</span>
                    <span className="detail-value">{promotion.departmentName || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="details-section">
                <h6 className="section-title">Role Change Details</h6>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Current Role:</span>
                    <span className="detail-value">{promotion.oldRole || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">New Role:</span>
                    <span className="detail-value">
                      {promotion.newRole || promotion.positionName || promotion.opportunityName || 'N/A'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Promotion Date:</span>
                    <span className="detail-value">
                      {promotion.promotionDate
                        ? new Date(promotion.promotionDate).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Status:</span>
                    <span className={`status-badge ${getStatusBadgeClass(promotion.status)}`}>
                      {promotion.status}
                    </span>
                  </div>
                </div>
              </div>

              {promotion.justification && (
                <div className="details-section">
                  <h6 className="section-title">Justification</h6>
                  <p className="remarks-text">{promotion.justification}</p>
                </div>
              )}

              {promotion.remarks && (
                <div className="details-section">
                  <h6 className="section-title">HR Remarks</h6>
                  <p className="remarks-text">{promotion.remarks}</p>
                </div>
              )}

              {promotion.approvalRemarks && (
                <div className="details-section">
                  <h6 className="section-title">Approval Remarks</h6>
                  <p className="remarks-text">{promotion.approvalRemarks}</p>
                </div>
              )}

              <div className="details-section">
                <h6 className="section-title">Timeline</h6>
                <div className="details-grid">
                  {promotion.createdAt && (
                    <div className="detail-item">
                      <span className="detail-label">Created:</span>
                      <span className="detail-value">
                        {new Date(promotion.createdAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {promotion.approvedAt && (
                    <div className="detail-item">
                      <span className="detail-label">Approved:</span>
                      <span className="detail-value">
                        {new Date(promotion.approvedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer-custom">
              <button type="button" className="btn-cancel" onClick={onHide}>
                <i className="bi bi-x-circle"></i>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const getStatusBadgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case "approved":
      return "status-active";
    case "rejected":
      return "status-inactive";
    case "pending_hr_approval":
    case "pending hr approval":
      return "status-pending";
    case "pending_leadership_approval":
    case "pending leadership approval":
      return "status-warning";
    default:
      return "status-inactive";
  }
};

export default PromotionDetailsModal;
