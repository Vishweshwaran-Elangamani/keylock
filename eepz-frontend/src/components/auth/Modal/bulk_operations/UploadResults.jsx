import SuccessDetails from "./SuccessDetails";
import ErrorDetails from "./ErrorDetails";
const UploadResults = ({ uploadResult }) => {
  return (
    <div className="bom-upload-results-container">
      <h6 className="bom-upload-results-title">
        <i className="bi bi-bar-chart-fill"></i>
        Import Results
      </h6>
      <div className="bom-stats-grid">
        <div className="bom-stat-card bom-stat-card-total">
          <i className="bi bi-file-earmark-text bom-stat-icon bom-stat-icon-total"></i>
          <div className="bom-stat-value bom-stat-value-total">
            {uploadResult.totalRecords}
          </div>
          <div className="bom-stat-label bom-stat-label-total">
            Total Records
          </div>
        </div>
        <div className="bom-stat-card bom-stat-card-success">
          <i className="bi bi-check-circle-fill bom-stat-icon bom-stat-icon-success"></i>
          <div className="bom-stat-value bom-stat-value-success">
            {uploadResult.successCount}
          </div>
          <div className="bom-stat-label bom-stat-label-success">
            Successful
          </div>
        </div>
        <div className="bom-stat-card bom-stat-card-failed">
          <i className="bi bi-x-circle-fill bom-stat-icon bom-stat-icon-failed"></i>
          <div className="bom-stat-value bom-stat-value-failed">
            {uploadResult.failureCount}
          </div>
          <div className="bom-stat-label bom-stat-label-failed">Failed</div>
        </div>
      </div>
      {uploadResult.successCount > 0 && (
        <SuccessDetails uploadResult={uploadResult} />
      )}
      {uploadResult.errors && uploadResult.errors.length > 0 && (
        <ErrorDetails uploadResult={uploadResult} />
      )}
    </div>
  );
};
export default UploadResults;
