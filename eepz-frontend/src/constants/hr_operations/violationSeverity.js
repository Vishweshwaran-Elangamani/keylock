export const VIOLATION_SEVERITY = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export const VIOLATION_SEVERITY_OPTIONS = [
  {
    value: "Low",
    label: "Low",
    color: "#43e97b",
    badgeClass: "bg-success",
    gradient: "gradient-green",
  },
  {
    value: "Medium",
    label: "Medium",
    color: "#fee140",
    badgeClass: "bg-warning",
    gradient: "gradient-orange",
  },
  {
    value: "High",
    label: "High",
    color: "#fa709a",
    badgeClass: "bg-danger",
    gradient: "gradient-pink",
  },
  {
    value: "Critical",
    label: "Critical",
    color: "#dc2626",
    badgeClass: "bg-danger",
    gradient: "gradient-red",
  },
];

export const getViolationSeverityColor = (severity) => {
  const found = VIOLATION_SEVERITY_OPTIONS.find(
    (opt) => opt.value === severity
  );
  return found ? found.color : "#6c757d";
};

export const getViolationSeverityBadgeClass = (severity) => {
  const found = VIOLATION_SEVERITY_OPTIONS.find(
    (opt) => opt.value === severity
  );
  return found ? found.badgeClass : "bg-secondary";
};

export const getViolationSeverityGradient = (severity) => {
  const found = VIOLATION_SEVERITY_OPTIONS.find(
    (opt) => opt.value === severity
  );
  return found ? found.gradient : "gradient-purple";
};
