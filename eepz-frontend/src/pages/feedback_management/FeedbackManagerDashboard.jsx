// src/pages/feedback_management/dashboard/FeedbackManagerDashboard.jsx

import React, { useEffect, useState, useMemo } from "react";
import {
  RefreshCw,
  AlertTriangle,
  FileText,
  Plus,
  Clock,
  Send,
  Search,
  Eye,
  Star,
  Users,
  Target,
  Briefcase,
  MessageSquare,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  peerQueueApi,
  employeeApi,
  hrFormApi,
  managerReviewApi,
} from "../../services/feedbackmanagement/feedbackApi";

const StatCard = ({ label, value, Icon, bgColor, iconColor }) => (
  <div
    className="card border-0 h-100"
    style={{
      borderRadius: "10px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      transition: "all 0.3s ease",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.12)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
    }}
  >
    <div
      className="card-body d-flex flex-column align-items-center justify-content-center text-center"
      style={{ padding: "1.25rem 1rem" }}
    >
      <div
        style={{
          width: "56px",
          height: "56px",
          backgroundColor: bgColor,
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "0.875rem",
        }}
      >
        <Icon size={28} color={iconColor} strokeWidth={2.5} />
      </div>
      <h2
        className="fw-bold mb-2"
        style={{ fontSize: "2rem", color: "#0f172a", lineHeight: 1 }}
      >
        {value}
      </h2>
      <p
        className="mb-0"
        style={{ fontSize: "0.875rem", color: "#64748b", fontWeight: 600 }}
      >
        {label}
      </p>
    </div>
  </div>
);

export default function FeedbackManagerDashboard() {
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [user] = useState(
    () =>
      JSON.parse(localStorage.getItem("user") || "{}") || {
        empId: 1002,
        firstName: "Manager",
        lastName: "User",
      }
  );

  const [myReviews, setMyReviews] = useState([]);
  const [draftReviews, setDraftReviews] = useState([]);
  const [targetReviews, setTargetReviews] = useState([]);
  const [myPeerFeedback, setMyPeerFeedback] = useState([]);
  const [submittedForms, setSubmittedForms] = useState([]);
  const [activeHrForms, setActiveHrForms] = useState([]);
  const [employeeMap, setEmployeeMap] = useState({});

  // Enrich reviews with employee names
  const enrichReviews = (reviews, empMap) => {
    return reviews.map((review) => ({
      ...review,
      targetEmployeeName:
        empMap[review.targetEmployeeId] ||
        review.targetEmployeeName ||
        `Employee ${review.targetEmployeeId}`,
      managerName:
        empMap[review.managerEmployeeId] ||
        `Manager ${review.managerEmployeeId}`,
    }));
  };

  // Fetch dashboard data using services
  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");

    try {
      const managerId = user?.empId || 1002;

      // Fetch employee map
      let empMap = {};
      try {
        const empRes = await employeeApi.getAll();
        if (empRes?.data) {
          const employees = Array.isArray(empRes.data)
            ? empRes.data
            : empRes.data.data || [];

          employees.forEach((emp) => {
            empMap[emp.employeeId] = `${emp.firstName} ${emp.lastName}`;
          });
          setEmployeeMap(empMap);
        }
      } catch (err) {
        console.warn("Error fetching employee map:", err.message);
      }

      // Fetch my reviews
      try {
        const myRes = await managerReviewApi.getByManager(managerId);
        const reviewsData = Array.isArray(myRes?.data)
          ? myRes.data
          : myRes?.data?.data || [];

        if (Array.isArray(reviewsData)) {
          const enriched = enrichReviews(reviewsData, empMap);
          setMyReviews(enriched);
        }
      } catch (err) {
        console.warn("Error fetching my reviews:", err.message);
      }

      // Fetch draft reviews
      try {
        const draftRes = await managerReviewApi.getByStatus("Draft");
        const draftData = Array.isArray(draftRes?.data)
          ? draftRes.data
          : draftRes?.data?.data || [];

        if (Array.isArray(draftData)) {
          const myDrafts = draftData.filter(
            (r) => Number(r.managerEmployeeId) === Number(managerId)
          );
          const enriched = enrichReviews(myDrafts, empMap);
          setDraftReviews(enriched);
        }
      } catch (err) {
        console.warn("Error fetching drafts:", err.message);
      }

      // Fetch reviews about me
      try {
        const targetRes = await managerReviewApi.getByTargetEmployee(managerId);
        const targetData = Array.isArray(targetRes?.data)
          ? targetRes.data
          : targetRes?.data?.data || [];

        if (Array.isArray(targetData)) {
          const enriched = enrichReviews(targetData, empMap);
          setTargetReviews(enriched);
        }
      } catch (err) {
        console.warn("Error fetching reviews about me:", err.message);
      }

      // Fetch peer feedback
      try {
        const peerRes = await peerQueueApi.list(1, 1000);
        const peerData = Array.isArray(peerRes?.data)
          ? peerRes.data
          : peerRes?.data?.data || [];

        if (Array.isArray(peerData)) {
          const myFeedback = peerData
            .filter((p) => Number(p.recipientEmployeeId) === Number(managerId))
            .map((p) => ({
              ...p,
              submittedByName:
                empMap[p.submittedByEmployeeId] ||
                `Employee ${p.submittedByEmployeeId}`,
            }));
          setMyPeerFeedback(myFeedback);
        }
      } catch (err) {
        console.warn("Error fetching peer feedback:", err.message);
      }

      // Fetch active HR forms
      try {
        const activeRes = await hrFormApi.getActiveForms();
        const forms = activeRes?.data || [];
        setActiveHrForms(Array.isArray(forms) ? forms : []);
      } catch (err) {
        console.warn("Error fetching active forms:", err.message);
      }

      // Fetch submitted forms
      try {
        const submittedRes = await hrFormApi.getResponsesByEmployee(managerId);
        const responses = submittedRes?.data || [];
        setSubmittedForms(Array.isArray(responses) ? responses : []);
      } catch (err) {
        console.warn("Error fetching submitted forms:", err.message);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchDashboardData();
  }, [user?.empId]);

  // Refresh handler
  const refresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  // Calculate stats
  const stats = useMemo(() => {
    const submittedFormIds = new Set(submittedForms.map((f) => f.formId));
    const pendingForms = activeHrForms.filter(
      (f) => !submittedFormIds.has(f.formId)
    ).length;

    return [
      {
        label: "My Reviews",
        value: myReviews.length,
        Icon: Star,
        bgColor: "#dbeafe",
        iconColor: "#0F62FE",
      },
      {
        label: "Draft Reviews",
        value: draftReviews.length,
        Icon: Clock,
        bgColor: "#fef3c7",
        iconColor: "#E2B93B",
      },
      {
        label: "Pending Forms",
        value: pendingForms,
        Icon: FileText,
        bgColor: "#fee2e2",
        iconColor: "#E01950",
      },
      {
        label: "Peer Feedback",
        value: myPeerFeedback.length,
        Icon: Users,
        bgColor: "#f8f0ff",
        iconColor: "#9D4EDD",
      },
    ];
  }, [myReviews, draftReviews, activeHrForms, submittedForms, myPeerFeedback]);

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "60vh" }}
      >
        <div
          className="spinner-border text-primary"
          style={{ width: "3rem", height: "3rem" }}
        >
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "1.25rem 1.75rem",
        maxWidth: "100%",
        minHeight: "100vh",
        backgroundColor: "#f8f9fa",
      }}
    >
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h2
              className="fw-bold mb-0"
              style={{
                color: "#27235c",
                fontSize: "1.625rem",
                letterSpacing: "-0.025em",
              }}
            >
              Manager Dashboard
            </h2>
          </div>
          
        </div>
        
      </div>

      {/* Error Alert */}
      {error && (
        <div
          className="alert alert-danger d-flex align-items-start gap-2 mb-3"
          style={{
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#fee2e2",
            padding: "0.75rem 1rem",
          }}
        >
          <AlertTriangle
            size={16}
            className="flex-shrink-0"
            style={{ marginTop: "2px", color: "#dc2626" }}
          />
          <div className="flex-grow-1">
            <p
              className="mb-0"
              style={{ fontSize: "0.875rem", color: "#991b1b" }}
            >
              {error}
            </p>
          </div>
          <button
            type="button"
            className="btn-close"
            style={{ fontSize: "0.75rem" }}
            onClick={() => setError("")}
          />
        </div>
      )}

      {/* Stats Cards */}
      <div className="row g-3 mb-3">
        {stats.map((s, idx) => (
          <div key={idx} className="col-lg-3 col-md-6">
            <StatCard {...s} />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div
        style={{
          backgroundColor: "#27235c",
          borderRadius: "10px 10px 0 0",
          padding: "0 1rem",
          marginBottom: 0,
        }}
      >
        <ul className="nav nav-tabs border-0 m-0" role="tablist">
          {[
            { key: "overview", label: "Quick Actions", icon: Briefcase },
            
          ].map(({ key, label, icon: Icon, count }) => (
            <li key={key} className="nav-item">
              <button
                className={`nav-link border-0 d-flex align-items-center gap-2 ${
                  activeTab === key ? "active" : ""
                }`}
                onClick={() => setActiveTab(key)}
                style={{
                  color: activeTab === key ? "#fff" : "rgba(255,255,255,0.7)",
                  backgroundColor:
                    activeTab === key ? "rgba(255,255,255,0.1)" : "transparent",
                  borderBottom:
                    activeTab === key
                      ? "3px solid #fff"
                      : "3px solid transparent",
                  padding: "1rem 1.25rem",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== key) {
                    e.currentTarget.style.backgroundColor =
                      "rgba(255,255,255,0.05)";
                    e.currentTarget.style.color = "#fff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== key) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                  }
                }}
              >
                <Icon size={16} />
                {label} {count !== undefined && <span>({count})</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Content Area */}
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "0 0 10px 10px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          padding: "1.5rem",
        }}
      >
        {/* Overview Tab - Quick Actions */}
        {activeTab === "overview" && (
          <div className="row g-3">
            {/* Manager Functions */}
            <div className="col-md-6 col-lg-3">
              <Link
                to="/manager/dashboard/feedback/create-review"
                className="action-card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "1.25rem 1rem",
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                  minHeight: "100px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f8fafc";
                  e.currentTarget.style.borderColor = "#0f62fe";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(15, 98, 254, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#fff";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  className="mb-2"
                  style={{
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#dbeafe",
                    borderRadius: "8px",
                  }}
                >
                  <Plus size={20} style={{ color: "#0f62fe" }} />
                </div>
                <span
                  style={{
                    fontSize: "0.813rem",
                    fontWeight: 600,
                    color: "#0f172a",
                    textAlign: "center",
                  }}
                >
                  Create Review
                </span>
              </Link>
            </div>

            <div className="col-md-6 col-lg-3">
              <Link
                to="/manager/dashboard/feedback/all-review"
                className="action-card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "1.25rem 1rem",
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                  minHeight: "100px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f8fafc";
                  e.currentTarget.style.borderColor = "#0f62fe";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(15, 98, 254, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#fff";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  className="mb-2"
                  style={{
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#dbeafe",
                    borderRadius: "8px",
                  }}
                >
                  <Eye size={20} style={{ color: "#0f62fe" }} />
                </div>
                <span
                  style={{
                    fontSize: "0.813rem",
                    fontWeight: 600,
                    color: "#0f172a",
                    textAlign: "center",
                  }}
                >
                  All Reviews
                </span>
              </Link>
            </div>

            <div className="col-md-6 col-lg-3">
              <Link
                to="/manager/dashboard/feedback/team"
                className="action-card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "1.25rem 1rem",
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                  minHeight: "100px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f8fafc";
                  e.currentTarget.style.borderColor = "#0f62fe";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(15, 98, 254, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#fff";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  className="mb-2"
                  style={{
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#dbeafe",
                    borderRadius: "8px",
                  }}
                >
                  <Users size={20} style={{ color: "#0f62fe" }} />
                </div>
                <span
                  style={{
                    fontSize: "0.813rem",
                    fontWeight: 600,
                    color: "#0f172a",
                    textAlign: "center",
                  }}
                >
                  Peer Feedback Recieved
                </span>
              </Link>
            </div>

            <div className="col-md-6 col-lg-3">
              <Link
                to="/manager/dashboard/feedback/team-submissions"
                className="action-card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "1.25rem 1rem",
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                  minHeight: "100px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f8fafc";
                  e.currentTarget.style.borderColor = "#0f62fe";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(15, 98, 254, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#fff";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  className="mb-2"
                  style={{
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#dbeafe",
                    borderRadius: "8px",
                  }}
                >
                  <FileText size={20} style={{ color: "#0f62fe" }} />
                </div>
                <span
                  style={{
                    fontSize: "0.813rem",
                    fontWeight: 600,
                    color: "#0f172a",
                    textAlign: "center",
                  }}
                >
                  Team Submissions
                </span>
              </Link>
            </div>

            {/* Employee-like actions */}
            <div className="col-md-6 col-lg-3">
              <Link
                to="/manager/dashboard/feedback/submit-mentor"
                className="action-card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "1.25rem 1rem",
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                  minHeight: "100px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f8fafc";
                  e.currentTarget.style.borderColor = "#64748b";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(100, 116, 139, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#fff";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  className="mb-2"
                  style={{
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#f1f5f9",
                    borderRadius: "8px",
                  }}
                >
                  <Send size={20} style={{ color: "#64748b" }} />
                </div>
                <span
                  style={{
                    fontSize: "0.813rem",
                    fontWeight: 600,
                    color: "#0f172a",
                    textAlign: "center",
                  }}
                >
                  Mentor Feedback
                </span>
              </Link>
            </div>

            <div className="col-md-6 col-lg-3">
              <Link
                to="/manager/dashboard/feedback/contextfeedback"
                className="action-card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "1.25rem 1rem",
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                  minHeight: "100px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f8fafc";
                  e.currentTarget.style.borderColor = "#64748b";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(100, 116, 139, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#fff";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  className="mb-2"
                  style={{
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#f1f5f9",
                    borderRadius: "8px",
                  }}
                >
                  <MessageSquare size={20} style={{ color: "#64748b" }} />
                </div>
                <span
                  style={{
                    fontSize: "0.813rem",
                    fontWeight: 600,
                    color: "#0f172a",
                    textAlign: "center",
                  }}
                >
                  Context Feedback
                </span>
              </Link>
            </div>

            <div className="col-md-6 col-lg-3">
              <Link
                to="/manager/dashboard/feedback/assignedform"
                className="action-card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "1.25rem 1rem",
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                  minHeight: "100px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f8fafc";
                  e.currentTarget.style.borderColor = "#64748b";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(100, 116, 139, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#fff";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  className="mb-2"
                  style={{
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#f1f5f9",
                    borderRadius: "8px",
                  }}
                >
                  <Target size={20} style={{ color: "#64748b" }} />
                </div>
                <span
                  style={{
                    fontSize: "0.813rem",
                    fontWeight: 600,
                    color: "#0f172a",
                    textAlign: "center",
                  }}
                >
                  Assigned Forms
                </span>
              </Link>
            </div>

            <div className="col-md-6 col-lg-3">
              <Link
                to="/manager/dashboard/feedback/submissions"
                className="action-card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "1.25rem 1rem",
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                  minHeight: "100px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f8fafc";
                  e.currentTarget.style.borderColor = "#64748b";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(100, 116, 139, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#fff";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  className="mb-2"
                  style={{
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#f1f5f9",
                    borderRadius: "8px",
                  }}
                >
                  <Search size={20} style={{ color: "#64748b" }} />
                </div>
                <span
                  style={{
                    fontSize: "0.813rem",
                    fontWeight: 600,
                    color: "#0f172a",
                    textAlign: "center",
                  }}
                >
                  My Submissions
                </span>
              </Link>
            </div>
          </div>
        )}

        {/* Manager Actions Tab */}
        {activeTab === "manager-actions" && (
          <div>
            <h5
              className="fw-bold mb-4"
              style={{ color: "#0f172a", fontSize: "1.125rem" }}
            >
              My Reviews ({myReviews.length})
            </h5>

            {myReviews.length === 0 ? (
              <div className="text-center py-5">
                <FileText
                  size={56}
                  style={{ color: "#cbd5e1", opacity: 0.5 }}
                  className="mb-3"
                />
                <h6
                  className="fw-bold mb-2"
                  style={{ color: "#64748b", fontSize: "1.125rem" }}
                >
                  No reviews created yet
                </h6>
                <p className="text-muted mb-3" style={{ fontSize: "0.875rem" }}>
                  Start creating reviews for your team members
                </p>
                <Link
                  to="/manager/create-review"
                  className="btn btn-primary"
                  style={{ borderRadius: "8px", padding: "0.625rem 1.25rem" }}
                >
                  <Plus
                    size={16}
                    className="me-2"
                    style={{ display: "inline" }}
                  />
                  Create First Review
                </Link>
              </div>
            ) : (
              <div className="table-responsive">
                <table
                  className="table table-hover mb-0"
                  style={{ fontSize: "0.875rem" }}
                >
                  <thead style={{ backgroundColor: "#f8fafc" }}>
                    <tr>
                      <th
                        style={{
                          padding: "0.875rem",
                          color: "#64748b",
                          fontWeight: 600,
                        }}
                      >
                        Employee
                      </th>
                      <th
                        style={{
                          padding: "0.875rem",
                          color: "#64748b",
                          fontWeight: 600,
                        }}
                      >
                        Rating
                      </th>
                      <th
                        style={{
                          padding: "0.875rem",
                          color: "#64748b",
                          fontWeight: 600,
                        }}
                      >
                        Status
                      </th>
                      <th
                        style={{
                          padding: "0.875rem",
                          color: "#64748b",
                          fontWeight: 600,
                        }}
                      >
                        Date
                      </th>
                      <th
                        style={{
                          padding: "0.875rem",
                          color: "#64748b",
                          fontWeight: 600,
                        }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {myReviews.map((review) => (
                      <tr key={review.reviewcommentId}>
                        <td
                          style={{
                            padding: "0.875rem",
                            fontWeight: 600,
                            color: "#0f172a",
                          }}
                        >
                          {review.targetEmployeeName}
                        </td>
                        <td style={{ padding: "0.875rem" }}>
                          <div className="d-flex align-items-center gap-1">
                            <Star
                              size={14}
                              style={{ color: "#FFB800", fill: "#FFB800" }}
                            />
                            <span>{review.rating || 0}/5</span>
                          </div>
                        </td>
                        <td style={{ padding: "0.875rem" }}>
                          <span
                            className="badge"
                            style={{
                              backgroundColor:
                                review.status === "Approved"
                                  ? "#dcfce7"
                                  : "#fef3c7",
                              color:
                                review.status === "Approved"
                                  ? "#24A148"
                                  : "#E2B93B",
                              padding: "4px 10px",
                              fontSize: "0.75rem",
                              borderRadius: "6px",
                              fontWeight: 600,
                            }}
                          >
                            {review.status || "Draft"}
                          </span>
                        </td>
                        <td style={{ padding: "0.875rem", color: "#64748b" }}>
                          {new Date(review.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: "0.875rem" }}>
                          <Link
                            to={`/manager/view-review/${review.reviewcommentId}`}
                            className="btn btn-sm btn-outline-secondary"
                            style={{
                              fontSize: "0.813rem",
                              borderRadius: "6px",
                              padding: "4px 12px",
                            }}
                          >
                            <Eye
                              size={14}
                              className="me-1"
                              style={{ display: "inline" }}
                            />
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

        {/* Peer Feedback Tab */}
        {activeTab === "peer-feedback" && (
          <div>
            <h5
              className="fw-bold mb-4"
              style={{ color: "#0f172a", fontSize: "1.125rem" }}
            >
              All Peer Feedback ({myPeerFeedback.length})
            </h5>

            {myPeerFeedback.length === 0 ? (
              <div className="text-center py-5">
                <Users
                  size={56}
                  style={{ color: "#cbd5e1", opacity: 0.5 }}
                  className="mb-3"
                />
                <h6
                  className="fw-bold mb-2"
                  style={{ color: "#64748b", fontSize: "1.125rem" }}
                >
                  No peer feedback yet
                </h6>
                <p className="text-muted mb-0" style={{ fontSize: "0.875rem" }}>
                  You haven't received any peer feedback yet
                </p>
              </div>
            ) : (
              <div className="row g-3">
                {myPeerFeedback.map((feedback) => (
                  <div
                    className="col-12"
                    key={feedback.peerQueueId || feedback.contextFeedbackId}
                  >
                    <div
                      className="card border-0"
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                      }}
                    >
                      <div className="card-body" style={{ padding: "1rem" }}>
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <h6
                              className="fw-bold mb-1"
                              style={{ fontSize: "0.875rem", color: "#0f172a" }}
                            >
                              {feedback.submittedByName}
                            </h6>
                            <small
                              style={{ fontSize: "0.75rem", color: "#64748b" }}
                            >
                              {feedback.submittedDate
                                ? new Date(
                                    feedback.submittedDate
                                  ).toLocaleDateString()
                                : new Date(
                                    feedback.createdAt
                                  ).toLocaleDateString()}
                            </small>
                          </div>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: "#f8f0ff",
                              color: "#9d4edd",
                              padding: "4px 10px",
                              fontSize: "0.75rem",
                              borderRadius: "6px",
                              fontWeight: 600,
                            }}
                          >
                            Peer Feedback
                          </span>
                        </div>
                        <p
                          className="mb-0"
                          style={{
                            lineHeight: "1.6",
                            color: "#475569",
                            fontSize: "0.875rem",
                          }}
                        >
                          {feedback.feedbackContent ||
                            feedback.comment ||
                            feedback.feedbackComment ||
                            "No comment provided"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
