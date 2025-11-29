// src/pages/feedback_management/hr/HRFeedbackList.jsx

import React, { useEffect, useState } from "react";
import {
  RefreshCw,
  AlertTriangle,
  Eye,
  Trash2,
  Users,
  Send,
  Clock,
  Lock,
  User,
  Brain,
  X,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Target,
  BarChart,
  Shield,
  Lightbulb,
} from "lucide-react";
import {
  mentorFeedbackApi,
  peerQueueApi,
  employeeApi,
  hrFormApi,
  feedbackAnalysisApi,
} from "../../../services/feedbackmanagement/feedbackApi";
import ResponseViewModal from "../../../components/feedback_management/modals/ResponseViewModal";
import FeedbackBreadcrumb from "../../../components/feedback_management/common/FeedbackBreadcrumb";

const Badge = ({ text, color = "#525252" }) => (
  <span
    style={{
      display: "inline-block",
      backgroundColor: `${color}15`,
      color,
      padding: "6px 12px",
      fontSize: "0.75rem",
      fontWeight: 600,
      borderRadius: "6px",
      border: `1.5px solid ${color}40`,
    }}
  >
    {text}
  </span>
);

export default function HRFeedbackList() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("Mentor");
  const [hrForms, setHrForms] = useState([]);
  const [mentor, setMentor] = useState([]);
  const [peer, setPeer] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [employeeMap, setEmployeeMap] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [selectedType, setSelectedType] = useState(null);

  // Analysis Modal States
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  // Fetch employee map using service
  const fetchEmployeeMap = async () => {
    try {
      console.log("Fetching employee map...");
      const response = await employeeApi.getAll();

      if (response?.data) {
        const employees = Array.isArray(response.data)
          ? response.data
          : response.data.data || [];

        const map = {};
        employees.forEach((emp) => {
          map[emp.employeeId] = `${emp.firstName} ${emp.lastName}`;
        });
        setEmployeeMap(map);
        console.log("Employee map loaded:", Object.keys(map).length);
      }
    } catch (err) {
      console.error("Error fetching employee map:", err.message);
    }
  };

  // Fetch all feedback data using services
  const fetchData = async () => {
    setRefreshing(true);
    setLoading(true);
    setError("");

    try {
      // Fetch HR Feedback
      try {
        console.log("Fetching HR feedback...");
        const formsRes = await hrFormApi.getActiveForms();
        console.log("Forms response:", formsRes);

        let allHRFeedback = [];

        const forms = formsRes?.data || [];

        if (Array.isArray(forms)) {
          for (const form of forms) {
            try {
              const respRes = await hrFormApi.getResponsesByFormId(form.formId);

              const responses = respRes?.data || [];

              if (Array.isArray(responses)) {
                const mappedHR = responses.map((r) => ({
                  responseId: r.responseId,
                  formId: form.formId,
                  formName: form.formName,
                  employeeId: r.employeeId,
                  employeeName:
                    employeeMap[r.employeeId] || `Employee ${r.employeeId}`,
                  status: r.status || "Submitted",
                  submittedAt:
                    r.submittedDate || r.createdAt || new Date().toISOString(),
                  hrReviewComments: r.hrReviewComments,
                  ...r,
                }));

                allHRFeedback = [...allHRFeedback, ...mappedHR];
                console.log(
                  `${mappedHR.length} HR feedback from form ${form.formId}`
                );
              }
            } catch (err) {
              console.warn(`Error fetching HR responses:`, err.message);
            }
          }
        }

        setHrForms(allHRFeedback);
      } catch (hrErr) {
        console.warn("HR feedback API error:", hrErr.message);
        setHrForms([]);
      }

      // Fetch Mentor Feedback
      try {
        console.log("Fetching mentor feedback...");
        const mentorRes = await mentorFeedbackApi.list(1, 100);
        const mentorData = Array.isArray(mentorRes?.data)
          ? mentorRes.data
          : mentorRes?.data?.data || [];

        const enrichedMentorData = mentorData.map((m) => ({
          ...m,
          mentorNameFull:
            employeeMap[m.mentorEmployeeId] || `Employee ${m.mentorEmployeeId}`,
        }));

        setMentor(enrichedMentorData);
        console.log(`${enrichedMentorData.length} mentor feedback loaded`);
      } catch (mentorErr) {
        console.warn("Mentor feedback API error:", mentorErr.message);
        setMentor([]);
      }

      // Fetch Peer Feedback
      try {
        console.log("Fetching peer feedback...");
        const peerRes = await peerQueueApi.list(1, 100);
        const allPeer = Array.isArray(peerRes?.data)
          ? peerRes.data
          : peerRes?.data?.data || [];

        const enrichedPeerData = allPeer.map((p) => ({
          ...p,
          recipientNameFull:
            employeeMap[p.recipientEmployeeId] ||
            `Employee ${p.recipientEmployeeId}`,
          submitterNameFull:
            employeeMap[p.submittedByEmployeeId] ||
            `Employee ${p.submittedByEmployeeId}`,
        }));

        setPeer(enrichedPeerData);
        console.log(`${enrichedPeerData.length} peer feedback loaded`);
      } catch (peerErr) {
        console.warn("Peer feedback API error:", peerErr.message);
        setPeer([]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err?.message || "Failed to fetch feedback");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch employee map on mount
  useEffect(() => {
    fetchEmployeeMap();
  }, []);

  // Fetch data after employee map is loaded
  useEffect(() => {
    if (Object.keys(employeeMap).length > 0) {
      fetchData();
    }
  }, [employeeMap]);

  // Modal handlers
  const handleViewResponse = (data, type) => {
    setSelectedResponse(data);
    setSelectedType(type);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedResponse(null);
    setSelectedType(null);
  };

  // Analysis Modal handlers
  const handleAnalyzeFeedback = async (feedbackData, type) => {
    setShowAnalysisModal(true);
    setAnalysisLoading(true);
    setAnalysisError("");
    setAnalysisData(null);

    try {
      // Extract feedback text based on type
      let feedbackText = "";
      if (type === "Mentor") {
        feedbackText =
          feedbackData.feedbackComments || feedbackData.comments || "";
      } else if (type === "Peer") {
        feedbackText =
          feedbackData.feedbackContent || feedbackData.content || "";
      }

      if (!feedbackText || feedbackText.trim() === "") {
        throw new Error("No feedback text available for analysis");
      }

      // Call the analysis API
      const result = await feedbackAnalysisApi.analyze(feedbackText);

      // Set the complete analysis data from API response
      setAnalysisData(result);
    } catch (err) {
      console.error("Analysis error:", err);
      setAnalysisError(err.message || "Failed to analyze feedback");
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleCloseAnalysisModal = () => {
    setShowAnalysisModal(false);
    setAnalysisData(null);
    setAnalysisError("");
  };

  // Delete HR Form using service
  const deleteHRForm = async (responseId) => {
    if (
      !window.confirm(
        "Delete this HR form submission? This action cannot be undone."
      )
    )
      return;
    setError("");

    try {
      await hrFormApi.deleteResponse(responseId);
      fetchData();
    } catch (err) {
      console.error("Delete error:", err);
      setError(err?.message || "Failed to delete HR form");
    }
  };

  // Delete Mentor Feedback using service
  const deleteMentor = async (trackingId) => {
    if (!window.confirm("Delete this mentor feedback submission?")) return;
    setError("");

    try {
      await mentorFeedbackApi.remove(trackingId);
      fetchData();
    } catch (err) {
      setError(err?.message || "Failed to delete mentor feedback");
    }
  };

  // Delete Peer Feedback using service
  const deletePeer = async (queueId) => {
    if (!window.confirm("Delete this peer feedback submission?")) return;
    setError("");

    try {
      await peerQueueApi.remove(queueId);
      fetchData();
    } catch (err) {
      setError(err?.message || "Failed to delete peer feedback");
    }
  };

  // Helper functions
  const getMentorName = (m) => {
    return m.mentorNameFull || m.mentorName || `Employee ${m.mentorEmployeeId}`;
  };

  const getRecipientName = (p) => {
    return (
      p.recipientNameFull ||
      p.recipientName ||
      `Employee ${p.recipientEmployeeId}`
    );
  };

  const getSubmitterName = (p) => {
    return (
      p.submitterNameFull ||
      p.submitterName ||
      `Employee ${p.submittedByEmployeeId}`
    );
  };

  // Sentiment color helper
  const getSentimentColor = (sentiment) => {
    if (!sentiment) return "#6c757d";
    const lower = sentiment.toLowerCase();
    if (lower.includes("positive")) return "#198754";
    if (lower.includes("negative")) return "#dc3545";
    if (lower.includes("neutral")) return "#ffc107";
    return "#27235C";
  };

  const getSentimentIcon = (sentiment) => {
    if (!sentiment) return "○";
    const lower = sentiment.toLowerCase();
    if (lower.includes("positive")) return "✓";
    if (lower.includes("negative")) return "✗";
    return "~";
  };

  // Get quality color based on overall_quality
  const getQualityColor = (quality) => {
    if (!quality) return "#6c757d";
    const lower = quality.toLowerCase();
    if (lower.includes("excellent") || lower.includes("good")) return "#198754";
    if (lower.includes("fair")) return "#ffc107";
    if (lower.includes("poor")) return "#dc3545";
    return "#6c757d";
  };

  // Get bias level color
  const getBiasLevelColor = (level) => {
    if (!level) return "#6c757d";
    const lower = level.toLowerCase();
    if (lower.includes("high")) return "#dc3545";
    if (lower.includes("medium") || lower.includes("moderate"))
      return "#ffc107";
    if (lower.includes("low") || lower.includes("none")) return "#198754";
    return "#6c757d";
  };

  return (
    <div className="hrfeedback-list-container">
      <div className="hrfeedback-list-wrapper">
        {/* ========== BREADCRUMB ========== */}
        <FeedbackBreadcrumb
          items={[
            { label: "Feedback Management", path: "/hr/dashboard/feedback" },
            { label: "Feedback Forms List" },
          ]}
        />

        {/* Header */}
        <div className="hrfeedback-list-header">
          <div>
            <h2 className="hrfeedback-list-title">
              All Feedback Submissions
            </h2>
            <p className="hrfeedback-list-subtitle">
              View and manage all feedback submissions (Mentor & Peer)
            </p>
          </div>
          <button
            className="hrfeedback-refresh-btn"
            onClick={() => {
              fetchEmployeeMap();
              fetchData();
            }}
            disabled={refreshing || loading}
          >
            <RefreshCw
              size={18}
              className={refreshing ? "hrfeedback-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="hrfeedback-alert-error">
            <AlertTriangle size={18} className="hrfeedback-alert-icon" />
            <div className="hrfeedback-alert-content">
              <strong>Error</strong>
              <p className="hrfeedback-alert-text">{error}</p>
            </div>
            <button
              type="button"
              className="hrfeedback-alert-close"
              onClick={() => setError("")}
            >
              ×
            </button>
          </div>
        )}

        {/* PILL-STYLE TOGGLE NAVIGATION - CENTERED */}
        <div className="hrfeedback-toggle-wrapper">
          <div className="hrfeedback-toggle-container">
            <button
              type="button"
              onClick={() => setTab("Mentor")}
              className={`hrfeedback-toggle-btn ${
                tab === "Mentor" ? "hrfeedback-toggle-btn-active" : ""
              }`}
            >
              <Send size={15} />
              Mentor
              {mentor.length > 0 && (
                <span className="hrfeedback-toggle-badge">
                  {mentor.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setTab("Peer")}
              className={`hrfeedback-toggle-btn ${
                tab === "Peer" ? "hrfeedback-toggle-btn-active" : ""
              }`}
            >
              <Users size={15} />
              Peer
              {peer.length > 0 && (
                <span className="hrfeedback-toggle-badge">{peer.length}</span>
              )}
            </button>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="hrfeedback-loading-container">
            <div className="hrfeedback-spinner" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="hrfeedback-loading-text">Loading submissions...</p>
          </div>
        ) : (
          <>
            {/* Mentor Tab */}
            {tab === "Mentor" &&
              (mentor.length === 0 ? (
                <div className="hrfeedback-empty-state">
                  <AlertTriangle size={48} className="hrfeedback-empty-icon" />
                  <h5 className="hrfeedback-empty-title">
                    No Mentor Feedback Yet
                  </h5>
                  <p className="hrfeedback-empty-text">
                    There are no mentor feedback submissions.
                  </p>
                </div>
              ) : (
                <div className="row g-3">
                  {mentor.map((m) => (
                    <div
                      className="col-md-6 col-lg-4"
                      key={m.trackingId || m.id}
                    >
                      <div className="hrfeedback-card hrfeedback-card-mentor">
                        <div className="hrfeedback-card-header">
                          <div>
                            <div className="hrfeedback-card-label">Mentor</div>
                            <div className="hrfeedback-card-name-row">
                              <User
                                size={14}
                                className="hrfeedback-card-user-icon"
                              />
                              <h6 className="hrfeedback-card-name">
                                {getMentorName(m)}
                              </h6>
                            </div>
                          </div>
                          <Badge text={`${m.rating || 0}/5`} color="#27235C" />
                        </div>

                        <div className="hrfeedback-card-date">
                          <Clock size={14} />
                          <span>
                            {m.createdAt
                              ? new Date(m.createdAt).toLocaleDateString()
                              : "—"}
                          </span>
                        </div>

                        <div className="hrfeedback-card-content">
                          <p className="hrfeedback-card-text">
                            {m.feedbackComments
                              ? m.feedbackComments.substring(0, 80) + "..."
                              : "No comments"}
                          </p>
                        </div>

                        <div className="hrfeedback-card-actions">
                          <button
                            className="hrfeedback-btn-view"
                            onClick={() => handleViewResponse(m, "Mentor")}
                          >
                            <Eye size={16} />
                            View
                          </button>
                          <button
                            className="hrfeedback-btn-delete"
                            onClick={() => deleteMentor(m.trackingId || m.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Analyze Feedback Button */}
                        <button
                          className="hrfeedback-btn-analyze"
                          onClick={() => handleAnalyzeFeedback(m, "Mentor")}
                        >
                          <Brain size={16} />
                          Analyze Feedback
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

            {/* Peer Tab */}
            {tab === "Peer" &&
              (peer.length === 0 ? (
                <div className="hrfeedback-empty-state">
                  <AlertTriangle size={48} className="hrfeedback-empty-icon" />
                  <h5 className="hrfeedback-empty-title">
                    No Peer Feedback Yet
                  </h5>
                  <p className="hrfeedback-empty-text">
                    There are no peer feedback submissions.
                  </p>
                </div>
              ) : (
                <div className="row g-3">
                  {peer.map((p) => {
                    const statusColor =
                      p.status === "Approved"
                        ? "#198754"
                        : p.status === "Rejected"
                        ? "#dc3545"
                        : "#27235C";

                    return (
                      <div
                        className="col-md-6 col-lg-4"
                        key={p.queueId || p.id}
                      >
                        <div
                          className="hrfeedback-card"
                          style={{ borderLeftColor: statusColor }}
                        >
                          <div className="hrfeedback-card-header">
                            <div style={{ flex: 1 }}>
                              <div className="hrfeedback-card-label">From</div>
                              <div className="hrfeedback-card-name-row hrfeedback-mb-2">
                                <User
                                  size={14}
                                  style={{ color: "#6c757d" }}
                                />
                                <h6 className="hrfeedback-card-name-small">
                                  {getSubmitterName(p)}
                                </h6>
                              </div>
                              <div className="hrfeedback-card-label">To</div>
                              <div className="hrfeedback-card-name-row">
                                <User
                                  size={14}
                                  className="hrfeedback-card-user-icon"
                                />
                                <h6 className="hrfeedback-card-name">
                                  {getRecipientName(p)}
                                </h6>
                              </div>
                            </div>
                            <Badge
                              text={p.status || "Pending"}
                              color={statusColor}
                            />
                          </div>

                          <div className="hrfeedback-card-date">
                            <Clock size={14} />
                            <span>
                              {p.createdAt
                                ? new Date(p.createdAt).toLocaleDateString()
                                : "—"}
                            </span>
                          </div>

                          {p.isAnonymous && (
                            <div className="hrfeedback-card-anonymous">
                              <Lock size={12} />
                              <span>Anonymous submission</span>
                            </div>
                          )}

                          <div className="hrfeedback-card-content">
                            <p className="hrfeedback-card-text">
                              {p.feedbackContent
                                ? p.feedbackContent.substring(0, 80) + "..."
                                : "No content"}
                            </p>
                          </div>

                          <div className="hrfeedback-card-actions">
                            <button
                              className="hrfeedback-btn-view"
                              onClick={() => handleViewResponse(p, "Peer")}
                            >
                              <Eye size={16} />
                              View
                            </button>
                            <button
                              className="hrfeedback-btn-delete"
                              onClick={() => deletePeer(p.queueId || p.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          {/* Analyze Feedback Button */}
                          <button
                            className="hrfeedback-btn-analyze"
                            onClick={() => handleAnalyzeFeedback(p, "Peer")}
                          >
                            <Brain size={16} />
                            Analyze Feedback
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
          </>
        )}
      </div>

      {/* Response View Modal */}
      <ResponseViewModal
        show={showModal}
        response={selectedResponse}
        onClose={handleCloseModal}
        type={selectedType}
      />

      {/* ========== ANALYSIS MODAL (COMPLETE IMPLEMENTATION) ========== */}
      {showAnalysisModal && (
        <div
          className="hrfeedback-modal-overlay"
          onClick={handleCloseAnalysisModal}
        >
          <div
            className="hrfeedback-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="hrfeedback-modal-header">
              <div className="hrfeedback-modal-header-content">
                <Brain size={24} />
                <h5 className="hrfeedback-modal-title" >
                  AI Feedback Analysis
                </h5>
              </div>
              <button
                onClick={handleCloseAnalysisModal}
                className="hrfeedback-modal-close-btn"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="hrfeedback-modal-body">
              {analysisLoading && (
                <div className="hrfeedback-modal-loading">
                  <div className="hrfeedback-spinner" role="status">
                    <span className="visually-hidden">Analyzing...</span>
                  </div>
                  <p className="hrfeedback-loading-text">
                    Analyzing feedback with AI...
                  </p>
                  <p className="hrfeedback-loading-subtext">
                    This may take a few seconds
                  </p>
                </div>
              )}

              {analysisError && (
                <div className="hrfeedback-modal-error">
                  <AlertCircle size={20} />
                  <div>
                    <strong>Analysis Failed</strong>
                    <p className="hrfeedback-modal-error-text">
                      {analysisError}
                    </p>
                  </div>
                </div>
              )}

              {!analysisLoading && !analysisError && analysisData && (
                <div className="hrfeedback-analysis-content">
                  {/* Original Feedback */}
                  <div className="hrfeedback-analysis-section">
                    <label className="hrfeedback-analysis-label">
                      Original Feedback
                    </label>
                    <div className="hrfeedback-analysis-feedback-box">
                      {analysisData.input_text || "No feedback text available"}
                    </div>
                  </div>

                  {/* Overall Summary */}
                  {analysisData.summary && (
                    <div className="hrfeedback-analysis-section">
                      <label className="hrfeedback-analysis-label">
                        <Sparkles size={14} />
                        Summary
                      </label>
                      <div className="hrfeedback-summary-box">
                        {analysisData.summary}
                      </div>
                    </div>
                  )}

                  {/* Quality & Fairness Metrics Grid */}
                  <div className="hrfeedback-metrics-grid">
                    {/* Overall Quality */}
                    {analysisData.overall_quality && (
                      <div
                        className="hrfeedback-metric-card"
                        style={{
                          borderColor: getQualityColor(
                            analysisData.overall_quality
                          ),
                        }}
                      >
                        <div className="hrfeedback-metric-icon">
                          <Target
                            size={20}
                            style={{
                              color: getQualityColor(
                                analysisData.overall_quality
                              ),
                            }}
                          />
                        </div>
                        <div className="hrfeedback-metric-content">
                          <div className="hrfeedback-metric-label">
                            Overall Quality
                          </div>
                          <div
                            className="hrfeedback-metric-value"
                            style={{
                              color: getQualityColor(
                                analysisData.overall_quality
                              ),
                            }}
                          >
                            {analysisData.overall_quality}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Fairness Score */}
                    {analysisData.fairness_score !== undefined && (
                      <div
                        className="hrfeedback-metric-card"
                        style={{
                          borderColor:
                            analysisData.fairness_score >= 0.7
                              ? "#198754"
                              : analysisData.fairness_score >= 0.4
                              ? "#ffc107"
                              : "#dc3545",
                        }}
                      >
                        <div className="hrfeedback-metric-icon">
                          <Shield
                            size={20}
                            style={{
                              color:
                                analysisData.fairness_score >= 0.7
                                  ? "#198754"
                                  : analysisData.fairness_score >= 0.4
                                  ? "#ffc107"
                                  : "#dc3545",
                            }}
                          />
                        </div>
                        <div className="hrfeedback-metric-content">
                          <div className="hrfeedback-metric-label">
                            Fairness Score
                          </div>
                          <div
                            className="hrfeedback-metric-value"
                            style={{
                              color:
                                analysisData.fairness_score >= 0.7
                                  ? "#198754"
                                  : analysisData.fairness_score >= 0.4
                                  ? "#ffc107"
                                  : "#dc3545",
                            }}
                          >
                            {(analysisData.fairness_score * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Professionalism Score */}
                    {analysisData.feedback_metrics
                      ?.professionalism_score !== undefined && (
                      <div
                        className="hrfeedback-metric-card"
                        style={{
                          borderColor:
                            analysisData.feedback_metrics
                              .professionalism_score >= 0.7
                              ? "#198754"
                              : analysisData.feedback_metrics
                                  .professionalism_score >= 0.4
                              ? "#ffc107"
                              : "#dc3545",
                        }}
                      >
                        <div className="hrfeedback-metric-icon">
                          <BarChart
                            size={20}
                            style={{
                              color:
                                analysisData.feedback_metrics
                                  .professionalism_score >= 0.7
                                  ? "#198754"
                                  : analysisData.feedback_metrics
                                      .professionalism_score >= 0.4
                                  ? "#ffc107"
                                  : "#dc3545",
                            }}
                          />
                        </div>
                        <div className="hrfeedback-metric-content">
                          <div className="hrfeedback-metric-label">
                            Professionalism
                          </div>
                          <div
                            className="hrfeedback-metric-value"
                            style={{
                              color:
                                analysisData.feedback_metrics
                                  .professionalism_score >= 0.7
                                  ? "#198754"
                                  : analysisData.feedback_metrics
                                      .professionalism_score >= 0.4
                                  ? "#ffc107"
                                  : "#dc3545",
                            }}
                          >
                            {(
                              analysisData.feedback_metrics
                                .professionalism_score * 100
                            ).toFixed(0)}
                            %
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Constructiveness Score */}
                    {analysisData.constructiveness_analysis
                      ?.constructiveness_score !== undefined && (
                      <div
                        className="hrfeedback-metric-card"
                        style={{
                          borderColor:
                            analysisData.constructiveness_analysis
                              .constructiveness_score >= 0.7
                              ? "#198754"
                              : analysisData.constructiveness_analysis
                                  .constructiveness_score >= 0.4
                              ? "#ffc107"
                              : "#dc3545",
                        }}
                      >
                        <div className="hrfeedback-metric-icon">
                          <Lightbulb
                            size={20}
                            style={{
                              color:
                                analysisData.constructiveness_analysis
                                  .constructiveness_score >= 0.7
                                  ? "#198754"
                                  : analysisData.constructiveness_analysis
                                      .constructiveness_score >= 0.4
                                  ? "#ffc107"
                                  : "#dc3545",
                            }}
                          />
                        </div>
                        <div className="hrfeedback-metric-content">
                          <div className="hrfeedback-metric-label">
                            Constructiveness
                          </div>
                          <div
                            className="hrfeedback-metric-value"
                            style={{
                              color:
                                analysisData.constructiveness_analysis
                                  .constructiveness_score >= 0.7
                                  ? "#198754"
                                  : analysisData.constructiveness_analysis
                                      .constructiveness_score >= 0.4
                                  ? "#ffc107"
                                  : "#dc3545",
                            }}
                          >
                            {(
                              analysisData.constructiveness_analysis
                                .constructiveness_score * 100
                            ).toFixed(0)}
                            %
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sentiment Analysis */}
                  {analysisData.sentiment_analysis && (
                    <div className="hrfeedback-analysis-section">
                      <label className="hrfeedback-analysis-label">
                        <TrendingUp size={14} />
                        Sentiment Analysis
                      </label>
                      <div
                        className="hrfeedback-sentiment-card"
                        style={{
                          borderColor: getSentimentColor(
                            analysisData.sentiment_analysis.sentiment
                          ),
                        }}
                      >
                        <div className="hrfeedback-sentiment-header">
                          <span
                            className="hrfeedback-sentiment-result"
                            style={{
                              color: getSentimentColor(
                                analysisData.sentiment_analysis.sentiment
                              ),
                            }}
                          >
                            {getSentimentIcon(
                              analysisData.sentiment_analysis.sentiment
                            )}{" "}
                            {analysisData.sentiment_analysis.sentiment} (
                            {analysisData.sentiment_analysis.sentiment_category}
                            )
                          </span>
                          {analysisData.sentiment_analysis.confidence !==
                            undefined && (
                            <span
                              className="hrfeedback-sentiment-confidence"
                              style={{
                                backgroundColor: `${getSentimentColor(
                                  analysisData.sentiment_analysis.sentiment
                                )}15`,
                                color: getSentimentColor(
                                  analysisData.sentiment_analysis.sentiment
                                ),
                                border: `1px solid ${getSentimentColor(
                                  analysisData.sentiment_analysis.sentiment
                                )}40`,
                              }}
                            >
                              {(
                                analysisData.sentiment_analysis.confidence * 100
                              ).toFixed(1)}
                              % Confidence
                            </span>
                          )}
                        </div>

                        {/* Sentiment Scores Grid */}
                        <div className="hrfeedback-sentiment-scores">
                          <div className="hrfeedback-sentiment-score-item">
                            <span className="hrfeedback-sentiment-score-label">
                              Polarity
                            </span>
                            <span className="hrfeedback-sentiment-score-value">
                              {analysisData.sentiment_analysis.polarity?.toFixed(
                                2
                              ) || "N/A"}
                            </span>
                          </div>
                          <div className="hrfeedback-sentiment-score-item">
                            <span className="hrfeedback-sentiment-score-label">
                              Subjectivity
                            </span>
                            <span className="hrfeedback-sentiment-score-value">
                              {analysisData.sentiment_analysis.subjectivity?.toFixed(
                                2
                              ) || "N/A"}
                            </span>
                          </div>
                          <div className="hrfeedback-sentiment-score-item">
                            <span className="hrfeedback-sentiment-score-label">
                              Intensity
                            </span>
                            <span className="hrfeedback-sentiment-score-value">
                              {analysisData.sentiment_analysis.intensity?.toFixed(
                                2
                              ) || "N/A"}
                            </span>
                          </div>
                        </div>

                        {/* VADER Scores */}
                        <div className="hrfeedback-vader-section">
                          <div className="hrfeedback-vader-label">
                            VADER Scores
                          </div>
                          <div className="hrfeedback-vader-bars">
                            <div className="hrfeedback-vader-bar-item">
                              <span className="hrfeedback-vader-bar-label">
                                Positive
                              </span>
                              <div className="hrfeedback-vader-bar-bg">
                                <div
                                  className="hrfeedback-vader-bar-fill"
                                  style={{
                                    width: `${
                                      (analysisData.sentiment_analysis
                                        .vader_positive || 0) * 100
                                    }%`,
                                    background: "#198754",
                                  }}
                                />
                              </div>
                              <span className="hrfeedback-vader-bar-value">
                                {(
                                  (analysisData.sentiment_analysis
                                    .vader_positive || 0) * 100
                                ).toFixed(1)}
                                %
                              </span>
                            </div>
                            <div className="hrfeedback-vader-bar-item">
                              <span className="hrfeedback-vader-bar-label">
                                Neutral
                              </span>
                              <div className="hrfeedback-vader-bar-bg">
                                <div
                                  className="hrfeedback-vader-bar-fill"
                                  style={{
                                    width: `${
                                      (analysisData.sentiment_analysis
                                        .vader_neutral || 0) * 100
                                    }%`,
                                    background: "#6c757d",
                                  }}
                                />
                              </div>
                              <span className="hrfeedback-vader-bar-value">
                                {(
                                  (analysisData.sentiment_analysis
                                    .vader_neutral || 0) * 100
                                ).toFixed(1)}
                                %
                              </span>
                            </div>
                            <div className="hrfeedback-vader-bar-item">
                              <span className="hrfeedback-vader-bar-label">
                                Negative
                              </span>
                              <div className="hrfeedback-vader-bar-bg">
                                <div
                                  className="hrfeedback-vader-bar-fill"
                                  style={{
                                    width: `${
                                      (analysisData.sentiment_analysis
                                        .vader_negative || 0) * 100
                                    }%`,
                                    background: "#dc3545",
                                  }}
                                />
                              </div>
                              <span className="hrfeedback-vader-bar-value">
                                {(
                                  (analysisData.sentiment_analysis
                                    .vader_negative || 0) * 100
                                ).toFixed(1)}
                                %
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Emotion Scores */}
                  {analysisData.emotion_scores && (
                    <div className="hrfeedback-analysis-section">
                      <label className="hrfeedback-analysis-label">
                        <Sparkles size={14} />
                        Emotion Analysis
                      </label>
                      <div className="hrfeedback-emotion-card">
                        {analysisData.dominant_emotion && (
                          <div className="hrfeedback-emotion-dominant">
                            <span className="hrfeedback-emotion-label">
                              Dominant Emotion:
                            </span>
                            <span className="hrfeedback-emotion-value">
                              {analysisData.dominant_emotion}
                            </span>
                            {analysisData.secondary_emotion && (
                              <>
                                <span className="hrfeedback-emotion-separator">
                                  |
                                </span>
                                <span className="hrfeedback-emotion-label">
                                  Secondary:
                                </span>
                                <span className="hrfeedback-emotion-value-secondary">
                                  {analysisData.secondary_emotion}
                                </span>
                              </>
                            )}
                          </div>
                        )}
                        <div className="hrfeedback-emotion-grid">
                          {Object.entries(analysisData.emotion_scores)
                            .filter(([_, score]) => score > 0)
                            .sort(([, a], [, b]) => b - a)
                            .map(([emotion, score]) => (
                              <div
                                key={emotion}
                                className="hrfeedback-emotion-item"
                              >
                                <div className="hrfeedback-emotion-item-header">
                                  <span className="hrfeedback-emotion-name">
                                    {emotion.charAt(0).toUpperCase() +
                                      emotion.slice(1)}
                                  </span>
                                  <span className="hrfeedback-emotion-score">
                                    {(score * 100).toFixed(0)}%
                                  </span>
                                </div>
                                <div className="hrfeedback-emotion-bar-bg">
                                  <div
                                    className="hrfeedback-emotion-bar-fill"
                                    style={{ width: `${score * 100}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bias Analysis */}
                  {analysisData.bias_analysis && (
                    <div className="hrfeedback-analysis-section">
                      <label className="hrfeedback-analysis-label">
                        <Shield size={14} />
                        Bias Analysis
                      </label>
                      <div
                        className="hrfeedback-bias-card"
                        style={{
                          borderColor: analysisData.bias_analysis.has_bias
                            ? getBiasLevelColor(
                                analysisData.bias_analysis.bias_level
                              )
                            : "#198754",
                        }}
                      >
                        <div className="hrfeedback-bias-header">
                          <div>
                            <span className="hrfeedback-bias-status">
                              {analysisData.bias_analysis.has_bias
                                ? "⚠️ Bias Detected"
                                : "✓ No Bias Detected"}
                            </span>
                            {analysisData.bias_analysis.bias_level && (
                              <span
                                className="hrfeedback-bias-level"
                                style={{
                                  color: getBiasLevelColor(
                                    analysisData.bias_analysis.bias_level
                                  ),
                                }}
                              >
                                Level: {analysisData.bias_analysis.bias_level}
                              </span>
                            )}
                          </div>
                          {analysisData.bias_analysis.bias_score !==
                            undefined && (
                            <span
                              className="hrfeedback-bias-score-badge"
                              style={{
                                backgroundColor: `${getBiasLevelColor(
                                  analysisData.bias_analysis.bias_level
                                )}15`,
                                color: getBiasLevelColor(
                                  analysisData.bias_analysis.bias_level
                                ),
                                border: `1px solid ${getBiasLevelColor(
                                  analysisData.bias_analysis.bias_level
                                )}40`,
                              }}
                            >
                              Score:{" "}
                              {(
                                analysisData.bias_analysis.bias_score * 100
                              ).toFixed(0)}
                              %
                            </span>
                          )}
                        </div>

                        {analysisData.bias_analysis.biased_words &&
                          analysisData.bias_analysis.biased_words.length >
                            0 && (
                            <div className="hrfeedback-bias-words-section">
                              <div className="hrfeedback-bias-words-label">
                                Biased Terms Detected:
                              </div>
                              <div className="hrfeedback-bias-words-container">
                                {analysisData.bias_analysis.biased_words.map(
                                  (word, idx) => (
                                    <span
                                      key={idx}
                                      className="hrfeedback-bias-word-tag"
                                    >
                                      {word}
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                        {analysisData.bias_analysis.bias_categories &&
                          Object.keys(
                            analysisData.bias_analysis.bias_categories
                          ).length > 0 && (
                            <div className="hrfeedback-bias-categories-section">
                              <div className="hrfeedback-bias-categories-label">
                                Bias Categories:
                              </div>
                              {Object.entries(
                                analysisData.bias_analysis.bias_categories
                              ).map(([category, words]) =>
                                words && words.length > 0 ? (
                                  <div
                                    key={category}
                                    className="hrfeedback-bias-category-item"
                                  >
                                    <strong>
                                      {category
                                        .split("_")
                                        .map(
                                          (w) =>
                                            w.charAt(0).toUpperCase() +
                                            w.slice(1)
                                        )
                                        .join(" ")}
                                      :
                                    </strong>{" "}
                                    {words.join(", ")}
                                  </div>
                                ) : null
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                  )}

                  {/* Toxicity Analysis */}
                  {analysisData.toxicity_analysis && (
                    <div className="hrfeedback-analysis-section">
                      <label className="hrfeedback-analysis-label">
                        <AlertTriangle size={14} />
                        Toxicity Analysis
                      </label>
                      <div
                        className="hrfeedback-toxicity-card"
                        style={{
                          borderColor: analysisData.toxicity_analysis.is_toxic
                            ? "#dc3545"
                            : "#198754",
                        }}
                      >
                        <div className="hrfeedback-toxicity-header">
                          <span
                            className="hrfeedback-toxicity-status"
                            style={{
                              color: analysisData.toxicity_analysis.is_toxic
                                ? "#dc3545"
                                : "#198754",
                            }}
                          >
                            {analysisData.toxicity_analysis.is_toxic
                              ? "⚠️ Toxic Content Detected"
                              : "✓ No Toxic Content"}
                          </span>
                          <span
                            className="hrfeedback-toxicity-severity"
                            style={{
                              backgroundColor: analysisData.toxicity_analysis
                                .is_toxic
                                ? "#dc354515"
                                : "#19875415",
                              color: analysisData.toxicity_analysis.is_toxic
                                ? "#dc3545"
                                : "#198754",
                              border: analysisData.toxicity_analysis.is_toxic
                                ? "1px solid #dc354540"
                                : "1px solid #19875440",
                            }}
                          >
                            Severity:{" "}
                            {analysisData.toxicity_analysis.severity}
                          </span>
                        </div>
                        {analysisData.toxicity_analysis.toxic_elements &&
                          analysisData.toxicity_analysis.toxic_elements.length >
                            0 && (
                            <div className="hrfeedback-toxic-elements">
                              <strong>Toxic Elements:</strong>
                              <ul className="hrfeedback-toxic-list">
                                {analysisData.toxicity_analysis.toxic_elements.map(
                                  (element, idx) => (
                                    <li key={idx}>{element}</li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                      </div>
                    </div>
                  )}

                  {/* Constructiveness Analysis */}
                  {analysisData.constructiveness_analysis && (
                    <div className="hrfeedback-analysis-section">
                      <label className="hrfeedback-analysis-label">
                        <Target size={14} />
                        Constructiveness Analysis
                      </label>
                      <div className="hrfeedback-constructiveness-card">
                        <div className="hrfeedback-constructiveness-flags">
                          <div
                            className="hrfeedback-constructiveness-flag"
                            style={{
                              color: analysisData.constructiveness_analysis
                                .is_constructive
                                ? "#198754"
                                : "#6c757d",
                            }}
                          >
                            {analysisData.constructiveness_analysis
                              .is_constructive
                              ? "✓"
                              : "○"}{" "}
                            Constructive
                          </div>
                          <div
                            className="hrfeedback-constructiveness-flag"
                            style={{
                              color: analysisData.constructiveness_analysis
                                .is_specific
                                ? "#198754"
                                : "#6c757d",
                            }}
                          >
                            {analysisData.constructiveness_analysis.is_specific
                              ? "✓"
                              : "○"}{" "}
                            Specific
                          </div>
                          <div
                            className="hrfeedback-constructiveness-flag"
                            style={{
                              color: analysisData.constructiveness_analysis
                                .is_actionable
                                ? "#198754"
                                : "#6c757d",
                            }}
                          >
                            {analysisData.constructiveness_analysis
                              .is_actionable
                              ? "✓"
                              : "○"}{" "}
                            Actionable
                          </div>
                          <div
                            className="hrfeedback-constructiveness-flag"
                            style={{
                              color: analysisData.constructiveness_analysis
                                .has_examples
                                ? "#198754"
                                : "#6c757d",
                            }}
                          >
                            {analysisData.constructiveness_analysis.has_examples
                              ? "✓"
                              : "○"}{" "}
                            Has Examples
                          </div>
                        </div>

                        {analysisData.constructiveness_analysis
                          .action_items_count !== undefined && (
                          <div className="hrfeedback-constructiveness-action-count">
                            Action Items:{" "}
                            {
                              analysisData.constructiveness_analysis
                                .action_items_count
                            }
                          </div>
                        )}

                        {analysisData.constructiveness_analysis
                          .positive_elements &&
                          analysisData.constructiveness_analysis
                            .positive_elements.length > 0 && (
                            <div className="hrfeedback-constructiveness-elements">
                              <div className="hrfeedback-constructiveness-elements-label">
                                <ThumbsUp size={14} /> Positive Elements:
                              </div>
                              <ul className="hrfeedback-constructiveness-list">
                                {analysisData.constructiveness_analysis.positive_elements.map(
                                  (element, idx) => (
                                    <li key={idx}>{element}</li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}

                        {analysisData.constructiveness_analysis
                          .negative_elements &&
                          analysisData.constructiveness_analysis
                            .negative_elements.length > 0 && (
                            <div className="hrfeedback-constructiveness-elements">
                              <div className="hrfeedback-constructiveness-elements-label">
                                <ThumbsDown size={14} /> Negative Elements:
                              </div>
                              <ul className="hrfeedback-constructiveness-list">
                                {analysisData.constructiveness_analysis.negative_elements.map(
                                  (element, idx) => (
                                    <li key={idx}>{element}</li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                      </div>
                    </div>
                  )}

                  {/* Feedback Metrics */}
                  {analysisData.feedback_metrics && (
                    <div className="hrfeedback-analysis-section">
                      <label className="hrfeedback-analysis-label">
                        <BarChart size={14} />
                        Feedback Metrics
                      </label>
                      <div className="hrfeedback-feedback-metrics-grid">
                        {Object.entries(analysisData.feedback_metrics).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="hrfeedback-feedback-metric-item"
                            >
                              <span className="hrfeedback-feedback-metric-label">
                                {key
                                  .split("_")
                                  .map(
                                    (w) => w.charAt(0).toUpperCase() + w.slice(1)
                                  )
                                  .join(" ")}
                              </span>
                              <span className="hrfeedback-feedback-metric-value">
                                {typeof value === "number"
                                  ? value.toFixed(2)
                                  : value}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Key Insights */}
                  {analysisData.key_insights &&
                    analysisData.key_insights.length > 0 && (
                      <div className="hrfeedback-analysis-section">
                        <label className="hrfeedback-analysis-label">
                          <CheckCircle size={14} />
                          Key Insights
                        </label>
                        <ul className="hrfeedback-insights-list">
                          {analysisData.key_insights.map((insight, idx) => (
                            <li key={idx}>{insight}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {/* Suggestions */}
                  {analysisData.suggestions && (
                    <div className="hrfeedback-analysis-section">
                      <label className="hrfeedback-analysis-label">
                        💡 Improvement Suggestions
                      </label>
                      <div className="hrfeedback-suggestions-card">
                        {analysisData.suggestions.suggestions &&
                          analysisData.suggestions.suggestions.length > 0 && (
                            <div>
                              <div className="hrfeedback-suggestions-subtitle">
                                Actionable Recommendations:
                              </div>
                              <ul className="hrfeedback-suggestions-list">
                                {analysisData.suggestions.suggestions.map(
                                  (suggestion, idx) => (
                                    <li key={idx}>{suggestion}</li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}

                        {analysisData.suggestions.rewritten_example && (
                          <div className="hrfeedback-rewritten-example">
                            <div className="hrfeedback-rewritten-label">
                              💡 Example Rewrite:
                            </div>
                            <div className="hrfeedback-rewritten-content">
                              {analysisData.suggestions.rewritten_example}
                            </div>
                          </div>
                        )}

                        {analysisData.suggestions.improvement_areas &&
                          analysisData.suggestions.improvement_areas.length >
                            0 && (
                            <div className="hrfeedback-improvement-areas">
                              <div className="hrfeedback-improvement-label">
                                Focus Areas for Improvement:
                              </div>
                              <div className="hrfeedback-improvement-tags">
                                {analysisData.suggestions.improvement_areas.map(
                                  (area, idx) => (
                                    <span
                                      key={idx}
                                      className="hrfeedback-improvement-tag"
                                    >
                                      {area}
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="hrfeedback-modal-footer">
              <button
                className="hrfeedback-modal-close-footer-btn"
                onClick={handleCloseAnalysisModal}
              >
                Close Analysis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== STYLES ========== */}
      <style>{`
        /* ========== CONTAINER & LAYOUT ========== */
        .hrfeedback-list-container {
          min-height: 100vh;
          background: #f8f9fa;
          padding: 2rem 1rem;
        }

        .hrfeedback-list-wrapper {
          max-width: 1400px;
          margin: 0 auto;
        }

        /* ========== HEADER ========== */
        .hrfeedback-list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .hrfeedback-list-title {
          font-size: 1.75rem;
          color: #212529;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .hrfeedback-list-subtitle {
          margin-bottom: 0;
          color: #6c757d;
          font-size: 0.875rem;
        }

        .hrfeedback-refresh-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: white;
          border: 2px solid #dee2e6;
          border-radius: 8px;
          padding: 10px 20px;
          font-weight: 600;
          color: #495057;
          cursor: pointer;
          transition: all 0.2s;
        }

        .hrfeedback-refresh-btn:hover:not(:disabled) {
          border-color: #27235C;
          color: #27235C;
        }

        .hrfeedback-refresh-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .hrfeedback-spin {
          animation: hrfeedback-spin-animation 1s linear infinite;
        }

        @keyframes hrfeedback-spin-animation {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* ========== ALERT ========== */
        .hrfeedback-alert-error {
          background: #f8d7da;
          border: 1px solid #f5c2c7;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .hrfeedback-alert-icon {
          flex-shrink: 0;
          color: #842029;
          margin-top: 2px;
        }

        .hrfeedback-alert-content {
          flex: 1;
          color: #842029;
        }

        .hrfeedback-alert-content strong {
          display: block;
          margin-bottom: 0.25rem;
        }

        .hrfeedback-alert-text {
          margin: 0;
          font-size: 0.875rem;
        }

        .hrfeedback-alert-close {
          background: transparent;
          border: none;
          font-size: 1.5rem;
          color: #842029;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          line-height: 1;
        }

        /* ========== TOGGLE NAVIGATION ========== */
        .hrfeedback-toggle-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 2rem;
        }

        .hrfeedback-toggle-container {
          background-color: #27235c;
          border-radius: 55px;
          padding: 7px;
          display: inline-flex;
          gap: 2px;
          box-shadow: 0 5px 15px rgba(39, 35, 92, 0.22);
          min-height: 54px;
        }

        .hrfeedback-toggle-btn {
          background: transparent;
          color: #ffffff;
          border: none;
          border-radius: 55px;
          padding: 12px 30px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
          min-height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .hrfeedback-toggle-btn-active {
          background: #ffffff;
          color: #27235c;
        }

        .hrfeedback-toggle-btn:hover {
          opacity: 0.92;
        }

        .hrfeedback-toggle-btn:active {
          transform: scale(0.98);
        }

        .hrfeedback-toggle-badge {
          background-color: rgba(255,255,255,0.3);
          color: #ffffff;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 700;
          min-width: 24px;
          text-align: center;
        }

        .hrfeedback-toggle-btn-active .hrfeedback-toggle-badge {
          background-color: #27235c;
        }

        /* ========== LOADING STATE ========== */
        .hrfeedback-loading-container {
          text-align: center;
          padding: 3rem 0;
        }

        .hrfeedback-spinner {
          width: 3rem;
          height: 3rem;
          border: 3px solid #e9ecef;
          border-top-color: #27235C;
          border-radius: 50%;
          animation: hrfeedback-spin-animation 1s linear infinite;
          margin: 0 auto 1rem;
        }

        .hrfeedback-loading-text {
          color: #6c757d;
          margin: 0;
          font-weight: 500;
        }

        /* ========== EMPTY STATE ========== */
        .hrfeedback-empty-state {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 3rem;
          text-align: center;
        }

        .hrfeedback-empty-icon {
          color: #cbd5e1;
          margin-bottom: 1rem;
        }

        .hrfeedback-empty-title {
          font-weight: 700;
          color: #6c757d;
          margin-bottom: 0.5rem;
        }

        .hrfeedback-empty-text {
          color: #6c757d;
          margin: 0;
        }

        /* ========== FEEDBACK CARDS ========== */
        .hrfeedback-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-left: 4px solid #27235C;
          border-radius: 10px;
          padding: 1.25rem;
          height: 100%;
          transition: box-shadow 0.2s;
          cursor: pointer;
          text-align: left;
        }

        .hrfeedback-card:hover {
          box-shadow: 0 4px 12px rgba(39, 35, 92, 0.2);
        }

        .hrfeedback-card-mentor {
          border-left-color: #27235C;
        }

        .hrfeedback-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .hrfeedback-card-label {
          font-size: 0.75rem;
          color: #6c757d;
          margin-bottom: 4px;
          font-weight: 600;
          text-align: left;
        }

        .hrfeedback-card-name-row {
          display: flex;
          align-items: center;
          gap: 6px;
          text-align: left;
        }

        .hrfeedback-mb-2 {
          margin-bottom: 0.5rem;
        }

        .hrfeedback-card-user-icon {
          color: #27235C;
          flex-shrink: 0;
        }

        .hrfeedback-card-name {
          margin: 0;
          font-size: 0.938rem;
          font-weight: 700;
          color: #212529;
          text-align: left;
        }

        .hrfeedback-card-name-small {
          margin: 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: #212529;
          text-align: left;
        }

        .hrfeedback-card-date {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #6c757d;
          font-size: 0.813rem;
          margin-bottom: 1rem;
        }

        .hrfeedback-card-anonymous {
          font-size: 0.813rem;
          color: #6c757d;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .hrfeedback-card-content {
          background: #f8f9fa;
          padding: 0.75rem;
          border-radius: 6px;
          min-height: 60px;
          margin-bottom: 1rem;
        }

        .hrfeedback-card-text {
          margin: 0;
          font-size: 0.813rem;
          color: #495057;
          line-height: 1.5;
        }

        .hrfeedback-card-actions {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .hrfeedback-btn-view {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #27235C;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .hrfeedback-btn-view:hover {
          background: #1a1640;
        }

        .hrfeedback-btn-delete {
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          color: #dc3545;
          border: 2px solid #dc3545;
          border-radius: 6px;
          padding: 8px;
          width: 40px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .hrfeedback-btn-delete:hover {
          background: #dc3545;
          color: white;
        }

        .hrfeedback-btn-analyze {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: white;
          color: #27235C;
          border: 2px solid #27235C;
          border-radius: 6px;
          padding: 8px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .hrfeedback-btn-analyze:hover {
          background: #27235C;
          color: white;
        }

        /* ========== MODAL OVERLAY ========== */
        .hrfeedback-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.6);
          z-index: 1050;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          animation: hrfeedback-fade-in 0.2s ease;
        }

        @keyframes hrfeedback-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .hrfeedback-modal-container {
          background-color: white;
          border-radius: 12px;
          width: 100%;
          max-width: 900px;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          animation: hrfeedback-slide-up 0.3s ease;
        }

        @keyframes hrfeedback-slide-up {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        /* ========== MODAL HEADER ========== */
        .hrfeedback-modal-header {
          background: linear-gradient(135deg, #27235C 0%, #3d3a70 100%);
          color: white;
          padding: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .hrfeedback-modal-header-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .hrfeedback-modal-title {
          margin: 0;
          font-weight: 700;
          font-size: 1.25rem;
          color:white
        }

        .hrfeedback-modal-close-btn {
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          padding: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: background 0.2s;
        }

        .hrfeedback-modal-close-btn:hover {
          background: rgba(255,255,255,0.1);
        }

        /* ========== MODAL BODY ========== */
        .hrfeedback-modal-body {
          padding: 1.5rem;
          overflow-y: auto;
          flex: 1;
        }

        .hrfeedback-modal-loading {
          text-align: center;
          padding: 3rem 1rem;
        }

        .hrfeedback-loading-subtext {
          color: #6c757d;
          font-size: 0.875rem;
          margin-top: 0.5rem;
        }

        .hrfeedback-modal-error {
          background: #f8d7da;
          border: 1px solid #f5c2c7;
          border-radius: 8px;
          padding: 1rem;
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          color: #842029;
        }

        .hrfeedback-modal-error-text {
          margin: 0.25rem 0 0 0;
          font-size: 0.875rem;
        }

        /* ========== ANALYSIS CONTENT ========== */
        .hrfeedback-analysis-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .hrfeedback-analysis-section {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .hrfeedback-analysis-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: #6c757d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
          gap: 6px;
          margin: 0;
        }

        .hrfeedback-analysis-feedback-box {
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          font-size: 0.938rem;
          color: #212529;
          line-height: 1.6;
        }

        .hrfeedback-summary-box {
          background: #e7f3ff;
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid #b3d9ff;
          font-size: 0.938rem;
          color: #212529;
          line-height: 1.6;
        }

        /* ========== METRICS GRID ========== */
        .hrfeedback-metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .hrfeedback-metric-card {
          background: white;
          border: 2px solid;
          border-radius: 8px;
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .hrfeedback-metric-icon {
          flex-shrink: 0;
        }

        .hrfeedback-metric-content {
          flex: 1;
        }

        .hrfeedback-metric-label {
          font-size: 0.75rem;
          color: #6c757d;
          font-weight: 600;
          display: block;
          margin-bottom: 0.25rem;
        }

        .hrfeedback-metric-value {
          font-size: 1.5rem;
          font-weight: 700;
        }

        /* ========== SENTIMENT CARD ========== */
        .hrfeedback-sentiment-card {
          background: #fff;
          padding: 1.25rem;
          border-radius: 8px;
          border: 2px solid;
        }

        .hrfeedback-sentiment-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .hrfeedback-sentiment-result {
          font-size: 1.25rem;
          font-weight: 700;
        }

        .hrfeedback-sentiment-confidence {
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.813rem;
          font-weight: 600;
        }

        .hrfeedback-sentiment-scores {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }

        .hrfeedback-sentiment-score-item {
          background: #f8f9fa;
          padding: 0.75rem;
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .hrfeedback-sentiment-score-label {
          font-size: 0.75rem;
          color: #6c757d;
          font-weight: 600;
        }

        .hrfeedback-sentiment-score-value {
          font-size: 1.125rem;
          font-weight: 700;
          color: #212529;
        }

        .hrfeedback-vader-section {
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid #e5e7eb;
        }

        .hrfeedback-vader-label {
          font-size: 0.813rem;
          font-weight: 700;
          color: #495057;
          margin-bottom: 0.75rem;
        }

        .hrfeedback-vader-bars {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .hrfeedback-vader-bar-item {
          display: grid;
          grid-template-columns: 80px 1fr 60px;
          align-items: center;
          gap: 0.75rem;
        }

        .hrfeedback-vader-bar-label {
          font-size: 0.813rem;
          font-weight: 600;
          color: #495057;
        }

        .hrfeedback-vader-bar-bg {
          background: #e9ecef;
          height: 8px;
          border-radius: 4px;
          overflow: hidden;
        }

        .hrfeedback-vader-bar-fill {
          height: 100%;
          transition: width 0.3s ease;
          border-radius: 4px;
        }

        .hrfeedback-vader-bar-value {
          font-size: 0.75rem;
          font-weight: 600;
          color: #495057;
          text-align: right;
        }

        /* ========== EMOTION CARD ========== */
        .hrfeedback-emotion-card {
          background: #fff;
          padding: 1.25rem;
          border-radius: 8px;
          border: 2px solid #e5e7eb;
        }

        .hrfeedback-emotion-dominant {
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .hrfeedback-emotion-label {
          font-size: 0.813rem;
          color: #6c757d;
          font-weight: 600;
        }

        .hrfeedback-emotion-value {
          font-size: 1.125rem;
          font-weight: 700;
          color: #27235C;
        }

        .hrfeedback-emotion-separator {
          color: #dee2e6;
          font-weight: 300;
        }

        .hrfeedback-emotion-value-secondary {
          font-size: 1rem;
          font-weight: 600;
          color: #6c757d;
        }

        .hrfeedback-emotion-grid {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .hrfeedback-emotion-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .hrfeedback-emotion-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .hrfeedback-emotion-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: #495057;
        }

        .hrfeedback-emotion-score {
          font-size: 0.813rem;
          font-weight: 700;
          color: #27235C;
        }

        .hrfeedback-emotion-bar-bg {
          background: #e9ecef;
          height: 8px;
          border-radius: 4px;
          overflow: hidden;
        }

        .hrfeedback-emotion-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #27235C 0%, #3d3a70 100%);
          transition: width 0.3s ease;
          border-radius: 4px;
        }

        /* ========== BIAS CARD ========== */
        .hrfeedback-bias-card {
          background: #fff;
          padding: 1.25rem;
          border-radius: 8px;
          border: 2px solid;
        }

        .hrfeedback-bias-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .hrfeedback-bias-status {
          font-size: 1.125rem;
          font-weight: 700;
          color: #212529;
          display: block;
          margin-bottom: 0.25rem;
        }

        .hrfeedback-bias-level {
          font-size: 0.875rem;
          font-weight: 600;
          display: block;
        }

        .hrfeedback-bias-score-badge {
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.813rem;
          font-weight: 600;
        }

        .hrfeedback-bias-words-section {
          margin-top: 1rem;
        }

        .hrfeedback-bias-words-label {
          font-size: 0.813rem;
          font-weight: 700;
          color: #495057;
          margin-bottom: 0.5rem;
        }

        .hrfeedback-bias-words-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .hrfeedback-bias-word-tag {
          background: #dc354515;
          color: #dc3545;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 0.813rem;
          font-weight: 600;
          border: 1.5px solid #dc354540;
        }

        .hrfeedback-bias-categories-section {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e5e7eb;
        }

        .hrfeedback-bias-categories-label {
          font-size: 0.813rem;
          font-weight: 700;
          color: #495057;
          margin-bottom: 0.5rem;
        }

        .hrfeedback-bias-category-item {
          font-size: 0.875rem;
          color: #495057;
          margin-bottom: 0.5rem;
          line-height: 1.5;
        }

        /* ========== TOXICITY CARD ========== */
        .hrfeedback-toxicity-card {
          background: #fff;
          padding: 1.25rem;
          border-radius: 8px;
          border: 2px solid;
        }

        .hrfeedback-toxicity-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .hrfeedback-toxicity-status {
          font-size: 1.125rem;
          font-weight: 700;
        }

        .hrfeedback-toxicity-severity {
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.813rem;
          font-weight: 600;
        }

        .hrfeedback-toxic-elements {
          margin-top: 1rem;
          font-size: 0.875rem;
          color: #495057;
        }

        .hrfeedback-toxic-list {
          margin: 0.5rem 0 0 1.5rem;
          padding: 0;
        }

        /* ========== CONSTRUCTIVENESS CARD ========== */
        .hrfeedback-constructiveness-card {
          background: #fff;
          padding: 1.25rem;
          border-radius: 8px;
          border: 2px solid #e5e7eb;
        }

        .hrfeedback-constructiveness-flags {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .hrfeedback-constructiveness-flag {
          font-size: 0.875rem;
          font-weight: 600;
        }

        .hrfeedback-constructiveness-action-count {
          background: #f8f9fa;
          padding: 0.75rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 600;
          color: #495057;
          margin-bottom: 1rem;
        }

        .hrfeedback-constructiveness-elements {
          margin-top: 1rem;
        }

        .hrfeedback-constructiveness-elements-label {
          font-size: 0.813rem;
          font-weight: 700;
          color: #495057;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .hrfeedback-constructiveness-list {
          margin: 0;
          padding-left: 1.5rem;
        }

        .hrfeedback-constructiveness-list li {
          font-size: 0.875rem;
          color: #495057;
          line-height: 1.5;
          margin-bottom: 0.25rem;
        }

        /* ========== FEEDBACK METRICS GRID ========== */
        .hrfeedback-feedback-metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 1rem;
        }

        .hrfeedback-feedback-metric-item {
          background: #f8f9fa;
          padding: 0.75rem;
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .hrfeedback-feedback-metric-label {
          font-size: 0.75rem;
          color: #6c757d;
          font-weight: 600;
        }

        .hrfeedback-feedback-metric-value {
          font-size: 1.125rem;
          font-weight: 700;
          color: #212529;
        }

        /* ========== INSIGHTS LIST ========== */
        .hrfeedback-insights-list {
          margin: 0;
          padding-left: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .hrfeedback-insights-list li {
          font-size: 0.875rem;
          line-height: 1.6;
          color: #495057;
        }

        /* ========== SUGGESTIONS CARD ========== */
        .hrfeedback-suggestions-card {
          background: #fff;
          padding: 1.25rem;
          border-radius: 8px;
          border: 2px solid #27235C20;
        }

        .hrfeedback-suggestions-subtitle {
          font-size: 0.875rem;
          font-weight: 700;
          color: #495057;
          margin-bottom: 0.75rem;
        }

        .hrfeedback-suggestions-list {
          margin: 0 0 1rem 1.5rem;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .hrfeedback-suggestions-list li {
          font-size: 0.875rem;
          line-height: 1.6;
          color: #495057;
        }

        .hrfeedback-rewritten-example {
          background: #e7f3ff;
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid #b3d9ff;
          margin-top: 1rem;
        }

        .hrfeedback-rewritten-label {
          font-size: 0.813rem;
          font-weight: 700;
          color: #495057;
          margin-bottom: 0.5rem;
        }

        .hrfeedback-rewritten-content {
          font-size: 0.875rem;
          color: #212529;
          line-height: 1.6;
        }

        .hrfeedback-improvement-areas {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e5e7eb;
        }

        .hrfeedback-improvement-label {
          font-size: 0.813rem;
          font-weight: 700;
          color: #495057;
          margin-bottom: 0.75rem;
        }

        .hrfeedback-improvement-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .hrfeedback-improvement-tag {
          background: #ffc10715;
          color: #856404;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 0.813rem;
          font-weight: 600;
          border: 1.5px solid #ffc10740;
        }

        /* ========== MODAL FOOTER ========== */
        .hrfeedback-modal-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
        }

        .hrfeedback-modal-close-footer-btn {
          background: #27235C;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 10px 24px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .hrfeedback-modal-close-footer-btn:hover {
          background: #1a1640;
        }

        /* ========== RESPONSIVE ========== */
        @media (max-width: 768px) {
          .hrfeedback-list-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .hrfeedback-toggle-container {
            flex-direction: column;
            width: 100%;
          }

          .hrfeedback-toggle-btn {
            width: 100%;
          }

          .hrfeedback-modal-container {
            max-width: 95%;
          }

          .hrfeedback-metrics-grid {
            grid-template-columns: 1fr;
          }

          .hrfeedback-vader-bar-item {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }
        }

        /* ========== UTILITIES ========== */
        .visually-hidden {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }
      `}</style>
    </div>
  );
}
