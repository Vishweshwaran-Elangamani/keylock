


import { useState } from "react";
import { toast } from "sonner";
import periodAllocationService from "../../../services/hr_operations/hr/periodAllocationService";
import { formatCurrency } from "../../../utils/auth/currencyFormatter";
import "../../../styles/hr_operations/hr/CreatePeriodAllocationModal.css";

/* Custom Period Dropdown */
const PeriodDropdown = ({ value, onChange, periods }) => {
  const [open, setOpen] = useState(false);

  const selected = periods.find((p) => p.value === value) || periods[0];

  const handleSelect = (val) => {
    onChange({ target: { name: "period", value: val } });
    setOpen(false);
  };

  return (
    <div
      className="cpam-custom-dropdown"
      tabIndex={0}
      onBlur={() => setTimeout(() => setOpen(false), 200)}
    >
      <div
        className="cpam-custom-selected"
        onClick={() => setOpen((prev) => !prev)}
      >
        {selected.label}
        <i className={`bi bi-chevron-${open ? "up" : "down"} cpam-custom-arrow`}></i>
      </div>

      {open && (
        <div className="cpam-custom-menu">
          {periods.map((period) => (
            <div
              key={period.value}
              className={
                "cpam-custom-option" +
                (period.value === value ? " cpam-custom-option-active" : "")
              }
              onClick={() => handleSelect(period.value)}
            >
              {period.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* Custom Year Dropdown */
const YearDropdown = ({ value, onChange, years }) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (val) => {
    onChange({ target: { name: "periodYear", value: val } });
    setOpen(false);
  };

  return (
    <div
      className="cpam-custom-dropdown"
      tabIndex={0}
      onBlur={() => setTimeout(() => setOpen(false), 200)}
    >
      <div
        className="cpam-custom-selected"
        onClick={() => setOpen((prev) => !prev)}
      >
        {value}
        <i className={`bi bi-chevron-${open ? "up" : "down"} cpam-custom-arrow`}></i>
      </div>

      {open && (
        <div className="cpam-custom-menu">
          {years.map((year) => (
            <div
              key={year}
              className={
                "cpam-custom-option" +
                (year === value ? " cpam-custom-option-active" : "")
              }
              onClick={() => handleSelect(year)}
            >
              {year}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

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

  const years = [2024, 2025, 2026, 2027];

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
    <>
      <div className="cpam-backdrop" onClick={onClose} />

      <div className="cpam-modal-container">
        <div className="cpam-modal-dialog">
          {/* HEADER - Fixed */}
          <div className="cpam-modal-header">
            <div className="cpam-header-title">
              <i className="bi bi-calendar-plus"></i>
              Create Period Allocation
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              aria-label="Close"
              className="cpam-close-button"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* BODY - Scrollable */}
          <form onSubmit={handleSubmit} className="cpam-form">
            <div className="cpam-modal-body">
              {/* Budget Summary Card */}
              <div className="cpam-budget-summary">
                <div className="cpam-summary-header">
                  <h5 className="cpam-summary-title">
                    {budget.departmentName}
                  </h5>
                </div>
                <div className="cpam-summary-grid">
                  <div className="cpam-summary-item">
                    <span className="cpam-summary-label">Total Budget</span>
                    <span className="cpam-summary-value">
                      {formatCurrency(budget.totalBudget)}
                    </span>
                  </div>
                  <div className="cpam-summary-item">
                    <span className="cpam-summary-label">
                      Already Allocated
                    </span>
                    <span className="cpam-summary-value-danger">
                      {formatCurrency(budget.allocatedAmount || 0)}
                    </span>
                  </div>
                  <div className="cpam-summary-item-highlight">
                    <span className="cpam-summary-label-highlight">
                      Available to Allocate
                    </span>
                    <span className="cpam-summary-value-highlight">
                      {formatCurrency(availableBudget)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Period and Year Row */}
              <div className="cpam-form-row">
                {/* Period */}
                <div>
                  <label className="cpam-form-label">
                    Period <span className="cpam-required-asterisk">*</span>
                  </label>
                  <PeriodDropdown
                    value={formData.period}
                    onChange={handleChange}
                    periods={periods}
                  />
                </div>

                {/* Year */}
                <div>
                  <label className="cpam-form-label">
                    Year <span className="cpam-required-asterisk">*</span>
                  </label>
                  <YearDropdown
                    value={formData.periodYear}
                    onChange={handleChange}
                    years={years}
                  />
                </div>
              </div>

              {/* Allocated Amount */}
              <div className="cpam-form-group">
                <label className="cpam-form-label">
                  Allocated Amount (₹){" "}
                  <span className="cpam-required-asterisk">*</span>
                </label>
                <input
                  type="number"
                  name="allocatedAmount"
                  value={formData.allocatedAmount}
                  onChange={handleChange}
                  placeholder="Enter amount"
                  step="0.01"
                  min="0"
                  max={availableBudget}
                  required
                  className={`cpam-form-input ${
                    errors.allocatedAmount ? "error" : ""
                  }`}
                />
                {errors.allocatedAmount && (
                  <div className="cpam-form-error">
                    {errors.allocatedAmount}
                  </div>
                )}
                {formData.allocatedAmount && !errors.allocatedAmount && (
                  <small className="cpam-form-success">
                    ✓ {formatCurrency(parseFloat(formData.allocatedAmount))}
                  </small>
                )}
              </div>

              {/* Notes */}
              <div className="cpam-form-group">
                <label className="cpam-form-label-block">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Add notes about this allocation (optional)"
                  rows={3}
                  className="cpam-form-input cpam-form-textarea"
                />
              </div>
            </div>

            {/* FOOTER - Fixed */}
            <div className="cpam-modal-footer">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="cpam-btn-cancel"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="cpam-btn-submit"
              >
                {loading ? (
                  <>
                    <span className="cpam-spinner" />
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle"></i>
                    Create Period Allocation
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

export default CreatePeriodAllocationModal;
