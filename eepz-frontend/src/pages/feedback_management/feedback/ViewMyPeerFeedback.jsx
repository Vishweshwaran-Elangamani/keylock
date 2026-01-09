import React, { useEffect, useState, useMemo } from "react";
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
import { useNavigate } from "react-router-dom";
import {
  peerQueueApi,
  employeeApi,
} from "../../../services/feedbackmanagement/feedbackApi";
import FeedbackBreadcrumb from "../../../components/feedback_management/common/FeedbackBreadcrumb";
import "../../../styles/feedback/components/ViewMyPeerFeedback.css";

export default function ViewMyPeerFeedback() {
  const navigate = useNavigate();
  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "{}") || {},
    []
  );

  const [peerFeedback, setPeerFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [employeeMap, setEmployeeMap] = useState({});

  const formatDate = (dateInput) => {
    if (!dateInput) return "—";
    try {
      const dateObj = new Date(dateInput);
      if (isNaN(dateObj.getTime()) || dateObj.getFullYear() < 2000) return "—";
      return dateObj.toLocaleDateString("en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const checkIsAnonymous = (feedback) => {
    return Boolean(
      feedback.isAnonymous === true || feedback.isAnonymous === 1 ||
        feedback.anonymous === true || feedback.anonymous === 1 ||
         feedback.is_anonymous === true || feedback.is_anonymous === 1 ||
        feedback.IsAnonymous === true || feedback.IsAnonymous === 1
    );
  };

  const getSenderDisplayName = (feedback) => {
    const isAnon = checkIsAnonymous(feedback);

    if (isAnon) {
      return "Anonymous Peer";
    }

    return (
      feedback.submittedByName || feedback.submitterName || `Employee ${feedback.submittedByEmployeeId}`
    );
  };

  const fetchPeerFeedback = async () => {
    setLoading(true);
    setError("");

    try {
      const empId = user?.empId;

      if (!empId) {
        setError("Employee ID not found. Please log in again.");
        setLoading(false);
        return;
      }

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
        const peerRes = await peerQueueApi.list(1, 1000);

        const feedbackData = Array.isArray(peerRes?.data)
          ? peerRes.data
          : peerRes?.data?.data || [];

        if (Array.isArray(feedbackData)) {
          const myFeedback = feedbackData
            .filter((p) => {
              const isRecipient =
                Number(p.recipientEmployeeId) === Number(empId);
              const isApproved =
                p.status === "Approved" || p.Status === "Approved";

              return isRecipient && isApproved;
            })
            .map((p) => {
              const isAnon = checkIsAnonymous(p);

              return {
                ...p,
                isAnonymous: isAnon,
                submittedByName: isAnon
                  ? "Anonymous Peer"
                  : empMap[p.submittedByEmployeeId] ||
                    `Employee ${p.submittedByEmployeeId}`,
                recipientName:
                  empMap[p.recipientEmployeeId] ||
                  `Employee ${p.recipientEmployeeId}`,
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
        setError("Failed to load peer feedback. Please try refreshing.");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err?.message || "Failed to load peer feedback");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.empId) {
      fetchPeerFeedback();
    }
  }, [user?.empId]);

  if (loading) {
    return (
      <div className="fm-viewpeer-loading">
        <Loader size={40} className="fm-viewpeer-loading__spinner" />
        <p className="fm-viewpeer-loading__text">Loading peer feedback...</p>
      </div>
    );
  }

  return (
    <div className="fm-viewpeer-page-wrapper">
      <div className="fm-viewpeer-container">
        <FeedbackBreadcrumb items={[
            {
              label: "Feedback Management",
              path: "/employee/dashboard/feedback",
            },
            { label: "Peer Feedback Received" },
          ]}
        />

        {error && (
          <div className="fm-viewpeer-error-alert alert alert-danger alert-dismissible fade show">
            <AlertTriangle size={18} className="flex-shrink-0" />
            <div className="flex-grow-1">
              <strong>Error</strong>
              <p className="mb-0 mt-1">{error}</p>
            </div>
            <button type="button" className="btn-close" onClick={() => setError("")}/>
          </div>
        )}

        {peerFeedback.length > 0 && (
          <div className="fm-viewpeer-stats">
            <div className="fm-viewpeer-stat-card">
              <div className="fm-viewpeer-stat-card__icon">
                <Users size={28} />
              </div>
              <div className="fm-viewpeer-stat-card__content">
                <h3 className="fm-viewpeer-stat-card__value">
                  {peerFeedback.length}
                </h3>
                <p className="fm-viewpeer-stat-card__label">
                  Peer Feedback Received
                </p>
              </div>
            </div>
          </div>
        )}

        {peerFeedback.length === 0 ? (
          <div className="fm-viewpeer-empty">
            <Users size={48} className="fm-viewpeer-empty__icon" />
            <h5 className="fm-viewpeer-empty__title">No peer feedback yet</h5>
            <p className="fm-viewpeer-empty__text">
              Check back later for feedback from your peers
            </p>
          </div>
        ) : (
          <div className="fm-viewpeer-cards-grid">
            {peerFeedback.map((feedback) => {
              const isAnon = checkIsAnonymous(feedback);

              return (
                <div
                  className="fm-viewpeer-card"
                  key={feedback.queueId || feedback.QueueId || feedback.peerQueueId }>
                  <div
                    className={`fm-viewpeer-card__indicator ${
                      isAnon
                        ? "fm-viewpeer-card__indicator--anonymous"
                        : "fm-viewpeer-card__indicator--peer"
                    }`}
                  />

                  <div className="fm-viewpeer-card__header">
                    <div className="fm-viewpeer-card__sender">
                      {isAnon ? (
                        <Lock size={18} className="fm-viewpeer-card__icon fm-viewpeer-card__icon--anonymous"
                        />
                      ) : (
                        <User
                          size={18}
                          className="fm-viewpeer-card__icon fm-viewpeer-card__icon--peer"
                        />
                      )}
                      <h6
                        className={`fm-viewpeer-card__name ${
                          isAnon ? "fm-viewpeer-card__name--anonymous" : ""
                        }`}
                      >
                        {getSenderDisplayName(feedback)}
                      </h6>
                    </div>
                    <div className="fm-viewpeer-card__badges">
                      {isAnon && (
                        <span className="fm-viewpeer-badge fm-viewpeer-badge--anonymous">
                          <Lock size={12} />
                          Anonymous
                        </span>
                      )}
                      <span className="fm-viewpeer-badge fm-viewpeer-badge--peer">
                        Peer
                      </span>
                    </div>
                  </div>

                  <div className="fm-viewpeer-card__body">
                    <div className="fm-viewpeer-card__date">
                      <Calendar size={14} />
                      <span>{feedback.formattedDate}</span>
                    </div>

                    <div className="fm-viewpeer-card__feedback">
                      <div className="fm-viewpeer-card__feedback-header">
                        <MessageCircle size={16} />
                        <h6>Feedback</h6>
                      </div>
                      <p className="fm-viewpeer-card__feedback-text">
                        {feedback.feedbackContent ||
                          feedback.comment ||
                          feedback.feedbackComment ||
                          "No comment provided"}
                      </p>
                    </div>

                    {(feedback.context || feedback.feedbackContext) && (
                      <div className="fm-viewpeer-card__context">
                        <h6>Context</h6>
                        <p>{feedback.context || feedback.feedbackContext}</p>
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
