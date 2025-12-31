
import { useState, useMemo, useRef, useEffect } from "react";
import { CloseButton } from "react-bootstrap";
import internalOpportunityService from "../../../services/internal/internalOpportunityService";
import { toast } from "sonner";
import "../../../styles/internal/CreateOpportunityModal.css";


const CustomDropdown = ({ value, onChange, options, placeholder, name, error }) => {
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
    onChange({ target: { name, value: optionValue } });
    setIsOpen(false);
  };

  return (
    <div
      ref={dropdownRef}
      className={`com-custom-dropdown ${error ? "error" : ""}`}
    >
      <div
        className="com-custom-dropdown-selected"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="com-custom-dropdown-text">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className={`com-custom-dropdown-arrow ${isOpen ? "open" : ""}`}>
          <i className="bi bi-chevron-down"></i>
        </span>
      </div>

      {isOpen && (
        <div className="com-custom-dropdown-menu">
          {options.map((option) => (
            <div
              key={option.value}
              className={`com-custom-dropdown-option ${
                value === option.value ? "selected" : ""
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

const CreateOpportunityModal = ({
  show,
  onHide,
  onOpportunityCreated,
  departments,
}) => {
  const [formData, setFormData] = useState({
    opportunityName: "",
    departmentId: "",
    description: "",
    requirements: "",
    eligibilityCriteria: "",
    deadline: "",
    status: "Active",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { minDate, maxDate } = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const min = today.toISOString().split("T")[0];
    const currentMonth = today.getMonth();
    const aprilDeadlineYear = currentMonth >= 3 ? currentYear + 1 : currentYear;
    const max = `${aprilDeadlineYear}-04-30`;
    return { minDate: min, maxDate: max };
  }, []);

  // Prepare department options
  const departmentOptions = useMemo(() => {
    return departments.map((dept) => ({
      label: dept.departmentName,
      value: dept.departmentId.toString(),
    }));
  }, [departments]);

  // Status options
  const statusOptions = [
    { label: "Active", value: "Active" },
    { label: "Pending", value: "Pending" },
    { label: "Closed", value: "Closed" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.opportunityName.trim()) {
      newErrors.opportunityName = "Opportunity name is required";
    } else if (formData.opportunityName.trim().length < 5) {
      newErrors.opportunityName =
        "Opportunity name must be at least 5 characters";
    }

    if (!formData.departmentId) {
      newErrors.departmentId = "Department is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.requirements.trim()) {
      newErrors.requirements = "Requirements are required";
    }

    if (!formData.deadline) {
      newErrors.deadline = "Deadline is required";
    } else {
      const deadlineDate = new Date(formData.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (deadlineDate < today) {
        newErrors.deadline = "Deadline cannot be in the past";
      }

      const maxDeadline = new Date(maxDate);
      if (deadlineDate > maxDeadline) {
        newErrors.deadline = `Deadline cannot be after April 30th, ${maxDeadline.getFullYear()}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please enter valid details");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        opportunityName: formData.opportunityName.trim(),
        departmentId: parseInt(formData.departmentId),
        description: formData.description.trim(),
        requirements: formData.requirements.trim(),
        eligibilityCriteria: formData.eligibilityCriteria.trim() || "",
        deadline: formData.deadline,
        status: formData.status,
      };

      const response = await internalOpportunityService.createOpportunity(
        payload
      );

      if (response.success || response.data) {
        toast.success("Opportunity created successfully!");
        setFormData({
          opportunityName: "",
          departmentId: "",
          description: "",
          requirements: "",
          eligibilityCriteria: "",
          deadline: "",
          status: "Active",
        });
        setErrors({});
        onOpportunityCreated();
        onHide();
      } else {
        toast.error(response.message || "Failed to create opportunity");
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.title ||
        error.message ||
        "Failed to create opportunity";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      opportunityName: "",
      departmentId: "",
      description: "",
      requirements: "",
      eligibilityCriteria: "",
      deadline: "",
      status: "Active",
    });
    setErrors({});
    onHide();
  };

  if (!show) return null;

  return (
    <>
      <div className="com-backdrop" onClick={handleClose} />

      <div className="com-modal-wrapper">
        <div className="com-modal-dialog">
          {/* Modal Header */}
          <div className="com-modal-header">
            <div className="com-header-title">
              <i className="bi bi-briefcase-fill"></i>
              Create Internal Opportunity
            </div>
            <CloseButton
              onClick={handleClose}
              variant="white"
              className="com-close-button"
            />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="com-form">
            {/* Modal Body */}
            <div className="com-modal-body">
              {/* Opportunity Name  */}
              <div className="com-form-group">
                <label className="com-form-label">
                  Opportunity Name{" "}
                  <span className="com-required-asterisk">*</span>
                </label>
                <input
                  type="text"
                  name="opportunityName"
                  placeholder="e.g., Senior Java Developer - Project Phoenix"
                  value={formData.opportunityName}
                  onChange={handleChange}
                  maxLength={200}
                  className={`com-form-input ${
                    errors.opportunityName ? "error" : ""
                  }`}
                />
                {errors.opportunityName && (
                  <div className="com-form-error">{errors.opportunityName}</div>
                )}
              </div>

              {/* Department and Deadline Row */}
              <div className="com-two-column-grid">
                {/* Department - Custom Dropdown */}
                <div className="com-form-group">
                  <label className="com-form-label">
                    Department <span className="com-required-asterisk">*</span>
                  </label>
                  <CustomDropdown
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleChange}
                    options={departmentOptions}
                    placeholder="Select Department"
                    error={errors.departmentId}
                  />
                  {errors.departmentId && (
                    <div className="com-form-error">{errors.departmentId}</div>
                  )}
                </div>

                {/* Deadline */}
                <div className="com-form-group">
                  <label className="com-form-label">
                    Application Deadline{" "}
                    <span className="com-required-asterisk">*</span>
                  </label>
                  <input
                    type="date"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleChange}
                    min={minDate}
                    max={maxDate}
                    className={`com-form-input ${
                      errors.deadline ? "error" : ""
                    }`}
                  />
                  {errors.deadline && (
                    <div className="com-form-error">{errors.deadline}</div>
                  )}
                  <small className="com-form-hint">
                    Select a date between{" "}
                    {new Date(minDate).toLocaleDateString()} and{" "}
                    {new Date(maxDate).toLocaleDateString()}
                  </small>
                </div>
              </div>

              {/* Description - Full Width */}
              <div className="com-form-group">
                <label className="com-form-label">
                  Description <span className="com-required-asterisk">*</span>
                </label>
                <textarea
                  name="description"
                  placeholder="Provide detailed description of the opportunity..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  maxLength={1000}
                  className={`com-form-textarea ${
                    errors.description ? "error" : ""
                  }`}
                />
                {errors.description && (
                  <div className="com-form-error">{errors.description}</div>
                )}
              </div>

              {/* Requirements - Full Width */}
              <div className="com-form-group">
                <label className="com-form-label">
                  Requirements <span className="com-required-asterisk">*</span>
                </label>
                <textarea
                  name="requirements"
                  placeholder="List required skills and qualifications..."
                  value={formData.requirements}
                  onChange={handleChange}
                  rows={3}
                  maxLength={500}
                  className={`com-form-textarea ${
                    errors.requirements ? "error" : ""
                  }`}
                />
                {errors.requirements && (
                  <div className="com-form-error">{errors.requirements}</div>
                )}
              </div>

              {/* Eligibility Criteria - Full Width */}
              <div className="com-form-group">
                <label className="com-form-label">Eligibility Criteria</label>
                <textarea
                  name="eligibilityCriteria"
                  placeholder="Define eligibility criteria (optional)..."
                  value={formData.eligibilityCriteria}
                  onChange={handleChange}
                  rows={2}
                  maxLength={500}
                  className="com-form-textarea"
                />
              </div>

              {/* Status and Info Row */}
              <div className="com-status-row">
                {/* Status - Custom Dropdown */}
                <div className="com-form-group">
                  <label className="com-form-label">
                    Status <span className="com-required-asterisk">*</span>
                  </label>
                  <CustomDropdown
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    options={statusOptions}
                    placeholder="Select Status"
                    error={errors.status}
                  />
                </div>

                {/* Info Alert - Right Side */}
                <div className="com-info-alert">
                  <i className="bi bi-info-circle-fill com-info-icon"></i>
                  <span className="com-info-text">
                    Employees will be able to view and apply for active
                    opportunities
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="com-modal-footer">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="com-btn-cancel"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="com-btn-submit"
              >
                {loading ? (
                  <>
                    <span className="com-spinner" />
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle"></i>
                    Post Opportunity
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

export default CreateOpportunityModal;
