import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import authService from "../../../services/auth/authService";
import { toast } from "sonner";
import "../../../styles/auth/common/VerifyResetOtp.css";
const VerifyResetOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isValidGmailDomain = (email) => {
    if (!email) return false;
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    const eepzRegex = /^[a-zA-Z0-9._%+-]+@eepz\.com$/i;
    const relevantzRegex = /^[a-zA-Z0-9._%+-]+@relevantz\.com$/i;
    return (
      gmailRegex.test(email) ||
      eepzRegex.test(email) ||
      relevantzRegex.test(email)
    );
  };
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
  const handleResetPassword = async (e) => {
    e.preventDefault();
    // -------- Validate Email Exists --------
    if (!email) {
      toast.error("Email address is missing. Please restart the process.");
      navigate("/reset-password");
      return;
    }
    // -------- Validate Gmail Domain --------
    if (!isValidGmailDomain(email)) {
      toast.error(
        "Only Gmail addresses (@gmail.com) are allowed for password reset"
      );
      navigate("/reset-password");
      return;
    }
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
      toast.loading("Resetting password...");
      const response = await authService.resetPassword(
        email,
        otpCode,
        newPassword,
        confirmPassword
      );
      if (response.success) {
        toast.dismiss();
        toast.success(
          "Password reset successfully! Please login with your new password."
        );
        navigate("/login");
      } else {
        toast.dismiss();
        const errorMsg = response.message || "Failed to reset password";
        toast.error(errorMsg);
      }
    } catch (error) {
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
  const handleResendOtp = async () => {
    try {
      await authService.forgotPassword(email);
      toast.success("New OTP sent to your Gmail address");
    } catch (error) {
      toast.error("Failed to resend OTP. Please try again.");
    }
  };
  if (!email) {
    navigate("/reset-password");
    return null;
  }
  return (
    <div className="verify-reset-otp-container">
      <div className="verify-reset-otp-card">
        <div className="verify-reset-header">
          <div className="shield-icon-reset">
            <i className="bi bi-shield-lock"></i>
          </div>
          <h2 className="verify-reset-title">Reset Password</h2>
          <p className="verify-reset-subtitle">
            Enter OTP and set your new password
          </p>
        </div>
        <div className="verify-reset-body">
          <form onSubmit={handleResetPassword}>
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
                <div className="form-group-reset">
                  <label className="form-label-reset">
                    <i className="bi bi-lock-fill"></i>
                    New Password
                    <div className="info-icon-wrapper-reset">
                      <div
                        className="info-icon-reset"
                        title="Password requirements"
                      >
                        <i className="bi bi-info-circle"></i>
                      </div>
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
