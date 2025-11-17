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
import { toast } from "sonner"; // Using Sonner for modern toast notifications
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
        // Convert ISO date to YYYY-MM-DD format for date input
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
   * Provides immediate feedback by removing errors when user starts correcting
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
   * Applies comprehensive validation rules including date logic
   * 
   * Date Validation Logic:
   * - Confirmation date: Must be after joining date and not in future
   * - Exit date: Must be after both joining and confirmation dates
   * 
   * @returns {boolean} - True if form is valid, false otherwise
   */
  const validateForm = () => {
    const newErrors = {};

    // -------- Employment Type Validation (Required) --------
    if (!formData.employmentType) {
      newErrors.employmentType = "Employment type is required";
    }

    // -------- Employment Status Validation (Required) --------
    if (!formData.employmentStatus) {
      newErrors.employmentStatus = "Employment status is required";
    }

    // -------- Confirmation Date Validation (Optional but must be valid if provided) --------
    if (formData.confirmationDate) {
      const confirmDate = new Date(formData.confirmationDate);
      const today = new Date();

      // Check if confirmation date is in the future
      if (confirmDate > today) {
        newErrors.confirmationDate =
          "Confirmation date cannot be in the future";
      }

      // If user has joining date, confirmation should be after joining
      if (user?.joiningDate) {
        const joiningDate = new Date(user.joiningDate);
        if (confirmDate < joiningDate) {
          newErrors.confirmationDate =
            "Confirmation date must be after joining date";
        }
      }
    }

    // -------- Exit Date Validation (Optional but must be valid if provided) --------
    if (formData.exitDate) {
      const exitDate = new Date(formData.exitDate);

      // Exit date can be in future (for planned exits)
      // But must be after joining date if it exists
      if (user?.joiningDate) {
        const joiningDate = new Date(user.joiningDate);
        if (exitDate < joiningDate) {
          newErrors.exitDate = "Exit date must be after joining date";
        }
      }

      // If confirmation date exists, exit should be after confirmation
      if (formData.confirmationDate) {
        const confirmDate = new Date(formData.confirmationDate);
        if (exitDate < confirmDate) {
          newErrors.exitDate = "Exit date must be after confirmation date";
        }
      }
    }

    // -------- Work Location Validation (Optional but must be valid if provided) --------
    if (formData.workLocation.trim()) {
      if (formData.workLocation.trim().length < 2) {
        newErrors.workLocation = "Work location must be at least 2 characters";
      }
    }

    // -------- Employee Type Validation (Required) --------
    if (!formData.employeeType) {
      newErrors.employeeType = "Employee type is required";
    }

    // -------- Notice Period Validation (Optional but must be valid if provided) --------
    if (formData.noticePeriodDays) {
      const noticePeriod = parseInt(formData.noticePeriodDays);
      
      // Must be a positive number
      if (isNaN(noticePeriod) || noticePeriod < 0) {
        newErrors.noticePeriodDays = "Notice period must be a positive number";
      } 
      // Cannot exceed 365 days (1 year)
      else if (noticePeriod > 365) {
        newErrors.noticePeriodDays = "Notice period cannot exceed 365 days";
      }
    }

    // -------- Reporting Manager ID Validation (Optional but must be valid if provided) --------
    if (formData.reportingManagerEmployeeId) {
      const managerId = parseInt(formData.reportingManagerEmployeeId);
      
      // Must be a valid positive integer
      if (isNaN(managerId) || managerId < 1) {
        newErrors.reportingManagerEmployeeId =
          "Manager ID must be a valid positive number";
      }
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
   * Validates form, formats payload, and calls API to update user
   * Shows informational toast during update and success/error after completion
   * 
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior

    // Validate form before submission
    if (!validateForm()) {
      toast.error("Enter Valid Details!");
      return;
    }

    try {
      // Set loading state to disable form and show loading indicator
      setLoading(true);
      
      // Show informational toast that update is in progress
      toast.info("Updating user. Please wait...");

      // -------- Format Payload --------
      // Prepare data according to backend API requirements
      // Convert dates to ISO format and parse numeric fields
      const payload = {
        userId: formData.userId,
        employmentType: formData.employmentType || null,
        employmentStatus: formData.employmentStatus || null,
        // Convert date to ISO string for database compatibility
        confirmationDate: formData.confirmationDate
          ? new Date(formData.confirmationDate).toISOString()
          : null,
        exitDate: formData.exitDate
          ? new Date(formData.exitDate).toISOString()
          : null,
        // Parse string to integer for manager ID
        reportingManagerEmployeeId: formData.reportingManagerEmployeeId
          ? parseInt(formData.reportingManagerEmployeeId)
          : null,
        workLocation: formData.workLocation || null,
        employeeType: formData.employeeType || null,
        // Parse string to integer for notice period
        noticePeriodDays: formData.noticePeriodDays
          ? parseInt(formData.noticePeriodDays)
          : null,
        status: formData.status || null,
      };

      // -------- API Call --------
      // Call user service to update user details
      const response = await userService.updateUser(payload);

      // -------- Handle Success Response --------
      if (response.success) {
        // Show success notification using Sonner toast
        toast.success("User updated successfully!");
        
        // Trigger parent callback to refresh user list
        onUserUpdated();
      } else {
        // -------- Handle Failure Response --------
        // Show error notification with API error message
        toast.error(response.message || "Failed to update user");
      }
    } catch (error) {
      // -------- Handle Exception --------
      // Show error notification with error message
      toast.error(error.message || "Failed to update user");
    } finally {
      // -------- Cleanup --------
      // Always reset loading state regardless of success or failure
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
      <div className="modal-backdrop-edit"></div>
      
      {/* Modal Wrapper - Centers modal on screen */}
      <div className="modal-wrapper-edit">
        <div className="modal-dialog-edit">
          <div className="modal-content-edit">
            
            {/* ======================== */}
            {/* MODAL HEADER */}
            {/* ======================== */}
            <div className="modal-header-edit">
              <h5 className="modal-title-edit">
                <i className="bi bi-pencil-square"></i>
                Edit User - {user?.firstName} {user?.lastName}
              </h5>
              {/* Close Button - Disabled during loading to prevent interruption */}
              <button
                type="button"
                className="modal-close-btn-edit"
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
              <div className="modal-body-edit">
                {/* Form Grid - Two-column layout for form fields */}
                <div className="form-grid-edit">
                  
                  {/* -------- Employment Type Field (Required) -------- */}
                  <div className="form-group-edit">
                    <label className="form-label-edit">
                      Employment Type <span className="required-mark-edit">*</span>
                    </label>
                    <select
                      name="employmentType"
                      className={`form-select-edit ${
                        errors.employmentType ? "is-invalid" : ""
                      }`}
                      value={formData.employmentType}
                      onChange={handleChange}
                    >
                      <option value="">Select Employment Type</option>
                      <option value="Permanent">Permanent</option>
                      <option value="Contract">Contract</option>
                      <option value="Temporary">Temporary</option>
                      <option value="Intern">Intern</option>
                      <option value="Probation">Probation</option>
                    </select>
                    {/* Show validation error if exists */}
                    {errors.employmentType && (
                      <div className="error-message-edit">
                        {errors.employmentType}
                      </div>
                    )}
                  </div>

                  {/* -------- Employment Status Field (Required) -------- */}
                  <div className="form-group-edit">
                    <label className="form-label-edit">
                      Employment Status <span className="required-mark-edit">*</span>
                    </label>
                    <select
                      name="employmentStatus"
                      className={`form-select-edit ${
                        errors.employmentStatus ? "is-invalid" : ""
                      }`}
                      value={formData.employmentStatus}
                      onChange={handleChange}
                    >
                      <option value="">Select Status</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="OnLeave">On Leave</option>
                      <option value="Terminated">Terminated</option>
                    </select>
                    {/* Show validation error if exists */}
                    {errors.employmentStatus && (
                      <div className="error-message-edit">
                        {errors.employmentStatus}
                      </div>
                    )}
                  </div>

                  {/* -------- Confirmation Date Field (Optional) -------- */}
                  {/* Date when employee is confirmed after probation period */}
                  

                  {/* -------- Exit Date Field (Optional) -------- */}
                  {/* Date when employee left or will leave the organization */}
                  <div className="form-group-edit">
                    <label className="form-label-edit">Exit Date</label>
                    <input
                      type="date"
                      name="exitDate"
                      className={`form-input-edit ${
                        errors.exitDate ? "is-invalid" : ""
                      }`}
                      value={formData.exitDate}
                      onChange={handleChange}
                    />
                    {/* Show validation error if exists */}
                    {errors.exitDate && (
                      <div className="error-message-edit">
                        {errors.exitDate}
                      </div>
                    )}
                    {/* Helper text with validation requirements */}
                    <small className="helper-text-edit">
                      Optional - Must be after joining/confirmation date
                    </small>
                  </div>

                  {/* -------- Work Location Field (Optional) -------- */}
                  {/* Physical location where employee works */}
                  <div className="form-group-edit">
                    <label className="form-label-edit">Work Location</label>
                    <input
                      type="text"
                      name="workLocation"
                      className={`form-input-edit ${
                        errors.workLocation ? "is-invalid" : ""
                      }`}
                      placeholder="Enter work location"
                      value={formData.workLocation}
                      onChange={handleChange}
                      maxLength={100}
                    />
                    {/* Show validation error if exists */}
                    {errors.workLocation && (
                      <div className="error-message-edit">
                        {errors.workLocation}
                      </div>
                    )}
                    {/* Helper text with validation requirements */}
                    <small className="helper-text-edit">
                      Optional - Minimum 2 characters
                    </small>
                  </div>

                  {/* -------- Employee Type Field (Required) -------- */}
                  {/* Full-time, Part-time, or Consultant classification */}
                  <div className="form-group-edit">
                    <label className="form-label-edit">
                      Employee Type <span className="required-mark-edit">*</span>
                    </label>
                    <select
                      name="employeeType"
                      className={`form-select-edit ${
                        errors.employeeType ? "is-invalid" : ""
                      }`}
                      value={formData.employeeType}
                      onChange={handleChange}
                    >
                      <option value="">Select Employee Type</option>
                      <option value="FullTime">Full Time</option>
                      <option value="PartTime">Part Time</option>
                      <option value="Consultant">Consultant</option>
                    </select>
                    {/* Show validation error if exists */}
                    {errors.employeeType && (
                      <div className="error-message-edit">
                        {errors.employeeType}
                      </div>
                    )}
                  </div>

                  {/* -------- Notice Period Field (Optional) -------- */}
                  {/* Number of days required for resignation notice */}
                  <div className="form-group-edit">
                    <label className="form-label-edit">
                      Notice Period (Days)
                    </label>
                    <input
                      type="number"
                      name="noticePeriodDays"
                      className={`form-input-edit ${
                        errors.noticePeriodDays ? "is-invalid" : ""
                      }`}
                      placeholder="Enter notice period"
                      value={formData.noticePeriodDays}
                      onChange={handleChange}
                      min="0"
                      max="365"
                    />
                    {/* Show validation error if exists */}
                    {errors.noticePeriodDays && (
                      <div className="error-message-edit">
                        {errors.noticePeriodDays}
                      </div>
                    )}
                    {/* Helper text with validation requirements */}
                    <small className="helper-text-edit">
                      Optional - Maximum 365 days
                    </small>
                  </div>

                  {/* -------- Reporting Manager ID Field (Optional) -------- */}
                  {/* Employee ID of the person this employee reports to */}
                  
                </div>

                {/* -------- Info Alert -------- */}
                {/* Reminds users which fields are required */}
                <div className="info-alert-edit">
                  <i className="bi bi-info-circle"></i>
                  <small>
                    Fields marked with{" "}
                    <span className="required-mark-edit">*</span> are required
                  </small>
                </div>
              </div>

              {/* ======================== */}
              {/* MODAL FOOTER - ACTION BUTTONS */}
              {/* ======================== */}
              <div className="modal-footer-edit">
                {/* Cancel Button - Closes modal without saving changes */}
                <button
                  type="button"
                  className="btn-cancel-edit"
                  onClick={onHide}
                  disabled={loading}
                >
                  <i className="bi bi-x-circle"></i>
                  Cancel
                </button>
                
                {/* Submit Button - Saves changes and updates user */}
                {/* Disabled during loading to prevent duplicate requests */}
                <button
                  type="submit"
                  className="btn-submit-edit"
                  disabled={loading}
                >
                  {loading ? (
                    // Show loading state with spinner and text
                    <>
                      <span className="spinner-edit"></span>
                      Updating...
                    </>
                  ) : (
                    // Show normal state with action text
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
      </div>
    </>
  );
};

export default EditUserModal;
