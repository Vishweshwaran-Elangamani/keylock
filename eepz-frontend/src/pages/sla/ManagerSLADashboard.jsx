import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Search,
  Filter,
  FileText,
  Send,
  Eye,
  Users,
  Clock,
  CheckCircle,
  Home,
  Zap,
  X,
} from "lucide-react";
import slaService, { dateHelpers } from "../../services/sla/slaService";
import ManagerEscalationModal from "../../components/sla/modals/ManagerEscalationModal";
import ResolveEscalationModal from "../../components/sla/modals/ResolveEscalationModal";
import { formatDate } from "../../utils/sla/dateFormatter";
import "../../styles/sla/ManagerSLADashboard.css";

const MgrSelect = ({ value, onChange, options }) => {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value) || options[0];

  return (
    <div className="mgr-select">
      <button
        type="button"
        className={`mgr-select-control ${open ? "open" : ""}`}
        onClick={() => setOpen((p) => !p)}
      >
        <span className="mgr-select-value">{selected.label}</span>
        <span className={`mgr-select-icon ${open ? "open" : ""}`}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <polyline
              points="6 9 12 15 18 9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {open && (
        <div className="mgr-select-menu">
          {options.map((opt) => (
            <div
              key={opt.value}
              className={`mgr-select-option ${
                opt.value === value ? "selected" : ""
              }`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const statusOptionsMy = [
  { value: "All", label: "All Status" },
  { value: "Open", label: "Open" },
  { value: "Closed", label: "Closed" },
  { value: "InProgress", label: "In Progress" },
];

const statusOptionsTeam = [
  { value: "All", label: "All Status" },
  { value: "Pending", label: "Pending" },
  { value: "InProgress", label: "In Progress" },
  { value: "Resolved", label: "Resolved" },
];

const complianceOptions = [
  { value: "All", label: "All Compliance" },
  { value: "OnTime", label: "On Time" },
  { value: "Breached", label: "Breached" },
  { value: "Extended", label: "Extended" },
];

const ManagerSLADashboard = () => {
  const navigate = useNavigate();

  const [mySLAs, setMySLAs] = useState([]);
  const [managerEscalations, setManagerEscalations] = useState([]);
  const [filteredSlas, setFilteredSlas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  // this is only used by Team Escalation table; My Escalation uses fixed 9
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [complianceFilter, setComplianceFilter] = useState("All");
  const [activeTab, setActiveTab] = useState("my-escalation");

  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedSLAForEscalation, setSelectedSLAForEscalation] =
    useState(null);
  const [selectedEscalationForResolve, setSelectedEscalationForResolve] =
    useState(null);
  const [deptHeads, setDeptHeads] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [
    mySLAs,
    managerEscalations,
    activeSearchTerm,
    statusFilter,
    complianceFilter,
    activeTab,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeSearchTerm, statusFilter, complianceFilter, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (!userData?.empId) {
        toast.error("User not found");
        setLoading(false);
        return;
      }

      if (userData.departmentId) {
        const deptHeadRes = await slaService.getDepartmentHeads(
          userData.departmentId
        );
        if (deptHeadRes?.success && Array.isArray(deptHeadRes.data)) {
          setDeptHeads(deptHeadRes.data);
        }
      }

      const escalationsRes = await slaService.getManagerEscalations(
        userData.empId
      );
      if (escalationsRes?.success && Array.isArray(escalationsRes.data)) {
        setManagerEscalations(escalationsRes.data);
      }

      const mySLAsRes = await slaService.getEmployeeSLAs(userData.empId);
      if (mySLAsRes?.success && Array.isArray(mySLAsRes.data)) {
        setMySLAs(mySLAsRes.data);
      }
    } catch (err) {
      console.error("Error loading data:", err);
      toast.error("Failed to load SLAs");
    } finally {
      setLoading(false);
    }
  };

  const getTabData = () => {
    if (activeTab === "team-escalation") return managerEscalations;
    return mySLAs;
  };

  const applyFilters = () => {
    let result = getTabData();

    if (activeTab === "my-escalation") {
      if (activeSearchTerm) {
        const term = activeSearchTerm.toLowerCase();
        result = result.filter(
          (sla) =>
            sla.employeeName?.toLowerCase().includes(term) ||
            sla.departmentName?.toLowerCase().includes(term) ||
            sla.slaid?.toString().includes(term) ||
            sla.slatype?.toLowerCase().includes(term) ||
            sla.assignedToName?.toLowerCase().includes(term)
        );
      }

      if (statusFilter !== "All") {
        result = result.filter((sla) => sla.status === statusFilter);
      }

      if (complianceFilter !== "All") {
        result = result.filter(
          (sla) => sla.complianceStatus === complianceFilter
        );
      }
    } else {
      if (activeSearchTerm) {
        const term = activeSearchTerm.toLowerCase();
        result = result.filter(
          (esc) =>
            esc.reason?.toLowerCase().includes(term) ||
            esc.employeeName?.toLowerCase().includes(term)
        );
      }

      if (statusFilter !== "All") {
        result = result.filter((esc) => esc.escalationStatus === statusFilter);
      }
    }

    setFilteredSlas(result);
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    setActiveSearchTerm(searchTerm.trim());
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setActiveSearchTerm("");
  };

  const calculateStats = () => ({
    total: mySLAs.length,
    open: mySLAs.filter((s) => s.status === "Open").length,
    inProgress: mySLAs.filter((s) => s.status === "InProgress").length,
    closed: mySLAs.filter((s) => s.status === "Closed").length,
  });

  const handleViewClick = (e, id) => {
    e.stopPropagation();
    navigate(`/sla/manager/details/${id}`);
  };

  const handleEscalateClick = (e, escalation) => {
    e.stopPropagation();
    setSelectedSLAForEscalation(escalation);
    setShowEscalationModal(true);
  };

  const handleEscalateToDeptHead = async (payload) => {
    try {
      const res = await slaService.escalateToDeptHead(payload);
      if (res.success) {
        toast.success("Escalated to Department Head successfully");
        setShowEscalationModal(false);
        setSelectedSLAForEscalation(null);
        loadData();
      }
    } catch (err) {
      toast.error("Escalation failed");
      throw err;
    }
  };

  const handleResolveClick = (e, escalation) => {
    e.stopPropagation();
    setSelectedEscalationForResolve(escalation);
    setShowResolveModal(true);
  };

  const handleResolveEscalation = async (payload) => {
    try {
      const res = await slaService.resolveEscalation(payload);
      if (res.success) {
        toast.success("Escalation resolved");
        setShowResolveModal(false);
        setSelectedEscalationForResolve(null);
        loadData();
      }
    } catch (err) {
      toast.error("Resolution failed");
    }
  };

  const handleRowClick = (id) => {
    navigate(`/sla/manager/details/${id}`);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setActiveSearchTerm("");
    setStatusFilter("All");
    setComplianceFilter("All");
    toast.info("Filters cleared");
  };

  const getStatusBadgeClass = (status) => {
    if (status === "Closed") return "mgr-sla-status-closed";
    if (status === "Open") return "mgr-sla-status-open";
    if (status === "InProgress") return "mgr-sla-status-inprogress";
    return "mgr-sla-status-open";
  };

  const stats = calculateStats();

  // pagination: team tab uses itemsPerPage; my tab fixed 9
  const isTeamTab = activeTab === "team-escalation";
  const pageSize = isTeamTab ? itemsPerPage : 9;

  const safeTotal = filteredSlas.length;
  const totalPages = Math.max(1, Math.ceil(safeTotal / pageSize));
  const startIndex =
    safeTotal === 0 ? 0 : (currentPage - 1) * pageSize;
  const endIndex =
    safeTotal === 0 ? 0 : Math.min(currentPage * pageSize, safeTotal);
  const paginatedData = filteredSlas.slice(startIndex, endIndex);

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
      <div className="mgr-sla-wrapper h-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div
            className="spinner-border text-primary"
            style={{ width: "3rem", height: "3rem" }}
          ></div>
          <p className="text-muted mt-3">Loading SLA data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mgr-sla-wrapper">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb mb-0 p-3 rounded mgr-sla-breadcrumb">
          <li className="breadcrumb-item">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("/manager/dashboard");
              }}
              className="mgr-sla-breadcrumb-link"
            >
              <Home size={14} /> Dashboard
            </a>
          </li>
          <li className="breadcrumb-item">
            <span className="mgr-sla-breadcrumb">SLA Compliance</span>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            <span className="mgr-sla-breadcrumb-active">Manager</span>
          </li>
        </ol>
      </nav>

      {/* Stats */}
      <div className="row g-3 mb-3">
        {[
          {
            label: "Total SLAs",
            value: stats.total,
            icon: Users,
            bgColor: "#EEF2FF",
            iconColor: "#3B82F6",
          },
          {
            label: "Open",
            value: stats.open,
            icon: Clock,
            bgColor: "#E0E7FF",
            iconColor: "#4F46E5",
          },
          {
            label: "In Progress",
            value: stats.inProgress,
            icon: Zap,
            bgColor: "#FEF3C7",
            iconColor: "#D97706",
          },
          {
            label: "Closed",
            value: stats.closed,
            icon: CheckCircle,
            bgColor: "#DCFCE7",
            iconColor: "#16A34A",
          },
        ].map(({ label, value, icon: Icon, bgColor, iconColor }) => (
          <div key={label} className="col-lg-3 col-md-6 col-sm-6">
            <div className="mgr-sla-stat-card">
              <div
                className="mgr-sla-stat-icon"
                style={{ backgroundColor: bgColor }}
              >
                <Icon size={28} color={iconColor} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="mgr-sla-stat-value">{value}</h3>
                <p className="mgr-sla-stat-label">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mgr-sla-filters-card">
        <div className="row g-3 align-items-center">
          <div className="col-lg-4 col-md-6">
            <div className="mgr-sla-search-wrapper">
              <Search size={16} className="mgr-sla-search-icon" />
              <input
                type="text"
                className="form-control mgr-sla-search-input"
                placeholder={
                  activeTab === "team-escalation"
                    ? "Search by reason or employee..."
                    : "Search by SLA type, assigned to, or department..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleSearchKeyPress}
              />
              {activeSearchTerm ? (
                <button
                  type="button"
                  className="mgr-sla-search-cta mgr-sla-search-cta-cancel"
                  onClick={handleClearSearch}
                >
                  <X size={16} />
                  Cancel
                </button>
              ) : (
                <button
                  type="button"
                  className="mgr-sla-search-cta mgr-sla-search-cta-search"
                  onClick={handleSearch}
                >
                  <Search size={14} />
                  Search
                </button>
              )}
            </div>
          </div>

          <div className="col-lg-2 col-md-6">
            <MgrSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={
                activeTab === "team-escalation"
                  ? statusOptionsTeam
                  : statusOptionsMy
              }
            />
          </div>

          {activeTab === "my-escalation" && (
            <div className="col-lg-2 col-md-6">
              <MgrSelect
                value={complianceFilter}
                onChange={setComplianceFilter}
                options={complianceOptions}
              />
            </div>
          )}

          <div
            className={`col-lg-${
              activeTab === "my-escalation" ? "4" : "6"
            } col-md-12`}
          >
            <div className="mgr-sla-filter-actions">
              <button
                className="btn btn-outline-secondary mgr-sla-btn-clear"
                onClick={clearFilters}
              >
                <Filter size={16} />
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mgr-sla-tabs-wrapper">
        <div className="mgr-sla-tabs-container">
          {[
            { key: "my-escalation", label: "My Escalation" },
            { key: "team-escalation", label: "Team Escalation" },
          ].map(({ key, label }) => (
            <button
              key={key}
              className={`mgr-sla-tab-pill ${
                activeTab === key ? "active" : ""
              }`}
              onClick={() => setActiveTab(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="mgr-sla-table-wrapper">
        {filteredSlas.length === 0 ? (
          <div className="mgr-sla-empty-state-standalone">
            <FileText size={64} className="mgr-sla-empty-icon" />
            <p className="mgr-sla-empty-text">
              No{" "}
              {activeTab === "team-escalation" ? "team escalations" : "SLAs"}{" "}
              found
            </p>
            {searchTerm ||
            statusFilter !== "All" ||
            complianceFilter !== "All" ? (
              <button
                className="btn btn-outline-primary mt-2"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            ) : null}
          </div>
        ) : activeTab === "my-escalation" ? (
          <>
            <div className="row g-3">
              {paginatedData.map((sla) => {
                const daysRemaining = dateHelpers.daysRemaining(sla.deadline);
                return (
                  <div key={sla.slaid} className="col-lg-4 col-md-6">
                    <div className="mgr-escalation-card">
                      <div className="mgr-escalation-card-header">
                        <div className="mgr-escalation-icon-wrapper">
                          <Zap size={24} className="mgr-escalation-icon" />
                        </div>
                        <div className="mgr-escalation-title-wrapper">
                          <h6 className="mgr-escalation-title">
                            {sla.slatype || "Sample SLA"}
                          </h6>
                        </div>
                        <span
                          className={`mgr-escalation-status-badge ${getStatusBadgeClass(
                            sla.status
                          )}`}
                        >
                          {sla.status === "InProgress"
                            ? "INPROGRESS"
                            : sla.status?.toUpperCase()}
                        </span>
                      </div>

                      <div className="mgr-escalation-card-body">
                        <div className="mgr-escalation-info-row">
                          <span className="mgr-escalation-label">Deadline</span>
                          <span className="mgr-escalation-value">
                            {dateHelpers.formatDeadline(sla.deadline)}
                          </span>
                        </div>

                        <div className="mgr-escalation-info-row">
                          <span className="mgr-escalation-label">
                            Days Remaining
                          </span>
                          <span
                            className={`mgr-escalation-value ${
                              daysRemaining < 0
                                ? "text-danger"
                                : daysRemaining <= 3
                                ? "text-warning"
                                : "text-success"
                            }`}
                          >
                            {Math.abs(daysRemaining)} days
                          </span>
                        </div>

                        <div className="mgr-escalation-info-row">
                          <span className="mgr-escalation-label">
                            Assigned To
                          </span>
                          <span className="mgr-escalation-value mgr-text-truncate">
                            {sla.assignedToName ? (
                              <span className="mgr-sla-assigned-name">
                                {sla.assignedToName}
                              </span>
                            ) : (
                              <span className="mgr-sla-not-assigned">
                                Not assigned
                              </span>
                            )}
                          </span>
                        </div>

                        {sla.complianceStatus && (
                          <div className="mgr-escalation-info-row">
                            <span className="mgr-escalation-label">
                              Compliance
                            </span>
                            <span
                              className={`mgr-compliance-badge ${
                                sla.complianceStatus === "OnTime"
                                  ? "mgr-compliance-ontime"
                                  : "mgr-compliance-breached"
                              }`}
                            >
                              {sla.complianceStatus}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mgr-escalation-card-footer">
                        <button
                          className="mgr-escalation-view-btn"
                          onClick={() => handleRowClick(sla.slaid)}
                        >
                          <Eye size={16} />
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* if you want card pagination controls, you can add them here */}
          </>
        ) : (
          <>
            <div className="mgr-sla-table-container hr-sla-table-container">
              <div className="table-responsive">
                <table className="table table-hover mb-0 mgr-sla-table">
                  <thead className="mgr-sla-table-header">
                    <tr>
                      <th>Employee</th>
                      <th>Reason</th>
                      <th>Level</th>
                      <th>Status</th>
                      <th>Submitted</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((esc) => (
                      <tr
                        key={esc.escalationId}
                        className="mgr-sla-clickable-row"
                      >
                        <td onClick={() => handleRowClick(esc.slaid)}>
                          <div className="mgr-sla-employee-cell">
                            <div className="mgr-sla-employee-info">
                              <div className="mgr-sla-employee-name">
                                {esc.employeeName || "—"}
                              </div>
                              <div className="mgr-sla-employee-email">
                                {esc.employeeEmail || "No email"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td onClick={() => handleRowClick(esc.slaid)}>
                          {esc.reason || "—"}
                        </td>
                        <td onClick={() => handleRowClick(esc.slaid)}>
                          <span className="mgr-sla-badge mgr-sla-badge-info">
                            {esc.escalationLevel}
                          </span>
                        </td>
                        <td onClick={() => handleRowClick(esc.slaid)}>
                          <span
                            className={`mgr-sla-badge ${
                              esc.escalationStatus === "Resolved"
                                ? "mgr-sla-badge-success"
                                : esc.escalationStatus === "InProgress"
                                ? "mgr-sla-badge-warning"
                                : "mgr-sla-badge-primary"
                            }`}
                          >
                            {esc.escalationStatus}
                          </span>
                        </td>
                        <td onClick={() => handleRowClick(esc.slaid)}>
                          {formatDate(esc.submittedAt)}
                        </td>
                        <td>
                          <div className="mgr-sla-actions">
                            <button
                              className="btn btn-sm mgr-sla-action-btn mgr-sla-action-view"
                              onClick={(e) => handleViewClick(e, esc.slaid)}
                              title="View details"
                            >
                              <Eye size={16} />
                            </button>
                            {esc.escalationStatus !== "Resolved" && (
                              <>
                                <button
                                  className="btn btn-sm mgr-sla-action-btn mgr-sla-action-escalate"
                                  onClick={(e) => handleEscalateClick(e, esc)}
                                  title="Escalate to Department Head"
                                >
                                  <Send size={16} />
                                </button>
                                <button
                                  className="btn btn-sm mgr-sla-action-btn mgr-sla-action-resolve"
                                  onClick={(e) =>
                                    handleResolveClick(e, esc)
                                  }
                                  title="Resolve escalation"
                                >
                                  <CheckCircle size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

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
                      Showing {safeTotal === 0 ? 0 : startIndex + 1} to{" "}
                      {endIndex} of {safeTotal} entries
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
          </>
        )}
      </div>

      {/* Modals */}
      {showEscalationModal && selectedSLAForEscalation && (
        <ManagerEscalationModal
          review={selectedSLAForEscalation}
          onClose={() => setShowEscalationModal(false)}
          onEscalate={handleEscalateToDeptHead}
          deptHeads={deptHeads}
        />
      )}

      {showResolveModal && selectedEscalationForResolve && (
        <ResolveEscalationModal
          escalation={selectedEscalationForResolve}
          onClose={() => setShowResolveModal(false)}
          onResolve={handleResolveEscalation}
        />
      )}
    </div>
  );
};

export default ManagerSLADashboard;
