import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  History,
  Loader,
  X,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import SLAHistoryTimeline from "../../components/sla/common/SLAHistoryTimeline";
import ReopenSLAForm from "../../components/sla/forms/ReopenSLAForm";
import EscalationForm from "../../components/sla/forms/EscalationForm";
import slaService, {
  escalationHelpers,
  dateHelpers,
} from "../../services/sla/slaService";
import Breadcrumb from "../../components/sla/common/Breadcrumbs";
import "../../styles/sla/components/SLADetails.css";

const getSLADashboardPath = (roleName) => {
  const routes = {
    Employee: "/employee/dashboard/sla",
    Manager: "/manager/dashboard/sla",
    DepartmentHead: "/depthead/daashboard/sla",
    "Department Head": "/sla/depthead/dashboard",
    HR: "/hr/dashboard/sla",
  };
  return routes[roleName] || "/employee/dashboard/sla";
};

const SLADetails = () => {
  const { slaid } = useParams();
  const navigate = useNavigate();
  const [sla, setSla] = useState(null);
  const [history, setHistory] = useState([]);
  const [escalations, setEscalations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("details");
  const [showReopenForm, setShowReopenForm] = useState(false);
  const [showEscalationForm, setShowEscalationForm] = useState(false);
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  const [canReopen, setCanReopen] = useState(false);
  const [canEscalate, setCanEscalate] = useState(false);
  const [escalationBlockReason, setEscalationBlockReason] = useState(null);
  const [user, setUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    try {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      setUser(userData);
    } catch (err) {
      console.error("Error parsing user:", err);
    }
    fetchSLADetails();
  }, [slaid]);

  const fetchSLADetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const slaResponse = await slaService.getSLAById(parseInt(slaid));

      if (!slaResponse?.success || !slaResponse.data) {
        setError("SLA not found");
        setSla(null);
        setLoading(false);
        return;
      }
      setSla(slaResponse.data);

      try {
        const historyResponse = await slaService.getSLAHistory(parseInt(slaid));
        if (historyResponse?.success && Array.isArray(historyResponse.data)) {
          setHistory(historyResponse.data);
        } else {
          setHistory([]);
        }
      } catch (err) {
        console.warn("Could not load history:", err.message);
        setHistory([]);
      }

      try {
        const escalationsResponse = await slaService.getSLAEscalations(
          parseInt(slaid)
        );
        if (
          escalationsResponse?.success &&
          Array.isArray(escalationsResponse.data)
        ) {
          const escData = escalationsResponse.data;
          setEscalations(escData);
          updateEscalationStatus(slaResponse.data, escData, userData);
        } else {
          setEscalations([]);
          updateEscalationStatus(slaResponse.data, [], userData);
        }
      } catch (err) {
        console.warn("Could not load escalations:", err.message);
        setEscalations([]);
        updateEscalationStatus(slaResponse.data, [], userData);
      }
    } catch (err) {
      console.error("Error fetching SLA details:", err);
      setError(err.message || "Failed to fetch SLA details");
    } finally {
      setLoading(false);
    }
  }, [slaid]);

  // ✅ FIX 1 — canReopen now also checks reopenCount === 0
  const updateEscalationStatus = useCallback(
    (slaData, escalationsData, userData) => {
      if (!slaData || !userData) return;

      const canEscalateL1 = escalationHelpers.canEscalateToL1(
        slaData,
        escalationsData
      );

      const isEligibleRole =
        userData.roleName === "Employee" || userData.roleName === "Manager";

      const canEsc = canEscalateL1 && isEligibleRole;
      setCanEscalate(canEsc);

      if (!canEsc) {
        const reason = escalationHelpers.getEscalationBlockReason(
          slaData,
          escalationsData,
          "L1"
        );
        setEscalationBlockReason(reason);
      } else {
        setEscalationBlockReason(null);
      }

      // ✅ FIX 1 — Block reopen if already reopened once (reopenCount >= 1)
      setCanReopen(
        userData.roleName === "Manager" &&
          slaData.status === "Closed" &&
          (slaData.reopenCount ?? 0) === 0
      );
    },
    []
  );

  const handleEscalateClick = useCallback(() => {
    if (!canEscalate) {
      console.warn("Escalation blocked:", escalationBlockReason);
      toast.error("Cannot escalate", {
        description: escalationBlockReason || "Escalation is not available",
        duration: 4000,
      });
      return;
    }
    setShowEscalationForm(true);
  }, [canEscalate, escalationBlockReason]);

  const handleCloseSLA = useCallback(async () => {
    try {
      setRefreshing(true);
      setShowCloseConfirmation(false);
      const res = await slaService.closeSLA(sla.slaid);

      if (res?.success) {
        toast.success("SLA closed successfully");
        await fetchSLADetails();
      } else {
        console.error("Failed to close SLA:", res?.message);
        toast.error("Failed to close SLA");
      }
    } catch (err) {
      console.error("Error closing SLA:", err);
      toast.error("Error closing SLA");
    } finally {
      setRefreshing(false);
    }
  }, [sla, user, fetchSLADetails]);

  const handleReopenSuccess = useCallback(() => {
    setShowReopenForm(false);
    fetchSLADetails();
  }, [fetchSLADetails]);

  const handleEscalationSuccess = useCallback(() => {
    setShowEscalationForm(false);
    fetchSLADetails();
  }, [fetchSLADetails]);

  if (loading) {
    return (
      <div className="sla-details-loading-wrapper">
        <div className="sla-details-loading-content">
          <Loader size={48} className="sla-details-loading-spinner" />
          <p className="sla-details-loading-text">Loading SLA details...</p>
        </div>
      </div>
    );
  }

  if (error || !sla) {
    return (
      <div className="sla-details-error-wrapper">
        <div className="sla-details-error-alert">
          <AlertTriangle size={20} />
          <span>{error || "SLA not found"}</span>
        </div>
        <button className="sla-details-error-btn" onClick={() => navigate(-1)}>
          Go Back
        </button>
      </div>
    );
  }

  const daysRemaining = dateHelpers.daysRemaining(sla.deadline);
  const hasEscalations = escalations.length > 0;
  const pendingEscalations = escalations.filter(
    (e) => e.escalationStatus === "Pending"
  ).length;

  const slaDashboardPath = user
    ? getSLADashboardPath(user.roleName)
    : "/dashboard/sla";

  return (
    <div className="sla-details-container">
      <div className="sla-details-header">
        <Breadcrumb
          items={[
            {
              label: "SLA Compliance",
              onClick: () => navigate(-1),
            },
            {
              label: `${sla.slatype} - ${sla.employeeName}`,
            },
          ]}
        />

        <div className="sla-details-actions-wrapper">
          {/* ── Escalate Button ─────────────────────────────────── */}
          {sla.status !== "Closed" &&
            (user?.roleName === "Employee" || user?.roleName === "Manager") &&
            (canEscalate ? (
              <button
                onClick={handleEscalateClick}
                className="sla-details-btn sla-details-btn-warning"
              >
                <AlertTriangle size={16} />
                Escalate
              </button>
            ) : (
              <button
                disabled
                className="sla-details-btn sla-details-btn-disabled"
                title={escalationBlockReason || "Cannot escalate"}
              >
                <AlertTriangle size={16} />
                Escalated
              </button>
            ))}

          {/* ── Reopen Button ────────────────────────────────────
              ✅ FIX 3 — Show disabled "Cannot Reopen" when reopenCount >= 1
          ─────────────────────────────────────────────────────── */}
          {user?.roleName === "Manager" && sla.status === "Closed" && (
            canReopen ? (
              <button
                onClick={() => setShowReopenForm(true)}
                className="sla-details-btn sla-details-btn-reopen"
              >
                <RotateCcw size={16} />
                Reopen
              </button>
            ) : (
              <button
                disabled
                className="sla-details-btn sla-details-btn-disabled"
                title="This SLA has already been reopened once and cannot be reopened again"
              >
                <RotateCcw size={16} />
                Cannot Reopen
              </button>
            )
          )}

          {/* ── Close SLA Button ─────────────────────────────── */}
          {sla.status !== "Closed" && user?.roleName === "Manager" && (
            <button
              onClick={() => setShowCloseConfirmation(true)}
              disabled={refreshing}
              className="sla-details-btn sla-details-btn-primary"
            >
              Close SLA
            </button>
          )}
        </div>
      </div>

      <div className="sla-details-layout">
        <div className="sla-details-left">
          <div className="sla-details-card">
            <div className="sla-details-card-body">

              {/* ── Status Header ──────────────────────────────── */}
              <div className="sla-details-status-header">
                <div className="sla-details-icon-wrapper">
                  <FileText size={28} className="sla-details-icon-primary" />
                </div>
                <div className="sla-details-header-content">
                  <h4 className="sla-details-type-title">{sla.slatype}</h4>
                  <div className="sla-details-badges">
                    <span
                      className={`sla-details-badge ${
                        sla.status === "Closed"
                          ? "sla-details-badge-closed"
                          : sla.status === "Escalated"
                          ? "sla-details-badge-escalated"
                          : "sla-details-badge-open"
                      }`}
                    >
                      {sla.status}
                    </span>
                    {hasEscalations && (
                      <span className="sla-details-badge sla-details-badge-warning">
                        <AlertTriangle size={12} />
                        Escalated
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Summary Grid ───────────────────────────────── */}
              <div className="sla-details-summary-section">
                <h5 className="sla-details-summary-title">Status Summary</h5>
                <div className="sla-details-summary-grid">
                  <div className="sla-details-summary-item">
                    <small className="sla-details-label">Employee</small>
                    <strong className="sla-details-value">
                      {sla.employeeName || "—"}
                    </strong>
                  </div>
                  <div className="sla-details-summary-item">
                    <small className="sla-details-label">Department</small>
                    <strong className="sla-details-value">
                      {sla.departmentName || "—"}
                    </strong>
                  </div>
                  <div className="sla-details-summary-item">
                    <small className="sla-details-label">Deadline</small>
                    <strong className="sla-details-value">
                      {dateHelpers.formatDeadline(sla.deadline)}
                    </strong>
                  </div>
                  <div className="sla-details-summary-item">
                    <small className="sla-details-label">Compliance Status</small>
                    <strong
                      className={`sla-details-value ${
                        sla.complianceStatus === "OnTime"
                          ? "sla-details-text-success"
                          : "sla-details-text-danger"
                      }`}
                    >
                      {sla.complianceStatus || "—"}
                    </strong>
                  </div>
                  <div className="sla-details-summary-item">
                    <small className="sla-details-label">Days Until Deadline</small>
                    <div
                      className={`sla-details-value ${
                        daysRemaining < 0
                          ? "sla-details-text-danger"
                          : "sla-details-text-success"
                      }`}
                    >
                      {Math.abs(daysRemaining)} days
                      <small className="sla-details-subtitle-block">
                        {daysRemaining < 0 ? "OVERDUE" : "remaining"}
                      </small>
                    </div>
                  </div>
                  <div className="sla-details-summary-item">
                    <small className="sla-details-label">Total Escalations</small>
                    <div className="sla-details-value sla-details-text-primary">
                      {escalations.length}
                    </div>
                  </div>
                  <div className="sla-details-summary-item">
                    <small className="sla-details-label">Pending Escalations</small>
                    <div className="sla-details-value sla-details-text-warning">
                      {pendingEscalations}
                    </div>
                  </div>
                  <div className="sla-details-summary-item">
                    <small className="sla-details-label">Current Status</small>
                    <span
                      className={`sla-details-badge ${
                        sla.status === "Closed"
                          ? "sla-details-badge-closed"
                          : sla.status === "Escalated"
                          ? "sla-details-badge-escalated"
                          : "sla-details-badge-open"
                      }`}
                    >
                      {sla.status}
                    </span>
                  </div>

                  {/* ✅ NEW — Reopen Count indicator in summary grid */}
                  {(sla.reopenCount ?? 0) > 0 && (
                    <div className="sla-details-summary-item">
                      <small className="sla-details-label">Reopen Count</small>
                      <div className="sla-details-value sla-details-text-danger">
                        {sla.reopenCount} / 1 used
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Reopen Alert Block ─────────────────────────────
                  ✅ FIX 4 — Show permanent close warning when exhausted
              ─────────────────────────────────────────────────────── */}
              {sla.reopenedAt && (
                <div className="sla-details-alert">
                  <RotateCcw size={20} className="sla-details-alert-icon" />
                  <div className="sla-details-alert-content">
                    <strong className="sla-details-alert-title">
                      This SLA was reopened
                    </strong>
                    <small className="sla-details-alert-text">
                      Reopened on {dateHelpers.formatDeadline(sla.reopenedAt)}{" "}
                      with {sla.reopenExtensionDays || 0} day extension
                      {sla.reopenReason && (
                        <span className="sla-details-alert-reason">
                          Reason: {sla.reopenReason}
                        </span>
                      )}
                    </small>

                    {/* ✅ FIX 4 — Permanent close warning */}
                    {(sla.reopenCount ?? 0) >= 1 &&
                      sla.status === "Closed" && (
                        <small
                          className="sla-details-alert-text"
                          style={{
                            color: "#dc2626",
                            marginTop: "6px",
                            display: "block",
                            fontWeight: "600",
                          }}
                        >
                          ⚠️ No further reopens allowed. This SLA is
                          permanently closed.
                        </small>
                      )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Escalation Chain ──────────────────────────────── */}
          {hasEscalations && (
            <div className="sla-details-card">
              <div className="sla-details-card-body">
                <h5 className="sla-details-section-title">
                  <AlertTriangle
                    size={20}
                    className="sla-details-section-icon"
                  />
                  Escalation Chain ({escalations.length})
                </h5>

                {escalations.map((esc, idx) => (
                  <div
                    key={esc.escalationId}
                    className={`sla-details-escalation-item ${
                      idx < escalations.length - 1
                        ? "sla-details-escalation-item-bordered"
                        : ""
                    }`}
                  >
                    <div className="sla-details-badges sla-details-escalation-badges">
                      <span
                        className={`sla-details-badge ${
                          esc.escalationLevel === "L2"
                            ? "sla-details-badge-warning"
                            : "sla-details-badge-info"
                        }`}
                      >
                        {esc.escalationLevel}
                      </span>
                      <span
                        className={`sla-details-badge ${
                          esc.escalationStatus === "Resolved"
                            ? "sla-details-badge-success"
                            : "sla-details-badge-pending"
                        }`}
                      >
                        {esc.escalationStatus === "Resolved" ? (
                          <>
                            <CheckCircle size={12} />
                            Resolved
                          </>
                        ) : (
                          <>
                            <Clock size={12} />
                            Pending
                          </>
                        )}
                      </span>
                    </div>
                    <div className="sla-details-escalation-content">
                      <div className="sla-details-escalation-row">
                        <div className="sla-details-escalation-col">
                          <small className="sla-details-label">
                            Escalated By
                          </small>
                          <strong className="sla-details-value">
                            {esc.submittedByName ||
                              `User ${esc.submittedByEmployeeId}`}
                          </strong>
                        </div>
                        <div className="sla-details-escalation-col">
                          <small className="sla-details-label">
                            Escalated To
                          </small>
                          <strong className="sla-details-value">
                            {esc.escalatedToName ||
                              `User ${esc.escalatedToEmployeeId}`}
                          </strong>
                        </div>
                      </div>
                      <div className="sla-details-escalation-reason">
                        <small className="sla-details-escalation-label">
                          Reason:
                        </small>
                        <small className="sla-details-escalation-text">
                          {esc.reason || "—"}
                        </small>
                      </div>
                      {esc.description && (
                        <div className="sla-details-escalation-description">
                          <small className="sla-details-escalation-label">
                            Description:
                          </small>
                          <small className="sla-details-escalation-text">
                            {esc.description}
                          </small>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right Panel — History Timeline ────────────────── */}
        <div className="sla-details-right">
          <div className="sla-details-card">
            <div className="sla-details-card-body">
              <div className="sla-details-tab-history">
                {history.length === 0 ? (
                  <div className="sla-details-empty">
                    <History size={48} className="sla-details-empty-icon" />
                    <p className="sla-details-empty-text">
                      No history available
                    </p>
                  </div>
                ) : (
                  <SLAHistoryTimeline history={history} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Reopen Form Modal ─────────────────────────────────── */}
      {showReopenForm && (
        <ReopenSLAForm
          sla={sla}
          onClose={() => setShowReopenForm(false)}
          onSuccess={handleReopenSuccess}
        />
      )}

      {/* ── Escalation Form Modal ─────────────────────────────── */}
      {showEscalationForm && (
        <EscalationForm
          sla={sla}
          onClose={() => setShowEscalationForm(false)}
          onSuccess={handleEscalationSuccess}
        />
      )}

      {/* ── Close Confirmation Modal ──────────────────────────── */}
      {showCloseConfirmation && (
        <>
          <div
            className="sla-close-modal-backdrop"
            onClick={() => !refreshing && setShowCloseConfirmation(false)}
          />
          <div className="sla-close-modal-wrapper">
            <div className="sla-close-modal-container">
              <div className="sla-close-modal-header">
                <h3 className="sla-close-modal-title">Close This SLA?</h3>
                <button
                  type="button"
                  className="sla-close-modal-close-btn"
                  onClick={() => setShowCloseConfirmation(false)}
                  disabled={refreshing}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="sla-close-modal-body">
                <div className="sla-close-modal-icon-wrapper">
                  <CheckCircle size={48} />
                </div>
                <p className="sla-close-modal-description">
                  You're about to mark this SLA as completed and closed.
                </p>

                <div className="sla-close-modal-info-box">
                  <div className="sla-close-modal-info-icon">
                    <Info size={18} />
                  </div>
                  <div className="sla-close-modal-info-content">
                    <p className="sla-close-modal-info-title">
                      What happens next?
                    </p>
                    {/* ✅ FIX 2 — Correct reopen message based on reopenCount */}
                    <ul className="sla-close-modal-info-list">
                      <li>The SLA status will be changed to "Closed"</li>
                      <li>This action will be recorded in the SLA history</li>
                      <li>
                        {(sla.reopenCount ?? 0) === 0
                          ? "You can reopen this SLA later if needed (one extra day only)"
                          : "⚠️ This SLA cannot be reopened again after closing"}
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="sla-close-modal-summary">
                  <div className="sla-close-modal-summary-row">
                    <span className="sla-close-modal-summary-label">
                      SLA Type:
                    </span>
                    <span className="sla-close-modal-summary-value">
                      {sla.slatype}
                    </span>
                  </div>
                  <div className="sla-close-modal-summary-row">
                    <span className="sla-close-modal-summary-label">
                      Employee:
                    </span>
                    <span className="sla-close-modal-summary-value">
                      {sla.employeeName}
                    </span>
                  </div>
                  <div className="sla-close-modal-summary-row">
                    <span className="sla-close-modal-summary-label">
                      Current Status:
                    </span>
                    <span className="sla-close-modal-badge sla-close-modal-badge-open">
                      {sla.status}
                    </span>
                  </div>
                  {/* ✅ NEW — Show reopen count in close modal summary */}
                  <div className="sla-close-modal-summary-row">
                    <span className="sla-close-modal-summary-label">
                      Reopen Used:
                    </span>
                    <span
                      className="sla-close-modal-summary-value"
                      style={{
                        color:
                          (sla.reopenCount ?? 0) >= 1 ? "#dc2626" : "#16a34a",
                      }}
                    >
                      {sla.reopenCount ?? 0} / 1
                    </span>
                  </div>
                </div>
              </div>

              <div className="sla-close-modal-actions">
                <button
                  type="button"
                  className="sla-close-modal-btn sla-close-modal-btn-secondary"
                  onClick={() => setShowCloseConfirmation(false)}
                  disabled={refreshing}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="sla-close-modal-btn sla-close-modal-btn-primary"
                  onClick={handleCloseSLA}
                  disabled={refreshing}
                >
                  {refreshing ? (
                    <>
                      <span className="sla-close-modal-spinner" />
                      Closing...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Yes, Close SLA
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SLADetails;