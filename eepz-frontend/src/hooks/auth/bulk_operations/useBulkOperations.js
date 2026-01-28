import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import ExportService from "../../../services/auth/exportService";
import BulkOperationService from "../../../services/auth/bulkOperationService";
import { categorizeErrors, validateFile } from "../../../utils/auth/bulk_operations/bulkOperationsHelpers";

const useBulkOperations = () => {
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

  const handleExport = async (type) => {
    try {
      if (type === "users") {
        setExportingUsers(true);
      } else if (type === "all") {
        setExportingAll(true);
      }

      let result;
      switch (type) {
        case "roles":
          result = await ExportService.exportRoles();
          if (result.password) {
            toast.success(`Roles exported successfully! Password: ${result.password}`, {
              duration: 10000,
            });
          } else {
            toast.success("Roles exported successfully!");
          }
          break;
        case "departments":
          result = await ExportService.exportDepartments();
          if (result.password) {
            toast.success(`Departments exported successfully! Password: ${result.password}`, {
              duration: 10000,
            });
          } else {
            toast.success("Departments exported successfully!");
          }
          break;
        case "users":
          result = await ExportService.exportUsers();
          if (result.password) {
            toast.success(`Users exported successfully! Password: ${result.password}`, {
              duration: 10000,
            });
          } else {
            toast.success("Users exported successfully!");
          }
          break;
        case "all":
          result = await ExportService.exportAllData();
          if (result.password) {
            toast.success(`All data exported successfully! Password: ${result.password}`, {
              duration: 10000,
            });
          } else {
            toast.success("All data exported successfully!");
          }
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

      const data = result.success ? result.data : result;

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
    } catch (error) {
      toast.dismiss(loadingToastId);

      const responseData = error.response?.data;
      const errorMessage =
        responseData?.message || error.message || "Import failed";

      toast.error(errorMessage, { duration: 5000 });

      if (responseData) {
        const errorData = responseData.data || responseData;

        if (errorData.errors && Array.isArray(errorData.errors)) {
          setUploadResult({
            successCount: errorData.successCount || 0,
            failureCount: errorData.failureCount || errorData.errors.length,
            totalRecords: errorData.totalRecords || errorData.errors.length,
            errors: errorData.errors,
            successfulUsers: errorData.successfulUsers || [],
            categorizedErrors: categorizeErrors(errorData.errors),
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return {
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
  };
};

export default useBulkOperations;
