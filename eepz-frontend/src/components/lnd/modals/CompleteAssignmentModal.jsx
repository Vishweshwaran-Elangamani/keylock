import { X, CheckCircle } from "lucide-react";
import { lndService } from "../../../services/lnd/lndService";
import { RATING } from "../../../constants/lnd/lndConstants";
import { toast } from "sonner";
import { useState } from "react";
import styles from "../../../styles/lnd/components/CompleteAssignmentModal.module.css";
import { LND_TOASTS } from "../../../constants/lnd/lndToasts";

const CompleteAssignmentModal = ({ assignment, onClose, onSuccess }) => {
  const [rating, setRating] = useState(5);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!notes.trim()) {
      toast.error(LND_TOASTS.PROVIDE_NOTES_MESSAGE);
      return;
    }
    try {
      setLoading(true);
      const data = {
        assignmentId: assignment.assignmentId,
        newRating: rating,
        notes: notes,
      };
      const response = await lndService.completeAssignment(data);
      if (response.data.success) {
        onSuccess();
      } else {
        toast.error(response.data.message || LND_TOASTS.FAILED_TO_COMPLETE);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || LND_TOASTS.FAILED_TO_COMPLETE
      );
    } finally {
      setLoading(false);
    }
  };

  const getRatingLabel = (rating) => {
    if (rating < RATING.MIN_REQUEST_SME) return "Needs Improvement";
    if (rating < RATING.MIN_SME) return "Competent";
    return "Expert (SME Eligible)";
  };

  const getRatingColor = (rating) => {
    if (rating < RATING.MIN_REQUEST_SME) return "#dc3545";
    if (rating < RATING.MIN_SME) return "#0d6efd";
    return "#198754";
  };

  const ratingColorClass =
    rating < RATING.MIN_REQUEST_SME
      ? styles.ratingBtnLow
      : rating < RATING.MIN_SME
      ? styles.ratingBtnMedium
      : styles.ratingBtnHigh;

  return (
    <>
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={onClose}>
        {/* Modal */}
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className={styles.header}>
            <h5 className={styles.headerTitle}>Complete Assignment</h5>
            <button
              type="button"
              className={`btn-close-white ${styles.btnClose}`}
              onClick={onClose}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "red";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "white";
              }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* Body - Scrollable Container */}
          <div className={styles.body}>
            {/* Assignment Info */}
            <div className={styles.assignmentInfo}>
              <p className={styles.infoLabel}>Employee</p>
              <p className={styles.infoValue}>{assignment.menteeName}</p>
              <p className={styles.infoLabel}>Skill</p>
              <p className={styles.infoValue}>{assignment.skillName}</p>
              <p className={styles.infoLabel}>SME</p>
              <p className={styles.infoValueSmall}>{assignment.smeName}</p>
            </div>

            {/* Info Alert */}
            <div className={styles.alert}>
              <CheckCircle
                size={20}
                color="#198754"
                className={styles.alertIcon}
              />
              <div>
                <p className={styles.alertTitle}>SME Acknowledged</p>
                <p className={styles.alertText}>
                  The SME has reviewed and acknowledged the completion. Set the
                  new skill rating and complete the assignment.
                </p>
              </div>
            </div>

            {/* SME's Completion Notes */}
            {assignment.completionNotes && (
              <div className={styles.smeNotesContainer}>
                <label className={styles.smeNotesLabel}>SME's Notes</label>
                <div className={styles.smeNotesContent}>
                  {assignment.completionNotes}
                </div>
              </div>
            )}

            {/* New Rating Buttons */}
            <div>
              <label className={styles.ratingLabel}>
                New Skill Rating
                <span className={styles.required}>*</span>:{" "}
                <span
                  className={styles.ratingCurrent}
                  style={{ color: getRatingColor(rating) }}
                >
                  {rating}/10
                </span>
              </label>
              <div className={styles.ratingButtons}>
                {[...Array(10)].map((_, index) => {
                  const value = index + 1;
                  return (
                    <button
                      type="button"
                      key={value}
                      onClick={() => setRating(value)}
                      className={`${styles.ratingBtn} ${
                        rating === value ? ratingColorClass : ""
                      }`}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
              <div
                className={styles.ratingLabelText}
                style={{ color: getRatingColor(rating) }}
              >
                {getRatingLabel(rating)}
              </div>
            </div>

            {/* Manager's Completion Notes */}
            <div>
              <label className={styles.notesLabel}>
                Your Notes<span className={styles.required}>*</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add your feedback and comments on the employee's progress..."
                rows={4}
                required
                className={styles.notesTextarea}
              />
            </div>
          </div>

          {/* Footer */}
          <form onSubmit={handleSubmit}>
            <div className={styles.footer}>
              <button
                type="button"
                className={`btn btn-secondary ${styles.btnCancel}`}
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`${styles.btnSubmit} ${
                  notes.trim() && !loading ? styles.btnSubmitEnabled : ""
                }`}
                disabled={!notes.trim() || loading}
              >
                {loading ? (
                  <>
                    <span
                      className={`spinner-border spinner-border-sm ${styles.loadingSpinner}`}
                      role="status"
                    />
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Complete Assignment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CompleteAssignmentModal;
