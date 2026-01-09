const SuccessDetails = ({ uploadResult }) => {
  return (
    <div className="bom-success-details-container">
      <details open className="bom-error-category bom-success-category">
        <summary className="bom-error-category-summary bom-success-category-summary">
          <div className="bom-error-category-summary-content">
            <i className="bi bi-check-circle-fill bom-success-icon"></i>
            <span>Successfully Imported Users</span>
            <span className="bom-error-category-badge bom-success-badge">
              {uploadResult.successCount}
            </span>
          </div>
          <i className="bi bi-chevron-down"></i>
        </summary>
        <div className="bom-error-category-content">
          {uploadResult.successfulUsers &&
          uploadResult.successfulUsers.length > 0 ? (
            <ul className="bom-error-list">
              {uploadResult.successfulUsers.map((user, index) => (
                <li
                  key={`success-${index}`}
                  className="bom-error-list-item bom-success-list-item"
                >
                  <i className="bi bi-check-circle-fill bom-success-icon"></i>
                  <span>
                    <strong>{user.email}</strong> - {user.firstName}{" "}
                    {user.lastName} ({user.role} - {user.department})
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="bom-success-summary">
              <i className="bi bi-check-circle-fill bom-success-summary-icon"></i>
              <p className="bom-success-summary-title">
                {uploadResult.successCount} user
                {uploadResult.successCount !== 1 ? "s" : ""} imported
                successfully!
              </p>
              <small className="bom-success-summary-text">
                All users are now active in the system.
              </small>
            </div>
          )}
        </div>
      </details>
    </div>
  );
};
export default SuccessDetails;
