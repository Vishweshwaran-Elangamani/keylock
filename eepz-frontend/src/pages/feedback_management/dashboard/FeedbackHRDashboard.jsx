import React, { useEffect, useState, useMemo } from "react";
import {
  AlertTriangle,
  Search,
  Plus,
  Send,
  Users,
  Briefcase,
  User,
  ChartLine,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  peerQueueApi,
  employeeApi,
  mentorFeedbackApi,
} from "../../../services/feedbackmanagement/feedbackApi";
import { hrFormApi } from "../../../services/feedbackmanagement/hrFormApi";
import FeedbackBreadcrumb from "../../../components/feedback_management/common/FeedbackBreadcrumb";
import "../../../styles/feedback/components/FeedbackHRDashboard.css";

const StatCard = ({ label, value, Icon, color, bgColor }) => (
  <div className="fb-hr-stat-card">
    <div className="fb-hr-stat-card__row">
      <div className="fb-hr-stat-card__icon" data-bg={bgColor.replace("#", "")}>
        <Icon size={28} className="fb-hr-stat-card__icon-svg" data-color={color.replace("#", "")} />
      </div>
      <div className="fb-hr-stat-card__info">
        <h2 className="fb-hr-stat-card__value">{value}</h2>
        <p className="fb-hr-stat-card__label">{label}</p>
      </div>
    </div>
  </div>
);

const HeroActionCard = ({ title, description, icon: Icon, to, iconBg, iconColor }) => (
  <Link to={to} className="fb-hr-action-card-link">
    <div className="fb-hr-action-card">
      <div className="fb-hr-action-card__icon-wrapper" data-bg={iconBg.replace("#", "")}>
        <Icon size={24} className="fb-hr-action-card__icon-svg" data-color={iconColor.replace("#", "")} />
      </div>
      <div className="fb-hr-action-card__content">
        <h5 className="fb-hr-action-card__title">{title}</h5>
        <p className="fb-hr-action-card__desc">{description}</p>
      </div>
    </div>
  </Link>
);

export default function FeedbackHRDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState([]);
  const [mentorFeedback, setMentorFeedback] = useState([]);
  const [peerFeedback, setPeerFeedback] = useState([]);
  const [activeHrForms, setActiveHrForms] = useState([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");

    try {
      const [peerRes, mentorRes, activeFormsRes] = await Promise.all([
        peerQueueApi.list(1, 1000),
        mentorFeedbackApi.list(1, 1000),
        hrFormApi.getActiveForms(),
      ]);

      const peerData = Array.isArray(peerRes?.data)
        ? peerRes.data
        : peerRes?.data?.data || [];

      const mentorData = Array.isArray(mentorRes?.data)
        ? mentorRes.data
        : mentorRes?.data?.data || [];

      const activeForms = Array.isArray(activeFormsRes?.data)
        ? activeFormsRes.data
        : [];

      setPeerFeedback(peerData);
      setMentorFeedback(mentorData);
      setFeedback([...peerData, ...mentorData]);
      setActiveHrForms(activeForms);
    } catch (err) {
      setError(err?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const feedbackThisMonth = useMemo(() => {
    return feedback.filter((f) => {
      const d = new Date(f.createdAt || f.submittedDate);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [feedback]);

  const stats = useMemo(() => {
    return [
      {
        label: "Total Feedback",
        value: feedback.length,
        Icon: Briefcase,
        color: "#3B82F6",
        bgColor: "#DBEAFE",
      },
      {
        label: "This Month",
        value: feedbackThisMonth,
        Icon: ChartLine,
        color: "#3B82F6",
        bgColor: "#DBEAFE",
      },
      {
        label: "Mentor Feedback",
        value: mentorFeedback.length,
        Icon: User,
        color: "#8B5CF6",
        bgColor: "#EDE9FE",
      },
      {
        label: "Peer Feedback",
        value: peerFeedback.length,
        Icon: Users,
        color: "#F59E0B",
        bgColor: "#FEF3C7",
      },
    ];
  }, [feedback, mentorFeedback, peerFeedback, feedbackThisMonth]);

  if (loading) {
    return <div className="fb-hr-loading"><div className="fb-hr-spinner"></div></div>;
  }

  return (
    <div className="fb-hr-dashboard">
      <div className="fb-hr-dashboard__container">
        <FeedbackBreadcrumb items={[{ label: "Feedback Management" }]} />

        {error && (
          <div className="fb-hr-alert">
            <AlertTriangle size={18} />
            <p>{error}</p>
          </div>
        )}

        <div className="fb-hr-stat-cards-row">
          {stats.map((s, idx) => (
            <div key={idx} className="fb-hr-stat-cards-row__col">
              <StatCard {...s} />
            </div>
          ))}
        </div>

         <div className="fm-lnd-header">
        <h3>Feedback Management</h3>
        <p> View the Feedbacks given, Design new forms , submits feedbacks for mentor </p>
      </div>

        <div className="fb-hr-action-cards-row">
          <HeroActionCard title="View All Feedback" description="Browse and manage feedback submissions." icon={Search} to="/hr/dashboard/feedback/hrformlist" iconBg="#EDE9FE" iconColor="#8B5CF6" />
          <HeroActionCard title="Create New Form" description="Design new HR feedback forms." icon={Plus} to="/hr/dashboard/feedback/create-form" iconBg="#FECDD3" iconColor="#E11D48" />
          <HeroActionCard title="Submit Mentor Feedback" description="Provide feedback to employees." icon={Send} to="/hr/dashboard/feedback/submit-mentor" iconBg="#DBEAFE" iconColor="#3B82F6" />
        </div>
      </div>
    </div>
  );
}
