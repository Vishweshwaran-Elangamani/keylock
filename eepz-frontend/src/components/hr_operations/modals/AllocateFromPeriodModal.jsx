import React, { useState } from "react";
import { Modal } from "react-bootstrap";
import { toast } from "sonner";
import budgetAllocationService from "../../../services/hr_operations/hr/periodAllocationService";
import { formatCurrency } from "../../../utils/auth/currencyFormatter";
import "../../../styles/hr_operations/hr/periodAllocation.css";

const AllocateFromPeriodModal = ({ period, budget, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    allocationType: "Training",
    amount: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const allocationTypes = [
    "Training",
    "Promotion",
    "Bonus",
    "Recruitment",
    "Equipment",
    "Software",
    "Travel",
    "Other",
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Please enter a valid amount";
    }

    if (parseFloat(formData.amount) > period.remainingAmount) {
      newErrors.amount = `Amount exceeds remaining period allocation`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const userId = localStorage.getItem("userId");

      const payload = {
        budgetId: budget.budgetId,
        departmentId: budget.departmentId,
        allocationType: formData.allocationType,
        amount: parseFloat(formData.amount),
        notes: formData.notes,
        allocatedByUserId: parseInt(userId),
        period: period.period,
        periodYear: period.periodYear,
      };

      const response =
        await budgetAllocationService.createFundAllocationFromPeriod(payload);

      if (response.success) {
        toast.success("Sub-allocation created successfully!");
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || "Failed to create sub-allocation");
      }
    } catch (error) {
      console.error("Error creating sub-allocation:", error);
      toast.error(error.message || "Failed to create sub-allocation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      show={true}
      onHide={onClose}
      centered
      size="lg"
      backdrop="static"
      className="period-modal"
    >
      <div className="modal-header-gradient">
        <Modal.Title className="modal-title-custom">
          <i className="bi bi-plus-circle me-2"></i>
          Sub-Allocate from {period.period} {period.periodYear}
        </Modal.Title>
        <button
          type="button"
          className="btn-close btn-close-white"
          onClick={onClose}
          disabled={loading}
        ></button>
      </div>

      <Modal.Body className="modal-body-custom">
        {/* Period Summary */}
        <div className="budget-info-card mb-4">
          <div className="budget-info-header">
            <h6 className="mb-0">{budget.departmentName}</h6>
          </div>
          <div className="budget-info-grid">
            <div className="budget-info-item">
              <span className="info-label">Period</span>
              <span className="info-value">
                {period.period} {period.periodYear}
              </span>
            </div>
            <div className="budget-info-item">
              <span className="info-label">Period Allocation</span>
              <span className="info-value">
                {formatCurrency(period.allocatedAmount)}
              </span>
            </div>
            <div className="budget-info-item">
              <span className="info-label">Already Sub-Allocated</span>
              <span className="info-value allocated">
                {formatCurrency(
                  period.allocatedAmount - period.remainingAmount
                )}
              </span>
            </div>
            <div className="budget-info-item highlight">
              <span className="info-label">Available for Sub-Allocation</span>
              <span className="info-value available">
                {formatCurrency(period.remainingAmount)}
              </span>
            </div>
          </div>

          <div className="progress-section mt-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <small className="text-muted">Sub-Allocation Progress</small>
              <small className="text-muted">
                {period.subAllocationCount || 0} sub-allocations
              </small>
            </div>
            <div className="progress" style={{ height: "8px" }}>
              <div
                className="progress-bar bg-primary"
                role="progressbar"
                style={{
                  width: `${
                    ((period.allocatedAmount - period.remainingAmount) /
                      period.allocatedAmount) *
                    100
                  }%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label-custom">
              Allocation Type <span className="text-danger">*</span>
            </label>
            <select
              name="allocationType"
              value={formData.allocationType}
              onChange={handleChange}
              className="form-select form-control-custom"
              required
            >
              {allocationTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <small className="text-muted">
              Select the purpose of this allocation
            </small>
          </div>

          <div className="mb-3">
            <label className="form-label-custom">
              Amount (₹) <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className={`form-control form-control-custom ${
                errors.amount ? "is-invalid" : ""
              }`}
              placeholder="Enter amount"
              step="0.01"
              min="0"
              max={period.remainingAmount}
              required
            />
            {errors.amount && (
              <div className="invalid-feedback d-block">{errors.amount}</div>
            )}
            {formData.amount && !errors.amount && (
              <small className="text-success">
                ✓ {formatCurrency(parseFloat(formData.amount))} • Remaining:{" "}
                {formatCurrency(
                  period.remainingAmount - parseFloat(formData.amount)
                )}
              </small>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label-custom">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="form-control form-control-custom"
              placeholder="Add notes about this sub-allocation (optional)"
              rows="3"
            />
          </div>

          <div className="alert alert-info-custom">
            <i className="bi bi-info-circle-fill me-2"></i>
            <div>
              <strong>Sub-Allocation from Period</strong>
              <p className="mb-0">
                This will create a fund allocation linked to{" "}
                <strong>
                  {period.period} {period.periodYear}
                </strong>
                . The department head can then update utilization for this
                allocation.
              </p>
            </div>
          </div>

          <div className="modal-actions-custom">
            <button
              type="button"
              className="btn btn-secondary-custom"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary-gradient"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Creating...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-2"></i>
                  Create Sub-Allocation
                </>
              )}
            </button>
          </div>
        </form>
      </Modal.Body>
    </Modal>
  );
};

export default AllocateFromPeriodModal;
