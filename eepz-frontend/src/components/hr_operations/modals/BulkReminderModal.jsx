import { Modal, Button, Spinner } from "react-bootstrap";
import { FaPaperPlane } from "react-icons/fa";
import "../../../styles/hr_operations/hr/careerGoals.css";

const BulkReminderModal = ({
  show,
  onHide,
  selectedEmployees,
  sendingBulkReminder,
  onSendBulkReminders,
}) => {
  return (
    <Modal show={show} onHide={onHide} centered className="cg-reminder-modal">
      <Modal.Header closeButton className="cg-reminder-modal-header">
        <Modal.Title>Send Bulk Reminders</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          You are about to send career goals reminders to{" "}
          <strong>{selectedEmployees.length}</strong> selected employee(s).
        </p>
        <p>
          Each employee will receive an email reminder to set their career
          goals.
        </p>
        <p className="text-muted">
          <small>This action cannot be undone.</small>
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={onHide}
          disabled={sendingBulkReminder}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={onSendBulkReminders}
          disabled={sendingBulkReminder}
        >
          {sendingBulkReminder ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Sending...
            </>
          ) : (
            <>
              <FaPaperPlane className="me-2" />
              Send to {selectedEmployees.length} Employee(s)
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default BulkReminderModal;
