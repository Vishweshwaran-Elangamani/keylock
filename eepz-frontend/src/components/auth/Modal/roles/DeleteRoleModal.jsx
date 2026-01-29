import { useState } from "react";
import { toast } from "sonner";
import "../../../../styles/auth/roles/DeleteRoleModal.css";
const DeleteRoleModal = ({ show, role, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    try {
      setLoading(true);
      toast.loading("Deleting role...");
      await onConfirm();
    } catch (error) {
      console.error("Error deleting role:", error);
      toast.dismiss();
      toast.error(error.message || "Failed to delete role");
    } finally {
      setLoading(false);
    }
  };
  if (!show) return null;
  return (
    <>
      <div className="drm-backdrop" onClick={onClose} />
      <div className="drm-modal-container">
        <div className="drm-modal-dialog">
          <div className="drm-modal-header">
            <div className="drm-header-title">
              <i className="bi bi-trash-fill"></i>
              Delete Role Permanently
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              aria-label="Close"
              className="drm-close-button"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          <div className="drm-modal-body">
            <p className="drm-confirm-text">
              Are you sure you want to permanently delete the role{" "}
              <strong className="drm-role-name">{role?.roleName}</strong>?
            </p>
            <div className="drm-warning-box">
              <div className="drm-warning-title">
                <i className="bi bi-exclamation-triangle-fill"></i>
                <span>Critical Warning</span>
              </div>
              <p className="drm-warning-text">
                This action is{" "}
                <span className="drm-warning-emphasis">PERMANENT</span> and{" "}
                <span className="drm-warning-emphasis">
                  CANNOT be reversed!
                </span>
              </p>
              <div className="drm-warning-subtitle">
                <strong>Once deleted, this role will:</strong>
              </div>
              <ul className="drm-warning-list">
                <li>Be permanently removed from the system</li>
                <li>Require all users with this role to be reassigned</li>
                <li>Cannot be recovered or restored</li>
              </ul>
            </div>
            <div className="drm-info-alert">
              <i className="bi bi-info-circle"></i>
              <small>
                <strong>Note:</strong> Please ensure this is the correct action
                before proceeding. System roles are protected and cannot be
                deleted.
              </small>
            </div>
          </div>
          <div className="drm-modal-footer">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="drm-btn-cancel"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleDelete}
              className="drm-btn-delete"
            >
              {loading ? (
                <>
                  <span className="drm-spinner" />
                  Deleting...
                </>
              ) : (
                <>
                  <i className="bi bi-trash-fill"></i>
                  Yes, Delete Permanently
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
export default DeleteRoleModal;
