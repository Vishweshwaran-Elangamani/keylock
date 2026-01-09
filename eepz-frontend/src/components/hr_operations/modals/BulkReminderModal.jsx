import "../../../styles/hr_operations/employee/BulkReminderModal.css";
const BulkReminderModal = ({
  show,
  onHide,
  selectedEmployees,
  sendingBulkReminder,
  onSendBulkReminders,
}) => {
  if (!show) return null;
  return (
    <>
      <div className="brm-backdrop" onClick={onHide} />
      <div className="brm-modal-container">
        <div className="brm-modal-dialog">
          {/* HEADER */}
          <div className="brm-modal-header">
            <div className="brm-header-title">
              <i className="bi bi-send-fill"></i>
              Send Bulk Reminders
            </div>
            <button
              type="button"
              onClick={onHide}
              disabled={sendingBulkReminder}
              aria-label="Close"
              className="brm-close-button"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          {/* BODY */}
          <div className="brm-modal-body">
            {/* Main Message */}
            <p className="brm-main-message">
              You are about to send career goals reminders to{" "}
              <span className="brm-employee-count">
                {selectedEmployees.length}
              </span>{" "}
              selected employee(s).
            </p>
            {/* Info Message */}
            <p className="brm-info-message">
              Each employee will receive an email reminder to set their career
              goals.
            </p>
            {/* Warning */}
            <div className="brm-warning-box">
              <p className="brm-warning-text">
                <i className="bi bi-exclamation-triangle-fill brm-warning-icon"></i>
                <span>This action cannot be undone.</span>
              </p>
            </div>
          </div>
          {/* FOOTER */}
          <div className="brm-modal-footer">
            <button
              type="button"
              onClick={onHide}
              disabled={sendingBulkReminder}
              className="brm-btn-cancel"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSendBulkReminders}
              disabled={sendingBulkReminder}
              className="brm-btn-send"
            >
              {sendingBulkReminder ? (
                <>
                  <span className="brm-spinner" />
                  Sending...
                </>
              ) : (
                <>
                  <i className="bi bi-send-fill"></i>
                  Send to {selectedEmployees.length} Employee(s)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
export default BulkReminderModal;
