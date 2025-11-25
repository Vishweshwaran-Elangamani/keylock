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
        newErrors.confirmationDate = "Confirmation date cannot be in the future";
      }

      if (user?.joiningDate) {
        const joiningDate = new Date(user.joiningDate);
        if (confirmDate < joiningDate) {
          newErrors.confirmationDate = "Confirmation date must be after joining date";
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
        newErrors.reportingManagerEmployeeId = "Manager ID must be a valid positive number";
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
      {/* Blurred Backdrop */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(39,35,92,0.4)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 1040,
        }}
        onClick={onHide}
      />

      {/* Modal Container */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "97%",
          maxWidth: "800px",
          zIndex: 1050,
        }}
      >
        <div
          style={{
            borderRadius: "0.5rem",
            background: "#fff",
            boxShadow: "0 8px 28px rgba(0,0,0,0.22)",
            overflow: "hidden",
            width: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* ======================== */}
          {/* MODAL HEADER */}
          {/* ======================== */}
          <div
            style={{
              background: "#27235C",
              color: "#fff",
              padding: "13px 15px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "15px",
              fontWeight: 600,
              borderRadius: "0.5rem 0.5rem 0 0",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "#fff",
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              <i className="bi bi-pencil-square"></i>
              Edit User - {user?.firstName} {user?.lastName}
            </div>
            <button
              type="button"
              onClick={onHide}
              disabled={loading}
              aria-label="Close"
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                fontSize: 18,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* ======================== */}
          {/* MODAL BODY - FORM */}
          {/* ======================== */}
          <form onSubmit={handleSubmit} style={{ margin: 0 }}>
            <div
              style={{
                padding: "14px 15px 6px 15px",
                background: "#fff",
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
                {/* Employment Type Field (Required) */}
                <div style={{ flex: 1, minWidth: "47%" }}>
                  <label
                    style={{
                      fontWeight: 600,
                      fontSize: 13,
                      color: "#334155",
                      marginBottom: 2,
                      display: "block",
                    }}
                  >
                    Employment Type{" "}
                    <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                  </label>
                  <select
                    name="employmentType"
                    value={formData.employmentType}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      border: errors.employmentType
                        ? "1px solid #dc3545"
                        : "1px solid #cbd5e1",
                      borderRadius: 6,
                      fontSize: 13,
                      background: "#fff",
                      color: "#22223b",
                      padding: "8px 9px",
                    }}
                  >
                    <option value="">Select Employment Type</option>
                    <option value="Permanent">Permanent</option>
                    <option value="Contract">Contract</option>
                    <option value="Temporary">Temporary</option>
                    <option value="Intern">Intern</option>
                    <option value="Probation">Probation</option>
                  </select>
                  {errors.employmentType && (
                    <div style={{ color: "#dc3545", fontSize: 11 }}>
                      {errors.employmentType}
                    </div>
                  )}
                </div>

                {/* Employment Status Field (Required) */}
                {/*<div style={{ flex: 1, minWidth: "47%" }}>
                  <label
                    style={{
                      fontWeight: 600,
                      fontSize: 13,
                      color: "#334155",
                      marginBottom: 2,
                      display: "block",
                    }}
                  >
                    Employment Status{" "}
                    <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                  </label>
                  <select
                    name="employmentStatus"
                    value={formData.employmentStatus}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      border: errors.employmentStatus
                        ? "1px solid #dc3545"
                        : "1px solid #cbd5e1",
                      borderRadius: 6,
                      fontSize: 13,
                      background: "#fff",
                      color: "#22223b",
                      padding: "8px 9px",
                    }}
                  >
                    <option value="">Select Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="OnLeave">On Leave</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                  {errors.employmentStatus && (
                    <div style={{ color: "#dc3545", fontSize: 11 }}>
                      {errors.employmentStatus}
                    </div>
                  )}
                </div>*/}

                {/* Exit Date Field (Optional) */}
                <div style={{ flex: 1, minWidth: "47%" }}>
                  <label
                    style={{
                      fontWeight: 600,
                      fontSize: 13,
                      color: "#334155",
                      marginBottom: 2,
                      display: "block",
                    }}
                  >
                    Exit Date
                  </label>
                  <input
                    type="date"
                    name="exitDate"
                    value={formData.exitDate}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      border: errors.exitDate
                        ? "1px solid #dc3545"
                        : "1px solid #cbd5e1",
                      borderRadius: 6,
                      padding: "8px 9px",
                      fontSize: 13,
                      background: "#fff",
                      color: "#22223b",
                    }}
                  />
                  {errors.exitDate && (
                    <div style={{ color: "#dc3545", fontSize: 11 }}>
                      {errors.exitDate}
                    </div>
                  )}
                  <small style={{ color: "#64748b", fontSize: 11 }}>
                    Must be after joining/confirmation date
                  </small>
                </div>

                {/* Work Location Field (Optional) */}
                <div style={{ flex: 1, minWidth: "47%" }}>
                  <label
                    style={{
                      fontWeight: 600,
                      fontSize: 13,
                      color: "#334155",
                      marginBottom: 2,
                      display: "block",
                    }}
                  >
                    Work Location
                  </label>
                  <input
                    type="text"
                    name="workLocation"
                    placeholder="Enter work location"
                    value={formData.workLocation}
                    onChange={handleChange}
                    maxLength={100}
                    style={{
                      width: "100%",
                      border: errors.workLocation
                        ? "1px solid #dc3545"
                        : "1px solid #cbd5e1",
                      borderRadius: 6,
                      padding: "8px 9px",
                      fontSize: 13,
                      background: "#fff",
                      color: "#22223b",
                    }}
                  />
                  {errors.workLocation && (
                    <div style={{ color: "#dc3545", fontSize: 11 }}>
                      {errors.workLocation}
                    </div>
                  )}
                  <small style={{ color: "#64748b", fontSize: 11 }}>
                    Minimum 2 characters
                  </small>
                </div>

                {/* Employee Type Field (Required) */}
                <div style={{ flex: 1, minWidth: "47%" }}>
                  <label
                    style={{
                      fontWeight: 600,
                      fontSize: 13,
                      color: "#334155",
                      marginBottom: 2,
                      display: "block",
                    }}
                  >
                    Employee Type{" "}
                    <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                  </label>
                  <select
                    name="employeeType"
                    value={formData.employeeType}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      border: errors.employeeType
                        ? "1px solid #dc3545"
                        : "1px solid #cbd5e1",
                      borderRadius: 6,
                      fontSize: 13,
                      background: "#fff",
                      color: "#22223b",
                      padding: "8px 9px",
                    }}
                  >
                    <option value="">Select Employee Type</option>
                    <option value="FullTime">Full Time</option>
                    <option value="PartTime">Part Time</option>
                    <option value="Consultant">Consultant</option>
                  </select>
                  {errors.employeeType && (
                    <div style={{ color: "#dc3545", fontSize: 11 }}>
                      {errors.employeeType}
                    </div>
                  )}
                </div>

                {/* Notice Period Field (Optional) */}
                <div style={{ flex: 1, minWidth: "47%" }}>
                  <label
                    style={{
                      fontWeight: 600,
                      fontSize: 13,
                      color: "#334155",
                      marginBottom: 2,
                      display: "block",
                    }}
                  >
                    Notice Period (Days)
                  </label>
                  <input
                    type="number"
                    name="noticePeriodDays"
                    placeholder="Enter notice period"
                    value={formData.noticePeriodDays}
                    onChange={handleChange}
                    min="0"
                    max="365"
                    style={{
                      width: "100%",
                      border: errors.noticePeriodDays
                        ? "1px solid #dc3545"
                        : "1px solid #cbd5e1",
                      borderRadius: 6,
                      padding: "8px 9px",
                      fontSize: 13,
                      background: "#fff",
                      color: "#22223b",
                    }}
                  />
                  {errors.noticePeriodDays && (
                    <div style={{ color: "#dc3545", fontSize: 11 }}>
                      {errors.noticePeriodDays}
                    </div>
                  )}
                  <small style={{ color: "#64748b", fontSize: 11 }}>
                    Maximum 365 days
                  </small>
                </div>
              </div>

              {/* Info Alert */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "#f1f5f9",
                  color: "#64748b",
                  borderRadius: 4,
                  fontSize: 12,
                  padding: "5px 8px",
                  gap: 5,
                  marginTop: 10,
                }}
              >
                <i className="bi bi-info-circle"></i>
                <small>
                  Fields marked with{" "}
                  <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span> are
                  required
                </small>
              </div>
            </div>

            {/* ======================== */}
            {/* MODAL FOOTER - ACTION BUTTONS */}
            {/* ======================== */}
            <div
              style={{
                padding: "10px 15px",
                borderTop: "1px solid #e2e8f0",
                background: "#fff",
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                borderBottomLeftRadius: "0.5rem",
                borderBottomRightRadius: "0.5rem",
              }}
            >
              {/* Cancel Button */}
              <button
                type="button"
                onClick={onHide}
                disabled={loading}
                style={{
                  background: "#6c757d",
                  border: "none",
                  color: "#fff",
                  fontWeight: 600,
                  padding: "7px 12px",
                  fontSize: 12,
                  borderRadius: 5,
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  opacity: loading ? 0.7 : 1,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.target.style.background = "#5a6268";
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.target.style.background = "#6c757d";
                }}
              >
                <i className="bi bi-x-circle"></i> Cancel
              </button>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  background:
                    "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
                  border: "none",
                  color: "#fff",
                  fontWeight: 600,
                  padding: "7px 12px",
                  fontSize: 12,
                  borderRadius: 5,
                  boxShadow: "0 2px 8px rgba(151,36,126,0.25)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.85 : 1,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.target.style.opacity = 0.93;
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.target.style.opacity = 1;
                }}
              >
                {loading ? (
                  <>
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        border: "2px solid #fff",
                        borderTop: "2px solid #E01950",
                        borderRadius: "50%",
                        animation: "spin 0.7s linear infinite",
                        display: "inline-block",
                        marginRight: 6,
                      }}
                    />
                    Updating...
                    <style>{`
                      @keyframes spin {
                        0% { transform: rotate(0deg);}
                        100% { transform: rotate(360deg);}
                      }
                    `}</style>
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
