import React, { useState } from "react";
import { Modal } from "react-bootstrap";
import { toast } from "sonner";
import carearProgressionService from "../../../services/hr_operations/hr/careerProgressionService";
import "../../../styles/hr_operations/hr/DeptHeadReviewModal.css";

const DeptHeadReviewModal = ({
  show,
  nomination,
  favoritism,
  onHide,
  onReviewSubmitted,
}) => {
  const [approvalComments, setApprovalComments] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState(""); 
  const [error, setError] = useState(null);

  const handleApprove = async () => {
    setDecision("approve");
    setLoading(true);
    setError(null);

    try {
      await carearProgressionService.approveNomination(
        nomination.promotionId,
        approvalComments
      );
      showToast("Success", "Nomination approved successfully", "success");
      onReviewSubmitted();
      handleClose();
    } catch (err) {
      console.error("Error approving:", err);
      setError(err.message || "Failed to approve nomination");
      showToast("Error", err.message || "Failed to approve", "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError("Please provide rejection reason");
      return;
    }

    setDecision("reject");
    setLoading(true);
    setError(null);

    try {
      await carearProgressionService.rejectNomination(
        nomination.promotionId,
        rejectionReason
      );
      showToast("Success", "Nomination rejected", "success");
      onReviewSubmitted();
      handleClose();
    } catch (err) {
      console.error("Error rejecting:", err);
      setError(err.message || "Failed to reject nomination");
      showToast("Error", err.message || "Failed to reject", "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setApprovalComments("");
    setRejectionReason("");
    setDecision("");
    setError(null);
    onHide();
  };

  const showToast = (title, message, type) => {
    const fullMessage = `${title}: ${message}`;

    switch (type) {
      case "success":
        toast.success(fullMessage);
        break;
      case "danger":
      case "error":
        toast.error(fullMessage);
        break;
      case "warning":
        toast.warning(fullMessage);
        break;
      case "info":
        toast.info(fullMessage);
        break;
      default:
        toast(fullMessage);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // FAVORITISM LOGIC
  const getFavoritismRiskLevel = () => {
    if (!favoritism) return { level: "UNKNOWN", className: "" };

    const riskScore = favoritism.riskScore || 0;

    if (riskScore >= 75) return { level: "HIGH RISK", className: "high-risk" };
    if (riskScore >= 50)
      return { level: "MEDIUM RISK", className: "medium-risk" };
    if (riskScore >= 25) return { level: "LOW RISK", className: "low-risk" };
    return { level: "NO RISK", className: "no-risk" };
  };

  const riskLevel = getFavoritismRiskLevel();
  const increment = (nomination.newSalary || 0) - (nomination.oldSalary || 0);
  const incrementPercent =
    nomination.oldSalary > 0
      ? ((increment / nomination.oldSalary) * 100).toFixed(2)
      : 0;

  return (
    <Modal show={show} onHide={handleClose} size="lg" className="dhrm-modal">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-eye me-2"></i>
          Department Head Review - Promotion Request
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && (
          <div className="dhrm-alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle-fill dhrm-alert-icon"></i>
            {error}
          </div>
        )}

        {/* NOMINATION DETAILS */}
        <div className="dhrm-approval-info">
          <div className="dhrm-info-card">
            <label>Employee:</label>
            <span>{nomination.employeeName}</span>
          </div>
          <div className="dhrm-info-card">
            <label>Current Role:</label>
            <span>{nomination.currentRole}</span>
          </div>
          <div className="dhrm-info-card">
            <label>New Role:</label>
            <span>{nomination.newRole}</span>
          </div>
          <div className="dhrm-info-card">
            <label>Current Salary:</label>
            <span>{formatCurrency(nomination.oldSalary)}</span>
          </div>
        </div>

        {/* FAVORITISM CHECK - CRITICAL */}
        <div className={`dhrm-favoritism-alert ${riskLevel.className}`}>
          <div className="dhrm-favoritism-content">
            <i
              className={`bi bi-shield-exclamation dhrm-favoritism-icon ${riskLevel.className}`}
            ></i>
            <div>
              <strong
                className={`dhrm-favoritism-title ${riskLevel.className}`}
              >
                FAVORITISM CHECK
              </strong>
              <p className="dhrm-favoritism-risk">
                Risk Level:{" "}
                <strong className={`dhrm-risk-level ${riskLevel.className}`}>
                  {riskLevel.level}
                </strong>
              </p>
              {favoritism && favoritism.riskFactors && (
                <small className="dhrm-risk-factors">
                  {favoritism.riskFactors.map((factor, idx) => (
                    <div key={idx} className="dhrm-risk-factor">
                      • {factor}
                    </div>
                  ))}
                </small>
              )}
            </div>
          </div>
        </div>

        {/* PROMOTION DETAILS */}
        <div className="dhrm-details-section">
          <h6 className="dhrm-details-heading">Promotion Details</h6>
          <div className="dhrm-details-grid">
            <div className="dhrm-detail-item">
              <label>Proposed New Salary:</label>
              <span className="dhrm-detail-salary">
                {formatCurrency(nomination.newSalary)}
              </span>
            </div>
            <div className="dhrm-detail-item">
              <label>Salary Increment:</label>
              <span className="dhrm-detail-increment">
                +{formatCurrency(increment)}
              </span>
            </div>
            <div className="dhrm-detail-item">
              <label>Increment %:</label>
              <span className="dhrm-detail-percent">{incrementPercent}%</span>
            </div>
            <div className="dhrm-detail-item">
              <label>Justification:</label>
              <span className="dhrm-detail-justification">
                {nomination.justification}
              </span>
            </div>
          </div>
        </div>

        {/* APPROVAL COMMENTS */}
        {!decision && (
          <div className="dhrm-form-group">
            <label htmlFor="approvalComments" className="dhrm-form-label">
              Approval Comments (Optional)
            </label>
            <textarea
              className="dhrm-textarea"
              id="approvalComments"
              value={approvalComments}
              onChange={(e) => setApprovalComments(e.target.value)}
              placeholder="Add comments if you approve this nomination..."
              rows="3"
            />
          </div>
        )}

        {/* REJECTION REASON */}
        {decision === "reject" && (
          <div className="dhrm-form-group">
            <label htmlFor="rejectionReason" className="dhrm-form-label">
              Rejection Reason <span className="dhrm-required">*</span>
            </label>
            <textarea
              className="dhrm-textarea"
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please provide reason for rejection..."
              rows="3"
              required
            />
          </div>
        )}

        {/* INFO ALERT */}
        <div className="dhrm-info-alert" role="alert">
          <i className="bi bi-info-circle dhrm-info-icon"></i>
          <strong className="dhrm-info-title">Your Role:</strong>
          <p className="dhrm-info-text">
            As Department Head, you review the promotion based on employee
            performance, budget feasibility, and fairness. The favoritism check
            helps ensure fair promotion practices.
          </p>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <button
          type="button"
          className="btn dhrm-btn-cancel"
          onClick={handleClose}
        >
          Cancel
        </button>

        {!decision && (
          <>
            <button
              type="button"
              className="btn dhrm-btn-reject"
              onClick={() => setDecision("reject")}
            >
              <i className="bi bi-x-circle me-2"></i>
              Reject
            </button>
            <button
              type="button"
              className="btn dhrm-btn-approve"
              onClick={handleApprove}
              disabled={loading}
            >
              <i className="bi bi-check-circle me-2"></i>
              Approve
            </button>
          </>
        )}

        {decision === "reject" && (
          <>
            <button
              type="button"
              className="btn dhrm-btn-back"
              onClick={() => setDecision("")}
            >
              Back
            </button>
            <button
              type="button"
              className="btn dhrm-btn-reject"
              onClick={handleReject}
              disabled={loading || !rejectionReason.trim()}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm dhrm-spinner"
                    role="status"
                  ></span>
                  Rejecting...
                </>
              ) : (
                <>
                  <i className="bi bi-x-circle me-2"></i>
                  Confirm Rejection
                </>
              )}
            </button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default DeptHeadReviewModal;
