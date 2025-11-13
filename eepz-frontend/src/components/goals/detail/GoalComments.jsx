import { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/auth/AuthContext";
import goalService from "../../../services/goals/goalService";
import Alert from "../common/Alert";
import LoadingSpinner from "../common/LoadingSpinner";
import ConfirmationModal from "../modals/ConfirmationModal";
import {
  formatDate,
  getInitials,
  getRelativeTime,
} from "../../../utils/goals/goalHelpers";

// Added goal prop
const GoalComments = ({
  goalId,
  goal,
  canComment = false,
  goalStatus = "",
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);

  const MAX_CHARS = 1000;

  // Check if DeptHead can comment on team goals
  const isManagerOrDeptHead =
    user.role === "Manager" || user.role === "Department Head";
  const isCreator = goal?.createdByEmployeeMasterId === user.empMasterId;
  const isAssignee = goal?.assignees?.some(
    (a) => a.employeeMasterId === user.empMasterId
  );
  const isTeamGoal = goal?.goalType === "team";

  // DeptHead can comment even if not creator/assignee
  const isDeptHeadMonitoring =
    isManagerOrDeptHead && isTeamGoal && !isCreator && !isAssignee;
  const effectiveCanComment = canComment || isDeptHeadMonitoring;

  useEffect(() => {
    loadComments();
  }, [goalId]);

  const loadComments = async () => {
    setLoading(true);
    setAlert(null);
    try {
      const response = await goalService.listComments(goalId);
      setComments(response.data || []);
    } catch (error) {
      setAlert({
        type: "danger",
        message: error.response?.data?.message || "Failed to load comments",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCommentChange = (e) => {
    const value = e.target.value;
    if (value.length <= MAX_CHARS) {
      setNewComment(value);
      setCharacterCount(value.length);
    }
  };

  const handleSubmitClick = (e) => {
    e.preventDefault();

    if (!newComment.trim()) {
      setAlert({ type: "warning", message: "Please enter a comment" });
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    setAlert(null);

    try {
      await goalService.addComment(goalId, newComment.trim());
      setNewComment("");
      setCharacterCount(0);
      setAlert({ type: "success", message: "Comment posted successfully" });
      await loadComments();
    } catch (error) {
      setAlert({
        type: "danger",
        message: error.response?.data?.message || "Failed to add comment",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === "Enter") {
      handleSubmitClick(e);
    }
  };

  // Check if goal is completed
  const isCompleted = ["completed", "closed", "cancelled"].includes(
    goalStatus?.toLowerCase()
  );

  // Filter comments
  const filteredComments = comments.filter((comment) => {
    if (filter === "mine") return comment.commentedByName === user.name;
    if (filter === "others") return comment.commentedByName !== user.name;
    return true;
  });

  // Sort comments
  const sortedComments = [...filteredComments].sort((a, b) => {
    const dateA = new Date(a.commentedOn);
    const dateB = new Date(b.commentedOn);
    return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
  });

  return (
    <div>
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Comment Input - Show if user has permission AND goal not completed */}
      {effectiveCanComment && !isCompleted && (
        <div
          className="card mb-4"
          style={{ border: "1px solid #dee2e6", borderRadius: "12px" }}
        >
          <div className="card-body" style={{ padding: "1.25rem" }}>
            <h6
              style={{
                fontWeight: 600,
                marginBottom: "1rem",
                color: "#212529",
              }}
            >
              <i
                className="bi bi-chat-dots me-2"
                style={{ color: "#0d6efd" }}
              ></i>
              Add Comment
              {isDeptHeadMonitoring && (
                <span
                  className="badge bg-info ms-2"
                  style={{ fontSize: "0.7rem" }}
                >
                  <i className="bi bi-eye me-1"></i>
                  Monitoring
                </span>
              )}
            </h6>
            <form onSubmit={handleSubmitClick}>
              <textarea
                className="form-control mb-2"
                rows="4"
                placeholder="Share your thoughts, updates, or questions... (Ctrl+Enter to post)"
                value={newComment}
                onChange={handleCommentChange}
                onKeyDown={handleKeyDown}
                disabled={submitting}
                style={{
                  resize: "vertical",
                  fontSize: "0.95rem",
                  lineHeight: "1.6",
                }}
              />
              <div className="d-flex justify-content-between align-items-center">
                <small
                  className={
                    characterCount > MAX_CHARS * 0.9
                      ? "text-danger"
                      : "text-muted"
                  }
                  style={{ fontSize: "0.8rem" }}
                >
                  <i className="bi bi-keyboard me-1"></i>
                  {characterCount}/{MAX_CHARS} characters
                  {characterCount > MAX_CHARS * 0.9 && (
                    <span className="ms-2">
                      <i className="bi bi-exclamation-triangle"></i> Approaching
                      limit
                    </span>
                  )}
                </small>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || !newComment.trim()}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Posting...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-send-fill me-2"></i>
                      Post Comment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div
        className="card"
        style={{ border: "1px solid #dee2e6", borderRadius: "12px" }}
      >
        <div
          className="goal-card-header d-flex justify-content-between align-items-center flex-wrap gap-2"
          style={{ backgroundColor: "#f8f9fa", padding: "1rem 1.25rem" }}
        >
          <h6 className="mb-0" style={{ fontWeight: 600 }}>
            <i
              className="bi bi-chat-left-text me-2"
              style={{ color: "#0d6efd" }}
            ></i>
            Comments
            <span
              className="badge bg-secondary ms-2"
              style={{ fontSize: "0.75rem" }}
            >
              {sortedComments.length}
            </span>
            {isCompleted && (
              <span
                className="badge bg-secondary text-white ms-2"
                style={{ fontSize: "0.7rem" }}
              >
                <i className="bi bi-eye me-1"></i>
                View Only
              </span>
            )}
          </h6>

          <div className="d-flex gap-2 align-items-center flex-wrap">
            {/* Filter Buttons */}
            <div className="btn-group btn-group-sm" role="group">
              <button
                type="button"
                className={`btn ${
                  filter === "all" ? "btn-primary" : "btn-outline-secondary"
                }`}
                onClick={() => setFilter("all")}
                style={{ fontSize: "0.8rem", padding: "0.25rem 0.75rem" }}
              >
                <i className="bi bi-people me-1"></i>
                All
              </button>
              <button
                type="button"
                className={`btn ${
                  filter === "mine" ? "btn-primary" : "btn-outline-secondary"
                }`}
                onClick={() => setFilter("mine")}
                style={{ fontSize: "0.8rem", padding: "0.25rem 0.75rem" }}
              >
                <i className="bi bi-person me-1"></i>
                Mine
              </button>
              <button
                type="button"
                className={`btn ${
                  filter === "others" ? "btn-primary" : "btn-outline-secondary"
                }`}
                onClick={() => setFilter("others")}
                style={{ fontSize: "0.8rem", padding: "0.25rem 0.75rem" }}
              >
                <i className="bi bi-person-dash me-1"></i>
                Others
              </button>
            </div>

            {/* Sort Toggle */}
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() =>
                setSortOrder(sortOrder === "desc" ? "asc" : "desc")
              }
              style={{ fontSize: "0.8rem" }}
              title={sortOrder === "desc" ? "Newest First" : "Oldest First"}
            >
              <i
                className={`bi bi-sort-${
                  sortOrder === "desc" ? "down" : "up"
                } me-1`}
              ></i>
            </button>
          </div>
        </div>

        {/* Comments List Body */}
        <div
          className="card-body"
          style={{ padding: 0, maxHeight: "600px", overflowY: "auto" }}
        >
          {loading ? (
            <div style={{ padding: "3rem" }}>
              <LoadingSpinner text="Loading comments..." />
            </div>
          ) : sortedComments.length === 0 ? (
            <div
              style={{ padding: "3rem", textAlign: "center", color: "#6c757d" }}
            >
              <i
                className="bi bi-chat-quote"
                style={{ fontSize: "4rem", opacity: 0.2 }}
              ></i>
              <p className="mt-3 mb-1" style={{ fontWeight: 500 }}>
                {filter === "all"
                  ? "No comments yet"
                  : filter === "mine"
                  ? "You haven't commented yet"
                  : "No comments from others"}
              </p>
              <p className="text-muted small mb-0">
                {effectiveCanComment && filter === "all" && !isCompleted
                  ? "Be the first to share your thoughts!"
                  : ""}
              </p>
            </div>
          ) : (
            <div className="list-group list-group-flush">
              {sortedComments.map((comment, index) => {
                const isOwn = comment.commentedByName === user.name;
                const isCreatorComment = comment.isCreator || false;

                return (
                  <div
                    key={comment.commentId || index}
                    className="list-group-item"
                    style={{
                      padding: "1.25rem",
                      backgroundColor: isOwn ? "#f0f7ff" : "#fff",
                      borderLeft: isOwn ? "4px solid #0d6efd" : "none",
                      transition: "background-color 0.2s ease",
                    }}
                  >
                    <div className="d-flex gap-3">
                      {/* Avatar */}
                      <div
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "50%",
                          background: isOwn
                            ? "linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)"
                            : "linear-gradient(135deg, #AC5098 0%, #97247E 100%)",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: "0.9rem",
                          flexShrink: 0,
                          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.15)",
                        }}
                      >
                        {getInitials(comment.commentedByName)}
                      </div>

                      {/* Comment Content */}
                      <div style={{ flex: 1 }}>
                        {/* Header */}
                        <div className="d-flex justify-content-between align-items-start mb-2 flex-wrap gap-2">
                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            <span
                              style={{
                                fontWeight: 600,
                                color: "#212529",
                                fontSize: "0.95rem",
                              }}
                            >
                              {comment.commentedByName}
                            </span>
                            {isOwn && (
                              <span
                                className="badge bg-primary"
                                style={{
                                  fontSize: "0.65rem",
                                  padding: "0.25rem 0.5rem",
                                }}
                              >
                                <i className="bi bi-person-check me-1"></i>
                                You
                              </span>
                            )}
                            {isCreatorComment && (
                              <span
                                className="badge bg-success"
                                style={{
                                  fontSize: "0.65rem",
                                  padding: "0.25rem 0.5rem",
                                }}
                              >
                                <i className="bi bi-star-fill me-1"></i>
                                Creator
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Comment Text */}
                        <p
                          style={{
                            marginBottom: 0,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                            color: "#495057",
                            lineHeight: 1.6,
                            fontSize: "0.95rem",
                          }}
                        >
                          {comment.comment}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSubmit}
        title="Post Comment?"
        message="Are you sure you want to post this comment? It will be visible to all goal participants."
        confirmText="Post Comment"
        cancelText="Cancel"
        confirmVariant="primary"
      />
    </div>
  );
};

export default GoalComments;
