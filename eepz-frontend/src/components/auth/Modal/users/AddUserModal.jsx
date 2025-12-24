import { useState, useEffect } from "react";
import userService from "../../../../services/auth/userService";
import { toast } from "sonner";
import "../../../../styles/auth/user/AddUserModal.css";

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
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchNextEmployeeId = async () => {
      try {
        const response = await userService.getNextEmployeeCompanyId();
        if (response.success) {
          setFormData((prev) => ({
            ...prev,
            employeeCompanyId: response.data,
          }));
        }
      } catch (error) {
        setFormData((prev) => ({
          ...prev,
          employeeCompanyId: "",
        }));
      }
    };
    if (show) fetchNextEmployeeId();
  }, [show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "employeeCompanyId") {
      if (value === "" || /^\d+$/.test(value)) {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};

    // First Name validation
    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    else if (formData.firstName.trim().length < 2)
      newErrors.firstName = "First name must be at least 2 characters";
    else if (!/^[a-zA-Z\s]+$/.test(formData.firstName.trim()))
      newErrors.firstName = "First name must contain only letters";

    // Last Name validation
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    else if (formData.lastName.trim().length < 2)
      newErrors.lastName = "Last name must be at least 2 characters";
    else if (!/^[a-zA-Z\s]+$/.test(formData.lastName.trim()))
      newErrors.lastName = "Last name must contain only letters";

    // Employee Company ID validation
    if (!formData.employeeCompanyId.trim())
      newErrors.employeeCompanyId = "Employee Company ID is required";
    else if (!/^\d+$/.test(formData.employeeCompanyId.trim()))
      newErrors.employeeCompanyId =
        "Employee Company ID must contain only numbers";
    else {
      const idNumber = parseInt(formData.employeeCompanyId.trim());
      if (idNumber < 1000)
        newErrors.employeeCompanyId =
          "Employee Company ID must be ≥ 1000 and must be unique (i.e., not previously used)";
      else if (idNumber > 999999)
        newErrors.employeeCompanyId =
          "Employee Company ID must be less than 1000000";
    }

    // Email validation
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()))
      newErrors.email = "Please enter a valid email address";

    // Mobile Number validation - NOW REQUIRED
    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = "Mobile number is required";
    } else if (!/^[6-9][0-9]{9}$/.test(formData.mobileNumber.trim())) {
      newErrors.mobileNumber =
        "Phone number must start with 6-9 and be exactly 10 digits";
    }

    // Date of Birth validation - NOW REQUIRED
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

    // Gender validation - NOW REQUIRED
    if (!formData.gender) newErrors.gender = "Gender is required";

    // Employment Type validation - NOW REQUIRED
    if (!formData.employmentType)
      newErrors.employmentType = "Employment type is required";

    // Role validation
    if (!formData.roleId) newErrors.roleId = "Role is required";

    // Department validation
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
        mobileNumber: formData.mobileNumber.trim()
          ? `+91-${formData.mobileNumber.trim()}`
          : null,
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
          {/* HEADER */}
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

          {/* BODY/FORM */}
          <form onSubmit={handleSubmit} className="aum-form">
            <div className="aum-modal-body">
              <div className="aum-form-grid">
                {/* First Name */}
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

                {/* Last Name */}
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

                {/* Employee Company Id */}
                <div className="aum-form-group">
                  <label className="aum-form-label">
                    Employee ID <span className="aum-required-asterisk">*</span>
                  </label>
                  <input
                    type="text"
                    name="employeeCompanyId"
                    placeholder="Enter Employee ID"
                    value={formData.employeeCompanyId}
                    onChange={handleChange}
                    maxLength={6}
                    className={`aum-form-input ${
                      errors.employeeCompanyId ? "error" : ""
                    }`}
                  />
                  {errors.employeeCompanyId && (
                    <div className="aum-form-error">
                      {errors.employeeCompanyId}
                    </div>
                  )}
                  <small className="aum-form-hint">
                    Must be numeric and start from 1000 or higher
                  </small>
                </div>

                {/* Email */}
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

                {/* Mobile Number - NOW REQUIRED */}
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

                {/* Date of Birth - NOW REQUIRED */}
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

                {/* Gender - NOW REQUIRED */}
                <div className="aum-form-group">
                  <label className="aum-form-label">
                    Gender <span className="aum-required-asterisk">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={`aum-form-input ${errors.gender ? "error" : ""}`}
                  >
                    <option value="" disabled>
                      Select Gender
                    </option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="PreferNotToSay">Prefer not to say</option>
                  </select>
                  {errors.gender && (
                    <div className="aum-form-error">{errors.gender}</div>
                  )}
                </div>

                {/* Employment Type - NOW REQUIRED */}
                <div className="aum-form-group">
                  <label className="aum-form-label">
                    Employment Type{" "}
                    <span className="aum-required-asterisk">*</span>
                  </label>
                  <select
                    name="employmentType"
                    value={formData.employmentType}
                    onChange={handleChange}
                    className={`aum-form-input ${
                      errors.employmentType ? "error" : ""
                    }`}
                  >
                    <option value="" disabled>
                      Select Employment Type
                    </option>
                    <option value="Permanent">Permanent</option>
                    <option value="Contract">Contract</option>
                    <option value="Temporary">Temporary</option>
                    <option value="Intern">Intern</option>
                    <option value="Probation">Probation</option>
                  </select>
                  {errors.employmentType && (
                    <div className="aum-form-error">
                      {errors.employmentType}
                    </div>
                  )}
                </div>

                {/* Role - ADMIN ROLE EXCLUDED */}
                <div className="aum-form-group">
                  <label className="aum-form-label">
                    Role <span className="aum-required-asterisk">*</span>
                  </label>
                  <select
                    name="roleId"
                    value={formData.roleId}
                    onChange={handleChange}
                    className={`aum-form-input ${errors.roleId ? "error" : ""}`}
                  >
                    <option value="" disabled>
                      Select Role
                    </option>
                    {roles
                      .filter((role) => role.roleName !== "Admin")
                      .map((role) => (
                        <option key={role.roleId} value={role.roleId}>
                          {role.roleName}
                        </option>
                      ))}
                  </select>
                  {errors.roleId && (
                    <div className="aum-form-error">{errors.roleId}</div>
                  )}
                </div>

                {/* Department */}
                <div className="aum-form-group">
                  <label className="aum-form-label">
                    Department <span className="aum-required-asterisk">*</span>
                  </label>
                  <select
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleChange}
                    className={`aum-form-input ${
                      errors.departmentId ? "error" : ""
                    }`}
                  >
                    <option value="" disabled>
                      Select Department
                    </option>
                    {departments.map((dept) => (
                      <option key={dept.departmentId} value={dept.departmentId}>
                        {dept.departmentName}
                      </option>
                    ))}
                  </select>
                  {errors.departmentId && (
                    <div className="aum-form-error">{errors.departmentId}</div>
                  )}
                </div>
              </div>

              {/* Info Alert */}
              <div className="aum-info-alert">
                <i className="bi bi-info-circle"></i>
                <small>
                  Password is automatically generated and sent to user's email
                </small>
              </div>
            </div>

            {/* FOOTER */}
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
                disabled={loading}
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
