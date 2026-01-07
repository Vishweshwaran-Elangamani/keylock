import React from "react";
import { AlertCircle, Trash2 } from "lucide-react";
import "../../../styles/projectmanagement/modals/DeleteConfirmationModal.css";

const DeleteConfirmationModal = ({
  show,
  onClose,
  onConfirm,
  project,
  isDeleting,
}) => {
  if (!show) return null;

  return (
    <div className="delete-modal-overlay" onClick={onClose}>
      <div
        className="delete-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="delete-modal-content">
          <div className="delete-modal-header">
            <div className="delete-modal-title">
              <AlertCircle size={24} className="delete-icon-danger" />
              <h5>Confirm Delete</h5>
            </div>
            <button
              type="button"
              className="delete-modal-close"
              onClick={onClose}
              disabled={isDeleting}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="delete-modal-body">
            <p className="delete-modal-question">
              Are you sure you want to delete this project?
            </p>

            {project && (
              <div className="delete-project-info">
                <AlertCircle size={18} className="delete-warning-icon" />
                <div className="delete-project-details">
                  <strong className="delete-project-name">
                    {project.projectName}
                  </strong>
                  <small className="delete-project-meta">
                    {project.businessUnit} • {project.department}
                  </small>
                </div>
              </div>
            )}

            <p className="delete-modal-warning">
              <strong>This action cannot be undone.</strong> All associated data
              will be permanently deleted.
            </p>
          </div>

          <div className="delete-modal-footer">
            <button
              type="button"
              className="delete-btn-cancel"
              onClick={onClose}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="delete-btn-confirm"
              onClick={onConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <span className="delete-spinner" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={18} />
                  Delete Project
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
