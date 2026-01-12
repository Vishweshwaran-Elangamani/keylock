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
import "../../../styles/feedback/components/ViewMyReviews.css";

const Badge = ({ text, color = "#525252" }) => (
  <span className="vmr-badge" style={{ backgroundColor: `${color}20`, color }}>
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

  useEffect(() => {
    fetchReviews();
  }, [user?.empId]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  if (loading) {
    return (
      <div className="vmr-loading">
        <div className="vmr-spinner" role="status">
          <span className="vmr-visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="vmr-container">
      <div className="vmr-content">
        <div className="vmr-header">
          <button className="vmr-back-button" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
          </button>
          <div className="vmr-header-text">
            <h2 className="vmr-title">My Reviews</h2>
            <p className="vmr-subtitle">
              Reviews you have received from your managers
            </p>
          </div>
          <button
            className="vmr-refresh-button"
            onClick={fetchReviews}
            disabled={loading}
            title="Refresh"
          >
            <RefreshCw
              size={18}
              className={loading ? "vmr-refresh-icon-spin" : ""}
            />
          </button>
        </div>

        {error && (
          <div className="vmr-alert vmr-alert-error">
            <AlertTriangle size={18} className="vmr-alert-icon" />
            <div className="vmr-alert-content">
              <strong>Error</strong>
              <p className="vmr-alert-message">{error}</p>
            </div>
            <button className="vmr-alert-close" onClick={() => setError("")}>
              ×
            </button>
          </div>
        )}

        {reviews.length > 0 && (
          <div className="vmr-stats-grid">
            <div className="vmr-stat-card">
              <div className="vmr-stat-card-body">
                <div className="vmr-stat-icon-wrapper">
                  <div className="vmr-stat-icon vmr-stat-icon-blue">
                    <Eye size={24} />
                  </div>
                </div>
                <h3 className="vmr-stat-value vmr-stat-value-blue">
                  {reviews.length}
                </h3>
                <p className="vmr-stat-label">Reviews Received</p>
              </div>
            </div>
            <div className="vmr-stat-card">
              <div className="vmr-stat-card-body">
                <div className="vmr-stat-icon-wrapper">
                  <div className="vmr-stat-icon vmr-stat-icon-green">
                    <Star size={24} />
                  </div>
                </div>
                <h3 className="vmr-stat-value vmr-stat-value-green">
                  <Star size={20} className="vmr-star-inline" /> {averageRating}
                </h3>
                <p className="vmr-stat-label">Average Rating</p>
              </div>
            </div>
          </div>
        )}

        {reviews.length === 0 ? (
          <div className="vmr-empty-state">
            <div className="vmr-empty-state-body">
              <Star size={48} className="vmr-empty-icon" />
              <h5 className="vmr-empty-title">No reviews yet</h5>
              <p className="vmr-empty-text">
                Check back later for reviews from your managers
              </p>
            </div>
          </div>
        ) : (
          <div className="vmr-reviews-list">
            {reviews.map((review) => (
              <div className="vmr-review-card" key={review.reviewcommentId}>
                <div className="vmr-review-card-body">
                  <div className="vmr-review-header">
                    <div className="vmr-review-manager">
                      <div className="vmr-manager-info">
                        <User size={16} className="vmr-manager-icon" />
                        <h6 className="vmr-manager-name">
                          {review.managerName}
                        </h6>
                      </div>
                      <div className="vmr-review-date">
                        <Calendar size={14} className="vmr-date-icon" />
                        <small className="vmr-date-text">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </small>
                      </div>
                    </div>
                    <div className="vmr-review-rating">
                      <div className="vmr-stars">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={18}
                            className={`vmr-star ${
                              i < review.rating
                                ? "vmr-star-filled"
                                : "vmr-star-empty"
                            }`}
                          />
                        ))}
                      </div>
                      <Badge text={`${review.rating}/5`} color="#24A148" />
                    </div>
                  </div>

                  <div className="vmr-review-content">
                    <h6 className="vmr-review-label">Review</h6>
                    <p className="vmr-review-text">{review.reviewComment}</p>
                  </div>

                  {(review.projectContext || review.goalContext) && (
                    <div className="vmr-context-grid">
                      {review.projectContext && (
                        <div className="vmr-context-item">
                          <div className="vmr-context-box">
                            <h6 className="vmr-context-label">
                              Project Context
                            </h6>
                            <p className="vmr-context-text">
                              {" "}
                              {review.projectContext}
                            </p>
                          </div>
                        </div>
                      )}
                      {review.goalContext && (
                        <div className="vmr-context-item">
                          <div className="vmr-context-box">
                            <h6 className="vmr-context-label">Goal Context</h6>
                            <p className="vmr-context-text">
                              {review.goalContext}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
