// ReviewModal.jsx
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
}) => {
  if (!showModal) return null;
 
  const handleInputChange = (detailId, key, value) => {
    setModalRatings((prev) => ({
      ...prev,
      [detailId]: { ...prev[detailId], [key]: value },
    }));
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
        {/* Header */}
        <div className="tl-modal-header">
          <div className="tl-modal-header-left">
            <img src={logoImage} alt="EEPZ Logo" className="tl-modal-logo" />
          </div>
 
          <div className="tl-modal-header-center" aria-hidden>
            <div className="tl-modal-title">{modalData?.formName || "Assessment Form"}</div>
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
 
        {/* Info row */}
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
 
        {/* L2 rejection note shown to L1 when present */}
        {active === "l1" && modalData?.l2Decision === "Rejected" && (
          <div className="tl-rejection">
            <div className="tl-rejection-header">
              <i className="bi bi-exclamation-circle-fill" />
              L2 Rejection Reason
            </div>
            <p className="tl-rejection-note">{modalData?.l2DecisionNote || "No reason provided"}</p>
          </div>
        )}
 
        {/* Modal body - table */}
        <div className="tl-modal-body">
          <table className="tl-modal-table" role="table" aria-label="Competencies table">
            <thead style={{ backgroundColor: "#26225A", color: "white" }}>
              <tr>
                <th>COMPETENCY NAME</th>
                {active === "l2" && <th>EMP RATING</th>}
                {active === "l2" && <th>EMP COMMENTS</th>}
                {active === "l2" && <th>L1 RATING</th>}
                {active === "l2" && <th>L1 COMMENTS</th>}
                {active === "l1" && <th>EMP RATING</th>}
                {active === "l1" && <th>EMP COMMENTS</th>}
                <th>RATING</th>
                <th>COMMENTS</th>
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
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={modalRatings[item.detailId]?.rating ?? ""}
                      onChange={(e) => handleInputChange(item.detailId, "rating", e.target.value)}
                      className="tl-input-num"
                      placeholder="-"
                      aria-label={`Rating for ${item.competencyName}`}
                    />
                  </td>
 
                  <td>
                    <textarea
                      value={modalRatings[item.detailId]?.comment ?? ""}
                      onChange={(e) => handleInputChange(item.detailId, "comment", e.target.value)}
                      className="tl-input-text"
                      placeholder="Justify through comments"
                      rows="2"
                      aria-label={`Comments for ${item.competencyName}`}
                    />
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
        </div>
 
        {/* Footer buttons */}
        <div className="tl-modal-footer">
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
                <i className="bi bi-check-circle" /> {submitting ? "Submitting..." : "Submit Assessment"}
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
                <i className="bi bi-check-lg" /> {l2ActionLoading ? "Processing..." : "Submit & Approve"}
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
        </div>
 
        {/* L2 rejection box */}
        {active === "l2" && showRejectReason && (
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
 
 