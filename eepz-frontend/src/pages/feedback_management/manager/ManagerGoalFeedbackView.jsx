import React, { useEffect, useState, useMemo } from "react";
import {
  RefreshCw,
  AlertTriangle,
  Target,
  Calendar,
  MessageCircle,
  Star,
  User,
  Briefcase,
  ArrowLeft,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../../styles/feedback/components/ManagerGoalFeedbackView.css";

const API_BASE = import.meta.env.VITE_API_BASE;

const RATING_LABELS = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

export default function ManagerGoalFeedbackView() {
  const navigate = useNavigate();
  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "{}") || {},
    []
  );
  const isManager =
    user?.role?.toLowerCase() === "manager" ||
    user?.roleName?.toLowerCase() === "manager";

  const [activeTab, setActiveTab] = useState("myFeedback");
  const [myGoalFeedback, setMyGoalFeedback] = useState([]);
  const [teamGoalFeedback, setTeamGoalFeedback] = useState([]);
  const [objectives, setObjectives] = useState({});
  const [employeeMap, setEmployeeMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const formatDate = (dateInput) => {
    if (!dateInput) return "—";
    try {
      const dateObj = new Date(dateInput);
      if (isNaN(dateObj.getTime()) || dateObj.getFullYear() < 2000) return "—";
      return dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API_BASE}/EmployeeManagement/all`);
      if (response.data?.success && Array.isArray(response.data.data)) {
        const map = {};
        response.data.data.forEach((emp) => {
          map[emp.employeeId] = `${emp.firstName} ${emp.lastName}`;
        });
        setEmployeeMap(map);
      }
    } catch (err) {
      console.error("Error fetching employees:", err.message);
    }
  };

  const fetchObjectives = async () => {
    try {
      const response = await axios.get(`${API_BASE}/Orgwideobjectives`);
      const objectivesData = response.data?.data || response.data || [];
      if (Array.isArray(objectivesData)) {
        const objMap = {};
        objectivesData.forEach((obj) => {
          objMap[obj.objectiveId] =
            obj.title || obj.objectiveName || `Objective ${obj.objectiveId}`;
        });
        setObjectives(objMap);
      }
    } catch (err) {
      console.error("Error loading objectives:", err.message);
    }
  };

  const fetchGoalFeedback = async () => {
    setLoading(true);
    setError("");

    try {
      const empId = user?.empId;
      if (!empId) {
        setError("Employee ID not found");
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_BASE}/OrgGoalFeedback/all`, {
        params: {
          pageNumber: 1,
          pageSize: 100,
        },
      });

      if (response.data?.success && Array.isArray(response.data.data)) {
        const allFeedback = response.data.data;

        const myFeedback = allFeedback
          .filter((f) => Number(f.submittedByEmployeeId) === Number(empId))
          .map((f) => ({
            ...f,
            objectiveTitle:
              f.organizationGoalName ||
              objectives[f.organizationObjectiveId] ||
              `Objective #${f.organizationObjectiveId}`,
            submitterName:
              employeeMap[f.submittedByEmployeeId] ||
              f.submitterName ||
              `Employee ${f.submittedByEmployeeId}`,
            formattedDate: formatDate(f.createdAt),
          }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setMyGoalFeedback(myFeedback);

        if (isManager) {
          const teamFeedback = allFeedback
            .filter((f) => {
              if (f.managerEmployeeId) {
                return Number(f.managerEmployeeId) === Number(empId);
              }
              return Number(f.submittedByEmployeeId) !== Number(empId);
            })
            .map((f) => ({
              ...f,
              objectiveTitle:
                f.organizationGoalName ||
                objectives[f.organizationObjectiveId] ||
                `Objective #${f.organizationObjectiveId}`,
              submitterName:
                employeeMap[f.submittedByEmployeeId] ||
                f.submitterName ||
                `Employee ${f.submittedByEmployeeId}`,
              formattedDate: formatDate(f.createdAt),
            }))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

          setTeamGoalFeedback(teamFeedback);
        }
      } else {
        setMyGoalFeedback([]);
        setTeamGoalFeedback([]);
      }
    } catch (err) {
      console.error("Error fetching goal feedback:", err);
      setError("Failed to load goal feedback. Please try refreshing.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchEmployees();
      await fetchObjectives();
      await fetchGoalFeedback();
    };

    if (user?.empId) {
      loadData();
    }
  }, [user?.empId]);

  const renderFeedbackCard = (feedback, showSubmitter = false) => (
    <div className="mgfv-col" key={feedback.orgGoalFeedbackId}>
      <div className="mgfv-card">
        <div className="mgfv-card-body">
          <div className="mgfv-card-header">
            <div className="mgfv-card-header-left">
              <div className="mgfv-title-row">
                <Target size={16} className="mgfv-title-icon" />
                <h6 className="mgfv-objective-title">
                  {feedback.objectiveTitle}
                </h6>
              </div>
              {showSubmitter && (
                <div className="mgfv-submitter-row">
                  <User size={14} className="mgfv-submitter-icon" />
                  <small className="mgfv-submitter-text">
                    {feedback.submitterName}
                  </small>
                </div>
              )}
              <div className="mgfv-date-row">
                <Calendar size={14} className="mgfv-date-icon" />
                <small className="mgfv-date-text">
                  {feedback.formattedDate}
                </small>
              </div>
            </div>
            <div className="mgfv-header-right">
              <div className="mgfv-rating-row">
                <Star size={16} className="mgfv-star-icon" />
                <span className="mgfv-rating-value">{feedback.rating}/5</span>
              </div>
              <span className="mgfv-rating-badge">
                {RATING_LABELS[feedback.rating] || "N/A"}
              </span>
            </div>
          </div>

          <div className="mgfv-meta-row">
            <span
              className={`mgfv-feedback-type-badge ${
                feedback.feedbackFrom === "Manager"
                  ? "mgfv-feedback-type-manager"
                  : "mgfv-feedback-type-employee"
              }`}
            >
              {feedback.feedbackFrom || "Employee"} Feedback
            </span>
            {feedback.isAnonymous && (
              <span className="mgfv-anon-badge">Anonymous</span>
            )}
          </div>

          {feedback.feedbackComments && (
            <div className="mgfv-comments-block">
              <div className="mgfv-comments-header">
                <MessageCircle size={14} className="mgfv-comments-icon" />
                <h6 className="mgfv-comments-title">Comments</h6>
              </div>
              <p className="mgfv-comments-text">
                {feedback.feedbackComments.length > 100
                  ? feedback.feedbackComments.substring(0, 100) + "..."
                  : feedback.feedbackComments}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="mgfv-loading-page">
        <div className="mgfv-loading-content">
          <RefreshCw size={40} className="mgfv-loading-icon" />
          <p className="mgfv-loading-text">Loading goal feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mgfv-page">
      <div className="mgfv-container">
        <div className="mgfv-header">
          <button
            className="mgfv-btn mgfv-btn-outline mgfv-back-btn"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={16} />
          </button>
          <div className="mgfv-header-main">
            <h2 className="mgfv-title">
              <Target size={24} className="mgfv-title-leading-icon" />
              Goal Feedback - Manager View
            </h2>
            <p className="mgfv-subtitle">
              View your submissions and team feedback on organizational goals
            </p>
          </div>
          <button
            className="mgfv-btn mgfv-btn-outline mgfv-refresh-btn"
            onClick={() => {
              fetchEmployees();
              fetchObjectives();
              fetchGoalFeedback();
            }}
            disabled={loading}
            title="Refresh"
          >
            <RefreshCw
              size={18}
              className={loading ? "mgfv-refresh-icon-spin" : ""}
            />
          </button>
        </div>

        {error && (
          <div className="mgfv-alert mgfv-alert-error">
            <AlertTriangle size={18} className="mgfv-alert-icon" />
            <span className="mgfv-alert-text">
              <strong>Error:</strong> {error}
            </span>
            <button
              type="button"
              className="mgfv-alert-close"
              onClick={() => setError("")}
            />
          </div>
        )}

        <div className="mgfv-tabs-card">
          <div className="mgfv-tabs-body">
            <button
              type="button"
              className={`mgfv-tab-btn ${
                activeTab === "myFeedback" ? "mgfv-tab-btn-active" : ""
              }`}
              onClick={() => setActiveTab("myFeedback")}
            >
              <User size={16} className="mgfv-tab-icon" />
              My Feedback ({myGoalFeedback.length})
            </button>
            {isManager && (
              <button
                type="button"
                className={`mgfv-tab-btn ${
                  activeTab === "teamFeedback" ? "mgfv-tab-btn-active" : ""
                }`}
                onClick={() => setActiveTab("teamFeedback")}
              >
                <Briefcase size={16} className="mgfv-tab-icon" />
                Team Feedback ({teamGoalFeedback.length})
              </button>
            )}
          </div>
        </div>

        {activeTab === "myFeedback" && (
          <>
            {myGoalFeedback.length === 0 ? (
              <div className="mgfv-empty-card">
                <Target size={48} className="mgfv-empty-icon" />
                <h5 className="mgfv-empty-title">
                  No goal feedback submitted yet
                </h5>
                <p className="mgfv-empty-text">
                  Submit feedback on organizational objectives to see them here
                </p>
              </div>
            ) : (
              <div className="mgfv-grid">
                {myGoalFeedback.map((feedback) =>
                  renderFeedbackCard(feedback, false)
                )}
              </div>
            )}
          </>
        )}

        {activeTab === "teamFeedback" && isManager && (
          <>
            {teamGoalFeedback.length === 0 ? (
              <div className="mgfv-empty-card">
                <Users size={48} className="mgfv-empty-icon" />
                <h5 className="mgfv-empty-title">No team feedback yet</h5>
                <p className="mgfv-empty-text">
                  Goal feedback from your team members will appear here
                </p>
              </div>
            ) : (
              <div className="mgfv-grid">
                {teamGoalFeedback.map((feedback) =>
                  renderFeedbackCard(feedback, true)
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
