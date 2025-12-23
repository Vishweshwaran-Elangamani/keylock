import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Calendar,
  CheckCircle,
  AlertCircle,
  Eye,
  Search,
  X,
  Clock,
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [selectedPeriod, searchQuery, selectedStatus, activeTab, allL2Escalations]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStatus, activeTab, selectedPeriod]);

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

        const processed = escalations.map((e) => {
          const normalizedStatus = e.escalationStatus || "Pending";

          return {
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
            escalationStatus: normalizedStatus,
            submittedAt: e.submittedAt,
            period: e.reviewCycle || "Q1-2025",
          };
        });

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
    if (
      event.target.closest("button") ||
      event.target.tagName === "BUTTON" ||
      event.target.closest(".dh-sla-actions")
    ) {
      return;
    }
    handleViewDetails(slaid);
  };

  const handleOpenResolutionModal = (escalation, event) => {
    event.stopPropagation();
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
        toast.error(response.message || "Failed to approve escalation");
      }
    } catch (err) {
      console.error("Error approving escalation:", err);
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
      pending: filteredByPeriod.filter(
        (e) =>
          e.escalationStatus === "Pending" ||
          e.escalationStatus === "InProgress"
      ).length,
      resolved: filteredByPeriod.filter(
        (e) => e.escalationStatus === "Resolved"
      ).length,
      rejected: filteredByPeriod.filter(
        (e) => e.escalationStatus === "Rejected"
      ).length,
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const canApprove = (escalation) => {
    const status = escalation.escalationStatus;
    return status === "Pending" || status === "InProgress";
  };

  const stats = calculateStats();

  // Pagination helpers
  const safeTotal = filteredL2Escalations.length;
  const totalPages = Math.max(1, Math.ceil(safeTotal / itemsPerPage));
  const startIndex = safeTotal === 0 ? 0 : (currentPage - 1) * itemsPerPage;
  const endIndex =
    safeTotal === 0 ? 0 : Math.min(currentPage * itemsPerPage, safeTotal);
  const paginatedData = filteredL2Escalations.slice(startIndex, endIndex);

  const goToPage = (page) => {
    const p = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(p);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i);
      pages.push("...");
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1);
      pages.push("...");
      for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push("...");
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
      pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

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
      <Breadcrumb
        items={[{ label: "SLA Compliance" }, { label: "Department Head" }]}
      />

      {error && (
        <div className="dh-sla-error-alert">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="dh-sla-error-close">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="dh-sla-stats-grid">
        <div className="dh-sla-stat-card">
          <div
            className="dh-sla-stat-icon-wrapper"
            style={{ backgroundColor: "#E8F1FF" }}
          >
            <FileText size={24} style={{ color: "#5B93FF" }} />
          </div>
          <div className="dh-sla-stat-content">
            <h3 className="dh-sla-stat-value">{stats.total}</h3>
            <p className="dh-sla-stat-label">TOTAL MOMS</p>
          </div>
        </div>

        <div className="dh-sla-stat-card">
          <div
            className="dh-sla-stat-icon-wrapper"
            style={{ backgroundColor: "#D1FAE5" }}
          >
            <Calendar size={24} style={{ color: "#10B981" }} />
          </div>
          <div className="dh-sla-stat-content">
            <h3 className="dh-sla-stat-value">{stats.resolved}</h3>
            <p className="dh-sla-stat-label">THIS MONTH</p>
          </div>
        </div>

        <div className="dh-sla-stat-card">
          <div
            className="dh-sla-stat-icon-wrapper"
            style={{ backgroundColor: "#FEF3C7" }}
          >
            <CheckCircle size={24} style={{ color: "#F59E0B" }} />
          </div>
          <div className="dh-sla-stat-content">
            <h3 className="dh-sla-stat-value">{stats.pending}</h3>
            <p className="dh-sla-stat-label">ACTION ITEMS</p>
          </div>
        </div>

        <div className="dh-sla-stat-card">
          <div
            className="dh-sla-stat-icon-wrapper"
            style={{ backgroundColor: "#FEE2E2" }}
          >
            <AlertCircle size={24} style={{ color: "#EF4444" }} />
          </div>
          <div className="dh-sla-stat-content">
            <h3 className="dh-sla-stat-value">{stats.rejected}</h3>
            <p className="dh-sla-stat-label">OVERDUE</p>
          </div>
        </div>
      </div>

      {/* Table with HR-style pagination */}
      <div className="dh-sla-table-wrapper hr-sla-table-container">
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
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="dh-sla-table-empty">
                    <FileText size={48} className="dh-sla-empty-icon" />
                    <p className="dh-sla-empty-text">No escalations found</p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((esc) => (
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
                      <div className="dh-sla-manager-name">
                        {esc.managerName}
                      </div>
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
                          esc.escalationStatus === "Pending" ||
                          esc.escalationStatus === "InProgress"
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
                      <div className="dh-sla-date">
                        {formatDate(esc.submittedAt)}
                      </div>
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
                        {canApprove(esc) && (
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

        {/* HR-style Pagination Footer */}
        {safeTotal > 0 && (
          <div className="hr-sla-pagination-footer">
            <div className="hr-sla-pagination-left">
              <span className="hr-sla-pagination-text">Show</span>
              <select
                className="hr-sla-pagination-dropdown"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
              <span className="hr-sla-pagination-text">entries</span>
            </div>

            <div className="hr-sla-pagination-center">
              <span className="hr-sla-pagination-status">
                Showing {safeTotal === 0 ? 0 : startIndex + 1} to {endIndex} of{" "}
                {safeTotal} entries
              </span>
            </div>

            <div className="hr-sla-pagination-right">
              <ul className="hr-sla-pagination-list">
                <li
                  className={`hr-sla-page-item ${
                    currentPage === 1 ? "disabled" : ""
                  }`}
                >
                  <button
                    className="hr-sla-page-link hr-sla-page-arrow"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <span className="hr-sla-arrow-icon">‹</span>
                  </button>
                </li>

                {getPageNumbers().map((page, idx) =>
                  page === "..." ? (
                    <li
                      key={`ellipsis-${idx}`}
                      className="hr-sla-page-item disabled"
                    >
                      <span className="hr-sla-page-link">…</span>
                    </li>
                  ) : (
                    <li
                      key={page}
                      className={`hr-sla-page-item ${
                        currentPage === page ? "active" : ""
                      }`}
                    >
                      <button
                        className="hr-sla-page-link"
                        onClick={() => goToPage(page)}
                      >
                        {page}
                      </button>
                    </li>
                  )
                )}

                <li
                  className={`hr-sla-page-item ${
                    currentPage === totalPages ? "disabled" : ""
                  }`}
                >
                  <button
                    className="hr-sla-page-link hr-sla-page-arrow"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <span className="hr-sla-arrow-icon">›</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Resolution Modal */}
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
                  <div className="dh-sla-info-row">
                    <span className="dh-sla-info-label">Status:</span>
                    <span className="dh-sla-info-value">
                      {selectedEscalation.escalationStatus}
                    </span>
                  </div>
                </div>

                <div className="dh-sla-form-group">
                  <label className="dh-sla-form-label">
                    Approval Comments{" "}
                    <span className="dh-sla-required">*</span>
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
