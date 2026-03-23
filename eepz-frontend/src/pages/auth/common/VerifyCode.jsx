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

  // ── Load tempUser + existing lockout on mount ────────────────────────────
  useEffect(() => {
    const tempUserStr = localStorage.getItem("tempUser");
    if (!tempUserStr) {
      navigate("/login");
      return;
    }

    try {
      const tempUser = JSON.parse(tempUserStr);
      setUserInfo(tempUser);
    } catch {
      navigate("/login");
      return;
    }

    const lockoutData = localStorage.getItem("otpLockout");
    if (lockoutData) {
      try {
        const { endTime, attempts } = JSON.parse(lockoutData);
        if (Date.now() < endTime) {
          setIsLocked(true);
          setLockoutEndTime(endTime);
          setFailedAttempts(attempts);
        } else {
          localStorage.removeItem("otpLockout");
        }
      } catch {
        localStorage.removeItem("otpLockout");
      }
    }

    inputRefs.current[0]?.focus();
  }, [navigate]);

  // ── Lockout countdown timer ───────────────────────────────────────────────
  useEffect(() => {
    if (!isLocked || !lockoutEndTime) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, lockoutEndTime - Date.now());
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

  // ── Input handlers ────────────────────────────────────────────────────────
  const handleChange = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return;
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (!/^\d+$/.test(pastedData)) {
      setError("Please paste numbers only");
      toast.error("Please paste numbers only");
      setTimeout(() => setError(""), 3000);
      return;
    }
    const pastedDigits = pastedData.slice(0, 6);
    const newCode = pastedDigits.split("");
    setCode([...newCode, ...Array(6 - newCode.length).fill("")]);
    if (newCode.length === 6) inputRefs.current[5]?.focus();
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatRemainingTime = (milliseconds) => {
    const totalSeconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const toggleOtpVisibility = () => setShowOtp((prev) => !prev);

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

  // ✅ Centralized lockout handler — avoids duplicate code in try/catch
  const handleLockout = (newFailedAttempts, errorMsg) => {
    if (newFailedAttempts >= 3) {
      const lockoutEnd = Date.now() + 3 * 60 * 1000;
      setIsLocked(true);
      setLockoutEndTime(lockoutEnd);
      localStorage.setItem(
        "otpLockout",
        JSON.stringify({ endTime: lockoutEnd, attempts: newFailedAttempts })
      );
      const lockoutMsg =
        "Too many failed attempts. Please wait 3 minutes before trying again.";
      setError(lockoutMsg);
      toast.error(lockoutMsg);
    } else {
      const attemptsMsg = `${errorMsg}. ${3 - newFailedAttempts} attempts remaining.`;
      setError(attemptsMsg);
      toast.error(attemptsMsg);
    }
    setCode(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
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
      toast.loading("Verifying OTP...");

      const response = await authService.verifyOtp(
        userInfo.email,
        verificationCode
      );

      // ── API returned success: false ──────────────────────────────────────
      if (!response || response.success === false) {
        const errorMsg = response?.message || "Invalid verification code";
        toast.dismiss();
        const newFailedAttempts = failedAttempts + 1;
        setFailedAttempts(newFailedAttempts);
        handleLockout(newFailedAttempts, errorMsg);
        return;
      }

      const data = response.data;
      const user = data?.user;

      if (!user) {
        setError("Invalid response from server");
        toast.dismiss();
        toast.error("Invalid response from server");
        return;
      }

      const userRole = user.roleName;

      // ✅ FIX: Decode empMasterId directly from the new token
      const tokenClaims = authService.decodeToken(data.accessToken);

      // ✅ FIX: Complete userData — all role fields present for ProtectedRoute
      const userData = {
        userId: user.userId,
        email: user.email,
        name:
          user.fullName ||
          `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
          user.email?.split("@")[0] ||
          "User",
        fullName: user.fullName,
        firstName: user.firstName,
        lastName: user.lastName,
        empId: user.employeeCompanyId || user.empId,
        employeeCompanyId: user.employeeCompanyId,
        empMasterId: tokenClaims?.empMasterId,
        role: userRole,
        roleName: userRole,       // ✅ ProtectedRoute checks this first
        roleType: user.roleType,
        userRole: user.userRole,
        departmentId: user.departmentId,
        departmentName: user.departmentName,
      };

      localStorage.removeItem("tempUser");
      localStorage.removeItem("otpLockout");

      toast.dismiss();
      toast.success("OTP verified successfully!");

      // ✅ FIX: Pass refreshToken — AuthContext.login now accepts & saves it
      login(userData, data.accessToken, data.refreshToken);

      const dashboardRoute = getDashboardRoute(userRole);
      setTimeout(() => {
        navigate(dashboardRoute, { replace: true });
      }, 100);

    } catch (err) {
      console.error("OTP verification error:", err);
      toast.dismiss();

      let errorMessage = "Invalid verification code. Please try again.";
      if (err.response?.data) {
        if (typeof err.response.data === "string") {
          errorMessage = err.response.data;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.Message) {
          errorMessage = err.response.data.Message;
        } else if (err.response.data.errors) {
          errorMessage = Object.values(err.response.data.errors)
            .flat()
            .join(", ");
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      const newFailedAttempts = failedAttempts + 1;
      setFailedAttempts(newFailedAttempts);
      handleLockout(newFailedAttempts, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isCodeComplete = code.every((digit) => digit !== "");

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="verify-code-container">
      <div className="verify-code-card">
        {/* ── Header ── */}
        <div className="verify-code-header">
          <div className="logo-section-verify">
            <img
              src={logo}
              alt="EEPZ Logo"
              className="logo-img-verify"
              style={{ width: "200px" }}
            />
          </div>
          <h2 className="verify-title">
            <i className="bi bi-shield-check"></i> Verify Code
          </h2>
          <p className="verify-subtitle">
            Enter the 6-digit verification code sent to your email
          </p>
          {userInfo && (
            <small className="email-display">({userInfo.email})</small>
          )}
        </div>

        {/* ── Body ── */}
        <div className="verify-code-body">
          {/* Error Alert */}
          {error && (
            <div className="alert-danger-verify">
              <i className="bi bi-exclamation-triangle-fill"></i>
              <div>{error}</div>
            </div>
          )}

          {/* Lockout Timer Alert */}
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
            {/* OTP Input Fields */}
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

              {/* Show/Hide OTP Toggle */}
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

            {/* Submit Button */}
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

            {/* Back to Login */}
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
