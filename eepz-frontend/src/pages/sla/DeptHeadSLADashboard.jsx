import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Calendar,
  CheckCircle,
  AlertCircle,
  Eye,
  X,
  Search,
  Lock,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import slaService from "../../services/sla/slaService";
import Breadcrumb from "../../components/sla/common/Breadcrumbs";
import CustomDropdown from "../../components/project-management/common/CustomDropdown";
import PaginationFooter from "../../components/project-management/common/PaginationFooter";
import "../../styles/sla/components/DeptHeadSLADashboard.css";
 
const DeptHeadSLADashboard = () => {
  const navigate = useNavigate();
 
  const [allL2Escalations, setAllL2Escalations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
 
  const [activeTab, setActiveTab] = useState("all");
 
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
 
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("all");
 
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [selectedEscalation, setSelectedEscalation] = useState(null);
  const [resolutionComments, setResolutionComments] = useState("");
  const [approvingEscalation, setApprovingEscalation] = useState(false);
 
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
 
  const statusFilterRef = useRef(null);
  const periodFilterRef = useRef(null);
 
  useEffect(() => {
    fetchAllData();
  }, []);
 
  useEffect(() => {
    setCurrentPage(1);
  }, [
    activeSearchTerm,
    selectedStatus,
    selectedPeriod,
    activeTab,
    itemsPerPage,
  ]);
 
  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
 
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.empId) {
        toast.error("User not found");
        setLoading(false);
        return;
      }
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
 
      if (response?.success) {
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
 
  const periodOptions = useMemo(() => {
    const unique = Array.from(
      new Set(allL2Escalations.map((e) => e.period).filter(Boolean)),
    );
    unique.sort();
    return [{ value: "all", label: "All Periods" }].concat(
      unique.map((p) => ({ value: p, label: p })),
    );
  }, [allL2Escalations]);
 
  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "inprogress", label: "In Progress" },
    { value: "resolved", label: "Resolved" },
    { value: "rejected", label: "Rejected" },
  ];
 
  const filteredL2Escalations = useMemo(() => {
    let filtered = [...allL2Escalations];
 
    if (activeTab !== "all") {
      filtered = filtered.filter(
        (e) => e.escalationStatus.toLowerCase() === activeTab,
      );
    }
 
    if (selectedPeriod !== "all") {
      filtered = filtered.filter((e) => e.period === selectedPeriod);
    }
 
    if (selectedStatus !== "all") {
      filtered = filtered.filter(
        (e) => e.escalationStatus.toLowerCase() === selectedStatus,
      );
    }
 
    if (activeSearchTerm.trim()) {
      const query = activeSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.employeeName?.toLowerCase().includes(query) ||
          e.managerName?.toLowerCase().includes(query) ||
          e.reason?.toLowerCase().includes(query),
      );
    }
 
    return filtered;
  }, [
    allL2Escalations,
    activeTab,
    selectedPeriod,
    selectedStatus,
    activeSearchTerm,
  ]);
 
  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    setActiveSearchTerm(searchTerm.trim());
  };
 
  const handleClearSearch = () => {
    setSearchTerm("");
    setActiveSearchTerm("");
  };
 
  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };
 
  const clearFilters = () => {
    setSearchTerm("");
    setActiveSearchTerm("");
    setSelectedStatus("all");
    setSelectedPeriod("all");
    setActiveTab("all");
    toast.info("Filters cleared");
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
 
    const openCount = filteredByPeriod.filter(
      (e) =>
        e.escalationStatus === "Pending" || e.escalationStatus === "InProgress",
    ).length;
 
    const approvedCount = filteredByPeriod.filter(
      (e) => e.escalationStatus === "Resolved",
    ).length;
 
    const closedCount = filteredByPeriod.filter(
      (e) => e.escalationStatus === "Rejected",
    ).length;
 
    return {
      total: filteredByPeriod.length,
      open: openCount,
      approved: approvedCount,
      closed: closedCount,
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
 
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredL2Escalations.slice(start, start + itemsPerPage);
  }, [filteredL2Escalations, currentPage, itemsPerPage]);
 
  if (loading) {
    return (
      <div className="dh-sla-loading-wrapper">
        <div className="dh-sla-loading-content">
          <div className="dh-sla-spinner-border" role="status">
            <span className="dh-sla-sr-only">Loading...</span>
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
 
      <div className="dh-sla-stats-grid">
        <div className="dh-sla-stat-card">
          <div className="dh-sla-stat-icon-wrapper dh-sla-stat-icon-total">
            <FileText size={24} />
          </div>
          <div className="dh-sla-stat-content">
            <h3 className="dh-sla-stat-value">{stats.total}</h3>
            <p className="dh-sla-stat-label">TOTAL SLA</p>
          </div>
        </div>
 
        <div className="dh-sla-stat-card">
          <div className="dh-sla-stat-icon-wrapper dh-sla-stat-icon-open">
            <Clock size={24} />
          </div>
          <div className="dh-sla-stat-content">
            <h3 className="dh-sla-stat-value">{stats.open}</h3>
            <p className="dh-sla-stat-label">OPEN</p>
          </div>
        </div>
 
        <div className="dh-sla-stat-card">
          <div className="dh-sla-stat-icon-wrapper dh-sla-stat-icon-approved">
            <CheckCircle size={24} />
          </div>
          <div className="dh-sla-stat-content">
            <h3 className="dh-sla-stat-value">{stats.approved}</h3>
            <p className="dh-sla-stat-label">APPROVED</p>
          </div>
        </div>
 
        <div className="dh-sla-stat-card">
          <div className="dh-sla-stat-icon-wrapper dh-sla-stat-icon-closed">
            <Lock size={24} />
          </div>
          <div className="dh-sla-stat-content">
            <h3 className="dh-sla-stat-value">{stats.closed}</h3>
            <p className="dh-sla-stat-label">CLOSED</p>
          </div>
        </div>
      </div>
 
      <div className="dh-sla-filters-card">
        <div className="dh-sla-filters-row">
          <div className="dh-sla-search-wrapper">
            <div className="dh-sla-search-icon">
              <Search size={16} />
            </div>
 
            <input
              type="text"
              className="dh-sla-search-input"
              placeholder="Search by employee name, manager or reason"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyPress}
            />
 
            <div className="dh-sla-search-separator" />
 
            {activeSearchTerm ? (
              <button
                type="button"
                className="dh-sla-search-action-btn dh-sla-search-clear-btn"
                onClick={handleClearSearch}
              >
                <X size={14} /> Cancel
              </button>
            ) : (
              <button
                type="button"
                className="dh-sla-search-action-btn dh-sla-search-btn"
                onClick={handleSearch}
              >
                <Search size={12} /> Search
              </button>
            )}
          </div>
 
          <div className="dh-sla-filter-status" ref={statusFilterRef}>
            <CustomDropdown
              label=""
              name="statusFilter"
              value={selectedStatus}
              onChange={(_, v) => setSelectedStatus(v)}
              options={statusOptions}
              placeholder="All Status"
              anchorRef={statusFilterRef}
              align="left"
              className="dh-sla-dd"
            />
          </div>
 
          <div className="dh-sla-filter-period" ref={periodFilterRef}>
            <CustomDropdown
              label=""
              name="periodFilter"
              value={selectedPeriod}
              onChange={(_, v) => setSelectedPeriod(v)}
              options={periodOptions}
              placeholder="All Periods"
              anchorRef={periodFilterRef}
              align="left"
              className="dh-sla-dd"
            />
          </div>
        </div>
      </div>
 
      <div className="dh-sla-tabs-wrapper"></div>
 
      <div className="dh-sla-table-wrapper">
        <div className="dh-sla-table-responsive">
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
 
        <PaginationFooter
          totalItems={filteredL2Escalations.length}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={(size) => {
            setItemsPerPage(size);
            setCurrentPage(1);
          }}
        />
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
 
                  <div className="dh-sla-info-row">
                    <span className="dh-sla-info-label">Status:</span>
                    <span className="dh-sla-info-value">
                      {selectedEscalation.escalationStatus}
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
 
 