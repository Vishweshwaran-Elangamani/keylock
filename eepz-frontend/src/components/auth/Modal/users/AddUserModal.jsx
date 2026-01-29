import { useState, useEffect, useRef } from "react";
import userService from "../../../../services/auth/userService";
import { toast } from "sonner";
import "../../../../styles/auth/user/AddUserModal.css";
const CustomDropdown = ({
  value,
  onChange,
  options,
  placeholder,
  name,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
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
  useEffect(() => {
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
  }, [isOpen]);
  const handleSelect = (optionValue) => {
    onChange({ target: { name, value: optionValue } });
    setIsOpen(false);
  };
  return (
    <div
      ref={dropdownRef}
      className={`aum-custom-dropdown ${error ? "error" : ""} ${
        isOpen ? "active" : ""
      }`}
    >
      <div
        className="aum-custom-dropdown-selected"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span
          className={`aum-custom-dropdown-text ${
            !selectedOption ? "placeholder" : ""
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className={`aum-custom-dropdown-arrow ${isOpen ? "open" : ""}`} />
      </div>
      {isOpen && (
        <div
          className={`aum-custom-dropdown-menu ${
            openUpward ? "open-upward" : ""
          }`}
        >
          {options.map((option) => (
            <div
              key={option.value}
              className={`aum-custom-dropdown-option ${
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
const AddUserModal = ({ show, onHide, onUserAdded, roles, departments }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    employeeCompanyId: "",
    mobileNumber: "",
    dateOfBirthOfficial: "",
    gender: "",
    employmentType: "",
    employmentStatus: "Active",
    joiningDate: new Date().toISOString().split("T")[0],
    employeeType: "FullTime",
    roleId: "",
    departmentId: "",
  });
  const [loading, setLoading] = useState(false);
  const [loadingEmployeeId, setLoadingEmployeeId] = useState(false);
  const [errors, setErrors] = useState({});
  // Dropdown options
  const genderOptions = [
    { label: "Select Gender", value: "" },
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
  ];
  const employmentTypeOptions = [
    { label: "Select Employment Type", value: "" },
    { label: "Permanent", value: "Permanent" },
    { label: "Contract", value: "Contract" },
    { label: "Temporary", value: "Temporary" },
    { label: "Intern", value: "Intern" },
    { label: "Probation", value: "Probation" },
  ];
  const roleOptions = [
    { label: "Select Role", value: "" },
    ...roles
      .filter((role) => role.roleName !== "Admin")
      .map((role) => ({ label: role.roleName, value: role.roleId.toString() })),
  ];
  const departmentOptions = [
    { label: "Select Department", value: "" },
    ...departments.map((dept) => ({
      label: dept.departmentName,
      value: dept.departmentId.toString(),
    })),
  ];
  useEffect(() => {
    const fetchNextEmployeeId = async () => {
      if (!show) return;
      try {
        setLoadingEmployeeId(true);
        const response = await userService.getNextEmployeeCompanyId();
        if (response.success) {
          setFormData((prev) => ({
            ...prev,
            employeeCompanyId: response.data,
          }));
        } else {
          toast.error("Failed to generate Employee ID");
          setFormData((prev) => ({
            ...prev,
            employeeCompanyId: "",
          }));
        }
      } catch (error) {
        console.error("Error fetching next employee ID:", error);
        toast.error("Failed to generate Employee ID");
        setFormData((prev) => ({
          ...prev,
          employeeCompanyId: "",
        }));
      } finally {
        setLoadingEmployeeId(false);
      }
    };
    fetchNextEmployeeId();
  }, [show]);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };
  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    else if (formData.firstName.trim().length < 2)
      newErrors.firstName = "First name must be at least 2 characters";
    else if (!/^[a-zA-Z\s]+$/.test(formData.firstName.trim()))
      newErrors.firstName = "First name must contain only letters";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    else if (formData.lastName.trim().length < 2)
      newErrors.lastName = "Last name must be at least 2 characters";
    else if (!/^[a-zA-Z\s]+$/.test(formData.lastName.trim()))
      newErrors.lastName = "Last name must contain only letters";
    if (!formData.employeeCompanyId.trim())
      newErrors.employeeCompanyId = "Employee Company ID is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()))
      newErrors.email = "Please enter a valid email address";
    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = "Mobile number is required";
    } else if (!/^[6-9][0-9]{9}$/.test(formData.mobileNumber.trim())) {
      newErrors.mobileNumber =
        "Phone number must start with 6-9 and be exactly 10 digits";
    }
    if (!formData.dateOfBirthOfficial) {
      newErrors.dateOfBirthOfficial = "Date of birth is required";
    } else {
      const dob = new Date(formData.dateOfBirthOfficial);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      if (dob > today)
        newErrors.dateOfBirthOfficial = "Date of birth cannot be in the future";
      else if (age < 18)
        newErrors.dateOfBirthOfficial = "User must be at least 18 years old";
      else if (age > 100)
        newErrors.dateOfBirthOfficial = "Please enter a valid date of birth";
    }
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.employmentType)
      newErrors.employmentType = "Employment type is required";
    if (!formData.roleId) newErrors.roleId = "Role is required";
    if (!formData.departmentId)
      newErrors.departmentId = "Department is required";
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
      const payload = {
        employeeCompanyId: formData.employeeCompanyId.trim(),
        email: formData.email.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        mobileNumber: formData.mobileNumber.trim() || null,
        gender: formData.gender || null,
        dateOfBirthOfficial: formData.dateOfBirthOfficial || null,
        employmentType: formData.employmentType,
        employmentStatus: formData.employmentStatus,
        joiningDate: formData.joiningDate,
        employeeType: formData.employeeType,
        roleId: parseInt(formData.roleId),
        departmentId: parseInt(formData.departmentId),
        workLocation: null,
        noticePeriodDays: 30,
        confirmationDate: null,
        middleName: null,
        callingName: null,
        referredBy: null,
        dateOfBirthActual: null,
        alternateNumber: null,
        personalEmail: null,
        reportingManagerEmployeeId: null,
      };
      const response = await userService.createUser(payload);
      if (response.success) {
        toast.success(
          "User created successfully! Temporary password sent to email."
        );
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          employeeCompanyId: "",
          mobileNumber: "",
          dateOfBirthOfficial: "",
          gender: "",
          employmentType: "",
          employmentStatus: "Active",
          joiningDate: new Date().toISOString().split("T")[0],
          employeeType: "FullTime",
          roleId: "",
          departmentId: "",
        });
        onUserAdded?.();
        setTimeout(() => onHide(), 500);
      } else {
        toast.error(response.message || "Failed to create user");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to create user"
      );
    } finally {
      setLoading(false);
    }
  };
  if (!show) return null;
  return (
    <>
      <div className="aum-backdrop" onClick={onHide} />
      <div className="aum-modal-container">
        <div className="aum-modal-dialog">
          <div className="aum-modal-header">
            <div className="aum-header-title">
              <i className="bi bi-person-plus-fill"></i>
              Add New User
            </div>
            <button
              type="button"
              onClick={onHide}
              disabled={loading}
              aria-label="Close"
              className="aum-close-button"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="aum-form">
            <div className="aum-modal-body">
              <div className="aum-form-grid">
                <div className="aum-form-group">
                  <label className="aum-form-label">
                    First Name <span className="aum-required-asterisk">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    placeholder="Enter first name"
                    value={formData.firstName}
                    onChange={handleChange}
                    maxLength={100}
                    className={`aum-form-input ${
                      errors.firstName ? "error" : ""
                    }`}
                  />
                  {errors.firstName && (
                    <div className="aum-form-error">{errors.firstName}</div>
                  )}
                </div>
                <div className="aum-form-group">
                  <label className="aum-form-label">
                    Last Name <span className="aum-required-asterisk">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Enter last name"
                    value={formData.lastName}
                    onChange={handleChange}
                    maxLength={100}
                    className={`aum-form-input ${
                      errors.lastName ? "error" : ""
                    }`}
                  />
                  {errors.lastName && (
                    <div className="aum-form-error">{errors.lastName}</div>
                  )}
                </div>
                <div className="aum-form-group">
                  <label className="aum-form-label">
                    Employee ID <span className="aum-required-asterisk">*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      name="employeeCompanyId"
                      placeholder={
                        loadingEmployeeId ? "Generating..." : "Auto-generated"
                      }
                      value={
                        loadingEmployeeId
                          ? "Generating..."
                          : formData.employeeCompanyId
                      }
                      readOnly
                      disabled
                      className={`aum-form-input ${
                        errors.employeeCompanyId ? "error" : ""
                      }`}
                      style={{
                        backgroundColor: "#f8f9fa",
                        cursor: "not-allowed",
                        color: loadingEmployeeId ? "#6c757d" : "#28a745",
                        fontWeight: loadingEmployeeId ? "normal" : "600",
                        paddingLeft: "12px",
                      }}
                    />
                    {loadingEmployeeId && (
                      <span
                        className="aum-spinner-small"
                        style={{
                          position: "absolute",
                          right: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: "16px",
                          height: "16px",
                          borderWidth: "2px",
                        }}
                      />
                    )}
                  </div>
                  {errors.employeeCompanyId && (
                    <div className="aum-form-error">
                      {errors.employeeCompanyId}
                    </div>
                  )}
                  <small className="aum-form-hint" style={{ color: "#6c757d" }}>
                    <i className="bi bi-shield-check"></i> Auto-generated ID
                    (sequential from last ID)
                  </small>
                </div>
                <div className="aum-form-group">
                  <label className="aum-form-label">
                    Email <span className="aum-required-asterisk">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter email ID"
                    value={formData.email}
                    onChange={handleChange}
                    maxLength={255}
                    className={`aum-form-input ${errors.email ? "error" : ""}`}
                  />
                  {errors.email && (
                    <div className="aum-form-error">{errors.email}</div>
                  )}
                </div>
                <div className="aum-form-group">
                  <label className="aum-form-label">
                    Mobile <span className="aum-required-asterisk">*</span>
                  </label>
                  <div className="aum-phone-wrapper">
                    <span className="aum-phone-prefix">+91</span>
                    <input
                      type="tel"
                      name="mobileNumber"
                      placeholder="Enter mobile number"
                      value={formData.mobileNumber}
                      onChange={handleChange}
                      maxLength={10}
                      className={`aum-phone-input ${
                        errors.mobileNumber ? "error" : ""
                      }`}
                    />
                  </div>
                  {errors.mobileNumber && (
                    <div className="aum-form-error">{errors.mobileNumber}</div>
                  )}
                  <small className="aum-form-hint">
                    Must start with 6-9 (10 digits)
                  </small>
                </div>
                <div className="aum-form-group">
                  <label className="aum-form-label">
                    Date of Birth{" "}
                    <span className="aum-required-asterisk">*</span>
                  </label>
                  <input
                    type="date"
                    name="dateOfBirthOfficial"
                    placeholder="dd/mm/yyyy"
                    value={formData.dateOfBirthOfficial}
                    onChange={handleChange}
                    className={`aum-form-input ${
                      errors.dateOfBirthOfficial ? "error" : ""
                    }`}
                  />
                  {errors.dateOfBirthOfficial && (
                    <div className="aum-form-error">
                      {errors.dateOfBirthOfficial}
                    </div>
                  )}
                  <small className="aum-form-hint">Must be 18+ years old</small>
                </div>
                <div className="aum-form-group">
                  <label className="aum-form-label">
                    Gender <span className="aum-required-asterisk">*</span>
                  </label>
                  <CustomDropdown
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    options={genderOptions}
                    placeholder="Select Gender"
                    error={errors.gender}
                  />
                  {errors.gender && (
                    <div className="aum-form-error">{errors.gender}</div>
                  )}
                </div>
                <div className="aum-form-group">
                  <label className="aum-form-label">
                    Employment Type{" "}
                    <span className="aum-required-asterisk">*</span>
                  </label>
                  <CustomDropdown
                    name="employmentType"
                    value={formData.employmentType}
                    onChange={handleChange}
                    options={employmentTypeOptions}
                    placeholder="Select Employment Type"
                    error={errors.employmentType}
                  />
                  {errors.employmentType && (
                    <div className="aum-form-error">
                      {errors.employmentType}
                    </div>
                  )}
                </div>
                <div className="aum-form-group">
                  <label className="aum-form-label">
                    Role <span className="aum-required-asterisk">*</span>
                  </label>
                  <CustomDropdown
                    name="roleId"
                    value={formData.roleId}
                    onChange={handleChange}
                    options={roleOptions}
                    placeholder="Select Role"
                    error={errors.roleId}
                  />
                  {errors.roleId && (
                    <div className="aum-form-error">{errors.roleId}</div>
                  )}
                </div>
                <div className="aum-form-group">
                  <label className="aum-form-label">
                    Department <span className="aum-required-asterisk">*</span>
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
                    <div className="aum-form-error">{errors.departmentId}</div>
                  )}
                </div>
              </div>
              <div className="aum-info-alert">
                <i className="bi bi-info-circle"></i>
                <small>
                  Employee ID is auto-generated. Password is automatically
                  generated and sent to user's email.
                </small>
              </div>
            </div>
            <div className="aum-modal-footer">
              <button
                type="button"
                onClick={onHide}
                disabled={loading}
                className="aum-btn-cancel"
              >
                <i className="bi bi-x-circle"></i> Cancel
              </button>
              <button
                type="submit"
                disabled={loading || loadingEmployeeId}
                className="aum-btn-submit"
              >
                {loading ? (
                  <>
                    <span className="aum-spinner" />
                    Adding...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle"></i> Create User
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
export default AddUserModal;
