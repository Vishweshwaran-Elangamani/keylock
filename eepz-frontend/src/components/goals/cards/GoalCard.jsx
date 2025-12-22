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
import styles from "../../../styles/goals/components/GoalCard.module.css";

const GoalCard = ({ goal }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isCreator = goal.createdByEmployeeMasterId === user.empMasterId;
  const isAssignee = goal.assignees?.some(
    (a) => a.employeeMasterId === user.empMasterId
  );

  const showTaskStatus = !isCreator && isAssignee && goal.goalType === "team";
  const overdueStatus = isOverdue(goal.endAt) && goal.status !== "completed";
  const daysUntil = getDaysUntilDeadline(goal.endAt);

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

  const getProgressColorClass = (progress) => {
    if (progress >= 75) return styles.progressHigh;
    if (progress >= 50) return styles.progressMedium;
    if (progress >= 25) return styles.progressLow;
    return styles.progressVeryLow;
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

  const deadlineStripClass =
    daysUntil !== null && !overdueStatus && goal.status !== "completed"
      ? daysUntil <= 7
        ? styles.deadlineStripWarning
        : styles.deadlineStripInfo
      : "";

  return (
    <div
      className={`card h-100 goal-card ${styles.card}`}
      onMouseEnter={(e) => {
        e.currentTarget.classList.add(styles.cardHover);
      }}
      onMouseLeave={(e) => {
        e.currentTarget.classList.remove(styles.cardHover);
      }}
    >
      {/* Card Header */}
      <div className={styles.header}>
        <div className="d-flex justify-content-between align-items-start">
          <div className="d-flex gap-2 flex-wrap align-items-center">
            {showTaskStatus ? (
              <>
                <TaskStatusBadge
                  progress={goal.myProgress || 0}
                  hasPendingApproval={goal.hasPendingApproval || false}
                  isAcknowledged={isUserAcknowledged}
                  size="sm"
                />
                <GoalStatusBadge status={goal.status} size="sm" />
              </>
            ) : (
              <>
                <GoalStatusBadge status={goal.status} size="sm" />
              </>
            )}
          </div>

          {overdueStatus && (
            <span className={`badge ${styles.overdueBadge}`}>
              <i className="bi bi-exclamation-triangle-fill me-1"></i>
              Overdue
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className={`card-body ${styles.body}`} onClick={handleCardClick}>
        <h6 className={`card-title mb-2 ${styles.title}`}>{goal.title}</h6>

        {goal.descriptionShort && (
          <p className={`card-text mb-3 ${styles.description}`}>
            {truncateText(goal.descriptionShort, 100)}
          </p>
        )}

        {/* Meta Info Grid */}
        <div className={`mb-3 ${styles.metaGrid}`}>
          <div className={styles.metaItem}>
            <i className={`bi bi-person-fill ${styles.metaIconCreator}`}></i>
            <div>
              <div className={styles.metaLabel}>Creator</div>
              <div className={styles.metaValue}>
                {truncateText(goal.createdByName || "Unknown", 15)}
              </div>
            </div>
          </div>

          <div className={styles.metaItem}>
            <i
              className={`bi bi-calendar-check-fill ${styles.metaIconDeadline}`}
            ></i>
            <div>
              <div className={styles.metaLabel}>Deadline</div>
              <div className={styles.metaValue}>{formatDate(goal.endAt)}</div>
            </div>
          </div>
        </div>

        {/* Days until deadline */}
        {daysUntil !== null && !overdueStatus && goal.status != "completed" && (
          <div className={deadlineStripClass}>
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
        <div className={styles.progressCard}>
          {showTaskStatus ? (
            <>
              {/* Personal Progress */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className={styles.myProgressLabel}>MY PROGRESS</span>
                  <span
                    className={`${
                      styles.progressNumber
                    } ${getProgressColorClass(goal.myProgress || 0)}`}
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
                  <span className={styles.overallLabel}>OVERALL GOAL</span>
                  <span
                    className={`${styles.overallNumber} ${getProgressColorClass(
                      goal.progressPercent || 0
                    )}`}
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
            <>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className={styles.overallProgressLabel}>
                  OVERALL PROGRESS
                </span>
                <span
                  className={`${styles.progressNumber} ${getProgressColorClass(
                    currentProgress
                  )}`}
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
    </div>
  );
};

export default GoalCard;
