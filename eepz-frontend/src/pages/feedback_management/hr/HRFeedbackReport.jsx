import React, { useEffect, useMemo, useState } from "react";
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
import axios from "axios";
import ResponseViewModal from "../../../components/FeedbackManagement/ResponseViewModal";

const API_BASE = import.meta.env.VITE_API_BASE;

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

  // ============================================================================
  // FETCH EMPLOYEE MAP
  // ============================================================================

  const fetchEmployeeMap = async () => {
    try {
      console.log(" Fetching employee map...");
      const response = await axios.get(`${API_BASE}/EmployeeManagement/all`);

      if (response.data?.success && Array.isArray(response.data.data)) {
        const map = {};
        response.data.data.forEach((emp) => {
          map[emp.employeeId] = `${emp.firstName} ${emp.lastName}`;
        });
        setEmployeeMap(map);
        console.log(" Employee map loaded:", map);
        return map;
      }
    } catch (err) {
      console.error(" Error fetching employee map:", err.message);
    }
    return {};
  };

  // ============================================================================
  // FETCH DATA
  // ============================================================================

  const fetchData = async () => {
    setRefreshing(true);
    setLoading(true);
    setError("");

    try {
      // Step 1: Get employee map
      const empMap = await fetchEmployeeMap();

      // Step 2: Fetch all active forms
      console.log(" Fetching active forms...");
      const formsRes = await axios.get(
        `${API_BASE}/HrFeedbackForm/forms/active`
      );
      console.log(" Raw forms response:", formsRes.data);

      let formsData = [];
      if (formsRes.data?.success && Array.isArray(formsRes.data.data)) {
        formsData = formsRes.data.data;
        setForms(formsData);
        console.log(` ${formsData.length} forms loaded`);
      }

      // Step 3: Fetch responses for ALL EMPLOYEES
      console.log(" Fetching ALL responses...");
      let allResponses = [];

      for (const form of formsData) {
        try {
          const respRes = await axios.get(
            `${API_BASE}/HrFeedbackForm/responses/by-form/${form.formId}`
          );
          console.log(` Raw responses for form ${form.formId}:`, respRes.data);

          if (respRes.data?.success && Array.isArray(respRes.data.data)) {
            if (respRes.data.data.length > 0) {
              console.log(" FIRST RESPONSE OBJECT:", respRes.data.data[0]);
              console.log(
                " All field keys:",
                Object.keys(respRes.data.data[0])
              );
            }

            const mappedResponses = respRes.data.data.map((r) => {
              // Debug each field
              console.log(`Processing response:`, {
                responseId: r.responseId,
                employeeId: r.employeeId,
                submittedDate: r.submittedDate,
                createdAt: r.createdAt,
                createdDate: r.createdDate,
                all: r,
              });

              return {
                responseId: r.responseId,
                formId: form.formId,
                formName: form.formName,
                employeeId: r.employeeId,
                // Try multiple employee name fields
                employeeName:
                  empMap[r.employeeId] ||
                  empMap[r.submittedByEmployeeId] ||
                  `Employee ${r.employeeId}`,
                status: r.status || "Submitted",
                // Try multiple date fields
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
            console.log(
              ` Added ${mappedResponses.length} responses from form ${form.formId}`
            );
          }
        } catch (err) {
          console.warn(
            ` Error fetching responses for form ${form.formId}:`,
            err.message
          );
        }
      }

      allResponses.sort(
        (a, b) => new Date(b.submittedDate) - new Date(a.submittedDate)
      );
      setResponses(allResponses);
      console.log(
        ` Total ${allResponses.length} responses loaded:`,
        allResponses
      );
    } catch (err) {
      console.error(" Fetch error:", err);
      setError(
        err?.response?.data?.message || err.message || "Failed to fetch data"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ============================================================================
  // MODAL HANDLERS
  // ============================================================================

  const handleViewResponse = (response) => {
    setSelectedResponse(response);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedResponse(null);
  };

  // ============================================================================
  // DELETE HANDLER
  // ============================================================================

  const deleteResponse = async (responseId) => {
    if (!window.confirm("Delete this response? This action cannot be undone."))
      return;
    setError("");

    try {
      await axios.delete(`${API_BASE}/HrFeedbackForm/responses/${responseId}`);
      fetchData();
    } catch (err) {
      console.error("Delete error:", err);
      setError(
        err?.response?.data?.message || err.message || "Failed to delete"
      );
    }
  };

  // ============================================================================
  // TAB BUTTON
  // ============================================================================

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

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="container-fluid py-3" style={{ maxWidth: "1200px" }}>
      {/* HEADER */}
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

      {/* ERROR ALERT */}
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

      {/* STATS */}
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

      {/* TABS */}
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

      {/* ========== FORMS TAB ========== */}
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

      {/* ========== RESPONSES TAB ========== */}
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
                            <Badge text=" Submitted" color="#24A148" />
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

      {/* RESPONSE VIEW MODAL */}
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
