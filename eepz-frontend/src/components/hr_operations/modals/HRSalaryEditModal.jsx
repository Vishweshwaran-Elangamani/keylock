import React, { useState } from "react";
import { Modal } from "react-bootstrap";
import { toast } from "sonner";
import careerProgressionService from "../../../services/hr_operations/hr/careerProgressionService";
import "../../../styles/hr_operations/hr/HRSalaryEditModal.css";
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
      await careerProgressionService.updateNomination({
        promotionId: nomination.promotionId,
        newSalary: parseFloat(newSalary),
      });
      showToast("Success", "Salary updated successfully", "success");
      onSalaryUpdated();
      handleClose();
    } catch (err) {
      console.error("Error updating salary:", err);
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
  // AUTO-CALCULATE
  const currentSalary = nomination?.oldSalary || 0;
  const proposedNewSalary = parseFloat(newSalary) || 0;
  const increment = proposedNewSalary - currentSalary;
  const incrementPercent =
    currentSalary > 0 ? ((increment / currentSalary) * 100).toFixed(2) : 0;
  return (
    <Modal show={show} onHide={handleClose} size="lg" className="hsem-modal">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-pencil me-2"></i>
          Edit Salary & Finalize Promotion
        </Modal.Title>
      </Modal.Header>
      <form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && (
            <div className="hsem-alert-danger" role="alert">
              <i className="bi bi-exclamation-triangle-fill hsem-alert-icon"></i>
              {error}
            </div>
          )}
          {/* EMPLOYEE DETAILS */}
          <div className="hsem-approval-info">
            <div className="hsem-info-card">
              <label>Employee:</label>
              <span>{nomination?.employeeName}</span>
            </div>
            <div className="hsem-info-card">
              <label>Current Role → New Role:</label>
              <span>
                {nomination?.currentRole} → {nomination?.newRole}
              </span>
            </div>
          </div>
          {/* SALARY COMPARISON */}
          <div className="hsem-approval-info green-bg">
            <div className="hsem-info-card">
              <label>Current Salary:</label>
              <span className="hsem-current-salary">
                {formatCurrency(currentSalary)}
              </span>
            </div>
            <div className="hsem-info-card">
              <label>Originally Proposed Salary:</label>
              <span className="hsem-proposed-salary">
                {formatCurrency(nomination?.newSalary || 0)}
              </span>
            </div>
          </div>
          {/* SALARY EDIT INPUT */}
          <div className="hsem-form-group">
            <label htmlFor="newSalary" className="hsem-form-label">
              Edit New Salary (₹){" "}
              <span className="hsem-required-asterisk">*</span>
            </label>
            <input
              type="number"
              className="hsem-form-input"
              id="newSalary"
              value={newSalary}
              onChange={handleSalaryChange}
              placeholder="Enter final salary"
              step="1000"
              min="0"
              required
            />
            <small className="hsem-form-hint">
              Minimum: {formatCurrency(currentSalary + 1000)} (Must be higher
              than current)
            </small>
          </div>
          {/* AUTO-CALCULATED SUMMARY */}
          <div className="hsem-details-section">
            <h6 className="hsem-details-heading">Auto-Calculated Summary</h6>
            <div className="hsem-details-grid">
              <div className="hsem-detail-item">
                <label>Current Salary:</label>
                <span>{formatCurrency(currentSalary)}</span>
              </div>
              <div className="hsem-detail-item">
                <label>New Salary (Edited):</label>
                <span className="hsem-new-salary-value">
                  {formatCurrency(proposedNewSalary)}
                </span>
              </div>
              <div className="hsem-detail-item">
                <label>Increment Amount:</label>
                <span
                  className={
                    increment > 0
                      ? "hsem-increment-positive"
                      : "hsem-increment-negative"
                  }
                >
                  {increment > 0 ? "+" : ""}
                  {formatCurrency(increment)}
                </span>
              </div>
              <div className="hsem-detail-item">
                <label>Increment %:</label>
                <span className="hsem-increment-percent">
                  {incrementPercent}%
                </span>
              </div>
            </div>
          </div>
          {/* VALIDATION WARNING */}
          {newSalary && parseFloat(newSalary) <= currentSalary && (
            <div className="hsem-validation-warning" role="alert">
              <i className="bi bi-exclamation-triangle-fill hsem-validation-warning-icon"></i>
              <strong>INVALID SALARY!</strong>
              <p className="hsem-validation-warning-text">
                New salary must be higher than current salary (
                {formatCurrency(currentSalary)})
              </p>
            </div>
          )}
          {/* APPROVAL NOTES */}
          <div className="hsem-approval-info blue-bg">
            <div className="hsem-info-card">
              <label>Department Head Approval:</label>
              <span className="hsem-info-card-small">Approved</span>
            </div>
            <div className="hsem-info-card">
              <label>Justification:</label>
              <span className="hsem-info-card-small">
                {nomination?.justification}
              </span>
            </div>
          </div>
          {/* INFO ALERT */}
          <div className="hsem-info-alert" role="alert">
            <i className="bi bi-info-circle hsem-info-icon"></i>
            <strong>HR Instructions:</strong>
            <ol className="hsem-info-list">
              <li>Review the proposed salary from Department Head</li>
              <li>Adjust salary if needed (increment % auto-calculates)</li>
              <li>Once approved, click Submit to send to Leadership</li>
              <li>Leadership will give final approval</li>
              <li>Payroll will be updated automatically</li>
            </ol>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="btn hsem-btn-cancel"
            onClick={handleClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn hsem-btn-submit"
            disabled={
              loading || !newSalary || parseFloat(newSalary) <= currentSalary
            }
          >
            {loading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm hsem-spinner"
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
