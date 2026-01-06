import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../contexts/auth/AuthContext";
import api from "../../../services/auth/api";
import { toast } from "sonner";
import "../../../styles/auth/common/ChangePassword.css";
import logo from "../../../assets/logodarkbarred.png";
const ChangePassword = () => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [confirmationText, setConfirmationText] = useState("");
  const CONFIRMATION_PHRASE = "CONFIRM PASSWORD CHANGE";
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");
  const [validations, setValidations] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasDigit: false,
    hasSpecialChar: false,
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const isFirstLogin = location.state?.isFirstLogin || false;
  const fromSettings = location.state?.fromSettings || false;
  const PROTECTED_EMPLOYEE_ID = "1000";
  const isProtectedEmployee = user?.employeeCompanyId === PROTECTED_EMPLOYEE_ID;
  const PASSWORD_REQUIREMENTS = {
    requireUppercase: true,
    requireLowercase: true,
    requireDigit: true,
    requireSpecialChar: true,
    minLength: 8,
  };
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("accessToken");
      if (token) {
      }
      if (user) {
      }
    };
    checkAuth();
  }, [user]);
  useEffect(() => {
    if (!isFirstLogin && !user) {
      toast.error("Please login first");
      navigate("/login");
      return;
    }
    if (user && isProtectedEmployee && !isFirstLogin) {
      toast.error(
        "Password changes are not allowed for this account. Please contact system administrator."
      );
      navigate("/dashboard", { replace: true });
    }
  }, [user, isFirstLogin, isProtectedEmployee, navigate]);
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
  const handleConfirmationTextChange = (e) => {
    setConfirmationText(e.target.value);
    if (error) {
      setError("");
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (isProtectedEmployee && !isFirstLogin) {
      const errorMsg =
        "Password changes are not allowed for this account. Please contact system administrator.";
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }
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
    if (confirmationText.trim().toUpperCase() !== CONFIRMATION_PHRASE) {
      setError(
        `Please type "${CONFIRMATION_PHRASE}" to confirm password change`
      );
      toast.error(`Please type the confirmation phrase correctly`);
      return;
    }
    setLoading(true);
    try {
      toast.loading("Changing password...");
      const response = await api.post("/Authentication/change-password", {
        currentPassword: formData.currentPassword || "",
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });
      if (!response.data.success) {
        toast.dismiss();
        setError(response.data.message || "Failed to change password");
        toast.error(response.data.message || "Failed to change password");
        setLoading(false);
        return;
      }
      if (isFirstLogin) {
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
  const allValidationsPassed = Object.values(validations).every((v) => v);
  const isConfirmationValid =
    confirmationText.trim().toUpperCase() === CONFIRMATION_PHRASE;
  const handleCancel = () => {
    navigate(-1);
  };
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
          {/* SHOW WARNING FOR PROTECTED EMPLOYEE (except first login) */}
          {isProtectedEmployee && !isFirstLogin && (
            <div
              className="error-alert-cp"
              style={{
                marginBottom: "20px",
                background: "#fff3cd",
                borderColor: "#ffc107",
                color: "#856404",
              }}
            >
              <i className="bi bi-shield-exclamation"></i>
              <div>
                <strong>Protected Account</strong>
                <p
                  style={{
                    marginTop: "8px",
                    fontSize: "14px",
                    marginBottom: 0,
                  }}
                >
                  Password changes are not allowed for this account. Please
                  contact system administrator if you need to update your
                  credentials.
                </p>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            {/*  DISABLE FORM FOR PROTECTED EMPLOYEE (except first login) */}
            <fieldset
              disabled={isProtectedEmployee && !isFirstLogin}
              style={{ border: "none", padding: 0, margin: 0 }}
            >
              {!isFirstLogin ? (
                <div className="form-grid-cp">
                  <div className="form-column-cp">
                    <div className="form-group-cp">
                      <label
                        htmlFor="currentPassword"
                        className="form-label-cp"
                      >
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
                  <div className="form-column-cp">
                    <div className="form-group-cp">
                      <label htmlFor="newPassword" className="form-label-cp">
                        <i className="bi bi-lock"></i>
                        New Password
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
                            showPasswords.new
                              ? "Hide password"
                              : "Show password"
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
                      <label
                        htmlFor="confirmPassword"
                        className="form-label-cp"
                      >
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
                <>
                  <div className="form-group-cp">
                    <label htmlFor="newPassword" className="form-label-cp">
                      <i className="bi bi-lock"></i>
                      New Password
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
              <div className="form-group-cp">
                <label htmlFor="confirmationText" className="form-label-cp">
                  <i className="bi bi-shield-check"></i>
                  Confirmation Phrase
                  <span style={{ color: "#dc3545", marginLeft: "4px" }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input-cp"
                  id="confirmationText"
                  placeholder={`Type "${CONFIRMATION_PHRASE}" to confirm`}
                  value={confirmationText}
                  onChange={handleConfirmationTextChange}
                  required
                  style={{
                    borderColor:
                      confirmationText && !isConfirmationValid
                        ? "#dc3545"
                        : confirmationText && isConfirmationValid
                        ? "#198754"
                        : "#ced4da",
                  }}
                />
                {confirmationText && (
                  <small
                    className={
                      isConfirmationValid ? "match-success" : "match-error"
                    }
                  >
                    <i
                      className={`bi ${
                        isConfirmationValid
                          ? "bi-check-circle-fill"
                          : "bi-x-circle-fill"
                      }`}
                    ></i>
                    {isConfirmationValid
                      ? "Confirmation phrase correct"
                      : `Please type "${CONFIRMATION_PHRASE}" exactly`}
                  </small>
                )}
                <small
                  style={{
                    display: "block",
                    marginTop: "6px",
                    color: "#6c757d",
                    fontSize: "12px",
                  }}
                >
                  <i
                    className="bi bi-info-circle"
                    style={{ marginRight: "4px" }}
                  ></i>
                  This is a security measure to prevent accidental password
                  changes
                </small>
              </div>
            </fieldset>
            <button
              type="submit"
              className="btn-submit-cp"
              disabled={
                loading ||
                !allValidationsPassed ||
                !isConfirmationValid ||
                (isProtectedEmployee && !isFirstLogin)
              }
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
