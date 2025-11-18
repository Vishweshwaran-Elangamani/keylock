import React from "react";

const StatusConfirmModal = ({ show, onClose, onConfirm, actionType, rewardName }) => {
  if (!show) return null;

  const isActivating = actionType === "activate";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1500,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          width: 400,
          maxWidth: "90%",
          textAlign: "center",
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            fontSize: "20px",
            fontWeight: "600",
            marginBottom: 16,
            color: "#27235C",
          }}
        >
          {isActivating ? "Activate" : "Deactivate"} Recognition
        </h3>
        <p style={{ fontSize: "15px", color: "#6b7280", marginBottom: 24 }}>
          Are you sure you want to {actionType}{" "}
          <strong style={{ color: "#27235C" }}>{rewardName}</strong>?
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              borderRadius: 6,
              background: "#fff",
              color: "#374151",
              border: "1px solid #d1d5db",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "10px 20px",
              borderRadius: 6,
              background: isActivating ? "#059669" : "#dc2626",
              color: "#fff",
              border: "none",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            {isActivating ? "Activate" : "Deactivate"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusConfirmModal;
