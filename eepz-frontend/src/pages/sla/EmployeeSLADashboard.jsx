import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  FileText,
  AlertCircle,
  Eye,
  Zap,
  Grid,
  List,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import slaService, {
  dateHelpers,
} from "../../services/sla/slaService";
import Breadcrumb from "../../components/sla/common/Breadcrumbs";
import "../../styles/sla/components/EmployeeSLADashboard.css";

const EmployeeSLADashboard = () => {
  const navigate = useNavigate();

  const [slas, setSlas] = useState([]);
  const [filteredSLAs, setFilteredSLAs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState("table");
  const [user, setUser] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  useEffect(() => {
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (!userData?.empId) {
        setError("User not found. Please login again.");
        setLoading(false);
        return;
      }
      setUser(userData);
      fetchSLAs(userData.empId);
    } catch (err) {
      setError("Failed to load user information");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    filterSLAs();
  }, [activeTab, slas]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, slas.length, itemsPerPage]);

  const fetchSLAs = useCallback(
    async (empId) => {
      setLoading(true);
      setRefreshing(true);
      setError(null);
      try {
        if (!empId) throw new Error("Employee ID not found");

        const response = await slaService.getEmployeeSLAs(empId);
        if (response?.success) {
          let slasData;
          if (Array.isArray(response.data)) {
            slasData = response.data;
          } else if (response.data && typeof response.data === "object") {
            slasData = response.data;
          } else {
            slasData = [];
          }

          const processed = slasData.map((sla, idx) => ({
            ...sla,
            daysUntilDeadline: dateHelpers.daysRemaining(sla.deadline),
            urgencyStatus: dateHelpers.getUrgencyStatus(sla.deadline),
            key: `${sla.slaid || "sla"}-${sla.employeeId || "emp"}-${idx}`,
          }));

          setSlas(processed);
        } else {
          setSlas([]);
          setError(response?.message || "No SLAs found");
        }
      } catch (err) {
        setError(err.message || "Failed to fetch SLAs");
        setSlas([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [setSlas]
  );

  const filterSLAs = useCallback(() => {
    let filtered = [...slas];

    switch (activeTab) {
      case "open":
        filtered = slas.filter((s) => s.status === "Open");
        break;
      case "inprogress":
        filtered = slas.filter((s) => s.status === "InProgress");
        break;
      case "completed":
        filtered = slas.filter((s) => s.status === "Closed");
        break;
      case "overdue":
        filtered = slas.filter(
          (s) =>
            (s.status === "Open" || s.status === "InProgress") &&
            s.daysUntilDeadline < 0
        );
        break;
      default:
        filtered = slas;
    }

    setFilteredSLAs(filtered);
  }, [slas, activeTab]);

  const handleViewDetails = useCallback(
    (slaid) => {
      navigate(`/employee/dashboard/sla/details/${slaid}`);
    },
    [navigate]
  );

  const handleRefresh = useCallback(() => {
    if (user?.empId) {
      fetchSLAs(user.empId);
    }
  }, [user, fetchSLAs]);

  const calculateStats = useCallback(() => {
    const total = slas.length;
    const open = slas.filter((s) => s.status === "Open").length;
    const inProgress = slas.filter((s) => s.status === "InProgress").length;
    const completed = slas.filter((s) => s.status === "Closed").length;
    const overdue = slas.filter(
      (s) =>
        (s.status === "Open" || s.status === "InProgress") &&
        s.daysUntilDeadline < 0
    ).length;
    const onTime = slas.filter(
      (s) => s.complianceStatus && s.complianceStatus === "OnTime"
    ).length;

    return { total, open, inProgress, completed, overdue, onTime };
  }, [slas]);

  const stats = calculateStats();

  const getStatusStyle = (status) => {
    switch (status) {
      case "Open":
        return { className: "emp-sla-status-open", icon: Clock };
      case "InProgress":
        return { className: "emp-sla-status-progress", icon: Zap };
      case "Closed":
        return { className: "emp-sla-status-closed", icon: CheckCircle };
      default:
        return { className: "emp-sla-status-default", icon: FileText };
    }
  };

  const isOverdue = (sla) =>
    (sla.status === "Open" || sla.status === "InProgress") &&
    sla.daysUntilDeadline < 0;

  const safeTotal = filteredSLAs.length;
  const totalPages = Math.max(1, Math.ceil(safeTotal / itemsPerPage));

  const startIndex =
    safeTotal === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex =
    safeTotal === 0 ? 0 : Math.min(currentPage * itemsPerPage, safeTotal);

  const paginatedSLAs =
    viewMode === "table"
      ? filteredSLAs.slice(
          (currentPage - 1) * itemsPerPage,
          currentPage * itemsPerPage
        )
      : filteredSLAs;

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
      <div className="emp-sla-loading">
        <div className="emp-sla-spinner-border" role="status">
          <span className="emp-sla-sr-only">Loading...</span>
        </div>
        <p className="emp-sla-loading-text">Loading SLAs...</p>
      </div>
    );
  }

  return (
    <div className="emp-sla-dashboard">
      <Breadcrumb
        items={[
          { label: "SLA Compliance", active: true },
       
        ]}
      />

      {error && (
        <div className="emp-sla-alert-error">
          <AlertCircle size={18} className="emp-sla-alert-icon" />
          <div className="emp-sla-alert-content">
            <strong>Error</strong> {error}
          </div>
          <button
            type="button"
            className="emp-sla-alert-close"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}

      <div className="emp-sla-metric-row">
        <div className="emp-sla-metric-card">
          <div className="emp-sla-metric-icon emp-sla-metric-icon-total">
            <FileText size={26} />
          </div>
          <div className="emp-sla-metric-content">
            <div className="emp-sla-metric-value">{stats.total}</div>
            <div className="emp-sla-metric-label">TOTAL SLAs</div>
          </div>
        </div>

        <div className="emp-sla-metric-card">
          <div className="emp-sla-metric-icon emp-sla-metric-icon-open">
            <Clock size={26} />
          </div>
          <div className="emp-sla-metric-content">
            <div className="emp-sla-metric-value">{stats.open}</div>
            <div className="emp-sla-metric-label">OPEN</div>
          </div>
        </div>

        <div className="emp-sla-metric-card">
          <div className="emp-sla-metric-icon emp-sla-metric-icon-closed">
            <CheckCircle size={26} />
          </div>
          <div className="emp-sla-metric-content">
            <div className="emp-sla-metric-value">{stats.completed}</div>
            <div className="emp-sla-metric-label">CLOSED</div>
          </div>
        </div>

        <div className="emp-sla-metric-card">
          <div className="emp-sla-metric-icon emp-sla-metric-icon-ontime">
            <TrendingUp size={26} />
          </div>
          <div className="emp-sla-metric-content">
            <div className="emp-sla-metric-value">{stats.onTime}</div>
            <div className="emp-sla-metric-label">ON TIME</div>
          </div>
        </div>
      </div>

      {stats.overdue > 0 && (
        <div className="emp-sla-alert-overdue">
          <div className="emp-sla-alert-overdue-icon">
            <AlertTriangle size={22} />
          </div>
          <div>
            <h6 className="emp-sla-alert-overdue-title">
              {stats.overdue} Overdue SLAs
            </h6>
            <p className="emp-sla-alert-overdue-text">
              Please take immediate action on overdue items.
            </p>
          </div>
        </div>
      )}

      <div className="emp-sla-header-row">
        <div className="emp-sla-tabs-strip">
          <div className="emp-sla-tabs-container">
            {[
              { key: "all", label: "All" },
              { key: "open", label: "Open" },
              { key: "inprogress", label: "In Progress" },
              { key: "completed", label: "Completed" },
              { key: "overdue", label: "Overdue" },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`emp-sla-tab-pill ${
                  activeTab === key ? "active" : ""
                }`}
                onClick={() => setActiveTab(key)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="emp-sla-view-toggle">
            <button
              type="button"
              className={`emp-sla-view-btn ${
                viewMode === "cards" ? "active" : ""
              }`}
              onClick={() => setViewMode("cards")}
            >
              <Grid size={16} />
            </button>
            <button
              type="button"
              className={`emp-sla-view-btn ${
                viewMode === "table" ? "active" : ""
              }`}
              onClick={() => setViewMode("table")}
            >
              <List size={16} />
            </button>
          </div>
        </div>

        <button
          type="button"
          className="emp-sla-refresh-btn"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="emp-sla-content">
        {filteredSLAs.length === 0 ? (
          <div className="emp-sla-empty">
            <FileText size={56} className="emp-sla-empty-icon" />
            <h5 className="emp-sla-empty-title">No SLAs found</h5>
            <p className="emp-sla-empty-text">
              {activeTab === "all"
                ? "You don't have any SLAs assigned yet."
                : `No ${activeTab} SLAs at this time.`}
            </p>
          </div>
        ) : viewMode === "table" ? (
          <div className="emp-sla-table-container">
            <div className="emp-sla-table-responsive">
              <table className="emp-sla-table">
                <thead className="emp-sla-table-header">
                  <tr>
                    <th>TYPE</th>
                    <th>STATUS</th>
                    <th>DEADLINE</th>
                    <th>DAYS LEFT</th>
                    <th>ASSIGNED TO</th>
                    <th>COMPLIANCE</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSLAs.map((sla) => {
                    const overdue = isOverdue(sla);
                    const statusStyle = getStatusStyle(sla.status);
                    const Icon = statusStyle.icon;

                    return (
                      <tr key={sla.key} className="emp-sla-clickable-row">
                        <td>
                          <div className="emp-sla-table-type">
                            <div className={statusStyle.className}>
                              <Icon size={18} />
                            </div>
                            <span className="emp-sla-table-type-text">
                              {sla.slatype || "SLA"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`emp-sla-badge ${
                              overdue
                                ? "emp-sla-badge-overdue"
                                : statusStyle.className
                            }`}
                          >
                            {overdue ? "OVERDUE" : sla.status}
                          </span>
                        </td>
                        <td className="emp-sla-table-text">
                          {dateHelpers.formatDeadline(sla.deadline)}
                        </td>
                        <td>
                          <span
                            className={`emp-sla-days ${
                              overdue
                                ? "emp-sla-days-overdue"
                                : sla.daysUntilDeadline <= 3
                                ? "emp-sla-days-warning"
                                : "emp-sla-days-ok"
                            }`}
                          >
                            {overdue
                              ? `${Math.abs(sla.daysUntilDeadline)} overdue`
                              : `${sla.daysUntilDeadline} left`}
                          </span>
                        </td>
                        <td className="emp-sla-table-text">
                          {sla.assignedToName || "-"}
                        </td>
                        <td>
                          {sla.complianceStatus ? (
                            <span
                              className={`emp-sla-badge emp-sla-badge-compliance-${sla.complianceStatus.toLowerCase()}`}
                            >
                              {sla.complianceStatus}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td>
                          <button
                            className="emp-sla-action-btn"
                            onClick={() => handleViewDetails(sla.slaid)}
                          >
                            <Eye size={14} />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {safeTotal > 0 && (
              <div className="emp-sla-pagination-footer">
                <div className="emp-sla-pagination-left">
                  <span className="emp-sla-pagination-text">Show</span>
                  <select
                    className="emp-sla-pagination-dropdown"
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
                  <span className="emp-sla-pagination-text">entries</span>
                </div>

                <div className="emp-sla-pagination-center">
                  <span className="emp-sla-pagination-status">
                    Showing {startIndex} to {endIndex} of {safeTotal} entries
                  </span>
                </div>

                <div className="emp-sla-pagination-right">
                  <ul className="emp-sla-pagination-list">
                    <li
                      className={`emp-sla-page-item ${
                        currentPage === 1 ? "disabled" : ""
                      }`}
                    >
                      <button
                        className="emp-sla-page-link"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft size={14} />
                      </button>
                    </li>

                    {getPageNumbers().map((page, idx) =>
                      page === "..." ? (
                        <li
                          key={`ellipsis-${idx}`}
                          className="emp-sla-page-item disabled"
                        >
                          <span className="emp-sla-page-link">…</span>
                        </li>
                      ) : (
                        <li
                          key={page}
                          className={`emp-sla-page-item ${
                            currentPage === page ? "active" : ""
                          }`}
                        >
                          <button
                            className="emp-sla-page-link"
                            onClick={() => goToPage(page)}
                          >
                            {page}
                          </button>
                        </li>
                      )
                    )}

                    <li
                      className={`emp-sla-page-item ${
                        currentPage === totalPages ? "disabled" : ""
                      }`}
                    >
                      <button
                        className="emp-sla-page-link"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight size={14} />
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="emp-sla-cards-grid">
            {filteredSLAs.map((sla) => {
              const overdue = isOverdue(sla);
              const statusStyle = overdue
                ? { className: "emp-sla-status-overdue", icon: AlertTriangle }
                : getStatusStyle(sla.status);
              const IconComponent = statusStyle.icon;

              return (
                <div key={sla.key} className="emp-sla-card">
                  <div className="emp-sla-card-header">
                    <div className={`emp-sla-card-icon ${statusStyle.className}`}>
                      <IconComponent size={20} strokeWidth={2} />
                    </div>
                    <div className="emp-sla-card-header-text">
                      <h6 className="emp-sla-card-title">
                        {sla.slatype || "SLA"}
                      </h6>
                      <span
                        className={`emp-sla-card-badge ${statusStyle.className}`}
                      >
                        {overdue ? "OVERDUE" : sla.status}
                      </span>
                    </div>
                  </div>

                  <div className="emp-sla-card-body">
                    <div className="emp-sla-card-row">
                      <span className="emp-sla-card-label">Deadline</span>
                      <span className="emp-sla-card-value">
                        {dateHelpers.formatDeadline(sla.deadline)}
                      </span>
                    </div>
                    <div className="emp-sla-card-row">
                      <span className="emp-sla-card-label">
                        Days Remaining
                      </span>
                      <span
                        className={`emp-sla-card-value ${
                          overdue
                            ? "emp-sla-text-danger"
                            : "emp-sla-text-success"
                        }`}
                      >
                        {overdue
                          ? `${Math.abs(sla.daysUntilDeadline)} overdue`
                          : `${sla.daysUntilDeadline} days`}
                      </span>
                    </div>

                    <div className="emp-sla-card-row">
                      <span className="emp-sla-card-label">Assigned To</span>
                      <span className="emp-sla-card-value emp-sla-truncate">
                        {sla.assignedToName || "-"}
                      </span>
                    </div>

                    {sla.complianceStatus && (
                      <div className="emp-sla-card-row">
                        <span className="emp-sla-card-label">Compliance</span>
                        <span
                          className={`emp-sla-badge emp-sla-badge-compliance-${sla.complianceStatus.toLowerCase()}`}
                        >
                          {sla.complianceStatus}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="emp-sla-card-footer">
                    <button
                      className="emp-sla-card-btn"
                      onClick={() => handleViewDetails(sla.slaid)}
                    >
                      <Eye size={16} />
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeSLADashboard;
