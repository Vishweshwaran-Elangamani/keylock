import React from "react";

const StatusConfirmModal = ({
  show, onClose, onConfirm, actionType, rewardName
}) => {
  if (!show) return null;
  const isActivating = actionType === "activate";

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          {isActivating ? "Activate" : "Deactivate"} Recognition
        </div>
        <div style={styles.body}>
          <p style={styles.prompt}>
            Are you sure you want to {actionType}{" "}
            <strong style={{ color: "#27235C" }}>{rewardName}</strong>?
          </p>
        </div>
        <div style={styles.footer}>
    
<button
  style={styles.btnCancel}
  onClick={onClose}
  onMouseEnter={e => (e.currentTarget.style.background = '#5a6268')}
  onMouseLeave={e => (e.currentTarget.style.background = '#6c757d')}
>
  Cancel
</button>
<button
  style={{
    ...styles.btnConfirm,
    background: "linear-gradient(90deg, #97247E 0%, #E01950 100%)"
  }}
  onClick={onConfirm}
  onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.11)')}
  onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
>
  {isActivating ? "Activate" : "Deactivate"}
</button>

        </div>
        <style>{`
          div[style*="overflow-y: auto"]::-webkit-scrollbar {display:none;}
        `}</style>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(39, 35, 92, 0.13)",
    backdropFilter: "blur(4px)",
    WebkitBackdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1500,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 22,
    boxShadow: "0 10px 36px rgba(39,35,92,0.17)",
    maxWidth: 390,
    minWidth: 270,
    width: "94vw",
    padding: 0,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    background: "#27235C",
    color: "#fff",
    fontWeight: 800,
    fontSize: "1.08rem",
    textAlign: "left",
    letterSpacing: ".01em",
    padding: "19px 26px 11px 26px",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    boxSizing: "border-box",
  },
  body: {
    background: "#fff",
    padding: "20px 26px 5px 26px",
  },
  prompt: {
    margin: 0,
    fontSize: 15.5,
    color: "#27235C",
    fontWeight: 600,
    textAlign: "left",
    letterSpacing: ".01em",
    lineHeight: 1.6
  },
  footer: {
    background: "#fff",
    display: "flex",
    justifyContent: "flex-end",
    gap: 14,
    padding: "22px 26px 19px 26px",
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  btnCancel: {
    padding: "9px 24px",
    borderRadius: 8,
    border: "none",
    background: "#6C757D",
    color: "#fff",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    letterSpacing: ".02em",
    transition: "background .15s"
  },
  btnConfirm: {
    padding: "9px 24px",
    borderRadius: 8,
    border: "none",
    color: "#fff",
    fontWeight: 700,
    fontSize: 15,
    boxShadow: "0 2px 8px rgba(151,36,126,0.09)",
    cursor: "pointer",
    letterSpacing: ".02em",
    transition: "filter 0.13s"
  }
};

export default StatusConfirmModal;
