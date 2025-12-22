import {
  GOAL_TYPES,
  GOAL_TYPE_LABELS,
} from "../../../constants/goals/goalConstants";
import styles from "../../../styles/goals/components/GoalTypeToggle.module.css";

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
    <div className={`${styles.toggleContainer} ${disabled ? styles.disabled : ""}`}>
      {types.map((type) => {
        const isActive = selectedType === type.value;
        const count = counts ? counts[type.value] : null;

        return (
          <button
            key={type.value}
            type="button"
            className={`${styles.toggleButton} ${isActive ? styles.active : ""}`}
            onClick={() => onTypeChange(type.value)}
            disabled={disabled}
            aria-pressed={isActive}
          >
            <i className={`bi ${type.icon} ${styles.icon}`}></i>
            <span className={styles.label}>{type.label}</span>
            {count !== null && (
              <span className={`${styles.countBadge} ${isActive ? styles.activeCount : ""}`}>
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
