/**
 * DeactivateUserModal Component
 * 
 * A confirmation modal for permanently deactivating users from the system.
 * Features:
 * - Critical warning message to prevent accidental deactivations
 * - Clear explanation of consequences
 * - Loading state during API call
 * - Toast notifications using Sonner for success/error feedback
 * - Cannot be reversed once executed
 * 
 * @param {boolean} show - Controls modal visibility
 * @param {function} onHide - Callback to close the modal
 * @param {function} onUserDeactivated - Callback after successful deactivation
 * @param {Object} user - User object containing user details to be deactivated
 */

import { useState } from "react";
import userService from "../../../../services/auth/userService";
import { toast } from "sonner";
import "../../../../styles/auth/user/DeactivateUserModal.css";

const DeactivateUserModal = ({ show, onHide, onUserDeactivated, user }) => {
  // ========================
  // STATE MANAGEMENT
  // ========================

  /**
   * Loading state - tracks deactivation operation status
   * Used to disable buttons and show loading indicator during API call
   */
  const [loading, setLoading] = useState(false);

  // ========================
  // EVENT HANDLERS
  // ========================

  /**
   * Handles user deactivation
   * Makes API call to permanently deactivate the user
   * Shows success/error notifications using Sonner toast
   * This action is PERMANENT and cannot be reversed
   */
  const handleDeactivate = async () => {
    try {
      // Set loading state to disable buttons and show spinner
      setLoading(true);
      
      // -------- API Call --------
      // Call user service to permanently deactivate the user
      const response = await userService.deactivateUser(user.userId);

      // -------- Handle Success Response --------
      if (response.success) {
        // Show success notification using Sonner toast
        toast.success("User deactivated permanently!");
        
        // Trigger parent callback to refresh user list
        onUserDeactivated();
        
        // CRITICAL: Delay closing the modal to allow toast to render
        // Without this delay, modal unmounts before toast displays
        setTimeout(() => {
          onHide();
        }, 500); // 500ms delay
        
      } else {
        // -------- Handle Failure Response --------
        // Show error notification with API error message
        toast.error(response.message || "Failed to deactivate user");
      }
    } catch (error) {
      // -------- Handle Exception --------
      // Show error notification with error message
      toast.error(error.message || "Failed to deactivate user");
    } finally {
      // -------- Cleanup --------
      // Always reset loading state regardless of success or failure
      setLoading(false);
    }
  };

  // ========================
  // RENDER LOGIC
  // ========================

  // Don't render modal if show prop is false
  if (!show) return null;

  return (
    <>
      {/* Modal Backdrop - Darkens background */}
      <div className="modal-backdrop-deactivate"></div>
      
      {/* Modal Wrapper - Centers modal on screen */}
      <div className="modal-wrapper-deactivate">
        <div className="modal-dialog-deactivate">
          <div className="modal-content-deactivate">
            
            {/* ======================== */}
            {/* MODAL HEADER */}
            {/* ======================== */}
            <div className="modal-header-deactivate">
              <h5 className="modal-title-deactivate">
                <i className="bi bi-x-circle-fill"></i>
                Deactivate User Permanently
              </h5>
              {/* Close Button - Disabled during loading to prevent interruption */}
              <button
                type="button"
                className="modal-close-btn-deactivate"
                onClick={onHide}
                disabled={loading}
                aria-label="Close"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            {/* ======================== */}
            {/* MODAL BODY */}
            {/* ======================== */}
            <div className="modal-body-deactivate">
              
              {/* -------- Confirmation Question -------- */}
              {/* Displays user's full name for confirmation */}
              <p className="delete-question-deactivate">
                Are you sure you want to permanently deactivate{" "}
                <strong className="user-name-highlight-deactivate">
                  {user?.firstName} {user?.lastName}
                </strong>
                ?
              </p>

              {/* -------- Critical Warning Box -------- */}
              {/* Prominently displays the severity and consequences of this action */}
              <div className="warning-box-deactivate">
                {/* Warning Header with Icon */}
                <div className="warning-header-deactivate">
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  <span>Critical Warning</span>
                </div>
                
                {/* Warning Text - Emphasizes permanence */}
                <p className="warning-text-deactivate">
                  <strong>
                    This action is PERMANENT and CANNOT be reversed!
                  </strong>
                  <br />
                  Once deactivated, this user will:
                </p>
                
                {/* Warning List - Details all consequences */}
                <ul className="warning-list-deactivate">
                  <li>Lose all access to the system immediately</li>
                  <li>Be unable to log in</li>
                  <li>Not be able to be reactivated</li>
                </ul>
              </div>

              {/* -------- Info Alert -------- */}
              {/* Additional reminder to ensure correct action */}
              <div className="info-alert-deactivate">
                <i className="bi bi-info-circle"></i>
                <small>
                  <strong>Note:</strong> Please ensure this is the correct
                  action before proceeding.
                </small>
              </div>
            </div>

            {/* ======================== */}
            {/* MODAL FOOTER - ACTION BUTTONS */}
            {/* ======================== */}
            <div className="modal-footer-deactivate">
              
              {/* Cancel Button - Closes modal without deactivating */}
              <button
                type="button"
                className="btn-cancel-deactivate"
                onClick={onHide}
                disabled={loading}
              >
                <i className="bi bi-arrow-left"></i>
                Cancel
              </button>
              
              {/* Deactivate Button - Executes permanent deactivation */}
              {/* Disabled during loading to prevent duplicate requests */}
              <button
                type="button"
                className="btn-submit-deactivate"
                onClick={handleDeactivate}
                disabled={loading}
              >
                {loading ? (
                  // Show loading state with spinner and text
                  <>
                    <span className="spinner-deactivate"></span>
                    Deactivating...
                  </>
                ) : (
                  // Show normal state with clear action text
                  <>
                    <i className="bi bi-x-circle-fill"></i>
                    Yes, Deactivate Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeactivateUserModal;
