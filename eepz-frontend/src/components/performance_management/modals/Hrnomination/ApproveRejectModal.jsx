import React from "react";

const ApproveRejectModal = ({ 
  showActionModal, 
  setShowActionModal, 
  actionType, 
  actionRemarks, 
  setActionRemarks, 
  submitAction, 
  THEME 
}) => {
  if (!showActionModal) return null;

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          zIndex: 1040,
        }}
        onClick={() => setShowActionModal(false)}
      ></div>

      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1050,
          width: "90%",
          maxWidth: "500px",
        }}
      >
        <div className="card border-0 shadow-lg" style={{ background: THEME.card }}>
          <div
            className="card-header"
            style={{
              background: THEME.primary,
              color: "#fff",
              borderBottom: "none",
              padding: "16px 20px",
            }}
          >
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0" style={{ fontWeight: "600" }}>
                {actionType === "approve" ? "Approval Remarks" : "Rejection Reason"}
              </h6>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => setShowActionModal(false)}
              ></button>
            </div>
          </div>
          <div className="card-body" style={{ padding: "20px" }}>
            <label
              style={{
                fontSize: "13px",
                fontWeight: "600",
                color: THEME.textLight,
                marginBottom: "8px",
                display: "block",
              }}
            >
              {actionType === "approve"
                ? "Enter approval justification:"
                : "Enter rejection reason:"}
            </label>
            <textarea
              className="form-control"
              rows="4"
              value={actionRemarks}
              onChange={(e) => setActionRemarks(e.target.value)}
              placeholder={
                actionType === "approve"
                  ? "Why are you approving this nomination?"
                  : "Why are you rejecting this nomination?"
              }
              style={{ fontSize: "14px", borderColor: THEME.border }}
            ></textarea>
          </div>
          <div
            className="card-footer"
            style={{
              background: THEME.background,
              borderTop: `1px solid ${THEME.border}`,
              padding: "12px 20px",
            }}
          >
            <div className="d-flex gap-2 justify-content-end">
              <button
                className="btn btn-sm"
                onClick={() => setShowActionModal(false)}
                style={{
                  background: "transparent",
                  color: THEME.text,
                  border: `1px solid ${THEME.border}`,
                  fontWeight: "600",
                  padding: "6px 16px",
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-sm"
                onClick={submitAction}
                style={{
                  background: actionType === "approve" ? THEME.success : THEME.danger,
                  color: "#fff",
                  border: "none",
                  fontWeight: "600",
                  padding: "6px 16px",
                }}
              >
                {actionType === "approve" ? "✓ Approve" : "✗ Reject"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ApproveRejectModal;