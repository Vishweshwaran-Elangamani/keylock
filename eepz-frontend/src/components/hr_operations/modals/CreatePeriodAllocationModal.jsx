import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import periodAllocationService from "../../../services/hr_operations/hr/periodAllocationService";
import { formatCurrency } from "../../../utils/auth/currencyFormatter";
import "../../../styles/hr_operations/hr/CreatePeriodAllocationModal.css";
/* Custom Dropdown Component */
const CustomDropdown = ({
  value,
  onChange,
  options,
  placeholder,
  name,
  error,
  disabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const selectedOption = options.find((opt) => opt.value === value);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);
  const handleSelect = (optionValue) => {
    if (!disabled) {
      onChange({ target: { name, value: optionValue } });
      setIsOpen(false);
    }
  };
  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };
  return (
    <div
      ref={dropdownRef}
      className={`cpam-custom-dropdown ${error ? "cpam-error" : ""} ${
        disabled ? "cpam-disabled" : ""
      } ${isOpen ? "cpam-dropdown-open" : ""}`}
      tabIndex={disabled ? -1 : 0}
      onBlur={() => setTimeout(() => setIsOpen(false), 200)}
    >
      <div className="cpam-custom-selected" onClick={toggleDropdown}>
        <span className={!selectedOption ? "cpam-placeholder-text" : ""}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="cpam-custom-arrow"></span>
      </div>
      {isOpen && (
        <div className="cpam-custom-menu">
          {options.map((option) => (
            <div
              key={option.value}
              className={`cpam-custom-option ${
                value === option.value ? "cpam-custom-option-active" : ""
              }`}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
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
  const currentYear = new Date().getFullYear();
  const yearOptions = [
    { value: currentYear, label: currentYear.toString() },
    { value: currentYear + 1, label: (currentYear + 1).toString() },
    { value: currentYear + 2, label: (currentYear + 2).toString() },
    { value: currentYear + 3, label: (currentYear + 3).toString() },
  ];
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
      <div className="cpam-modal-wrapper">
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
                <div className="cpam-form-group-inline">
                  <label className="cpam-form-label">
                    Period <span className="cpam-required-asterisk">*</span>
                  </label>
                  <CustomDropdown
                    name="period"
                    value={formData.period}
                    onChange={handleChange}
                    options={periods}
                    placeholder="Select Period"
                    disabled={loading}
                  />
                </div>
                {/* Year */}
                <div className="cpam-form-group-inline">
                  <label className="cpam-form-label">
                    Year <span className="cpam-required-asterisk">*</span>
                  </label>
                  <CustomDropdown
                    name="periodYear"
                    value={formData.periodYear}
                    onChange={handleChange}
                    options={yearOptions}
                    placeholder="Select Year"
                    disabled={loading}
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
                    errors.allocatedAmount ? "cpam-input-error" : ""
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
                <label className="cpam-form-label">Notes</label>
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
                <i className="bi bi-x-circle"></i>
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
                    Create Allocation
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
