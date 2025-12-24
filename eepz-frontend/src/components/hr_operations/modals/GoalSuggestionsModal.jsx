import React from "react";
import "../../../styles/hr_operations/hr/GoalSuggestionsModal.css";

const GoalSuggestionsModal = ({
  show,
  onHide,
  goalSuggestions,
  loadingSuggestions,
}) => {
  if (!show) return null;

  const getPriorityClass = (priority) => {
    if (priority === "High") return "high";
    if (priority === "Medium") return "medium";
    return "low";
  };

  return (
    <>
      <div className="gsm-backdrop" onClick={onHide} />

      <div className="gsm-modal-container">
        <div className="gsm-modal-dialog">
          {/* HEADER - Fixed */}
          <div className="gsm-modal-header">
            <div className="gsm-header-content">
              <span className="gsm-header-title">
                <i className="bi bi-lightbulb-fill gsm-header-icon"></i>
                Goal Suggestions for
              </span>
              <span className="gsm-header-subtitle">
                {goalSuggestions?.email}
              </span>
            </div>
            <button
              type="button"
              onClick={onHide}
              aria-label="Close"
              className="gsm-close-button"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* BODY - Scrollable */}
          <div className="gsm-modal-body">
            {loadingSuggestions ? (
              <div className="gsm-loading-container">
                <span className="gsm-spinner" />
                <p className="gsm-loading-text">Loading suggestions...</p>
              </div>
            ) : (
              <ul className="gsm-suggestions-list">
                {goalSuggestions &&
                  goalSuggestions.suggestions.map((g, idx) => (
                    <li key={idx} className="gsm-suggestion-item">
                      {/* Header */}
                      <div className="gsm-suggestion-header">
                        <span className="gsm-goal-title">{g.goalTitle}</span>
                        <span className="gsm-goal-type-badge">
                          {g.goalType}
                        </span>
                      </div>

                      {/* Description */}
                      <div className="gsm-goal-description">
                        {g.goalDescription}
                      </div>

                      {/* Meta Information */}
                      <div className="gsm-goal-meta">
                        <span className="gsm-meta-item">
                          Priority:
                          <strong
                            className={`gsm-priority-value ${getPriorityClass(
                              g.priority
                            )}`}
                          >
                            {g.priority}
                          </strong>
                        </span>
                        <span className="gsm-meta-item">
                          Duration:
                          <strong className="gsm-duration-value">
                            {g.estimatedDuration}
                          </strong>
                        </span>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </div>

          {/* FOOTER - Fixed */}
          <div className="gsm-modal-footer">
            <button type="button" onClick={onHide} className="gsm-btn-close">
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default GoalSuggestionsModal;
