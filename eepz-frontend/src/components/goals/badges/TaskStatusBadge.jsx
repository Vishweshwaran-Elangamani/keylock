const STATUS_CONFIG = {
  acknowledged: {
    bg: "success",
    icon: "bi-check-circle-fill",
    label: "Acknowledged",
  },
  pendingReview: {
    bg: "warning",
    icon: "bi-clock-history",
    label: "Pending Review",
    textDark: true,
  },
  readyForReview: {
    bg: "info",
    icon: "bi-check-circle",
    label: "Ready for Review",
  },
  inProgress: {
    bg: "primary",
    icon: "bi-hourglass-split",
    label: "In Progress",
  },
  notStarted: {
    bg: "secondary",
    icon: "bi-dash-circle",
    label: "Not Started",
  },
};

const getTaskStatus = (progress, hasPendingApproval, isAcknowledged) => {
  if (isAcknowledged) return STATUS_CONFIG.acknowledged;
  if (hasPendingApproval && progress === 100)
    return STATUS_CONFIG.pendingReview;
  if (progress === 100) return STATUS_CONFIG.readyForReview;
  if (progress > 0) return STATUS_CONFIG.inProgress;
  return STATUS_CONFIG.notStarted;
};

const TaskStatusBadge = ({ progress, hasPendingApproval, isAcknowledged }) => {
  const status = getTaskStatus(progress, hasPendingApproval, isAcknowledged);
  const progressLabel =
    status === STATUS_CONFIG.inProgress ? ` (${progress}%)` : "";

  return (
    <span
      className={`badge bg-${status.bg}${status.textDark ? " text-dark" : ""}`}
    >
      <i className={`bi ${status.icon} me-1`} />
      {status.label}
      {progressLabel}
    </span>
  );
};

export default TaskStatusBadge;
