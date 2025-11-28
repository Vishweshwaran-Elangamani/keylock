// src/pages/feedback_management/feedback/ManagerPeerFeedback.jsx

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
  Grid,
  List,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  peerQueueApi,
  employeeApi,
} from "../../../services/feedbackmanagement/feedbackApi";
import FeedbackBreadcrumb from "../../../components/feedback_management/common/FeedbackBreadcrumb";
import "../../../styles/feedback/ManagerPeerFeedback.css";

export default function ManagerPeerFeedback() {
  const navigate = useNavigate();
  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "{}") || {},
    []
  );

  const [peerFeedback, setPeerFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [employeeMap, setEmployeeMap] = useState({});
  const [viewMode, setViewMode] = useState("card"); // "card" or "table"

  // Safe date formatting
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

  // Check if feedback is anonymous
  const checkIsAnonymous = (feedback) => {
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
  };

  // Get sender display name
  const getSenderDisplayName = (feedback) => {
    const isAnon = checkIsAnonymous(feedback);

    if (isAnon) {
      return "Anonymous Peer";
    }

    return (
      feedback.submittedByName ||
      feedback.submitterName ||
      `Employee ${feedback.submittedByEmployeeId}`
    );
  };

  // Fetch peer feedback
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

      // Fetch peer feedback
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

  // Loading state
  if (loading) {
    return (
      <div className="fm-mgrpeer-loading">
        <Loader size={40} className="fm-mgrpeer-loading__spinner" />
        <p className="fm-mgrpeer-loading__text">Loading peer feedback...</p>
      </div>
    );
  }

  return (
    <div className="fm-mgrpeer-page-wrapper">
      <div className="fm-mgrpeer-container">
        {/* Breadcrumb */}
        <FeedbackBreadcrumb
          items={[
            { label: "Feedback Management", path: "/manager/dashboard/feedback" },
            { label: "Peer Feedback Received" },
          ]}
        />

        {/* View Toggle */}
        <div className="fm-mgrpeer-view-toggle">
          <button
            className={`fm-mgrpeer-view-toggle__btn ${
              viewMode === "card" ? "fm-mgrpeer-view-toggle__btn--active" : ""
            }`}
            onClick={() => setViewMode("card")}
          >
            <Grid size={18} />
            <span>Card View</span>
          </button>
          <button
            className={`fm-mgrpeer-view-toggle__btn ${
              viewMode === "table" ? "fm-mgrpeer-view-toggle__btn--active" : ""
            }`}
            onClick={() => setViewMode("table")}
          >
            <List size={18} />
            <span>Table View</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="fm-mgrpeer-error-alert alert alert-danger alert-dismissible fade show">
            <AlertTriangle size={18} className="flex-shrink-0" />
            <div className="flex-grow-1">
              <strong>Error</strong>
              <p className="mb-0 mt-1">{error}</p>
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={() => setError("")}
            />
          </div>
        )}

        {/* Stats Card */}
        {peerFeedback.length > 0 && (
          <div className="fm-mgrpeer-stats">
            <div className="fm-mgrpeer-stat-card">
              <div className="fm-mgrpeer-stat-card__icon">
                <Users size={28} />
              </div>
              <div className="fm-mgrpeer-stat-card__content">
                <h3 className="fm-mgrpeer-stat-card__value">
                  {peerFeedback.length}
                </h3>
                <p className="fm-mgrpeer-stat-card__label">
                  Peer Feedback Received
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {peerFeedback.length === 0 ? (
          <div className="fm-mgrpeer-empty">
            <Users size={48} className="fm-mgrpeer-empty__icon" />
            <h5 className="fm-mgrpeer-empty__title">No peer feedback yet</h5>
            <p className="fm-mgrpeer-empty__text">
              Check back later for feedback from your peers
            </p>
          </div>
        ) : (
          <>
            {/* Card View */}
            {viewMode === "card" && (
              <div className="fm-mgrpeer-cards-grid">
                {peerFeedback.map((feedback) => {
                  const isAnon = checkIsAnonymous(feedback);

                  return (
                    <div
                      className="fm-mgrpeer-card"
                      key={
                        feedback.queueId ||
                        feedback.QueueId ||
                        feedback.peerQueueId
                      }
                    >
                      <div
                        className={`fm-mgrpeer-card__indicator ${
                          isAnon
                            ? "fm-mgrpeer-card__indicator--anonymous"
                            : "fm-mgrpeer-card__indicator--peer"
                        }`}
                      />

                      <div className="fm-mgrpeer-card__header">
                        <div className="fm-mgrpeer-card__sender">
                          {isAnon ? (
                            <Lock size={18} className="fm-mgrpeer-card__icon fm-mgrpeer-card__icon--anonymous" />
                          ) : (
                            <User size={18} className="fm-mgrpeer-card__icon fm-mgrpeer-card__icon--peer" />
                          )}
                          <h6 className={`fm-mgrpeer-card__name ${
                            isAnon ? "fm-mgrpeer-card__name--anonymous" : ""
                          }`}>
                            {getSenderDisplayName(feedback)}
                          </h6>
                        </div>
                        <div className="fm-mgrpeer-card__badges">
                          {isAnon && (
                            <span className="fm-mgrpeer-badge fm-mgrpeer-badge--anonymous">
                              <Lock size={12} />
                              Anonymous
                            </span>
                          )}
                          <span className="fm-mgrpeer-badge fm-mgrpeer-badge--peer">
                            Peer
                          </span>
                        </div>
                      </div>

                      <div className="fm-mgrpeer-card__body">
                        <div className="fm-mgrpeer-card__date">
                          <Calendar size={14} />
                          <span>{feedback.formattedDate}</span>
                        </div>

                        <div className="fm-mgrpeer-card__feedback">
                          <div className="fm-mgrpeer-card__feedback-header">
                            <MessageCircle size={16} />
                            <h6>Feedback</h6>
                          </div>
                          <p className="fm-mgrpeer-card__feedback-text">
                            {feedback.feedbackContent ||
                              feedback.comment ||
                              feedback.feedbackComment ||
                              "No comment provided"}
                          </p>
                        </div>

                        {(feedback.context || feedback.feedbackContext) && (
                          <div className="fm-mgrpeer-card__context">
                            <h6>Context</h6>
                            <p>
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

            {/* Table View */}
            {viewMode === "table" && (
              <div className="fm-mgrpeer-table-wrapper">
                <div className="fm-mgrpeer-table-scroll">
                  <table className="fm-mgrpeer-table">
                    <thead className="fm-mgrpeer-table__head">
                      <tr>
                        <th className="fm-mgrpeer-table__th">From</th>
                        <th className="fm-mgrpeer-table__th">Type</th>
                        <th className="fm-mgrpeer-table__th">Feedback</th>
                        <th className="fm-mgrpeer-table__th">Date</th>
                      </tr>
                    </thead>
                    <tbody className="fm-mgrpeer-table__body">
                      {peerFeedback.map((feedback) => {
                        const isAnon = checkIsAnonymous(feedback);

                        return (
                          <tr
                            key={
                              feedback.queueId ||
                              feedback.QueueId ||
                              feedback.peerQueueId
                            }
                            className="fm-mgrpeer-table__row"
                          >
                            <td className="fm-mgrpeer-table__td">
                              <div className="fm-mgrpeer-table__sender">
                                {isAnon ? (
                                  <Lock size={18} className="fm-mgrpeer-table__icon fm-mgrpeer-table__icon--anonymous" />
                                ) : (
                                  <User size={18} className="fm-mgrpeer-table__icon" />
                                )}
                                <span className="fm-mgrpeer-table__name">
                                  {getSenderDisplayName(feedback)}
                                </span>
                              </div>
                            </td>
                            <td className="fm-mgrpeer-table__td">
                              <div className="fm-mgrpeer-table__badges">
                                {isAnon && (
                                  <span className="fm-mgrpeer-badge fm-mgrpeer-badge--anonymous">
                                    Anonymous
                                  </span>
                                )}
                                <span className="fm-mgrpeer-badge fm-mgrpeer-badge--peer">
                                  Peer
                                </span>
                              </div>
                            </td>
                            <td className="fm-mgrpeer-table__td fm-mgrpeer-table__td--comment">
                              {feedback.feedbackContent ||
                                feedback.comment ||
                                feedback.feedbackComment ||
                                "No comment provided"}
                            </td>
                            <td className="fm-mgrpeer-table__td fm-mgrpeer-table__td--date">
                              {feedback.formattedDate}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
