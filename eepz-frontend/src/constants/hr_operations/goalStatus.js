export const GOAL_STATUS = {
  PENDING: "pending",
  OPEN: "open",
  IN_PROGRESS: "inprogress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  ON_HOLD: "onhold",
};

export const GOAL_STATUS_OPTIONS = [
  {
    value: "pending",
    label: "Pending",
    color: "warning",
    badgeClass: "bg-warning",
  },
  { value: "open", label: "Open", color: "info", badgeClass: "bg-info" },
  {
    value: "inprogress",
    label: "In Progress",
    color: "primary",
    badgeClass: "bg-primary",
  },
  {
    value: "completed",
    label: "Completed",
    color: "success",
    badgeClass: "bg-success",
  },
  {
    value: "cancelled",
    label: "Cancelled",
    color: "danger",
    badgeClass: "bg-danger",
  },
  {
    value: "onhold",
    label: "On Hold",
    color: "secondary",
    badgeClass: "bg-secondary",
  },
];

export const getGoalStatusBadgeClass = (status) => {
  const found = GOAL_STATUS_OPTIONS.find(
    (opt) => opt.value === status?.toLowerCase()
  );
  return found ? found.badgeClass : "bg-secondary";
};

export const getGoalStatusLabel = (status) => {
  const found = GOAL_STATUS_OPTIONS.find(
    (opt) => opt.value === status?.toLowerCase()
  );
  return found ? found.label : status;
};
