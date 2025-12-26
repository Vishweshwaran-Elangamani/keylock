import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  FileText,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import slaService from "../../services/sla/slaService";
import { formatDate, formatDateTime } from "../../utils/sla/dateFormatter";
import "./SLAEscalations.css";

const SLAEscalations = () => {
  const { slaid } = useParams();
  const navigate = useNavigate();
  const [escalations, setEscalations] = useState([]);
  const [sla, setSla] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEscalation, setSelectedEscalation] = useState(null);
  const [resolutionForm, setResolutionForm] = useState({
    escalationStatus: "Resolved",
    resolutionComments: "",
  });

  useEffect(() => {
    fetchData();
  }, [slaid]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [slaResponse, escalationsResponse] = await Promise.all([
        slaService.getSLAById(parseInt(slaid)),
        slaService.getSLAEscalations(parseInt(slaid)),
      ]);

      if (slaResponse.success) {
        setSla(slaResponse.data);
      }

      if (escalationsResponse.success) {
        setEscalations(escalationsResponse.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveEscalation = async (escalationId) => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      const response = await slaService.resolveEscalation({
        escalationId,
        resolvedByEmployeeId: user.empId,
        ...resolutionForm,
      });

      if (response.success) {
        toast.success("Escalation resolved successfully", {
          description: "The escalation has been resolved and saved",
          duration: 4000,
        });
        setSelectedEscalation(null);
        setResolutionForm({
          escalationStatus: "Resolved",
          resolutionComments: "",
        });
        fetchData();
      } else {
        toast.error("Failed to resolve escalation", {
          description: response.message || "Unable to process resolution",
          duration: 5000,
        });
      }
    } catch (err) {
      toast.error("Failed to resolve escalation", {
        description: err.message || "An unexpected error occurred",
        duration: 5000,
      });
    }
  };

  const getEscalationLevelColor = (level) => {
    switch (level) {
      case "L1":
        return { bg: "#0F62FE15", text: "#0F62FE" };
      case "L2":
        return { bg: "#E2B93B15", text: "#E2B93B" };
      case "DeptHead":
        return { bg: "#AC509815", text: "#AC5098" };
      case "Leadership":
        return { bg: "#E0195015", text: "#E01950" };
      default:
        return { bg: "#6B728015", text: "#6B7280" };
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Resolved":
        return <CheckCircle size={20} color="#24A148" />;
      case "Dismissed":
        return <XCircle size={20} color="#6B7280" />;
      case "Escalated":
        return <AlertTriangle size={20} color="#E2B93B" />;
      default:
        return <Clock size={20} color="#0F62FE" />;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Resolved":
        return "sla-escalation-status-badge-resolved";
      case "Dismissed":
        return "sla-escalation-status-badge-dismissed";
      case "Escalated":
        return "sla-escalation-status-badge-escalated";
      default:
        return "sla-escalation-status-badge-pending";
    }
  };

  if (loading) {
    return (
      <div className="sla-escalations-loading">
        <div className="sla-escalations-spinner" />
      </div>
    );
  }

  return (
    <div className="sla-escalations-wrapper">
      <div className="sla-escalations-header">
        <div className="sla-escalations-header-content">
          <button
            className="sla-escalations-back-btn"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={20} />
          </button>
          <div className="sla-escalations-title-wrapper">
            <h2 className="sla-escalations-title">SLA Escalations</h2>
            {sla && (
              <p className="sla-escalations-subtitle">
                {sla.slatype} - {sla.employeeName}
              </p>
            )}
          </div>
        </div>
      </div>

      {error && <div className="sla-escalations-error">{error}</div>}

      {escalations.length === 0 ? (
        <div className="sla-escalations-empty-card">
          <AlertTriangle size={64} className="sla-escalations-empty-icon" />
          <h5 className="sla-escalations-empty-title">No Escalations</h5>
          <p className="sla-escalations-empty-text">
            This SLA has no escalations
          </p>
        </div>
      ) : (
        <div className="sla-escalations-grid">
          {escalations.map((escalation, index) => {
            const levelColors = getEscalationLevelColor(
              escalation.escalationLevel
            );
            const isExpanded = selectedEscalation === escalation.escalationId;

            return (
              <div key={escalation.escalationId} className="sla-escalation-card">
                <div className="sla-escalation-card-body">
                  <div className="sla-escalation-header">
                    <div className="sla-escalation-header-left">
                      <div
                        className="sla-escalation-icon-wrapper"
                        style={{ backgroundColor: levelColors.bg }}
                      >
                        {getStatusIcon(escalation.escalationStatus)}
                      </div>
                      <div className="sla-escalation-header-content">
                        <div className="sla-escalation-title-row">
                          <h5 className="sla-escalation-title">
                            {escalation.reason}
                          </h5>
                          <span
                            className="sla-escalation-level-badge"
                            style={{
                              backgroundColor: levelColors.bg,
                              color: levelColors.text,
                              border: `1px solid ${levelColors.text}30`,
                            }}
                          >
                            {escalation.escalationLevel}
                          </span>
                        </div>
                        <p className="sla-escalation-description">
                          {escalation.description}
                        </p>
                      </div>
                    </div>

                    <div className="sla-escalation-header-right">
                      <span
                        className={`sla-escalation-status-badge ${getStatusBadgeClass(
                          escalation.escalationStatus
                        )}`}
                      >
                        {escalation.escalationStatus}
                      </span>
                      <div className="sla-escalation-number">
                        Escalation #{index + 1}
                      </div>
                    </div>
                  </div>

                  <div className="sla-escalation-details-grid">
                    <div className="sla-escalation-detail-item">
                      <User size={16} className="sla-escalation-detail-icon" />
                      <div className="sla-escalation-detail-content">
                        <small className="sla-escalation-detail-label">
                          Escalated To
                        </small>
                        <strong className="sla-escalation-detail-value">
                          {escalation.escalatedTo}
                        </strong>
                      </div>
                    </div>

                    <div className="sla-escalation-detail-item">
                      <User size={16} className="sla-escalation-detail-icon" />
                      <div className="sla-escalation-detail-content">
                        <small className="sla-escalation-detail-label">
                          Submitted By
                        </small>
                        <strong className="sla-escalation-detail-value">
                          {escalation.submittedBy}
                        </strong>
                      </div>
                    </div>

                    <div className="sla-escalation-detail-item">
                      <Calendar
                        size={16}
                        className="sla-escalation-detail-icon"
                      />
                      <div className="sla-escalation-detail-content">
                        <small className="sla-escalation-detail-label">
                          Submitted At
                        </small>
                        <strong className="sla-escalation-detail-value">
                          {formatDateTime(escalation.submittedAt)}
                        </strong>
                      </div>
                    </div>

                    <div className="sla-escalation-detail-item">
                      <Clock size={16} className="sla-escalation-detail-icon" />
                      <div className="sla-escalation-detail-content">
                        <small className="sla-escalation-detail-label">
                          Escalation Deadline
                        </small>
                        <strong className="sla-escalation-detail-value">
                          {formatDate(escalation.escalationDeadline)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {escalation.resolvedAt && (
                    <div className="sla-escalation-resolution-alert">
                      <CheckCircle
                        size={20}
                        className="sla-escalation-resolution-icon"
                      />
                      <div className="sla-escalation-resolution-content">
                        <div className="sla-escalation-resolution-header">
                          <strong className="sla-escalation-resolution-title">
                            Resolution
                          </strong>
                          <small className="sla-escalation-resolution-meta">
                            Resolved by {escalation.resolvedBy} on{" "}
                            {formatDateTime(escalation.resolvedAt)}
                          </small>
                        </div>
                        <p className="sla-escalation-resolution-text">
                          {escalation.resolutionComments}
                        </p>
                      </div>
                    </div>
                  )}

                  {escalation.escalationStatus === "Pending" && (
                    <div className="sla-escalation-actions">
                      <button
                        className="sla-escalation-resolve-btn"
                        onClick={() =>
                          setSelectedEscalation(
                            isExpanded ? null : escalation.escalationId
                          )
                        }
                      >
                        <MessageSquare size={14} />
                        {isExpanded ? "Cancel" : "Resolve Escalation"}
                      </button>

                      {isExpanded && (
                        <div className="sla-escalation-form-wrapper">
                          <h6 className="sla-escalation-form-title">
                            Resolve Escalation
                          </h6>

                          <div className="sla-escalation-form-group">
                            <label className="sla-escalation-form-label">
                              Status
                            </label>
                            <select
                              className="sla-escalation-form-select"
                              value={resolutionForm.escalationStatus}
                              onChange={(e) =>
                                setResolutionForm({
                                  ...resolutionForm,
                                  escalationStatus: e.target.value,
                                })
                              }
                            >
                              <option value="Resolved">Resolved</option>
                              <option value="Dismissed">Dismissed</option>
                              <option value="Escalated">
                                Escalate Further
                              </option>
                            </select>
                          </div>

                          <div className="sla-escalation-form-group">
                            <label className="sla-escalation-form-label">
                              Resolution Comments
                            </label>
                            <textarea
                              className="sla-escalation-form-textarea"
                              rows="3"
                              value={resolutionForm.resolutionComments}
                              onChange={(e) =>
                                setResolutionForm({
                                  ...resolutionForm,
                                  resolutionComments: e.target.value,
                                })
                              }
                              placeholder="Provide details about the resolution..."
                            />
                          </div>

                          <button
                            className="sla-escalation-submit-btn"
                            onClick={() =>
                              handleResolveEscalation(escalation.escalationId)
                            }
                            disabled={!resolutionForm.resolutionComments}
                          >
                            <CheckCircle size={16} />
                            Submit Resolution
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SLAEscalations;
