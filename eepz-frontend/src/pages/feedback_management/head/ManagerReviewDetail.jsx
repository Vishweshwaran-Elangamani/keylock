import React, { useEffect, useState, useMemo } from "react";
import {
  ArrowLeft,
  AlertTriangle,
  Clock,
  User,
  Star,
  MessageSquare,
  Edit,
  Trash2,
} from "lucide-react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function ManagerReviewDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const [review, setReview] = useState(location.state?.review || null);
  const [loading, setLoading] = useState(!review);
  const [error, setError] = useState("");
  const [employeeMap, setEmployeeMap] = useState({});

  // ============================================================================
  // FETCH EMPLOYEE MAP
  // ============================================================================

  const fetchEmployeeMap = async () => {
    try {
      const res = await axios.get(`${API_BASE}/EmployeeManagement/all`);
      if (res.data?.success && Array.isArray(res.data.data)) {
        const map = {};
        res.data.data.forEach((emp) => {
          map[emp.employeeId] = `${emp.firstName} ${emp.lastName}`;
        });
        setEmployeeMap(map);
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  // ============================================================================
  // FETCH REVIEW DETAILS
  // ============================================================================

  const fetchReviewDetails = async () => {
    if (review) return;

    setLoading(true);
    setError("");

    try {
      const res = await axios.get(`${API_BASE}/ManagerReview/${id}`);
      if (res.data?.success && res.data.data) {
        setReview(res.data.data);
        console.log(" Review loaded");
      }
    } catch (err) {
      setError("Failed to load review details");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    fetchEmployeeMap();
  }, []);

  useEffect(() => {
    fetchReviewDetails();
  }, [id]);

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "60vh" }}
      >
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  if (!review) {
    return <div className="alert alert-danger">Review not found</div>;
  }

  const statusColor =
    review.status === "Approved"
      ? "#24A148"
      : review.status === "Pending"
      ? "#E2B93B"
      : "#0F62FE";
  const managerName =
    employeeMap[review.managerEmployeeId] ||
    `Manager ${review.managerEmployeeId}`;
  const employeeName =
    employeeMap[review.targetEmployeeId] ||
    `Employee ${review.targetEmployeeId}`;

  return (
    <div className="container-fluid py-3" style={{ maxWidth: "900px" }}>
      {/* HEADER */}
      <div className="d-flex gap-2 mb-4">
        <button
          className="btn btn-outline-secondary"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2
            className="fw-bold mb-1"
            style={{ color: "var(--color-primary-1)" }}
          >
            Review Details
          </h2>
          <p className="mb-0 small text-muted">
            Review ID: {review.reviewcommentId}
          </p>
        </div>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div className="alert alert-danger d-flex align-items-start gap-2 mb-3">
          <AlertTriangle size={18} className="mt-1" />
          <div>{error}</div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="row g-3 mb-4">
        {/* LEFT: REVIEW INFO */}
        <div className="col-md-6">
          <div
            className="card border-0"
            style={{ border: "1px solid var(--border)" }}
          >
            <div className="card-body">
              <h5 className="mb-3" style={{ color: "var(--color-primary-1)" }}>
                Review Information
              </h5>

              {/* Manager */}
              <div className="mb-3">
                <label className="form-label fw-bold small text-muted">
                  From Manager:
                </label>
                <div className="d-flex align-items-center gap-2">
                  <User size={16} style={{ color: "var(--color-primary-1)" }} />
                  <p className="mb-0 fw-bold">{managerName}</p>
                </div>
              </div>

              {/* Employee */}
              <div className="mb-3">
                <label className="form-label fw-bold small text-muted">
                  For Employee:
                </label>
                <div className="d-flex align-items-center gap-2">
                  <User size={16} style={{ color: "var(--color-primary-1)" }} />
                  <p className="mb-0 fw-bold">{employeeName}</p>
                </div>
              </div>

              {/* Status */}
              <div className="mb-3">
                <label className="form-label fw-bold small text-muted">
                  Status:
                </label>
                <span
                  className="badge"
                  style={{
                    backgroundColor: `${statusColor}20`,
                    color: statusColor,
                    padding: "6px 10px",
                  }}
                >
                  {review.status}
                </span>
              </div>

              {/* Rating */}
              <div className="mb-3">
                <label className="form-label fw-bold small text-muted">
                  Rating:
                </label>
                <div className="small">{"⭐".repeat(review.rating || 0)}</div>
              </div>

              {/* Date */}
              <div className="mb-3">
                <label className="form-label fw-bold small text-muted">
                  Date Created:
                </label>
                <div className="d-flex align-items-center gap-2 small">
                  <Clock
                    size={14}
                    style={{ color: "var(--color-primary-3)" }}
                  />
                  {new Date(review.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: REVIEW CONTENT */}
        <div className="col-md-6"></div>
      </div>

      {/* ACTION BUTTONS */}
    </div>
  );
}
