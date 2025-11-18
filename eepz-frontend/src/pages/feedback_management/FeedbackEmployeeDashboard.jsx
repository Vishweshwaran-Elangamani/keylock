// src/pages/employee/EmployeeDashboard.jsx

import React, { useEffect, useState, useMemo } from "react";
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Send,
  Search,
  Eye,
  Zap,
  Star,
  Users,
  Award,
  MessageSquare,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  peerQueueApi,
  smeApi,
  hrFormApi,
  managerReviewApi,
  employeeApi,
  mentorFeedbackApi,
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

export default function FeedbackEmployeeDashboard() {
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [user] = useState(
    () =>
      JSON.parse(localStorage.getItem("user") || "{}") || {
        empId: 1004,
        firstName: "Dave",
        lastName: "Dev",
      }
  );

  const [activeHrForms, setActiveHrForms] = useState([]);
  const [submittedForms, setSubmittedForms] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [myPeerFeedback, setMyPeerFeedback] = useState([]);
  const [employeeMap, setEmployeeMap] = useState({});

  const [isMentor, setIsMentor] = useState(false);
  const [mentorFeedbackCount, setMentorFeedbackCount] = useState(0);

  // Check if user is a mentor using service
  const checkIfMentor = async () => {
    try {
      const empId = user?.empId || user?.employeeId || 1004;

      const smeResponse = await smeApi.getActive();

      const smeData = Array.isArray(smeResponse?.data)
        ? smeResponse.data
        : smeResponse?.data?.data || [];

      if (Array.isArray(smeData)) {
        const isSme = smeData.some(
          (sme) => Number(sme.employeeId) === Number(empId)
        );
        setIsMentor(isSme);

        if (isSme) {
          try {
            const feedbackResponse = await mentorFeedbackApi.getAboutMe(empId);
            const feedbackData = Array.isArray(feedbackResponse?.data)
              ? feedbackResponse.data
              : feedbackResponse?.data?.data || [];

            if (Array.isArray(feedbackData)) {
              setMentorFeedbackCount(feedbackData.length);
            }
          } catch (err) {
            console.warn("Error fetching mentor feedback count:", err.message);
          }
        }
      }
    } catch (err) {
      console.warn("Error checking mentor status:", err.message);
    }
  };

  // Fetch dashboard data using services
  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");

    try {
      const empId = user?.empId || 1004;

      await checkIfMentor();

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

      // Fetch active HR forms
      try {
        const activeRes = await hrFormApi.getActiveForms();
        const formsData = activeRes?.data || [];
        setActiveHrForms(Array.isArray(formsData) ? formsData : []);
      } catch (err) {
        console.warn("Error fetching active forms:", err.message);
      }

      // Fetch submitted forms
      try {
        const submittedRes = await hrFormApi.getResponsesByEmployee(empId);
        const responsesData = submittedRes?.data || [];
        setSubmittedForms(Array.isArray(responsesData) ? responsesData : []);
      } catch (err) {
        console.warn("Error fetching submitted forms:", err.message);
      }

      // Fetch my reviews
      try {
        const reviewRes = await managerReviewApi.getByTargetEmployee(empId);
        const reviewsData = Array.isArray(reviewRes?.data)
          ? reviewRes.data
          : reviewRes?.data?.data || [];
        setMyReviews(reviewsData);
      } catch (err) {
        console.warn("Error fetching my reviews:", err.message);
      }

      // Fetch peer feedback
      try {
        const peerRes = await peerQueueApi.list(1, 1000);
        const peerData = Array.isArray(peerRes?.data)
          ? peerRes.data
          : peerRes?.data?.data || [];

        if (Array.isArray(peerData)) {
          const myFeedback = peerData
            .filter((p) => Number(p.recipientEmployeeId) === Number(empId))
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
    const pending = activeHrForms.filter(
      (f) => !submittedFormIds.has(f.formId)
    ).length;
    const submitted = submittedForms.length;

    return [
      {
        label: "Pending Forms",
        value: pending,
        Icon: Clock,
        bgColor: "#fef3c7",
        iconColor: "#E2B93B",
      },
      {
        label: "Submitted Forms",
        value: submitted,
        Icon: CheckCircle,
        bgColor: "#dcfce7",
        iconColor: "#24A148",
      },
      {
        label: "Reviews Received",
        value: myReviews.length,
        Icon: Star,
        bgColor: "#dbeafe",
        iconColor: "#0F62FE",
      },
      {
        label: "Peer Feedback",
        value: myPeerFeedback.length,
        Icon: Users,
        bgColor: "#f8f0ff",
        iconColor: "#9D4EDD",
      },
    ];
  }, [activeHrForms, submittedForms, myReviews, myPeerFeedback]);

  // Loading state
  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "60vh" }}
      >
        <div
          className="spinner-border text-primary"
          role="status"
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
              Employee Dashboard
            </h2>
            {isMentor && (
              <span
                className="badge d-flex align-items-center gap-1"
                style={{
                  backgroundColor: "#fef3c7",
                  color: "#d97706",
                  fontSize: "0.75rem",
                  padding: "4px 8px",
                  borderRadius: "6px",
                }}
              >
                <Award size={14} />
                SME
              </span>
            )}
          </div>
          <p
            className="mb-0"
            style={{ color: "#64748b", fontSize: "0.875rem" }}
          >
            Welcome back, {user?.firstName} {user?.lastName}
          </p>
        </div>
        <button
          className="btn d-flex align-items-center gap-2"
          onClick={refresh}
          disabled={refreshing}
          style={{
            backgroundColor: "transparent",
            border: "1.5px solid #0F62FE",
            color: "#0F62FE",
            borderRadius: "8px",
            padding: "8px 16px",
            fontSize: "0.875rem",
            fontWeight: 600,
          }}
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
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
            { key: "overview", label: "Quick Actions", icon: Zap },
            {
              key: "peer-feedback",
              label: "Peer Feedback",
              icon: Users,
              count: myPeerFeedback.length,
            },
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
            {/* Mentor Feedback */}
            <div className="col-md-4 col-6">
              <Link
                to="/employee/dashboard/feedback/submit-mentor"
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
                  <Send size={20} style={{ color: "#0f62fe" }} />
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

            {/* Context Feedback */}
            <div className="col-md-4 col-6">
              <Link
                to="/employee/dashboard/feedback/contextfeedback"
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
                  <MessageSquare size={20} style={{ color: "#0f62fe" }} />
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

            {/* Assigned Forms */}
            <div className="col-md-4 col-6">
              <Link
                to="/employee/dashboard/feedback/assignedform"
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
                  Assigned Forms
                </span>
              </Link>
            </div>

            {/* Peer Feedback */}
            <div className="col-md-4 col-6">
              <Link
                to="/employee/dashboard/feedback/submit-peer"
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
                  e.currentTarget.style.backgroundColor = "#f8f0ff";
                  e.currentTarget.style.borderColor = "#9d4edd";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(157, 78, 221, 0.15)";
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
                    backgroundColor: "#f8f0ff",
                    borderRadius: "8px",
                  }}
                >
                  <Users size={20} style={{ color: "#9d4edd" }} />
                </div>
                <span
                  style={{
                    fontSize: "0.813rem",
                    fontWeight: 600,
                    color: "#0f172a",
                    textAlign: "center",
                  }}
                >
                  Peer Feedback Received
                </span>
              </Link>
            </div>

            {/* My Submissions */}
            <div className="col-md-4 col-6">
              <Link
                to="/employee/dashboard/feedback/submissions"
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

            {/* SME Dashboard - Only if user is a mentor */}
            {isMentor && (
              <div className="col-md-4 col-6">
                <Link
                  to="/employee/dashboard/feedback/mentor"
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
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#fef3c7";
                    e.currentTarget.style.borderColor = "#f59e0b";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(245, 158, 11, 0.15)";
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
                      backgroundColor: "#fef3c7",
                      borderRadius: "8px",
                    }}
                  >
                    <Award size={20} style={{ color: "#f59e0b" }} />
                  </div>
                  <span
                    style={{
                      fontSize: "0.813rem",
                      fontWeight: 600,
                      color: "#0f172a",
                      textAlign: "center",
                    }}
                  >
                    SME Dashboard
                  </span>
                  {mentorFeedbackCount > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        backgroundColor: "#dc2626",
                        color: "#fff",
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        borderRadius: "12px",
                        padding: "2px 6px",
                        minWidth: "20px",
                        textAlign: "center",
                      }}
                    >
                      {mentorFeedbackCount}
                    </span>
                  )}
                </Link>
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
