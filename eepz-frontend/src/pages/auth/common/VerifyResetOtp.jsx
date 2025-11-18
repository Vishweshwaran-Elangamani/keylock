/**
 * VerifyResetOtp Component
 *
 * Handles password reset verification and new password setting.
 * Features:
 * - OTP verification for password reset
 * - Password strength validation
 * - Show/hide password toggle
 * - Password match indicator
 * - Resend OTP functionality
 * - Toast notifications using Sonner
 * - Responsive two-column layout
 *
 * @component
 */

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import authService from "../../../services/auth/authService";
import { toast } from "sonner";
import "../../../styles/auth/common/VerifyResetOtp.css";

const VerifyResetOtp = () => {
  // ========================
  // HOOKS & NAVIGATION
  // ========================
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  // ========================
  // STATE MANAGEMENT
  // ========================

  /**
   * OTP code state - stores the 6-digit code
   */
  const [otpCode, setOtpCode] = useState("");

  /**
   * New password state
   */
  const [newPassword, setNewPassword] = useState("");

  /**
   * Confirm password state
   */
  const [confirmPassword, setConfirmPassword] = useState("");

  /**
   * Loading state - tracks form submission
   */
  const [loading, setLoading] = useState(false);

  /**
   * Show password state - controls password visibility
   */
  const [showPassword, setShowPassword] = useState(false);

  // ========================
  // PASSWORD VALIDATION
  // ========================

  /**
   * Validates password strength
   * Checks for length, uppercase, lowercase, numbers, and special characters
   * Returns error message if validation fails
   *
   * @param {string} password - Password to validate
   * @returns {string|null} Error message or null if valid
   */
  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      return "Password must be at least 8 characters long";
    }
    if (!hasUpperCase) {
      return "Password must contain at least one uppercase letter";
    }
    if (!hasLowerCase) {
      return "Password must contain at least one lowercase letter";
    }
    if (!hasNumbers) {
      return "Password must contain at least one number";
    }
    if (!hasSpecialChar) {
      return "Password must contain at least one special character";
    }
    return null;
  };

  // ========================
  // FORM SUBMISSION
  // ========================

  /**
   * Handles password reset with OTP verification
   * Validates all fields and makes API call
   * Shows Sonner toast notifications
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
      console.log("Resetting password...");
      console.log("Email:", email);
      console.log("OTP:", otpCode);
      console.log("Password Length:", newPassword.length);

      // Show loading toast
      toast.loading("Resetting password...");

      // -------- API Call --------
      const response = await authService.resetPassword(
        email,
        otpCode,
        newPassword,
        confirmPassword
      );

      console.log("Reset Response:", response);

      // -------- Handle Success Response --------
      if (response.success) {
        toast.dismiss();
        toast.success(
          "Password reset successfully! Please login with your new password."
        );
        navigate("/login");
      } else {
        // -------- Handle Failure Response --------
        toast.dismiss();
        const errorMsg = response.message || "Failed to reset password";
        toast.error(errorMsg);
      }
    } catch (error) {
      // -------- Handle Exception --------
      console.error("Reset password error:", error);
      toast.dismiss();
      toast.error(
        error.message ||
          "Failed to reset password. Please check your OTP and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ========================
  // RESEND OTP
  // ========================

  /**
   * Handles resend OTP request
   * Makes API call to resend OTP to user's email
   */
  const handleResendOtp = () => {
    authService.forgotPassword(email);
    toast.info("New OTP sent to your email");
  };

  // ========================
  // GUARD CLAUSE
  // ========================
  if (!email) {
    navigate("/reset-password");
    return null;
  }

  // ========================
  // RENDER LOGIC
  // ========================
  return (
    <div className="verify-reset-otp-container">
      <div className="verify-reset-otp-card">
        {/* ======================== */}
        {/* HEADER */}
        {/* ======================== */}
        <div className="verify-reset-header">
          <div className="shield-icon-reset">
            <i className="bi bi-shield-lock"></i>
          </div>
          <h2 className="verify-reset-title">Reset Password</h2>
          <p className="verify-reset-subtitle">
            Enter OTP and set your new password
          </p>
        </div>

        {/* ======================== */}
        {/* BODY */}
        {/* ======================== */}
        <div className="verify-reset-body">
          <form onSubmit={handleResetPassword}>
            {/* -------- 2-Column Grid Layout -------- */}
            <div className="form-grid-reset">
              {/* -------- LEFT COLUMN - OTP -------- */}
              <div className="form-column-reset">
                <div className="form-group-reset">
                  <label className="form-label-reset">
                    <i className="bi bi-key-fill"></i>
                    Enter OTP Code
                  </label>
                  <input
                    type="password"
                    className="form-input-otp-reset"
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) =>
                      setOtpCode(e.target.value.replace(/\D/g, ""))
                    }
                    maxLength={6}
                    required
                    inputMode="numeric"
                  />
                  <small className="otp-hint-reset">
                    <i className="bi bi-envelope"></i>
                    OTP sent to {email}
                  </small>
                </div>

                {/* -------- Resend OTP Section -------- */}
                <div className="resend-section-inline">
                  <small>
                    Didn't receive OTP?
                    <button
                      type="button"
                      className="btn-resend-reset"
                      onClick={handleResendOtp}
                      disabled={loading}
                    >
                      Resend OTP
                    </button>
                  </small>
                </div>
              </div>

              {/* -------- RIGHT COLUMN - Passwords -------- */}
              <div className="form-column-reset">
                {/* New Password */}
                <div className="form-group-reset">
                  <label className="form-label-reset">
                    <i className="bi bi-lock-fill"></i>
                    New Password
                    {/* Hover Tooltip */}
                    <div className="info-icon-wrapper-reset">
                      <div
                        className="info-icon-reset"
                        title="Password requirements"
                      >
                        <i className="bi bi-info-circle"></i>
                      </div>
                      {/* Tooltip Content */}
                      <div className="password-requirements-tooltip-reset">
                        <strong>Password Requirements:</strong>
                        <ul>
                          <li>At least 8 characters long</li>
                          <li>One uppercase & lowercase letter</li>
                          <li>One number & special character</li>
                        </ul>
                      </div>
                    </div>
                  </label>
                  <div className="password-input-group-reset">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-input-reset"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="toggle-password-reset"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i
                        className={`bi bi-eye${
                          showPassword ? "-slash" : ""
                        }-fill`}
                      ></i>
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="form-group-reset">
                  <label className="form-label-reset">
                    <i className="bi bi-lock-fill"></i>
                    Confirm New Password
                  </label>
                  <div className="password-input-group-reset">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-input-reset"
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  {/* -------- Password Match Indicator -------- */}
                  {newPassword &&
                    confirmPassword &&
                    newPassword !== confirmPassword && (
                      <small className="password-mismatch">
                        <i className="bi bi-exclamation-circle"></i>
                        Passwords do not match
                      </small>
                    )}
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
              className="btn-submit-reset"
              disabled={loading || !otpCode || !newPassword || !confirmPassword}
            >
              {loading ? (
                <>
                  <span className="spinner-reset"></span>
                  Resetting Password...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle"></i>
                  Reset Password
                </>
              )}
            </button>
          </form>

          {/* ======================== */}
          {/* FOOTER */}
          {/* ======================== */}
          <div className="reset-footer">
            <button
              className="btn-back-reset"
              onClick={() => navigate("/login")}
              disabled={loading}
            >
              <i className="bi bi-arrow-left"></i>
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyResetOtp;
