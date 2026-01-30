import { useState, useEffect, useRef, useMemo } from "react";
import nominationService from "../../../services/internal/nominationService";
import userService from "../../../services/auth/userService";
import { toast } from "sonner";
import "../../../styles/internal/ManagerNominateModal.css";
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
  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };
  return (
    <div
      ref={dropdownRef}
      className={`mgnm-custom-dropdown ${error ? "error" : ""} ${
        disabled ? "disabled" : ""
      }`}
    >
      <div className="mgnm-custom-dropdown-selected" onClick={handleToggle}>
        <span className="mgnm-custom-dropdown-text">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className={`mgnm-custom-dropdown-arrow ${isOpen ? "open" : ""}`}>
          <i className="bi bi-chevron-down"></i>
        </span>
      </div>
      {isOpen && !disabled && (
        <div className="mgnm-custom-dropdown-menu">
          {options.map((option) => (
            <div
              key={option.value}
              className={`mgnm-custom-dropdown-option ${
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
const ManagerNominateModal = ({
  show,
  onHide,
  opportunity,
  onNominationSubmitted,
}) => {
  const [formData, setFormData] = useState({
    employeeId: "",
    justification: "",
  });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [errors, setErrors] = useState({});
  useEffect(() => {
    if (show) {
      fetchEmployees();
    }
  }, [show]);
  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const userIdStr = localStorage.getItem("userId");
      if (!userIdStr) {
        console.error("No userId found in localStorage");
        toast.error("User ID not found. Please login again.");
        setEmployees([]);
        return;
      }
      const managerId = parseInt(userIdStr);
      if (isNaN(managerId) || managerId <= 0) {
        console.error("Invalid manager ID:", managerId);
        toast.error("Invalid user ID. Please login again.");
        setEmployees([]);
        return;
      }
      const response = await userService.getEmployeesByManager(managerId);
      const employeeList = response.data || response || [];
      setEmployees(employeeList);
    } catch (error) {
      console.error("Error fetching employees:", error);
      setEmployees([]);
      toast.error("Failed to load employees");
    } finally {
      setLoadingEmployees(false);
    }
  };
  const employeeOptions = useMemo(() => {
  return employees.map((emp) => {
    // Build display name with fallback to email
    let displayName = '';
    
    if (emp.firstName && emp.lastName) {
      displayName = `${emp.firstName} ${emp.lastName} (${emp.email})`;
    } else if (emp.firstName) {
      displayName = `${emp.firstName} (${emp.email})`;
    } else if (emp.lastName) {
      displayName = `${emp.lastName} (${emp.email})`;
    } else {
      // Fallback to email or employee ID
      displayName = emp.email || emp.employeeCompanyId || `User ${emp.userId}`;
    }

    return {
      label: displayName,
      value: emp.userId.toString(),
    };
  });
}, [employees]);

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
    if (!formData.employeeId) {
      newErrors.employeeId = "Please select a team member";
    }
    if (!formData.justification.trim()) {
      newErrors.justification = "Justification is required";
    } else if (formData.justification.trim().length < 50) {
      newErrors.justification = "Justification must be at least 50 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the errors");
      return;
    }
    try {
      setLoading(true);
      const payload = {
        opportunityId: opportunity.opportunityId,
        nomineeEmployeeId: parseInt(formData.employeeId),
        justification: formData.justification.trim(),
        nominationType: "Manager",
      };
      const response = await nominationService.managerNominate(payload);
      if (response.success) {
        toast.success("Team member nominated successfully!");
        onNominationSubmitted();
        onHide();
      } else {
        toast.error(response.message || "Failed to nominate team member");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to nominate team member");
    } finally {
      setLoading(false);
    }
  };
  if (!show) return null;
  return (
    <>
      <div className="mgnm-backdrop" onClick={onHide} />
      <div className="mgnm-modal-wrapper">
        <div className="mgnm-modal-dialog">
          {/* Modal Header */}
          <div className="mgnm-modal-header">
            <div className="mgnm-header-title">
              <i className="bi bi-person-plus"></i>
              Nominate Team Member
            </div>
            <button
              onClick={onHide}
              disabled={loading}
              className="mgnm-close-button"
              aria-label="Close"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          {/* Form */}
          <form onSubmit={handleSubmit} className="mgnm-form">
            {/* Modal Body */}
            <div className="mgnm-modal-body">
              {/* Info Section */}
              <div className="mgnm-info-section">
                <p className="mgnm-info-item">
                  <span className="mgnm-info-label">Opportunity:</span>{" "}
                  {opportunity.opportunityName}
                </p>
                <p className="mgnm-info-item">
                  <span className="mgnm-info-label">Department:</span>{" "}
                  {opportunity.departmentName}
                </p>
                <p className="mgnm-info-item">
                  <span className="mgnm-info-label">Deadline:</span>{" "}
                  {new Date(opportunity.deadline).toLocaleDateString()}
                </p>
              </div>
              {/* Select Team Member - Custom Dropdown */}
              <div className="mgnm-form-group">
                <label className="mgnm-form-label">
                  Select Team Member{" "}
                  <span className="mgnm-required-asterisk">*</span>
                </label>
                <CustomDropdown
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  options={employeeOptions}
                  placeholder={
                    loadingEmployees
                      ? "Loading team members..."
                      : "-- Choose a team member --"
                  }
                  disabled={loadingEmployees}
                  error={errors.employeeId}
                />
                {errors.employeeId && (
                  <div className="mgnm-form-error">{errors.employeeId}</div>
                )}
              </div>
              {/* Justification Field */}
              <div className="mgnm-form-group">
                <label className="mgnm-form-label">
                  Why is this team member a good fit?{" "}
                  <span className="mgnm-required-asterisk">*</span>
                </label>
                <textarea
                  name="justification"
                  placeholder="Explain why you believe this team member is perfect for this role..."
                  value={formData.justification}
                  onChange={handleChange}
                  rows={4}
                  maxLength={1000}
                  className={`mgnm-form-textarea ${
                    errors.justification ? "error" : ""
                  }`}
                />
                {errors.justification && (
                  <div className="mgnm-form-error">{errors.justification}</div>
                )}
                <small className="mgnm-form-hint">
                  {formData.justification.length}/1000 characters
                  {formData.justification.length >= 50 &&
                    !errors.justification && (
                      <span className="mgnm-char-success">
                        ✓ Minimum length met
                      </span>
                    )}
                </small>
              </div>
            </div>
            {/* Modal Footer */}
            <div className="mgnm-modal-footer">
              <button
                type="button"
                onClick={onHide}
                disabled={loading}
                className="mgnm-btn-cancel"
              >
                <i className="bi bi-x-circle"></i>
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="mgnm-btn-submit"
              >
                {loading ? (
                  <>
                    <span className="mgnm-spinner" />
                    Nominating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle"></i>
                    Nominate
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
export default ManagerNominateModal;
