import React from "react";

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
    <div className="tl-modal-overlay" onClick={closeModal}>
      <div className="tl-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tl-modal-header">
          <h2>{active === "l1" ? "L1 Review" : "L2 Review"}</h2>
          <button className="tl-modal-close" onClick={closeModal}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="tl-modal-info">
          <div className="tl-info-item">
            <span className="tl-label">Employee</span>
            <span className="tl-value">{modalData?.employeeName}</span>
          </div>
          <div className="tl-info-item">
            <span className="tl-label">Form</span>
            <span className="tl-value">{modalData?.formName}</span>
          </div>
        </div>

        {active === "l1" && modalData?.l2Decision === "Rejected" && (
          <div className="tl-rejection">
            <div className="tl-rejection-header">
              <i className="bi bi-exclamation-circle-fill"></i>
              L2 Rejection Reason
            </div>
            <p>{modalData?.l2DecisionNote || "No reason provided"}</p>
          </div>
        )}

        <div className="tl-modal-body">
          <table className="tl-modal-table">
            <thead>
              <tr>
                <th>Competency</th>
                {active === "l2" && <th>Emp Rating</th>}
                {active === "l2" && <th>Emp Comments</th>}
                {active === "l2" && <th>L1 Rating</th>}
                {active === "l2" && <th>L1 Comments</th>}
                {active === "l1" && <th>Emp Rating</th>}
                {active === "l1" && <th>Emp Comments</th>}
                <th>Your Rating</th>
                <th>Your Comments</th>
              </tr>
            </thead>
            <tbody>
              {(modalData?.items || []).map((item) => (
                <tr key={item.detailId}>
                  <td className="tl-comp">{item.competencyName}</td>
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
                      value={modalRatings[item.detailId]?.rating || ""}
                      onChange={(e) => handleInputChange(item.detailId, "rating", e.target.value)}
                      className="tl-input-num"
                      placeholder="-"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={modalRatings[item.detailId]?.comment || ""}
                      onChange={(e) => handleInputChange(item.detailId, "comment", e.target.value)}
                      className="tl-input-text"
                      placeholder="Add comments..."
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="tl-modal-footer">
          <button className="tl-btn tl-btn-cancel" onClick={closeModal}>
            <i className="bi bi-x-circle"></i>
            Cancel
          </button>
          {active === "l1" && (
            <button className="tl-btn tl-btn-primary" onClick={handleL1Submit} disabled={submitting}>
              <i className="bi bi-check-circle"></i>
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          )}
          {active === "l2" && (
            <>
              <button className="tl-btn tl-btn-success" onClick={handleL2Approve} disabled={l2ActionLoading}>
                <i className="bi bi-check-lg"></i>
                {l2ActionLoading ? "Processing..." : "Submit & Approve"}
              </button>
              <button className="tl-btn tl-btn-danger" onClick={() => setShowRejectReason(!showRejectReason)} disabled={l2ActionLoading}>
                <i className="bi bi-x-lg"></i>
                Reject
              </button>
            </>
          )}
        </div>

        {active === "l2" && showRejectReason && (
          <div className="tl-reject-box">
            <label>
              <i className="bi bi-exclamation-triangle"></i>
              Rejection Reason
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Provide reason..."
              className="tl-textarea"
            />
            <div className="tl-reject-actions">
              <button className="tl-btn tl-btn-danger-confirm" onClick={handleL2Reject} disabled={!rejectionReason.trim()}>
                <i className="bi bi-check"></i>
                Confirm Rejection
              </button>
              <button className="tl-btn tl-btn-cancel" onClick={() => setShowRejectReason(false)}>
                <i className="bi bi-x"></i>
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
