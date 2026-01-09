import { useState } from "react";
import { CloseButton } from "react-bootstrap";
import internalOpportunityService from "../../../services/internal/internalOpportunityService";
import { toast } from "sonner";
import "../../../styles/internal/DeleteOpportunityModal.css";
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
      <div className="dom-backdrop" onClick={onHide} />
      <div className="dom-modal-wrapper">
        <div className="dom-modal-dialog">
          {/* Modal Header */}
          <div className="dom-modal-header">
            <div className="dom-header-title">
              <i className="bi bi-exclamation-triangle-fill dom-warning-icon"></i>
              Delete Opportunity
            </div>
            <CloseButton
              onClick={onHide}
              disabled={loading}
              variant="white"
              className="dom-close-button"
            />
          </div>
          {/* Modal Body */}
          <div className="dom-modal-body">
            <div>
              <p className="dom-confirmation-text">
                Are you sure you want to delete the opportunity{" "}
                <strong className="dom-opportunity-name">
                  {opportunity.opportunityName}
                </strong>
                ?
              </p>
              {/* Warning Box */}
              <div className="dom-warning-box">
                <i className="bi bi-exclamation-circle dom-warning-box-icon"></i>
                <span>
                  This action cannot be undone. All related nominations will
                  also be affected.
                </span>
              </div>
            </div>
          </div>
          {/* Modal Footer */}
          <div className="dom-modal-footer">
            <button
              type="button"
              onClick={onHide}
              disabled={loading}
              className="dom-btn-cancel"
            >
              <i className="bi bi-x-circle"></i>
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="dom-btn-delete"
            >
              {loading ? (
                <>
                  <span className="dom-spinner" />
                  <span>Deleting...</span>
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
    </>
  );
};
export default DeleteOpportunityModal;
