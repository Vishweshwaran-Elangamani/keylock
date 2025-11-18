import React, { useState } from "react";
import { Modal } from "react-bootstrap";
import { toast } from "sonner";
import careerProgressionService from "../../../../services/hr_operations/hr/careerProgressionService";

const HRSalaryEditModal = ({ show, nomination, onHide, onSalaryUpdated }) => {
  const [newSalary, setNewSalary] = useState(nomination?.newSalary || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSalaryChange = (e) => {
    setNewSalary(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!newSalary || parseFloat(newSalary) <= 0) {
        setError("Please enter valid salary");
        setLoading(false);
        return;
      }

      if (parseFloat(newSalary) <= (nomination.oldSalary || 0)) {
        setError("New salary must be higher than current salary");
        setLoading(false);
        return;
      }

      console.log(" Updating salary...");
      await careerProgressionService.updateNomination({
        promotionId: nomination.promotionId,
        newSalary: parseFloat(newSalary),
      });

      console.log(" Salary updated");
      showToast("Success", "Salary updated successfully", "success");
      onSalaryUpdated();
      handleClose();
    } catch (err) {
      console.error(" Error updating salary:", err);
      setError(err.message || "Failed to update salary");
      showToast("Error", err.message || "Failed to update salary", "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNewSalary(nomination?.newSalary || "");
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

  //  AUTO-CALCULATE
  const currentSalary = nomination?.oldSalary || 0;
  const proposedNewSalary = parseFloat(newSalary) || 0;
  const increment = proposedNewSalary - currentSalary;
  const incrementPercent =
    currentSalary > 0 ? ((increment / currentSalary) * 100).toFixed(2) : 0;

  return (
    <Modal show={show} onHide={handleClose} size="lg" className="promo-modal">
      <Modal.Header closeButton className="promo-modal-header">
        <Modal.Title>
          <i className="bi bi-pencil me-2"></i>
          Edit Salary & Finalize Promotion
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

          {/*  EMPLOYEE DETAILS */}
          <div className="promo-approval-info">
            <div className="promo-info-card">
              <label>Employee:</label>
              <span>{nomination?.employeeName}</span>
            </div>
            <div className="promo-info-card">
              <label>Current Role → New Role:</label>
              <span>
                {nomination?.currentRole} → {nomination?.newRole}
              </span>
            </div>
          </div>

          {/*  SALARY COMPARISON */}
          <div
            className="promo-approval-info"
            style={{ backgroundColor: "#f0fdf4" }}
          >
            <div className="promo-info-card">
              <label>Current Salary:</label>
              <span style={{ fontWeight: "600", color: "#666" }}>
                {formatCurrency(currentSalary)}
              </span>
            </div>
            <div className="promo-info-card">
              <label>Originally Proposed Salary:</label>
              <span style={{ fontWeight: "600", color: "#27235C" }}>
                {formatCurrency(nomination?.newSalary || 0)}
              </span>
            </div>
          </div>

          {/*  SALARY EDIT INPUT */}
          <div className="mb-3">
            <label htmlFor="newSalary" className="form-label">
              Edit New Salary (₹) <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              className="form-control"
              id="newSalary"
              value={newSalary}
              onChange={handleSalaryChange}
              placeholder="Enter final salary"
              step="1000"
              min="0"
              required
            />
            <small className="form-text text-muted">
              Minimum: {formatCurrency(currentSalary + 1000)} (Must be higher
              than current)
            </small>
          </div>

          {/*  AUTO-CALCULATED SUMMARY */}
          <div
            className="promo-details-section"
            style={{ backgroundColor: "#fef3c7" }}
          >
            <h6 className="promo-details-heading"> Auto-Calculated Summary</h6>
            <div className="promo-details-grid">
              <div className="promo-detail-item">
                <label>Current Salary:</label>
                <span>{formatCurrency(currentSalary)}</span>
              </div>
              <div className="promo-detail-item">
                <label>New Salary (Edited):</label>
                <span style={{ fontWeight: "600", color: "#27235C" }}>
                  {formatCurrency(proposedNewSalary)}
                </span>
              </div>
              <div className="promo-detail-item">
                <label>Increment Amount:</label>
                <span
                  style={{
                    fontWeight: "600",
                    color: increment > 0 ? "#166534" : "#991b1b",
                  }}
                >
                  {increment > 0 ? "+" : ""}
                  {formatCurrency(increment)}
                </span>
              </div>
              <div className="promo-detail-item">
                <label>Increment %:</label>
                <span
                  style={{
                    fontWeight: "600",
                    color: "#0369a1",
                    fontSize: "18px",
                  }}
                >
                  {incrementPercent}%
                </span>
              </div>
            </div>
          </div>

          {/*  VALIDATION WARNING */}
          {newSalary && parseFloat(newSalary) <= currentSalary && (
            <div
              className="alert alert-danger"
              role="alert"
              style={{ marginTop: "16px" }}
            >
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              <strong> INVALID SALARY!</strong>
              <p
                style={{
                  marginTop: "4px",
                  marginBottom: 0,
                  fontSize: "12px",
                }}
              >
                New salary must be higher than current salary (
                {formatCurrency(currentSalary)})
              </p>
            </div>
          )}

          {/*  APPROVAL NOTES */}
          <div
            className="promo-approval-info"
            style={{ backgroundColor: "#e0e7ff", marginTop: "16px" }}
          >
            <div className="promo-info-card">
              <label>Department Head Approval:</label>
              <span style={{ fontSize: "12px" }}> Approved</span>
            </div>
            <div className="promo-info-card">
              <label>Justification:</label>
              <span style={{ fontSize: "12px" }}>
                {nomination?.justification}
              </span>
            </div>
          </div>

          {/*  INFO ALERT */}
          <div
            className="alert alert-info"
            role="alert"
            style={{ marginTop: "16px" }}
          >
            <i className="bi bi-info-circle me-2"></i>
            <strong>HR Instructions:</strong>
            <ol style={{ marginTop: "8px", marginBottom: 0, fontSize: "12px" }}>
              <li>Review the proposed salary from Department Head</li>
              <li>Adjust salary if needed (increment % auto-calculates)</li>
              <li>Once approved, click Submit to send to Leadership</li>
              <li>Leadership will give final approval</li>
              <li>Payroll will be updated automatically</li>
            </ol>
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
          <button
            type="submit"
            className="btn promo-btn-submit"
            disabled={
              loading || !newSalary || parseFloat(newSalary) <= currentSalary
            }
          >
            {loading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                ></span>
                Updating...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>
                Update & Confirm Salary
              </>
            )}
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default HRSalaryEditModal;
