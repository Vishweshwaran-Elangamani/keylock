import React from "react";
import logoImage from "../../../../assets/logodark.png";
 
const ReviewModal = ({
  showModal,
  closeModal,
  modalData,
  modalRatings,
  setModalRatings,
  handleL1Submit,
  handleL2Approve,
  handleL2Reject,
  setRejectionReason,
  rejectionReason,
  showRejectReason,
  setShowRejectReason,
  submitting,
  l2ActionLoading,
  active,
  handleDownloadAttachment,
  isReadOnly = false,
}) => {
  if (!showModal) return null;
 
  const handleInputChange = (detailId, key, value) => {
    if (!isReadOnly) {
      setModalRatings((prev) => ({
        ...prev,
        [detailId]: { ...prev[detailId], [key]: value },
      }));
    }
  };
 
  const formatFileSize = (bytes) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };
 
  const getFileIcon = (fileType) => {
    if (!fileType) return "bi-file-earmark";
    if (fileType.includes("pdf")) return "bi-file-earmark-pdf";
    if (fileType.includes("word") || fileType.includes("document")) return "bi-file-earmark-word";
    if (fileType.includes("excel") || fileType.includes("spreadsheet")) return "bi-file-earmark-excel";
    if (fileType.includes("image")) return "bi-file-earmark-image";
    if (fileType.includes("zip") || fileType.includes("compressed")) return "bi-file-earmark-zip";
    return "bi-file-earmark";
  };
 
  return (
    <div
      className="tl-modal-overlay"
      onClick={() => {
        if (!submitting && !l2ActionLoading) closeModal();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Review modal"
    >
      <style>{`
        .tl-modal-table th, .tl-modal-table td {
          text-align: left !important;
          vertical-align: middle !important;
        }
        .tl-modal-table th {
          font-weight: 600;
          font-size: 13px;
          text-transform: uppercase !important;
          letter-spacing: 0.5px;
          background: #26225A !important;
          color: #fff !important;
          white-space: nowrap;
        }
        .tl-modal-table td {
          font-size: 14px;
          color: #222;
          background: #fff;
          padding: 12px 16px;
        }
        .tl-comp {
          font-weight: 600;
        }
 
        /* Header – aligned with page style */
        .tl-modal {
          max-width: 960px;
        }
      .tl-modal-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 32px 14px 32px;
  background: #ffffff;
  border-bottom: 2px solid  #27235c;
}
 
.tl-modal-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 0;
}
 
        .tl-modal-header-left {
          position: absolute;
          left: 32px;
          display: flex;
          align-items: center;
        }
        .tl-modal-logo {
          height: 34px;
          width: auto;
        }
        .tl-modal-header-center {
          text-align: center;
        }
        .tl-modal-title {
          font-size: 18px;
          font-weight: 700;
          color: #26225A;
          line-height: 1.2;
        }
        .tl-modal-subtitle {
          font-size: 12px;
          font-weight: 500;
          color: #6c757d;
          margin-top: 2px;
        }
        .tl-modal-close {
          position: absolute;
          right: 24px;
          top: 50%;
          transform: translateY(-50%);
          border: none;
          background: transparent;
          cursor: pointer;
          color: #6c757d;
          font-size: 14px;
          padding: 4px;
        }
        .tl-modal-close:hover {
          color: #26225A;
        }
        .tl-modal-divider {
          height: 1px;
          background: #e5e7eb;
          margin: 0 24px 10px 24px;
        }
 
        /* Attachments section */
        .tl-attachments-section {
          margin: 20px 0 10px 0;
          padding: 14px 16px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #dee2e6;
        }
        .tl-attachments-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
          font-weight: 600;
          font-size: 13px;
          color: #26225A;
        }
        .tl-attachments-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .tl-attachment-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 10px;
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          transition: all 0.2s;
        }
        .tl-attachment-item:hover {
          border-color: #26225A;
          box-shadow: 0 2px 4px rgba(38, 34, 90, 0.1);
        }
        .tl-attachment-info {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
        }
        .tl-attachment-icon {
          font-size: 20px;
          color: #26225A;
        }
        .tl-attachment-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .tl-attachment-name {
          font-weight: 500;
          font-size: 13px;
          color: #212529;
        }
        .tl-attachment-meta {
          font-size: 11px;
          color: #6c757d;
        }
        .tl-attachment-note {
          font-size: 11px;
          color: #495057;
          font-style: italic;
          margin-top: 2px;
        }
        .tl-attachment-download {
          padding: 6px 12px;
          background: #26225A;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: background 0.2s;
        }
        .tl-attachment-download:hover {
          background: #1a1740;
        }
 
        .tl-no-attachments {
          text-align: center;
          padding: 18px;
          color: #6c757d;
          font-size: 13px;
        }
        .tl-rating-select {
          width: 120px;
          padding: 6px 32px 6px 10px;
          border-radius: 6px;
          border: 1.8px solid #26225A;
          font-size: 14px;
          color: #111827;
          background-color: #ffffff;
          outline: none;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%2326225A' class='bi bi-chevron-down' viewBox='0 0 16 16'%3E%3Cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 8px center;
          background-size: 14px 14px;
        }
 
        .tl-rating-select:focus {
          border-color: #111827;
          box-shadow: 0 0 0 2px rgba(38, 34, 90, 0.18);
        }

        .tl-rating-select:disabled {
          background-color: #f3f4f6;
          cursor: not-allowed;
          opacity: 0.7;
        }

        .tl-read-only-text {
          padding: 6px 10px;
          background: #f3f4f6;
          border-radius: 6px;
          font-size: 14px;
          color: #374151;
          font-weight: 500;
        }
 
      `}</style>
 
      <div className="tl-modal" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="tl-modal-header">
          <div className="tl-modal-header-left">
            <img src={logoImage} alt="EEPZ Logo" className="tl-modal-logo" />
          </div>
 
          <div className="tl-modal-header-center" aria-hidden>
            <div className="tl-modal-title">
              {modalData?.formName || "Appraisal Form For Employee"}
            </div>
            <div className="tl-modal-subtitle">Self Assessment Form</div>
          </div>
 
          <button
            className="tl-modal-close"
            onClick={() => {
              if (!submitting && !l2ActionLoading) closeModal();
            }}
            aria-label="Close modal"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>
 
        <div className="tl-modal-divider" />
 
        {/* INFO STRIP */}
        <div className="tl-modal-info">
          <div className="tl-info-item">
            <span className="tl-label">Employee</span>
            <span className="tl-value">{modalData?.employeeName || "-"}</span>
          </div>
 
          <div className="tl-info-item">
            <span className="tl-label">Form</span>
            <span className="tl-value">{modalData?.formName || "-"}</span>
          </div>
        </div>
 
        {active === "l1" && modalData?.l2Decision === "Rejected" && !isReadOnly && (
          <div className="tl-rejection">
            <div className="tl-rejection-header">
              <i className="bi bi-exclamation-circle-fill" />
              L2 Rejection Reason
            </div>
            <p className="tl-rejection-note">{modalData?.l2DecisionNote || "No reason provided"}</p>
          </div>
        )}
 
        {/* BODY */}
        <div className="tl-modal-body">
          <table className="tl-modal-table" role="table" aria-label="Competencies table">
            <thead>
              <tr>
                <th>COMPETENCY NAME</th>
                {active === "l2" && <th>EMP RATING</th>}
                {active === "l2" && <th>EMP COMMENTS</th>}
                {active === "l2" && <th>L1 RATING</th>}
                {active === "l2" && <th>L1 COMMENTS</th>}
                {active === "l1" && <th>EMP RATING</th>}
                {active === "l1" && <th>EMP COMMENTS</th>}
                <th>{active === "l1" ? "L1 RATING" : "L2 RATING"}</th>
                <th>{active === "l1" ? "L1 COMMENTS" : "L2 COMMENTS"}</th>
              </tr>
            </thead>
 
            <tbody>
              {(modalData?.items || []).map((item) => (
                <tr key={item.detailId}>
                  <td className="tl-comp">
                    <strong>{item.competencyName}</strong>
                  </td>
 
                  {active === "l2" && <td className="tl-center">{item.employeeRating ?? "-"}</td>}
                  {active === "l2" && <td>{item.employeeComments || "-"}</td>}
                  {active === "l2" && <td className="tl-center">{item.approverRating ?? "-"}</td>}
                  {active === "l2" && <td>{item.approverComments || "-"}</td>}
 
                  {active === "l1" && <td className="tl-center">{item.employeeRating ?? "-"}</td>}
                  {active === "l1" && <td>{item.employeeComments || "-"}</td>}
 
                  <td className="tl-center">
                    {isReadOnly ? (
                      <span className="tl-read-only-text">
                        {modalRatings[item.detailId]?.rating || "-"}
                      </span>
                    ) : (
                      <select
                        className="tl-rating-select"
                        value={modalRatings[item.detailId]?.rating ?? ""}
                        onChange={(e) => handleInputChange(item.detailId, "rating", e.target.value)}
                        aria-label={`Rating for ${item.competencyName}`}
                      >
                        <option value="">-</option>
                        <option value="1">1 - Poor</option>
                        <option value="2">2 - Fair</option>
                        <option value="3">3 - Good</option>
                        <option value="4">4 - Very Good</option>
                        <option value="5">5 - Excellent</option>
                      </select>
                    )}
                  </td>
 
                  <td>
                    {isReadOnly ? (
                      <div style={{ 
                        padding: "8px 10px", 
                        background: "#f3f4f6", 
                        borderRadius: "6px",
                        minHeight: "40px",
                        color: "#374151"
                      }}>
                        {modalRatings[item.detailId]?.comment || "-"}
                      </div>
                    ) : (
                      <textarea
                        value={modalRatings[item.detailId]?.comment ?? ""}
                        onChange={(e) => handleInputChange(item.detailId, "comment", e.target.value)}
                        className="tl-input-text"
                        placeholder="Justify through comments"
                        rows="2"
                        aria-label={`Comments for ${item.competencyName}`}
                      />
                    )}
                  </td>
                </tr>
              ))}
 
              {(!modalData?.items || modalData.items.length === 0) && (
                <tr>
                  <td colSpan={active === "l2" ? 9 : 6} style={{ textAlign: "center", padding: "18px" }}>
                    No competencies found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
 
          {modalData?.attachments && modalData.attachments.length > 0 && (
            <div className="tl-attachments-section">
              <div className="tl-attachments-header">
                <i className="bi bi-paperclip"></i>
                <span>Attachments</span>
              </div>
              <div className="tl-attachments-list">
                {modalData.attachments.map((attachment) => (
                  <div key={attachment.attachmentId} className="tl-attachment-item">
                    <div className="tl-attachment-info">
                      <i className={`bi ${getFileIcon(attachment.fileType)} tl-attachment-icon`}></i>
                      <div className="tl-attachment-details">
                        <div className="tl-attachment-name">{attachment.fileName}</div>
                        <div className="tl-attachment-meta">
                          {formatFileSize(attachment.fileSize)}
                          {attachment.uploadedAt &&
                            ` • ${new Date(attachment.uploadedAt).toLocaleDateString()}`}
                        </div>
                        {attachment.attachmentNote && (
                          <div className="tl-attachment-note">Note: {attachment.attachmentNote}</div>
                        )}
                      </div>
                    </div>
                    <button
                      className="tl-attachment-download"
                      onClick={() => handleDownloadAttachment(attachment.attachmentId)}
                      aria-label={`Download ${attachment.fileName}`}
                    >
                      <i className="bi bi-download"></i>
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
 
        {/* FOOTER */}
        <div className="tl-modal-footer">
          {isReadOnly ? (
            <button
              className="tl-btn tl-btn-cancel"
              onClick={closeModal}
              aria-label="Close"
            >
              <i className="bi bi-x-circle" /> Close
            </button>
          ) : (
            <>
              {active === "l1" && (
                <>
                  <button
                    className="tl-btn tl-btn-cancel"
                    onClick={() => {
                      if (!submitting) closeModal();
                    }}
                    disabled={submitting}
                    aria-label="Cancel"
                  >
                    <i className="bi bi-x-circle" /> Cancel
                  </button>
 
                  <button
                    className="tl-btn tl-btn-primary"
                    onClick={handleL1Submit}
                    disabled={submitting}
                    aria-label="Submit review"
                  >
                    <i className="bi bi-check-circle" />{" "}
                    {submitting ? "Submitting..." : "Submit Assessment"}
                  </button>
                </>
              )}
 
              {active === "l2" && (
                <>
                  <button
                    className="tl-btn tl-btn-primary"
                    onClick={handleL2Approve}
                    disabled={l2ActionLoading}
                    aria-label="Submit and approve"
                  >
                    <i className="bi bi-check-lg" />{" "}
                    {l2ActionLoading ? "Processing..." : "Submit & Approve"}
                  </button>
 
                  <button
                    className="tl-btn tl-btn-cancel"
                    onClick={() => setShowRejectReason(!showRejectReason)}
                    disabled={l2ActionLoading}
                    aria-label="Reject"
                  >
                    <i className="bi bi-x-lg" /> Reject
                  </button>
                </>
              )}
            </>
          )}
        </div>
 
        {active === "l2" && showRejectReason && !isReadOnly && (
          <div className="tl-reject-box" role="region" aria-label="Rejection reason">
            <label className="tl-reject-label" htmlFor="tl-reason-textarea">
              <i className="bi bi-exclamation-triangle" /> Rejection Reason
            </label>
 
            <textarea
              id="tl-reason-textarea"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Provide reason..."
              className="tl-textarea"
              rows="4"
              aria-label="Rejection reason"
            />
 
            <div className="tl-reject-actions">
              <button
                className="tl-btn tl-btn-primary"
                onClick={handleL2Reject}
                disabled={!rejectionReason.trim() || l2ActionLoading}
                aria-label="Confirm rejection"
              >
                <i className="bi bi-check" /> Confirm Rejection
              </button>
 
              <button
                className="tl-btn tl-btn-cancel"
                onClick={() => setShowRejectReason(false)}
                disabled={l2ActionLoading}
                aria-label="Cancel rejection"
              >
                <i className="bi bi-x" /> Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
 
export default ReviewModal;
