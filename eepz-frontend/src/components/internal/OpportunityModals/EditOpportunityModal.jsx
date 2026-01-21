import { useState, useEffect, useRef, useMemo } from "react";
import { CloseButton } from "react-bootstrap";
import { toast } from "sonner";
import internalOpportunityService from "../../../services/internal/internalOpportunityService";
import "../../../styles/internal/EditOpportunityModal.css";
const CustomDropdown = ({
  value,
  onChange,
  options,
  placeholder,
  name,
  error,
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
    onChange({ target: { name, value: optionValue } });
    setIsOpen(false);
  };
  return (
    <div
      ref={dropdownRef}
      className={`eom-custom-dropdown ${error ? "eom-error" : ""}`}
      tabIndex={0}
      onBlur={() => setTimeout(() => setIsOpen(false), 200)}
    >
      <div className="eom-custom-selected" onClick={() => setIsOpen(!isOpen)}>
        <span className={!selectedOption ? "eom-placeholder-text" : ""}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="eom-custom-arrow"></span>
      </div>
      {isOpen && (
        <div className="eom-custom-menu">
          {options.map((option) => (
            <div
              key={option.value}
              className={`eom-custom-option ${
                value === option.value ? "eom-custom-option-active" : ""
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
const EditOpportunityModal = ({
  show,
  onHide,
  onOpportunityUpdated,
  opportunity,
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
  useEffect(() => {
    if (opportunity) {
      setFormData({
        opportunityName: opportunity.opportunityName || "",
        departmentId: opportunity.departmentId || "",
        description: opportunity.description || "",
        requirements: opportunity.requirements || "",
        eligibilityCriteria: opportunity.eligibilityCriteria || "",
        deadline: opportunity.deadline
          ? opportunity.deadline.split("T")[0]
          : "",
        status: opportunity.status || "Active",
      });
    }
  }, [opportunity]);
  const departmentOptions = useMemo(() => {
    return departments.map((dept) => ({
      label: dept.departmentName,
      value: dept.departmentId.toString(),
    }));
  }, [departments]);
  const statusOptions = [
    { label: "Active", value: "Active" },
    { label: "Pending", value: "Pending" },
    { label: "Closed", value: "Closed" },
  ];
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };
  const validateForm = () => {
    const newErrors = {};
    if (!formData.opportunityName.trim()) {
      newErrors.opportunityName = "Opportunity name is required";
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
      let formattedDeadline = formData.deadline;
      if (formData.deadline) {
        const date = new Date(formData.deadline);
        formattedDeadline = date.toISOString().split("T")[0];
      }
      const payload = {
        opportunityName: formData.opportunityName.trim(),
        departmentId: parseInt(formData.departmentId),
        description: formData.description.trim(),
        requirements: formData.requirements.trim(),
        eligibilityCriteria: formData.eligibilityCriteria.trim(),
        deadline: formattedDeadline,
        status: formData.status,
      };
      console.log("Sending payload:", payload);
      const response = await internalOpportunityService.updateOpportunity(
        opportunity.opportunityId,
        payload
      );
      if (response.success) {
        toast.success("Opportunity updated successfully!");
        onOpportunityUpdated();
        onHide();
      } else {
        toast.error(response.message || "Failed to update opportunity");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to update opportunity");
    } finally {
      setLoading(false);
    }
  };
  const handleClose = () => {
    setErrors({});
    onHide();
  };
  if (!show) return null;
  return (
    <>
      <div className="eom-backdrop" onClick={handleClose} />
      <div className="eom-modal-wrapper">
        <div className="eom-modal-dialog">
          {/* Modal Header */}
          <div className="eom-modal-header">
            <div className="eom-header-title">
              <i className="bi bi-pencil-fill"></i>
              Edit Opportunity
            </div>
            <CloseButton
              onClick={handleClose}
              disabled={loading}
              variant="white"
              className="eom-close-button"
            />
          </div>
          {/* Form */}
          <form onSubmit={handleSubmit} className="eom-form">
            {/* Modal Body */}
            <div className="eom-modal-body">
              {/* Opportunity Name - Full Width */}
              <div className="eom-form-group">
                <label className="eom-form-label">
                  Opportunity Name{" "}
                  <span className="eom-required-asterisk">*</span>
                </label>
                <input
                  type="text"
                  name="opportunityName"
                  placeholder="Opportunity name"
                  value={formData.opportunityName}
                  onChange={handleChange}
                  maxLength={200}
                  className={`eom-form-input ${
                    errors.opportunityName ? "eom-input-error" : ""
                  }`}
                />
                {errors.opportunityName && (
                  <div className="eom-form-error">{errors.opportunityName}</div>
                )}
              </div>
              {/* Department and Deadline Row */}
              <div className="eom-two-column-grid">
                {/* Department - Custom Dropdown */}
                <div className="eom-form-group">
                  <label className="eom-form-label">
                    Department <span className="eom-required-asterisk">*</span>
                  </label>
                  <CustomDropdown
                    name="departmentId"
                    value={formData.departmentId.toString()}
                    onChange={handleChange}
                    options={departmentOptions}
                    placeholder="Select Department"
                    error={errors.departmentId}
                  />
                  {errors.departmentId && (
                    <div className="eom-form-error">{errors.departmentId}</div>
                  )}
                </div>
                {/* Deadline */}
                <div className="eom-form-group">
                  <label className="eom-form-label">
                    Deadline <span className="eom-required-asterisk">*</span>
                  </label>
                  <input
                    type="date"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleChange}
                    className={`eom-form-input ${
                      errors.deadline ? "eom-input-error" : ""
                    }`}
                  />
                  {errors.deadline && (
                    <div className="eom-form-error">{errors.deadline}</div>
                  )}
                </div>
              </div>
              {/* Description - Full Width */}
              <div className="eom-form-group">
                <label className="eom-form-label">
                  Description <span className="eom-required-asterisk">*</span>
                </label>
                <textarea
                  name="description"
                  placeholder="Description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  maxLength={1000}
                  className={`eom-form-textarea ${
                    errors.description ? "eom-input-error" : ""
                  }`}
                />
                {errors.description && (
                  <div className="eom-form-error">{errors.description}</div>
                )}
              </div>
              {/* Requirements - Full Width */}
              <div className="eom-form-group">
                <label className="eom-form-label">
                  Requirements <span className="eom-required-asterisk">*</span>
                </label>
                <textarea
                  name="requirements"
                  placeholder="Requirements"
                  value={formData.requirements}
                  onChange={handleChange}
                  rows={3}
                  maxLength={1000}
                  className={`eom-form-textarea ${
                    errors.requirements ? "eom-input-error" : ""
                  }`}
                />
                {errors.requirements && (
                  <div className="eom-form-error">{errors.requirements}</div>
                )}
              </div>
              {/* Eligibility Criteria - Full Width */}
              <div className="eom-form-group">
                <label className="eom-form-label">Eligibility Criteria</label>
                <textarea
                  name="eligibilityCriteria"
                  placeholder="Update Eligibility criteria (optional)..."
                  value={formData.eligibilityCriteria}
                  onChange={handleChange}
                  rows={2}
                  maxLength={500}
                  className="eom-form-textarea"
                />
              </div>
              {/* Status - Narrow Width with Custom Dropdown */}
              <div className="eom-form-group narrow">
                <label className="eom-form-label">
                  Status <span className="eom-required-asterisk">*</span>
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
            </div>
            {/* Modal Footer */}
            <div className="eom-modal-footer">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="eom-btn-cancel"
              >
                <i className="bi bi-x-circle"></i>
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="eom-btn-submit"
              >
                {loading ? (
                  <>
                    <span className="eom-spinner" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle"></i>
                    Update Opportunity
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
export default EditOpportunityModal;
