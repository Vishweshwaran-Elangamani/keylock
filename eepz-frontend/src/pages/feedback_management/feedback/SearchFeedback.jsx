import React, { useEffect, useState } from "react";
import { Search, RefreshCw, AlertTriangle } from "lucide-react";
import {
  managerReviewApi,
  mentorFeedbackApi,
  peerQueueApi,
  orgGoalFeedbackApi,
} from "../../../services/feedbackmanagement/feedbackApi";
import "../../../styles/feedback/components/SearchFeedback.css";

const Badge = ({ text, color = "#525252" }) => (
  <span className="sf-badge" style={{ backgroundColor: `${color}20`, color }}>
    {text}
  </span>
);

export default function SearchFeedback() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All");
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
      className={`sf-type-btn ${active ? "sf-type-btn--active" : ""}`}
      onClick={() => setType(label)}
    >
      {label}
    </button>
  );

  return (
    <div className="sf-container">
      <div className="sf-header">
        <div className="sf-header-content">
          <h2 className="sf-title">Search Feedback</h2>
          <p className="sf-subtitle">Search across all feedback types</p>
        </div>
        <button className="sf-refresh-btn" onClick={fetchAll} disabled={loading} >
          <RefreshCw size={18} className={loading ? "sf-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="sf-alert sf-alert-error">
          <AlertTriangle size={18} className="sf-alert-icon" />
          <div className="sf-alert-content">
            <strong>Error</strong>
            <p className="sf-alert-message">{error}</p>
          </div>
          <button className="sf-alert-close" onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}

      <div className="sf-search-card">
        <div className="sf-search-card-body">
          <div className="sf-type-buttons">
            {["All", "Manager", "Mentor", "Peer", "OrgGoal"].map((t) => (
              <TypeBtn key={t} label={t} active={type === t} />
            ))}
          </div>
          <div className="sf-search-input-wrapper">
            <input type="text" className="sf-search-input" placeholder="Search feedback by keyword…"
            value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()}/>
            <button className="sf-search-button" onClick={handleSearch}>
              <Search size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="sf-results-card">
        <div className="sf-results-card-body">
          <h5 className="sf-results-title">Results ({results.length})</h5>
          {results.length === 0 ? (
            <p className="sf-empty-message">
              No results found. Try searching with different keywords.
            </p>
          ) : (
            <div className="sf-results-grid">
              {results.map((item, idx) => (
                <div className="sf-results-grid-item" key={idx}>
                  <div className="sf-result-card">
                    <div className="sf-result-card-body">
                      <div className="sf-result-card-header">
                        <Badge text={item._type} color="#0F62FE" />
                        {item.status && (
                          <Badge text={item.status} color="#24A148" />
                        )}
                      </div>
                      <p className="sf-result-content">
                        {item.reviewComment || item.feedbackComments || item.feedbackContent || "No content"}
                      </p>
                      <small className="sf-result-meta">
                        {item.targetEmployeeName ||item.mentorName ||item.recipientName ||item.organizationGoalName || "Unknown"}
                      </small>
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
