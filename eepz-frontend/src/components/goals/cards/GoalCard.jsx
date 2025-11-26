import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/auth/AuthContext";
import GoalStatusBadge from "../badges/GoalStatusBadge";
import GoalTypeBadge from "../badges/GoalTypeBadge";
import TaskStatusBadge from "../badges/TaskStatusBadge";
import GoalProgress from "../forms/GoalProgress";
import {
  formatDate,
  truncateText,
  isOverdue,
  getDaysUntilDeadline,
} from "../../../utils/goals/goalHelpers";

const GoalCard = ({ goal, onComment, onAssign, showActions = true }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isCreator = goal.createdByEmployeeMasterId === user.empMasterId;
  const isAssignee = goal.assignees?.some(
    (a) => a.employeeMasterId === user.empMasterId
  );
  const canAssign = isCreator && goal.goalType === "team";

  //  NEW: Check if user is Leadership
  const isLeadership = user.role === "Leadership";
  const isOrgGoal = goal.goalType === "org";

  const showTaskStatus = !isCreator && isAssignee && goal.goalType === "team";
  const overdueStatus = isOverdue(goal.endAt) && goal.status !== "completed";
  const daysUntil = getDaysUntilDeadline(goal.endAt);

  //  NEW: Only show comment button if not org goal OR if leadership
  const canShowCommentButton = onComment && (!isOrgGoal || isLeadership);

  // Get user's acknowledgment status
  const userAssignee = goal.assignees?.find(
    (a) => a.employeeMasterId === user.empMasterId
  );
  const isUserAcknowledged =
    showTaskStatus && (userAssignee?.isAcknowledged || false);

  const getProgressColor = (progress) => {
    if (progress >= 75) return "#28a745";
    if (progress >= 50) return "#17a2b8";
    if (progress >= 25) return "#ffc107";
    return "#dc3545";
  };

  const handleCardClick = () => {
    const rolePath =
      user.role === "Employee"
        ? "employee"
        : user.role === "Leadership"
        ? "Leadership"
        : "manager";
    navigate(`/${rolePath}/goals/${goal.goalId}`);
  };

  const currentProgress = showTaskStatus
    ? goal.myProgress || 0
    : goal.progressPercent || 0;

  return (
    <div
      className="card h-100 goal-card"
      style={{
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        border: "1px solid rgba(39, 35, 92, 0.75)",
        borderRadius: "12px",
        overflow: "hidden",
        position: "relative",
        background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
        width: "100%",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.52)";
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.borderColor = "rgb(39, 35, 92)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = "rgba(39, 35, 92, 0.4)";
      }}
    >
      {/* Card Header */}
      <div
        style={{
          backgroundColor: "rgba(248, 249, 250, 0.8)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid #e9ecef",
          padding: "0.875rem 1.25rem",
        }}
      >
        <div className="d-flex justify-content-between align-items-start">
          <div className="d-flex gap-2 flex-wrap align-items-center">
            {showTaskStatus ? (
              // Show both badges for employee assignees
              <>
                <TaskStatusBadge
                  progress={goal.myProgress || 0}
                  hasPendingApproval={goal.hasPendingApproval || false}
                  isAcknowledged={isUserAcknowledged}
                  size="sm"
                />
                {!isOverdue && (
                  <GoalStatusBadge status={goal.status} size="sm" />
                )}
              </>
            ) : (
              <>
                {!isOverdue && (
                  <GoalStatusBadge status={goal.status} size="sm" />
                )}
              </>
            )}
          </div>

          {overdueStatus && (
            <span
              className="badge"
              style={{
                background: "linear-gradient(135deg, #dc3545 0%, #c82333 100%)",
                fontSize: "10px",
                fontWeight: 600,
                padding: "0.35rem 0.6rem",
                borderRadius: "6px",
                boxShadow: "0 2px 8px rgba(220, 53, 69, 0.3)",
                animation: "pulse 2s infinite",
              }}
            >
              <i className="bi bi-exclamation-triangle-fill me-1"></i>
              Overdue
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div
        className="card-body"
        style={{ padding: "1.25rem" }}
        onClick={handleCardClick}
      >
        <h6
          className="card-title mb-2"
          style={{
            fontWeight: 700,
            fontSize: "16px",
            color: "#212529",
            lineHeight: "1.4",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            minHeight: "2.8rem",
            textAlign: "left",
          }}
        >
          {goal.title}
        </h6>

        {goal.descriptionShort && (
          <p
            className="card-text mb-3"
            style={{
              fontSize: "14px",
              color: "#6c757d",
              lineHeight: "1.5",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              minHeight: "2.6rem",
              textAlign: "left",
            }}
          >
            {truncateText(goal.descriptionShort, 100)}
          </p>
        )}

        {/* Meta Info Grid */}
        <div
          className="mb-3"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.75rem",
            padding: "0.75rem",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            fontSize: "0.8rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <i
              className="bi bi-person-fill"
              style={{ fontSize: "1.1rem", color: "#0d6efd" }}
            ></i>
            <div>
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "#6c757d",
                  marginBottom: "2px",
                }}
              >
                Creator
              </div>
              <div style={{ fontWeight: 600, color: "#212529" }}>
                {truncateText(goal.createdByName || "Unknown", 15)}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <i
              className="bi bi-calendar-check-fill"
              style={{ fontSize: "1.1rem", color: "#dc3545" }}
            ></i>
            <div>
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "#6c757d",
                  marginBottom: "2px",
                }}
              >
                Deadline
              </div>
              <div style={{ fontWeight: 600, color: "#212529" }}>
                {formatDate(goal.endAt)}
              </div>
            </div>
          </div>
        </div>

        {/* Days until deadline */}
        {daysUntil !== null && !overdueStatus && goal.status != "completed" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 0.75rem",
              backgroundColor: daysUntil <= 7 ? "#fff3cd" : "#e7f3ff",
              border: `1px solid ${daysUntil <= 7 ? "#ffc107" : "#0dcaf0"}`,
              borderRadius: "6px",
              fontSize: "0.8rem",
              fontWeight: 500,
              color: daysUntil <= 7 ? "#856404" : "#0c5460",
              marginBottom: "1rem",
            }}
          >
            <i
              className={`bi ${
                daysUntil <= 7 ? "bi-alarm-fill" : "bi-hourglass-split"
              }`}
            ></i>
            <span>
              {daysUntil === 0
                ? " Due today!"
                : daysUntil === 1
                ? " Due tomorrow"
                : `${daysUntil} days remaining`}
            </span>
          </div>
        )}

        {/* Progress Section */}
        <div
          style={{
            backgroundColor: "#fff",
            padding: "0.75rem",
            borderRadius: "8px",
            border: "1px solid rgba(39, 35, 92, 0.5)",
          }}
        >
          {showTaskStatus ? (
            // Employee assignee: Show personal progress first, then overall
            <>
              {/* Personal Progress */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "#0dcaf0",
                    }}
                  >
                    MY PROGRESS
                  </span>
                  <span
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      color: getProgressColor(goal.myProgress || 0),
                    }}
                  >
                    {goal.myProgress || 0}%
                  </span>
                </div>
                <GoalProgress
                  progress={goal.myProgress || 0}
                  size="sm"
                  showLabel={false}
                  showPercentage={false}
                  color={getProgressColor(goal.myProgress || 0)}
                />
              </div>

              {/* Overall Goal Progress */}
              <div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 500,
                      color: "#6c757d",
                    }}
                  >
                    OVERALL GOAL
                  </span>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: getProgressColor(goal.progressPercent || 0),
                    }}
                  >
                    {goal.progressPercent || 0}%
                  </span>
                </div>
                <GoalProgress
                  progress={goal.progressPercent || 0}
                  size="xs"
                  showLabel={false}
                  showPercentage={false}
                  color={getProgressColor(goal.progressPercent || 0)}
                />
              </div>
            </>
          ) : (
            // Creator view: Show only overall progress
            <>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "#6c757d",
                  }}
                >
                  OVERALL PROGRESS
                </span>
                <span
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    color: getProgressColor(currentProgress),
                  }}
                >
                  {currentProgress}%
                </span>
              </div>
              <GoalProgress
                progress={currentProgress}
                size="sm"
                showLabel={false}
                showPercentage={false}
                color={getProgressColor(currentProgress)}
              />
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
};

export default GoalCard;
