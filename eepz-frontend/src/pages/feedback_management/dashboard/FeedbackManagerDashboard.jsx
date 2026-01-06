import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  RefreshCw,
  AlertTriangle,
  FileText,
  Plus,
  Send,
  Search,
  Eye,
  Star,
  Users,
  Target,
  Briefcase,
  MessageSquare,
  Loader,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  peerQueueApi,
  hrFormApi,
  managerReviewApi,
} from "../../../services/feedbackmanagement/feedbackApi";
import FeedbackBreadcrumb from "../../../components/feedback_management/common/FeedbackBreadcrumb";
import "../../../styles/feedback/components/FeedbackManagerDashboard.css";

const getFeedbackDashboardPath = (roleName) => {
  const routes = {
    Employee: "/employee/dashboard/feedback",
    Manager: "/manager/dashboard/feedback",
    DepartmentHead: "/depthead/dashboard/feedback",
    "Department Head": "/depthead/dashboard/feedback",
    HR: "/hr/dashboard/feedback",
  };
  return routes[roleName] || "/hr/dashboard/feedback";
};

export default function FeedbackManagerDashboard() {
  const user = useMemo(
    () =>
      JSON.parse(localStorage.getItem("user") || "{}") || {
        empId: 1002,
        firstName: "Manager",
        lastName: "User",
        roleName: "Manager",
      },
    []
  );

  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab] = useState("overview");

  const [myReviews, setMyReviews] = useState([]);
  const [myPeerFeedback, setMyPeerFeedback] = useState([]);
  const [allForms, setAllForms] = useState([]);
  const [submittedFormIds, setSubmittedFormIds] = useState(new Set());

  const fetchMyReviews = useCallback(
    async (retryCount = 0) => {
      if (!user?.empId) return;
      try {
        const myRes = await managerReviewApi.getByManager(user.empId);
        const reviewsData = Array.isArray(myRes?.data)
          ? myRes.data
          : Array.isArray(myRes?.data?.data)
          ? myRes.data.data
          : [];
        setMyReviews(reviewsData);
      } catch (err) {
        console.error("Error fetching my reviews:", err);
        setMyReviews([]);
        if (retryCount < 1 && err?.response?.status >= 500) {
          setTimeout(() => fetchMyReviews(retryCount + 1), 2000);
        }
      }
    },
    [user?.empId]
  );

  const fetchPeerFeedback = useCallback(
    async (retryCount = 0) => {
      if (!user?.empId) return;
      try {
        const approvedRes = await peerQueueApi.approved();
        const approvedData = Array.isArray(approvedRes?.data)
          ? approvedRes.data
          : Array.isArray(approvedRes?.data?.data)
          ? approvedRes.data.data
          : [];

        const myFeedback = approvedData.filter(
          (p) => Number(p.recipientEmployeeId) === Number(user.empId)
        );
        setMyPeerFeedback(myFeedback);
      } catch (err) {
        console.error("Error fetching peer feedback:", err);
        setMyPeerFeedback([]);
        if (retryCount < 1 && err?.response?.status >= 500) {
          setTimeout(() => fetchPeerFeedback(retryCount + 1), 2000);
        }
      }
    },
    [user?.empId]
  );

  const fetchAllForms = useCallback(
    async (retryCount = 0) => {
      if (!user?.empId) return;
      try {
        const formsRes = await hrFormApi.listForms();
        const formsData = Array.isArray(formsRes?.data)
          ? formsRes.data
          : Array.isArray(formsRes?.data?.data)
          ? formsRes.data.data
          : [];
        setAllForms(formsData);
      } catch (err) {
        console.error("Error fetching all forms:", err);
        setAllForms([]);
        if (retryCount < 1 && err?.response?.status >= 500) {
          setTimeout(() => fetchAllForms(retryCount + 1), 2000);
        }
      }
    },
    [user?.empId]
  );

  const fetchSubmittedForms = useCallback(
    async (retryCount = 0) => {
      if (!user?.empId || allForms.length === 0) return;
      try {
        const submittedIds = new Set();

        for (const form of allForms) {
          try {
            const responsesRes = await hrFormApi.byForm(form.formId);
            const responses = Array.isArray(responsesRes?.data)
              ? responsesRes.data
              : Array.isArray(responsesRes?.data?.data)
              ? responsesRes.data.data
              : [];

            const hasSubmitted = responses.some(
              (r) => Number(r.submittedByEmployeeId) === Number(user.empId)
            );

            if (hasSubmitted) {
              submittedIds.add(form.formId);
            }
          } catch (formErr) {
            console.warn(`Error checking form ${form.formId}:`, formErr.message);
          }
        }

        setSubmittedFormIds(submittedIds);
      } catch (err) {
        console.error("Error fetching submitted forms:", err);
        setSubmittedFormIds(new Set());
        if (retryCount < 1 && err?.response?.status >= 500) {
          setTimeout(() => fetchSubmittedForms(retryCount + 1), 2000);
        }
      }
    },
    [user?.empId, allForms]
  );

  const fetchDashboardData = useCallback(async () => {
    if (!user?.empId) {
      setError("User not authenticated. Please log in.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await Promise.all([fetchMyReviews(), fetchPeerFeedback()]);
      await fetchAllForms();
    } catch (err) {
      let msg = "Failed to load dashboard data.";
      if (err?.response?.status === 404) {
        msg = "Endpoint not found. Please contact support.";
      } else if (
        err?.code === "ECONNABORTED" ||
        err?.message?.includes("timeout")
      ) {
        msg = "Request timeout. Please try again.";
      } else {
        msg = err?.response?.data?.message || err?.message || msg;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [user?.empId, fetchMyReviews, fetchPeerFeedback, fetchAllForms]);

  useEffect(() => {
    if (allForms.length > 0) {
      fetchSubmittedForms();
    }
  }, [allForms, fetchSubmittedForms]);

  useEffect(() => {
    if (user?.empId) {
      fetchDashboardData();
    }
  }, [user?.empId, fetchDashboardData]);

  const stats = useMemo(() => {
    const pending = allForms.filter((f) => !submittedFormIds.has(f.formId))
      .length;

    return {
      myReviews: myReviews.length,
      pendingForms: pending,
      peerFeedback: myPeerFeedback.length,
    };
  }, [myReviews, myPeerFeedback, allForms, submittedFormIds]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, [fetchDashboardData]);

  const feedbackDashboardPath = user?.roleName
    ? getFeedbackDashboardPath(user.roleName)
    : "/manager/dashboard/feedback";

  return (
    <div className="fm-mgrdash-page-wrapper">
      <FeedbackBreadcrumb
        items={[
          { label: "Feedback Management", path: feedbackDashboardPath },
          { label: "Manager Dashboard" },
        ]}
      />

      {error && (
        <div className="fm-mgrdash-error-alert">
          <AlertTriangle size={18} className="fm-mgrdash-error-alert__icon" />
          <div className="fm-mgrdash-error-alert__content">
            <strong>Error:</strong> {error}
          </div>
          <button
            className="fm-mgrdash-error-alert__close"
            onClick={() => setError("")}
            title="Close"
            type="button"
          >
            ×
          </button>
        </div>
      )}

      <div className="fm-mgrdash-stats">
        <div className="fm-mgrdash-stat-card">
          <div className="fm-mgrdash-stat-card__icon fm-mgrdash-stat-card__icon--blue">
            <Star size={24} strokeWidth={2.5} />
          </div>
          <div className="fm-mgrdash-stat-card__content">
            <h2 className="fm-mgrdash-stat-card__value">{stats.myReviews}</h2>
            <p className="fm-mgrdash-stat-card__label">MY REVIEWS</p>
          </div>
        </div>

        <div className="fm-mgrdash-stat-card">
          <div className="fm-mgrdash-stat-card__icon fm-mgrdash-stat-card__icon--red">
            <FileText size={24} strokeWidth={2.5} />
          </div>
          <div className="fm-mgrdash-stat-card__content">
            <h2 className="fm-mgrdash-stat-card__value">{stats.pendingForms}</h2>
            <p className="fm-mgrdash-stat-card__label">PENDING FORMS</p>
          </div>
        </div>

        <div className="fm-mgrdash-stat-card">
          <div className="fm-mgrdash-stat-card__icon fm-mgrdash-stat-card__icon--green">
            <Users size={24} strokeWidth={2.5} />
          </div>
          <div className="fm-mgrdash-stat-card__content">
            <h2 className="fm-mgrdash-stat-card__value">{stats.peerFeedback}</h2>
            <p className="fm-mgrdash-stat-card__label">PEER FEEDBACK</p>
          </div>
        </div>
      </div>

      <div className="fm-mgrdash-content">
        {loading ? (
          <div className="fm-mgrdash-loading">
            <Loader size={48} className="fm-mgrdash-loading__spinner" />
            <p className="fm-mgrdash-loading__text">Loading dashboard...</p>
          </div>
        ) : (
          <div className="fm-mgrdash-actions-grid">
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
