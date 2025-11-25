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
        } catch (err) {
          console.warn("Could not fetch form details");
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
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1050,
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "900px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #27235C 0%, #1a1845 100%)",
            padding: "1.5rem 2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "none",
          }}
        >
          <h5
            style={{
              margin: 0,
              color: "white",
              fontSize: "1.25rem",
              fontWeight: 700,
              letterSpacing: "0.3px",
              textAlign: "left",
            }}
          >
            {type === "HR" && "HR Form Response"}
            {type === "Mentor" && "Mentor Feedback"}
            {type === "Peer" && "Peer Feedback"}
            {type === "Goal" && "Goal Feedback Details"}
          </h5>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              borderRadius: "6px",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.3)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.2)")
            }
            aria-label="Close"
          >
            <X size={20} style={{ color: "white" }} />
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: "2rem",
            overflowY: "auto",
            flex: 1,
            textAlign: "left",
          }}
        >
          {/* HR FORM */}
          {type === "HR" && (
            <>
              <div
                style={{
                  marginBottom: "1.5rem",
                  paddingBottom: "1.5rem",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <h6
                  style={{
                    fontSize: "0.938rem",
                    fontWeight: 700,
                    color: "#27235C",
                    marginBottom: "1rem",
                    textAlign: "left",
                  }}
                >
                  Form Information
                </h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#6B7280",
                        marginBottom: "0.25rem",
                        fontWeight: 600,
                        textAlign: "left",
                      }}
                    >
                      Form Name
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "#1F2937",
                        textAlign: "left",
                      }}
                    >
                      {response.formName || "N/A"}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#6B7280",
                        marginBottom: "0.25rem",
                        fontWeight: 600,
                        textAlign: "left",
                      }}
                    >
                      Status
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 12px",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          backgroundColor:
                            response.status === "Reviewed"
                              ? "#D1FAE5"
                              : response.status === "Submitted"
                              ? "#DBEAFE"
                              : "#FEF3C7",
                          color:
                            response.status === "Reviewed"
                              ? "#10B981"
                              : response.status === "Submitted"
                              ? "#3B82F6"
                              : "#F59E0B",
                        }}
                      >
                        {response.status || "Draft"}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#6B7280",
                        marginBottom: "0.25rem",
                        fontWeight: 600,
                        textAlign: "left",
                      }}
                    >
                      Form Type
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "#1F2937",
                        textAlign: "left",
                      }}
                    >
                      {formDetails?.formType || "Loading..."}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#6B7280",
                        marginBottom: "0.25rem",
                        fontWeight: 600,
                        textAlign: "left",
                      }}
                    >
                      Submitted
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "#1F2937",
                        textAlign: "left",
                      }}
                    >
                      {formatDate(response.submittedAt)}
                    </div>
                  </div>
                </div>
              </div>

              {hrResponses.length > 0 && (
                <div
                  style={{
                    marginBottom: "1.5rem",
                    paddingBottom: "1.5rem",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <h6
                    style={{
                      fontSize: "0.938rem",
                      fontWeight: 700,
                      color: "#27235C",
                      marginBottom: "1rem",
                      textAlign: "left",
                    }}
                  >
                    Your Ratings ({hrResponses.length} questions)
                  </h6>
                  {hrResponses.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "1rem",
                        marginBottom: "0.75rem",
                        backgroundColor: "#F9FAFB",
                        borderRadius: "8px",
                        borderLeft: `4px solid ${getRatingColor(item.rating)}`,
                        textAlign: "left",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "start",
                          marginBottom: "0.5rem",
                        }}
                      >
                        <div style={{ flex: 1, textAlign: "left" }}>
                          <small
                            style={{
                              fontSize: "0.75rem",
                              color: "#6B7280",
                              fontWeight: 600,
                              textAlign: "left",
                            }}
                          >
                            Question {item.qId}
                          </small>
                          <p
                            style={{
                              margin: "0.25rem 0 0 0",
                              fontSize: "0.875rem",
                              fontWeight: 600,
                              color: "#1F2937",
                              textAlign: "left",
                            }}
                          >
                            {item.text}
                          </p>
                        </div>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            fontSize: "0.875rem",
                            fontWeight: 700,
                            backgroundColor: `${getRatingColor(item.rating)}20`,
                            color: getRatingColor(item.rating),
                            marginLeft: "1rem",
                            textAlign: "center",
                          }}
                        >
                          {item.rating}
                        </span>
                      </div>
                      <small
                        style={{
                          fontSize: "0.75rem",
                          color: "#6B7280",
                          textAlign: "left",
                        }}
                      >
                        Rating: {RATING_LABELS[item.rating] || "N/A"}
                      </small>
                    </div>
                  ))}
                </div>
              )}

              {userComments && (
                <div
                  style={{
                    marginBottom: "1.5rem",
                    paddingBottom: "1.5rem",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <h6
                    style={{
                      fontSize: "0.938rem",
                      fontWeight: 700,
                      color: "#27235C",
                      marginBottom: "0.75rem",
                      textAlign: "left",
                    }}
                  >
                    Your Comments
                  </h6>
                  <div
                    style={{
                      padding: "1rem",
                      backgroundColor: "#F9FAFB",
                      borderRadius: "8px",
                      borderLeft: "4px solid #27235C",
                      textAlign: "left",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.875rem",
                        color: "#374151",
                        textAlign: "left",
                      }}
                    >
                      {userComments}
                    </p>
                  </div>
                </div>
              )}

              {response.status === "Reviewed" && response.hrReviewComments && (
                <div>
                  <h6
                    style={{
                      fontSize: "0.938rem",
                      fontWeight: 700,
                      color: "#27235C",
                      marginBottom: "0.75rem",
                      textAlign: "left",
                    }}
                  >
                    HR Review
                  </h6>
                  <div
                    style={{
                      padding: "1rem",
                      backgroundColor: "#F0F0F0",
                      borderRadius: "8px",
                      borderLeft: "4px solid #0F62FE",
                      textAlign: "left",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.875rem",
                        color: "#374151",
                        textAlign: "left",
                      }}
                    >
                      {response.hrReviewComments}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* MENTOR FEEDBACK */}
          {type === "Mentor" && (
            <>
              <div
                style={{
                  marginBottom: "1.5rem",
                  paddingBottom: "1.5rem",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <h6
                  style={{
                    fontSize: "0.938rem",
                    fontWeight: 700,
                    color: "#27235C",
                    marginBottom: "1rem",
                    textAlign: "left",
                  }}
                >
                  Mentor Information
                </h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#6B7280",
                        marginBottom: "0.25rem",
                        fontWeight: 600,
                        textAlign: "left",
                      }}
                    >
                      Mentor Name
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "#1F2937",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        textAlign: "left",
                      }}
                    >
                      <User size={14} style={{ color: "#27235C" }} />
                      {response.mentorNameFull || response.mentorName || "N/A"}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#6B7280",
                        marginBottom: "0.25rem",
                        fontWeight: 600,
                        textAlign: "left",
                      }}
                    >
                      Rating
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 12px",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          backgroundColor: "#D1FAE5",
                          color: "#10B981",
                        }}
                      >
                        {response.rating || 0} / 5
                      </span>
                    </div>
                  </div>
                  <div className="col-12">
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#6B7280",
                        marginBottom: "0.25rem",
                        fontWeight: 600,
                        textAlign: "left",
                      }}
                    >
                      Submitted
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "#1F2937",
                        textAlign: "left",
                      }}
                    >
                      {formatDate(response.createdAt)}
                    </div>
                  </div>
                </div>
              </div>

              {response.rating && (
                <div
                  style={{
                    marginBottom: "1.5rem",
                    paddingBottom: "1.5rem",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <h6
                    style={{
                      fontSize: "0.938rem",
                      fontWeight: 700,
                      color: "#27235C",
                      marginBottom: "0.75rem",
                      textAlign: "left",
                    }}
                  >
                    Rating Details
                  </h6>
                  <div
                    style={{
                      padding: "1rem",
                      backgroundColor: "#F9FAFB",
                      borderRadius: "8px",
                      borderLeft: `4px solid ${getRatingColor(
                        response.rating
                      )}`,
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 700,
                        color: getRatingColor(response.rating),
                        margin: 0,
                        textAlign: "left",
                      }}
                    >
                      {response.rating} / 5 - {RATING_LABELS[response.rating]}
                    </div>
                  </div>
                </div>
              )}

              {response.feedbackComments && (
                <div>
                  <h6
                    style={{
                      fontSize: "0.938rem",
                      fontWeight: 700,
                      color: "#27235C",
                      marginBottom: "0.75rem",
                      textAlign: "left",
                    }}
                  >
                    Your Feedback
                  </h6>
                  <div
                    style={{
                      padding: "1rem",
                      backgroundColor: "#F9FAFB",
                      borderRadius: "8px",
                      borderLeft: "4px solid #27235C",
                      textAlign: "left",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.875rem",
                        color: "#374151",
                        textAlign: "left",
                      }}
                    >
                      {response.feedbackComments}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* PEER FEEDBACK */}
          {type === "Peer" && (
            <>
              <div
                style={{
                  marginBottom: "1.5rem",
                  paddingBottom: "1.5rem",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <h6
                  style={{
                    fontSize: "0.938rem",
                    fontWeight: 700,
                    color: "#27235C",
                    marginBottom: "1rem",
                    textAlign: "left",
                  }}
                >
                  Feedback Details
                </h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#6B7280",
                        marginBottom: "0.25rem",
                        fontWeight: 600,
                        textAlign: "left",
                      }}
                    >
                      Recipient
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "#1F2937",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        textAlign: "left",
                      }}
                    >
                      <User size={14} style={{ color: "#27235C" }} />
                      {response.recipientNameFull ||
                        response.recipientName ||
                        "N/A"}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#6B7280",
                        marginBottom: "0.25rem",
                        fontWeight: 600,
                        textAlign: "left",
                      }}
                    >
                      Status
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 12px",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          backgroundColor:
                            response.status === "Approved"
                              ? "#D1FAE5"
                              : response.status === "Rejected"
                              ? "#FEE2E2"
                              : "#FEF3C7",
                          color:
                            response.status === "Approved"
                              ? "#10B981"
                              : response.status === "Rejected"
                              ? "#EF4444"
                              : "#F59E0B",
                        }}
                      >
                        {response.status || "Pending"}
                      </span>
                    </div>
                  </div>
                  <div className="col-12">
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#6B7280",
                        marginBottom: "0.25rem",
                        fontWeight: 600,
                        textAlign: "left",
                      }}
                    >
                      Submitted
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "#1F2937",
                        textAlign: "left",
                      }}
                    >
                      {formatDate(response.createdAt)}
                    </div>
                  </div>
                  {response.isAnonymous && (
                    <div className="col-12">
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "#6B7280",
                          marginBottom: "0.25rem",
                          fontWeight: 600,
                          textAlign: "left",
                        }}
                      >
                        Type
                      </div>
                      <div
                        style={{
                          fontWeight: 600,
                          color: "#1F2937",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          textAlign: "left",
                        }}
                      >
                        <Lock size={14} style={{ color: "#27235C" }} />
                        Anonymous
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {response.feedbackContent && (
                <div>
                  <h6
                    style={{
                      fontSize: "0.938rem",
                      fontWeight: 700,
                      color: "#27235C",
                      marginBottom: "0.75rem",
                      textAlign: "left",
                    }}
                  >
                    Your Feedback
                  </h6>
                  <div
                    style={{
                      padding: "1rem",
                      backgroundColor: "#F9FAFB",
                      borderRadius: "8px",
                      borderLeft: "4px solid #27235C",
                      textAlign: "left",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.875rem",
                        color: "#374151",
                        textAlign: "left",
                      }}
                    >
                      {response.feedbackContent}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* GOAL FEEDBACK */}
          {type === "Goal" && (
            <>
              <div
                style={{
                  marginBottom: "1.5rem",
                  paddingBottom: "1.5rem",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <h6
                  style={{
                    fontSize: "0.938rem",
                    fontWeight: 700,
                    color: "#27235C",
                    marginBottom: "1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    textAlign: "left",
                  }}
                >
                  <Target size={18} style={{ color: "#27235C" }} />
                  Goal Information
                </h6>
                <div className="row g-3">
                  <div className="col-12">
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#6B7280",
                        marginBottom: "0.25rem",
                        fontWeight: 600,
                        textAlign: "left",
                      }}
                    >
                      Objective
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "#1F2937",
                        textAlign: "left",
                      }}
                    >
                      {response.objectiveTitle ||
                        response.organizationGoalName ||
                        `Objective #${response.organizationObjectiveId}`}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#6B7280",
                        marginBottom: "0.25rem",
                        fontWeight: 600,
                        textAlign: "left",
                      }}
                    >
                      Rating
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        textAlign: "left",
                      }}
                    >
                      <Star
                        size={16}
                        style={{ color: "#FFB800", fill: "#FFB800" }}
                      />
                      <span
                        style={{
                          fontWeight: 600,
                          color: "#1F2937",
                          textAlign: "left",
                        }}
                      >
                        {response.rating}/5
                      </span>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 12px",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          backgroundColor: `${getRatingColor(
                            response.rating
                          )}20`,
                          color: getRatingColor(response.rating),
                        }}
                      >
                        {RATING_LABELS[response.rating]}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#6B7280",
                        marginBottom: "0.25rem",
                        fontWeight: 600,
                        textAlign: "left",
                      }}
                    >
                      Feedback From
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 12px",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          backgroundColor:
                            response.feedbackFrom === "Manager"
                              ? "#D1FAE5"
                              : "#DBEAFE",
                          color:
                            response.feedbackFrom === "Manager"
                              ? "#10B981"
                              : "#3B82F6",
                        }}
                      >
                        {response.feedbackFrom || "Employee"}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#6B7280",
                        marginBottom: "0.25rem",
                        fontWeight: 600,
                        textAlign: "left",
                      }}
                    >
                      Status
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 12px",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          backgroundColor:
                            response.status === "Approved"
                              ? "#D1FAE5"
                              : response.status === "Rejected"
                              ? "#FEE2E2"
                              : "#DBEAFE",
                          color:
                            response.status === "Approved"
                              ? "#10B981"
                              : response.status === "Rejected"
                              ? "#EF4444"
                              : "#3B82F6",
                        }}
                      >
                        {response.status || "Submitted"}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#6B7280",
                        marginBottom: "0.25rem",
                        fontWeight: 600,
                        textAlign: "left",
                      }}
                    >
                      Submitted
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "#1F2937",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        textAlign: "left",
                      }}
                    >
                      <Calendar size={14} style={{ color: "#27235C" }} />
                      {formatDate(response.createdAt)}
                    </div>
                  </div>
                  {response.submitterName && (
                    <div className="col-md-6">
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "#6B7280",
                          marginBottom: "0.25rem",
                          fontWeight: 600,
                          textAlign: "left",
                        }}
                      >
                        Submitted By
                      </div>
                      <div
                        style={{
                          fontWeight: 600,
                          color: "#1F2937",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          textAlign: "left",
                        }}
                      >
                        <User size={14} style={{ color: "#27235C" }} />
                        {response.submitterName}
                      </div>
                    </div>
                  )}
                  {response.isAnonymous && (
                    <div className="col-md-6">
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "#6B7280",
                          marginBottom: "0.25rem",
                          fontWeight: 600,
                          textAlign: "left",
                        }}
                      >
                        Type
                      </div>
                      <div
                        style={{
                          fontWeight: 600,
                          color: "#1F2937",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          textAlign: "left",
                        }}
                      >
                        <Lock size={14} style={{ color: "#27235C" }} />
                        Anonymous
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {response.feedbackComments && (
                <div>
                  <h6
                    style={{
                      fontSize: "0.938rem",
                      fontWeight: 700,
                      color: "#27235C",
                      marginBottom: "0.75rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      textAlign: "left",
                    }}
                  >
                    <MessageSquare size={16} style={{ color: "#27235C" }} />
                    Feedback Comments
                  </h6>
                  <div
                    style={{
                      padding: "1rem",
                      backgroundColor: "#F9FAFB",
                      borderRadius: "8px",
                      borderLeft: "4px solid #27235C",
                      textAlign: "left",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.875rem",
                        color: "#374151",
                        whiteSpace: "pre-wrap",
                        textAlign: "left",
                      }}
                    >
                      {response.feedbackComments}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "1rem 2rem",
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "flex-end",
            backgroundColor: "#F9FAFB",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "0.625rem 1.5rem",
              borderRadius: "8px",
              border: "1.5px solid #E5E7EB",
              backgroundColor: "white",
              color: "#374151",
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: "pointer",
              transition: "all 0.2s",
              textAlign: "center",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#F9FAFB";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "white";
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResponseViewModal;