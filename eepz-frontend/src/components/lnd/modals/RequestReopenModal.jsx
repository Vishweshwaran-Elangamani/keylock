import { useState } from "react";
import { X, AlertCircle, FileText } from "lucide-react";
import { lndService } from "../../../services/lnd/lndService";
import { toast } from "sonner";
import styles from "../../../styles/lnd/components/RequestReopenModal.module.css";

const RequestReopenModal = ({ assignment, onClose, onSuccess }) => {
  const [requestNotes, setRequestNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!requestNotes.trim()) {
      setError("Please provide a reason for reopening this assignment");
      return;
    }

    if (requestNotes.trim().length < 10) {
      setError("Reason must be at least 10 characters");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await lndService.requestAssignmentReopen({
        assignmentId: assignment.assignmentId,
        requestNotes: requestNotes.trim(),
      });

      if (response.data.success) {
        toast.success("Reopen request submitted successfully!");
        onSuccess();
      } else {
        setError(response.data.message || "Failed to submit request");
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        "Failed to submit reopen request. Please try again.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const calculateDaysOverdue = () => {
    if (!assignment.deadline) return 0;
    const today = new Date();
    const deadline = new Date(assignment.deadline);
    const diffTime = today - deadline;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <FileText className={styles.modalIcon} size={24} />
            <h2 className={styles.modalTitle}>Request Assignment Reopen</h2>
          </div>
          <button
            onClick={onClose}
            className={styles.closeButton}
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {/* Assignment Info */}
          <div className={styles.assignmentInfo}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Skill:</span>
              <span className={styles.infoValue}>{assignment.skillName}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>SME:</span>
              <span className={styles.infoValue}>{assignment.smeName}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Original Deadline:</span>
              <span className={styles.infoValue}>
                {formatDate(assignment.deadline)}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Days Overdue:</span>
              <span className={styles.infoDaysOverdue}>
                {calculateDaysOverdue()} days
              </span>
            </div>
          </div>

          {/* Warning Box */}
          <div className={styles.warningBox}>
            <AlertCircle size={18} className={styles.warningIcon} />
            <p className={styles.warningText}>
              Your manager will review your request and may approve or reject it.
              Please provide a detailed explanation.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="requestNotes" className={styles.formLabel}>
                Reason for Reopening <span className={styles.required}>*</span>
              </label>
              <textarea
                id="requestNotes"
                className={styles.textarea}
                rows={5}
                value={requestNotes}
                onChange={(e) => {
                  setRequestNotes(e.target.value);
                  setError("");
                }}
                placeholder="Explain why you need additional time to complete this assignment..."
                disabled={loading}
                maxLength={500}
              />
              <div className={styles.charCount}>
                {requestNotes.length}/500 characters
              </div>
            </div>

            {error && (
              <div className={styles.errorBox}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Footer */}
            <div className={styles.modalFooter}>
              <button
                type="button"
                onClick={onClose}
                className={styles.cancelButton}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading || !requestNotes.trim()}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    ></span>
                    Submitting...
                  </>
                ) : (
                  <>Submit Request</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RequestReopenModal;
