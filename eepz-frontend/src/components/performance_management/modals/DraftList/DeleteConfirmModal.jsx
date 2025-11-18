import React from "react";

const DeleteConfirmModal = ({ show, onClose, onConfirm, message }) => {
  if (!show) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)",
      display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1500,
    }} onClick={onClose}>
      <div style={{
        backgroundColor: "#fff", padding: 24, borderRadius: 8, width: "90%", maxWidth: 400,
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Confirm Delete</div>
        <div style={{ marginBottom: 24, fontSize: 16 }}>
          <p>{message || "Are you sure you want to delete?"}</p>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button style={{ padding: "10px 16px", background: "#ccc", border: "none", borderRadius: 6, cursor: "pointer" }} onClick={onClose}>Cancel</button>
          <button style={{ padding: "10px 16px", background: "#d9534f", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }} onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
