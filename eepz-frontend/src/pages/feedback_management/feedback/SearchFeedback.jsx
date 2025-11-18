import React, { useEffect, useState } from "react";
import { Search, RefreshCw, AlertTriangle } from "lucide-react";
import {
  managerReviewApi,
  mentorFeedbackApi,
  peerQueueApi,
  orgGoalFeedbackApi,
} from "../../../services/feedbackmanagement/feedbackApi";

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

export default function SearchFeedback() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All"); // All | Manager | Mentor | Peer | OrgGoal
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [allData, setAllData] = useState({
    manager: [],
    mentor: [],
    peer: [],
    orgGoal: [],
  });

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [mgr, ment, pr, og] = await Promise.all([
        managerReviewApi.list(1, 100),
        mentorFeedbackApi.list(1, 100),
        peerQueueApi.list(1, 100),
        orgGoalFeedbackApi.list(1, 100),
      ]);
      setAllData({
        manager: mgr.data?.data || [],
        mentor: ment.data?.data || [],
        peer: pr.data?.data || [],
        orgGoal: og.data?.data || [],
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to fetch feedback"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleSearch = () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const q = query.toLowerCase();
    let filtered = [];

    if (type === "All" || type === "Manager") {
      filtered = filtered.concat(
        allData.manager
          .filter(
            (m) =>
              (m.reviewComment || "").toLowerCase().includes(q) ||
              (m.targetEmployeeName || "").toLowerCase().includes(q)
          )
          .map((m) => ({ ...m, _type: "Manager Review" }))
      );
    }
    if (type === "All" || type === "Mentor") {
      filtered = filtered.concat(
        allData.mentor
          .filter(
            (m) =>
              (m.feedbackComments || "").toLowerCase().includes(q) ||
              (m.mentorName || "").toLowerCase().includes(q)
          )
          .map((m) => ({ ...m, _type: "Mentor Feedback" }))
      );
    }
    if (type === "All" || type === "Peer") {
      filtered = filtered.concat(
        allData.peer
          .filter(
            (p) =>
              (p.feedbackContent || "").toLowerCase().includes(q) ||
              (p.recipientName || "").toLowerCase().includes(q)
          )
          .map((p) => ({ ...p, _type: "Peer Feedback" }))
      );
    }
    if (type === "All" || type === "OrgGoal") {
      filtered = filtered.concat(
        allData.orgGoal
          .filter(
            (o) =>
              (o.feedbackComments || "").toLowerCase().includes(q) ||
              (o.organizationGoalName || "").toLowerCase().includes(q)
          )
          .map((o) => ({ ...o, _type: "Org Goal Feedback" }))
      );
    }
    setResults(filtered);
  };

  const TypeBtn = ({ label, active }) => (
    <button
      type="button"
      className={`btn btn-sm ${active ? "btn-primary" : "btn-outline-primary"}`}
      onClick={() => setType(label)}
      style={{ borderRadius: "var(--radius-sm)" }}
    >
      {label}
    </button>
  );

  return (
    <div className="container-fluid py-3" style={{ maxWidth: "1000px" }}>
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h2
            className="fw-bold mb-1"
            style={{ color: "var(--color-primary-1)" }}
          >
            {" "}
            Search Feedback
          </h2>
          <p className="mb-0 small" style={{ color: "var(--muted)" }}>
            Search across all feedback types
          </p>
        </div>
        <button
          className="btn d-flex align-items-center gap-2"
          onClick={fetchAll}
          disabled={loading}
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
            style={{ animation: loading ? "spin 1s linear infinite" : "none" }}
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

      <div
        className="card border-0 mb-3"
        style={{
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow)",
        }}
      >
        <div className="card-body">
          <div className="d-flex gap-2 mb-3 flex-wrap">
            {["All", "Manager", "Mentor", "Peer", "OrgGoal"].map((t) => (
              <TypeBtn key={t} label={t} active={type === t} />
            ))}
          </div>
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Search feedback by keyword…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button className="btn btn-primary" onClick={handleSearch}>
              <Search size={18} />
            </button>
          </div>
        </div>
      </div>

      <div
        className="card border-0"
        style={{
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow)",
        }}
      >
        <div className="card-body">
          <h5 className="mb-3">Results ({results.length})</h5>
          {results.length === 0 ? (
            <p className="text-muted mb-0">
              No results found. Try searching with different keywords.
            </p>
          ) : (
            <div className="row g-3">
              {results.map((item, idx) => (
                <div className="col-md-6 col-lg-4" key={idx}>
                  <div
                    className="card h-100 border-0"
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-lg)",
                    }}
                  >
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <Badge text={item._type} color="#0F62FE" />
                        {item.status && (
                          <Badge text={item.status} color="#24A148" />
                        )}
                      </div>
                      <p className="small mb-2">
                        {item.reviewComment ||
                          item.feedbackComments ||
                          item.feedbackContent ||
                          "No content"}
                      </p>
                      <small className="text-muted d-block">
                        {item.targetEmployeeName ||
                          item.mentorName ||
                          item.recipientName ||
                          item.organizationGoalName ||
                          "Unknown"}
                      </small>
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
