import React, { useState } from "react";
import { Modal } from "react-bootstrap";
import { toast } from "sonner";
import carearProgressionService from "../../../../services/hr_operations/hr/careerProgressionService";

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
  const [decision, setDecision] = useState(""); // "approve" or "reject"
  const [error, setError] = useState(null);

  const handleApprove = async () => {
    setDecision("approve");
    setLoading(true);
    setError(null);

    try {
      console.log(" Approving nomination...");
      await carearProgressionService.approveNomination(
        nomination.promotionId,
        approvalComments
      );
      console.log(" Nomination approved");
      showToast("Success", "Nomination approved successfully", "success");
      onReviewSubmitted();
      handleClose();
    } catch (err) {
      console.error(" Error approving:", err);
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
      console.log(" Rejecting nomination...");
      await carearProgressionService.rejectNomination(
        nomination.promotionId,
        rejectionReason
      );
      console.log(" Nomination rejected");
      showToast("Success", "Nomination rejected", "success");
      onReviewSubmitted();
      handleClose();
    } catch (err) {
      console.error(" Error rejecting:", err);
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

  //  FAVORITISM LOGIC
  const getFavoritismRiskLevel = () => {
    if (!favoritism) return { level: "UNKNOWN", color: "#6b7280" };

    const riskScore = favoritism.riskScore || 0;

    if (riskScore >= 75) return { level: " HIGH RISK", color: "#ef4444" };
    if (riskScore >= 50) return { level: " MEDIUM RISK", color: "#f59e0b" };
    if (riskScore >= 25) return { level: " LOW RISK", color: "#10b981" };
    return { level: " NO RISK", color: "#06b6d4" };
  };

  const riskLevel = getFavoritismRiskLevel();
  const increment = (nomination.newSalary || 0) - (nomination.oldSalary || 0);
  const incrementPercent =
    nomination.oldSalary > 0
      ? ((increment / nomination.oldSalary) * 100).toFixed(2)
      : 0;

  return (
    <Modal show={show} onHide={handleClose} size="lg" className="promo-modal">
      <Modal.Header closeButton className="promo-modal-header">
        <Modal.Title>
          <i className="bi bi-eye me-2"></i>
          Department Head Review - Promotion Request
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="promo-modal-body">
        {error && (
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}

        {/*  NOMINATION DETAILS */}
        <div className="promo-approval-info">
          <div className="promo-info-card">
            <label>Employee:</label>
            <span>{nomination.employeeName}</span>
          </div>
          <div className="promo-info-card">
            <label>Current Role:</label>
            <span>{nomination.currentRole}</span>
          </div>
          <div className="promo-info-card">
            <label>New Role:</label>
            <span>{nomination.newRole}</span>
          </div>
          <div className="promo-info-card">
            <label>Current Salary:</label>
            <span>{formatCurrency(nomination.oldSalary)}</span>
          </div>
        </div>

        {/*  FAVORITISM CHECK - CRITICAL */}
        <div
          className="alert"
          style={{
            backgroundColor: riskLevel.level.includes("HIGH")
              ? "#fee2e2"
              : riskLevel.level.includes("MEDIUM")
              ? "#fef3c7"
              : "#d1fae5",
            borderColor: riskLevel.color,
            borderWidth: "2px",
            borderStyle: "solid",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <i
              className="bi bi-shield-exclamation"
              style={{ fontSize: "24px", color: riskLevel.color }}
            ></i>
            <div>
              <strong style={{ color: riskLevel.color }}>
                FAVORITISM CHECK
              </strong>
              <p style={{ marginTop: "4px", marginBottom: 0 }}>
                Risk Level:{" "}
                <strong style={{ color: riskLevel.color }}>
                  {riskLevel.level}
                </strong>
              </p>
              {favoritism && favoritism.riskFactors && (
                <small style={{ display: "block", marginTop: "8px" }}>
                  {favoritism.riskFactors.map((factor, idx) => (
                    <div key={idx}>• {factor}</div>
                  ))}
                </small>
              )}
            </div>
          </div>
        </div>

        {/*  PROMOTION DETAILS */}
        <div
          className="promo-details-section"
          style={{ backgroundColor: "#f0fdf4" }}
        >
          <h6 className="promo-details-heading"> Promotion Details</h6>
          <div className="promo-details-grid">
            <div className="promo-detail-item">
              <label>Proposed New Salary:</label>
              <span style={{ fontWeight: "600", color: "#27235C" }}>
                {formatCurrency(nomination.newSalary)}
              </span>
            </div>
            <div className="promo-detail-item">
              <label>Salary Increment:</label>
              <span style={{ fontWeight: "600", color: "#166534" }}>
                +{formatCurrency(increment)}
              </span>
            </div>
            <div className="promo-detail-item">
              <label>Increment %:</label>
              <span style={{ fontWeight: "600", color: "#0369a1" }}>
                {incrementPercent}%
              </span>
            </div>
            <div className="promo-detail-item">
              <label>Justification:</label>
              <span style={{ fontSize: "12px" }}>
                {nomination.justification}
              </span>
            </div>
          </div>
        </div>

        {/*  APPROVAL COMMENTS */}
        {!decision && (
          <div className="mb-3">
            <label htmlFor="approvalComments" className="form-label">
              Approval Comments (Optional)
            </label>
            <textarea
              className="form-control promo-textarea-full"
              id="approvalComments"
              value={approvalComments}
              onChange={(e) => setApprovalComments(e.target.value)}
              placeholder="Add comments if you approve this nomination..."
              rows="3"
            />
          </div>
        )}

        {/*  REJECTION REASON */}
        {decision === "reject" && (
          <div className="mb-3">
            <label htmlFor="rejectionReason" className="form-label">
              Rejection Reason <span className="text-danger">*</span>
            </label>
            <textarea
              className="form-control promo-textarea-full"
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please provide reason for rejection..."
              rows="3"
              required
            />
          </div>
        )}

        {/*  INFO ALERT */}
        <div className="alert alert-info" role="alert">
          <i className="bi bi-info-circle me-2"></i>
          <strong>Your Role:</strong>
          <p style={{ marginTop: "8px", marginBottom: 0, fontSize: "12px" }}>
            As Department Head, you review the promotion based on employee
            performance, budget feasibility, and fairness. The favoritism check
            helps ensure fair promotion practices.
          </p>
        </div>
      </Modal.Body>

      <Modal.Footer className="promo-modal-footer">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleClose}
        >
          Cancel
        </button>

        {!decision && (
          <>
            <button
              type="button"
              className="btn"
              style={{
                backgroundColor: "#ef4444",
                color: "white",
                border: "none",
              }}
              onClick={() => setDecision("reject")}
            >
              <i className="bi bi-x-circle me-2"></i>
              Reject
            </button>
            <button
              type="button"
              className="btn promo-btn-submit"
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
              className="btn btn-secondary"
              onClick={() => setDecision("")}
            >
              Back
            </button>
            <button
              type="button"
              className="btn"
              style={{
                backgroundColor: "#ef4444",
                color: "white",
                border: "none",
              }}
              onClick={handleReject}
              disabled={loading || !rejectionReason.trim()}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
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
