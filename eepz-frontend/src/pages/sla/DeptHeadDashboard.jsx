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
  Search,
} from "lucide-react";
import { toast } from "sonner";
import slaService from "../../services/sla/slaService";
import Breadcrumb from "../../components/sla/common/Breadcrumbs";
import "../../styles/sla/DeptHeadSLADashboard.css";

const DeptHeadDashboard = () => {
  const navigate = useNavigate();

  // State Management
  const [allL2Escalations, setAllL2Escalations] = useState([]);
  const [filteredL2Escalations, setFilteredL2Escalations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("Q1-2025");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Resolution modal state
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [selectedEscalation, setSelectedEscalation] = useState(null);
  const [resolutionComments, setResolutionComments] = useState("");
  const [approvingEscalation, setApprovingEscalation] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [selectedPeriod, searchQuery, selectedStatus, allL2Escalations]);

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
      "dept-head-sla-avatar-pink",
      "dept-head-sla-avatar-purple",
      "dept-head-sla-avatar-indigo",
      "dept-head-sla-avatar-blue",
      "dept-head-sla-avatar-teal",
      "dept-head-sla-avatar-green",
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
      <div className="dept-head-sla-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dept-head-sla-container">
      <Breadcrumb
        items={[
          { label: "Dashboard" },
          { label: "SLA Management" },
          { label: "Department Head" },
        ]}
      />

      {/* Header */}
      <div className="dept-head-sla-header">
        <div>
          <h1 className="dept-head-sla-title">Department Head Dashboard</h1>
          <p className="dept-head-sla-subtitle">
            Review and approve L2 escalations
          </p>
        </div>
        <div className="dept-head-sla-header-actions">
          <button
            className="dept-head-sla-btn dept-head-sla-btn-refresh"
            onClick={fetchAllData}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            className="dept-head-sla-btn dept-head-sla-btn-export"
            onClick={() => toast.info("Export feature coming soon")}
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="dept-head-sla-alert-error">
          <AlertCircle size={20} className="dept-head-sla-alert-icon" />
          <span>{error}</span>
          <button
            type="button"
            className="dept-head-sla-alert-close"
            onClick={() => setError(null)}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="dept-head-sla-stats-grid">
        {[
          {
            label: "Total Escalations",
            value: stats.total,
            icon: Users,
            bg: "#EEF2FF",
            color: "#3B82F6",
          },
          {
            label: "Approved",
            value: stats.resolved,
            icon: CheckCircle,
            bg: "#DCFCE7",
            color: "#16A34A",
          },
          {
            label: "Pending",
            value: stats.pending,
            icon: Clock,
            bg: "#FEF3C7",
            color: "#D97706",
          },
          {
            label: "Rejected",
            value: stats.rejected,
            icon: AlertTriangle,
            bg: "#FEE2E2",
            color: "#DC2626",
          },
        ].map(({ label, value, icon: Icon, bg, color }) => (
          <div key={label} className="dept-head-sla-stat-card">
            <div
              className="dept-head-sla-stat-icon"
              style={{ backgroundColor: bg }}
            >
              <Icon size={22} color={color} strokeWidth={2.5} />
            </div>
            <h3 className="dept-head-sla-stat-value">{value}</h3>
            <p className="dept-head-sla-stat-label">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="dept-head-sla-filters">
        <div className="dept-head-sla-search-wrapper">
          <Search size={16} className="dept-head-sla-search-icon" />
          <input
            type="text"
            className="dept-head-sla-search-input"
            placeholder="Search escalations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="dept-head-sla-select"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="resolved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          className="dept-head-sla-select"
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
        >
          <option value="all">All Periods</option>
          <option value="Q4-2024">Q4 2024</option>
          <option value="Q1-2025">Q1 2025</option>
          <option value="Q2-2025">Q2 2025</option>
          <option value="Q3-2025">Q3 2025</option>
        </select>
      </div>

      {/* Table */}
      <div className="dept-head-sla-table-wrapper">
        <div className="table-responsive">
          <table className="dept-head-sla-table">
            <thead>
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
                  <td colSpan="6" className="dept-head-sla-empty">
                    <Users size={48} className="dept-head-sla-empty-icon" />
                    <p className="dept-head-sla-empty-text">
                      No escalations found
                    </p>
                  </td>
                </tr>
              ) : (
                filteredL2Escalations.map((esc, index) => (
                  <tr key={esc.escalationId}>
                    <td>
                      <div className="dept-head-sla-employee-cell">
                        <div
                          className={`dept-head-sla-avatar ${getAvatarClass(
                            index
                          )}`}
                        >
                          {getInitials(esc.employeeName)}
                        </div>
                        <div className="dept-head-sla-employee-info">
                          <div className="dept-head-sla-employee-name">
                            {esc.employeeName}
                          </div>
                          <div className="dept-head-sla-employee-email">
                            {esc.employeeEmail || "No email"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="dept-head-sla-manager-name">
                        {esc.managerName}
                      </div>
                    </td>
                    <td>
                      <div className="dept-head-sla-reason-cell">
                        <div className="dept-head-sla-reason-title">
                          {esc.reason}
                        </div>
                        {esc.description && (
                          <div className="dept-head-sla-reason-description">
                            {esc.description.substring(0, 50)}
                            {esc.description.length > 50 ? "..." : ""}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`dept-head-sla-badge ${
                          esc.escalationStatus === "Pending"
                            ? "dept-head-sla-badge-pending"
                            : esc.escalationStatus === "Resolved"
                            ? "dept-head-sla-badge-resolved"
                            : "dept-head-sla-badge-rejected"
                        }`}
                      >
                        {esc.escalationStatus}
                      </span>
                    </td>
                    <td>
                      <div className="dept-head-sla-date">
                        {formatDate(esc.submittedAt)}
                      </div>
                    </td>
                    <td>
                      <div className="dept-head-sla-actions">
                        <button
                          className="dept-head-sla-action-btn dept-head-sla-action-view"
                          onClick={() => handleViewDetails(esc.slaid)}
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        {esc.escalationStatus === "Pending" && (
                          <button
                            className="dept-head-sla-action-btn dept-head-sla-action-approve"
                            onClick={() => handleOpenResolutionModal(esc)}
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

      {/* Approval Modal */}
      {showResolutionModal && selectedEscalation && (
        <div
          className="dept-head-sla-modal-backdrop"
          onClick={handleCloseResolutionModal}
        >
          <div
            className="dept-head-sla-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dept-head-sla-modal-content">
              <div className="dept-head-sla-modal-header">
                <h5 className="dept-head-sla-modal-title">
                  <AlertTriangle size={20} className="me-2" />
                  Approve L2 Escalation
                </h5>
                <button
                  type="button"
                  className="dept-head-sla-modal-close"
                  onClick={handleCloseResolutionModal}
                  disabled={approvingEscalation}
                >
                  ×
                </button>
              </div>

              <div className="dept-head-sla-modal-body">
                <div className="dept-head-sla-info-box">
                  <div className="dept-head-sla-info-item">
                    <span className="dept-head-sla-info-label">Employee</span>
                    <div className="dept-head-sla-info-value">
                      {selectedEscalation.employeeName}
                    </div>
                  </div>
                  <div className="dept-head-sla-info-item">
                    <span className="dept-head-sla-info-label">
                      Manager (Escalated By)
                    </span>
                    <div className="dept-head-sla-info-value">
                      {selectedEscalation.managerName}
                    </div>
                  </div>
                  <div className="dept-head-sla-info-item">
                    <span className="dept-head-sla-info-label">Reason</span>
                    <div className="dept-head-sla-info-value">
                      {selectedEscalation.reason}
                    </div>
                  </div>
                </div>

                <div className="dept-head-sla-form-group">
                  <label className="dept-head-sla-form-label">
                    Approval Comments <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="dept-head-sla-textarea"
                    rows="4"
                    value={resolutionComments}
                    onChange={(e) => setResolutionComments(e.target.value)}
                    placeholder="Provide your decision and comments..."
                    disabled={approvingEscalation}
                    maxLength={500}
                  />
                  <small className="dept-head-sla-char-count">
                    {resolutionComments.length}/500
                  </small>
                </div>
              </div>

              <div className="dept-head-sla-modal-footer">
                <button
                  type="button"
                  className="dept-head-sla-btn dept-head-sla-btn-cancel"
                  onClick={handleCloseResolutionModal}
                  disabled={approvingEscalation}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="dept-head-sla-btn dept-head-sla-btn-approve"
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

export default DeptHeadDashboard;
