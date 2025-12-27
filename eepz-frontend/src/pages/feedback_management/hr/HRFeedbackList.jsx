// src/pages/feedback_management/hr/HRFeedbackList.jsx

import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  Eye,
  Users,
  Send,
  Clock,
  Lock,
  User,
  X,
  ChartLine,
} from "lucide-react";
import {
  mentorFeedbackApi,
  peerQueueApi,
  employeeApi,
  feedbackAnalysisApi,
} from "../../../services/feedbackmanagement/feedbackApi";
import ResponseViewModal from "../../../components/feedback_management/modals/ResponseViewModal";
import FeedbackAnalysisModal from "../../../components/feedback_management/modals/FeedbackAnalysisModal";
import FeedbackBreadcrumb from "../../../components/feedback_management/common/FeedbackBreadcrumb";
import "../../../styles/feedback/components/HRFeedbackList.css";

const Badge = ({ text, color = "#525252" }) => (
  <span className={`fm-hrlist-badge-wrapper ${color === "#27235C" ? "fm-hrlist-badge-wrapper--primary" : "fm-hrlist-badge-wrapper--default"}`}>
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
  const [isDeleting, setIsDeleting] = useState(false);

  // Delete Modal States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteFeedbackData, setDeleteFeedbackData] = useState(null);
  const [deleteFeedbackType, setDeleteFeedbackType] = useState("");

  // Fetch employee map using service
  const fetchEmployeeMap = async () => {
    try {
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
      // Fetch Mentor Feedback
      try {
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
      } catch (mentorErr) {
        console.warn("Mentor feedback API error:", mentorErr.message);
        setMentor([]);
      }

      // Fetch Peer Feedback
      try {
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

  const handleDeleteSuccess = async () => {
    // Force refresh by calling fetchData directly
    setRefreshing(true);
    setLoading(true);

    try {
      await fetchData();
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const handleDeleteClick = (item, type) => {
    setDeleteFeedbackData(item);
    setDeleteFeedbackType(type);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteFeedbackData(null);
    setDeleteFeedbackType("");
  };

  const getDeleteItemName = () => {
    if (!deleteFeedbackData) return "";

    if (deleteFeedbackType === "Mentor") {
      return (
        deleteFeedbackData.mentorNameFull ||
        deleteFeedbackData.mentorName ||
        `Employee ${deleteFeedbackData.mentorEmployeeId}`
      );
    } else if (deleteFeedbackType === "Peer") {
      const submitter =
        deleteFeedbackData.submitterNameFull ||
        deleteFeedbackData.submitterName ||
        `Employee ${deleteFeedbackData.submittedByEmployeeId}`;
      const recipient =
        deleteFeedbackData.recipientNameFull ||
        deleteFeedbackData.recipientName ||
        `Employee ${deleteFeedbackData.recipientEmployeeId}`;
      return `From ${submitter} to ${recipient}`;
    } else if (deleteFeedbackType === "HR") {
      return deleteFeedbackData.formName || "HR Form";
    }
    return "";
  };

  const handleConfirmDelete = async () => {
    if (!deleteFeedbackData || !deleteFeedbackType) return;

    setIsDeleting(true);
    try {
      if (deleteFeedbackType === "Mentor") {
        await mentorFeedbackApi.delete(deleteFeedbackData.trackingId);
      } else if (deleteFeedbackType === "Peer") {
        await peerQueueApi.delete(deleteFeedbackData.queueId);
      }

      handleCloseDeleteModal();
      await fetchData();
    } catch (err) {
      setError(err?.message || "Failed to delete feedback");
    } finally {
      setIsDeleting(false);
    }
  };

  const getDeleteTitle = () => {
    if (deleteFeedbackType === "Mentor") return "Delete Mentor Feedback";
    if (deleteFeedbackType === "Peer") return "Delete Peer Feedback";
    if (deleteFeedbackType === "HR") return "Delete HR Form";
    return "Delete Submission";
  };

  const getDeleteMessage = () => {
    if (deleteFeedbackType === "Mentor")
      return "Are you sure you want to delete this mentor feedback submission?";
    if (deleteFeedbackType === "Peer")
      return "Are you sure you want to delete this peer feedback submission?";
    if (deleteFeedbackType === "HR")
      return "Are you sure you want to delete this HR form submission?";
    return "Are you sure you want to delete this submission?";
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
                        </div>

                        {/* Analyze Feedback Button */}
                        <button
                          className="hrfeedback-btn-analyze"
                          onClick={() => handleAnalyzeFeedback(m, "Mentor")}
                        >
                          <ChartLine size={16} />
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
                    return (
                      <div
                        className="col-md-6 col-lg-4"
                        key={p.queueId || p.id}
                      >
                        <div className="hrfeedback-card">
                          <div className="hrfeedback-card-header">
                            <div className="fm-hrlist-card__header-wrapper">
                              <div className="hrfeedback-card-label">From</div>
                              <div className="hrfeedback-card-name-row hrfeedback-mb-2">
                                <User
                                  size={14}
                                  className="fm-hrlist-card__user-icon--muted"
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
                          </div>

                          {/* Analyze Feedback Button */}
                          <button
                            className="hrfeedback-btn-analyze"
                            onClick={() => handleAnalyzeFeedback(p, "Peer")}
                          >
                            <ChartLine size={16} />
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

      {/* Feedback Analysis Modal */}
      <FeedbackAnalysisModal
        show={showAnalysisModal}
        onClose={handleCloseAnalysisModal}
        analysisData={analysisData}
        loading={analysisLoading}
        error={analysisError}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="hrfeedback-modal-overlay" onClick={handleCloseDeleteModal}>
          <div className="hrfeedback-delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="hrfeedback-delete-header">
              <h5 className="hrfeedback-delete-title">{getDeleteTitle()}</h5>
              <button className="hrfeedback-delete-close" onClick={handleCloseDeleteModal}>
                <X size={24} />
              </button>
            </div>
            <div className="hrfeedback-delete-body">
              <AlertTriangle size={48} className="hrfeedback-delete-icon" />
              <p className="hrfeedback-delete-message">{getDeleteMessage()}</p>
              <div className="hrfeedback-delete-name">{getDeleteItemName()}</div>
            </div>
            <div className="hrfeedback-delete-footer">
              <button
                className="hrfeedback-btn-cancel"
                onClick={handleCloseDeleteModal}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="hrfeedback-btn-delete-confirm"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
