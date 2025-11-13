/**
 * ChangeRequestModal Component
 * 
 * A modal component for requesting account changes (Employee ID or Email).
 * Features:
 * - Two views: Pending Request (alert) and Normal Form
 * - Form validation for change type, new value, and reason
 * - Real-time validation feedback
 * - Toast notifications using Sonner for user feedback
 * - Loading state during API operations
 * - Responsive design
 * 
 * @param {boolean} show - Controls modal visibility
 * @param {function} onClose - Callback to close the modal
 * @param {function} onSubmit - Callback to submit the change request
 * @param {Object} profileData - Current user profile data
 * @param {boolean} hasPendingRequest - Whether user has a pending change request
 * @param {string} pendingRequestId - ID of pending request (if exists)
 */

import { useState } from "react";
import { toast } from "sonner";
import ChangeRequestService from "../../../services/auth/changeRequestService";
import "../../../styles/auth/common/ChangeRequestModal.css";

const ChangeRequestModal = ({ show, onClose, onSubmit, profileData, hasPendingRequest, pendingRequestId }) => {
  // ========================
  // STATE MANAGEMENT
  // ========================

  /**
   * Form data state - stores all change request fields
   * Initialized with empty values
   */
  const [formData, setFormData] = useState({
    changeType: "",
    newEmployeeCompanyId: "",
    newEmail: "",
    reason: "",
  });

  /**
   * Current value state - shows current value for selected change type
   */
  const [currentValue, setCurrentValue] = useState("");

  /**
   * Loading state - tracks form submission status
   * Used to disable buttons and show loading indicator
   */
  const [isLoading, setIsLoading] = useState(false);

  // ========================
  // CONSTANTS
  // ========================

  /**
   * Available change types for user selection
   */
  const changeTypes = [
    { value: "EmployeeCompanyId", label: "Employee Company ID (Username)" },
    { value: "Email", label: "Email Address" },
  ];

  // ========================
  // EVENT HANDLERS
  // ========================

  /**
   * Handles change type selection
   * Updates form data and current value display
   * Clears other fields when changing type
   * 
   * @param {Event} e - Select change event
   */
  const handleChangeTypeChange = (e) => {
    const selectedType = e.target.value;

    setFormData({
      ...formData,
      changeType: selectedType,
      newEmployeeCompanyId: "",
      newEmail: "",
      reason: "",
    });

    if (selectedType === "EmployeeCompanyId") {
      setCurrentValue(profileData?.employeeCompanyId || "Not set");
    } else if (selectedType === "Email") {
      setCurrentValue(profileData?.companyEmail || "Not set");
    } else {
      setCurrentValue("");
    }
  };

  /**
   * Handles form submission
   * Validates all fields before submission
   * Shows Sonner toast notifications for user feedback
   * 
   * @param {Event} e - Form submit event
   */
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.changeType || !formData.reason) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate new Employee Company ID
    if (formData.changeType === "EmployeeCompanyId" && !formData.newEmployeeCompanyId) {
      toast.error("Please enter new Employee Company ID");
      return;
    }

    // Validate new Email
    if (formData.changeType === "Email") {
      if (!formData.newEmail) {
        toast.error("Please enter new email address");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.newEmail)) {
        toast.error("Please enter a valid email address");
        return;
      }
    }

    // Prevent duplicate values
    if (formData.changeType === "EmployeeCompanyId" && formData.newEmployeeCompanyId === profileData?.employeeCompanyId) {
      toast.error("New Employee Company ID is same as current value");
      return;
    }

    if (formData.changeType === "Email" && formData.newEmail === profileData?.companyEmail) {
      toast.error("New email is same as current value");
      return;
    }

    // Prepare payload for API
    const requestPayload = {
      ChangeType: formData.changeType,
      Reason: formData.reason,
    };

    if (formData.changeType === "EmployeeCompanyId") {
      requestPayload.NewEmployeeCompanyId = formData.newEmployeeCompanyId;
    } else if (formData.changeType === "Email") {
      requestPayload.NewEmail = formData.newEmail;
    }

    // Submit to parent component
    onSubmit(requestPayload);
  };

  /**
   * Handles modal close
   * Resets form data and current value
   */
  const handleClose = () => {
    setFormData({
      changeType: "",
      newEmployeeCompanyId: "",
      newEmail: "",
      reason: "",
    });
    setCurrentValue("");
    onClose();
  };

  /**
   * Handles pending request cancellation
   * Shows confirmation dialog and API call
   */
  const handleCancelRequest = async () => {
    if (!window.confirm("Are you sure you want to cancel your pending change request?")) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await ChangeRequestService.cancelChangeRequest(pendingRequestId);

      if (response.success) {
        toast.success("Change request cancelled successfully");
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

  // ========================
  // RENDER LOGIC
  // ========================

  // Don't render modal if show prop is false
  if (!show) return null;

  // ========================
  // PENDING REQUEST VIEW
  // ========================
  if (hasPendingRequest) {
    return (
      <>
        {/* Modal Backdrop */}
        <div className="modal-backdrop-custom"></div>
        
        {/* Modal Wrapper */}
        <div className="modal-wrapper-custom">
          <div className="modal-dialog-custom">
            <div className="modal-content-custom">
              
              {/* Modal Header */}
              <div className="modal-header-custom">
                <h5 className="modal-title-custom">
                  <i className="bi bi-exclamation-circle"></i>
                  Request Account Change
                </h5>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={handleClose}
                  disabled={isLoading}
                  aria-label="Close"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              {/* Modal Body */}
              <div className="modal-body-custom">
                
                {/* Red Alert Box */}
                <div className="alert-danger-custom">
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  <div>
                    <h6 className="alert-heading-custom">You already have a pending change request.</h6>
                    <p className="alert-text-custom">
                      Please wait for admin approval or cancel the existing request.
                    </p>
                  </div>
                </div>

                {/* Info Section */}
                <div className="info-section-custom">
                  <h6 className="info-title-custom">
                    <i className="bi bi-info-circle"></i>
                    What can you do?
                  </h6>
                  <ul className="info-list-custom">
                    <li>Wait for the administrator to review your pending request</li>
                    <li>Cancel your pending request using the button below</li>
                    <li>After cancellation, you can submit a new change request</li>
                  </ul>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="modal-footer-custom">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  <i className="bi bi-check2"></i>
                  Close
                </button>
                <button
                  type="button"
                  className="btn-submit"
                  onClick={handleCancelRequest}
                  disabled={isLoading}
                >
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
        </div>
      </>
    );
  }

  // ========================
  // NORMAL FORM VIEW
  // ========================
  return (
    <>
      {/* Modal Backdrop */}
      <div className="modal-backdrop-custom"></div>
      
      {/* Modal Wrapper */}
      <div className="modal-wrapper-custom">
        <div className="modal-dialog-custom">
          <div className="modal-content-custom">
            
            {/* Modal Header */}
            <div className="modal-header-custom">
              <h5 className="modal-title-custom">
                <i className="bi bi-pencil-square"></i>
                Request Account Change
              </h5>
              <button
                type="button"
                className="modal-close-btn"
                onClick={handleClose}
                aria-label="Close"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit}>
              <div className="modal-body-custom">
                
                {/* Info Alert */}
                <div className="info-alert-custom">
                  <i className="bi bi-info-circle"></i>
                  <div>
                    <strong>Note:</strong> You can request to change your Employee Company ID (username) or Email address. 
                    Your request will be sent to admin for approval. You can only have one pending request at a time.
                  </div>
                </div>

                {/* Change Type Selection */}
                <div className="form-group-custom">
                  <label className="form-label-custom">
                    What do you want to change? <span className="required-mark">*</span>
                  </label>
                  <select
                    className="form-select-custom"
                    value={formData.changeType}
                    onChange={handleChangeTypeChange}
                    required
                  >
                    <option value="">Select change type</option>
                    {changeTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Current Value Display */}
                {formData.changeType && (
                  <div className="form-group-custom">
                    <label className="form-label-custom">Current Value</label>
                    <input
                      type="text"
                      className="form-input-custom"
                      value={currentValue}
                      disabled
                    />
                  </div>
                )}

                {/* New Employee Company ID */}
                {formData.changeType === "EmployeeCompanyId" && (
                  <div className="form-group-custom">
                    <label className="form-label-custom">
                      New Employee Company ID <span className="required-mark">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input-custom"
                      value={formData.newEmployeeCompanyId}
                      onChange={(e) =>
                        setFormData({ ...formData, newEmployeeCompanyId: e.target.value })
                      }
                      placeholder="Enter new Employee Company ID"
                      required
                    />
                    <small className="helper-text-custom">
                      This will be your new username for login
                    </small>
                  </div>
                )}

                {/* New Email Address */}
                {formData.changeType === "Email" && (
                  <div className="form-group-custom">
                    <label className="form-label-custom">
                      New Email Address <span className="required-mark">*</span>
                    </label>
                    <input
                      type="email"
                      className="form-input-custom"
                      value={formData.newEmail}
                      onChange={(e) =>
                        setFormData({ ...formData, newEmail: e.target.value })
                      }
                      placeholder="Enter new email address"
                      required
                    />
                    <small className="helper-text-custom">
                      This will be your new email for login and notifications
                    </small>
                  </div>
                )}

                {/* Reason for Change */}
                {formData.changeType && (
                  <div className="form-group-custom">
                    <label className="form-label-custom">
                      Reason for Change <span className="required-mark">*</span>
                    </label>
                    <textarea
                      className="form-textarea-custom"
                      rows="3"
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="Please provide a detailed reason for this change request (minimum 10 characters)"
                      required
                      minLength="10"
                    ></textarea>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="modal-footer-custom">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleClose}
                >
                  <i className="bi bi-x-circle"></i>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={!formData.changeType}
                >
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
