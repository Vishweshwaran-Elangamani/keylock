import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  AlertTriangle,
  Calendar,
  User,
  Star,
  Target,
  Briefcase,
  X,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  employeeApi,
  managerReviewApi,
} from "../../../services/feedbackmanagement/feedbackApi";
import "../../../styles/feedback/components/ViewManagerReview.css";

const RATING_LABELS = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

const StatusPill = ({ status }) => {
  let bgClass = "vmr-status-default";

  if (status === "Finalized") {
    bgClass = "vmr-status-finalized";
  } else if (status === "Submitted") {
    bgClass = "vmr-status-submitted";
  } else if (status === "In Progress") {
    bgClass = "vmr-status-progress";
  }

  return (
    <span className={`vmr-status-pill ${bgClass}`}>
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

  const handleClose = () => navigate(-1);

  if (loading) {
    return (
      <div className="vmr-overlay vmr-overlay-loading" onClick={handleClose}>
        <div
          className="vmr-loading-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="vmr-loading-spinner spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="vmr-loading-text">Loading review…</p>
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="vmr-overlay" onClick={handleClose}>
        <div
          className="vmr-notfound-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="vmr-notfound-header">
            <div className="vmr-notfound-title">
              <AlertTriangle size={20} />
              <span>Review not found</span>
            </div>
            <button
              type="button"
              className="vmr-icon-btn"
              onClick={handleClose}
            >
              <X size={18} />
            </button>
          </div>
          <p className="vmr-notfound-text">
            The requested review could not be located. It may have been removed
            or the link is invalid.
          </p>
          <div className="vmr-notfound-footer">
            <button className="vmr-primary-chip-btn" onClick={handleClose}>
              <ArrowLeft size={16} />
              <span>Go back</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vmr-overlay" onClick={handleClose}>
      <div
        className="vmr-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="vmr-header">
          <div className="vmr-header-text">
            <h2 className="vmr-header-title">Manager Review</h2>
            <div className="vmr-header-subtitle">
              {review.targetEmployeeName}
            </div>
          </div>
          <button
            type="button"
            className="vmr-icon-btn vmr-header-close"
            onClick={handleClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="vmr-body">
          <div className="vmr-summary-row">
            <div className="vmr-summary-card vmr-summary-rating">
              <div className="vmr-summary-rating-header">
                <span className="vmr-summary-label">Rating</span>
                <div className="vmr-summary-rating-label">
                  <Star size={16} className="vmr-summary-rating-icon" />
                  <span>{RATING_LABELS[review.rating]}</span>
                </div>
              </div>
              <div className="vmr-summary-rating-main">
                <span className="vmr-summary-rating-value">
                  {review.rating}
                  <span className="vmr-summary-rating-max">/5</span>
                </span>
              </div>
              <div className="vmr-summary-stars">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className={
                      i < review.rating
                        ? "vmr-summary-star vmr-summary-star-active"
                        : "vmr-summary-star"
                    }
                  />
                ))}
              </div>
            </div>

            <div className="vmr-summary-card">
              <div className="vmr-summary-icon-row">
                <div className="vmr-summary-icon vmr-summary-icon-manager">
                  <User size={16} />
                </div>
                <span className="vmr-summary-label">Manager</span>
              </div>
              <p className="vmr-summary-primary-text">{review.managerName}</p>
              <p className="vmr-summary-secondary-text">
                Created on {createdDate}
              </p>
            </div>

            {submittedDate && (
              <div className="vmr-summary-card">
                <div className="vmr-summary-icon-row">
                  <div className="vmr-summary-icon vmr-summary-icon-date">
                    <Calendar size={16} />
                  </div>
                  <span className="vmr-summary-label">Submitted</span>
                </div>
                <p className="vmr-summary-primary-text">{submittedDate}</p>
              </div>
            )}
          </div>

          <div className="vmr-section">
            <div className="vmr-section-header">
              <div className="vmr-section-icon vmr-section-icon-main">
                <Star size={16} />
              </div>
              <h3 className="vmr-section-title">Review comment</h3>
            </div>
            <div className="vmr-section-body-text">
              {review.reviewComment}
            </div>
          </div>

          {(review.projectContext || review.goalContext) && (
            <div className="vmr-context-grid">
              {review.projectContext && (
                <div className="vmr-section">
                  <div className="vmr-section-header">
                    <div className="vmr-section-icon vmr-section-icon-project">
                      <Briefcase size={15} />
                    </div>
                    <h4 className="vmr-section-title">Project context</h4>
                  </div>
                  <div className="vmr-section-body-text vmr-section-body-context">
                    {review.projectContext}
                  </div>
                </div>
              )}

              {review.goalContext && (
                <div className="vmr-section">
                  <div className="vmr-section-header">
                    <div className="vmr-section-icon vmr-section-icon-goal">
                      <Target size={15} />
                    </div>
                    <h4 className="vmr-section-title">Goal context</h4>
                  </div>
                  <div className="vmr-section-body-text vmr-section-body-context">
                    {review.goalContext}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="vmr-footer">
          <button className="vmr-secondary-btn" onClick={handleClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
