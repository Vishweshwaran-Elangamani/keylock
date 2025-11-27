import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  RefreshCw,
  AlertTriangle,
  Eye,
  FileText,
  Calendar,
  Loader,
  Lock
} from "lucide-react";
import { Link } from "react-router-dom";
import hrFormApi from "../../../services/feedbackmanagement/hrFormApi";
import Breadcrumb from "../../../components/feedback_management/common/FeedbackBreadcrumb";
import "../../../styles/feedback/EmployeeAssignedForms.css";

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

  // Fetch ALL forms using hrFormApi.getAllForms()
  const fetchForms = useCallback(
    async (retryCount = 0) => {
      if (!user?.empId) {
        setError("User not authenticated. Please log in.");
        return;
      }
      setLoading(true);
      setError("");
      try {
        const response = await hrFormApi.getAllForms(1, 1000);
        let data = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.data)
          ? response.data.data
          : [];
        const sorted = [...data].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setAllForms(sorted);
        setLastFetchTime(new Date().toLocaleTimeString());
      } catch (err) {
        let msg = "Failed to load forms.";
        if (err?.response?.status === 404) {
          msg = "Endpoint not found. Please contact support.";
        } else if (
          err?.code === "ECONNABORTED" ||
          err?.message?.includes("timeout")
        ) {
          msg = "Request timeout. Please try again.";
        } else {
          msg = err?.response?.data?.message || err?.message || msg;
        }
        setError(msg);
        if (retryCount < 1 && err?.response?.status >= 500) {
          setTimeout(() => fetchForms(retryCount + 1), 2000);
        }
      } finally {
        setLoading(false);
      }
    },
    [user?.empId]
  );

  // Fetch submitted forms by employee
  const fetchSubmittedForms = useCallback(async () => {
    if (!user?.empId) return;
    try {
      const response = await hrFormApi.getResponsesByEmployee(user.empId);
      let forms = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.data?.data)
        ? response.data.data
        : [];
      setSubmittedFormIds(new Set(forms.map((r) => r.formId)));
    } catch (error) {
      setSubmittedFormIds(new Set());
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

  // Calculate stats
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
      EvaluationForm: "Evaluation"
    };
    return types[formType] || formType || "—";
  }, []);

  const handleRefresh = useCallback(() => {
    fetchForms();
    fetchSubmittedForms();
  }, [fetchForms, fetchSubmittedForms]);

   // Get role-based dashboard path
  const feedbackDashboardPath = user?.roleName 
    ? getFeedbackDashboardPath(user.roleName) 
    : "/hr/dashboard/feedback";


  return (
    <div className="employee-forms-container">
       <Breadcrumb
          items={[
            { label: "Feedback Management", path: feedbackDashboardPath },
            { label: "Assigned Forms" },
          ]}
        />

      {/* Error Alert */}
      {error && (
        <div className="employee-forms-alert-error">
          <AlertTriangle size={18} className="employee-forms-alert-icon" />
          <div className="employee-forms-alert-content">
            <strong>Error:</strong> {error}
          </div>
          <button
            className="employee-forms-alert-close"
            onClick={() => setError("")}
            title="Close"
            type="button"
          >
            ×
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="employee-forms-stats-grid">
        <div className="employee-forms-stat-card">
          <div
            className="employee-forms-stat-icon"
            style={{ backgroundColor: "#EEF2FF" }}
          >
            <FileText size={22} color="#3B82F6" />
          </div>
          <h3 className="employee-forms-stat-value">{stats.total}</h3>
          <p className="employee-forms-stat-label">Total Forms</p>
        </div>
        <div className="employee-forms-stat-card">
          <div
            className="employee-forms-stat-icon"
            style={{ backgroundColor: "#DCFCE7" }}
          >
            <Eye size={22} color="#16A34A" />
          </div>
          <h3 className="employee-forms-stat-value">{stats.submitted}</h3>
          <p className="employee-forms-stat-label">Submitted by You</p>
        </div>
        <div className="employee-forms-stat-card">
          <div
            className="employee-forms-stat-icon"
            style={{ backgroundColor: "#E0E7FF" }}
          >
            <Calendar size={22} color="#4F46E5" />
          </div>
          <h3 className="employee-forms-stat-value">{stats.remaining}</h3>
          <p className="employee-forms-stat-label">Not Yet Submitted</p>
        </div>
      </div>

      {/* Content Area */}
      <div className="employee-forms-content">
        {loading ? (
          <div className="employee-forms-loading">
            <Loader size={48} className="employee-forms-loading-spinner" />
            <p className="employee-forms-loading-text">Loading forms...</p>
          </div>
        ) : allForms.length === 0 ? (
          <div className="employee-forms-empty">
            <FileText size={56} className="employee-forms-empty-icon" />
            <h5 className="employee-forms-empty-title">No Forms Available</h5>
            <p className="employee-forms-empty-text">
              There are currently no forms to display.
            </p>
            <button
              className="employee-forms-btn employee-forms-btn-primary"
              onClick={handleRefresh}
              type="button"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        ) : (
          <div className="employee-forms-grid">
            {allForms.map((form) => {
              const isSubmitted = submittedFormIds.has(form.formId);
              const deadlineStr = form.deadline
                ? new Date(form.deadline).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  })
                : "—";
              return (
                <div
                  key={form.formId}
                  className="employee-forms-card"
                  style={isSubmitted ? { opacity: 0.86 } : {}}
                >
                  {/* Card Header */}
                  <div className="employee-forms-card-header">
                    <div className="employee-forms-card-icon">
                      <FileText size={20} />
                    </div>
                    <div className="employee-forms-card-header-text">
                      <h6 className="employee-forms-card-title">
                        {form.formName}
                      </h6>
                      <span
                        className={`employee-forms-badge ${
                          isSubmitted
                            ? "employee-forms-badge-submitted"
                            : "employee-forms-badge-pending"
                        }`}
                      >
                        {isSubmitted ? "Submitted" : "Pending"}
                      </span>
                    </div>
                  </div>
                  {/* Card Body - Simple Rows */}
                  <div className="employee-forms-card-body">
                    <div className="employee-forms-card-row">
                      <span className="employee-forms-card-label">Description</span>
                      <span
                        className="employee-forms-card-description"
                        title={form.formDescription}
                      >
                        {form.formDescription || "No description"}
                      </span>
                    </div>
                    <div className="employee-forms-card-row">
                      <span className="employee-forms-card-label">Form Type</span>
                      <span className="employee-forms-card-value">
                        {getFormTypeLabel(form.formType)}
                      </span>
                    </div>
                    <div className="employee-forms-card-row">
                      <span className="employee-forms-card-label">Deadline</span>
                      <span className="employee-forms-card-deadline-value">
                        {deadlineStr}
                      </span>
                    </div>
                  </div>
                  {/* Card Footer */}
                  <div className="employee-forms-card-footer">
                    {isSubmitted ? (
                      <button
                        className="employee-forms-card-btn employee-forms-card-btn-disabled"
                        disabled
                        title="Already Submitted"
                        tabIndex={-1}
                        type="button"
                      >
                        <Lock size={16} />
                        Already Submitted
                      </button>
                    ) : (
                      <Link
                        to={`/dashboard/feedback/fillform/${form.formId}`}
                        className="employee-forms-card-btn employee-forms-card-btn-primary"
                      >
                        <Eye size={16} />
                        Fill Form
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
