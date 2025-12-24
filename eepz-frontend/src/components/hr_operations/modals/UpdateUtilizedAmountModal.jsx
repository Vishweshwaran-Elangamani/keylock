import React, { useState, useEffect } from "react";
import { Modal } from "react-bootstrap";
import budgetAllocationService from "../../../services/hr_operations/hr/budgetAllocationService";
import { formatCurrency } from "../../../utils/auth/currencyFormatter";
import "../../../styles/hr_operations/hr/UpdateUtilizedAmountModal.css";

const UpdateUtilizedAmountModal = ({
  show,
  budget,
  onHide,
  onUtilizedUpdated,
}) => {
  const [formData, setFormData] = useState({
    budgetId: "",
    utilizedAmount: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allocations, setAllocations] = useState([]);

  useEffect(() => {
    if (show && budget) {
      setFormData({
        budgetId: budget.budgetId,
        utilizedAmount: budget.utilizedAmount || 0,
      });
      fetchAllocations();
      setError(null);
    }
  }, [show, budget]);

  const fetchAllocations = async () => {
    try {
      const response =
        await budgetAllocationService.getBudgetAllocationsByBudget(
          budget.budgetId
        );
      setAllocations(response.data || []);
    } catch (err) {
      console.error("Error fetching allocations:", err);
    }
  };

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
      // VALIDATIONS
      if (!formData.utilizedAmount || parseFloat(formData.utilizedAmount) < 0) {
        setError("Utilized amount must be zero or greater");
        setLoading(false);
        return;
      }

      const utilizedAmount = parseFloat(formData.utilizedAmount);
      const allocatedAmount = budget.allocatedAmount || 0;

      // Validate: cannot exceed allocated amount
      if (utilizedAmount > allocatedAmount) {
        setError(
          `Utilized amount (₹${utilizedAmount.toLocaleString(
            "en-IN"
          )}) cannot exceed allocated budget (₹${allocatedAmount.toLocaleString(
            "en-IN"
          )})`
        );
        setLoading(false);
        return;
      }

      await budgetAllocationService.updateUtilizedAmount({
        budgetId: formData.budgetId,
        utilizedAmount: utilizedAmount,
      });
      onUtilizedUpdated();
      handleClose();
    } catch (err) {
      console.error("Error updating utilized amount:", err);
      setError(err.message || "Failed to update utilized amount");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onHide();
  };

  const getTotalAllocations = () => {
    return allocations.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);
  };

  const utilizationPercentage =
    budget.allocatedAmount > 0
      ? (
          (parseFloat(formData.utilizedAmount) / budget.allocatedAmount) *
          100
        ).toFixed(2)
      : 0;

  const remainingBudget =
    (budget.allocatedAmount || 0) - (parseFloat(formData.utilizedAmount) || 0);

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return "critical";
    if (percentage >= 75) return "warning";
    if (percentage >= 50) return "good";
    return "normal";
  };

  const progressColorClass = getProgressColor(utilizationPercentage);

  return (
    <Modal show={show} onHide={handleClose} size="lg" className="uuam-modal">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-pencil me-2"></i>
          Update Utilized Amount
        </Modal.Title>
      </Modal.Header>

      <form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error}
            </div>
          )}

          {/* BUDGET INFO */}
          <div className="uuam-budget-info">
            <div className="uuam-info-card">
              <label>Department:</label>
              <span>{budget?.departmentName || "Unknown"}</span>
            </div>
            <div className="uuam-info-card">
              <label>Fiscal Year:</label>
              <span>{budget?.fiscalYear}</span>
            </div>
            <div className="uuam-info-card">
              <label>Total Budget:</label>
              <span>{formatCurrency(budget?.totalBudget)}</span>
            </div>
            <div className="uuam-info-card">
              <label>Allocated Amount:</label>
              <span>{formatCurrency(budget?.allocatedAmount)}</span>
            </div>
          </div>

          {/* CURRENT vs NEW */}
          <div className="uuam-form-grid">
            <div>
              <div className="mb-3">
                <label htmlFor="currentUtilized" className="form-label">
                  Current Utilized Amount
                </label>
                <div className="uuam-current-value">
                  {formatCurrency(budget?.utilizedAmount)}
                </div>
              </div>
            </div>

            <div>
              <div className="mb-3">
                <label htmlFor="utilizedAmount" className="form-label">
                  New Utilized Amount (₹) <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  className="form-control"
                  id="utilizedAmount"
                  name="utilizedAmount"
                  value={formData.utilizedAmount}
                  onChange={handleChange}
                  placeholder="Enter utilized amount"
                  step="0.01"
                  min="0"
                  required
                />
                <small className="form-text text-muted">
                  Cannot exceed allocated:{" "}
                  {formatCurrency(budget?.allocatedAmount)}
                </small>
              </div>
            </div>
          </div>

          {/* ALLOCATIONS BREAKDOWN */}
          {allocations.length > 0 && (
            <div className="uuam-details-section">
              <h6 className="uuam-details-heading">
                <i className="bi bi-list-ul"></i>
                Allocations Breakdown
              </h6>
              <div className="uuam-table-container">
                <table className="uuam-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Name</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allocations.map((alloc) => (
                      <tr key={alloc.allocationId}>
                        <td>
                          <span className="uuam-type-badge">
                            {alloc.allocationType}
                          </span>
                        </td>
                        <td>{alloc.allocationName}</td>
                        <td>
                          <strong>{formatCurrency(alloc.amount)}</strong>
                        </td>
                        <td>
                          <span
                            className={`uuam-status-text ${
                              alloc.goalStatus === "Approved"
                                ? "approved"
                                : "other"
                            }`}
                          >
                            {alloc.goalStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="uuam-total-allocations">
                <strong>Total Allocations:</strong>{" "}
                {formatCurrency(getTotalAllocations())}
              </div>
            </div>
          )}

          {/* UTILIZATION SUMMARY */}
          <div className="uuam-details-section summary">
            <h6 className="uuam-details-heading">
              <i className="bi bi-graph-up"></i>
              Utilization Summary
            </h6>
            <div className="uuam-summary-grid">
              <div className="uuam-summary-item">
                <label>Allocated Budget:</label>
                <span>{formatCurrency(budget?.allocatedAmount)}</span>
              </div>
              <div className="uuam-summary-item">
                <label>To Be Utilized:</label>
                <span className="utilized">
                  {formatCurrency(formData.utilizedAmount)}
                </span>
              </div>
              <div className="uuam-summary-item">
                <label>Remaining:</label>
                <span
                  className={
                    remainingBudget >= 0
                      ? "remaining-positive"
                      : "remaining-negative"
                  }
                >
                  {formatCurrency(remainingBudget)}
                </span>
              </div>
              <div className="uuam-summary-item">
                <label>Utilization %:</label>
                <span
                  className="percentage"
                  style={{
                    color:
                      progressColorClass === "critical"
                        ? "#ef4444"
                        : progressColorClass === "warning"
                        ? "#f59e0b"
                        : progressColorClass === "good"
                        ? "#10b981"
                        : "#3b82f6",
                  }}
                >
                  {utilizationPercentage}%
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="uuam-progress-container">
              <div className="uuam-progress-bar">
                <div
                  className={`uuam-progress-fill ${progressColorClass}`}
                  style={{
                    width: `${Math.min(utilizationPercentage, 100)}%`,
                  }}
                >
                  {utilizationPercentage > 10 && `${utilizationPercentage}%`}
                </div>
              </div>
            </div>
          </div>

          {/* VALIDATION WARNING */}
          {parseFloat(formData.utilizedAmount) >
            (budget?.allocatedAmount || 0) && (
            <div
              className="alert alert-danger uuam-exceeded-alert"
              role="alert"
            >
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              <strong>EXCEEDED BUDGET!</strong>
              <p>
                Utilized amount (₹
                {parseFloat(formData.utilizedAmount).toLocaleString("en-IN")})
                exceeds allocated budget (₹
                {(budget?.allocatedAmount || 0).toLocaleString("en-IN")})
              </p>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn uuam-btn-submit"
            disabled={
              loading ||
              parseFloat(formData.utilizedAmount) >
                (budget?.allocatedAmount || 0)
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
                Update Utilized Amount
              </>
            )}
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default UpdateUtilizedAmountModal;
