import { useState, useEffect, useRef } from "react";
import ExportService from "../../../../services/auth/exportService";
import BulkOperationService from "../../../../services/auth/bulkOperationService";
import { toast } from "sonner";
import "../../../../styles/auth/bulk_operations/BulkOperationsModal.css";

const BulkOperationsModal = ({ show, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState("import");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [exportingUsers, setExportingUsers] = useState(false);
  const [exportingAll, setExportingAll] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (uploadResult && uploadResult.errors && uploadResult.errors.length > 0) {
      setTimeout(() => {
        const errorSection = document.querySelector(".error-details-bulk");
        if (errorSection) {
          errorSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }, 100);
    }
  }, [uploadResult]);

  if (!show) return null;

  const categorizeErrors = (errors) => {
    const categorized = {
      duplicateEmails: [],
      validationErrors: [],
      otherErrors: [],
    };

    errors.forEach((error) => {
      const errorStr = error.toLowerCase();

      if (
        errorStr.includes("email") &&
        (errorStr.includes("already") ||
          errorStr.includes("exists") ||
          errorStr.includes("duplicate"))
      ) {
        categorized.duplicateEmails.push(error);
      } else if (errorStr.includes("row")) {
        categorized.validationErrors.push(error);
      } else {
        categorized.otherErrors.push(error);
      }
    });

    return categorized;
  };

  const handleExport = async (type) => {
    try {
      if (type === "users") {
        setExportingUsers(true);
      } else if (type === "all") {
        setExportingAll(true);
      }

      switch (type) {
        case "roles":
          await ExportService.exportRoles();
          toast.success("Roles exported successfully!");
          break;
        case "departments":
          await ExportService.exportDepartments();
          toast.success("Departments exported successfully!");
          break;
        case "users":
          await ExportService.exportUsers();
          toast.success("Users exported successfully!");
          break;
        case "all":
          await ExportService.exportAllData();
          toast.success("All data exported successfully!");
          break;
        default:
          break;
      }
    } catch (error) {
      toast.error(error.message || "Export failed");
    } finally {
      if (type === "users") {
        setExportingUsers(false);
      } else if (type === "all") {
        setExportingAll(false);
      }
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      await BulkOperationService.downloadExcelTemplate();
      toast.success("Template downloaded successfully!");
    } catch (error) {
      console.error("Template download error:", error);
      toast.error(error.message || "Failed to download template");
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const validateFile = (file) => {
    const errors = [];

    const validExtensions = [".xlsx", ".xls"];
    const fileExtension = file.name
      .substring(file.name.lastIndexOf("."))
      .toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      errors.push("Invalid file format. Only .xlsx and .xls files are allowed");
    }

    const maxSizeInBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      errors.push("File size exceeds 5MB limit");
    }

    if (file.name.length > 100) {
      errors.push("File name is too long (max 100 characters)");
    }

    return errors;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const validationErrors = validateFile(file);

    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => toast.error(error));
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
    setUploadResult(null);
    toast.info(`File selected: ${file.name}`);
  };

  const handleFileUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
      fileInputRef.current.click();
    }
  };

  const handleBulkImport = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }

    const loadingToastId = toast.loading("Processing import...");

    try {
      setLoading(true);

      const result = await BulkOperationService.bulkCreateUsersFromExcel(
        selectedFile
      );

      toast.dismiss(loadingToastId);

      if (result.success) {
        const data = result.data;

        setUploadResult({
          successCount: data.successCount || 0,
          failureCount: data.failureCount || 0,
          totalRecords: data.totalRecords || 0,
          errors: data.errors || [],
          successfulUsers: data.successfulUsers || [],
          categorizedErrors:
            data.errors && data.errors.length > 0
              ? categorizeErrors(data.errors)
              : null,
        });

        if (data.failureCount === 0) {
          toast.success(
            ` ${data.successCount} user${
              data.successCount !== 1 ? "s" : ""
            } added successfully!`,
            {
              duration: 6000,
              description:
                "All records have been imported and are now active in the system.",
            }
          );
        } else if (data.successCount > 0) {
          toast.success(
            ` ${data.successCount} user${
              data.successCount !== 1 ? "s" : ""
            } added successfully!`,
            { duration: 5000 }
          );
          toast.warning(
            ` ${data.failureCount} record${
              data.failureCount !== 1 ? "s" : ""
            } failed. Check details below.`,
            { duration: 8000 }
          );
        } else {
          toast.error(
            ` All ${data.totalRecords} records failed. Review errors below.`,
            { duration: 8000 }
          );
        }
      } else {
        toast.error(result.message || "Import failed", { duration: 5000 });

        if (result.data?.errors) {
          setUploadResult({
            successCount: 0,
            failureCount: result.data.failureCount || result.data.errors.length,
            totalRecords: result.data.totalRecords || result.data.errors.length,
            errors: result.data.errors,
            successfulUsers: [],
            categorizedErrors: categorizeErrors(result.data.errors),
          });
        }
      }
    } catch (error) {
      toast.dismiss(loadingToastId);

      const responseData = error.response?.data;
      const errorMessage =
        responseData?.message || error.message || "Import failed";

      toast.error(errorMessage, { duration: 5000 });

      if (
        responseData?.data?.errors &&
        Array.isArray(responseData.data.errors)
      ) {
        setUploadResult({
          successCount: responseData.data.successCount || 0,
          failureCount:
            responseData.data.failureCount || responseData.data.errors.length,
          totalRecords:
            responseData.data.totalRecords || responseData.data.errors.length,
          errors: responseData.data.errors,
          successfulUsers: responseData.data.successfulUsers || [],
          categorizedErrors: categorizeErrors(responseData.data.errors),
        });
      } else if (responseData?.errors && Array.isArray(responseData.errors)) {
        setUploadResult({
          successCount: 0,
          failureCount: responseData.errors.length,
          totalRecords: responseData.errors.length,
          errors: responseData.errors,
          successfulUsers: [],
          categorizedErrors: categorizeErrors(responseData.errors),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  
  const handleClose = () => {
    toast.dismiss();

    
    if (uploadResult && uploadResult.successCount > 0) {
      onSuccess?.(); 
    }

    setSelectedFile(null);
    setUploadResult(null);
    setActiveTab("import");
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target.classList.contains("bom-backdrop")) {
      handleClose();
    }
  };

  return (
    <>
      <div className="bom-backdrop" onClick={handleBackdropClick} />

      <div className="bom-modal-wrapper">
        <div className="bom-modal-dialog">
          <div className="bom-modal-header">
            <div className="bom-modal-header-title">
              <i className="bi bi-database"></i>
              Bulk Operations
            </div>
            <button onClick={handleClose} className="bom-close-button">
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          <div className="bom-tabs-container">
            <button
              onClick={() => setActiveTab("import")}
              className={`bom-tab-button ${
                activeTab === "import" ? "active" : ""
              }`}
            >
              <i className="bi bi-download"></i>
              Import Users
            </button>
            <button
              onClick={() => setActiveTab("export")}
              className={`bom-tab-button ${
                activeTab === "export" ? "active" : ""
              }`}
            >
              <i className="bi bi-upload"></i>
              Export Data
            </button>
          </div>

          <div className="bom-modal-body">
            {activeTab === "export" && (
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
            )}

            {activeTab === "import" && (
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
                    Download the template, fill in user details, and upload it
                    below
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
                        <strong>Employee IDs are AUTO-GENERATED:</strong> Do NOT
                        include Employee ID column. IDs will be assigned
                        automatically starting from the last used ID (e.g.,
                        1000, 1001, 1002...)
                      </li>
                      <li>
                        <strong>Required columns:</strong> Email, FirstName,
                        LastName, Role, Department
                      </li>
                      <li>
                        <strong>Role & Department:</strong> Use dropdown lists
                        in the Excel template (values loaded from database)
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
                        <div className="bom-selected-file-name">
                          {selectedFile.name}
                        </div>
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

                {uploadResult && (
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
                        <div className="bom-stat-label bom-stat-label-failed">
                          Failed
                        </div>
                      </div>
                    </div>

                    
                    {uploadResult.successCount > 0 && (
                      <div className="bom-success-details-container">
                        <details
                          open
                          className="bom-error-category"
                          style={{
                            borderColor: "#10b981",
                            background: "#f0fdf4",
                          }}
                        >
                          <summary
                            className="bom-error-category-summary"
                            style={{ background: "#dcfce7", color: "#065f46" }}
                          >
                            <div className="bom-error-category-summary-content">
                              <i
                                className="bi bi-check-circle-fill"
                                style={{ color: "#10b981" }}
                              ></i>
                              <span>Successfully Imported Users</span>
                              <span
                                className="bom-error-category-badge"
                                style={{ background: "#10b981" }}
                              >
                                {uploadResult.successCount}
                              </span>
                            </div>
                            <i className="bi bi-chevron-down"></i>
                          </summary>
                          <div className="bom-error-category-content">
                            {uploadResult.successfulUsers &&
                            uploadResult.successfulUsers.length > 0 ? (
                              <ul className="bom-error-list">
                                {uploadResult.successfulUsers.map(
                                  (user, index) => (
                                    <li
                                      key={`success-${index}`}
                                      className="bom-error-list-item"
                                      style={{
                                        borderLeft: "3px solid #10b981",
                                      }}
                                    >
                                      <i
                                        className="bi bi-check-circle-fill"
                                        style={{ color: "#10b981" }}
                                      ></i>
                                      <span>
                                        <strong>{user.email}</strong> -{" "}
                                        {user.firstName} {user.lastName} (
                                        {user.role} - {user.department})
                                      </span>
                                    </li>
                                  )
                                )}
                              </ul>
                            ) : (
                              <div
                                style={{
                                  padding: "1rem",
                                  textAlign: "center",
                                  color: "#065f46",
                                }}
                              >
                                <i
                                  className="bi bi-check-circle-fill"
                                  style={{ fontSize: "2rem", color: "#10b981" }}
                                ></i>
                                <p
                                  style={{
                                    marginTop: "0.5rem",
                                    fontWeight: 600,
                                  }}
                                >
                                  {uploadResult.successCount} user
                                  {uploadResult.successCount !== 1 ? "s" : ""}{" "}
                                  imported successfully!
                                </p>
                                <small style={{ color: "#047857" }}>
                                  All users are now active in the system.
                                </small>
                              </div>
                            )}
                          </div>
                        </details>
                      </div>
                    )}

                    {uploadResult.errors && uploadResult.errors.length > 0 && (
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
                              {uploadResult.failureCount !== 1 ? "s" : ""}{" "}
                              failed to import
                            </strong>
                            <p className="bom-error-summary-text">
                              Review each error below. Format: Row number
                              (Email) - Error description
                            </p>
                          </div>

                          {uploadResult.categorizedErrors ? (
                            <div>
                              {uploadResult.categorizedErrors.duplicateEmails
                                .length > 0 && (
                                <details
                                  open
                                  className="bom-error-category bom-error-category-duplicate"
                                >
                                  <summary className="bom-error-category-summary bom-error-category-summary-duplicate">
                                    <div className="bom-error-category-summary-content">
                                      <i className="bi bi-envelope-x-fill"></i>
                                      <span>Duplicate Email Addresses</span>
                                      <span className="bom-error-category-badge bom-error-category-badge-duplicate">
                                        {
                                          uploadResult.categorizedErrors
                                            .duplicateEmails.length
                                        }
                                      </span>
                                    </div>
                                    <i className="bi bi-chevron-down"></i>
                                  </summary>
                                  <div className="bom-error-category-content">
                                    <ul className="bom-error-list">
                                      {uploadResult.categorizedErrors.duplicateEmails.map(
                                        (error, index) => (
                                          <li
                                            key={`dup-${index}`}
                                            className="bom-error-list-item bom-error-list-item-duplicate"
                                          >
                                            <i className="bi bi-envelope-x bom-error-list-item-icon"></i>
                                            <span>{error}</span>
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                </details>
                              )}

                              {uploadResult.categorizedErrors.validationErrors
                                .length > 0 && (
                                <details
                                  open
                                  className="bom-error-category bom-error-category-validation"
                                >
                                  <summary className="bom-error-category-summary bom-error-category-summary-validation">
                                    <div className="bom-error-category-summary-content">
                                      <i className="bi bi-exclamation-circle-fill"></i>
                                      <span>Data Validation Errors</span>
                                      <span className="bom-error-category-badge bom-error-category-badge-validation">
                                        {
                                          uploadResult.categorizedErrors
                                            .validationErrors.length
                                        }
                                      </span>
                                    </div>
                                    <i className="bi bi-chevron-down"></i>
                                  </summary>
                                  <div className="bom-error-category-content">
                                    <ul className="bom-error-list">
                                      {uploadResult.categorizedErrors.validationErrors.map(
                                        (error, index) => (
                                          <li
                                            key={`val-${index}`}
                                            className="bom-error-list-item bom-error-list-item-validation"
                                          >
                                            <i className="bi bi-x-circle bom-error-list-item-icon"></i>
                                            <span>{error}</span>
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                </details>
                              )}

                              {uploadResult.categorizedErrors.otherErrors
                                .length > 0 && (
                                <details
                                  open
                                  className="bom-error-category bom-error-category-other"
                                >
                                  <summary className="bom-error-category-summary bom-error-category-summary-other">
                                    <div className="bom-error-category-summary-content">
                                      <i className="bi bi-info-circle-fill"></i>
                                      <span>Other Issues</span>
                                      <span className="bom-error-category-badge bom-error-category-badge-other">
                                        {
                                          uploadResult.categorizedErrors
                                            .otherErrors.length
                                        }
                                      </span>
                                    </div>
                                    <i className="bi bi-chevron-down"></i>
                                  </summary>
                                  <div className="bom-error-category-content">
                                    <ul className="bom-error-list">
                                      {uploadResult.categorizedErrors.otherErrors.map(
                                        (error, index) => (
                                          <li
                                            key={`other-${index}`}
                                            className="bom-error-list-item bom-error-list-item-other"
                                          >
                                            <i className="bi bi-info-circle bom-error-list-item-icon"></i>
                                            <span>{error}</span>
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                </details>
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
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bom-modal-footer">
            <button onClick={handleClose} className="bom-footer-close-button">
              <i className="bi bi-x-circle"></i>
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default BulkOperationsModal;
