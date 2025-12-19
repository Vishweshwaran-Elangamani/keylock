import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Calendar,
  User,
  Star,
  Target,
  Briefcase,
  RefreshCw,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { employeeApi, managerReviewApi } from "../../../services/feedbackmanagement/feedbackApi";
import FeedbackBreadcrumb from "../../../components/feedback_management/common/FeedbackBreadcrumb"

const API_BASE = import.meta.env.VITE_API_BASE;

const Badge = ({ text, color = "#525252" }) => (
  <span
    style={{
      display: "inline-block",
      backgroundColor: `${color}20`,
      color,
      padding: "6px 14px",
      fontSize: "0.813rem",
      fontWeight: "600",
      borderRadius: "6px",
      border: `1.5px solid ${color}40`,
    }}
  >
    {text}
  </span>
);

const RATING_LABELS = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

export default function ViewManagerReview() {
  const navigate = useNavigate();
  const { id } = useParams();

  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "{}") || {},
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [review, setReview] = useState(null);
  const [employeeMap, setEmployeeMap] = useState({});

  // ============================================================================
  // FETCH REVIEW DATA
  // ============================================================================

  const fetchReviewData = async () => {
    setLoading(true);
    setError("");

    try {
      // Fetch employee map
      let empMap = {};
      try {
        const empRes = await employeeApi.getAll();

        if (empRes.data?.success && Array.isArray(empRes.data.data)) {
          empRes.data.data.forEach((emp) => {
            empMap[emp.employeeId] = `${emp.firstName} ${emp.lastName}`;
          });
          setEmployeeMap(empMap);
        }
      } catch (err) {
        console.warn("Error fetching employee map:", err.message);
      }

      // Fetch review details
      const reviewRes = await managerReviewApi.getById(id)
      if (reviewRes.data?.success && reviewRes.data.data) {
        const reviewData = {
          ...reviewRes.data.data,
          targetEmployeeName:
            empMap[reviewRes.data.data.targetEmployeeId] ||
            reviewRes.data.data.targetEmployeeName ||
            `Employee ${reviewRes.data.data.targetEmployeeId}`,
          managerName:
            empMap[reviewRes.data.data.managerEmployeeId] ||
            `Manager ${reviewRes.data.data.managerEmployeeId}`,
        };
        setReview(reviewData);
      } else {
        setError("Review not found");
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "Failed to load review"
      );
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchReviewData();
    }
  }, [id]);

  // ============================================================================
  // LOADING & ERROR STATES
  // ============================================================================

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "60vh" }}
      >
        <div className="text-center">
          <div
            className="spinner-border"
            style={{
              width: "3rem",
              height: "3rem",
              color: "#0d6efd",
              borderWidth: "3px",
            }}
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-3 fw-medium">Loading review details...</p>
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="container-fluid py-4" style={{ maxWidth: "900px" }}>
        <div
          className="alert alert-danger d-flex align-items-center gap-3"
          style={{ borderRadius: "8px", border: "1px solid #dc3545" }}
        >
          <AlertTriangle size={20} />
          <span className="fw-medium">Review not found</span>
        </div>
        <button
          className="btn btn-primary d-inline-flex align-items-center gap-2"
          onClick={() => navigate(-1)}
          style={{ borderRadius: "6px", padding: "10px 20px" }}
        >
          <ArrowLeft size={18} />
          Go Back
        </button>
      </div>
    );
  }

  const statusColor =
    review.status === "Finalized"
      ? "#198754"
      : review.status === "Submitted"
      ? "#0d6efd"
      : "#ffc107";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8f9fa",
        padding: "2rem 1rem",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        {/* HEADER SECTION */}
        <div
          className="d-flex justify-content-between align-items-center mb-4"
          style={{ flexWrap: "wrap", gap: "1rem" }}
        >
         
           <FeedbackBreadcrumb
              items={[
                { label: "Feedback Management", path: "/manager/dashboard/feedback" },
                { label: "My Reviews" },
              ]}
            />
        </div>

        {/* ERROR ALERT */}
        {error && (
          <div
            className="alert alert-danger alert-dismissible fade show d-flex align-items-start gap-2 mb-3"
            role="alert"
            style={{ borderRadius: "8px" }}
          >
            <AlertTriangle size={18} className="mt-1 flex-shrink-0" />
            <div className="flex-grow-1">
              <strong>Error</strong>
              <p className="mb-0 small mt-1">{error}</p>
            </div>
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
            className="alert alert-success alert-dismissible fade show d-flex align-items-center gap-2 mb-3"
            role="alert"
            style={{ borderRadius: "8px" }}
          >
            <CheckCircle size={18} className="flex-shrink-0" />
            <div className="small flex-grow-1">{success}</div>
            <button
              type="button"
              className="btn-close"
              onClick={() => setSuccess("")}
            />
          </div>
        )}

        {/* MAIN RATING CARD - MODAL HEADER STYLE */}
        <div
          style={{
            background: "linear-gradient(135deg, #9D247D 0%, #7a1d63 100%)",
            borderRadius: "10px",
            padding: "2rem",
            marginBottom: "1.5rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            color: "white",
          }}
        >
          <div className="row align-items-center g-3">
            <div className="col-md-6">
              <div
                className="d-flex align-items-center gap-2 mb-2"
                style={{ opacity: 0.9, color: "white" }}
              >
                <User size={18} />
                <small
                  style={{
                    fontSize: "0.813rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    fontStyle : "normal",
                    letterSpacing: "0.5px",
                    color: "white",
                  }}
                >
                  Reviewing Employee
                </small>
              </div>
              <h4
                className="fw-bold mb-0"
                style={{
                  fontSize: "1.5rem",
                  color: "white",
                  textAlign: "left",
                }}
              >
                {review.targetEmployeeName}
              </h4>
            </div>
            <div className="col-md-6 text-md-end">
              <div
                className="d-flex align-items-center justify-content-md-end gap-2 mb-2"
                style={{ opacity: 0.9 }}
              >
                <Star size={18} style={{ fill: "white" }} />
                <small
                  style={{
                    fontSize: "0.813rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "white",
                  }}
                >
                  Performance Rating
                </small>
              </div>
              <h3
                className="fw-bold mb-2"
                style={{ fontSize: "2rem", color: "white" }}
              >
                {review.rating}/5
                <span
                  className="ms-2"
                  style={{ fontSize: "0.875rem", opacity: 0.85 }}
                >
                  ({RATING_LABELS[review.rating]})
                </span>
              </h3>
              <div className="d-flex justify-content-md-end gap-1">
                {[...Array(5)].map((_, index) => (
                  <Star
                    key={index}
                    size={18}
                    style={{
                      color: "white",
                      fill: index < review.rating ? "white" : "transparent",
                      opacity: index < review.rating ? 1 : 0.5,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* TWO COLUMN GRID - MODAL STYLE */}
        <div className="row g-3 mb-3">
          {/* LEFT COLUMN */}
          <div className="col-md-4">
            <div
              style={{
                background: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "1.25rem",
                height: "100%",
              }}
            >
              <div className="d-flex align-items-center gap-2 mb-3">
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "6px",
                    background: `${statusColor}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckCircle size={16} style={{ color: statusColor }} />
                </div>
                <small
                  className="text-muted fw-bold"
                  style={{
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    textAlign: "left",
                  }}
                >
                  Status
                </small>
              </div>
              <Badge
                text={review.status || "Submitted"}
                color={statusColor}
                style={{ textAlign: "left" }}
              />
            </div>
          </div>

          {/* MIDDLE COLUMN */}
          <div className="col-md-4">
            <div
              style={{
                background: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "1.25rem",
                height: "100%",
              }}
            >
              <div className="d-flex align-items-center gap-2 mb-3">
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "6px",
                    background: "#0d6efd15",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <User size={16} style={{ color: "#0d6efd" }} />
                </div>
                <small
                  className="text-muted fw-bold"
                  style={{
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Reviewed By
                </small>
              </div>
              <p
                className="mb-0 fw-semibold"
                style={{
                  fontSize: "0.938rem",
                  color: "#212529",
                  textAlign: "left",
                }}
              >
                {review.managerName}
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="col-md-4">
            <div
              style={{
                background: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "1.25rem",
                height: "100%",
              }}
            >
              <div className="d-flex align-items-center gap-2 mb-3">
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "6px",
                    background: "#0d6efd15",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Calendar size={16} style={{ color: "#0d6efd" }} />
                </div>
                <small
                  className="text-muted fw-bold"
                  style={{
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    textAlign: "left",
                  }}
                >
                  Created On
                </small>
              </div>
              <p
                className="mb-0 fw-semibold"
                style={{
                  fontSize: "0.938rem",
                  color: "#212529",
                  textAlign: "left",
                }}
              >
                {new Date(review.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* REVIEW COMMENT SECTION - DOCUMENT SECTION STYLE */}
        <div
          style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <div className="d-flex align-items-center gap-2 mb-3">
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #9D247D 0%, #7a1d63 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Star size={18} style={{ color: "white" }} />
            </div>
            <h5
              className="fw-bold mb-0"
              style={{ fontSize: "1.125rem", color: "#212529" }}
            >
              Review Comment
            </h5>
          </div>
          <p
            className="mb-0"
            style={{
              lineHeight: "1.7",
              color: "#6c757d",
              fontSize: "0.938rem",
              textAlign: "left",
            }}
          >
            {review.reviewComment}
          </p>
        </div>

        {/* PROJECT & GOAL CONTEXT - TWO COLUMN GRID */}
        {(review.projectContext || review.goalContext) && (
          <div className="row g-3 mb-3">
            {review.projectContext && (
              <div className="col-md-6">
                <div
                  style={{
                    background: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "1.5rem",
                    height: "100%",
                  }}
                >
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "6px",
                        background: "#0d6efd15",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Briefcase size={16} style={{ color: "#0d6efd" }} />
                    </div>
                    <h6
                      className="fw-bold mb-0"
                      style={{ fontSize: "1rem", color: "#212529" }}
                    >
                      Project Context
                    </h6>
                  </div>
                  <p
                    className="mb-0"
                    style={{
                      lineHeight: "1.6",
                      color: "#6c757d",
                      fontSize: "0.875rem",
                    }}
                  >
                    {review.projectContext}
                  </p>
                </div>
              </div>
            )}
            {review.goalContext && (
              <div className="col-md-6">
                <div
                  style={{
                    background: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "1.5rem",
                    height: "100%",
                  }}
                >
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "6px",
                        background: "#19875415",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Target size={16} style={{ color: "#198754" }} />
                    </div>
                    <h6
                      className="fw-bold mb-0"
                      style={{ fontSize: "1rem", color: "#212529" }}
                    >
                      Goal Context
                    </h6>
                  </div>
                  <p
                    className="mb-0"
                    style={{
                      lineHeight: "1.6",
                      color: "#6c757d",
                      fontSize: "0.875rem",
                    }}
                  >
                    {review.goalContext}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUBMITTED DATE INFO */}
        {review.submittedDate && (
          <div
            style={{
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "1rem 1.25rem",
              marginBottom: "1.5rem",
            }}
          >
            <div className="d-flex align-items-center gap-2">
              <CheckCircle size={16} style={{ color: "#198754" }} />
              <small
                className="text-muted fw-medium"
                style={{ fontSize: "0.875rem" }}
              >
                Submitted on
              </small>
              <strong style={{ fontSize: "0.875rem", color: "#212529" }}>
                {new Date(review.submittedDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </strong>
            </div>
          </div>
        )}

        {/* FINALIZED MESSAGE */}
        {review.status === "Finalized" && (
          <div
            className="alert alert-success d-flex align-items-start gap-2 mb-3"
            role="alert"
            style={{ borderRadius: "8px", border: "1px solid #198754" }}
          >
            <CheckCircle
              size={20}
              className="flex-shrink-0"
              style={{ marginTop: "2px" }}
            />
            <div>
              <strong style={{ fontSize: "0.938rem" }}>Review Finalized</strong>
              <p className="mb-0 small mt-1">
                This review has been finalized and can no longer be modified.
              </p>
            </div>
          </div>
        )}

        {/* MODAL FOOTER STYLE BUTTONS */}
        <div className="d-flex justify-content-end gap-2">
          <button
            className="btn btn-secondary d-flex align-items-center gap-2"
            onClick={() => navigate(-1)}
            style={{
              borderRadius: "6px",
              padding: "10px 20px",
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={16} />
            Back to List
          </button>
        </div>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
