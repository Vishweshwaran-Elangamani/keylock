/**
 * EditUserModal Component
 *
 * A modal component for editing employment and work-related details of existing users.
 * Features:
 * - Edit employment type, status, dates, and work details
 * - Comprehensive date validation (confirmation, exit dates)
 * - Real-time validation with error feedback
 * - Prevents invalid date combinations (e.g., exit before joining)
 * - Toast notifications using Sonner for success/error feedback
 * - Loading state during API operations
 *
 * @param {boolean} show - Controls modal visibility
 * @param {function} onHide - Callback to close the modal
 * @param {function} onUserUpdated - Callback after successful update
 * @param {Object} user - User object containing current user details
 * @param {Array} roles - List of available roles (not used in this component)
 * @param {Array} departments - List of available departments (not used in this component)
 */

import { useState, useEffect } from "react";
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
  // ========================
  // STATE MANAGEMENT
  // ========================

  /**
   * Form data state - stores all editable employment fields
   * Pre-populated with user's current data when modal opens
   */
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
  // EFFECTS
  // ========================

  /**
   * Effect: Populate form data when user prop changes
   * Runs when modal opens with a new user or user data updates
   * Converts ISO date strings to YYYY-MM-DD format for date inputs
   */
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

  // ========================
  // FORM VALIDATION
  // ========================

  /**
   * Validates all form fields before submission
   * @returns {boolean} - True if form is valid, false otherwise
   */
  const validateForm = () => {
    const newErrors = {};

    // Employment Type Validation (Required)
    if (!formData.employmentType) {
      newErrors.employmentType = "Employment type is required";
    }

    // Employment Status Validation (Required)
    if (!formData.employmentStatus) {
      newErrors.employmentStatus = "Employment status is required";
    }

    // Confirmation Date Validation (Optional but must be valid if provided)
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

    // Exit Date Validation (Optional but must be valid if provided)
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

    // Work Location Validation (Optional but must be valid if provided)
    if (formData.workLocation.trim()) {
      if (formData.workLocation.trim().length < 2) {
        newErrors.workLocation = "Work location must be at least 2 characters";
      }
    }

    // Employee Type Validation (Required)
    if (!formData.employeeType) {
      newErrors.employeeType = "Employee type is required";
    }

    // Notice Period Validation (Optional but must be valid if provided)
    if (formData.noticePeriodDays) {
      const noticePeriod = parseInt(formData.noticePeriodDays);

      if (isNaN(noticePeriod) || noticePeriod < 0) {
        newErrors.noticePeriodDays = "Notice period must be a positive number";
      } else if (noticePeriod > 365) {
        newErrors.noticePeriodDays = "Notice period cannot exceed 365 days";
      }
    }

    // Reporting Manager ID Validation (Optional but must be valid if provided)
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

  // ========================
  // FORM SUBMISSION
  // ========================

  /**
   * Handles form submission
   * @param {Event} e - Form submit event
   */
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

  // ========================
  // RENDER LOGIC
  // ========================

  if (!show) return null;

  return (
    <>
      <div className="eum-backdrop" onClick={onHide} />

      <div className="eum-modal-container">
        <div className="eum-modal-dialog">
          {/* ======================== */}
          {/* MODAL HEADER */}
          {/* ======================== */}
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

          {/* ======================== */}
          {/* MODAL BODY - FORM */}
          {/* ======================== */}
          <form onSubmit={handleSubmit} className="eum-form">
            <div className="eum-modal-body">
              <div className="eum-form-grid">
                {/* Employment Type Field (Required) */}
                <div className="eum-form-group">
                  <label className="eum-form-label">
                    Employment Type{" "}
                    <span className="eum-required-asterisk">*</span>
                  </label>
                  <select
                    name="employmentType"
                    value={formData.employmentType}
                    onChange={handleChange}
                    className={`eum-form-input ${
                      errors.employmentType ? "error" : ""
                    }`}
                  >
                    <option value="">Select Employment Type</option>
                    <option value="Permanent">Permanent</option>
                    <option value="Contract">Contract</option>
                    <option value="Temporary">Temporary</option>
                    <option value="Intern">Intern</option>
                    <option value="Probation">Probation</option>
                  </select>
                  {errors.employmentType && (
                    <div className="eum-form-error">
                      {errors.employmentType}
                    </div>
                  )}
                </div>

                {/* Exit Date Field (Optional) */}
                <div className="eum-form-group">
                  <label className="eum-form-label">Exit Date</label>
                  <input
                    type="date"
                    name="exitDate"
                    value={formData.exitDate}
                    onChange={handleChange}
                    className={`eum-form-input ${
                      errors.exitDate ? "error" : ""
                    }`}
                  />
                  {errors.exitDate && (
                    <div className="eum-form-error">{errors.exitDate}</div>
                  )}
                  <small className="eum-form-hint">
                    Must be after joining/confirmation date
                  </small>
                </div>

                {/* Work Location Field (Optional) */}
                <div className="eum-form-group">
                  <label className="eum-form-label">Work Location</label>
                  <input
                    type="text"
                    name="workLocation"
                    placeholder="Enter work location"
                    value={formData.workLocation}
                    onChange={handleChange}
                    maxLength={100}
                    className={`eum-form-input ${
                      errors.workLocation ? "error" : ""
                    }`}
                  />
                  {errors.workLocation && (
                    <div className="eum-form-error">{errors.workLocation}</div>
                  )}
                  <small className="eum-form-hint">Minimum 2 characters</small>
                </div>

                {/* Employee Type Field (Required) */}
                <div className="eum-form-group">
                  <label className="eum-form-label">
                    Employee Type{" "}
                    <span className="eum-required-asterisk">*</span>
                  </label>
                  <select
                    name="employeeType"
                    value={formData.employeeType}
                    onChange={handleChange}
                    className={`eum-form-input ${
                      errors.employeeType ? "error" : ""
                    }`}
                  >
                    <option value="">Select Employee Type</option>
                    <option value="FullTime">Full Time</option>
                    <option value="PartTime">Part Time</option>
                    <option value="Consultant">Consultant</option>
                  </select>
                  {errors.employeeType && (
                    <div className="eum-form-error">{errors.employeeType}</div>
                  )}
                </div>

                {/* Notice Period Field (Optional) */}
                <div className="eum-form-group">
                  <label className="eum-form-label">Notice Period (Days)</label>
                  <input
                    type="number"
                    name="noticePeriodDays"
                    placeholder="Enter notice period"
                    value={formData.noticePeriodDays}
                    onChange={handleChange}
                    min="0"
                    max="365"
                    className={`eum-form-input ${
                      errors.noticePeriodDays ? "error" : ""
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

              {/* Info Alert */}
              <div className="eum-info-alert">
                <i className="bi bi-info-circle"></i>
                <small>
                  Fields marked with{" "}
                  <span className="eum-info-asterisk">*</span> are required
                </small>
              </div>
            </div>

            {/* ======================== */}
            {/* MODAL FOOTER - ACTION BUTTONS */}
            {/* ======================== */}
            <div className="eum-modal-footer">
              {/* Cancel Button */}
              <button
                type="button"
                onClick={onHide}
                disabled={loading}
                className="eum-btn-cancel"
              >
                <i className="bi bi-x-circle"></i> Cancel
              </button>

              {/* Submit Button */}
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
                    <i className="bi bi-check-circle"></i> Update User
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
