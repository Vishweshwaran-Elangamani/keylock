import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/auth/AuthContext";
import authService from "../../../services/auth/authService";
import { toast } from "sonner";
import logodarkfull from "../../../assets/logodarkfull.png";
import "../../../styles/auth/Auth.css";
const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });
  const navigate = useNavigate();
  const { login } = useAuth();
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  const validateField = (name, value) => {
    const newErrors = { ...errors };
    if (name === "email") {
      if (!value.trim()) {
        newErrors.email = "Email is required";
      } else if (value.trim().length > 100) {
        newErrors.email = "Email must not exceed 100 characters";
      } else if (!validateEmail(value.trim())) {
        newErrors.email = "Please enter a valid email address";
      } else {
        delete newErrors.email;
      }
    }
    if (name === "password") {
      if (!value) {
        newErrors.password = "Password is required";
      } else if (value !== value.trim()) {
        newErrors.password = "Password cannot have leading or trailing spaces";
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
  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (formData.email.trim().length > 100) {
      newErrors.email = "Email must not exceed 100 characters";
    } else if (!validateEmail(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password !== formData.password.trim()) {
      newErrors.password = "Password cannot have leading or trailing spaces";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    } else if (formData.password.length > 50) {
      newErrors.password = "Password must not exceed 50 characters";
    }
    setErrors(newErrors);
    setTouched({ email: true, password: true });
    return Object.keys(newErrors).length === 0;
  };
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
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
    validateField(name, formData[name]);
  };
  const handlePasswordPaste = (e) => {
    e.preventDefault();
    toast.warning("Password pasting is disabled for security");
    return false;
  };
  const handlePasswordCopy = (e) => {
    e.preventDefault();
    toast.warning("Password copying is disabled for security");
    return false;
  };
  const handlePasswordCut = (e) => {
    e.preventDefault();
    toast.warning("Password cutting is disabled for security");
    return false;
  };
  const getDashboardRoute = (roleName) => {
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
    return route;
  };
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
  const performLogin = async () => {
    setLoading(true);
    try {
      const response = await authService.login(
        formData.email,
        formData.password
      );
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
      login(userData, data.accessToken);
      toast.dismiss();
      toast.success(`Welcome back, ${userData.name}!`);
      const dashboardRoute = getDashboardRoute(user.roleName);
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
          <div className="col-lg-6 d-flex align-items-center justify-content-center bg-white p-4">
            <div className="eepz-login-form-container">
              <div className="text-center mb-4">
                <img
                  src={logodarkfull}
                  alt="EEPZ Logo"
                  className="eepz-logo-img"
                  style={{
                    width: "450px",
                    marginBottom: "10px",
                  }}
                />
                <h2 className="fw-bold mb-2" style={{ color: "#2d3565" }}>
                  Sign In to Your Account
                </h2>
                <p className="text-muted" style={{ fontSize: "0.9375rem" }}>
                  Welcome back! Please enter your credentials
                </p>
              </div>
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
              <form onSubmit={handleSubmit} noValidate autoComplete="off">
                <div className="mb-4">
                  <label htmlFor="email" className="form-label-log fw-semibold">
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
                      placeholder="youremail@gmail.com"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      autoComplete="username"
                      disabled={loading}
                      maxLength={100}
                    />
                  </div>
                  {errors.email && touched.email && (
                    <div className="auth-invalid-input d-block">
                      <i className="bi bi-info-circle me-1"></i>
                      {errors.email}
                    </div>
                  )}
                </div>
                <div className="mb-4">
                  <label
                    htmlFor="password"
                    className="form-label-log fw-semibold"
                  >
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
                      autoComplete="new-password"
                      disabled={loading}
                      maxLength={50}
                    />
                    <button
                      className="eepz-password-toggle-btn"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex="-1"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      <i
                        className={`bi ${
                          showPassword ? "bi-eye-slash" : "bi-eye"
                        }`}
                      ></i>
                    </button>
                  </div>
                  {errors.password && touched.password && (
                    <div className="auth-invalid-input d-block">
                      <i className="bi bi-info-circle me-1"></i>
                      {errors.password}
                    </div>
                  )}
                </div>
                <div className="d-flex justify-content-between align-items-center mb-4">
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
                <button
                  type="submit"
                  className="btn btn-primary btn-lg w-100 eepz-submit-btn"
                  disabled={loading}
                  style={{
                    background: loading ? "#6c757d" : "#27235c",
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
                <ul className="eepz-welcome-list" style={{ textAlign: "left" }}>
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
