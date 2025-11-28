import { useState } from "react";
import goalService from "../../../services/goals/goalService";
import { toast } from "sonner";
import { useAuth } from "../../../contexts/auth/AuthContext";
import {
  APPROVAL_TYPES,
  APPROVAL_TYPE_LABELS,
} from "../../../constants/goals/goalConstants";

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
          toast.success("File uploaded successfully", { id: "upload" });
        }
      }

      await goalService.requestApproval(goalId, {
        approvalType,
        proofAttachmentIds: proofAttachmentId ? [proofAttachmentId] : [],
      });

      if (isClosure) {
        toast.success("Goal Closed Successfully!", {
          description: "The goal has been closed",
          duration: 3000,
        });
      } else if (isReactivation) {
        toast.success("Goal Reactivated Successfully!", {
          description: "The goal is now active again",
          duration: 3000,
        });
      } else if (isReopening) {
        toast.success("Extension Request Submitted!", {
          description: "Your deadline extension request has been submitted",
          duration: 3000,
        });
      } else if (isLeadershipOrgCompletion) {
        toast.success("Goal Completed Successfully!", {
          description: "The organization goal has been marked as completed",
          duration: 3000,
        });
      } else {
        toast.success("Request Submitted Successfully!", {
          description: `Your ${approvalLabel.toLowerCase()} request has been submitted`,
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

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { 
              opacity: 0;
              transform: translateY(20px);
            }
            to { 
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          zIndex: 1050,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          backdropFilter: "blur(4px)",
          animation: "fadeIn 0.2s ease-out",
        }}
        onClick={handleClose}
      >
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "1.5rem",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            width: "100%",
            maxWidth: "650px",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            animation: "slideUp 0.3s ease-out",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              padding: "2rem 2rem 1.5rem",
              background: theme.bgGradient,
              borderRadius: "1rem 1rem 0 0",
            }}
          >
            <div className="d-flex align-items-start justify-content-between">
              <div className="d-flex align-items-center gap-3 flex-1">
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "1rem",
                    background: theme.iconBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: `0 4px 12px ${theme.color}40`,
                  }}
                >
                  <i
                    className={`bi ${theme.icon}`}
                    style={{ fontSize: "1.75rem", color: "white" }}
                  ></i>
                </div>
                <h4
                  style={{
                    margin: 0,
                    fontWeight: 700,
                    color: "white",
                    fontSize: "1.5rem",
                  }}
                >
                  {getHeaderTitle()}
                </h4>
              </div>
              <button
                type="button"
                className="btn-close-white"
                onClick={onClose}
                disabled={loading}
                style={{
                  border: "none",
                  width: "36px",
                  backgroundColor: "transparent",
                  height: "36px",
                  borderRadius: "0.5rem",
                  cursor: loading ? "not-allowed" : "pointer",
                  color: "white",
                  fontSize: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                  flexShrink: 0,
                }}
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

          <div style={{ padding: "2rem", overflowY: "auto", flex: 1 }}>
            <form onSubmit={handleSubmit}>
              {showProofUpload && (
                <div>
                  <label
                    className="form-label"
                    style={{
                      fontWeight: 600,
                      fontSize: "1rem",
                      color: "#212529",
                      marginBottom: "1rem",
                    }}
                  >
                    <i
                      className="bi bi-paperclip me-2"
                      style={{ color: "rgb(39, 35, 92)" }}
                    ></i>
                    {approvalType === APPROVAL_TYPES.COMPLETION
                      ? "Proof of Completion"
                      : "Proof of Task Completion"}
                    <span style={{ color: "#dc3545" }}> *</span>
                  </label>

                  {!proofFile ? (
                    <div
                      style={{
                        border: `2px dashed ${
                          isDragActive ? theme.color : "#dee2e6"
                        }`,
                        borderRadius: "1rem",
                        padding: "3rem 1.5rem",
                        textAlign: "center",
                        backgroundColor: isDragActive
                          ? `rgba(39, 35, 92, 0.57)`
                          : "#f8f9fa",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                      }}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() =>
                        !loading && document.getElementById("fileInput").click()
                      }
                    >
                      <div
                        style={{
                          width: "80px",
                          height: "80px",
                          margin: "0 auto 1.5rem",
                          borderRadius: "1rem",
                          background: isDragActive
                            ? "rgb(39, 35, 92)"
                            : "#e9ecef",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.3s ease",
                        }}
                      >
                        <i
                          className="bi bi-cloud-arrow-up-fill"
                          style={{
                            fontSize: "2.5rem",
                            color: isDragActive ? "white" : "#6c757d",
                          }}
                        ></i>
                      </div>
                      <h6
                        style={{
                          fontWeight: 600,
                          fontSize: "1.1rem",
                          marginBottom: "0.5rem",
                          color: isDragActive ? "rgb(39, 35, 92)" : "#6c757d",
                        }}
                      >
                        Drop your file here or click to browse
                      </h6>
                      <p
                        style={{
                          color: isDragActive ? "rgb(39, 35, 92)" : "#6c757d",
                          fontSize: "0.9rem",
                          marginBottom: "1rem",
                        }}
                      >
                        Supported formats: PDF, DOC, DOCX, Images
                      </p>
                      <div
                        style={{
                          display: "inline-block",
                          padding: "0.5rem 1.5rem",
                          background: "rgb(39, 35, 92)",
                          color: "white",
                          borderRadius: "0.5rem",
                          fontSize: "0.9rem",
                          fontWeight: 600,
                        }}
                      >
                        <i className="bi bi-upload me-2"></i>
                        Choose File
                      </div>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: isDragActive ? "rgb(39, 35, 92)" : "#6c757d",
                          marginTop: "1rem",
                          marginBottom: 0,
                        }}
                      >
                        Maximum file size: 10MB
                      </p>
                      <input
                        id="fileInput"
                        type="file"
                        onChange={handleFileChange}
                        disabled={loading}
                        style={{ display: "none" }}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: "1.5rem",
                        background: "rgba(39, 35, 92, 0.25)",
                        border: `2px solid rgb(39, 35, 92)`,
                        borderRadius: "1rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                        justifyContent: "space-between",
                      }}
                    >
                      {/* Left section: Icon + File details */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "1rem",
                        }}
                      >
                        <div
                          style={{
                            width: "60px",
                            height: "60px",
                            borderRadius: "0.75rem",
                            background: "rgb(39, 35, 92)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <i
                            className="bi bi-file-earmark-check-fill"
                            style={{ fontSize: "1.75rem", color: "white" }}
                          ></i>
                        </div>
                        <div className="flex-1">
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: "1rem",
                              textAlign: "left",
                              color: "black",
                              marginBottom: "0.25rem",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: "200px",
                            }}
                          >
                            {proofFile.name.length > 20
                              ? proofFile.name.substring(0, 30) + "..."
                              : proofFile.name}
                          </div>

                          <div
                            style={{
                              fontSize: "0.85rem",
                              color: "black",
                              textAlign: "left",
                            }}
                          >
                            {(proofFile.size / 1024).toFixed(2)} KB
                          </div>
                        </div>
                      </div>

                      {/* Right section: Delete button */}
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={removeFile}
                        disabled={loading}
                        style={{
                          borderRadius: "0.5rem",
                          padding: "0.5rem 1rem",
                        }}
                      >
                        <i className="bi bi-trash-fill"></i>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>

          <div
            style={{
              padding: "1.5rem 2rem",
              display: "flex",
              gap: "1rem",
              justifyContent: "flex-end",
              backgroundColor: "#f8f9fa",
              borderRadius: "0 0 1rem 1rem",
            }}
          >
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={handleClose}
              disabled={loading}
              style={{
                borderRadius: "0.75rem",
                padding: "10px 18px",
                fontWeight: 600,
                fontSize: "0.95rem",
                textAlign: "center",
                alignContent: "center",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn"
              onClick={handleSubmit}
              disabled={
                loading ||
                (requiresProof && !isLeadershipOrgCompletion && !proofFile)
              }
              style={{
                borderRadius: "0.75rem",
                padding: "0.75rem 2rem",
                fontWeight: 600,
                fontSize: "0.95rem",
                background: `${theme.color}`,
                border: "none",
                color: "white",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = `${theme.color}`;
                  e.currentTarget.style.filter = "brightness(85%)";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = `${theme.color}`;
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
