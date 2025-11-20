// src/pages/feedback_management/feedback/SubmitMentorFeedback.jsx

import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  CheckCircle,
  Send,
  AlertTriangle,
  Loader,
  Star,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  mentorFeedbackApi,
  employeeApi,
  smeApi,
} from "../../../services/feedbackmanagement/feedbackApi";
import FeedbackBreadcrumb from "../../../components/feedback_management/common/FeedbackBreadcrumb";

// Helper function to get role-based feedback dashboard path
const getFeedbackDashboardPath = (roleName) => {
  const routes = {
    Employee: "/employee/dashboard/feedback",
    Manager: "/manager/dashboard/feedback",
    DepartmentHead: "/depthead/dashboard/feedback",
    "Department Head": "/depthead/dashboard/feedback",
    HR: "/hr/dashboard/feedback",
  };
  return routes[roleName] || "/hr/dashboard/feedback";
};

export default function SubmitMentorFeedback() {
  const navigate = useNavigate();
  const user = useMemo(
    () =>
      JSON.parse(localStorage.getItem("user") || "{}") || {
        empId: 1004,
        firstName: "Dave",
        lastName: "Dev",
      },
    []
  );

  const [form, setForm] = useState({
    smeId: "",
    rating: 5,
    feedbackComments: "",
    isAnonymous: false,
  });

  const [smeList, setSmeList] = useState([]);
  const [smeDetails, setSmeDetails] = useState(null);
  const [employeeMap, setEmployeeMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingSme, setLoadingSme] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch employee map using service
  const fetchEmployeeMap = useCallback(async (signal) => {
    setLoadingEmployees(true);
    try {
      const response = await employeeApi.getAll();

      if (response?.data) {
        const employees = Array.isArray(response.data)
          ? response.data
          : response.data.data || [];

        const map = {};
        employees.forEach((emp) => {
          map[emp.employeeId] = `${emp.firstName} ${emp.lastName}`;
        });
        setEmployeeMap(map);
      }
    } catch (err) {
      if (err.name === "CanceledError" || err.name === "AbortError") return;
      console.error("Error fetching employees:", err.message);
    } finally {
      setLoadingEmployees(false);
    }
  }, []);

  // Fetch SME list using service
  const fetchSmeList = useCallback(
    async (signal) => {
      if (Object.keys(employeeMap).length === 0 && !loadingEmployees) return;

      setLoadingSme(true);

      try {
        const response = await smeApi.getActive();

        if (response?.data) {
          const activeSmes = Array.isArray(response.data)
            ? response.data
            : response.data.data || [];

          const formattedSmes = activeSmes.map((sme) => ({
            smeId: sme.smeId,
            employeeId: sme.employeeId,
            skillName: sme.skillName || "Unknown Skill",
            skillIdReference: sme.skillIdReference || sme.skillId,
            employeeName:
              employeeMap[sme.employeeId] || `Employee ${sme.employeeId}`,
            skillCategoryName: sme.skillCategoryName,
            proficiencyLevel: sme.proficiencyLevel,
            status: sme.status,
          }));

          setSmeList(formattedSmes);
          setError("");
        } else {
          setSmeList([]);
          setError("No active mentors found at this time.");
        }
      } catch (err) {
        if (err.name === "CanceledError" || err.name === "AbortError") return;
        setError(err?.message || "Failed to load mentor list.");
        setSmeList([]);
      } finally {
        setLoadingSme(false);
      }
    },
    [employeeMap, loadingEmployees]
  );

  // Fetch employees on mount
  useEffect(() => {
    const abortController = new AbortController();
    fetchEmployeeMap(abortController.signal);
    return () => abortController.abort();
  }, [fetchEmployeeMap]);

  // Fetch SMEs after employees are loaded
  useEffect(() => {
    if (Object.keys(employeeMap).length === 0) return;
    const abortController = new AbortController();
    fetchSmeList(abortController.signal);
    return () => abortController.abort();
  }, [employeeMap, fetchSmeList]);

  // Handle SME selection
  const handleSmeChange = useCallback(
    (smeId) => {
      setForm((prev) => ({ ...prev, smeId }));
      setError("");

      if (!smeId) {
        setSmeDetails(null);
        return;
      }

      const sme = smeList.find((s) => s.smeId === Number(smeId));
      if (sme) {
        setSmeDetails(sme);
      } else {
        setSmeDetails(null);
        setError("Invalid SME selection.");
      }
    },
    [smeList]
  );

  // Handle form submission using service
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");
      setSuccess("");

      if (!smeDetails) {
        setError("Please select a valid SME");
        return;
      }
      if (!form.feedbackComments.trim()) {
        setError("Please enter your feedback");
        return;
      }
      if (form.feedbackComments.length > 5000) {
        setError("Feedback exceeds 5000 characters");
        return;
      }

      const payload = {
        smeId: smeDetails.smeId,
        mentorEmployeeId: smeDetails.employeeId,
        menteeEmployeeId: Number(user?.empId),
        skillIdReference: smeDetails.skillIdReference,
        rating: Number(form.rating),
        feedbackComments: form.feedbackComments,
        submittedByEmployeeId: Number(user?.empId),
        feedbackFrom: "Mentee",
        isAnonymous: !!form.isAnonymous,
      };

      setLoading(true);
      try {
        const response = await mentorFeedbackApi.create(payload);

        if (response?.success || response?.data?.success) {
          const trackingId =
            response.data?.mentorFeedbackId ||
            response.data?.data?.mentorFeedbackId ||
            "Generated";
          setSuccess(`Feedback submitted successfully! ID: ${trackingId}`);
          setForm({
            smeId: "",
            rating: 5,
            feedbackComments: "",
            isAnonymous: false,
          });
          setSmeDetails(null);
          setTimeout(() => setSuccess(""), 5000);
        } else {
          setError(response?.message || "Submission failed");
        }
      } catch (err) {
        setError(err?.message || "Failed to submit feedback");
      } finally {
        setLoading(false);
      }
    },
    [smeDetails, form, user?.empId]
  );

  // Handle star rating click
  const handleStarClick = useCallback((rating) => {
    setForm((prev) => ({ ...prev, rating }));
  }, []);

  // Render star rating component
  const renderStars = () => {
    return [...Array(5)].map((_, index) => {
      const rating = index + 1;
      return (
        <button
          key={index}
          type="button"
          className={`border-0 bg-transparent p-0 me-1 ${
            rating <= form.rating ? "text-warning" : "text-muted"
          }`}
          onClick={() => handleStarClick(rating)}
          aria-label={`Rate ${rating} star${rating > 1 ? "s" : ""}`}
          style={{ cursor: "pointer", transition: "all 0.2s" }}
        >
          <Star
            size={22}
            fill={rating <= form.rating ? "currentColor" : "none"}
            strokeWidth={rating <= form.rating ? 0 : 2}
          />
        </button>
      );
    });
  };

  const isFormValid =
    smeDetails &&
    form.feedbackComments.trim() &&
    form.feedbackComments.length <= 5000;
  const isLoading = loadingSme || loadingEmployees;

  // Get role-based dashboard path
  const feedbackDashboardPath = user?.roleName 
    ? getFeedbackDashboardPath(user.roleName) 
    : "/hr/dashboard/feedback";

  return (
    <div
      style={{
        padding: "1.25rem 1.75rem",
        maxWidth: "100%",
        minHeight: "100vh",
        backgroundColor: "#f8f9fa",
      }}
    >
      {/* ========== BREADCRUMB ========== */}
      <FeedbackBreadcrumb
        items={[
          { label: "Feedback Management", path: feedbackDashboardPath },
          { label: "Submit Mentor Feedback" }
        ]}
      />

      {/* BACK BUTTON & HEADER */}
      <div className="d-flex align-items-center gap-3 mb-3">
        <button
          className="btn d-flex align-items-center justify-content-center"
          onClick={() => navigate(-1)}
          style={{
            width: "40px",
            height: "40px",
            padding: 0,
            backgroundColor: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f8fafc";
            e.currentTarget.style.borderColor = "#cbd5e1";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#fff";
            e.currentTarget.style.borderColor = "#e2e8f0";
          }}
        >
          <ArrowLeft size={18} style={{ color: "#64748b" }} />
        </button>
        <div>
          <h2
            className="fw-bold mb-0"
            style={{
              color: "#27235c",
              fontSize: "1.5rem",
              letterSpacing: "-0.025em",
            }}
          >
            Submit SME Feedback
          </h2>
          <p
            className="mb-0"
            style={{ color: "#64748b", fontSize: "0.875rem" }}
          >
            Rate your SME's guidance and expertise
          </p>
        </div>
      </div>

      {/* ALERTS */}
      {error && (
        <div
          className="alert alert-danger d-flex align-items-start gap-2 mb-3"
          style={{
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#fee2e2",
            padding: "0.75rem 1rem",
          }}
        >
          <AlertTriangle
            size={16}
            className="flex-shrink-0"
            style={{ marginTop: "2px", color: "#dc2626" }}
          />
          <div className="flex-grow-1">
            <p
              className="mb-0"
              style={{ fontSize: "0.875rem", color: "#991b1b" }}
            >
              {error}
            </p>
          </div>
          <button
            type="button"
            className="btn-close"
            style={{ fontSize: "0.75rem" }}
            onClick={() => setError("")}
          />
        </div>
      )}

      {success && (
        <div
          className="alert alert-success d-flex align-items-center gap-2 mb-3"
          style={{
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#dcfce7",
            padding: "0.75rem 1rem",
          }}
        >
          <CheckCircle
            size={16}
            className="flex-shrink-0"
            style={{ color: "#16a34a" }}
          />
          <p
            className="mb-0 flex-grow-1"
            style={{ fontSize: "0.875rem", color: "#166534" }}
          >
            {success}
          </p>
          <button
            type="button"
            className="btn-close"
            style={{ fontSize: "0.75rem" }}
            onClick={() => setSuccess("")}
          />
        </div>
      )}

      {/* MAIN CARD */}
      <div
        className="card border-0 shadow-sm"
        style={{ borderRadius: "10px", maxWidth: "900px" }}
      >
        <div className="card-body" style={{ padding: "1.5rem" }}>
          <form onSubmit={handleSubmit} noValidate>
            {/* SELECT SME */}
            <div className="mb-4">
              <label
                htmlFor="smeSelect"
                className="form-label fw-semibold mb-2 d-flex align-items-center"
                style={{ fontSize: "0.875rem", color: "#0f172a" }}
              >
                <span>
                  Select Your Mentor/SME <span className="text-danger">*</span>
                </span>
                {isLoading && (
                  <Loader
                    size={14}
                    className="ms-2 animate-spin"
                    style={{ color: "#64748b" }}
                  />
                )}
              </label>
              <select
                id="smeSelect"
                className="form-select"
                value={form.smeId}
                onChange={(e) => handleSmeChange(e.target.value)}
                disabled={isLoading || loading}
                style={{
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  fontSize: "0.875rem",
                  padding: "0.625rem 0.875rem",
                  backgroundColor: "#fff",
                }}
              >
                <option value="">
                  {loadingEmployees
                    ? "Loading employee data..."
                    : loadingSme
                    ? "Loading mentors..."
                    : smeList.length === 0
                    ? "No mentors available"
                    : "Choose a mentor to provide feedback for"}
                </option>
                {smeList.map((sme) => (
                  <option key={`sme-${sme.smeId}`} value={sme.smeId}>
                    {sme.employeeName} - {sme.skillName}
                    {sme.proficiencyLevel && ` (${sme.proficiencyLevel})`}
                  </option>
                ))}
              </select>
              <div
                className="form-text"
                style={{ fontSize: "0.75rem", marginTop: "0.5rem" }}
              >
                Select the SME whose guidance you'd like to rate
              </div>
            </div>

            {/* CONDITIONAL FIELDS */}
            {smeDetails && (
              <div>
                {/* SME DETAILS */}
                <div
                  className="mb-4 p-3"
                  style={{
                    backgroundColor: "#f8fafc",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <h6
                    className="fw-bold mb-3"
                    style={{ fontSize: "0.875rem", color: "#0f172a" }}
                  >
                    Selected SME Details
                  </h6>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "#64748b",
                          marginBottom: "0.25rem",
                        }}
                      >
                        Expertise Area
                      </div>
                      <div
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          color: "#0f172a",
                        }}
                      >
                        {smeDetails.skillName}
                      </div>
                      {smeDetails.skillCategoryName && (
                        <small
                          style={{ fontSize: "0.75rem", color: "#64748b" }}
                        >
                          Category: {smeDetails.skillCategoryName}
                        </small>
                      )}
                    </div>
                    <div className="col-md-6">
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "#64748b",
                          marginBottom: "0.25rem",
                        }}
                      >
                        SME
                      </div>
                      <div
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          color: "#0f172a",
                        }}
                      >
                        {smeDetails.employeeName}
                      </div>
                      {smeDetails.proficiencyLevel && (
                        <small
                          style={{ fontSize: "0.75rem", color: "#64748b" }}
                        >
                          Level: {smeDetails.proficiencyLevel}
                        </small>
                      )}
                    </div>
                  </div>
                </div>

                {/* RATING */}
                <div className="mb-4">
                  <label
                    className="form-label fw-semibold mb-2"
                    style={{ fontSize: "0.875rem", color: "#0f172a" }}
                  >
                    Rating <span className="text-danger">*</span>
                  </label>
                  <div
                    className="d-flex align-items-center gap-3 p-3"
                    style={{
                      backgroundColor: "#f8fafc",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div className="d-flex">{renderStars()}</div>
                    <span
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "#0f62fe",
                      }}
                    >
                      {form.rating}/5 Stars
                    </span>
                  </div>
                  <div
                    className="form-text"
                    style={{ fontSize: "0.75rem", marginTop: "0.5rem" }}
                  >
                    1 = Needs Improvement | 5 = Outstanding
                  </div>
                </div>

                {/* FEEDBACK COMMENTS */}
                <div className="mb-4">
                  <label
                    htmlFor="feedbackComments"
                    className="form-label fw-semibold mb-2"
                    style={{ fontSize: "0.875rem", color: "#0f172a" }}
                  >
                    Detailed Feedback <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="feedbackComments"
                    className="form-control"
                    rows={5}
                    value={form.feedbackComments}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        feedbackComments: e.target.value,
                      }))
                    }
                    placeholder="Describe your experience with this mentor's teaching style, knowledge sharing, and overall impact..."
                    maxLength={5000}
                    style={{
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "0.875rem",
                      resize: "vertical",
                      minHeight: "120px",
                    }}
                  />
                  <div
                    className="d-flex justify-content-between align-items-center"
                    style={{ marginTop: "0.5rem" }}
                  >
                    <span className="form-text" style={{ fontSize: "0.75rem" }}>
                      Be specific and constructive
                    </span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color:
                          form.feedbackComments.length > 4500
                            ? "#dc2626"
                            : "#64748b",
                      }}
                    >
                      {form.feedbackComments.length}/5000
                    </span>
                  </div>
                </div>

                {/* ANONYMOUS CHECKBOX */}
                <div className="mb-4">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="anonCheck"
                      checked={form.isAnonymous}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          isAnonymous: e.target.checked,
                        }))
                      }
                      disabled={loading}
                      style={{ borderRadius: "4px" }}
                    />
                    <label
                      className="form-check-label"
                      htmlFor="anonCheck"
                      style={{ fontSize: "0.875rem" }}
                    >
                      Submit anonymously
                      <div
                        className="form-text"
                        style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}
                      >
                        Your identity will be hidden from the mentor
                      </div>
                    </label>
                  </div>
                </div>

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
                  disabled={loading || !isFormValid}
                  style={{
                    borderRadius: "8px",
                    padding: "0.75rem",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    backgroundColor: "#0f62fe",
                    border: "none",
                  }}
                >
                  {loading ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Submit Feedback
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .form-control:focus, .form-select:focus {
          border-color: #0f62fe;
          box-shadow: 0 0 0 3px rgba(15, 98, 254, 0.1);
        }
      `}</style>
    </div>
  );
}
