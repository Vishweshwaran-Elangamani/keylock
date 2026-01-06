import React from "react";
import "../../../../styles/performancemanagement/components/StatusConfirmModal.css";


const StatusConfirmModal = ({
  show, onClose, onConfirm, actionType, rewardName
}) => {
  if (!show) return null;
  const isActivating = actionType === "activate";


  return (
    <div className="status-confirm-overlay" onClick={onClose}>
      <div className="status-confirm-modal" onClick={e => e.stopPropagation()}>
        <div className="status-confirm-header">
          {isActivating ? "Activate" : "Deactivate"} Recognition
        </div>
        <div className="status-confirm-body">
          <p className="status-confirm-prompt">
            Are you sure you want to {actionType}{" "}
            <strong className="status-confirm-highlight">{rewardName}</strong>?
          </p>
        </div>
        <div className="status-confirm-footer">
          <button
            className="status-confirm-btn-cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="status-confirm-btn-confirm"
            onClick={onConfirm}
          >
            {isActivating ? "Activate" : "Deactivate"}
          </button>
        </div>
      </div>
    </div>
  );
};


export default StatusConfirmModal;
