const SuccessDetails = ({ uploadResult }) => {
  return (
    <div className="bom-success-container-modern">
      <div className="bom-success-header-modern">
        <div className="bom-success-badge-icon">
          <i className="bi bi-check-circle-fill"></i>
          <span className="bom-success-pulse"></span>
        </div>
        <div className="bom-success-header-text">
          <h3 className="bom-success-title-modern">Import Successful</h3>
          <p className="bom-success-subtitle">
            {uploadResult.successCount}{" "}
            {uploadResult.successCount === 1 ? "user" : "users"} added to the
            system
          </p>
        </div>
        <div className="bom-success-count-modern">
          {uploadResult.successCount}
        </div>
      </div>
      {uploadResult.successfulUsers &&
      uploadResult.successfulUsers.length > 0 ? (
        <div className="bom-timeline-container">
          {uploadResult.successfulUsers.map((user, index) => (
            <div
              key={`success-${index}`}
              className="bom-timeline-item bom-timeline-success"
            >
              <div className="bom-timeline-marker">
                <div className="bom-timeline-dot"></div>
                <div className="bom-timeline-line"></div>
              </div>
              <div className="bom-timeline-card">
                <div className="bom-timeline-card-header">
                  <div className="bom-user-avatar bom-avatar-success">
                    {user.firstName.charAt(0)}
                    {user.lastName.charAt(0)}
                  </div>
                  <div className="bom-timeline-card-title">
                    <h4 className="bom-user-fullname">
                      {user.firstName} {user.lastName}
                    </h4>
                    <p className="bom-user-email-modern">{user.email}</p>
                  </div>
                  <div className="bom-status-badge bom-status-success">
                    <i className="bi bi-check-lg"></i>
                  </div>
                </div>
                <div className="bom-timeline-card-meta">
                  <div className="bom-meta-item">
                    <i className="bi bi-person-badge"></i>
                    <span>{user.role}</span>
                  </div>
                  <div className="bom-meta-divider"></div>
                  <div className="bom-meta-item">
                    <i className="bi bi-building"></i>
                    <span>{user.department}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bom-empty-state-success">
          <div className="bom-empty-icon">
            <i className="bi bi-trophy-fill"></i>
          </div>
          <p className="bom-empty-title">All Users Imported Successfully!</p>
          <p className="bom-empty-subtitle">
            {uploadResult.successCount}{" "}
            {uploadResult.successCount === 1 ? "user is" : "users are"} now
            active in the system
          </p>
        </div>
      )}
    </div>
  );
};
export default SuccessDetails;
