/**
 * EditDepartmentModal Component
 *
 * A modal component for editing existing departments in the system.
 * Features:
 * - Form validation for department name, code, description, and manager
 * - Real-time validation feedback
 * - Character counter for description field
 * - Toast notifications using Sonner for success/error feedback
 * - Loading state during API operations
 * - Two-column layout for form fields
 *
 * @param {boolean} show - Controls modal visibility
 * @param {Object} department - Department object containing current department details
 * @param {function} onClose - Callback to close the modal
 * @param {function} onSuccess - Callback after successful department update
 */

import { useState, useEffect } from "react";
import departmentService from "../../../../services/auth/departmentService";
import { toast } from "sonner";
import "../../../../styles/auth/department/EditDepartmentModal.css";

const EditDepartmentModal = ({ show, department, onClose, onSuccess }) => {
  // ========================
  // STATE MANAGEMENT
  // ========================

  /**
   * Form data state - stores all editable department fields
   * Pre-populated with department's current data when modal opens
   */
  const [formData, setFormData] = useState({
    departmentId: "",
    departmentName: "",
    departmentCode: "",
    description: "",
    managerUserId: "",
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
   * Effect: Populate form data when department prop changes
   * Runs when modal opens with a new department or department data updates
   */
  useEffect(() => {
    if (department) {
      setFormData({
        departmentId: department.departmentId,
        departmentName: department.departmentName || "",
        departmentCode: department.departmentCode || "",
        description: department.description || "",
        managerUserId: department.managerUserId || "",
      });
    }
  }, [department]);

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
   * Applies comprehensive validation rules for each field
   *
   * Validation Rules:
   * - Department Name: Required, minimum 3 characters
   * - Department Code: Required, minimum 2 characters
   * - Description: Required, minimum 10 characters
   *
   * @returns {boolean} - True if form is valid, false otherwise
   */
  const validateForm = () => {
    const newErrors = {};

    // -------- Department Name Validation --------
    if (!formData.departmentName.trim()) {
      newErrors.departmentName = "Department name is required";
    } else if (formData.departmentName.trim().length < 3) {
      newErrors.departmentName =
        "Department name must be at least 3 characters";
    }

    // -------- Department Code Validation --------
    if (!formData.departmentCode.trim()) {
      newErrors.departmentCode = "Department code is required";
    } else if (formData.departmentCode.trim().length < 2) {
      newErrors.departmentCode =
        "Department code must be at least 2 characters";
    }

    // -------- Description Validation --------
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
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
   * Validates form, formats payload, and calls API to update department
   * Shows Sonner toast notifications for user feedback
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

      // Show loading toast
      toast.loading("Updating department...");

      // -------- Format Payload --------
      // Prepare data according to backend API requirements
      const payload = {
        departmentId: formData.departmentId,
        departmentName: formData.departmentName,
        departmentCode: formData.departmentCode,
        description: formData.description,
        managerUserId: formData.managerUserId
          ? parseInt(formData.managerUserId)
          : null,
      };

      // -------- API Call --------
      // Call department service to update department
      const response = await departmentService.updateDepartment(payload);

      // -------- Handle Success Response --------
      if (response.success) {
        toast.dismiss();
        toast.success("Department updated successfully");

        // Trigger success callback to refresh department list
        onSuccess();

        // CRITICAL: Delay closing the modal to allow toast to render
        // Without this delay, modal unmounts before toast displays
        setTimeout(() => {
          onClose();
        }, 500); // 500ms delay
      } else {
        // -------- Handle Failure Response --------
        toast.dismiss();
        toast.error(response.message || "Failed to update department");
      }
    } catch (error) {
      // -------- Handle Exception --------
      console.error("Error updating department:", error);
      toast.dismiss();
      toast.error(error.message || "Error updating department");
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
                <i className="bi bi-pencil-square"></i>
                Edit Department
              </h5>
              {/* Close Button - Disabled during loading to prevent interruption */}
              <button
                type="button"
                className="modal-close-btn"
                onClick={onClose}
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
                {/* -------- 2-Column Horizontal Grid -------- */}
                <div className="form-grid">
                  {/* -------- LEFT COLUMN -------- */}
                  <div className="form-column-custom">
                    {/* Department Name */}
                    <div className="form-group-custom">
                      <label className="form-label-custom">
                        Department Name <span className="required-mark">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-input-custom ${
                          errors.departmentName ? "is-invalid" : ""
                        }`}
                        name="departmentName"
                        value={formData.departmentName}
                        onChange={handleChange}
                        placeholder="Enter department name"
                        maxLength={100}
                        disabled={loading}
                      />
                      {/* Show validation error if exists */}
                      {errors.departmentName && (
                        <div className="error-message">
                          {errors.departmentName}
                        </div>
                      )}
                    </div>

                    {/* Department Code */}
                    <div className="form-group-custom">
                      <label className="form-label-custom">
                        Department Code <span className="required-mark">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-input-custom ${
                          errors.departmentCode ? "is-invalid" : ""
                        }`}
                        name="departmentCode"
                        value={formData.departmentCode}
                        onChange={handleChange}
                        placeholder="Enter department code"
                        maxLength={100}
                        disabled={loading}
                      />
                      {/* Show validation error if exists */}
                      {errors.departmentCode && (
                        <div className="error-message">
                          {errors.departmentCode}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* -------- RIGHT COLUMN -------- */}
                  <div className="form-column-custom">
                    {/* Description */}
                    <div className="form-group-custom form-group-full-height">
                      <label className="form-label-custom">
                        Description <span className="required-mark">*</span>
                      </label>
                      <textarea
                        className={`form-textarea-custom form-textarea-full-height ${
                          errors.description ? "is-invalid" : ""
                        }`}
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Enter department description"
                        rows={5}
                        maxLength={255}
                        disabled={loading}
                      ></textarea>
                      {/* Show validation error if exists */}
                      {errors.description && (
                        <div className="error-message">
                          {errors.description}
                        </div>
                      )}
                    </div>

                    {/* Manager User ID */}
                    <div className="form-group-custom">
                      <label className="form-label-custom">
                        Manager User ID{" "}
                        <span className="optional-text">(Optional)</span>
                      </label>
                      <input
                        type="number"
                        className={`form-input-custom ${
                          errors.managerUserId ? "is-invalid" : ""
                        }`}
                        name="managerUserId"
                        value={formData.managerUserId}
                        onChange={handleChange}
                        placeholder="Enter manager user ID"
                        min="1"
                        disabled={loading}
                      />
                      {/* Show validation error if exists */}
                      {errors.managerUserId && (
                        <div className="error-message">
                          {errors.managerUserId}
                        </div>
                      )}
                      {/* Helper text */}
                      <small className="helper-text">
                        Leave empty if no manager assigned
                      </small>
                    </div>
                  </div>
                </div>

                {/* -------- Info Alert -------- */}
                {/* Reminds users to update department information */}
                <div className="info-alert">
                  <i className="bi bi-info-circle"></i>
                  <small>Update department information and description</small>
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
                  onClick={onClose}
                  disabled={loading}
                >
                  <i className="bi bi-x-circle"></i>
                  Cancel
                </button>

                {/* Submit Button - Updates department */}
                {/* Disabled during loading to prevent duplicate requests */}
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? (
                    // Show loading state with spinner and text
                    <>
                      <span className="spinner-custom"></span>
                      Updating...
                    </>
                  ) : (
                    // Show normal state with action text
                    <>
                      <i className="bi bi-check-circle"></i>
                      Update Department
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

export default EditDepartmentModal;
