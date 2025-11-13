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
    <div style={{ width: "100%" }}>
      {/* Label */}
      {showLabel && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "0.25rem",
            fontSize: labelSizes[size],
            color: "#495057",
          }}
        >
          <span style={{ fontWeight: 500 }}>
            <i className="bi bi-bar-chart-fill me-1"></i>
            {label}
          </span>
          {showPercentage && (
            <span
              style={{
                fontWeight: 600,
                color: progress === 100 ? "#198754" : "#0d6efd",
              }}
            >
              {progress}%
            </span>
          )}
        </div>
      )}

      {/* Progress Bar */}
      <div
        className="progress"
        style={{
          height: heights[size],
          backgroundColor: "#e9ecef",
          borderRadius: "0.375rem",
        }}
      >
        <div
          className={`progress-bar ${striped ? "progress-bar-striped" : ""} ${
            animated ? "progress-bar-animated" : ""
          } bg-${progressVariant}`}
          role="progressbar"
          style={{ width: `${progress}%` }}
          aria-valuenow={progress}
          aria-valuemin="0"
          aria-valuemax="100"
        >
          {size === "lg" && showPercentage && (
            <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>
              {progress}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoalProgress;
