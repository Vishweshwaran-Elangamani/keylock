import { useState, useEffect } from "react";
import { X, AlertCircle, Calendar, FileText, Clock } from "lucide-react";
import { lndService } from "../../../services/lnd/lndService";
import { toast } from "sonner";
import styles from "../../../styles/lnd/components/ReopenApprovalModal.module.css";

const ReopenApprovalModal = ({ approval, onClose, onSuccess }) => {
  const [isApproved, setIsApproved] = useState(true);
  const [managerNotes, setManagerNotes] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requestDetails, setRequestDetails] = useState(null);

  useEffect(() => {
    try {
      if (approval.notes) {
        const details = JSON.parse(approval.notes);
        setRequestDetails(details);
      }
    } catch (err) {
      console.error("Failed to parse approval notes:", err);
    }
  }, [approval]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isApproved && !newDeadline) {
      setError("New deadline is required when approving the request");
      return;
    }

    if (!managerNotes.trim()) {
      setError("Please provide notes for your decision");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await lndService.processReopenRequest({
        approvalId: approval.approvalId,
        isApproved: isApproved,
        managerNotes: managerNotes.trim(),
        newDeadline: isApproved ? new Date(newDeadline).toISOString() : null,
      });

      if (response.data.success) {
        toast.success(
          isApproved
            ? "Reopen request approved successfully!"
            : "Reopen request rejected"
        );
        onSuccess();
      } else {
        setError(response.data.message || "Failed to process request");
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        "Failed to process reopen request. Please try again.";
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

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  const calculateDaysOverdue = () => {
    if (!requestDetails?.OriginalDeadline) return 0;
    const today = new Date();
    const deadline = new Date(requestDetails.OriginalDeadline);
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
            <h2 className={styles.modalTitle}>
              Review Assignment Reopen Request
            </h2>
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
          {/* Request Information */}
          <div className={styles.infoSection}>
            <h3 className={styles.sectionTitle}>Request Information</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Employee:</span>
                <span className={styles.infoValue}>
                  {approval.requesterName}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Skill:</span>
                <span className={styles.infoValue}>
                  {approval.skillName || "N/A"}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Original Deadline:</span>
                <span className={styles.infoValue}>
                  {formatDate(requestDetails?.OriginalDeadline)}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Days Overdue:</span>
                <span className={styles.infoDaysOverdue}>
                  {calculateDaysOverdue()} days
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Requested On:</span>
                <span className={styles.infoValue}>
                  {formatDate(approval.requestedOn)}
                </span>
              </div>
            </div>
          </div>

          {/* Employee's Reason */}
          <div className={styles.reasonSection}>
            <h3 className={styles.sectionTitle}>Employee's Reason</h3>
            <div className={styles.reasonBox}>
              <p className={styles.reasonText}>
                {requestDetails?.RequestNotes || "No reason provided"}
              </p>
            </div>
          </div>

          {/* Decision Form */}
          <form onSubmit={handleSubmit}>
            {/* Decision Toggle */}
            <div className={styles.decisionToggle}>
              <button
                type="button"
                onClick={() => {
                  setIsApproved(true);
                  setError("");
                }}
                className={`${styles.toggleButton} ${
                  isApproved ? styles.toggleButtonApprove : ""
                }`}
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsApproved(false);
                  setNewDeadline("");
                  setError("");
                }}
                className={`${styles.toggleButton} ${
                  !isApproved ? styles.toggleButtonReject : ""
                }`}
              >
                Reject
              </button>
            </div>

            {/* New Deadline (only if approving) */}
            {isApproved && (
              <div className={styles.formGroup}>
                <label htmlFor="newDeadline" className={styles.formLabel}>
                  <Calendar size={16} />
                  New Deadline <span className={styles.required}>*</span>
                </label>
                <input
                  type="date"
                  id="newDeadline"
                  className={styles.dateInput}
                  value={newDeadline}
                  onChange={(e) => {
                    setNewDeadline(e.target.value);
                    setError("");
                  }}
                  min={getTomorrowDate()}
                  disabled={loading}
                />
                <div className={styles.helpText}>
                  Set a realistic deadline for assignment completion
                </div>
              </div>
            )}

            {/* Manager Notes */}
            <div className={styles.formGroup}>
              <label htmlFor="managerNotes" className={styles.formLabel}>
                Your Notes <span className={styles.required}>*</span>
              </label>
              <textarea
                id="managerNotes"
                className={styles.textarea}
                rows={4}
                value={managerNotes}
                onChange={(e) => {
                  setManagerNotes(e.target.value);
                  setError("");
                }}
                placeholder={
                  isApproved
                    ? "Provide feedback and expectations for the employee..."
                    : "Explain why you are rejecting this request..."
                }
                disabled={loading}
                maxLength={500}
              />
              <div className={styles.charCount}>
                {managerNotes.length}/500 characters
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
                className={
                  isApproved ? styles.approveButton : styles.rejectButton
                }
                disabled={loading || !managerNotes.trim()}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    ></span>
                    Processing...
                  </>
                ) : isApproved ? (
                  <>Approve & Set Deadline</>
                ) : (
                  <>Reject Request</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReopenApprovalModal;
