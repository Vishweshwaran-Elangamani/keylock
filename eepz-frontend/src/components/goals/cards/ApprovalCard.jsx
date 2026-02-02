import { useState } from "react";
import GoalStatusBadge from "../badges/GoalStatusBadge";
import GoalTypeBadge from "../badges/GoalTypeBadge";
import { formatDate, getInitials } from "../../../utils/goals/goalHelpers";
import { APPROVAL_TYPE_LABELS } from "../../../constants/goals/goalConstants";
import goalService from "../../../services/goals/goalService";
import Alert from "../common/Alert";
import styles from "./ApprovalCard.module.css";

const ApprovalCard = ({ approval, onDecide, canDecide = true, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const handleDownload = async (attachmentId, fileName) => {
    try {
      await goalService.downloadAttachment(attachmentId);
    } catch (error) {
      setAlert({ type: "danger", message: "Failed to download attachment" });
    }
  };

  const handleDecide = async (decision) => {
    if (!canDecide) return;

    setLoading(true);
    setAlert(null);

    try {
      await onDecide(approval.approvalId, decision);
      if (onRefresh) onRefresh();
    } catch (error) {
      setAlert({
        type: "danger",
        message: error.response?.data?.message || "Failed to process approval",
      });
    } finally {
      setLoading(false);
    }
  };

  const hasAttachments =
    approval.attachments && approval.attachments.length > 0;

  return (
    <div className={`card mb-3 ${styles.card}`}>
      {/* Alert */}
      {alert && (
        <div style={{ padding: "1rem 1rem 0 1rem" }}>
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        </div>
      )}

      <div className={`card-body ${styles.cardBody}`}>
        {/* Header - Badges */}
        <div className={styles.headerRow}>
          <div className={styles.typeBadges}>
            <GoalTypeBadge type={approval.goalType} size="sm" />
            <span className={`badge bg-info ${styles.approvalTypeBadge}`}>
              {APPROVAL_TYPE_LABELS[approval.approvalType] ||
                approval.approvalType}
            </span>
          </div>

          <GoalStatusBadge status={approval.goalStatus} size="sm" />
        </div>

        {/* Goal Title */}
        <h5 className={styles.goalTitle}>{approval.goalTitle}</h5>

        {/* Requester Info */}
        <div className={styles.requesterInfo}>
          <div className={styles.avatar}>
            {getInitials(approval.requesterName)}
          </div>
          <div>
            <div className={styles.requesterName}>{approval.requesterName}</div>
            <div className={styles.requestedDate}>
              <i className="bi bi-clock me-1"></i>
              Requested {formatDate(approval.requestedOn)}
            </div>
          </div>
        </div>

        {/* Attachments Section */}
        {hasAttachments && (
          <div className={styles.attachmentsSection}>
            <div className={styles.attachmentsHeader}>
              <i className="bi bi-paperclip me-2"></i>
              Attachments ({approval.attachments.length})
            </div>
            <div className={styles.attachmentsList}>
              {approval.attachments.map((attachment) => (
                <button
                  key={attachment.attachmentId}
                  className={`btn btn-sm btn-outline-primary ${styles.attachmentButton}`}
                  onClick={() =>
                    handleDownload(attachment.attachmentId, attachment.fileName)
                  }
                  title={`Download ${attachment.fileName}`}
                >
                  <i className="bi bi-file-earmark-arrow-down"></i>
                  <span className={styles.attachmentName}>
                    {attachment.fileName}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No Attachments Warning (for completion approvals) */}
        {!hasAttachments && approval.approvalType === "completion" && (
          <div
            className={`alert alert-warning mb-3 ${styles.noAttachmentsWarning}`}
          >
            <i className="bi bi-exclamation-triangle me-2"></i>
            No proof attachments submitted
          </div>
        )}

        {/* Action Buttons - Pending State */}
        {canDecide && approval.approvalStatus === "pending" && (
          <div className={styles.actionButtons}>
            <button
              className={`btn btn-success ${styles.approveButton}`}
              onClick={() => handleDecide("approved")}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Processing...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-2"></i>
                  Approve
                </>
              )}
            </button>
            <button
              className={`btn btn-danger ${styles.rejectButton}`}
              onClick={() => handleDecide("rejected")}
              disabled={loading}
            >
              <i className="bi bi-x-circle me-2"></i>
              Reject
            </button>
          </div>
        )}

        {/* Already Decided - Success/Rejected State */}
        {approval.approvalStatus !== "pending" && (
          <div
            className={`alert alert-${
              approval.approvalStatus === "approved" ? "success" : "danger"
            } mb-0 ${styles.decisionAlert}`}
          >
            <div className={styles.decisionAlertContent}>
              <i
                className={`bi bi-${
                  approval.approvalStatus === "approved"
                    ? "check-circle-fill"
                    : "x-circle-fill"
                } me-2 ${styles.decisionAlertIcon}`}
              ></i>
              <div>
                <div className={styles.decisionAlertTitle}>
                  {approval.approvalStatus === "approved"
                    ? "Approved"
                    : "Rejected"}
                </div>
                <div className={styles.decisionAlertDetails}>
                  by {approval.approverName} on{" "}
                  {formatDate(approval.approvedOn)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cannot Decide Warning */}
        {!canDecide && approval.approvalStatus === "pending" && (
          <div className={`alert alert-info mb-0 ${styles.permissionWarning}`}>
            <i className="bi bi-info-circle me-2"></i>
            You don't have permission to decide this approval
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalCard;
