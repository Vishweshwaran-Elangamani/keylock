import React from "react";
import api from "../../../../services/performancemanagement/api/api";
import "../../../../styles/performancemanagement/components/AppraisalDetailsModal.css";

function statusRender(status) {
  if (typeof status !== "string") return "-";
  const s = status.toLowerCase();
  if (s === "pending") {
    return (
      <span className="appraisal-status-pending">
        <i className="bi bi-hourglass-split appraisal-status-icon"></i>
        Pending
      </span>
    );
  } else if (s === "completed") {
    return (
      <span className="appraisal-status-completed">
        <i className="bi bi-check-circle-fill appraisal-status-icon"></i>
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
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/vnd.ms-excel": ".xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
    "application/vnd.ms-powerpoint": ".ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
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

      // ✅ Use the imported API function
      const response = await downloadHrAttachment(attachment.attachmentId);

      const blob = response.data;
      const contentType = response.headers['content-type'];
      let filename = attachment.fileName || "attachment";

      if (!hasExtension(filename)) {
        let extension = "";
        if (contentType) {
          extension = getExtensionFromMime(contentType);
        }
        if (!extension && attachment.fileType) {
          extension = getExtensionFromMime(attachment.fileType);
        }
        if (!extension && blob.type) {
          extension = getExtensionFromMime(blob.type);
        }
        if (!extension) {
          extension = ".bin";
        }
        filename += extension;
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err) {
      console.error("✗ Download error:", err);
      setError(`Failed to download ${attachment.fileName}: ${err.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  if (!show) return null;

  return (
    <>
      {/* Overlay */}
      <div className="appraisal-modal-overlay" onClick={onClose} />

      {/* Modal Container */}
      <div className="appraisal-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="appraisal-modal-header">
          <div className="appraisal-modal-header-content">
            <div className="appraisal-modal-title">Appraisal Details</div>
            <div className="appraisal-modal-subtitle">
              <span className="appraisal-modal-subtitle-name">{employeeName}</span>
              <span className="appraisal-modal-subtitle-separator">|</span>
              {projectName}
            </div>
          </div>

          {attachments && attachments.length > 0 && (
            <div className="appraisal-modal-attachment-badge">
              <i className="bi bi-paperclip appraisal-modal-attachment-icon"></i>
              <span className="appraisal-modal-attachment-count">
                {attachments.length} {attachments.length === 1 ? "File" : "Files"}
              </span>
            </div>
          )}

          <button
            onClick={onClose}
            className="appraisal-modal-close-btn"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="appraisal-modal-body">
          {error && (
            <div className="appraisal-modal-error">
              <i className="bi bi-exclamation-circle appraisal-modal-error-icon"></i>
              {error}
            </div>
          )}

          {/* Competency Evaluations */}
          <div className="appraisal-section">
            <div className="appraisal-section-title">
              <i className="bi bi-list-check appraisal-section-title-icon"></i>
              Competency Evaluations
            </div>
            {competencies.length === 0 ? (
              <div className="appraisal-no-data">No competencies found</div>
            ) : (
              competencies.map((c, idx) => (
                <div key={idx} className="appraisal-competency-card">
                  <div className="appraisal-competency-title">
                    #{idx + 1} &nbsp; {c.competencyName}
                  </div>

                  <div className="appraisal-competency-fields">
                    {fieldOrder.map(([label, key]) =>
                      key === "competencyName" ? null : (
                        <div key={key} className="appraisal-field-row">
                          <span className="appraisal-field-label">{label}</span>
                          <span
                            className={`appraisal-field-value ${
                              key === "employeeComments" ||
                              key === "l1Comments" ||
                              key === "l2Comments"
                                ? "is-comment"
                                : ""
                            } ${key === "status" ? "is-status" : ""}`}
                          >
                            {key === "status"
                              ? statusRender(c.status)
                              : c[key] !== undefined && c[key] !== null && c[key] !== ""
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

          {/* Attachments */}
          {attachments && attachments.length > 0 && (
            <div className="appraisal-attachments-section">
              <div className="appraisal-attachments-header">
                <i className="bi bi-paperclip"></i>
                <span>Employee Attachments</span>
              </div>

              <div className="appraisal-attachments-list">
                {attachments.map((att, idx) => (
                  <div key={idx} className="appraisal-attachment-item">
                    <div className="appraisal-attachment-info">
                      <i
                        className={`bi ${getFileIcon(att.fileType, att.fileName)} appraisal-attachment-icon`}
                      ></i>

                      <div className="appraisal-attachment-details">
                        <div className="appraisal-attachment-name">{att.fileName}</div>
                        <div className="appraisal-attachment-meta">
                          {formatFileSize(att.fileSize)}
                          {att.uploadedAt && ` • ${formatDate(att.uploadedAt)}`}
                        </div>
                        {att.note && (
                          <div className="appraisal-attachment-note">Note: {att.note}</div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadAttachment(att)}
                      disabled={downloadingId === att.attachmentId}
                      className="appraisal-download-btn"
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
        </div>

        {/* Footer */}
        <div className="appraisal-modal-footer">
          <button className="appraisal-btn-close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </>
  );
};

export default AppraisalDetailsModal;
