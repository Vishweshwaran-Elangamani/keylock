/**
 * ChangePassword Component
 *
 * A form for changing or setting a user's password.
 * Features:
 * - Password strength indicator and validation
 * - Real-time password requirement feedback
 * - Show/hide password toggle
 * - Error handling and user feedback
 * - Toast notifications using Sonner for success/error feedback
 * - Responsive layout for first-time login vs regular password change
 *
 * @component
 */

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../contexts/auth/AuthContext";
import api from "../../../services/api";
import { toast } from "sonner";
import "../../../styles/auth/common/ChangePassword.css";
import logo from "../../../assets/logodarkbarred.png";

const ChangePassword = () => {
  // ========================
  // STATE MANAGEMENT
  // ========================

  /**
   * Form data state - stores password fields
   */
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  /**
   * Show/hide password state - controls password visibility
   */
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  /**
   * Error state - stores form validation errors
   */
  const [error, setError] = useState("");

  /**
   * Loading state - tracks form submission status
   */
  const [loading, setLoading] = useState(false);

  /**
   * Password strength state - tracks password strength level
   */
  const [passwordStrength, setPasswordStrength] = useState("");

  /**
   * Password validation state - tracks requirement fulfillment
   */
  const [validations, setValidations] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasDigit: false,
    hasSpecialChar: false,
  });

  // ========================
  // HOOKS & NAVIGATION
  // ========================
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // ========================
  // ROUTE STATE
  // ========================
  const isFirstLogin = location.state?.isFirstLogin || false;
  const fromSettings = location.state?.fromSettings || false;

  // ========================
  // PASSWORD REQUIREMENTS
  // ========================
  const PASSWORD_REQUIREMENTS = {
    requireUppercase: true,
    requireLowercase: true,
    requireDigit: true,
    requireSpecialChar: true,
    minLength: 8,
  };

  // ========================
  // EFFECTS
  // ========================

  /**
   * Effect: Check authentication on component mount
   * Logs authentication status for debugging
   */
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("accessToken");
      console.log("Token exists:", !!token);

      if (token) {
        console.log("Token (first 20 chars):", token.substring(0, 20) + "...");
      }

      if (user) {
        console.log("User from context:", user);
      }
    };

    checkAuth();
  }, [user]);

  /**
   * Effect: Redirect if not authenticated
   * Shows error toast and redirects to login if needed
   */
  useEffect(() => {
    // If not first login and no user, redirect to login
    if (!isFirstLogin && !user) {
      toast.error("Please login first");
      navigate("/login");
    }
  }, [user, isFirstLogin, navigate]);

  // ========================
  // PASSWORD VALIDATION
  // ========================

  /**
   * Evaluates password strength based on multiple criteria
   * Returns: "weak", "medium", or "strong"
   *
   * @param {string} password - Password to evaluate
   * @returns {string} Strength level
   */
  const evaluatePasswordStrength = (password) => {
    let score = 0;
    if (!password) return "";
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 2) return "weak";
    if (score <= 4) return "medium";
    return "strong";
  };

  /**
   * Validates password against requirements
   * Updates validations state with requirement status
   *
   * @param {string} password - Password to validate
   * @returns {Object} Validation results
   */
  const validatePasswordRequirements = (password) => {
    const newValidations = {
      minLength: password.length >= PASSWORD_REQUIREMENTS.minLength,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasDigit: /[0-9]/.test(password),
      hasSpecialChar: /[^a-zA-Z0-9]/.test(password),
    };
    setValidations(newValidations);
    return newValidations;
  };

  /**
   * Validates password for form submission
   * Returns error message if validation fails
   *
   * @param {string} password - Password to validate
   * @returns {string} Error message or empty string
   */
  const validatePassword = (password) => {
    if (password.length < PASSWORD_REQUIREMENTS.minLength) {
      return `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`;
    }
    if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (PASSWORD_REQUIREMENTS.requireDigit && !/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    }
    if (
      PASSWORD_REQUIREMENTS.requireSpecialChar &&
      !/[^a-zA-Z0-9]/.test(password)
    ) {
      return "Password must contain at least one special character";
    }
    return "";
  };

  // ========================
  // EVENT HANDLERS
  // ========================

  /**
   * Handles input field changes
   * Updates form data and password validation
   * Clears errors when user starts typing
   *
   * @param {Event} e - Input change event
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "newPassword") {
      setPasswordStrength(evaluatePasswordStrength(value));
      validatePasswordRequirements(value);

      if (error && value.length > 0) {
        setError("");
      }
    }

    if (name === "confirmPassword" && error) {
      setError("");
    }
  };

  /**
   * Handles form submission
   * Validates all fields and makes API call
   * Shows Sonner toast notifications for user feedback
   *
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate current password for non-first-login users
    if (!isFirstLogin && !formData.currentPassword) {
      setError("Current password is required");
      return;
    }

    const validationError = validatePassword(formData.newPassword);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!isFirstLogin && formData.currentPassword === formData.newPassword) {
      setError("New password must be different from current password");
      return;
    }

    setLoading(true);

    try {
      console.log("Changing password...");
      console.log("Is First Login:", isFirstLogin);
      console.log("From Settings:", fromSettings);

      // Show loading toast
      toast.loading("Changing password...");

      const response = await api.post("/Authentication/change-password", {
        currentPassword: formData.currentPassword || "",
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });

      console.log("Change Password Response:", response.data);

      if (!response.data.success) {
        toast.dismiss();
        setError(response.data.message || "Failed to change password");
        toast.error(response.data.message || "Failed to change password");
        setLoading(false);
        return;
      }

      // Handle first-time user flow
      if (isFirstLogin) {
        console.log("First-time user password changed successfully");

        localStorage.removeItem("tempUser");
        localStorage.removeItem("firstLoginOtpLockout");

        toast.dismiss();
        toast.success(
          "Password set successfully! Please login with your new password."
        );

        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 1500);
        return;
      }

      // Handle regular password change (from settings/dropdown)
      toast.dismiss();
      toast.success("Password changed successfully!");

      setTimeout(() => {
        navigate(-1);
      }, 1500);
    } catch (err) {
      console.error("Change password error:", err);
      console.error("Error response:", err.response?.data);

      let errorMessage = "Failed to change password";

      if (err.response?.status === 401) {
        errorMessage = "Current password is incorrect";
      } else if (err.response?.status === 400) {
        if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data?.errors) {
          const errors = err.response.data.errors;
          const errorMessages = Object.values(errors).flat();
          errorMessage = errorMessages.join("; ");
        }
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      console.error("Error message:", errorMessage);
      toast.dismiss();
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gets color for password strength indicator
   *
   * @returns {string} CSS color value
   */
  const getStrengthColor = () => {
    switch (passwordStrength) {
      case "weak":
        return "#dc3545";
      case "medium":
        return "#ffc107";
      case "strong":
        return "#198754";
      default:
        return "#dee2e6";
    }
  };

  /**
   * Gets width for password strength indicator
   *
   * @returns {string} CSS width value
   */
  const getStrengthWidth = () => {
    switch (passwordStrength) {
      case "weak":
        return "33%";
      case "medium":
        return "66%";
      case "strong":
        return "100%";
      default:
        return "0%";
    }
  };

  /**
   * Checks if all password requirements are met
   *
   * @returns {boolean} True if all requirements passed
   */
  const allValidationsPassed = Object.values(validations).every((v) => v);

  /**
   * Handles cancel button click
   * Navigates back to previous page
   */
  const handleCancel = () => {
    navigate(-1);
  };

  // ========================
  // RENDER LOGIC
  // ========================
  return (
    <div className="change-password-container">
      <div className="change-password-card">
        <div className="change-password-header">
          <div className="logo-section">
            <img
              src={logo}
              alt="EEPZ Logo"
              className="logo-img-cp"
              style={{
                width: "200px",
              }}
            />
          </div>
          <h2 className="change-password-title">
            <i className="bi bi-key"></i>
            {isFirstLogin ? "Set New Password" : "Change Password"}
          </h2>
          <p className="change-password-subtitle">
            {isFirstLogin
              ? "Create a strong password for your account"
              : "Update your account password"}
          </p>
          {isFirstLogin && (
            <div className="info-banner">
              <i className="bi bi-info-circle-fill"></i>
              <span>
                After setting your password, you'll need to login again with
                your new credentials.
              </span>
            </div>
          )}
        </div>

        <div className="change-password-body">
          {error && (
            <div className="error-alert-cp">
              <i className="bi bi-exclamation-triangle-fill"></i>
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* 2-Column Grid Layout (only for non-first-login) */}
            {!isFirstLogin ? (
              <div className="form-grid-cp">
                {/* LEFT COLUMN - Current Password */}
                <div className="form-column-cp">
                  <div className="form-group-cp">
                    <label htmlFor="currentPassword" className="form-label-cp">
                      <i className="bi bi-shield-lock"></i>
                      Current Password
                    </label>
                    <div className="password-input-cp">
                      <input
                        type={showPasswords.current ? "text" : "password"}
                        className="form-input-cp"
                        id="currentPassword"
                        name="currentPassword"
                        placeholder="Enter current password"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        required
                      />
                      <button
                        className="toggle-password-cp"
                        type="button"
                        onClick={() =>
                          setShowPasswords((prev) => ({
                            ...prev,
                            current: !prev.current,
                          }))
                        }
                        title={
                          showPasswords.current
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        <i
                          className={`bi ${
                            showPasswords.current
                              ? "bi-eye-slash-fill"
                              : "bi-eye-fill"
                          }`}
                        ></i>
                      </button>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN - New Passwords */}
                <div className="form-column-cp">
                  {/* New Password */}
                  <div className="form-group-cp">
                    <label htmlFor="newPassword" className="form-label-cp">
                      <i className="bi bi-lock"></i>
                      New Password
                      {/* Hover Tooltip */}
                      <div className="info-icon-wrapper-cp">
                        <div
                          className="info-icon-cp"
                          title="Password requirements"
                        >
                          <i className="bi bi-info-circle"></i>
                        </div>
                        {/* Tooltip content shown on hover */}
                        <div className="password-requirements-tooltip-cp">
                          <strong>Requirements:</strong>
                          <ul>
                            <li>At least 8 characters long</li>
                            <li>One uppercase & lowercase letter</li>
                            <li>One number & special character</li>
                          </ul>
                        </div>
                      </div>
                    </label>
                    <div className="password-input-cp">
                      <input
                        type={showPasswords.new ? "text" : "password"}
                        className="form-input-cp"
                        id="newPassword"
                        name="newPassword"
                        placeholder="Enter new password"
                        value={formData.newPassword}
                        onChange={handleChange}
                        required
                      />
                      <button
                        className="toggle-password-cp"
                        type="button"
                        onClick={() =>
                          setShowPasswords((prev) => ({
                            ...prev,
                            new: !prev.new,
                          }))
                        }
                        title={
                          showPasswords.new ? "Hide password" : "Show password"
                        }
                      >
                        <i
                          className={`bi ${
                            showPasswords.new
                              ? "bi-eye-slash-fill"
                              : "bi-eye-fill"
                          }`}
                        ></i>
                      </button>
                    </div>

                    {formData.newPassword && (
                      <div className="strength-indicator">
                        <div className="strength-bar-wrapper">
                          <div
                            className="strength-bar-fill"
                            style={{
                              width: getStrengthWidth(),
                              backgroundColor: getStrengthColor(),
                            }}
                          ></div>
                        </div>
                        <small className="strength-text">
                          Strength:{" "}
                          <span
                            style={{
                              color: getStrengthColor(),
                              fontWeight: "600",
                            }}
                          >
                            {passwordStrength.toUpperCase()}
                          </span>
                        </small>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="form-group-cp">
                    <label htmlFor="confirmPassword" className="form-label-cp">
                      <i className="bi bi-lock-fill"></i>
                      Confirm New Password
                    </label>
                    <div className="password-input-cp">
                      <input
                        type={showPasswords.confirm ? "text" : "password"}
                        className="form-input-cp"
                        id="confirmPassword"
                        name="confirmPassword"
                        placeholder="Re-enter new password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                      />
                      <button
                        className="toggle-password-cp"
                        type="button"
                        onClick={() =>
                          setShowPasswords((prev) => ({
                            ...prev,
                            confirm: !prev.confirm,
                          }))
                        }
                        title={
                          showPasswords.confirm
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        <i
                          className={`bi ${
                            showPasswords.confirm
                              ? "bi-eye-slash-fill"
                              : "bi-eye-fill"
                          }`}
                        ></i>
                      </button>
                    </div>
                    {formData.confirmPassword && (
                      <small
                        className={
                          formData.newPassword === formData.confirmPassword
                            ? "match-success"
                            : "match-error"
                        }
                      >
                        <i
                          className={`bi ${
                            formData.newPassword === formData.confirmPassword
                              ? "bi-check-circle-fill"
                              : "bi-x-circle-fill"
                          }`}
                        ></i>
                        {formData.newPassword === formData.confirmPassword
                          ? "Passwords match"
                          : "Passwords do not match"}
                      </small>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // First Login: Vertical Layout (single column)
              <>
                <div className="form-group-cp">
                  <label htmlFor="newPassword" className="form-label-cp">
                    <i className="bi bi-lock"></i>
                    New Password
                    {/* Hover Tooltip */}
                    <div className="info-icon-wrapper-cp">
                      <div
                        className="info-icon-cp"
                        title="Password requirements"
                      >
                        <i className="bi bi-info-circle"></i>
                      </div>
                      <div className="password-requirements-tooltip-cp">
                        <strong>Requirements:</strong>
                        <ul>
                          <li>At least 8 characters long</li>
                          <li>One uppercase & lowercase letter</li>
                          <li>One number & special character</li>
                        </ul>
                      </div>
                    </div>
                  </label>
                  <div className="password-input-cp">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      className="form-input-cp"
                      id="newPassword"
                      name="newPassword"
                      placeholder="Enter new password"
                      value={formData.newPassword}
                      onChange={handleChange}
                      required
                    />
                    <button
                      className="toggle-password-cp"
                      type="button"
                      onClick={() =>
                        setShowPasswords((prev) => ({
                          ...prev,
                          new: !prev.new,
                        }))
                      }
                      title={
                        showPasswords.new ? "Hide password" : "Show password"
                      }
                    >
                      <i
                        className={`bi ${
                          showPasswords.new
                            ? "bi-eye-slash-fill"
                            : "bi-eye-fill"
                        }`}
                      ></i>
                    </button>
                  </div>

                  {formData.newPassword && (
                    <div className="strength-indicator">
                      <div className="strength-bar-wrapper">
                        <div
                          className="strength-bar-fill"
                          style={{
                            width: getStrengthWidth(),
                            backgroundColor: getStrengthColor(),
                          }}
                        ></div>
                      </div>
                      <small className="strength-text">
                        Strength:{" "}
                        <span
                          style={{
                            color: getStrengthColor(),
                            fontWeight: "600",
                          }}
                        >
                          {passwordStrength.toUpperCase()}
                        </span>
                      </small>
                    </div>
                  )}
                </div>

                <div className="form-group-cp">
                  <label htmlFor="confirmPassword" className="form-label-cp">
                    <i className="bi bi-lock-fill"></i>
                    Confirm New Password
                  </label>
                  <div className="password-input-cp">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      className="form-input-cp"
                      id="confirmPassword"
                      name="confirmPassword"
                      placeholder="Re-enter new password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                    <button
                      className="toggle-password-cp"
                      type="button"
                      onClick={() =>
                        setShowPasswords((prev) => ({
                          ...prev,
                          confirm: !prev.confirm,
                        }))
                      }
                      title={
                        showPasswords.confirm
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      <i
                        className={`bi ${
                          showPasswords.confirm
                            ? "bi-eye-slash-fill"
                            : "bi-eye-fill"
                        }`}
                      ></i>
                    </button>
                  </div>
                  {formData.confirmPassword && (
                    <small
                      className={
                        formData.newPassword === formData.confirmPassword
                          ? "match-success"
                          : "match-error"
                      }
                    >
                      <i
                        className={`bi ${
                          formData.newPassword === formData.confirmPassword
                            ? "bi-check-circle-fill"
                            : "bi-x-circle-fill"
                        }`}
                      ></i>
                      {formData.newPassword === formData.confirmPassword
                        ? "Passwords match"
                        : "Passwords do not match"}
                    </small>
                  )}
                </div>
              </>
            )}

            <button
              type="submit"
              className="btn-submit-cp"
              disabled={loading || !allValidationsPassed}
            >
              {loading ? (
                <>
                  <span className="spinner-cp"></span>
                  {isFirstLogin ? "Setting Password..." : "Updating..."}
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle"></i>
                  {isFirstLogin ? "Set Password & Continue" : "Update Password"}
                </>
              )}
            </button>

            {!isFirstLogin && (
              <div className="cancel-section">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn-cancel-cp"
                >
                  <i className="bi bi-arrow-left"></i>
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
