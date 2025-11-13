import { useState } from "react";
import GoalStatusBadge from "../badges/GoalStatusBadge";
import GoalTypeBadge from "../badges/GoalTypeBadge";
import { formatDate, getInitials } from "../../../utils/goals/goalHelpers";
import { APPROVAL_TYPE_LABELS } from "../../../constants/goals/goalConstants";
import goalService from "../../../services/goals/goalService";
import Alert from "../common/Alert";

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
    <div
      className="card mb-3"
      style={{
        border: "1px solid #dee2e6",
        borderRadius: "0.5rem",
        overflow: "hidden",
      }}
    >
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

      <div className="card-body" style={{ padding: "1.25rem" }}>
        {/* Header - Badges */}
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className="d-flex gap-2 flex-wrap">
            <GoalTypeBadge type={approval.goalType} size="sm" />
            <span
              className="badge bg-info"
              style={{ fontSize: "0.75rem", fontWeight: 600 }}
            >
              {APPROVAL_TYPE_LABELS[approval.approvalType] ||
                approval.approvalType}
            </span>
          </div>

          <GoalStatusBadge status={approval.goalStatus} size="sm" />
        </div>

        {/* Goal Title */}
        <h5
          className="mb-3"
          style={{ fontWeight: 600, color: "#212529", lineHeight: 1.3 }}
        >
          {approval.goalTitle}
        </h5>

        {/* Requester Info */}
        <div
          className="d-flex align-items-center gap-3 mb-3 p-2"
          style={{
            backgroundColor: "#f8f9fa",
            borderRadius: "0.375rem",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #AC5098 0%, #97247E 100%)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
              fontSize: "1rem",
              flexShrink: 0,
            }}
          >
            {getInitials(approval.requesterName)}
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{ fontWeight: 600, color: "#212529", fontSize: "0.95rem" }}
            >
              {approval.requesterName}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#6c757d" }}>
              <i className="bi bi-clock me-1"></i>
              Requested {formatDate(approval.requestedOn)}
            </div>
          </div>
        </div>

        {/* Attachments Section */}
        {hasAttachments && (
          <div
            className="mb-3"
            style={{
              backgroundColor: "#e7f3ff",
              border: "1px solid #b3d9ff",
              borderRadius: "0.375rem",
              padding: "1rem",
            }}
          >
            <div
              className="d-flex align-items-center mb-2"
              style={{ fontWeight: 600, color: "#084298", fontSize: "0.9rem" }}
            >
              <i className="bi bi-paperclip me-2"></i>
              Attachments ({approval.attachments.length})
            </div>
            <div className="d-flex flex-wrap gap-2">
              {approval.attachments.map((attachment) => (
                <button
                  key={attachment.attachmentId}
                  className="btn btn-sm btn-outline-primary"
                  onClick={() =>
                    handleDownload(attachment.attachmentId, attachment.fileName)
                  }
                  style={{
                    fontSize: "0.85rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                  title={`Download ${attachment.fileName}`}
                >
                  <i className="bi bi-file-earmark-arrow-down"></i>
                  <span
                    style={{
                      maxWidth: "150px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
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
            className="alert alert-warning mb-3"
            style={{ fontSize: "0.875rem" }}
          >
            <i className="bi bi-exclamation-triangle me-2"></i>
            No proof attachments submitted
          </div>
        )}

        {/* Action Buttons - Pending State */}
        {canDecide && approval.approvalStatus === "pending" && (
          <div className="d-flex gap-2">
            <button
              className="btn btn-success flex-grow-1"
              onClick={() => handleDecide("approved")}
              disabled={loading}
              style={{ fontWeight: 600 }}
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
              className="btn btn-danger flex-grow-1"
              onClick={() => handleDecide("rejected")}
              disabled={loading}
              style={{ fontWeight: 600 }}
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
            } mb-0`}
            style={{ fontSize: "0.875rem" }}
          >
            <div className="d-flex align-items-center">
              <i
                className={`bi bi-${
                  approval.approvalStatus === "approved"
                    ? "check-circle-fill"
                    : "x-circle-fill"
                } me-2`}
                style={{ fontSize: "1.2rem" }}
              ></i>
              <div>
                <div style={{ fontWeight: 600 }}>
                  {approval.approvalStatus === "approved"
                    ? "Approved"
                    : "Rejected"}
                </div>
                <div style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
                  by {approval.approverName} on{" "}
                  {formatDate(approval.approvedOn)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cannot Decide Warning */}
        {!canDecide && approval.approvalStatus === "pending" && (
          <div
            className="alert alert-info mb-0"
            style={{ fontSize: "0.875rem" }}
          >
            <i className="bi bi-info-circle me-2"></i>
            You don't have permission to decide this approval
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalCard;
