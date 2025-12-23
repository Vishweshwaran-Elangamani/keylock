import React, { useMemo, useState, useEffect } from "react";
import {
  CheckCircle,
  Send,
  AlertTriangle,
  ArrowLeft,
  FileText,
  Home
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { managerReviewApi, employeeApi } from "../../../services/feedbackmanagement/feedbackApi";
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
          : (res?.data?.items || res?.data || []);
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
          (normalized[0]?.employeeId ?? "");
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
    <div className="fm-page">
      <div className="fm-container">
        {/* HEADER */}
        <div className="fm-header">
          <nav aria-label="breadcrumb" className="mb-4">
            <ol
              className="breadcrumb mb-0 d-flex align-items-center"
              style={{ backgroundColor: "transparent", padding: 0, margin: 0 }}
            >
              <li className="breadcrumb-item d-flex align-items-center">
                <button
                  onClick={() => navigate("/manager/dashboard/")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#97247E",
                    cursor: "pointer",
                    padding: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    textDecoration: "none",
                    transition: "color 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#7a1d65")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#97247E")}
                >
                  <Home size={16} />
                  Dashboard
                </button>
              </li>
              <li
                style={{
                  display: "flex",
                  alignItems: "center",
                  color: "#97247E",
                  margin: "0 8px",
                  fontSize: "1rem",
                }}
              >
                /
              </li>
              <li className="breadcrumb-item d-flex align-items-center">
                <button
                  onClick={() => navigate("/manager/dashboard/feedback")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#97247E",
                    cursor: "pointer",
                    padding: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    textDecoration: "none",
                    transition: "color 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#7a1d65")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#97247E")}
                >
                  Feedback Management
                </button>
              </li>
              <li
                style={{
                  display: "flex",
                  alignItems: "center",
                  color: "#97247E",
                  margin: "0 8px",
                  fontSize: "1rem",
                }}
              >
                /
              </li>
              <li
                className="breadcrumb-item active d-flex align-items-center"
                aria-current="page"
              >
                <span
                  style={{
                    color: "#97247E",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                  }}
                >
                  Create Review
                </span>
              </li>
            </ol>
          </nav>
        </div>

        {/* ERROR ALERT */}
        {error && (
          <div className="alert fm-alert fm-alert-error">
            <AlertTriangle size={18} className="flex-shrink-0" />
            <div className="flex-grow-1">
              <strong className="fm-alert-title">Error</strong>
              <p className="fm-alert-text">{error}</p>
            </div>
            <button
              className="btn-close fm-close"
              onClick={() => setError("")}
            />
          </div>
        )}

        {/* SUCCESS ALERT */}
        {success && (
          <div className="alert fm-alert fm-alert-success">
            <CheckCircle size={18} className="flex-shrink-0" />
            <div className="small flex-grow-1">{success}</div>
            <button
              className="btn-close fm-close"
              onClick={() => setSuccess("")}
            />
          </div>
        )}

        {/* FORM CARD */}
        <div className="card fm-card">
          <div className="card-body fm-card-body">
            <form onSubmit={handleSubmit} className="row g-4">
              {/* SELECT EMPLOYEE */}
              <div className="col-12">
                <label className="form-label fm-label">
                  Select Employee <span className="text-danger">*</span>
                </label>

                <div className="fm-dropdown">
                  <button
                    type="button"
                    className={`fm-dropdown-trigger ${
                      openEmployeeDropdown ? "open" : ""
                    }`}
                    onClick={() =>
                      !loadingEmployees &&
                      setOpenEmployeeDropdown((prev) => !prev)
                    }
                    disabled={loadingEmployees}
                  >
                    <span className="fm-dropdown-placeholder">
                      {selectedEmployeeLabel}
                    </span>
                    <span className="fm-dropdown-arrow">▾</span>
                  </button>

                  {openEmployeeDropdown && (
                    <div className="fm-dropdown-menu">
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
                              className={`fm-dropdown-item ${
                                isSelected ? "selected" : ""
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

              {/* SELECTED EMPLOYEE INFO */}
              {selectedEmployee && (
                <div className="col-12">
                  <div className="alert fm-info">
                    <strong>Reviewing:</strong> {selectedEmployee.firstName}{" "}
                    {selectedEmployee.lastName}
                    <br />
                  </div>
                </div>
              )}

              {/* RATING */}
              <div className="col-12">
                <label className="form-label fm-label mb-2">
                  Rating <span className="text-danger">*</span>
                </label>
                <div className="d-flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      className={`btn fm-rating-btn ${
                        form.rating === rating ? "active" : ""
                      }`}
                      onClick={() =>
                        setForm((prev) => ({ ...prev, rating }))
                      }
                    >
                      <div className="fm-rating-content">
                        <div className="fw-bold">{rating}</div>
                        <div>{RATING_LABELS[rating]}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* REVIEW COMMENT */}
              <div className="col-12">
                <label className="form-label fm-label">
                  Review Comment <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control fm-textarea"
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
                <small className="fm-helper">
                  {form.reviewComment.length} / 2000 characters
                </small>
              </div>

              {/* PROJECT CONTEXT */}
              <div className="col-12">
                <label className="form-label fm-label">
                  Project Context{" "}
                  <span className="text-muted">(Optional)</span>
                </label>
                <textarea
                  className="form-control fm-textarea"
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

              {/* GOAL CONTEXT */}
              <div className="col-12">
                <label className="form-label fm-label">
                  Goal Context <span className="text-muted">(Optional)</span>
                </label>
                <textarea
                  className="form-control fm-textarea"
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

              {/* ACTION BUTTONS */}
              <div className="col-12 d-flex justify-content-end gap-2">
                <button
                  type="submit"
                  className="btn fm-btn-primary"
                  disabled={loading || loadingEmployees}
                >
                  <Send size={16} className="me-2" />
                  {loading ? "Submitting Review..." : "Submit Review"}
                </button>
                <button
                  type="button"
                  className="btn fm-btn-outline"
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

        .fm-page {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: start;
          padding: 3rem 0;
          font-family: 'Poppins', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          color: var(--color-gray-9);
        }

        .fm-container {
          width: 100%;
          max-width: 760px;
          padding: 0 1rem;
        }

        .fm-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .fm-card {
          border: 1px solid var(--color-gray-2);
          border-radius: 16px;
          box-shadow: 0 6px 24px rgba(27,25,63,0.08);
          background: var(--color-white);
        }

        .fm-card-body {
          padding: 1.5rem;
        }

        /* ensure all labels are left aligned */
        .fm-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--color-primary-1);
          display: block;
          text-align: left;
          margin-bottom: 0.35rem;
        }

        .form-label.fm-label {
          text-align: left !important;
          width: 100%;
        }

        .fm-select,
        .fm-textarea {
          border-radius: 12px;
          border: 1px solid var(--color-gray-2);
          background: var(--color-white);
          color: var(--color-gray-9);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          font-family: 'Poppins', system-ui, sans-serif;
        }

        .fm-textarea:focus {
          border-color: var(--color-primary-3);
          box-shadow: 0 0 0 4px rgba(151,36,126,0.12);
        }

        .fm-info {
          border-radius: 12px;
          padding: 0.75rem 1rem;
          background: rgba(12, 80, 255, 0.06);
          border: 1px solid var(--color-accent-5);
          color: var(--color-gray-8);
          text-align: left;
        }

        .fm-alert {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          border: 1px solid transparent;
          font-family: 'Poppins', system-ui, sans-serif;
        }

        .fm-alert-title {
          font-weight: 700;
          font-size: 0.9rem;
        }

        .fm-alert-text {
          margin: 0.25rem 0 0 0;
          font-size: 0.85rem;
        }

        .fm-alert-error {
          background: rgba(224, 25, 80, 0.08);
          border-color: var(--color-error);
          color: var(--color-error);
        }

        .fm-alert-success {
          background: rgba(36, 161, 72, 0.08);
          border-color: var(--color-success);
          color: var(--color-success);
        }

        .fm-close {
          margin-left: auto;
          filter: grayscale(40%);
        }

        .fm-btn-primary {
          border-radius: 12px;
          min-width: 160px;
          font-weight: 600;
          color: var(--color-white);
          background: var(--gradient-primary);
          border: none;
          box-shadow: 0 6px 16px rgba(224, 25, 80, 0.18);
          transition: transform 0.05s ease, box-shadow 0.2s ease;
          font-family: 'Poppins', system-ui, sans-serif;
        }

        .fm-btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .fm-btn-primary:hover:not(:disabled) {
          box-shadow: 0 10px 24px rgba(224, 25, 80, 0.24);
        }

        .fm-btn-primary:active {
          transform: translateY(1px);
        }

        .fm-btn-outline {
          border-radius: 12px;
          min-width: 120px;
          font-weight: 600;
          color: var(--color-primary-1);
          background: var(--color-white);
          border: 1px solid var(--color-primary-3);
          transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
          font-family: 'Poppins', system-ui, sans-serif;
        }

        .fm-btn-outline:hover {
          background: var(--color-primary-4);
          color: var(--color-white);
          box-shadow: 0 6px 16px rgba(27,25,63,0.12);
        }

        .fm-rating-btn {
          border-radius: 12px;
          padding: 0.5rem 0.25rem;
          flex: 1 1 0;
          border: 1px solid var(--color-gray-2);
          background: var(--color-white);
          color: var(--color-gray-8);
          transition: all 0.2s ease;
          font-family: 'Poppins', system-ui, sans-serif;
        }

        .fm-rating-btn:hover {
          border: 1px solid #23257c;
        }

        .fm-rating-btn.active {
          color: var(--color-white);
          background: var(--color-primary-1);
        }

        .fm-rating-content {
          font-size: 0.8rem;
          line-height: 1.1;
        }

        .fm-helper {
          display: inline-block;
          margin-top: 0.25rem;
          font-size: 0.75rem;
          color: var(--color-gray-6);
        }

        /* DROPDOWN */

        .fm-dropdown {
          position: relative;
          width: 100%;
          font-size: 0.875rem;
        }

        .fm-dropdown-trigger {
          width: 100%;
          border-radius: 10px;
          padding: 0.75rem 1rem;
          border: 1.5px solid #e2e8f0;
          background-color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          color: #111827;
          font-weight: 500;
          transition: border-color 0.15s ease, box-shadow 0.15s ease,
            background-color 0.15s ease;
          font-family: 'Poppins', system-ui, sans-serif;
        }

        .fm-dropdown-trigger:hover {
          border-color: #27235c;
        }

        .fm-dropdown-trigger.open {
          border-color: #27235c;
          box-shadow: 0 0 0 3px rgba(39, 35, 92, 0.18);
        }

        .fm-dropdown-trigger:disabled {
          background-color: #f1f5f9;
          color: #9ca3af;
          cursor: not-allowed;
        }

        .fm-dropdown-placeholder {
          color: #475569;
          font-weight: 500;
          text-align: left;
          flex: 1 1 auto;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .fm-dropdown-arrow {
          font-size: 0.75rem;
          color: #6b7280;
          margin-left: 0.75rem;
        }

        .fm-dropdown-menu {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          background-color: #ffffff;
          border-radius: 12px;
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.24);
          border: 1px solid #e5e7eb;
          z-index: 40;
          max-height: 360px;
          overflow-y: auto;
        }

        .fm-dropdown-item {
          padding: 0.9rem 1rem;
          font-size: 0.9rem;
          color: #111827;
          cursor: pointer;
          display: flex;
          align-items: center;
          background-color: #ffffff;
          transition: background-color 0.12s ease, color 0.12s ease;
          border-bottom: 1px solid #f1f5f9;
          font-family: 'Poppins', system-ui, sans-serif;
        }

        .fm-dropdown-item:last-child {
          border-bottom: none;
        }

        .fm-dropdown-item:hover {
          background-color: #27235c;
          color: #ffffff;
        }

        .fm-dropdown-item.selected {
          background-color: #27235c;
          color: #ffffff;
        }

        .fm-dropdown-menu::-webkit-scrollbar {
          width: 8px;
        }

        .fm-dropdown-menu::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 999px;
        }

        .fm-dropdown-menu::-webkit-scrollbar-thumb {
          background: #27235c;
          border-radius: 999px;
        }
      `}</style>
    </div>
  );
}
