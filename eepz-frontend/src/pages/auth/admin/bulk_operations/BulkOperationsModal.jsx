// import { useState } from "react";
// import ExportService from "../../../../services/auth/exportService";
// import BulkOperationService from "../../../../services/auth/bulkOperationService";
// import toastr from "toastr";
// import "toastr/build/toastr.min.css";
// import "../../../../styles/auth/bulk_operations/BulkOperationsModal.css";

// const BulkOperationsModal = ({ show, onClose, onSuccess }) => {
//   const [activeTab, setActiveTab] = useState("export");
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [uploadResult, setUploadResult] = useState(null);
//   const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

//   toastr.options = {
//     closeButton: true,
//     progressBar: true,
//     positionClass: "toast-top-right",
//     timeOut: 3000,
//   };

//   if (!show) return null;

//   const handleExport = async (type) => {
//     try {
//       setLoading(true);

//       switch (type) {
//         case "roles":
//           await ExportService.exportRoles();
//           toastr.success("Roles exported successfully!");
//           break;
//         case "departments":
//           await ExportService.exportDepartments();
//           toastr.success("Departments exported successfully!");
//           break;
//         case "users":
//           await ExportService.exportUsers();
//           toastr.success("Users exported successfully!");
//           break;
//         case "all":
//           await ExportService.exportAllData();
//           toastr.success("All data exported successfully!");
//           break;
//         default:
//           break;
//       }
//     } catch (error) {
//       toastr.error(error.message || "Export failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDownloadTemplate = async () => {
//     try {
//       setIsDownloadingTemplate(true);
//       await BulkOperationService.downloadExcelTemplate();
//       toastr.success("Template downloaded successfully!");
//     } catch (error) {
//       console.error("Template download error:", error);
//       toastr.error(error.message || "Failed to download template");
//     } finally {
//       setIsDownloadingTemplate(false);
//     }
//   };

//   const validateFile = (file) => {
//     const errors = [];

//     const validExtensions = [".xlsx", ".xls"];
//     const fileExtension = file.name
//       .substring(file.name.lastIndexOf("."))
//       .toLowerCase();

//     if (!validExtensions.includes(fileExtension)) {
//       errors.push("Invalid file format. Only .xlsx and .xls files are allowed");
//     }

//     const maxSizeInBytes = 5 * 1024 * 1024;
//     if (file.size > maxSizeInBytes) {
//       errors.push("File size exceeds 5MB limit");
//     }

//     if (file.name.length > 100) {
//       errors.push("File name is too long (max 100 characters)");
//     }

//     return errors;
//   };

//   const handleFileSelect = (e) => {
//     const file = e.target.files[0];

//     if (!file) return;

//     const validationErrors = validateFile(file);

//     if (validationErrors.length > 0) {
//       validationErrors.forEach((error) => toastr.error(error));
//       e.target.value = "";
//       return;
//     }

//     setSelectedFile(file);
//     setUploadResult(null);
//     toastr.info(`File selected: ${file.name}`);
//   };

//   const handleBulkImport = async () => {
//     if (!selectedFile) {
//       toastr.error("Please select a file first");
//       return;
//     }

//     try {
//       setLoading(true);
//       const result = await BulkOperationService.bulkCreateUsersFromExcel(
//         selectedFile
//       );

//       console.log("Bulk import result:", result);

//       if (result.success) {
//         const data = result.data;
//         setUploadResult({
//           successCount: data.successCount || 0,
//           failureCount: data.failureCount || 0,
//           totalRecords: data.totalRecords || 0,
//           errors: data.errors || [],
//         });

//         toastr.success(
//           `Successfully created ${data.successCount} users out of ${data.totalRecords}`
//         );

//         if (data.failureCount > 0) {
//           toastr.warning(`${data.failureCount} users failed to import`);
//         }

//         onSuccess?.();
//       } else {
//         toastr.error(result.message || "Import failed");
//       }
//     } catch (error) {
//       console.error("Import error:", error);
//       toastr.error(
//         error.response?.data?.message || error.message || "Import failed"
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleClose = () => {
//     setSelectedFile(null);
//     setUploadResult(null);
//     setActiveTab("export");
//     onClose();
//   };

//   return (
//     <>
//       <div className="modal-backdrop-bulk"></div>
//       <div className="modal-wrapper-bulk">
//         <div className="modal-dialog-bulk">
//           <div className="modal-content-bulk">
//             <div className="modal-header-bulk">
//               <h5 className="modal-title-bulk">
//                 <i className="bi bi-database"></i>
//                 Bulk Operations
//               </h5>
//               <button
//                 type="button"
//                 className="modal-close-btn-bulk"
//                 onClick={handleClose}
//                 aria-label="Close"
//               >
//                 <i className="bi bi-x-lg"></i>
//               </button>
//             </div>

//             <div className="bulk-tabs-container">
//               <button
//                 className={`bulk-tab-btn ${
//                   activeTab === "export" ? "active" : ""
//                 }`}
//                 onClick={() => setActiveTab("export")}
//               >
//                 <i className="bi bi-download"></i>
//                 Export Data
//               </button>
//               <button
//                 className={`bulk-tab-btn ${
//                   activeTab === "import" ? "active" : ""
//                 }`}
//                 onClick={() => setActiveTab("import")}
//               >
//                 <i className="bi bi-upload"></i>
//                 Import Users
//               </button>
//             </div>

//             <div className="modal-body-bulk">
//               {activeTab === "export" && (
//                 <div className="export-section-bulk">
//                   <div className="section-header-bulk">
//                     <i className="bi bi-file-earmark-spreadsheet"></i>
//                     <div>
//                       <h6 className="section-title-bulk">Export to Excel</h6>
//                       <p className="section-subtitle-bulk">
//                         Download data in Excel format for backup or analysis
//                       </p>
//                     </div>
//                   </div>

//                   <div className="export-cards-grid">
//                     <div className="export-card-bulk">
//                       <div className="export-card-icon-bulk icon-users">
//                         <i className="bi bi-people"></i>
//                       </div>
//                       <div className="export-card-content-bulk">
//                         <h6 className="export-card-title">Users</h6>
//                         <p className="export-card-desc">
//                           Export all users and their information
//                         </p>
//                         <button
//                           className="btn-export-bulk"
//                           onClick={() => handleExport("users")}
//                           disabled={loading}
//                         >
//                           {loading ? (
//                             <span className="spinner-bulk"></span>
//                           ) : (
//                             <i className="bi bi-download"></i>
//                           )}
//                           Export Users
//                         </button>
//                       </div>
//                     </div>

//                     <div className="export-card-bulk export-card-featured">
//                       <div className="export-card-icon-bulk icon-complete">
//                         <i className="bi bi-database"></i>
//                       </div>
//                       <div className="export-card-content-bulk">
//                         <h6 className="export-card-title">Complete Export</h6>
//                         <p className="export-card-desc">
//                           Export everything in one file with multiple sheets
//                         </p>
//                         <button
//                           className="btn-export-bulk btn-export-featured"
//                           onClick={() => handleExport("all")}
//                           disabled={loading}
//                         >
//                           {loading ? (
//                             <span className="spinner-bulk"></span>
//                           ) : (
//                             <i className="bi bi-download"></i>
//                           )}
//                           Export All Data
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {activeTab === "import" && (
//                 <div className="import-section-bulk">
//                   <div className="section-header-bulk">
//                     <i className="bi bi-upload"></i>
//                     <div>
//                       <h6 className="section-title-bulk">Bulk Import Users</h6>
//                       <p className="section-subtitle-bulk">
//                         Upload an Excel file to create multiple users at once
//                       </p>
//                     </div>
//                   </div>

//                   <div className="template-download-section">
//                     <button
//                       className="btn-download-template"
//                       onClick={handleDownloadTemplate}
//                       disabled={isDownloadingTemplate}
//                     >
//                       {isDownloadingTemplate ? (
//                         <>
//                           <span className="spinner-bulk"></span>
//                           Downloading...
//                         </>
//                       ) : (
//                         <>
//                           <i className="bi bi-file-earmark-arrow-down"></i>
//                           Download Excel Template
//                         </>
//                       )}
//                     </button>
//                     <small className="template-hint">
//                       Download the template, fill in user details, and upload it
//                       below
//                     </small>
//                   </div>

//                   <div className="info-alert-bulk">
//                     <i className="bi bi-info-circle-fill"></i>
//                     <div>
//                       <strong>Excel Format Requirements:</strong>
//                       <ul className="instructions-list">
//                         <li>
//                           Required columns: EmployeeCompanyId, Email, FirstName,
//                           LastName, RoleId, DepartmentId
//                         </li>
//                         <li>File format: .xlsx or .xls (max 5MB)</li>
//                         <li>First row must contain column headers</li>
//                         <li>
//                           Sample data row included in template (delete before
//                           uploading)
//                         </li>
//                       </ul>
//                     </div>
//                   </div>

//                   <div className="file-upload-container">
//                     <input
//                       type="file"
//                       id="bulkImportFile"
//                       accept=".xlsx,.xls"
//                       onChange={handleFileSelect}
//                       style={{ display: "none" }}
//                     />
//                     <label
//                       htmlFor="bulkImportFile"
//                       className="file-upload-label-bulk"
//                     >
//                       <i className="bi bi-cloud-upload"></i>
//                       <span className="upload-text">
//                         Click to select Excel file
//                       </span>
//                       <small className="upload-hint">
//                         or drag and drop here
//                       </small>
//                     </label>
//                   </div>

//                   {selectedFile && (
//                     <div className="selected-file-bulk">
//                       <i className="bi bi-file-earmark-excel-fill"></i>
//                       <div className="file-details">
//                         <span className="file-name">{selectedFile.name}</span>
//                         <span className="file-size">
//                           {(selectedFile.size / 1024).toFixed(2)} KB
//                         </span>
//                       </div>
//                       <button
//                         className="btn-remove-file-bulk"
//                         onClick={() => {
//                           setSelectedFile(null);
//                           setUploadResult(null);
//                           document.getElementById("bulkImportFile").value = "";
//                         }}
//                       >
//                         <i className="bi bi-x"></i>
//                       </button>
//                     </div>
//                   )}

//                   {selectedFile && (
//                     <button
//                       className="btn-import-bulk"
//                       onClick={handleBulkImport}
//                       disabled={loading}
//                     >
//                       {loading ? (
//                         <>
//                           <span className="spinner-bulk"></span>
//                           Processing...
//                         </>
//                       ) : (
//                         <>
//                           <i className="bi bi-upload"></i>
//                           Import Users
//                         </>
//                       )}
//                     </button>
//                   )}

//                   {uploadResult && (
//                     <div className="upload-result-bulk">
//                       <h6 className="result-title">Import Results:</h6>
//                       <div className="result-stats-grid">
//                         <div className="result-stat-card total">
//                           <i className="bi bi-file-earmark-text"></i>
//                           <span className="stat-value">
//                             {uploadResult.totalRecords}
//                           </span>
//                           <span className="stat-label">Total Records</span>
//                         </div>
//                         <div className="result-stat-card success">
//                           <i className="bi bi-check-circle-fill"></i>
//                           <span className="stat-value">
//                             {uploadResult.successCount}
//                           </span>
//                           <span className="stat-label">Successful</span>
//                         </div>
//                         <div className="result-stat-card failed">
//                           <i className="bi bi-x-circle-fill"></i>
//                           <span className="stat-value">
//                             {uploadResult.failureCount}
//                           </span>
//                           <span className="stat-label">Failed</span>
//                         </div>
//                       </div>

//                       {uploadResult.errors &&
//                         uploadResult.errors.length > 0 && (
//                           <div className="error-details-bulk">
//                             <h6 className="error-title">
//                               <i className="bi bi-exclamation-triangle-fill"></i>
//                               Errors ({uploadResult.errors.length}):
//                             </h6>
//                             <ul className="error-list">
//                               {uploadResult.errors
//                                 .slice(0, 10)
//                                 .map((error, index) => (
//                                   <li key={index}>{error}</li>
//                                 ))}
//                               {uploadResult.errors.length > 10 && (
//                                 <li className="more-errors">
//                                   ... and {uploadResult.errors.length - 10} more
//                                   errors
//                                 </li>
//                               )}
//                             </ul>
//                           </div>
//                         )}
//                     </div>
//                   )}
//                 </div>
//               )}
//             </div>

//             <div className="modal-footer-bulk">
//               <button
//                 type="button"
//                 className="btn-close-bulk"
//                 onClick={handleClose}
//               >
//                 <i className="bi bi-x-circle"></i>
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default BulkOperationsModal;

/**
 * BulkOperationsModal Component
 * 
 * A modal for performing bulk operations including:
 * - Exporting data (users, roles, departments, or all data) to Excel
 * - Importing users in bulk from an Excel file
 * Features:
 * - Tab-based UI for Export and Import operations
 * - File validation (format and size)
 * - Excel template download
 * - Import result tracking with error details
 * - Toast notifications using Sonner
 * - Loading states for all operations
 * 
 * @component
 * @param {Object} props - Component props
 * @param {boolean} props.show - Controls modal visibility
 * @param {function} props.onClose - Callback when modal is closed
 * @param {function} props.onSuccess - Callback when import succeeds
 */

import { useState } from "react";
import ExportService from "../../../../services/auth/exportService";
import BulkOperationService from "../../../../services/auth/bulkOperationService";
import { toast } from "sonner";
import "../../../../styles/auth/bulk_operations/BulkOperationsModal.css";

const BulkOperationsModal = ({ show, onClose, onSuccess }) => {
  // ========================
  // STATE MANAGEMENT
  // ========================

  /**
   * Active tab state - controls which operation tab is displayed
   * Options: "export" or "import"
   */
  const [activeTab, setActiveTab] = useState("export");

  /**
   * Selected file state - stores the file selected for bulk import
   */
  const [selectedFile, setSelectedFile] = useState(null);

  /**
   * Loading state - tracks form submission and export status
   * Used to disable buttons and show loading indicators
   */
  const [loading, setLoading] = useState(false);

  /**
   * Upload result state - stores import operation results
   * Contains: successCount, failureCount, totalRecords, errors
   */
  const [uploadResult, setUploadResult] = useState(null);

  /**
   * Template download loading state - tracks template download status
   */
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  // ========================
  // GUARD CLAUSE
  // ========================

  /**
   * Don't render modal if show prop is false
   */
  if (!show) return null;

  // ========================
  // EXPORT OPERATIONS
  // ========================

  /**
   * Handles data export to Excel
   * Exports different data types based on parameter
   * Shows Sonner toast notifications for user feedback
   * 
   * @param {string} type - Type of export: "roles", "departments", "users", or "all"
   */
  const handleExport = async (type) => {
    try {
      setLoading(true);
      toast.loading("Exporting data...");

      // -------- Export based on type --------
      switch (type) {
        case "roles":
          await ExportService.exportRoles();
          toast.dismiss();
          toast.success("Roles exported successfully!");
          break;
        case "departments":
          await ExportService.exportDepartments();
          toast.dismiss();
          toast.success("Departments exported successfully!");
          break;
        case "users":
          await ExportService.exportUsers();
          toast.dismiss();
          toast.success("Users exported successfully!");
          break;
        case "all":
          await ExportService.exportAllData();
          toast.dismiss();
          toast.success("All data exported successfully!");
          break;
        default:
          break;
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.dismiss();
      toast.error(error.message || "Export failed");
    } finally {
      setLoading(false);
    }
  };

  // ========================
  // TEMPLATE OPERATIONS
  // ========================

  /**
   * Handles Excel template download
   * Downloads the template file for bulk user import
   * Shows Sonner toast notifications
   */
  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      toast.loading("Downloading template...");

      // -------- API Call --------
      await BulkOperationService.downloadExcelTemplate();
      
      toast.dismiss();
      toast.success("Template downloaded successfully!");
    } catch (error) {
      console.error("Template download error:", error);
      toast.dismiss();
      toast.error(error.message || "Failed to download template");
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  // ========================
  // FILE VALIDATION
  // ========================

  /**
   * Validates selected file before import
   * Checks file format, size, and name length
   * 
   * @param {File} file - File to validate
   * @returns {Array} Array of error messages (empty if valid)
   */
  const validateFile = (file) => {
    const errors = [];

    // -------- Validate File Extension --------
    const validExtensions = [".xlsx", ".xls"];
    const fileExtension = file.name
      .substring(file.name.lastIndexOf("."))
      .toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      errors.push("Invalid file format. Only .xlsx and .xls files are allowed");
    }

    // -------- Validate File Size --------
    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeInBytes) {
      errors.push("File size exceeds 5MB limit");
    }

    // -------- Validate File Name Length --------
    if (file.name.length > 100) {
      errors.push("File name is too long (max 100 characters)");
    }

    return errors;
  };

  // ========================
  // FILE SELECTION
  // ========================

  /**
   * Handles file selection from input
   * Validates file and shows toast notifications
   * 
   * @param {Event} e - File input change event
   */
  const handleFileSelect = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    // -------- Validate File --------
    const validationErrors = validateFile(file);

    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => toast.error(error));
      e.target.value = "";
      return;
    }

    // -------- Set Selected File --------
    setSelectedFile(file);
    setUploadResult(null);
    toast.info(`File selected: ${file.name}`);
  };

  // ========================
  // BULK IMPORT OPERATION
  // ========================

  /**
   * Handles bulk user import from Excel file
   * Validates file selection, makes API call, and tracks results
   * Shows Sonner toast notifications for user feedback
   */
  const handleBulkImport = async () => {
    // -------- Validate File Selection --------
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }

    try {
      setLoading(true);
      toast.loading("Processing file...");

      // -------- API Call --------
      const result = await BulkOperationService.bulkCreateUsersFromExcel(
        selectedFile
      );

      console.log("Bulk import result:", result);

      // -------- Handle Success Response --------
      if (result.success) {
        const data = result.data;
        
        // Store result for display
        setUploadResult({
          successCount: data.successCount || 0,
          failureCount: data.failureCount || 0,
          totalRecords: data.totalRecords || 0,
          errors: data.errors || [],
        });

        toast.dismiss();
        toast.success(
          `Successfully created ${data.successCount} users out of ${data.totalRecords}`
        );

        // Show warning if there are failures
        if (data.failureCount > 0) {
          toast.warning(`${data.failureCount} users failed to import`);
        }

        // Call success callback
        onSuccess?.();
      } else {
        // -------- Handle Failure Response --------
        toast.dismiss();
        toast.error(result.message || "Import failed");
      }
    } catch (error) {
      // -------- Handle Exception --------
      console.error("Import error:", error);
      toast.dismiss();
      toast.error(
        error.response?.data?.message || error.message || "Import failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // ========================
  // MODAL CLOSE
  // ========================

  /**
   * Handles modal close
   * Resets all states and calls onClose callback
   */
  const handleClose = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setActiveTab("export");
    onClose();
  };

  // ========================
  // RENDER LOGIC
  // ========================
  return (
    <>
      {/* ======================== */}
      {/* MODAL BACKDROP */}
      {/* ======================== */}
      <div className="modal-backdrop-bulk"></div>

      {/* ======================== */}
      {/* MODAL WRAPPER */}
      {/* ======================== */}
      <div className="modal-wrapper-bulk">
        <div className="modal-dialog-bulk">
          <div className="modal-content-bulk">
            
            {/* ======================== */}
            {/* MODAL HEADER */}
            {/* ======================== */}
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
                title="Close modal"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            {/* ======================== */}
            {/* TAB NAVIGATION */}
            {/* ======================== */}
            <div className="bulk-tabs-container">
              {/* Export Tab Button */}
              <button
                className={`bulk-tab-btn ${
                  activeTab === "export" ? "active" : ""
                }`}
                onClick={() => setActiveTab("export")}
                title="Switch to export data"
              >
                <i className="bi bi-download"></i>
                Export Data
              </button>

              {/* Import Tab Button */}
              <button
                className={`bulk-tab-btn ${
                  activeTab === "import" ? "active" : ""
                }`}
                onClick={() => setActiveTab("import")}
                title="Switch to import users"
              >
                <i className="bi bi-upload"></i>
                Import Users
              </button>
            </div>

            {/* ======================== */}
            {/* MODAL BODY */}
            {/* ======================== */}
            <div className="modal-body-bulk">
              
              {/* -------- EXPORT TAB CONTENT -------- */}
              {activeTab === "export" && (
                <div className="export-section-bulk">
                  
                  {/* Section Header */}
                  <div className="section-header-bulk">
                    <i className="bi bi-file-earmark-spreadsheet"></i>
                    <div>
                      <h6 className="section-title-bulk">Export to Excel</h6>
                      <p className="section-subtitle-bulk">
                        Download data in Excel format for backup or analysis
                      </p>
                    </div>
                  </div>

                  {/* Export Cards Grid */}
                  <div className="export-cards-grid">
                    
                    {/* Users Export Card */}
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
                          title="Export users data"
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

                    {/* Complete Export Card - Featured */}
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
                          title="Export all data"
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

              {/* -------- IMPORT TAB CONTENT -------- */}
              {activeTab === "import" && (
                <div className="import-section-bulk">
                  
                  {/* Section Header */}
                  <div className="section-header-bulk">
                    <i className="bi bi-upload"></i>
                    <div>
                      <h6 className="section-title-bulk">Bulk Import Users</h6>
                      <p className="section-subtitle-bulk">
                        Upload an Excel file to create multiple users at once
                      </p>
                    </div>
                  </div>

                  {/* Template Download Section */}
                  <div className="template-download-section">
                    <button
                      className="btn-download-template"
                      onClick={handleDownloadTemplate}
                      disabled={isDownloadingTemplate}
                      title="Download Excel template for bulk import"
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

                  {/* Requirements Info Alert */}
                  <div className="info-alert-bulk">
                    <i className="bi bi-info-circle-fill"></i>
                    <div>
                      <strong>Excel Format Requirements:</strong>
                      <ul className="instructions-list">
                        <li>
                          Required columns: EmployeeCompanyId, Email, FirstName,
                          LastName, RoleId, DepartmentId
                        </li>
                        <li>File format: .xlsx or .xls (max 5MB)</li>
                        <li>First row must contain column headers</li>
                        <li>
                          Sample data row included in template (delete before
                          uploading)
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* File Upload Input */}
                  <div className="file-upload-container">
                    <input
                      type="file"
                      id="bulkImportFile"
                      accept=".xlsx,.xls"
                      onChange={handleFileSelect}
                      style={{ display: "none" }}
                      aria-label="Select Excel file for bulk import"
                    />
                    <label
                      htmlFor="bulkImportFile"
                      className="file-upload-label-bulk"
                      title="Click to select Excel file"
                    >
                      <i className="bi bi-cloud-upload"></i>
                      <span className="upload-text">
                        Click to select Excel file
                      </span>
                      <small className="upload-hint">
                        or drag and drop here
                      </small>
                    </label>
                  </div>

                  {/* Selected File Display */}
                  {selectedFile && (
                    <div className="selected-file-bulk">
                      <i className="bi bi-file-earmark-excel-fill"></i>
                      <div className="file-details">
                        <span className="file-name">{selectedFile.name}</span>
                        <span className="file-size">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </span>
                      </div>
                      {/* Remove File Button */}
                      <button
                        className="btn-remove-file-bulk"
                        onClick={() => {
                          setSelectedFile(null);
                          setUploadResult(null);
                          document.getElementById("bulkImportFile").value = "";
                        }}
                        title="Remove selected file"
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    </div>
                  )}

                  {/* Import Button - Shows only when file selected */}
                  {selectedFile && (
                    <button
                      className="btn-import-bulk"
                      onClick={handleBulkImport}
                      disabled={loading}
                      title="Start bulk import process"
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

                  {/* Upload Result Display */}
                  {uploadResult && (
                    <div className="upload-result-bulk">
                      <h6 className="result-title">Import Results:</h6>
                      
                      {/* Result Statistics Grid */}
                      <div className="result-stats-grid">
                        {/* Total Records Card */}
                        <div className="result-stat-card total">
                          <i className="bi bi-file-earmark-text"></i>
                          <span className="stat-value">
                            {uploadResult.totalRecords}
                          </span>
                          <span className="stat-label">Total Records</span>
                        </div>

                        {/* Successful Imports Card */}
                        <div className="result-stat-card success">
                          <i className="bi bi-check-circle-fill"></i>
                          <span className="stat-value">
                            {uploadResult.successCount}
                          </span>
                          <span className="stat-label">Successful</span>
                        </div>

                        {/* Failed Imports Card */}
                        <div className="result-stat-card failed">
                          <i className="bi bi-x-circle-fill"></i>
                          <span className="stat-value">
                            {uploadResult.failureCount}
                          </span>
                          <span className="stat-label">Failed</span>
                        </div>
                      </div>

                      {/* Error Details - Shows if there are errors */}
                      {uploadResult.errors &&
                        uploadResult.errors.length > 0 && (
                          <div className="error-details-bulk">
                            <h6 className="error-title">
                              <i className="bi bi-exclamation-triangle-fill"></i>
                              Errors ({uploadResult.errors.length}):
                            </h6>
                            <ul className="error-list">
                              {/* Display first 10 errors */}
                              {uploadResult.errors
                                .slice(0, 10)
                                .map((error, index) => (
                                  <li key={index}>{error}</li>
                                ))}
                              {/* Show count of remaining errors */}
                              {uploadResult.errors.length > 10 && (
                                <li className="more-errors">
                                  ... and {uploadResult.errors.length - 10} more
                                  errors
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ======================== */}
            {/* MODAL FOOTER */}
            {/* ======================== */}
            <div className="modal-footer-bulk">
              <button
                type="button"
                className="btn-close-bulk"
                onClick={handleClose}
                title="Close modal"
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
