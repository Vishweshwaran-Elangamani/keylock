import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  History,
  Loader,
  X,
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

// Helper function to get role-based dashboard path
const getSLADashboardPath = (roleName) => {
  const routes = {
    Employee: "/employee/dashboard/sla",
    Manager: "/employee/dashboard/sla",
    DepartmentHead: "/sla/depthead/dashboard",
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

  // ========== INITIALIZE ==========
  useEffect(() => {
    try {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      setUser(userData);
      console.log("👤 Current User:", {
        empId: userData.empId,
        name: userData.name,
        role: userData.roleName,
      });
    } catch (err) {
      console.error("Error parsing user:", err);
    }
    fetchSLADetails();
  }, [slaid]);

  // ========== FETCH SLA DATA ==========
  const fetchSLADetails = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");

      console.log(`🔍 Fetching SLA ${slaid}`);
      const slaResponse = await slaService.getSLAById(parseInt(slaid));

      if (!slaResponse?.success || !slaResponse.data) {
        setError("SLA not found");
        setSla(null);
        setLoading(false);
        return;
      }

      setSla(slaResponse.data);
      console.log("✅ SLA loaded:", slaResponse.data);

      // Fetch SLA history
      try {
        const historyResponse = await slaService.getSLAHistory(parseInt(slaid));
        if (historyResponse?.success && Array.isArray(historyResponse.data)) {
          setHistory(historyResponse.data);
          console.log(`📜 ${historyResponse.data.length} history entries loaded`);
        } else {
          setHistory([]);
        }
      } catch (err) {
        console.warn("⚠️ Could not load history:", err.message);
        setHistory([]);
      }

      // Fetch SLA escalations
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
          console.log(`🔺 ${escData.length} escalations loaded`);
          updateEscalationStatus(slaResponse.data, escData, userData);
        } else {
          setEscalations([]);
          updateEscalationStatus(slaResponse.data, [], userData);
        }
      } catch (err) {
        console.warn("⚠️ Could not load escalations:", err.message);
        setEscalations([]);
        updateEscalationStatus(slaResponse.data, [], userData);
      }
    } catch (err) {
      console.error("❌ Error fetching SLA details:", err);
      setError(err.message || "Failed to fetch SLA details");
    } finally {
      setLoading(false);
    }
  }, [slaid]);

  // ========== UPDATE ESCALATION STATUS ==========
  const updateEscalationStatus = useCallback(
    (slaData, escalationsData, userData) => {
      if (!slaData || !userData) return;

      console.log("🔍 Checking escalation permissions:", {
        slaStatus: slaData.status,
        userRole: userData.roleName,
        escalationsCount: escalationsData.length,
      });

      const canEscalateL1 = escalationHelpers.canEscalateToL1(
        slaData,
        escalationsData
      );

      const isEligibleRole =
        userData.roleName === "Employee" || userData.roleName === "Manager";

      const canEsc = canEscalateL1 && isEligibleRole;

      console.log("🎯 Escalation Check Result:", {
        canEscalateL1,
        isEligibleRole,
        finalDecision: canEsc,
      });

      setCanEscalate(canEsc);

      if (!canEsc) {
        const reason = escalationHelpers.getEscalationBlockReason(
          slaData,
          escalationsData,
          "L1"
        );
        setEscalationBlockReason(reason);
        console.log("⚠️ Escalation blocked:", reason);
      } else {
        setEscalationBlockReason(null);
        console.log("✅ Escalation allowed");
      }

      setCanReopen(
        userData.roleName === "Manager" && slaData.status === "Closed"
      );
    },
    []
  );

  // ========== ACTION HANDLERS ==========
  const handleEscalateClick = useCallback(() => {
    console.log("🚀 Escalate button clicked");
    if (!canEscalate) {
      console.warn("⚠️ Escalation blocked:", escalationBlockReason);
      toast.error("Cannot escalate", {
        description: escalationBlockReason || "Escalation is not available",
        duration: 4000,
      });
      return;
    }
    console.log("✅ Opening escalation form");
    setShowEscalationForm(true);
  }, [canEscalate, escalationBlockReason]);

  const handleCloseSLA = useCallback(async () => {
    try {
      setRefreshing(true);
      setShowCloseConfirmation(false);
      console.log(`🔒 Closing SLA ${sla.slaid}`);
      const res = await slaService.closeSLA({
        slaid: sla.slaid,
        closedByEmployeeId: user.empId,
        closureComments: "Closed from details page",
      });

      if (res?.success) {
        console.log("✅ SLA closed successfully");
        toast.success("SLA closed successfully", {
          description: "The SLA has been marked as closed",
          duration: 4000,
        });
        await fetchSLADetails();
      } else {
        console.error("❌ Failed to close SLA:", res?.message);
        toast.error("Failed to close SLA", {
          description: res?.message || "Unable to close the SLA",
          duration: 5000,
        });
      }
    } catch (err) {
      console.error("❌ Error closing SLA:", err);
      toast.error("Error closing SLA", {
        description: err.message || "An unexpected error occurred",
        duration: 5000,
      });
    } finally {
      setRefreshing(false);
    }
  }, [sla, user, fetchSLADetails]);

  const handleReopenSuccess = useCallback(() => {
    console.log("✅ SLA reopened successfully");
    setShowReopenForm(false);
    fetchSLADetails();
  }, [fetchSLADetails]);

  const handleEscalationSuccess = useCallback(() => {
    console.log("✅ Escalation submitted successfully");
    setShowEscalationForm(false);
    fetchSLADetails();
  }, [fetchSLADetails]);

  // ========== RENDER ==========
  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "600px" }}
      >
        <div className="text-center">
          <Loader
            size={48}
            className="text-primary mb-3"
            style={{ animation: "spin 1s linear infinite" }}
          />
          <p className="text-muted">Loading SLA details...</p>
        </div>
      </div>
    );
  }

  if (error || !sla) {
    return (
      <div className="p-4">
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-4">
          <AlertTriangle size={20} />
          <span>{error || "SLA not found"}</span>
        </div>
        <button className="btn btn-primary" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} className="me-2" />
          Go Back
        </button>
      </div>
    );
  }

  const daysRemaining = dateHelpers.daysRemaining(sla.deadline);
  const hasEscalations = escalations.length > 0;

  // Get role-based dashboard path
  const slaDashboardPath = user
    ? getSLADashboardPath(user.roleName)
    : "/employee/dashboard/sla";

  return (
    <div className="sla-details-container">
      {/* ========== BREADCRUMB ========== */}
      <Breadcrumb
        items={[
          {
            label: "SLA Management",
            path: slaDashboardPath,
          },
          {
            label: `${sla.slatype} - ${sla.employeeName}`,
          },
        ]}
      />

      {/* ========== HEADER ========== */}
      <div className="sla-details-header">
        <div className="sla-details-header-left">
          <button
            onClick={() => navigate(-1)}
            className="sla-details-back-btn"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="sla-details-title">SLA Details</h2>
            <p className="sla-details-subtitle">
              SLA #{sla.slaid} - {sla.slatype}
            </p>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="sla-details-actions">
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

          {canReopen && sla.status === "Closed" && (
            <button
              onClick={() => setShowReopenForm(true)}
              className="sla-details-btn sla-details-btn-warning"
            >
              <RotateCcw size={16} />
              Reopen
            </button>
          )}

          {sla.status !== "Closed" && user?.roleName === "Manager" && (
            <button
              onClick={() => setShowCloseConfirmation(true)}
              disabled={refreshing}
              className="sla-details-btn sla-details-btn-success"
            >
              <CheckCircle size={16} />
              Close SLA
            </button>
          )}
        </div>
      </div>

      {/* ========== MAIN GRID ========== */}
      <div className="row g-4">
        {/* LEFT COLUMN */}
        <div className="col-lg-8">
          {/* STATUS CARD */}
          <div className="sla-details-card mb-4">
            <div className="sla-details-card-body">
              <div className="sla-details-status-header">
                <div className="sla-details-icon-wrapper">
                  <FileText size={28} className="text-primary" />
                </div>
                <div className="flex-grow-1">
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

              {/* DETAILS GRID */}
              <div className="row g-4">
                <div className="col-md-6">
                  <small className="sla-details-label">Employee</small>
                  <strong className="sla-details-value">
                    {sla.employeeName || "—"}
                  </strong>
                </div>
                <div className="col-md-6">
                  <small className="sla-details-label">SLA Created By</small>
                  <strong className="sla-details-value">
                    {sla.departmentName || "—"}
                  </strong>
                </div>
                <div className="col-md-6">
                  <small className="sla-details-label">Deadline</small>
                  <strong className="sla-details-value">
                    {dateHelpers.formatDeadline(sla.deadline)}
                  </strong>
                </div>
                <div className="col-md-6">
                  <small className="sla-details-label">Compliance Status</small>
                  <strong
                    className={`sla-details-value ${
                      sla.complianceStatus === "OnTime"
                        ? "text-success"
                        : "text-danger"
                    }`}
                  >
                    {sla.complianceStatus || "—"}
                  </strong>
                </div>
              </div>

              {/* REOPEN ALERT */}
              {sla.reopenedAt && (
                <div className="sla-details-alert">
                  <RotateCcw size={20} className="flex-shrink-0" />
                  <div>
                    <strong className="d-block mb-1">
                      This SLA was reopened
                    </strong>
                    <small className="text-muted d-block">
                      Reopened on {dateHelpers.formatDeadline(sla.reopenedAt)}{" "}
                      with {sla.reopenExtensionDays || 0} day extension
                      {sla.reopenReason && (
                        <>
                          <br />
                          Reason: {sla.reopenReason}
                        </>
                      )}
                    </small>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ESCALATION CHAIN */}
          {hasEscalations && (
            <div className="sla-details-card mb-4">
              <div className="sla-details-card-body">
                <h5 className="sla-details-section-title">
                  <AlertTriangle size={20} className="text-danger" />
                  Escalation Chain ({escalations.length})
                </h5>

                {escalations.map((esc, idx) => (
                  <div
                    key={esc.escalationId}
                    className="sla-details-escalation-item"
                    style={{
                      borderBottom:
                        idx < escalations.length - 1
                          ? "1px solid #e2e8f0"
                          : "none",
                    }}
                  >
                    <div className="sla-details-badges mb-2">
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
                      <div className="row g-3 mb-2">
                        <div className="col-md-6">
                          <small className="sla-details-label">
                            Escalated By
                          </small>
                          <strong className="sla-details-value">
                            {esc.submittedByName ||
                              `User ${esc.submittedByEmployeeId}`}
                          </strong>
                        </div>
                        <div className="col-md-6">
                          <small className="sla-details-label">
                            Escalated To
                          </small>
                          <strong className="sla-details-value">
                            {esc.escalatedToName ||
                              `User ${esc.escalatedToEmployeeId}`}
                          </strong>
                        </div>
                      </div>
                      <div className="mb-1">
                        <small className="text-muted">
                          <span className="fw-semibold">Reason:</span>{" "}
                          {esc.reason || "—"}
                        </small>
                      </div>
                      {esc.description && (
                        <small className="text-muted">
                          <span className="fw-semibold">Description:</span>{" "}
                          {esc.description}
                        </small>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PILL-STYLE TABS */}
          <div className="sla-details-tabs-wrapper">
            <div className="sla-details-tabs-container">
              <button
                className={`sla-details-tab-pill ${
                  activeTab === "details" ? "active" : ""
                }`}
                onClick={() => setActiveTab("details")}
              >
                <FileText size={16} />
                Details
              </button>
              <button
                className={`sla-details-tab-pill ${
                  activeTab === "history" ? "active" : ""
                }`}
                onClick={() => setActiveTab("history")}
              >
                <History size={16} />
                History ({history.length})
              </button>
            </div>
          </div>

          {/* TAB CONTENT */}
          <div className="sla-details-card">
            <div className="sla-details-card-body">
              {activeTab === "details" && (
                <div className="row g-4">
                  {sla.createdAt && (
                    <div className="col-md-6">
                      <small className="sla-details-label">Created At</small>
                      <strong className="sla-details-value">
                        {new Date(sla.createdAt).toLocaleString()}
                      </strong>
                    </div>
                  )}
                  {sla.updatedAt && (
                    <div className="col-md-6">
                      <small className="sla-details-label">Last Updated</small>
                      <strong className="sla-details-value">
                        {new Date(sla.updatedAt).toLocaleString()}
                      </strong>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "history" && (
                <div>
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
              )}
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="col-lg-4">
          <div className="sla-details-sidebar">
            <div className="sla-details-card-body">
              <h5 className="sla-details-sidebar-title">Status Summary</h5>

              <div className="sla-details-sidebar-item">
                <small className="sla-details-label">Total Escalations</small>
                <div className="sla-details-sidebar-value text-primary">
                  {escalations.length}
                </div>
              </div>

              <div className="sla-details-sidebar-item">
                <small className="sla-details-label">Status</small>
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

              <div className="sla-details-sidebar-item">
                <small className="sla-details-label">Days Until Deadline</small>
                <div
                  className={`sla-details-sidebar-value ${
                    daysRemaining < 0 ? "text-danger" : "text-success"
                  }`}
                >
                  {Math.abs(daysRemaining)} days
                  <small className="d-block text-muted sla-details-sidebar-subtitle">
                    {daysRemaining < 0 ? "OVERDUE" : "remaining"}
                  </small>
                </div>
              </div>

              <div className="sla-details-sidebar-highlight">
                <small className="sla-details-sidebar-highlight-label">
                  Pending Escalations
                </small>
                <div className="sla-details-sidebar-highlight-value">
                  {
                    escalations.filter((e) => e.escalationStatus === "Pending")
                      .length
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== MODALS ========== */}
      {showReopenForm && (
        <ReopenSLAForm
          sla={sla}
          onClose={() => setShowReopenForm(false)}
          onSuccess={handleReopenSuccess}
        />
      )}

      {showEscalationForm && (
        <EscalationForm
          sla={sla}
          onClose={() => setShowEscalationForm(false)}
          onSuccess={handleEscalationSuccess}
        />
      )}

      {/* ========== CLOSE CONFIRMATION MODAL ========== */}
      {showCloseConfirmation && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1055 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: "12px" }}>
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <AlertTriangle size={20} color="#E2B93B" />
                  Close SLA Confirmation
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCloseConfirmation(false)}
                  disabled={refreshing}
                />
              </div>

              <div className="modal-body">
                <p className="mb-3">Are you sure you want to close this SLA?</p>
                <div
                  className="alert alert-warning d-flex align-items-start gap-2"
                  style={{ borderRadius: "8px" }}
                >
                  <AlertTriangle size={18} className="flex-shrink-0 mt-1" />
                  <small>
                    This action will mark the SLA as closed. You can reopen it
                    later if needed.
                  </small>
                </div>
              </div>

              <div className="modal-footer border-0">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCloseConfirmation(false)}
                  disabled={refreshing}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success d-flex align-items-center gap-2"
                  onClick={handleCloseSLA}
                  disabled={refreshing}
                >
                  {refreshing ? (
                    <>
                      <span className="spinner-border spinner-border-sm" />
                      <span>Closing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      <span>Close SLA</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== INTERNAL STYLES ========== */}
      <style>{`
        /* Container */
        .sla-details-container {
          padding: 1.5rem 1.75rem;
          background-color: #F9FAFB;
          min-height: 100vh;
        }

        /* Header */
        .sla-details-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .sla-details-header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-grow: 1;
        }

        .sla-details-back-btn {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          border: 1.5px solid #E5E7EB;
          background: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          color: #6B7280;
        }

        .sla-details-back-btn:hover {
          background: #F9FAFB;
          border-color: #D1D5DB;
          color: #111827;
        }

        .sla-details-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #27235C;
          margin: 0 0 0.25rem;
          line-height: 1.2;
        }

        .sla-details-subtitle {
          font-size: 0.875rem;
          color: #6B7280;
          margin: 0;
        }

        .sla-details-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        /* Buttons */
        .sla-details-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          font-size: 0.875rem;
          font-weight: 600;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .sla-details-btn-warning {
          background: #FFFFFF;
          color: #F59E0B;
          border: 1.5px solid #F59E0B;
        }

        .sla-details-btn-warning:hover {
          background: #F59E0B;
          color: #FFFFFF;
          transform: translateY(-1px);
        }

        .sla-details-btn-success {
          background: linear-gradient(90deg, #16A34A 0%, #059669 100%);
          color: #FFFFFF;
        }

        .sla-details-btn-success:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
        }

        .sla-details-btn-disabled {
          background: #F3F4F6;
          color: #9CA3AF;
          border: 1.5px solid #E5E7EB;
          cursor: not-allowed;
        }

        /* Card */
        .sla-details-card {
          background: #FFFFFF;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #F3F4F6;
          overflow: hidden;
        }

        .sla-details-card-body {
          padding: 1.5rem;
          text-align: left;
        }

        /* Status Header */
        .sla-details-status-header {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          align-items: start;
        }

        .sla-details-icon-wrapper {
          width: 56px;
          height: 56px;
          background: #EEF2FF;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .sla-details-type-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.5rem;
        }

        /* Labels & Values */
        .sla-details-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: #6B7280;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-style: italic;
        }

        .sla-details-value {
          font-size: 0.9375rem;
          color: #111827;
          font-weight: 500;
          display: block;
        }

        /* Badges */
        .sla-details-badges {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          justify-content: flex-start;
        }

        .sla-details-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.375rem 0.75rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .sla-details-badge-open {
          background: #DBEAFE;
          color: #1E40AF;
        }

        .sla-details-badge-closed {
          background: #DCFCE7;
          color: #15803D;
        }

        .sla-details-badge-escalated {
          background: #FEE2E2;
          color: #B91C1C;
        }

        .sla-details-badge-warning {
          background: #FEF3C7;
          color: #92400E;
        }

        .sla-details-badge-info {
          background: #E0E7FF;
          color: #4338CA;
        }

        .sla-details-badge-success {
          background: #DCFCE7;
          color: #15803D;
        }

        .sla-details-badge-pending {
          background: #FEF3C7;
          color: #92400E;
        }

        /* Alert */
        .sla-details-alert {
          background: #FEF3C7;
          border: 1px solid #FCD34D;
          border-radius: 8px;
          padding: 1rem;
          display: flex;
          gap: 0.75rem;
          align-items: start;
          margin-top: 1.5rem;
        }

        /* Section Title */
        .sla-details-section-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        /* Escalation Items */
        .sla-details-escalation-item {
          margin-bottom: 1rem;
          padding-bottom: 1rem;
        }

        .sla-details-escalation-content {
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          padding: 1rem;
        }

        /* Pill-Style Tabs */
        .sla-details-tabs-wrapper {
          display: flex;
          justify-content: flex-start;
          margin-bottom: 1.25rem;
        }

        .sla-details-tabs-container {
          display: inline-flex;
          background: #27235C;
          padding: 0.375rem;
          border-radius: 50px;
          gap: 0.375rem;
          box-shadow: 0 2px 8px rgba(39, 35, 92, 0.2);
        }

        .sla-details-tab-pill {
          padding: 0.625rem 1.75rem;
          border-radius: 50px;
          border: none;
          background: transparent;
          color: #FFFFFF;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .sla-details-tab-pill:hover:not(.active) {
          background: rgba(255, 255, 255, 0.1);
        }

        .sla-details-tab-pill.active {
          background: #FFFFFF;
          color: #27235C;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          border-radius: 50px;
        }

        /* Empty State */
        .sla-details-empty {
          text-align: center;
          padding: 3rem 1rem;
        }

        .sla-details-empty-icon {
          color: #D1D5DB;
          opacity: 0.3;
          margin-bottom: 1rem;
        }

        .sla-details-empty-text {
          color: #6B7280;
          font-weight: 500;
          font-size: 0.9375rem;
          margin: 0;
        }

        /* Sidebar */
        .sla-details-sidebar {
          background: #FFFFFF;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #F3F4F6;
          position: sticky;
          top: 20px;
        }

        .sla-details-sidebar-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 1.5rem;
        }

        .sla-details-sidebar-item {
          margin-bottom: 1.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #E5E7EB;
        }

        .sla-details-sidebar-value {
          font-size: 2rem;
          font-weight: 700;
          line-height: 1;
        }

        .sla-details-sidebar-subtitle {
          font-size: 0.875rem;
          margin-top: 0.25rem;
          font-weight: 500;
        }

        .sla-details-sidebar-highlight {
          background: #EFF6FF;
          border: 1px solid #BFDBFE;
          border-radius: 8px;
          padding: 1rem;
        }

        .sla-details-sidebar-highlight-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: #1E40AF;
          margin-bottom: 0.5rem;
          font-style: italic;
          text-transform: uppercase;
        }

        .sla-details-sidebar-highlight-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1E40AF;
          line-height: 1;
        }

        /* Animation */
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .sla-details-container {
            padding: 1.25rem;
          }

          .sla-details-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .sla-details-actions {
            width: 100%;
          }

          .sla-details-tabs-container {
            width: 100%;
          }

          .sla-details-tab-pill {
            flex: 1;
            justify-content: center;
          }

          .sla-details-sidebar {
            position: relative;
            top: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default SLADetails;
