import React, { useState } from "react";
import { Modal } from "react-bootstrap";
import { toast } from "sonner";
import periodAllocationService from "../../../../services/hr_operations/hr/periodAllocationService";
import { formatCurrency } from "../../../../utils/auth/currencyFormatter";
import "../../../../styles/hr_operations/hr/periodAllocation.css";

const CreatePeriodAllocationModal = ({ budget, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    period: "Q1",
    periodYear: new Date().getFullYear(),
    allocatedAmount: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Calculate available budget
  const availableBudget = budget.totalBudget - (budget.allocatedAmount || 0);

  const periods = [
    { value: "Q1", label: "Q1 - Quarter 1" },
    { value: "Q2", label: "Q2 - Quarter 2" },
    { value: "Q3", label: "Q3 - Quarter 3" },
    { value: "Q4", label: "Q4 - Quarter 4" },
    { value: "H1", label: "H1 - Half Year 1" },
    { value: "H2", label: "H2 - Half Year 2" },
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.allocatedAmount || parseFloat(formData.allocatedAmount) <= 0) {
      newErrors.allocatedAmount = "Please enter a valid amount";
    }

    if (parseFloat(formData.allocatedAmount) > availableBudget) {
      newErrors.allocatedAmount = `Amount exceeds available budget`;
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
        period: formData.period,
        periodYear: parseInt(formData.periodYear),
        allocatedAmount: parseFloat(formData.allocatedAmount),
        allocatedByUserId: parseInt(userId),
        notes: formData.notes,
      };

      const response = await periodAllocationService.createPeriodAllocation(
        payload
      );

      if (response.success) {
        toast.success("Period allocation created successfully!");
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || "Failed to create period allocation");
      }
    } catch (error) {
      console.error("Error creating period allocation:", error);
      toast.error(error.message || "Failed to create period allocation");
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
          <i className="bi bi-calendar-plus me-2"></i>
          Create Period Allocation
        </Modal.Title>
        <button 
          type="button" 
          className="btn-close btn-close-white" 
          onClick={onClose}
          disabled={loading}
        ></button>
      </div>

      <Modal.Body className="modal-body-custom">
        {/* Budget Summary Card */}
        <div className="budget-info-card">
          <div className="budget-info-header">
            <h5>{budget.departmentName}</h5>
          </div>
          <div className="budget-info-grid">
            <div className="budget-info-item">
              <span className="info-label">Total Budget</span>
              <span className="info-value">{formatCurrency(budget.totalBudget)}</span>
            </div>
            <div className="budget-info-item">
              <span className="info-label">Already Allocated</span>
              <span className="info-value allocated">{formatCurrency(budget.allocatedAmount || 0)}</span>
            </div>
            <div className="budget-info-item highlight">
              <span className="info-label">Available to Allocate</span>
              <span className="info-value available">{formatCurrency(availableBudget)}</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label-custom">
                Period <span className="text-danger">*</span>
              </label>
              <select
                name="period"
                value={formData.period}
                onChange={handleChange}
                className="form-select form-control-custom"
                required
              >
                {periods.map((period) => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label-custom">
                Year <span className="text-danger">*</span>
              </label>
              <select
                name="periodYear"
                value={formData.periodYear}
                onChange={handleChange}
                className="form-select form-control-custom"
                required
              >
                {[2024, 2025, 2026, 2027].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label-custom">
              Allocated Amount (₹) <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              name="allocatedAmount"
              value={formData.allocatedAmount}
              onChange={handleChange}
              className={`form-control form-control-custom ${errors.allocatedAmount ? 'is-invalid' : ''}`}
              placeholder="Enter amount"
              step="0.01"
              min="0"
              max={availableBudget}
              required
            />
            {errors.allocatedAmount && (
              <div className="invalid-feedback d-block">
                {errors.allocatedAmount}
              </div>
            )}
            {formData.allocatedAmount && !errors.allocatedAmount && (
              <small className="form-text text-success">
                ✓ {formatCurrency(parseFloat(formData.allocatedAmount))}
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
              placeholder="Add notes about this allocation (optional)"
              rows="3"
            />
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
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Creating...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-2"></i>
                  Create Period Allocation
                </>
              )}
            </button>
          </div>
        </form>
      </Modal.Body>
    </Modal>
  );
};

export default CreatePeriodAllocationModal;
