import { useState } from "react";
import userService from "../../../../services/auth/userService";
import { toast } from "sonner";
import "../../../../styles/auth/user/DeactivateUserModal.css";
const DeactivateUserModal = ({ show, onHide, onUserDeactivated, user }) => {
  const [loading, setLoading] = useState(false);
  const handleDeactivate = async () => {
    try {
      setLoading(true);
      const response = await userService.deactivateUser(user.userId);
      if (response.success) {
        toast.success("User deactivated permanently!");
        onUserDeactivated();
        setTimeout(() => {
          onHide();
        }, 500);
      } else {
        toast.error(response.message || "Failed to deactivate user");
      }
    } catch (error) {
      toast.error(error.message || "Failed to deactivate user");
    } finally {
      setLoading(false);
    }
  };
  if (!show) return null;
  return (
    <>
      <div className="dum-backdrop" onClick={onHide} />
      <div className="dum-modal-container">
        <div className="dum-modal-dialog">
          <div className="dum-modal-header">
            <div className="dum-header-title">
              <i className="bi bi-x-circle-fill"></i>
              Deactivate User Permanently
            </div>
            <button
              type="button"
              onClick={onHide}
              disabled={loading}
              aria-label="Close"
              className="dum-close-button"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          <div className="dum-modal-body">
            <p className="dum-confirm-text">
              Are you sure you want to permanently deactivate{" "}
              <strong className="dum-user-name">
                {user?.firstName} {user?.lastName}
              </strong>
              ?
            </p>
            <div className="dum-warning-box">
              <div className="dum-warning-header">
                <i className="bi bi-exclamation-triangle-fill dum-warning-icon"></i>
                <span>Critical Warning</span>
              </div>
              <p className="dum-warning-text">
                <strong>
                  This action is PERMANENT and CANNOT be reversed!
                </strong>
                <br />
              </p>
              <ul className="dum-warning-list">
                <strong>Once deactivated, this user will:</strong>
                <li>Lose all access to the system immediately</li>
                <li>Be unable to log in</li>
                <li>Not be able to be reactivated</li>
              </ul>
            </div>
            <div className="dum-info-alert">
              <i className="bi bi-info-circle"></i>
              <small>
                <strong>Note:</strong> Please ensure this is the correct action
                before proceeding.
              </small>
            </div>
          </div>
          <div className="dum-modal-footer">
            <button
              type="button"
              onClick={onHide}
              disabled={loading}
              className="dum-btn-cancel"
            >
              <i className="bi bi-arrow-left"></i> Cancel
            </button>
            <button
              type="button"
              onClick={handleDeactivate}
              disabled={loading}
              className="dum-btn-deactivate"
            >
              {loading ? (
                <>
                  <span className="dum-spinner" />
                  Deactivating...
                </>
              ) : (
                <>
                  <i className="bi bi-x-circle-fill"></i>
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
export default DeactivateUserModal;
