// src/pages/sla/EmployeeSLADashboard.jsx
import Breadcrumb from "../../components/sla/common/Breadcrumbs";
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
} from "lucide-react";
import slaService, { dateHelpers } from "../../services/sla/slaService";



const cardBorder = "1.5px solid #27235c"; // Purple border from your image
const cardRadius = "14px"; // Rounded corners matching UI

const EmployeeSLADashboard = () => {
  const navigate = useNavigate();

  // ========== STATE ==========
  const [slas, setSlas] = useState([]);
  const [filteredSLAs, setFilteredSLAs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [viewMode, setViewMode] = useState("cards");
  const [user, setUser] = useState(null);

  // ========== INITIALIZE ==========
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
  }, [selectedFilter, slas]);

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
    switch (selectedFilter) {
      case "Open":
        filtered = slas.filter((sla) => sla.status === "Open");
        break;
      case "InProgress":
        filtered = slas.filter((sla) => sla.status === "InProgress");
        break;
      case "Completed":
        filtered = slas.filter((sla) => sla.status === "Closed");
        break;
      case "Overdue":
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
  }, [slas, selectedFilter]);

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
        return {
          bg: "#dbeafe",
          border: "#0F62FE",
          text: "#0F62FE",
          icon: Clock,
        };
      case "InProgress":
        return { bg: "#fef3c7", border: "#E2B93B", text: "#D4941E", icon: Zap };
      case "Closed":
        return {
          bg: "#dcfce7",
          border: "#24A148",
          text: "#24A148",
          icon: CheckCircle,
        };
      default:
        return {
          bg: "#f1f5f9",
          border: "#64748b",
          text: "#64748b",
          icon: FileText,
        };
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
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "500px" }}
      >
        <div className="text-center">
          <div
            className="spinner-border text-primary mb-3"
            role="status"
            style={{ width: "3rem", height: "3rem" }}
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mb-0" style={{ fontSize: "0.875rem" }}>
            Loading SLAs...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "1.25rem 1.75rem",
        maxWidth: "100%",
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ========== HEADER ========== */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <p
            className="mb-0"
            style={{ color: "#64748b", fontSize: "0.875rem" }}
          >
            Track your SLA deadlines and compliance status
          </p>
        </div>
        <button
          className="btn d-flex align-items-center gap-2"
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            backgroundColor: "transparent",
            border: "1.5px solid #0F62FE",
            color: "#0F62FE",
            borderRadius: "8px",
            padding: "8px 16px",
            fontSize: "0.875rem",
            fontWeight: 600,
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            if (!refreshing) {
              e.currentTarget.style.backgroundColor = "#0F62FE";
              e.currentTarget.style.color = "#fff";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "#0F62FE";
          }}
        >
          <RefreshCw
            size={16}
            style={{
              animation: refreshing ? "spin 1s linear infinite" : "none",
            }}
          />
          Refresh
        </button>
      </div>

      {/* ========== ERROR ALERT ========== */}
      {error && (
        <div
          className="alert alert-danger alert-dismissible fade show mb-3 d-flex align-items-start"
          style={{
            borderRadius: cardRadius,
            padding: "0.75rem 1rem",
            border: "1px solid #fee2e2",
            backgroundColor: "#fef2f2",
          }}
        >
          <AlertCircle
            size={18}
            className="flex-shrink-0 me-2"
            style={{ marginTop: "2px", color: "#dc2626" }}
          />
          <div className="flex-grow-1">
            <strong style={{ fontSize: "0.875rem", color: "#991b1b" }}>
              Error:
            </strong>
            <span style={{ fontSize: "0.813rem", color: "#991b1b" }}>
              {" "}
              {error}
            </span>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={() => setError(null)}
          />
        </div>
      )}

                        <Breadcrumb
  items={[
   
    { label: "My SLAs" }
  ]}
/>

      {/* ========== STATS CARDS - VERTICAL CENTERED LAYOUT ========== */}
      <div className="row g-3 mb-3">
        {[
          {
            label: "Total SLAs",
            value: stats.total,
            icon: FileText,
            bgColor: "#dbeafe",
            iconColor: "#0F62FE",
          },
          {
            label: "Open",
            value: stats.open,
            icon: Clock,
            bgColor: "#e0e7ff",
            iconColor: "#4f46e5",
          },
          {
            label: "In Progress",
            value: stats.inProgress,
            icon: Zap,
            bgColor: "#fef3c7",
            iconColor: "#E2B93B",
          },
          {
            label: "Completed",
            value: stats.completed,
            icon: CheckCircle,
            bgColor: "#dcfce7",
            iconColor: "#24A148",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="col-6 col-lg-3">
              <div
                className="card h-100"
                style={{
                  border: cardBorder,
                  borderRadius: cardRadius,
                  backgroundColor: "",
                  boxShadow: "none",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px 0 rgba(163,21,175,0.13)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  className="card-body d-flex flex-column align-items-center justify-content-center text-center"
                  style={{ padding: "1.75rem 1.25rem" }}
                >
                  {/* Icon at top */}
                  <div
                    className="d-flex align-items-center justify-content-center mb-3"
                    style={{
                      width: "56px",
                      height: "56px",
                      backgroundColor: stat.bgColor,
                      borderRadius: "12px",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={28} color={stat.iconColor} strokeWidth={2.5} />
                  </div>
                  <h2
                    className="fw-bold mb-2"
                    style={{
                      fontSize: "2rem",
                      color: "#0f172a",
                      lineHeight: 1,
                      fontWeight: 700,
                      letterSpacing: "-0.025em",
                    }}
                  >
                    {stat.value}
                  </h2>
                  <p
                    className="mb-0"
                    style={{
                      fontSize: "0.975rem",
                      color: "#27235c",
                      fontWeight: 600,
                      lineHeight: 1.2,
                    }}
                  >
                    {stat.label}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========== OVERDUE ALERT ========== */}
      {stats.overdue > 0 && (
        <div
          className="alert d-flex align-items-center gap-3 mb-3"
          style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: cardRadius,
            padding: "0.875rem 1rem",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              backgroundColor: "#fee2e2",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={22} color="#dc2626" />
          </div>
          <div>
            <h6
              className="fw-bold mb-0"
              style={{ color: "#991b1b", fontSize: "0.938rem" }}
            >
              {stats.overdue} Overdue SLA(s)
            </h6>
            <p
              className="mb-0"
              style={{
                color: "#7f1d1d",
                fontSize: "0.813rem",
                marginTop: "2px",
              }}
            >
              Please take immediate action on overdue items
            </p>
          </div>
        </div>
      )}

      {/* ========== FILTER + VIEW TOGGLE ========== */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex gap-2" style={{ flexWrap: "wrap" }}>
          {[
            { label: "All", key: "All" },
            { label: "Open", key: "Open", count: stats.open },
            {
              label: "In Progress",
              key: "InProgress",
              count: stats.inProgress,
            },
            { label: "Completed", key: "Completed", count: stats.completed },
            { label: "Overdue", key: "Overdue", count: stats.overdue },
          ].map((filter) => (
            <button
              key={filter.key}
              type="button"
              className="btn d-inline-flex align-items-center gap-2"
              onClick={() => setSelectedFilter(filter.key)}
              style={{
                backgroundColor:
                  selectedFilter === filter.key ? "#a21caf" : "#fff",
                color: selectedFilter === filter.key ? "#fff" : "#7f1d1d",
                border: selectedFilter === filter.key ? "none" : cardBorder,
                borderRadius: "8px",
                padding: "6px 14px",
                fontSize: "0.875rem",
                fontWeight: 600,
                transition: "all 0.2s ease",
                boxShadow: "none",
              }}
              onMouseEnter={(e) => {
                if (selectedFilter !== filter.key) {
                  e.currentTarget.style.backgroundColor = "#f8fafc";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedFilter !== filter.key) {
                  e.currentTarget.style.backgroundColor = "#fff";
                }
              }}
            >
              {filter.label}
              {filter.count > 0 && (
                <span
                  className="badge"
                  style={{
                    backgroundColor:
                      selectedFilter === filter.key
                        ? "rgba(255,255,255,0.2)"
                        : "#f3e8ff",
                    color: selectedFilter === filter.key ? "#fff" : "#a21caf",
                    padding: "2px 8px",
                    fontSize: "0.75rem",
                    borderRadius: "10px",
                    fontWeight: 600,
                  }}
                >
                  {filter.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* VIEW TOGGLE */}
        <div className="btn-group" role="group">
          <button
            type="button"
            className={`btn btn-sm ${
              viewMode === "cards" ? "btn-primary" : "btn-outline-primary"
            }`}
            onClick={() => setViewMode("cards")}
            style={{
              padding: "6px 12px",
              fontSize: "0.875rem",
              borderRadius: "8px 0 0 8px",
            }}
          >
            <Grid size={16} />
          </button>
          <button
            type="button"
            className={`btn btn-sm ${
              viewMode === "table" ? "btn-primary" : "btn-outline-primary"
            }`}
            onClick={() => setViewMode("table")}
            style={{
              padding: "6px 12px",
              fontSize: "0.875rem",
              borderRadius: "0 8px 8px 0",
            }}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* ========== CONTENT AREA - SCROLLABLE ========== */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {filteredSLAs.length === 0 ? (
          <div
            className="card"
            style={{
              border: cardBorder,
              borderRadius: cardRadius,
              background: "#fff",
              boxShadow: "none",
              minHeight: "300px",
            }}
          >
            <div className="card-body d-flex flex-column align-items-center justify-content-center text-center p-5">
              <FileText
                size={56}
                style={{ color: "#cbd5e1", opacity: 0.5 }}
                className="mb-3"
              />
              <h5
                className="fw-bold mb-2"
                style={{ color: "#a21caf", fontSize: "1.125rem" }}
              >
                No SLAs found
              </h5>
              <p className="text-muted mb-0" style={{ fontSize: "0.938rem" }}>
                {selectedFilter === "All"
                  ? "You don't have any SLAs assigned yet"
                  : `No ${selectedFilter.toLowerCase()} SLAs at this time`}
              </p>
            </div>
          </div>
        ) : viewMode === "table" ? (
          // ========== TABLE VIEW ==========
          <div
            className="card"
            style={{
              border: cardBorder,
              borderRadius: cardRadius,
              background: "#fff",
              boxShadow: "none",
            }}
          >
            <div className="table-responsive">
              <table
                className="table table-hover align-middle mb-0"
                style={{ fontSize: "0.875rem" }}
              >
                <thead style={{ backgroundColor: "#f8fafc" }}>
                  <tr>
                    <th
                      style={{
                        padding: "1rem",
                        fontSize: "0.813rem",
                        color: "#64748b",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        borderBottom: "2px solid #e2e8f0",
                      }}
                    >
                      Type
                    </th>
                    <th
                      style={{
                        padding: "1rem",
                        fontSize: "0.813rem",
                        color: "#64748b",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        borderBottom: "2px solid #e2e8f0",
                      }}
                    >
                      Status
                    </th>
                    <th
                      style={{
                        padding: "1rem",
                        fontSize: "0.813rem",
                        color: "#64748b",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        borderBottom: "2px solid #e2e8f0",
                      }}
                    >
                      Deadline
                    </th>
                    <th
                      style={{
                        padding: "1rem",
                        fontSize: "0.813rem",
                        color: "#64748b",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        borderBottom: "2px solid #e2e8f0",
                      }}
                    >
                      Days Left
                    </th>
                    <th
                      style={{
                        padding: "1rem",
                        fontSize: "0.813rem",
                        color: "#64748b",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        borderBottom: "2px solid #e2e8f0",
                      }}
                    >
                      Assigned To
                    </th>
                    <th
                      style={{
                        padding: "1rem",
                        fontSize: "0.813rem",
                        color: "#64748b",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        borderBottom: "2px solid #e2e8f0",
                      }}
                    >
                      Compliance
                    </th>
                    <th
                      style={{
                        padding: "1rem",
                        fontSize: "0.813rem",
                        color: "#64748b",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        borderBottom: "2px solid #e2e8f0",
                        textAlign: "center",
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSLAs.map((sla) => {
                    const isOverdueStatus = isOverdue(sla);
                    const style = getStatusStyle(sla.status);
                    const Icon = style.icon;
                    return (
                      <tr
                        key={sla._key}
                        style={{ borderBottom: "1px solid #f1f5f9" }}
                      >
                        <td
                          style={{ padding: "1rem", verticalAlign: "middle" }}
                        >
                          <div className="d-flex align-items-center gap-2">
                            <div
                              style={{
                                width: "36px",
                                height: "36px",
                                backgroundColor: style.bg,
                                borderRadius: "8px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Icon size={18} color={style.text} />
                            </div>
                            <span
                              className="fw-semibold"
                              style={{ fontSize: "0.875rem", color: "#0f172a" }}
                            >
                              {sla.slatype || "SLA"}
                            </span>
                          </div>
                        </td>
                        <td
                          style={{ padding: "1rem", verticalAlign: "middle" }}
                        >
                          <span
                            className="badge"
                            style={{
                              backgroundColor: isOverdueStatus
                                ? "#fee2e2"
                                : style.bg,
                              color: isOverdueStatus ? "#991b1b" : style.text,
                              fontSize: "0.75rem",
                              padding: "4px 10px",
                              fontWeight: 600,
                              borderRadius: "6px",
                            }}
                          >
                            {isOverdueStatus ? "OVERDUE" : sla.status}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            fontSize: "0.875rem",
                            verticalAlign: "middle",
                            color: "#475569",
                          }}
                        >
                          {dateHelpers.formatDeadline(sla.deadline)}
                        </td>
                        <td
                          style={{ padding: "1rem", verticalAlign: "middle" }}
                        >
                          <span
                            style={{
                              color: isOverdueStatus
                                ? "#dc2626"
                                : sla.daysUntilDeadline <= 3
                                ? "#E2B93B"
                                : "#24A148",
                              fontWeight: 700,
                              fontSize: "0.875rem",
                            }}
                          >
                            {isOverdueStatus
                              ? `${Math.abs(sla.daysUntilDeadline)}d overdue`
                              : `${sla.daysUntilDeadline}d left`}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            fontSize: "0.875rem",
                            verticalAlign: "middle",
                            color: "#475569",
                          }}
                        >
                          {sla.assignedToName || "—"}
                        </td>
                        <td
                          style={{ padding: "1rem", verticalAlign: "middle" }}
                        >
                          {sla.complianceStatus && (
                            <span
                              className="badge"
                              style={{
                                backgroundColor:
                                  sla.complianceStatus === "OnTime"
                                    ? "#dcfce7"
                                    : sla.complianceStatus === "Breached"
                                    ? "#fee2e2"
                                    : "#fef3c7",
                                color:
                                  sla.complianceStatus === "OnTime"
                                    ? "#166534"
                                    : sla.complianceStatus === "Breached"
                                    ? "#991b1b"
                                    : "#92400e",
                                fontSize: "0.75rem",
                                padding: "4px 10px",
                                fontWeight: 600,
                                borderRadius: "6px",
                              }}
                            >
                              {sla.complianceStatus}
                            </span>
                          )}
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            textAlign: "center",
                            verticalAlign: "middle",
                          }}
                        >
                          <button
                            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                            onClick={() => handleViewDetails(sla.slaid)}
                            style={{
                              padding: "6px 12px",
                              fontSize: "0.813rem",
                              borderRadius: "6px",
                              fontWeight: 600,
                            }}
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
          // ========== CARD VIEW ==========
          <div className="row g-3">
            {filteredSLAs.map((sla) => {
              const isOverdueStatus = isOverdue(sla);
              const style = isOverdueStatus
                ? {
                    bg: "#fee2e2",
                    border: "#E01950",
                    text: "#E01950",
                    icon: AlertTriangle,
                  }
                : getStatusStyle(sla.status);
              const IconComponent = style.icon;

              return (
                
                <div key={sla._key} className="col-md-6 col-lg-4">

                  <div
                    className="card h-100"
                    style={{
                      border: cardBorder,
                      borderRadius: cardRadius,
                      background: "#fff",
                      boxShadow: "none",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow =
                        "0 4px 12px 0 rgba(163,21,175,0.13)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div className="card-body" style={{ padding: "1.125rem" }}>
                      {/* Header */}
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <div
                          style={{
                            width: "42px",
                            height: "42px",
                            backgroundColor: style.bg,
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <IconComponent
                            size={20}
                            color={style.text}
                            strokeWidth={2.5}
                          />
                        </div>
                        <div className="flex-grow-1" style={{ minWidth: 0 }}>
                          <h6
                            className="mb-1 fw-bold text-truncate"
                            style={{ fontSize: "0.938rem", color: "#a21caf" }}
                          >
                            {sla.slatype || "SLA"}
                          </h6>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: style.bg,
                              color: style.text,
                              fontSize: "0.75rem",
                              padding: "3px 8px",
                              fontWeight: 600,
                              borderRadius: "4px",
                            }}
                          >
                            {isOverdueStatus ? "OVERDUE" : sla.status}
                          </span>
                        </div>
                      </div>
                      <div className="mb-3" style={{ fontSize: "0.813rem" }}>
                        <div
                          className="d-flex justify-content-between mb-2 pb-2"
                          style={{ borderBottom: "1px solid #f1f5f9" }}
                        >
                          <span style={{ color: "#64748b", fontWeight: 600 }}>
                            Deadline
                          </span>
                          <span
                            className="fw-bold"
                            style={{ color: "#0f172a" }}
                          >
                            {dateHelpers.formatDeadline(sla.deadline)}
                          </span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span style={{ color: "#64748b", fontWeight: 600 }}>
                            Days Remaining
                          </span>
                          <span
                            className="fw-bold"
                            style={{
                              color: isOverdueStatus ? "#dc2626" : "#24A148",
                            }}
                          >
                            {isOverdueStatus
                              ? `${Math.abs(sla.daysUntilDeadline)}d overdue`
                              : `${sla.daysUntilDeadline}d left`}
                          </span>
                        </div>
                        {sla.assignedToName && (
                          <div className="d-flex justify-content-between mb-2">
                            <span style={{ color: "#64748b", fontWeight: 600 }}>
                              Assigned To
                            </span>
                            <span
                              className="fw-semibold text-truncate"
                              style={{ color: "#0f172a", maxWidth: "55%" }}
                            >
                              {sla.assignedToName}
                            </span>
                          </div>
                        )}
                        {sla.complianceStatus && (
                          <div className="d-flex justify-content-between">
                            <span style={{ color: "#64748b", fontWeight: 600 }}>
                              Compliance
                            </span>
                            <span
                              className="badge"
                              style={{
                                backgroundColor:
                                  sla.complianceStatus === "OnTime"
                                    ? "#dcfce7"
                                    : sla.complianceStatus === "Breached"
                                    ? "#fee2e2"
                                    : "#fef3c7",
                                color:
                                  sla.complianceStatus === "OnTime"
                                    ? "#166534"
                                    : sla.complianceStatus === "Breached"
                                    ? "#991b1b"
                                    : "#92400e",
                                fontSize: "0.75rem",
                                padding: "3px 8px",
                                fontWeight: 600,
                                borderRadius: "4px",
                              }}
                            >
                              {sla.complianceStatus}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-2"
                        onClick={() => handleViewDetails(sla.slaid)}
                        style={{
                          padding: "8px",
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          borderRadius: "6px",
                        }}
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
        )}
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
};

export default EmployeeSLADashboard;
