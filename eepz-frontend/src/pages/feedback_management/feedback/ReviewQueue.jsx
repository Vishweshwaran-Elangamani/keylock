import React, { useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  CheckCircle,
} from "lucide-react";
import { peerQueueApi } from "../../../services/feedbackmanagement/feedbackApi";

const Badge = ({ text, color = "#525252" }) => (
  <span
    className="badge"
    style={{
      backgroundColor: `${color}20`,
      color,
      padding: "4px 8px",
      fontSize: "0.7rem",
    }}
  >
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
    <div className="container-fluid py-3" style={{ maxWidth: "1200px" }}>
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h2
            className="fw-bold mb-1"
            style={{ color: "var(--color-primary-1)" }}
          >
            {" "}
            Review Queue (HR)
          </h2>
          <p className="mb-0 small" style={{ color: "var(--muted)" }}>
            Approve or reject pending peer feedback
          </p>
        </div>
        <button
          className="btn d-flex align-items-center gap-2"
          onClick={fetchPending}
          disabled={refreshing}
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            color: "var(--color-primary-3)",
            borderRadius: "var(--radius-md)",
            padding: "0.5rem 0.9rem",
            fontWeight: "600",
          }}
        >
          <RefreshCw
            size={18}
            style={{
              animation: refreshing ? "spin 1s linear infinite" : "none",
            }}
          />
          Refresh
        </button>
      </div>

      {error && (
        <div
          className="alert alert-danger d-flex align-items-start gap-2"
          style={{ borderRadius: "var(--radius-md)" }}
        >
          <AlertTriangle size={18} className="mt-1" />
          <div>
            <strong>Error</strong>
            <p className="mb-0 small mt-1">{error}</p>
          </div>
          <button className="btn-close ms-auto" onClick={() => setError("")} />
        </div>
      )}
      {successMsg && (
        <div
          className="alert alert-success d-flex align-items-center gap-2"
          style={{ borderRadius: "var(--radius-md)" }}
        >
          <CheckCircle size={18} />
          <div className="small">{successMsg}</div>
          <button
            className="btn-close ms-auto"
            onClick={() => setSuccessMsg("")}
          />
        </div>
      )}

      <div
        className="card border-0"
        style={{
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow)",
        }}
      >
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h5 className="mb-0">Pending Peer Feedback</h5>
            <span className="badge bg-light text-dark">{pending.length}</span>
          </div>

          {pending.length === 0 ? (
            <p className="text-muted mb-0">
              No pending peer feedback to review
            </p>
          ) : (
            <div className="row g-3">
              {pending.map((item) => (
                <div className="col-md-6 col-lg-4" key={item.queueId}>
                  <div
                    className="card h-100 border-0"
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-lg)",
                    }}
                  >
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="mb-0">
                          {item.submitterName || item.submittedByEmployeeId} →{" "}
                          {item.recipientName || item.recipientEmployeeId}
                        </h6>
                        <Badge
                          text={item.status || "Pending"}
                          color="#0F62FE"
                        />
                      </div>
                      <p className="small mb-2">{item.feedbackContent}</p>
                      {item.isAnonymous && (
                        <small className="text-muted d-block mb-2">
                          {" "}
                          Anonymous
                        </small>
                      )}
                      <small className="text-muted d-block mb-3">
                        Submitted:{" "}
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString()
                          : "—"}
                      </small>
                      <div className="d-grid gap-2">
                        <button
                          className="btn btn-sm btn-outline-success"
                          onClick={() => approve(item)}
                        >
                          <ThumbsUp size={14} className="me-1" />
                          Approve
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => reject(item)}
                        >
                          <ThumbsDown size={14} className="me-1" />
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

      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
