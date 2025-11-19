/**
 * DeleteDepartmentModal Component
 *
 * A confirmation modal for permanently deleting departments from the system.
 * Features:
 * - Critical warning message to prevent accidental deletions
 * - Clear explanation of consequences
 * - Loading state during API call
 * - Toast notifications using Sonner for success/error feedback
 * - Cannot be reversed once executed
 *
 * @param {boolean} show - Controls modal visibility
 * @param {Object} department - Department object containing department details to be deleted
 * @param {function} onClose - Callback to close the modal
 * @param {function} onConfirm - Callback function that performs the deletion
 */

import { useState } from "react";
import { toast } from "sonner";
import "../../../../styles/auth/department/DeleteDepartmentModal.css";

const DeleteDepartmentModal = ({ show, department, onClose, onConfirm }) => {
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
   * Handles department deletion
   * Calls the parent's onConfirm callback to delete the department
   * Shows success/error notifications using Sonner toast
   * This action is PERMANENT and cannot be reversed
   */
  const handleDelete = async () => {
    try {
      // Set loading state to disable buttons and show spinner
      setLoading(true);

      // Show loading toast
      toast.loading("Deleting department...");

      // -------- API Call (via parent callback) --------
      // Call parent's confirm handler which contains the actual delete logic
      await onConfirm();

      // Note: Parent component (DepartmentList) handles success/error toasts
      // and closes the modal after successful deletion
    } catch (error) {
      // -------- Handle Exception --------
      console.error("Error deleting department:", error);
      toast.dismiss();
      toast.error(error.message || "Failed to delete department");
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
      <div className="modal-backdrop-delete-dept"></div>

      {/* Modal Wrapper - Centers modal on screen */}
      <div className="modal-wrapper-delete-dept">
        <div className="modal-dialog-delete-dept">
          <div className="modal-content-delete-dept">
            {/* ======================== */}
            {/* MODAL HEADER */}
            {/* ======================== */}
            <div className="modal-header-delete-dept">
              <h5 className="modal-title-delete-dept">
                <i className="bi bi-trash-fill"></i>
                Delete Department Permanently
              </h5>
              {/* Close Button - Disabled during loading to prevent interruption */}
              <button
                type="button"
                className="modal-close-btn-delete-dept"
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
            <div className="modal-body-delete-dept">
              {/* -------- Confirmation Question -------- */}
              {/* Displays department name for confirmation */}
              <p className="delete-question-delete-dept">
                Are you sure you want to permanently delete the department{" "}
                <strong className="dept-name-highlight-delete-dept">
                  {department?.departmentName}
                </strong>
                ?
              </p>

              {/* -------- Department Information Box -------- */}
              {/* Shows department details for verification */}
              <div className="dept-info-box-delete-dept">
                <div className="dept-info-item-delete-dept">
                  <span className="dept-info-label-delete-dept">
                    Department Name:
                  </span>
                  <strong className="dept-info-value-delete-dept">
                    {department?.departmentName}
                  </strong>
                </div>
                {department?.description && (
                  <div className="dept-info-item-delete-dept">
                    <span className="dept-info-label-delete-dept">
                      Description:
                    </span>
                    <span className="dept-info-value-delete-dept">
                      {department.description}
                    </span>
                  </div>
                )}
              </div>

              {/* -------- Critical Warning Box -------- */}
              {/* Prominently displays the severity and consequences of this action */}
              <div className="warning-box-delete-dept">
                {/* Warning Header with Icon */}
                <div className="warning-header-delete-dept">
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  <span>Critical Warning</span>
                </div>

                {/* Warning Text - Emphasizes permanence */}
                <p className="warning-text-delete-dept">
                  <strong>
                    This action is PERMANENT and CANNOT be reversed!
                  </strong>
                  <br />
                  Once deleted, this department will:
                </p>

                {/* Warning List - Details all consequences */}
                <ul className="warning-list-delete-dept">
                  <li>Be permanently removed from the system</li>
                  <li>
                    Require all employees in this department to be reassigned
                  </li>
                  <li>Cannot be recovered or restored</li>
                </ul>
              </div>

              {/* -------- Info Alert -------- */}
              {/* Additional reminder to ensure correct action */}
              <div className="info-alert-delete-dept">
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
            <div className="modal-footer-delete-dept">
              {/* Cancel Button - Closes modal without deleting */}
              <button
                type="button"
                className="btn-cancel-delete-dept"
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
                className="btn-submit-delete-dept"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? (
                  // Show loading state with spinner and text
                  <>
                    <span className="spinner-delete-dept"></span>
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

export default DeleteDepartmentModal;
