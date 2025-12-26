import React, { useState, useEffect, useMemo } from "react";
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
import "../../styles/sla/components/ManagerSLADashboard.css";

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
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <polyline
              points="6 9 12 15 18 9"
              stroke="#9CA3AF"
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
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
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

  const filteredSlas = useMemo(() => {
    let result =
      activeTab === "team-escalation" ? managerEscalations : mySLAs;

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

    return result;
  }, [
    mySLAs,
    managerEscalations,
    activeSearchTerm,
    statusFilter,
    complianceFilter,
    activeTab,
  ]);

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

  const isTeamTab = activeTab === "team-escalation";
  const pageSize = isTeamTab ? itemsPerPage : 9;

  const safeTotal = filteredSlas.length;
  const totalPages = Math.max(1, Math.ceil(safeTotal / pageSize));
  
  const validCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = safeTotal === 0 ? 0 : (validCurrentPage - 1) * pageSize;
  const endIndex =
    safeTotal === 0 ? 0 : Math.min(validCurrentPage * pageSize, safeTotal);
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
    } else if (validCurrentPage <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i);
      pages.push("...");
      pages.push(totalPages);
    } else if (validCurrentPage >= totalPages - 2) {
      pages.push(1);
      pages.push("...");
      for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push("...");
      for (let i = validCurrentPage - 1; i <= validCurrentPage + 1; i++)
        pages.push(i);
      pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  if (loading) {
    return (
      <div className="mgr-sla-wrapper mgr-sla-loading-wrapper">
        <div className="mgr-sla-loading-content">
          <div className="mgr-sla-spinner"></div>
          <p className="mgr-sla-loading-text">Loading SLA data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mgr-sla-wrapper">
      <nav aria-label="breadcrumb" className="mgr-sla-breadcrumb-nav">
        <ol className="mgr-sla-breadcrumb-list">
          <li className="mgr-sla-breadcrumb-item">
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
            /
          </li>
          <li className="mgr-sla-breadcrumb-item">
            <span className="mgr-sla-breadcrumb">SLA Compliance</span>
          </li>
          /
          <li className="mgr-sla-breadcrumb-item mgr-sla-breadcrumb-item-active">
            <span className="mgr-sla-breadcrumb-active">Manager</span>
          </li>
        </ol>
      </nav>

      <div className="mgr-sla-stats-grid">
        {[
          {
            label: "Total SLAs",
            value: stats.total,
            icon: Users,
            bgColor: "mgr-sla-stat-bg-total",
            iconColor: "mgr-sla-stat-icon-total",
          },
          {
            label: "Open",
            value: stats.open,
            icon: Clock,
            bgColor: "mgr-sla-stat-bg-open",
            iconColor: "mgr-sla-stat-icon-open",
          },
          {
            label: "In Progress",
            value: stats.inProgress,
            icon: Zap,
            bgColor: "mgr-sla-stat-bg-inprogress",
            iconColor: "mgr-sla-stat-icon-inprogress",
          },
          {
            label: "Closed",
            value: stats.closed,
            icon: CheckCircle,
            bgColor: "mgr-sla-stat-bg-closed",
            iconColor: "mgr-sla-stat-icon-closed",
          },
        ].map(({ label, value, icon: Icon, bgColor, iconColor }) => (
          <div key={label} className="mgr-sla-stat-col">
            <div className="mgr-sla-stat-card">
              <div className={`mgr-sla-stat-icon-wrapper ${bgColor}`}>
                <Icon
                  className={`mgr-sla-stat-icon ${iconColor}`}
                  size={28}
                  strokeWidth={2.5}
                />
              </div>
              <div className="mgr-sla-stat-text">
                <h3 className="mgr-sla-stat-value">{value}</h3>
                <p className="mgr-sla-stat-label">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mgr-sla-filters-card">
        <div className="mgr-sla-filters-row">
          <div className="mgr-sla-filter-col-search">
            <div className="mgr-sla-search-wrapper">
              <Search size={16} className="mgr-sla-search-icon" />
              <input
                type="text"
                className="mgr-sla-search-input"
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

          <div className="mgr-sla-filter-col-status">
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
            <div className="mgr-sla-filter-col-compliance">
              <MgrSelect
                value={complianceFilter}
                onChange={setComplianceFilter}
                options={complianceOptions}
              />
            </div>
          )}

          <div
            className={`mgr-sla-filter-col-actions ${
              activeTab === "my-escalation"
                ? "mgr-sla-filter-col-actions-narrow"
                : ""
            }`}
          >
            <div className="mgr-sla-filter-actions">
              <button className="mgr-sla-btn-clear" onClick={clearFilters}>
                <Filter size={16} />
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

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

      {filteredSlas.length === 0 ? (
        <div className="mgr-sla-empty-state-standalone">
          <FileText size={64} className="mgr-sla-empty-icon" />
          <p className="mgr-sla-empty-text">
            No {activeTab === "team-escalation" ? "team escalations" : "SLAs"}{" "}
            found
          </p>
          {searchTerm ||
          statusFilter !== "All" ||
          complianceFilter !== "All" ? (
            <button
              className="mgr-sla-btn-clear-filters-empty"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          ) : null}
        </div>
      ) : activeTab === "my-escalation" ? (
        <>
          <div className="mgr-sla-escalation-grid">
            {paginatedData.map((sla) => {
              const daysRemaining = dateHelpers.daysRemaining(sla.deadline);
              return (
                <div key={sla.slaid} className="mgr-sla-escalation-col">
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
                              ? "mgr-escalation-value-danger"
                              : daysRemaining <= 3
                              ? "mgr-escalation-value-warning"
                              : "mgr-escalation-value-success"
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
        </>
      ) : (
        <>
          <div className="mgr-sla-table-wrapper">
            <div className="mgr-sla-table-container">
              <div className="mgr-sla-table-responsive">
                <table className="mgr-sla-table">
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
                              className="mgr-sla-action-btn mgr-sla-action-view"
                              onClick={(e) => handleViewClick(e, esc.slaid)}
                              title="View details"
                            >
                              <Eye size={16} />
                            </button>
                            {esc.escalationStatus !== "Resolved" && (
                              <>
                                <button
                                  className="mgr-sla-action-btn mgr-sla-action-escalate"
                                  onClick={(e) => handleEscalateClick(e, esc)}
                                  title="Escalate to Department Head"
                                >
                                  <Send size={16} />
                                </button>
                                <button
                                  className="mgr-sla-action-btn mgr-sla-action-resolve"
                                  onClick={(e) => handleResolveClick(e, esc)}
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
                <div className="mgr-sla-pagination-footer">
                  <div className="mgr-sla-pagination-left">
                    <span className="mgr-sla-pagination-text">Show</span>
                    <select
                      className="mgr-sla-pagination-dropdown"
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
                    <span className="mgr-sla-pagination-text">entries</span>
                  </div>

                  <div className="mgr-sla-pagination-center">
                    <span className="mgr-sla-pagination-status">
                      Showing {safeTotal === 0 ? 0 : startIndex + 1} to{" "}
                      {endIndex} of {safeTotal} entries
                    </span>
                  </div>

                  <div className="mgr-sla-pagination-right">
                    <ul className="mgr-sla-pagination-list">
                      <li
                        className={`mgr-sla-page-item ${
                          validCurrentPage === 1 ? "disabled" : ""
                        }`}
                      >
                        <button
                          className="mgr-sla-page-link mgr-sla-page-arrow"
                          onClick={() => goToPage(validCurrentPage - 1)}
                          disabled={validCurrentPage === 1}
                        >
                          <span className="mgr-sla-arrow-icon">‹</span>
                        </button>
                      </li>

                      {getPageNumbers().map((page, idx) =>
                        page === "..." ? (
                          <li
                            key={`ellipsis-${idx}`}
                            className="mgr-sla-page-item disabled"
                          >
                            <span className="mgr-sla-page-link">…</span>
                          </li>
                        ) : (
                          <li
                            key={page}
                            className={`mgr-sla-page-item ${
                              validCurrentPage === page ? "active" : ""
                            }`}
                          >
                            <button
                              className="mgr-sla-page-link"
                              onClick={() => goToPage(page)}
                            >
                              {page}
                            </button>
                          </li>
                        )
                      )}

                      <li
                        className={`mgr-sla-page-item ${
                          validCurrentPage === totalPages ? "disabled" : ""
                        }`}
                      >
                        <button
                          className="mgr-sla-page-link mgr-sla-page-arrow"
                          onClick={() => goToPage(validCurrentPage + 1)}
                          disabled={validCurrentPage === totalPages}
                        >
                          <span className="mgr-sla-arrow-icon">›</span>
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

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
