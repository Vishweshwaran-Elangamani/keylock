import { useState, useEffect } from "react";
import { toast } from "sonner";
import ChangeRequestService from "../../../../services/auth/changeRequestService";

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

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.newEmail?.trim()) {
      toast.error("Please enter new email address");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.newEmail.trim())) {
      toast.error("Please enter a valid email address");
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

  if (!show) return null;

  // PENDING REQUEST VIEW
  if (hasPendingRequest) {
    return (
      <>
        {/* Blurred Backdrop */}
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(39,35,92,0.4)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            zIndex: 1040,
          }}
          onClick={handleClose}
        />

        {/* Modal Container with Scroll */}
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            maxWidth: "600px",
            maxHeight: "75vh",
            zIndex: 1050,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              borderRadius: "0.5rem",
              background: "#fff",
              boxShadow: "0 8px 28px rgba(0,0,0,0.22)",
              overflow: "hidden",
              width: "100%",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* HEADER - Fixed */}
            <div
              style={{
                background: "#27235C",
                color: "#fff",
                padding: "13px 15px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "15px",
                fontWeight: 600,
                borderRadius: "0.5rem 0.5rem 0 0",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                <i className="bi bi-exclamation-circle"></i>
                Request Account Change
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                aria-label="Close"
                style={{
                  background: "none",
                  border: "none",
                  color: "#fff",
                  fontSize: 18,
                  cursor: isLoading ? "not-allowed" : "pointer",
                  opacity: isLoading ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            {/* BODY - Scrollable */}
            <div
              style={{
                padding: "20px",
                background: "#fff",
                textAlign: "left",
                overflowY: "auto",
                flex: 1,
              }}
            >
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 24,
                  color: "#b91c1c",
                  display: "flex",
                  gap: 12,
                  fontSize: 14,
                  alignItems: "flex-start",
                }}
              >
                <i
                  className="bi bi-exclamation-triangle-fill"
                  style={{ fontSize: 20, flexShrink: 0 }}
                ></i>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                    You already have a pending email change request.
                  </div>
                  <div style={{ fontSize: 13, margin: 0 }}>
                    Please wait for admin approval or cancel the existing request.
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    marginBottom: 12,
                    color: "#334155",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <i className="bi bi-info-circle"></i>
                  What can you do?
                </div>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: 24,
                    color: "#64748b",
                    fontSize: 13,
                    lineHeight: 1.6,
                  }}
                >
                  <li>
                    Wait for the administrator to review your pending email change
                    request
                  </li>
                  <li>Cancel your pending request using the button below</li>
                  <li>
                    After cancellation, you can submit a new email change request
                  </li>
                </ul>
              </div>
            </div>

            {/* FOOTER - Fixed */}
            <div
              style={{
                padding: "10px 15px",
                borderTop: "1px solid #e2e8f0",
                background: "#fff",
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                borderBottomLeftRadius: "0.5rem",
                borderBottomRightRadius: "0.5rem",
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                onClick={handleClose}
                style={{
                  background: "#6c757d",
                  border: "none",
                  color: "#fff",
                  fontWeight: 600,
                  padding: "7px 12px",
                  fontSize: 12,
                  borderRadius: 5,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#5a6268";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "#6c757d";
                }}
              >
                <i className="bi bi-check2"></i> Close
              </button>

              <button
                type="button"
                onClick={handleCancelRequest}
                disabled={isLoading}
                style={{
                  background: "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
                  border: "none",
                  color: "#fff",
                  fontWeight: 600,
                  padding: "7px 12px",
                  fontSize: 12,
                  borderRadius: 5,
                  boxShadow: "0 2px 8px rgba(151,36,126,0.25)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  cursor: isLoading ? "not-allowed" : "pointer",
                  opacity: isLoading ? 0.85 : 1,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) e.target.style.opacity = 0.93;
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) e.target.style.opacity = 1;
                }}
              >
                {isLoading ? (
                  <>
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        border: "2px solid #fff",
                        borderTop: "2px solid #E01950",
                        borderRadius: "50%",
                        animation: "spin 0.7s linear infinite",
                        display: "inline-block",
                        marginRight: 6,
                      }}
                    />
                    Cancelling Request...
                    <style>{`
                      @keyframes spin {
                        0% { transform: rotate(0deg);}
                        100% { transform: rotate(360deg);}
                      }
                    `}</style>
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

  // MAIN FORM
  return (
    <>
      {/* Blurred Backdrop */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(39,35,92,0.4)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 1040,
        }}
        onClick={handleClose}
      />

      {/* Modal Container with Scroll */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "95%",
          maxWidth: "700px",
          maxHeight: "85vh",
          zIndex: 1050,
          flexDirection: "column",
        }}
      >
        <div
          style={{
            borderRadius: "0.5rem",
            background: "#fff",
            boxShadow: "0 8px 28px rgba(0,0,0,0.22)",
            overflow: "hidden",
            width: "100%",
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* HEADER - Fixed */}
          <div
            style={{
              background: "#27235C",
              color: "#fff",
              padding: "13px 15px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "15px",
              fontWeight: 600,
              borderRadius: "0.5rem 0.5rem 0 0",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "#fff",
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              <i className="bi bi-pencil-square"></i>
              Request Account Change
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                fontSize: 18,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* BODY - Scrollable */}
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "20px",
                background: "#fff",
                textAlign: "left",
                overflowY: "auto",
                flex: 1,
              }}
            >
              <div
                style={{
                  background: "#f0f9ff",
                  border: "1px solid #bae6fd",
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 24,
                  display: "flex",
                  gap: 12,
                  color: "#0369a1",
                  fontSize: 14,
                }}
              >
                <i
                  className=""
                  style={{ fontSize: 20, flexShrink: 0 }}
                ></i>
                <div>
                  <strong>Note:</strong> You can request to change your Email
                  address. Your current password is required for security
                  verification. Your request will be sent to admin for approval.
                  You can only have one pending request at a time.
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    color: "#334155",
                    fontSize: 14,
                    marginBottom: 6,
                  }}
                >
                  Current Email Address
                </label>
                <input
                  type="text"
                  value={currentEmail}
                  disabled
                  readOnly
                  style={{
                    width: "100%",
                    padding: 10,
                    fontSize: 14,
                    borderRadius: 6,
                    border: "1px solid #d0d0d0",
                    background: "#f0f0f0",
                    color: "#666",
                    cursor: "not-allowed",
                  }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    color: "#334155",
                    fontSize: 14,
                    marginBottom: 6,
                  }}
                >
                  New Email Address{" "}
                  <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="Enter new email address (e.g., newemail@example.com)"
                  value={formData.newEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, newEmail: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: 10,
                    fontSize: 14,
                    borderRadius: 6,
                    border: "1px solid #cbd5e1",
                    transition: "all 0.2s ease",
                    outline: "none",
                  }}
                />
                <small
                  style={{
                    color: "#64748b",
                    fontSize: 12,
                    marginTop: 4,
                    display: "block",
                  }}
                >
                  Enter a valid email address that you have access to
                </small>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    color: "#334155",
                    fontSize: 14,
                    marginBottom: 6,
                  }}
                >
                  Current Password{" "}
                  <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
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
                    style={{
                      width: "100%",
                      padding: 10,
                      paddingRight: 45,
                      fontSize: 14,
                      borderRadius: 6,
                      border: "1px solid #cbd5e1",
                      transition: "all 0.2s ease",
                      outline: "none",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#666",
                      fontSize: 18,
                      padding: 5,
                    }}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <i
                      className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}
                    ></i>
                  </button>
                </div>
                <small
                  style={{
                    color: "#64748b",
                    fontSize: 12,
                    marginTop: 4,
                    display: "block",
                  }}
                >
                  <i className="bi bi-shield-lock" style={{ marginRight: 4 }}></i>
                  Your password is required to verify this change request for
                  security purposes
                </small>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    color: "#334155",
                    fontSize: 14,
                    marginBottom: 6,
                  }}
                >
                  Reason for Change{" "}
                  <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
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
                  style={{
                    width: "100%",
                    padding: 10,
                    fontSize: 14,
                    borderRadius: 6,
                    border: "1px solid #cbd5e1",
                    transition: "all 0.2s ease",
                    outline: "none",
                    resize: "vertical",
                    minHeight: 80,
                    maxHeight: 120,
                  }}
                ></textarea>
                <small
                  style={{
                    color: "#64748b",
                    fontSize: 12,
                    marginTop: 4,
                    display: "block",
                  }}
                >
                  {formData.reason.length}/1000 characters
                  {formData.reason.length > 0 && formData.reason.length < 10 && (
                    <span style={{ color: "#dc3545", marginLeft: 8 }}>
                      (Minimum 10 characters required)
                    </span>
                  )}
                </small>
              </div>
            </div>

            {/* FOOTER - Fixed */}
            <div
              style={{
                padding: "10px 15px",
                borderTop: "1px solid #e2e8f0",
                background: "#fff",
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                borderBottomLeftRadius: "0.5rem",
                borderBottomRightRadius: "0.5rem",
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                onClick={handleClose}
                style={{
                  background: "#6c757d",
                  border: "none",
                  color: "#fff",
                  fontWeight: 600,
                  padding: "7px 12px",
                  fontSize: 12,
                  borderRadius: 5,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#5a6268";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "#6c757d";
                }}
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
                style={{
                  background: "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
                  border: "none",
                  color: "#fff",
                  fontWeight: 600,
                  padding: "7px 12px",
                  fontSize: 12,
                  borderRadius: 5,
                  boxShadow: "0 2px 8px rgba(151,36,126,0.25)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  cursor:
                    !formData.newEmail.trim() ||
                    !formData.currentPassword.trim() ||
                    formData.currentPassword.trim().length < 6 ||
                    formData.reason.length < 10
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    !formData.newEmail.trim() ||
                    !formData.currentPassword.trim() ||
                    formData.currentPassword.trim().length < 6 ||
                    formData.reason.length < 10
                      ? 0.6
                      : 1,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (
                    formData.newEmail.trim() &&
                    formData.currentPassword.trim() &&
                    formData.currentPassword.trim().length >= 6 &&
                    formData.reason.length >= 10
                  ) {
                    e.target.style.opacity = 0.93;
                  }
                }}
                onMouseLeave={(e) => {
                  if (
                    formData.newEmail.trim() &&
                    formData.currentPassword.trim() &&
                    formData.currentPassword.trim().length >= 6 &&
                    formData.reason.length >= 10
                  ) {
                    e.target.style.opacity = 1;
                  }
                }}
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
