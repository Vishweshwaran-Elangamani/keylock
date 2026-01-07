import React, { useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  CheckCircle,
} from "lucide-react";
import { peerQueueApi } from "../../../services/feedbackmanagement/feedbackApi";
import "../../../styles/feedback/components/ReviewQueue.css";

const Badge = ({ text, color = "#525252" }) => (
  <span className="rq-badge" style={{ backgroundColor: `${color}20`, color }}>
    {text}
  </span>
);

export default function ReviewQueue() {
  const user = useMemo(
    () =>
      JSON.parse(localStorage.getItem("user") || "{}") || {
        empId: 1001,
        name: "Alice HR",
      },
    []
  );
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchPending = async () => {
    setRefreshing(true);
    setLoading(true);
    setError("");
    try {
      const res = await peerQueueApi.pending();
      setPending(res.data?.data || []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to fetch pending queue"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const approve = async (item) => {
    setError("");
    setSuccessMsg("");
    try {
      await peerQueueApi.approve(item.queueId, {
        isProfessional: true,
        isRelevant: true,
        approvedByHRId: user?.empId || 1001,
      });
      setSuccessMsg(
        `Approved feedback from ${
          item.submitterName || item.submittedByEmployeeId
        }`
      );
      fetchPending();
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "Failed to approve"
      );
    }
  };

  const reject = async (item) => {
    if (!window.confirm("Reject this peer feedback?")) return;
    setError("");
    setSuccessMsg("");
    try {
      await peerQueueApi.reject(item.queueId, {
        rejectedByHRId: user?.empId || 1001,
      });
      setSuccessMsg(
        `Rejected feedback from ${
          item.submitterName || item.submittedByEmployeeId
        }`
      );
      fetchPending();
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "Failed to reject"
      );
    }
  };

  return (
    <div className="rq-container">
      <div className="rq-header">
        <div className="rq-header-content">
          <h2 className="rq-title">Review Queue (HR)</h2>
          <p className="rq-subtitle">Approve or reject pending peer feedback</p>
        </div>
        <button
          className="rq-refresh-btn"
          onClick={fetchPending}
          disabled={refreshing}
        >
          <RefreshCw size={18} className={refreshing ? "rq-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rq-alert rq-alert-error">
          <AlertTriangle size={18} className="rq-alert-icon" />
          <div className="rq-alert-content">
            <strong>Error</strong>
            <p className="rq-alert-message">{error}</p>
          </div>
          <button className="rq-alert-close" onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}

      {successMsg && (
        <div className="rq-alert rq-alert-success">
          <CheckCircle size={18} className="rq-alert-icon" />
          <div className="rq-alert-message">{successMsg}</div>
          <button className="rq-alert-close" onClick={() => setSuccessMsg("")}>
            ×
          </button>
        </div>
      )}

      <div className="rq-main-card">
        <div className="rq-main-card-body">
          <div className="rq-main-card-header">
            <h5 className="rq-main-card-title">Pending Peer Feedback</h5>
            <span className="rq-count-badge">{pending.length}</span>
          </div>

          {pending.length === 0 ? (
            <p className="rq-empty-message">
              No pending peer feedback to review
            </p>
          ) : (
            <div className="rq-grid">
              {pending.map((item) => (
                <div className="rq-grid-item" key={item.queueId}>
                  <div className="rq-card">
                    <div className="rq-card-body">
                      <div className="rq-card-header-row">
                        <h6 className="rq-card-title">
                          {item.submitterName || item.submittedByEmployeeId} →{" "}
                          {item.recipientName || item.recipientEmployeeId}
                        </h6>
                        <Badge
                          text={item.status || "Pending"}
                          color="#0F62FE"
                        />
                      </div>
                      <p className="rq-card-content">{item.feedbackContent}</p>
                      {item.isAnonymous && (
                        <small className="rq-card-meta rq-anonymous">
                          Anonymous
                        </small>
                      )}
                      <small className="rq-card-meta rq-card-date">
                        Submitted:{" "}
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString()
                          : "—"}
                      </small>
                      <div className="rq-card-actions">
                        <button
                          className="rq-btn rq-btn-approve"
                          onClick={() => approve(item)}
                        >
                          <ThumbsUp size={14} />
                          Approve
                        </button>
                        <button
                          className="rq-btn rq-btn-reject"
                          onClick={() => reject(item)}
                        >
                          <ThumbsDown size={14} />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
