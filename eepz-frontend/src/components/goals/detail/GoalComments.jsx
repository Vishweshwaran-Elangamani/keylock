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
import styles from "../../../styles/goals/components/GoalComments.module.css";

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
  const isManagerOrDeptHead =
    user.role === "Manager" || user.role === "Department Head";
  const isCreator = goal?.createdByEmployeeMasterId === user.empMasterId;
  const isAssignee = goal?.assignees?.some(
    (a) => a.employeeMasterId === user.empMasterId
  );
  const isTeamGoal = goal?.goalType === "team";
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

  const isCompleted = ["completed", "closed", "cancelled"].includes(
    goalStatus?.toLowerCase()
  );

  const filteredComments = comments.filter((comment) => {
    if (filter === "mine") return comment.commentedByName === user.name;
    if (filter === "others") return comment.commentedByName !== user.name;
    return true;
  });

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

      {effectiveCanComment && !isCompleted && (
        <div className={`card mb-4 ${styles.inputCard}`}>
          <div className={styles.inputCardBody}>
            <h6 className={styles.inputHeader}>
              <i className="bi bi-chat-dots me-2"></i>
              Add Comment
              {isDeptHeadMonitoring && (
                <span
                  className={`badge bg-info ms-2 ${styles.monitoringBadge}`}
                >
                  <i className="bi bi-eye me-1"></i>
                  Monitoring
                </span>
              )}
            </h6>
            <form onSubmit={handleSubmitClick}>
              <textarea
                className={`form-control mb-4 ${styles.commentTextarea}`}
                rows="4"
                placeholder="Share your thoughts, updates, or questions... (Ctrl+Enter to post)"
                value={newComment}
                onChange={handleCommentChange}
                onKeyDown={handleKeyDown}
                disabled={submitting}
              />
              <div className="d-flex justify-content-between align-items-center">
                <small
                  className={`${
                    characterCount > MAX_CHARS * 0.9
                      ? "text-danger"
                      : "text-muted"
                  } ${styles.characterCount}`}
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
                  style={{
                    background:
                      "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
                  }}
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

      <div className={`card ${styles.commentsCard}`}>
        <div
          className={`goal-card-header d-flex justify-content-between align-items-center flex-wrap gap-2 ${styles.commentsHeader}`}
        >
          <h6 className={`mb-0 ${styles.commentsTitle}`}>
            <i className="bi bi-chat-left-text me-2"></i>
            Comments
            <span className={`badge bg-secondary ms-2 ${styles.commentsCount}`}>
              {sortedComments.length}
            </span>
            {isCompleted && (
              <span
                className={`badge bg-secondary text-white ms-2 ${styles.viewOnlyBadge}`}
              >
                <i className="bi bi-eye me-1"></i>
                View Only
              </span>
            )}
          </h6>

          <div className="d-flex gap-2 align-items-center flex-wrap">
            <div className="btn-group btn-group-sm" role="group">
              <button
                type="button"
                className={`btn ${
                  filter === "all" ? "btn-primary" : "btn-outline-secondary"
                } ${styles.filterBtn}`}
                onClick={() => setFilter("all")}
              >
                <i className="bi bi-people me-1"></i>
                All
              </button>
              <button
                type="button"
                className={`btn ${
                  filter === "mine" ? "btn-primary" : "btn-outline-secondary"
                } ${styles.filterBtn}`}
                onClick={() => setFilter("mine")}
              >
                <i className="bi bi-person me-1"></i>
                Mine
              </button>
              <button
                type="button"
                className={`btn ${
                  filter === "others" ? "btn-primary" : "btn-outline-secondary"
                } ${styles.filterBtn}`}
                onClick={() => setFilter("others")}
              >
                <i className="bi bi-person-dash me-1"></i>
                Others
              </button>
            </div>

            <button
              className={`btn btn-sm btn-primary ${styles.sortBtn}`}
              onClick={() =>
                setSortOrder(sortOrder === "desc" ? "asc" : "desc")
              }
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

        <div className={`card-body ${styles.commentsListBody}`}>
          {loading ? (
            <div className={styles.loadingState}>
              <LoadingSpinner text="Loading comments..." />
            </div>
          ) : sortedComments.length === 0 ? (
            <div className={styles.emptyState}>
              <i className={`bi bi-chat-quote ${styles.emptyIcon}`}></i>
              <p className={`mt-3 mb-1 ${styles.emptyTitle}`}>
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
                    className={`list-group-item ${styles.commentItem} ${
                      isOwn ? styles.ownComment : ""
                    }`}
                  >
                    <div className="d-flex gap-3">
                      <div
                        className={`${styles.avatar} ${
                          isOwn ? styles.ownAvatar : ""
                        }`}
                      >
                        {getInitials(comment.commentedByName)}
                      </div>

                      <div className={styles.commentContent}>
                        <div
                          className={`d-flex justify-content-between align-items-start mb-2 flex-wrap gap-2 ${styles.commentHeader}`}
                        >
                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            <span className={styles.commentAuthor}>
                              {comment.commentedByName}
                            </span>
                            {isOwn && (
                              <span
                                className={`badge bg-primary ${styles.youBadge}`}
                              >
                                <i className="bi bi-person-check me-1"></i>
                                You
                              </span>
                            )}
                            {isCreatorComment && (
                              <span
                                className={`badge bg-success ${styles.creatorBadge}`}
                              >
                                <i className="bi bi-star-fill me-1"></i>
                                Creator
                              </span>
                            )}
                          </div>
                        </div>

                        <p className={styles.commentText}>{comment.comment}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

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
