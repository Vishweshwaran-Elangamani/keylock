import React, { useEffect, useState, useMemo } from "react";
import {
  Save,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Edit,
  RefreshCw,
  Star,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

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

  // ============================================================================
  // FETCH REVIEW DATA
  // ============================================================================

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
      console.error("Error:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchReview();
    }
  }, [id]);

  // ============================================================================
  // HANDLE SUBMIT
  // ============================================================================

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
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
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
          maxWidth: "800px",
          paddingLeft: "1rem",
          paddingRight: "1rem",
        }}
      >
        {/* HEADER */}
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
              Edit Review
            </h2>
            <p className="mb-0 small text-muted">
              Make changes to your review. Changes will be saved when you click
              Save Changes.
            </p>
          </div>
          <button
            className="btn btn-outline-secondary"
            onClick={fetchReview}
            disabled={loadingData}
            title="Refresh"
            style={{ borderRadius: "var(--radius-md)" }}
          >
            <RefreshCw
              size={18}
              style={{
                animation: loadingData ? "spin 1s linear infinite" : "none",
              }}
            />
          </button>
        </div>

        {/* ERROR ALERT */}
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

        {/* SUCCESS ALERT */}
        {success && (
          <div
            className="alert alert-success d-flex align-items-center gap-2 mb-3"
            style={{ borderRadius: "var(--radius-md)" }}
          >
            <CheckCircle size={18} className="flex-shrink-0" />
            <div className="small flex-grow-1">{success}</div>
            <button className="btn-close" onClick={() => setSuccess("")} />
          </div>
        )}

        {/* MAIN FORM */}
        <div
          className="card border-0"
          style={{
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow)",
          }}
        >
          <div className="card-body p-4">
            <form onSubmit={handleSubmit} className="row g-4">
              {/* RATING BUTTONS */}
              <div className="col-12">
                <label className="form-label small fw-bold mb-2">
                  Rating <span className="text-danger">*</span>
                </label>
                <div className="d-flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      className={`btn flex-grow-1 ${
                        form.rating === String(rating) || form.rating === rating
                          ? "btn-primary"
                          : "btn-outline-secondary"
                      }`}
                      onClick={() => setForm({ ...form, rating })}
                      style={{
                        borderRadius: "var(--radius-md)",
                        padding: "0.5rem 0.25rem",
                      }}
                    >
                      <div style={{ fontSize: "0.75rem", lineHeight: "1" }}>
                        <div className="fw-bold">{rating}</div>
                        <div>{RATING_LABELS[rating]}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* REVIEW COMMENT */}
              <div className="col-12">
                <label className="form-label small fw-bold">
                  Review Comment <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  rows={5}
                  value={form.reviewComment}
                  onChange={(e) =>
                    setForm({ ...form, reviewComment: e.target.value })
                  }
                  placeholder="Provide detailed feedback on the employee's performance..."
                  required
                  style={{ borderRadius: "var(--radius-md)" }}
                />
                <small className="text-muted">
                  {form.reviewComment.length} / 2000 characters
                </small>
              </div>

              {/* PROJECT CONTEXT */}
              <div className="col-12">
                <label className="form-label small fw-bold">
                  Project Context <span className="text-muted">(Optional)</span>
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={form.projectContext}
                  onChange={(e) =>
                    setForm({ ...form, projectContext: e.target.value })
                  }
                  placeholder="Mention any relevant projects this review is about..."
                  style={{ borderRadius: "var(--radius-md)" }}
                />
              </div>

              {/* GOAL CONTEXT */}
              <div className="col-12">
                <label className="form-label small fw-bold">
                  Goal Context <span className="text-muted">(Optional)</span>
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={form.goalContext}
                  onChange={(e) =>
                    setForm({ ...form, goalContext: e.target.value })
                  }
                  placeholder="Mention any relevant goals or objectives this review is about..."
                  style={{ borderRadius: "var(--radius-md)" }}
                />
              </div>

              {/* ACTION BUTTONS */}
              <div className="col-12 d-flex gap-2">
                <button
                  type="submit"
                  className="btn btn-primary flex-grow-1"
                  disabled={loading}
                  style={{ borderRadius: "var(--radius-md)" }}
                >
                  <Save
                    size={16}
                    className="me-2"
                    style={{ display: "inline" }}
                  />
                  {loading ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                  style={{ borderRadius: "var(--radius-md)" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* HELPFUL INFO */}
        <div
          className="card border-0 mt-4"
          style={{
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            backgroundColor: "#f9f9f9",
          }}
        >
          <div className="card-body">
            <div className="d-flex gap-2 mb-2">
              <Edit size={16} style={{ color: "var(--color-primary-1)" }} />
              <h6 className="fw-bold mb-0">Editing Tips</h6>
            </div>
            <ul className="small mb-0 ps-3">
              <li>You can edit the rating, comment, and context information</li>
              <li>Required fields are marked with a red asterisk (*)</li>
              <li>Changes are saved when you click Save Changes</li>
              <li>
                After saving, you'll be redirected to the review details page
              </li>
            </ul>
          </div>
        </div>

        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}
