import UploadResults from "./UploadResults";
const ImportTab = ({
  handleDownloadTemplate,
  isDownloadingTemplate,
  fileInputRef,
  handleFileSelect,
  handleFileUploadClick,
  selectedFile,
  setSelectedFile,
  setUploadResult,
  loading,
  handleBulkImport,
  uploadResult,
}) => {
  return (
    <div>
      <div className="bom-template-download-section">
        <button
          onClick={handleDownloadTemplate}
          disabled={isDownloadingTemplate}
          className="bom-template-download-button"
        >
          {isDownloadingTemplate ? (
            <>
              <span className="bom-spinner-small" />
              Downloading...
            </>
          ) : (
            <>
              <i className="bi bi-file-earmark-arrow-down"></i>
              Download Excel Template
            </>
          )}
        </button>
        <small className="bom-template-download-small">
          Download the template, fill in user details, and upload it below
        </small>
      </div>
      <div className="bom-info-alert">
        <i className="bi bi-info-circle-fill bom-info-alert-icon"></i>
        <div className="bom-info-alert-content">
          <strong className="bom-info-alert-title">
            Excel Format Requirements:
          </strong>
          <ul className="bom-info-alert-list">
            <li>
              <strong>Employee IDs are AUTO-GENERATED:</strong> Do NOT include
              Employee ID column. IDs will be assigned automatically starting
              from the last used ID (e.g., 1000, 1001, 1002...)
            </li>
            <li>
              <strong>Required columns:</strong> Email, FirstName, LastName,
              Role, Department
            </li>
            <li>
              <strong>Role & Department:</strong> Use dropdown lists in the
              Excel template (values loaded from database)
            </li>
            <li>File format: .xlsx or .xls (max 5MB)</li>
            <li>First row must contain column headers</li>
          </ul>
        </div>
      </div>
      <div className="bom-file-upload-section">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          className="bom-file-upload-input"
        />
        <button
          onClick={handleFileUploadClick}
          className="bom-file-upload-button"
        >
          <i className="bi bi-cloud-upload bom-file-upload-icon"></i>
          <span className="bom-file-upload-text">
            Click to select Excel file
          </span>
          <small className="bom-file-upload-small">
            Supported: .xlsx, .xls (Max 5MB)
          </small>
        </button>
      </div>
      {selectedFile && (
        <div className="bom-selected-file-wrapper">
          <div className="bom-selected-file-container">
            <i className="bi bi-file-earmark-excel-fill bom-selected-file-icon"></i>
            <div className="bom-selected-file-info">
              <div className="bom-selected-file-name">{selectedFile.name}</div>
              <div className="bom-selected-file-size">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedFile(null);
                setUploadResult(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              className="bom-remove-file-button"
            >
              <i className="bi bi-x"></i>
            </button>
          </div>
        </div>
      )}
      {selectedFile && (
        <div className="bom-import-button-wrapper">
          <button
            onClick={handleBulkImport}
            disabled={loading}
            className="bom-import-button"
          >
            {loading ? (
              <>
                <span className="bom-spinner" />
                Processing...
              </>
            ) : (
              <>
                <i className="bi bi-upload"></i>
                Import Users
              </>
            )}
          </button>
        </div>
      )}
      {uploadResult && <UploadResults uploadResult={uploadResult} />}
    </div>
  );
};
export default ImportTab;
