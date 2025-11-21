// src/pages/sla/DeptHeadSLADashboard.jsx - REDESIGNED WITH PROPER CSS CLASSES
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
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import slaService from "../../services/sla/slaService";
import Breadcrumb from "../../components/sla/common/Breadcrumbs";
import "../../styles/sla/DeptHeadSLADashboard.css";

const DeptHeadSLADashboard = () => {
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

  // ============= LIFECYCLE HOOKS =============
  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [selectedPeriod, searchQuery, selectedStatus, allL2Escalations]);

  // ============= DATA FETCHING =============
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
          daysLeft: e.daysUntilDeadline || 0,
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

  // ============= FILTERING =============
  const applyFilters = () => {
    let filtered = [...allL2Escalations];

    // Period filter
    if (selectedPeriod !== "all") {
      filtered = filtered.filter((e) => e.period === selectedPeriod);
    }

    // Status filter
    if (selectedStatus !== "all") {
      filtered = filtered.filter(
        (e) => e.escalationStatus.toLowerCase() === selectedStatus
      );
    }

    // Search filter
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

  // ============= HELPER FUNCTIONS =============
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
      "avatar-pink",
      "avatar-purple",
      "avatar-deep-purple",
      "avatar-indigo",
      "avatar-blue",
      "avatar-teal",
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
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: "L2 Escalations" }]} />

      {/* Error Alert */}
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

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-lg-3 col-md-6">
          <div className="stat-card card">
            <div className="card-body">
              <div className="stat-icon stat-icon-blue">
                <Users size={28} color="#1976D2" />
              </div>
              <div className="stat-content">
                <h3>{stats.total}</h3>
                <p>Total Escalations</p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="stat-card card">
            <div className="card-body">
              <div className="stat-icon stat-icon-green">
                <CheckCircle size={28} color="#388E3C" />
              </div>
              <div className="stat-content">
                <h3>{stats.resolved}</h3>
                <p>Approved</p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="stat-card card">
            <div className="card-body">
              <div className="stat-icon stat-icon-orange">
                <Clock size={28} color="#F57C00" />
              </div>
              <div className="stat-content">
                <h3>{stats.pending}</h3>
                <p>Pending</p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="stat-card card">
            <div className="card-body">
              <div className="stat-icon stat-icon-red">
                <AlertTriangle size={28} color="#C62828" />
              </div>
              <div className="stat-content">
                <h3>{stats.rejected}</h3>
                <p>Rejected</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="search-filter-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-control"
            placeholder="Search escalations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="form-select filter-select"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="resolved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          className="form-select filter-select"
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
        >
          <option value="all">All Periods</option>
          <option value="Q4-2024">Q4 2024</option>
          <option value="Q1-2025">Q1 2025</option>
          <option value="Q2-2025">Q2 2025</option>
          <option value="Q3-2025">Q3 2025</option>
        </select>

        <button
          className="btn btn-outline-primary d-flex align-items-center gap-2"
          onClick={fetchAllData}
          style={{ borderRadius: "8px", height: "44px" }}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="table-card">
        <div className="table-responsive">
          <table className="escalations-table table table-hover">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Manager</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Submitted Date</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredL2Escalations.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <div className="table-empty-state">
                      <div className="empty-state-icon">
                        <Users size={40} color="#9CA3AF" />
                      </div>
                      <p className="empty-state-text">No escalations found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredL2Escalations.map((esc, index) => (
                  <tr key={esc.escalationId}>
                    <td>
                      <div className="employee-cell">
                        <div
                          className={`employee-avatar ${getAvatarClass(index)}`}
                        >
                          {getInitials(esc.employeeName)}
                        </div>
                        <div className="employee-info">
                          <div className="employee-name">
                            {esc.employeeName}
                          </div>
                          <div className="employee-email">
                            {esc.employeeEmail || "No email"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="manager-cell">{esc.managerName}</div>
                    </td>
                    <td>
                      <div className="reason-cell">
                        <div className="reason-title">{esc.reason}</div>
                        {esc.description && (
                          <div className="reason-description">
                            {esc.description.substring(0, 40)}
                            {esc.description.length > 40 ? "..." : ""}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`status-badge ${
                          esc.escalationStatus === "Pending"
                            ? "status-pending"
                            : esc.escalationStatus === "Resolved"
                            ? "status-resolved"
                            : "status-rejected"
                        }`}
                      >
                        {esc.escalationStatus}
                      </span>
                    </td>
                    <td>
                      <div className="date-cell">
                        {formatDate(esc.submittedAt)}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="action-btn btn-view"
                          onClick={() => handleViewDetails(esc.slaid)}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        {esc.escalationStatus === "Pending" && (
                          <button
                            className="action-btn btn-approve"
                            onClick={() => handleOpenResolutionModal(esc)}
                            title="Approve Escalation"
                          >
                            <CheckCircle size={16} />
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
          className="modal show d-block escalation-modal"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1055 }}
          onClick={handleCloseResolutionModal}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  <AlertTriangle
                    size={20}
                    color="#E01950"
                    className="me-2"
                    style={{ verticalAlign: "middle" }}
                  />
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
                <div className="info-box">
                  <div className="info-box-item">
                    <span className="info-box-label">Employee</span>
                    <div className="info-box-value">
                      {selectedEscalation.employeeName}
                    </div>
                  </div>
                  <div className="info-box-item">
                    <span className="info-box-label">
                      Manager (Escalated By)
                    </span>
                    <div className="info-box-value">
                      {selectedEscalation.managerName}
                    </div>
                  </div>
                  <div className="info-box-item">
                    <span className="info-box-label">Reason</span>
                    <div className="info-box-value">
                      {selectedEscalation.reason}
                    </div>
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
                    disabled={approvingEscalation}
                    style={{ borderRadius: "8px", resize: "none" }}
                  />
                  <small className="text-muted mt-2 d-block">
                    {resolutionComments.length}/500
                  </small>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseResolutionModal}
                  disabled={approvingEscalation}
                  style={{ borderRadius: "8px" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success d-flex align-items-center gap-2"
                  onClick={handleApproveEscalation}
                  disabled={approvingEscalation || !resolutionComments.trim()}
                  style={{ borderRadius: "8px" }}
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
