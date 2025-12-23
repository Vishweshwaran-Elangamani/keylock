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
  X,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { employeeApi, managerReviewApi } from "../../../services/feedbackmanagement/feedbackApi";
import FeedbackBreadcrumb from "../../../components/feedback_management/common/FeedbackBreadcrumb";

const RATING_LABELS = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

const StatusPill = ({ status }) => {
  let bg = "#e5e7eb";
  let fg = "#374151";

  if (status === "Finalized") {
    bg = "#dcfce7";
    fg = "#166534";
  } else if (status === "Submitted") {
    bg = "#dbeafe";
    fg = "#1d4ed8";
  } else if (status === "In Progress") {
    bg = "#fef9c3";
    fg = "#854d0e";
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 10px",
        borderRadius: "999px",
        fontSize: "0.7rem",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        backgroundColor: bg,
        color: fg,
      }}
    >
      {status || "Submitted"}
    </span>
  );
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

  const fetchReviewData = async () => {
    setLoading(true);
    setError("");

    try {
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

      const reviewRes = await managerReviewApi.getById(id);
      if (reviewRes.data?.success && reviewRes.data.data) {
        const r = reviewRes.data.data;
        const reviewData = {
          ...r,
          targetEmployeeName:
            empMap[r.targetEmployeeId] ||
            r.targetEmployeeName ||
            `Employee ${r.targetEmployeeId}`,
          managerName:
            empMap[r.managerEmployeeId] || `Manager ${r.managerEmployeeId}`,
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
    if (id) fetchReviewData();
  }, [id]);

  const createdDate =
    review &&
    new Date(review.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const submittedDate =
    review && review.submittedDate
      ? new Date(review.submittedDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : null;

  // common close handler
  const handleClose = () => navigate(-1);

  // LOADING STATE (still modal-style)
  if (loading) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(15,23,42,0.3)",
          zIndex: 1050,
        }}
        onClick={handleClose} // click anywhere closes
      >
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "1.5rem 2rem",
            boxShadow: "0 18px 40px rgba(15,23,42,0.25)",
          }}
          onClick={(e) => e.stopPropagation()} // prevent close when clicking inside
        >
          <div className="text-center">
            <div
              className="spinner-border"
              style={{
                width: "3rem",
                height: "3rem",
                color: "#2563eb",
                borderWidth: "3px",
              }}
              role="status"
            >
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted mb-0">Loading review…</p>
          </div>
        </div>
      </div>
    );
  }

  // NOT FOUND
  if (!review) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(15,23,42,0.35)",
          zIndex: 1050,
        }}
        onClick={handleClose}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "420px",
            background: "#ffffff",
            borderRadius: "18px",
            padding: "1.5rem 1.75rem",
            boxShadow: "0 18px 40px rgba(15,23,42,0.25)",
            border: "1px solid #e5e7eb",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="d-flex justify-content-between align-items-start mb-2">
            <div className="d-flex align-items-center gap-2" style={{ color: "#b91c1c" }}>
              <AlertTriangle size={20} />
              <span className="fw-semibold">Review not found</span>
            </div>
            <button
              type="button"
              className="btn btn-sm"
              onClick={handleClose}
              style={{
                border: "none",
                background: "transparent",
                padding: 0,
                color: "#9ca3af",
              }}
            >
              <X size={18} />
            </button>
          </div>
          <p className="text-muted mb-3" style={{ fontSize: "0.9rem" }}>
            The requested review could not be located. It may have been removed or the
            link is invalid.
          </p>
          <div className="d-flex justify-content-end">
            <button
              className="btn d-inline-flex align-items-center gap-2"
              onClick={handleClose}
              style={{
                borderRadius: "999px",
                padding: "8px 18px",
                background: "#2563eb",
                border: "none",
                fontWeight: 600,
                color: "#ffffff",
                fontSize: "0.9rem",
              }}
            >
              <ArrowLeft size={16} />
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MAIN MODAL
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1050,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(15,23,42,0.35)",
      }}
      onClick={handleClose} // click outside closes
    >
      <div
        style={{
          width: "100%",
          maxWidth: "720px",
          maxHeight: "80vh",
          background: "#ffffff",
          borderRadius: "18px",
          boxShadow: "0 24px 60px rgba(15,23,42,0.35)",
          border: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
      >
        {/* HEADER */}
        <div
          style={{
            padding: "1rem 1.5rem",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
            backgroundColor: "#2f316a",
            borderTopLeftRadius: "18px",
            borderTopRightRadius: "18px",
            color: "#ffffff",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "1.05rem",
                fontWeight: 600,
                margin: 0,
                color: "#ffffff",
              }}
            >
              Manager Review
            </h2>
            <div
              style={{
                fontSize: "0.85rem",
                marginTop: "2px",
                opacity: 0.9,
              }}
            >
              {review.targetEmployeeName}
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            style={{
              border: "none",
              background: "transparent",
              padding: 6,
              borderRadius: "999px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div
          style={{
            padding: "1.25rem 1.5rem 1.25rem",
            overflowY: "auto",
          }}
        >
          {/* SUMMARY ROW */}
          <div
            className="d-flex flex-wrap"
            style={{
              gap: "1rem",
              marginBottom: "1.25rem",
            }}
          >
            <div
              style={{
                flex: "1 1 180px",
                minWidth: "0",
                background: "#f9fafb",
                borderRadius: "12px",
                padding: "0.9rem 1rem",
                border: "1px solid #e5e7eb",
              }}
            >
              <div
                className="d-flex justify-content-between align-items-center mb-1"
                style={{ gap: "0.5rem" }}
              >
                <span
                  style={{
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#6b7280",
                  }}
                >
                  Rating
                </span>
                <div className="d-flex align-items-center gap-1">
                  <Star size={16} style={{ color: "#f97316" }} />
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "#6b7280",
                      fontWeight: 500,
                    }}
                  >
                    {RATING_LABELS[review.rating]}
                  </span>
                </div>
              </div>
              <div className="d-flex align-items-baseline gap-1 mb-1">
                <span
                  style={{
                    fontSize: "1.7rem",
                    fontWeight: 700,
                    color: "#111827",
                  }}
                >
                  {review.rating}
                  <span style={{ fontSize: "0.9rem", color: "#6b7280" }}>
                    /5
                  </span>
                </span>
              </div>
              <div style={{ display: "flex", gap: "0.15rem" }}>
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    style={{
                      color: i < review.rating ? "#f97316" : "#e5e7eb",
                      fill: i < review.rating ? "#f97316" : "transparent",
                    }}
                  />
                ))}
              </div>
            </div>

            <div
              style={{
                flex: "1 1 180px",
                minWidth: "0",
                background: "#f9fafb",
                borderRadius: "12px",
                padding: "0.9rem 1rem",
                border: "1px solid #e5e7eb",
              }}
            >
              <div className="d-flex align-items-center gap-2 mb-1">
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "999px",
                    background: "#e0f2fe",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <User size={16} style={{ color: "#2563eb" }} />
                </div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#6b7280",
                    fontWeight: 600,
                  }}
                >
                  Manager
                </span>
              </div>
              <p
                className="mb-1"
                style={{
                  fontSize: "0.92rem",
                  color: "#111827",
                  fontWeight: 500,
                }}
              >
                {review.managerName}
              </p>
              <p
                className="mb-0 text-muted"
                style={{ fontSize: "0.8rem", color: "#6b7280" }}
              >
                Created on {createdDate}
              </p>
            </div>

            {submittedDate && (
              <div
                style={{
                  flex: "1 1 160px",
                  minWidth: "0",
                  background: "#f9fafb",
                  borderRadius: "12px",
                  padding: "0.9rem 1rem",
                  border: "1px solid #e5e7eb",
                }}
              >
                <div className="d-flex align-items-center gap-2 mb-1">
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "999px",
                      background: "#e0f2fe",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Calendar size={16} style={{ color: "#2563eb" }} />
                  </div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "#6b7280",
                      fontWeight: 600,
                    }}
                  >
                    Submitted
                  </span>
                </div>
                <p
                  className="mb-0"
                  style={{ fontSize: "0.9rem", color: "#111827" }}
                >
                  {submittedDate}
                </p>
              </div>
            )}
          </div>

          {/* REVIEW COMMENT */}
          <div style={{ marginBottom: "1.25rem" }}>
            <div className="d-flex align-items-center gap-2 mb-2">
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "999px",
                  background: "#eff6ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Star size={16} style={{ color: "#f97316" }} />
              </div>
            <h3
              style={{
                fontSize: "0.96rem",
                fontWeight: 600,
                margin: 0,
                color: "#111827",
              }}
            >
              Review comment
            </h3>
            </div>
            <div
              style={{
                borderRadius: "10px",
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                padding: "0.9rem 1rem",
                fontSize: "0.92rem",
                lineHeight: "1.7",
                color: "#374151",
                whiteSpace: "pre-wrap",
              }}
            >
              {review.reviewComment}
            </div>
          </div>

          {/* CONTEXT */}
          {(review.projectContext || review.goalContext) && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  review.projectContext && review.goalContext
                    ? "repeat(auto-fit, minmax(260px, 1fr))"
                    : "minmax(0, 1fr)",
                gap: "1rem",
                marginBottom: "0.75rem",
              }}
            >
              {review.projectContext && (
                <div>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <div
                      style={{
                        width: "26px",
                        height: "26px",
                        borderRadius: "999px",
                        background: "#e0f2fe",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Briefcase size={15} style={{ color: "#0284c7" }} />
                    </div>
                    <h4
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        margin: 0,
                        color: "#111827",
                      }}
                    >
                      Project context
                    </h4>
                  </div>
                  <div
                    style={{
                      borderRadius: "10px",
                      background: "#f9fafb",
                      border: "1px solid #e5e7eb",
                      padding: "0.8rem 0.95rem",
                      fontSize: "0.88rem",
                      lineHeight: "1.6",
                      color: "#4b5563",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {review.projectContext}
                  </div>
                </div>
              )}

              {review.goalContext && (
                <div>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <div
                      style={{
                        width: "26px",
                        height: "26px",
                        borderRadius: "999px",
                        background: "#dcfce7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Target size={15} style={{ color: "#15803d" }} />
                    </div>
                    <h4
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        margin: 0,
                        color: "#111827",
                      }}
                    >
                      Goal context
                    </h4>
                  </div>
                  <div
                    style={{
                      borderRadius: "10px",
                      background: "#f9fafb",
                      border: "1px solid #e5e7eb",
                      padding: "0.8rem 0.95rem",
                      fontSize: "0.88rem",
                      lineHeight: "1.6",
                      color: "#4b5563",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {review.goalContext}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div
          style={{
            padding: "0.75rem 1.5rem 1rem",
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.5rem",
          }}
        >
          <button
            className="btn"
            onClick={handleClose}
            style={{
              borderRadius: "999px",
              padding: "8px 16px",
              background: "#ffffff",
              border: "1px solid #d1d5db",
              color: "#374151",
              fontSize: "0.9rem",
              fontWeight: 500,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
