import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import authService from "../../../services/auth/authService";
import { toast } from "sonner";
import "../../../styles/auth/common/VerifyFirstLogin.css";
const VerifyFirstLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || authService.getTempUser()?.email;
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const validatePassword = (password) => {
    if (password.length < 8)
      return "Password must be at least 8 characters long";
    if (!/[A-Z]/.test(password))
      return "Password must contain at least one uppercase letter";
    if (!/[a-z]/.test(password))
      return "Password must contain at least one lowercase letter";
    if (!/\d/.test(password))
      return "Password must contain at least one number";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
      return "Password must contain at least one special character";
    return null;
  };
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }
    try {
      setLoading(true);
      toast.loading("Setting password...");
      const response = await authService.resetPassword(
        email,
        otpCode,
        newPassword,
        confirmPassword
      );
      if (response.success) {
        authService.clearTempUser();
        toast.dismiss();
        toast.success(
          "Password set successfully! Please login with your new password."
        );
        navigate("/login", { replace: true });
      } else {
        toast.dismiss();
        const errorMsg = response.message || "Failed to set password";
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error("First login reset error:", error);
      toast.dismiss();
      toast.error(error.message || "Failed to set password");
    } finally {
      setLoading(false);
    }
  };
  if (!email) {
    navigate("/login");
    return null;
  }
  return (
    <div className="verify-first-login-container">
      <div className="verify-first-login-card">
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
                <>
                  <span className="spinner-first"></span>
                  Setting Password...
                </>
              ) : (
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
