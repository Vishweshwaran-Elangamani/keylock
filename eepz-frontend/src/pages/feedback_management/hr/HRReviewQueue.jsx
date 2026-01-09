import React, { useEffect, useState } from "react";
import {
  RefreshCw,
  AlertTriangle,
  ArrowLeft,
  Users,
  User,
  Calendar,
  MessageCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../../styles/feedback/hr/HRReviewQueue.css";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function ViewMyPeerFeedback() {
  const navigate = useNavigate();
  const [user] = useState(
    () => JSON.parse(localStorage.getItem("user") || "{}") || {}
  );

  const [peerFeedback, setPeerFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [employeeMap, setEmployeeMap] = useState({});

  const fetchPeerFeedback = async () => {
    setLoading(true);
    setRefreshing(false);
    setError("");

    try {
      const empId = user?.empId;
      if (!empId) {
        setError("Employee ID not found");
        setLoading(false);
        return;
      }

      let empMap = {};
      try {
        const empRes = await axios.get(`${API_BASE}/EmployeeManagement/all`);
        if (empRes.data?.success && Array.isArray(empRes.data.data)) {
          empRes.data.data.forEach((emp) => {
            empMap[emp.employeeId] = `${emp.firstName} ${emp.lastName}`;
          });
          setEmployeeMap(empMap);
        }
      } catch (err) {
        console.warn("Error fetching employee map:", err.message);
      }

      try {
        const peerRes = await axios.get(`${API_BASE}/PeerFeedbackQueue/all`);
        if (peerRes.data?.success && Array.isArray(peerRes.data.data)) {
          const myFeedback = peerRes.data.data
            .filter((p) => p.recipientEmployeeId === empId)
            .map((p) => ({
              ...p,
              submittedByName:
                empMap[p.submittedByEmployeeId] ||
                `Employee ${p.submittedByEmployeeId}`,
            }))
            .sort(
              (a, b) => new Date(b.submittedDate) - new Date(a.submittedDate)
            );

          setPeerFeedback(myFeedback);
        }
      } catch (err) {
        console.warn("Error fetching peer feedback:", err.message);
        setPeerFeedback([]);
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to load peer feedback"
      );
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeerFeedback();
  }, [user?.empId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPeerFeedback();
  };

  if (loading) {
    return (
      <div className="hrq-page hrq-page-loading">
        <div className="hrq-spinner-main" />
      </div>
    );
  }

  return (
    <div className="hrq-page hrq-page-bg">
      <div className="hrq-container">
        <div className="hrq-header">
          <div className="hrq-header-left">
            <button className="hrq-btn hrq-btn-outline hrq-btn-back"onClick={() => navigate(-1)}>
              <ArrowLeft size={16} />
            </button>
            <div className="hrq-header-text">
              <h2 className="hrq-title">Peer Feedback</h2>
              <p className="hrq-subtitle">
                Feedback you have received from peers
              </p>
            </div>
          </div>
          <button className="hrq-btn hrq-btn-outline hrq-btn-refresh" onClick={handleRefresh} disabled={refreshing} title="Refresh">
            <RefreshCw
              size={18}
              className={refreshing ? "hrq-icon-spin" : ""}
            />
          </button>
        </div>

        {error && (
          <div className="hrq-alert hrq-alert-error">
            <div className="hrq-alert-main">
              <AlertTriangle size={18} className="hrq-alert-icon" />
              <div>
                <strong>Error</strong>
                <p className="hrq-alert-text">{error}</p>
              </div>
            </div>
            <button className="hrq-alert-close" onClick={() => setError("")}> × </button>
          </div>
        )}

        {peerFeedback.length > 0 && (
          <div className="hrq-stats-row">
            <div className="hrq-stat-card">
              <div className="hrq-stat-body">
                <div className="hrq-stat-icon-wrap">
                  <Users size={20} className="hrq-stat-icon" />
                </div>
                <div>
                  <h5 className="hrq-stat-number">{peerFeedback.length}</h5>
                  <small className="hrq-stat-label"> Peer Feedback Received</small>
                </div>
              </div>
            </div>
          </div>
        )}

        {peerFeedback.length === 0 ? (
          <div className="hrq-card hrq-card-empty">
            <Users size={48} className="hrq-empty-icon" />
            <h5 className="hrq-empty-title">No peer feedback received</h5>
            <p className="hrq-empty-text">
              Check back later for feedback from your peers
            </p>
          </div>
        ) : (
          <div className="hrq-feedback-grid">
            {peerFeedback.map((feedback) => (
              <div className="hrq-feedback-col" key={feedback.queueId}>
                <div className="hrq-card hrq-feedback-card">
                  <div className="hrq-feedback-body">
                    <div className="hrq-feedback-header">
                      <div>
                        <div className="hrq-feedback-peer-row">
                          <User size={16} className="hrq-feedback-peer-icon" />
                          <h6 className="hrq-feedback-peer-name">
                            {feedback.submittedByName}
                          </h6>
                        </div>
                        <div className="hrq-feedback-date-row">
                          <Calendar size={14} className="hrq-inline-icon" />
                          <small className="hrq-feedback-date">
                            {feedback.submittedDate
                              ? new Date(
                                  feedback.submittedDate
                                ).toLocaleDateString()
                              : new Date(
                                  feedback.createdAt
                                ).toLocaleDateString()}
                          </small>
                        </div>
                      </div>
                      <div className="hrq-feedback-status-wrap">
                        <span
                          className={`hrq-status-chip ${
                            feedback.status === "Approved" ? "hrq-status-chip-approved" : "hrq-status-chip-default"}`}
                        >
                          {feedback.status || "Pending"}
                        </span>
                      </div>
                    </div>

                    <div className="hrq-feedback-comment-section">
                      <div className="hrq-feedback-comment-header">
                        <MessageCircle
                          size={16}
                          className="hrq-feedback-comment-icon"
                        />
                        <h6 className="hrq-feedback-comment-title">Feedback</h6>
                      </div>
                      <p className="hrq-feedback-comment-text">
                        {feedback.comment ||
                          feedback.feedbackComment ||
                          "No comment provided"}
                      </p>
                    </div>

                    {(feedback.context || feedback.feedbackContext) && (
                      <div className="hrq-feedback-context-box">
                        <h6 className="hrq-feedback-context-title">Context</h6>
                        <p className="hrq-feedback-context-text">
                          {feedback.context || feedback.feedbackContext}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
