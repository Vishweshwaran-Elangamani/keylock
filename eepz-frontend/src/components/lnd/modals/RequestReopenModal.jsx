import { useState } from "react";
import { toast } from "sonner";
import { lndService } from "../../../services/lnd/lndService";
import styles from "../../../styles/lnd/components/RequestReopenModal.module.css";

const RequestReopenModal = ({ assignment, onClose, onSuccess }) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestReopen = async () => {
    try {
      setLoading(true);
      const response = await lndService.requestReopenAssignment({
        AssignmentId: assignment.assignmentId,
        Reason: reason,
      });

      if (response.data.success) {
        toast.success("Reopen request submitted successfully!");
        onSuccess();
        onClose(); 
      } else {
        toast.error("Failed to submit reopen request.");
      }
    } catch (error) {
      toast.error("Something went wrong while requesting reopen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h3 className={styles.modalTitle}>Request Reopen for Assignment: {assignment.skillName}</h3>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Provide the reason for reopening..."
          className={styles.reasonInput}
        />
        <div className={styles.modalActions}>
          <button onClick={onClose} className={styles.cancelButton}>
            Cancel
          </button>
          <button
            onClick={handleRequestReopen}
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestReopenModal;
