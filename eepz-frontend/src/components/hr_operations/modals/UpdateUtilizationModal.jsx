import React, { useState } from "react";
import budgetAllocationService from "../../../services/hr_operations/hr/budgetAllocationService";
import { formatCurrency } from "../../../utils/auth/currencyFormatter";
import "../../../styles/hr_operations/hr/UpdateUtilizationModal.css";
const UpdateUtilizationModal = ({
  show,
  allocation,
  onHide,
  onUtilizationUpdated,
}) => {
  const [formData, setFormData] = useState({
    utilizedAmount: allocation?.utilizedAmount || 0,
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const currentUserId = parseInt(localStorage.getItem("userId"));
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const utilizedAmount = parseFloat(formData.utilizedAmount);
      if (isNaN(utilizedAmount) || utilizedAmount < 0) {
        setError("Utilized amount must be zero or greater");
        setLoading(false);
        return;
      }
      if (utilizedAmount > (allocation.amount || 0)) {
        setError(
          `Utilized amount (Rs.${utilizedAmount.toLocaleString(
            "en-IN"
          )}) cannot exceed allocated amount (Rs.${(
            allocation.amount || 0
          ).toLocaleString("en-IN")})`
        );
        setLoading(false);
        return;
      }
      const utilizationPercentage = Math.round(
        (utilizedAmount / (allocation.amount || 1)) * 100
      );
      await budgetAllocationService.updateUtilization({
        allocationId: allocation.allocationId,
        utilizedAmount: utilizedAmount,
        utilizationPercentage: utilizationPercentage,
        notes: formData.notes,
        updatedByUserId: currentUserId,
      });
      onUtilizationUpdated({
        ...allocation,
        utilizedAmount: utilizedAmount,
        utilizationPercentage: utilizationPercentage,
      });
      handleClose();
    } catch (err) {
      console.error("Error updating utilization:", err);
      setError(err.message || "Failed to update utilization");
    } finally {
      setLoading(false);
    }
  };
  const handleClose = () => {
    setFormData({
      utilizedAmount: allocation?.utilizedAmount || 0,
      notes: "",
    });
    setError(null);
    onHide();
  };
  const currentUtilizedAmount = parseFloat(formData.utilizedAmount) || 0;
  const currentUtilizationPercentage = Math.round(
    (currentUtilizedAmount / (allocation?.amount || 1)) * 100
  );
  const remainingAmount = (allocation?.amount || 0) - currentUtilizedAmount;
  const getUtilizationClass = (percentage) => {
    if (percentage >= 100) return "critical";
    if (percentage >= 75) return "warning";
    if (percentage >= 50) return "good";
    return "normal";
  };
  const utilizationClass = getUtilizationClass(currentUtilizationPercentage);
  if (!show) return null;
  return (
    <>
      <div className="uum-backdrop" onClick={handleClose} />
      <div className="uum-modal-container">
        <div className="uum-modal-dialog">
          {/* HEADER - Fixed */}
          <div className="uum-modal-header">
            <div className="uum-header-title">
              <i className="bi bi-pencil-square"></i>
              Update Utilization
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              aria-label="Close"
              className="uum-close-button"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          {/* BODY - Scrollable */}
          <form onSubmit={handleSubmit} className="uum-form">
            <div className="uum-modal-body">
              {error && (
                <div className="uum-error-alert">
                  <i className="bi bi-exclamation-triangle-fill uum-error-icon"></i>
                  {error}
                </div>
              )}
              {/* Allocation Info Grid */}
              <div className="uum-allocation-info">
                <div className="uum-info-item">
                  <label className="uum-info-label">Allocation Name:</label>
                  <span className="uum-info-value">
                    {allocation?.allocationName}
                  </span>
                </div>
                <div className="uum-info-item">
                  <label className="uum-info-label">Type:</label>
                  <span className="uum-info-value type">
                    {allocation?.allocationType}
                  </span>
                </div>
                <div className="uum-info-item">
                  <label className="uum-info-label">Allocated Amount:</label>
                  <span className="uum-info-value">
                    {formatCurrency(allocation?.amount)}
                  </span>
                </div>
                <div className="uum-info-item">
                  <label className="uum-info-label">Current Utilization:</label>
                  <span className="uum-info-value current-utilization">
                    {formatCurrency(allocation?.utilizedAmount || 0)} (
                    {allocation?.utilizationPercentage || 0}%)
                  </span>
                </div>
              </div>
              {/* Utilized Amount Input */}
              <div className="uum-form-group">
                <label htmlFor="utilizedAmount" className="uum-form-label">
                  Utilized Amount (Rs.){" "}
                  <span className="uum-required-asterisk">*</span>
                </label>
                <input
                  type="number"
                  id="utilizedAmount"
                  name="utilizedAmount"
                  value={formData.utilizedAmount}
                  onChange={handleChange}
                  placeholder="Enter utilized amount"
                  step="0.01"
                  min="0"
                  max={allocation?.amount || 0}
                  required
                  className="uum-form-input"
                />
                <small className="uum-form-hint">
                  Maximum: {formatCurrency(allocation?.amount)} (100%)
                </small>
              </div>
              {/* Notes Textarea */}
              <div className="uum-form-group notes">
                <label htmlFor="notes" className="uum-form-label-block">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Add notes about this utilization update"
                  rows="3"
                  className="uum-form-input uum-form-textarea"
                />
              </div>
              {/* Utilization Summary Section */}
              <div className={`uum-summary-section ${utilizationClass}`}>
                <h6 className="uum-summary-heading">Utilization Summary</h6>
                {/* Summary Grid */}
                <div className="uum-summary-grid">
                  <div className="uum-summary-item">
                    <label className="uum-summary-label">
                      Allocated Amount:
                    </label>
                    <span className="uum-summary-value">
                      {formatCurrency(allocation?.amount)}
                    </span>
                  </div>
                  <div className="uum-summary-item">
                    <label className="uum-summary-label">
                      Utilized Amount:
                    </label>
                    <span className="uum-summary-value utilized">
                      {formatCurrency(currentUtilizedAmount)}
                    </span>
                  </div>
                  <div className="uum-summary-item">
                    <label className="uum-summary-label">Utilization %:</label>
                    <span
                      className={`uum-summary-value percentage ${utilizationClass}`}
                    >
                      {currentUtilizationPercentage}%
                    </span>
                  </div>
                  <div className="uum-summary-item">
                    <label className="uum-summary-label">Remaining:</label>
                    <span
                      className={`uum-summary-value remaining ${
                        remainingAmount >= 0 ? "positive" : "negative"
                      }`}
                    >
                      {formatCurrency(remainingAmount)}
                    </span>
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="uum-progress-container">
                  <div className="uum-progress-bar">
                    <div
                      className={`uum-progress-fill ${utilizationClass}`}
                      style={{
                        width: `${Math.min(
                          currentUtilizationPercentage,
                          100
                        )}%`,
                      }}
                    ></div>
                    <span className="uum-progress-text">
                      {currentUtilizationPercentage}%
                    </span>
                  </div>
                </div>
              </div>
              {/* Exceeded Warning */}
              {currentUtilizedAmount > (allocation?.amount || 0) && (
                <div className="uum-exceeded-warning">
                  <div className="uum-exceeded-header">
                    <i className="bi bi-exclamation-triangle-fill uum-exceeded-icon"></i>
                    <strong>UTILIZED AMOUNT EXCEEDS ALLOCATION!</strong>
                  </div>
                  <p className="uum-exceeded-text">
                    Utilized amount (Rs.
                    {currentUtilizedAmount.toLocaleString("en-IN")}) exceeds
                    allocated amount (Rs.
                    {(allocation?.amount || 0).toLocaleString("en-IN")})
                  </p>
                </div>
              )}
            </div>
            {/* FOOTER - Fixed */}
            <div className="uum-modal-footer">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="uum-btn-cancel"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  loading || currentUtilizedAmount > (allocation?.amount || 0)
                }
                className="uum-btn-submit"
              >
                {loading ? (
                  <>
                    <span className="uum-spinner" />
                    Updating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle"></i>
                    Update Utilization
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
export default UpdateUtilizationModal;
