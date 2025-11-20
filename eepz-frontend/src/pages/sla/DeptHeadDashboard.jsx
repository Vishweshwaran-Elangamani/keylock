// src/pages/sla/DeptHeadSLADashboard.jsx - COMPLETE REWRITE FOR L2 ESCALATIONS
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  Download,
  AlertCircle,
  RefreshCw,
  AlertTriangle,
  Eye,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import ComplianceCard from "../../components/sla/cards/ComplianceCard";
import slaService from "../../services/sla/slaService";
import Breadcrumb from "../../components/sla/common/Breadcrumbs"

const DeptHeadSLADashboard = () => {
  const navigate = useNavigate();

  // State Management
  const [allL2Escalations, setAllL2Escalations] = useState([]); // ALL L2 escalations
  const [filteredL2Escalations, setFilteredL2Escalations] = useState([]); // FILTERED by period
  const [departmentCompliance, setDepartmentCompliance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("Q1-2025");
  const [activeTab, setActiveTab] = useState("escalations");

  // Resolution modal state
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [selectedEscalation, setSelectedEscalation] = useState(null);
  const [resolutionComments, setResolutionComments] = useState("");
  const [approvingEscalation, setApprovingEscalation] = useState(false);

  // ============= LIFECYCLE HOOKS =============
  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    filterEscalationsByPeriod(selectedPeriod);
    fetchComplianceData();
  }, [selectedPeriod]);

  // ============= DATA FETCHING =============
  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      console.log("Dept Head Info:", {
        empId: user.empId,
        deptId: user.departmentId,
      });

      // Fetch L2 Escalations (Manager → Dept Head)
      await fetchL2Escalations(user.empId);
    } catch (err) {
      console.error("Error in fetchAllData:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchL2Escalations = async (deptHeadId) => {
    try {
      console.log("Fetching L2 Escalations for Dept Head:", deptHeadId);

      const response = await slaService.getManagerEscalations(deptHeadId);

      if (response && response.success) {
        const escalations = Array.isArray(response.data) ? response.data : [];

        console.log("L2 Escalations from API:", escalations.length);

        // Process escalations
        const processed = escalations.map((e) => ({
          escalationId: e.escalationId,
          slaid: e.slaid,
          slaType: e.slatype || "Performance Review",

          // Employee info
          employeeId: e.employeeId,
          employeeName: e.employeeName || "Unknown Employee",
          employeeEmail: e.employeeEmail || "",

          // Manager info (who escalated)
          managerId: e.submittedByEmployeeId,
          managerName: e.submittedByName || "Unknown Manager",
          managerEmail: e.employeeEmail || "",

          // Escalation details
          reason: e.reason || "No reason provided",
          description: e.description || "",
          escalationLevel: e.escalationLevel || "L2",
          escalationStatus: e.escalationStatus || "Pending",

          // Dates
          submittedAt: e.submittedAt,
          resolvedAt: e.resolvedAt,
          deadline: e.escalationDeadline,

          // Additional
          resolutionComments: e.resolutionComments,
          period: e.reviewCycle || "Q1-2025",
          daysLeft: e.daysUntilDeadline || 0,
        }));

        setAllL2Escalations(processed);
        filterEscalationsByPeriod(selectedPeriod, processed);
      } else {
        console.warn("No escalations found");
        setAllL2Escalations([]);
        setFilteredL2Escalations([]);
      }
    } catch (err) {
      console.error("L2 Escalations error:", err.message);
      setAllL2Escalations([]);
      setFilteredL2Escalations([]);
    }
  };

  const filterEscalationsByPeriod = (
    period,
    escalations = allL2Escalations
  ) => {
    console.log(`Filtering escalations for period: ${period}`);

    const filtered = escalations.filter((e) => e.period === period);

    console.log(`Filtered escalations for ${period}:`, filtered.length);
    setFilteredL2Escalations(filtered);
  };

  const fetchComplianceData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      console.log("Fetching department compliance for:", selectedPeriod);

      const response = await slaService.getDepartmentCompliance(
        user.departmentId,
        selectedPeriod
      );

      if (response && response.success && response.data) {
        setDepartmentCompliance(response.data);
        console.log("Compliance loaded:", response.data);
      } else {
        setDepartmentCompliance(null);
      }
    } catch (err) {
      console.warn("Compliance fetch error:", err.message);
      setDepartmentCompliance(null);
    }
  };

  // ============= EVENT HANDLERS =============
  const handleViewDetails = (slaid) => {
    navigate(`/sla/depthead/details/${slaid}`);
  };

  const handleOpenResolutionModal = (escalation) => {
    setSelectedEscalation(escalation);
    setResolutionComments("");
    setShowResolutionModal(true);
  };

  const handleCloseResolutionModal = () => {
    setShowResolutionModal(false);
    setSelectedEscalation(null);
    setResolutionComments("");
  };

  const handleApproveEscalation = async () => {
    if (!resolutionComments.trim()) {
      toast.warning("Approval comments required", {
        description: "Please provide approval comments before proceeding",
        duration: 4000,
      });
      return;
    }

    setApprovingEscalation(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      const payload = {
        escalationId: selectedEscalation.escalationId,
        resolvedByEmployeeId: user.empId,
        escalationStatus: "Resolved",
        resolutionComments: resolutionComments.trim(),
      };

      console.log("Approving L2 escalation:", payload);

      const response = await slaService.resolveEscalation(payload);

      if (response.success) {
        toast.success("Escalation approved successfully", {
          description: "Resolution comments have been saved",
          duration: 4000,
        });
        handleCloseResolutionModal();
        fetchAllData();
      } else {
        toast.error("Failed to approve escalation", {
          description: response.message || "Unable to process approval",
          duration: 5000,
        });
      }
    } catch (err) {
      console.error("Error approving escalation:", err);
      toast.error("Error approving escalation", {
        description: err.message || "An unexpected error occurred",
        duration: 5000,
      });
    } finally {
      setApprovingEscalation(false);
    }
  };

  // ============= HELPER FUNCTIONS =============
  const calculateStats = () => {
    return {
      total: filteredL2Escalations.length,
      pending: filteredL2Escalations.filter(
        (e) => e.escalationStatus === "Pending"
      ).length,
      resolved: filteredL2Escalations.filter(
        (e) => e.escalationStatus === "Resolved"
      ).length,
      compliance: departmentCompliance?.compliancePercentage || 0,
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getComplianceColor = (percentage) => {
    if (percentage >= 90) return "#24A148";
    if (percentage >= 75) return "#0F62FE";
    if (percentage >= 60) return "#E2B93B";
    return "#E01950";
  };

  const getDaysColor = (days) => {
    if (days < 0) return "#E01950"; // RED - Overdue
    if (days <= 2) return "#E2B93B"; // YELLOW - Due soon
    return "#0F62FE"; // BLUE - Normal
  };

  const getDaysLabel = (days) => {
    if (days < 0) return `${Math.abs(days)}d Overdue`;
    if (days === 0) return "Due Today";
    return `${days}d Left`;
  };

  // ============= RENDER =============
  const stats = calculateStats();

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "600px" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* ============= HEADER ============= */}
             <Breadcrumb
  items={[
   
    { label: "L2 Escalations" }
  ]}
/>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          
          <p className="text-muted mb-0">
            Review manager escalations (L2) and department compliance
          </p>
        </div>
        <div className="d-flex gap-2">
          <select
            className="form-select"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            style={{ borderRadius: "8px", width: "auto" }}
          >
            <option value="Q4-2024">Q4 2024</option>
            <option value="Q1-2025">Q1 2025</option>
            <option value="Q2-2025">Q2 2025</option>
            <option value="Q3-2025">Q3 2025</option>
            <option value="Q4-2025">Q4 2025</option>
          </select>
          <button
            className="btn btn-outline-primary d-flex align-items-center gap-2"
            onClick={fetchAllData}
            style={{ borderRadius: "8px" }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            className="btn btn-primary d-flex align-items-center gap-2"
            style={{ borderRadius: "8px" }}
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* ============= ERROR ALERT ============= */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show mb-4">
          <AlertCircle size={20} className="me-2" />
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError(null)}
          />
        </div>
      )}

      {/* ============= STATS CARDS ============= */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div
            className="card border-0 shadow-sm h-100"
            style={{ borderRadius: "12px" }}
          >
            <div className="card-body">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center mb-3"
                style={{
                  width: "48px",
                  height: "48px",
                  backgroundColor: "#0F62FE15",
                }}
              >
                <Users size={24} color="#0F62FE" />
              </div>
              <h3 className="fw-bold mb-1">{stats.total}</h3>
              <p className="text-muted mb-0">
                L2 Escalations ({selectedPeriod})
              </p>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div
            className="card border-0 shadow-sm h-100"
            style={{ borderRadius: "12px" }}
          >
            <div className="card-body">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center mb-3"
                style={{
                  width: "48px",
                  height: "48px",
                  backgroundColor: "#E2B93B15",
                }}
              >
                <Clock size={24} color="#E2B93B" />
              </div>
              <h3 className="fw-bold mb-1">{stats.pending}</h3>
              <p className="text-muted mb-0">Pending Approvals</p>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div
            className="card border-0 shadow-sm h-100"
            style={{ borderRadius: "12px" }}
          >
            <div className="card-body">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center mb-3"
                style={{
                  width: "48px",
                  height: "48px",
                  backgroundColor: "#24A14815",
                }}
              >
                <CheckCircle size={24} color="#24A148" />
              </div>
              <h3 className="fw-bold mb-1">{stats.resolved}</h3>
              <p className="text-muted mb-0">Resolved</p>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div
            className="card border-0 shadow-sm h-100"
            style={{ borderRadius: "12px" }}
          >
            <div className="card-body">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center mb-3"
                style={{
                  width: "48px",
                  height: "48px",
                  backgroundColor: "#24A14815",
                }}
              >
                <TrendingUp size={24} color="#24A148" />
              </div>
              <h3
                className="fw-bold mb-1"
                style={{ color: getComplianceColor(stats.compliance) }}
              >
                {stats.compliance.toFixed(1)}%
              </h3>
              <p className="text-muted mb-0">Compliance</p>
            </div>
          </div>
        </div>
      </div>

      {/* ============= TABS ============= */}
      <div
        className="card border-0 shadow-sm mb-4"
        style={{ borderRadius: "12px" }}
      >
        <div className="card-body p-0">
          <ul className="nav nav-tabs border-0 px-3 pt-3" role="tablist">
            <li className="nav-item">
              <button
                className={`nav-link ${
                  activeTab === "escalations" ? "active" : ""
                }`}
                onClick={() => setActiveTab("escalations")}
              >
                <AlertTriangle size={16} className="me-2" />
                L2 Escalations ({stats.total})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${
                  activeTab === "compliance" ? "active" : ""
                }`}
                onClick={() => setActiveTab("compliance")}
              >
                <TrendingUp size={16} className="me-2" />
                Compliance
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* ============= TAB: ESCALATIONS ============= */}
      {activeTab === "escalations" && (
        <div
          className="card border-0 shadow-sm"
          style={{ borderRadius: "12px" }}
        >
          <div className="card-body">
            <h5 className="fw-bold mb-4">
              L2 Escalations - Manager to Dept Head
            </h5>

            {filteredL2Escalations.length === 0 ? (
              <div className="text-center py-5">
                <AlertTriangle size={64} className="text-muted mb-3" />
                <h5 className="text-muted">No Escalations</h5>
                <p className="text-muted mb-0">
                  No manager escalations pending for {selectedPeriod}
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead style={{ backgroundColor: "#f8f9fa" }}>
                    <tr>
                      <th className="px-4 py-3">Employee</th>
                      <th className="py-3">Manager</th>
                      <th className="py-3">Reason</th>
                      <th className="py-3">Status</th>
                      <th className="py-3">Days Left</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredL2Escalations.map((esc) => (
                      <tr key={esc.escalationId}>
                        <td className="px-4">
                          <strong>{esc.employeeName}</strong>
                          <br />
                          <small className="text-muted">
                            {esc.employeeEmail || "N/A"}
                          </small>
                        </td>
                        <td>
                          <strong>{esc.managerName}</strong>
                        </td>
                        <td>
                          <strong>{esc.reason}</strong>
                          <br />
                          <small className="text-muted">
                            {esc.description || "No details"}
                          </small>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              esc.escalationStatus === "Pending"
                                ? "bg-warning text-dark"
                                : "bg-success"
                            }`}
                          >
                            {esc.escalationStatus}
                          </span>
                        </td>
                        <td>
                          <small
                            className="fw-semibold"
                            style={{ color: getDaysColor(esc.daysLeft) }}
                          >
                            {getDaysLabel(esc.daysLeft)}
                          </small>
                        </td>
                        <td className="px-4">
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleViewDetails(esc.slaid)}
                              title="View SLA details"
                            >
                              <Eye size={14} />
                            </button>
                            {esc.escalationStatus === "Pending" && (
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => handleOpenResolutionModal(esc)}
                                title="Approve escalation"
                              >
                                Approve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============= TAB: COMPLIANCE ============= */}
      {activeTab === "compliance" && (
        <div className="row g-4">
          <div className="col-lg-8">
            {departmentCompliance && departmentCompliance.totalSlas > 0 ? (
              <ComplianceCard
                compliance={departmentCompliance}
                showActions={true}
              />
            ) : (
              <div
                className="card border-0 shadow-sm"
                style={{ borderRadius: "12px" }}
              >
                <div className="card-body text-center py-5">
                  <TrendingUp size={64} className="text-muted mb-3" />
                  <p className="text-muted mb-3">
                    No compliance data for {selectedPeriod}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="col-lg-4">
            <div
              className="card border-0 shadow-sm"
              style={{ borderRadius: "12px" }}
            >
              <div className="card-body">
                <h6 className="fw-bold mb-4">Compliance Summary</h6>

                {departmentCompliance ? (
                  <>
                    <div className="mb-3 pb-3 border-bottom">
                      <small className="text-muted d-block mb-1">Period</small>
                      <strong>{departmentCompliance.period}</strong>
                    </div>

                    <div className="mb-3 pb-3 border-bottom">
                      <small className="text-muted d-block mb-1">
                        Compliance Rate
                      </small>
                      <h4
                        className="fw-bold mb-0"
                        style={{
                          color: getComplianceColor(
                            departmentCompliance.compliancePercentage
                          ),
                        }}
                      >
                        {departmentCompliance.compliancePercentage.toFixed(1)}%
                      </h4>
                    </div>

                    <div className="mb-3 pb-3 border-bottom">
                      <small className="text-muted d-block mb-1">
                        Total SLAs
                      </small>
                      <strong>{departmentCompliance.totalSlas}</strong>
                    </div>

                    <div className="mb-3 pb-3 border-bottom">
                      <small className="text-muted d-block mb-1">On Time</small>
                      <strong className="text-success">
                        {departmentCompliance.onTimeSlas}
                      </strong>
                    </div>

                    <div className="mb-0">
                      <small className="text-muted d-block mb-1">
                        Breached
                      </small>
                      <strong className="text-danger">
                        {departmentCompliance.breachedSlas}
                      </strong>
                    </div>
                  </>
                ) : (
                  <p className="small text-muted">No data available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============= APPROVAL MODAL ============= */}
      {showResolutionModal && selectedEscalation && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1055 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: "12px" }}>
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <AlertTriangle size={20} color="#E01950" />
                  Approve L2 Escalation
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseResolutionModal}
                  disabled={approvingEscalation}
                />
              </div>

              <div className="modal-body">
                <div
                  className="mb-4 p-3"
                  style={{ backgroundColor: "#f8f9fa", borderRadius: "8px" }}
                >
                  <div className="mb-2">
                    <small className="text-muted d-block">Employee</small>
                    <strong>{selectedEscalation.employeeName}</strong>
                  </div>
                  <div className="mb-2">
                    <small className="text-muted d-block">
                      Manager (Escalated By)
                    </small>
                    <strong>{selectedEscalation.managerName}</strong>
                  </div>
                  <div>
                    <small className="text-muted d-block">Reason</small>
                    <strong>{selectedEscalation.reason}</strong>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Approval Comments <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={resolutionComments}
                    onChange={(e) => setResolutionComments(e.target.value)}
                    placeholder="Provide your decision and comments..."
                    style={{ borderRadius: "8px" }}
                    disabled={approvingEscalation}
                  />
                  <small className="text-muted mt-2 d-block">
                    {resolutionComments.length}/500
                  </small>
                </div>
              </div>

              <div className="modal-footer border-0">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseResolutionModal}
                  disabled={approvingEscalation}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success d-flex align-items-center gap-2"
                  onClick={handleApproveEscalation}
                  disabled={approvingEscalation || !resolutionComments.trim()}
                >
                  <CheckCircle size={16} />
                  {approvingEscalation ? "Approving..." : "Approve Escalation"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeptHeadSLADashboard;
