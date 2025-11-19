// src/pages/feedback_management/dashboard/FeedbackHRDashboard.jsx

import React, { useEffect, useState, useMemo } from "react";
import {
  RefreshCw,
  AlertTriangle,
  FileText,
  Eye,
  Search,
  Zap,
  Plus,
  Send,
  Users,
  CheckCircle,
  Clock,
  Star,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  peerQueueApi,
  employeeApi,
  hrFormApi,
  managerReviewApi,
} from "../../services/feedbackmanagement/feedbackApi";

const StatCard = ({ label, value, Icon, color }) => (
  <div
    style={{
      background: "white",
      border: "1px solid #97247E",
      borderRadius: "10px",
      padding: "1.25rem",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      textAlign: "center",
      transition: "all 0.3s ease",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow = "0 8px 16px rgba(151, 36, 126, 0.15)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
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

  // Fetch employees using service
  const fetchEmployeeMap = async () => {
    try {
      const response = await employeeApi.getAll();

      if (response?.data) {
        const employeesList = Array.isArray(response.data)
          ? response.data
          : response.data.data || [];

        const map = {};
        employeesList.forEach((emp) => {
          map[emp.employeeId] = `${emp.firstName} ${emp.lastName}`;
        });
        setEmployeeMap(map);
        console.log("Employee map created:", Object.keys(map).length);
        return map;
      }
    } catch (err) {
      console.error("Error fetching employees:", err.message);
    }
    return {};
  };

  // Fetch dashboard data using services
  const fetchDashboardData = async (empMap = {}) => {
    setLoading(true);
    setError("");

    try {
      const hrId = user?.empId || 1001;

      // Peer feedback queue (HR role)
      try {
        const res = await peerQueueApi.list(1, 100);
        const feedbackData = Array.isArray(res?.data)
          ? res.data
          : res?.data?.data || [];

        const mappedFeedback = feedbackData.map((item) => ({
          ...item,
          submitterName:
            empMap[item.submittedByEmployeeId] ||
            `Employee ${item.submittedByEmployeeId}`,
          recipientName:
            empMap[item.recipientEmployeeId] ||
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
        const peerData = Array.isArray(peerRes?.data)
          ? peerRes.data
          : peerRes?.data?.data || [];

        if (Array.isArray(peerData)) {
          const myFeedback = peerData
            .filter((p) => Number(p.recipientEmployeeId) === Number(hrId))
            .map((p) => ({
              ...p,
              submittedByName:
                empMap[p.submittedByEmployeeId] ||
                `Employee ${p.submittedByEmployeeId}`,
            }));
          setMyPeerFeedback(myFeedback);
        }
      } catch (err) {
        console.warn("Error fetching my peer feedback:", err.message);
      }

      // Active HR Forms using service
      try {
        const activeRes = await hrFormApi.getActiveForms();
        const forms = activeRes?.data || [];
        setActiveHrForms(Array.isArray(forms) ? forms : []);
      } catch (err) {
        console.warn("Error fetching active forms:", err.message);
      }

      // Submitted HR Forms (HR as employee)
      try {
        const submittedRes = await hrFormApi.getResponsesByEmployee(hrId);
        const forms = submittedRes?.data || [];
        setSubmittedForms(Array.isArray(forms) ? forms : []);
      } catch (err) {
        console.warn("Error fetching submitted forms:", err.message);
      }

      // Reviews about me using service
      try {
        const reviewRes = await managerReviewApi.getByTargetEmployee(hrId);
        const reviews = Array.isArray(reviewRes?.data)
          ? reviewRes.data
          : reviewRes?.data?.data || [];
        setMyReviews(reviews);
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

  // Effects
  useEffect(() => {
    const loadData = async () => {
      const empMap = await fetchEmployeeMap();
      await fetchDashboardData(empMap);
    };
    loadData();
  }, [user?.empId]);

  // Handlers
  const refresh = async () => {
    setRefreshing(true);
    const empMap = await fetchEmployeeMap();
    await fetchDashboardData(empMap);
    setRefreshing(false);
  };

  // Stats
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
      {
        label: "Active Forms",
        value: activeHrForms.length,
        Icon: CheckCircle,
        color: "#24A148",
      },
      {
        label: "Pending Forms",
        value: pendingForms,
        Icon: Clock,
        color: "#E2B93B",
      },
      {
        label: "Reviews Received",
        value: myReviews.length,
        Icon: Star,
        color: "#0F62FE",
      },
    ];
  }, [feedback, activeHrForms, submittedForms, myReviews]);

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
        {/* Header */}
        <div
          className="d-flex justify-content-between align-items-center mb-4"
          style={{ flexWrap: "wrap", gap: "1rem" }}
        >
          <div>
            <h2
              className="fw-bold mb-1"
              style={{ color: "#97247E", fontSize: "1.75rem" }}
            >
              HR Dashboard
            </h2>
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
              border: "2px solid #97247E",
              color: "#97247E",
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

        {/* Error Alert */}
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

        {/* Stats */}
        <div className="row g-3 mb-4">
          {stats.map((s, idx) => (
            <div key={idx} className="col-6 col-md-3">
              <StatCard {...s} />
            </div>
          ))}
        </div>

        {/* Tabs */}
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
            {[
              { key: "overview", label: "Overview" },
              { key: "hr-operations", label: "HR Operations" },
              { key: "peer-feedback", label: "Peer Feedback" },
            ].map(({ key, label }) => (
              <li key={key} className="nav-item">
                <button
                  className={`nav-link border-0 ${
                    activeTab === key ? "active" : ""
                  }`}
                  onClick={() => setActiveTab(key)}
                  style={{
                    color: activeTab === key ? "#97247E" : "#6c757d",
                    borderBottom:
                      activeTab === key
                        ? "3px solid #97247E"
                        : "3px solid transparent",
                    fontWeight: 600,
                    background: "transparent",
                    padding: "0.75rem 1rem",
                  }}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div
            style={{
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "0 0 12px 12px",
              padding: "1.5rem",
            }}
          >
            {/* Quick Actions */}
            <div className="mb-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <Zap size={20} style={{ color: "#97247E" }} />
                <h5 className="mb-0 fw-bold">Quick Actions</h5>
              </div>

              {/* HR-specific actions */}
              <h6 className="small text-muted mb-2">HR Functions</h6>
              <div className="row g-2 mb-3">
                <div className="col-6 col-md-3">
                  <Link
                    to="/hr/dashboard/feedback/hrformlist"
                    className="btn w-100 d-flex align-items-center justify-content-center gap-2"
                    style={{
                      background: "white",
                      color: "rgb(39, 35, 92)",
                      border: "2px solid ",
                      borderRadius: "8px",
                      padding: "10px",
                      fontWeight: 600,
                    }}
                  >
                    <Search size={16} />
                    <span className="small" >All Feedback</span>
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
                <div className="col-6 col-md-3">
                  <Link
                    to="/hr/dashboard/feedback/report"
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
                    <FileText size={16} />
                    <span className="small">Reports</span>
                  </Link>
                </div>
              </div>

              {/* Employee-like actions */}
              <h6 className="small text-muted mb-2">Submit Feedback</h6>
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
                <div className="col-6 col-md-3">
                  <Link
                    to="/hr/dashboard/feedback/submit-peer"
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
                    <Users size={16} />
                    <span className="small">Peer Feedback</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HR Operations Tab */}
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
                        Status
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
                    {feedback.slice(0, 10).map((item, index) => (
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
                        <td style={{ padding: "1rem" }}>
                          <span
                            className="badge"
                            style={{
                              backgroundColor:
                                item.status === "Approved"
                                  ? "#dcfce7"
                                  : item.status === "Rejected"
                                  ? "#fee2e2"
                                  : "#fef3c7",
                              color:
                                item.status === "Approved"
                                  ? "#24A148"
                                  : item.status === "Rejected"
                                  ? "#dc2626"
                                  : "#d97706",
                              padding: "4px 10px",
                              fontSize: "0.75rem",
                              borderRadius: "6px",
                            }}
                          >
                            {item.status || "Pending"}
                          </span>
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

            {feedback.length > 10 && (
              <div className="text-center mt-3">
                <Link
                  to="/hr/dashboard/feedback/hrformlist"
                  className="btn btn-outline-secondary"
                  style={{ borderRadius: "8px" }}
                >
                  View All Feedback
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Peer Feedback Tab */}
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
              Peer Feedback Received ({myPeerFeedback.length})
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
                        {feedbackItem.feedbackContent ||
                          feedbackItem.comment ||
                          feedbackItem.feedbackComment ||
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
