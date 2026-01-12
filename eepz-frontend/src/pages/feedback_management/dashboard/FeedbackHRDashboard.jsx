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
  managerReviewApi,
} from "../../../services/feedbackmanagement/feedbackApi";
import { hrFormApi } from "../../../services/feedbackmanagement/hrFormApi";
import FeedbackBreadcrumb from "../../../components/feedback_management/common/FeedbackBreadcrumb";
import "../../../styles/feedback/components/FeedbackHRDashboard.css";

const StatCard = ({ label, value, Icon, color, bgColor }) => (
  <div className="fb-hr-stat-card">
    <div className="fb-hr-stat-card__row">
      <div className="fb-hr-stat-card__icon" data-bg={bgColor.replace("#", "")}>
        <Icon
          size={28}
          className="fb-hr-stat-card__icon-svg"
          data-color={color.replace("#", "")}
        />
      </div>
      <div className="fb-hr-stat-card__info">
        <h2 className="fb-hr-stat-card__value">{value}</h2>
        <p className="fb-hr-stat-card__label">{label}</p>
      </div>
    </div>
  </div>
);

const HeroActionCard = ({
  title,
  description,
  icon: Icon,
  to,
  iconBg,
  iconColor,
}) => (
  <Link to={to} className="fb-hr-action-card-link">
    <div className="fb-hr-action-card">
      <div
        className="fb-hr-action-card__icon-wrapper"
        data-bg={iconBg.replace("#", "")}
      >
        <Icon
          size={24}
          className="fb-hr-action-card__icon-svg"
          data-color={iconColor.replace("#", "")}
        />
      </div>
      <div className="fb-hr-action-card__content">
        <h5 className="fb-hr-action-card__title">{title}</h5>
        <p className="fb-hr-action-card__desc">{description}</p>
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
  const [feedback, setFeedback] = useState([]);
  const [employeeMap, setEmployeeMap] = useState({});
  const [myPeerFeedback, setMyPeerFeedback] = useState([]);
  const [submittedForms, setSubmittedForms] = useState([]);
  const [activeHrForms, setActiveHrForms] = useState([]);
  const [myReviews, setMyReviews] = useState([]);

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
        return map;
      }
    } catch (err) {
      console.error("Error fetching employees:", err.message);
    }
    return {};
  };

  const fetchDashboardData = async (empMap = {}) => {
    setLoading(true);
    setError("");

    try {
      const hrId = user?.empId || 1001;

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
      } catch (err) {
        console.warn("Error fetching peer feedback:", err.message);
      }

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

      try {
        const activeRes = await hrFormApi.getActiveForms();
        const forms = activeRes?.data || [];
        setActiveHrForms(Array.isArray(forms) ? forms : []);
      } catch (err) {
        console.warn("Error fetching active forms:", err.message);
      }

      try {
        const submittedRes = await hrFormApi.getResponsesByEmployee(hrId);
        const forms = submittedRes?.data || [];
        setSubmittedForms(Array.isArray(forms) ? forms : []);
      } catch (err) {
        console.warn("Error fetching submitted forms:", err.message);
      }

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

  useEffect(() => {
    const loadData = async () => {
      const empMap = await fetchEmployeeMap();
      await fetchDashboardData(empMap);
    };
    loadData();
  }, [user?.empId]);

  const refresh = async () => {
    setRefreshing(true);
    const empMap = await fetchEmployeeMap();
    await fetchDashboardData(empMap);
    setRefreshing(false);
  };

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
      <div className="fb-hr-loading">
        <div className="fb-hr-spinner" role="status">
          <span className="fb-hr-visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fb-hr-dashboard">
      <div className="fb-hr-dashboard__container">
        <FeedbackBreadcrumb items={[{ label: "Feedback Management" }]} />

        {error && (
          <div className="fb-hr-alert" role="alert">
            <div className="fb-hr-alert__icon">
              <AlertTriangle size={18} />
            </div>
            <div className="fb-hr-alert__main">
              <strong>Error</strong>
              <p className="fb-hr-alert__error-text">{error}</p>
            </div>
            <button
              type="button"
              className="fb-hr-alert__close-btn"
              onClick={() => setError("")}
              aria-label="Close"
            >
              <XCircle size={18} />
            </button>
          </div>
        )}

        <div className="fb-hr-stat-cards-row">
          {stats.map((s, idx) => (
            <div key={idx} className="fb-hr-stat-cards-row__col">
              <StatCard {...s} />
            </div>
          ))}
        </div>

        <div className="fb-hr-action-cards-row">
          <HeroActionCard
            title="View All Feedback"
            description="Browse, search, and manage all feedback submissions from employees."
            icon={Search}
            to="/hr/dashboard/feedback/hrformlist"
            iconBg="#EDE9FE"
            iconColor="#8B5CF6"
          />

          <HeroActionCard
            title="Create New Form"
            description="Design and publish custom feedback forms for performance reviews."
            icon={Plus}
            to="/hr/dashboard/feedback/create-form"
            iconBg="#FECDD3"
            iconColor="#E11D48"
          />

          <HeroActionCard
            title="Submit Mentor Feedback"
            description="Provide valuable feedback and guidance to mentees and team members."
            icon={Send}
            to="/hr/dashboard/feedback/submit-mentor"
            iconBg="#DBEAFE"
            iconColor="#3B82F6"
          />
        </div>

        {myPeerFeedback.length > 0 && (
          <div className="fb-hr-peer">
            <div className="fb-hr-peer__row">
              <div>
                <h5 className="fb-hr-peer__title">Peer Feedback Received</h5>
                <p className="fb-hr-peer__desc">
                  {myPeerFeedback.length} feedback
                  {myPeerFeedback.length !== 1 ? "s" : ""} from your colleagues
                </p>
              </div>
            </div>

            <div className="fb-hr-peer-feedback-list">
              {myPeerFeedback.map((feedbackItem) => (
                <div
                  className="fb-hr-peer-feedback-list__col"
                  key={
                    feedbackItem.peerQueueId || feedbackItem.contextFeedbackId
                  }
                >
                  <div className="fb-hr-peer-feedback-card">
                    <div className="fb-hr-peer-feedback-card__row">
                      <div>
                        <h6 className="fb-hr-peer-feedback-card__name">
                          {feedbackItem.submittedByName}
                        </h6>
                        <small className="fb-hr-peer-feedback-card__date">
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
                      <span className="fb-hr-peer-feedback-card__badge">
                        Peer Feedback
                      </span>
                    </div>
                    <p className="fb-hr-peer-feedback-card__text">
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
    </div>
  );
}
