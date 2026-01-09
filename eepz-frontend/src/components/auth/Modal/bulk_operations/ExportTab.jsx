const ExportTab = ({ handleExport, exportingUsers, exportingAll }) => {
  return (
    <div>
      <div className="bom-export-section-header">
        <p className="bom-export-section-description">
          <i className="bi bi-file-earmark-spreadsheet bom-export-section-icon"></i>
          Download data in Excel format for backup or analysis
        </p>
      </div>
      <div className="bom-export-cards-grid">
        <div className="bom-export-card">
          <div className="bom-export-card-icon">
            <i className="bi bi-people bom-export-card-icon-image"></i>
          </div>
          <h6 className="bom-export-card-title">Users</h6>
          <p className="bom-export-card-description">
            Export all users and their information
          </p>
          <button
            onClick={() => handleExport("users")}
            disabled={exportingUsers}
            className="bom-export-button"
          >
            {exportingUsers ? (
              <span className="bom-spinner" />
            ) : (
              <i className="bi bi-download"></i>
            )}
            Export Users
          </button>
        </div>
        <div className="bom-export-card">
          <div className="bom-export-card-icon">
            <i className="bi bi-database bom-export-card-icon-image"></i>
          </div>
          <h6 className="bom-export-card-title">Complete Export</h6>
          <p className="bom-export-card-description">
            Export everything in one file with multiple sheets
          </p>
          <button
            onClick={() => handleExport("all")}
            disabled={exportingAll}
            className="bom-export-button"
          >
            {exportingAll ? (
              <span className="bom-spinner" />
            ) : (
              <i className="bi bi-download"></i>
            )}
            Export All Data
          </button>
        </div>
      </div>
    </div>
  );
};
export default ExportTab;
