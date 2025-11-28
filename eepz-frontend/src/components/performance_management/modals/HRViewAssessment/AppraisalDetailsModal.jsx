import React from "react";


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

// Format file size to readable format
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

// Format date to readable format
function formatDate(dateString) {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch (e) {
    return dateString;
  }
}

// Get file icon based on file type
function getFileIcon(fileType, fileName) {
  if (!fileType && !fileName) return "bi-file";
  
  const name = (fileName || "").toLowerCase();
  const type = (fileType || "").toLowerCase();
  
  if (type.includes("pdf") || name.endsWith(".pdf")) return "bi-file-pdf";
  if (type.includes("word") || name.endsWith(".doc") || name.endsWith(".docx")) return "bi-file-word";
  if (type.includes("excel") || type.includes("spreadsheet") || name.endsWith(".xls") || name.endsWith(".xlsx")) return "bi-file-earmark-spreadsheet";
  if (type.includes("image") || name.match(/\.(jpg|jpeg|png|gif)$/i)) return "bi-file-image";
  if (type.includes("video") || name.match(/\.(mp4|avi|mov)$/i)) return "bi-file-play";
  if (type.includes("audio") || name.match(/\.(mp3|wav|m4a)$/i)) return "bi-file-music";
  if (type === "text/csv" || name.endsWith(".csv")) return "bi-file-earmark-text";
  if (type.includes("text") || name.endsWith(".txt")) return "bi-file-text";
  if (type.includes("zip") || type.includes("compressed") || name.match(/\.(zip|rar|7z)$/i)) return "bi-file-zip";
  
  return "bi-file";
}

// Extract filename from Content-Disposition header
function extractFilenameFromHeader(contentDisposition) {
  if (!contentDisposition) return null;
  
  // Try to extract filename* (UTF-8 encoded) first
  const match = contentDisposition.match(/filename\*=(?:UTF-8'')?(.+?)(?:;|$)/);
  if (match && match[1]) {
    try {
      // Decode if it's URL-encoded
      return decodeURIComponent(match[1].trim().replace(/"/g, ''));
    } catch (e) {
      // If decoding fails, use as is
      return match[1].trim().replace(/"/g, '');
    }
  }
  
  // Fallback to regular filename parameter
  const fallbackMatch = contentDisposition.match(/filename=(.+?)(?:;|$)/);
  if (fallbackMatch && fallbackMatch[1]) {
    return fallbackMatch[1].trim().replace(/"/g, '');
  }
  
  return null;
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
  const [expandedAttachments, setExpandedAttachments] = React.useState(false);
  const [downloadingId, setDownloadingId] = React.useState(null);
  const [error, setError] = React.useState(null);

  // Handle attachment download
  const handleDownloadAttachment = async (attachment) => {
    try {
      setDownloadingId(attachment.attachmentId);
      setError(null);

      // Call the download endpoint
      const downloadUrl = `/api/AppraisalProcess/hr/attachments/${attachment.attachmentId}/download`;
      
      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }

      const blob = await response.blob();
      
      // Extract filename from Content-Disposition header
      let filename = attachment.fileName || `attachment`;
      const contentDisposition = response.headers.get('content-disposition');
      
      if (contentDisposition) {
        const headerFilename = extractFilenameFromHeader(contentDisposition);
        if (headerFilename) {
          filename = headerFilename;
        }
      }
      
      // Create download link with correct filename
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      console.log(`✅ Downloaded: ${filename}`);
    } catch (err) {
      console.error("Download error:", err);
      setError(`Failed to download ${attachment.fileName}: ${err.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  if (!show) return null;

  return (
    <>
      {/* Backdrop */}
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
      {/* Modal container */}
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
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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
        </div>

        {/* Cards Section */}
        <div
          style={{
            flex: 1,
            padding: "32px 36px 18px 36px",
            overflowY: "auto",
            background: "#fff",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {/* Error Message */}
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

          {/* Competencies Section */}
          <div style={{ marginBottom: "32px" }}>
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
                  {/* Title */}
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
                  {/* Details Grid */}
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
            <div style={{ marginTop: "32px", marginBottom: "20px" }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "16px",
                  color: "#27235C",
                  marginBottom: 16,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
                onClick={() => setExpandedAttachments(!expandedAttachments)}
              >
                <i
                  className="bi bi-paperclip"
                  style={{ marginRight: 6 }}
                ></i>
                Attachments ({attachments.length})
                <i
                  className={`bi bi-chevron-${
                    expandedAttachments ? "up" : "down"
                  }`}
                  style={{ marginLeft: "auto", fontSize: "12px" }}
                ></i>
              </div>

              {expandedAttachments && (
                <div
                  style={{
                    background: "#f8f9fa",
                    borderRadius: 8,
                    border: "1px solid #e0e0e0",
                    padding: "16px",
                  }}
                >
                  {attachments.map((att, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px",
                        marginBottom: idx < attachments.length - 1 ? "12px" : 0,
                        background: "#fff",
                        borderRadius: 6,
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          flex: 1,
                          gap: "12px",
                        }}
                      >
                        <i
                          className={`bi ${getFileIcon(att.fileType, att.fileName)}`}
                          style={{
                            fontSize: "20px",
                            color: "#97247E",
                            minWidth: "24px",
                            textAlign: "center",
                          }}
                        ></i>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: "14px",
                              color: "#27235C",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              marginBottom: "4px",
                              title: att.fileName,
                            }}
                          >
                            {att.fileName}
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#6b7280",
                              display: "flex",
                              gap: "12px",
                            }}
                          >
                            <span>{formatFileSize(att.fileSize)}</span>
                            <span>•</span>
                            <span>{formatDate(att.uploadedAt)}</span>
                            {att.attachmentNote && (
                              <>
                                <span>•</span>
                                <span
                                  style={{
                                    maxWidth: "200px",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    fontStyle: "italic",
                                  }}
                                  title={att.attachmentNote}
                                >
                                  {att.attachmentNote}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadAttachment(att)}
                        disabled={downloadingId === att.attachmentId}
                        style={{
                          background:
                            downloadingId === att.attachmentId
                              ? "#d1d5db"
                              : "#97247E",
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
                          padding: "8px 14px",
                          cursor:
                            downloadingId === att.attachmentId
                              ? "not-allowed"
                              : "pointer",
                          fontSize: "13px",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          transition: "0.2s",
                          whiteSpace: "nowrap",
                          marginLeft: "12px",
                        }}
                        onMouseEnter={(e) => {
                          if (downloadingId !== att.attachmentId) {
                            e.currentTarget.style.background = "#7d1a6d";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (downloadingId !== att.attachmentId) {
                            e.currentTarget.style.background = "#97247E";
                          }
                        }}
                      >
                        {downloadingId === att.attachmentId ? (
                          <>
                            <i
                              className="bi bi-hourglass-split"
                              style={{ animation: "spin 1s linear infinite" }}
                            ></i>
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
              )}
            </div>
          )}

          <style>{`
            div[style*="overflow-y: auto"]::-webkit-scrollbar {display:none;}
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
