import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  Search,
  X,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import slaService from "../../services/sla/slaService";
import Breadcrumb from "../../components/sla/common/Breadcrumbs";
import "../../styles/sla/DeptHeadSLADashboard.css";

const DeptHeadSLADashboard = () => {
  const navigate = useNavigate();

  const [allL2Escalations, setAllL2Escalations] = useState([]);
  const [filteredL2Escalations, setFilteredL2Escalations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("Q1-2025");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [activeTab, setActiveTab] = useState("all");

  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [selectedEscalation, setSelectedEscalation] = useState(null);
  const [resolutionComments, setResolutionComments] = useState("");
  const [approvingEscalation, setApprovingEscalation] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [selectedPeriod, searchQuery, selectedStatus, activeTab, allL2Escalations]);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
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
      const response = await slaService.getManagerEscalations(deptHeadId);

      if (response && response.success) {
        const escalations = Array.isArray(response.data) ? response.data : [];

        const processed = escalations.map((e) => ({
          escalationId: e.escalationId,
          slaid: e.slaid,
          slaType: e.slatype || "Performance Review",
          employeeId: e.employeeId,
          employeeName: e.employeeName || "Unknown Employee",
          employeeEmail: e.employeeEmail || "",
          managerId: e.submittedByEmployeeId,
          managerName: e.submittedByName || "Unknown Manager",
          reason: e.reason || "No reason provided",
          description: e.description || "",
          escalationLevel: e.escalationLevel || "L2",
          escalationStatus: e.escalationStatus || "Pending",
          submittedAt: e.submittedAt,
          period: e.reviewCycle || "Q1-2025",
        }));

        setAllL2Escalations(processed);
      } else {
        setAllL2Escalations([]);
      }
    } catch (err) {
      console.error("L2 Escalations error:", err.message);
      setAllL2Escalations([]);
    }
  };

  const applyFilters = () => {
    let filtered = [...allL2Escalations];

    if (activeTab !== "all") {
      filtered = filtered.filter(
        (e) => e.escalationStatus.toLowerCase() === activeTab
      );
    }

    if (selectedPeriod !== "all") {
      filtered = filtered.filter((e) => e.period === selectedPeriod);
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter(
        (e) => e.escalationStatus.toLowerCase() === selectedStatus
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.employeeName.toLowerCase().includes(query) ||
          e.managerName.toLowerCase().includes(query) ||
          e.reason.toLowerCase().includes(query)
      );
    }

    setFilteredL2Escalations(filtered);
  };

  const handleViewDetails = (slaid) => {
    navigate(`/sla/depthead/details/${slaid}`);
  };

  const handleRowClick = (slaid, event) => {
    // Check if the click is from a button or its children
    if (
      event.target.closest("button") ||
      event.target.tagName === "BUTTON" ||
      event.target.closest(".dh-sla-actions")
    ) {
      return; // Don't navigate if clicking on action buttons
    }
    handleViewDetails(slaid);
  };

  const handleOpenResolutionModal = (escalation, event) => {
    event.stopPropagation(); // Prevent row click
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
      toast.warning("Approval comments required");
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

      const response = await slaService.resolveEscalation(payload);

      if (response.success) {
        toast.success("Escalation approved successfully");
        handleCloseResolutionModal();
        fetchAllData();
      } else {
        toast.error("Failed to approve escalation");
      }
    } catch (err) {
      toast.error("Error approving escalation");
    } finally {
      setApprovingEscalation(false);
    }
  };

  const calculateStats = () => {
    const filteredByPeriod =
      selectedPeriod === "all"
        ? allL2Escalations
        : allL2Escalations.filter((e) => e.period === selectedPeriod);

    return {
      total: filteredByPeriod.length,
      pending: filteredByPeriod.filter((e) => e.escalationStatus === "Pending")
        .length,
      resolved: filteredByPeriod.filter(
        (e) => e.escalationStatus === "Resolved"
      ).length,
      rejected: filteredByPeriod.filter(
        (e) => e.escalationStatus === "Rejected"
      ).length,
    };
  };

  const getInitials = (name) => {
    if (!name) return "??";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getAvatarClass = (index) => {
    const classes = [
      "dh-sla-avatar-pink",
      "dh-sla-avatar-purple",
      "dh-sla-avatar-indigo",
      "dh-sla-avatar-blue",
      "dh-sla-avatar-teal",
      "dh-sla-avatar-green",
    ];
    return classes[index % classes.length];
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="dh-sla-loading-wrapper">
        <div className="dh-sla-loading-content">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dh-sla-container">
      <Breadcrumb items={[{label : "SLA Compliance"},{ label: "Department Head" }]} />

      {error && (
        <div className="dh-sla-error-alert">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="dh-sla-error-close">
            <X size={18} />
          </button>
        </div>
      )}

      <div className="dh-sla-stats-grid">
        {[
          {
            label: "Total Escalations",
            value: stats.total,
            icon: Users,
            color: "#3B82F6",
          },
          {
            label: "Approved",
            value: stats.resolved,
            icon: CheckCircle,
            color: "#16A34A",
          },
          {
            label: "Pending",
            value: stats.pending,
            icon: Clock,
            color: "#F59E0B",
          },
          {
            label: "Rejected",
            value: stats.rejected,
            icon: AlertTriangle,
            color: "#EF4444",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="dh-sla-stat-card">
            <div className="dh-sla-stat-icon" style={{ color }}>
              <Icon size={24} strokeWidth={2.5} />
            </div>
            <h3 className="dh-sla-stat-value">{value}</h3>
            <p className="dh-sla-stat-label">{label}</p>
          </div>
        ))}
      </div>

      <div className="dh-sla-table-wrapper">
        <div className="table-responsive">
          <table className="dh-sla-table">
            <thead className="dh-sla-table-header">
              <tr>
                <th>Employee</th>
                <th>Manager</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Submitted Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredL2Escalations.length === 0 ? (
                <tr>
                  <td colSpan="6" className="dh-sla-table-empty">
                    <Users size={48} className="dh-sla-empty-icon" />
                    <p className="dh-sla-empty-text">No escalations found</p>
                  </td>
                </tr>
              ) : (
                filteredL2Escalations.map((esc, index) => (
                  <tr
                    key={esc.escalationId}
                    className="dh-sla-clickable-row"
                    onClick={(e) => handleRowClick(esc.slaid, e)}
                  >
                    <td>
                      <div className="dh-sla-employee-cell">
                       
                        <div className="dh-sla-employee-info">
                          <div className="dh-sla-employee-name">
                            {esc.employeeName}
                          </div>
                          <div className="dh-sla-employee-email">
                            {esc.employeeEmail || "No email"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="dh-sla-manager-name">{esc.managerName}</div>
                    </td>
                    <td>
                      <div className="dh-sla-reason-cell">
                        <div className="dh-sla-reason-title">{esc.reason}</div>
                        {esc.description && (
                          <div className="dh-sla-reason-description">
                            {esc.description.substring(0, 50)}
                            {esc.description.length > 50 ? "..." : ""}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`dh-sla-badge ${
                          esc.escalationStatus === "Pending"
                            ? "dh-sla-badge-pending"
                            : esc.escalationStatus === "Resolved"
                            ? "dh-sla-badge-resolved"
                            : "dh-sla-badge-rejected"
                        }`}
                      >
                        {esc.escalationStatus}
                      </span>
                    </td>
                    <td>
                      <div className="dh-sla-date">{formatDate(esc.submittedAt)}</div>
                    </td>
                    <td>
                      <div className="dh-sla-actions">
                        <button
                          className="dh-sla-action-btn dh-sla-action-view"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(esc.slaid);
                          }}
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        {esc.escalationStatus === "Pending" && (
                          <button
                            className="dh-sla-action-btn dh-sla-action-approve"
                            onClick={(e) => handleOpenResolutionModal(esc, e)}
                            title="Approve Escalation"
                          >
                            <CheckCircle size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showResolutionModal && selectedEscalation && (
        <>
          <div
            className="dh-sla-modal-backdrop"
            onClick={handleCloseResolutionModal}
          />
          <div className="dh-sla-modal-wrapper">
            <div className="dh-sla-modal-container">
              <div className="dh-sla-modal-header">
                <h3 className="dh-sla-modal-title">Approve L2 Escalation</h3>
                <button
                  className="dh-sla-modal-close-btn"
                  onClick={handleCloseResolutionModal}
                  disabled={approvingEscalation}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="dh-sla-modal-body">
                <div className="dh-sla-info-box">
                  <div className="dh-sla-info-row">
                    <span className="dh-sla-info-label">Employee:</span>
                    <span className="dh-sla-info-value">
                      {selectedEscalation.employeeName}
                    </span>
                  </div>
                  <div className="dh-sla-info-row">
                    <span className="dh-sla-info-label">Manager:</span>
                    <span className="dh-sla-info-value">
                      {selectedEscalation.managerName}
                    </span>
                  </div>
                  <div className="dh-sla-info-row">
                    <span className="dh-sla-info-label">Reason:</span>
                    <span className="dh-sla-info-value">
                      {selectedEscalation.reason}
                    </span>
                  </div>
                </div>

                <div className="dh-sla-form-group">
                  <label className="dh-sla-form-label">
                    Approval Comments <span className="dh-sla-required">*</span>
                  </label>
                  <textarea
                    className="dh-sla-textarea"
                    rows="3"
                    value={resolutionComments}
                    onChange={(e) => setResolutionComments(e.target.value)}
                    placeholder="Provide your decision and comments..."
                    disabled={approvingEscalation}
                    maxLength={500}
                  />
                  <small className="dh-sla-char-count">
                    {resolutionComments.length}/500
                  </small>
                </div>
              </div>

              <div className="dh-sla-modal-footer">
                <button
                  className="dh-sla-btn dh-sla-btn-secondary"
                  onClick={handleCloseResolutionModal}
                  disabled={approvingEscalation}
                >
                  Cancel
                </button>
                <button
                  className="dh-sla-btn dh-sla-btn-primary"
                  onClick={handleApproveEscalation}
                  disabled={approvingEscalation || !resolutionComments.trim()}
                >
                  {approvingEscalation ? (
                    <>
                      <span className="dh-sla-spinner" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Approve Escalation
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

export default DeptHeadSLADashboard;
