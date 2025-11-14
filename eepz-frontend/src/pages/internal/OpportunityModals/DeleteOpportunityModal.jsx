import { useState } from "react";
import internalOpportunityService from "../../../services/internal/internalOpportunityService";
import {toast} from "sonner";
import "../../../styles/internal/OpportunityModal.css";

const DeleteOpportunityModal = ({
  show,
  onHide,
  onOpportunityDeleted,
  opportunity,
}) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);

      const response = await internalOpportunityService.deleteOpportunity(
        opportunity.opportunityId
      );

      if (response.success) {
        toast.success("Opportunity deleted successfully!");
        onOpportunityDeleted();
        onHide();
      } else {
        toast.error(response.message || "Failed to delete opportunity");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to delete opportunity");
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <>
      <div className="modal-backdrop-custom"></div>
      <div className="modal-wrapper-custom">
        <div className="modal-dialog-custom modal-dialog-small">
          <div className="modal-content-custom">
            <div className="modal-header-custom">
              <h5 className="modal-title-custom">
                <i className="bi bi-exclamation-triangle-fill text-danger"></i>
                Delete Opportunity
              </h5>
              <button
                type="button"
                className="modal-close-btn"
                onClick={onHide}
                disabled={loading}
                aria-label="Close"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="modal-body-custom">
              <div className="delete-confirmation">
                <p className="delete-message">
                  Are you sure you want to delete the opportunity{" "}
                  <strong>{opportunity.opportunityName}</strong>?
                </p>
                <p className="delete-warning">
                  <i className="bi bi-exclamation-circle"></i>
                  This action cannot be undone. All related nominations will also be
                  affected.
                </p>
              </div>
            </div>

            <div className="modal-footer-custom">
              <button
                type="button"
                className="btn-cancel"
                onClick={onHide}
                disabled={loading}
              >
                <i className="bi bi-x-circle"></i>
                Cancel
              </button>
              <button
                type="button"
                className="btn-delete"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-custom"></span>
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
        </div>
      </div>
    </>
  );
};

export default DeleteOpportunityModal;
