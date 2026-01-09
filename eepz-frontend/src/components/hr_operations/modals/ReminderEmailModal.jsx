import React from "react";
import "../../../styles/hr_operations/hr/ReminderEmailModal.css";
const ReminderEmailModal = ({
  show,
  onHide,
  reminderTargetUser,
  reminderResult,
  sendingReminder,
  onSendReminder,
}) => {
  if (!show) return null;
  return (
    <>
      <div className="rem-backdrop" onClick={onHide} />
      <div className="rem-modal-container">
        <div className="rem-modal-dialog">
          {/* HEADER */}
          <div className="rem-modal-header">
            <div className="rem-header-title">
              <i className="bi bi-envelope-fill"></i>
              Send Career Goals Reminder
            </div>
            <button
              type="button"
              onClick={onHide}
              disabled={sendingReminder}
              aria-label="Close"
              className="rem-close-button"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          {/* BODY */}
          <div className="rem-modal-body">
            <p className="rem-label">Send goal-setting reminder to:</p>
            <div className="rem-email-box">
              {reminderTargetUser?.email ?? reminderTargetUser?.Email}
            </div>
            {/* Reminder Result */}
            {reminderResult && (
              <div
                className={`rem-result-message ${
                  reminderResult.successful > 0 ? "success" : "error"
                }`}
              >
                {reminderResult.successful > 0 ? (
                  <>
                    <i className="bi bi-check-circle-fill rem-result-icon"></i>
                    <span>Reminder sent successfully!</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-x-circle-fill rem-result-icon"></i>
                    <span>Failed to send reminder</span>
                  </>
                )}
              </div>
            )}
          </div>
          {/* FOOTER */}
          <div className="rem-modal-footer">
            <button
              type="button"
              onClick={onHide}
              disabled={sendingReminder}
              className="rem-btn-close"
            >
              Close
            </button>
            <button
              type="button"
              onClick={onSendReminder}
              disabled={sendingReminder}
              className="rem-btn-send"
            >
              {sendingReminder ? (
                <>
                  <span className="rem-spinner" />
                  Sending...
                </>
              ) : (
                <>
                  <i className="bi bi-send"></i> Send Reminder
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
export default ReminderEmailModal;
