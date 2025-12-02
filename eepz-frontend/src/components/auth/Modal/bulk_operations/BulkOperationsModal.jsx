import { useState, useEffect, useRef } from "react";
import ExportService from "../../../../services/auth/exportService";
import BulkOperationService from "../../../../services/auth/bulkOperationService";
import { toast } from "sonner";

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
      {/* Custom Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(39, 35, 92, 0.4)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 1040,
          transition: 'all 0.3s ease'
        }}
        onClick={handleClose}
      />

      {/* Modal Wrapper */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050,
          padding: '20px'
        }}
      >
        {/* Modal Dialog */}
        <div
          style={{
            width: '100%',
            maxWidth: '800px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '0.5rem',
            overflow: 'hidden',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
            backgroundColor: '#ffffff'
          }}
        >
          {/* Modal Header */}
          <div
            style={{
              background: '#27235C',
              color: '#ffffff',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0
            }}
          >
            <div
              style={{
                fontSize: '16px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#ffffff'
              }}
            >
              <i className="bi bi-database"></i>
              Bulk Operations
            </div>
            <button
              onClick={handleClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '0',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* Tabs Container */}
          <div
            style={{
              display: 'flex',
              borderBottom: '2px solid #e5e7eb',
              backgroundColor: '#f9fafb'
            }}
          >
            <button
              onClick={() => setActiveTab("import")}
              style={{
                flex: 1,
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: '600',
                border: 'none',
                background: activeTab === "import" ? '#ffffff' : 'transparent',
                color: activeTab === "import" ? '#27235C' : '#64748b',
                borderBottom: activeTab === "import" ? '3px solid #27235C' : '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <i className="bi bi-download"></i>
              Import Users
            </button>
            <button
              onClick={() => setActiveTab("export")}
              style={{
                flex: 1,
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: '600',
                border: 'none',
                background: activeTab === "export" ? '#ffffff' : 'transparent',
                color: activeTab === "export" ? '#27235C' : '#64748b',
                borderBottom: activeTab === "export" ? '3px solid #27235C' : '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <i className="bi bi-upload"></i>
              Export Data
            </button>
          </div>

          {/* Modal Body */}
          <div
            style={{
              padding: '20px',
              overflowY: 'auto',
              flex: 1,
              backgroundColor: '#ffffff',
              maxHeight: 'calc(90vh - 200px)'
            }}
          >
            {/* EXPORT TAB */}
            {activeTab === "export" && (
              <div>
                {/* Section Header - CENTERED */}
                <div
                  style={{
                    textAlign: 'center',
                    marginBottom: '32px'
                  }}
                >
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                  <i className="bi bi-file-earmark-spreadsheet" style={{ fontSize: '24px', color: '#27235C' }}></i>Download data in Excel format for backup or analysis
                  </p>
                </div>

                {/* Export Cards Grid - CENTERED */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '24px',
                    flexWrap: 'wrap'
                  }}
                >
                  {/* Users Export Card */}
                  <div
                    style={{
                      width: '320px',
                      border: '2px solid #27235C',
                      borderRadius: '12px',
                      padding: '24px',
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 8px rgba(39,35,92,0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(39,35,92,0.2)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(39,35,92,0.1)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #27235C 0%, #1e1a47 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '20px'
                      }}
                    >
                      <i className="bi bi-people" style={{ fontSize: '28px', color: '#ffffff' }}></i>
                    </div>
                    <h6 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
                      Users
                    </h6>
                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', lineHeight: '1.5' }}>
                      Export all users and their information
                    </p>
                    <button
                      onClick={() => handleExport("users")}
                      disabled={exportingUsers}
                      style={{
                        width: '100%',
                        padding: '12px 20px',
                        fontSize: '14px',
                        fontWeight: '600',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'linear-gradient(90deg, #97247E 0%, #E01950 100%)',
                        color: '#ffffff',
                        cursor: exportingUsers ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 2px 8px rgba(151, 36, 126, 0.25)'
                      }}
                    >
                      {exportingUsers ? (
                        <span
                          style={{
                            width: '16px',
                            height: '16px',
                            border: '2px solid #ffffff',
                            borderTopColor: 'transparent',
                            borderRadius: '50%',
                            animation: 'spin 0.6s linear infinite',
                            display: 'inline-block'
                          }}
                        />
                      ) : (
                        <i className="bi bi-download"></i>
                      )}
                      Export Users
                    </button>
                  </div>

                  {/* Complete Export Card - Featured with Pink Gradient */}
                  <div
                    style={{
                      width: '320px',
                      border: '2px solid #27235C',
                      borderRadius: '12px',
                      padding: '24px',
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 8px rgba(39,35,92,0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(39,35,92,0.2)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(39,35,92,0.1)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #27235C 0%, #1e1a47 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '20px'
                      }}
                    >
                      <i className="bi bi-database" style={{ fontSize: '28px', color: '#ffffff' }}></i>
                    </div>
                    <h6 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
                      Complete Export
                    </h6>
                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', lineHeight: '1.5' }}>
                      Export everything in one file with multiple sheets
                    </p>
                    <button
                      onClick={() => handleExport("all")}
                      disabled={exportingAll}
                      style={{
                        width: '100%',
                        padding: '12px 20px',
                        fontSize: '14px',
                        fontWeight: '600',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'linear-gradient(90deg, #97247E 0%, #E01950 100%)',
                        color: '#ffffff',
                        cursor: exportingAll ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 2px 8px rgba(151, 36, 126, 0.25)'
                      }}
                    >
                      {exportingAll ? (
                        <span
                          style={{
                            width: '16px',
                            height: '16px',
                            border: '2px solid #ffffff',
                            borderTopColor: 'transparent',
                            borderRadius: '50%',
                            animation: 'spin 0.6s linear infinite',
                            display: 'inline-block'
                          }}
                        />
                      ) : (
                        <i className="bi bi-download"></i>
                      )}
                      Export All Data
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* IMPORT TAB */}
            {activeTab === "import" && (
              <div>
                {/* Template Download Section */}
                <div
                  style={{
                    padding: '16px',
                    background: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    textAlign: 'center'
                  }}
                >
                  <button
                    onClick={handleDownloadTemplate}
                    disabled={isDownloadingTemplate}
                    style={{
                      padding: '10px 20px',
                      fontSize: '14px',
                      fontWeight: '600',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#0ea5e9',
                      color: '#ffffff',
                      cursor: isDownloadingTemplate ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '8px'
                    }}
                    onMouseEnter={(e) => {
                      if (!isDownloadingTemplate) e.target.style.background = '#0284c7';
                    }}
                    onMouseLeave={(e) => {
                      if (!isDownloadingTemplate) e.target.style.background = '#0ea5e9';
                    }}
                  >
                    {isDownloadingTemplate ? (
                      <>
                        <span
                          style={{
                            width: '14px',
                            height: '14px',
                            border: '2px solid #ffffff',
                            borderTopColor: 'transparent',
                            borderRadius: '50%',
                            animation: 'spin 0.6s linear infinite',
                            display: 'inline-block'
                          }}
                        />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-file-earmark-arrow-down"></i>
                        Download Excel Template
                      </>
                    )}
                  </button>
                  <small style={{ fontSize: '12px', color: '#0369a1', display: 'block' }}>
                    Download the template, fill in user details, and upload it below
                  </small>
                </div>

                {/* Info Alert - LEFT ALIGNED */}
                <div
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#d1ecf1',
                    border: '1px solid #bee5eb',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    fontSize: '13px',
                    color: '#0c5460',
                    marginBottom: '20px'
                  }}
                >
                  <i 
                    className="bi bi-info-circle-fill" 
                    style={{ 
                      fontSize: '20px', 
                      flexShrink: 0,
                      marginTop: '2px'
                    }}
                  ></i>
                  <div style={{ textAlign: 'left' }}>
                    <strong style={{ display: 'block', marginBottom: '8px' }}>Excel Format Requirements:</strong>
                    <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.6', textAlign: 'left' }}>
                      <li>Required columns: EmployeeCompanyId, Email, FirstName, LastName, Role, Department</li>
                      <li>File format: .xlsx or .xls (max 5MB)</li>
                      <li>First row must contain column headers</li>
                      <li>Follow template format with dropdown validations</li>
                    </ul>
                  </div>
                </div>

                {/* File Upload */}
                <div style={{ marginBottom: '20px' }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                  />
                  <button
                    onClick={handleFileUploadClick}
                    style={{
                      width: '100%',
                      padding: '40px 20px',
                      border: '2px dashed #cbd5e1',
                      borderRadius: '8px',
                      background: '#f9fafb',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.borderColor = '#27235C';
                      e.target.style.background = '#f0f9ff';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.borderColor = '#cbd5e1';
                      e.target.style.background = '#f9fafb';
                    }}
                  >
                    <i className="bi bi-cloud-upload" style={{ fontSize: '48px', color: '#64748b' }}></i>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                      Click to select Excel file
                    </span>
                    <small style={{ fontSize: '12px', color: '#64748b' }}>
                      Supported: .xlsx, .xls (Max 5MB)
                    </small>
                  </button>
                </div>

                {/* Selected File Display - CENTERED */}
                {selectedFile && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                    <div
                      style={{
                        maxWidth: '400px',
                        width: '100%',
                        padding: '12px 16px',
                        background: '#f0fdf4',
                        border: '1px solid #86efac',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
                      <i className="bi bi-file-earmark-excel-fill" style={{ fontSize: '32px', color: '#22c55e' }}></i>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#166534' }}>
                          {selectedFile.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#15803d' }}>
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
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#dc2626',
                          fontSize: '20px',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    </div>
                  </div>
                )}

                {/* Import Button - CENTERED */}
                {selectedFile && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                    <button
                      onClick={handleBulkImport}
                      disabled={loading}
                      style={{
                        width: '300px',
                        padding: '12px 20px',
                        fontSize: '14px',
                        fontWeight: '600',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'linear-gradient(90deg, #97247E 0%, #E01950 100%)',
                        color: '#ffffff',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 2px 8px rgba(151, 36, 126, 0.25)'
                      }}
                    >
                      {loading ? (
                        <>
                          <span
                            style={{
                              width: '16px',
                              height: '16px',
                              border: '2px solid #ffffff',
                              borderTopColor: 'transparent',
                              borderRadius: '50%',
                              animation: 'spin 0.6s linear infinite',
                              display: 'inline-block'
                            }}
                          />
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

                {/* Upload Results */}
                {uploadResult && (
                  <div
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '20px',
                      background: '#ffffff',
                      marginTop: '20px'
                    }}
                  >
                    <h6 style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="bi bi-bar-chart-fill"></i>
                      Import Results
                    </h6>

                    {/* Stats Grid */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '12px',
                        marginBottom: '20px'
                      }}
                    >
                      <div
                        style={{
                          padding: '16px',
                          background: '#f9fafb',
                          borderRadius: '6px',
                          textAlign: 'center'
                        }}
                      >
                        <i className="bi bi-file-earmark-text" style={{ fontSize: '24px', color: '#64748b', marginBottom: '8px' }}></i>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
                          {uploadResult.totalRecords}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          Total Records
                        </div>
                      </div>
                      <div
                        style={{
                          padding: '16px',
                          background: '#f0fdf4',
                          borderRadius: '6px',
                          textAlign: 'center'
                        }}
                      >
                        <i className="bi bi-check-circle-fill" style={{ fontSize: '24px', color: '#22c55e', marginBottom: '8px' }}></i>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#166534' }}>
                          {uploadResult.successCount}
                        </div>
                        <div style={{ fontSize: '12px', color: '#166534' }}>
                          Successful
                        </div>
                      </div>
                      <div
                        style={{
                          padding: '16px',
                          background: '#fef2f2',
                          borderRadius: '6px',
                          textAlign: 'center'
                        }}
                      >
                        <i className="bi bi-x-circle-fill" style={{ fontSize: '24px', color: '#ef4444', marginBottom: '8px' }}></i>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#dc2626' }}>
                          {uploadResult.failureCount}
                        </div>
                        <div style={{ fontSize: '12px', color: '#dc2626' }}>
                          Failed
                        </div>
                      </div>
                    </div>

                    {/* Errors Section */}
                    {uploadResult.errors && uploadResult.errors.length > 0 && (
                      <div
                        className="error-details-bulk"
                        style={{
                          border: '1px solid #fee2e2',
                          borderRadius: '8px',
                          background: '#fef2f2',
                          padding: '16px'
                        }}
                      >
                        {/* Error Header - CENTERED */}
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          gap: '8px', 
                          marginBottom: '12px' 
                        }}>
                          <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '20px', color: '#dc2626' }}></i>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: '#991b1b' }}>
                            Detailed Error Information
                          </span>
                        </div>

                        {/* Error Summary - CENTERED */}
                        <div
                          style={{
                            padding: '12px',
                            background: '#fff7ed',
                            border: '1px solid #fed7aa',
                            borderRadius: '6px',
                            marginBottom: '16px',
                            textAlign: 'center'
                          }}
                        >
                          <strong style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#9a3412' }}>
                            {uploadResult.failureCount} record{uploadResult.failureCount !== 1 ? "s" : ""} failed to import
                          </strong>
                          <p style={{ margin: 0, fontSize: '12px', color: '#9a3412' }}>
                            Review each error below. Format: Row number (Email) - Error description
                          </p>
                        </div>

                        {/* Error Categories */}
                        {uploadResult.categorizedErrors ? (
                          <div>
                            {/* Duplicate Emails */}
                            {uploadResult.categorizedErrors.duplicateEmails.length > 0 && (
                              <details
                                open
                                style={{
                                  marginBottom: '12px',
                                  border: '1px solid #fecaca',
                                  borderRadius: '6px',
                                  background: '#ffffff'
                                }}
                              >
                                <summary
                                  style={{
                                    padding: '12px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '13px',
                                    color: '#dc2626',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <i className="bi bi-envelope-x-fill"></i>
                                    <span>Duplicate Email Addresses</span>
                                    <span
                                      style={{
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        background: '#fee2e2',
                                        fontSize: '11px',
                                        fontWeight: '700'
                                      }}
                                    >
                                      {uploadResult.categorizedErrors.duplicateEmails.length}
                                    </span>
                                  </div>
                                  <i className="bi bi-chevron-down"></i>
                                </summary>
                                <div style={{ padding: '0 12px 12px 12px' }}>
                                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                                    {uploadResult.categorizedErrors.duplicateEmails.map((error, index) => (
                                      <li
                                        key={`dup-${index}`}
                                        style={{
                                          padding: '8px 12px',
                                          marginBottom: '8px',
                                          background: '#fef2f2',
                                          border: '1px solid #fecaca',
                                          borderRadius: '4px',
                                          fontSize: '12px',
                                          color: '#991b1b',
                                          display: 'flex',
                                          alignItems: 'flex-start',
                                          gap: '8px'
                                        }}
                                      >
                                        <i className="bi bi-envelope-x" style={{ flexShrink: 0, marginTop: '2px' }}></i>
                                        <span>{error}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </details>
                            )}

                            {/* Validation Errors */}
                            {uploadResult.categorizedErrors.validationErrors.length > 0 && (
                              <details
                                open
                                style={{
                                  marginBottom: '12px',
                                  border: '1px solid #fed7aa',
                                  borderRadius: '6px',
                                  background: '#ffffff'
                                }}
                              >
                                <summary
                                  style={{
                                    padding: '12px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '13px',
                                    color: '#ea580c',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <i className="bi bi-exclamation-circle-fill"></i>
                                    <span>Data Validation Errors</span>
                                    <span
                                      style={{
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        background: '#ffedd5',
                                        fontSize: '11px',
                                        fontWeight: '700'
                                      }}
                                    >
                                      {uploadResult.categorizedErrors.validationErrors.length}
                                    </span>
                                  </div>
                                  <i className="bi bi-chevron-down"></i>
                                </summary>
                                <div style={{ padding: '0 12px 12px 12px' }}>
                                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                                    {uploadResult.categorizedErrors.validationErrors.map((error, index) => (
                                      <li
                                        key={`val-${index}`}
                                        style={{
                                          padding: '8px 12px',
                                          marginBottom: '8px',
                                          background: '#fffbeb',
                                          border: '1px solid #fed7aa',
                                          borderRadius: '4px',
                                          fontSize: '12px',
                                          color: '#9a3412',
                                          display: 'flex',
                                          alignItems: 'flex-start',
                                          gap: '8px'
                                        }}
                                      >
                                        <i className="bi bi-x-circle" style={{ flexShrink: 0, marginTop: '2px' }}></i>
                                        <span>{error}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </details>
                            )}

                            {/* Other Errors */}
                            {uploadResult.categorizedErrors.otherErrors.length > 0 && (
                              <details
                                open
                                style={{
                                  border: '1px solid #bfdbfe',
                                  borderRadius: '6px',
                                  background: '#ffffff'
                                }}
                              >
                                <summary
                                  style={{
                                    padding: '12px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '13px',
                                    color: '#2563eb',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <i className="bi bi-info-circle-fill"></i>
                                    <span>Other Issues</span>
                                    <span
                                      style={{
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        background: '#dbeafe',
                                        fontSize: '11px',
                                        fontWeight: '700'
                                      }}
                                    >
                                      {uploadResult.categorizedErrors.otherErrors.length}
                                    </span>
                                  </div>
                                  <i className="bi bi-chevron-down"></i>
                                </summary>
                                <div style={{ padding: '0 12px 12px 12px' }}>
                                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                                    {uploadResult.categorizedErrors.otherErrors.map((error, index) => (
                                      <li
                                        key={`other-${index}`}
                                        style={{
                                          padding: '8px 12px',
                                          marginBottom: '8px',
                                          background: '#eff6ff',
                                          border: '1px solid #bfdbfe',
                                          borderRadius: '4px',
                                          fontSize: '12px',
                                          color: '#1e40af',
                                          display: 'flex',
                                          alignItems: 'flex-start',
                                          gap: '8px'
                                        }}
                                      >
                                        <i className="bi bi-info-circle" style={{ flexShrink: 0, marginTop: '2px' }}></i>
                                        <span>{error}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </details>
                            )}
                          </div>
                        ) : (
                          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                            {uploadResult.errors.map((error, index) => (
                              <li
                                key={index}
                                style={{
                                  padding: '8px 12px',
                                  marginBottom: '8px',
                                  background: '#fef2f2',
                                  border: '1px solid #fecaca',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  color: '#991b1b',
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: '8px'
                                }}
                              >
                                <i className="bi bi-x-circle" style={{ flexShrink: 0, marginTop: '2px' }}></i>
                                <span>{error}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div
            style={{
              padding: '12px 20px',
              borderTop: '1px solid #e2e8f0',
              background: '#ffffff',
              flexShrink: 0,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px',
              borderBottomLeftRadius: '12px',
              borderBottomRightRadius: '12px'
            }}
          >
            <button
              onClick={handleClose}
              style={{
                background: '#6c757d',
                borderColor: '#6c757d',
                color: '#ffffff',
                fontWeight: '600',
                padding: '8px 16px',
                fontSize: '13px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#5a6268';
                e.target.style.borderColor = '#5a6268';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#6c757d';
                e.target.style.borderColor = '#6c757d';
              }}
            >
              <i className="bi bi-x-circle"></i>
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Keyframe Animation for Spinner */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </>
  );
};

export default BulkOperationsModal;
