import React, { useState } from "react";
import { Modal } from "react-bootstrap";
import { toast } from "sonner";
import periodAllocationService from "../../../../services/hr_operations/hr/periodAllocationService";
import { formatCurrency } from "../../../../utils/auth/currencyFormatter";
import "../../../../styles/hr_operations/hr/periodAllocation.css";

const UpdatePeriodAllocationModal = ({ period, budget, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    allocatedAmount: period.allocatedAmount,
    notes: period.notes || "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const otherPeriodsTotal = budget.allocatedAmount - period.allocatedAmount;
  const availableBudget = budget.totalBudget - otherPeriodsTotal;

  const validateForm = () => {
    const newErrors = {};

    if (!formData.allocatedAmount || parseFloat(formData.allocatedAmount) <= 0) {
      newErrors.allocatedAmount = "Please enter a valid amount";
    }

    if (parseFloat(formData.allocatedAmount) > availableBudget) {
      newErrors.allocatedAmount = `Amount exceeds available budget`;
    }

    if (parseFloat(formData.allocatedAmount) < period.utilizedAmount) {
      newErrors.allocatedAmount = `Cannot reduce below utilized amount`;
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
      const payload = {
        periodAllocationId: period.periodAllocationId,
        allocatedAmount: parseFloat(formData.allocatedAmount),
        notes: formData.notes,
      };

      const response = await periodAllocationService.updatePeriodAllocation(payload);

      if (response.success) {
        toast.success("Period allocation updated successfully!");
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || "Failed to update period allocation");
      }
    } catch (error) {
      console.error("Error updating period allocation:", error);
      toast.error(error.message || "Failed to update period allocation");
    } finally {
      setLoading(false);
    }
  };

  const amountChange = parseFloat(formData.allocatedAmount) - period.allocatedAmount;

  return (
    <Modal show={true} onHide={onClose} centered size="lg" backdrop="static" className="period-modal">
      <div className="modal-header-gradient">
        <Modal.Title className="modal-title-custom">
          <i className="bi bi-pencil-square me-2"></i>
          Update {period.period} {period.periodYear} Allocation
        </Modal.Title>
        <button type="button" className="btn-close btn-close-white" onClick={onClose} disabled={loading}></button>
      </div>

      <Modal.Body className="modal-body-custom">
        {/* Current Status Card */}
        <div className="budget-info-card mb-3">
          <div className="budget-info-header">
            <h6 className="mb-0">Current Status</h6>
          </div>
          <div className="budget-info-grid">
            <div className="budget-info-item">
              <span className="info-label">Current Allocation</span>
              <span className="info-value">{formatCurrency(period.allocatedAmount)}</span>
            </div>
            <div className="budget-info-item">
              <span className="info-label">Utilized</span>
              <span className="info-value allocated">{formatCurrency(period.utilizedAmount || 0)}</span>
            </div>
            <div className="budget-info-item">
              <span className="info-label">Sub-Allocations</span>
              <span className="info-value">{period.subAllocationCount || 0}</span>
            </div>
            <div className="budget-info-item highlight">
              <span className="info-label">Available Budget</span>
              <span className="info-value available">{formatCurrency(availableBudget)}</span>
            </div>
          </div>
        </div>

        {/* Warning Box */}
        {period.subAllocationCount > 0 && (
          <div className="alert alert-warning-custom mb-3">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            <div>
              <strong>Warning</strong>
              <p className="mb-0">This period has {period.subAllocationCount} sub-allocations. Ensure the new amount is sufficient to cover existing sub-allocations.</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label-custom">
              New Allocated Amount (₹) <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              name="allocatedAmount"
              value={formData.allocatedAmount}
              onChange={handleChange}
              className={`form-control form-control-custom ${errors.allocatedAmount ? 'is-invalid' : ''}`}
              placeholder="Enter new amount"
              step="0.01"
              min={period.utilizedAmount}
              max={availableBudget}
              required
            />
            {errors.allocatedAmount && (
              <div className="invalid-feedback d-block">{errors.allocatedAmount}</div>
            )}
            {formData.allocatedAmount && !errors.allocatedAmount && (
              <div className="d-flex justify-content-between align-items-center mt-2">
                <small className="text-success">✓ {formatCurrency(parseFloat(formData.allocatedAmount))}</small>
                {amountChange !== 0 && (
                  <span className={`badge ${amountChange > 0 ? 'bg-success' : 'bg-danger'}`}>
                    {amountChange > 0 ? '+' : ''}{formatCurrency(amountChange)}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label-custom">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="form-control form-control-custom"
              placeholder="Update notes (optional)"
              rows="3"
            />
          </div>

          <div className="modal-actions-custom">
            <button type="button" className="btn btn-secondary-custom" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary-gradient" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Updating...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-2"></i>
                  Update Allocation
                </>
              )}
            </button>
          </div>
        </form>
      </Modal.Body>
    </Modal>
  );
};

export default UpdatePeriodAllocationModal;
