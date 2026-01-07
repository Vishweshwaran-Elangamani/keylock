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
  <span
    className={`fm-hrlist-badge-wrapper ${
      color === "#27235C"
        ? "fm-hrlist-badge-wrapper--primary"
        : "fm-hrlist-badge-wrapper--default"
    }`}
  >
    {text}
  </span>
);

export default function HRFeedbackList() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("Mentor");
  const [mentor, setMentor] = useState([]);
  const [peer, setPeer] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteFeedbackData, setDeleteFeedbackData] = useState(null);
  const [deleteFeedbackType, setDeleteFeedbackType] = useState("");

  const fetchAllData = async () => {
    setLoading(true);
    setRefreshing(true);
    setError("");

    try {
      const employeeResponse = await employeeApi.getAll();
      const employees = Array.isArray(employeeResponse?.data)
        ? employeeResponse.data
        : employeeResponse?.data?.data || [];

      const employeeMap = {};
      employees.forEach((emp) => {
        const empId = emp.employeeId || emp.id || emp.EmployeeID;
        if (empId) {
          const fullName = `${emp.firstName || ""} ${
            emp.lastName || ""
          }`.trim();
          employeeMap[empId] = fullName;
          employeeMap[String(empId)] = fullName;
          employeeMap[Number(empId)] = fullName;
        }
      });

      const [mentorResponse, peerResponse] = await Promise.all([
        mentorFeedbackApi.list(1, 100).catch(() => ({ data: [] })),
        peerQueueApi.list(1, 100).catch(() => ({ data: [] })),
      ]);

      const mentorData = Array.isArray(mentorResponse?.data)
        ? mentorResponse.data
        : mentorResponse?.data?.data || [];

      const enrichedMentorData = mentorData.map((m) => {
        const mentorName =
          employeeMap[m.mentorEmployeeId] ||
          employeeMap[String(m.mentorEmployeeId)] ||
          employeeMap[Number(m.mentorEmployeeId)] ||
          null;

        const submitterId =
          m.menteeEmployeeId ||
          m.employeeId ||
          m.submittedByEmployeeId ||
          m.submitterEmployeeId ||
          m.createdByEmployeeId;

        let submitterName = null;
        if (m.menteeName && isNaN(m.menteeName)) {
          submitterName = m.menteeName;
        } else if (submitterId) {
          submitterName =
            employeeMap[submitterId] ||
            employeeMap[String(submitterId)] ||
            employeeMap[Number(submitterId)] ||
            null;
        }

        return {
          ...m,
          mentorNameFull:
            mentorName || `Employee ${m.mentorEmployeeId || "Unknown"}`,
          submitterNameFull: submitterName || "Anonymous Feedback",
        };
      });

      setMentor(enrichedMentorData);

      const peerData = Array.isArray(peerResponse?.data)
        ? peerResponse.data
        : peerResponse?.data?.data || [];

      const enrichedPeerData = peerData.map((p) => {
        let recipientName = null;
        if (p.recipientName && isNaN(p.recipientName)) {
          recipientName = p.recipientName;
        } else if (p.recipientEmployeeId) {
          recipientName =
            employeeMap[p.recipientEmployeeId] ||
            employeeMap[String(p.recipientEmployeeId)] ||
            employeeMap[Number(p.recipientEmployeeId)] ||
            null;
        }

        let submitterName = null;
        if (p.submitterName && isNaN(p.submitterName)) {
          submitterName = p.submitterName;
        } else if (p.submittedByEmployeeId) {
          submitterName =
            employeeMap[p.submittedByEmployeeId] ||
            employeeMap[String(p.submittedByEmployeeId)] ||
            employeeMap[Number(p.submittedByEmployeeId)] ||
            null;
        }

        return {
          ...p,
          recipientNameFull:
            recipientName || `Employee ${p.recipientEmployeeId || "Unknown"}`,
          submitterNameFull: submitterName || "Anonymous Feedback",
        };
      });

      setPeer(enrichedPeerData);
    } catch (err) {
      setError(err?.message || "Failed to fetch feedback data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleViewResponse = (data, type) => {
    if (type === "Mentor") {
      const normalized = {
        ...data,
        submittedByName: data.submitterNameFull || "Anonymous",
        submittedAt: data.createdAt || data.submittedAt,
        comments: data.feedbackComments || data.comments || "",
        rating: data.rating,
      };
      setSelectedResponse(normalized);
      setSelectedType(type);
      setShowModal(true);
      return;
    }

    if (type === "Peer") {
      const normalized = {
        ...data,
        submittedByName: data.submitterNameFull || "Anonymous",
        submittedAt: data.createdAt || data.submittedAt,
        comments: data.feedbackContent || data.comments || "",
      };
      setSelectedResponse(normalized);
      setSelectedType(type);
      setShowModal(true);
      return;
    }

    setSelectedResponse(data);
    setSelectedType(type);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedResponse(null);
    setSelectedType(null);
  };

  const handleAnalyzeFeedback = async (feedbackData, type) => {
    setShowAnalysisModal(true);
    setAnalysisLoading(true);
    setAnalysisError("");
    setAnalysisData(null);

    try {
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

      const result = await feedbackAnalysisApi.analyze(feedbackText);
      setAnalysisData(result);
    } catch (err) {
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
        `Employee ${deleteFeedbackData.mentorEmployeeId}`
      );
    } else if (deleteFeedbackType === "Peer") {
      const submitter =
        deleteFeedbackData.submitterNameFull ||
        `Employee ${deleteFeedbackData.submittedByEmployeeId}`;
      const recipient =
        deleteFeedbackData.recipientNameFull ||
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
      await fetchAllData();
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

  return (
    <div className="hrfeedback-list-container">
      <div className="hrfeedback-list-wrapper">
        <FeedbackBreadcrumb
          items={[
            { label: "Feedback Management", path: "/hr/dashboard/feedback" },
            { label: "Feedback Forms List" },
          ]}
        />

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
                <span className="hrfeedback-toggle-badge">{mentor.length}</span>
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

        {loading ? (
          <div className="hrfeedback-loading-container">
            <div className="hrfeedback-spinner" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="hrfeedback-loading-text">Loading submissions...</p>
          </div>
        ) : (
          <>
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
                      <div className="hrfeedback-card">
                        <div className="hrfeedback-card-header">
                          <div className="fm-hrlist-card__header-wrapper">
                            <div className="hrfeedback-card-label">Mentor</div>
                            <div className="hrfeedback-card-name-row">
                              <User
                                size={14}
                                className="hrfeedback-card-user-icon"
                              />
                              <h6 className="hrfeedback-card-name">
                                {m.mentorNameFull}
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
                  {peer.map((p) => (
                    <div className="col-md-6 col-lg-4" key={p.queueId || p.id}>
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
                                {p.submitterNameFull}
                              </h6>
                            </div>
                            <div className="hrfeedback-card-label">To</div>
                            <div className="hrfeedback-card-name-row">
                              <User
                                size={14}
                                className="hrfeedback-card-user-icon"
                              />
                              <h6 className="hrfeedback-card-name">
                                {p.recipientNameFull}
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

                        <button
                          className="hrfeedback-btn-analyze"
                          onClick={() => handleAnalyzeFeedback(p, "Peer")}
                        >
                          <ChartLine size={16} />
                          Analyze Feedback
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
          </>
        )}
      </div>

      <ResponseViewModal
        show={showModal}
        response={selectedResponse}
        onClose={handleCloseModal}
        type={selectedType}
      />

      <FeedbackAnalysisModal
        show={showAnalysisModal}
        onClose={handleCloseAnalysisModal}
        analysisData={analysisData}
        loading={analysisLoading}
        error={analysisError}
      />

      {showDeleteModal && (
        <div
          className="hrfeedback-modal-overlay"
          onClick={handleCloseDeleteModal}
        >
          <div
            className="hrfeedback-delete-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="hrfeedback-delete-header">
              <h5 className="hrfeedback-delete-title">{getDeleteTitle()}</h5>
              <button
                className="hrfeedback-delete-close"
                onClick={handleCloseDeleteModal}
              >
                <X size={24} />
              </button>
            </div>
            <div className="hrfeedback-delete-body">
              <AlertTriangle size={48} className="hrfeedback-delete-icon" />
              <p className="hrfeedback-delete-message">{getDeleteMessage()}</p>
              <div className="hrfeedback-delete-name">
                {getDeleteItemName()}
              </div>
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
