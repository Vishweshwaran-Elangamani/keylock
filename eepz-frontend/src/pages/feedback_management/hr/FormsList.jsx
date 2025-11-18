import React, { useEffect, useState } from "react";
import {
  Eye,
  Trash2,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import hrFormApi from "../../../services/feedbackmanagement/hrFormApi";

export default function FormsList() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedFormId, setSelectedFormId] = useState(null);
  const [responses, setResponses] = useState({});
  const [loadingResponses, setLoadingResponses] = useState({});

  const fetchForms = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await hrFormApi.getAllForms(1, 100);
      if (res.data?.success === true || res.status === 200) {
        setForms(res.data?.data || []);
        if ((res.data?.data || []).length === 0) {
          setError("No forms found. Create a new form to get started.");
        }
      } else {
        setError(res.data?.message || "Failed to load forms");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load forms");
    } finally {
      setLoading(false);
    }
  };

  const fetchFormResponses = async (formId) => {
    if (responses[formId]) {
      setSelectedFormId(selectedFormId === formId ? null : formId);
      return;
    }

    setLoadingResponses((prev) => ({ ...prev, [formId]: true }));
    try {
      const res = await hrFormApi.getResponsesByFormId(formId);
      if (res.data?.success === true || res.status === 200) {
        setResponses((prev) => ({ ...prev, [formId]: res.data?.data || [] }));
        setSelectedFormId(formId);
      } else {
        setError(res.data?.message || "Failed to load responses");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load responses");
    } finally {
      setLoadingResponses((prev) => ({ ...prev, [formId]: false }));
    }
  };

  const handleDeleteForm = async (formId) => {
    if (!window.confirm("Delete this form? This action cannot be undone."))
      return;
    try {
      const res = await hrFormApi.deleteForm(formId);
      if (res.data?.success === true || res.status === 200) {
        setForms(forms.filter((f) => f.formId !== formId));
        setSelectedFormId(null);
        alert("Form deleted successfully");
      } else {
        setError(res.data?.message || "Failed to delete form");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete form");
    }
  };

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime()) || date.getFullYear() < 2000) return "—";
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const getDaysRemaining = (deadline) => {
    try {
      const now = new Date();
      const deadlineDate = new Date(deadline);
      const diff = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
      return diff > 0 ? `${diff}d` : "Overdue";
    } catch {
      return "—";
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "60vh" }}
      >
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" />
          <p className="text-muted">Loading forms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ maxWidth: "1400px" }}>
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3
            className="fw-bold mb-1"
            style={{ color: "var(--color-primary-1)" }}
          >
            📋 Forms Management
          </h3>
          <p className="text-muted mb-0">Create and track feedback forms</p>
        </div>
        <div className="d-flex gap-2">
          <button
            onClick={fetchForms}
            className="btn btn-outline-secondary"
            disabled={loading}
            title="Refresh"
          >
            <RefreshCw
              size={16}
              style={{
                animation: loading ? "spin 1s linear infinite" : "none",
              }}
            />
          </button>
          <Link to="/hr/create-form" className="btn btn-primary">
            <Plus size={16} className="me-2" />
            Create Form
          </Link>
        </div>
      </div>

      {/* ERROR ALERT */}
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
          <strong>Info:</strong> {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError("")}
            aria-label="Close"
          />
        </div>
      )}

      {/* FORMS TABLE */}
      {forms.length === 0 ? (
        <div
          className="card border-0 text-center py-5"
          style={{ border: "1px solid var(--border)" }}
        >
          <p className="text-muted mb-3">No forms created yet</p>
          <Link to="/hr/create-form" className="btn btn-sm btn-primary">
            Create First Form
          </Link>
        </div>
      ) : (
        <div
          className="card border-0"
          style={{
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow)",
          }}
        >
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead
                style={{
                  background: "#f9f9fa",
                  borderBottom: "2px solid var(--border)",
                }}
              >
                <tr>
                  <th
                    style={{
                      color: "var(--color-primary-1)",
                      fontWeight: "600",
                    }}
                  >
                    Form Name
                  </th>
                  <th
                    style={{
                      color: "var(--color-primary-1)",
                      fontWeight: "600",
                    }}
                  >
                    Type
                  </th>
                  <th
                    style={{
                      color: "var(--color-primary-1)",
                      fontWeight: "600",
                    }}
                    className="text-center"
                  >
                    Deadline
                  </th>
                  <th
                    style={{
                      color: "var(--color-primary-1)",
                      fontWeight: "600",
                    }}
                    className="text-center"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {forms.map((form) => {
                  const totalDist =
                    form.distributedToEmployeeIds?.length ||
                    form.totalDistributed ||
                    0;
                  const totalResp =
                    form.totalResponses || responses[form.formId]?.length || 0;
                  const rate =
                    totalDist > 0
                      ? Math.round((totalResp / totalDist) * 100)
                      : 0;
                  const isExpanded = selectedFormId === form.formId;

                  return (
                    <React.Fragment key={form.formId}>
                      <tr
                        style={{ cursor: "pointer" }}
                        className="align-middle"
                      >
                        <td className="fw-bold">{form.formName}</td>
                        <td>
                          <span
                            className="badge bg-secondary"
                            style={{ fontSize: "0.75rem" }}
                          >
                            {form.formType}
                          </span>
                        </td>
                        <td className="text-center">
                          <small className="text-muted">
                            {formatDate(form.deadline)}
                          </small>
                        </td>

                        <td className="text-center">
                          <button
                            className="btn btn-sm btn-outline-primary me-1"
                            onClick={() => fetchFormResponses(form.formId)}
                            disabled={loadingResponses[form.formId]}
                            title="View responses"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteForm(form.formId)}
                            title="Delete form"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>

                      {/* RESPONSES ROW - EXPANDED */}
                      {isExpanded && (
                        <tr style={{ background: "#f0f4ff" }}>
                          <td colSpan="7" className="py-3">
                            <h6 className="fw-bold mb-3">
                              <CheckCircle
                                size={16}
                                className="me-2"
                                style={{ display: "inline", color: "#24A148" }}
                              />
                              Responses ({totalResp})
                            </h6>

                            {loadingResponses[form.formId] ? (
                              <div className="text-center py-3">
                                <div className="spinner-border spinner-border-sm text-primary" />
                              </div>
                            ) : responses[form.formId]?.length === 0 ? (
                              <p className="text-muted mb-0">
                                No responses yet
                              </p>
                            ) : (
                              <div className="table-responsive">
                                <table
                                  className="table table-sm mb-0"
                                  style={{ fontSize: "0.9rem" }}
                                >
                                  <thead>
                                    <tr style={{ background: "#e8f0ff" }}>
                                      <th>Employee</th>
                                      <th>Submitted Date</th>
                                      <th>Submitted Time</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {responses[form.formId]?.map((resp) => (
                                      <tr key={resp.responseId}>
                                        <td className="fw-600">
                                          {resp.employeeName || "Employee"}
                                        </td>
                                        <td>{formatDate(resp.submittedAt)}</td>
                                        <td>
                                          <small className="text-muted">
                                            {new Date(
                                              resp.submittedAt
                                            ).toLocaleTimeString([], {
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            })}
                                          </small>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0); }
          to { transform: rotate(360deg); }
        }
        .table th, .table td {
          padding: 12px 15px;
          vertical-align: middle;
        }
        .table tbody tr {
          border-bottom: 1px solid var(--border);
        }
        .table tbody tr:hover {
          background: #f9f9fa;
        }
        .fw-600 {
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
