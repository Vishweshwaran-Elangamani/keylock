import React from "react";
import api from "../../../../services/performancemanagement/api/api";

function statusRender(status) {
  if (typeof status !== "string") return "-";
  const s = status.toLowerCase();
  if (s === "pending") {
    return (
      <span style={{ color: "#ffb11b", fontWeight: 600 }}>
        <i className="bi bi-hourglass-split" style={{ marginRight: 6 }}></i>
        Pending
      </span>
    );
  } else if (s === "completed") {
    return (
      <span style={{ color: "#059669", fontWeight: 600 }}>
        <i className="bi bi-check-circle-fill" style={{ marginRight: 6 }}></i>
        Completed
      </span>
    );
  }
  return <span>{status}</span>;
}

const fieldOrder = [
  ["Competency", "competencyName"],
  ["Employee Rating", "employeeRating"],
  ["Employee Comments", "employeeComments"],
  ["L1 Reviewer", "l1ReviewerName"],
  ["L1 Rating", "l1Rating"],
  ["L1 Comments", "l1Comments"],
  ["L2 Reviewer", "l2ReviewerName"],
  ["L2 Rating", "l2Rating"],
  ["L2 Comments", "l2Comments"],
  ["Status", "status"],
];

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

function formatDate(dateString) {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return dateString;
  }
}

function getFileIcon(fileType, fileName) {
  if (!fileType && !fileName) return "bi-file";

  const name = (fileName || "").toLowerCase();
  const type = (fileType || "").toLowerCase();

  if (type.includes("pdf") || name.endsWith(".pdf")) return "bi-file-pdf";
  if (type.includes("word") || name.endsWith(".doc") || name.endsWith(".docx"))
    return "bi-file-word";
  if (
    type.includes("excel") ||
    type.includes("spreadsheet") ||
    name.endsWith(".xls") ||
    name.endsWith(".xlsx")
  )
    return "bi-file-earmark-spreadsheet";
  if (type.includes("image") || name.match(/\.(jpg|jpeg|png|gif)$/i))
    return "bi-file-image";
  if (type.includes("video") || name.match(/\.(mp4|avi|mov)$/i))
    return "bi-file-play";
  if (type.includes("audio") || name.match(/\.(mp3|wav|m4a)$/i))
    return "bi-file-music";
  if (type === "text/csv" || name.endsWith(".csv")) return "bi-file-earmark-text";
  if (type.includes("text") || name.endsWith(".txt")) return "bi-file-text";
  if (type.includes("zip") || type.includes("compressed") || name.match(/\.(zip|rar|7z)$/i))
    return "bi-file-zip";

  return "bi-file";
}

function getExtensionFromMime(mimeType) {
  if (!mimeType) return "";

  const type = mimeType.toLowerCase().trim();

  const mimeMap = {
    "application/pdf": ".pdf",
    "text/csv": ".csv",
    "text/plain": ".txt",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      ".docx",
    "application/vnd.ms-excel": ".xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
    "application/vnd.ms-powerpoint": ".ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      ".pptx",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "application/zip": ".zip",
    "application/x-rar-compressed": ".rar",
    "application/x-7z-compressed": ".7z",
    "video/mp4": ".mp4",
    "video/x-msvideo": ".avi",
    "video/quicktime": ".mov",
    "audio/mpeg": ".mp3",
    "audio/wav": ".wav",
    "audio/m4a": ".m4a",
    "application/json": ".json",
    "application/xml": ".xml",
    "text/xml": ".xml",
    "text/html": ".html",
  };

  return mimeMap[type] || "";
}

function hasExtension(filename) {
  return /\.[a-zA-Z0-9]{2,5}$/.test(filename);
}

const AppraisalDetailsModal = ({
  show,
  onClose,
  employeeName,
  projectName,
  competencies = [],
  attachments = [],
  employeeId,
}) => {
  const [downloadingId, setDownloadingId] = React.useState(null);
  const [error, setError] = React.useState(null);

  const handleDownloadAttachment = async (attachment) => {
    try {
      setDownloadingId(attachment.attachmentId);
      setError(null);
  
      // FIX: Use api.get() with responseType: 'blob' instead of fetch
      const response = await api.get(
        `/SelfAssessment/attachments/${attachment.attachmentId}/download`,
        {
          responseType: 'blob'  //  CRITICAL: Must be 'blob' for binary files
        }
      );
  
      // Get the blob from response.data
      const blob = response.data;
      
      console.log('File downloaded:', {
        size: blob.size,
        type: blob.type,
        attachmentId: attachment.attachmentId
      });
  
      let filename = attachment.fileName || "attachment";
  
      // Try to get filename from Content-Disposition header
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const headerFilename = extractFilenameFromHeader(contentDisposition);
        if (headerFilename) {
          filename = headerFilename;
          console.log('Filename from header:', filename);
        }
      }
  
      // Add extension if missing
      if (!hasExtension(filename)) {
        let extension = "";
  
        // Try to get extension from response content-type
        const contentType = response.headers['content-type'];
        if (contentType) {
          extension = getExtensionFromMime(contentType);
        }
  
        // Fallback to attachment fileType
        if (!extension && attachment.fileType) {
          extension = getExtensionFromMime(attachment.fileType);
        }
  
        // Fallback to blob type
        if (!extension && blob.type) {
          extension = getExtensionFromMime(blob.type);
        }
  
        // Final fallback
        if (!extension) {
          extension = ".bin";
        }
  
        filename += extension;
        console.log('Added extension:', extension, '→', filename);
      }
  
      console.log('Final filename:', filename);
  
      // Create and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
  
      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }, 100);
  
      console.log('Download complete');
      
      // Optional: Show success message if you have a toast/notification system
      // toast.success('File downloaded successfully!');
  
    } catch (err) {
      console.error("Download error:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: err.config?.url
      });
      
      setError(
        `Failed to download ${attachment.fileName}: ${err.response?.data?.message || err.message}`
      );
    } finally {
      setDownloadingId(null);
    }
  };
  
  // Helper function to extract filename from Content-Disposition header
  function extractFilenameFromHeader(contentDisposition) {
    if (!contentDisposition) return null;
    
    // Try UTF-8 encoded filename first
    const matchUtf8 = contentDisposition.match(/filename\*=(?:UTF-8'')?([^;]+)(?:;|$)/i);
    if (matchUtf8 && matchUtf8[1]) {
      try {
        return decodeURIComponent(matchUtf8[1].replace(/"/g, '').trim());
      } catch (e) {
        return matchUtf8[1].replace(/"/g, '').trim();
      }
    }
    
    // Fallback to normal filename
    const matchNormal = contentDisposition.match(/filename=([^;]+)(?:;|$)/i);
    if (matchNormal && matchNormal[1]) {
      return matchNormal[1].replace(/"/g, '').trim();
    }
    
    return null;
  }
  
  // Helper function to check if filename has extension
  function hasExtension(filename) {
    return /\.[a-zA-Z0-9]{2,5}$/.test(filename);
  }
  
  // Helper function to get file extension from MIME type
  function getExtensionFromMime(mimeType) {
    if (!mimeType) return '';
    
    const type = mimeType.toLowerCase().trim();
    const mimeMap = {
      'application/pdf': '.pdf',
      'text/csv': '.csv',
      'text/plain': '.txt',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/vnd.ms-excel': '.xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
      'application/vnd.ms-powerpoint': '.ppt',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/bmp': '.bmp',
      'image/svg+xml': '.svg',
      'application/zip': '.zip',
      'application/x-zip-compressed': '.zip',
      'application/x-rar-compressed': '.rar',
      'application/x-7z-compressed': '.7z',
      'audio/mpeg': '.mp3',
      'audio/wav': '.wav',
      'video/mp4': '.mp4',
      'video/mpeg': '.mpeg',
      'application/json': '.json',
      'application/xml': '.xml',
      'text/xml': '.xml',
    };
    
    return mimeMap[type] || '';
  }
  

  if (!show) return null;

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(39, 35, 92, 0.42)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 1040,
        }}
        onClick={onClose}
      />

      {/* Modal Container with Dark Blue Border */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "920px",
          maxWidth: "98vw",
          minHeight: "490px",
          maxHeight: "92vh",
          borderRadius: 12,
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.18)",
          background: "#fff",
          overflow: "hidden",
          zIndex: 1050,
          display: "flex",
          flexDirection: "column",
          border: "2px solid #27235C",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Close Icon */}
        <div
          style={{
            background: "#27235C",
            padding: "18px 36px 18px 36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
            minHeight: 64,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "#fff",
                textAlign: "left",
              }}
            >
              Appraisal Details
            </div>
            <div
              style={{
                color: "#E3DDFE",
                fontWeight: 500,
                fontSize: 15,
                textAlign: "left",
              }}
            >
              <span style={{ marginRight: 6 }}>{employeeName}</span>
              <span
                style={{
                  margin: "0 10px",
                  color: "#bfb9e2",
                  fontWeight: 300,
                  fontSize: 18,
                }}
              >
                |
              </span>
              {projectName}
            </div>
          </div>

          {attachments && attachments.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "#97247E",
                backdropFilter: "blur(10px)",
                padding: "6px 12px",
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                marginRight: "12px",
              }}
            >
              <i
                className="bi bi-paperclip"
                style={{
                  color: "#fff",
                  fontSize: "16px",
                }}
              ></i>
              <span
                style={{
                  color: "#fff",
                  fontSize: "13px",
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                }}
              >
                {attachments.length} {attachments.length === 1 ? "File" : "Files"}
              </span>
            </div>
          )}

          {/* Close Button - Small X Icon */}
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              fontSize: "28px",
              cursor: "pointer",
              padding: "0",
              lineHeight: "1",
              transition: "color 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#E3DDFE")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#fff")}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div
          style={{
            flex: 1,
            padding: "32px 36px 18px 36px",
            overflowY: "auto",
            background: "#fff",
            scrollbarWidth: "thin",
            scrollbarColor: "#27235C #f0f0f0",
          }}
        >
          {error && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 8,
                padding: "12px 16px",
                marginBottom: "16px",
                color: "#dc2626",
                fontSize: "14px",
              }}
            >
              <i
                className="bi bi-exclamation-circle"
                style={{ marginRight: 6 }}
              ></i>
              {error}
            </div>
          )}

          {/* Competency Evaluations Section */}
          <div style={{ marginBottom: "32px" }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: "15px",
                color: "#27235C",
                marginBottom: 14,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                letterSpacing: ".02em",
              }}
            >
              <i
                className="bi bi-list-check"
                style={{ marginRight: 4 }}
              ></i>
              Competency Evaluations
            </div>
            {competencies.length === 0 ? (
              <div
                style={{
                  color: "#aaa",
                  fontStyle: "italic",
                  marginTop: "32px",
                  textAlign: "center",
                }}
              >
                No competencies found
              </div>
            ) : (
              competencies.map((c, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "#f6f7fa",
                    borderRadius: 10,
                    margin: "0 0 26px 0",
                    padding: "20px 32px 18px 32px",
                    border: "1.5px solid #e5e7eb",
                    boxShadow: "0 1.5px 10px rgba(151,36,126,0.04)",
                    maxWidth: "100%",
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "16px",
                      color: "#97247E",
                      marginBottom: 12,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      letterSpacing: ".03em",
                      textAlign: "left",
                    }}
                  >
                    #{idx + 1} &nbsp; {c.competencyName}
                  </div>

                  <div style={{ width: "100%", maxWidth: 820 }}>
                    {fieldOrder.map(([label, key]) =>
                      key === "competencyName" ? null : (
                        <div
                          key={key}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            marginBottom: 7,
                            minHeight: "26px",
                          }}
                        >
                          <span
                            style={{
                              minWidth: "165px",
                              fontWeight: 600,
                              color: "#27235C",
                              fontSize: "14px",
                              textAlign: "left",
                              lineHeight: 1.8,
                            }}
                          >
                            {label}
                          </span>
                          <span
                            style={{
                              color: "#332c48",
                              fontSize: "14px",
                              paddingLeft: 0,
                              fontWeight: key === "status" ? 700 : 500,
                              whiteSpace:
                                key === "employeeComments" ||
                                key === "l1Comments" ||
                                key === "l2Comments"
                                  ? "pre-wrap"
                                  : "inherit",
                              wordBreak: "break-word",
                              marginLeft: 10,
                              flex: 1,
                              textAlign: "left",
                              lineHeight: 1.8,
                            }}
                          >
                            {key === "status"
                              ? statusRender(c.status)
                              : c[key] !== undefined &&
                                c[key] !== null &&
                                c[key] !== ""
                                ? c[key]
                                : "-"}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Attachments Section */}
          {attachments && attachments.length > 0 && (
            <div
              style={{
                margin: "20px 0",
                padding: "16px",
                background: "#f8f9fa",
                borderRadius: "8px",
                border: "1px solid #dee2e6",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "12px",
                  fontWeight: 600,
                  fontSize: "14px",
                  color: "#26225A",
                }}
              >
                <i className="bi bi-paperclip"></i>
                <span>Employee Attachments</span>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      background: "white",
                      border: "1px solid #dee2e6",
                      borderRadius: "6px",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#26225A";
                      e.currentTarget.style.boxShadow =
                        "0 2px 4px rgba(38, 34, 90, 0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#dee2e6";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        flex: 1,
                      }}
                    >
                      <i
                        className={`bi ${getFileIcon(att.fileType, att.fileName)}`}
                        style={{
                          fontSize: "20px",
                          color: "#26225A",
                        }}
                      ></i>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "2px",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 500,
                            fontSize: "14px",
                            color: "#212529",
                          }}
                        >
                          {att.fileName}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#6c757d",
                          }}
                        >
                          {formatFileSize(att.fileSize)}
                          {att.uploadedAt && ` • ${formatDate(att.uploadedAt)}`}
                        </div>
                        {att.note && (
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#495057",
                              fontStyle: "italic",
                              marginTop: "2px",
                            }}
                          >
                            Note: {att.note}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadAttachment(att)}
                      disabled={downloadingId === att.attachmentId}
                      style={{
                        padding: "6px 12px",
                        background:
                          downloadingId === att.attachmentId
                            ? "#6c757d"
                            : "#26225A",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor:
                          downloadingId === att.attachmentId
                            ? "not-allowed"
                            : "pointer",
                        fontSize: "13px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        if (downloadingId !== att.attachmentId) {
                          e.currentTarget.style.background = "#1a1740";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (downloadingId !== att.attachmentId) {
                          e.currentTarget.style.background = "#26225A";
                        }
                      }}
                      aria-label={`Download ${att.fileName}`}
                    >
                      {downloadingId === att.attachmentId ? (
                        <>
                          <i className="bi bi-hourglass-split"></i>
                          Downloading...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-download"></i>
                          Download
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <style>{`
            div[style*="overflow-y: auto"]::-webkit-scrollbar {
              width: 8px;
            }
            div[style*="overflow-y: auto"]::-webkit-scrollbar-track {
              background: #f0f0f0;
            }
            div[style*="overflow-y: auto"]::-webkit-scrollbar-thumb {
              background: #27235C;
              border-radius: 4px;
            }
            div[style*="overflow-y: auto"]::-webkit-scrollbar-thumb:hover {
              background: #1a1740;
            }
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>

        {/* Footer */}
        <div
          style={{
            background: "#F5F5F7",
            borderTop: "1px solid #E5E7EB",
            padding: "16px 36px",
            display: "flex",
            justifyContent: "flex-end",
            gap: "11px",
          }}
        >
          <button
            style={{
              fontWeight: 700,
              fontSize: 15,
              border: "none",
              borderRadius: 6,
              color: "#fff",
              background: "#6C757D",
              padding: "9px 26px",
              cursor: "pointer",
              transition: ".13s",
              letterSpacing: ".02em",
            }}
            onClick={onClose}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#5a6268")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#6C757D")}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
};

export default AppraisalDetailsModal;
