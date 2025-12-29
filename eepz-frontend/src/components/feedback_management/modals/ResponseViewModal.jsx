// src/components/FeedbackManagement/ResponseViewModal.jsx

import React, { useState, useEffect } from "react";
import {
  User,
  Clock,
  Lock,
  Target,
  Star,
  MessageSquare,
  Calendar,
  X,
} from "lucide-react";
import axios from "axios";
import "../../../styles/feedback/modals/ResponseViewModal.css";

const API_BASE = import.meta.env.VITE_API_BASE;

const QUESTION_TEMPLATES = {
  PerformanceReview: [
    { id: 1, text: "Quality of work delivered" },
    { id: 2, text: "Meeting deadlines and commitments" },
    { id: 3, text: "Technical skills and expertise" },
    { id: 4, text: "Problem-solving and critical thinking" },
    { id: 5, text: "Communication with team members" },
    { id: 6, text: "Collaboration and teamwork" },
    { id: 7, text: "Initiative and proactiveness" },
    { id: 8, text: "Adaptability to change" },
    { id: 9, text: "Leadership and mentoring (if applicable)" },
    { id: 10, text: "Overall contribution to the team" },
  ],
  GeneralFeedback: [
    { id: 1, text: "How would you rate overall performance?" },
    { id: 2, text: "Communication effectiveness" },
    { id: 3, text: "Teamwork and collaboration" },
    { id: 4, text: "Work quality and attention to detail" },
    { id: 5, text: "Reliability and dependability" },
  ],
  BiasReview: [
    { id: 1, text: "Treats all team members fairly regardless of background" },
    { id: 2, text: "Makes decisions based on merit, not personal preferences" },
    { id: 3, text: "Respects diverse perspectives and opinions" },
    { id: 4, text: "Provides equal opportunities to all team members" },
    { id: 5, text: "Avoids stereotyping or making assumptions" },
    { id: 6, text: "Handles conflicts impartially" },
    { id: 7, text: "Creates an inclusive work environment" },
  ],
  ProfessionalismReview: [
    { id: 1, text: "Maintains professional conduct at all times" },
    { id: 2, text: "Respects workplace policies and guidelines" },
    { id: 3, text: "Communicates professionally with colleagues" },
    { id: 4, text: "Handles confidential information appropriately" },
    { id: 5, text: "Demonstrates punctuality and attendance" },
    { id: 6, text: "Maintains appropriate workplace boundaries" },
    { id: 7, text: "Represents the organization positively" },
    { id: 8, text: "Takes accountability for actions and decisions" },
  ],
  SurveyForm: [
    { id: 1, text: "Job satisfaction level" },
    { id: 2, text: "Work-life balance" },
    { id: 3, text: "Team collaboration quality" },
    { id: 4, text: "Management support" },
    { id: 5, text: "Career growth opportunities" },
    { id: 6, text: "Work environment and culture" },
    { id: 7, text: "Resources and tools provided" },
  ],
  EvaluationForm: [
    { id: 1, text: "Meets job expectations and requirements" },
    { id: 2, text: "Demonstrates required competencies" },
    { id: 3, text: "Shows continuous improvement" },
    { id: 4, text: "Achieves set goals and objectives" },
    { id: 5, text: "Contributes to team success" },
    { id: 6, text: "Professional development and learning" },
  ],
};

const RATING_LABELS = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

const getRatingColor = (rating) => {
  const num = Number(rating);
  if (num === 5) return "#24A148";
  if (num === 4) return "#0F62FE";
  if (num === 3) return "#E2B93B";
  if (num === 2) return "#E89E14";
  if (num === 1) return "#E01950";
  return "#525252";
};

const ResponseViewModal = ({ show, response, onClose, type }) => {
  const [formDetails, setFormDetails] = useState(null);
  const [loadingFormDetails, setLoadingFormDetails] = useState(false);

  useEffect(() => {
    if (show && type === "HR" && response?.formId && !formDetails) {
      const fetchFormDetails = async () => {
        setLoadingFormDetails(true);
        try {
          const res = await axios.get(
            `${API_BASE}/HrFeedbackForm/forms/${response.formId}`
          );
          if (res?.data?.success && res?.data?.data) {
            setFormDetails(res.data.data);
          }
        } catch {
        } finally {
          setLoadingFormDetails(false);
        }
      };
      fetchFormDetails();
    }
  }, [show, type, response?.formId, formDetails]);

  const getQuestionText = (qId) => {
    const formType =
      formDetails?.formType || response?.formType || "GeneralFeedback";
    const questions = QUESTION_TEMPLATES[formType] || [];
    const q = questions.find((x) => x.id === Number(qId));
    return q ? q.text : `Question ${qId}`;
  };

  const parseHRResponses = () => {
    if (!response?.formResponse || typeof response.formResponse !== "object")
      return [];
    const items = [];
    Object.keys(response.formResponse).forEach((key) => {
      if (key.startsWith("question_")) {
        const qNum = key.replace("question_", "");
        items.push({
          qId: qNum,
          rating: response.formResponse[key],
          text: getQuestionText(qNum),
        });
      }
    });
    return items.sort((a, b) => Number(a.qId) - Number(b.qId));
  };

  const formatDate = (dateInput) => {
    if (!dateInput) return "N/A";
    try {
      const dateObj = new Date(dateInput);
      if (isNaN(dateObj.getTime())) return "N/A";
      return dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  if (!show || !response) return null;

  const hrResponses = type === "HR" ? parseHRResponses() : [];
  const userComments = response.formResponse?.comments || null;

  return (
    <div className="rvm-overlay" onClick={onClose}>
      <div className="rvm-container" onClick={(e) => e.stopPropagation()}>
        <div className="rvm-header">
          <h5 className="rvm-header__title">
            {type === "HR" && "HR Form Response"}
            {type === "Mentor" && "Mentor Feedback"}
            {type === "Peer" && "Peer Feedback"}
            {type === "Goal" && "Goal Feedback Details"}
          </h5>
          <button
            type="button"
            onClick={onClose}
            className="rvm-header__close-btn"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="rvm-body">
          {type === "HR" && (
            <>
              <div className="rvm-section">
                <h6 className="rvm-section__title">Form Information</h6>
                <div className="rvm-grid">
                  <div className="rvm-grid__col">
                    <div className="rvm-field__label">Form Name</div>
                    <div className="rvm-field__value">
                      {response.formName || "N/A"}
                    </div>
                  </div>
                  <div className="rvm-grid__col">
                    <div className="rvm-field__label">Submitted</div>
                    <div className="rvm-field__value">
                      {formatDate(response.submittedAt)}
                    </div>
                  </div>
                </div>
              </div>

              {hrResponses.length > 0 && (
                <div className="rvm-section">
                  <h6 className="rvm-section__title">
                    Your Ratings ({hrResponses.length} questions)
                  </h6>
                  {hrResponses.map((item, idx) => (
                    <div
                      key={idx}
                      className="rvm-rating-item"
                      style={{ borderLeftColor: getRatingColor(item.rating) }}
                    >
                      <div className="rvm-rating-item__header">
                        <div className="rvm-rating-item__question">
                          <small className="rvm-rating-item__question-number">
                            Question {item.qId}
                          </small>
                          <p className="rvm-rating-item__question-text">
                            {item.text}
                          </p>
                        </div>
                        <span
                          className="rvm-rating-item__badge"
                          style={{
                            backgroundColor: `${getRatingColor(
                              item.rating
                            )}20`,
                            color: getRatingColor(item.rating),
                          }}
                        >
                          {item.rating}
                        </span>
                      </div>
                      <small className="rvm-rating-item__label">
                        Rating: {RATING_LABELS[item.rating] || "N/A"}
                      </small>
                    </div>
                  ))}
                </div>
              )}

              {userComments && (
                <div className="rvm-section rvm-section--last">
                  <h6 className="rvm-section__title">Your Comments</h6>
                  <div className="rvm-comment-box rvm-comment-box--primary">
                    <p className="rvm-comment-box__text">{userComments}</p>
                  </div>
                </div>
              )}
            </>
          )}

          {(type === "Mentor" || type === "Peer") && (
            <div className="rvm-section rvm-section--last">
              <h6 className="rvm-section__title rvm-section__title--with-icon">
                <User size={16} className="rvm-field__icon" />
                Feedback Details
              </h6>
              <div className="rvm-grid rvm-grid--spaced">
                <div className="rvm-grid__col">
                  <div className="rvm-field__label">From</div>
                  <div className="rvm-field__value">
                    {response.submittedByName ||
                      response.reviewerName ||
                      response.submitterNameFull ||
                      response.submitterName ||
                      "N/A"}
                  </div>
                </div>
                <div className="rvm-grid__col">
                  <div className="rvm-field__label">Submitted</div>
                  <div className="rvm-field__value">
                    {formatDate(response.submittedAt)}
                  </div>
                </div>
              </div>

              {response.rating && (
                <div className="rvm-rating-display">
                  <p
                    className="rvm-rating-display__value"
                    style={{ color: getRatingColor(response.rating) }}
                  >
                    {response.rating}
                  </p>
                  <p className="rvm-rating-item__label">
                    {RATING_LABELS[response.rating] || "N/A"}
                  </p>
                </div>
              )}

              {response.comments && (
                <div className="rvm-comment-box rvm-comment-box--primary">
                  <p className="rvm-comment-box__text rvm-comment-box__text--pre">
                    {response.comments}
                  </p>
                </div>
              )}
            </div>
          )}

          {type !== "HR" && type !== "Mentor" && type !== "Peer" && (
            <div className="rvm-section rvm-section--last">
              <h6 className="rvm-section__title rvm-section__title--with-icon">
                <User size={16} className="rvm-field__icon" />
                Feedback Details
              </h6>
              <div className="rvm-grid rvm-grid--spaced">
                <div className="rvm-grid__col">
                  <div className="rvm-field__label">From</div>
                  <div className="rvm-field__value">
                    {response.submittedByName ||
                      response.reviewerName ||
                      response.submitterNameFull ||
                      response.submitterName ||
                      "N/A"}
                  </div>
                </div>
                <div className="rvm-grid__col">
                  <div className="rvm-field__label">Submitted</div>
                  <div className="rvm-field__value">
                    {formatDate(response.submittedAt)}
                  </div>
                </div>
              </div>

              {response.rating && (
                <div className="rvm-rating-display">
                  <p
                    className="rvm-rating-display__value"
                    style={{ color: getRatingColor(response.rating) }}
                  >
                    {response.rating}
                  </p>
                  <p className="rvm-rating-item__label">
                    {RATING_LABELS[response.rating] || "N/A"}
                  </p>
                </div>
              )}

              {response.comments && (
                <div className="rvm-comment-box rvm-comment-box--primary">
                  <p className="rvm-comment-box__text rvm-comment-box__text--pre">
                    {response.comments}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="rvm-footer">
          <button
            type="button"
            onClick={onClose}
            className="rvm-footer__btn"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResponseViewModal;
