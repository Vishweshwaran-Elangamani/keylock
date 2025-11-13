/**
 * EditRoleModal Component
 * 
 * A modal component for editing existing roles in the system.
 * Features:
 * - Form validation for role name, code, and description
 * - Real-time validation feedback
 * - Character counter for description field
 * - System role warning for protected roles
 * - Toast notifications using Sonner for success/error feedback
 * - Loading state during API operations
 * - Two-column layout for form fields
 * 
 * @param {boolean} show - Controls modal visibility
 * @param {Object} role - Role object containing current role details
 * @param {function} onClose - Callback to close the modal
 * @param {function} onSuccess - Callback after successful role update
 */

import { useState, useEffect } from "react";
import roleService from "../../../../services/auth/roleService";
import { toast } from "sonner";
import "../../../../styles/auth/roles/EditRoleModal.css";

const EditRoleModal = ({ show, role, onClose, onSuccess }) => {
  // ========================
  // STATE MANAGEMENT
  // ========================

  /**
   * Form data state - stores all editable role fields
   * Pre-populated with role's current data when modal opens
   */
  const [formData, setFormData] = useState({
    roleId: "",
    roleName: "",
    roleCode: "",
    description: "",
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
   * Effect: Populate form data when role prop changes
   * Runs when modal opens with a new role or role data updates
   */
  useEffect(() => {
    if (role) {
      setFormData({
        roleId: role.roleId,
        roleName: role.roleName || "",
        roleCode: role.roleCode || "",
        description: role.description || "",
      });
    }
  }, [role]);

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
   * - Role Name: Required, minimum 3 characters
   * - Role Code: Required, minimum 2 characters, alphanumeric only
   * - Description: Required, minimum 10 characters
   * 
   * @returns {boolean} - True if form is valid, false otherwise
   */
  const validateForm = () => {
    const newErrors = {};

    // -------- Role Name Validation --------
    if (!formData.roleName.trim()) {
      newErrors.roleName = "Role name is required";
    } else if (formData.roleName.trim().length < 3) {
      newErrors.roleName = "Role name must be at least 3 characters";
    }

    // -------- Role Code Validation --------
    if (!formData.roleCode.trim()) {
      newErrors.roleCode = "Role code is required";
    } else if (formData.roleCode.trim().length < 2) {
      newErrors.roleCode = "Role code must be at least 2 characters";
    } else if (!/^[a-zA-Z0-9]+$/.test(formData.roleCode.trim())) {
      // Only allow letters and numbers, no special characters or spaces
      newErrors.roleCode = "Role code must contain only letters and numbers";
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
   * Validates form, formats payload, and calls API to update role
   * Shows Sonner toast notifications for user feedback
   * 
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior

    // Validate form before submission
    if (!validateForm()) {
      toast.error("Please fix the form errors");
      return;
    }

    try {
      // Set loading state to disable form and show loading indicator
      setLoading(true);
      
      // Show loading toast
      toast.loading("Updating role...");

      // -------- Format Payload --------
      // Prepare data according to backend API requirements
      const payload = {
        roleId: formData.roleId,
        roleName: formData.roleName.trim() || null,
        roleCode: formData.roleCode.trim() || null,
        description: formData.description.trim() || null,
      };

      // -------- API Call --------
      // Call role service to update role
      const response = await roleService.updateRole(payload);

      // -------- Handle Success Response --------
      if (response.success) {
        toast.dismiss();
        toast.success("Role updated successfully");
        
        // Trigger success callback to refresh role list
        onSuccess();
        
        // CRITICAL: Delay closing the modal to allow toast to render
        // Without this delay, modal unmounts before toast displays
        setTimeout(() => {
          onClose();
        }, 500); // 500ms delay
        
      } else {
        // -------- Handle Failure Response --------
        toast.dismiss();
        toast.error(response.message || "Failed to update role");
      }
    } catch (error) {
      // -------- Handle Exception --------
      console.error("Error updating role:", error);
      toast.dismiss();
      toast.error(error.message || "Error updating role");
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
                Edit Role
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
                
                {/* -------- System Role Warning -------- */}
                {/* Only shown for system roles */}
                {role?.isSystemRole && (
                  <div className="warning-alert-custom">
                    <i className="bi bi-exclamation-triangle-fill"></i>
                    <div>
                      <strong>Warning:</strong> This is a system role. Changes
                      may affect core functionality.
                    </div>
                  </div>
                )}

                {/* -------- Form Grid - Two-column layout -------- */}
                <div className="form-grid">
                  
                  {/* -------- LEFT COLUMN -------- */}
                  <div className="form-column-custom">
                    
                    {/* Role ID (Disabled) */}
                    <div className="form-group-custom">
                      <label className="form-label-custom">Role ID</label>
                      <input
                        type="text"
                        className="form-input-custom form-input-disabled"
                        value={formData.roleId}
                        disabled
                      />
                    </div>

                    {/* Role Name */}
                    <div className="form-group-custom">
                      <label className="form-label-custom">
                        Role Name{" "}
                        <span className="required-mark">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-input-custom ${
                          errors.roleName ? "is-invalid" : ""
                        }`}
                        name="roleName"
                        value={formData.roleName}
                        onChange={handleChange}
                        placeholder="Enter role name (e.g., Admin, Manager)"
                        maxLength={50}
                        disabled={loading}
                      />
                      {/* Show validation error if exists */}
                      {errors.roleName && (
                        <div className="error-message">
                          {errors.roleName}
                        </div>
                      )}
                    </div>

                    {/* Role Code */}
                    <div className="form-group-custom">
                      <label className="form-label-custom">
                        Role Code{" "}
                        <span className="required-mark">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-input-custom ${
                          errors.roleCode ? "is-invalid" : ""
                        }`}
                        name="roleCode"
                        value={formData.roleCode}
                        onChange={handleChange}
                        placeholder="Enter role code (e.g., admin123, mgr01)"
                        maxLength={20}
                        disabled={loading}
                      />
                      {/* Show validation error if exists */}
                      {errors.roleCode && (
                        <div className="error-message">
                          {errors.roleCode}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* -------- RIGHT COLUMN -------- */}
                  <div className="form-column-custom">
                    
                    {/* Description */}
                    <div className="form-group-custom form-group-full-height">
                      <label className="form-label-custom">
                        Description{" "}
                        <span className="required-mark">*</span>
                      </label>
                      <textarea
                        className={`form-textarea-custom form-textarea-full-height ${
                          errors.description ? "is-invalid" : ""
                        }`}
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Enter role description (minimum 10 characters)"
                        rows={8}
                        maxLength={255}
                        disabled={loading}
                      ></textarea>
                      {/* Show validation error if exists */}
                      {errors.description && (
                        <div className="error-message">
                          {errors.description}
                        </div>
                      )}
                      {/* Character counter helper text */}
                      <small className="helper-text">
                        {formData.description.length}/255 characters
                      </small>
                    </div>
                  </div>
                </div>

                {/* -------- Info Alert -------- */}
                {/* Reminds users all fields are required */}
                <div className="info-alert">
                  <i className="bi bi-info-circle"></i>
                  <small>All fields are required for updating the role</small>
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
                
                {/* Submit Button - Updates role */}
                {/* Disabled during loading to prevent duplicate requests */}
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={loading}
                >
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
                      Update Role
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

export default EditRoleModal;
