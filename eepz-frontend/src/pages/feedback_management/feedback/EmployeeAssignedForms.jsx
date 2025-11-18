import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  RefreshCw,
  AlertTriangle,
  Eye,
  FileText,
  Calendar,
  Loader,
  Lock,
} from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function EmployeeAssignedForms() {
  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "{}") || {},
    []
  );

  const [allForms, setAllForms] = useState([]);
  const [submittedFormIds, setSubmittedFormIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastFetchTime, setLastFetchTime] = useState(null);

  // Fetch ALL forms (no server-side status filter)
  const fetchForms = useCallback(
    async (retryCount = 0) => {
      if (!user?.empId) {
        setError("User not authenticated. Please log in.");
        return;
      }
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`${API_BASE}/HrFeedbackForm/forms`, {
          timeout: 10000,
          headers: { Accept: "application/json" },
        });
        if (res.status === 200 && Array.isArray(res.data?.data)) {
          // Optional: sort newest first
          const sorted = [...res.data.data].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          setAllForms(sorted);
          setLastFetchTime(new Date().toLocaleTimeString());
        } else {
          throw new Error("Invalid response format from server");
        }
      } catch (err) {
        let msg = "Failed to load forms.";
        if (err.response?.status === 404)
          msg = "Endpoint not found: /HrFeedbackForm/forms";
        else if (err.code === "ECONNABORTED")
          msg = "Request timeout. Try again.";
        else msg = err.response?.data?.message || err.message || msg;
        setError(msg);
        if (retryCount < 1 && err.response?.status >= 500) {
          setTimeout(() => fetchForms(retryCount + 1), 2000);
        }
      } finally {
        setLoading(false);
      }
    },
    [user?.empId]
  );

  // Fetch submitted forms for user (to disable action)
  const fetchSubmittedForms = useCallback(async () => {
    if (!user?.empId) return;
    try {
      const res = await axios.get(
        `${API_BASE}/HrFeedbackForm/responses/by-employee/${user.empId}`,
        {
          timeout: 8000,
        }
      );
      if (res.status === 200 && Array.isArray(res.data?.data)) {
        setSubmittedFormIds(new Set(res.data.data.map((r) => r.formId)));
      } else {
        setSubmittedFormIds(new Set());
      }
    } catch {
      // non-blocking
    }
  }, [user?.empId]);

  useEffect(() => {
    if (user?.empId) {
      fetchForms();
      fetchSubmittedForms();
      const interval = setInterval(() => {
        fetchForms();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.empId, fetchForms, fetchSubmittedForms]);

  // Stats without status
  const stats = useMemo(() => {
    const submitted = submittedFormIds.size;
    const total = allForms.length;
    const remaining = allForms.filter(
      (f) => !submittedFormIds.has(f.formId)
    ).length;
    return { total, submitted, remaining };
  }, [allForms, submittedFormIds]);

  const getFormTypeLabel = useCallback((formType) => {
    const types = {
      PerformanceReview: "Performance Review",
      GeneralFeedback: "General Feedback",
      BiasReview: "Bias Review",
      ProfessionalismReview: "Professionalism Review",
      SurveyForm: "Survey",
      EvaluationForm: "Evaluation",
    };
    return types[formType] || formType || "—";
  }, []);

  const handleRefresh = useCallback(() => {
    fetchForms();
    fetchSubmittedForms();
  }, [fetchForms, fetchSubmittedForms]);

  return (
    <div className="container-fluid py-4" style={{ maxWidth: "1200px" }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h3
            className="fw-bold mb-1"
            style={{ color: "var(--color-primary-1)" }}
          >
            All Forms
          </h3>
          <p className="mb-0 small text-muted">
            Every form is listed here regardless of its status
            {lastFetchTime && (
              <span className="ms-2">(Last updated: {lastFetchTime})</span>
            )}
          </p>
        </div>
        <button
          className="btn btn-outline-secondary"
          onClick={handleRefresh}
          disabled={loading}
          title="Refresh forms"
        >
          <RefreshCw
            size={18}
            style={{ animation: loading ? "spin 1s linear infinite" : "none" }}
          />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          className="alert alert-warning alert-dismissible fade show mb-4"
          role="alert"
        >
          <AlertTriangle
            size={16}
            className="me-2"
            style={{ display: "inline" }}
          />
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError("")}
            aria-label="Close"
          />
        </div>
      )}

      {/* Simple stats (no status-based counts) */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-4">
          <div
            className="card border-0 text-center"
            style={{ border: "1px solid var(--border)" }}
          >
            <div className="card-body">
              <h5 className="fw-bold text-primary">{stats.total}</h5>
              <small className="text-muted">Total Forms</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-4">
          <div
            className="card border-0 text-center"
            style={{ border: "1px solid var(--border)" }}
          >
            <div className="card-body">
              <h5 className="fw-bold" style={{ color: "#24A148" }}>
                {stats.submitted}
              </h5>
              <small className="text-muted">Submitted by You</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-4">
          <div
            className="card border-0 text-center"
            style={{ border: "1px solid var(--border)" }}
          >
            <div className="card-body">
              <h5 className="fw-bold" style={{ color: "#0F62FE" }}>
                {stats.remaining}
              </h5>
              <small className="text-muted">Not Yet Submitted</small>
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="text-center py-5">
          <Loader
            size={32}
            className="mb-3 text-primary"
            style={{ animation: "spin 1s linear infinite", display: "block" }}
          />
          <p className="text-muted">Loading forms...</p>
        </div>
      ) : allForms.length === 0 ? (
        <div
          className="card border-0"
          style={{ border: "1px solid var(--border)" }}
        >
          <div className="card-body text-center py-5">
            <FileText
              size={48}
              className="text-muted mb-3"
              style={{ opacity: 0.3 }}
            />
            <h5 className="text-muted">No Forms Available</h5>
            <p className="text-muted small">
              There are currently no forms to display.
            </p>
            <button
              className="btn btn-outline-primary btn-sm mt-2"
              onClick={handleRefresh}
            >
              Refresh
            </button>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {allForms.map((form) => {
            const isSubmitted = submittedFormIds.has(form.formId);
            const deadlineStr = form.deadline
              ? new Date(form.deadline).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "—";
            return (
              <div key={form.formId} className="col-md-6 col-lg-4">
                <div
                  className="card border-0 h-100"
                  style={{
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow)",
                    borderRadius: "var(--radius-lg)",
                    transition: "transform 0.2s",
                    opacity: isSubmitted ? 0.85 : 1,
                  }}
                  onMouseEnter={(e) =>
                    !isSubmitted &&
                    (e.currentTarget.style.transform = "translateY(-4px)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "translateY(0)")
                  }
                >
                  <div className="card-body d-flex flex-column">
                    {/* Title */}
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <h6
                        className="fw-bold mb-0"
                        style={{ flex: 1, marginRight: 8 }}
                      >
                        {form.formName}
                      </h6>
                    </div>

                    {/* Description */}
                    <p className="small text-muted mb-3" style={{ flex: 1 }}>
                      {form.formDescription}
                    </p>

                    {/* Form Type */}
                    <div className="mb-3">
                      <small className="text-muted d-block">Form Type</small>
                      <div className="fw-600 small">
                        {getFormTypeLabel(form.formType)}
                      </div>
                    </div>

                    {/* Deadline */}
                    <div
                      className="mb-3 p-2 rounded"
                      style={{ backgroundColor: "#f9f9fa" }}
                    >
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <Calendar size={14} className="text-muted" />
                        <small className="text-muted fw-600">Deadline</small>
                      </div>
                      <div className="fw-bold small">{deadlineStr}</div>
                    </div>

                    {/* Action */}
                    <div className="d-grid">
                      {isSubmitted ? (
                        <button
                          className="btn btn-secondary btn-sm fw-600"
                          style={{
                            borderRadius: "var(--radius-md)",
                            cursor: "not-allowed",
                          }}
                          disabled
                        >
                          <Lock
                            size={16}
                            className="me-1"
                            style={{ display: "inline" }}
                          />
                          Already Submitted
                        </button>
                      ) : (
                        <Link
                          to={`/dashboard/feedback/fillform/${form.formId}`}
                          className="btn btn-primary btn-sm fw-600"
                          style={{ borderRadius: "var(--radius-md)" }}
                        >
                          <Eye
                            size={16}
                            className="me-1"
                            style={{ display: "inline" }}
                          />
                          Fill Form
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .fw-600 { font-weight: 600; }
      `}</style>
    </div>
  );
}
