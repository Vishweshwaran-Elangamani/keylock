import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import budgetAllocationService from "../../../services/hr_operations/hr/budgetAllocationService";
import { formatCurrency } from "../../../utils/auth/currencyFormatter";
import "../../../styles/hr_operations/hr/AllocateFromPeriodModal.css";

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
      className={`afpm-custom-dropdown ${error ? "afpm-error" : ""} ${
        disabled ? "afpm-disabled" : ""
      } ${isOpen ? "afpm-dropdown-open" : ""}`}
      tabIndex={disabled ? -1 : 0}
      onBlur={() => setTimeout(() => setIsOpen(false), 200)}
    >
      <div className="afpm-custom-selected" onClick={toggleDropdown}>
        <span className={!selectedOption ? "afpm-placeholder-text" : ""}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="afpm-custom-arrow"></span>
      </div>

      {isOpen && (
        <div className="afpm-custom-menu">
          {options.map((option) => (
            <div
              key={option.value}
              className={`afpm-custom-option ${
                value === option.value ? "afpm-custom-option-active" : ""
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

const AllocateFromPeriodModal = ({ period, budget, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    allocationType: "Training",
    amount: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const allocationTypeOptions = [
    { value: "Training", label: "Training" },
    { value: "Promotion", label: "Promotion" },
    { value: "Bonus", label: "Bonus" },
    { value: "Other", label: "Other" },
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Please enter a valid amount";
    }

    if (parseFloat(formData.amount) > period.remainingAmount) {
      newErrors.amount = `Amount exceeds remaining period allocation`;
    }

    if (!formData.notes || !formData.notes.trim()) {
      newErrors.notes = "Allocation name is required";
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
    <>
      <div className="afpm-backdrop" onClick={onClose} />

      <div className="afpm-modal-wrapper">
        <div className="afpm-modal-dialog">
          {/* HEADER - Fixed */}
          <div className="afpm-modal-header">
            <div className="afpm-header-title">
              <i className="bi bi-plus-circle"></i>
              Sub-Allocate from {period.period} {period.periodYear}
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              aria-label="Close"
              className="afpm-close-button"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* BODY - Scrollable */}
          <form onSubmit={handleSubmit} className="afpm-form">
            <div className="afpm-modal-body">
              {/* Period Summary Card */}
              <div className="afpm-period-summary">
                <div className="afpm-summary-header">
                  <h6 className="afpm-summary-title">
                    {budget.departmentName}
                  </h6>
                </div>
                <div className="afpm-summary-grid">
                  <div className="afpm-summary-item">
                    <span className="afpm-summary-label">Period</span>
                    <span className="afpm-summary-value">
                      {period.period} {period.periodYear}
                    </span>
                  </div>
                  <div className="afpm-summary-item">
                    <span className="afpm-summary-label">
                      Period Allocation
                    </span>
                    <span className="afpm-summary-value">
                      {formatCurrency(period.allocatedAmount)}
                    </span>
                  </div>
                  <div className="afpm-summary-item">
                    <span className="afpm-summary-label">
                      Already Sub-Allocated
                    </span>
                    <span className="afpm-summary-value-danger">
                      {formatCurrency(
                        period.allocatedAmount - period.remainingAmount
                      )}
                    </span>
                  </div>
                  <div className="afpm-summary-item-highlight">
                    <span className="afpm-summary-label-highlight">
                      Available for Sub-Allocation
                    </span>
                    <span className="afpm-summary-value-highlight">
                      {formatCurrency(period.remainingAmount)}
                    </span>
                  </div>
                </div>

                {/* Progress Section */}
                <div className="afpm-progress-section">
                  <div className="afpm-progress-header">
                    <small className="afpm-progress-label">
                      Sub-Allocation Progress
                    </small>
                    <small className="afpm-progress-label">
                      {period.subAllocationCount || 0} sub-allocations
                    </small>
                  </div>
                  <div className="afpm-progress-bar-container">
                    <div
                      className="afpm-progress-bar"
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

              {/* Allocation Type */}
              <div className="afpm-form-group">
                <label className="afpm-form-label">
                  Allocation Type{" "}
                  <span className="afpm-required-asterisk">*</span>
                </label>
                <CustomDropdown
                  name="allocationType"
                  value={formData.allocationType}
                  onChange={handleChange}
                  options={allocationTypeOptions}
                  placeholder="Select Allocation Type"
                  disabled={loading}
                />
                <small className="afpm-form-hint">
                  Select the purpose of this allocation
                </small>
              </div>

              {/* Amount */}
              <div className="afpm-form-group">
                <label className="afpm-form-label">
                  Amount (₹) <span className="afpm-required-asterisk">*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="Enter amount"
                  step="0.01"
                  min="0"
                  max={period.remainingAmount}
                  required
                  className={`afpm-form-input ${
                    errors.amount ? "afpm-input-error" : ""
                  }`}
                />
                {errors.amount && (
                  <div className="afpm-form-error">{errors.amount}</div>
                )}
                {formData.amount && !errors.amount && (
                  <small className="afpm-form-success">
                    ✓ {formatCurrency(parseFloat(formData.amount))} • Remaining:{" "}
                    {formatCurrency(
                      period.remainingAmount - parseFloat(formData.amount)
                    )}
                  </small>
                )}
              </div>

              {/* Notes */}
              <div className="afpm-form-group">
                <label className="afpm-form-label">
                  Allocation Name
                  <span className="afpm-required-asterisk">*</span>
                </label>
                <input
                  type="text"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Enter Allocation Name"
                  className={`afpm-form-input ${
                    errors.notes ? "afpm-input-error" : ""
                  }`}
                  required
                />
                {errors.notes && (
                  <div className="afpm-form-error">{errors.notes}</div>
                )}
              </div>

              {/* Info Alert */}
              <div className="afpm-info-alert">
                <i className="bi bi-info-circle-fill afpm-info-icon"></i>
                <div className="afpm-info-content">
                  <strong className="afpm-info-title">
                    Sub-Allocation from Period
                  </strong>
                  <p className="afpm-info-text">
                    This will create a fund allocation linked to{" "}
                    <strong>
                      {period.period} {period.periodYear}
                    </strong>
                    . The department head can then update utilization for this
                    allocation.
                  </p>
                </div>
              </div>
            </div>

            {/* FOOTER - Fixed */}
            <div className="afpm-modal-footer">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="afpm-btn-cancel"
              >
                <i className="bi bi-x-circle"></i>
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="afpm-btn-submit"
              >
                {loading ? (
                  <>
                    <span className="afpm-spinner" />
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle"></i>
                    Create Sub-Allocation
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

export default AllocateFromPeriodModal;
