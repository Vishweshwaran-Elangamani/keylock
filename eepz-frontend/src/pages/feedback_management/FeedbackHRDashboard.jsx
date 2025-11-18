import React, { useEffect, useState, useMemo } from "react";
import {
  RefreshCw,
  AlertTriangle,
  FileText,
  Eye,
  Search,
  TrendingUp,
  Plus,
  Send,
  Star,
  Users,
  ArrowRight,
  Target,
  Zap,
  User,
  Clock,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { peerQueueApi } from "../../services/feedbackmanagement/feedbackApi";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;

const StatCard = ({ label, value, Icon, color }) => (
  <div
    style={{
      background: "white",
      border: "1px solid  #97247E",
      borderRadius: "10px",
      padding: "1.25rem",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      textAlign: "center",
    }}
  >
    <div className="d-flex justify-content-center mb-2">
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "10px",
          background: `${color}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={24} style={{ color }} />
      </div>
    </div>
    <h3 className="fw-bold mb-1" style={{ color, fontSize: "1.75rem" }}>
      {value}
    </h3>
    <p className="mb-0" style={{ fontSize: "0.813rem", color: "#6c757d" }}>
      {label}
    </p>
  </div>
);

export default function FeedbackHRDashboard() {
  const navigate = useNavigate();
  const user = useMemo(
    () =>
      JSON.parse(localStorage.getItem("user") || "{}") || {
        empId: 1001,
        firstName: "Alice",
        lastName: "HR",
      },
    []
  );

  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // HR-specific data
  const [feedback, setFeedback] = useState([]);
  const [employeeMap, setEmployeeMap] = useState({});

  // Employee-like data (HR as employee)
  const [myPeerFeedback, setMyPeerFeedback] = useState([]);
  const [submittedForms, setSubmittedForms] = useState([]);
  const [activeHrForms, setActiveHrForms] = useState([]);
  const [myReviews, setMyReviews] = useState([]);

  // ============================================================================
  // FETCH EMPLOYEES
  // ============================================================================

  const fetchEmployeeMap = async () => {
    try {
      const response = await axios.get(`${API_BASE}/EmployeeManagement/all`);

      if (response.data?.success && Array.isArray(response.data.data)) {
        const map = {};
        response.data.data.forEach((emp) => {
          map[emp.employeeId] = `${emp.firstName} ${emp.lastName}`;
        });
        setEmployeeMap(map);
        console.log("Employee map created:", Object.keys(map).length);
      }
    } catch (err) {
      console.error("Error fetching employees:", err.message);
    }
  };

  // ============================================================================
  // FETCH DASHBOARD DATA
  // ============================================================================

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");

    try {
      const hrId = user?.empId || 1001;

      // Peer feedback queue (HR role)
      try {
        const res = await peerQueueApi.list(1, 100);
        const feedbackData = res.data?.data || [];

        const mappedFeedback = feedbackData.map((item) => ({
          ...item,
          submitterName:
            employeeMap[item.submittedByEmployeeId] ||
            `Employee ${item.submittedByEmployeeId}`,
          recipientName:
            employeeMap[item.recipientEmployeeId] ||
            `Employee ${item.recipientEmployeeId}`,
        }));

        setFeedback(mappedFeedback);
        console.log("Peer feedback loaded:", mappedFeedback.length);
      } catch (err) {
        console.warn("Error fetching peer feedback:", err.message);
      }

      // Peer feedback received (HR as employee)
      try {
        const peerRes = await peerQueueApi.list(1, 1000);
        if (Array.isArray(peerRes.data?.data)) {
          const myFeedback = peerRes.data.data
            .filter((p) => p.recipientEmployeeId === hrId)
            .map((p) => ({
              ...p,
              submittedByName:
                employeeMap[p.submittedByEmployeeId] ||
                `Employee ${p.submittedByEmployeeId}`,
            }));
          setMyPeerFeedback(myFeedback);
        }
      } catch (err) {
        console.warn("Error fetching my peer feedback:", err.message);
      }

      // Active HR Forms
      try {
        const activeRes = await axios.get(
          `${API_BASE}/HrFeedbackForm/forms/active`
        );
        if (activeRes.data?.success) {
          setActiveHrForms(activeRes.data.data || []);
        }
      } catch (err) {
        console.warn("Error fetching active forms:", err.message);
      }

      // Submitted HR Forms (HR as employee)
      try {
        const submittedRes = await axios.get(
          `${API_BASE}/HrFeedbackForm/responses/by-employee/${hrId}`
        );
        if (submittedRes.data?.success) {
          setSubmittedForms(submittedRes.data.data || []);
        }
      } catch (err) {
        console.warn("Error fetching submitted forms:", err.message);
      }

      // Reviews about me
      try {
        const reviewRes = await axios.get(
          `${API_BASE}/ManagerReview/target/${hrId}`
        );
        if (reviewRes.data?.success && Array.isArray(reviewRes.data.data)) {
          setMyReviews(reviewRes.data.data);
        }
      } catch (err) {
        console.warn("Error fetching my reviews:", err.message);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to load dashboard");
    } finally {
      setLoading(false);
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
      fetchDashboardData();
    }
  }, [employeeMap, user?.empId]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const refresh = async () => {
    setRefreshing(true);
    await fetchEmployeeMap();
    await fetchDashboardData();
    setRefreshing(false);
  };

  // ============================================================================
  // STATS
  // ============================================================================

  const stats = useMemo(() => {
    const submittedFormIds = new Set(submittedForms.map((f) => f.formId));
    const pendingForms = activeHrForms.filter(
      (f) => !submittedFormIds.has(f.formId)
    ).length;

    return [
      {
        label: "Total Feedback",
        value: feedback.length,
        Icon: FileText,
        color: "#97247E",
      },
    ];
  }, [feedback, activeHrForms, submittedForms, myPeerFeedback]);

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "60vh" }}
      >
        <div
          className="spinner-border"
          style={{
            width: "3rem",
            height: "3rem",
            color: "#97247E",
            borderWidth: "3px",
          }}
          role="status"
        >
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8f9fa",
        padding: "2rem 1rem",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* HEADER */}
        <div
          className="d-flex justify-content-between align-items-center mb-4"
          style={{ flexWrap: "wrap", gap: "1rem" }}
        >
          <div>
            <p className="mb-0 text-muted" style={{ fontSize: "0.875rem" }}>
              Welcome back, {user?.firstName} {user?.lastName}
            </p>
          </div>
          <button
            className="btn btn-outline-secondary d-flex align-items-center gap-2"
            onClick={refresh}
            disabled={refreshing}
            style={{
              borderRadius: "8px",
              padding: "10px 20px",
              fontWeight: 600,
              border: "2px solid #dee2e6",
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
          <div
            className="alert alert-danger alert-dismissible fade show d-flex align-items-start gap-2 mb-4"
            role="alert"
            style={{ borderRadius: "8px" }}
          >
            <AlertTriangle size={18} className="mt-1 flex-shrink-0" />
            <div className="flex-grow-1">
              <strong>Error</strong>
              <p className="mb-0 small mt-1">{error}</p>
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={() => setError("")}
            />
          </div>
        )}

        {/* STATS - 4 CARDS */}
        <div className="row g-3 mb-4">
          {stats.map((s, idx) => (
            <div key={idx} className="col-6 col-md-3">
              <StatCard {...s} />
            </div>
          ))}
        </div>

        {/* TABS */}
        <div
          style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "12px 12px 0 0",
            padding: "0.5rem 1rem",
            marginBottom: 0,
            borderBottom: "none",
          }}
        >
          <ul className="nav nav-tabs border-0 mb-0" style={{ gap: "0.5rem" }}>
            <li className="nav-item">
              <button
                className={`nav-link border-0 ${
                  activeTab === "overview" ? "active" : ""
                }`}
                onClick={() => setActiveTab("overview")}
                style={{
                  color: activeTab === "overview" ? "#97247E" : "#6c757d",
                  borderBottom:
                    activeTab === "overview"
                      ? "3px solid #97247E"
                      : "3px solid transparent",
                  fontWeight: 600,
                  background: "transparent",
                  padding: "0.75rem 1rem",
                }}
              >
                Overview
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link border-0 ${
                  activeTab === "hr-operations" ? "active" : ""
                }`}
                onClick={() => setActiveTab("hr-operations")}
                style={{
                  color: activeTab === "hr-operations" ? "#97247E" : "#6c757d",
                  borderBottom:
                    activeTab === "hr-operations"
                      ? "3px solid #97247E"
                      : "3px solid transparent",
                  fontWeight: 600,
                  background: "transparent",
                  padding: "0.75rem 1rem",
                }}
              >
                HR Operations
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link border-0 ${
                  activeTab === "peer-feedback" ? "active" : ""
                }`}
                onClick={() => setActiveTab("peer-feedback")}
                style={{
                  color: activeTab === "peer-feedback" ? "#97247E" : "#6c757d",
                  borderBottom:
                    activeTab === "peer-feedback"
                      ? "3px solid #97247E"
                      : "3px solid transparent",
                  fontWeight: 600,
                  background: "transparent",
                  padding: "0.75rem 1rem",
                }}
              >
                Peer Feedback
              </button>
            </li>
          </ul>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div
            style={{
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "0 0 12px 12px",
              padding: "1.5rem",
            }}
          >
            {/* QUICK ACTIONS - DUAL ROLE */}
            <div className="mb-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <Zap size={20} style={{ color: "#97247E" }} />
                <h5 className="mb-0 fw-bold">Quick Actions</h5>
              </div>

              {/* HR-specific actions */}
              <h6
                className="small text-muted mb-2"
                style={{ textAlign: "left" }}
              >
                HR Functions
              </h6>
              <div className="row g-2 mb-3">
                <div className="col-6 col-md-3">
                  <Link
                    to="/hr/dashboard/feedback/hrformlist"
                    className="btn w-100 d-flex align-items-center justify-content-center gap-2"
                    style={{
                      background: "white",
                      color: "#97247E",
                      border: "2px solid #97247E",
                      borderRadius: "8px",
                      padding: "10px",
                      fontWeight: 600,
                    }}
                  >
                    <Search size={16} />
                    <span className="small">All Feedback</span>
                  </Link>
                </div>
                <div className="col-6 col-md-3">
                  <Link
                    to="/hr/dashboard/feedback/create-form"
                    className="btn w-100 d-flex align-items-center justify-content-center gap-2"
                    style={{
                      background: "white",
                      color: "#97247E",
                      border: "2px solid #97247E",
                      borderRadius: "8px",
                      padding: "10px",
                      fontWeight: 600,
                    }}
                  >
                    <Plus size={16} />
                    <span className="small">Create Form</span>
                  </Link>
                </div>
              </div>

              {/* Employee-like actions */}
              <h6
                className="small text-muted mb-2"
                style={{ textAlign: "left" }}
              >
                Submit Feedback
              </h6>
              <div className="row g-2">
                <div className="col-6 col-md-3">
                  <Link
                    to="/hr/dashboard/feedback/submit-mentor"
                    className="btn w-100 d-flex align-items-center justify-content-center gap-2"
                    style={{
                      background: "white",
                      color: "#97247E",
                      border: "2px solid #97247E",
                      borderRadius: "8px",
                      padding: "10px",
                      fontWeight: 600,
                    }}
                  >
                    <Send size={16} />
                    <span className="small">Mentor Feedback</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HR OPERATIONS TAB */}
        {activeTab === "hr-operations" && (
          <div
            style={{
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "0 0 12px 12px",
              padding: "1.5rem",
            }}
          >
            <h5 className="fw-bold mb-4" style={{ color: "#212529" }}>
              Recent Feedback ({feedback.length})
            </h5>

            {feedback.length === 0 ? (
              <div className="text-center py-5">
                <FileText
                  size={48}
                  className="mb-3"
                  style={{ color: "#cbd5e1" }}
                />
                <p className="text-muted mb-0">No feedback to review yet</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                      <th
                        style={{
                          color: "#97247E",
                          fontSize: "0.813rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          padding: "1rem",
                        }}
                      >
                        From
                      </th>
                      <th
                        style={{
                          color: "#97247E",
                          fontSize: "0.813rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          padding: "1rem",
                        }}
                      >
                        To
                      </th>
                      <th
                        style={{
                          color: "#97247E",
                          fontSize: "0.813rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          padding: "1rem",
                        }}
                      >
                        Content
                      </th>
                      <th
                        style={{
                          color: "#97247E",
                          fontSize: "0.813rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          padding: "1rem",
                        }}
                      >
                        Date
                      </th>
                      <th
                        style={{
                          color: "#97247E",
                          fontSize: "0.813rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          padding: "1rem",
                        }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedback.map((item, index) => (
                      <tr
                        key={`feedback-${item.queueId || index}`}
                        style={{ borderBottom: "1px solid #f1f5f9" }}
                      >
                        <td
                          style={{
                            padding: "1rem",
                            fontSize: "0.875rem",
                            fontWeight: 600,
                          }}
                        >
                          {item.submitterName}
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            fontSize: "0.875rem",
                            fontWeight: 600,
                          }}
                        >
                          {item.recipientName}
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            fontSize: "0.875rem",
                            maxWidth: "300px",
                          }}
                          className="text-truncate"
                        >
                          {item.feedbackContent || "No content"}
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            fontSize: "0.875rem",
                            color: "#6c757d",
                          }}
                        >
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td style={{ padding: "1rem" }}>
                          <Link
                            to="/hr/review-queue"
                            className="btn btn-sm d-inline-flex align-items-center gap-1"
                            style={{
                              background: "#97247E",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              padding: "6px 12px",
                              fontWeight: 600,
                            }}
                          >
                            <Eye size={14} />
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* PEER FEEDBACK TAB */}
        {activeTab === "peer-feedback" && (
          <div
            style={{
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "0 0 12px 12px",
              padding: "1.5rem",
            }}
          >
            <h5 className="fw-bold mb-4" style={{ color: "#212529" }}>
              All Peer Feedback ({myPeerFeedback.length})
            </h5>

            {myPeerFeedback.length === 0 ? (
              <div className="text-center py-5">
                <Users
                  size={48}
                  className="mb-3"
                  style={{ color: "#cbd5e1" }}
                />
                <p className="text-muted mb-0">No peer feedback received yet</p>
              </div>
            ) : (
              <div className="row g-3">
                {myPeerFeedback.map((feedbackItem) => (
                  <div
                    className="col-12"
                    key={
                      feedbackItem.peerQueueId || feedbackItem.contextFeedbackId
                    }
                  >
                    <div
                      style={{
                        background: "white",
                        border: "1px solid #e5e7eb",
                        borderLeft: "4px solid #97247E",
                        borderRadius: "8px",
                        padding: "1.25rem",
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <h6 className="fw-bold mb-1">
                            {feedbackItem.submittedByName}
                          </h6>
                          <small className="text-muted">
                            {feedbackItem.submittedDate
                              ? new Date(
                                  feedbackItem.submittedDate
                                ).toLocaleDateString()
                              : new Date(
                                  feedbackItem.createdAt
                                ).toLocaleDateString()}
                          </small>
                        </div>
                        <span
                          style={{
                            display: "inline-block",
                            backgroundColor: "#97247E15",
                            color: "#97247E",
                            padding: "6px 12px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            borderRadius: "6px",
                            border: "1.5px solid #97247E40",
                          }}
                        >
                          Peer Feedback
                        </span>
                      </div>
                      <p
                        className="mb-0"
                        style={{ lineHeight: "1.6", color: "#495057" }}
                      >
                        {feedbackItem.comment ||
                          feedbackItem.feedbackComment ||
                          feedbackItem.feedbackContent ||
                          "No comment provided"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
