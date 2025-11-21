import React, { useMemo, useState, useEffect } from "react";
import {
  CheckCircle,
  Send,
  AlertTriangle,
  ArrowLeft,
  FileText,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { managerReviewApi, employeeApi} from "../../../services/feedbackmanagement/feedbackApi";
import axios from "axios";


const RATING_LABELS = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

export default function CreateManagerReview() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefilledEmployee = location.state?.employee;

  const user = useMemo(
    () =>
      JSON.parse(localStorage.getItem("user") || "{}") || {
        empId: 1002,
        firstName: "Manager",
        lastName: "User",
      },
    []
  );

  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [form, setForm] = useState({
    targetEmployeeId: prefilledEmployee?.empId || "",
    rating: 3,
    reviewComment: "",
    projectContext: "",
    goalContext: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ============================================================================
  // FETCH EMPLOYEES
  // ============================================================================

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await employeeApi.getAll();
        if (res.data?.success && Array.isArray(res.data.data)) {
          setEmployees(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching employees:", err.message);
      } finally {
        setLoadingEmployees(false);
      }
    };

    fetchEmployees();
  }, []);

  // ============================================================================
  // UPDATE SELECTED EMPLOYEE
  // ============================================================================

  useEffect(() => {
    if (form.targetEmployeeId) {
      const emp = employees.find(
        (e) => e.employeeId === Number(form.targetEmployeeId)
      );
      setSelectedEmployee(emp);
    }
  }, [form.targetEmployeeId, employees]);

  // ============================================================================
  // HANDLE SUBMIT
  // ============================================================================

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.targetEmployeeId || !form.reviewComment?.trim()) {
      setError("Please select target employee and enter review comment");
      return;
    }

    // Create payload with 'Submitted' status directly
    const payload = {
      managerEmployeeId: Number(user?.empId),
      targetEmployeeId: Number(form.targetEmployeeId),
      rating: Number(form.rating),
      reviewComment: form.reviewComment,
      projectContext: form.projectContext || null,
      goalContext: form.goalContext || null,
      status: "Submitted", // Directly set to Submitted
      submittedDate: new Date().toISOString(),
    };

    console.log("Creating review:", payload);

    setLoading(true);
    try {
      const response = await managerReviewApi.create(payload);

      if (response.data?.success === true) {
        setSuccess("Review created successfully!");
        setTimeout(() => navigate("/manager/dashboard/feedback"), 1500);
      } else {
        setError(response.data?.message || "Failed to create review");
      }
    } catch (err) {
      console.error(" Error creating review:", err);
      setError(
        err?.response?.data?.message || err.message || "Failed to create review"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex justify-content-center py-4"
      style={{ minHeight: "100vh", background: "#f9f9f9" }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "700px",
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
              Create Review
            </h2>
            <p className="mb-0 small text-muted">
              Manager: {user?.firstName} {user?.lastName}
            </p>
          </div>
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

        {/* FORM CARD */}
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
              {/* SELECT EMPLOYEE */}
              <div className="col-12">
                <label className="form-label small fw-bold">
                  Select Employee <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  value={form.targetEmployeeId}
                  onChange={(e) =>
                    setForm({ ...form, targetEmployeeId: e.target.value })
                  }
                  required
                  style={{ borderRadius: "var(--radius-md)" }}
                  disabled={loadingEmployees}
                >
                  <option value="">-- Choose an employee --</option>
                  {employees.map((emp) => (
                    <option key={emp.employeeId} value={emp.employeeId}>
                      {emp.firstName} {emp.lastName} ({emp.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* SELECTED EMPLOYEE INFO */}
              {selectedEmployee && (
                <div className="col-12">
                  <div
                    className="alert alert-info small mb-0"
                    style={{ borderRadius: "var(--radius-md)" }}
                  >
                    <strong>Reviewing:</strong> {selectedEmployee.firstName}{" "}
                    {selectedEmployee.lastName}
                    <br />
                    <small className="text-muted">
                      {selectedEmployee.email} • {selectedEmployee.roleName}
                    </small>
                  </div>
                </div>
              )}

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
                        form.rating === rating
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
                  rows={4}
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
                  rows={2}
                  value={form.projectContext}
                  onChange={(e) =>
                    setForm({ ...form, projectContext: e.target.value })
                  }
                  placeholder="Mention any relevant projects..."
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
                  rows={2}
                  value={form.goalContext}
                  onChange={(e) =>
                    setForm({ ...form, goalContext: e.target.value })
                  }
                  placeholder="Mention any relevant goals or objectives..."
                  style={{ borderRadius: "var(--radius-md)" }}
                />
              </div>

              {/* ACTION BUTTONS */}
              <div className="col-12 d-flex gap-2">
                <button
                  type="submit"
                  className="btn btn-primary flex-grow-1"
                  disabled={loading || loadingEmployees}
                  style={{ borderRadius: "var(--radius-md)" }}
                >
                  <Send
                    size={16}
                    className="me-2"
                    style={{ display: "inline" }}
                  />
                  {loading ? "Creating Review..." : "Create Review"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => navigate(-1)}
                  style={{ borderRadius: "var(--radius-md)" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
