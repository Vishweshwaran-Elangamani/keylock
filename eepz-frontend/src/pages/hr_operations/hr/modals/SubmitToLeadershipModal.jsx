import React, { useState, useEffect } from "react";
import { Modal } from "react-bootstrap";
import { toast } from "sonner";
import careerProgressionService from "../../../../services/hr_operations/hr/careerProgressionService";
import { formatCurrency } from "../../../../utils/auth/currencyFormatter";
import "../../../../styles/hr_operations/hr/submitToLeadershipModal.css";

const SubmitToLeadershipModal = ({ show, nomination, onHide, onSubmitted }) => {
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (show && nomination) {
      setSubmissionNotes("");
      setError(null);
    }
  }, [show, nomination]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log("Submitting to leadership...");
      await careerProgressionService.submitToLeadership(nomination.promotionId);

      console.log("Submitted to leadership");
      showToast(
        "Success",
        "Promotion submitted to leadership successfully",
        "success"
      );
      onSubmitted();
      handleClose();
    } catch (err) {
      console.error("Error submitting:", err);
      setError(err.message || "Failed to submit");
      showToast("Error", err.message || "Failed to submit", "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSubmissionNotes("");
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

  const increment = (nomination?.newSalary || 0) - (nomination?.oldSalary || 0);
  const incrementPercent =
    nomination?.oldSalary > 0
      ? ((increment / nomination.oldSalary) * 100).toFixed(2)
      : 0;

  const employeeFullName =
    `${nomination?.employeeFirstName || ""} ${
      nomination?.employeeLastName || ""
    }`.trim() ||
    nomination?.employeeEmail ||
    "N/A";

  return (
    <Modal show={show} onHide={handleClose} size="lg" className="promo-modal">
      <Modal.Header closeButton className="promo-modal-header">
        <Modal.Title>
          <i className="bi bi-arrow-right"></i>
          Submit to Leadership for Final Approval
        </Modal.Title>
      </Modal.Header>

      <form onSubmit={handleSubmit}>
        <Modal.Body className="promo-modal-body">
          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error}
            </div>
          )}

          <div className="promo-approval-info">
            <div className="promo-info-card">
              <label>Employee Name:</label>
              <span>
                <strong>{employeeFullName}</strong>
              </span>
            </div>
            <div className="promo-info-card">
              <label>Email:</label>
              <span>{nomination?.employeeEmail || "N/A"}</span>
            </div>
            <div className="promo-info-card">
              <label>Department:</label>
              <span>{nomination?.departmentName || "N/A"}</span>
            </div>
            <div className="promo-info-card">
              <label>Current Role:</label>
              <span>{nomination?.oldRole || "N/A"}</span>
            </div>
            <div className="promo-info-card">
              <label>New Role:</label>
              <span>
                <strong>{nomination?.newRole || "N/A"}</strong>
              </span>
            </div>
            <div className="promo-info-card">
              <label>New Salary:</label>
              <span style={{ fontWeight: "600", color: "#27235C" }}>
                {formatCurrency(nomination?.newSalary)}
              </span>
            </div>
          </div>

          <div
            className="promo-details-section"
            style={{ backgroundColor: "#dbeafe" }}
          >
            <h6 className="promo-details-heading">Approval Chain</h6>
            <div className="approval-chain-container">
              <div className="approval-chain-step">
                <i className="bi bi-check-circle approval-chain-icon approved"></i>
                <p className="approval-chain-title">Manager</p>
                <p className="approval-chain-status">Nominated</p>
              </div>
              <div className="approval-chain-line approved"></div>

              <div className="approval-chain-step">
                <i className="bi bi-check-circle approval-chain-icon approved"></i>
                <p className="approval-chain-title">Dept Head</p>
                <p className="approval-chain-status">Approved</p>
              </div>
              <div className="approval-chain-line approved"></div>

              <div className="approval-chain-step">
                <i className="bi bi-check-circle approval-chain-icon approved"></i>
                <p className="approval-chain-title">HR</p>
                <p className="approval-chain-status">Submitted</p>
              </div>
            </div>
          </div>

          <div
            className="promo-details-section"
            style={{ backgroundColor: "#f0fdf4", marginTop: "16px" }}
          >
            <h6 className="promo-details-heading">Financial Impact</h6>
            <div className="promo-details-grid">
              <div className="promo-detail-item">
                <label>Current Salary:</label>
                <span>{formatCurrency(nomination?.oldSalary)}</span>
              </div>
              <div className="promo-detail-item">
                <label>New Salary:</label>
                <span style={{ fontWeight: "600", color: "#27235C" }}>
                  {formatCurrency(nomination?.newSalary)}
                </span>
              </div>
              <div className="promo-detail-item">
                <label>Annual Increment:</label>
                <span style={{ fontWeight: "600", color: "#166534" }}>
                  +{formatCurrency(increment)}
                </span>
              </div>
              <div className="promo-detail-item">
                <label>Increment %:</label>
                <span
                  style={{
                    fontWeight: "600",
                    color: "#0369a1",
                    fontSize: "16px",
                  }}
                >
                  {incrementPercent}%
                </span>
              </div>
            </div>
          </div>

          <div className="mb-3" style={{ marginTop: "16px" }}>
            <label htmlFor="submissionNotes" className="form-label">
              Submission Notes (Optional)
            </label>
            <textarea
              className="form-control promo-textarea-full"
              id="submissionNotes"
              value={submissionNotes}
              onChange={(e) => setSubmissionNotes(e.target.value)}
              placeholder="Add any additional notes for Leadership review..."
              rows="3"
            />
          </div>
        </Modal.Body>

        <Modal.Footer className="promo-modal-footer">
          <div className="promo-footer-content">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn promo-btn-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                  ></span>
                  Submitting...
                </>
              ) : (
                <>
                  <i className="bi bi-arrow-right me-2"></i>
                  Submit to Leadership
                </>
              )}
            </button>
          </div>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default SubmitToLeadershipModal;
