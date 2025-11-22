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
  Briefcase,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  peerQueueApi,
  employeeApi,
  hrFormApi,
  managerReviewApi,
} from "../../services/feedbackmanagement/feedbackApi";
import FeedbackBreadcrumb from "../../components/feedback_management/common/FeedbackBreadcrumb";

const StatCard = ({ label, value, Icon, color, bgColor }) => (
  <div
    style={{
      background: "white",
      border: "none",
      borderRadius: "12px",
      padding: "1.5rem",
      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      transition: "all 0.3s ease",
      height: "100%",
    }}
  >
    <div className="d-flex align-items-start justify-content-between">
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "12px",
          background: bgColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={28} style={{ color }} />
      </div>
      <div className="text-end">
        <h2
          className="fw-bold mb-0"
          style={{
            color: "#1F2937",
            fontSize: "2rem",
            lineHeight: 1,
          }}
        >
          {value}
        </h2>
        <p
          className="mb-0 mt-2"
          style={{
            fontSize: "0.813rem",
            color: "#6B7280",
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {label}
        </p>
      </div>
    </div>
  </div>
);

const HeroActionCard = ({ title, description, icon: Icon, to, iconBg, iconColor }) => (
  <Link
    to={to}
    style={{
      textDecoration: "none",
      display: "block",
      height: "100%",
    }}
  >
    <div
      style={{
        background: "white",
        border: "1.5px solid #E5E7EB",
        borderRadius: "12px",
        padding: "1.5rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        transition: "all 0.3s ease",
        height: "100%",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        minHeight: "180px",
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
      {/* Background Pattern */}
      <div
        style={{
          position: "absolute",
          top: "-30%",
          right: "-15%",
          width: "140px",
          height: "140px",
          background: "rgba(0,0,0,0.02)",
          borderRadius: "50%",
          zIndex: 0,
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Icon */}
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            background: iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1rem",
          }}
        >
          <Icon size={24} style={{ color: iconColor }} />
        </div>

        {/* Content */}
        <h5
          className="fw-bold mb-2"
          style={{
            color: "#1F2937",
            fontSize: "1rem",
          }}
        >
          {title}
        </h5>
        <p
          className="mb-2"
          style={{
            color: "#6B7280",
            fontSize: "0.813rem",
            lineHeight: "1.5",
          }}
        >
          {description}
        </p>

        {/* Arrow */}
        <div className="d-flex align-items-center gap-2 mt-3">
          <span
            style={{
              color: "#97247E",
              fontSize: "0.813rem",
              fontWeight: 600,
            }}
          >
            Get Started
          </span>
          <ArrowRight
            size={14}
            style={{
              color: "#97247E",
              transition: "transform 0.3s",
            }}
          />
        </div>
      </div>
    </div>
  </Link>
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

    const closedFeedback = feedback.filter(
      (f) => f.status === "Closed" || f.status === "Rejected"
    ).length;

    return [
      {
        label: "Total Feedback",
        value: feedback.length,
        Icon: Briefcase,
        color: "#3B82F6",
        bgColor: "#DBEAFE",
      },
      {
        label: "Active Forms",
        value: activeHrForms.length,
        Icon: CheckCircle,
        color: "#10B981",
        bgColor: "#D1FAE5",
      },
      {
        label: "Pending Forms",
        value: pendingForms,
        Icon: Clock,
        color: "#F59E0B",
        bgColor: "#FEF3C7",
      },
      {
        label: "Reviews Received",
        value: myReviews.length,
        Icon: Star,
        color: "#8B5CF6",
        bgColor: "#EDE9FE",
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
        background: "#F9FAFB",
        padding: "1.5rem",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Breadcrumb */}
        <FeedbackBreadcrumb items={[{ label: "Feedback Management" }]} />

        {/* Error Alert */}
        {error && (
          <div
            className="alert alert-danger alert-dismissible fade show d-flex align-items-start gap-2 mb-4"
            role="alert"
            style={{ borderRadius: "12px", border: "none" }}
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

        {/* Stats Cards */}
        <div className="row g-3 mb-4">
          {stats.map((s, idx) => (
            <div key={idx} className="col-6 col-md-3">
              <StatCard {...s} />
            </div>
          ))}
        </div>

        {/* Hero Section Title */}
        <div className="text-center mb-4">
          <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
            <Zap size={28} style={{ color: "#97247E" }} />
            <h3 className="mb-0 fw-bold" style={{ color: "#1F2937", fontSize: "1.5rem" }}>
              Quick Actions
            </h3>
          </div>
          <p
            style={{
              color: "#6B7280",
              fontSize: "0.938rem",
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            Manage feedback, create forms, and streamline your HR operations
          </p>
        </div>

        {/* Hero Action Cards - 3 Cards in One Row */}
        <div className="row g-3 mb-4">
          {/* All Feedback Card */}
          <div className="col-12 col-md-4">
            <HeroActionCard
              title="View All Feedback"
              description="Browse, search, and manage all feedback submissions from employees."
              icon={Search}
              to="/hr/dashboard/feedback/hrformlist"
              iconBg="#EDE9FE"
              iconColor="#8B5CF6"
            />
          </div>

          {/* Create Form Card */}
          <div className="col-12 col-md-4">
            <HeroActionCard
              title="Create New Form"
              description="Design and publish custom feedback forms for performance reviews."
              icon={Plus}
              to="/hr/dashboard/feedback/create-form"
              iconBg="#FECDD3"
              iconColor="#E11D48"
            />
          </div>

          {/* Mentor Feedback Card */}
          <div className="col-12 col-md-4">
            <HeroActionCard
              title="Submit Mentor Feedback"
              description="Provide valuable feedback and guidance to mentees and team members."
              icon={Send}
              to="/hr/dashboard/feedback/submit-mentor"
              iconBg="#DBEAFE"
              iconColor="#3B82F6"
            />
          </div>
        </div>

        {/* Peer Feedback Section */}
        {myPeerFeedback.length > 0 && (
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              padding: "1.5rem",
              marginTop: "1.5rem",
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold mb-1" style={{ color: "#1F2937" }}>
                  Peer Feedback Received
                </h5>
                <p className="mb-0" style={{ color: "#6B7280", fontSize: "0.875rem" }}>
                  {myPeerFeedback.length} feedback{myPeerFeedback.length !== 1 ? "s" : ""} from your colleagues
                </p>
              </div>
              <button
                onClick={refresh}
                disabled={refreshing}
                className="btn btn-sm d-inline-flex align-items-center gap-2"
                style={{
                  background: "white",
                  border: "1.5px solid #E5E7EB",
                  borderRadius: "8px",
                  color: "#374151",
                  fontWeight: 600,
                  padding: "6px 12px",
                }}
              >
                <RefreshCw
                  size={14}
                  style={{
                    animation: refreshing ? "spin 1s linear infinite" : "none",
                  }}
                />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            <div className="row g-3">
              {myPeerFeedback.map((feedbackItem) => (
                <div
                  className="col-12"
                  key={feedbackItem.peerQueueId || feedbackItem.contextFeedbackId}
                >
                  <div
                    style={{
                      background: "#FAFBFC",
                      border: "1px solid #E5E7EB",
                      borderLeft: "4px solid #97247E",
                      borderRadius: "10px",
                      padding: "1.25rem",
                      transition: "all 0.2s",
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h6
                          className="fw-bold mb-1"
                          style={{ color: "#1F2937", fontSize: "0.938rem" }}
                        >
                          {feedbackItem.submittedByName}
                        </h6>
                        <small style={{ color: "#6B7280", fontSize: "0.813rem" }}>
                          {feedbackItem.submittedDate
                            ? new Date(
                                feedbackItem.submittedDate
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                            : new Date(
                                feedbackItem.createdAt
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                        </small>
                      </div>
                      <span
                        style={{
                          display: "inline-block",
                          backgroundColor: "#F3E8FF",
                          color: "#8B5CF6",
                          padding: "6px 12px",
                          fontSize: "0.688rem",
                          fontWeight: 700,
                          borderRadius: "6px",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Peer Feedback
                      </span>
                    </div>
                    <p
                      className="mb-0"
                      style={{
                        lineHeight: "1.6",
                        color: "#374151",
                        fontSize: "0.875rem",
                      }}
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
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        }
        
        .btn:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
