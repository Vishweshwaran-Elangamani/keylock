// src/pages/feedback_management/hr/HRFeedbackReport.jsx

import React, { useEffect, useState } from "react";
import {
  RefreshCw,
  AlertTriangle,
  Eye,
  Trash2,
  MessageSquare,
  FileText,
  CheckCircle,
  Clock,
  User,
} from "lucide-react";
import {
  hrFormApi,
  employeeApi,
} from "../../../services/feedbackmanagement/feedbackApi";
import ResponseViewModal from "../../../components/FeedbackManagement/ResponseViewModal";

const Badge = ({ text, color = "#525252" }) => (
  <span
    className="badge"
    style={{
      backgroundColor: `${color}20`,
      color,
      padding: "6px 10px",
      fontSize: "0.75rem",
    }}
  >
    {text}
  </span>
);

export default function HRFeedbackReport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("Forms");
  const [forms, setForms] = useState([]);
  const [responses, setResponses] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [employeeMap, setEmployeeMap] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState(null);

  // Fetch employee map using service
  const fetchEmployeeMap = async () => {
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
        return map;
      }
    } catch (err) {
      console.error("Error fetching employee map:", err.message);
    }
    return {};
  };

  // Fetch all data using services
  const fetchData = async () => {
    setRefreshing(true);
    setLoading(true);
    setError("");

    try {
      // Step 1: Get employee map
      const empMap = await fetchEmployeeMap();

      // Step 2: Fetch all active forms
      const formsRes = await hrFormApi.getActiveForms();

      let formsData = [];
      const forms = formsRes?.data || [];
      
      if (Array.isArray(forms)) {
        formsData = forms;
        setForms(formsData);
      }

      // Step 3: Fetch responses for all forms
      let allResponses = [];

      for (const form of formsData) {
        try {
          const respRes = await hrFormApi.getResponsesByFormId(form.formId);

          const responseData = respRes?.data || [];

          if (Array.isArray(responseData)) {
            if (responseData.length > 0) {
            }

            const mappedResponses = responseData.map((r) => {
              // Debug each field

              return {
                responseId: r.responseId,
                formId: form.formId,
                formName: form.formName,
                employeeId: r.employeeId,
                employeeName:
                  empMap[r.employeeId] ||
                  empMap[r.submittedByEmployeeId] ||
                  `Employee ${r.employeeId}`,
                status: r.status || "Submitted",
                submittedDate:
                  r.submittedDate ||
                  r.createdAt ||
                  r.createdDate ||
                  r.submittedOn ||
                  new Date().toISOString(),
                hrReviewComments: r.hrReviewComments,
                ...r,
              };
            });

            allResponses = [...allResponses, ...mappedResponses];
          }
        } catch (err) {
          console.warn(
            `Error fetching responses for form ${form.formId}:`,
            err.message
          );
        }
      }

      allResponses.sort(
        (a, b) => new Date(b.submittedDate) - new Date(a.submittedDate)
      );
      setResponses(allResponses);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err?.message || "Failed to fetch data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Modal handlers
  const handleViewResponse = (response) => {
    setSelectedResponse(response);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedResponse(null);
  };

  // Delete response using service
  const deleteResponse = async (responseId) => {
    if (!window.confirm("Delete this response? This action cannot be undone."))
      return;
    setError("");

    try {
      await hrFormApi.deleteResponse(responseId);
      fetchData();
    } catch (err) {
      console.error("Delete error:", err);
      setError(err?.message || "Failed to delete");
    }
  };

  // Tab button component
  const TabBtn = ({ label, icon: Icon, active, count }) => (
    <button
      type="button"
      className={`btn btn-sm ${active ? "btn-primary" : "btn-outline-primary"}`}
      onClick={() => setTab(label)}
      style={{ borderRadius: "var(--radius-sm)" }}
    >
      <Icon size={14} className="me-1" style={{ display: "inline" }} />
      {label}
      {count !== undefined && (
        <span className="ms-1 badge bg-secondary">{count}</span>
      )}
    </button>
  );

  return (
    <div className="container-fluid py-3" style={{ maxWidth: "1200px" }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <FileText size={24} style={{ color: "var(--color-primary-1)" }} />
            <h2
              className="fw-bold mb-0"
              style={{ color: "var(--color-primary-1)" }}
            >
              HR Feedback Report
            </h2>
          </div>
          <p className="mb-0 small" style={{ color: "var(--muted)" }}>
            View all forms and submitted responses
          </p>
        </div>
        <button
          className="btn d-flex align-items-center gap-2"
          onClick={fetchData}
          disabled={refreshing || loading}
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            color: "var(--color-primary-3)",
            borderRadius: "var(--radius-md)",
            padding: "0.5rem 0.9rem",
            fontWeight: "600",
          }}
        >
          <RefreshCw
            size={18}
            style={{
              animation: refreshing ? "spin 1s linear infinite" : "none",
            }}
          />
          Refresh
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          className="alert alert-danger d-flex align-items-start gap-2 mb-3"
          style={{ borderRadius: "var(--radius-md)" }}
        >
          <AlertTriangle size={18} className="mt-1" />
          <div>
            <strong>Error</strong>
            <p className="mb-0 small mt-1">{error}</p>
          </div>
          <button className="btn-close ms-auto" onClick={() => setError("")} />
        </div>
      )}

      {/* Stats */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div
            className="card border-0 text-center"
            style={{ border: "1px solid var(--border)" }}
          >
            <div className="card-body">
              <h4 className="fw-bold text-primary">{forms.length}</h4>
              <small className="text-muted">Total Forms</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div
            className="card border-0 text-center"
            style={{ border: "1px solid var(--border)" }}
          >
            <div className="card-body">
              <h4 className="fw-bold text-success">{responses.length}</h4>
              <small className="text-muted">Submitted</small>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="card border-0 mb-3"
        style={{
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow)",
        }}
      >
        <div className="card-body d-flex gap-2 flex-wrap">
          <TabBtn
            label="Forms"
            icon={FileText}
            active={tab === "Forms"}
            count={forms.length}
          />
          <TabBtn
            label="Responses"
            icon={CheckCircle}
            active={tab === "Responses"}
            count={responses.length}
          />
        </div>
      </div>

      {/* Forms Tab */}
      {tab === "Forms" && (
        <div
          className="card border-0"
          style={{
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow)",
          }}
        >
          <div className="card-body">
            <div className="d-flex align-items-center gap-2 mb-3">
              <FileText size={20} style={{ color: "var(--color-primary-1)" }} />
              <h5 className="mb-0">Active Forms</h5>
            </div>
            {forms.length === 0 ? (
              <div className="alert alert-info mb-0">No forms available</div>
            ) : (
              <div className="row g-3">
                {forms.map((form) => {
                  const formResponses = responses.filter(
                    (r) => r.formId === form.formId
                  );
                  return (
                    <div className="col-md-6 col-lg-4" key={form.formId}>
                      <div
                        className="card h-100 border-0"
                        style={{
                          border: "1px solid var(--border)",
                          borderLeft: "4px solid #0F62FE",
                          borderRadius: "var(--radius-lg)",
                          boxShadow: "var(--shadow)",
                        }}
                      >
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="mb-0">{form.formName}</h6>
                            <Badge
                              text={`${formResponses.length}`}
                              color="#0F62FE"
                            />
                          </div>
                          <p className="small text-muted mb-3">
                            {form.formDescription || "No description"}
                          </p>
                          <div className="small text-success fw-bold">
                            <CheckCircle
                              size={12}
                              className="me-1"
                              style={{ display: "inline" }}
                            />
                            {formResponses.length} response
                            {formResponses.length !== 1 ? "s" : ""}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Responses Tab */}
      {tab === "Responses" && (
        <div
          className="card border-0"
          style={{
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow)",
          }}
        >
          <div className="card-body">
            <div className="d-flex align-items-center gap-2 mb-3">
              <CheckCircle
                size={20}
                style={{ color: "var(--color-primary-1)" }}
              />
              <h5 className="mb-0">Submitted Responses</h5>
            </div>
            {responses.length === 0 ? (
              <p className="text-muted mb-0">No responses submitted yet</p>
            ) : (
              <div className="row g-3">
                {responses.map((response) => {
                  const daysAgo = Math.floor(
                    (new Date() - new Date(response.submittedDate)) /
                      (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div
                      className="col-md-6 col-lg-4"
                      key={response.responseId}
                    >
                      <div
                        className="card h-100 border-0"
                        style={{
                          border: "1px solid var(--border)",
                          borderLeft: "4px solid #24A148",
                          borderRadius: "var(--radius-lg)",
                          boxShadow: "var(--shadow)",
                        }}
                      >
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <h6 className="mb-1 small text-muted">Form:</h6>
                              <p
                                className="mb-0 fw-bold"
                                style={{
                                  fontSize: "0.95rem",
                                  color: "var(--color-primary-1)",
                                }}
                              >
                                {response.formName}
                              </p>
                            </div>
                            <Badge text="Submitted" color="#24A148" />
                          </div>

                          <div
                            className="mb-3 p-2 rounded"
                            style={{ backgroundColor: "#f9f9f9" }}
                          >
                            <h6 className="mb-1 small text-muted">
                              <User
                                size={12}
                                className="me-1"
                                style={{ display: "inline" }}
                              />
                              Employee:
                            </h6>
                            <p className="mb-0 fw-bold small">
                              {response.employeeName}
                            </p>
                          </div>

                          <small className="text-muted d-block mb-2">
                            <Clock
                              size={12}
                              className="me-1"
                              style={{ display: "inline" }}
                            />
                            {new Date(
                              response.submittedDate
                            ).toLocaleDateString()}{" "}
                            ({daysAgo}d ago)
                          </small>

                          {response.hrReviewComments && (
                            <div
                              className="mb-2 p-2 rounded"
                              style={{ backgroundColor: "#f0f0f0" }}
                            >
                              <small className="fw-bold d-block mb-1">
                                <MessageSquare
                                  size={12}
                                  className="me-1"
                                  style={{ display: "inline" }}
                                />
                                HR Review:
                              </small>
                              <p className="small mb-0">
                                {response.hrReviewComments.substring(0, 60)}...
                              </p>
                            </div>
                          )}

                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm btn-outline-secondary flex-grow-1"
                              onClick={() => handleViewResponse(response)}
                            >
                              <Eye
                                size={14}
                                className="me-1"
                                style={{ display: "inline" }}
                              />
                              View
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() =>
                                deleteResponse(response.responseId)
                              }
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Response View Modal */}
      <ResponseViewModal
        show={showModal}
        response={selectedResponse}
        onClose={handleCloseModal}
        type="HR"
      />

      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
