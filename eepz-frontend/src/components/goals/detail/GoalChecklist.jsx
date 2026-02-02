// GoalChecklist
import { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/auth/AuthContext";
import goalService from "../../../services/goals/goalService";
import Alert from "../common/Alert";
import ConfirmationModal from "../modals/ConfirmationModal";
import { isOverdue } from "../../../utils/goals/goalHelpers";
import styles from "../../../styles/goals/components/GoalChecklist.module.css";

const GoalChecklist = ({
  goal,
  onUpdate,
  onProgressChange,
  onRequestApproval,
  onPersonalProgressChange,
}) => {
  const { user } = useAuth();
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [editingDescription, setEditingDescription] = useState(false);
  const [description, setDescription] = useState(goal.description || "");
  const [checklist, setChecklist] = useState([]);
  const [progress, setProgress] = useState(0);
  const [hasPendingApproval, setHasPendingApproval] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingToggle, setPendingToggle] = useState(null);

  const isCreator = goal.createdByEmployeeMasterId === user.empMasterId;
  const isTeamGoal = goal.goalType === "team";
  const isAssignee = goal.assignees?.some(
    (a) => a.employeeMasterId === user.empMasterId
  );

  const isManagerOrDeptHead =
    user.role === "Manager" || user.role === "Department Head";

  const isLeadership = user.role === "Leadership";
  const isLeadershipMonitoring = isLeadership && isTeamGoal;

  const canViewAsManager =
    ((isManagerOrDeptHead || isLeadershipMonitoring) &&
      isTeamGoal &&
      !isCreator &&
      !isAssignee) ||
    false;

  useEffect(() => {
    const loadGoalData = async () => {
      try {
        const response = await goalService.getGoal(goal.goalId);
        const freshGoal = response.data;

        setChecklist(freshGoal.checklist || []);
        setDescription(freshGoal.description || "");
        setProgress(freshGoal.progressPercent || 0);

        await checkPendingApproval();

        if (onProgressChange) {
          onProgressChange(freshGoal.progressPercent || 0);
        }

        if (onPersonalProgressChange && freshGoal.checklist) {
          const userItems = freshGoal.checklist.filter(
            (item) => item.addedForEmployeeMasterId === user.empMasterId
          );
          const userCompleted = userItems.filter(
            (item) => item.isCompletedForCurrentUser
          );
          const personalProgress =
            userItems.length > 0
              ? Math.round((userCompleted.length / userItems.length) * 100)
              : 0;
          onPersonalProgressChange(personalProgress);
        }
      } catch (error) {
        setChecklist(goal.checklist || []);
        setDescription(goal.description || "");
        setProgress(goal.progressPercent || 0);
      } finally {
        setInitialLoading(false);
      }
    };

    loadGoalData();
  }, [goal.goalId]);

  useEffect(() => {
    if (!initialLoading) {
      setChecklist(goal.checklist || []);
      setDescription(goal.description || "");
      setProgress(goal.progressPercent || 0);

      if (onProgressChange) {
        onProgressChange(goal.progressPercent || 0);
      }

      if (onPersonalProgressChange && goal.checklist) {
        const userItems = goal.checklist.filter(
          (item) => item.addedForEmployeeMasterId === user.empMasterId
        );
        const userCompleted = userItems.filter(
          (item) => item.isCompletedForCurrentUser
        );
        const personalProgress =
          userItems.length > 0
            ? Math.round((userCompleted.length / userItems.length) * 100)
            : 0;
        onPersonalProgressChange(personalProgress);
      }
    }
  }, [goal.checklist, goal.progressPercent, initialLoading]);

  const checkPendingApproval = async () => {
    try {
      const response = await goalService.getMyApprovals({
        goalId: goal.goalId,
        approvalType: "completion",
        status: "pending",
      });

      const userId = response.metadata?.userId;

      const hasPending =
        response.data?.items?.some(
          (item) =>
            item.approvalStatus === "pending" &&
            item.requestedByEmployeeMasterId === userId
        ) || false;

      setHasPendingApproval(hasPending);
    } catch (error) {
      console.error("Failed to check pending approvals:", error);
      setHasPendingApproval(false);
    }
  };

  const checkUserAcknowledgment = () => {
    if (!isTeamGoal || !isAssignee || isCreator) return false;

    const userAssignee = goal.assignees?.find(
      (a) => a.employeeMasterId === user.empMasterId
    );

    return userAssignee?.isAcknowledged || false;
  };

  const isUserAcknowledged = checkUserAcknowledgment();

  const groupChecklistByAssignee = () => {
    if (!checklist || checklist.length === 0) return {};

    const grouped = {};

    const assigneeMap = {};
    if (goal.assignees) {
      goal.assignees.forEach((assignee) => {
        assigneeMap[assignee.employeeMasterId] = assignee;
      });
    }

    checklist.forEach((item) => {
      const assigneeId = item.addedForEmployeeMasterId;

      const assigneeInfo = assigneeMap[assigneeId];
      const assigneeName = assigneeInfo?.name || "Unassigned";

      if (!grouped[assigneeId]) {
        grouped[assigneeId] = {
          name: assigneeName,
          items: [],
          isCurrentUser: assigneeId === user.empMasterId,
        };
      }
      grouped[assigneeId].items.push(item);
    });

    return grouped;
  };

  const getDisplayedChecklist = () => {
    const items = checklist || [];

    if (items.length === 0) {
      return {};
    }

    if (!isTeamGoal) {
      return { ungrouped: items };
    }

    const grouped = groupChecklistByAssignee();

    if (isCreator) {
      return grouped;
    }

    if (canViewAsManager) {
      return grouped;
    }

    if (isAssignee) {
      if (user.role !== "Employee") {
        return grouped;
      }

      const userGroup = grouped[user.empMasterId];
      if (userGroup && userGroup.items.length > 0) {
        return { [user.empMasterId]: userGroup };
      }
    }

    return {};
  };

  const handleToggleClick = (checklistId, currentStatus, itemTitle) => {
    if (
      hasPendingApproval ||
      isCompleted ||
      isGoalOverdue ||
      isUserAcknowledged ||
      !canEditOrgGoal ||
      canViewAsManager
    ) {
      return;
    }

    setPendingToggle({ checklistId, currentStatus, itemTitle });
    setShowConfirmModal(true);
  };

  const handleConfirmToggle = async () => {
    if (!pendingToggle) return;

    const { checklistId, currentStatus } = pendingToggle;
    setShowConfirmModal(false);

    const updatedChecklist = checklist.map((item) =>
      item.checklistId === checklistId
        ? { ...item, isCompletedForCurrentUser: !currentStatus }
        : item
    );

    setChecklist(updatedChecklist);

    const completed = updatedChecklist.filter(
      (item) => item.isCompletedForCurrentUser
    ).length;
    const total = updatedChecklist.length;
    const newProgress = total > 0 ? Math.round((completed / total) * 100) : 0;

    setProgress(newProgress);

    if (onProgressChange) {
      onProgressChange(newProgress);
    }

    if (onPersonalProgressChange) {
      const userItems = updatedChecklist.filter(
        (item) => item.addedForEmployeeMasterId === user.empMasterId
      );
      const userCompleted = userItems.filter(
        (item) => item.isCompletedForCurrentUser
      );
      const personalProgress =
        userItems.length > 0
          ? Math.round((userCompleted.length / userItems.length) * 100)
          : 0;
      onPersonalProgressChange(personalProgress);
    }

    setLoading(true);
    setAlert(null);

    try {
      await goalService.toggleChecklist(
        goal.goalId,
        checklistId,
        !currentStatus
      );
      setPendingToggle(null);

      await checkPendingApproval();
    } catch (error) {
      setChecklist(goal.checklist || []);
      setProgress(goal.progressPercent || 0);
      if (onProgressChange) {
        onProgressChange(goal.progressPercent || 0);
      }
      setAlert({
        type: "danger",
        message: error.response?.data?.message || "Failed to update checklist",
      });
      setPendingToggle(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelToggle = () => {
    setShowConfirmModal(false);
    setPendingToggle(null);
  };

  const handleDescriptionSave = async () => {
    if (
      hasPendingApproval ||
      isCompleted ||
      isUserAcknowledged ||
      !canEditOrgGoal ||
      canViewAsManager
    ) {
      return;
    }

    setLoading(true);
    setAlert(null);

    try {
      await goalService.updateGoal(goal.goalId, { description });
      setEditingDescription(false);
      if (onUpdate) await onUpdate();
      setAlert({
        type: "success",
        message: "Description updated successfully",
      });
    } catch (error) {
      setAlert({
        type: "danger",
        message:
          error.response?.data?.message || "Failed to update description",
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2 text-muted">Loading checklist...</p>
      </div>
    );
  }

  const isCompleted = ["completed", "closed", "cancelled"].includes(
    goal.status?.toLowerCase()
  );

  const isGoalOverdue = isOverdue(goal.endAt);

  const isOrgGoal = goal.goalType === "org";
  const canEditOrgGoal = !isOrgGoal || user.role === "Leadership";

  const canEdit =
    !hasPendingApproval &&
    !isCompleted &&
    !isUserAcknowledged &&
    !isGoalOverdue &&
    canEditOrgGoal &&
    !canViewAsManager;

  const displayedChecklist = getDisplayedChecklist();
  const isGrouped =
    isTeamGoal &&
    Object.keys(displayedChecklist).length > 0 &&
    !displayedChecklist.ungrouped;

  const totalDisplayedItems = isGrouped
    ? Object.values(displayedChecklist).reduce(
        (sum, group) => sum + group.items.length,
        0
      )
    : checklist.length;

  const completedDisplayedItems = isGrouped
    ? Object.values(displayedChecklist).reduce(
        (sum, group) =>
          sum +
          group.items.filter((item) => item.isCompletedForCurrentUser).length,
        0
      )
    : checklist.filter((item) => item.isCompletedForCurrentUser).length;

  const userItems = checklist.filter(
    (item) => item.addedForEmployeeMasterId === user.empMasterId
  );
  const userCompletedItems = userItems.filter(
    (item) => item.isCompletedForCurrentUser
  );
  const allUserTasksComplete =
    userItems.length > 0 && userCompletedItems.length === userItems.length;

  return (
    <div>
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {isGoalOverdue && !isCompleted && (
        <div className={`alert alert-danger mb-4 ${styles.alert}`}>
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <strong>Goal Overdue:</strong> This goal has passed its deadline.
          Checklist and description are locked. Request reopening to extend the
          deadline.
        </div>
      )}

      {hasPendingApproval && !isCompleted && (
        <div className={`alert alert-warning mb-4 ${styles.alert}`}>
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <strong>Approval Pending:</strong> This goal has a pending completion
          approval. Checklist and description cannot be modified until the
          approval is processed.
        </div>
      )}

      {isUserAcknowledged && !isCompleted && (
        <div className={`alert alert-success mb-4 ${styles.alert}`}>
          <i className="bi bi-check-circle-fill me-2"></i>
          <strong>Tasks Acknowledged!</strong> Your manager has acknowledged
          your completed tasks. The checklist is now locked. Contact your
          manager if changes are needed.
        </div>
      )}

      {canViewAsManager && (
        <div className={`alert alert-info mb-4 ${styles.alert}`}>
          <i className="bi bi-eye-fill me-2"></i>
          <strong>Monitoring View</strong>
        </div>
      )}

      {isOrgGoal && user.role !== "Leadership" && (
        <div className={`alert alert-info mb-4 ${styles.alert}`}>
          <i className="bi bi-info-circle-fill me-2"></i>
          <strong>Organization Goal:</strong> This is a company-wide goal. Only
          Leadership can modify it.
        </div>
      )}

      {/* Description Section */}
      <div
        className={`goal-card-header d-flex justify-content-between align-items-center ${styles.descriptionHeader}`}
      >
        <div>
          <i className="bi bi-file-text me-2"></i>
          Description
          {(hasPendingApproval ||
            isCompleted ||
            isUserAcknowledged ||
            isGoalOverdue ||
            canViewAsManager) && (
            <span
              className={`badge bg-secondary text-white ms-2 ${styles.badgeLocked}`}
            >
              <i className="bi bi-lock-fill me-1"></i>
              {isCompleted
                ? "View Only"
                : isGoalOverdue
                ? "Overdue"
                : isUserAcknowledged
                ? "Acknowledged"
                : canViewAsManager
                ? "Monitoring"
                : "Locked"}
            </span>
          )}
        </div>
        {!editingDescription && canEdit && (
          <button
            className="btn btn-sm"
            onClick={() => setEditingDescription(true)}
            style={{ fontSize: "1.5rem", color: "white" }}
          >
            <i className="bi bi-pencil me-1"></i>
          </button>
        )}
      </div>
      <div className={`card-body mb-4 ${styles.descriptionBody}`}>
        {editingDescription ? (
          <>
            <textarea
              className={`form-control mb-3 ${styles.descriptionTextarea}`}
              rows="4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              placeholder="Enter goal description..."
            />
            <div className="d-flex gap-2">
              <button
                className="btn"
                style={{
                  background:
                    "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
                  color: "white",
                }}
                onClick={handleDescriptionSave}
                disabled={loading}
              >
                <i className="bi bi-check-lg me-1"></i>
                Save
              </button>
              <button
                className="btn btn-outline-secondary"
                onClick={() => {
                  setEditingDescription(false);
                  setDescription(goal.description || "");
                }}
                disabled={loading}
              >
                <i className="bi bi-x-lg me-1"></i>
                Cancel
              </button>
            </div>
          </>
        ) : (
          <p className={styles.descriptionText}>
            {goal.description || "No description provided"}
          </p>
        )}
      </div>

      {/* Checklist */}
      <div className={`goal-card-header ${styles.checklistHeader}`}>
        <i className="bi bi-list-check me-2"></i>
        Checklist ({completedDisplayedItems}/{totalDisplayedItems})
        {(hasPendingApproval ||
          isCompleted ||
          isUserAcknowledged ||
          isGoalOverdue ||
          canViewAsManager) && (
          <span
            className={`badge bg-secondary text-white ms-2 ${styles.badgeLockedSm}`}
          >
            <i className="bi bi-lock-fill me-1"></i>
            {isCompleted
              ? "View Only"
              : isGoalOverdue
              ? "Overdue"
              : isUserAcknowledged
              ? "Acknowledged"
              : canViewAsManager
              ? "Monitoring"
              : "Locked"}
          </span>
        )}
      </div>
      <div className={`card-body ${styles.checklistBody}`}>
        {totalDisplayedItems === 0 ? (
          <div className={styles.emptyState}>
            <i
              className="bi bi-inbox"
              style={{ fontSize: "3rem", opacity: 0.3 }}
            ></i>
            <p className="mt-3 mb-0" style={{ fontWeight: 500 }}>
              No checklist items
            </p>
            <p className="text-muted small mb-0">
              Add items to track your progress
            </p>
          </div>
        ) : isGrouped ? (
          Object.entries(displayedChecklist).map(([assigneeId, group]) => (
            <div key={assigneeId} className="mb-3">
              <div
                className={`${styles.groupHeader} ${
                  group.isCurrentUser ? styles.currentUserHeader : ""
                }`}
              >
                <i
                  className={`bi ${
                    group.isCurrentUser ? "bi-person-fill" : "bi-person-badge"
                  } text-primary`}
                ></i>
                <span className="fw-semibold">
                  {group.isCurrentUser ? "Your Tasks" : `${group.name}'s Tasks`}
                </span>
                <span className="badge bg-secondary ms-auto">
                  {
                    group.items.filter((i) => i.isCompletedForCurrentUser)
                      .length
                  }
                  /{group.items.length}
                </span>
              </div>

              <ul className="list-group">
                {group.items
                  .sort(
                    (a, b) =>
                      (a.isCompletedForCurrentUser ? 1 : 0) -
                      (b.isCompletedForCurrentUser ? 1 : 0)
                  )
                  .map((item, index) => (
                    <ChecklistItem
                      key={item.checklistId || index}
                      item={item}
                      isDisabled={
                        loading ||
                        hasPendingApproval ||
                        isCompleted ||
                        isUserAcknowledged ||
                        isGoalOverdue ||
                        !canEditOrgGoal ||
                        canViewAsManager ||
                        !group.isCurrentUser
                      }
                      onToggle={handleToggleClick}
                    />
                  ))}
              </ul>
            </div>
          ))
        ) : (
          <ul className="list-group list-group-flush">
            {(displayedChecklist.ungrouped || checklist).map((item, index) => (
              <ChecklistItem
                key={item.checklistId || index}
                item={item}
                isDisabled={
                  loading ||
                  hasPendingApproval ||
                  isCompleted ||
                  isUserAcknowledged ||
                  isGoalOverdue ||
                  !canEditOrgGoal ||
                  canViewAsManager
                }
                onToggle={handleToggleClick}
                isLast={index === checklist.length - 1}
              />
            ))}
          </ul>
        )}
      </div>

      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={handleCancelToggle}
        onConfirm={handleConfirmToggle}
        title={
          pendingToggle?.currentStatus
            ? "Mark as Incomplete?"
            : "Mark as Complete?"
        }
        message={
          pendingToggle?.currentStatus
            ? `Are you sure you want to mark "${pendingToggle?.itemTitle}" as incomplete?`
            : `Are you sure you want to mark "${pendingToggle?.itemTitle}" as complete?`
        }
        confirmText={
          pendingToggle?.currentStatus ? "Mark Incomplete" : "Mark Complete"
        }
        cancelText="Cancel"
        confirmVariant={pendingToggle?.currentStatus ? "warning" : "success"}
      />
    </div>
  );
};

const ChecklistItem = ({ item, isDisabled, onToggle, isLast = false }) => {
  const isItemCompleted = Boolean(item.isCompletedForCurrentUser);

  return (
    <li
      className={`list-group-item ${styles.checklistItem} ${
        isItemCompleted ? styles.completed : ""
      } ${isDisabled ? styles.disabled : ""} ${isLast ? "" : styles.notLast}`}
      onClick={() =>
        !isDisabled && onToggle(item.checklistId, isItemCompleted, item.title)
      }
    >
      <div className="d-flex align-items-center gap-3">
        <div className={styles.checkboxWrapper}>
          <div
            className={`${styles.checkbox} ${
              isItemCompleted ? styles.checked : ""
            } ${isDisabled ? styles.disabledCheckbox : ""}`}
          >
            {isItemCompleted && (
              <i
                className="bi bi-check-lg"
                style={{
                  color: "#fff",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              ></i>
            )}
          </div>
        </div>

        <div className={styles.content}>
          <div
            className={`${styles.title} ${
              isItemCompleted ? styles.strikethrough : ""
            }`}
          >
            {item.title}
          </div>

          {item.description && (
            <div
              className={`${styles.description} ${
                isItemCompleted ? styles.strikethrough : ""
              }`}
            >
              {item.description}
            </div>
          )}
        </div>

        {isItemCompleted && (
          <span className={`${styles.doneBadge}`}>
            <i className="bi bi-check-circle-fill me-1"></i>
            Done
          </span>
        )}
      </div>
    </li>
  );
};

export default GoalChecklist;
