import { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/auth/AuthContext";
import GoalStatusBadge from "../badges/GoalStatusBadge";
import GoalTypeBadge from "../badges/GoalTypeBadge";
import TaskStatusBadge from "../badges/TaskStatusBadge";
import GoalProgress from "../forms/GoalProgress";
import {
  formatDate,
  isOverdue,
  getDaysUntilDeadline,
} from "../../../utils/goals/goalHelpers";

const GoalDetailsHeader = ({
  goal,
  onEdit,
  onAssign,
  onRequestApproval,
  canEdit = false,
  canAssign = false,
  canComplete = false,
  currentProgress,
  userPersonalProgress,
}) => {
  const { user } = useAuth();
  const [progress, setProgress] = useState(0);
  const [personalProgress, setPersonalProgress] = useState(0);

  useEffect(() => {
    setProgress(
      currentProgress !== undefined
        ? currentProgress
        : goal?.progressPercent || 0
    );
  }, [currentProgress, goal?.progressPercent]);

  useEffect(() => {
    if (userPersonalProgress !== undefined) {
      setPersonalProgress(userPersonalProgress);
    } else if (goal?.checklist) {
      const userItems = goal.checklist.filter(
        (item) => item.addedForEmployeeMasterId === user.empMasterId
      );
      const userCompleted = userItems.filter(
        (item) => item.isCompletedForCurrentUser
      );
      const calculated =
        userItems.length > 0
          ? Math.round((userCompleted.length / userItems.length) * 100)
          : 0;
      setPersonalProgress(calculated);
    }
  }, [userPersonalProgress, goal?.checklist, user.empMasterId]);

  if (!goal) return null;

  const isCreator = goal.createdByEmployeeMasterId === user.empMasterId;
  const isAssignee = goal.assignees?.some(
    (a) => a.employeeMasterId === user.empMasterId
  );
  const isTeamGoal = goal.goalType === "team";
  const isEmployeeAssignee = !isCreator && isAssignee && isTeamGoal;

  const isManagerOrDeptHead =
    user.role === "Manager" || user.role === "Department Head";
  const isLeadership = user.role === "Leadership";

  const isLeadershipMonitoring = isLeadership && isTeamGoal;
  const isExistingMonitoring =
    isManagerOrDeptHead && isTeamGoal && !isCreator && !isAssignee;
  const isMonitoringMode = isLeadershipMonitoring || isExistingMonitoring;

  const isUserAcknowledged =
    isEmployeeAssignee &&
    goal.assignees?.find((a) => a.employeeMasterId === user.empMasterId)
      ?.isAcknowledged;

  const overdueStatus = isOverdue(goal.endAt) && goal.status !== "completed";
  const daysUntil = getDaysUntilDeadline(goal.endAt);

  const relevantProgress = isEmployeeAssignee ? personalProgress : progress;
  const isGoalOverdue = isOverdue(goal.endAt);
  const hasPendingApproval = goal.hasPendingApproval || false;
  const hasPendingClosureRequest = goal.hasPendingClosureRequest || false;
  const hasPendingReactivationRequest =
    goal.hasPendingReactivationRequest || false;

  // Check if goal is already completed/closed/cancelled
  const isCompleted = ["completed", "closed", "cancelled"].includes(
    goal.status?.toLowerCase()
  );

  // Check if org goal and user is Leadership
  const isOrgGoal = goal.goalType === "org";
  const isLeadershipOrgGoal = isOrgGoal && isLeadership;

  // Check if user can manage org goals (creator or leadership)
  const canManageOrgGoal = isOrgGoal && (isCreator || isLeadership);

  // Leadership can auto-close org goals (exclude "inprogress", include "reopened")
  const canAutoClosePremature =
    isLeadershipOrgGoal &&
    !isCompleted &&
    !hasPendingClosureRequest &&
    goal.status !== "closed" &&
    ["open", "reopened"].includes(goal.status?.toLowerCase());

  // Can auto-complete when progress = 100 (only for org goals at 100%)
  const canAutoCompletePremature =
    isLeadershipOrgGoal &&
    !isCompleted &&
    !hasPendingApproval &&
    relevantProgress === 100 &&
    ["open", "inprogress", "reopened"].includes(goal.status?.toLowerCase());

  const canRequestCompletion =
    !isEmployeeAssignee &&
    !isMonitoringMode &&
    relevantProgress === 100 &&
    !hasPendingApproval &&
    ["open", "inprogress", "reopened"].includes(goal.status?.toLowerCase());

  // UPDATED: Don't allow reopening if already reopened and overdue again
  const canRequestReopening =
    isCreator &&
    !isMonitoringMode &&
    !hasPendingReactivationRequest &&
    isGoalOverdue &&
    goal.status !== "reopened" &&
    !["closed", "cancelled"].includes(goal.status?.toLowerCase());

  console.log(isCreator);

  // Button for org goal reopen (no overdue requirement)
  const canReopenOrgGoal =
    isCreator &&
    !isMonitoringMode &&
    !hasPendingReactivationRequest &&
    goal.status === "completed" &&
    isOrgGoal;

  const canRequestAcknowledgment =
    isEmployeeAssignee &&
    personalProgress === 100 &&
    !isUserAcknowledged &&
    !hasPendingApproval &&
    ["open", "inprogress", "reopened"].includes(goal.status?.toLowerCase());

  // NEW: Allow closure for reopened goals that are overdue
  const canRequestClosureForReopened =
    !isLeadershipOrgGoal &&
    isCreator &&
    !isMonitoringMode &&
    !hasPendingClosureRequest &&
    isGoalOverdue &&
    goal.status === "reopened"; // NEW: Only for reopened goals that missed deadline again

  // UPDATED: canRequestClosure to exclude "reopened" status
  const canRequestClosure =
    !isLeadershipOrgGoal &&
    isCreator &&
    !isMonitoringMode &&
    !hasPendingClosureRequest &&
    !isGoalOverdue && // Don't allow closure for overdue
    ["open", "inprogress", "reopened"].includes(goal.status?.toLowerCase()); // UPDATED: Exclude "reopened"

  const canRequestReactivation =
    isCreator &&
    !isMonitoringMode &&
    !hasPendingReactivationRequest &&
    goal.status === "closed";

  // Button text prioritizes completion when progress = 100
  const getApprovalButtonText = () => {
    if (canAutoCompletePremature) return "Complete Goal";
    if (canAutoClosePremature) return "Close Goal";
    if (canReopenOrgGoal) return "Request Reopen";
    if (hasPendingClosureRequest) return "Closure Pending";
    if (hasPendingReactivationRequest) return "Reactivation Pending";
    if (hasPendingApproval) return "Approval Pending";
    if (canRequestCompletion) return "Request Completion";
    if (canRequestClosureForReopened) return "Request Closure"; // NEW: For reopened+overdue
    if (canRequestClosure) return "Request Closure";
    if (canRequestReactivation) return "Request Reactivation";
    if (canRequestReopening) return "Request Reopening";
    if (canRequestAcknowledgment) return "Request Acknowledgment";
    if (isUserAcknowledged) return "Acknowledged";
    if (goal.status === "pending") return "Awaiting Activation";
    if (goal.status === "completed") return "Completed";
    if (goal.status === "closed") return "Goal Closed";
    return "Complete Tasks First";
  };

  const getButtonVariant = () => {
    if (canAutoCompletePremature) return "btn-success";
    if (canAutoClosePremature) return "btn-danger";
    if (canReopenOrgGoal) return "btn-warning";
    if (hasPendingClosureRequest || hasPendingReactivationRequest)
      return "btn-warning";
    if (hasPendingApproval) return "btn-warning";
    if (canRequestCompletion || canRequestAcknowledgment) return "btn-success";
    if (
      canRequestClosureForReopened ||
      canRequestClosure ||
      canRequestReactivation
    )
      return "btn-danger"; // UPDATED
    if (canRequestReopening) return "btn-danger";
    if (isUserAcknowledged) return "btn-outline-success";
    return "btn-outline-secondary";
  };

  const isApprovalButtonEnabled =
    canAutoCompletePremature ||
    canAutoClosePremature ||
    canReopenOrgGoal ||
    canRequestCompletion ||
    canRequestClosureForReopened || // ADDED
    canRequestReopening ||
    canRequestAcknowledgment ||
    canRequestClosure ||
    canRequestReactivation ||
    hasPendingClosureRequest ||
    hasPendingReactivationRequest;

  const shouldShowApprovalButton =
    isApprovalButtonEnabled ||
    hasPendingApproval ||
    hasPendingClosureRequest ||
    hasPendingReactivationRequest ||
    isUserAcknowledged;

  // Only show approval button for org goals if user can manage them
  const shouldShowApprovalButtonForOrgGoal =
    !isOrgGoal || (isOrgGoal && canManageOrgGoal);

  const handleApprovalClick = () => {
    if (canAutoCompletePremature) {
      onRequestApproval?.("completion");
    } else if (canAutoClosePremature) {
      onRequestApproval?.("closure");
    } else if (canReopenOrgGoal) {
      onRequestApproval?.("reactivation");
    } else if (canRequestCompletion) {
      onRequestApproval?.("completion");
    } else if (canRequestClosureForReopened) {
      onRequestApproval?.("closure");
    } else if (canRequestClosure) {
      onRequestApproval?.("closure");
    } else if (canRequestReactivation) {
      onRequestApproval?.("reactivation");
    } else if (canRequestReopening) {
      onRequestApproval?.("reopening");
    } else if (canRequestAcknowledgment) {
      onRequestApproval?.("task_acknowledgment");
    } else {
      onRequestApproval?.("completion");
    }
  };

  return (
    <div
      className="card mb-3"
      style={{
        border: "1px solid #dee2e6",
        borderRadius: "0.75rem",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
      }}
    >
      <div className="card-body" style={{ padding: "1.25rem" }}>
        <div className="row">
          {/* Left Section - Title, Progress, Actions */}
          <div className="col-lg-7 col-md-12">
            {/* Badges */}
            <div className="d-flex gap-2 flex-wrap align-items-center mb-3">
              <GoalTypeBadge type={goal.goalType} />
              {isEmployeeAssignee ? (
                <TaskStatusBadge
                  progress={personalProgress}
                  hasPendingApproval={goal.hasPendingApproval || false}
                  isAcknowledged={isUserAcknowledged || false}
                />
              ) : (
                <GoalStatusBadge status={goal.status} />
              )}
              {overdueStatus && (
                <span className="badge bg-danger">
                  <i className="bi bi-exclamation-triangle-fill me-1"></i>
                  Overdue
                </span>
              )}
            </div>

            {/* Title */}
            <h4
              className="mb-3"
              style={{
                fontWeight: 700,
                color: "#212529",
              }}
            >
              {goal.title}
            </h4>

            {/* Progress Section */}
            <div className="mb-3">
              {isEmployeeAssignee ? (
                <>
                  <GoalProgress
                    progress={personalProgress}
                    size="md"
                    label="Your Personal Progress"
                    showPercentage={true}
                    variant="info"
                  />
                  <div style={{ marginTop: "0.5rem" }}>
                    <GoalProgress
                      progress={progress}
                      size="sm"
                      label="Overall Goal Progress"
                      showPercentage={true}
                    />
                  </div>
                </>
              ) : (
                <>
                  {isTeamGoal &&
                  isCreator &&
                  goal.cascadingProgress !== undefined ? (
                    <>
                      <GoalProgress
                        progress={goal.teamProgress || 0}
                        size="md"
                        label="Team Progress"
                        showPercentage={true}
                        variant="info"
                      />
                      <div style={{ marginTop: "0.5rem" }}>
                        <GoalProgress
                          progress={goal.cascadingProgress || 0}
                          size="md"
                          label="Overall Progress (Cascading)"
                          showPercentage={true}
                        />
                      </div>
                    </>
                  ) : (
                    <GoalProgress
                      progress={progress}
                      size="md"
                      label="Progress"
                      showPercentage={true}
                    />
                  )}
                </>
              )}
            </div>

            {/* Team Members (for team goals) */}
            {isTeamGoal && goal.assignees && goal.assignees.length > 0 && (
              <div className="mb-3">
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#6c757d",
                    marginBottom: "0.5rem",
                  }}
                >
                  Team Members ({goal.assignees.length})
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {goal.assignees.slice(0, 3).map((assignee, index) => (
                    <div
                      key={index}
                      className="badge bg-light text-dark"
                      style={{
                        padding: "0.35rem 0.5rem",
                        fontSize: "0.8rem",
                        fontWeight: 500,
                        border: "1px solid #dee2e6",
                      }}
                    >
                      <i className="bi bi-person me-1"></i>
                      {assignee.name}
                      {assignee.isAcknowledged && (
                        <i className="bi bi-check-circle-fill ms-1 text-success"></i>
                      )}
                    </div>
                  ))}
                  {goal.assignees.length > 3 && (
                    <div
                      className="badge bg-light text-dark"
                      style={{
                        padding: "0.35rem 0.5rem",
                        fontSize: "0.8rem",
                        fontWeight: 500,
                        border: "1px solid #dee2e6",
                      }}
                    >
                      +{goal.assignees.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {!isMonitoringMode && shouldShowApprovalButtonForOrgGoal && (
              <div className="d-flex gap-2 flex-wrap">
                {canEdit &&
                  isCreator &&
                  !hasPendingApproval &&
                  !(goal.goalType === "org" && user.role !== "Leadership") && (
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={onEdit}
                      title="Edit this goal"
                    >
                      <i className="bi bi-pencil me-1"></i>
                      Edit
                    </button>
                  )}
                {canAssign && (
                  <button
                    className="btn btn-sm btn-outline-info"
                    onClick={onAssign}
                  >
                    <i className="bi bi-person-plus me-1"></i>
                    Assign
                  </button>
                )}

                {onRequestApproval &&
                  (shouldShowApprovalButton ||
                    canAutoClosePremature ||
                    canAutoCompletePremature ||
                    canReopenOrgGoal) && (
                    <button
                      className={`btn btn-sm ${getButtonVariant()}`}
                      onClick={
                        hasPendingApproval ||
                        hasPendingClosureRequest ||
                        hasPendingReactivationRequest ||
                        isUserAcknowledged
                          ? undefined
                          : handleApprovalClick
                      }
                      disabled={
                        hasPendingApproval ||
                        hasPendingClosureRequest ||
                        hasPendingReactivationRequest ||
                        isUserAcknowledged
                      }
                      style={{
                        cursor:
                          hasPendingApproval ||
                          hasPendingClosureRequest ||
                          hasPendingReactivationRequest ||
                          isUserAcknowledged
                            ? "not-allowed"
                            : "pointer",
                      }}
                      title={
                        canAutoCompletePremature
                          ? "Complete this org goal (auto-approved as Leadership)"
                          : canAutoClosePremature
                          ? "Close this org goal (auto-approved as Leadership)"
                          : canReopenOrgGoal
                          ? "Reopen this completed org goal"
                          : hasPendingClosureRequest
                          ? "Your closure request is being reviewed by your manager"
                          : hasPendingReactivationRequest
                          ? "Your reactivation request is being reviewed by your manager"
                          : canRequestClosure
                          ? relevantProgress === 100
                            ? "Request closure approval from your manager"
                            : "Request early closure - goal will not be marked complete"
                          : canRequestClosureForReopened
                          ? "This goal was reopened but missed the new deadline. Request closure."
                          : canRequestReactivation
                          ? "Request reactivation of this closed goal"
                          : hasPendingApproval
                          ? "Your approval request is being reviewed"
                          : isUserAcknowledged
                          ? "Your tasks have been acknowledged"
                          : canRequestReopening
                          ? "This goal is overdue. Click to request reopening with new deadline."
                          : canRequestAcknowledgment
                          ? "You've completed all tasks. Request acknowledgment."
                          : "Click to request approval"
                      }
                    >
                      <i
                        className={`bi ${
                          canAutoCompletePremature
                            ? "bi-check-circle"
                            : canAutoClosePremature
                            ? "bi-x-circle"
                            : canReopenOrgGoal
                            ? "bi-arrow-repeat"
                            : hasPendingClosureRequest ||
                              hasPendingReactivationRequest
                            ? "bi-hourglass-split"
                            : canRequestCompletion
                            ? "bi-check-circle"
                            : canRequestClosureForReopened
                            ? "bi-x-circle"
                            : canRequestClosure
                            ? "bi-x-circle"
                            : canRequestReactivation
                            ? "bi-arrow-repeat"
                            : hasPendingApproval
                            ? "bi-hourglass-split"
                            : isUserAcknowledged
                            ? "bi-check-circle-fill"
                            : canRequestReopening
                            ? "bi-arrow-clockwise"
                            : "bi-hand-thumbs-up"
                        } me-1`}
                      ></i>
                      {getApprovalButtonText()}
                    </button>
                  )}
              </div>
            )}
          </div>

          {/* Right Section - Details */}
          <div className="col-lg-5 col-md-12">
            <div
              className="ps-lg-4 pt-3 pt-lg-0"
              style={{
                borderLeft:
                  window.innerWidth >= 992 ? "1px solid #dee2e6" : "none",
                marginLeft: "5rem",
              }}
            >
              <h6
                className="text-muted mb-3"
                style={{ fontSize: "0.85rem", fontWeight: 600 }}
              >
                GOAL DETAILS
              </h6>
              <br />
              <div
                className="d-flex flex-column gap-2"
                style={{
                  marginLeft: "9rem",
                }}
              >
                <div className="d-flex">
                  <div
                    style={{
                      flex: "0 0 40%",
                      fontSize: "0.85rem",
                      color: "#6c757d",
                      paddingRight: "0.5rem",
                      textAlign: "left",
                    }}
                  >
                    Creator
                  </div>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 500,
                      flex: 1,
                      textAlign: "left",
                    }}
                  >
                    <i
                      className="bi bi-person-circle me-1"
                      style={{ color: "#97247E", fontSize: "0.85rem" }}
                    ></i>
                    {goal.createdByName}
                  </div>
                </div>

                {goal.projectName && (
                  <div className="d-flex">
                    <div
                      style={{
                        flex: "0 0 40%",
                        fontSize: "0.85rem",
                        color: "#6c757d",
                        paddingRight: "0.5rem",
                        textAlign: "left",
                      }}
                    >
                      Project
                    </div>
                    <div
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: 500,
                        flex: 1,
                        textAlign: "left",
                      }}
                    >
                      <i
                        className="bi bi-folder me-1"
                        style={{ color: "#0dcaf0", fontSize: "0.85rem" }}
                      ></i>
                      {goal.projectName}
                    </div>
                  </div>
                )}

                <div className="d-flex">
                  <div
                    style={{
                      flex: "0 0 40%",
                      fontSize: "0.85rem",
                      color: "#6c757d",
                      paddingRight: "0.5rem",
                      textAlign: "left",
                    }}
                  >
                    Created On
                  </div>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 500,
                      flex: 1,
                      textAlign: "left",
                    }}
                  >
                    <i
                      className="bi bi-calendar-plus me-1"
                      style={{ color: "#0d6efd", fontSize: "0.85rem" }}
                    ></i>
                    {formatDate(goal.createdAt)}
                  </div>
                </div>

                <div className="d-flex">
                  <div
                    style={{
                      flex: "0 0 40%",
                      fontSize: "0.85rem",
                      color: "#6c757d",
                      paddingRight: "0.5rem",
                      textAlign: "left",
                    }}
                  >
                    Deadline
                  </div>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 500,
                      color: overdueStatus ? "#dc3545" : "inherit",
                      flex: 1,
                      textAlign: "left",
                    }}
                  >
                    <i
                      className="bi bi-calendar-check me-1"
                      style={{
                        color: overdueStatus ? "#dc3545" : "#28a745",
                        fontSize: "0.85rem",
                      }}
                    ></i>
                    {formatDate(goal.endAt)}
                  </div>
                </div>

                <div className="d-flex">
                  <div
                    style={{
                      flex: "0 0 40%",
                      fontSize: "0.85rem",
                      color: "#6c757d",
                      paddingRight: "0.5rem",
                      textAlign: "left",
                    }}
                  >
                    Time Remaining
                  </div>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 500,
                      color: daysUntil <= 7 ? "#dc3545" : "inherit",
                      flex: 1,
                      textAlign: "left",
                    }}
                  >
                    <i
                      className="bi bi-hourglass-split me-1"
                      style={{
                        color: daysUntil <= 7 ? "#dc3545" : "#6c757d",
                        fontSize: "0.85rem",
                      }}
                    ></i>
                    {overdueStatus
                      ? "Overdue"
                      : daysUntil === 0
                      ? "Due Today"
                      : daysUntil === 1
                      ? "1 Day"
                      : `${daysUntil} Days`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalDetailsHeader;
