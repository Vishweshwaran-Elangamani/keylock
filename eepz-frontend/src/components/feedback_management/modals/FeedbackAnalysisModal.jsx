import React from "react";
import {
  X,
  AlertTriangle,
  CheckCircle,
  Heart,
  BarChart2,
  Shield,
  FileText,
  Target,
  Lightbulb,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import "../../../styles/feedback/modals/FeedbackAnalysisModal.css";

const FeedbackAnalysisModal = ({ show, onClose, analysisData, loading, error }) => {
  if (!show) return null;

  const getSentimentColorClass = (sentiment) => {
    const sentimentLower = sentiment?.toLowerCase() || "";
    if (sentimentLower.includes("positive")) return "positive";
    if (sentimentLower.includes("negative")) return "negative";
    if (sentimentLower.includes("neutral")) return "neutral";
    if (sentimentLower.includes("mixed")) return "mixed";
    return "neutral";
  };

  const getQualityColorClass = (quality) => {
    if (quality === "Excellent" || quality === "Good") return "success";
    if (quality === "Fair") return "warning";
    if (quality === "Poor" || quality === "Toxic") return "danger";
    return "neutral";
  };

  const getWidthClass = (value) => {
    const pct = Math.round((Number(value) || 0) * 100);
    const clamped = Math.max(0, Math.min(100, pct));
    const roundedTo5 = Math.round(clamped / 5) * 5;
    return `fa-w-${roundedTo5}`;
  };

  return (
    <div className="fa-modal-overlay" onClick={onClose}>
      <div className="fa-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="fa-modal-header">
          <div className="fa-modal-header-content">
            <BarChart2 size={20} />
            <h2 className="fa-modal-title">Feedback Analysis</h2>
          </div>

          <button className="fa-modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="fa-modal-body">
          {loading && (
            <div className="fa-loading-container">
              <div className="fa-spinner"></div>
              <p className="fa-loading-text">Analyzing Feedback...</p>
              <p className="fa-loading-subtext">Running multi-engine analysis</p>
            </div>
          )}

          {error && (
            <div className="fa-error-container">
              <AlertTriangle size={24} />
              <div>
                <p className="fa-error-title">Analysis Failed</p>
                <p className="fa-error-text">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && analysisData && (
            <div className="fa-content">
              <div className="fa-section">
                <div className="fa-section-header">
                  <FileText size={16} />
                  <h3>ORIGINAL FEEDBACK</h3>
                </div>

                <div className="fa-feedback-box">
                  <p>
                    <strong>Project:</strong>{" "}
                    {analysisData.project_name || "No project title"}
                  </p>
                  <p>
                    <strong>Feedback:</strong> {analysisData.input_text}
                  </p>
                </div>
              </div>

              {analysisData.summary && (
                <div className="fa-section">
                  <div className="fa-section-header">
                    <Target size={16} />
                    <h3>SUMMARY</h3>
                  </div>
                  <div className="fa-summary-box">{analysisData.summary}</div>
                </div>
              )}

              <div className="fa-metrics-grid">
                <div
                  className={`fa-metric-card fa-metric-card--${getQualityColorClass(
                    analysisData.overall_quality
                  )}`}
                >
                  <div className="fa-metric-icon">
                    <Target size={20} />
                  </div>
                  <div className="fa-metric-content">
                    <div className="fa-metric-label">Overall Quality</div>
                    <div className="fa-metric-value">
                      {analysisData.overall_quality}
                    </div>
                  </div>
                </div>

                <div
                  className={`fa-metric-card fa-metric-card--${
                    analysisData.fairness_score >= 0.7
                      ? "warning"
                      : analysisData.fairness_score >= 0.5
                      ? "neutral"
                      : "danger"
                  }`}
                >
                  <div className="fa-metric-icon">
                    <Shield size={20} />
                  </div>
                  <div className="fa-metric-content">
                    <div className="fa-metric-label">Fairness Score</div>
                    <div className="fa-metric-value">
                      {(analysisData.fairness_score * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>

                <div
                  className={`fa-metric-card fa-metric-card--${
                    analysisData.feedback_metrics?.professionalism_score >= 0.7
                      ? "success"
                      : "neutral"
                  }`}
                >
                  <div className="fa-metric-icon">
                    <BarChart2 size={20} />
                  </div>
                  <div className="fa-metric-content">
                    <div className="fa-metric-label">Professionalism</div>
                    <div className="fa-metric-value">
                      {analysisData.feedback_metrics
                        ? (
                            analysisData.feedback_metrics.professionalism_score *
                            100
                          ).toFixed(0)
                        : 0}
                      %
                    </div>
                  </div>
                </div>

                <div
                  className={`fa-metric-card fa-metric-card--${
                    analysisData.constructiveness_analysis
                      ?.constructiveness_score >= 0.5
                      ? "warning"
                      : "danger"
                  }`}
                >
                  <div className="fa-metric-icon">
                    <Lightbulb size={20} />
                  </div>
                  <div className="fa-metric-content">
                    <div className="fa-metric-label">Constructiveness</div>
                    <div className="fa-metric-value">
                      {analysisData.constructiveness_analysis
                        ? (
                            analysisData.constructiveness_analysis
                              .constructiveness_score * 100
                          ).toFixed(0)
                        : 0}
                      %
                    </div>
                  </div>
                </div>
              </div>

              {analysisData.sentiment_analysis && (
                <div className="fa-section">
                  <div className="fa-section-header">
                    <Heart size={16} />
                    <h3>SENTIMENT ANALYSIS</h3>
                  </div>

                  <div
                    className={`fa-sentiment-card fa-sentiment-card--${getSentimentColorClass(
                      analysisData.sentiment_analysis.sentiment
                    )}`}
                  >
                    <div className="fa-sentiment-header">
                      <div className="fa-sentiment-result">
                        ➜ {analysisData.sentiment_analysis.sentiment} (
                        {analysisData.sentiment_analysis.sentiment_category})
                      </div>
                      <div className="fa-sentiment-confidence">
                        {(analysisData.sentiment_analysis.confidence * 100).toFixed(
                          0
                        )}
                        % Confidence
                      </div>
                    </div>

                    <div className="fa-sentiment-metrics">
                      <div className="fa-sentiment-metric-item">
                        <div className="fa-sentiment-metric-label">Polarity</div>
                        <div className="fa-sentiment-metric-value">
                          {analysisData.sentiment_analysis.polarity.toFixed(2)}
                        </div>
                      </div>

                      <div className="fa-sentiment-metric-item">
                        <div className="fa-sentiment-metric-label">
                          Subjectivity
                        </div>
                        <div className="fa-sentiment-metric-value">
                          {analysisData.sentiment_analysis.subjectivity.toFixed(2)}
                        </div>
                      </div>

                      <div className="fa-sentiment-metric-item">
                        <div className="fa-sentiment-metric-label">Intensity</div>
                        <div className="fa-sentiment-metric-value">
                          {analysisData.sentiment_analysis.intensity.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="fa-vader-section">
                      <div className="fa-vader-label">VADER Scores</div>

                      <div className="fa-vader-bars">
                        <div className="fa-vader-bar">
                          <span className="fa-vader-bar-label">Positive</span>
                          <div className="fa-vader-bar-track">
                            <div
                              className={`fa-vader-bar-fill fa-vader-bar-fill--positive ${getWidthClass(
                                analysisData.sentiment_analysis.vader_positive
                              )}`}
                            ></div>
                          </div>
                          <span className="fa-vader-bar-value">
                            {(
                              analysisData.sentiment_analysis.vader_positive * 100
                            ).toFixed(1)}
                            %
                          </span>
                        </div>

                        <div className="fa-vader-bar">
                          <span className="fa-vader-bar-label">Neutral</span>
                          <div className="fa-vader-bar-track">
                            <div
                              className={`fa-vader-bar-fill fa-vader-bar-fill--neutral ${getWidthClass(
                                analysisData.sentiment_analysis.vader_neutral
                              )}`}
                            ></div>
                          </div>
                          <span className="fa-vader-bar-value">
                            {(
                              analysisData.sentiment_analysis.vader_neutral * 100
                            ).toFixed(1)}
                            %
                          </span>
                        </div>

                        <div className="fa-vader-bar">
                          <span className="fa-vader-bar-label">Negative</span>
                          <div className="fa-vader-bar-track">
                            <div
                              className={`fa-vader-bar-fill fa-vader-bar-fill--negative ${getWidthClass(
                                analysisData.sentiment_analysis.vader_negative
                              )}`}
                            ></div>
                          </div>
                          <span className="fa-vader-bar-value">
                            {(
                              analysisData.sentiment_analysis.vader_negative * 100
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {analysisData.emotion_scores && (
                <div className="fa-section">
                  <div className="fa-section-header">
                    <Heart size={16} />
                    <h3>EMOTION ANALYSIS</h3>
                  </div>

                  <div className="fa-emotion-card">
                    <div className="fa-emotion-dominant">
                      <span className="fa-emotion-dominant-label">
                        Dominant Emotion:
                      </span>
                      <span className="fa-emotion-dominant-value">
                        {analysisData.dominant_emotion}
                      </span>
                    </div>

                    <div className="fa-emotion-bar-label">Neutral</div>
                    <div className="fa-emotion-single-bar">
                      <div className="fa-emotion-bar-track">
                        <div
                          className={`fa-emotion-bar-fill ${getWidthClass(
                            analysisData.emotion_scores.neutral || 0
                          )}`}
                        ></div>
                      </div>

                      <span className="fa-emotion-bar-value">
                        {(
                          (analysisData.emotion_scores.neutral || 0) * 100
                        ).toFixed(0)}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {analysisData.bias_analysis && (
                <div className="fa-section">
                  <div className="fa-section-header">
                    <Shield size={16} />
                    <h3>BIAS ANALYSIS</h3>
                  </div>

                  <div
                    className={`fa-bias-card ${
                      analysisData.bias_analysis.has_bias
                        ? "fa-bias-card--detected"
                        : "fa-bias-card--none"
                    }`}
                  >
                    <div className="fa-bias-header">
                      <div className="fa-bias-status">
                        {analysisData.bias_analysis.has_bias ? (
                          <>
                            <AlertCircle size={18} />
                            <span>No Bias Detected</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle size={18} />
                            <span>No Bias Detected</span>
                          </>
                        )}
                      </div>

                      <div className="fa-bias-level">
                        Level: {analysisData.bias_analysis.bias_level}
                      </div>
                    </div>

                    <div className="fa-bias-score">
                      Score:{" "}
                      {(analysisData.bias_analysis.bias_score * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              )}

              {analysisData.toxicity_analysis && (
                <div className="fa-section">
                  <div className="fa-section-header">
                    <AlertTriangle size={16} />
                    <h3>TOXICITY ANALYSIS</h3>
                  </div>

                  <div
                    className={`fa-toxicity-card ${
                      analysisData.toxicity_analysis.is_toxic
                        ? "fa-toxicity-card--detected"
                        : "fa-toxicity-card--none"
                    }`}
                  >
                    <div className="fa-toxicity-header">
                      <div className="fa-toxicity-status">
                        {analysisData.toxicity_analysis.is_toxic ? (
                          <>
                            <AlertCircle size={18} />
                            <span>Toxic Content Detected</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle size={18} />
                            <span>✓ No Toxic Content</span>
                          </>
                        )}
                      </div>

                      <div className="fa-toxicity-severity">
                        Severity: {analysisData.toxicity_analysis.severity}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {analysisData.constructiveness_analysis && (
                <div className="fa-section">
                  <div className="fa-section-header">
                    <Target size={16} />
                    <h3>CONSTRUCTIVENESS ANALYSIS</h3>
                  </div>

                  <div className="fa-constructiveness-card">
                    <div className="fa-constructiveness-items">
                      <div className="fa-constructiveness-item">
                        ○ Constructive
                      </div>
                      <div className="fa-constructiveness-item">○ Specific</div>
                      <div className="fa-constructiveness-item">
                        ○ Actionable
                      </div>
                      <div className="fa-constructiveness-item">
                        ○ Has Examples
                      </div>
                    </div>

                    <div className="fa-action-items">
                      <strong>Action Items:</strong>{" "}
                      {analysisData.constructiveness_analysis.action_items_count}
                    </div>
                  </div>
                </div>
              )}

              {analysisData.feedback_metrics && (
                <div className="fa-section">
                  <div className="fa-section-header">
                    <BarChart2 size={16} />
                    <h3>FEEDBACK METRICS</h3>
                  </div>

                  <div className="fa-feedback-metrics-grid">
                    <div className="fa-feedback-metric-item">
                      <div className="fa-feedback-metric-label">Word Count</div>
                      <div className="fa-feedback-metric-value">
                        {analysisData.feedback_metrics.word_count}
                      </div>
                    </div>

                    <div className="fa-feedback-metric-item">
                      <div className="fa-feedback-metric-label">
                        Sentence Count
                      </div>
                      <div className="fa-feedback-metric-value">
                        {analysisData.feedback_metrics.sentence_count}
                      </div>
                    </div>

                    <div className="fa-feedback-metric-item">
                      <div className="fa-feedback-metric-label">
                        Average Word Length
                      </div>
                      <div className="fa-feedback-metric-value">
                        {analysisData.feedback_metrics.average_word_length.toFixed(
                          2
                        )}
                      </div>
                    </div>

                    <div className="fa-feedback-metric-item">
                      <div className="fa-feedback-metric-label">
                        Complexity Score
                      </div>
                      <div className="fa-feedback-metric-value">
                        {(analysisData.feedback_metrics.complexity_score * 100).toFixed(
                          2
                        )}
                      </div>
                    </div>

                    <div className="fa-feedback-metric-item">
                      <div className="fa-feedback-metric-label">
                        Formality Score
                      </div>
                      <div className="fa-feedback-metric-value">
                        {(analysisData.feedback_metrics.formality_score * 100).toFixed(
                          2
                        )}
                      </div>
                    </div>

                    <div className="fa-feedback-metric-item">
                      <div className="fa-feedback-metric-label">
                        Clarity Score
                      </div>
                      <div className="fa-feedback-metric-value">
                        {(analysisData.feedback_metrics.clarity_score * 100).toFixed(
                          2
                        )}
                      </div>
                    </div>

                    <div className="fa-feedback-metric-item">
                      <div className="fa-feedback-metric-label">
                        Professionalism Score
                      </div>
                      <div className="fa-feedback-metric-value">
                        {(
                          analysisData.feedback_metrics.professionalism_score * 100
                        ).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {analysisData.key_insights && analysisData.key_insights.length > 0 && (
                <div className="fa-section">
                  <div className="fa-section-header">
                    <BookOpen size={16} />
                    <h3>KEY INSIGHTS</h3>
                  </div>

                  <ul className="fa-insights-list">
                    {analysisData.key_insights.map((insight, idx) => (
                      <li key={idx}>{insight}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysisData.suggestions && (
                <div className="fa-section">
                  <div className="fa-section-header">
                    <Lightbulb size={16} />
                    <h3>IMPROVEMENT SUGGESTIONS</h3>
                  </div>

                  <div className="fa-suggestions-container">
                    {analysisData.suggestions.suggestions &&
                      analysisData.suggestions.suggestions.length > 0 && (
                        <div className="fa-suggestions-section">
                          <div className="fa-suggestions-heading">
                            Actionable Recommendations:
                          </div>

                          <ol className="fa-suggestions-list">
                            {analysisData.suggestions.suggestions.map((rec, idx) => (
                              <li key={idx}>{rec}</li>
                            ))}
                          </ol>
                        </div>
                      )}

                    {analysisData.suggestions.rewritten_example && (
                      <div className="fa-suggestions-section">
                        <div className="fa-suggestions-heading">
                          <Lightbulb size={14} />
                          Example Rewrite:
                        </div>

                        <div className="fa-example-rewrite">
                          {analysisData.suggestions.rewritten_example}
                        </div>
                      </div>
                    )}

                    {analysisData.suggestions.improvement_areas &&
                      analysisData.suggestions.improvement_areas.length > 0 && (
                        <div className="fa-suggestions-section">
                          <div className="fa-suggestions-heading">
                            Focus Areas for Improvement:
                          </div>

                          <div className="fa-focus-tags">
                            {analysisData.suggestions.improvement_areas.map(
                              (area, idx) => (
                                <span key={idx} className="fa-focus-tag">
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
      </div>
    </div>
  );
};

export default FeedbackAnalysisModal;
