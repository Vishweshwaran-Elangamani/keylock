import React, { useState, useEffect } from "react";
import { User, X, AlertCircle } from "lucide-react";
import axios from "axios";
import "../../../styles/feedback/modals/ResponseViewModal.css";
import { QUESTION_TEMPLATES } from "../../../constants/feedback_management/questionTemplates";

const API_BASE = import.meta.env.VITE_API_BASE;

const RATING_LABELS = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

const getRatingClass = (rating) => {
  const num = Number(rating);
  if (num === 5) return "rvm-rating--5";
  if (num === 4) return "rvm-rating--4";
  if (num === 3) return "rvm-rating--3";
  if (num === 2) return "rvm-rating--2";
  if (num === 1) return "rvm-rating--1";
  return "rvm-rating--0";
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

    const questionsForFormType = QUESTION_TEMPLATES?.[formType] || [];
    const matchedQuestion = questionsForFormType.find(
      (question) => question.id === Number(qId)
    );

    return matchedQuestion ? matchedQuestion.text : `Question ${qId}`;
  };

  const parseHRResponses = () => {
    if (!response?.formResponse || typeof response.formResponse !== "object") {
      return [];
    }

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

    const dateObj = new Date(dateInput);
    if (Number.isNaN(dateObj.getTime())) return "N/A";

    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!show || !response) return null;

  const hrResponses = type === "HR" ? parseHRResponses() : [];
  const userComments = response?.formResponse?.comments || null;

  const fromName =
    response?.submittedByName ||
    response?.reviewerName ||
    response?.submitterNameFull ||
    response?.submitterName ||
    "N/A";

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
                      {response?.formName || "N/A"}
                    </div>
                  </div>

                  <div className="rvm-grid__col">
                    <div className="rvm-field__label">Submitted</div>
                    <div className="rvm-field__value">
                      {formatDate(response?.submittedAt)}
                    </div>
                  </div>
                </div>
              </div>

              {hrResponses.length > 0 && (
                <div className="rvm-section">
                  <h6 className="rvm-section__title">
                    Your Ratings ({hrResponses.length} questions)
                  </h6>

                  {hrResponses.map((item, idx) => {
                    const ratingClass = getRatingClass(item.rating);

                    return (
                      <div
                        key={idx}
                        className={`rvm-rating-item ${ratingClass}`}
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
                            className={`rvm-rating-item__badge ${ratingClass}`}
                          >
                            {item.rating}
                          </span>
                        </div>

                        <small className="rvm-rating-item__label">
                          Rating: {RATING_LABELS[item.rating] || "N/A"}
                        </small>
                      </div>
                    );
                  })}
                </div>
              )}

              {loadingFormDetails && (
                <div className="rvm-loading">
                  <AlertCircle size={16} />
                  Loading form details...
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
                  <div className="rvm-field__value">{fromName}</div>
                </div>

                <div className="rvm-grid__col">
                  <div className="rvm-field__label">Submitted</div>
                  <div className="rvm-field__value">
                    {formatDate(response?.submittedAt)}
                  </div>
                </div>
              </div>

              {response?.rating && (
                <div className={`rvm-rating-display ${getRatingClass(response.rating)}`}>
                  <p className="rvm-rating-display__value">{response.rating}</p>
                  <p className="rvm-rating-item__label">
                    {RATING_LABELS[response.rating] || "N/A"}
                  </p>
                </div>
              )}

              {response?.comments && (
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
                  <div className="rvm-field__value">{fromName}</div>
                </div>

                <div className="rvm-grid__col">
                  <div className="rvm-field__label">Submitted</div>
                  <div className="rvm-field__value">
                    {formatDate(response?.submittedAt)}
                  </div>
                </div>
              </div>

              {response?.rating && (
                <div className={`rvm-rating-display ${getRatingClass(response.rating)}`}>
                  <p className="rvm-rating-display__value">{response.rating}</p>
                  <p className="rvm-rating-item__label">
                    {RATING_LABELS[response.rating] || "N/A"}
                  </p>
                </div>
              )}

              {response?.comments && (
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
          <button type="button" onClick={onClose} className="rvm-footer__btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResponseViewModal;
