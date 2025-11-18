import React, { useState, useEffect } from "react";
import { Modal } from "react-bootstrap";
import budgetAllocationService from "../../../services/hr_operations/hr/budgetAllocationService";
import { formatCurrency } from "../../../utils/auth/currencyFormatter";

const EditBudgetModal = ({ show, budget, onHide, onBudgetUpdated }) => {
  const [formData, setFormData] = useState({
    budgetId: "",
    departmentId: "",
    fiscalYear: "",
    totalBudget: "",
    allocatedAmount: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (show && budget) {
      setFormData({
        budgetId: budget.budgetId,
        departmentId: budget.departmentId,
        fiscalYear: budget.fiscalYear,
        totalBudget: budget.totalBudget,
        allocatedAmount: budget.allocatedAmount,
      });
      setError(null);
    }
  }, [show, budget]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "departmentId" || name === "fiscalYear"
          ? parseInt(value)
          : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      //  VALIDATIONS
      if (!formData.totalBudget || parseFloat(formData.totalBudget) <= 0) {
        setError("Total budget must be greater than zero");
        setLoading(false);
        return;
      }

      const allocatedAmount = formData.allocatedAmount
        ? parseFloat(formData.allocatedAmount)
        : parseFloat(formData.totalBudget);

      if (allocatedAmount > parseFloat(formData.totalBudget)) {
        setError("Allocated amount cannot exceed total budget");
        setLoading(false);
        return;
      }

      console.log(" Updating budget...");

      await budgetAllocationService.updateDepartmentBudget({
        budgetId: formData.budgetId,
        departmentId: formData.departmentId,
        fiscalYear: formData.fiscalYear,
        totalBudget: parseFloat(formData.totalBudget),
        allocatedAmount: allocatedAmount,
      });

      console.log(" Budget updated successfully");
      onBudgetUpdated();
      handleClose();
    } catch (err) {
      console.error(" Error updating budget:", err);
      setError(err.message || "Failed to update budget");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" className="promo-modal">
      <Modal.Header closeButton className="promo-modal-header">
        <Modal.Title>
          <i className="bi bi-pencil me-2"></i>
          Edit Department Budget
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
              <label>Created On:</label>
              <span>
                {budget?.createdAt
                  ? new Date(budget.createdAt).toLocaleDateString("en-IN")
                  : "N/A"}
              </span>
            </div>
            <div className="promo-info-card">
              <label>Headcount:</label>
              <span>{budget?.headcount || 0}</span>
            </div>
          </div>

          <div className="promo-form-grid">
            <div className="promo-form-column">
              <div className="mb-3">
                <label htmlFor="totalBudget" className="form-label">
                  Total Budget (₹) <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  className="form-control"
                  id="totalBudget"
                  name="totalBudget"
                  value={formData.totalBudget}
                  onChange={handleChange}
                  placeholder="Enter total budget"
                  step="0.01"
                  min="0"
                  required
                />
                <small className="form-text text-muted">
                  Total budget for this department and fiscal year
                </small>
              </div>
            </div>

            <div className="promo-form-column">
              <div className="mb-3">
                <label htmlFor="allocatedAmount" className="form-label">
                  Allocated Amount (₹)
                </label>
                <input
                  type="number"
                  className="form-control"
                  id="allocatedAmount"
                  name="allocatedAmount"
                  value={formData.allocatedAmount}
                  onChange={handleChange}
                  placeholder="Enter allocated amount"
                  step="0.01"
                  min="0"
                />
                <small className="form-text text-muted">
                  Amount available for allocation by HR/DeptHead
                </small>
              </div>
            </div>
          </div>

          {/*  CURRENT vs NEW COMPARISON */}
          <div
            className="promo-details-section"
            style={{ backgroundColor: "#f0fdf4" }}
          >
            <h6 className="promo-details-heading"> Budget Comparison</h6>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              {/* Current */}
              <div>
                <h6
                  style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    color: "#64748b",
                  }}
                >
                  CURRENT
                </h6>
                <div
                  style={{
                    padding: "12px",
                    backgroundColor: "#ffffff",
                    borderRadius: "6px",
                  }}
                >
                  <p style={{ fontSize: "12px", marginBottom: "6px" }}>
                    <strong>Total:</strong>{" "}
                    {formatCurrency(budget?.totalBudget)}
                  </p>
                  <p style={{ fontSize: "12px", marginBottom: "0px" }}>
                    <strong>Allocated:</strong>{" "}
                    {formatCurrency(budget?.allocatedAmount)}
                  </p>
                </div>
              </div>

              {/* New */}
              <div>
                <h6
                  style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    color: "#64748b",
                  }}
                >
                  NEW
                </h6>
                <div
                  style={{
                    padding: "12px",
                    backgroundColor: "#ffffff",
                    borderRadius: "6px",
                    border: "2px solid #10b981",
                  }}
                >
                  <p
                    style={{
                      fontSize: "12px",
                      marginBottom: "6px",
                      color: "#10b981",
                    }}
                  >
                    <strong>Total:</strong>{" "}
                    {formatCurrency(formData.totalBudget)}
                  </p>
                  <p
                    style={{
                      fontSize: "12px",
                      marginBottom: "0px",
                      color: "#10b981",
                    }}
                  >
                    <strong>Allocated:</strong>{" "}
                    {formatCurrency(
                      formData.allocatedAmount || formData.totalBudget
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/*  CURRENT UTILIZATION */}
          {budget?.utilizedAmount > 0 && (
            <div
              className="alert alert-info"
              role="alert"
              style={{ marginTop: "16px" }}
            >
              <i className="bi bi-info-circle me-2"></i>
              <strong>Current Utilization:</strong>
              <p
                style={{ marginTop: "8px", marginBottom: 0, fontSize: "12px" }}
              >
                <strong>Utilized Amount:</strong>{" "}
                {formatCurrency(budget?.utilizedAmount)}
                <br />
                <strong>Utilization %:</strong>{" "}
                {budget?.utilizationPercentage || 0}%
                <br />
                <span style={{ color: "#64748b" }}>
                  Ensure new allocated amount is sufficient for current
                  utilization.
                </span>
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
            disabled={loading}
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
                Update Budget
              </>
            )}
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default EditBudgetModal;
