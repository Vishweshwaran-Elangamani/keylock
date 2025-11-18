/**
 * VerifyFirstLogin Component
 *
 * Handles first-time login password setup.
 * Features:
 * - OTP verification
 * - Password strength validation
 * - Show/hide password toggle
 * - Password match indicator
 * - Toast notifications using Sonner
 * - Responsive two-column layout
 *
 * @component
 */

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import authService from "../../../services/auth/authService";
import { toast } from "sonner";
import "../../../styles/auth/common/VerifyFirstLogin.css";

const VerifyFirstLogin = () => {
  // ========================
  // HOOKS & NAVIGATION
  // ========================
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Email from route state or temporary user storage
   */
  const email = location.state?.email || authService.getTempUser()?.email;

  // ========================
  // STATE MANAGEMENT
  // ========================

  /**
   * OTP code state - stores the 6-digit verification code
   */
  const [otpCode, setOtpCode] = useState("");

  /**
   * New password state - stores the new password being set
   */
  const [newPassword, setNewPassword] = useState("");

  /**
   * Confirm password state - stores the password confirmation
   */
  const [confirmPassword, setConfirmPassword] = useState("");

  /**
   * Loading state - tracks form submission status
   * Used to disable form and show loading indicator
   */
  const [loading, setLoading] = useState(false);

  /**
   * Show password state - controls password visibility toggle
   */
  const [showPassword, setShowPassword] = useState(false);

  // ========================
  // PASSWORD VALIDATION
  // ========================

  /**
   * Validates password strength against requirements
   * Checks for:
   * - Minimum 8 characters
   * - At least one uppercase letter
   * - At least one lowercase letter
   * - At least one number
   * - At least one special character
   *
   * @param {string} password - Password to validate
   * @returns {string|null} Error message if validation fails, null if valid
   */
  const validatePassword = (password) => {
    // Check minimum length
    if (password.length < 8)
      return "Password must be at least 8 characters long";

    // Check for uppercase letter
    if (!/[A-Z]/.test(password))
      return "Password must contain at least one uppercase letter";

    // Check for lowercase letter
    if (!/[a-z]/.test(password))
      return "Password must contain at least one lowercase letter";

    // Check for number
    if (!/\d/.test(password))
      return "Password must contain at least one number";

    // Check for special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
      return "Password must contain at least one special character";

    return null;
  };

  // ========================
  // FORM SUBMISSION
  // ========================

  /**
   * Handles first login password reset form submission
   * Validates OTP and password, then makes API call to set password
   * Shows Sonner toast notifications for user feedback
   *
   * @param {Event} e - Form submit event
   */
  const handleResetPassword = async (e) => {
    e.preventDefault();

    // -------- Validate OTP --------
    if (!otpCode || otpCode.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    // -------- Validate Passwords Match --------
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    // -------- Validate Password Strength --------
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    try {
      setLoading(true);

      console.log("First login password reset...");
      console.log("Email:", email);
      console.log("OTP:", otpCode);
      console.log("Password Length:", newPassword.length);

      // Show loading toast
      toast.loading("Setting password...");

      // -------- API Call --------
      // Call authService to reset password with OTP verification
      const response = await authService.resetPassword(
        email,
        otpCode,
        newPassword,
        confirmPassword
      );

      console.log("First login reset response:", response);

      // -------- Handle Success Response --------
      if (response.success) {
        // Clear temporary user data from storage
        authService.clearTempUser();

        toast.dismiss();
        toast.success(
          "Password set successfully! Please login with your new password."
        );

        // Redirect to login page after delay
        navigate("/login", { replace: true });
      } else {
        // -------- Handle Failure Response --------
        toast.dismiss();
        const errorMsg = response.message || "Failed to set password";
        toast.error(errorMsg);
      }
    } catch (error) {
      // -------- Handle Exception --------
      console.error("First login reset error:", error);
      toast.dismiss();
      toast.error(error.message || "Failed to set password");
    } finally {
      setLoading(false);
    }
  };

  // ========================
  // GUARD CLAUSE
  // ========================

  /**
   * Redirect to login if no email found
   * This ensures user accessed this page through proper flow
   */
  if (!email) {
    navigate("/login");
    return null;
  }

  // ========================
  // RENDER LOGIC
  // ========================
  return (
    <div className="verify-first-login-container">
      <div className="verify-first-login-card">
        {/* ======================== */}
        {/* HEADER SECTION */}
        {/* ======================== */}
        <div className="verify-first-header">
          {/* Shield Icon */}
          <div className="shield-icon-wrapper">
            <i className="bi bi-shield-lock"></i>
          </div>

          {/* Title */}
          <h2 className="verify-first-title">Set Your Password</h2>

          {/* Subtitle */}
          <p className="verify-first-subtitle">
            This is your first login. Please set a new password.
          </p>
        </div>

        {/* ======================== */}
        {/* BODY SECTION */}
        {/* ======================== */}
        <div className="verify-first-body">
          <form onSubmit={handleResetPassword}>
            {/* -------- 2-Column Grid Layout -------- */}
            <div className="form-grid-first">
              {/* -------- LEFT COLUMN - OTP CODE -------- */}
              <div className="form-column-first">
                <div className="form-group-first">
                  {/* Label */}
                  <label className="form-label-first">
                    <i className="bi bi-key-fill"></i>
                    Enter OTP Code
                  </label>

                  {/* OTP Input Field */}
                  {/* Shows as dots/asterisks for security */}
                  <input
                    type="password"
                    className="form-input-otp"
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) =>
                      setOtpCode(e.target.value.replace(/\D/g, ""))
                    }
                    maxLength={6}
                    required
                    inputMode="numeric"
                  />

                  {/* Helper Text - Shows where OTP was sent */}
                  <small className="otp-hint">
                    <i className="bi bi-envelope"></i>
                    OTP sent to {email}
                  </small>
                </div>
              </div>

              {/* -------- RIGHT COLUMN - PASSWORD FIELDS -------- */}
              <div className="form-column-first">
                {/* New Password Field */}
                <div className="form-group-first">
                  <label className="form-label-first">
                    <i className="bi bi-lock-fill"></i>
                    New Password
                    {/* -------- Info Icon with Tooltip -------- */}
                    {/* Shows password requirements on hover */}
                    <div className="info-icon-wrapper">
                      <div
                        className="info-icon-first"
                        title="Password requirements"
                      >
                        <i className="bi bi-info-circle"></i>
                      </div>
                      {/* Tooltip Content - CSS-based, shown on hover */}
                      <div className="password-requirements-tooltip">
                        <strong>Requirements:</strong>
                        <ul>
                          <li>At least 8 characters long</li>
                          <li>One uppercase & lowercase letter</li>
                          <li>One number & special character</li>
                        </ul>
                      </div>
                    </div>
                  </label>

                  {/* Password Input with Toggle Button */}
                  <div className="password-input-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-input-first"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />

                    {/* Show/Hide Password Toggle Button */}
                    <button
                      type="button"
                      className="toggle-password-first"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      <i
                        className={`bi bi-eye${
                          showPassword ? "-slash" : ""
                        }-fill`}
                      ></i>
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div className="form-group-first">
                  <label className="form-label-first">
                    <i className="bi bi-lock-fill"></i>
                    Confirm New Password
                  </label>

                  {/* Confirm Password Input */}
                  <div className="password-input-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-input-first"
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  {/* -------- Password Match Indicator -------- */}
                  {/* Shows error if passwords don't match */}
                  {newPassword &&
                    confirmPassword &&
                    newPassword !== confirmPassword && (
                      <small className="password-mismatch">
                        <i className="bi bi-exclamation-circle"></i>
                        Passwords do not match
                      </small>
                    )}

                  {/* Shows success if passwords match */}
                  {newPassword &&
                    confirmPassword &&
                    newPassword === confirmPassword && (
                      <small className="password-match">
                        <i className="bi bi-check-circle"></i>
                        Passwords match
                      </small>
                    )}
                </div>
              </div>
            </div>

            {/* -------- Submit Button (Full Width) -------- */}
            <button
              type="submit"
              className="btn-submit-first"
              disabled={loading || !otpCode || !newPassword || !confirmPassword}
            >
              {loading ? (
                // Loading state with spinner
                <>
                  <span className="spinner-first"></span>
                  Setting Password...
                </>
              ) : (
                // Normal state with icon
                <>
                  <i className="bi bi-check-circle"></i>
                  Set Password
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerifyFirstLogin;
