import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/auth/AuthContext";
import authService from "../../../services/auth/authService";
import { toast } from "sonner";
import "../../../styles/auth/common/VerifyCode.css";
import logo from "../../../assets/logodarkbarred.png";
const VerifyCode = () => {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [showOtp, setShowOtp] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutEndTime, setLockoutEndTime] = useState(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const { login } = useAuth();
  useEffect(() => {
    const tempUserStr = localStorage.getItem("tempUser");
    if (!tempUserStr) {
      navigate("/login");
      return;
    }
    const tempUser = JSON.parse(tempUserStr);
    setUserInfo(tempUser);
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
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };
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
  const formatRemainingTime = (milliseconds) => {
    const totalSeconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };
  const toggleOtpVisibility = () => {
    setShowOtp(!showOtp);
  };
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
  /**
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
      // Show loading toast
      toast.loading("Verifying OTP...");
      // -------- API Call --------
      const response = await authService.verifyOtp(
        userInfo.email,
        verificationCode
      );
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
      if (!user) {
        console.error("User object not found in response");
        setError("Invalid response from server");
        toast.dismiss();
        toast.error("Invalid response from server");
        setLoading(false);
        return;
      }
      const userRole = user.roleName;
      const userData = {
        userId: user.userId,
        email: user.email,
        name: user.fullName || `${user.firstName} ${user.lastName}`,
        empId: user.employeeCompanyId,
        role: userRole,
      };
      localStorage.removeItem("tempUser");
      localStorage.removeItem("otpLockout");
      toast.dismiss();
      toast.success("OTP verified successfully!");
      login(userData, data.accessToken);
      const dashboardRoute = getDashboardRoute(userRole);
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
  const isCodeComplete = code.every((digit) => digit !== "");
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
