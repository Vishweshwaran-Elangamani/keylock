import React from "react";
import logoImage from "../../../../assets/logodark.png";
import "../../../../styles/performancemanagement/components/ReviewModal.css";
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
    if (fileType.includes("word") || fileType.includes("document"))
      return "bi-file-earmark-word";
    if (fileType.includes("excel") || fileType.includes("spreadsheet"))
      return "bi-file-earmark-excel";
    if (fileType.includes("image")) return "bi-file-earmark-image";
    if (fileType.includes("zip") || fileType.includes("compressed"))
      return "bi-file-earmark-zip";
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
      <div className="tl-modal" onClick={(e) => e.stopPropagation()}>
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

        {active === "l1" &&
          modalData?.l2Decision === "Rejected" &&
          !isReadOnly && (
            <div className="tl-rejection">
              <div className="tl-rejection-header">
                <i className="bi bi-exclamation-circle-fill" />
                L2 Rejection Reason
              </div>
              <p className="tl-rejection-note">
                {modalData?.l2DecisionNote || "No reason provided"}
              </p>
            </div>
          )}

        <div className="tl-modal-body">
          <table
            className="tl-modal-table"
            role="table"
            aria-label="Competencies table"
          >
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

                  {active === "l2" && (
                    <td className="tl-center">{item.employeeRating ?? "-"}</td>
                  )}
                  {active === "l2" && <td>{item.employeeComments || "-"}</td>}
                  {active === "l2" && (
                    <td className="tl-center">{item.approverRating ?? "-"}</td>
                  )}
                  {active === "l2" && <td>{item.approverComments || "-"}</td>}

                  {active === "l1" && (
                    <td className="tl-center">{item.employeeRating ?? "-"}</td>
                  )}
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
                        onChange={(e) =>
                          handleInputChange(
                            item.detailId,
                            "rating",
                            e.target.value
                          )
                        }
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
                      <div
                        style={{
                          padding: "8px 10px",
                          background: "#f3f4f6",
                          borderRadius: "6px",
                          minHeight: "40px",
                          color: "#374151",
                        }}
                      >
                        {modalRatings[item.detailId]?.comment || "-"}
                      </div>
                    ) : (
                      <textarea
                        value={modalRatings[item.detailId]?.comment ?? ""}
                        onChange={(e) =>
                          handleInputChange(
                            item.detailId,
                            "comment",
                            e.target.value
                          )
                        }
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
                  <td
                    colSpan={active === "l2" ? 9 : 6}
                    style={{ textAlign: "center", padding: "18px" }}
                  >
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
                  <div
                    key={attachment.attachmentId}
                    className="tl-attachment-item"
                  >
                    <div className="tl-attachment-info">
                      <i
                        className={`bi ${getFileIcon(
                          attachment.fileType
                        )} tl-attachment-icon`}
                      ></i>
                      <div className="tl-attachment-details">
                        <div className="tl-attachment-name">
                          {attachment.fileName}
                        </div>
                        <div className="tl-attachment-meta">
                          {formatFileSize(attachment.fileSize)}
                          {attachment.uploadedAt &&
                            ` • ${new Date(
                              attachment.uploadedAt
                            ).toLocaleDateString()}`}
                        </div>
                        {attachment.attachmentNote && (
                          <div className="tl-attachment-note">
                            Note: {attachment.attachmentNote}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      className="tl-attachment-download"
                      onClick={() =>
                        handleDownloadAttachment(attachment.attachmentId)
                      }
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

        <div className="tl-modal-footer">
          {isReadOnly ? (
            <button
              className="tl-btn tl-btn-cancel"
              onClick={closeModal}
              aria-label="Close"
            >
              Close
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
                    Cancel
                  </button>

                  <button
                    className="tl-btn tl-btn-l1-submit"
                    onClick={handleL1Submit}
                    disabled={submitting}
                    aria-label="Submit review"
                  >
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
          <div
            className="tl-reject-box"
            role="region"
            aria-label="Rejection reason"
          >
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
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewModal;
