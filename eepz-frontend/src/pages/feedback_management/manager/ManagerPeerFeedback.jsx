import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  RefreshCw,
  AlertTriangle,
  Users,
  User,
  Calendar,
  MessageCircle,
  Lock,
  Loader,
} from "lucide-react";
import {
  peerQueueApi,
  employeeApi,
} from "../../../services/feedbackmanagement/feedbackApi";
import FeedbackBreadcrumb from "../../../components/feedback_management/common/FeedbackBreadcrumb";
import "../../../styles/feedback/components/ManagerPeerFeedback.css";

const getFeedbackDashboardPath = (roleName) => {
  const routes = {
    Employee: "/employee/dashboard/feedback",
    Manager: "/manager/dashboard/feedback",
    DepartmentHead: "/depthead/dashboard/feedback",
    "Department Head": "/depthead/dashboard/feedback",
    HR: "/hr/dashboard/feedback",
  };
  return routes[roleName] || "/manager/dashboard/feedback";
};

export default function ManagerPeerFeedback() {
  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "{}") || {},
    []
  );

  const [peerFeedback, setPeerFeedback] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [employeeMap, setEmployeeMap] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  // Safe date formatting
  const formatDate = useCallback((dateInput) => {
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
  }, []);

  // Check if feedback is anonymous
  const checkIsAnonymous = useCallback((feedback) => {
    return Boolean(
      feedback.isAnonymous === true ||
        feedback.isAnonymous === 1 ||
        feedback.anonymous === true ||
        feedback.anonymous === 1 ||
        feedback.is_anonymous === true ||
        feedback.is_anonymous === 1 ||
        feedback.IsAnonymous === true ||
        feedback.IsAnonymous === 1
    );
  }, []);

  // Get sender display name
  const getSenderDisplayName = useCallback(
    (feedback) => {
      const isAnon = checkIsAnonymous(feedback);
      if (isAnon) return "Anonymous Peer";
      return (
        feedback.submittedByName ||
        feedback.submitterName ||
        employeeMap[feedback.submittedByEmployeeId] ||
        `Employee ${feedback.submittedByEmployeeId}`
      );
    },
    [employeeMap, checkIsAnonymous]
  );

  // Fetch peer feedback
  const fetchPeerFeedback = useCallback(
    async (retryCount = 0) => {
      if (!user?.empId) {
        setError("User not authenticated. Please log in.");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const empId = user.empId;

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

        // Fetch approved peer feedback
        try {
          const peerRes = await peerQueueApi.approved();
          const feedbackData = Array.isArray(peerRes?.data)
            ? peerRes.data
            : peerRes?.data?.data || [];

          if (Array.isArray(feedbackData)) {
            const myFeedback = feedbackData
              .filter((p) => Number(p.recipientEmployeeId) === Number(empId))
              .map((p) => {
                const isAnon = checkIsAnonymous(p);
                return {
                  ...p,
                  isAnonymous: isAnon,
                  submittedByName: isAnon
                    ? "Anonymous Peer"
                    : empMap[p.submittedByEmployeeId] ||
                      `Employee ${p.submittedByEmployeeId}`,
                  formattedDate: formatDate(
                    p.submittedDate || p.createdAt || p.CreatedAt
                  ),
                };
              })
              .sort((a, b) => {
                const dateA = new Date(
                  a.submittedDate || a.createdAt || a.CreatedAt
                );
                const dateB = new Date(
                  b.submittedDate || b.createdAt || b.CreatedAt
                );
                return dateB - dateA;
              });

            setPeerFeedback(myFeedback);
          } else {
            setPeerFeedback([]);
          }
        } catch (err) {
          console.error("Error fetching peer feedback:", err);
          setPeerFeedback([]);
          let msg = "Failed to load peer feedback.";
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
          if (retryCount < 1 && err?.response?.status >= 500) {
            setTimeout(() => fetchPeerFeedback(retryCount + 1), 2000);
          }
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err?.message || "Failed to load peer feedback");
      } finally {
        setLoading(false);
      }
    },
    [user?.empId, formatDate, checkIsAnonymous]
  );

  useEffect(() => {
    if (user?.empId) {
      fetchPeerFeedback();
    }
  }, [user?.empId, fetchPeerFeedback]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPeerFeedback();
    setRefreshing(false);
  }, [fetchPeerFeedback]);

  const feedbackDashboardPath = user?.roleName
    ? getFeedbackDashboardPath(user.roleName)
    : "/manager/dashboard/feedback";

  if (loading) {
    return (
      <div className="mgrpeer-container">
        <div className="mgrpeer-loading">
          <Loader size={48} className="mgrpeer-loading-spinner" />
          <p className="mgrpeer-loading-text">Loading peer feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mgrpeer-container">
      <FeedbackBreadcrumb
        items={[
          { label: "Feedback Management", path: feedbackDashboardPath },
          { label: "Peer Feedback Received" },
        ]}
      />

      {error && (
        <div className="mgrpeer-alert-error">
          <AlertTriangle size={18} className="mgrpeer-alert-icon" />
          <div className="mgrpeer-alert-content">
            <strong>Error:</strong> {error}
          </div>
          <button
            className="mgrpeer-alert-close"
            onClick={() => setError("")}
            type="button"
          >
            ×
          </button>
        </div>
      )}

      

      {/* Content */}
      <div className="mgrpeer-content">
        {peerFeedback.length === 0 ? (
          <div className="mgrpeer-empty">
            <Users size={64} className="mgrpeer-empty-icon" />
            <h5 className="mgrpeer-empty-title">No Peer Feedback Yet</h5>
            <p className="mgrpeer-empty-text">
              You haven't received any peer feedback. Check back later for
              feedback from your colleagues.
            </p>
          </div>
        ) : (
          <div className="mgrpeer-cards-grid">
            {peerFeedback.map((feedback) => {
              const isAnon = checkIsAnonymous(feedback);
              return (
                <div
                  className="mgrpeer-card"
                  key={
                    feedback.queueId ||
                    feedback.QueueId ||
                    feedback.peerQueueId
                  }
                >
                  <div className="mgrpeer-card-header">
                    <div className="mgrpeer-card-sender">
                      <div className={`mgrpeer-card-avatar ${isAnon ? 'mgrpeer-card-avatar--anonymous' : ''}`}>
                        {isAnon ? <Lock size={18} /> : <User size={18} />}
                      </div>
                      <div className="mgrpeer-card-info">
                        <h6 className="mgrpeer-card-name">
                          {getSenderDisplayName(feedback)}
                        </h6>
                        <div className="mgrpeer-card-meta">
                          <Calendar size={12} />
                          <span>{feedback.formattedDate}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mgrpeer-card-badges">
                      {isAnon && (
                        <span className="mgrpeer-badge mgrpeer-badge--anonymous">
                          <Lock size={10} />
                          Anonymous
                        </span>
                      )}
                      <span className="mgrpeer-badge mgrpeer-badge--peer">
                        Peer
                      </span>
                    </div>
                  </div>

                  <div className="mgrpeer-card-body">
                    <div className="mgrpeer-card-feedback">
                      <div className="mgrpeer-card-feedback-header">
                        <MessageCircle size={16} />
                        <span>Feedback</span>
                      </div>
                      <p className="mgrpeer-card-feedback-text">
                        {feedback.feedbackContent ||
                          feedback.comment ||
                          feedback.feedbackComment ||
                          "No comment provided"}
                      </p>
                    </div>

                    {(feedback.context || feedback.feedbackContext) && (
                      <div className="mgrpeer-card-context">
                        <div className="mgrpeer-card-context-header">
                          Context
                        </div>
                        <p className="mgrpeer-card-context-text">
                          {feedback.context || feedback.feedbackContext}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
