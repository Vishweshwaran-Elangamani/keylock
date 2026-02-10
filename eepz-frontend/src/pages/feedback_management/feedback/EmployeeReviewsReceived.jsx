import React, { useEffect, useState } from "react";
import { User, Calendar, AlertTriangle, Star } from "lucide-react";
import FeedbackBreadcrumb from "../../../components/feedback_management/common/FeedbackBreadcrumb";
import { managerReviewApi, employeeApi } from "../../../services/feedbackmanagement/feedbackApi";
import "../../../styles/feedback/components/EmployeeReviewsReceived.css";

export default function EmployeeReviewsReceived() {
  const [empId, setEmpId] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [employeeMap, setEmployeeMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const empRes = await employeeApi.getAll();
        const emps = empRes?.data?.data || empRes?.data || [];
        const matched = emps.find(e => e.email === user.email);
        if (!matched) throw new Error();
        setEmpId(matched.employeeId);

        let map = {};
        emps.forEach(e => {
          map[e.employeeId] = `${e.firstName} ${e.lastName}`;
        });
        setEmployeeMap(map);
      } catch {
        setError("User not found");
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await managerReviewApi.getForTarget(empId);
        const reviewData = res?.data?.data || [];
        setReviews(reviewData);
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || "Failed to load reviews");
      } finally {
        setLoading(false);
      }
    };
    if (empId) fetchReviews();
  }, [empId]);

  return (
    <div className="fm-emprev-page">
      <FeedbackBreadcrumb
        items={[
          { label: "Feedback Management", path: "/employee/dashboard/feedback" },
          { label: "Reviews Received" },
        ]}
      />

      {error && (
        <div className="fm-emprev-error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="fm-emprev-loading">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="fm-emprev-empty">No reviews received yet</div>
      ) : (
        <div className="fm-emprev-grid">
          {reviews.map((review) => (
            <div key={review.reviewcommentId || review.reviewId || review.id} className="fm-emprev-card">
              <div className="fm-emprev-meta">
                <div className="fm-emprev-person">
                  <User size={16} />
                  <div>
                    <div className="label">From</div>
                    <div className="value">
                      {employeeMap[review.managerEmployeeId] || "Manager"}
                    </div>
                  </div>
                </div>

                <div className="fm-emprev-date">
                  <Calendar size={16} />
                  <span>
                    {review.submittedAt || review.createdAt
                      ? new Date(review.submittedAt || review.createdAt).toLocaleDateString("en-GB")
                      : "—"}
                  </span>
                </div>

                <div className="fm-emprev-rating">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className={i < review.rating ? "filled" : ""} />
                  ))}
                  <span className="rating-text">{review.rating}/5</span>
                </div>
              </div>

              <div className="fm-emprev-context">
                <span className="text">
                  {review.reviewComment || "No comment provided"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
