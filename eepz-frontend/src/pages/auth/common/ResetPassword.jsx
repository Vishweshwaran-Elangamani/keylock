import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../../services/auth/authService";
import { toast } from "sonner";
import "../../../styles/auth/common/ResetPassword.css";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);

  const navigate = useNavigate();

  const validateEmail = (email) => {
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    return gmailRegex.test(email);
  };

  const isEmailValid = validateEmail(email);
  const showEmailError = emailTouched && email && !isEmailValid;

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setError("");
    setMessage("");
  };

  const handleEmailBlur = () => {
    setEmailTouched(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      const errorMsg = "Only Gmail addresses (@gmail.com) are allowed for password reset";
      setError(errorMsg);
      setEmailTouched(true);
      toast.error(errorMsg);
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      console.log("Sending password reset request...");
      console.log("Email:", email);

      toast.loading("Sending reset code...");

      const response = await authService.forgotPassword(email);

      console.log("Reset Response:", response);

      if (response.success) {
        setMessage("OTP sent to your email successfully!");
        toast.dismiss();
        toast.success("OTP sent to your email successfully!");

        setTimeout(() => {
          navigate("/verify-reset-otp", { state: { email } });
        }, 2000);
      } else {
        toast.dismiss();
        const errorMsg =
          response.message || "Failed to send reset instructions";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error("Reset password error:", err);

      let errorMessage = "Failed to send reset instructions";

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

  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        <div className="reset-password-header">
          <div className="reset-icon-wrapper">
            <div className="reset-icon-circle">
              <i className="bi bi-key-fill"></i>
            </div>
          </div>
          <h2 className="reset-title">Reset Password</h2>
          <p className="reset-subtitle">
            Enter your Gmail address and we'll send you a verification code to
            reset your password
          </p>
        </div>

        <div className="reset-password-body">
          {message && (
            <div className="alert-success-reset">
              <i className="bi bi-check-circle-fill"></i>
              <div className="alert-content">
                <strong>Success!</strong>
                <p>{message}</p>
                <small>Redirecting you to verification page...</small>
              </div>
            </div>
          )}

          {error && (
            <div className="alert-danger-reset">
              <i className="bi bi-exclamation-triangle-fill"></i>
              <div className="alert-content">
                <strong>Error</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group-reset">
              <label htmlFor="email" className="form-label-reset">
                <i className="bi bi-envelope"></i>
                Gmail Address
              </label>
              <div className="email-input-wrapper-reset">
                <input
                  type="email"
                  className={`form-input-reset ${
                    showEmailError ? "is-invalid" : ""
                  } ${emailTouched && isEmailValid ? "is-valid" : ""}`}
                  id="email"
                  placeholder="yourname@gmail.com"
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={handleEmailBlur}
                  required
                  disabled={loading}
                />
                {emailTouched && email && (
                  <div className="validation-icon-reset">
                    {isEmailValid ? (
                      <i className="bi bi-check-circle-fill icon-success"></i>
                    ) : (
                      <i className="bi bi-x-circle-fill icon-error"></i>
                    )}
                  </div>
                )}
              </div>
              {showEmailError && (
                <small className="feedback-error-reset">
                  <i className="bi bi-info-circle"></i>
                  Only Gmail addresses (@gmail.com) are allowed
                </small>
              )}
              {emailTouched && isEmailValid && (
                <small className="feedback-success-reset">
                  <i className="bi bi-check-circle"></i>
                  Valid Gmail address
                </small>
              )}
            </div>

            <button
              type="submit"
              className="btn-submit-reset"
              disabled={loading || !email || showEmailError}
            >
              {loading ? (
                <>
                  <span className="spinner-reset"></span>
                  Sending Code...
                </>
              ) : (
                <>
                  <i className="bi bi-send"></i>
                  Send Reset Code
                </>
              )}
            </button>

            <div className="back-to-login">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="btn-back-reset"
                disabled={loading}
              >
                <i className="bi bi-arrow-left"></i>
                Back to login
              </button>
            </div>
          </form>

          <div className="security-note">
            <small>
              <i className="bi bi-shield-check"></i>
              Password reset is only available for Gmail accounts. Your account
              information is protected.
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
