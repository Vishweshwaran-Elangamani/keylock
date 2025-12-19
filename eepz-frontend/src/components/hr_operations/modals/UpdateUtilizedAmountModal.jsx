import React, { useState, useEffect } from "react";
import { Modal } from "react-bootstrap";
import budgetAllocationService from "../../../services/hr_operations/hr/budgetAllocationService";
import { formatCurrency } from "../../../utils/auth/currencyFormatter";

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
      console.error(" Error fetching allocations:", err);
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
      //  VALIDATIONS
      if (!formData.utilizedAmount || parseFloat(formData.utilizedAmount) < 0) {
        setError("Utilized amount must be zero or greater");
        setLoading(false);
        return;
      }

      const utilizedAmount = parseFloat(formData.utilizedAmount);
      const allocatedAmount = budget.allocatedAmount || 0;

      //  Validate: cannot exceed allocated amount
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
      console.error(" Error updating utilized amount:", err);
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
    if (percentage >= 90) return "#ef4444";
    if (percentage >= 75) return "#f59e0b";
    if (percentage >= 50) return "#10b981";
    return "#3b82f6";
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" className="promo-modal">
      <Modal.Header closeButton className="promo-modal-header">
        <Modal.Title>
          <i className="bi bi-pencil me-2"></i>
          Update Utilized Amount
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

          {/*  BUDGET INFO */}
          <div className="promo-approval-info">
            <div className="promo-info-card">
              <label>Department:</label>
              <span>{budget?.departmentName || "Unknown"}</span>
            </div>
            <div className="promo-info-card">
              <label>Fiscal Year:</label>
              <span>{budget?.fiscalYear}</span>
            </div>
            <div className="promo-info-card">
              <label>Total Budget:</label>
              <span>{formatCurrency(budget?.totalBudget)}</span>
            </div>
            <div className="promo-info-card">
              <label>Allocated Amount:</label>
              <span>{formatCurrency(budget?.allocatedAmount)}</span>
            </div>
          </div>

          {/*  CURRENT vs NEW */}
          <div className="promo-form-grid">
            <div className="promo-form-column">
              <div className="mb-3">
                <label htmlFor="currentUtilized" className="form-label">
                  Current Utilized Amount
                </label>
                <div
                  style={{
                    padding: "10px 12px",
                    backgroundColor: "#f0f0f0",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#1e293b",
                  }}
                >
                  {formatCurrency(budget?.utilizedAmount)}
                </div>
              </div>
            </div>

            <div className="promo-form-column">
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

          {/*  ALLOCATIONS BREAKDOWN */}
          {allocations.length > 0 && (
            <div className="promo-details-section">
              <h6 className="promo-details-heading"> Allocations Breakdown</h6>
              <div
                style={{
                  overflowX: "auto",
                  maxHeight: "200px",
                  overflowY: "auto",
                }}
              >
                <table
                  className="promo-table"
                  style={{
                    marginBottom: 0,
                    fontSize: "12px",
                  }}
                >
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
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px 6px",
                              borderRadius: "3px",
                              fontSize: "10px",
                              fontWeight: "600",
                              backgroundColor: "#dbeafe",
                              color: "#0c4a6e",
                            }}
                          >
                            {alloc.allocationType}
                          </span>
                        </td>
                        <td>{alloc.allocationName}</td>
                        <td>
                          <strong>{formatCurrency(alloc.amount)}</strong>
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: "600",
                              color:
                                alloc.goalStatus === "Approved"
                                  ? "#166534"
                                  : "#92400e",
                            }}
                          >
                            {alloc.goalStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div
                style={{
                  padding: "8px 12px",
                  backgroundColor: "#f8fafc",
                  borderLeft: "4px solid #27235C",
                  marginTop: "8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: "600",
                }}
              >
                <strong>Total Allocations:</strong>{" "}
                {formatCurrency(getTotalAllocations())}
              </div>
            </div>
          )}

          {/*  UTILIZATION SUMMARY */}
          <div
            className="promo-details-section"
            style={{ backgroundColor: "#f0fdf4" }}
          >
            <h6 className="promo-details-heading"> Utilization Summary</h6>
            <div className="promo-details-grid">
              <div className="promo-detail-item">
                <label>Allocated Budget:</label>
                <span>{formatCurrency(budget?.allocatedAmount)}</span>
              </div>
              <div className="promo-detail-item">
                <label>To Be Utilized:</label>
                <span style={{ fontWeight: "600", color: "#27235C" }}>
                  {formatCurrency(formData.utilizedAmount)}
                </span>
              </div>
              <div className="promo-detail-item">
                <label>Remaining:</label>
                <span
                  style={{
                    fontWeight: "600",
                    color: remainingBudget >= 0 ? "#166534" : "#991b1b",
                  }}
                >
                  {formatCurrency(remainingBudget)}
                </span>
              </div>
              <div className="promo-detail-item">
                <label>Utilization %:</label>
                <span
                  style={{
                    fontWeight: "600",
                    color: getProgressColor(utilizationPercentage),
                  }}
                >
                  {utilizationPercentage}%
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div
              style={{
                marginTop: "12px",
                backgroundColor: "#ffffff",
                borderRadius: "6px",
                padding: "8px",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "24px",
                  backgroundColor: "#e2e8f0",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${Math.min(utilizationPercentage, 100)}%`,
                    height: "100%",
                    backgroundColor: getProgressColor(utilizationPercentage),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: "600",
                    color: "#ffffff",
                  }}
                >
                  {utilizationPercentage > 10 && `${utilizationPercentage}%`}
                </div>
              </div>
            </div>
          </div>

          {/*  VALIDATION WARNING */}
          {parseFloat(formData.utilizedAmount) >
            (budget?.allocatedAmount || 0) && (
            <div
              className="alert alert-danger"
              role="alert"
              style={{ marginTop: "16px" }}
            >
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              <strong> EXCEEDED BUDGET!</strong>
              <p
                style={{ marginTop: "4px", marginBottom: 0, fontSize: "12px" }}
              >
                Utilized amount (₹
                {parseFloat(formData.utilizedAmount).toLocaleString("en-IN")})
                exceeds allocated budget (₹
                {(budget?.allocatedAmount || 0).toLocaleString("en-IN")})
              </p>
            </div>
          )}
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
