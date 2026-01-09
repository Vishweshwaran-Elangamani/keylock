import React from "react";
import "../../../styles/hr_operations/hr/DeleteConfirmationModal.css";
const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Deletion",
  message = "Are you sure you want to delete this period allocation?",
  itemName = "",
  isDeleting = false,
}) => {
  if (!isOpen) return null;
  const handleConfirm = () => {
    onConfirm();
  };
  const handleCancel = () => {
    if (!isDeleting) {
      onClose();
    }
  };
  return (
    <>
      {/* Custom Backdrop with Blur Effect */}
      <div className="dcm-backdrop" onClick={handleCancel} />
      {/* Modal Container (Compact) */}
      <div className="dcm-modal-container">
        {/* Modal Header */}
        <div className="dcm-modal-header">
          <div className="dcm-header-title">
            <i className="bi bi-exclamation-triangle"></i>
            {title}
          </div>
          <button
            onClick={handleCancel}
            disabled={isDeleting}
            className="dcm-close-button"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        {/* Modal Body */}
        <div className="dcm-modal-body">
          <p className="dcm-message">{message}</p>
          {itemName && (
            <div className="dcm-item-box">
              <strong className="dcm-item-name">{itemName}</strong>
            </div>
          )}
          {/* Warning Box */}
          <div className="dcm-warning-box">
            <div className="dcm-warning-header">
              <i className="bi bi-exclamation-triangle-fill dcm-warning-icon"></i>
              <strong>Warning</strong>
            </div>
            <p className="dcm-warning-text">This action cannot be undone.</p>
          </div>
        </div>
        {/* Modal Footer */}
        <div className="dcm-modal-footer">
          {/* Cancel Button */}
          <button
            type="button"
            onClick={handleCancel}
            disabled={isDeleting}
            className="dcm-btn-cancel"
          >
            Cancel
          </button>
          {/* Delete Button */}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="dcm-btn-delete"
          >
            {isDeleting ? (
              <>
                <span className="dcm-spinner" />
                Deleting...
              </>
            ) : (
              <>
                <i className="bi bi-trash"></i>
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};
export default DeleteConfirmationModal;
