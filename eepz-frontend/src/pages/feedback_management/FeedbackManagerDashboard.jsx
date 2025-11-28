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
import FeedbackBreadcrumb from "../../components/feedback_management/common/FeedbackBreadcrumb";
import "../../styles/feedback/FeedbackManagerDashboard.css";

const StatCard = ({ label, value, Icon, bgColor, iconColor }) => (
  <div className="fm-mgrdash-stat-card">
    <div className="fm-mgrdash-stat-card__body">
      <div
        className="fm-mgrdash-stat-card__icon"
        style={{ backgroundColor: bgColor }}
      >
        <Icon size={28} color={iconColor} strokeWidth={2.5} />
      </div>
      <h2 className="fm-mgrdash-stat-card__value">{value}</h2>
      <p className="fm-mgrdash-stat-card__label">{label}</p>
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
        roleName: "Manager",
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
      <div className="fm-mgrdash-loading">
        <div className="spinner-border fm-mgrdash-loading__spinner">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fm-mgrdash-page-wrapper">
      {/* Breadcrumb */}
      <FeedbackBreadcrumb
        items={[
          { label: "Feedback Management", path: "/manager/dashboard/feedback" },
          { label: "Manager Dashboard" },
        ]}
      />

      {/* Error Alert */}
      {error && (
        <div className="fm-mgrdash-error-alert alert alert-danger alert-dismissible fade show">
          <AlertTriangle size={16} className="flex-shrink-0 fm-mgrdash-error-alert__icon" />
          <div className="flex-grow-1">
            <p className="mb-0 fm-mgrdash-error-alert__text">{error}</p>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={() => setError("")}
          />
        </div>
      )}

      {/* Stats Cards */}
      <div className="fm-mgrdash-stats">
        {stats.map((s, idx) => (
          <StatCard key={idx} {...s} />
        ))}
      </div>

      {/* Tabs */}
      <div className="fm-mgrdash-tabs-wrapper">
        <ul className="fm-mgrdash-tabs">
          <li className="fm-mgrdash-tabs__item">
            <button
              className={`fm-mgrdash-tabs__button ${
                activeTab === "overview" ? "fm-mgrdash-tabs__button--active" : ""
              }`}
              onClick={() => setActiveTab("overview")}
            >
              <Briefcase size={16} />
              <span>Quick Actions</span>
            </button>
          </li>
        </ul>
      </div>

      {/* Content Area */}
      <div className="fm-mgrdash-content">
        {/* Overview Tab - Quick Actions */}
        {activeTab === "overview" && (
          <div className="fm-mgrdash-actions-grid">
            {/* Manager Functions */}
            <Link
              to="/manager/dashboard/feedback/create-review"
              className="fm-mgrdash-action-card"
            >
              <div className="fm-mgrdash-action-card__icon-wrapper fm-mgrdash-action-card__icon-wrapper--primary">
                <Plus size={20} />
              </div>
              <span className="fm-mgrdash-action-card__label">
                Create Review
              </span>
            </Link>

            <Link
              to="/manager/dashboard/feedback/all-review"
              className="fm-mgrdash-action-card"
            >
              <div className="fm-mgrdash-action-card__icon-wrapper fm-mgrdash-action-card__icon-wrapper--primary">
                <Eye size={20} />
              </div>
              <span className="fm-mgrdash-action-card__label">
                All Reviews
              </span>
            </Link>

            <Link
              to="/manager/dashboard/feedback/team"
              className="fm-mgrdash-action-card"
            >
              <div className="fm-mgrdash-action-card__icon-wrapper fm-mgrdash-action-card__icon-wrapper--primary">
                <Users size={20} />
              </div>
              <span className="fm-mgrdash-action-card__label">
                Peer Feedback Received
              </span>
            </Link>

            <Link
              to="/manager/dashboard/feedback/team-submissions"
              className="fm-mgrdash-action-card"
            >
              <div className="fm-mgrdash-action-card__icon-wrapper fm-mgrdash-action-card__icon-wrapper--primary">
                <FileText size={20} />
              </div>
              <span className="fm-mgrdash-action-card__label">
                Team Submissions
              </span>
            </Link>

            {/* Employee-like actions */}
            <Link
              to="/manager/dashboard/feedback/submit-mentor"
              className="fm-mgrdash-action-card"
            >
              <div className="fm-mgrdash-action-card__icon-wrapper fm-mgrdash-action-card__icon-wrapper--secondary">
                <Send size={20} />
              </div>
              <span className="fm-mgrdash-action-card__label">
                Mentor Feedback
              </span>
            </Link>

            <Link
              to="/manager/dashboard/feedback/contextfeedback"
              className="fm-mgrdash-action-card"
            >
              <div className="fm-mgrdash-action-card__icon-wrapper fm-mgrdash-action-card__icon-wrapper--secondary">
                <MessageSquare size={20} />
              </div>
              <span className="fm-mgrdash-action-card__label">
                Context Feedback
              </span>
            </Link>

            <Link
              to="/manager/dashboard/feedback/assignedform"
              className="fm-mgrdash-action-card"
            >
              <div className="fm-mgrdash-action-card__icon-wrapper fm-mgrdash-action-card__icon-wrapper--secondary">
                <Target size={20} />
              </div>
              <span className="fm-mgrdash-action-card__label">
                Assigned Forms
              </span>
            </Link>

            <Link
              to="/manager/dashboard/feedback/submissions"
              className="fm-mgrdash-action-card"
            >
              <div className="fm-mgrdash-action-card__icon-wrapper fm-mgrdash-action-card__icon-wrapper--secondary">
                <Search size={20} />
              </div>
              <span className="fm-mgrdash-action-card__label">
                My Submissions
              </span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
