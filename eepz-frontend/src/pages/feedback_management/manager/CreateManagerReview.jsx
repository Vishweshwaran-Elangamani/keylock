// src/.../CreateManagerReview.jsx
import React, { useMemo, useState, useEffect } from "react";
import {
  CheckCircle,
  Send,
  AlertTriangle,
  ArrowLeft,
  FileText,
  Home,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  managerReviewApi,
  employeeApi,
} from "../../../services/feedbackmanagement/feedbackApi";
import "../../../styles/feedback/components/CreateManagerReview.css";

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

  const user = useMemo(() => {
    const stored = localStorage.getItem("user");
    return stored
      ? JSON.parse(stored)
      : {
          empId: 1002,
          firstName: "Manager",
          lastName: "User",
        };
  }, []);

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
  const [openEmployeeDropdown, setOpenEmployeeDropdown] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoadingEmployees(true);
      try {
        const res = await employeeApi.getSubordinates();
        const items = Array.isArray(res)
          ? res
          : res?.data?.items || res?.data || [];
        const normalized = items.map((item) => ({
          employeeId: item.employeeId,
          firstName: item.firstName || item.employeeName || "",
          lastName: item.lastName || "",
          email: item.email || "",
          roleName: item.roleName || "",
          departmentName: item.departmentName || "",
        }));
        setEmployees(normalized);

        const initialId =
          form.targetEmployeeId ||
          prefilledEmployee?.empId ||
          normalized[0]?.employeeId ||
          "";
        setForm((prev) => ({ ...prev, targetEmployeeId: initialId }));
      } catch (err) {
        console.error("Error fetching subordinates:", err);
        setError("Failed to load subordinates. Please try again.");
      } finally {
        setLoadingEmployees(false);
      }
    };

    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!form.targetEmployeeId) {
      setSelectedEmployee(null);
      return;
    }
    const found = employees.find(
      (e) => String(e.employeeId) === String(form.targetEmployeeId)
    );
    setSelectedEmployee(found || null);
  }, [form.targetEmployeeId, employees]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const payload = {
      managerEmployeeId: Number(user?.empId),
      targetEmployeeId: Number(form.targetEmployeeId),
      rating: Number(form.rating),
      reviewComment: form.reviewComment,
      projectContext: form.projectContext || null,
      goalContext: form.goalContext || null,
      status: "Submitted",
      submittedDate: new Date().toISOString(),
    };

    try {
      await managerReviewApi.create(payload);
      setSuccess("Review created successfully.");
    } catch (err) {
      console.error(err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create review. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const selectedEmployeeLabel = (() => {
    if (loadingEmployees) return "Loading employees...";
    if (!form.targetEmployeeId) return "-- Choose an employee --";
    const emp = employees.find(
      (e) => String(e.employeeId) === String(form.targetEmployeeId)
    );
    if (!emp) return "-- Choose an employee --";
    return `${emp.firstName} ${emp.lastName}${
      emp.email ? ` (${emp.email})` : ""
    }`;
  })();

  return (
    <div className="cmr-page">
      <div className="cmr-container">
        <div className="cmr-header">
          <nav aria-label="breadcrumb" className="cmr-breadcrumb-nav">
            <ol className="cmr-breadcrumb-list">
              <li className="cmr-breadcrumb-item">
                <button
                  className="cmr-breadcrumb-link"
                  onClick={() => navigate("/manager/dashboard/")}
                >
                  <Home size={16} className="cmr-breadcrumb-icon" />
                  Dashboard
                </button>
              </li>
              <li className="cmr-breadcrumb-separator">/</li>
              <li className="cmr-breadcrumb-item">
                <button
                  className="cmr-breadcrumb-link"
                  onClick={() => navigate("/manager/dashboard/feedback")}
                >
                  Feedback Management
                </button>
              </li>
              <li className="cmr-breadcrumb-separator">/</li>
              <li className="cmr-breadcrumb-item cmr-breadcrumb-current">
                Create Review
              </li>
            </ol>
          </nav>
        </div>

        {error && (
          <div className="cmr-alert cmr-alert-error">
            <AlertTriangle size={18} className="cmr-alert-icon" />
            <div className="cmr-alert-body">
              <strong className="cmr-alert-title">Error</strong>
              <p className="cmr-alert-text">{error}</p>
            </div>
            <button
              className="cmr-alert-close"
              onClick={() => setError("")}
            />
          </div>
        )}

        {success && (
          <div className="cmr-alert cmr-alert-success">
            <CheckCircle size={18} className="cmr-alert-icon" />
            <div className="cmr-alert-body">{success}</div>
            <button
              className="cmr-alert-close"
              onClick={() => setSuccess("")}
            />
          </div>
        )}

        <div className="cmr-card">
          <div className="cmr-card-body">
            <form onSubmit={handleSubmit} className="row g-4">
              <div className="col-12">
                <label className="cmr-label">
                  Select Employee <span className="cmr-required">*</span>
                </label>

                <div className="cmr-dropdown">
                  <button
                    type="button"
                    className={`cmr-dropdown-trigger ${
                      openEmployeeDropdown ? "cmr-dropdown-trigger-open" : ""
                    }`}
                    onClick={() =>
                      !loadingEmployees &&
                      setOpenEmployeeDropdown((prev) => !prev)
                    }
                    disabled={loadingEmployees}
                  >
                    <span className="cmr-dropdown-placeholder">
                      {selectedEmployeeLabel}
                    </span>
                    <span className="cmr-dropdown-arrow" />
                  </button>

                  {openEmployeeDropdown && (
                    <div className="cmr-dropdown-menu">
                      {employees.map(
                        ({ employeeId, firstName, lastName, email }) => {
                          const label = `${firstName} ${lastName}${
                            email ? ` (${email})` : ""
                          }`;
                          const isSelected =
                            String(employeeId) ===
                            String(form.targetEmployeeId);
                          return (
                            <div
                              key={employeeId}
                              className={`cmr-dropdown-item ${
                                isSelected ? "cmr-dropdown-item-selected" : ""
                              }`}
                              onClick={() => {
                                setForm((prev) => ({
                                  ...prev,
                                  targetEmployeeId: employeeId,
                                }));
                                setOpenEmployeeDropdown(false);
                              }}
                            >
                              {label}
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              </div>

              {selectedEmployee && (
                <div className="col-12">
                  <div className="cmr-info">
                    <strong>Reviewing:</strong> {selectedEmployee.firstName}{" "}
                    {selectedEmployee.lastName}
                  </div>
                </div>
              )}

              <div className="col-12">
                <label className="cmr-label">
                  Rating <span className="cmr-required">*</span>
                </label>
                <div className="cmr-rating-row">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      className={`cmr-rating-btn ${
                        form.rating === rating ? "cmr-rating-btn-active" : ""
                      }`}
                      onClick={() =>
                        setForm((prev) => ({ ...prev, rating }))
                      }
                    >
                      <div className="cmr-rating-content">
                        <div className="cmr-rating-number">{rating}</div>
                        <div className="cmr-rating-label">
                          {RATING_LABELS[rating]}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="col-12">
                <label className="cmr-label">
                  Review Comment <span className="cmr-required">*</span>
                </label>
                <textarea
                  className="cmr-textarea"
                  rows={4}
                  value={form.reviewComment}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      reviewComment: e.target.value,
                    }))
                  }
                  placeholder="Provide detailed feedback on the employee's performance..."
                  required
                />
                <small className="cmr-helper">
                  {form.reviewComment.length} / 2000 characters
                </small>
              </div>

              <div className="col-12">
                <label className="cmr-label">
                  Project Context{" "}
                  <span className="cmr-optional">(Optional)</span>
                </label>
                <textarea
                  className="cmr-textarea"
                  rows={2}
                  value={form.projectContext}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      projectContext: e.target.value,
                    }))
                  }
                  placeholder="Mention any relevant projects..."
                />
              </div>

              <div className="col-12">
                <label className="cmr-label">
                  Goal Context{" "}
                  <span className="cmr-optional">(Optional)</span>
                </label>
                <textarea
                  className="cmr-textarea"
                  rows={2}
                  value={form.goalContext}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      goalContext: e.target.value,
                    }))
                  }
                  placeholder="Mention any relevant goals or objectives..."
                />
              </div>

              <div className="col-12 cmr-actions-row">
                <button
                  type="submit"
                  className="cmr-btn cmr-btn-primary"
                  disabled={loading || loadingEmployees}
                >
                  <Send size={16} className="cmr-btn-icon-left" />
                  {loading ? "Submitting Review..." : "Submit Review"}
                </button>
                <button
                  type="button"
                  className="cmr-btn cmr-btn-outline"
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
