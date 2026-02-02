import { useState, useEffect } from "react";
import goalService, {
  isFilePreviewable,
  getFileIcon,
} from "../../../services/goals/goalService";
import LoadingSpinner from "../common/LoadingSpinner";
import Alert from "../common/Alert";
import { APPROVAL_TYPE_LABELS } from "../../../constants/goals/goalConstants";
import GoalStatusBadge from "../badges/GoalStatusBadge";
import styles from "../../../styles/goals/components/ApprovalReviewModal.module.css";

const ApprovalReviewModal = ({
  isOpen,
  onClose,
  approval,
  onDecisionRequest,
  canDecide,
  isReadOnly,
}) => {
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [goalDetails, setGoalDetails] = useState(null);
  const [newDeadline, setNewDeadline] = useState(null);

  useEffect(() => {
    if (isOpen && approval) {
      loadGoalDetails();
      setNewDeadline(null);
    }
  }, [isOpen, approval]);

  const loadGoalDetails = async () => {
    setLoading(true);
    setAlert(null);
    try {
      const response = await goalService.getGoal(approval.goalId);
      setGoalDetails(response.data);
    } catch (error) {
      setAlert({
        type: "danger",
        message: "Failed to load goal details",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = (decision) => {
    if (approval.approvalType === "reopening" && decision === "approved") {
      if (!newDeadline) {
        setAlert({
          type: "danger",
          message: "Please enter a new deadline for the goal extension",
        });
        return;
      }

      if (new Date(newDeadline) <= new Date()) {
        setAlert({
          type: "danger",
          message: "The new deadline must be in the future",
        });
        return;
      }
    }

    onDecisionRequest({ decision, newDeadline });
  };

  const handlePreview = async (attachmentId, filename) => {
    try {
      await goalService.previewAttachment(attachmentId, filename);
    } catch (error) {
      console.error("Preview failed:", error);
      setAlert({
        type: "danger",
        message: error.message || "Failed to preview file",
      });
    }
  };

  const handleDownload = async (attachmentId) => {
    try {
      await goalService.downloadAttachment(attachmentId);
    } catch (error) {
      console.error("Download failed:", error);
      setAlert({
        type: "danger",
        message: "Failed to download file",
      });
    }
  };

  const isCompletionApproval = approval.approvalType === "completion";
  const isAcknowledgmentApproval =
    approval.approvalType === "task_acknowledgment";
  const isReopening = approval.approvalType === "reopening";
  const hasProofAttachments = approval.proofAttachments?.length > 0;

  const isAutoApproved =
    approval.approvalStatus === "approved" &&
    approval.approverEmployeeMasterId === approval.requestedByEmployeeMasterId;

  const groupChecklistByAssignee = () => {
    if (!goalDetails?.checklist || goalDetails.checklist.length === 0)
      return {};

    const grouped = {};
    const assigneeMap = {};

    if (goalDetails.assignees) {
      goalDetails.assignees.forEach((assignee) => {
        assigneeMap[assignee.employeeMasterId] = assignee;
      });
    }

    goalDetails.checklist.forEach((item) => {
      const assigneeId = item.addedForEmployeeMasterId || "unassigned";
      const assigneeInfo = assigneeMap[assigneeId];
      const assigneeName = assigneeInfo?.name || "Unassigned";

      if (!grouped[assigneeId]) {
        grouped[assigneeId] = {
          name: assigneeName,
          items: [],
        };
      }
      grouped[assigneeId].items.push(item);
    });

    return grouped;
  };

  const calculateProgress = () => {
    if (!goalDetails?.checklist || goalDetails.checklist.length === 0) return 0;
    const completed = goalDetails.checklist.filter(
      (item) => item.isCompletedForCurrentUser
    ).length;
    return Math.round((completed / goalDetails.checklist.length) * 100);
  };

  const progress = goalDetails ? calculateProgress() : 0;
  const isTeamGoal = goalDetails?.goalType === "team";
  const checklistGroups = isTeamGoal ? groupChecklistByAssignee() : null;

  if (!isOpen) return null;

  return (
    <div className={`modal show d-block ${styles.backdrop}`} onClick={onClose}>
      <div
        className="modal-dialog modal-lg modal-dialog-scrollable"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`modal-content ${styles.modalContent}`}>
          {/* MODAL HEADER */}
          <div className={`modal-header ${styles.modalHeader}`}>
            <div>
              <h5 className={`modal-title mb-2 ${styles.modalTitle}`}>
                <i className="bi bi-clipboard-check me-2"></i>
                Review Approval Request
              </h5>
              <div className={`text-muted ${styles.modalSubtitle}`}>
                <span className="badge bg-secondary me-2">
                  {APPROVAL_TYPE_LABELS[approval.approvalType]}
                </span>
                {approval.approvalStatus === "pending" ? (
                  <span className="badge bg-warning text-dark">⏳ Pending</span>
                ) : approval.approvalStatus === "approved" ? (
                  <>
                    <span className="badge bg-success">✓ Approved</span>
                    {isAutoApproved && (
                      <span
                        className="badge bg-info ms-2"
                        title="Auto-approved by Leadership"
                      >
                        <i className="bi bi-lightning-charge-fill me-1"></i>
                        Auto
                      </span>
                    )}
                  </>
                ) : (
                  <span className="badge bg-danger">✗ Rejected</span>
                )}
              </div>
            </div>
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              disabled={loading}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* MODAL BODY */}
          <div className={`modal-body ${styles.modalBody}`}>
            {alert && (
              <Alert
                type={alert.type}
                message={alert.message}
                onClose={() => setAlert(null)}
              />
            )}

            {loading ? (
              <LoadingSpinner text="Loading goal details..." />
            ) : goalDetails ? (
              <>
                {/* GOAL INFORMATION */}
                <div className="mb-4">
                  <h6 className={`fw-bold mb-3 ${styles.sectionTitle}`}>
                    <i className="bi bi-bullseye me-2 text-primary"></i>
                    Goal Information
                  </h6>
                  <div className={`card ${styles.cardBorder}`}>
                    <div className={styles.cardBodyLight}>
                      <div className="row g-3">
                        <div className="col-12">
                          <label
                            className={`text-muted small fw-semibold mb-1 ${styles.labelText}`}
                          >
                            Goal Title
                          </label>
                          <p
                            className={`mb-0 fw-semibold ${styles.goalTitleText}`}
                          >
                            {goalDetails.title}
                          </p>
                        </div>

                        {goalDetails.description && (
                          <div className="col-12">
                            <label
                              className={`text-muted small fw-semibold mb-1 ${styles.labelText}`}
                            >
                              Description
                            </label>
                            <p className={`mb-0 ${styles.descriptionText}`}>
                              {goalDetails.description}
                            </p>
                          </div>
                        )}

                        <div className="col-md-4 col-6">
                          <label
                            className={`text-muted small fw-semibold mb-1 ${styles.labelText}`}
                          >
                            Type
                          </label>
                          <p className="mb-0">
                            <span
                              className={`badge bg-info text-capitalize ${styles.badgeSmall}`}
                            >
                              {goalDetails.goalType}
                            </span>
                          </p>
                        </div>

                        <div className="col-md-4 col-6">
                          <label
                            className={`text-muted small fw-semibold mb-1 ${styles.labelText}`}
                          >
                            Status
                          </label>
                          <p className="mb-0">
                            <GoalStatusBadge status={goalDetails.status} />
                          </p>
                        </div>

                        <div className="col-md-4 col-6">
                          <label
                            className={`text-muted small fw-semibold mb-1 ${styles.labelText}`}
                          >
                            Deadline
                          </label>
                          <p className="mb-0">
                            <i className="bi bi-calendar3 me-1"></i>
                            {new Date(goalDetails.endAt).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="col-md-6">
                          <label
                            className={`text-muted small fw-semibold mb-1 ${styles.labelText}`}
                          >
                            Created By
                          </label>
                          <p className="mb-0">
                            <i className="bi bi-person-fill me-1 text-primary"></i>
                            {approval.goalCreatedByName}
                          </p>
                        </div>

                        <div className="col-md-6">
                          <label
                            className={`text-muted small fw-semibold mb-1 ${styles.labelText}`}
                          >
                            Progress
                          </label>
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className={`progress flex-grow-1 ${styles.progressWrapper}`}
                            >
                              <div
                                className="progress-bar"
                                role="progressbar"
                                style={{
                                  width: `${progress}%`,
                                  backgroundColor:
                                    progress >= 75
                                      ? "#28a745"
                                      : progress >= 50
                                      ? "#17a2b8"
                                      : progress >= 25
                                      ? "#ffc107"
                                      : "#dc3545",
                                }}
                                aria-valuenow={progress}
                                aria-valuemin="0"
                                aria-valuemax="100"
                              >
                                <span className={styles.progressText}>
                                  {progress}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* TEAM MEMBERS */}
                {approval.goalAssignees?.length > 0 && (
                  <div className="mb-4">
                    <h6 className={`fw-bold mb-3 ${styles.sectionTitle}`}>
                      <i className="bi bi-people-fill me-2 text-info"></i>
                      Team Members ({approval.goalAssignees.length})
                    </h6>
                    <div className="d-flex flex-wrap gap-2">
                      {approval.goalAssignees.map((assignee, idx) => (
                        <div
                          key={idx}
                          className={`badge bg-light text-dark border ${styles.teamMemberBadge}`}
                        >
                          <i className="bi bi-person-circle me-1"></i>
                          {assignee.name}
                          {assignee.role && (
                            <span className="text-muted ms-1">
                              • {assignee.role}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CHECKLIST */}
                {goalDetails.checklist?.length > 0 && (
                  <div className="mb-4">
                    <h6 className={`fw-bold mb-3 ${styles.sectionTitle}`}>
                      <i className="bi bi-check2-square me-2 text-success"></i>
                      Checklist (
                      {
                        goalDetails.checklist.filter(
                          (i) => i.isCompletedForCurrentUser
                        ).length
                      }
                      /{goalDetails.checklist.length} completed)
                    </h6>

                    {isTeamGoal && checklistGroups ? (
                      Object.entries(checklistGroups).map(
                        ([assigneeId, group]) => (
                          <div key={assigneeId} className="mb-3">
                            <div
                              className={`d-flex align-items-center gap-2 mb-2 p-2 ${styles.assigneeHeader}`}
                            >
                              <i className="bi bi-person-badge text-primary"></i>
                              <span className="fw-semibold">
                                {group.name}'s Tasks
                              </span>
                              <span className="badge bg-secondary ms-auto">
                                {
                                  group.items.filter(
                                    (i) => i.isCompletedForCurrentUser
                                  ).length
                                }
                                /{group.items.length}
                              </span>
                            </div>

                            <div className="list-group">
                              {group.items
                                .sort(
                                  (a, b) =>
                                    (a.isCompletedForCurrentUser ? 1 : 0) -
                                    (b.isCompletedForCurrentUser ? 1 : 0)
                                )
                                .map((item, idx) => (
                                  <div
                                    key={idx}
                                    className={`list-group-item ${
                                      styles.checklistItem
                                    } ${
                                      item.isCompletedForCurrentUser
                                        ? styles.checklistItemCompleted
                                        : styles.checklistItemPending
                                    }`}
                                  >
                                    <div className="d-flex align-items-start gap-2">
                                      <i
                                        className={`bi ${
                                          item.isCompletedForCurrentUser
                                            ? "bi-check-circle-fill text-success"
                                            : "bi-circle text-muted"
                                        } mt-1`}
                                        style={{
                                          fontSize: "1.1rem",
                                          flexShrink: 0,
                                        }}
                                      ></i>
                                      <div className="flex-grow-1">
                                        <div
                                          className={`fw-semibold ${
                                            styles.checklistTitle
                                          } ${
                                            item.isCompletedForCurrentUser
                                              ? styles.checklistTitleCompleted
                                              : ""
                                          }`}
                                        >
                                          {item.title}
                                        </div>
                                        {item.description && (
                                          <div
                                            className={`text-muted small mt-1 ${styles.checklistDescription}`}
                                          >
                                            {item.description}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )
                      )
                    ) : (
                      <div className="list-group">
                        {goalDetails.checklist
                          .sort(
                            (a, b) =>
                              (a.isCompletedForCurrentUser ? 1 : 0) -
                              (b.isCompletedForCurrentUser ? 1 : 0)
                          )
                          .map((item, idx) => (
                            <div
                              key={idx}
                              className={`list-group-item ${
                                styles.checklistItem
                              } ${
                                item.isCompletedForCurrentUser
                                  ? styles.checklistItemCompleted
                                  : styles.checklistItemPending
                              }`}
                            >
                              <div className="d-flex align-items-start gap-2">
                                <i
                                  className={`bi ${
                                    item.isCompletedForCurrentUser
                                      ? "bi-check-circle-fill text-success"
                                      : "bi-circle text-muted"
                                  } mt-1`}
                                  style={{ fontSize: "1.1rem", flexShrink: 0 }}
                                ></i>
                                <div className="flex-grow-1">
                                  <div
                                    className={`fw-semibold ${
                                      styles.checklistTitle
                                    } ${
                                      item.isCompletedForCurrentUser
                                        ? styles.checklistTitleCompleted
                                        : ""
                                    }`}
                                  >
                                    {item.title}
                                  </div>
                                  {item.description && (
                                    <div
                                      className={`text-muted small mt-1 ${styles.checklistDescription}`}
                                    >
                                      {item.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {/* PROOF OF COMPLETION */}
                {(isCompletionApproval || isAcknowledgmentApproval) &&
                  hasProofAttachments && (
                    <div className="mb-4">
                      <h6 className={`fw-bold mb-3 ${styles.sectionTitle}`}>
                        <i className="bi bi-file-earmark-check-fill me-2 text-success"></i>
                        {isAcknowledgmentApproval
                          ? "Proof Attached"
                          : "Proof of Completion"}
                      </h6>
                      <div className={`card ${styles.proofCard}`}>
                        <div className="list-group list-group-flush">
                          {(() => {
                            const latestProof = approval.proofAttachments.sort(
                              (a, b) =>
                                new Date(b.attachedOn) - new Date(a.attachedOn)
                            )[0];

                            const canPreview = isFilePreviewable(
                              latestProof.attachmentTitle
                            );

                            return (
                              <div
                                className={`list-group-item ${styles.proofItem}`}
                              >
                                <div className="d-flex justify-content-between align-items-center gap-3">
                                  <div className="d-flex align-items-center gap-3 flex-grow-1">
                                    <div className={styles.proofIconBox}>
                                      <i
                                        className={`bi ${getFileIcon(
                                          latestProof.attachmentTitle
                                        )} ${styles.proofIcon}`}
                                      ></i>
                                    </div>
                                    <div className="flex-grow-1">
                                      <div className="fw-semibold mb-1">
                                        {latestProof.attachmentTitle}
                                      </div>
                                      <div className="text-muted small">
                                        <i className="bi bi-clock me-1"></i>
                                        {new Date(
                                          latestProof.attachedOn
                                        ).toLocaleDateString()}
                                        <span className="mx-2">•</span>
                                        <i className="bi bi-person me-1"></i>
                                        {latestProof.attachedByName}
                                      </div>
                                      {approval.proofAttachments.length > 1 && (
                                        <div className="mt-2">
                                          <span
                                            className={`badge bg-success ${styles.latestBadge}`}
                                          >
                                            <i className="bi bi-check-circle-fill me-1"></i>
                                            Latest submission
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="d-flex gap-2 flex-shrink-0">
                                    <button
                                      className={`btn btn-success ${styles.fileButton}`}
                                      onClick={
                                        canPreview
                                          ? () =>
                                              handlePreview(
                                                latestProof.goalAttachmentId,
                                                latestProof.attachmentTitle
                                              )
                                          : undefined
                                      }
                                      disabled={!canPreview}
                                      title={
                                        !canPreview
                                          ? "Preview not supported for this file type. Please download to view."
                                          : ""
                                      }
                                    >
                                      <i className="bi bi-eye me-2"></i>
                                      Preview
                                    </button>
                                    <button
                                      className={`btn btn-success ${styles.fileButton}`}
                                      onClick={() =>
                                        handleDownload(
                                          latestProof.goalAttachmentId
                                        )
                                      }
                                    >
                                      <i className="bi bi-download me-2"></i>
                                      Download
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}

                {/* ALL ATTACHMENTS */}
                {approval.allAttachments?.length > 0 && (
                  <div className="mb-4">
                    <h6 className={`fw-bold mb-3 ${styles.sectionTitle}`}>
                      <i className="bi bi-paperclip me-2 text-secondary"></i>
                      Attachments ({approval.allAttachments.length})
                    </h6>
                    <div className="list-group">
                      {approval.allAttachments.map((attachment) => {
                        const canPreview = isFilePreviewable(
                          attachment.attachmentTitle
                        );

                        return (
                          <div
                            key={attachment.goalAttachmentId}
                            className={`list-group-item ${styles.attachmentItem}`}
                          >
                            <div className="d-flex justify-content-between align-items-center gap-3">
                              <div className="d-flex align-items-center gap-3 flex-grow-1">
                                <i
                                  className={`bi ${getFileIcon(
                                    attachment.attachmentTitle
                                  )} ${styles.attachmentIcon}`}
                                ></i>
                                <div className="flex-grow-1">
                                  <div
                                    className={`fw-semibold mb-1 ${styles.attachmentTitle}`}
                                  >
                                    {attachment.attachmentTitle}
                                  </div>
                                  <div className="text-muted small">
                                    <i className="bi bi-calendar me-1"></i>
                                    {new Date(
                                      attachment.attachedOn
                                    ).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                              <div className="d-flex gap-2 flex-shrink-0">
                                <button
                                  className={`btn btn-primary ${styles.fileButton}`}
                                  onClick={
                                    canPreview
                                      ? () =>
                                          handlePreview(
                                            attachment.goalAttachmentId,
                                            attachment.attachmentTitle
                                          )
                                      : undefined
                                  }
                                  disabled={!canPreview}
                                  title={
                                    !canPreview
                                      ? "Preview not available for this file type"
                                      : ""
                                  }
                                >
                                  <i className="bi bi-eye me-2"></i>
                                  Preview
                                </button>
                                <button
                                  className={`btn btn-primary ${styles.fileButton}`}
                                  onClick={() =>
                                    handleDownload(attachment.goalAttachmentId)
                                  }
                                >
                                  <i className="bi bi-download me-2"></i>
                                  Download
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* NEW DEADLINE FOR REOPENING */}
                {isReopening && canDecide && !isReadOnly && (
                  <div className="mb-4">
                    <h6 className={`fw-bold mb-3 ${styles.sectionTitle}`}>
                      <i className="bi bi-calendar-check me-2 text-warning"></i>
                      Set New Deadline
                    </h6>
                    <div className={`card ${styles.reopeningCard}`}>
                      <div className={styles.cardBodyLight}>
                        <label className="form-label fw-semibold mb-2">
                          New Deadline
                          <span style={{ color: "#dc3545" }}> *</span>
                        </label>
                        <input
                          type="date"
                          className={`form-control ${styles.reopeningInput}`}
                          value={newDeadline ? newDeadline.split("T")[0] : ""}
                          onChange={(e) => {
                            const selectedDate = new Date(
                              e.target.value + "T23:59:00"
                            );
                            const maxDate = new Date();
                            maxDate.setFullYear(
                              maxDate.getFullYear() + 1,
                              2,
                              31
                            );

                            if (selectedDate <= maxDate) {
                              setNewDeadline(
                                selectedDate.toISOString().slice(0, 16)
                              );
                            } else {
                              setAlert({
                                type: "warning",
                                message:
                                  "Date must be on or before March 31st of next year",
                              });
                            }
                          }}
                          min={new Date().toISOString().slice(0, 10)}
                          max={(() => {
                            const maxDate = new Date();
                            maxDate.setFullYear(
                              maxDate.getFullYear() + 1,
                              3,
                              1
                            );
                            return maxDate.toISOString().slice(0, 10);
                          })()}
                          disabled={loading}
                        />
                        <small className={styles.reopeningHint}>
                          Select the new deadline date (automatically set to
                          11:59 PM)
                        </small>
                      </div>
                    </div>
                  </div>
                )}

                {/* REQUEST DETAILS */}
                <div className="mb-0">
                  <h6 className={`fw-bold mb-3 ${styles.sectionTitle}`}>
                    <i className="bi bi-info-circle-fill me-2 text-info"></i>
                    Request Details
                  </h6>
                  <div className={`card ${styles.cardBorder}`}>
                    <div className={styles.cardBodyLight}>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label
                            className={`text-muted small fw-semibold mb-1 ${styles.labelText}`}
                          >
                            Requested By
                          </label>
                          <p className="mb-0">
                            <i className="bi bi-person-fill me-1 text-primary"></i>
                            {approval.requestedByName}
                          </p>
                        </div>
                        <div className="col-md-6">
                          <label
                            className={`text-muted small fw-semibold mb-1 ${styles.labelText}`}
                          >
                            Requested On
                          </label>
                          <p className="mb-0">
                            <i className="bi bi-calendar-event me-1 text-primary"></i>
                            {new Date(
                              approval.requestedOn
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        {approval.approvedOn && (
                          <>
                            <div className="col-md-6">
                              <label
                                className={`text-muted small fw-semibold mb-1 ${styles.labelText}`}
                              >
                                Decided By
                              </label>
                              <p className="mb-0">
                                <i className="bi bi-person-check-fill me-1 text-success"></i>
                                {approval.approverName || "N/A"}
                              </p>
                            </div>
                            <div className="col-md-6">
                              <label
                                className={`text-muted small fw-semibold mb-1 ${styles.labelText}`}
                              >
                                Decided On
                              </label>
                              <p className="mb-0">
                                <i className="bi bi-calendar-check me-1 text-success"></i>
                                {new Date(
                                  approval.approvedOn
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-muted py-5">
                <i
                  className={`bi bi-exclamation-triangle ${styles.errorIcon}`}
                ></i>
                <p className="mt-3 fw-semibold">Failed to load goal details</p>
              </div>
            )}
          </div>

          {/* MODAL FOOTER */}
          <div className={`modal-footer ${styles.modalFooter}`}>
            {canDecide && !isReadOnly ? (
              <>
                <button
                  type="button"
                  className={`btn btn-outline-secondary ${styles.actionButton}`}
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn btn-danger ${styles.actionButton}`}
                  onClick={() => handleDecision("rejected")}
                  disabled={loading}
                >
                  <i className="bi bi-x-circle-fill me-1"></i>
                  Reject
                </button>
                <button
                  type="button"
                  className={`btn btn-success ${styles.actionButton}`}
                  onClick={() => handleDecision("approved")}
                  disabled={loading || (isReopening && !newDeadline)}
                >
                  <i className="bi bi-check-circle-fill me-1"></i>
                  Approve
                </button>
              </>
            ) : (
              <button
                type="button"
                className={`btn btn-secondary ${styles.actionButton}`}
                onClick={onClose}
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovalReviewModal;
