import { useState } from "react";
import { toast } from "sonner";
import periodAllocationService from "../../../services/hr_operations/hr/periodAllocationService";
import { formatCurrency } from "../../../utils/auth/currencyFormatter";
import "../../../styles/hr_operations/hr/UpdatePeriodAllocationModal.css";

const UpdatePeriodAllocationModal = ({
  period,
  budget,
  onClose,
  onSuccess,
}) => {
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

    if (
      !formData.allocatedAmount ||
      parseFloat(formData.allocatedAmount) <= 0
    ) {
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

      const response = await periodAllocationService.updatePeriodAllocation(
        payload
      );

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

  const amountChange =
    parseFloat(formData.allocatedAmount) - period.allocatedAmount;

  return (
    <>
      <div className="upam-backdrop" onClick={onClose} />

      <div className="upam-modal-container">
        <div className="upam-modal-dialog">
          {/* HEADER - Fixed */}
          <div className="upam-modal-header">
            <div className="upam-header-title">
              <i className="bi bi-pencil-square"></i>
              Update {period.period} {period.periodYear} Allocation
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              aria-label="Close"
              className="upam-close-button"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* BODY - Scrollable */}
          <form onSubmit={handleSubmit} className="upam-form">
            <div className="upam-modal-body">
              {/* Current Status Card */}
              <div className="upam-status-card">
                <h6 className="upam-status-heading">Current Status</h6>
                <div className="upam-status-grid">
                  <div className="upam-status-item">
                    <label>Current Allocation</label>
                    <span>{formatCurrency(period.allocatedAmount)}</span>
                  </div>
                  <div className="upam-status-item utilized">
                    <label>Utilized</label>
                    <span>{formatCurrency(period.utilizedAmount || 0)}</span>
                  </div>
                  <div className="upam-status-item">
                    <label>Sub-Allocations</label>
                    <span>{period.subAllocationCount || 0}</span>
                  </div>
                  <div className="upam-status-item available">
                    <label>Available Budget</label>
                    <span>{formatCurrency(availableBudget)}</span>
                  </div>
                </div>
              </div>

              {/* Warning Box */}
              {period.subAllocationCount > 0 && (
                <div className="upam-warning-box">
                  <i className="bi bi-exclamation-triangle-fill upam-warning-icon"></i>
                  <div>
                    <strong className="upam-warning-title">Warning</strong>
                    <p className="upam-warning-text">
                      This period has {period.subAllocationCount}{" "}
                      sub-allocations. Ensure the new amount is sufficient to
                      cover existing sub-allocations.
                    </p>
                  </div>
                </div>
              )}

              {/* New Allocated Amount */}
              <div className="upam-form-group">
                <label className="upam-form-label">
                  New Allocated Amount (₹){" "}
                  <span className="upam-required-asterisk">*</span>
                </label>
                <input
                  type="number"
                  name="allocatedAmount"
                  value={formData.allocatedAmount}
                  onChange={handleChange}
                  placeholder="Enter new amount"
                  step="0.01"
                  min={period.utilizedAmount}
                  max={availableBudget}
                  required
                  className={`upam-form-input ${
                    errors.allocatedAmount ? "error" : ""
                  }`}
                />
                {errors.allocatedAmount && (
                  <div className="upam-form-error">
                    {errors.allocatedAmount}
                  </div>
                )}
                {formData.allocatedAmount && !errors.allocatedAmount && (
                  <div className="upam-validation-feedback">
                    <small className="upam-validation-success">
                      ✓ {formatCurrency(parseFloat(formData.allocatedAmount))}
                    </small>
                    {amountChange !== 0 && (
                      <span
                        className={`upam-amount-change-badge ${
                          amountChange > 0 ? "positive" : "negative"
                        }`}
                      >
                        {amountChange > 0 ? "+" : ""}
                        {formatCurrency(amountChange)}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="upam-form-group">
                <label className="upam-form-label-block">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Update notes (optional)"
                  rows={3}
                  className="upam-form-input upam-form-textarea"
                />
              </div>
            </div>

            {/* FOOTER - Fixed */}
            <div className="upam-modal-footer">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="upam-btn-cancel"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="upam-btn-submit"
              >
                {loading ? (
                  <>
                    <span className="upam-spinner" />
                    Updating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle"></i>
                    Update Allocation
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

export default UpdatePeriodAllocationModal;
