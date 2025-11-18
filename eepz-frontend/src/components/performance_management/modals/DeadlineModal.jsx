import React from "react";
import "bootstrap-icons/font/bootstrap-icons.css";

function DeadlineModal({
  isOpen,
  onClose,
  deadlineInDays,
  onDeadlineChange,
  onConfirm,
  pendingAction,
}) {
  if (!isOpen) return null;

  return (
    <div className="hrformlist-modal-overlay" onClick={onClose}>
      <div
        className="hrformlist-deadline-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <i
          className="bi bi-calendar-check"
          style={{
            fontSize: "56px",
            color: "#27235C",
            marginBottom: "20px",
          }}
        ></i>
        <h3>Set Deadline</h3>
        <p>How many days should employees have to complete this form?</p>
        <div className="hrformlist-input-group">
          <label htmlFor="deadlineInput">
            <i className="bi bi-clock-history"></i> Deadline (in days):
          </label>
          <input
            id="deadlineInput"
            type="number"
            min="1"
            max="365"
            value={deadlineInDays}
            onChange={(e) => onDeadlineChange(parseInt(e.target.value) || 7)}
          />
        </div>
        <div className="hrformlist-modal-buttons">
          <button className="hrformlist-btn-cancel-modal" onClick={onClose}>
            <i className="bi bi-x-lg"></i> Cancel
          </button>
          <button className="hrformlist-btn-confirm-modal" onClick={onConfirm}>
            <i className="bi bi-check-lg"></i>{" "}
            {pendingAction === "Send" ? "Share Form" : "Save Draft"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeadlineModal;
