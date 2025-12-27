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
import "../../../styles/feedback/forms/FormList.css";

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
        const list = res.data?.data || [];
        setForms(list);
        if (list.length === 0) {
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
    if (!window.confirm("Delete this form? This action cannot be undone.")) return;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="fl-page fl-page-loading">
        <div className="fl-loading-content">
          <div className="fl-spinner-main" />
          <p className="fl-loading-text">Loading forms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fl-page">
      <div className="fl-header">
        <div className="fl-header-left">
          <h3 className="fl-title"> Forms Management</h3>
          <p className="fl-subtitle">Create and track feedback forms</p>
        </div>
        <div className="fl-header-actions">
          <button
            onClick={fetchForms}
            className="fl-btn fl-btn-icon fl-btn-refresh"
            disabled={loading}
            title="Refresh"
          >
            <RefreshCw
              size={16}
              className={loading ? "fl-icon-spin" : ""}
            />
          </button>
          <Link to="/hr/create-form" className="fl-btn fl-btn-primary">
            <Plus size={16} className="fl-btn-icon-left" />
            Create Form
          </Link>
        </div>
      </div>

      {error && (
        <div className="fl-alert fl-alert-warning">
          <div className="fl-alert-main">
            <AlertTriangle size={16} className="fl-alert-icon" />
            <span>
              <strong>Info:</strong> {error}
            </span>
          </div>
          <button
            type="button"
            className="fl-alert-close"
            onClick={() => setError("")}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}

      {forms.length === 0 ? (
        <div className="fl-card fl-card-empty">
          <p className="fl-empty-text">No forms created yet</p>
          <Link to="/hr/create-form" className="fl-btn fl-btn-primary fl-btn-sm">
            Create First Form
          </Link>
        </div>
      ) : (
        <div className="fl-card">
          <div className="fl-table-wrapper">
            <table className="fl-table">
              <thead className="fl-table-head">
                <tr>
                  <th className="fl-th fl-th-main">Form Name</th>
                  <th className="fl-th">Type</th>
                  <th className="fl-th fl-th-center">Deadline</th>
                  <th className="fl-th fl-th-center">Actions</th>
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
                      <tr className="fl-row-main">
                        <td className="fl-td fl-td-name">{form.formName}</td>
                        <td className="fl-td">
                          <span className="fl-badge-type">
                            {form.formType}
                          </span>
                        </td>
                        <td className="fl-td fl-td-center">
                          <div className="fl-deadline-cell">
                            <span className="fl-deadline-date">
                              {formatDate(form.deadline)}
                            </span>
                            <span className="fl-deadline-chip">
                              {getDaysRemaining(form.deadline)}
                            </span>
                          </div>
                        </td>
                        <td className="fl-td fl-td-center">
                          <button
                            className="fl-btn fl-btn-outline-primary fl-btn-xs fl-btn-icon-only"
                            onClick={() => fetchFormResponses(form.formId)}
                            disabled={loadingResponses[form.formId]}
                            title="View responses"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            className="fl-btn fl-btn-outline-danger fl-btn-xs fl-btn-icon-only"
                            onClick={() => handleDeleteForm(form.formId)}
                            title="Delete form"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="fl-row-expanded">
                          <td colSpan="7" className="fl-expanded-cell">
                            <div className="fl-responses-header">
                              <h6 className="fl-responses-title">
                                <CheckCircle
                                  size={16}
                                  className="fl-responses-icon"
                                />
                                Responses ({totalResp})
                              </h6>
                              {totalDist > 0 && (
                                <span className="fl-responses-rate">
                                  {totalResp}/{totalDist} ({rate}%)
                                </span>
                              )}
                            </div>

                            {loadingResponses[form.formId] ? (
                              <div className="fl-responses-loading">
                                <div className="fl-spinner-small" />
                              </div>
                            ) : responses[form.formId]?.length === 0 ? (
                              <p className="fl-responses-empty">
                                No responses yet
                              </p>
                            ) : (
                              <div className="fl-table-wrapper-inner">
                                <table className="fl-table fl-table-inner">
                                  <thead>
                                    <tr>
                                      <th>Employee</th>
                                      <th>Submitted Date</th>
                                      <th>Submitted Time</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {responses[form.formId]?.map((resp) => (
                                      <tr key={resp.responseId}>
                                        <td className="fl-td-employee">
                                          {resp.employeeName || "Employee"}
                                        </td>
                                        <td>{formatDate(resp.submittedAt)}</td>
                                        <td>
                                          <span className="fl-time-text">
                                            {new Date(
                                              resp.submittedAt
                                            ).toLocaleTimeString([], {
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            })}
                                          </span>
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
    </div>
  );
}
