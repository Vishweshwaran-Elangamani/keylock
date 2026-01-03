
import React, { useEffect, useRef } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../../../../styles/performancemanagement/components/DeadlineModal.css";

function DeadlineModal({
  isOpen,
  onClose,
  deadlineInDays,
  onDeadlineChange,
  onConfirm,
  pendingAction,
}) {
  if (!isOpen) return null;

  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      const input = containerRef.current.querySelector("#deadlineInput");
      if (input) input.focus();
    }
  }, []);

  return (
    <>
      
      <div className="deadline-modal dm-overlay" onClick={onClose} />

     
      <div
        className="deadline-modal dm-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="dm-title"
        aria-modal="true"
        ref={containerRef}
      >
       
        <div className="dm-icon-badge" aria-hidden="true">
          <i className="bi bi-calendar-check dm-icon"></i>
        </div>

        
        <h3 id="dm-title" className="dm-title">Set Deadline</h3>

       
        <p className="dm-subtitle">
          How many days should employees have to complete this form?
        </p>

       
        <div className="dm-input-group">
          <label htmlFor="deadlineInput" className="dm-label">
            <i className="bi bi-clock-history dm-label-icon" aria-hidden="true"></i>
            <span>Deadline (in days):</span>
          </label>

          <input
            id="deadlineInput"
            type="number"
            min="1"
            max="365"
            value={deadlineInDays}
            onChange={(e) => onDeadlineChange(parseInt(e.target.value, 10) || 7)}
            className="dm-input"
          />
        </div>

       
        <div className="dm-actions">
          <button
            type="button"
            onClick={onClose}
            className="dm-btn dm-btn-secondary"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="dm-btn dm-btn-primary"
          >
            <i className="bi bi-check-lg" aria-hidden="true"></i>
            {pendingAction === "Send" ? "Share Form" : "Save Draft"}
          </button>
        </div>
      </div>
    </>
  );
}

export default DeadlineModal;

