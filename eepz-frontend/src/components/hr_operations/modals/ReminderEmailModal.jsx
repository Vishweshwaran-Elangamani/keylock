import { Modal, Button } from "react-bootstrap";
import "../../../styles/hr_operations/hr/careerGoals.css";

const ReminderEmailModal = ({
  show,
  onHide,
  reminderTargetUser,
  reminderResult,
  sendingReminder,
  onSendReminder,
}) => {
  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      className="cg-reminder-modal"
    >
      <Modal.Header closeButton className="cg-reminder-modal-header">
        <Modal.Title>Send Career Goals Reminder</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          Send goal-setting reminder to: <br />
          <b>{reminderTargetUser?.email ?? reminderTargetUser?.Email}</b>
        </p>
        {reminderResult && (
          <div className="cg-reminder-result">
            {reminderResult.successful > 0 ? (
              <span className="text-success">
                ✓ Reminder sent successfully!
              </span>
            ) : (
              <span className="text-danger">✗ Failed to send reminder</span>
            )}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        <Button
          variant="primary"
          onClick={onSendReminder}
          disabled={sendingReminder}
        >
          {sendingReminder ? "Sending..." : "Send Reminder"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ReminderEmailModal;
