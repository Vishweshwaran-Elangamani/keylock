import { useState } from "react";
import "../../../../styles/auth/changerequest/ApproveEmailChangeModal.css";
const ApproveEmailChangeModal = ({
  show,
  request,
  onHide,
  onApprove,
  processing,
}) => {
  const [adminRemarks, setAdminRemarks] = useState("");
  const handleSubmit = () => {
    onApprove(adminRemarks);
  };
  const handleClose = () => {
    setAdminRemarks("");
    onHide();
  };
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  if (!show || !request) return null;
  return (
    <>
      <div className="aecm-backdrop" onClick={handleClose} />
      <div className="aecm-modal-container">
        <div className="aecm-modal-dialog">
          <div className="aecm-modal-header">
            <div className="aecm-header-title">
              <i className="bi bi-check-circle-fill"></i>
              Approve Email Change Request
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={processing}
              aria-label="Close"
              className="aecm-close-button"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          <div className="aecm-modal-body">
            <div className="aecm-details-box">
              <h6 className="aecm-details-title">
                <i className="bi bi-info-circle"></i>
                Request Details
              </h6>
              <div className="aecm-details-content">
                <div className="aecm-detail-row">
                  <span className="aecm-detail-label">Employee:</span>
                  <div className="aecm-detail-value">
                    <strong>{request.employeeName}</strong>
                    <small></small>
                  </div>
                </div>
                <div className="aecm-detail-row">
                  <span className="aecm-detail-label">Current Email:</span>
                  <code className="aecm-email-current">
                    {request.currentValue || "Not set"}
                  </code>
                </div>
                <div className="aecm-detail-row">
                  <span className="aecm-detail-label">New Email:</span>
                  <code className="aecm-email-new">{request.newValue}</code>
                </div>
                <div className="aecm-detail-row">
                  <span className="aecm-detail-label">Requested At:</span>
                  <span className="aecm-date-value">
                    {formatDate(request.requestedAt)}
                  </span>
                </div>
                {request.reason && (
                  <div className="aecm-reason-section">
                    <span className="aecm-reason-label">Employee Reason:</span>
                    <div className="aecm-reason-box">{request.reason}</div>
                  </div>
                )}
              </div>
            </div>
            <div className="aecm-remarks-section">
              <label className="aecm-remarks-label">
                Admin Remarks (Optional)
              </label>
              <textarea
                rows="4"
                value={adminRemarks}
                onChange={(e) => setAdminRemarks(e.target.value)}
                placeholder="Optional: Add remarks for approval (e.g., Email change approved as requested)"
                disabled={processing}
                maxLength={500}
                className="aecm-remarks-textarea"
              />
              <small className="aecm-char-count">
                {adminRemarks.length}/500 characters
              </small>
            </div>
            <div className="aecm-info-alert">
              <i className="bi bi-info-circle aecm-info-icon"></i>
              <div className="aecm-info-content">
                <strong>Note:</strong>
                The email will be updated automatically after approval. The
                employee will be notified via email.
              </div>
            </div>
          </div>
          <div className="aecm-modal-footer">
            <button
              type="button"
              onClick={handleClose}
              disabled={processing}
              className="aecm-btn-cancel"
            >
              <i className="bi bi-x-circle"></i> Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={processing}
              className="aecm-btn-approve"
            >
              {processing ? (
                <>
                  <span className="aecm-spinner" />
                  Processing...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle"></i> Approve
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
export default ApproveEmailChangeModal;
