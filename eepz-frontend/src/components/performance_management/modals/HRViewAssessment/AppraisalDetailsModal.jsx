import React from "react";
import api from "../../../../services/performancemanagement/api/api";
import "../../../../styles/performancemanagement/components/AppraisalDetailsModal.css";

function statusRender(status) {
  if (typeof status !== "string") return "-";
  const s = status.toLowerCase();
  if (s === "pending") {
    return (
      <span className="appraisal-status-pending">
        <i className="bi bi-hourglass-split"></i>
        Pending
      </span>
    );
  } else if (s === "completed") {
    return (
      <span className="appraisal-status-completed">
        <i className="bi bi-check-circle-fill"></i>
        Completed
      </span>
    );
  }
  return <span>{status}</span>;
}

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
  if (!fileType && !fileName) return "bi-file-earmark";

  const name = (fileName || "").toLowerCase();
  const type = (fileType || "").toLowerCase();

  if (type.includes("pdf") || name.endsWith(".pdf")) return "bi-file-pdf-fill";
  if (type.includes("word") || name.endsWith(".doc") || name.endsWith(".docx"))
    return "bi-file-word-fill";
  if (
    type.includes("excel") ||
    type.includes("spreadsheet") ||
    name.endsWith(".xls") ||
    name.endsWith(".xlsx")
  )
    return "bi-file-earmark-spreadsheet-fill";
  if (type.includes("image") || name.match(/\.(jpg|jpeg|png|gif)$/i))
    return "bi-file-image-fill";
  if (type.includes("video") || name.match(/\.(mp4|avi|mov)$/i))
    return "bi-file-play-fill";
  if (type.includes("audio") || name.match(/\.(mp3|wav|m4a)$/i))
    return "bi-file-music-fill";
  if (type === "text/csv" || name.endsWith(".csv"))
    return "bi-file-earmark-text-fill";
  if (type.includes("text") || name.endsWith(".txt"))
    return "bi-file-text-fill";
  if (
    type.includes("zip") ||
    type.includes("compressed") ||
    name.match(/\.(zip|rar|7z)$/i)
  )
    return "bi-file-zip-fill";

  return "bi-file-earmark-fill";
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
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      ".xlsx",
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

      const response = await api.downloadHrAttachment(attachment.attachmentId);

      const blob = response.data;
      const contentType = response.headers["content-type"];
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
      <div className="appraisal-modal-overlay" onClick={onClose} />

      <div
        className="appraisal-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="appraisal-modal-header">
          <div className="appraisal-modal-header-content">
            <div className="appraisal-modal-title">
              <i className="bi bi-clipboard-data-fill"></i>
              Appraisal Details
            </div>
            <div className="appraisal-modal-subtitle">
              <i className="bi bi-person-circle"></i>
              <span className="appraisal-modal-subtitle-name">
                {employeeName}
              </span>
              <span className="appraisal-modal-subtitle-separator">•</span>
              <i className="bi bi-briefcase-fill"></i>
              {projectName}
            </div>
          </div>

          {attachments && attachments.length > 0 && (
            <div className="appraisal-modal-attachment-badge">
              <i className="bi bi-paperclip appraisal-modal-attachment-icon"></i>
              <span className="appraisal-modal-attachment-count">
                {attachments.length}{" "}
                {attachments.length === 1 ? "File" : "Files"}
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

        <div className="appraisal-modal-body">
          {error && (
            <div className="appraisal-modal-error">
              <i className="bi bi-exclamation-circle-fill appraisal-modal-error-icon"></i>
              {error}
            </div>
          )}

          <div className="appraisal-section">
            <div className="appraisal-section-title">
              <i className="bi bi-list-check appraisal-section-title-icon"></i>
              Competency Evaluations
            </div>
            {competencies.length === 0 ? (
              <div className="appraisal-no-data">
                <i className="bi bi-inbox"></i>
                <p>No competencies found</p>
              </div>
            ) : (
              <div className="appraisal-table-wrapper">
                <table className="appraisal-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Competency</th>
                      <th>Employee Rating</th>
                      <th>Employee Comments</th>
                      <th>L1 Reviewer</th>
                      <th>L1 Rating</th>
                      <th>L1 Comments</th>
                      <th>L2 Reviewer</th>
                      <th>L2 Rating</th>
                      <th>L2 Comments</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {competencies.map((c, idx) => (
                      <tr key={idx}>
                        <td className="appraisal-table-index">{idx + 1}</td>
                        <td className="appraisal-table-competency">
                          <strong>{c.competencyName || "-"}</strong>
                        </td>
                        <td className="appraisal-table-rating">
                          {c.employeeRating || "-"}
                        </td>
                        <td className="appraisal-table-comment">
                          {c.employeeComments || "-"}
                        </td>
                        <td>{c.l1ReviewerName || "-"}</td>
                        <td className="appraisal-table-rating">
                          {c.l1Rating || "-"}
                        </td>
                        <td className="appraisal-table-comment">
                          {c.l1Comments || "-"}
                        </td>
                        <td>{c.l2ReviewerName || "-"}</td>
                        <td className="appraisal-table-rating">
                          {c.l2Rating || "-"}
                        </td>
                        <td className="appraisal-table-comment">
                          {c.l2Comments || "-"}
                        </td>
                        <td>{statusRender(c.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {attachments && attachments.length > 0 && (
            <div className="appraisal-attachments-section">
              <div className="appraisal-attachments-header">
                <i className="bi bi-paperclip"></i>
                <span>Employee Attachments</span>
                <span className="appraisal-attachments-count">
                  ({attachments.length})
                </span>
              </div>

              <div className="appraisal-attachments-list">
                {attachments.map((att, idx) => (
                  <div key={idx} className="appraisal-attachment-item">
                    <div className="appraisal-attachment-info">
                      <div className="appraisal-attachment-icon-wrapper">
                        <i
                          className={`bi ${getFileIcon(
                            att.fileType,
                            att.fileName
                          )} appraisal-attachment-icon`}
                        ></i>
                      </div>

                      <div className="appraisal-attachment-details">
                        <div className="appraisal-attachment-name">
                          {att.fileName}
                        </div>
                        <div className="appraisal-attachment-meta">
                          <i className="bi bi-hdd"></i>
                          {formatFileSize(att.fileSize)}
                          {att.uploadedAt && (
                            <>
                              <span className="meta-separator">•</span>
                              <i className="bi bi-clock"></i>
                              {formatDate(att.uploadedAt)}
                            </>
                          )}
                        </div>
                        {att.note && (
                          <div className="appraisal-attachment-note">
                            <i className="bi bi-sticky"></i>
                            {att.note}
                          </div>
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
                          <span className="appraisal-spinner"></span>
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

        <div className="appraisal-modal-footer">
          <button className="appraisal-btn-close" onClick={onClose}>
            <i className="bi bi-x-circle"></i>
            Close
          </button>
        </div>
      </div>
    </>
  );
};

export default AppraisalDetailsModal;
