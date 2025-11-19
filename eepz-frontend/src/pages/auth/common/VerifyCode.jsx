/**
 * VerifyCode Component
 *
 * OTP verification component for user login.
 * Features:
 * - 6-digit OTP input with auto-focus
 * - Show/hide OTP toggle
 * - Failed attempt tracking and lockout (3 minutes after 3 failed attempts)
 * - Paste support for OTP codes
 * - Toast notifications using Sonner for user feedback
 * - Role-based dashboard routing
 *
 * @component
 */

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/auth/AuthContext";
import authService from "../../../services/auth/authService";
import { toast } from "sonner";
import "../../../styles/auth/common/VerifyCode.css";
import logo from "../../../assets/logodarkbarred.png";

const VerifyCode = () => {
  // ========================
  // STATE MANAGEMENT
  // ========================

  /**
   * OTP code state - stores 6 digits entered by user
   */
  const [code, setCode] = useState(["", "", "", "", "", ""]);

  /**
   * Error state - stores error messages
   */
  const [error, setError] = useState("");

  /**
   * Loading state - tracks form submission status
   */
  const [loading, setLoading] = useState(false);

  /**
   * User info state - stores temporary user data from login
   */
  const [userInfo, setUserInfo] = useState(null);

  /**
   * Show OTP state - controls OTP visibility
   */
  const [showOtp, setShowOtp] = useState(false);

  /**
   * Failed attempts state - tracks number of failed OTP attempts
   */
  const [failedAttempts, setFailedAttempts] = useState(0);

  /**
   * Locked state - tracks if user is locked out
   */
  const [isLocked, setIsLocked] = useState(false);

  /**
   * Lockout end time state - stores when lockout expires
   */
  const [lockoutEndTime, setLockoutEndTime] = useState(null);

  /**
   * Remaining time state - for countdown display
   */
  const [remainingTime, setRemainingTime] = useState(0);

  // ========================
  // REFS
  // ========================
  const inputRefs = useRef([]);

  // ========================
  // HOOKS
  // ========================
  const navigate = useNavigate();
  const { login } = useAuth();

  // ========================
  // EFFECTS
  // ========================

  /**
   * Effect: Initialize component on mount
   * - Checks for temporary user data from login
   * - Checks for existing lockout
   * - Focuses first input
   */
  useEffect(() => {
    const tempUserStr = localStorage.getItem("tempUser");
    if (!tempUserStr) {
      console.log("No temp user found, redirecting to login");
      navigate("/login");
      return;
    }

    const tempUser = JSON.parse(tempUserStr);
    setUserInfo(tempUser);
    console.log("Temp User Info:", tempUser);

    // Check if there's an existing lockout from localStorage
    const lockoutData = localStorage.getItem("otpLockout");
    if (lockoutData) {
      const { endTime, attempts } = JSON.parse(lockoutData);
      const now = Date.now();

      if (now < endTime) {
        setIsLocked(true);
        setLockoutEndTime(endTime);
        setFailedAttempts(attempts);
      } else {
        // Lockout expired, clear it
        localStorage.removeItem("otpLockout");
      }
    }

    inputRefs.current[0]?.focus();
  }, [navigate]);

  /**
   * Effect: Countdown timer for lockout
   * Updates remaining time every second
   * Unlocks user when time expires
   */
  useEffect(() => {
    if (!isLocked || !lockoutEndTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, lockoutEndTime - now);

      setRemainingTime(remaining);

      if (remaining === 0) {
        setIsLocked(false);
        setFailedAttempts(0);
        setLockoutEndTime(null);
        localStorage.removeItem("otpLockout");
        setError("");
        inputRefs.current[0]?.focus();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isLocked, lockoutEndTime]);

  // ========================
  // INPUT HANDLERS
  // ========================

  /**
   * Handles OTP digit input change
   * Only allows numeric characters (0-9)
   * Auto-focuses next input when digit entered
   *
   * @param {number} index - Input field index
   * @param {string} value - Input value
   */
  const handleChange = (index, value) => {
    // Only allow single digit numbers
    if (!/^[0-9]?$/.test(value)) {
      return;
    }

    if (value.length > 1) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  /**
   * Handles backspace key in OTP inputs
   * Moves focus to previous input when backspace pressed on empty field
   *
   * @param {number} index - Input field index
   * @param {Event} e - Keyboard event
   */
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  /**
   * Handles paste event for OTP input
   * Only allows numeric characters
   * Auto-fills up to 6 digits
   *
   * @param {Event} e - Paste event
   */
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();

    // Only allow numeric characters in paste
    if (!/^\d+$/.test(pastedData)) {
      setError("Please paste numbers only");
      toast.error("Please paste numbers only");
      setTimeout(() => setError(""), 3000);
      return;
    }

    const pastedDigits = pastedData.slice(0, 6);
    const newCode = pastedDigits.split("");
    setCode([...newCode, ...Array(6 - newCode.length).fill("")]);

    if (newCode.length === 6) {
      inputRefs.current[5]?.focus();
    }
  };

  // ========================
  // UTILITY FUNCTIONS
  // ========================

  /**
   * Formats milliseconds to MM:SS format for lockout display
   *
   * @param {number} milliseconds - Time in milliseconds
   * @returns {string} Formatted time string
   */
  const formatRemainingTime = (milliseconds) => {
    const totalSeconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  /**
   * Toggles OTP visibility
   */
  const toggleOtpVisibility = () => {
    setShowOtp(!showOtp);
  };

  /**
   * Returns dashboard route based on user role
   * Maps role names to their respective dashboard paths
   *
   * @param {string} roleName - User role name
   * @returns {string} Dashboard route path
   */
  const getDashboardRoute = (roleName) => {
    const normalizedRole = roleName?.toUpperCase().replace(/\s+/g, "");
    const routes = {
      ADMIN: "/admin/dashboard",
      HR: "/hr/dashboard",
      HRADMIN: "/hr/dashboard",
      HUMANRESOURCES: "/hr/dashboard",
      DEPARTMENTHEAD: "/department-head/dashboard",
      DEPTHEAD: "/department-head/dashboard",
      MANAGER: "/manager/dashboard",
      MGR: "/manager/dashboard",
      EMPLOYEE: "/employee/dashboard",
      EMP: "/employee/dashboard",
      LEADERSHIP: "/leadership/dashboard",
      LEAD: "/leadership/dashboard",
    };
    return routes[normalizedRole] || "/employee/dashboard";
  };

  // ========================
  // FORM SUBMISSION
  // ========================

  /**
   * Handles OTP verification form submission
   * Validates OTP and makes API call
   * Handles lockout on failed attempts
   * Shows Sonner toast notifications
   *
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const verificationCode = code.join("");

    if (verificationCode.length !== 6) {
      setError("Please enter all 6 digits");
      toast.error("Please enter all 6 digits");
      return;
    }

    if (!userInfo) {
      setError("User information not found. Please login again.");
      toast.error("User information not found. Please login again.");
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("Starting OTP verification...");
      console.log("Email:", userInfo.email);
      console.log("OTP Code:", verificationCode);

      // Show loading toast
      toast.loading("Verifying OTP...");

      // -------- API Call --------
      const response = await authService.verifyOtp(
        userInfo.email,
        verificationCode
      );

      console.log("OTP Verification Response:", response);

      if (!response || response.success === false) {
        const errorMsg = response?.message || "Invalid verification code";
        console.error("Verification failed:", errorMsg);

        toast.dismiss();

        // Handle failed attempt
        const newFailedAttempts = failedAttempts + 1;
        setFailedAttempts(newFailedAttempts);

        if (newFailedAttempts >= 3) {
          // Lock for 3 minutes
          const lockoutEnd = Date.now() + 3 * 60 * 1000;
          setIsLocked(true);
          setLockoutEndTime(lockoutEnd);

          localStorage.setItem(
            "otpLockout",
            JSON.stringify({
              endTime: lockoutEnd,
              attempts: newFailedAttempts,
            })
          );

          const lockoutMsg =
            "Too many failed attempts. Please wait 3 minutes before trying again.";
          setError(lockoutMsg);
          toast.error(lockoutMsg);
        } else {
          const attemptsMsg = `${errorMsg}. ${
            3 - newFailedAttempts
          } attempts remaining.`;
          setError(attemptsMsg);
          toast.error(attemptsMsg);
        }

        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }

      const data = response.data;
      const user = data.user;
      console.log("Response Data:", data);
      console.log("User Object:", user);

      if (!user) {
        console.error("User object not found in response");
        setError("Invalid response from server");
        toast.dismiss();
        toast.error("Invalid response from server");
        setLoading(false);
        return;
      }

      const userRole = user.roleName;
      console.log("User Role:", userRole);

      const userData = {
        userId: user.userId,
        email: user.email,
        name: user.fullName || `${user.firstName} ${user.lastName}`,
        empId: user.employeeCompanyId,
        role: userRole,
      };

      console.log("User Data:", userData);
      console.log("Token received");

      // Clear lockout data on successful verification
      localStorage.removeItem("tempUser");
      localStorage.removeItem("otpLockout");

      toast.dismiss();
      toast.success("OTP verified successfully!");

      login(userData, data.accessToken);

      const dashboardRoute = getDashboardRoute(userRole);
      console.log("Navigating to:", dashboardRoute);

      setTimeout(() => {
        navigate(dashboardRoute, { replace: true });
      }, 100);
    } catch (err) {
      console.error("OTP verification error:", err);
      console.error("Error response:", err.response);
      console.error("Error data:", err.response?.data);

      let errorMessage = "Invalid verification code. Please try again.";

      if (err.response?.data) {
        if (typeof err.response.data === "string") {
          errorMessage = err.response.data;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.Message) {
          errorMessage = err.response.data.Message;
        } else if (err.response.data.errors) {
          const errors = err.response.data.errors;
          errorMessage = Object.values(errors).flat().join(", ");
        }
      }

      console.error("Error message:", errorMessage);

      toast.dismiss();

      // Handle failed attempt on exception
      const newFailedAttempts = failedAttempts + 1;
      setFailedAttempts(newFailedAttempts);

      if (newFailedAttempts >= 3) {
        const lockoutEnd = Date.now() + 3 * 60 * 1000;
        setIsLocked(true);
        setLockoutEndTime(lockoutEnd);

        localStorage.setItem(
          "otpLockout",
          JSON.stringify({
            endTime: lockoutEnd,
            attempts: newFailedAttempts,
          })
        );

        const lockoutMsg =
          "Too many failed attempts. Please wait 3 minutes before trying again.";
        setError(lockoutMsg);
        toast.error(lockoutMsg);
      } else {
        const attemptsMsg = `${errorMessage}. ${
          3 - newFailedAttempts
        } attempts remaining.`;
        setError(attemptsMsg);
        toast.error(attemptsMsg);
      }

      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // ========================
  // COMPUTED VALUES
  // ========================

  /**
   * Checks if all 6 OTP digits are entered
   */
  const isCodeComplete = code.every((digit) => digit !== "");

  // ========================
  // RENDER LOGIC
  // ========================
  return (
    <div className="verify-code-container">
      <div className="verify-code-card">
        <div className="verify-code-header">
          <div className="logo-section-verify">
            <img
              src={logo}
              alt="EEPZ Logo"
              className="logo-img-verify"
              style={{
                width: "200px",
              }}
            />
          </div>
          <h2 className="verify-title">
            <i className="bi bi-shield-check"></i>
            Verify Code
          </h2>
          <p className="verify-subtitle">
            Enter the 6-digit verification code sent to your email
          </p>
          {userInfo && (
            <small className="email-display">({userInfo.email})</small>
          )}
        </div>

        <div className="verify-code-body">
          {/* -------- Error Alert -------- */}
          {error && (
            <div className="alert-danger-verify">
              <i className="bi bi-exclamation-triangle-fill"></i>
              <div>{error}</div>
            </div>
          )}

          {/* -------- Lockout Timer Alert -------- */}
          {isLocked && lockoutEndTime && (
            <div className="alert-warning-verify">
              <i className="bi bi-clock-fill"></i>
              <div>
                Account locked. Try again in{" "}
                {formatRemainingTime(remainingTime)}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* -------- OTP Input Fields -------- */}
            <div className="otp-wrapper">
              <div className="code-inputs-verify" onPaste={handlePaste}>
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="code-input-verify"
                    disabled={isLocked}
                    inputMode="numeric"
                    autoComplete="off"
                    style={{
                      WebkitTextSecurity: showOtp ? "none" : "disc",
                      MozTextSecurity: showOtp ? "none" : "disc",
                    }}
                  />
                ))}
              </div>

              {/* -------- Show/Hide OTP Toggle Button -------- */}
              <button
                type="button"
                onClick={toggleOtpVisibility}
                disabled={isLocked}
                className="toggle-otp-btn"
                title={showOtp ? "Hide OTP" : "Show OTP"}
                aria-label={showOtp ? "Hide OTP" : "Show OTP"}
              >
                <i
                  className={`bi ${
                    showOtp ? "bi-eye-slash-fill" : "bi-eye-fill"
                  }`}
                ></i>
              </button>
            </div>

            {/* -------- Submit Button -------- */}
            <button
              type="submit"
              className="btn-submit-verify"
              disabled={!isCodeComplete || loading || isLocked}
            >
              {loading ? (
                <>
                  <span className="spinner-verify"></span>
                  Confirming...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle"></i>
                  Confirm
                </>
              )}
            </button>

            {/* -------- Back to Login -------- */}
            <div className="back-to-login-verify">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="btn-back-verify"
              >
                <i className="bi bi-arrow-left"></i>
                Back to login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerifyCode;
