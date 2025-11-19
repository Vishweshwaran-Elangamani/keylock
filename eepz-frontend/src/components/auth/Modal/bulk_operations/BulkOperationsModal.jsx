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
  const fileInputRef = useRef(null);

  // Scroll to errors when they appear
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

  // Categorize errors by type for better display
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
      setLoading(true);

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
      setLoading(false);
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

      console.log("=== BULK IMPORT RESULT ===");
      console.log("Full result:", result);
      console.log("Success flag:", result.success);
      console.log("Message:", result.message);
      console.log("Data object:", result.data);
      console.log("Errors array:", result.data?.errors);
      console.log("Success count:", result.data?.successCount);
      console.log("Failure count:", result.data?.failureCount);
      console.log("Total records:", result.data?.totalRecords);
      console.log("========================");

      toast.dismiss(loadingToastId);

      if (result.success) {
        const data = result.data;

        setUploadResult({
          successCount: data.successCount || 0,
          failureCount: data.failureCount || 0,
          totalRecords: data.totalRecords || 0,
          errors: data.errors || [],
          categorizedErrors:
            data.errors && data.errors.length > 0
              ? categorizeErrors(data.errors)
              : null,
        });

        if (data.failureCount === 0) {
          toast.success(
            `✓ Successfully imported all ${data.successCount} users!`,
            { duration: 5000 }
          );
        } else if (data.successCount > 0) {
          toast.warning(
            `⚠ ${data.successCount} imported, ${data.failureCount} failed. Scroll down to see details.`,
            { duration: 8000 }
          );
        } else {
          toast.error(
            `✗ All ${data.totalRecords} records failed. Scroll down to see all errors.`,
            { duration: 8000 }
          );
        }

        if (data.successCount > 0) {
          onSuccess?.();
        }
      } else {
        toast.error(result.message || "Import failed", { duration: 5000 });

        if (result.data?.errors) {
          setUploadResult({
            successCount: 0,
            failureCount: result.data.failureCount || result.data.errors.length,
            totalRecords: result.data.totalRecords || result.data.errors.length,
            errors: result.data.errors,
            categorizedErrors: categorizeErrors(result.data.errors),
          });
        }
      }
    } catch (error) {
      console.error("=== BULK IMPORT ERROR ===");
      console.error("Error object:", error);
      console.error("Error message:", error.message);
      console.error("Error response:", error.response);
      console.error("Error response data:", error.response?.data);
      console.error("========================");

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
          categorizedErrors: categorizeErrors(responseData.data.errors),
        });
      } else if (responseData?.errors && Array.isArray(responseData.errors)) {
        setUploadResult({
          successCount: 0,
          failureCount: responseData.errors.length,
          totalRecords: responseData.errors.length,
          errors: responseData.errors,
          categorizedErrors: categorizeErrors(responseData.errors),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    toast.dismiss();
    setSelectedFile(null);
    setUploadResult(null);
    setActiveTab("import");
    onClose();
  };

  return (
    <>
      <div className="modal-backdrop-bulk" onClick={handleClose}></div>
      <div className="modal-wrapper-bulk">
        <div className="modal-dialog-bulk">
          <div className="modal-content-bulk">
            <div className="modal-header-bulk">
              <h5 className="modal-title-bulk">
                <i className="bi bi-database"></i>
                Bulk Operations
              </h5>
              <button
                type="button"
                className="modal-close-btn-bulk"
                onClick={handleClose}
                aria-label="Close"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="bulk-tabs-container">
              <button
                className={`bulk-tab-btn ${
                  activeTab === "import" ? "active" : ""
                }`}
                onClick={() => setActiveTab("import")}
              >
                <i className="bi bi-upload"></i>
                Import Users
              </button>
              <button
                className={`bulk-tab-btn ${
                  activeTab === "export" ? "active" : ""
                }`}
                onClick={() => setActiveTab("export")}
              >
                <i className="bi bi-download"></i>
                Export Data
              </button>
            </div>

            <div className="modal-body-bulk">
              {activeTab === "export" && (
                <div className="export-section-bulk">
                  <div className="section-header-bulk">
                    <i className="bi bi-file-earmark-spreadsheet"></i>
                    <div>
                      <h6 className="section-title-bulk">Export to Excel</h6>
                      <p className="section-subtitle-bulk">
                        Download data in Excel format for backup or analysis
                      </p>
                    </div>
                  </div>

                  <div className="export-cards-grid">
                    <div className="export-card-bulk">
                      <div className="export-card-icon-bulk icon-users">
                        <i className="bi bi-people"></i>
                      </div>
                      <div className="export-card-content-bulk">
                        <h6 className="export-card-title">Users</h6>
                        <p className="export-card-desc">
                          Export all users and their information
                        </p>
                        <button
                          className="btn-export-bulk"
                          onClick={() => handleExport("users")}
                          disabled={loading}
                        >
                          {loading ? (
                            <span className="spinner-bulk"></span>
                          ) : (
                            <i className="bi bi-download"></i>
                          )}
                          Export Users
                        </button>
                      </div>
                    </div>

                    <div className="export-card-bulk export-card-featured">
                      <div className="export-card-icon-bulk icon-complete">
                        <i className="bi bi-database"></i>
                      </div>
                      <div className="export-card-content-bulk">
                        <h6 className="export-card-title">Complete Export</h6>
                        <p className="export-card-desc">
                          Export everything in one file with multiple sheets
                        </p>
                        <button
                          className="btn-export-bulk btn-export-featured"
                          onClick={() => handleExport("all")}
                          disabled={loading}
                        >
                          {loading ? (
                            <span className="spinner-bulk"></span>
                          ) : (
                            <i className="bi bi-download"></i>
                          )}
                          Export All Data
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "import" && (
                <div className="import-section-bulk">
                  <div className="section-header-bulk">
                    <i className="bi bi-upload"></i>
                    <div>
                      <h6 className="section-title-bulk">Bulk Import Users</h6>
                      <p className="section-subtitle-bulk">
                        Upload an Excel file to create multiple users at once
                      </p>
                    </div>
                  </div>

                  <div className="template-download-section">
                    <button
                      className="btn-download-template"
                      onClick={handleDownloadTemplate}
                      disabled={isDownloadingTemplate}
                    >
                      {isDownloadingTemplate ? (
                        <>
                          <span className="spinner-bulk"></span>
                          Downloading...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-file-earmark-arrow-down"></i>
                          Download Excel Template
                        </>
                      )}
                    </button>
                    <small className="template-hint">
                      Download the template, fill in user details, and upload it
                      below
                    </small>
                  </div>

                  <div className="info-alert-bulk">
                    <i className="bi bi-info-circle-fill"></i>
                    <div>
                      <strong>Excel Format Requirements:</strong>
                      <ul className="instructions-list">
                        <li>
                          Required columns: EmployeeCompanyId, Email, FirstName,
                          LastName, Role, Department
                        </li>
                        <li>File format: .xlsx or .xls (max 5MB)</li>
                        <li>First row must contain column headers</li>
                        <li>
                          Follow template format with dropdown validations
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* FILE UPLOAD - FIXED VERSION */}
                  <div className="file-upload-container">
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="bulkImportFile"
                      accept=".xlsx,.xls"
                      onChange={handleFileSelect}
                      style={{ display: "none" }}
                    />
                    <button
                      type="button"
                      onClick={handleFileUploadClick}
                      className="file-upload-button-bulk"
                    >
                      <i className="bi bi-cloud-upload"></i>
                      <span className="upload-text">
                        Click to select Excel file
                      </span>
                      <small className="upload-hint">
                        Supported: .xlsx, .xls (Max 5MB)
                      </small>
                    </button>
                  </div>

                  {selectedFile && (
                    <div className="selected-file-bulk">
                      <i className="bi bi-file-earmark-excel-fill"></i>
                      <div className="file-details">
                        <span className="file-name">{selectedFile.name}</span>
                        <span className="file-size">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </span>
                      </div>
                      <button
                        className="btn-remove-file-bulk"
                        onClick={() => {
                          setSelectedFile(null);
                          setUploadResult(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                          }
                        }}
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    </div>
                  )}

                  {selectedFile && (
                    <button
                      className="btn-import-bulk"
                      onClick={handleBulkImport}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-bulk"></span>
                          Processing...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-upload"></i>
                          Import Users
                        </>
                      )}
                    </button>
                  )}

                  {/* RESULTS AND ERRORS SECTION */}
                  {uploadResult && (
                    <div className="upload-result-bulk">
                      <h6 className="result-title">
                        <i className="bi bi-bar-chart-fill"></i>
                        Import Results
                      </h6>

                      <div className="result-stats-grid">
                        <div className="result-stat-card total">
                          <i className="bi bi-file-earmark-text"></i>
                          <span className="stat-value">
                            {uploadResult.totalRecords}
                          </span>
                          <span className="stat-label">Total Records</span>
                        </div>
                        <div className="result-stat-card success">
                          <i className="bi bi-check-circle-fill"></i>
                          <span className="stat-value">
                            {uploadResult.successCount}
                          </span>
                          <span className="stat-label">Successful</span>
                        </div>
                        <div className="result-stat-card failed">
                          <i className="bi bi-x-circle-fill"></i>
                          <span className="stat-value">
                            {uploadResult.failureCount}
                          </span>
                          <span className="stat-label">Failed</span>
                        </div>
                      </div>

                      {uploadResult.errors &&
                        uploadResult.errors.length > 0 && (
                          <div className="error-details-bulk">
                            <div className="error-header">
                              <i className="bi bi-exclamation-triangle-fill"></i>
                              <span>Detailed Error Information</span>
                            </div>

                            <div className="error-summary-alert">
                              <i className="bi bi-info-circle-fill"></i>
                              <div className="error-summary-content">
                                <strong>
                                  {uploadResult.failureCount} record
                                  {uploadResult.failureCount !== 1 ? "s" : ""}{" "}
                                  failed to import
                                </strong>
                                <p>
                                  Review each error below. Format: Row number
                                  (Email) - Error description
                                </p>
                              </div>
                            </div>

                            {uploadResult.categorizedErrors ? (
                              <div className="error-categories">
                                {/* Duplicate Emails */}
                                {uploadResult.categorizedErrors.duplicateEmails
                                  .length > 0 && (
                                  <details
                                    className="error-category-section"
                                    open
                                  >
                                    <summary className="error-category-header error-duplicate-header">
                                      <div className="category-info">
                                        <i className="bi bi-envelope-x-fill"></i>
                                        <span className="category-title">
                                          Duplicate Email Addresses
                                        </span>
                                        <span className="category-count">
                                          {
                                            uploadResult.categorizedErrors
                                              .duplicateEmails.length
                                          }
                                        </span>
                                      </div>
                                      <i className="bi bi-chevron-down chevron-icon"></i>
                                    </summary>
                                    <div className="error-category-content">
                                      <ul className="error-list">
                                        {uploadResult.categorizedErrors.duplicateEmails.map(
                                          (error, index) => (
                                            <li
                                              key={`dup-${index}`}
                                              className="error-item error-duplicate"
                                            >
                                              <div className="error-icon">
                                                <i className="bi bi-envelope-x"></i>
                                              </div>
                                              <div className="error-content">
                                                <span className="error-message">
                                                  {error}
                                                </span>
                                              </div>
                                            </li>
                                          )
                                        )}
                                      </ul>
                                    </div>
                                  </details>
                                )}

                                {/* Validation Errors */}
                                {uploadResult.categorizedErrors.validationErrors
                                  .length > 0 && (
                                  <details
                                    className="error-category-section"
                                    open
                                  >
                                    <summary className="error-category-header error-validation-header">
                                      <div className="category-info">
                                        <i className="bi bi-exclamation-circle-fill"></i>
                                        <span className="category-title">
                                          Data Validation Errors
                                        </span>
                                        <span className="category-count">
                                          {
                                            uploadResult.categorizedErrors
                                              .validationErrors.length
                                          }
                                        </span>
                                      </div>
                                      <i className="bi bi-chevron-down chevron-icon"></i>
                                    </summary>
                                    <div className="error-category-content">
                                      <ul className="error-list">
                                        {uploadResult.categorizedErrors.validationErrors.map(
                                          (error, index) => (
                                            <li
                                              key={`val-${index}`}
                                              className="error-item error-validation"
                                            >
                                              <div className="error-icon">
                                                <i className="bi bi-x-circle"></i>
                                              </div>
                                              <div className="error-content">
                                                <span className="error-message">
                                                  {error}
                                                </span>
                                              </div>
                                            </li>
                                          )
                                        )}
                                      </ul>
                                    </div>
                                  </details>
                                )}

                                {/* Other Errors */}
                                {uploadResult.categorizedErrors.otherErrors
                                  .length > 0 && (
                                  <details
                                    className="error-category-section"
                                    open
                                  >
                                    <summary className="error-category-header error-other-header">
                                      <div className="category-info">
                                        <i className="bi bi-info-circle-fill"></i>
                                        <span className="category-title">
                                          Other Issues
                                        </span>
                                        <span className="category-count">
                                          {
                                            uploadResult.categorizedErrors
                                              .otherErrors.length
                                          }
                                        </span>
                                      </div>
                                      <i className="bi bi-chevron-down chevron-icon"></i>
                                    </summary>
                                    <div className="error-category-content">
                                      <ul className="error-list">
                                        {uploadResult.categorizedErrors.otherErrors.map(
                                          (error, index) => (
                                            <li
                                              key={`other-${index}`}
                                              className="error-item error-other"
                                            >
                                              <div className="error-icon">
                                                <i className="bi bi-info-circle"></i>
                                              </div>
                                              <div className="error-content">
                                                <span className="error-message">
                                                  {error}
                                                </span>
                                              </div>
                                            </li>
                                          )
                                        )}
                                      </ul>
                                    </div>
                                  </details>
                                )}
                              </div>
                            ) : (
                              <div className="error-category-content">
                                <ul className="error-list">
                                  {uploadResult.errors.map((error, index) => (
                                    <li key={index} className="error-item">
                                      <div className="error-icon">
                                        <i className="bi bi-x-circle"></i>
                                      </div>
                                      <div className="error-content">
                                        <span className="error-message">
                                          {error}
                                        </span>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer-bulk">
              <button
                type="button"
                className="btn-close-bulk"
                onClick={handleClose}
              >
                <i className="bi bi-x-circle"></i>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BulkOperationsModal;
