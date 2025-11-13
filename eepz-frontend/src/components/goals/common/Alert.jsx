const Alert = ({
  type = "info",
  message,
  onClose,
  dismissible = true,
  className = "",
}) => {
  const icons = {
    success: "bi-check-circle-fill",
    danger: "bi-exclamation-triangle-fill",
    warning: "bi-exclamation-circle-fill",
    info: "bi-info-circle-fill",
  };

  return (
    <div
      className={`alert alert-${type} ${
        dismissible ? "alert-dismissible" : ""
      } fade show ${className}`}
      role="alert"
      style={{ marginBottom: "1rem" }}
    >
      <i className={`bi ${icons[type]} me-2`}></i>
      {message}
      {dismissible && onClose && (
        <button
          type="button"
          className="btn-close"
          onClick={onClose}
          aria-label="Close"
        ></button>
      )}
    </div>
  );
};

export default Alert;
