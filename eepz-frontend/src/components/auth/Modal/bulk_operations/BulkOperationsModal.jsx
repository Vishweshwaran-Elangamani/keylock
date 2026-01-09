import { useState } from "react";
import { toast } from "sonner";
import ImportTab from "./ImportTab";
import ExportTab from "./ExportTab";
import useBulkOperations from "../../../../hooks/auth/bulk_operations/useBulkOperations";
import "../../../../styles/auth/bulk_operations/BulkOperationsModal.css";
const BulkOperationsModal = ({ show, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState("import");
  const {
    selectedFile,
    setSelectedFile,
    loading,
    uploadResult,
    setUploadResult,
    isDownloadingTemplate,
    exportingUsers,
    exportingAll,
    fileInputRef,
    handleExport,
    handleDownloadTemplate,
    handleFileSelect,
    handleFileUploadClick,
    handleBulkImport,
  } = useBulkOperations();
  if (!show) return null;
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
              <ExportTab
                handleExport={handleExport}
                exportingUsers={exportingUsers}
                exportingAll={exportingAll}
              />
            )}
            {activeTab === "import" && (
              <ImportTab
                handleDownloadTemplate={handleDownloadTemplate}
                isDownloadingTemplate={isDownloadingTemplate}
                fileInputRef={fileInputRef}
                handleFileSelect={handleFileSelect}
                handleFileUploadClick={handleFileUploadClick}
                selectedFile={selectedFile}
                setSelectedFile={setSelectedFile}
                setUploadResult={setUploadResult}
                loading={loading}
                handleBulkImport={handleBulkImport}
                uploadResult={uploadResult}
              />
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
