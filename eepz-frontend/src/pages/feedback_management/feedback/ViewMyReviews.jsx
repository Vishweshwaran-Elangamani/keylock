// src/pages/feedback_management/feedback/ViewMyReviews.jsx

import React, { useEffect, useState, useMemo } from "react";
import {
  RefreshCw,
  AlertTriangle,
  ArrowLeft,
  Star,
  User,
  Calendar,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  managerReviewApi,
  employeeApi,
} from "../../../services/feedbackmanagement/feedbackApi";

const Badge = ({ text, color = "#525252" }) => (
  <span
    className="badge"
    style={{
      backgroundColor: `${color}20`,
      color,
      padding: "6px 12px",
      fontSize: "0.75rem",
      fontWeight: "600",
    }}
  >
    {text}
  </span>
);

export default function ViewMyReviews() {
  const navigate = useNavigate();
  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "{}") || {},
    []
  );

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [employeeMap, setEmployeeMap] = useState({});

  // Fetch reviews using services
  const fetchReviews = async () => {
    setLoading(true);
    setError("");
    try {
      const empId = user?.empId;
      if (!empId) {
        setError("Employee ID not found");
        setLoading(false);
        return;
      }

      // STEP 1: Fetch employee map
      let empMap = {};
      try {
        const empRes = await employeeApi.getAll();
        
        if (empRes?.data) {
          const employees = Array.isArray(empRes.data)
            ? empRes.data
            : empRes.data.data || [];

          employees.forEach((emp) => {
            empMap[emp.employeeId] = `${emp.firstName} ${emp.lastName}`;
          });
          setEmployeeMap(empMap);
        }
      } catch (err) {
        console.warn("Error fetching employee map:", err.message);
      }

      // STEP 2: Fetch reviews about me using service
      const reviewRes = await managerReviewApi.getByTargetEmployee(empId);
      
      if (reviewRes?.data) {
        const reviewsData = Array.isArray(reviewRes.data)
          ? reviewRes.data
          : reviewRes.data.data || [];

        const enriched = reviewsData.map((r) => ({
          ...r,
          managerName:
            empMap[r.managerEmployeeId] || `Manager ${r.managerEmployeeId}`,
        }));
        setReviews(enriched);
      }
    } catch (err) {
      setError(err?.message || "Failed to load reviews");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchReviews();
  }, [user?.empId]);

  // Calculate average rating
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  // Loading state
  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "60vh" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="d-flex justify-content-center py-4"
      style={{ minHeight: "100vh", background: "#f9f9f9" }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1000px",
          paddingLeft: "1rem",
          paddingRight: "1rem",
        }}
      >
        {/* Header */}
        <div className="d-flex align-items-start mb-4">
          <button
            className="btn btn-outline-secondary me-2"
            onClick={() => navigate(-1)}
            style={{ borderRadius: "var(--radius-md)" }}
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex-grow-1">
            <h2
              className="fw-bold mb-1"
              style={{ color: "var(--color-primary-1)" }}
            >
              My Reviews
            </h2>
            <p className="mb-0 small text-muted">
              Reviews you have received from your managers
            </p>
          </div>
          <button
            className="btn btn-outline-secondary"
            onClick={fetchReviews}
            disabled={loading}
            title="Refresh"
            style={{ borderRadius: "var(--radius-md)" }}
          >
            <RefreshCw
              size={18}
              style={{
                animation: loading ? "spin 1s linear infinite" : "none",
              }}
            />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            className="alert alert-danger d-flex align-items-start gap-2 mb-3"
            style={{ borderRadius: "var(--radius-md)" }}
          >
            <AlertTriangle size={18} className="mt-1 flex-shrink-0" />
            <div className="flex-grow-1">
              <strong>Error</strong>
              <p className="mb-0 small mt-1">{error}</p>
            </div>
            <button className="btn-close" onClick={() => setError("")} />
          </div>
        )}

        {/* Stats */}
        {reviews.length > 0 && (
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <div
                className="card border-0"
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <div className="card-body text-center">
                  <div className="d-flex justify-content-center mb-2">
                    <div
                      className="rounded p-2"
                      style={{ background: "#0F62FE15" }}
                    >
                      <Eye size={24} style={{ color: "#0F62FE" }} />
                    </div>
                  </div>
                  <h3 className="fw-bold" style={{ color: "#0F62FE" }}>
                    {reviews.length}
                  </h3>
                  <p className="mb-0 small text-muted">Reviews Received</p>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div
                className="card border-0"
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <div className="card-body text-center">
                  <div className="d-flex justify-content-center mb-2">
                    <div
                      className="rounded p-2"
                      style={{ background: "#24A14815" }}
                    >
                      <Star size={24} style={{ color: "#24A148" }} />
                    </div>
                  </div>
                  <h3 className="fw-bold" style={{ color: "#24A148" }}>
                    <Star
                      size={20}
                      style={{
                        color: "#FFB800",
                        fill: "#FFB800",
                        display: "inline",
                      }}
                    />{" "}
                    {averageRating}
                  </h3>
                  <p className="mb-0 small text-muted">Average Rating</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div
            className="card border-0"
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <div className="card-body text-center py-5">
              <Star
                size={48}
                className="mb-3"
                style={{ color: "var(--muted)" }}
              />
              <h5 className="text-muted mb-2">No reviews yet</h5>
              <p className="small text-muted mb-0">
                Check back later for reviews from your managers
              </p>
            </div>
          </div>
        ) : (
          <div className="row g-3">
            {reviews.map((review) => (
              <div className="col-12" key={review.reviewcommentId}>
                <div
                  className="card border-0"
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-lg)",
                    boxShadow: "var(--shadow)",
                  }}
                >
                  <div className="card-body">
                    {/* Manager & Rating */}
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <User
                            size={16}
                            style={{ color: "var(--color-primary-1)" }}
                          />
                          <h6 className="fw-bold mb-0">{review.managerName}</h6>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <Calendar size={14} className="text-muted" />
                          <small className="text-muted">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </small>
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="mb-2 d-flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={18}
                              style={{
                                color: i < review.rating ? "#FFB800" : "#e0e0e0",
                                fill: i < review.rating ? "#FFB800" : "none",
                              }}
                            />
                          ))}
                        </div>
                        <Badge text={`${review.rating}/5`} color="#24A148" />
                      </div>
                    </div>

                    {/* Review Comment */}
                    <div className="mb-3">
                      <h6 className="small fw-bold text-muted mb-2">Review</h6>
                      <p
                        className="mb-0"
                        style={{ lineHeight: "1.6", color: "#333" }}
                      >
                        {review.reviewComment}
                      </p>
                    </div>

                    {/* Project & Goal Context */}
                    {(review.projectContext || review.goalContext) && (
                      <div className="row g-2">
                        {review.projectContext && (
                          <div className="col-md-6">
                            <div
                              className="p-2 rounded"
                              style={{ backgroundColor: "#f9f9f9" }}
                            >
                              <h6 className="small fw-bold text-muted mb-1">
                                Project Context
                              </h6>
                              <p className="small mb-0">
                                {review.projectContext}
                              </p>
                            </div>
                          </div>
                        )}
                        {review.goalContext && (
                          <div className="col-md-6">
                            <div
                              className="p-2 rounded"
                              style={{ backgroundColor: "#f9f9f9" }}
                            >
                              <h6 className="small fw-bold text-muted mb-1">
                                Goal Context
                              </h6>
                              <p className="small mb-0">{review.goalContext}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}
