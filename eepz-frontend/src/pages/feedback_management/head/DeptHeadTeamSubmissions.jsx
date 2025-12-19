import React, { useEffect, useState, useMemo } from "react";
import {
  RefreshCw,
  AlertTriangle,
  Eye,
  Filter,
  Clock,
  CheckCircle,
  User,
  ArrowLeft,
  Send,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;

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

export default function DeptHeadTeamSubmissions() {
  const navigate = useNavigate();
  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "{}"),
    []
  );

  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [employeeMap, setEmployeeMap] = useState({});
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  // ============================================================================
  // FETCH EMPLOYEE MAP
  // ============================================================================

  const fetchEmployeeMap = async () => {
    try {
      const res = await axios.get(`${API_BASE}/EmployeeManagement/all`);
      if (res.data?.success && Array.isArray(res.data.data)) {
        const map = {};
        res.data.data.forEach((emp) => {
          map[emp.employeeId] = `${emp.firstName} ${emp.lastName}`;
        });
        setEmployeeMap(map);
      }
    } catch (err) {
      console.error("Error fetching employee map:", err.message);
    }
  };

  // ============================================================================
  // FETCH TEAM SUBMISSIONS
  // ============================================================================

  const fetchSubmissions = async () => {
    setRefreshing(true);
    setLoading(true);
    setError("");

    try {
      // Fetch mentor feedback
      let mentorData = [];
      try {
        const mentorRes = await axios.get(`${API_BASE}/MentorFeedback/all`);
        if (mentorRes.data?.success && Array.isArray(mentorRes.data.data)) {
          mentorData = mentorRes.data.data.map((m) => ({
            ...m,
            type: "Mentor Feedback",
            submittedBy:
              employeeMap[m.mentorEmployeeId] || `Mentor ${m.mentorEmployeeId}`,
            submittedDate: m.createdAt,
          }));
        }
      } catch (err) {
        console.warn("Error fetching mentor feedback:", err.message);
      }

      // Fetch peer feedback
      let peerData = [];
      try {
        const peerRes = await axios.get(`${API_BASE}/PeerFeedbackQueue/all`);
        if (peerRes.data?.success && Array.isArray(peerRes.data.data)) {
          peerData = peerRes.data.data.map((p) => ({
            ...p,
            type: "Peer Feedback",
            submittedBy:
              employeeMap[p.submittedByEmployeeId] ||
              `Employee ${p.submittedByEmployeeId}`,
            submittedDate: p.createdAt,
          }));
        }
      } catch (err) {
        console.warn("Error fetching peer feedback:", err.message);
      }

      // Fetch HR forms
      let hrData = [];
      try {
        const hrRes = await axios.get(
          `${API_BASE}/HrFeedbackForm/responses/all`
        );
        if (hrRes.data?.success && Array.isArray(hrRes.data.data)) {
          hrData = hrRes.data.data.map((h) => ({
            ...h,
            type: "HR Form",
            submittedBy:
              employeeMap[h.employeeId] || `Employee ${h.employeeId}`,
            submittedDate: h.submittedDate || h.createdAt,
          }));
        }
      } catch (err) {
        console.warn("Error fetching HR forms:", err.message);
      }

      // Combine all submissions
      const allSubmissions = [...mentorData, ...peerData, ...hrData];
      setSubmissions(allSubmissions);
      setFilteredSubmissions(allSubmissions);
    } catch (err) {
      setError("Failed to load team submissions");
      console.error("Error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    fetchEmployeeMap();
  }, []);

  useEffect(() => {
    if (Object.keys(employeeMap).length > 0) {
      fetchSubmissions();
    }
  }, [employeeMap]);

  // ============================================================================
  // FILTER LOGIC
  // ============================================================================

  useEffect(() => {
    let filtered = submissions;

    if (filterType !== "All") {
      filtered = filtered.filter((s) => s.type === filterType);
    }

    if (filterStatus !== "All") {
      filtered = filtered.filter((s) => s.status === filterStatus);
    }

    setFilteredSubmissions(filtered);
  }, [filterType, filterStatus, submissions]);

  // ============================================================================
  // STATS
  // ============================================================================

  const stats = useMemo(
    () => ({
      total: submissions.length,
      mentor: submissions.filter((s) => s.type === "Mentor Feedback").length,
      peer: submissions.filter((s) => s.type === "Peer Feedback").length,
      hr: submissions.filter((s) => s.type === "HR Form").length,
    }),
    [submissions]
  );

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "60vh" }}
      >
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  return (
    <div className="container-fluid py-3" style={{ maxWidth: "1400px" }}>
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div className="d-flex gap-2 align-items-start">
          <button
            className="btn btn-outline-secondary"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2
              className="fw-bold mb-1"
              style={{ color: "var(--color-primary-1)" }}
            >
              Team Submissions
            </h2>
            <p className="mb-0 small text-muted">
              View all feedback submissions from team
            </p>
          </div>
        </div>
        <button
          className="btn d-flex align-items-center gap-2"
          onClick={fetchSubmissions}
          disabled={refreshing}
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            color: "var(--color-primary-3)",
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

      {/* ERROR ALERT */}
      {error && (
        <div className="alert alert-danger d-flex align-items-start gap-2 mb-3">
          <AlertTriangle size={18} className="mt-1" />
          <div>
            <strong>Error</strong>
            <p className="mb-0 small mt-1">{error}</p>
          </div>
          <button className="btn-close ms-auto" onClick={() => setError("")} />
        </div>
      )}

      {/* STATS */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div
            className="card border-0"
            style={{ border: "1px solid var(--border)" }}
          >
            <div className="card-body">
              <h4 className="fw-bold text-primary">{stats.total}</h4>
              <small className="text-muted">Total Submissions</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div
            className="card border-0"
            style={{ border: "1px solid var(--border)" }}
          >
            <div className="card-body">
              <h4 className="fw-bold" style={{ color: "#0F62FE" }}>
                {stats.mentor}
              </h4>
              <small className="text-muted">Mentor Feedback</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div
            className="card border-0"
            style={{ border: "1px solid var(--border)" }}
          >
            <div className="card-body">
              <h4 className="fw-bold" style={{ color: "#24A148" }}>
                {stats.peer}
              </h4>
              <small className="text-muted">Peer Feedback</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div
            className="card border-0"
            style={{ border: "1px solid var(--border)" }}
          >
            <div className="card-body">
              <h4 className="fw-bold" style={{ color: "#E2B93B" }}>
                {stats.hr}
              </h4>
              <small className="text-muted">HR Forms</small>
            </div>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div
        className="card border-0 mb-3"
        style={{ border: "1px solid var(--border)" }}
      >
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-bold small">
                Filter by Type:
              </label>
              <select
                className="form-select form-select-sm"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="All">All Types</option>
                <option value="Mentor Feedback">Mentor Feedback</option>
                <option value="Peer Feedback">Peer Feedback</option>
                <option value="HR Form">HR Forms</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold small">
                Filter by Status:
              </label>
              <select
                className="form-select form-select-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Submitted">Submitted</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* SUBMISSIONS TABLE */}
      <div
        className="card border-0"
        style={{ border: "1px solid var(--border)" }}
      >
        <div className="card-body">
          {filteredSubmissions.length === 0 ? (
            <p className="text-muted mb-0">No submissions found</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border)" }}>
                    <th style={{ color: "var(--color-primary-1)" }}>
                      Submitted By
                    </th>
                    <th style={{ color: "var(--color-primary-1)" }}>Type</th>
                    <th style={{ color: "var(--color-primary-1)" }}>Status</th>
                    <th style={{ color: "var(--color-primary-1)" }}>Date</th>
                    <th style={{ color: "var(--color-primary-1)" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.map((submission, idx) => {
                    const statusColor =
                      submission.status === "Approved"
                        ? "#24A148"
                        : submission.status === "Pending"
                        ? "#E2B93B"
                        : "#0F62FE";
                    const typeColor =
                      submission.type === "Mentor Feedback"
                        ? "#0F62FE"
                        : submission.type === "Peer Feedback"
                        ? "#24A148"
                        : "#E2B93B";

                    return (
                      <tr key={`${submission.type}-${idx}`}>
                        <td className="small fw-bold">
                          {submission.submittedBy}
                        </td>
                        <td>
                          <Badge text={submission.type} color={typeColor} />
                        </td>
                        <td>
                          <Badge
                            text={submission.status || "Submitted"}
                            color={statusColor}
                          />
                        </td>
                        <td className="small text-muted">
                          {new Date(
                            submission.submittedDate
                          ).toLocaleDateString()}
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-secondary"
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
