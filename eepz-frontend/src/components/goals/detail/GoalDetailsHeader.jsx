// GoalDetailsHeader.jsx
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
import styles from "../../../styles/goals/components/GoalDetailsHeader.module.css";

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

  const isCompleted = ["completed", "closed", "cancelled"].includes(
    goal.status?.toLowerCase()
  );

  const isOrgGoal = goal.goalType === "org";
  const isLeadershipOrgGoal = isOrgGoal && isLeadership;

  const canManageOrgGoal = isOrgGoal && (isCreator || isLeadership);

  const canAutoClosePremature =
    isLeadershipOrgGoal &&
    !isCompleted &&
    !hasPendingClosureRequest &&
    goal.status !== "closed" &&
    ["open", "reopened"].includes(goal.status?.toLowerCase());

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

  const canRequestReopening =
    isCreator &&
    !isMonitoringMode &&
    !hasPendingReactivationRequest &&
    isGoalOverdue &&
    goal.status !== "reopened" &&
    !["closed", "cancelled"].includes(goal.status?.toLowerCase());

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

  const canRequestClosureForReopened =
    !isLeadershipOrgGoal &&
    isCreator &&
    !isMonitoringMode &&
    !hasPendingClosureRequest &&
    isGoalOverdue &&
    goal.status === "reopened";

  const canRequestClosure =
    !isLeadershipOrgGoal &&
    isCreator &&
    !isMonitoringMode &&
    !hasPendingClosureRequest &&
    !isGoalOverdue &&
    ["open", "inprogress", "reopened"].includes(goal.status?.toLowerCase());

  const canRequestReactivation =
    isCreator &&
    !isMonitoringMode &&
    !hasPendingReactivationRequest &&
    goal.status === "closed";

  const getApprovalButtonText = () => {
    if (canAutoCompletePremature) return "Complete Goal";
    if (canAutoClosePremature) return "Close Goal";
    if (canReopenOrgGoal) return "Request Reopen";
    if (hasPendingClosureRequest) return "Closure Pending";
    if (hasPendingReactivationRequest) return "Reactivation Pending";
    if (hasPendingApproval) return "Approval Pending";
    if (canRequestCompletion) return "Request Completion";
    if (canRequestClosureForReopened) return "Request Closure";
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
      return "btn-danger";
    if (canRequestReopening) return "btn-danger";
    if (isUserAcknowledged) return "btn-outline-success";
    return "btn-outline-secondary";
  };

  const isApprovalButtonEnabled =
    canAutoCompletePremature ||
    canAutoClosePremature ||
    canReopenOrgGoal ||
    canRequestCompletion ||
    canRequestClosureForReopened ||
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
    <div className={`card d-flex mb-3 ${styles.card}`}>
      <div className={`card-body ${styles.cardBody}`}>
        <div className="row">
          {/* Left Section - Title, Progress, Actions */}
          <div className="col-lg-7 col-md-12">
            {/* Badges */}
            <div
              className={`d-flex gap-2 flex-wrap align-items-center mb-3 ${styles.badges}`}
            >
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
                <span className={`badge bg-danger ${styles.overdueBadge}`}>
                  <i className="bi bi-exclamation-triangle-fill me-1"></i>
                  Overdue
                </span>
              )}
            </div>

            {/* Title */}
            <h4 className={`mb-3 ${styles.title}`}>{goal.title}</h4>

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
                  <div className={styles.progressGap}>
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
                      <div className={styles.progressGap}>
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
              <div className={`mb-3 ${styles.teamSection}`}>
                <div className={styles.teamLabel}>
                  Team Members ({goal.assignees.length})
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {goal.assignees.slice(0, 3).map((assignee, index) => (
                    <div
                      key={index}
                      className={`badge bg-light text-dark ${styles.teamBadge}`}
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
                      className={`badge bg-light text-dark ${styles.teamBadge}`}
                    >
                      +{goal.assignees.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {!isMonitoringMode && shouldShowApprovalButtonForOrgGoal && (
              <div className={`d-flex gap-2 flex-wrap ${styles.actionButtons}`}>
                {canEdit &&
                  isCreator &&
                  !hasPendingApproval &&
                  !(goal.goalType === "org" && user.role !== "Leadership") && (
                    <button
                      className="btn btn-sm btn-primary"
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
                      className={`btn btn-sm ${getButtonVariant()} ${
                        styles.approvalButton
                      }`}
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
            <div className={`ps-lg-4 pt-3 pt-lg-0 ${styles.detailsSection}`}>
              <h6 className={`text-muted mb-3 ${styles.detailsLabel}`}>
                GOAL DETAILS
              </h6>
              <div className={`d-flex flex-column gap-2 ${styles.detailsList}`}>
                <div className={`d-flex ${styles.detailRow}`}>
                  <div className={styles.detailLabel}>Creator</div>
                  <div className={styles.detailValue}>
                    <i className="bi bi-person-circle me-1"></i>
                    {goal.createdByName}
                  </div>
                </div>

                {goal.projectName && (
                  <div className={`d-flex ${styles.detailRow}`}>
                    <div className={styles.detailLabel}>Project</div>
                    <div className={styles.detailValue}>
                      <i className="bi bi-folder me-1"></i>
                      {goal.projectName}
                    </div>
                  </div>
                )}

                <div className={`d-flex ${styles.detailRow}`}>
                  <div className={styles.detailLabel}>Created On</div>
                  <div className={styles.detailValue}>
                    <i className="bi bi-calendar-plus me-1"></i>
                    {formatDate(goal.createdAt)}
                  </div>
                </div>

                <div className={`d-flex ${styles.detailRow}`}>
                  <div className={styles.detailLabel}>Deadline</div>
                  <div
                    className={`${styles.detailValue} ${
                      overdueStatus ? styles.overdue : ""
                    }`}
                  >
                    <i
                      className="bi bi-calendar-check me-1"
                      style={{
                        color: overdueStatus ? "#dc3545" : "#28a745",
                      }}
                    ></i>
                    {formatDate(goal.endAt)}
                  </div>
                </div>

                <div className={`d-flex ${styles.detailRow}`}>
                  <div className={styles.detailLabel}>Time Remaining</div>
                  <div
                    className={`${styles.detailValue} ${
                      daysUntil <= 7 ? styles.warning : ""
                    }`}
                  >
                    <i
                      className="bi bi-hourglass-split me-1"
                      style={{
                        color: daysUntil <= 7 ? "#dc3545" : "#6c757d",
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
