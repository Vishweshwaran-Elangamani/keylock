import {
  STATUS_COLORS,
  STATUS_LABELS,
} from "../../../constants/goals/goalConstants";

const ICON_MAP = {
  Pending: "bi-clock",
  Open: "bi-folder2-open",
  InProgress: "bi-arrow-repeat",
  Completed: "bi-check-circle-fill",
  Closed: "bi-x-circle-fill",
  Reopened: "bi-arrow-counterclockwise",
  Overdue: "bi-exclamation-triangle-fill",
  Rejected: "bi-x-circle-fill",
};

// Size configurations
const SIZE_CONFIG = {
  sm: {
    fontSize: "10px",
    padding: "0.25rem 0.5rem",
    iconSize: "0.85em",
  },
  md: {
    fontSize: "11px",
    padding: "0.35rem 0.65rem",
    iconSize: "0.95em",
  },
  lg: {
    fontSize: "12px",
    padding: "0.4rem 0.75rem",
    iconSize: "1.1em",
  },
};

const GetStatusStyle = (status) => {
  const statusLower = status?.toLowerCase() || "";

  if (statusLower === "closed") {
    return {
      boxShadow: "0 2px 6px rgba(220, 53, 69, 0.25)",
      animation: "pulse 2s infinite",
    };
  }

  if (statusLower === "reopened") {
    return {
      boxShadow: "0 2px 6px rgba(13, 110, 253, 0.25)",
      animation: "pulse 2s infinite",
    };
  }

  if (statusLower === "overdue") {
    return {
      boxShadow: "0 2px 6px rgba(220, 53, 69, 0.3)",
    };
  }

  return {};
};

const FormatStatusKey = (status) => {
  if (!status) return "";

  const statusMap = {
    pending: "Pending",
    open: "Open",
    inprogress: "In Progress",
    completed: "Completed",
    closed: "Closed",
    reopened: "Reopened",
    overdue: "Overdue",
    rejected: "Rejected",
  };

  return statusMap[status.toLowerCase()] || status.toLowerCase();
};

const GoalStatusBadge = ({ status, size = "md", showTooltip = true }) => {
  if (!status) return null;

  const statusLower = status.toLowerCase();
  const formattedStatus = FormatStatusKey(statusLower);

  const bgColor = STATUS_COLORS[statusLower] || "secondary";
  const label = STATUS_LABELS[statusLower] || status;
  const icon = ICON_MAP[formattedStatus];
  const config = SIZE_CONFIG[size];
  const statusStyle = GetStatusStyle(status);

  const GetTooltipText = () => {
    const tooltips = {
      pending: "Awaiting activation",
      open: "Goal is open and active",
      inprogress: "Work in progress",
      completed: "Goal completed successfully",
      closed: "Goal has been closed",
      reopened: "Goal has been reopened",
      overdue: "Goal is overdue",
      rejected: "Goal was rejected",
    };
    return tooltips[statusLower] || "";
  };

  return (
    <>
      <span
        className={`badge bg-${bgColor}`}
        style={{
          fontSize: config.fontSize,
          padding: config.padding,
          fontWeight: 600,
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35rem",
          borderRadius: "0.35rem",
          transition: "all 0.3s ease",
          ...statusStyle,
        }}
        title={showTooltip ? GetTooltipText() : ""}
      >
        {icon && (
          <i
            className={`bi ${icon}`}
            style={{
              fontSize: config.iconSize,
              display: "flex",
              alignItems: "center",
            }}
          />
        )}
        <span>Goal Status: {label}</span>
      </span>

      {/* Animation styles */}
      <style>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
          }
          50% {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
          }
          100% {
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
          }
        }
      `}</style>
    </>
  );
};

export default GoalStatusBadge;
