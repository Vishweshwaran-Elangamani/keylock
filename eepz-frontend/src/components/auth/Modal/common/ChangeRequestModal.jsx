import { useState, useEffect } from "react";
import { toast } from "sonner";
import ChangeRequestService from "../../../../services/auth/changeRequestService";
import "../../../../styles/auth/common/ChangeRequestModal.css";
const ChangeRequestModal = ({
  show,
  onClose,
  onSubmit,
  profileData,
  hasPendingRequest,
  pendingRequestId,
}) => {
  const [formData, setFormData] = useState({
    newEmail: "",
    reason: "",
    currentPassword: "",
  });
  const [currentEmail, setCurrentEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  useEffect(() => {
    if (show) {
      fetchCurrentEmail();
    } else {
      resetForm();
    }
  }, [show]);
  const resetForm = () => {
    setFormData({ newEmail: "", reason: "", currentPassword: "" });
    setCurrentEmail("");
    setShowPassword(false);
  };
  const fetchCurrentEmail = () => {
    try {
      if (profileData?.companyEmail) {
        setCurrentEmail(profileData.companyEmail);
        return;
      }
      if (profileData?.email) {
        setCurrentEmail(profileData.email);
        return;
      }
      const storageKeys = [
        "userProfile",
        "user",
        "authUser",
        "currentUser",
        "userData",
      ];
      for (const key of storageKeys) {
        try {
          const dataStr = localStorage.getItem(key);
          if (dataStr && dataStr !== "null" && dataStr !== "undefined") {
            const data = JSON.parse(dataStr);
            const email =
              data?.email ||
              data?.companyEmail ||
              data?.Email ||
              data?.CompanyEmail ||
              data?.emailAddress ||
              data?.EmailAddress;
            if (email) {
              setCurrentEmail(email);
              return;
            }
          }
        } catch {}
      }
      setCurrentEmail("Not set");
    } catch {
      setCurrentEmail("Error loading email");
    }
  };
  const validateEmailDomain = (email) => {
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    const eepzRegex = /^[a-zA-Z0-9._%+-]+@eepz\.com$/i;
    const relevantzRegex = /^[a-zA-Z0-9._%+-]+@relevantz\.com$/i;
    return (
      gmailRegex.test(email) ||
      eepzRegex.test(email) ||
      relevantzRegex.test(email)
    );
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.newEmail?.trim()) {
      toast.error("Please enter new email address");
      return;
    }
    if (!validateEmailDomain(formData.newEmail.trim())) {
      toast.error(
        "Only Gmail (@gmail.com), Eepz (@eepz.com), or Relevantz (@relevantz.com) addresses are allowed"
      );
      return;
    }
    if (
      currentEmail &&
      formData.newEmail.trim().toLowerCase() === currentEmail.toLowerCase()
    ) {
      toast.error("New email cannot be same as current email");
      return;
    }
    if (!formData.currentPassword?.trim()) {
      toast.error("Please enter your current password for verification");
      return;
    }
    if (formData.currentPassword.trim().length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (!formData.reason?.trim()) {
      toast.error("Please provide a reason for the change");
      return;
    }
    if (formData.reason.trim().length < 10) {
      toast.error("Reason must be at least 10 characters");
      return;
    }
    const requestPayload = {
      ChangeType: "Email",
      NewEmail: formData.newEmail.trim(),
      CurrentPassword: formData.currentPassword.trim(),
      Reason: formData.reason.trim(),
    };
    onSubmit(requestPayload);
  };
  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  };
  const handleCancelRequest = async () => {
    setIsLoading(true);
    try {
      const response = await ChangeRequestService.cancelChangeRequest(
        pendingRequestId
      );
      if (response.success) {
        toast.success("Email change request cancelled successfully");
        onClose("requestCancelled");
      } else {
        toast.error(response.message || "Failed to cancel request");
      }
    } catch {
      toast.error("Failed to cancel request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  const blockClipboardAction = (
    e,
    message = "Copy/Paste is disabled for password"
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (message) toast.info(message);
  };
  if (!show) return null;
  if (hasPendingRequest) {
    return (
      <>
        <div className="crm-backdrop" onClick={handleClose} />
        <div className="crm-modal-container crm-modal-container-pending">
          <div className="crm-modal-dialog">
            <div className="crm-modal-header">
              <div className="crm-header-title">
                <i className="bi bi-exclamation-circle"></i>
                Request Account Change
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                aria-label="Close"
                className="crm-close-button"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="crm-modal-body">
              <div className="crm-alert-danger">
                <i className="bi bi-exclamation-triangle-fill crm-alert-icon"></i>
                <div>
                  <div className="crm-alert-title">
                    You already have a pending email change request.
                  </div>
                  <div className="crm-alert-message">
                    Please wait for admin approval or cancel the existing
                    request.
                  </div>
                </div>
              </div>
              <div className="crm-info-section">
                <div className="crm-info-title">
                  <i className="bi bi-info-circle"></i>
                  What can you do?
                </div>
                <ul className="crm-info-list">
                  <li>
                    Wait for the administrator to review your pending email
                    change request
                  </li>
                  <li>Cancel your pending request using the button below</li>
                  <li>
                    After cancellation, you can submit a new email change
                    request
                  </li>
                </ul>
              </div>
            </div>
            <div className="crm-modal-footer">
              <button
                type="button"
                onClick={handleClose}
                className="crm-btn-cancel"
              >
                <i className="bi bi-check2"></i> Close
              </button>
              <button
                type="button"
                onClick={handleCancelRequest}
                disabled={isLoading}
                className="crm-btn-primary"
              >
                {isLoading ? (
                  <>
                    <span className="crm-spinner" />
                    Cancelling Request...
                  </>
                ) : (
                  <>
                    <i className="bi bi-x-circle"></i> Cancel Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }
  return (
    <>
      <div className="crm-backdrop" onClick={handleClose} />
      <div className="crm-modal-container">
        <div className="crm-modal-dialog">
          <div className="crm-modal-header">
            <div className="crm-header-title">
              <i className="bi bi-pencil-square"></i>
              Request Account Change
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className="crm-close-button"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="crm-form">
            <div className="crm-modal-body">
              <div className="crm-alert-info">
                <i className="bi bi-info-circle-fill crm-alert-icon"></i>
                <div>
                  <strong>Note:</strong> You can only request to change your
                  email to a <strong>Gmail (@gmail.com)</strong>,{" "}
                  <strong>Eepz (@eepz.com)</strong>, or{" "}
                  <strong>Relevantz (@relevantz.com)</strong> address. Your
                  current password is required for security verification. Your
                  request will be sent to admin for approval. You can only have
                  one pending request at a time.
                </div>
              </div>
              <div className="crm-form-group">
                <label className="crm-form-label">Current Email Address</label>
                <input
                  type="text"
                  value={currentEmail}
                  disabled
                  readOnly
                  className="crm-form-input"
                />
              </div>
              <div className="crm-form-group">
                <label className="crm-form-label">
                  New Email Address{" "}
                  <span className="crm-required-asterisk">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="Enter new email address (Gmail, Eepz, or Relevantz)"
                  value={formData.newEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, newEmail: e.target.value })
                  }
                  className="crm-form-input"
                />
                <small className="crm-form-help">
                  <i className="bi bi-envelope" style={{ marginRight: 4 }}></i>
                  Only Gmail (@gmail.com), Eepz (@eepz.com), or Relevantz
                  (@relevantz.com) addresses are allowed
                </small>
              </div>
              <div className="crm-form-group">
                <label className="crm-form-label">
                  Current Password{" "}
                  <span className="crm-required-asterisk">*</span>
                </label>
                <div className="crm-password-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.currentPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        currentPassword: e.target.value,
                      })
                    }
                    placeholder="Enter your current password for verification"
                    required
                    minLength={6}
                    className="crm-form-input crm-password-input"
                    onPaste={(e) =>
                      blockClipboardAction(
                        e,
                        "Pasting is disabled for password"
                      )
                    }
                    onCopy={(e) =>
                      blockClipboardAction(e, "Copy is disabled for password")
                    }
                    onCut={(e) =>
                      blockClipboardAction(e, "Cut is disabled for password")
                    }
                    onDrop={(e) =>
                      blockClipboardAction(
                        e,
                        "Drag & drop is disabled for password"
                      )
                    }
                    onContextMenu={(e) => e.preventDefault()}
                    autoComplete="new-password"
                    inputMode="text"
                    spellCheck={false}
                    autoCapitalize="off"
                    aria-autocomplete="none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="crm-password-toggle"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    <i
                      className={`bi ${
                        showPassword ? "bi-eye-slash" : "bi-eye"
                      }`}
                    />
                  </button>
                </div>
                <small className="crm-form-help">
                  <i
                    className="bi bi-shield-lock"
                    style={{ marginRight: 4 }}
                  ></i>
                  Your password is required to verify this change request for
                  security purposes
                </small>
              </div>
              <div className="crm-form-group">
                <label className="crm-form-label">
                  Reason for Change{" "}
                  <span className="crm-required-asterisk">*</span>
                </label>
                <textarea
                  required
                  minLength={10}
                  maxLength={1000}
                  rows={4}
                  placeholder="Please provide a detailed reason for this email change request (minimum 10 characters)"
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  className="crm-form-textarea"
                ></textarea>
                <small className="crm-char-count">
                  {formData.reason.length}/1000 characters
                  {formData.reason.length > 0 &&
                    formData.reason.length < 10 && (
                      <span className="crm-char-count-error">
                        (Minimum 10 characters required)
                      </span>
                    )}
                </small>
              </div>
            </div>
            <div className="crm-modal-footer">
              <button
                type="button"
                onClick={handleClose}
                className="crm-btn-cancel"
              >
                <i className="bi bi-x-circle"></i> Cancel
              </button>
              <button
                type="submit"
                disabled={
                  !formData.newEmail.trim() ||
                  !formData.currentPassword.trim() ||
                  formData.currentPassword.trim().length < 6 ||
                  formData.reason.length < 10
                }
                className="crm-btn-primary"
              >
                <i className="bi bi-send"></i> Submit Request
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
export default ChangeRequestModal;
