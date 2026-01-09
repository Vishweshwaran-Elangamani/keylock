import ErrorCategory from "./ErrorCategory";
const ErrorDetails = ({ uploadResult }) => {
  return (
    <div className="error-details-bulk">
      <div className="bom-error-details-container">
        <div className="bom-error-details-header">
          <i className="bi bi-exclamation-triangle-fill bom-error-details-icon"></i>
          <span className="bom-error-details-title">
            Detailed Error Information
          </span>
        </div>
        <div className="bom-error-summary">
          <strong className="bom-error-summary-title">
            {uploadResult.failureCount} record
            {uploadResult.failureCount !== 1 ? "s" : ""} failed to import
          </strong>
          <p className="bom-error-summary-text">
            Review each error below. Format: Row number (Email) - Error
            description
          </p>
        </div>
        {uploadResult.categorizedErrors ? (
          <div>
            {uploadResult.categorizedErrors.duplicateEmails.length > 0 && (
              <ErrorCategory
                type="duplicate"
                title="Duplicate Email Addresses"
                icon="bi-envelope-x-fill"
                errors={uploadResult.categorizedErrors.duplicateEmails}
              />
            )}
            {uploadResult.categorizedErrors.validationErrors.length > 0 && (
              <ErrorCategory
                type="validation"
                title="Data Validation Errors"
                icon="bi-exclamation-circle-fill"
                errors={uploadResult.categorizedErrors.validationErrors}
              />
            )}
            {uploadResult.categorizedErrors.otherErrors.length > 0 && (
              <ErrorCategory
                type="other"
                title="Other Issues"
                icon="bi-info-circle-fill"
                errors={uploadResult.categorizedErrors.otherErrors}
              />
            )}
          </div>
        ) : (
          <ul className="bom-error-list">
            {uploadResult.errors.map((error, index) => (
              <li
                key={index}
                className="bom-error-list-item bom-error-list-item-duplicate"
              >
                <i className="bi bi-x-circle bom-error-list-item-icon"></i>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
export default ErrorDetails;
