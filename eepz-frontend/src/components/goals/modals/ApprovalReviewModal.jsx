import { useState, useEffect } from "react";
import goalService from "../../../services/goals/goalService";
import LoadingSpinner from "../common/LoadingSpinner";
import Alert from "../common/Alert";
import { APPROVAL_TYPE_LABELS } from "../../../constants/goals/goalConstants";

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
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-lg modal-dialog-scrollable"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content" style={{ borderRadius: "0.75rem" }}>
          <div
            className="modal-header"
            style={{
              background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
              borderRadius: "0.75rem 0.75rem 0 0",
              padding: "1.25rem 1.5rem",
            }}
          >
            <div>
              <h5 className="modal-title mb-2" style={{ fontWeight: 700 }}>
                <i
                  className="bi bi-clipboard-check me-2"
                  style={{ color: "#0d6efd" }}
                ></i>
                Review Approval Request
              </h5>
              <div className="text-muted" style={{ fontSize: "0.875rem" }}>
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
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>

          <div className="modal-body" style={{ padding: "1.5rem" }}>
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
                <div className="mb-4">
                  <h6 className="fw-bold mb-3" style={{ fontSize: "1rem" }}>
                    <i className="bi bi-bullseye me-2 text-primary"></i>
                    Goal Information
                  </h6>
                  <div
                    className="card"
                    style={{
                      border: "1px solid #dee2e6",
                      borderRadius: "0.5rem",
                    }}
                  >
                    <div
                      className="card-body"
                      style={{ backgroundColor: "#f8f9fa", padding: "1.25rem" }}
                    >
                      <div className="row g-3">
                        <div className="col-12">
                          <label
                            className="text-muted small fw-semibold mb-1"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Goal Title
                          </label>
                          <p
                            className="mb-0 fw-semibold"
                            style={{ fontSize: "1.05rem" }}
                          >
                            {goalDetails.title}
                          </p>
                        </div>

                        {goalDetails.description && (
                          <div className="col-12">
                            <label
                              className="text-muted small fw-semibold mb-1"
                              style={{ fontSize: "0.75rem" }}
                            >
                              Description
                            </label>
                            <p
                              className="mb-0"
                              style={{
                                lineHeight: "1.6",
                                whiteSpace: "pre-wrap",
                              }}
                            >
                              {goalDetails.description}
                            </p>
                          </div>
                        )}

                        <div className="col-md-4 col-6">
                          <label
                            className="text-muted small fw-semibold mb-1"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Type
                          </label>
                          <p className="mb-0">
                            <span
                              className="badge bg-info text-capitalize"
                              style={{ fontSize: "0.85rem" }}
                            >
                              {goalDetails.goalType}
                            </span>
                          </p>
                        </div>

                        <div className="col-md-4 col-6">
                          <label
                            className="text-muted small fw-semibold mb-1"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Status
                          </label>
                          <p className="mb-0">
                            <span
                              className={`badge bg-${getStatusColor(
                                goalDetails.status
                              )} text-capitalize`}
                              style={{ fontSize: "0.85rem" }}
                            >
                              {goalDetails.status}
                            </span>
                          </p>
                        </div>

                        <div className="col-md-4 col-6">
                          <label
                            className="text-muted small fw-semibold mb-1"
                            style={{ fontSize: "0.75rem" }}
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
                            className="text-muted small fw-semibold mb-1"
                            style={{ fontSize: "0.75rem" }}
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
                            className="text-muted small fw-semibold mb-2"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Progress
                          </label>
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="progress flex-grow-1"
                              style={{ height: "24px", borderRadius: "12px" }}
                            >
                              <div
                                className="progress-bar"
                                role="progressbar"
                                style={{
                                  width: `${progress}%`,
                                  background:
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
                                <span
                                  style={{
                                    fontSize: "0.8rem",
                                    fontWeight: 600,
                                  }}
                                >
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

                {approval.goalAssignees?.length > 0 && (
                  <div className="mb-4">
                    <h6 className="fw-bold mb-3" style={{ fontSize: "1rem" }}>
                      <i className="bi bi-people-fill me-2 text-info"></i>
                      Team Members ({approval.goalAssignees.length})
                    </h6>
                    <div className="d-flex flex-wrap gap-2">
                      {approval.goalAssignees.map((assignee, idx) => (
                        <div
                          key={idx}
                          className="badge bg-light text-dark border"
                          style={{
                            fontSize: "0.85rem",
                            padding: "0.5rem 0.75rem",
                          }}
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

                {goalDetails.checklist?.length > 0 && (
                  <div className="mb-4">
                    <h6 className="fw-bold mb-3" style={{ fontSize: "1rem" }}>
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
                              className="d-flex align-items-center gap-2 mb-2 p-2"
                              style={{
                                backgroundColor: "#e9ecef",
                                borderRadius: "0.5rem",
                              }}
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
                                    className="list-group-item"
                                    style={{
                                      backgroundColor:
                                        item.isCompletedForCurrentUser
                                          ? "#d1f0dc"
                                          : "#fff",
                                      borderLeft: item.isCompletedForCurrentUser
                                        ? "4px solid #28a745"
                                        : "4px solid #dee2e6",
                                      opacity: item.isCompletedForCurrentUser
                                        ? 0.85
                                        : 1,
                                      padding: "0.875rem 1rem",
                                    }}
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
                                          className="fw-semibold"
                                          style={{
                                            textDecoration:
                                              item.isCompletedForCurrentUser
                                                ? "line-through"
                                                : "none",
                                            fontSize: "0.95rem",
                                          }}
                                        >
                                          {item.title}
                                        </div>
                                        {item.description && (
                                          <div
                                            className="text-muted small mt-1"
                                            style={{ lineHeight: "1.5" }}
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
                              className="list-group-item"
                              style={{
                                backgroundColor: item.isCompletedForCurrentUser
                                  ? "#d1f0dc"
                                  : "#fff",
                                borderLeft: item.isCompletedForCurrentUser
                                  ? "4px solid #28a745"
                                  : "4px solid #dee2e6",
                                opacity: item.isCompletedForCurrentUser
                                  ? 0.85
                                  : 1,
                                padding: "0.875rem 1rem",
                              }}
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
                                    className="fw-semibold"
                                    style={{
                                      textDecoration:
                                        item.isCompletedForCurrentUser
                                          ? "line-through"
                                          : "none",
                                      fontSize: "0.95rem",
                                    }}
                                  >
                                    {item.title}
                                  </div>
                                  {item.description && (
                                    <div
                                      className="text-muted small mt-1"
                                      style={{ lineHeight: "1.5" }}
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

                {(isCompletionApproval || isAcknowledgmentApproval) &&
                  hasProofAttachments && (
                    <div className="mb-4">
                      <h6 className="fw-bold mb-3" style={{ fontSize: "1rem" }}>
                        <i className="bi bi-file-earmark-check-fill me-2 text-success"></i>
                        {isAcknowledgmentApproval
                          ? "Proof Attached"
                          : "Proof of Completion"}
                      </h6>
                      <div
                        className="card"
                        style={{
                          border: "2px solid #28a745",
                          borderRadius: "0.5rem",
                        }}
                      >
                        <div className="list-group list-group-flush">
                          {(() => {
                            const latestProof = approval.proofAttachments.sort(
                              (a, b) =>
                                new Date(b.attachedOn) - new Date(a.attachedOn)
                            )[0];

                            return (
                              <div
                                className="list-group-item"
                                style={{
                                  backgroundColor: "#f0fff4",
                                  padding: "1rem",
                                }}
                              >
                                <div className="d-flex justify-content-between align-items-center gap-3">
                                  <div className="d-flex align-items-center gap-3 flex-grow-1">
                                    <div
                                      style={{
                                        width: "48px",
                                        height: "48px",
                                        backgroundColor: "#28a745",
                                        borderRadius: "0.5rem",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                      }}
                                    >
                                      <i
                                        className="bi bi-file-earmark-fill"
                                        style={{
                                          fontSize: "1.5rem",
                                          color: "white",
                                        }}
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
                                            className="badge bg-success"
                                            style={{ fontSize: "0.75rem" }}
                                          >
                                            <i className="bi bi-check-circle-fill me-1"></i>
                                            Latest submission
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    className="btn btn-success"
                                    onClick={() =>
                                      handleDownload(
                                        latestProof.goalAttachmentId
                                      )
                                    }
                                    style={{
                                      padding: "0.5rem 1rem",
                                      borderRadius: "0.5rem",
                                      fontWeight: 500,
                                      flexShrink: 0,
                                    }}
                                  >
                                    <i className="bi bi-download me-2"></i>
                                    Download
                                  </button>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}

                {approval.allAttachments?.length > 0 && (
                  <div className="mb-4">
                    <h6 className="fw-bold mb-3" style={{ fontSize: "1rem" }}>
                      <i className="bi bi-paperclip me-2 text-secondary"></i>
                      Attachments ({approval.allAttachments.length})
                    </h6>
                    <div className="list-group">
                      {approval.allAttachments.map((attachment) => (
                        <div
                          key={attachment.goalAttachmentId}
                          className="list-group-item"
                          style={{ padding: "1rem" }}
                        >
                          <div className="d-flex justify-content-between align-items-center gap-3">
                            <div className="d-flex align-items-center gap-3 flex-grow-1">
                              <i
                                className="bi bi-file-earmark-text-fill text-primary"
                                style={{ fontSize: "2rem", flexShrink: 0 }}
                              ></i>
                              <div className="flex-grow-1">
                                <div className="fw-semibold mb-1">
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
                            <button
                              className="btn btn-outline-primary"
                              onClick={() =>
                                handleDownload(attachment.goalAttachmentId)
                              }
                              style={{
                                padding: "0.5rem 1rem",
                                borderRadius: "0.5rem",
                                fontWeight: 500,
                                flexShrink: 0,
                              }}
                            >
                              <i className="bi bi-download me-2"></i>
                              Download
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isReopening && canDecide && !isReadOnly && (
                  <div className="mb-4">
                    <h6 className="fw-bold mb-3" style={{ fontSize: "1rem" }}>
                      <i className="bi bi-calendar-check me-2 text-warning"></i>
                      Set New Deadline
                    </h6>
                    <div
                      className="card"
                      style={{
                        border: "2px solid #ffc107",
                        borderRadius: "0.5rem",
                        backgroundColor: "#fffbea",
                      }}
                    >
                      <div className="card-body" style={{ padding: "1.25rem" }}>
                        <label
                          className="form-label fw-semibold mb-2"
                          style={{ fontSize: "0.95rem" }}
                        >
                          New Deadline
                          <span style={{ color: "#dc3545" }}> *</span>
                        </label>
                        <input
                          type="date"
                          className="form-control"
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

                            // Validate and auto-add time
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
                          style={{
                            padding: "0.75rem",
                            borderRadius: "0.5rem",
                            border: "2px solid #ffc107",
                          }}
                        />
                        <small
                          style={{
                            color: "#6c757d",
                            marginTop: "0.5rem",
                            display: "block",
                          }}
                        >
                          Select the new deadline date (automatically set to
                          11:59 PM)
                        </small>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mb-0">
                  <h6 className="fw-bold mb-3" style={{ fontSize: "1rem" }}>
                    <i className="bi bi-info-circle-fill me-2 text-info"></i>
                    Request Details
                  </h6>
                  <div
                    className="card"
                    style={{
                      border: "1px solid #dee2e6",
                      borderRadius: "0.5rem",
                    }}
                  >
                    <div
                      className="card-body"
                      style={{ backgroundColor: "#f8f9fa", padding: "1.25rem" }}
                    >
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label
                            className="text-muted small fw-semibold mb-1"
                            style={{ fontSize: "0.75rem" }}
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
                            className="text-muted small fw-semibold mb-1"
                            style={{ fontSize: "0.75rem" }}
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
                                className="text-muted small fw-semibold mb-1"
                                style={{ fontSize: "0.75rem" }}
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
                                className="text-muted small fw-semibold mb-1"
                                style={{ fontSize: "0.75rem" }}
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
                  className="bi bi-exclamation-triangle"
                  style={{ fontSize: "3rem", color: "#dc3545" }}
                ></i>
                <p className="mt-3 fw-semibold">Failed to load goal details</p>
              </div>
            )}
          </div>

          <div
            className="modal-footer"
            style={{
              backgroundColor: "#f8f9fa",
              borderRadius: "0 0 0.75rem 0.75rem",
              padding: "1rem 1.5rem",
            }}
          >
            {canDecide && !isReadOnly ? (
              <>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={onClose}
                  style={{
                    borderRadius: "0.5rem",
                    fontWeight: 500,
                    padding: "0.5rem 1.25rem",
                  }}
                >
                  <i className="bi bi-x-circle me-1"></i>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleDecision("rejected")}
                  disabled={loading}
                  style={{
                    borderRadius: "0.5rem",
                    fontWeight: 500,
                    padding: "0.5rem 1.25rem",
                  }}
                >
                  <i className="bi bi-x-circle-fill me-1"></i>
                  Reject
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => handleDecision("approved")}
                  disabled={loading || (isReopening && !newDeadline)}
                  style={{
                    borderRadius: "0.5rem",
                    fontWeight: 500,
                    padding: "0.5rem 1.25rem",
                  }}
                >
                  <i className="bi bi-check-circle-fill me-1"></i>
                  Approve
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                style={{
                  borderRadius: "0.5rem",
                  fontWeight: 500,
                  padding: "0.5rem 1.25rem",
                }}
              >
                <i className="bi bi-x-circle me-1"></i>
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const getStatusColor = (status) => {
  const colors = {
    draft: "secondary",
    open: "info",
    pending: "warning",
    inprogress: "primary",
    reopened: "warning",
    completed: "success",
    cancelled: "danger",
  };
  return colors[status?.toLowerCase()] || "secondary";
};

export default ApprovalReviewModal;
