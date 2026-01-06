import React from "react";
import "../../../../styles/performancemanagement/components/DeleteConfirmModal.css";


const DeleteConfirmModal = ({ show, onClose, onConfirm, message }) => {
  if (!show) return null;


  return (
    <div className="delete-confirm-overlay" onClick={onClose}>
      <div className="delete-confirm-modal" onClick={e => e.stopPropagation()}>
        <div className="delete-confirm-header">
          Confirm Delete
        </div>
        <div className="delete-confirm-body">
          <p className="delete-confirm-prompt">{message || "Are you sure you want to delete?"}</p>
        </div>
        <div className="delete-confirm-footer">
          <button
            className="delete-confirm-btn-cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="delete-confirm-btn-confirm"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};


export default DeleteConfirmModal;
