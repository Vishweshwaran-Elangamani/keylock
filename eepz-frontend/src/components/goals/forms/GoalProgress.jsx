import styles from "../../../styles/goals/components/GoalProgress.module.css";

const GoalProgress = ({
  progress = 0,
  size = "md",
  showLabel = true,
  showPercentage = true,
  animated = false,
  striped = false,
  variant = "primary",
  label = "Progress",
}) => {
  const heights = {
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
  };

  const labelSizes = {
    sm: "0.75rem",
    md: "0.875rem",
    lg: "1rem",
  };

  const progressVariant = progress === 100 ? "success" : variant;

  return (
    <div className={styles.container}>
      {/* Label */}
      {showLabel && (
        <div className={`${styles.label} ${styles[`labelSize${size.toUpperCase()}`]}`}>
          <span className={styles.labelText}>
            <i className="bi bi-bar-chart-fill"></i>
            {label}
          </span>
          {showPercentage && (
            <span className={`${styles.percentage} ${progress === 100 ? styles.complete : ""}`}>
              {progress}%
            </span>
          )}
        </div>
      )}

      {/* Progress Bar */}
      <div 
        className={`${styles.progress} ${styles[`size${size.toUpperCase()}`]}`}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div 
          className={`${styles.bar} ${styles[`variant${progressVariant.toUpperCase()}`]} ${striped ? styles.striped : ''} ${animated ? styles.animated : ''}`}
          style={{ width: `${progress}%` }}
        >
          {size === "lg" && showPercentage && (
            <span className={styles.barText}>
              {progress}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoalProgress;
