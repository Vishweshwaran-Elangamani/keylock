// src/components/feedback_management/modals/FeedbackDeleteConfirmModal.jsx

import React, { useState } from "react";
import { AlertTriangle, X, Trash2 } from "lucide-react";
import {
  mentorFeedbackApi,
  peerQueueApi,
  hrFormApi,
} from "../../../services/feedbackmanagement/feedbackApi";

const FeedbackDeleteConfirmModal = ({
  isOpen,
  onClose,
  onSuccess,
  feedbackType = "Mentor", // "Mentor", "Peer", or "HR"
  feedbackData = null,
  title = "Delete Submission",
  message = "Are you sure you want to delete this submission?",
  itemName = "",
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!feedbackData) {
      setError("No feedback data provided");
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      // Delete based on feedback type
      if (feedbackType === "Mentor") {
        const id = feedbackData.trackingId || feedbackData.id;
        await mentorFeedbackApi.remove(id);
        console.log(`Mentor feedback ${id} deleted successfully`);
      } else if (feedbackType === "Peer") {
        const id = feedbackData.queueId || feedbackData.id;
        await peerQueueApi.remove(id);
        console.log(`Peer feedback ${id} deleted successfully`);
      } else if (feedbackType === "HR") {
        const id = feedbackData.responseId;
        await hrFormApi.deleteResponse(id);
        console.log(`HR Form response ${id} deleted successfully`);
      }

      // Call success callback
      if (onSuccess) {
        await onSuccess();
      }

      // Reset states and close modal
      setIsDeleting(false);
      setError("");
      onClose();
    } catch (err) {
      console.error("Delete error:", err);
      setError(err?.message || `Failed to delete ${feedbackType} feedback`);
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    if (!isDeleting) {
      setError("");
      onClose();
    }
  };

  return (
    <>
      {/* Custom Backdrop with Blur Effect */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(39, 35, 92, 0.4)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 1060,
          transition: "all 0.3s ease",
        }}
        onClick={handleCancel}
      />

      {/* Modal Container (Compact) */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "95%",
          maxWidth: "420px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          zIndex: 1070,
          borderRadius: "0.5rem",
          overflow: "hidden",
          boxShadow: "0 8px 28px rgba(0, 0, 0, 0.22)",
          backgroundColor: "#fff",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            background: "#27235C",
            color: "#fff",
            padding: "12px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "15px",
            fontWeight: "600",
            borderRadius: "0.5rem 0.5rem 0 0",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#fff",
            }}
          >
            <AlertTriangle size={18} />
            {title}
          </div>
          <button
            onClick={handleCancel}
            disabled={isDeleting}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              fontSize: "18px",
              cursor: isDeleting ? "not-allowed" : "pointer",
              width: "24px",
              height: "24px",
              opacity: isDeleting ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: "16px",
            background: "#fff",
            overflowY: "auto",
            flex: 1,
            border: "none",
          }}
        >
          <p
            style={{
              fontSize: "14px",
              color: "#334155",
              marginBottom: "12px",
              lineHeight: "1.5",
              textAlign: "center",
            }}
          >
            {message}
          </p>

          {itemName && (
            <div
              style={{
                padding: "10px 12px",
                backgroundColor: "#fee2e2",
                border: "1px solid #fecaca",
                borderRadius: "6px",
                marginBottom: "12px",
                textAlign: "center",
              }}
            >
              <strong style={{ fontSize: "13px", color: "#991b1b" }}>
                {itemName}
              </strong>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div
              style={{
                padding: "10px 12px",
                backgroundColor: "#fee2e2",
                border: "1px solid #fecaca",
                borderRadius: "6px",
                marginBottom: "12px",
                fontSize: "12px",
                color: "#991b1b",
                textAlign: "center",
              }}
            >
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Warning Box */}
          <div
            style={{
              padding: "10px 12px",
              backgroundColor: "#fff3cd",
              border: "1px solid #ffecb5",
              borderRadius: "6px",
              fontSize: "12px",
              color: "#664d03",
              textAlign: "center",
            }}
          >
            <div
              style={{
                marginBottom: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <AlertTriangle size={14} />
              <strong>Warning</strong>
            </div>
            <p style={{ margin: 0 }}>This action cannot be undone.</p>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid #e2e8f0",
            background: "#fff",
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            borderBottomLeftRadius: "8px",
            borderBottomRightRadius: "8px",
          }}
        >
          {/* Cancel Button */}
          <button
            type="button"
            onClick={handleCancel}
            disabled={isDeleting}
            style={{
              background: "#6c757d",
              borderColor: "#6c757d",
              color: "#fff",
              fontWeight: "600",
              padding: "8px 16px",
              fontSize: "13px",
              borderRadius: "6px",
              border: "none",
              cursor: isDeleting ? "not-allowed" : "pointer",
              opacity: isDeleting ? 0.65 : 1,
              transition: "all 0.2s ease",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
            onMouseEnter={(e) => {
              if (!isDeleting) {
                e.currentTarget.style.background = "#5a6268";
                e.currentTarget.style.borderColor = "#5a6268";
              }
            }}
            onMouseLeave={(e) => {
              if (!isDeleting) {
                e.currentTarget.style.background = "#6c757d";
                e.currentTarget.style.borderColor = "#6c757d";
              }
            }}
          >
            Cancel
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            style={{
              background: "#dc3545",
              borderColor: "#dc3545",
              color: "#fff",
              fontWeight: "600",
              padding: "8px 16px",
              fontSize: "13px",
              borderRadius: "6px",
              border: "none",
              cursor: isDeleting ? "not-allowed" : "pointer",
              opacity: isDeleting ? 0.65 : 1,
              transition: "all 0.2s ease",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
            onMouseEnter={(e) => {
              if (!isDeleting) {
                e.currentTarget.style.background = "#bb2d3b";
                e.currentTarget.style.borderColor = "#bb2d3b";
              }
            }}
            onMouseLeave={(e) => {
              if (!isDeleting) {
                e.currentTarget.style.background = "#dc3545";
                e.currentTarget.style.borderColor = "#dc3545";
              }
            }}
          >
            {isDeleting ? (
              <>
                <span
                  style={{
                    width: "12px",
                    height: "12px",
                    border: "2px solid #fff",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 0.6s linear infinite",
                    display: "inline-block",
                  }}
                />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={14} />
                Delete
              </>
            )}
          </button>
        </div>
      </div>

      {/* Spinner animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </>
  );
};

export default FeedbackDeleteConfirmModal;
