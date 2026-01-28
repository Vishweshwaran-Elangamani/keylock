import React, { useEffect, useState, useMemo } from "react";
import {
  Save,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Edit,
  RefreshCw,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../../styles/feedback/components/EditManagerReview.css";

const API_BASE = import.meta.env.VITE_API_BASE;

const RATING_LABELS = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

export default function EditManagerReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "{}") || {},
    []
  );

  const [form, setForm] = useState({
    rating: 3,
    reviewComment: "",
    projectContext: "",
    goalContext: "",
  });
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [review, setReview] = useState(null);

  const fetchReview = async () => {
    setLoadingData(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE}/ManagerReview/${id}`);
      if (res.data?.success && res.data.data) {
        const data = res.data.data;
        setReview(data);
        setForm({
          rating: data?.rating || 3,
          reviewComment: data?.reviewComment || "",
          projectContext: data?.projectContext || "",
          goalContext: data?.goalContext || "",
        });
      } else {
        setError("Review not found");
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "Failed to load review"
      );
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (id) fetchReview();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.reviewComment?.trim()) {
      setError("Review comment is required");
      return;
    }

    const payload = {
      rating: Number(form.rating),
      reviewComment: form.reviewComment,
      projectContext: form.projectContext || null,
      goalContext: form.goalContext || null,
    };

    setLoading(true);
    try {
      const response = await axios.put(
        `${API_BASE}/ManagerReview/${id}`,
        payload
      );

      if (response.data?.success) {
        setSuccess("Review updated successfully!");
        setTimeout(() => navigate(`/manager/view-review/${id}`), 1500);
      } else {
        setError(response.data?.message || "Failed to update review");
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "Failed to update review"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="emr-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="emr-page">
      <div className="emr-wrapper">
        <div className="emr-header">
          <button
            className="btn btn-outline-secondary emr-back-btn"
            onClick={() => navigate(-1)}
            type="button"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="emr-header-text">
            <h2 className="emr-title">Edit Review</h2>
            <p className="emr-subtitle">
              Make changes to your review. Changes will be saved when you click
              Save Changes.
            </p>
          </div>

          <button
            className="btn btn-outline-secondary emr-refresh-btn"
            onClick={fetchReview}
            disabled={loadingData}
            title="Refresh"
            type="button"
          >
            <RefreshCw size={18} className={loadingData ? "emr-spin" : ""} />
          </button>
        </div>

        {error && (
          <div className="alert alert-danger emr-alert emr-alert-error">
            <AlertTriangle size={18} className="emr-alert-icon" />
            <div className="emr-alert-content">
              <strong>Error</strong>
              <p className="mb-0 small mt-1">{error}</p>
            </div>
            <button
              className="btn-close"
              onClick={() => setError("")}
              type="button"
            />
          </div>
        )}

        {success && (
          <div className="alert alert-success emr-alert emr-alert-success">
            <CheckCircle size={18} className="emr-alert-icon" />
            <div className="small emr-alert-content">{success}</div>
            <button
              className="btn-close"
              onClick={() => setSuccess("")}
              type="button"
            />
          </div>
        )}

        <div className="card border-0 emr-card">
          <div className="card-body emr-card-body">
            <form onSubmit={handleSubmit} className="row g-4">
              <div className="col-12">
                <label className="form-label small fw-bold mb-2">
                  Rating <span className="text-danger">*</span>
                </label>

                <div className="emr-rating-row">
                  {[1, 2, 3, 4, 5].map((rating) => {
                    const isActive =
                      form.rating === String(rating) || form.rating === rating;

                    return (
                      <button
                        key={rating}
                        type="button"
                        className={`btn emr-rating-btn ${
                          isActive ? "btn-primary" : "btn-outline-secondary"
                        }`}
                        onClick={() => setForm({ ...form, rating })}
                      >
                        <div className="emr-rating-content">
                          <div className="fw-bold">{rating}</div>
                          <div>{RATING_LABELS[rating]}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="col-12">
                <label className="form-label small fw-bold">
                  Review Comment <span className="text-danger">*</span>
                </label>

                <textarea
                  className="form-control emr-textarea"
                  rows={5}
                  value={form.reviewComment}
                  onChange={(e) =>
                    setForm({ ...form, reviewComment: e.target.value })
                  }
                  placeholder="Provide detailed feedback on the employee's performance..."
                  required
                />

                <small className="text-muted">
                  {form.reviewComment.length} / 2000 characters
                </small>
              </div>

              <div className="col-12">
                <label className="form-label small fw-bold">
                  Project Context <span className="text-muted">(Optional)</span>
                </label>

                <textarea
                  className="form-control emr-textarea"
                  rows={3}
                  value={form.projectContext}
                  onChange={(e) =>
                    setForm({ ...form, projectContext: e.target.value })
                  }
                  placeholder="Mention any relevant projects this review is about..."
                />
              </div>

              <div className="col-12">
                <label className="form-label small fw-bold">
                  Goal Context <span className="text-muted">(Optional)</span>
                </label>

                <textarea
                  className="form-control emr-textarea"
                  rows={3}
                  value={form.goalContext}
                  onChange={(e) =>
                    setForm({ ...form, goalContext: e.target.value })
                  }
                  placeholder="Mention any relevant goals or objectives this review is about..."
                />
              </div>

              <div className="col-12 emr-actions">
                <button
                  type="submit"
                  className="btn btn-primary emr-save-btn"
                  disabled={loading}
                >
                  <Save size={16} className="me-2" />
                  {loading ? "Saving..." : "Save Changes"}
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary emr-cancel-btn"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="card border-0 emr-tips-card">
          <div className="card-body">
            <div className="emr-tips-header">
              <Edit size={16} className="emr-tips-icon" />
              <h6 className="fw-bold mb-0">Editing Tips</h6>
            </div>

            <ul className="small mb-0 ps-3 emr-tips-list">
              <li>You can edit the rating, comment, and context information</li>
              <li>Required fields are marked with a red asterisk (*)</li>
              <li>Changes are saved when you click Save Changes</li>
              <li>
                After saving, you'll be redirected to the review details page
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
