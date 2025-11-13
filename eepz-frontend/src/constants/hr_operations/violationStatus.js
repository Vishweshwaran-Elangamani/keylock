export const VIOLATION_STATUS = {
  REPORTED: "Reported",
  UNDER_REVIEW: "UnderReview",
  RESOLVED: "Resolved",
  ESCALATED: "Escalated",
};

export const VIOLATION_STATUS_OPTIONS = [
  {
    value: "Reported",
    label: "Reported",
    color: "warning",
    badgeClass: "bg-warning",
    icon: "bi-exclamation-triangle",
  },
  {
    value: "UnderReview",
    label: "Under Review",
    color: "info",
    badgeClass: "bg-info",
    icon: "bi-eye",
  },
  {
    value: "Resolved",
    label: "Resolved",
    color: "success",
    badgeClass: "bg-success",
    icon: "bi-check-circle",
  },
  {
    value: "Escalated",
    label: "Escalated",
    color: "danger",
    badgeClass: "bg-danger",
    icon: "bi-arrow-up-circle",
  },
];

export const getViolationStatusBadgeClass = (status) => {
  const found = VIOLATION_STATUS_OPTIONS.find((opt) => opt.value === status);
  return found ? found.badgeClass : "bg-secondary";
};

export const getViolationStatusIcon = (status) => {
  const found = VIOLATION_STATUS_OPTIONS.find((opt) => opt.value === status);
  return found ? found.icon : "bi-circle";
};

export const getViolationStatusLabel = (status) => {
  const found = VIOLATION_STATUS_OPTIONS.find((opt) => opt.value === status);
  return found ? found.label : status;
};
