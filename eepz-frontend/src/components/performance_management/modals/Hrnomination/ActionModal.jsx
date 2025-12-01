import React from "react";

const ActionModal = ({
  show,
  onClose,
  actionType,
  actionRemarks,
  setActionRemarks,
  onSubmit,
  THEME,
}) => {
  if (!show) return null;

  return (
    <>

      <div
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(39, 35, 92, 0.32)",
          backdropFilter: "blur(7px)",
          WebkitBackdropFilter: "blur(7px)",
          zIndex: 1040,
        }}
        onClick={onClose}
      ></div>


      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1050,
          width: "95%",
          maxWidth: 430,
        }}
      >
        <div
          style={{
            background: THEME.card,
            borderRadius: 18,
            boxShadow: "0 8px 24px rgba(32, 30, 60, 0.13)",
            overflow: "hidden",
          }}
        >

          <div
            style={{
              background: THEME.primary,
              color: "#fff",
              padding: "22px 26px 12px 26px",
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              minHeight: 40,
              margin: 0,
              width: "100%",
            }}
          >
            <h6
              className="mb-0"
              style={{
                fontWeight: 700,
                fontSize: 17,
                color: "white",
                margin: 0,
                letterSpacing: "0.04em",
              }}
            >
              {actionType === "approve" ? "Approval Remarks" : "Rejection Reason"}
            </h6>

          </div>

          <div
            className="card-body"
            style={{ padding: "32px 26px 18px 26px", background: THEME.card }}
          >
            <label
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: THEME.textLight,
                marginBottom: "10px",
                letterSpacing: "0.2px",
                display: "block",
              }}
            >
              {actionType === "approve"
                ? "Enter your approval justification"
                : "Enter your rejection reason"}
            </label>
            <textarea
              className="form-control"
              rows={4}
              value={actionRemarks}
              onChange={(e) => setActionRemarks(e.target.value)}
              placeholder={
                actionType === "approve"
                  ? "Why are you approving this nomination?"
                  : "Why are you rejecting this nomination?"
              }
              style={{
                fontSize: 15,
                borderColor: THEME.border,
                borderRadius: 7,
                background: "#fff",
                minHeight: 92,
                padding: "13px",
                boxShadow: "none",
                outline: "none",
                resize: "vertical",
              }}
            />
          </div>
          <div
            className="card-footer"
            style={{
              background: THEME.background,
              borderTop: `1px solid ${THEME.border}`,
              padding: "20px 26px",
              borderBottomLeftRadius: 18,
              borderBottomRightRadius: 18,
            }}
          >
            <div style={{ display: "flex", gap: 14, justifyContent: "flex-end" }}>
              <button
                className="btn"
                onClick={onClose}
                style={{
                  background: "grey",
                  color: "white",
                  border: `1.8px solid #d1d5db`,
                  fontWeight: 600,
                  fontSize: 15,
                  padding: "8px 26px",
                  borderRadius: 8,
                  minWidth: 86,
                  transition: "border 0.18s, box-shadow 0.14s",
                  boxShadow: "0 1.5px 12px rgba(60,70,80,0.03)",
                }}
              >
                Cancel
              </button>
              <button
                className="btn"
                onClick={onSubmit}
                style={{
                  background: actionType === "approve"
                    ? "#27235C"
                    : "linear-gradient(90deg, #ee4947 0%, #f16f6f 95%)",
                  color: "#fff",
                  border: "none",
                  fontWeight: 700,
                  fontSize: 15,
                  padding: "8px 28px",
                  borderRadius: 8,
                  minWidth: 104,
                  letterSpacing: "0.05em",
                  boxShadow: "0 2px 8px rgba(29,100,216,0.09)",
                }}
              >
                {actionType === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ActionModal;
