const ErrorDetails = ({ uploadResult }) => {
  const categorizeErrors = (errors) => {
    const duplicateEmails = [];
    const validationErrors = [];
    const otherErrors = [];
    errors.forEach((error) => {
      if (
        error.toLowerCase().includes("email already exists") ||
        error.toLowerCase().includes("duplicate")
      ) {
        duplicateEmails.push(error);
      } else if (
        error.toLowerCase().includes("required") ||
        error.toLowerCase().includes("invalid") ||
        error.toLowerCase().includes("must")
      ) {
        validationErrors.push(error);
      } else {
        otherErrors.push(error);
      }
    });
    return { duplicateEmails, validationErrors, otherErrors };
  };
  const categorized =
    uploadResult.categorizedErrors || categorizeErrors(uploadResult.errors);
  const allErrors = [
    ...categorized.duplicateEmails.map((err) => ({
      type: "duplicate",
      message: err,
    })),
    ...categorized.validationErrors.map((err) => ({
      type: "validation",
      message: err,
    })),
    ...categorized.otherErrors.map((err) => ({ type: "other", message: err })),
  ];
  const getErrorIcon = (type) => {
    switch (type) {
      case "duplicate":
        return "bi-envelope-x-fill";
      case "validation":
        return "bi-exclamation-triangle-fill";
      case "other":
        return "bi-info-circle-fill";
      default:
        return "bi-x-circle-fill";
    }
  };
  const getErrorLabel = (type) => {
    switch (type) {
      case "duplicate":
        return "Duplicate Email";
      case "validation":
        return "Validation Error";
      case "other":
        return "System Error";
      default:
        return "Error";
    }
  };
  return (
    <div className="bom-error-container-modern">
      <div className="bom-error-header-modern">
        <div className="bom-error-badge-icon">
          <i className="bi bi-exclamation-triangle-fill"></i>
          <span className="bom-error-pulse"></span>
        </div>
        <div className="bom-error-header-text">
          <h3 className="bom-error-title-modern">Import Failed</h3>
          <p className="bom-error-subtitle">
            {uploadResult.failureCount}{" "}
            {uploadResult.failureCount === 1 ? "record" : "records"} could not
            be processed
          </p>
        </div>
        <div className="bom-error-count-modern">
          {uploadResult.failureCount}
        </div>
      </div>
      <div className="bom-error-stats-row">
        {categorized.duplicateEmails.length > 0 && (
          <div className="bom-error-stat-card bom-stat-duplicate">
            <i className="bi bi-envelope-x-fill"></i>
            <div className="bom-stat-content">
              <span className="bom-stat-number">
                {categorized.duplicateEmails.length}
              </span>
              <span className="bom-stat-label">Duplicates</span>
            </div>
          </div>
        )}
        {categorized.validationErrors.length > 0 && (
          <div className="bom-error-stat-card bom-stat-validation">
            <i className="bi bi-exclamation-triangle-fill"></i>
            <div className="bom-stat-content">
              <span className="bom-stat-number">
                {categorized.validationErrors.length}
              </span>
              <span className="bom-stat-label">Validation</span>
            </div>
          </div>
        )}
        {categorized.otherErrors.length > 0 && (
          <div className="bom-error-stat-card bom-stat-other">
            <i className="bi bi-info-circle-fill"></i>
            <div className="bom-stat-content">
              <span className="bom-stat-number">
                {categorized.otherErrors.length}
              </span>
              <span className="bom-stat-label">Other</span>
            </div>
          </div>
        )}
      </div>
      <div className="bom-timeline-container">
        {allErrors.map((error, index) => (
          <div
            key={`error-${index}`}
            className={`bom-timeline-item bom-timeline-error bom-timeline-${error.type}`}
          >
            <div className="bom-timeline-marker">
              <div className="bom-timeline-dot"></div>
              <div className="bom-timeline-line"></div>
            </div>
            <div className="bom-timeline-card">
              <div className="bom-error-card-header">
                <div
                  className={`bom-error-icon-wrapper bom-error-${error.type}`}
                >
                  <i className={`bi ${getErrorIcon(error.type)}`}></i>
                </div>
                <div className="bom-error-card-title">
                  <span
                    className={`bom-error-type-badge bom-badge-${error.type}`}
                  >
                    {getErrorLabel(error.type)}
                  </span>
                  <p className="bom-error-message">{error.message}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default ErrorDetails;
