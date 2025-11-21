// src/pages/feedback_management/forms/CreateFeedbackForm.jsx

import React, { useMemo, useState } from "react";
import {
  CheckCircle,
  Send,
  AlertTriangle,
  ArrowLeft,
  Loader,
  Calendar,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import hrFormApi from "../../../services/feedbackmanagement/hrFormApi";
import FeedbackBreadcrumb from "../../../components/feedback_management/common/FeedbackBreadcrumb";

export default function CreateFeedbackForm() {
  const navigate = useNavigate();
  const user = useMemo(
    () =>
      JSON.parse(localStorage.getItem("user") || "{}") || {
        empId: 1001,
        firstName: "Alice",
        lastName: "HR",
      },
    []
  );

  // State
  const [form, setForm] = useState({
    formName: "",
    formDescription: "",
    formType: "PerformanceReview",
    deadline: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form types
  const FORM_TYPES = [
    { value: "PerformanceReview", label: "Performance Review" },
    { value: "GeneralFeedback", label: "General Feedback" },
    { value: "BiasReview", label: "Bias Review" },
    { value: "ProfessionalismReview", label: "Professionalism Review" },
    { value: "SurveyForm", label: "Survey" },
    { value: "EvaluationForm", label: "Evaluation" },
  ];

  // Handle form submission using service
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!form.formName?.trim()) {
      setError("Form name is required");
      return;
    }
    if (!form.formDescription?.trim()) {
      setError("Form description is required");
      return;
    }
    if (!form.formType) {
      setError("Form type is required");
      return;
    }
    if (!form.deadline) {
      setError("Deadline is required");
      return;
    }

    setLoading(true);

    try {
      const createPayload = {
        formName: form.formName.trim(),
        formDescription: form.formDescription.trim(),
        formType: form.formType,
        createdByHRId: Number(user?.empId),
        deadline: new Date(form.deadline).toISOString(),
      };

      console.log("Creating form:", createPayload);

      const response = await hrFormApi.createForm(createPayload);

      console.log("Form created:", response);

      if (response?.success || response?.data?.success) {
        setSuccess(
          `Form created successfully!\n\n` +
            `Form: ${form.formName}\n` +
            `Type: ${
              FORM_TYPES.find((t) => t.value === form.formType)?.label
            }\n` +
            `Visible to: All Employees`
        );

        // Reset form and navigate
        setTimeout(() => {
          setForm({
            formName: "",
            formDescription: "",
            formType: "PerformanceReview",
            deadline: "",
          });
          navigate("/hr/dashboard/feedback");
        }, 2500);
      } else {
        setError(response?.message || "Failed to create form");
      }
    } catch (err) {
      console.error("Error:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create form. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid py-4" style={{ maxWidth: "900px" }}>
      {/* ========== BREADCRUMB ========== */}
      <FeedbackBreadcrumb
        items={[
          { label: "Feedback Management", path: "/hr/dashboard/feedback" },
          { label: "Create Feedback Form" }
        ]}
      />

      {/* HEADER */}
      <div className="d-flex align-items-center mb-4">
        <button
          className="btn btn-outline-secondary me-2"
          onClick={() => navigate(-1)}
          type="button"
          disabled={loading}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2
            className="fw-bold mb-1"
            style={{ color: "var(--color-primary-1)" }}
          >
            Create Feedback Form
          </h2>
          <p className="small text-muted mb-0">
            Forms are automatically visible to all employees
          </p>
        </div>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div
          className="alert alert-danger alert-dismissible fade show"
          role="alert"
        >
          <AlertTriangle
            size={18}
            className="me-2"
            style={{ display: "inline" }}
          />
          <strong>Error:</strong> {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError("")}
            aria-label="Close"
          />
        </div>
      )}

      {/* SUCCESS ALERT */}
      {success && (
        <div
          className="alert alert-success alert-dismissible fade show"
          role="alert"
        >
          <CheckCircle
            size={18}
            className="me-2"
            style={{ display: "inline" }}
          />
          <strong>Success!</strong>
          <p className="mb-0 small mt-1" style={{ whiteSpace: "pre-wrap" }}>
            {success}
          </p>
        </div>
      )}

      {/* FORM CARD */}
      <div
        className="card border-0"
        style={{
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            {/* FORM NAME */}
            <div className="mb-4">
              <label htmlFor="formName" className="form-label fw-bold">
                Form Name <span className="text-danger">*</span>
              </label>
              <input
                id="formName"
                type="text"
                className="form-control form-control-lg"
                value={form.formName}
                onChange={(e) => setForm({ ...form, formName: e.target.value })}
                placeholder="e.g., Q4 Performance Review"
                disabled={loading}
                style={{ borderRadius: "var(--radius-md)" }}
              />
              <small className="text-muted">
                Give your form a clear, descriptive name
              </small>
            </div>

            {/* FORM DESCRIPTION */}
            <div className="mb-4">
              <label htmlFor="formDescription" className="form-label fw-bold">
                Description <span className="text-danger">*</span>
              </label>
              <textarea
                id="formDescription"
                className="form-control"
                rows={4}
                value={form.formDescription}
                onChange={(e) =>
                  setForm({ ...form, formDescription: e.target.value })
                }
                placeholder="Describe the purpose and goals of this form..."
                disabled={loading}
                maxLength={500}
                style={{ borderRadius: "var(--radius-md)", resize: "vertical" }}
              />
              <small className="text-muted">
                Employees will see this description (
                {form.formDescription.length}/500 characters)
              </small>
            </div>

            {/* FORM TYPE */}
            <div className="mb-4">
              <label htmlFor="formType" className="form-label fw-bold">
                Form Type <span className="text-danger">*</span>
              </label>
              <select
                id="formType"
                className="form-select form-select-lg"
                value={form.formType}
                onChange={(e) => setForm({ ...form, formType: e.target.value })}
                disabled={loading}
                style={{ borderRadius: "var(--radius-md)" }}
              >
                <option value="">-- Select Form Type --</option>
                {FORM_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <small className="text-muted">
                Choose what type of feedback this form collects
              </small>
            </div>

            {/* DEADLINE */}
            <div className="mb-4">
              <label htmlFor="deadline" className="form-label fw-bold">
                Response Deadline <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <span
                  className="input-group-text"
                  style={{
                    backgroundColor: "#f9f9f9",
                    borderRadius: "var(--radius-md) 0 0 var(--radius-md)",
                  }}
                >
                  <Calendar size={16} />
                </span>
                <input
                  id="deadline"
                  type="datetime-local"
                  className="form-control form-control-lg"
                  value={form.deadline}
                  onChange={(e) =>
                    setForm({ ...form, deadline: e.target.value })
                  }
                  disabled={loading}
                  min={new Date().toISOString().slice(0, 16)}
                  style={{
                    borderRadius: "0 var(--radius-md) var(--radius-md) 0",
                  }}
                />
              </div>
              <small className="text-muted">
                When employees need to complete this form by
              </small>
            </div>

           

            {/* SUBMIT BUTTON */}
            <div className="d-grid gap-2">
              <button
                type="submit"
                className="btn btn-primary btn-lg fw-bold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader
                      size={18}
                      className="me-2"
                      style={{
                        display: "inline",
                        animation: "spin 1s linear infinite",
                      }}
                    />
                    Creating Form...
                  </>
                ) : (
                  <>
                    <Send
                      size={18}
                      className="me-1"
                      style={{ display: "inline" }}
                    />
                    Create Form
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
