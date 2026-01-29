import React, { useState, useEffect, useRef } from "react";
import budgetAllocationService from "../../../services/hr_operations/hr/budgetAllocationService";
import { formatCurrency } from "../../../utils/auth/currencyFormatter";
import { toast } from "sonner";
import "../../../styles/hr_operations/hr/CreateBudgetModal.css";
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
      className={`cbm-custom-dropdown ${error ? "cbm-error" : ""} ${
        disabled ? "cbm-disabled" : ""
      } ${isOpen ? "cbm-dropdown-open" : ""}`}
      tabIndex={disabled ? -1 : 0}
      onBlur={() => setTimeout(() => setIsOpen(false), 200)}
    >
      <div className="cbm-custom-selected" onClick={toggleDropdown}>
        <span className={!selectedOption ? "cbm-placeholder-text" : ""}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="cbm-custom-arrow"></span>
      </div>
      {isOpen && (
        <div className="cbm-custom-menu">
          {options.map((option) => (
            <div
              key={option.value}
              className={`cbm-custom-option ${
                value === option.value ? "cbm-custom-option-active" : ""
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
const CreateBudgetModal = ({ show, onHide, onBudgetCreated }) => {
  const [formData, setFormData] = useState({
    departmentId: "",
    fiscalYear: new Date().getFullYear(),
    totalBudget: "",
    allocatedAmount: "",
  });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  useEffect(() => {
    if (show) {
      fetchDepartments();
    }
  }, [show]);
  const fetchDepartments = async () => {
    try {
      const response = await budgetAllocationService.getAllDepartments();
      setDepartments(response.data || []);
    } catch (err) {
      console.error("Error fetching departments:", err);
      toast.error("Failed to load departments");
    }
  };
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
    if (!formData.departmentId) {
      newErrors.departmentId = "Please select a department";
    }
    if (!formData.fiscalYear) {
      newErrors.fiscalYear = "Please select a fiscal year";
    }
    if (!formData.totalBudget || parseFloat(formData.totalBudget) <= 0) {
      newErrors.totalBudget = "Total budget must be greater than zero";
    }
    const allocatedAmount = formData.allocatedAmount
      ? parseFloat(formData.allocatedAmount)
      : parseFloat(formData.totalBudget);
    if (allocatedAmount > parseFloat(formData.totalBudget)) {
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
      const allocatedAmount = formData.allocatedAmount
        ? parseFloat(formData.allocatedAmount)
        : parseFloat(formData.totalBudget);
      await budgetAllocationService.createDepartmentBudget({
        departmentId: formData.departmentId,
        fiscalYear: formData.fiscalYear,
        totalBudget: parseFloat(formData.totalBudget),
        allocatedAmount: allocatedAmount,
      });
      toast.success("Budget created successfully!");
      onBudgetCreated();
      handleClose();
    } catch (err) {
      console.error("Error creating budget:", err);
      toast.error(err.message || "Failed to create budget");
    } finally {
      setLoading(false);
    }
  };
  const handleClose = () => {
    setFormData({
      departmentId: "",
      fiscalYear: new Date().getFullYear(),
      totalBudget: "",
      allocatedAmount: "",
    });
    setErrors({});
    onHide();
  };
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear + 1, currentYear + 2];
  if (!show) return null;
  const departmentOptions = [
    { value: "", label: "Select Department" },
    ...departments.map((dept) => ({
      value: dept.departmentId,
      label: dept.departmentName,
    })),
  ];
  const fiscalYearOptions = years.map((year) => ({
    value: year,
    label: year.toString(),
  }));
  return (
    <>
      <div className="cbm-backdrop" onClick={handleClose} />
      <div className="cbm-modal-wrapper">
        <div className="cbm-modal-dialog">
          {/* HEADER */}
          <div className="cbm-modal-header">
            <div className="cbm-header-title">
              <i className="bi bi-plus-circle"></i>
              Add Department Budget
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              aria-label="Close"
              className="cbm-close-button"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          {/* BODY/FORM */}
          <form onSubmit={handleSubmit} className="cbm-form">
            <div className="cbm-modal-body">
              <div className="cbm-form-grid">
                {/* Department */}
                <div className="cbm-form-group">
                  <label className="cbm-form-label">
                    Department <span className="cbm-required-asterisk">*</span>
                  </label>
                  <CustomDropdown
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleChange}
                    options={departmentOptions}
                    placeholder="Select Department"
                    error={errors.departmentId}
                    disabled={loading}
                  />
                  {errors.departmentId && (
                    <div className="cbm-form-error">{errors.departmentId}</div>
                  )}
                </div>
                {/* Fiscal Year */}
                <div className="cbm-form-group">
                  <label className="cbm-form-label">
                    Fiscal Year <span className="cbm-required-asterisk">*</span>
                  </label>
                  <CustomDropdown
                    name="fiscalYear"
                    value={formData.fiscalYear}
                    onChange={handleChange}
                    options={fiscalYearOptions}
                    placeholder="Select Fiscal Year"
                    error={errors.fiscalYear}
                    disabled={loading}
                  />
                  {errors.fiscalYear && (
                    <div className="cbm-form-error">{errors.fiscalYear}</div>
                  )}
                </div>
                {/* Total Budget */}
                <div className="cbm-form-group">
                  <label className="cbm-form-label">
                    Total Budget (₹){" "}
                    <span className="cbm-required-asterisk">*</span>
                  </label>
                  <input
                    type="number"
                    name="totalBudget"
                    placeholder="Enter total budget"
                    value={formData.totalBudget}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className={`cbm-form-input ${
                      errors.totalBudget ? "cbm-input-error" : ""
                    }`}
                  />
                  {errors.totalBudget && (
                    <div className="cbm-form-error">{errors.totalBudget}</div>
                  )}
                  <small className="cbm-form-hint">
                    Total budget allocated to this department
                  </small>
                </div>
                {/* Allocated Amount */}
                <div className="cbm-form-group">
                  <label className="cbm-form-label">Allocated Amount (₹)</label>
                  <input
                    type="number"
                    name="allocatedAmount"
                    placeholder="Leave empty to allocate full budget"
                    value={formData.allocatedAmount}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className={`cbm-form-input ${
                      errors.allocatedAmount ? "cbm-input-error" : ""
                    }`}
                  />
                  {errors.allocatedAmount && (
                    <div className="cbm-form-error">
                      {errors.allocatedAmount}
                    </div>
                  )}
                  <small className="cbm-form-hint">
                    Defaults to total budget if left empty
                  </small>
                </div>
              </div>
              {/* Budget Summary */}
              {formData.totalBudget && (
                <div className="cbm-budget-summary">
                  <div className="cbm-summary-header">
                    <i className="bi bi-cash-stack cbm-summary-icon"></i>
                    <span>Budget Summary</span>
                  </div>
                  <div className="cbm-summary-grid">
                    <div className="cbm-summary-item">
                      <label className="cbm-summary-label">Total Budget:</label>
                      <span className="cbm-summary-value">
                        {formatCurrency(formData.totalBudget)}
                      </span>
                    </div>
                    <div className="cbm-summary-item">
                      <label className="cbm-summary-label">
                        Allocated Amount:
                      </label>
                      <span className="cbm-summary-value">
                        {formatCurrency(
                          formData.allocatedAmount || formData.totalBudget
                        )}
                      </span>
                    </div>
                    <div className="cbm-summary-item">
                      <label className="cbm-summary-label">Remaining:</label>
                      <span className="cbm-summary-value">
                        {formatCurrency(
                          (formData.totalBudget || 0) -
                            (formData.allocatedAmount ||
                              formData.totalBudget ||
                              0)
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* FOOTER */}
            <div className="cbm-modal-footer">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="cbm-btn-cancel"
              >
                <i className="bi bi-x-circle"></i> Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="cbm-btn-submit"
              >
                {loading ? (
                  <>
                    <span className="cbm-spinner" />
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-plus-circle"></i> Create Budget
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
export default CreateBudgetModal;
