import { useState, useEffect } from "react";
import { toast } from "sonner";
import ChangeRequestService from "../../../../services/auth/changeRequestService";
import { TextAlignCenter } from "lucide-react";

const ChangeRequestModal = ({ show, onClose, onSubmit, profileData, hasPendingRequest, pendingRequestId }) => {
  const [formData, setFormData] = useState({
    newEmail: "",
    reason: "",
    currentPassword: "",
  });

  const [currentEmail, setCurrentEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (show) { fetchCurrentEmail(); } else { resetForm(); }
  }, [show]);

  const resetForm = () => {
    setFormData({ newEmail: "", reason: "", currentPassword: "" });
    setCurrentEmail("");
    setShowPassword(false);
  };

  const fetchCurrentEmail = () => {
    try {
      if (profileData?.companyEmail) { setCurrentEmail(profileData.companyEmail); return; }
      if (profileData?.email) { setCurrentEmail(profileData.email); return; }
      const storageKeys = ["userProfile", "user", "authUser", "currentUser", "userData"];
      for (const key of storageKeys) {
        try {
          const dataStr = localStorage.getItem(key);
          if (dataStr && dataStr !== "null" && dataStr !== "undefined") {
            const data = JSON.parse(dataStr);
            const email = data?.email || data?.companyEmail || data?.Email || data?.CompanyEmail || data?.emailAddress || data?.EmailAddress;
            if (email) { setCurrentEmail(email); return; }
          }
        } catch {}
      }
      setCurrentEmail("Not set");
    } catch { setCurrentEmail("Error loading email"); }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.newEmail?.trim()) { toast.error("Please enter new email address"); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.newEmail.trim())) { toast.error("Please enter a valid email address"); return; }
    if (currentEmail && formData.newEmail.trim().toLowerCase() === currentEmail.toLowerCase()) { toast.error("New email cannot be same as current email"); return; }
    if (!formData.currentPassword?.trim()) { toast.error("Please enter your current password for verification"); return; }
    if (formData.currentPassword.trim().length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (!formData.reason?.trim()) { toast.error("Please provide a reason for the change"); return; }
    if (formData.reason.trim().length < 10) { toast.error("Reason must be at least 10 characters"); return; }

    const requestPayload = {
      ChangeType: "Email",
      NewEmail: formData.newEmail.trim(),
      CurrentPassword: formData.currentPassword.trim(),
      Reason: formData.reason.trim(),
    };
    onSubmit(requestPayload);
  };

  const handleClose = () => { if (!isLoading) { resetForm(); onClose(); } };
  const handleCancelRequest = async () => {
  setIsLoading(true);
  try {
    const response = await ChangeRequestService.cancelChangeRequest(pendingRequestId);
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

  if (!show) return null;

  // PENDING REQUEST VIEW
  if (hasPendingRequest) {
    return (
      <>
        <div style={backdropStyle} onClick={handleClose}></div>
        <div style={wrapperStyle}>
          <div style={modalStyle}>
            <div style={headerStyle}>
              <div style={headerTitleStyle}>
                <i className="bi bi-exclamation-circle"></i> Request Account Change
              </div>
              <button disabled={isLoading} style={closeBtnStyle} onClick={handleClose} aria-label="Close">×</button>
            </div>
            <div style={bodyStyle}>
              <div style={alertDangerStyle}>
                <i className="bi bi-exclamation-triangle-fill"></i>
                <div>
                  <div style={alertHeadingStyle}>You already have a pending email change request.</div>
                  <div style={alertTextStyle}>Please wait for admin approval or cancel the existing request.</div>
                </div>
              </div>
              <div style={infoSectionStyle}>
                <div style={infoTitleStyle}><i className="bi bi-info-circle"></i> What can you do?</div>
                <ul style={infoListStyle}>
                  <li>Wait for the administrator to review your pending email change request</li>
                  <li>Cancel your pending request using the button below</li>
                  <li>After cancellation, you can submit a new email change request</li>
                </ul>
              </div>
            </div>
            <div style={footerStyle}>
              <button style={btnCancelStyle} onClick={handleClose}><i className="bi bi-check2"></i> Close</button>
              <button style={btnSubmitStyle} onClick={handleCancelRequest} disabled={isLoading}>
                {isLoading ?
                  (<><span style={spinnerStyle}></span> Cancelling Request...</>)
                  : (<><i className="bi bi-x-circle"></i> Cancel Request</>)
                }
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // MAIN FORM
  return (
    <>
      <div style={backdropStyle} onClick={handleClose}></div>
      <div style={wrapperStyle}>
        <div style={modalStyle}>
          <div style={headerStyle}>
            <div style={headerTitleStyle}><i className="bi bi-pencil-square"></i> Request Account Change</div>
            <button style={closeBtnStyle} onClick={handleClose} aria-label="Close">×</button>
          </div>
          <div style={bodyStyle}>
            <div style={infoAlertStyle}>
              <i className="bi bi-info-circle"></i>
              <div>
                <strong>Note:</strong> You can request to change your Email address. Your current password is required for security verification. Your request will be sent to admin for approval. You can only have one pending request at a time.
              </div>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Current Email Address</label>
                <input
                  type="text" value={currentEmail} disabled readOnly style={disabledInputStyle} />
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>New Email Address <span style={requiredMarkStyle}>*</span></label>
                <input
                  type="email"
                  required
                  placeholder="Enter new email address (e.g., newemail@example.com)"
                  value={formData.newEmail}
                  onChange={e => setFormData({ ...formData, newEmail: e.target.value })}
                  style={inputStyle} />
                <small style={helperTextStyle}>Enter a valid email address that you have access to</small>
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Current Password <span style={requiredMarkStyle}>*</span></label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.currentPassword}
                    onChange={e => setFormData({ ...formData, currentPassword: e.target.value })}
                    placeholder="Enter your current password for verification"
                    required minLength={6} style={inputWithIconStyle} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={passwordToggleStyle}
                    aria-label={showPassword ? "Hide password" : "Show password"}>
                    <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                  </button>
                </div>
                <small style={helperTextStyle}>
                  <i className="bi bi-shield-lock me-1"></i>
                  Your password is required to verify this change request for security purposes
                </small>
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Reason for Change <span style={requiredMarkStyle}>*</span></label>
                <textarea
                  required minLength={10} maxLength={1000}
                  rows={4}
                  placeholder="Please provide a detailed reason for this email change request (minimum 10 characters)"
                  value={formData.reason}
                  onChange={e => setFormData({ ...formData, reason: e.target.value })}
                  style={textareaStyle}></textarea>
                <small style={helperTextStyle}>
                  {formData.reason.length}/1000 characters
                  {formData.reason.length > 0 && formData.reason.length < 10 && (
                    <span style={{ color: "#dc3545", marginLeft: 8 }}>(Minimum 10 characters required)</span>
                  )}
                </small>
              </div>
              <div style={footerStyle}>
                <button type="button" style={btnCancelStyle} onClick={handleClose}>
                  <i className="bi bi-x-circle"></i> Cancel
                </button>
                <button
                  type="submit"
                  disabled={!formData.newEmail.trim() || !formData.currentPassword.trim() || formData.currentPassword.trim().length < 6 || formData.reason.length < 10}
                  style={btnSubmitStyle}>
                  <i className="bi bi-send"></i> Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <style>
        {`
          @keyframes spin { 0%{transform:rotate(0deg);} 100%{transform:rotate(360deg);} }
        `}
      </style>
    </>
  );
};

// Styles
const backdropStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(39, 35, 92, 0.4)',
  backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
  zIndex: 1040, transition: 'all 0.3s ease'
};
const wrapperStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1050, padding: 20
};
const modalStyle = {
  width: '100%', maxWidth: 800, maxHeight: '85vh', display: 'flex', flexDirection: 'column',
  borderRadius: 8, overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.30)', backgroundColor: '#fff'
};
const headerStyle = {
  backgroundColor: '#27235C', color: '#fff', padding: '16px 20px',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0
};
const headerTitleStyle = {
  fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8
};
const closeBtnStyle = {
  background: 'transparent', border: 'none', color: '#fff', fontSize: 20,
  cursor: 'pointer', padding: 0, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center'
};
const bodyStyle = {
  padding: 20, overflowY: 'auto', flex: 1, backgroundColor: '#fff', maxHeight: 'calc(85vh - 64px)'
};
const infoAlertStyle = {
  backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: 16,
  marginBottom: 24, display: 'flex', gap: 12, color: '#0369a1', fontSize: 14
};
const alertDangerStyle = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: 8,
  padding: 16,
  marginBottom: 24,
  color: '#b91c1c',
  display: 'flex',
  textAlign: 'center',
  gap: 12,
  fontSize: 14,
  alignItems: 'flex-start'
};

const alertHeadingStyle = { fontWeight: 600, fontSize: 14, marginBottom: 4 };
const alertTextStyle = { fontSize: 13, margin: 0 };
const infoSectionStyle = {
  marginBottom: 24,
  textAlign: 'left'
};

const infoTitleStyle = {
  fontSize: 14,
  fontWeight: 600,
  marginBottom: 12,
  color: '#334155',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  textAlign: 'left',          // title left align
  justifyContent: 'flex-start'
};

const infoListStyle = {
  margin: 0,
  paddingLeft: 24,    // indent bullets
  color: '#64748b',
  fontSize: 13,
  lineHeight: 1.6,
  textAlign: 'left',
  maxWidth: '100%'
};


const formGroupStyle = { marginBottom: 20 };
const labelStyle = { display: 'block', fontWeight: 600, color: '#334155', fontSize: 14, marginBottom: 6 };
const requiredMarkStyle = { color: '#ef4444', fontWeight: 700 };
const disabledInputStyle = {
  width: '100%', padding: '10px', fontSize: 14, borderRadius: 6, border: '1px solid #d0d0d0',
  backgroundColor: "#f0f0f0", color: "#666", cursor: 'not-allowed'
};
const inputStyle = {
  width: '100%', padding: '10px', fontSize: 14, borderRadius: 6,
  border: '1px solid #cbd5e1', transition: 'all 0.2s ease', outline: 'none', boxSizing: 'border-box'
};
const inputWithIconStyle = { ...inputStyle, paddingRight: 45 };
const passwordToggleStyle = {
  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
  background: "none", border: "none", cursor: "pointer", color: "#666", fontSize: 18, padding: 5
};
const textareaStyle = {
  width: '100%', padding: '10px', fontSize: 14, borderRadius: 6, border: '1px solid #cbd5e1',
  transition: 'all 0.2s ease', outline: 'none', resize: 'vertical', minHeight: 80, maxHeight: 120, boxSizing: 'border-box'
};
const helperTextStyle = { color: '#64748b', fontSize: 12, marginTop: 4, display: 'block' };
const footerStyle = {
  padding: '12px 20px', borderTop: '1px solid #e2e8f0', backgroundColor: '#fff',
  flexShrink: 0, display: 'flex', justifyContent: 'flex-end', gap: 8, borderBottomLeftRadius: 12, borderBottomRightRadius: 12
};
const btnCancelStyle = {
  backgroundColor: '#6c757d', borderColor: '#6c757d', color: '#fff', fontWeight: 600,
  padding: '8px 16px', fontSize: 13, borderRadius: 6, border: 'none',
  cursor: 'pointer', transition: 'all 0.2s ease', display: 'inline-flex', alignItems: 'center', gap: 6
};
const btnSubmitStyle = {
  background: 'linear-gradient(90deg, #97247E 0%, #E01950 100%)', border: 'none', color: '#fff',
  padding: '8px 16px', fontWeight: 600, fontSize: 13, borderRadius: 6, transition: 'all 0.12s ease',
  boxShadow: '0 2px 8px rgba(151, 36, 126, 0.25)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6
};
const spinnerStyle = {
  width: '14px', height: '14px',
  border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%',
  animation: 'spin 0.6s linear infinite', display: 'inline-block'
};

export default ChangeRequestModal;
