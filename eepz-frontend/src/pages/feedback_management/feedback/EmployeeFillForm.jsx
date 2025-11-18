// src/pages/feedback_management/forms/EmployeeFillForm.jsx

import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  CheckCircle,
  Send,
  AlertTriangle,
  ArrowLeft,
  MessageSquare,
  Clock,
  HelpCircle,
  Loader,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import hrFormApi from "../../../services/feedbackmanagement/hrFormApi";

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

  // Process-focused question templates
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

  // Fetch form details using service
  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await hrFormApi.getFormById(formId);

        if (response?.data) {
          const formData = response.data;
          const templateData =
            QUESTION_TEMPLATES[formData.formType] ||
            QUESTION_TEMPLATES.GeneralFeedback;
          const enrichedForm = { ...formData, ...templateData };
          setForm(enrichedForm);
          console.log("Form loaded:", enrichedForm);
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

    if (formId) {
      fetchForm();
    }
  }, [formId]);

  // Handle rating change
  const handleRatingChange = useCallback((questionId, rating) => {
    setResponses((prev) => ({ ...prev, [questionId]: rating }));
  }, []);

  // Handle form submission using service
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

    // Build form response object
    const formResponse = {};
    Object.entries(responses).forEach(([questionId, rating]) => {
      formResponse[`question_${questionId}`] = String(rating);
    });

    if (comments.trim()) {
      formResponse["comments"] = comments.trim();
    }

    // Payload for creating the response
    const payload = {
      formId: Number(formId),
      submittedByEmployeeId: Number(user?.empId || 1004),
      submittedAt: new Date().toISOString(),
      formResponse: formResponse,
    };

    console.log("Step 1: Creating form response");
    console.log("Payload:", JSON.stringify(payload, null, 2));

    setSubmitting(true);
    try {
      // STEP 1: Create the response (saves as Draft)
      const createResponse = await hrFormApi.createResponse(payload);

      console.log("Step 1 Complete - Response created:", createResponse);

      if (createResponse?.success || createResponse?.data?.success) {
        const responseId = createResponse.data?.responseId || 
                          createResponse.data?.data?.responseId;

        if (!responseId) {
          throw new Error("Response ID not returned from create endpoint");
        }

        console.log(`Step 2: Submitting response ID ${responseId}`);

        // STEP 2: Submit the response
        const submitResponse = await hrFormApi.submitResponse(responseId, null);

        console.log("Step 2 Complete - Response submitted:", submitResponse);

        if (submitResponse?.success || submitResponse?.data?.success) {
          setSuccess("Form submitted successfully! Redirecting...");
          setTimeout(() => navigate("/dashboard/feedback"), 2000);
        } else {
          setError(
            "Response saved as draft but failed to submit. Please contact support."
          );
        }
      } else {
        setError(
          createResponse?.message || "Failed to create form response"
        );
      }
    } catch (err) {
      console.error("Submission Error:", {
        status: err?.response?.status,
        message: err?.response?.data?.message,
        errors: err?.response?.data?.errors,
      });

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

  // Calculate progress
  const progress = form
    ? (Object.keys(responses).length / form.questions.length) * 100
    : 0;
  const daysLeft = form
    ? Math.ceil((new Date(form.deadline) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  // Loading state
  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "60vh" }}
      >
        <div className="text-center">
          <Loader
            size={40}
            className="text-primary mb-3"
            style={{ animation: "spin 1s linear infinite" }}
          />
          <p className="text-muted">Loading form...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (!form) {
    return (
      <div className="container-fluid py-4" style={{ maxWidth: "800px" }}>
        <div className="alert alert-danger d-flex align-items-center gap-2">
          <AlertTriangle size={20} />
          <div>
            <strong>Error</strong>
            <p className="mb-0 small mt-1">Form not found or failed to load</p>
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/feedback/assigned-forms")}
        >
          <ArrowLeft size={16} className="me-2" style={{ display: "inline" }} />
          Back to Forms
        </button>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ maxWidth: "950px" }}>
      {/* HEADER */}
      <div className="mb-4">
        <div className="d-flex align-items-center gap-3 mb-3">
          <button
            className="btn btn-outline-secondary"
            onClick={() => navigate(-1)}
            disabled={submitting}
            style={{ padding: "0.5rem 0.75rem", borderRadius: "8px" }}
            title="Go back"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-grow-1">
            <h2 className="fw-bold mb-1" style={{ color: "#0F62FE" }}>
              {form.formName}
            </h2>
            <p className="mb-0 text-muted small">{form.formDescription}</p>
          </div>
        </div>

        <div className="d-flex gap-2 flex-wrap">
          <span className="badge bg-primary">{form.label}</span>
          <span className="badge bg-secondary">
            {form.questions.length} Questions
          </span>
        </div>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div
          className="alert alert-danger alert-dismissible fade show mb-4"
          role="alert"
        >
          <AlertTriangle
            size={16}
            className="me-2"
            style={{ display: "inline" }}
          />
          <strong>Error:</strong> {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError("")}
          />
        </div>
      )}

      {/* SUCCESS ALERT */}
      {success && (
        <div
          className="alert alert-success alert-dismissible fade show mb-4"
          role="alert"
        >
          <CheckCircle
            size={16}
            className="me-2"
            style={{ display: "inline" }}
          />
          <strong>Success:</strong> {success}
        </div>
      )}

      {/* DEADLINE INFO */}
      <div
        className={`alert mb-4 d-flex align-items-center gap-2`}
        style={{
          backgroundColor:
            daysLeft > 3 ? "#e3f2fd" : daysLeft > 0 ? "#fff3cd" : "#f8d7da",
          border:
            daysLeft > 3
              ? "1px solid #90caf9"
              : daysLeft > 0
              ? "1px solid #ffc107"
              : "1px solid #f5c6cb",
          borderRadius: "8px",
        }}
      >
        <Clock
          size={18}
          style={{
            color:
              daysLeft > 3 ? "#0F62FE" : daysLeft > 0 ? "#ff9800" : "#dc3545",
          }}
        />
        <div style={{ flex: 1 }}>
          <strong>Deadline: </strong>
          {new Date(form.deadline).toLocaleDateString("en-US", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
          <span className="ms-2 small">
            {daysLeft > 0
              ? `${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining`
              : " OVERDUE"}
          </span>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div
        className="card border-0 shadow-sm mb-4"
        style={{ borderRadius: "8px" }}
      >
        <div className="card-body py-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="fw-bold small">Completion Progress</span>
            <span className="small text-muted">
              {Object.keys(responses).length} / {form.questions.length}
            </span>
          </div>
          <div
            className="progress"
            style={{ height: "8px", borderRadius: "4px" }}
          >
            <div
              className="progress-bar"
              style={{
                width: `${progress}%`,
                transition: "width 0.3s ease",
                backgroundColor: progress === 100 ? "#24A148" : "#0F62FE",
              }}
            />
          </div>
        </div>
      </div>

      {/* FORM */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: "8px" }}>
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            {/* FORM TYPE BANNER */}
            <div
              className="p-3 mb-4"
              style={{
                borderRadius: "8px",
                borderLeft: "4px solid #0F62FE",
                backgroundColor: "#f0f4ff",
              }}
            >
              <h6 className="mb-1 fw-bold" style={{ color: "#0F62FE" }}>
                Form Type
              </h6>
              <p className="mb-0 small text-muted">{form.label}</p>
            </div>

            {/* QUESTIONS */}
            {form.questions.map((q, idx) => (
              <div
                key={q.id}
                className="mb-4 pb-4"
                style={{
                  borderBottom:
                    idx < form.questions.length - 1
                      ? "1px solid #e0e0e0"
                      : "none",
                }}
              >
                <div className="d-flex gap-3">
                  {/* Question Number */}
                  <div
                    className="d-flex align-items-center justify-content-center fw-bold"
                    style={{
                      minWidth: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      backgroundColor: "#f0f4ff",
                      color: "#0F62FE",
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </div>

                  {/* Question Content */}
                  <div className="flex-grow-1">
                    {/* Question Text */}
                    <div className="mb-2">
                      <h6 className="fw-bold mb-2">{q.text}</h6>
                      <span className="badge bg-light text-dark small">
                        {q.category}
                      </span>
                    </div>

                    {/* Help Text */}
                    {q.helpText && (
                      <div
                        className="d-flex gap-2 mb-3 p-2"
                        style={{
                          backgroundColor: "#f9f9f9",
                          borderRadius: "4px",
                          borderLeft: "3px solid #0F62FE",
                        }}
                      >
                        <HelpCircle
                          size={14}
                          className="text-muted"
                          style={{ flexShrink: 0, marginTop: "2px" }}
                        />
                        <small className="text-muted">{q.helpText}</small>
                      </div>
                    )}

                    {/* Rating Buttons */}
                    <div className="d-flex gap-2 flex-wrap mb-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          className={`btn btn-sm fw-bold ${
                            responses[q.id] === rating
                              ? "btn-primary"
                              : "btn-outline-secondary"
                          }`}
                          onClick={() => handleRatingChange(q.id, rating)}
                          disabled={submitting}
                          style={{
                            minWidth: "50px",
                            transition: "all 0.2s",
                          }}
                          title={`Rate as ${RATING_LABELS[rating]}`}
                        >
                          {rating}
                        </button>
                      ))}
                    </div>

                    {/* Response Status */}
                    <div>
                      {responses[q.id] ? (
                        <small className="text-success fw-bold">
                          <CheckCircle
                            size={12}
                            className="me-1"
                            style={{ display: "inline" }}
                          />
                          Rated: {RATING_LABELS[responses[q.id]]}
                        </small>
                      ) : (
                        <small className="text-muted">Response required</small>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* COMMENTS */}
            <div
              className="mb-4"
              style={{ borderTop: "2px solid #e0e0e0", paddingTop: "1.5rem" }}
            >
              <label htmlFor="comments" className="form-label fw-bold mb-2">
                <MessageSquare
                  size={16}
                  className="me-2"
                  style={{ display: "inline" }}
                />
                Additional Comments
              </label>
              <small className="text-muted d-block mb-2">
                Optional - Maximum 1000 characters
              </small>
              <textarea
                id="comments"
                className="form-control"
                rows={4}
                value={comments}
                onChange={(e) => setComments(e.target.value.slice(0, 1000))}
                placeholder="Share any additional feedback about the process or system..."
                disabled={submitting}
                maxLength={1000}
                style={{ resize: "vertical", borderRadius: "8px" }}
              />
              <small className="text-muted d-block mt-2">
                {comments.length} / 1000 characters
              </small>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="d-grid gap-2">
              <button
                type="submit"
                className="btn btn-primary fw-bold"
                style={{
                  padding: "0.75rem",
                  borderRadius: "8px",
                  fontSize: "1rem",
                }}
                disabled={
                  submitting ||
                  Object.keys(responses).length < form.questions.length
                }
              >
                {submitting ? (
                  <>
                    <Loader
                      size={16}
                      className="me-2"
                      style={{
                        display: "inline",
                        animation: "spin 1s linear infinite",
                      }}
                    />
                    Submitting Form...
                  </>
                ) : (
                  <>
                    <Send
                      size={16}
                      className="me-2"
                      style={{ display: "inline" }}
                    />
                    Submit Feedback
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* RATING GUIDE */}
      <div
        className="card border-0 shadow-sm mt-4"
        style={{ borderRadius: "8px", backgroundColor: "#fafafa" }}
      >
        <div className="card-body">
          <h6 className="fw-bold mb-3">Rating Scale</h6>
          <div className="row g-3">
            {Object.entries(RATING_LABELS).map(([rating, label]) => (
              <div key={rating} className="col-12 col-sm-6">
                <div className="d-flex align-items-center gap-2">
                  <span
                    className="badge bg-primary text-white fw-bold"
                    style={{ minWidth: "35px", textAlign: "center" }}
                  >
                    {rating}
                  </span>
                  <span className="small">{label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
