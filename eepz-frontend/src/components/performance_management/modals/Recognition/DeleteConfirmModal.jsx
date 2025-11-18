import React from "react";

const DeleteConfirmModal = ({ show, onClose, onConfirm, message }) => {
  if (!show) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>Confirm Delete</div>
        <div style={styles.body}>
          <p>{message || "Are you sure you want to delete?"}</p>
        </div>
        <div style={styles.footer}>
          <button style={styles.btnCancel} onClick={onClose}>Cancel</button>
          <button style={styles.btnConfirm} onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1500,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: 24,
    width: "90%",
    maxWidth: 400,
    boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)",
  },
  header: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },
  body: {
    marginBottom: 24,
    fontSize: 16,
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
  },
  btnCancel: {
    padding: "10px 16px",
    backgroundColor: "#ccc",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
  btnConfirm: {
    padding: "10px 16px",
    backgroundColor: "#d9534f",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
};

export default DeleteConfirmModal;
