/**
 * ResetPassword Component
 * 
 * A form for requesting a password reset via email.
 * Features:
 * - Email validation with real-time feedback
 * - Success/error alerts with Sonner toasts
 * - Loading state during API call
 * - Auto-redirect to OTP verification on success
 * - Responsive design
 * 
 * @component
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../../services/auth/authService";
import { toast } from "sonner";
import "../../../styles/auth/common/ResetPassword.css";

const ResetPassword = () => {
  // ========================
  // STATE MANAGEMENT
  // ========================

  /**
   * Email state - stores the email address input
   */
  const [email, setEmail] = useState("");

  /**
   * Loading state - tracks form submission status
   */
  const [loading, setLoading] = useState(false);

  /**
   * Message state - stores success messages
   */
  const [message, setMessage] = useState("");

  /**
   * Error state - stores error messages
   */
  const [error, setError] = useState("");

  /**
   * Email touched state - tracks if email field has been interacted with
   */
  const [emailTouched, setEmailTouched] = useState(false);

  // ========================
  // HOOKS
  // ========================
  const navigate = useNavigate();

  // ========================
  // EMAIL VALIDATION
  // ========================

  /**
   * Validates email format using regex
   * 
   * @param {string} email - Email address to validate
   * @returns {boolean} True if email is valid format
   */
  const validateEmail = (email) => {
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    return emailRegex.test(email);
  };

  /**
   * Check if email is valid
   */
  const isEmailValid = validateEmail(email);

  /**
   * Show email error - true if email touched and invalid
   */
  const showEmailError = emailTouched && email && !isEmailValid;

  // ========================
  // EVENT HANDLERS
  // ========================

  /**
   * Handles email input change
   * Clears previous errors and messages when user types
   * 
   * @param {Event} e - Input change event
   */
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setError("");
    setMessage("");
  };

  /**
   * Handles email input blur (when user leaves field)
   * Marks email as touched for validation display
   */
  const handleEmailBlur = () => {
    setEmailTouched(true);
  };

  /**
   * Handles form submission
   * Validates email and makes API call to send reset code
   * Shows Sonner toast notifications for user feedback
   * 
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate email before submission
    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      setEmailTouched(true);
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      console.log("Sending password reset request...");
      console.log("Email:", email);

      // Show loading toast
      toast.loading("Sending reset code...");

      // -------- API Call --------
      const response = await authService.forgotPassword(email);

      console.log("Reset Response:", response);

      // -------- Handle Success Response --------
      if (response.success) {
        setMessage("OTP sent to your email successfully!");
        toast.dismiss();
        toast.success("OTP sent to your email successfully!");

        // Navigate after 2 seconds
        setTimeout(() => {
          navigate("/verify-reset-otp", { state: { email } });
        }, 2000);
      } else {
        // -------- Handle Failure Response --------
        toast.dismiss();
        const errorMsg = response.message || "Failed to send reset instructions";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      // -------- Handle Exception --------
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

  // ========================
  // RENDER LOGIC
  // ========================
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
            Enter your email address and we'll send you a verification code to
            reset your password
          </p>
        </div>

        <div className="reset-password-body">
          {/* Success Message */}
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

          {/* Error Message */}
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
            {/* Email Input */}
            <div className="form-group-reset">
              <label htmlFor="email" className="form-label-reset">
                <i className="bi bi-envelope"></i>
                Email Address
              </label>
              <div className="email-input-wrapper-reset">
                <input
                  type="email"
                  className={`form-input-reset ${
                    showEmailError ? "is-invalid" : ""
                  } ${emailTouched && isEmailValid ? "is-valid" : ""}`}
                  id="email"
                  placeholder="your.email@eepz.com"
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
                  Please enter a valid email address
                </small>
              )}
              {emailTouched && isEmailValid && (
                <small className="feedback-success-reset">
                  <i className="bi bi-check-circle"></i>
                  Email format is valid
                </small>
              )}
            </div>

            {/* Submit Button */}
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

            {/* Back to Login */}
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

          {/* Security Note */}
          <div className="security-note">
            <small>
              <i className="bi bi-shield-check"></i>
              This is a secure password reset process. Your account information
              is protected.
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

// Old
// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import authService from "../../../services/auth/authService";
// import "../../../styles/auth/common/ResetPassword.css";

// const ResetPassword = () => {
//   const [email, setEmail] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState("");
//   const [error, setError] = useState("");
//   const [emailTouched, setEmailTouched] = useState(false);
//   const navigate = useNavigate();

//   // Email validation
//   const validateEmail = (email) => {
//     const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
//     return emailRegex.test(email);
//   };

//   const isEmailValid = validateEmail(email);
//   const showEmailError = emailTouched && email && !isEmailValid;

//   const handleEmailChange = (e) => {
//     setEmail(e.target.value);
//     setError("");
//     setMessage("");
//   };

//   const handleEmailBlur = () => {
//     setEmailTouched(true);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     // Validate email before submission
//     if (!validateEmail(email)) {
//       setError("Please enter a valid email address");
//       setEmailTouched(true);
//       return;
//     }

//     setLoading(true);
//     setError("");
//     setMessage("");

//     try {
//       console.log("Sending password reset request...");
//       console.log("Email:", email);

//       const response = await authService.forgotPassword(email);

//       console.log("Reset Response:", response);

//       if (response.success) {
//         setMessage("OTP sent to your email successfully!");

//         // Navigate after 2 seconds
//         setTimeout(() => {
//           navigate("/verify-reset-otp", { state: { email } });
//         }, 2000);
//       } else {
//         setError(response.message || "Failed to send reset instructions");
//       }
//     } catch (err) {
//       console.error("Reset password error:", err);

//       let errorMessage = "Failed to send reset instructions";

//       if (err.response?.data) {
//         if (typeof err.response.data === "string") {
//           errorMessage = err.response.data;
//         } else if (err.response.data.message) {
//           errorMessage = err.response.data.message;
//         } else if (err.response.data.Message) {
//           errorMessage = err.response.data.Message;
//         } else if (err.response.data.errors) {
//           const errors = err.response.data.errors;
//           errorMessage = Object.values(errors).flat().join(", ");
//         }
//       } else if (err.message) {
//         errorMessage = err.message;
//       }

//       console.error("Error message:", errorMessage);
//       setError(errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="reset-password-container">
//       <div className="reset-password-card">
//         <div className="reset-password-header">
//           <div className="reset-icon-wrapper">
//             <div className="reset-icon-circle">
//               <i className="bi bi-key-fill"></i>
//             </div>
//           </div>
//           <h2 className="reset-title">Reset Password</h2>
//           <p className="reset-subtitle">
//             Enter your email address and we'll send you a verification code to
//             reset your password
//           </p>
//         </div>

//         <div className="reset-password-body">
//           {/* Success Message */}
//           {message && (
//             <div className="alert-success-reset">
//               <i className="bi bi-check-circle-fill"></i>
//               <div className="alert-content">
//                 <strong>Success!</strong>
//                 <p>{message}</p>
//                 <small>Redirecting you to verification page...</small>
//               </div>
//             </div>
//           )}

//           {/* Error Message */}
//           {error && (
//             <div className="alert-danger-reset">
//               <i className="bi bi-exclamation-triangle-fill"></i>
//               <div className="alert-content">
//                 <strong>Error</strong>
//                 <p>{error}</p>
//               </div>
//             </div>
//           )}

//           <form onSubmit={handleSubmit}>
//             {/* Email Input */}
//             <div className="form-group-reset">
//               <label htmlFor="email" className="form-label-reset">
//                 <i className="bi bi-envelope"></i>
//                 Email Address
//               </label>
//               <div className="email-input-wrapper-reset">
//                 <input
//                   type="email"
//                   className={`form-input-reset ${
//                     showEmailError ? "is-invalid" : ""
//                   } ${emailTouched && isEmailValid ? "is-valid" : ""}`}
//                   id="email"
//                   placeholder="your.email@eepz.com"
//                   value={email}
//                   onChange={handleEmailChange}
//                   onBlur={handleEmailBlur}
//                   required
//                   disabled={loading}
//                 />
//                 {emailTouched && email && (
//                   <div className="validation-icon-reset">
//                     {isEmailValid ? (
//                       <i className="bi bi-check-circle-fill icon-success"></i>
//                     ) : (
//                       <i className="bi bi-x-circle-fill icon-error"></i>
//                     )}
//                   </div>
//                 )}
//               </div>
//               {showEmailError && (
//                 <small className="feedback-error-reset">
//                   <i className="bi bi-info-circle"></i>
//                   Please enter a valid email address
//                 </small>
//               )}
//               {emailTouched && isEmailValid && (
//                 <small className="feedback-success-reset">
//                   <i className="bi bi-check-circle"></i>
//                   Email format is valid
//                 </small>
//               )}
//             </div>

//             {/* Submit Button */}
//             <button
//               type="submit"
//               className="btn-submit-reset"
//               disabled={loading || !email || showEmailError}
//             >
//               {loading ? (
//                 <>
//                   <span className="spinner-reset"></span>
//                   Sending Code...
//                 </>
//               ) : (
//                 <>
//                   <i className="bi bi-send"></i>
//                   Send Reset Code
//                 </>
//               )}
//             </button>

//             {/* Back to Login */}
//             <div className="back-to-login">
//               <button
//                 type="button"
//                 onClick={() => navigate("/login")}
//                 className="btn-back-reset"
//                 disabled={loading}
//               >
//                 <i className="bi bi-arrow-left"></i>
//                 Back to login
//               </button>
//             </div>
//           </form>

//           {/* Security Note */}
//           <div className="security-note">
//             <small>
//               <i className="bi bi-shield-check"></i>
//               This is a secure password reset process. Your account information
//               is protected.
//             </small>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ResetPassword;
