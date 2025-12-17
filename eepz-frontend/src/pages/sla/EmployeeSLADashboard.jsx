import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  FileText,
  RefreshCw,
  AlertCircle,
  Eye,
  Zap,
  Grid,
  List,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Download,
} from "lucide-react";
import slaService, { dateHelpers } from "../../services/sla/slaService";
import Breadcrumb from "../../components/sla/common/Breadcrumbs";
import "../../styles/sla/EmployeeSLADashboard.css";

const EmployeeSLADashboard = () => {
  const navigate = useNavigate();

  // State Management
  const [slas, setSlas] = useState([]);
  const [filteredSLAs, setFilteredSLAs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState("cards");
  const [user, setUser] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  useEffect(() => {
    try {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
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

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const fetchSLAs = useCallback(async (empId) => {
    setLoading(true);
    setRefreshing(true);
    setError(null);
    try {
      if (!empId) throw new Error("Employee ID not found");
      const response = await slaService.getEmployeeSLAs(empId);

      if (response?.success) {
        let slasData = [];
        if (Array.isArray(response.data)) {
          slasData = response.data;
        } else if (response.data && typeof response.data === "object") {
          slasData = [response.data];
        } else {
          slasData = [];
        }
        const processedSLAs = slasData.map((sla, idx) => ({
          ...sla,
          daysUntilDeadline: dateHelpers.daysRemaining(sla.deadline),
          urgencyStatus: dateHelpers.getUrgencyStatus(sla.deadline),
          _key: `${sla.slaid}-${sla.employeeId || idx}`,
        }));
        setSlas(processedSLAs);
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
  }, []);

  const filterSLAs = useCallback(() => {
    let filtered = [...slas];
    switch (activeTab) {
      case "open":
        filtered = slas.filter((sla) => sla.status === "Open");
        break;
      case "inprogress":
        filtered = slas.filter((sla) => sla.status === "InProgress");
        break;
      case "completed":
        filtered = slas.filter((sla) => sla.status === "Closed");
        break;
      case "overdue":
        filtered = slas.filter(
          (sla) =>
            (sla.status === "Open" || sla.status === "InProgress") &&
            sla.daysUntilDeadline < 0
        );
        break;
      default:
        filtered = slas;
    }
    setFilteredSLAs(filtered);
  }, [slas, activeTab]);

  const handleViewDetails = useCallback(
    (slaid) => {
      navigate(`/employee/dashboard/sla/details/` + slaid);
    },
    [navigate]
  );

  const handleRefresh = useCallback(() => {
    if (user?.empId) {
      fetchSLAs(user.empId);
    }
  }, [user, fetchSLAs]);

  const calculateStats = useCallback(() => {
    return {
      total: slas.length,
      open: slas.filter((s) => s.status === "Open").length,
      inProgress: slas.filter((s) => s.status === "InProgress").length,
      completed: slas.filter((s) => s.status === "Closed").length,
      overdue: slas.filter(
        (s) =>
          (s.status === "Open" || s.status === "InProgress") &&
          s.daysUntilDeadline < 0
      ).length,
    };
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

  const isOverdue = (sla) => {
    return (
      (sla.status === "Open" || sla.status === "InProgress") &&
      sla.daysUntilDeadline < 0
    );
  };

  if (loading) {
    return (
      <div className="emp-sla-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="emp-sla-loading-text">Loading SLAs...</p>
      </div>
    );
  }

  return (
    <div className="emp-sla-dashboard">
      <Breadcrumb
        items={[{ label: "SLA Compliance" }, { label: "My SLAs" }]}
      />

      {/* Error Alert */}
      {error && (
        <div className="emp-sla-alert-error">
          <AlertCircle size={18} className="emp-sla-alert-icon" />
          <div className="emp-sla-alert-content">
            <strong>Error:</strong> {error}
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

      {/* Stats Grid - Centered Layout with Black Border */}
      <div className="emp-sla-stats-grid">
        <div className="emp-sla-stat-card">
          <div
            className="emp-sla-stat-icon-wrapper"
            style={{ backgroundColor: "#E8F1FF" }}
          >
            <FileText size={24} style={{ color: "#5B93FF" }} />
          </div>
          <h3 className="emp-sla-stat-value">{stats.total}</h3>
          <p className="emp-sla-stat-label">Total SLAs</p>
        </div>

        <div className="emp-sla-stat-card">
          <div
            className="emp-sla-stat-icon-wrapper"
            style={{ backgroundColor: "#E0E7FF" }}
          >
            <Clock size={24} style={{ color: "#6366F1" }} />
          </div>
          <h3 className="emp-sla-stat-value">{stats.open}</h3>
          <p className="emp-sla-stat-label">Open</p>
        </div>

        <div className="emp-sla-stat-card">
          <div
            className="emp-sla-stat-icon-wrapper"
            style={{ backgroundColor: "#FEF3C7" }}
          >
            <Zap size={24} style={{ color: "#F59E0B" }} />
          </div>
          <h3 className="emp-sla-stat-value">{stats.inProgress}</h3>
          <p className="emp-sla-stat-label">In Progress</p>
        </div>

        <div className="emp-sla-stat-card">
          <div
            className="emp-sla-stat-icon-wrapper"
            style={{ backgroundColor: "#D1FAE5" }}
          >
            <CheckCircle size={24} style={{ color: "#10B981" }} />
          </div>
          <h3 className="emp-sla-stat-value">{stats.completed}</h3>
          <p className="emp-sla-stat-label">Completed</p>
        </div>
      </div>

      {/* Overdue Alert */}
      {stats.overdue > 0 && (
        <div className="emp-sla-alert-overdue">
          <div className="emp-sla-alert-overdue-icon">
            <AlertTriangle size={22} />
          </div>
          <div>
            <h6 className="emp-sla-alert-overdue-title">
              {stats.overdue} Overdue SLA(s)
            </h6>
            <p className="emp-sla-alert-overdue-text">
              Please take immediate action on overdue items
            </p>
          </div>
        </div>
      )}

      {/* Pill-Style Tabs */}
      <div className="emp-sla-tabs-wrapper">
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

      {/* Content Area */}
      <div className="emp-sla-content">
        {filteredSLAs.length === 0 ? (
          <div className="emp-sla-empty">
            <FileText size={56} className="emp-sla-empty-icon" />
            <h5 className="emp-sla-empty-title">No SLAs found</h5>
            <p className="emp-sla-empty-text">
              {activeTab === "all"
                ? "You don't have any SLAs assigned yet"
                : `No ${activeTab} SLAs at this time`}
            </p>
          </div>
        ) : viewMode === "table" ? (
          // Table View
          <div className="emp-sla-table-wrapper">
            <div className="table-responsive">
              <table className="emp-sla-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Deadline</th>
                    <th>Days Left</th>
                    <th>Assigned To</th>
                    <th>Compliance</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSLAs.map((sla) => {
                    const isOverdueStatus = isOverdue(sla);
                    const style = getStatusStyle(sla.status);
                    const Icon = style.icon;
                    return (
                      <tr key={sla._key}>
                        <td>
                          <div className="emp-sla-table-type">
                            <div
                              className={`emp-sla-table-icon ${style.className}`}
                            >
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
                              isOverdueStatus
                                ? "emp-sla-badge-overdue"
                                : style.className
                            }`}
                          >
                            {isOverdueStatus ? "OVERDUE" : sla.status}
                          </span>
                        </td>
                        <td className="emp-sla-table-text">
                          {dateHelpers.formatDeadline(sla.deadline)}
                        </td>
                        <td>
                          <span
                            className={`emp-sla-days ${
                              isOverdueStatus
                                ? "emp-sla-days-overdue"
                                : sla.daysUntilDeadline <= 3
                                ? "emp-sla-days-warning"
                                : "emp-sla-days-ok"
                            }`}
                          >
                            {isOverdueStatus
                              ? `${Math.abs(sla.daysUntilDeadline)}d overdue`
                              : `${sla.daysUntilDeadline}d left`}
                          </span>
                        </td>
                        <td className="emp-sla-table-text">
                          {sla.assignedToName || "—"}
                        </td>
                        <td>
                          {sla.complianceStatus && (
                            <span
                              className={`emp-sla-badge emp-sla-badge-compliance-${sla.complianceStatus.toLowerCase()}`}
                            >
                              {sla.complianceStatus}
                            </span>
                          )}
                        </td>
                        <td>
                          <button
                            className="emp-sla-action-btn"
                            onClick={() => handleViewDetails(sla.slaid)}
                          >
                            <Eye size={14} />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          // Card View
          <div className="emp-sla-cards-grid">
            {filteredSLAs.map((sla) => {
              const isOverdueStatus = isOverdue(sla);
              const style = isOverdueStatus
                ? { className: "emp-sla-status-overdue", icon: AlertTriangle }
                : getStatusStyle(sla.status);
              const IconComponent = style.icon;

              return (
                <div key={sla._key} className="emp-sla-card">
                  {/* Card Header */}
                  <div className="emp-sla-card-header">
                    <div className={`emp-sla-card-icon ${style.className}`}>
                      <IconComponent size={20} strokeWidth={2} />
                    </div>
                    <div className="emp-sla-card-header-text">
                      <h6 className="emp-sla-card-title">
                        {sla.slatype || "SLA"}
                      </h6>
                      <span
                        className={`emp-sla-card-badge ${style.className}`}
                      >
                        {isOverdueStatus ? "OVERDUE" : sla.status}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
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
                          isOverdueStatus
                            ? "emp-sla-text-danger"
                            : "emp-sla-text-success"
                        }`}
                      >
                        {isOverdueStatus
                          ? `${Math.abs(sla.daysUntilDeadline)}d overdue`
                          : `${sla.daysUntilDeadline} days`}
                      </span>
                    </div>

                    {sla.assignedToName && (
                      <div className="emp-sla-card-row">
                        <span className="emp-sla-card-label">
                          Assigned To
                        </span>
                        <span className="emp-sla-card-value emp-sla-truncate">
                          {sla.assignedToName}
                        </span>
                      </div>
                    )}

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

                  {/* Card Footer */}
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
