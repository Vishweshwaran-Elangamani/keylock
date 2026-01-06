import React from "react";
import "../../../../styles/performancemanagement/components/ActionModal.module.css";

const ActionModal = ({
  show,
  onClose,
  actionType,
  actionRemarks,
  setActionRemarks,
  onSubmit,
  THEME,
}) => {
  if (!show) return null;

  return (
    <>
    
      <div className="action-modal-backdrop" onClick={onClose}></div>

      
      <div className="action-modal-wrapper">
        <div
          className="action-modal-container"
          style={{ background: THEME.card }}
        >
          
          <div
            className="action-modal-header"
            style={{ background: THEME.primary }}
          >
            <h6 className="action-modal-title">
              {actionType === "approve" ? "Approval Remarks" : "Rejection Reason"}
            </h6>
            <button
              onClick={onClose}
              className="action-modal-close-btn"
              aria-label="Close"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* Body */}
          <div
            className="action-modal-body"
            style={{ background: THEME.card }}
          >
            <label
              className="action-modal-label"
              style={{ color: THEME.textLight }}
            >
              {actionType === "approve"
                ? "Enter your approval justification"
                : "Enter your rejection reason"}
            </label>
            <textarea
              className="form-control action-modal-textarea"
              rows={4}
              value={actionRemarks}
              onChange={(e) => setActionRemarks(e.target.value)}
              placeholder={
                actionType === "approve"
                  ? "Why are you approving this nomination?"
                  : "Why are you rejecting this nomination?"
              }
              style={{ borderColor: THEME.border }}
            />
          </div>

          {/* Footer */}
          <div
            className="action-modal-footer"
            style={{
              background: THEME.background,
              borderTopColor: THEME.border,
            }}
          >
            <div className="action-modal-footer-buttons">
              <button
                className="btn action-modal-btn-cancel"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className={`btn action-modal-btn-submit ${
                  actionType === "approve"
                    ? "action-modal-btn-approve"
                    : "action-modal-btn-reject"
                }`}
                onClick={onSubmit}
              >
                {actionType === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ActionModal;
