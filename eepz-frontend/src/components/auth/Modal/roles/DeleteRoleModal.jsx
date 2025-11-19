/**
 * DeleteRoleModal Component
 *
 * A confirmation modal for permanently deleting roles from the system.
 * Features:
 * - Critical warning message to prevent accidental deletions
 * - Clear explanation of consequences
 * - Loading state during API call
 * - Toast notifications using Sonner for success/error feedback
 * - Protection for system roles (cannot be deleted)
 * - Cannot be reversed once executed
 *
 * @param {boolean} show - Controls modal visibility
 * @param {Object} role - Role object containing role details to be deleted
 * @param {function} onClose - Callback to close the modal
 * @param {function} onConfirm - Callback function that performs the deletion
 */

import { useState } from "react";
import { toast } from "sonner";
import "../../../../styles/auth/roles/DeleteRoleModal.css";

const DeleteRoleModal = ({ show, role, onClose, onConfirm }) => {
  // ========================
  // STATE MANAGEMENT
  // ========================

  /**
   * Loading state - tracks deletion operation status
   * Used to disable buttons and show loading indicator during API call
   */
  const [loading, setLoading] = useState(false);

  // ========================
  // EVENT HANDLERS
  // ========================

  /**
   * Handles role deletion
   * Calls the parent's onConfirm callback to delete the role
   * Shows success/error notifications using Sonner toast
   * This action is PERMANENT and cannot be reversed
   */
  const handleDelete = async () => {
    try {
      // Set loading state to disable buttons and show spinner
      setLoading(true);

      // Show loading toast
      toast.loading("Deleting role...");

      // -------- API Call (via parent callback) --------
      // Call parent's confirm handler which contains the actual delete logic
      await onConfirm();

      // Note: Parent component (RoleList) handles success/error toasts
      // and closes the modal after successful deletion
    } catch (error) {
      // -------- Handle Exception --------
      console.error("Error deleting role:", error);
      toast.dismiss();
      toast.error(error.message || "Failed to delete role");
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
      <div className="modal-backdrop-delete-role"></div>

      {/* Modal Wrapper - Centers modal on screen */}
      <div className="modal-wrapper-delete-role">
        <div className="modal-dialog-delete-role">
          <div className="modal-content-delete-role">
            {/* ======================== */}
            {/* MODAL HEADER */}
            {/* ======================== */}
            <div className="modal-header-delete-role">
              <h5 className="modal-title-delete-role">
                <i className="bi bi-trash-fill"></i>
                Delete Role Permanently
              </h5>
              {/* Close Button - Disabled during loading to prevent interruption */}
              <button
                type="button"
                className="modal-close-btn-delete-role"
                onClick={onClose}
                disabled={loading}
                aria-label="Close"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            {/* ======================== */}
            {/* MODAL BODY */}
            {/* ======================== */}
            <div className="modal-body-delete-role">
              {/* -------- Confirmation Question -------- */}
              {/* Displays role name and code for confirmation */}
              <p className="delete-question-delete-role">
                Are you sure you want to permanently delete the role{" "}
                <strong className="role-name-highlight-delete-role">
                  {role?.roleName}
                </strong>
                ?
              </p>

              {/* -------- Role Information Box -------- */}
              {/* Shows role details for verification */}
              <div className="role-info-box-delete-role">
                <div className="role-info-item-delete-role">
                  <span className="role-info-label-delete-role">
                    Role Name:
                  </span>
                  <strong className="role-info-value-delete-role">
                    {role?.roleName}
                  </strong>
                </div>
                <div className="role-info-item-delete-role">
                  <span className="role-info-label-delete-role">
                    Role Code:
                  </span>
                  <code className="role-code-badge-delete-role">
                    {role?.roleCode}
                  </code>
                </div>
                {role?.description && (
                  <div className="role-info-item-delete-role">
                    <span className="role-info-label-delete-role">
                      Description:
                    </span>
                    <span className="role-info-value-delete-role">
                      {role.description}
                    </span>
                  </div>
                )}
              </div>

              {/* -------- Critical Warning Box -------- */}
              {/* Prominently displays the severity and consequences of this action */}
              <div className="warning-box-delete-role">
                {/* Warning Header with Icon */}
                <div className="warning-header-delete-role">
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  <span>Critical Warning</span>
                </div>

                {/* Warning Text - Emphasizes permanence */}
                <p className="warning-text-delete-role">
                  <strong>
                    This action is PERMANENT and CANNOT be reversed!
                  </strong>
                  <br />
                  Once deleted, this role will:
                </p>

                {/* Warning List - Details all consequences */}
                <ul className="warning-list-delete-role">
                  <li>Be permanently removed from the system</li>
                  <li>Require all users with this role to be reassigned</li>
                  <li>Cannot be recovered or restored</li>
                </ul>
              </div>

              {/* -------- Info Alert -------- */}
              {/* Additional reminder to ensure correct action */}
              <div className="info-alert-delete-role">
                <i className="bi bi-info-circle"></i>
                <small>
                  <strong>Note:</strong> Please ensure this is the correct
                  action before proceeding. System roles are protected and
                  cannot be deleted.
                </small>
              </div>
            </div>

            {/* ======================== */}
            {/* MODAL FOOTER - ACTION BUTTONS */}
            {/* ======================== */}
            <div className="modal-footer-delete-role">
              {/* Cancel Button - Closes modal without deleting */}
              <button
                type="button"
                className="btn-cancel-delete-role"
                onClick={onClose}
                disabled={loading}
              >
                <i className="bi bi-arrow-left"></i>
                Cancel
              </button>

              {/* Delete Button - Executes permanent deletion */}
              {/* Disabled during loading to prevent duplicate requests */}
              <button
                type="button"
                className="btn-submit-delete-role"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? (
                  // Show loading state with spinner and text
                  <>
                    <span className="spinner-delete-role"></span>
                    Deleting...
                  </>
                ) : (
                  // Show normal state with clear action text
                  <>
                    <i className="bi bi-trash-fill"></i>
                    Yes, Delete Permanently
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

export default DeleteRoleModal;
