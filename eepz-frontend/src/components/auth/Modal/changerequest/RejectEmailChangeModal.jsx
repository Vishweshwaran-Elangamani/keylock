import { useState } from "react";
import { toast } from "sonner";
import "../../../../styles/auth/changerequest/RejectEmailChangeModal.css";
const RejectEmailChangeModal = ({
  show,
  request,
  onHide,
  onReject,
  processing,
}) => {
  const [adminRemarks, setAdminRemarks] = useState("");
  const handleSubmit = () => {
    if (!adminRemarks.trim()) {
      toast.error("Please provide remarks for rejection");
      return;
    }
    if (adminRemarks.trim().length < 5) {
      toast.error("Remarks must be at least 5 characters");
      return;
    }
    onReject(adminRemarks);
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
      <div className="recm-backdrop" onClick={handleClose} />
      <div className="recm-modal-container">
        <div className="recm-modal-dialog">
          <div className="recm-modal-header">
            <div className="recm-header-title">
              <i className="bi bi-x-circle-fill"></i>
              Reject Email Change Request
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={processing}
              aria-label="Close"
              className="recm-close-button"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          <div className="recm-modal-body">
            <div className="recm-details-box">
              <h6 className="recm-details-title">
                <i className="bi bi-info-circle"></i>
                Request Details
              </h6>
              <div className="recm-details-content">
                <div className="recm-detail-row">
                  <span className="recm-detail-label">Employee:</span>
                  <div className="recm-detail-value">
                    <strong>{request.employeeName}</strong>
                  </div>
                </div>
                <div className="recm-detail-row">
                  <span className="recm-detail-label">Current Email:</span>
                  <code className="recm-email-current">
                    {request.currentValue || "Not set"}
                  </code>
                </div>
                <div className="recm-detail-row">
                  <span className="recm-detail-label">New Email:</span>
                  <code className="recm-email-new">{request.newValue}</code>
                </div>
                <div className="recm-detail-row">
                  <span className="recm-detail-label">Requested At:</span>
                  <span className="recm-date-value">
                    {formatDate(request.requestedAt)}
                  </span>
                </div>
                {request.reason && (
                  <div className="recm-reason-section">
                    <span className="recm-reason-label">Employee Reason:</span>
                    <div className="recm-reason-box">{request.reason}</div>
                  </div>
                )}
              </div>
            </div>
            <div className="recm-remarks-section">
              <label className="recm-remarks-label">
                Admin Remarks <span className="recm-required-asterisk">*</span>
              </label>
              <textarea
                rows="4"
                value={adminRemarks}
                onChange={(e) => setAdminRemarks(e.target.value)}
                placeholder="Required: Provide detailed reason for rejection"
                disabled={processing}
                maxLength={500}
                className="recm-remarks-textarea"
              />
              <small className="recm-char-count">
                {adminRemarks.length}/500 characters
              </small>
            </div>
            <div className="recm-warning-alert">
              <i className="bi bi-exclamation-triangle-fill recm-warning-icon"></i>
              <div className="recm-warning-content">
                <strong>Warning:</strong>
                Please provide a clear reason for rejection. The employee will
                be able to see your remarks.
              </div>
            </div>
          </div>
          <div className="recm-modal-footer">
            <button
              type="button"
              onClick={handleClose}
              disabled={processing}
              className="recm-btn-cancel"
            >
              <i className="bi bi-x-circle"></i> Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={processing}
              className="recm-btn-reject"
            >
              {processing ? (
                <>
                  <span className="recm-spinner" />
                  Processing...
                </>
              ) : (
                <>
                  <i className="bi bi-x-circle"></i> Reject
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
export default RejectEmailChangeModal;
