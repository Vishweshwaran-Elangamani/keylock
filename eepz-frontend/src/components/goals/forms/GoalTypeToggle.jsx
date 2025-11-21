import {
  GOAL_TYPES,
  GOAL_TYPE_LABELS,
} from "../../../constants/goals/goalConstants";

const GoalTypeToggle = ({
  selectedType,
  onTypeChange,
  counts = null,
  disabled = false,
}) => {
  const types = [
    { value: GOAL_TYPES.SELF, label: GOAL_TYPE_LABELS.self, icon: "bi-person" },
    { value: GOAL_TYPES.TEAM, label: GOAL_TYPE_LABELS.team, icon: "bi-people" },
    { value: GOAL_TYPES.ORG, label: GOAL_TYPE_LABELS.org, icon: "bi-building" },
  ];

  return (
    <div
      className="btn-group w-100 mb-6"
      role="group"
      aria-label="Goal type toggle"
      style={{
        minHeight: "3rem",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        borderRadius: "0.8rem",
      }}
    >
      {types.map((type) => {
        const isActive = selectedType === type.value;
        const count = counts ? counts[type.value] : null;

        return (
          <button
            key={type.value}
            type="button"
            className={`btn ${isActive ? "btn-primary" : "btn-outline-primary"
              }`}
            onClick={() => onTypeChange(type.value)}
            disabled={disabled}
            style={{
              flex: 1,
              minHeight: "3em",
              padding: "0.7rem 1rem",
              fontWeight: 600,
              fontSize: "0.95rem",
              border: "none",
              borderRight: "1px solid rgba(0, 0, 0, 0.1)",
              transition: "all 0.2s ease",
              position: "relative",
              backgroundColor: isActive ? "rgb(39, 35, 92)" : "#fff",
              color: isActive ? "#fff" : "rgb(39, 35, 92)",
            }}
            onMouseEnter={(e) => {
              if (!isActive && !disabled) {
                e.currentTarget.style.backgroundColor = "#e7f1ff";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = "#fff";
              }
            }}
          >
            <i
              className={`bi ${type.icon} me-2`}
              style={{ fontSize: "1.1rem" }}
            ></i>
            {type.label}
            {count !== null && (
              <span
                className="badge ms-2"
                style={{
                  backgroundColor: isActive
                    ? "rgba(255, 255, 255, 0.3)"
                    : "rgba(13, 110, 253, 0.15)",
                  color: isActive ? "#fff" : "#0d6efd",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  padding: "0.25rem 0.5rem",
                  borderRadius: "10px",
                }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default GoalTypeToggle;
