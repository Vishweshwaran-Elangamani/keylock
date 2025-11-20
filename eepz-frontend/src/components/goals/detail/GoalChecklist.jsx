import { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/auth/AuthContext";
import goalService from "../../../services/goals/goalService";
import Alert from "../common/Alert";
import ConfirmationModal from "../modals/ConfirmationModal";
import { isOverdue } from "../../../utils/goals/goalHelpers";

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

  // Determine user role and permissions
  const isCreator = goal.createdByEmployeeMasterId === user.empMasterId;
  const isTeamGoal = goal.goalType === "team";
  const isAssignee = goal.assignees?.some(
    (a) => a.employeeMasterId === user.empMasterId
  );

  // Check if user is Manager or DeptHead (view-only permission for team goals)
  const isManagerOrDeptHead =
    user.role === "Manager" || user.role === "Department Head";

  // Check if Leadership (view-only permission for team goals)
  const isLeadership = user.role === "Leadership";
  const isLeadershipMonitoring = isLeadership && isTeamGoal;

  // Combined monitoring mode
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

        // Calculate and send personal progress
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

      // Update personal progress
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

      // Check if there is at least one pending request for this user
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

  // Check if user is acknowledged
  const checkUserAcknowledgment = () => {
    if (!isTeamGoal || !isAssignee || isCreator) return false;

    const userAssignee = goal.assignees?.find(
      (a) => a.employeeMasterId === user.empMasterId
    );

    return userAssignee?.isAcknowledged || false;
  };

  const isUserAcknowledged = checkUserAcknowledgment();

  // Group checklist by assignee for team goals
  const groupChecklistByAssignee = () => {
    if (!checklist || checklist.length === 0) return {};

    const grouped = {};

    // Create a map of employeeMasterId to assignee info
    const assigneeMap = {};
    if (goal.assignees) {
      goal.assignees.forEach((assignee) => {
        assigneeMap[assignee.employeeMasterId] = assignee;
      });
    }

    checklist.forEach((item) => {
      const assigneeId = item.addedForEmployeeMasterId;

      // Look up assignee name from the assignees array
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

  // Filter checklist based on user role
  const getDisplayedChecklist = () => {
    const items = checklist || [];

    if (items.length === 0) {
      return {};
    }

    if (!isTeamGoal) {
      // Self goals - show all items (ungrouped)
      return { ungrouped: items };
    }

    const grouped = groupChecklistByAssignee();

    // Creator always sees everything
    if (isCreator) {
      return grouped;
    }

    // Leadership/Manager/DeptHead not assigned to goal sees all (read-only)
    if (canViewAsManager) {
      return grouped;
    }

    // If user is an assignee
    if (isAssignee) {
      // Managers/Leaders who are assignees see all groups
      if (user.role !== "Employee") {
        return grouped;
      }

      // Regular employees only see their own tasks
      const userGroup = grouped[user.empMasterId];
      if (userGroup && userGroup.items.length > 0) {
        return { [user.empMasterId]: userGroup };
      }
    }

    // If not creator and not assignee, or no items found, return empty
    return {};
  };

  const handleToggleClick = (checklistId, currentStatus, itemTitle) => {
    // Include canViewAsManager check
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

    // Update personal progress
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
    // Include canViewAsManager check
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

  // Check if org goal and if user can edit
  const isOrgGoal = goal.goalType === "org";
  const canEditOrgGoal = !isOrgGoal || user.role === "Leadership";

  // Include acknowledgment check AND org goal check AND canViewAsManager
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

  // Calculate total displayed items
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

  // Check if employee completed all their tasks
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

      {/* Overdue Alert */}
      {isGoalOverdue && !isCompleted && (
        <div
          className="alert alert-danger mb-4"
          style={{ borderRadius: "12px" }}
        >
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <strong>Goal Overdue:</strong> This goal has passed its deadline.
          Checklist and description are locked. Request reopening to extend the
          deadline.
        </div>
      )}

      {hasPendingApproval && !isCompleted && (
        <div
          className="alert alert-warning mb-4"
          style={{ borderRadius: "12px" }}
        >
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <strong>Approval Pending:</strong> This goal has a pending completion
          approval. Checklist and description cannot be modified until the
          approval is processed.
        </div>
      )}

      {/* Acknowledgment Notice */}
      {isUserAcknowledged && !isCompleted && (
        <div
          className="alert alert-success mb-4"
          style={{ borderRadius: "12px" }}
        >
          <i className="bi bi-check-circle-fill me-2"></i>
          <strong>Tasks Acknowledged!</strong> Your manager has acknowledged
          your completed tasks. The checklist is now locked. Contact your
          manager if changes are needed.
        </div>
      )}

      {/* Monitoring Notice for Manager/DeptHead/Leadership */}
      {canViewAsManager && (
        <div className="alert alert-info mb-4" style={{ borderRadius: "12px" }}>
          <i className="bi bi-eye-fill me-2"></i>
          <strong>Monitoring View</strong>
        </div>
      )}

      {/* Org Goal Notice for Non-Leadership */}
      {isOrgGoal && user.role !== "Leadership" && (
        <div className="alert alert-info mb-4" style={{ borderRadius: "12px" }}>
          <i className="bi bi-info-circle-fill me-2"></i>
          <strong>Organization Goal:</strong> This is a company-wide goal. Only
          Leadership can modify it.
        </div>
      )}

      {/* Description Section */}

      <div
        className="goal-card-header d-flex justify-content-between align-items-center"
        style={{
          backgroundColor: "rgb(39, 35, 92)",
          fontWeight: 600,
          fontSize: "16px",
          border: "1px solid rgba(39, 35, 92, 0.46)",
          padding: "1rem 1.25rem",
          borderRadius: "1.5rem 1.5rem 0rem 0rem",
        }}
      >
        <div style={{ color: "white" }}>
          <i className="bi bi-file-text me-2"></i>
          Description
          {/* Include acknowledgment check and canViewAsManager */}
          {(hasPendingApproval ||
            isCompleted ||
            isUserAcknowledged ||
            isGoalOverdue ||
            canViewAsManager) && (
            <span
              className="badge bg-secondary text-white ms-2"
              style={{ fontSize: "0.7rem" }}
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
      <div
        className="card-body mb-4"
        style={{
          padding: "1.25rem",
          border: "1px solid rgba(39, 35, 92, 0.46)",
          borderRadius: "0rem 0rem 1.5rem 1.5rem",
        }}
      >
        {editingDescription ? (
          <>
            <textarea
              className="form-control mb-3"
              rows="4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              placeholder="Enter goal description..."
              style={{
                fontSize: "16px",
                height: "100px",

                resize: "vertical", // allows manual resizing
                overflowWrap: "break-word", // breaks long words
                wordBreak: "break-word", // ensures wrapping
              }}
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
          <p
            style={{
              whiteSpace: "pre-wrap",
              marginBottom: 0,
              fontSize: "15px",
              lineHeight: "1.6",
              color: goal.description ? "#495057" : "#6c757d",
              fontStyle: goal.description ? "normal" : "italic",
              textAlign: "left",
              wordBreak: "break-word",
              overflowWrap: "break-word",
            }}
          >
            {goal.description || "No description provided"}
          </p>
        )}
      </div>

      {/* Checklist */}

      <div
        className="goal-card-header"
        style={{
          color: "white",
          fontWeight: 600,
          padding: "1rem 1.25rem",
          fontSize: "16px",
          backgroundColor: "rgb(39, 35, 92)",
          borderRadius: "1.5rem 1.5rem 0rem 0rem",
        }}
      >
        <i className="bi bi-list-check me-2"></i>
        Checklist ({completedDisplayedItems}/{totalDisplayedItems})
        {/* Include acknowledgment check and canViewAsManager */}
        {(hasPendingApproval ||
          isCompleted ||
          isUserAcknowledged ||
          isGoalOverdue ||
          canViewAsManager) && (
          <span
            className="badge bg-secondary text-white ms-2"
            style={{ fontSize: "0.7rem" }}
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
      <div
        className="card-body"
        style={{
          padding: "10px",
          border: "1px solid rgba(39, 35, 92, 0.46)",
          borderRadius: "0rem 0rem 1.5rem 1.5rem",
        }}
      >
        {totalDisplayedItems === 0 ? (
          <div
            style={{
              padding: "3rem 2rem",
              textAlign: "center",
              color: "#6c757d",
              backgroundColor: "#f8f9fa",
            }}
          >
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
          // Grouped display for team goals
          <div style={{ padding: "1rem" }}>
            {Object.entries(displayedChecklist).map(([assigneeId, group]) => (
              <div key={assigneeId} className="mb-3">
                <div
                  className="d-flex align-items-center gap-2 mb-2 p-2"
                  style={{
                    backgroundColor: group.isCurrentUser
                      ? "#e3f2fd"
                      : "#e9ecef",
                    borderRadius: "0.5rem",
                    border: group.isCurrentUser ? "2px solid #2196f3" : "none",
                  }}
                >
                  <i
                    className={`bi ${
                      group.isCurrentUser ? "bi-person-fill" : "bi-person-badge"
                    } text-primary`}
                  ></i>
                  <span className="fw-semibold">
                    {group.isCurrentUser
                      ? "Your Tasks"
                      : `${group.name}'s Tasks`}
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
            ))}
          </div>
        ) : (
          // Regular list for self goals
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

      {/* Confirmation Modal */}
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

// Checklist Item Component
const ChecklistItem = ({ item, isDisabled, onToggle, isLast = false }) => {
  const isItemCompleted = Boolean(item.isCompletedForCurrentUser);

  return (
    <li
      className="list-group-item"
      style={{
        padding: "1rem 1.25rem",
        cursor: isDisabled ? "not-allowed" : "pointer",
        transition: "all 0.3s ease",
        backgroundColor: isItemCompleted ? "#e8f5e9" : "#fff",
        borderBottom: !isLast ? "1px solid #e9ecef" : "none",
        borderLeft: isItemCompleted
          ? "4px solid #28a745"
          : "4px solid transparent",
        opacity: isDisabled ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.backgroundColor = isItemCompleted
            ? "#c8e6c9"
            : "#f5f5f5";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = isItemCompleted
          ? "#e8f5e9"
          : "#fff";
      }}
      onClick={() =>
        !isDisabled && onToggle(item.checklistId, isItemCompleted, item.title)
      }
    >
      <div className="d-flex align-items-center gap-3">
        <div style={{ flexShrink: 0 }}>
          <div
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "6px",
              border: `2px solid ${isItemCompleted ? "#28a745" : "#dee2e6"}`,
              backgroundColor: isItemCompleted ? "#28a745" : "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: isDisabled ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              boxShadow: isItemCompleted
                ? "0 2px 4px rgba(40, 167, 69, 0.3)"
                : "none",
            }}
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

        <div style={{ flex: 1, textAlign: "left" }}>
          <div
            style={{
              textDecoration: isItemCompleted ? "line-through" : "none",
              color: isItemCompleted ? "#6c757d" : "#212529",
              fontWeight: isItemCompleted ? 400 : 600,
              fontSize: "1.0rem",
              lineHeight: "1.5",
              marginBottom: item.description ? "0.25rem" : 0,
              opacity: isItemCompleted ? 0.7 : 1,
              transition: "all 0.3s ease",
            }}
          >
            {item.title}
          </div>

          {item.description && (
            <div
              style={{
                fontSize: "0.85rem",
                color: "#6c757d",
                lineHeight: "1.4",
                marginTop: "0.25rem",
                textDecoration: isItemCompleted ? "line-through" : "none",
                opacity: isItemCompleted ? 0.6 : 1,
              }}
            >
              {item.description}
            </div>
          )}
        </div>

        {isItemCompleted && (
          <span
            className="badge"
            style={{
              padding: "0.4rem 0.75rem",
              fontSize: "0.75rem",
              flexShrink: 0,
              backgroundColor: "#28a745",
              color: "#fff",
              fontWeight: 600,
              borderRadius: "6px",
              boxShadow: "0 2px 4px rgba(40, 167, 69, 0.2)",
            }}
          >
            <i className="bi bi-check-circle-fill me-1"></i>
            Done
          </span>
        )}
      </div>
    </li>
  );
};

export default GoalChecklist;
