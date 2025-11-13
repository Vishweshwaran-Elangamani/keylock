import {
  GOAL_TYPE_COLORS,
  GOAL_TYPE_LABELS,
} from "../../../constants/goals/goalConstants";

const ICON_MAP = {
  self: "bi-person",
  team: "bi-people",
  org: "bi-building",
};

const SIZE_CONFIG = {
  sm: {
    fontSize: "0.7rem",
    padding: "0.25rem 0.5rem",
  },
  md: {
    fontSize: "0.8rem",
    padding: "0.35rem 0.65rem",
  },
  lg: {
    fontSize: "0.9rem",
    padding: "0.4rem 0.75rem",
  },
};

const GoalTypeBadge = ({ type, size = "md" }) => {
  if (!type) return null;

  const typeLower = type.toLowerCase();
  const bgColor = GOAL_TYPE_COLORS[typeLower] || "secondary";
  const label = GOAL_TYPE_LABELS[typeLower] || type;
  const icon = ICON_MAP[typeLower];
  const config = SIZE_CONFIG[size];

  return (
    <span
      className={`badge bg-${bgColor}`}
      style={{
        fontSize: config.fontSize,
        padding: config.padding,
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
      }}
    >
      <i className={`bi ${icon}`} style={{ fontSize: "1em" }} />
      {label}
    </span>
  );
};

export default GoalTypeBadge;
