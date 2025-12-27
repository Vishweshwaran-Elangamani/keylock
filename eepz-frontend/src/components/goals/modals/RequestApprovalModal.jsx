import { useState } from "react";
import goalService from "../../../services/goals/goalService";
import { toast } from "sonner";
import { useAuth } from "../../../contexts/auth/AuthContext";
import {
  APPROVAL_TYPES,
  APPROVAL_TYPE_LABELS,
} from "../../../constants/goals/goalConstants";
import styles from "../../../styles/goals/components/RequestApprovalModal.module.css";

const RequestApprovalModal = ({
  isOpen,
  onClose,
  goalId,
  approvalType,
  onSuccess,
  goalType,
  requesterRole,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const isClosure = approvalType === "closure";
  const isReactivation = approvalType === "reactivation";
  const isReopening = approvalType === "reopening";
  const isCompletion = approvalType === "completion";

  const isLeadershipOrgCompletion =
    isCompletion && goalType === "org" && requesterRole === "Leadership";

  const requiresProof = [
    APPROVAL_TYPES.COMPLETION,
    APPROVAL_TYPES.TASK_ACKNOWLEDGMENT,
  ].includes(approvalType);

  const showProofUpload =
    [APPROVAL_TYPES.COMPLETION, APPROVAL_TYPES.TASK_ACKNOWLEDGMENT].includes(
      approvalType
    ) && !isLeadershipOrgCompletion;

  const approvalLabel = APPROVAL_TYPE_LABELS[approvalType] || "Approval";

  const getThemeConfig = () => {
    if (isClosure)
      return {
        color: "crimson",
        bgGradient: "rgb(39, 35, 92)",
        icon: "bi-x-circle",
        iconBg: "#dc3545",
      };
    if (isReactivation)
      return {
        color: "rgb(39, 35, 92)",
        bgGradient: "rgb(39, 35, 92)",
        icon: "bi-arrow-repeat",
        iconBg: "#fd7e14",
      };
    if (isReopening)
      return {
        color: "crimson",
        bgGradient: "rgb(39, 35, 92)",
        icon: "bi-arrow-clockwise",
        iconBg: "#ffc107",
      };
    if (isLeadershipOrgCompletion)
      return {
        color: "rgb(39, 35, 92)",
        bgGradient: "rgb(39, 35, 92)",
        icon: "bi-check-circle",
        iconBg: "#198754",
      };
    return {
      color: "rgb(39, 35, 92)",
      bgGradient: "rgb(39, 35, 92)",
      icon: "bi-send-fill",
      iconBg: "#0d6efd",
    };
  };

  const theme = getThemeConfig();

  const getHeaderTitle = () => {
    if (isClosure) return "Confirm Goal Closure";
    if (isReactivation) return "Reactivate This Goal";
    if (isReopening) return "Request Deadline Extension";
    if (isLeadershipOrgCompletion) return "Complete Organization Goal";
    return `Request ${approvalLabel}`;
  };

  const getSubmitButtonText = () => {
    if (isClosure) return "Close Goal";
    if (isReactivation) return "Reactivate Goal";
    if (isReopening) return "Request Extension";
    if (isLeadershipOrgCompletion) return "Mark as Completed";
    return "Submit Request";
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File Too Large", {
          description: "File size must be less than 10MB",
          duration: 4000,
        });
        return;
      }
      setProofFile(file);
      toast.success("File Selected", {
        description: `${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
        duration: 2000,
      });
    }
  };

  const removeFile = () => {
    if (proofFile) {
      toast.info("File Removed", {
        description: `${proofFile.name} has been removed`,
        duration: 2000,
      });
    }
    setProofFile(null);
    const fileInput = document.getElementById("fileInput");
    if (fileInput) fileInput.value = "";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File Too Large", {
          description: "File size must be less than 10MB",
          duration: 4000,
        });
      } else {
        setProofFile(file);
        toast.success("File Added", {
          description: `${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
          duration: 2000,
        });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (requiresProof && !isLeadershipOrgCompletion && !proofFile) {
      toast.error("Proof Required", {
        description:
          approvalType === APPROVAL_TYPES.COMPLETION
            ? "Please upload proof of completion"
            : "Please upload proof of task completion",
        duration: 4000,
      });
      return;
    }

    setLoading(true);

    try {
      let proofAttachmentId = null;

      if (proofFile) {
        toast.loading("Uploading file...", { id: "upload" });
        const uploadResponse = await goalService.uploadAttachment(
          goalId,
          proofFile,
          proofFile.name,
          true
        );

        if (uploadResponse.data?.attachmentId) {
          proofAttachmentId = uploadResponse.data.attachmentId;
          toast.success("File uploaded successfully.", { id: "upload" });
        }
      }

      await goalService.requestApproval(goalId, {
        approvalType,
        proofAttachmentIds: proofAttachmentId ? [proofAttachmentId] : [],
      });

      if (isClosure) {
        toast.success("Goal Closed Successfully!", {
          duration: 3000,
        });
      } else if (isReactivation) {
        toast.success("Goal Reactivated Successfully!", {
          duration: 3000,
        });
      } else if (isReopening) {
        toast.success("Extension Request Submitted!", {
          duration: 3000,
        });
      } else if (isLeadershipOrgCompletion) {
        toast.success("Goal Completed Successfully!", {
          duration: 3000,
        });
      } else {
        toast.success("Request Submitted Successfully!", {
          description: `Your ${approvalLabel.toLowerCase()} request has been submitted.`,
          duration: 3000,
        });
      }

      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0] ||
        error.response?.data?.detailedMessage ||
        "Failed to submit request";

      toast.error("Request Failed", {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setProofFile(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return !isOpen ? null : (
    <>
      <div className={styles.backdrop} onClick={handleClose}>
        <div
          className={styles.modalContainer}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={styles.header}
            style={{ background: theme.bgGradient }}
          >
            <div className={styles.headerContent}>
              <div className={styles.headerLeft}>
                <div
                  className={styles.iconContainer}
                  style={{
                    backgroundColor: theme.iconBg,
                    boxShadow: `0 4px 12px ${theme.color}40`,
                  }}
                >
                  <i className={`bi ${theme.icon} ${styles.icon}`} />
                </div>
                <h4 className={styles.headerTitle}>{getHeaderTitle()}</h4>
              </div>
              <button
                type="button"
                className={`btn-close-white ${styles.btnClose}`}
                onClick={onClose}
                disabled={loading}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.color = "red";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.color = "white";
                  }
                }}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          </div>

          <div className={styles.body}>
            <form onSubmit={handleSubmit}>
              {showProofUpload && (
                <div>
                  <label className={styles.proofLabel}>
                    <i className={`bi bi-paperclip ${styles.proofIcon}`} />
                    {approvalType === APPROVAL_TYPES.COMPLETION
                      ? "Proof of Completion"
                      : "Proof of Task Completion"}
                    <span className={styles.required}> *</span>
                  </label>

                  {!proofFile ? (
                    <div
                      className={`${styles.dragDropArea} ${    
                        isDragActive ? styles.dragDropAreaActive : ""
                      }`}
                      style={{
                        borderColor: isDragActive ? theme.color : "#dee2e6",
                        backgroundColor: isDragActive
                          ? `rgba(39, 35, 92, 0.08)`
                          : "#f8f9fa",
                      }}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() =>
                        !loading && document.getElementById("fileInput").click()
                      }
                    >
                      <div
                        className={styles.dragDropIconContainer}
                        style={{
                          backgroundColor: isDragActive
                            ? "rgb(39, 35, 92)"
                            : "#e9ecef",
                        }}
                      >
                        <i
                          className="bi bi-cloud-arrow-up-fill"
                          style={{
                            fontSize: "2.5rem",
                            color: isDragActive ? "white" : "#6c757d",
                          }}
                        />
                      </div>
                      <h6
                        className={styles.dragDropTitle}
                        style={{
                          color: isDragActive ? "rgb(39, 35, 92)" : "#6c757d",
                        }}
                      >
                        Drop your file here or click to browse
                      </h6>
                      <p
                        className={styles.dragDropText}
                        style={{
                          color: isDragActive ? "rgb(39, 35, 92)" : "#6c757d",
                        }}
                      >
                        Supported formats: PDF, DOC, DOCX, Images
                      </p>
                      <div className={styles.chooseFileBtn}>
                        <i className="bi bi-upload me-2"></i>
                        Choose File
                      </div>
                      <p
                        className={styles.fileSizeLimit}
                        style={{
                          color: isDragActive ? "rgb(39, 35, 92)" : "#6c757d",
                        }}
                      >
                        Maximum file size: 10MB
                      </p>
                      <input
                        id="fileInput"
                        type="file"
                        onChange={handleFileChange}
                        disabled={loading}
                        className={styles.fileInput}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif" 
                      />
                    </div>
                  ) : (
                    <div className={styles.fileUploaded}>
                      <div className={styles.fileInfoContainer}>
                        <div className={styles.fileIconContainer}>
                          <i
                            className="bi bi-file-earmark-check-fill"
                            style={{ fontSize: "1.75rem", color: "white" }}
                          />
                        </div>
                        <div className="flex-1">
                          <div className={styles.fileName}>
                            {proofFile.name.length > 20
                              ? proofFile.name.substring(0, 30) + "..."
                              : proofFile.name}
                          </div>
                          <div className={styles.fileSize}>
                            {(proofFile.size / 1024).toFixed(2)} KB
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className={`btn btn-outline-danger btn-sm ${styles.btnRemoveFile}`}
                        onClick={removeFile}
                        disabled={loading}
                      >
                        <i className="bi bi-trash-fill"></i>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              className={`btn btn-outline-secondary ${styles.btnCancel}`}
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`btn ${styles.btnSubmit}`}
              onClick={handleSubmit}
              disabled={
                loading ||
                (requiresProof && !isLeadershipOrgCompletion && !proofFile)
              }
              style={{
                backgroundColor: theme.color,
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.filter = "brightness(85%)";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.filter = "brightness(100%)";
                }
              }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  {isClosure
                    ? "Closing..."
                    : isReactivation
                    ? "Reactivating..."
                    : isReopening
                    ? "Submitting..."
                    : isLeadershipOrgCompletion
                    ? "Completing..."
                    : "Submitting..."}
                </>
              ) : (
                <>
                  <i className={`bi ${theme.icon} me-2`}></i>
                  {getSubmitButtonText()}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default RequestApprovalModal;
