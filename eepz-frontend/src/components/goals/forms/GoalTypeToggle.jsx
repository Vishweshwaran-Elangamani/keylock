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
      style={{
        display: "inline-flex",
        backgroundColor: "rgb(39, 35, 92)",
        borderRadius: "50px",
        padding: "5px",
        marginBottom: "1.5rem",
        width: "100%",
        maxWidth: "600px",
      }}
    >
      {types.map((type) => {
        const isActive = selectedType === type.value;
        const count = counts ? counts[type.value] : null;

        return (
          <button
            key={type.value}
            type="button"
            onClick={() => onTypeChange(type.value)}
            disabled={disabled}
            style={{
              flex: 1,
              padding: "15px 30px",
              border: "none",
              borderRadius: "50px",
              backgroundColor: isActive ? "#ffffff" : "rgb(39, 35, 92)",
              color: isActive ? "#000000" : "white",
              fontWeight: 600,
              cursor: disabled ? "not-allowed" : "pointer",
              transition: "all 0.3s ease",
              boxShadow: isActive ? "0 2px 4px rgba(0,0,0,0.1)" : "none",
              fontSize: "0.95rem",
              whiteSpace: "nowrap",
              opacity: disabled ? 0.6 : 1,
            }}
          >
            <i
              className={`bi ${type.icon} me-2`}
              style={{ fontSize: "1.1rem" }}
            ></i>
            {type.label}
            {count !== null && (
              <span
                style={{
                  marginLeft: "8px",
                  backgroundColor: isActive
                    ? "rgba(39, 35, 92, 0.15)"
                    : "rgba(255, 255, 255, 0.3)",
                  color: isActive ? "rgb(39, 35, 92)" : "#fff",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  padding: "0.25rem 0.5rem",
                  borderRadius: "10px",
                  display: "inline-block",
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
