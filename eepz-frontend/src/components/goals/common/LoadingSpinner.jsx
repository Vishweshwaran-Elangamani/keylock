const LoadingSpinner = ({
  size = "md",
  text = "Loading...",
  fullScreen = false,
}) => {
  const sizeClasses = {
    sm: "spinner-border-sm",
    md: "",
    lg: "spinner-border-lg",
  };

  const spinner = (
    <div className="text-center">
      <div
        className={`spinner-border text-primary ${sizeClasses[size]}`}
        role="status"
        style={{
          width: size === "lg" ? "3rem" : undefined,
          height: size === "lg" ? "3rem" : undefined,
        }}
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      {text && (
        <div className="mt-2" style={{ color: "#6c757d", fontSize: "0.9rem" }}>
          {text}
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          zIndex: 9999,
        }}
      >
        {spinner}
      </div>
    );
  }

  return <div style={{ padding: "2rem" }}>{spinner}</div>;
};

export default LoadingSpinner;
