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
      status: "Submitted", // Directly set to Submitted
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

  return (
    <div className="fm-page">
      <div className="fm-container">
        
        {/* HEADER */}
        <div className="fm-header">
          {/* Breadcrumb */}
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
              <li className="breadcrumb-item active d-flex align-items-center" aria-current="page">
                <span style={{ color: "#97247E", fontSize: "0.875rem", fontWeight: 600 }}>
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
            <button className="btn-close fm-close" onClick={() => setError("")} />
          </div>
        )}

        {/* SUCCESS ALERT */}
        {success && (
          <div className="alert fm-alert fm-alert-success">
            <CheckCircle size={18} className="flex-shrink-0" />
            <div className="small flex-grow-1">{success}</div>
            <button className="btn-close fm-close" onClick={() => setSuccess("")} />
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
                <select
                  className="form-select fm-select"
                  value={form.targetEmployeeId}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      targetEmployeeId: e.target.value,
                    }))
                  }
                  required
                  disabled={loadingEmployees}
                >
                  <option value="">
                    {loadingEmployees
                      ? "Loading employees..."
                      : "-- Choose an employee --"}
                  </option>
                  {employees.map(({ employeeId, firstName, lastName, email }) => (
                    <option key={employeeId} value={employeeId}>
                      {firstName} {lastName} {email ? `(${email})` : ""}
                    </option>
                  ))}
                </select>
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

              {/* RATING BUTTONS */}
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
                      onClick={() => setForm((prev) => ({ ...prev, rating }))}
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
                  Project Context <span className="text-muted">(Optional)</span>
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
        .fm-page {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: start;
          padding: 3rem 0;
          font-family: var(--font-sans);
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

        .fm-title {
          margin: 0 0 0.25rem 0;
          font-weight: 700;
          font-size: 1.5rem;
          color: var(--color-primary-1);
        }

        .fm-subtitle {
          margin: 0;
          font-size: 0.85rem;
          color: var(--color-gray-6);
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

        .fm-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--color-primary-1);
          text-align:left;
        }

        .fm-select,
        .fm-textarea {
          border-radius: 12px;
          border: 1px solid var(--color-gray-2);
          background: var(--color-white);
          color: var(--color-gray-9);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        
.fm-select {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="%23475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>') no-repeat right 1rem center;
  background-color: #fff;
  padding-right: 2.5rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.938rem;
  cursor: pointer;
}

.fm-select:focus {
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="%2327235C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>');
}






        .fm-select:focus,
        .fm-textarea:focus {
          border-color: var(--color-primary-3);
          box-shadow: 0 0 0 4px rgba(151,36,126,0.12);
        }

        .fm-select:disabled {
          background: var(--color-gray-1);
          color: var(--color-gray-5);
          cursor: not-allowed;
        }

        .fm-info {
          border-radius: 12px;
          padding: 0.75rem 1rem;
          background: rgba(12, 80, 255, 0.06);
          border: 1px solid var(--color-accent-5);
          color: var(--color-gray-8);
          text-align: left
        }

        .fm-alert {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          border: 1px solid transparent;
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

        .fm-back-btn {
          border-radius: 12px;
          height: 36px;
          width: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
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

        .fm-btn-outline,
        .fm-btn-outline.fm-back-btn {
          border-radius: 12px;
          min-width: 120px;
          font-weight: 600;
          color: var(--color-primary-1);
          background: var(--color-white);
          border: 1px solid var(--color-primary-3);
          transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
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
        }

        .fm-rating-btn:hover {
          border: 1px solid #23257c
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
      `}</style>
    </div>
  );
}
