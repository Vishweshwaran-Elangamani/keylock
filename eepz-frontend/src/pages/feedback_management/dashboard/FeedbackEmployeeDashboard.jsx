import React, { useEffect, useState, useMemo } from "react";
import {
  RefreshCw,
  AlertTriangle,CheckCircle,Clock,Send,Search,Eye,Zap,
  Star, Users, Award, MessageSquare,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  peerQueueApi,
  smeApi,
  hrFormApi,
  managerReviewApi,
  employeeApi,
  mentorFeedbackApi,
} from "../../../services/feedbackmanagement/feedbackApi";
import "../../../styles/feedback/components/FeedbackEmployeeDashboard.css";
import Breadcrumb from "../../../components/feedback_management/common/FeedbackBreadcrumb";

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

const StatCard = ({ label, value, Icon, bgColor, iconColor }) => (
  <div className="fm-empdb-stat-card">
    <div className="fm-empdb-stat-card__icon-wrapper" data-bg={bgColor.replace("#", "")} >
      <Icon size={24} data-color={iconColor.replace("#", "")} strokeWidth={2.5}/>
    </div>
    <div className="fm-empdb-stat-card__content">
      <h2 className="fm-empdb-stat-card__value">{value}</h2>
      <p className="fm-empdb-stat-card__label">{label}</p>
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
            const feedbackResponse = await mentorFeedbackApi.aboutMe(empId);
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

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");

    try {
      const empId = user?.empId || 1004;

      await checkIfMentor();

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

      try {
        const activeRes = await hrFormApi.listActive();
        const formsData = activeRes?.data || [];
        setActiveHrForms(Array.isArray(formsData) ? formsData : []);
      } catch (err) {
        console.warn("Error fetching active forms:", err.message);
        setActiveHrForms([]);
      }

      try {
        const allFormsRes = await hrFormApi.listForms();
        const allForms = Array.isArray(allFormsRes?.data)
          ? allFormsRes.data
          : allFormsRes?.data?.data || [];

        let allMyResponses = [];

        for (const form of allForms) {
          try {
            const responsesRes = await hrFormApi.byForm(form.formId);
            const responses = Array.isArray(responsesRes?.data)
              ? responsesRes.data
              : responsesRes?.data?.data || [];

            const myResponses = responses.filter(
              (r) => Number(r.employeeId) === Number(empId)
            );
            allMyResponses = [...allMyResponses, ...myResponses];
          } catch (err) {
            console.warn(
              `Error fetching responses for form ${form.formId}:`,
              err.message
            );
          }
        }

        setSubmittedForms(allMyResponses);
      } catch (err) {
        console.warn("Error fetching submitted forms:", err.message);
        setSubmittedForms([]);
      }

      try {
        const reviewRes = await managerReviewApi.getForTarget(empId);
        const reviewsData = Array.isArray(reviewRes?.data)
          ? reviewRes.data
          : reviewRes?.data?.data || [];
        setMyReviews(reviewsData);
      } catch (err) {
        console.warn("Error fetching my reviews:", err.message);
        setMyReviews([]);
      }

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
        setMyPeerFeedback([]);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user?.empId]);

  const refresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const stats = useMemo(() => {
    const submittedFormIds = new Set(submittedForms.map((f) => f.formId));
    const pending = activeHrForms.filter(
      (f) => !submittedFormIds.has(f.formId)
    ).length;
    const submitted = submittedForms.length;

    return [
      {
        label: "PENDING FORMS", value: pending, Icon: Clock, bgColor: "#fef3c7", iconColor: "#E2B93B",
      },
      
      {
        label: "SUBMITTED FORMS",value: submitted,Icon: CheckCircle,bgColor: "#dcfce7",iconColor: "#24A148",
      },
      
      {
        label: "REVIEWS RECEIVED",  value: myReviews.length, Icon: Star, bgColor: "#dbeafe", iconColor: "#0F62FE",
      },
      {
        label: "PEER FEEDBACK",value: myPeerFeedback.length,Icon: Users,bgColor: "#f8f0ff",iconColor: "#9D4EDD",
      },
    ];
  }, [activeHrForms, submittedForms, myReviews, myPeerFeedback]);

  if (loading) {
    return (
      <div className="fm-empdb-loading">
        <div className="fm-empdb-spinner" role="status">
          <span className="fm-empdb-spinner__text">Loading...</span>
        </div>
      </div>
    );
  }

  const feedbackDashboardPath = user?.roleName
    ? getFeedbackDashboardPath(user.roleName)
    : "/hr/dashboard/feedback";

  return (
    <div className="fm-empdb-page-wrapper">
      <Breadcrumb
        items={[
          { label: "Feedback Management", path: feedbackDashboardPath },
          { label: "Employee" },
        ]}
      />

      {error && (
        <div className="fm-empdb-alert" role="alert">
          <div className="fm-empdb-alert__icon">
            <AlertTriangle size={16} />
          </div>
          <div className="fm-empdb-alert__content">
            <p className="fm-empdb-alert__text">{error}</p>
          </div>
          <button type="button" className="fm-empdb-alert__close"
            onClick={() => setError("")} aria-label="Close"/>
        </div>
      )}

      <div className="fm-empdb-stats-grid">
        {stats.map((s, idx) => (
          <div key={idx} className="fm-empdb-stats-grid__item">
            <StatCard {...s} />
          </div>
        ))}
      </div>

      <div className="fm-empdb-content">
        <div className="fm-empdb-actions-grid">
          <div className="fm-empdb-actions-grid__item">
            <Link
              to="/employee/dashboard/feedback/submit-mentor"
              className="fm-empdb-action-card"
            >
              <div className="fm-empdb-action-card__icon-wrapper fm-empdb-action-card__icon-wrapper--primary">
                <Send size={20} className="fm-empdb-action-card__icon" />
              </div>
              <span className="fm-empdb-action-card__label">
                Mentor Feedback
              </span>
            </Link>
          </div>

          <div className="fm-empdb-actions-grid__item">
            <Link
              to="/employee/dashboard/feedback/contextfeedback"
              className="fm-empdb-action-card"
            >
              <div className="fm-empdb-action-card__icon-wrapper fm-empdb-action-card__icon-wrapper--primary">
                <MessageSquare
                  size={20}
                  className="fm-empdb-action-card__icon"
                />
              </div>
              <span className="fm-empdb-action-card__label">
                Context Feedback
              </span>
            </Link>
          </div>

          <div className="fm-empdb-actions-grid__item">
            <Link
              to="/employee/dashboard/feedback/assignedform"
              className="fm-empdb-action-card"
            >
              <div className="fm-empdb-action-card__icon-wrapper fm-empdb-action-card__icon-wrapper--primary">
                <Eye size={20} className="fm-empdb-action-card__icon" />
              </div>
              <span className="fm-empdb-action-card__label">
                Assigned Forms
              </span>
            </Link>
          </div>

          <div className="fm-empdb-actions-grid__item">
            <Link
              to="/employee/dashboard/feedback/submit-peer"
              className="fm-empdb-action-card fm-empdb-action-card--peer"
            >
              <div className="fm-empdb-action-card__icon-wrapper fm-empdb-action-card__icon-wrapper--peer">
                <Users size={20} className="fm-empdb-action-card__icon" />
              </div>
              <span className="fm-empdb-action-card__label">
                Peer Feedback Received
              </span>
            </Link>
          </div>

          <div className="fm-empdb-actions-grid__item">
            <Link
              to="/employee/dashboard/feedback/submissions"
              className="fm-empdb-action-card fm-empdb-action-card--submissions"
            >
              <div className="fm-empdb-action-card__icon-wrapper fm-empdb-action-card__icon-wrapper--submissions">
                <Search size={20} className="fm-empdb-action-card__icon" />
              </div>
              <span className="fm-empdb-action-card__label">
                My Submissions
              </span>
            </Link>
          </div>

          {isMentor && (
            <div className="fm-empdb-actions-grid__item">
              <Link
                to="/employee/dashboard/feedback/mentor"
                className="fm-empdb-action-card fm-empdb-action-card--sme"
              >
                <div className="fm-empdb-action-card__icon-wrapper fm-empdb-action-card__icon-wrapper--sme">
                  <Award size={20} className="fm-empdb-action-card__icon" />
                </div>
                <span className="fm-empdb-action-card__label">
                  SME Dashboard
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
