import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  CheckCircle,
  Send,
  AlertTriangle,
  MessageSquare,
  Clock,
  HelpCircle,
  Loader,
  Home,
} from "lucide-react";
import { useNavigate, useParams, Link } from "react-router-dom";
import hrFormApi from "../../../services/feedbackmanagement/hrFormApi";
import "../../../styles/feedback/components/EmployeeFillForm.css";

const getFeedbackDashboardPath = (roleName) => {
  const routes = {
    Employee: "/employee/dashboard/feedback",
    Manager: "/manager/dashboard/feedback",
    DepartmentHead: "/depthead/dashboard/feedback",
    "Department Head": "/depthead/dashboard/feedback",
    HR: "/hr/dashboard/feedback",
  };
  return routes[roleName] || "/hr/dashboard/feedback";
};

export default function EmployeeFillForm() {
  const navigate = useNavigate();
  const { formId } = useParams();
  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "{}") || {},
    []
  );

  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState({});
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const feedbackDashboardPath = user?.roleName
    ? getFeedbackDashboardPath(user.roleName)
    : "/hr/dashboard/feedback";

  const QUESTION_TEMPLATES = {
    PerformanceReview: {
      label: "Performance Appraisal Process",
      description:
        "Evaluate the effectiveness of our performance appraisal and review process",
      questions: [
        {
          id: 1,
          text: "How clear and well-communicated are the appraisal criteria?",
          category: "Clarity",
          helpText: "Rate how well evaluation standards are explained",
        },
        {
          id: 2,
          text: "How fair and objective is the appraisal process?",
          category: "Fairness",
          helpText: "Assess consistency and bias-free evaluation",
        },
        {
          id: 3,
          text: "How effective is the goal-setting process during appraisals?",
          category: "Goal Setting",
          helpText: "Rate how well goals are defined and aligned",
        },
        {
          id: 4,
          text: "How useful is the feedback provided during appraisals?",
          category: "Feedback Quality",
          helpText: "Assess actionability and specificity of feedback",
        },
        {
          id: 5,
          text: "How well does the appraisal process support development planning?",
          category: "Development",
          helpText: "Rate how well it identifies growth opportunities",
        },
        {
          id: 6,
          text: "How transparent is the appraisal rating and promotion process?",
          category: "Transparency",
          helpText: "Assess visibility into how decisions are made",
        },
        {
          id: 7,
          text: "How timely and regular are performance reviews conducted?",
          category: "Timeliness",
          helpText: "Rate frequency and punctuality of appraisals",
        },
        {
          id: 8,
          text: "How well does the appraisal process recognize achievements?",
          category: "Recognition",
          helpText: "Assess acknowledgment of contributions",
        },
        {
          id: 9,
          text: "How effective is the self-assessment component?",
          category: "Self-Assessment",
          helpText: "Rate the value of employee self-evaluation",
        },
        {
          id: 10,
          text: "Overall, how would you rate the appraisal process?",
          category: "Overall",
          helpText: "General assessment of the entire review system",
        },
      ],
    },
    GeneralFeedback: {
      label: "General Feedback",
      description:
        "Provide feedback on workplace environment and organizational practices",
      questions: [
        {
          id: 1,
          text: "How would you rate our overall work environment?",
          category: "Work Environment",
          helpText: "General assessment of workplace conditions",
        },
        {
          id: 2,
          text: "How effective are our communication systems?",
          category: "Communication Systems",
          helpText: "Rate organizational communication tools and practices",
        },
        {
          id: 3,
          text: "How well do our collaboration practices work?",
          category: "Collaboration",
          helpText: "Assess cross-team and inter-department collaboration",
        },
        {
          id: 4,
          text: "How effective are our quality assurance processes?",
          category: "Quality Systems",
          helpText: "Rate processes for maintaining work quality",
        },
        {
          id: 5,
          text: "How reliable are our organizational systems and tools?",
          category: "System Reliability",
          helpText: "Assess dependability of tools and infrastructure",
        },
      ],
    },
    BiasReview: {
      label: "Bias & Inclusion Review",
      description:
        "Assess organizational fairness, diversity, and inclusion practices",
      questions: [
        {
          id: 1,
          text: "How fair are our hiring and promotion processes?",
          category: "Fair Processes",
          helpText: "Rate equity in organizational advancement",
        },
        {
          id: 2,
          text: "How well do our policies support merit-based decisions?",
          category: "Merit Systems",
          helpText: "Assess objectivity in organizational decisions",
        },
        {
          id: 3,
          text: "How inclusive are our meeting and decision-making processes?",
          category: "Inclusive Practices",
          helpText: "Rate representation of diverse perspectives",
        },
        {
          id: 4,
          text: "How equitable is our resource and opportunity distribution?",
          category: "Resource Equity",
          helpText: "Assess fair allocation across teams",
        },
        {
          id: 5,
          text: "How effective are our diversity and inclusion initiatives?",
          category: "D&I Programs",
          helpText: "Rate organizational efforts to reduce bias",
        },
        {
          id: 6,
          text: "How well does our conflict resolution process handle bias concerns?",
          category: "Conflict Resolution",
          helpText: "Assess fairness in dispute handling",
        },
        {
          id: 7,
          text: "How inclusive is our workplace culture?",
          category: "Culture",
          helpText: "Rate overall sense of belonging for all",
        },
      ],
    },
    ProfessionalismReview: {
      label: "Professionalism Standards Review",
      description:
        "Evaluate organizational policies and professional conduct standards",
      questions: [
        {
          id: 1,
          text: "How clear are our professional conduct policies?",
          category: "Policy Clarity",
          helpText: "Rate clarity of conduct expectations",
        },
        {
          id: 2,
          text: "How well are workplace policies enforced consistently?",
          category: "Policy Enforcement",
          helpText: "Assess consistency in applying rules",
        },
        {
          id: 3,
          text: "How effective are our professional communication guidelines?",
          category: "Communication Standards",
          helpText: "Rate organizational communication norms",
        },
        {
          id: 4,
          text: "How well does the organization handle confidential information?",
          category: "Confidentiality",
          helpText: "Assess data protection and privacy practices",
        },
        {
          id: 5,
          text: "How effective are our attendance and time management policies?",
          category: "Attendance Policies",
          helpText: "Rate flexibility and fairness of policies",
        },
        {
          id: 6,
          text: "How well defined are professional boundaries in the workplace?",
          category: "Boundaries",
          helpText: "Assess clarity of professional limits",
        },
        {
          id: 7,
          text: "How well does the organization represent its values externally?",
          category: "Reputation",
          helpText: "Rate alignment of actions with stated values",
        },
        {
          id: 8,
          text: "How effective is our accountability framework?",
          category: "Accountability",
          helpText: "Assess consequences and responsibility systems",
        },
      ],
    },
    SurveyForm: {
      label: "Employee Survey",
      description: "Gather feedback on workplace satisfaction and environment",
      questions: [
        {
          id: 1,
          text: "How satisfied are you with the work environment?",
          category: "Satisfaction",
          helpText: "Rate overall workplace contentment",
        },
        {
          id: 2,
          text: "How well does the organization support work-life balance?",
          category: "Work-Life Balance",
          helpText: "Assess flexibility and balance policies",
        },
        {
          id: 3,
          text: "How effective are our team collaboration structures?",
          category: "Teamwork",
          helpText: "Rate quality of team interactions",
        },
        {
          id: 4,
          text: "How supportive is management in addressing concerns?",
          category: "Management Support",
          helpText: "Assess leadership responsiveness",
        },
        {
          id: 5,
          text: "How adequate are career growth and learning opportunities?",
          category: "Growth",
          helpText: "Rate availability of development paths",
        },
        {
          id: 6,
          text: "How positive is the overall workplace culture?",
          category: "Culture",
          helpText: "Assess workplace atmosphere and values",
        },
        {
          id: 7,
          text: "How sufficient are the resources and tools provided?",
          category: "Resources",
          helpText: "Rate adequacy of work tools and support",
        },
      ],
    },
    EvaluationForm: {
      label: "Organizational Evaluation",
      description: "Comprehensive evaluation of organizational effectiveness",
      questions: [
        {
          id: 1,
          text: "How well does the organization meet its stated objectives?",
          category: "Objectives",
          helpText: "Rate achievement of organizational goals",
        },
        {
          id: 2,
          text: "How effective are our organizational competencies and capabilities?",
          category: "Competencies",
          helpText: "Assess collective skills and strengths",
        },
        {
          id: 3,
          text: "How well does the organization demonstrate continuous improvement?",
          category: "Growth",
          helpText: "Rate learning and adaptation",
        },
        {
          id: 4,
          text: "How effectively does the organization achieve its strategic goals?",
          category: "Goals",
          helpText: "Assess goal attainment at org level",
        },
        {
          id: 5,
          text: "How well do teams contribute to organizational success?",
          category: "Contribution",
          helpText: "Rate overall team effectiveness",
        },
        {
          id: 6,
          text: "How robust are our learning and development programs?",
          category: "Development",
          helpText: "Assess investment in employee growth",
        },
      ],
    },
  };

  const RATING_LABELS = {
    1: "Poor",
    2: "Fair",
    3: "Good",
    4: "Very Good",
    5: "Excellent",
  };

  const parseDate = useCallback((dateValue) => {
    if (!dateValue) return null;
    try {
      let parsedDate;
      if (typeof dateValue === "string") {
        parsedDate = new Date(dateValue);
      } else if (typeof dateValue === "number") {
        parsedDate =
          dateValue > 10000000000
            ? new Date(dateValue)
            : new Date(dateValue * 1000);
      } else {
        parsedDate = new Date(dateValue);
      }
      if (isNaN(parsedDate.getTime())) {
        console.error("Invalid date parsed:", dateValue);
        return null;
      }
      return parsedDate;
    } catch (e) {
      console.error("Error parsing date:", e, dateValue);
      return null;
    }
  }, []);

  const calculateDaysLeft = useCallback(
    (deadlineDate) => {
      if (!deadlineDate) return null;
      const deadline = parseDate(deadlineDate);
      if (!deadline) return null;
      const now = new Date();
      const diffTime = deadline - now;
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },
    [parseDate]
  );

  const formatDate = useCallback(
    (dateValue) => {
      const date = parseDate(dateValue);
      if (!date) return "No deadline set";
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    },
    [parseDate]
  );

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await hrFormApi.getFormById(formId);
        if (response?.data) {
          const formData = response.data;
          const templateData =
            QUESTION_TEMPLATES[formData.formType] ||
            QUESTION_TEMPLATES.GeneralFeedback;
          setForm({ ...formData, ...templateData });
        } else {
          throw new Error("Invalid form data");
        }
      } catch (err) {
        console.error("Error fetching form:", err);
        setError("Failed to load form. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    if (formId) fetchForm();
  }, [formId]);

  const handleRatingChange = useCallback((questionId, rating) => {
    setResponses((prev) => ({ ...prev, [questionId]: rating }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form || Object.keys(responses).length < form.questions?.length) {
      setError(
        `Please answer all ${form.questions?.length} questions before submitting`
      );
      return;
    }

    const formResponse = {};
    Object.entries(responses).forEach(([questionId, rating]) => {
      formResponse[`question_${questionId}`] = String(rating);
    });
    if (comments.trim()) formResponse["comments"] = comments.trim();

    const payload = {
      formId: Number(formId),
      submittedByEmployeeId: Number(user?.empId || 1004),
      submittedAt: new Date().toISOString(),
      formResponse,
    };

    setSubmitting(true);
    try {
      const createResponse = await hrFormApi.createResponse(payload);
      if (createResponse?.success || createResponse?.data?.success) {
        const responseId =
          createResponse.data?.responseId ||
          createResponse.data?.data?.responseId;
        if (!responseId) {
          throw new Error("Response ID not returned from create endpoint");
        }
        const submitResponse = await hrFormApi.submitResponse(responseId);
        if (submitResponse?.success || submitResponse?.data?.success) {
          setSuccess("Form submitted successfully!");
          setTimeout(() => navigate(-1), 2000);
        } else {
          setError(
            "Response saved as draft but failed to submit. Please contact support."
          );
        }
      } else {
        setError(createResponse?.message || "Failed to create form response");
      }
    } catch (err) {
      console.error("Submission Error:", err);
      const errorMsg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.[0] ||
        err?.message ||
        "Failed to submit form. Please try again.";
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const progress = form
    ? (Object.keys(responses).length / form.questions.length) * 100
    : 0;
  const daysLeft = form ? calculateDaysLeft(form.deadline) : null;
  const formattedDeadline = form ? formatDate(form.deadline) : "";

  if (loading) {
    return (
      <div className="eaf-loading-wrapper">
        <div className="eaf-loading-content">
          <Loader size={40} className="eaf-loading-spinner" />
          <p className="eaf-loading-text">Loading form...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="eaf-container">
        <nav aria-label="breadcrumb" className="eaf-breadcrumb-wrapper">
          <ol className="eaf-breadcrumb">
            <li className="eaf-breadcrumb-item">
              <Link
                to={feedbackDashboardPath.replace("/feedback", "")}
                className="eaf-breadcrumb-link">
                <Home size={18} className="eaf-breadcrumb-icon" />
                Dashboard{" "}
              </Link>
            </li>
            <li className="eaf-breadcrumb-separator">/</li>
            <li className="eaf-breadcrumb-item">
              <Link to={feedbackDashboardPath} className="eaf-breadcrumb-link">
                {" "}
                Feedback Management
              </Link>
            </li>
            <li className="eaf-breadcrumb-separator">/</li>
            <li className="eaf-breadcrumb-active">
              Assigned Forms{" "}
            </li>
          </ol>
        </nav>

        <div className="eaf-alert eaf-alert-danger">
          <AlertTriangle size={20} />
          <div>
            <strong>Error</strong>
            <p className="eaf-alert-message">
              {" "}
              Form not found or failed to load{" "}
            </p>
          </div>
        </div>
        <button
          className="eaf-btn eaf-btn-primary"
          onClick={() => navigate(-1)}
        >
          {" "}
          Back to Assigned Forms
        </button>
      </div>
    );
  }

  return (
    <div className="eaf-container-fluid">
      <div className="eaf-row">
        <div className="eaf-col-main">
          <nav aria-label="breadcrumb" className="eaf-breadcrumb-wrapper">
            <ol className="eaf-breadcrumb">
              <li className="eaf-breadcrumb-item">
                <Link to={feedbackDashboardPath.replace("/feedback", "")} className="eaf-breadcrumb-link">
                  <Home size={20} className="eaf-breadcrumb-icon" /></Link>
              </li>
              <li className="eaf-breadcrumb-separator">/</li>
              <li className="eaf-breadcrumb-item">
                <Link
                  to={feedbackDashboardPath}
                  className="eaf-breadcrumb-link"
                >
                  Feedback Management
                </Link>
              </li>
              <li className="eaf-breadcrumb-separator">/</li>
              <li className="eaf-breadcrumb-item">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="eaf-breadcrumb-button"
                >
                  Assigned Forms
                </button>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="eaf-row">
        <div className="eaf-col-sidebar">
          <div className="eaf-sidebar-sticky">
            <div className="eaf-progress-circle-wrapper">
              <div className="eaf-progress-circle">
                <svg width="140" height="140" className="eaf-progress-svg">
                  <circle cx="70" cy="70" r="60" className="eaf-progress-bg" />
                  <circle
                    cx="70"
                    cy="70"
                    r="60"
                    className="eaf-progress-bar"
                    style={{ strokeDasharray: `${(progress / 100) * 377} 377` }}
                  />
                </svg>
                <div className="eaf-progress-label">
                  <div className="eaf-progress-value">
                    {Math.round(progress)}%
                  </div>
                  <div className="eaf-progress-text">Complete</div>
                </div>
              </div>
              <div className="eaf-progress-info">
                {Object.keys(responses).length} of {form.questions.length}{" "}
                answered
              </div>
            </div>

            <div className="eaf-questions-card">
              <div className="eaf-questions-card-body">
                <h6 className="eaf-questions-title">Questions</h6>
                <div className="eaf-questions-list">
                  {form.questions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="eaf-question-item"
                      onClick={() => {
                        document
                          .getElementById(`question-${q.id}`)
                          ?.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                          });
                      }}
                    >
                      <div
                        className={`eaf-question-number ${
                          responses[q.id] ? "eaf-question-number-answered" : ""
                        }`}
                      >
                        {responses[q.id] ? <CheckCircle size={16} /> : idx + 1}
                      </div>
                      <small
                        className={`eaf-question-category ${
                          responses[q.id]
                            ? "eaf-question-category-answered"
                            : ""
                        }`}
                      >
                        {q.category}
                      </small>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="eaf-col-main">
          <div className="eaf-header-section">
            <div className="eaf-header-content">
              <h2 className="eaf-header-title">{form.formName}</h2>
              <p className="eaf-header-description">{form.formDescription}</p>
            </div>

            <div className="eaf-badges">
              <span className="eaf-badge eaf-badge-primary">{form.label}</span>
              <span className="eaf-badge eaf-badge-secondary">
                {form.questions.length} Questions
              </span>
            </div>
          </div>

          {error && (
            <div className="eaf-alert eaf-alert-danger eaf-alert-dismissible">
              <AlertTriangle size={16} className="eaf-alert-icon" />
              <strong>Error:</strong> {error}
              <button
                type="button"
                className="eaf-alert-close"
                onClick={() => setError("")}
              >
                ×
              </button>
            </div>
          )}

          {success && (
            <div className="eaf-alert eaf-alert-success eaf-alert-dismissible">
              <CheckCircle size={16} className="eaf-alert-icon" />
              <strong>Success:</strong> {success}
            </div>
          )}

          {form.deadline && (
            <div
              className={`eaf-deadline-alert ${
                daysLeft === null
                  ? "eaf-deadline-none"
                  : daysLeft > 3
                  ? "eaf-deadline-safe"
                  : daysLeft > 0
                  ? "eaf-deadline-warning"
                  : "eaf-deadline-danger"
              }`}
            >
              <Clock size={18} className="eaf-deadline-icon" />
              <div className="eaf-deadline-content">
                <strong>Deadline: </strong>
                {formattedDeadline}
                {daysLeft !== null && (
                  <span className="eaf-deadline-days">
                    {daysLeft > 0
                      ? `${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining`
                      : daysLeft === 0
                      ? "Due today"
                      : "OVERDUE"}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="eaf-form-card">
            <div className="eaf-form-card-body">
              <form onSubmit={handleSubmit}>
                <div className="eaf-form-type-banner">
                  <h6 className="eaf-form-type-title">Form Type</h6>
                  <p className="eaf-form-type-label">{form.label}</p>
                </div>

                {form.questions.map((q, idx) => (
                  <div
                    key={q.id}
                    id={`question-${q.id}`}
                    className="eaf-question-wrapper"
                  >
                    <div className="eaf-question-layout">
                      <div className="eaf-question-index">{idx + 1}</div>

                      <div className="eaf-question-content">
                        <div className="eaf-question-header">
                          <h6 className="eaf-question-text">{q.text}</h6>
                          <span className="eaf-question-badge">
                            {q.category}
                          </span>
                        </div>

                        {q.helpText && (
                          <div className="eaf-question-help">
                            <HelpCircle
                              size={14}
                              className="eaf-question-help-icon"
                            />
                            <small className="eaf-question-help-text">
                              {q.helpText}
                            </small>
                          </div>
                        )}

                        <div className="eaf-rating-buttons">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              type="button"
                              className={`eaf-rating-btn ${
                                responses[q.id] === rating
                                  ? "eaf-rating-btn-active"
                                  : ""
                              }`}
                              onClick={() => handleRatingChange(q.id, rating)}
                              disabled={submitting}
                              title={`Rate as ${RATING_LABELS[rating]}`}
                            >
                              {rating}
                            </button>
                          ))}
                        </div>

                        <div className="eaf-question-status">
                          {responses[q.id] ? (
                            <small className="eaf-question-status-answered">
                              <CheckCircle
                                size={12}
                                className="eaf-question-status-icon"
                              />
                              Rated: {RATING_LABELS[responses[q.id]]}
                            </small>
                          ) : (
                            <small className="eaf-question-status-pending">
                              Response required
                            </small>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="eaf-comments-section">
                  <label htmlFor="comments" className="eaf-comments-label">
                    <MessageSquare size={16} className="eaf-comments-icon" />
                    Additional Comments
                  </label>
                  <small className="eaf-comments-hint">
                    Optional - Maximum 1000 characters
                  </small>
                  <textarea
                    id="comments"
                    className="eaf-comments-textarea"
                    rows={4}
                    value={comments}
                    onChange={(e) => setComments(e.target.value.slice(0, 1000))}
                    placeholder="Share any additional feedback about the process or system..."
                    disabled={submitting}
                    maxLength={1000}
                  />
                  <small className="eaf-comments-counter">
                    {comments.length} / 1000 characters
                  </small>
                </div>

                <div className="eaf-submit-wrapper">
                  <button
                    type="submit"
                    className="eaf-submit-btn"
                    disabled={
                      submitting ||
                      Object.keys(responses).length < form.questions.length
                    }
                  >
                    {submitting ? (
                      <>
                        <Loader
                          size={16}
                          className="eaf-submit-icon eaf-submit-spinner"
                        />
                        Submitting Form...
                      </>
                    ) : (
                      <>
                        <Send size={16} className="eaf-submit-icon" />
                        Submit Feedback
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
