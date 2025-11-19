import React from "react";

const DeleteConfirmModal = ({ show, onClose, onConfirm, message }) => {
  if (!show) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          Confirm Delete
        </div>
        <div style={styles.body}>
          <p style={styles.prompt}>{message || "Are you sure you want to delete?"}</p>
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
            style={styles.btnConfirm}
            onClick={onConfirm}
            onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.12)')}
            onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(39, 35, 92, 0.23)",
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
    maxWidth: 370,
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
    fontSize: "1.15rem",
    textAlign: "left",
    letterSpacing: ".01em",
    padding: "19px 26px 15px 26px",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    boxSizing: "border-box",
  },
  body: {
    background: "#fff",
    padding: "22px 26px 10px 26px",
  },
  prompt: {
    margin: 0,
    fontSize: 15.5,
    color: "#27235C",
    fontWeight: 600,
    textAlign: "left",
    letterSpacing: ".01em",
    lineHeight: 1.65
  },
  footer: {
    background: "#fff",
    display: "flex",
    justifyContent: "flex-end",
    gap: 14,
    padding: "23px 26px 20px 26px",
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  btnCancel: {
    padding: "9px 26px",
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
    padding: "9px 26px",
    borderRadius: 8,
    border: "none",
    color: "#fff",
    fontWeight: 700,
    fontSize: 15,
    background: "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
    boxShadow: "0 2px 8px rgba(151,36,126,0.10)",
    cursor: "pointer",
    letterSpacing: ".02em",
    transition: "filter 0.13s"
  }
};

export default DeleteConfirmModal;
