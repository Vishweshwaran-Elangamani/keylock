import { useState } from "react";
import goalService from "../../../services/goals/goalService";
import Alert from "../common/Alert";

const QuickCommentModal = ({
  isOpen,
  onClose,
  goalId,
  goalTitle,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [comment, setComment] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (!comment.trim()) {
      setAlert({ type: "warning", message: "Please enter a comment" });
      return;
    }

    setLoading(true);

    try {
      await goalService.addComment(goalId, comment);
      setAlert({ type: "success", message: "Comment added successfully!" });

      setTimeout(() => {
        if (onSuccess) onSuccess();
        handleClose();
      }, 1500);
    } catch (error) {
      setAlert({
        type: "danger",
        message: error.response?.data?.message || "Failed to add comment",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setComment("");
      setAlert(null);
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === "Enter") {
      handleSubmit(e);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { 
              opacity: 0;
              transform: translateY(20px);
            }
            to { 
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>

      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 1050,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          animation: "fadeIn 0.2s ease-in-out",
        }}
        onClick={handleClose}
      >
        {/* Modal */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "1rem",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
            width: "100%",
            maxWidth: "550px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div
            style={{
              padding: "1.25rem 1.5rem",
              borderRadius: "1rem 1rem 0rem 0rem",
              backgroundColor: "rgb(39, 35, 92)",
              borderBottom: "1px solid #dee2e6",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h5 style={{ margin: 0, fontWeight: 600, color: "white" }}>
              <i className="bi bi-chat-dots me-2"></i>
              Add Comment
            </h5>
            <button
              type="button"
              class="btn-close-white"
              onClick={onClose}
              disabled={loading}
              style={{
                border: "none",
                width: "36px",
                backgroundColor: "transparent",
                height: "36px",
                borderRadius: "0.5rem",
                cursor: loading ? "not-allowed" : "pointer",
                color: "white",
                fontSize: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.color = "red";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.color = "white";
                }
              }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* Modal Body */}
          <div style={{ padding: "1.5rem" }}>
            {alert && (
              <Alert
                type={alert.type}
                message={alert.message}
                onClose={() => setAlert(null)}
              />
            )}

            <form onSubmit={handleSubmit}>
              {/* Comment Textarea */}
              <div className="mb-3">
                <label
                  className="form-label"
                  style={{ fontWeight: 600, fontSize: "16px" }}
                >
                  Your Comment <span style={{ color: "#dc3545" }}>*</span>
                </label>
                <textarea
                  className="form-control"
                  rows="4"
                  placeholder="Write your comment here..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  autoFocus
                  style={{ resize: "vertical", fontSize: "16px" }}
                />
                <small className="text-muted mt-1 d-block">
                  <i className="bi bi-lightbulb me-1"></i>
                  Press Ctrl+Enter to submit quickly
                </small>
              </div>
            </form>
          </div>

          {/* Modal Footer */}
          <div
            style={{
              padding: "1rem 1.5rem",
              borderTop: "1px solid #dee2e6",
              display: "flex",
              gap: "0.5rem",
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                background: "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
              }}
              onClick={handleSubmit}
              disabled={loading || !comment.trim()}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Posting...
                </>
              ) : (
                <>
                  <i className="bi bi-send me-2"></i>
                  Post Comment
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default QuickCommentModal;
