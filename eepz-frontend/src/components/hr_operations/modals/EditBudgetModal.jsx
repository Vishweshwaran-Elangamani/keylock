import React, { useState, useEffect } from "react";
import budgetAllocationService from "../../../services/hr_operations/hr/budgetAllocationService";
import { formatCurrency } from "../../../utils/auth/currencyFormatter";
import { toast } from "sonner";
import "../../../styles/hr_operations/hr/EditBudgetModal.css";

const EditBudgetModal = ({ show, budget, onHide, onBudgetUpdated }) => {
  const [formData, setFormData] = useState({
    budgetId: "",
    departmentId: "",
    fiscalYear: "",
    totalBudget: "",
    allocatedAmount: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (show && budget) {
      setFormData({
        budgetId: budget.budgetId,
        departmentId: budget.departmentId,
        fiscalYear: budget.fiscalYear,
        totalBudget: budget.totalBudget,
        allocatedAmount: budget.allocatedAmount,
      });
      setErrors({});
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

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.totalBudget || parseFloat(formData.totalBudget) <= 0) {
      newErrors.totalBudget = "Total budget must be greater than zero";
    }

    if (!formData.allocatedAmount || parseFloat(formData.allocatedAmount) <= 0) {
      newErrors.allocatedAmount =
        "Allocated amount is required and must be greater than zero";
    }

    if (
      formData.allocatedAmount &&
      parseFloat(formData.totalBudget) > 0 &&
      parseFloat(formData.allocatedAmount) > parseFloat(formData.totalBudget)
    ) {
      newErrors.allocatedAmount = "Allocated amount cannot exceed total budget";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        budgetId: formData.budgetId,
        departmentId: formData.departmentId,
        fiscalYear: formData.fiscalYear,
        totalBudget: parseFloat(formData.totalBudget),
        allocatedAmount: parseFloat(formData.allocatedAmount),
      };

      await budgetAllocationService.updateDepartmentBudget(payload);

      toast.success("Budget updated successfully!");
      onBudgetUpdated();
      handleClose();
    } catch (err) {
      console.error(" Error updating budget:", err);
      toast.error(err.message || "Failed to update budget");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onHide();
  };

  if (!show) return null;

  // Coerced values for the comparison panel
  const newTotal = parseFloat(formData.totalBudget) || 0;
  const newAllocated = parseFloat(formData.allocatedAmount) || 0;

  return (
    <>
      <div className="ebm-backdrop" onClick={handleClose} />
      <div className="ebm-modal-container">
        <div className="ebm-modal-dialog">
          {/* HEADER */}
          <div className="ebm-modal-header">
            <div className="ebm-header-title">
              <i className="bi bi-pencil"></i>
              Edit Department Budget
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              aria-label="Close"
              className="ebm-close-button"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* BODY/FORM */}
          <form onSubmit={handleSubmit} className="ebm-form">
            <div className="ebm-modal-body">
              {/* BUDGET INFO */}
              <div className="ebm-budget-info-grid">
                <div className="ebm-info-card">
                  <label className="ebm-info-label">Department:</label>
                  <span className="ebm-info-value">
                    {budget?.departmentName || "Unknown"}
                  </span>
                </div>
                <div className="ebm-info-card">
                  <label className="ebm-info-label">Fiscal Year:</label>
                  <span className="ebm-info-value">{budget?.fiscalYear}</span>
                </div>
                <div className="ebm-info-card">
                  <label className="ebm-info-label">Created On:</label>
                  <span className="ebm-info-value">
                    {budget?.createdAt
                      ? new Date(budget.createdAt).toLocaleDateString("en-IN")
                      : "N/A"}
                  </span>
                </div>
              </div>

              <div className="ebm-form-grid">
                {/* Total Budget */}
                <div className="ebm-form-group">
                  <label className="ebm-form-label">
                    Total Budget (₹){" "}
                    <span className="ebm-required-asterisk">*</span>
                  </label>
                  <input
                    type="number"
                    name="totalBudget"
                    placeholder="Enter total budget"
                    value={formData.totalBudget}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className={`ebm-form-input ${
                      errors.totalBudget ? "error" : ""
                    }`}
                  />
                  {errors.totalBudget && (
                    <div className="ebm-form-error">{errors.totalBudget}</div>
                  )}
                  <small className="ebm-form-hint">
                    Total budget for this department and fiscal year
                  </small>
                </div>

                {/* Allocated Amount (Required now) */}
                <div className="ebm-form-group">
                  <label className="ebm-form-label">
                    Allocated Amount (₹){" "}
                    <span className="ebm-required-asterisk">*</span>
                  </label>
                  <input
                    type="number"
                    name="allocatedAmount"
                    placeholder="Enter allocated amount"
                    value={formData.allocatedAmount}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className={`ebm-form-input ${
                      errors.allocatedAmount ? "error" : ""
                    }`}
                  />
                  {errors.allocatedAmount && (
                    <div className="ebm-form-error">
                      {errors.allocatedAmount}
                    </div>
                  )}
                  <small className="ebm-form-hint">
                    Amount available for allocation by HR/DeptHead (must not exceed Total Budget)
                  </small>
                </div>
              </div>

              {/* BUDGET COMPARISON */}
              <div className="ebm-budget-comparison">
                <div className="ebm-comparison-header">
                  <i className="bi bi-arrow-left-right ebm-comparison-icon"></i>
                  <span>Budget Comparison</span>
                </div>
                <div className="ebm-comparison-grid">
                  {/* Current */}
                  <div>
                    <h6 className="ebm-comparison-section-title">CURRENT</h6>
                    <div className="ebm-comparison-card">
                      <p className="ebm-comparison-item">
                        <strong>Total:</strong>{" "}
                        {formatCurrency(budget?.totalBudget)}
                      </p>
                      <p className="ebm-comparison-item">
                        <strong>Allocated:</strong>{" "}
                        {formatCurrency(budget?.allocatedAmount)}
                      </p>
                    </div>
                  </div>

                  {/* New */}
                  <div>
                    <h6 className="ebm-comparison-section-title">NEW</h6>
                    <div className="ebm-comparison-card new">
                      <p className="ebm-comparison-item new">
                        <strong>Total:</strong> {formatCurrency(newTotal)}
                      </p>
                      <p className="ebm-comparison-item new">
                        <strong>Allocated:</strong>{" "}
                        {formatCurrency(newAllocated)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CURRENT UTILIZATION */}
              {budget?.utilizedAmount > 0 && (
                <div className="ebm-utilization-info">
                  <i className="bi bi-info-circle ebm-utilization-icon"></i>
                  <div>
                    <strong className="ebm-utilization-title">
                      Current Utilization:
                    </strong>
                    <p className="ebm-utilization-details">
                      <strong>Utilized Amount:</strong>{" "}
                      {formatCurrency(budget?.utilizedAmount)}
                      <br />
                      <strong>Utilization %:</strong>{" "}
                      {budget?.utilizationPercentage || 0}%
                      <br />
                      <span className="ebm-utilization-note">
                        Ensure new allocated amount is sufficient for current
                        utilization.
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="ebm-modal-footer">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="ebm-btn-cancel"
              >
                <i className="bi bi-x-circle"></i> Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="ebm-btn-submit"
              >
                {loading ? (
                  <>
                    <span className="ebm-spinner" />
                    Updating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle"></i> Update Budget
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

export default EditBudgetModal;