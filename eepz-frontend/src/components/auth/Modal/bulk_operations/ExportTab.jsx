const ExportTab = ({ handleExport, exportingUsers, exportingAll }) => {
  return (
    <div className="bom-export-modern-container">
      <div className="bom-export-cards-container">
        <div className="bom-export-glass-card">
          <div className="bom-card-shimmer"></div>
          <div className="bom-card-header">
            <div className="bom-card-icon-wrapper bom-icon-purple">
              <i className="bi bi-people-fill"></i>
              <div className="bom-icon-glow bom-glow-purple"></div>
            </div>
          </div>
          <div className="bom-card-content">
            <h3 className="bom-card-title">Users Export</h3>
            <p className="bom-card-description">
              Export all user profiles with complete details including emails,
              roles, and registration data
            </p>
          </div>
          <button
            onClick={() => handleExport("users")}
            disabled={exportingUsers}
            className="bom-modern-export-btn bom-btn-purple"
          >
            {exportingUsers ? (
              <>
                <span className="bom-loading-spinner"></span>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <i className="bi bi-download"></i>
                <span>Export Users</span>
                <i className="bi bi-arrow-right bom-arrow-icon"></i>
              </>
            )}
          </button>
        </div>
        <div className="bom-export-glass-card">
          <div className="bom-card-shimmer"></div>
          <div className="bom-card-header">
            <div className="bom-card-icon-wrapper bom-icon-gradient">
              <i className="bi bi-database-fill-gear"></i>
              <div className="bom-icon-glow bom-glow-gradient"></div>
            </div>
          </div>
          <div className="bom-card-content">
            <h3 className="bom-card-title">Complete Export</h3>
            <p className="bom-card-description">
              Export everything in a single Excel file with organized sheets for
              comprehensive data backup
            </p>
          </div>
          <button
            onClick={() => handleExport("all")}
            disabled={exportingAll}
            className="bom-modern-export-btn bom-btn-gradient"
          >
            {exportingAll ? (
              <>
                <span className="bom-loading-spinner"></span>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <i className="bi bi-download"></i>
                <span>Export All Data</span>
                <i className="bi bi-arrow-right bom-arrow-icon"></i>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
export default ExportTab;
