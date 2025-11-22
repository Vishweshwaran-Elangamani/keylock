/**
 * Login Component
 *
 * Handles user authentication and login flow.
 * Features:
 * - Email and password validation
 * - Two-factor authentication support
 * - First-time login handling
 * - Remember me functionality
 * - Toast notifications using Sonner
 * - Responsive design with welcome card
 *
 * @component
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/auth/AuthContext";
import authService from "../../../services/auth/authService";
import { toast } from "sonner";
import "../../../styles/auth/auth.css";
const Login = () => {
  /**
   * Form data state - stores email, password, and remember me checkbox
   */
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  /**
   * Show password state - controls password visibility
   */
  const [showPassword, setShowPassword] = useState(false);
  /**
   * Error state - stores general error messages
   */
  const [error, setError] = useState("");
  /**
   * Loading state - tracks form submission status
   */
  const [loading, setLoading] = useState(false);
  /**
   * Errors state - stores field-specific validation errors
   */
  const [errors, setErrors] = useState({});
  /**
   * Touched state - tracks which fields have been interacted with
   */
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });
  const navigate = useNavigate();
  const { login } = useAuth();
  /**
   * Validates email format using regex pattern
   * @param {string} email - Email address to validate
   * @returns {boolean} - Returns true if email is valid
   */
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  /**
   * Validates individual form field
   * @param {string} name - Field name to validate
   * @param {string} value - Field value to validate
   * @returns {boolean} - Returns true if field is valid
   */
  const validateField = (name, value) => {
    const newErrors = { ...errors };
    if (name === "email") {
      if (!value.trim()) {
        newErrors.email = "Email is required";
      } else if (!validateEmail(value.trim())) {
        newErrors.email = "Please enter a valid email address";
      } else {
        delete newErrors.email;
      }
    }
    if (name === "password") {
      if (!value) {
        newErrors.password = "Password is required";
      } else if (value.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      } else if (value.length > 50) {
        newErrors.password = "Password must not exceed 50 characters";
      } else {
        delete newErrors.password;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  /**
   * Validates entire form before submission
   * @returns {boolean} - Returns true if form is valid
   */
  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    } else if (formData.password.length > 50) {
      newErrors.password = "Password must not exceed 50 characters";
    }
    setErrors(newErrors);
    setTouched({ email: true, password: true });
    return Object.keys(newErrors).length === 0;
  };
  /**
   * Handles input changes and updates form state
   * Also triggers validation for touched fields
   * @param {Event} e - Input change event
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
    if (error) {
      setError("");
    }
    if (touched[name]) {
      validateField(name, newValue);
    }
  };
  /**
   * Handles field blur event to mark field as touched
   * @param {Event} e - Blur event
   */
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
    validateField(name, formData[name]);
  };
  /**
   * Security function to prevent password paste
   * @param {Event} e - Paste event
   */
  const handlePasswordPaste = (e) => {
    e.preventDefault();
    toast.warning("Password pasting is disabled for security");
    return false;
  };
  /**
   * Security function to prevent password copy
   * @param {Event} e - Copy event
   */
  const handlePasswordCopy = (e) => {
    e.preventDefault();
    toast.warning("Password copying is disabled for security");
    return false;
  };
  /**
   * Security function to prevent password cut
   * @param {Event} e - Cut event
   */
  const handlePasswordCut = (e) => {
    e.preventDefault();
    toast.warning("Password cutting is disabled for security");
    return false;
  };
  /**
   * Determines the dashboard route based on user role
   * @param {string} roleName - User's role name
   * @returns {string} - Dashboard route path
   */
  const getDashboardRoute = (roleName) => {
    console.log("Role received:", roleName);
    const normalizedRole = roleName?.toUpperCase().replace(/\s+/g, "");
    const routes = {
      ADMIN: "/admin/dashboard",
      HR: "/hr/dashboard",
      DEPARTMENTHEAD: "/department-head/dashboard",
      LEADERSHIP: "/leadership/dashboard",
      MANAGER: "/manager/dashboard",
      EMPLOYEE: "/employee/dashboard",
    };
    const route = routes[normalizedRole] || "/employee/dashboard";
    console.log("Navigating to:", route);
    return route;
  };
  /**
   * Handles form submission
   * @param {Event} e - Form submit event
   * @returns {boolean} - Returns false to prevent default form submission
   */
  const handleSubmit = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setError("");
    if (!validateForm()) {
      toast.error("Enter Valid Details!");
      return false;
    }
    toast.loading("Signing in...");
    performLogin();
    return false;
  };
  /**
   * Performs the login API call and handles authentication flow
   */
  const performLogin = async () => {
    setLoading(true);
    try {
      console.log("Login attempt:", formData.email);
      const response = await authService.login(
        formData.email,
        formData.password
      );
      console.log("Full Backend Response:", response);
      if (!response.success || !response.data) {
        const errorMessage =
          response.message ||
          "Unable to sign in. Please check your credentials and try again.";
        setError(errorMessage);
        toast.dismiss();
        toast.error(errorMessage);
        setLoading(false);
        return;
      }
      const data = response.data;
      if (data.requiresTwoFactor) {
        toast.dismiss();
        toast.info("Two-factor authentication required");
        localStorage.setItem(
          "tempUser",
          JSON.stringify({
            email: formData.email,
          })
        );
        navigate("/verify-code", { replace: false });
        return;
      }
      if (data.requiresPasswordReset) {
        toast.dismiss();
        toast.info("Password reset required for first login");
        localStorage.setItem(
          "tempUser",
          JSON.stringify({
            email: formData.email,
            isFirstLogin: true,
            requiresPasswordReset: true,
          })
        );
        navigate("/verify-first-login", {
          state: {
            email: formData.email,
            isFirstLogin: true,
          },
          replace: false,
        });
        return;
      }
      const user = data.user;
      if (!user) {
        console.error("User object not found in response");
        const errorMsg =
          "An unexpected error occurred. Please try again or contact support.";
        setError(errorMsg);
        toast.dismiss();
        toast.error(errorMsg);
        setLoading(false);
        return;
      }
      const tokenClaims = authService.getClaims();
      const userData = {
        userId: user.userId,
        email: user.email,
        name:
          user.fullName ||
          user.name ||
          `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
          user.email?.split("@")[0] ||
          "User",
        fullName: user.fullName,
        firstName: user.firstName,
        lastName: user.lastName,
        empId: user.empId || user.employeeId || user.employeeCompanyId,
        empMasterId: tokenClaims?.empMasterId,
        role: user.roleName || user.role,
        roleName: user.roleName,
        departmentId: user.departmentId,
        departmentName: user.departmentName,
      };
      console.log("User Data to save:", userData);
      login(userData, data.accessToken);
      toast.dismiss();
      toast.success(`Welcome back, ${userData.name}!`);
      const dashboardRoute = getDashboardRoute(user.roleName);
      console.log("Final navigation to:", dashboardRoute);
      navigate(dashboardRoute, { replace: true });
    } catch (err) {
      console.error("Login Error:", err);
      console.error("Error Status:", err.response?.status);
      console.error("Error Data:", err.response?.data);
      console.error("Error Message:", err.message);
      let errorMessage = "Unable to sign in. Please try again.";
      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;
        console.log("Status Code:", status);
        console.log("Response Data:", data);
        if (status === 400) {
          errorMessage =
            data?.message || "Invalid request. Please check your input.";
        } else if (status === 401) {
          errorMessage =
            data?.message ||
            "Invalid email or password. Please check your credentials and try again.";
        } else if (status === 403) {
          errorMessage =
            data?.message ||
            "Your account has been locked or disabled. Please contact support.";
        } else if (status === 429) {
          errorMessage =
            "Too many login attempts. Please wait a few minutes and try again.";
        } else if (status >= 500) {
          errorMessage =
            "Our servers are experiencing issues. Please try again later.";
        } else {
          errorMessage = data?.message || `Error: ${status}`;
        }
      } else if (err.message === "Network Error") {
        errorMessage =
          "Unable to connect to the server. Please check your internet connection.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      console.log("Final Error Message:", errorMessage);
      setError(errorMessage);
      toast.dismiss();
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="eepz-login-page">
      <div className="container-fluid h-100 g-0">
        <div className="row g-0 h-100">
          {/* ======================== */}
          {/* LEFT SIDE - LOGIN FORM */}
          {/* ======================== */}
          <div className="col-lg-6 d-flex align-items-center justify-content-center bg-white p-4">
            <div className="eepz-login-form-container">
              {/* Header Section */}
              <div className="text-center mb-4">
                <img
                  src="/logodarkfull.png"
                  alt="EEPZ Logo"
                  className="eepz-logo-img"
                  style={{
                    width: "450px",
                  }}
                />
                <h2 className="fw-bold mb-2" style={{ color: "#2d3565" }}>
                  Sign In to Your Account
                </h2>
                <p className="text-muted" style={{ fontSize: "0.9375rem" }}>
                  Welcome back! Please enter your credentials
                </p>
              </div>
              {/* Error Alert */}
              {error && (
                <div className="alert alert-danger d-flex align-items-start mb-4 eepz-animate-slide-in">
                  <i
                    className="bi bi-exclamation-triangle-fill me-2 mt-1"
                    style={{ fontSize: "1.25rem" }}
                  ></i>
                  <div>
                    <strong>Error</strong>
                    <p className="mb-0 mt-1">{error}</p>
                  </div>
                </div>
              )}
              {/* Login Form */}
              <form onSubmit={handleSubmit} noValidate autoComplete="off">
                {/* Email Field */}
                <div className="mb-4">
                  <label htmlFor="email" className="form-label fw-semibold">
                    <i className="bi bi-envelope me-2"></i>
                    Email Address
                  </label>
                  <div className="eepz-email-input-wrapper">
                    <input
                      type="email"
                      className={`form-control form-control-lg ${
                        errors.email ? "is-invalid" : ""
                      } ${
                        touched.email && !errors.email && formData.email
                          ? "is-valid"
                          : ""
                      }`}
                      id="email"
                      name="email"
                      placeholder="your.email@eepz.com"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      autoComplete="username"
                      disabled={loading}
                    />
                  </div>
                  {/* Email error message */}
                  {errors.email && touched.email && (
                    <div className="auth-invalid-input d-block">
                      <i className="bi bi-info-circle me-1"></i>
                      {errors.email}
                    </div>
                  )}
                </div>
                {/* Password Field */}
                <div className="mb-4">
                  <label htmlFor="password" className="form-label fw-semibold">
                    <i className="bi bi-lock me-2"></i>
                    Password
                  </label>
                  <div className="eepz-password-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      className={`form-control form-control-lg ${
                        errors.password ? "is-invalid" : ""
                      }`}
                      id="password"
                      name="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onPaste={handlePasswordPaste}
                      onCopy={handlePasswordCopy}
                      onCut={handlePasswordCut}
                      autoComplete="current-password"
                      disabled={loading}
                    />
                    {/* Password visibility toggle button */}
                    <button
                      className="eepz-password-toggle-btn"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex="-1"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                    </button>
                  </div>
                  {/* Password error message */}
                  {errors.password && touched.password && (
                    <div className="auth-invalid-input d-block">
                      <i className="bi bi-info-circle me-1"></i>
                      {errors.password}
                    </div>
                  )}
                </div>
                {/* Remember Me & Forgot Password Row */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                  {/* <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input eepz-form-check-input"
                      id="rememberMe"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    <label className="form-check-label" htmlFor="rememberMe">
                      Remember me
                    </label>
                  </div> */}
                  <a
                    href="/reset-password"
                    className="text-decoration-none fw-semibold eepz-forgot-link"
                    style={{ color: "#27235c" }}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate("/reset-password");
                    }}
                  >
                    Forgot Password?
                  </a>
                </div>
                {/* Submit Button */}
                <button
                  type="submit"
                  className="btn btn-primary btn-lg w-100 eepz-submit-btn"
                  disabled={loading}
                  style={{
                    background: loading
                      ? "#6c757d"
                      : "#27235c",
                    border: "none",
                    transition: "all 0.3s ease",
                  }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Signing in...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-in-right me-2"></i>
                      Sign In
                    </>
                  )}
                </button>
              </form>
              {/* Security Note */}
              <div
                className="text-center mt-4 pt-4"
                style={{ borderTop: "1px solid #e9ecef" }}
              >
                <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                  <i className="bi bi-shield-lock me-1"></i>
                  Your credentials are encrypted and secure
                </small>
              </div>
            </div>
          </div>
          {/* ======================== */}
          {/* RIGHT SIDE - WELCOME CARD */}
          {/* ======================== */}
          <div className="col-lg-6 d-none d-lg-flex align-items-center justify-content-center eepz-login-right-bg">
            <div className="eepz-info-card-wrapper">
              <div className="eepz-info-badge mb-4">
                <i className="bi bi-shield-lock me-2"></i>
                Secure Access
              </div>
              <h1
                className="text-white fw-bold mb-3"
                style={{ fontSize: "2.5rem", lineHeight: "1.2" }}
              >
                Welcome to the EEPZ
              </h1>
              <div className="eepz-welcome-card">
                <h3 className="fw-bold mb-3" style={{ color: "#2d3565" }}>
                  Everything You Need
                </h3>
                <ul className="eepz-welcome-list">
                  <li className="mb-3">
                    <i
                      className="bi bi-check-circle-fill me-2"
                      style={{ color: "#5a9fd4" }}
                    ></i>
                    Align your goals and achieve more, together
                  </li>
                  <li className="mb-3">
                    <i
                      className="bi bi-check-circle-fill me-2"
                      style={{ color: "#5a9fd4" }}
                    ></i>
                    Discover growth with internal career opportunities
                  </li>
                  <li className="mb-3">
                    <i
                      className="bi bi-check-circle-fill me-2"
                      style={{ color: "#5a9fd4" }}
                    ></i>
                    Advance through transparent performance and recognition
                  </li>
                  <li>
                    <i
                      className="bi bi-check-circle-fill me-2"
                      style={{ color: "#5a9fd4" }}
                    ></i>
                    Connect and collaborate within your organization
                  </li>
                </ul>
              </div>
              <p className="text-white-50 text-center mt-5 small">
                <i className="bi bi-lightbulb me-2"></i>
                Align your goals, track your growth, and unlock new
                opportunities
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Login;
