import { useState, useEffect } from "react";
import { toast } from "sonner";
import ChangeRequestService from "../../../services/auth/changeRequestService";
import "../../../styles/auth/common/ChangeRequestModal.css";

const ChangeRequestModal = ({ show, onClose, onSubmit, profileData, hasPendingRequest, pendingRequestId }) => {
  
  const [formData, setFormData] = useState({
    newEmail: "",
    reason: "",
  });

  const [currentEmail, setCurrentEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (show) {
      console.log("🟢 Modal opened");
      fetchCurrentEmail();
    } else {
      resetForm();
    }
  }, [show]);

  const resetForm = () => {
    setFormData({
      newEmail: "",
      reason: "",
    });
    setCurrentEmail("");
  };

  const fetchCurrentEmail = () => {
    console.log("📧 === FETCH CURRENT EMAIL STARTED ===");
    
    try {
      console.log("1️⃣ Checking profileData prop:", profileData);
      
      if (profileData?.companyEmail) {
        console.log("✅ Email found in prop (companyEmail):", profileData.companyEmail);
        setCurrentEmail(profileData.companyEmail);
        return;
      }
      
      if (profileData?.email) {
        console.log("✅ Email found in prop (email):", profileData.email);
        setCurrentEmail(profileData.email);
        return;
      }

      console.log("2️⃣ Checking localStorage...");
      
      const storageKeys = ["userProfile", "user", "authUser", "currentUser", "userData"];

      for (const key of storageKeys) {
        try {
          const dataStr = localStorage.getItem(key);
          console.log(`  Checking key "${key}":`, dataStr ? "Found" : "Not found");
          
          if (dataStr && dataStr !== "null" && dataStr !== "undefined") {
            const data = JSON.parse(dataStr);
            console.log(`  Parsed ${key}:`, data);
            
            const email = data?.email || data?.companyEmail || data?.Email || data?.CompanyEmail || data?.emailAddress || data?.EmailAddress;
            
            if (email) {
              console.log(`✅ Email found in localStorage.${key}:`, email);
              setCurrentEmail(email);
              return;
            }
          }
        } catch (e) {
          console.warn(`  Failed to parse ${key}:`, e.message);
        }
      }

      console.log("❌ No email found in any source");
      setCurrentEmail("Not set");
      
    } catch (error) {
      console.error("❌ Error in fetchCurrentEmail:", error);
      setCurrentEmail("Error loading email");
    }
    
    console.log("📧 === FETCH CURRENT EMAIL COMPLETED ===");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.newEmail || !formData.newEmail.trim()) {
      toast.error("Please enter new email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.newEmail.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (currentEmail && formData.newEmail.trim().toLowerCase() === currentEmail.toLowerCase()) {
      toast.error("New email cannot be same as current email");
      return;
    }

    if (!formData.reason || !formData.reason.trim()) {
      toast.error("Please provide a reason for the change");
      return;
    }

    if (formData.reason.trim().length < 10) {
      toast.error("Reason must be at least 10 characters");
      return;
    }

    const requestPayload = {
      NewEmail: formData.newEmail.trim(),
      Reason: formData.reason.trim(),
    };

    console.log("🚀 Submitting request:", requestPayload);
    onSubmit(requestPayload);
  };

  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  };

  const handleCancelRequest = async () => {
    if (!window.confirm("Are you sure you want to cancel your pending email change request?")) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await ChangeRequestService.cancelChangeRequest(pendingRequestId);

      if (response.success) {
        toast.success("Email change request cancelled successfully");
        onClose("requestCancelled");
      } else {
        toast.error(response.message || "Failed to cancel request");
      }
    } catch (error) {
      console.error("Error cancelling request:", error);
      toast.error("Failed to cancel request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!show) return null;

  if (hasPendingRequest) {
    return (
      <>
        <div className="modal-backdrop-custom"></div>
        
        <div className="modal-wrapper-custom">
          <div className="modal-content-custom">
            
            <div className="modal-header-custom">
              <h5 className="modal-title-custom">
                <i className="bi bi-exclamation-circle"></i>
                Request Account Change
              </h5>
              <button type="button" className="modal-close-btn" onClick={handleClose} disabled={isLoading} aria-label="Close">
                ×
              </button>
            </div>

            <div className="modal-body-custom">
              
              <div className="alert-danger-custom">
                <i className="bi bi-exclamation-triangle-fill"></i>
                <div>
                  <h6 className="alert-heading-custom">You already have a pending email change request.</h6>
                  <p className="alert-text-custom">Please wait for admin approval or cancel the existing request.</p>
                </div>
              </div>

              <div className="info-section-custom">
                <h6 className="info-title-custom">
                  <i className="bi bi-info-circle"></i>
                  What can you do?
                </h6>
                <ul className="info-list-custom">
                  <li>Wait for the administrator to review your pending email change request</li>
                  <li>Cancel your pending request using the button below</li>
                  <li>After cancellation, you can submit a new email change request</li>
                </ul>
              </div>
            </div>

            <div className="modal-footer-custom">
              <button type="button" className="btn-cancel" onClick={handleClose} disabled={isLoading}>
                <i className="bi bi-check2"></i>
                Close
              </button>
              <button type="button" className="btn-submit" onClick={handleCancelRequest} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="spinner-custom"></span>
                    Cancelling Request...
                  </>
                ) : (
                  <>
                    <i className="bi bi-x-circle"></i>
                    Cancel Request
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
      <div className="modal-backdrop-custom" onClick={handleClose}></div>
      
      <div className="modal-wrapper-custom">
        <div className="modal-content-custom">
          
          <div className="modal-header-custom">
            <h5 className="modal-title-custom">
              <i className="bi bi-pencil-square"></i>
              Request Account Change
            </h5>
            <button type="button" className="modal-close-btn" onClick={handleClose} aria-label="Close">
              ×
            </button>
          </div>

          <div className="modal-body-custom">
            
            <div className="info-alert-custom">
              <i className="bi bi-info-circle"></i>
              <div>
                <strong>Note:</strong> You can request to change your Email address. Your request will be sent to admin for approval. You can only have one pending request at a time.
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              
              <div className="form-group-custom">
                <label className="form-label-custom">Current Email Address</label>
                <input type="text" className="form-input-custom" value={currentEmail} disabled readOnly style={{ backgroundColor: "#f0f0f0", cursor: "not-allowed", color: "#666", border: "1px solid #d0d0d0" }} />
              </div>

              <div className="form-group-custom">
                <label className="form-label-custom">
                  New Email Address <span className="required-mark">*</span>
                </label>
                <input type="email" className="form-input-custom" value={formData.newEmail} onChange={(e) => setFormData({ ...formData, newEmail: e.target.value })} placeholder="Enter new email address (e.g., newemail@example.com)" required />
                <small className="helper-text-custom">Enter a valid email address that you have access to</small>
              </div>

              <div className="form-group-custom">
                <label className="form-label-custom">
                  Reason for Change <span className="required-mark">*</span>
                </label>
                <textarea className="form-textarea-custom" rows="4" value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} placeholder="Please provide a detailed reason for this email change request (minimum 10 characters)" required minLength="10" maxLength="1000"></textarea>
                <small className="helper-text-custom">
                  {formData.reason.length}/1000 characters
                  {formData.reason.length > 0 && formData.reason.length < 10 && (
                    <span style={{ color: "#dc3545", marginLeft: "8px" }}>(Minimum 10 characters required)</span>
                  )}
                </small>
              </div>

              <div className="modal-footer-custom">
                <button type="button" className="btn-cancel" onClick={handleClose}>
                  <i className="bi bi-x-circle"></i>
                  Cancel
                </button>
                
                <button type="submit" className="btn-submit" disabled={!formData.newEmail.trim() || formData.reason.length < 10}>
                  <i className="bi bi-send"></i>
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChangeRequestModal;