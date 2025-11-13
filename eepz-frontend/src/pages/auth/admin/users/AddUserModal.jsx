/**
 * AddUserModal Component
 * 
 * A modal component for adding new users to the system.
 * Features:
 * - Multi-field user registration form with validation
 * - Real-time validation feedback
 * - Automatic password generation and email sending
 * - Support for roles, departments, and employment details
 * - Toast notifications using Sonner
 * 
 * @param {boolean} show - Controls modal visibility
 * @param {function} onHide - Callback to close the modal
 * @param {function} onUserAdded - Callback after successful user creation
 * @param {Array} roles - List of available roles
 * @param {Array} departments - List of available departments
 */

import { useState } from "react";
import userService from "../../../../services/auth/userService";
import { toast } from "sonner";
import "../../../../styles/auth/User/AddUserModal.css";

const AddUserModal = ({ show, onHide, onUserAdded, roles, departments }) => {
  // ========================
  // STATE MANAGEMENT
  // ========================

  /**
   * Form data state - stores all user input fields
   * Initialized with default values for employment details
   */
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    employeeCompanyId: "",
    mobileNumber: "",
    dateOfBirthOfficial: "",
    gender: "",
    employmentType: "Permanent", // Default employment type
    employmentStatus: "Active", // Default status
    joiningDate: new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD format
    employeeType: "FullTime", // Default employee type
    roleId: "",
    departmentId: "",
  });

  /**
   * Loading state - tracks form submission status
   * Used to disable buttons and show loading indicator
   */
  const [loading, setLoading] = useState(false);

  /**
   * Errors state - stores validation error messages for each field
   * Key = field name, Value = error message
   */
  const [errors, setErrors] = useState({});

  // ========================
  // EVENT HANDLERS
  // ========================

  /**
   * Handles input field changes
   * Updates form data and clears field-specific errors
   * 
   * @param {Event} e - Input change event
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Update form data with new value
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error for this specific field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // ========================
  // FORM VALIDATION
  // ========================

  /**
   * Validates all form fields before submission
   * Applies comprehensive validation rules for each field
   * 
   * @returns {boolean} - True if form is valid, false otherwise
   */
  const validateForm = () => {
    const newErrors = {};

    // -------- First Name Validation --------
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = "First name must be at least 2 characters";
    } else if (!/^[a-zA-Z\s]+$/.test(formData.firstName.trim())) {
      newErrors.firstName = "First name must contain only letters";
    }

    // -------- Last Name Validation --------
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters";
    } else if (!/^[a-zA-Z\s]+$/.test(formData.lastName.trim())) {
      newErrors.lastName = "Last name must contain only letters";
    }

    // -------- Username (Employee Company ID) Validation --------
    if (!formData.employeeCompanyId.trim()) {
      newErrors.employeeCompanyId = "Username is required";
    } else if (formData.employeeCompanyId.trim().length < 3) {
      newErrors.employeeCompanyId = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.employeeCompanyId.trim())) {
      newErrors.employeeCompanyId =
        "Username must contain only letters, numbers, and underscores";
    }

    // -------- Email Validation --------
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    // -------- Phone Number Validation (Optional but must be valid if provided) --------
    // Indian phone number format: starts with 6-9, exactly 10 digits
    if (formData.mobileNumber.trim()) {
      if (!/^[6-9][0-9]{9}$/.test(formData.mobileNumber.trim())) {
        newErrors.mobileNumber =
          "Phone number must start with 6-9 and be exactly 10 digits";
      }
    }

    // -------- Date of Birth Validation (Optional but must be valid if provided) --------
    if (formData.dateOfBirthOfficial) {
      const dob = new Date(formData.dateOfBirthOfficial);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();

      // Check if date is in the future
      if (dob > today) {
        newErrors.dateOfBirthOfficial = "Date of birth cannot be in the future";
      } 
      // Check minimum age requirement (18 years)
      else if (age < 18) {
        newErrors.dateOfBirthOfficial = "User must be at least 18 years old";
      } 
      // Check maximum age limit (100 years)
      else if (age > 100) {
        newErrors.dateOfBirthOfficial = "Please enter a valid date of birth";
      }
    }

    // -------- Role Validation --------
    if (!formData.roleId) {
      newErrors.roleId = "Role is required";
    }

    // -------- Department Validation --------
    if (!formData.departmentId) {
      newErrors.departmentId = "Department is required";
    }

    // Update errors state with all validation errors
    setErrors(newErrors);
    
    // Return true if no errors found, false otherwise
    return Object.keys(newErrors).length === 0;
  };

  // ========================
  // FORM SUBMISSION
  // ========================

  /**
   * Handles form submission
   * Validates form, formats payload, and calls API to create user
   * 
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateForm()) {
    toast.error("Please fix the form errors");
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

    console.log("Sending payload:", payload);

    const response = await userService.createUser(payload);

    console.log("Response:", response);

    if (response.success) {
      // Show success toast
      toast.success(
        "User created successfully! Temporary password sent to email."
      );
      
      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        employeeCompanyId: "",
        mobileNumber: "",
        dateOfBirthOfficial: "",
        gender: "",
        employmentType: "Permanent",
        employmentStatus: "Active",
        joiningDate: new Date().toISOString().split("T")[0],
        employeeType: "FullTime",
        roleId: "",
        departmentId: "",
      });
      
      // Trigger parent callback
      onUserAdded();
      
      // CRITICAL: Delay closing the modal to allow toast to render
      setTimeout(() => {
        onHide();
      }, 500); // 500ms delay
      
    } else {
      toast.error(response.message || "Failed to create user");
    }
  } catch (error) {
    console.error("Error:", error);
    toast.error(
      error.response?.data?.message ||
        error.message ||
        "Failed to create user"
    );
  } finally {
    setLoading(false);
  }
};


  // ========================
  // RENDER LOGIC
  // ========================

  // Don't render modal if show prop is false
  if (!show) return null;

  return (
    <>
      {/* Modal Backdrop - Darkens background */}
      <div className="modal-backdrop-custom"></div>
      
      {/* Modal Wrapper - Centers modal on screen */}
      <div className="modal-wrapper-custom">
        <div className="modal-dialog-custom">
          <div className="modal-content-custom">
            
            {/* ======================== */}
            {/* MODAL HEADER */}
            {/* ======================== */}
            <div className="modal-header-custom">
              <h5 className="modal-title-custom">
                <i className="bi bi-person-plus-fill"></i>
                Add New User
              </h5>
              {/* Close Button - Disabled during loading */}
              <button
                type="button"
                className="modal-close-btn"
                onClick={onHide}
                disabled={loading}
                aria-label="Close"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            {/* ======================== */}
            {/* MODAL BODY - FORM */}
            {/* ======================== */}
            <form onSubmit={handleSubmit}>
              <div className="modal-body-custom">
                {/* Form Grid - Two-column layout for form fields */}
                <div className="form-grid">
                  
                  {/* -------- First Name Field -------- */}
                  <div className="form-group-custom">
                    <label className="form-label-custom">
                      First Name <span className="required-mark">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      className={`form-input-custom ${
                        errors.firstName ? "is-invalid" : ""
                      }`}
                      placeholder="Enter first name"
                      value={formData.firstName}
                      onChange={handleChange}
                      maxLength={100}
                    />
                    {/* Show validation error if exists */}
                    {errors.firstName && (
                      <div className="error-message">{errors.firstName}</div>
                    )}
                  </div>

                  {/* -------- Last Name Field -------- */}
                  <div className="form-group-custom">
                    <label className="form-label-custom">
                      Last Name <span className="required-mark">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      className={`form-input-custom ${
                        errors.lastName ? "is-invalid" : ""
                      }`}
                      placeholder="Enter last name"
                      value={formData.lastName}
                      onChange={handleChange}
                      maxLength={100}
                    />
                    {/* Show validation error if exists */}
                    {errors.lastName && (
                      <div className="error-message">{errors.lastName}</div>
                    )}
                  </div>

                  {/* -------- Employee Company ID Field -------- */}
                  <div className="form-group-custom">
                    <label className="form-label-custom">
                      Employee Company ID{" "}
                      <span className="required-mark">*</span>
                    </label>
                    <input
                      type="text"
                      name="employeeCompanyId"
                      className={`form-input-custom ${
                        errors.employeeCompanyId ? "is-invalid" : ""
                      }`}
                      placeholder="Company Id"
                      value={formData.employeeCompanyId}
                      onChange={handleChange}
                      maxLength={50}
                    />
                    {/* Show validation error if exists */}
                    {errors.employeeCompanyId && (
                      <div className="error-message">
                        {errors.employeeCompanyId}
                      </div>
                    )}
                  </div>

                  {/* -------- Email Field -------- */}
                  <div className="form-group-custom">
                    <label className="form-label-custom">
                      Email <span className="required-mark">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      className={`form-input-custom ${
                        errors.email ? "is-invalid" : ""
                      }`}
                      placeholder="user@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      maxLength={255}
                    />
                    {/* Show validation error if exists */}
                    {errors.email && (
                      <div className="error-message">{errors.email}</div>
                    )}
                  </div>

                  {/* -------- Phone Number Field (Optional) -------- */}
                  <div className="form-group-custom">
                    <label className="form-label-custom">Phone Number</label>
                    {/* Input group with country code prefix */}
                    <div className="input-group-custom">
                      <span className="input-prefix">+91</span>
                      <input
                        type="tel"
                        name="mobileNumber"
                        className={`form-input-custom input-with-prefix ${
                          errors.mobileNumber ? "is-invalid" : ""
                        }`}
                        placeholder="9876543210"
                        value={formData.mobileNumber}
                        onChange={handleChange}
                        maxLength={10}
                      />
                    </div>
                    {/* Show validation error if exists */}
                    {errors.mobileNumber && (
                      <div className="error-message">{errors.mobileNumber}</div>
                    )}
                    {/* Helper text with validation requirements */}
                    <small className="helper-text">
                      Optional - Must start with 6-9 (10 digits)
                    </small>
                  </div>

                  {/* -------- Date of Birth Field (Optional) -------- */}
                  <div className="form-group-custom">
                    <label className="form-label-custom">Date of Birth</label>
                    <input
                      type="date"
                      name="dateOfBirthOfficial"
                      className={`form-input-custom ${
                        errors.dateOfBirthOfficial ? "is-invalid" : ""
                      }`}
                      value={formData.dateOfBirthOfficial}
                      onChange={handleChange}
                    />
                    {/* Show validation error if exists */}
                    {errors.dateOfBirthOfficial && (
                      <div className="error-message">
                        {errors.dateOfBirthOfficial}
                      </div>
                    )}
                    {/* Helper text with validation requirements */}
                    <small className="helper-text">
                      Optional - Must be 18+ years old
                    </small>
                  </div>

                  {/* -------- Gender Field (Optional) -------- */}
                  <div className="form-group-custom">
                    <label className="form-label-custom">Gender</label>
                    <select
                      name="gender"
                      className="form-select-custom"
                      value={formData.gender}
                      onChange={handleChange}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="PreferNotToSay">Prefer not to say</option>
                    </select>
                  </div>

                  {/* -------- Employment Type Field -------- */}
                  <div className="form-group-custom">
                    <label className="form-label-custom">
                      Employment Type <span className="required-mark">*</span>
                    </label>
                    <select
                      name="employmentType"
                      className="form-select-custom"
                      value={formData.employmentType}
                      onChange={handleChange}
                    >
                      <option value="Permanent">Permanent</option>
                      <option value="Contract">Contract</option>
                      <option value="Temporary">Temporary</option>
                      <option value="Intern">Intern</option>
                      <option value="Probation">Probation</option>
                    </select>
                  </div>

                  {/* -------- Role Field -------- */}
                  <div className="form-group-custom">
                    <label className="form-label-custom">
                      Role <span className="required-mark">*</span>
                    </label>
                    <select
                      name="roleId"
                      className={`form-select-custom ${
                        errors.roleId ? "is-invalid" : ""
                      }`}
                      value={formData.roleId}
                      onChange={handleChange}
                    >
                      <option value="">Select Role</option>
                      {/* Map through roles array to create options */}
                      {roles.map((role) => (
                        <option key={role.roleId} value={role.roleId}>
                          {role.roleName}
                        </option>
                      ))}
                    </select>
                    {/* Show validation error if exists */}
                    {errors.roleId && (
                      <div className="error-message">{errors.roleId}</div>
                    )}
                  </div>

                  {/* -------- Department Field -------- */}
                  <div className="form-group-custom">
                    <label className="form-label-custom">
                      Department <span className="required-mark">*</span>
                    </label>
                    <select
                      name="departmentId"
                      className={`form-select-custom ${
                        errors.departmentId ? "is-invalid" : ""
                      }`}
                      value={formData.departmentId}
                      onChange={handleChange}
                    >
                      <option value="">Select Department</option>
                      {/* Map through departments array to create options */}
                      {departments.map((dept) => (
                        <option
                          key={dept.departmentId}
                          value={dept.departmentId}
                        >
                          {dept.departmentName}
                        </option>
                      ))}
                    </select>
                    {/* Show validation error if exists */}
                    {errors.departmentId && (
                      <div className="error-message">{errors.departmentId}</div>
                    )}
                  </div>
                </div>

                {/* -------- Info Alert -------- */}
                {/* Informs user about automatic password generation */}
                <div className="info-alert">
                  <i className="bi bi-info-circle"></i>
                  <small>
                    Password is automatically generated and sent to user's email
                  </small>
                </div>
              </div>

              {/* ======================== */}
              {/* MODAL FOOTER - ACTION BUTTONS */}
              {/* ======================== */}
              <div className="modal-footer-custom">
                {/* Cancel Button - Closes modal without saving */}
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={onHide}
                  disabled={loading}
                >
                  <i className="bi bi-x-circle"></i>
                  Cancel
                </button>
                
                {/* Submit Button - Creates new user */}
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? (
                    // Show loading state with spinner
                    <>
                      <span className="spinner-custom"></span>
                      Adding...
                    </>
                  ) : (
                    // Show normal state
                    <>
                      <i className="bi bi-check-circle"></i>
                      Add User
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddUserModal;
