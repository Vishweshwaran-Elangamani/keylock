import { useState, useEffect, useRef } from "react";
import userService from "../../../../services/auth/userService";
import { toast } from "sonner";
import "../../../../styles/auth/user/EditUserModal.css";
const EditUserModal = ({
  show,
  onHide,
  onUserUpdated,
  user,
  roles,
  departments,
}) => {
  const [formData, setFormData] = useState({
    userId: "",
    employmentType: "",
    employmentStatus: "",
    confirmationDate: "",
    exitDate: "",
    reportingManagerEmployeeId: "",
    workLocation: "",
    employeeType: "",
    noticePeriodDays: "",
    status: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  useEffect(() => {
    if (user) {
      setFormData({
        userId: user.userId || "",
        employmentType: user.employmentType || "",
        employmentStatus: user.employmentStatus || "",
        confirmationDate: user.confirmationDate
          ? user.confirmationDate.split("T")[0]
          : "",
        exitDate: user.exitDate ? user.exitDate.split("T")[0] : "",
        reportingManagerEmployeeId: user.reportingManagerEmployeeId || "",
        workLocation: user.workLocation || "",
        employeeType: user.employeeType || "",
        noticePeriodDays: user.noticePeriodDays || "",
        status: user.status || "",
      });
    }
  }, [user]);
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
  const CustomDropdown = ({
    options,
    value,
    onChange,
    placeholder,
    error,
    name,
    disabled,
    forceUpward = false,
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [openUpward, setOpenUpward] = useState(forceUpward);
    const dropdownRef = useRef(null);
    const toggleDropdown = () => {
      if (!disabled) {
        setIsOpen(!isOpen);
      }
    };
    const handleSelect = (selectedValue) => {
      onChange({ target: { name, value: selectedValue } });
      setIsOpen(false);
    };
    useEffect(() => {
      if (forceUpward) {
        setOpenUpward(true);
        return;
      }
      if (isOpen && dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const dropdownHeight = 250;
        if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
          setOpenUpward(true);
        } else {
          setOpenUpward(false);
        }
      }
    }, [isOpen, forceUpward]);
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target)
        ) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    const selectedOption = options.find((opt) => opt.value === value);
    return (
      <div
        ref={dropdownRef}
        className={`eum-custom-dropdown ${error ? "eum-error" : ""} ${
          disabled ? "eum-disabled" : ""
        }`}
        tabIndex={disabled ? -1 : 0}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
      >
        <div className="eum-custom-selected" onClick={toggleDropdown}>
          <span className={!selectedOption ? "eum-placeholder-text" : ""}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <span className="eum-custom-arrow"></span>
        </div>
        {isOpen && (
          <div
            className={`eum-custom-menu ${openUpward ? "eum-menu-upward" : ""}`}
          >
            {options.map((option, index) => (
              <div
                key={`${name}-${index}-${option.value}`}
                className={`eum-custom-option ${
                  value === option.value ? "eum-custom-option-active" : ""
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
  const employmentTypeOptions = [
    { value: "Permanent", label: "Permanent" },
    { value: "Contract", label: "Contract" },
    { value: "Temporary", label: "Temporary" },
    { value: "Intern", label: "Intern" },
    { value: "Probation", label: "Probation" },
  ];
  const employeeTypeOptions = [
    { value: "FullTime", label: "Full Time" },
    { value: "PartTime", label: "Part Time" },
    { value: "Consultant", label: "Consultant" },
  ];
  const validateForm = () => {
    const newErrors = {};
    if (!formData.employmentType) {
      newErrors.employmentType = "Employment type is required";
    }
    if (!formData.employmentStatus) {
      newErrors.employmentStatus = "Employment status is required";
    }
    if (formData.confirmationDate) {
      const confirmDate = new Date(formData.confirmationDate);
      const today = new Date();
      if (confirmDate > today) {
        newErrors.confirmationDate =
          "Confirmation date cannot be in the future";
      }
      if (user?.joiningDate) {
        const joiningDate = new Date(user.joiningDate);
        if (confirmDate < joiningDate) {
          newErrors.confirmationDate =
            "Confirmation date must be after joining date";
        }
      }
    }
    if (formData.exitDate) {
      const exitDate = new Date(formData.exitDate);
      if (user?.joiningDate) {
        const joiningDate = new Date(user.joiningDate);
        if (exitDate < joiningDate) {
          newErrors.exitDate = "Exit date must be after joining date";
        }
      }
      if (formData.confirmationDate) {
        const confirmDate = new Date(formData.confirmationDate);
        if (exitDate < confirmDate) {
          newErrors.exitDate = "Exit date must be after confirmation date";
        }
      }
    }
    if (formData.workLocation.trim()) {
      if (formData.workLocation.trim().length < 2) {
        newErrors.workLocation = "Work location must be at least 2 characters";
      }
    }
    if (!formData.employeeType) {
      newErrors.employeeType = "Employee type is required";
    }
    if (formData.noticePeriodDays) {
      const noticePeriod = parseInt(formData.noticePeriodDays);
      if (isNaN(noticePeriod) || noticePeriod < 0) {
        newErrors.noticePeriodDays = "Notice period must be a positive number";
      } else if (noticePeriod > 365) {
        newErrors.noticePeriodDays = "Notice period cannot exceed 365 days";
      }
    }
    if (formData.reportingManagerEmployeeId) {
      const managerId = parseInt(formData.reportingManagerEmployeeId);
      if (isNaN(managerId) || managerId < 1) {
        newErrors.reportingManagerEmployeeId =
          "Manager ID must be a valid positive number";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Enter Valid Details!");
      return;
    }
    try {
      setLoading(true);
      toast.info("Updating user. Please wait...");
      const payload = {
        userId: formData.userId,
        employmentType: formData.employmentType || null,
        employmentStatus: formData.employmentStatus || null,
        confirmationDate: formData.confirmationDate
          ? new Date(formData.confirmationDate).toISOString()
          : null,
        exitDate: formData.exitDate
          ? new Date(formData.exitDate).toISOString()
          : null,
        reportingManagerEmployeeId: formData.reportingManagerEmployeeId
          ? parseInt(formData.reportingManagerEmployeeId)
          : null,
        workLocation: formData.workLocation || null,
        employeeType: formData.employeeType || null,
        noticePeriodDays: formData.noticePeriodDays
          ? parseInt(formData.noticePeriodDays)
          : null,
        status: formData.status || null,
      };
      const response = await userService.updateUser(payload);
      if (response.success) {
        toast.success("User updated successfully!");
        onUserUpdated();
      } else {
        toast.error(response.message || "Failed to update user");
      }
    } catch (error) {
      toast.error(error.message || "Failed to update user");
    } finally {
      setLoading(false);
    }
  };
  if (!show) return null;
  return (
    <>
      <div className="eum-backdrop" onClick={onHide} />
      <div className="eum-modal-container">
        <div className="eum-modal-dialog">
          <div className="eum-modal-header">
            <div className="eum-header-title">
              <i className="bi bi-pencil-square"></i>
              Edit User - {user?.firstName} {user?.lastName}
            </div>
            <button
              type="button"
              onClick={onHide}
              disabled={loading}
              aria-label="Close"
              className="eum-close-button"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="eum-form">
            <div className="eum-modal-body">
              <div className="eum-form-grid">
                <div className="eum-form-group">
                  <label className="eum-form-label">
                    Employment Type{" "}
                    <span className="eum-required-asterisk">*</span>
                  </label>
                  <CustomDropdown
                    name="employmentType"
                    options={employmentTypeOptions}
                    value={formData.employmentType}
                    onChange={handleChange}
                    placeholder="Select Employment Type"
                    error={errors.employmentType}
                    disabled={loading}
                    forceUpward={false}
                  />
                  {errors.employmentType && (
                    <div className="eum-form-error">
                      {errors.employmentType}
                    </div>
                  )}
                </div>
                <div className="eum-form-group">
                  <label className="eum-form-label">Exit Date</label>
                  <input
                    type="date"
                    name="exitDate"
                    value={formData.exitDate}
                    onChange={handleChange}
                    disabled={loading}
                    className={`eum-form-input ${
                      errors.exitDate ? "eum-input-error" : ""
                    }`}
                  />
                  {errors.exitDate && (
                    <div className="eum-form-error">{errors.exitDate}</div>
                  )}
                  <small className="eum-form-hint">
                    Must be after joining/confirmation date
                  </small>
                </div>
                <div className="eum-form-group">
                  <label className="eum-form-label">Work Location</label>
                  <input
                    type="text"
                    name="workLocation"
                    placeholder="Enter work location"
                    value={formData.workLocation}
                    onChange={handleChange}
                    disabled={loading}
                    maxLength={100}
                    className={`eum-form-input ${
                      errors.workLocation ? "eum-input-error" : ""
                    }`}
                  />
                  {errors.workLocation && (
                    <div className="eum-form-error">{errors.workLocation}</div>
                  )}
                  <small className="eum-form-hint">Minimum 2 characters</small>
                </div>
                <div className="eum-form-group">
                  <label className="eum-form-label">
                    Employee Type{" "}
                    <span className="eum-required-asterisk">*</span>
                  </label>
                  <CustomDropdown
                    name="employeeType"
                    options={employeeTypeOptions}
                    value={formData.employeeType}
                    onChange={handleChange}
                    placeholder="Select Employee Type"
                    error={errors.employeeType}
                    disabled={loading}
                    forceUpward={true}
                  />
                  {errors.employeeType && (
                    <div className="eum-form-error">{errors.employeeType}</div>
                  )}
                </div>
                <div className="eum-form-group">
                  <label className="eum-form-label">Notice Period (Days)</label>
                  <input
                    type="number"
                    name="noticePeriodDays"
                    placeholder="30"
                    value={formData.noticePeriodDays}
                    onChange={handleChange}
                    disabled={loading}
                    min="0"
                    max="365"
                    className={`eum-form-input ${
                      errors.noticePeriodDays ? "eum-input-error" : ""
                    }`}
                  />
                  {errors.noticePeriodDays && (
                    <div className="eum-form-error">
                      {errors.noticePeriodDays}
                    </div>
                  )}
                  <small className="eum-form-hint">Maximum 365 days</small>
                </div>
              </div>
              <div className="eum-info-alert">
                <i className="bi bi-info-circle"></i>
                <small>
                  Fields marked with{" "}
                  <span className="eum-info-asterisk">*</span> are required
                </small>
              </div>
            </div>
            <div className="eum-modal-footer">
              <button
                type="button"
                onClick={onHide}
                disabled={loading}
                className="eum-btn-cancel"
              >
                <i className="bi bi-x-circle"></i>
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="eum-btn-submit"
              >
                {loading ? (
                  <>
                    <span className="eum-spinner" />
                    Updating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle"></i>
                    Update User
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
export default EditUserModal;
