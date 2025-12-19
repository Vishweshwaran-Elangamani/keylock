import React, { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  Filter,
  FileText,
  AlertCircle,
  Users,
  CheckCircle,
  Clock,
} from "lucide-react";
import ComplianceCard from "../../components/sla/cards/ComplianceCard"; // ← Make sure THIS file has border: '1.5px solid #27235C'
import slaService from "../../services/sla/slaService";
import {
  getComplianceSummary,
  getComplianceRating,
} from "../../utils/sla/slaCalculations";

const SLACompliance = () => {
  const [allSLAs, setAllSLAs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("cards");
  const [sortBy, setSortBy] = useState("compliancePercentage");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await slaService.getAllSLAs();

      if (res?.success && Array.isArray(res.data)) {
        setAllSLAs(res.data);
      } else {
        setAllSLAs([]);
        setError("No SLA data available");
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err.message || "Failed to load SLA data");
      setAllSLAs([]);
    } finally {
      setLoading(false);
    }
  };

  const complianceData = useMemo(() => {
    if (allSLAs.length === 0) return [];

    const departments = [...new Set(allSLAs.map((sla) => sla.departmentId))];

    return departments.map((deptId) => {
      const deptSLAs = allSLAs.filter((sla) => sla.departmentId === deptId);
      const deptName = deptSLAs[0]?.departmentName || "Department";

      const summary = getComplianceSummary(deptSLAs);

      const dates = deptSLAs
        .filter((s) => s.deadline)
        .map((s) => new Date(s.deadline))
        .sort((a, b) => a - b);

      const periodStartDate = dates.length > 0 ? dates[0] : new Date();
      const periodEndDate =
        dates.length > 0 ? dates[dates.length - 1] : new Date();

      return {
        complianceId: `${deptId}`,
        departmentId: deptId,
        departmentName: deptName,
        periodStartDate: periodStartDate.toISOString(),
        periodEndDate: periodEndDate.toISOString(),
        totalSlas: summary.totalSLAs,
        closedSlas: summary.closedSLAs,
        openSlas: summary.openSLAs,
        onTimeSlas: summary.onTimeSLAs,
        breachedSlas: summary.breachedSLAs,
        extendedSlas: deptSLAs.filter(
          (s) => s.status === "Closed" && s.complianceStatus === "Extended"
        ).length,
        compliancePercentage: summary.compliancePercentage,
        complianceRating: summary.rating,
        calculatedAt: new Date().toISOString(),
      };
    });
  }, [allSLAs]);

  const calculateOverallStats = () => {
    if (complianceData.length === 0) {
      return {
        totalSLAs: 0,
        closedSLAs: 0,
        openSLAs: 0,
        onTimeSLAs: 0,
        breachedSLAs: 0,
        avgCompliance: 0,
        excellentDepts: 0,
      };
    }

    const totals = complianceData.reduce(
      (acc, dept) => ({
        totalSLAs: acc.totalSLAs + dept.totalSlas,
        closedSLAs: acc.closedSLAs + dept.closedSlas,
        openSLAs: acc.openSLAs + dept.openSlas,
        onTimeSLAs: acc.onTimeSLAs + dept.onTimeSlas,
        breachedSLAs: acc.breachedSLAs + dept.breachedSlas,
      }),
      {
        totalSLAs: 0,
        closedSLAs: 0,
        openSLAs: 0,
        onTimeSLAs: 0,
        breachedSLAs: 0,
      }
    );

    const avgCompliance =
      complianceData.length > 0
        ? complianceData.reduce(
            (sum, dept) => sum + dept.compliancePercentage,
            0
          ) / complianceData.length
        : 0;

    const excellentDepts = complianceData.filter(
      (d) => d.compliancePercentage >= 90
    ).length;

    return {
      ...totals,
      avgCompliance: avgCompliance.toFixed(1),
      excellentDepts,
    };
  };

  const sortedData = [...complianceData].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];

    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    }
    return aValue < bValue ? 1 : -1;
  });

  const stats = calculateOverallStats();

  const handleExportReport = () => {
    const headers = [
      "Department",
      "Total SLAs",
      "Closed",
      "Open",
      "On-Time",
      "Breached",
      "Extended",
      "Compliance %",
      "Rating",
    ];
    const rows = complianceData.map((dept) => [
      dept.departmentName,
      dept.totalSlas,
      dept.closedSlas,
      dept.openSlas,
      dept.onTimeSlas,
      dept.breachedSlas,
      dept.extendedSlas,
      dept.compliancePercentage.toFixed(1),
      dept.complianceRating,
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
      "\n"
    );

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SLA_Compliance_Report.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <p className="text-muted mb-0" style={{ fontSize: "14px" }}>
            Department-wise SLA compliance metrics (Based on Closed SLAs)
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-primary d-flex align-items-center gap-2"
            onClick={fetchAllData}
            style={{ borderRadius: "8px" }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Overall Stats Cards - Horizontal Layout with Black Border */}
      <div className="row g-3 mb-4">
        {/* Total Escalations Card */}
        <div className="col-lg-3 col-md-6">
          <div
            className="card h-100"
            style={{
              borderRadius: "16px",
              border: "1.5px solid #27235C",
              backgroundColor: "#FFFFFF",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "1rem",
              transition: "all 0.2s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.borderColor = "#0F62FE";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(39, 35, 92, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.borderColor = "#27235C";
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
            }}
          >
            <div
              className="d-flex align-items-center justify-content-center"
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "12px",
                backgroundColor: "#E8F1FF",
                flexShrink: 0,
              }}
            >
              <Users size={24} style={{ color: "#5B93FF" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2
                className="fw-bold mb-1"
                style={{
                  fontSize: "2rem",
                  color: "#0f172a",
                  lineHeight: "1",
                  margin: "0",
                }}
              >
                {stats.totalSLAs}
              </h2>
              <p
                className="mb-0"
                style={{
                  fontSize: "0.75rem",
                  color: "#64748b",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Total Escalations
              </p>
            </div>
          </div>
        </div>

        {/* Approved Card */}
        <div className="col-lg-3 col-md-6">
          <div
            className="card h-100"
            style={{
              borderRadius: "16px",
              border: "1.5px solid #27235C",
              backgroundColor: "#FFFFFF",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "1rem",
              transition: "all 0.2s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.borderColor = "#0F62FE";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(39, 35, 92, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.borderColor = "#27235C";
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
            }}
          >
            <div
              className="d-flex align-items-center justify-content-center"
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "12px",
                backgroundColor: "#D1FAE5",
                flexShrink: 0,
              }}
            >
              <CheckCircle size={24} style={{ color: "#10B981" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2
                className="fw-bold mb-1"
                style={{
                  fontSize: "2rem",
                  color: "#0f172a",
                  lineHeight: "1",
                  margin: "0",
                }}
              >
                {stats.closedSLAs}
              </h2>
              <p
                className="mb-0"
                style={{
                  fontSize: "0.75rem",
                  color: "#64748b",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Approved
              </p>
            </div>
          </div>
        </div>

        {/* Pending Card */}
        <div className="col-lg-3 col-md-6">
          <div
            className="card h-100"
            style={{
              borderRadius: "16px",
              border: "1.5px solid #27235C",
              backgroundColor: "#FFFFFF",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "1rem",
              transition: "all 0.2s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.borderColor = "#0F62FE";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(39, 35, 92, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.borderColor = "#27235C";
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
            }}
          >
            <div
              className="d-flex align-items-center justify-content-center"
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "12px",
                backgroundColor: "#FEF3C7",
                flexShrink: 0,
              }}
            >
              <Clock size={24} style={{ color: "#F59E0B" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2
                className="fw-bold mb-1"
                style={{
                  fontSize: "2rem",
                  color: "#0f172a",
                  lineHeight: "1",
                  margin: "0",
                }}
              >
                {stats.openSLAs}
              </h2>
              <p
                className="mb-0"
                style={{
                  fontSize: "0.75rem",
                  color: "#64748b",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Pending
              </p>
            </div>
          </div>
        </div>

        {/* Rejected Card */}
        <div className="col-lg-3 col-md-6">
          <div
            className="card h-100"
            style={{
              borderRadius: "16px",
              border: "1.5px solid #27235C",
              backgroundColor: "#FFFFFF",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "1rem",
              transition: "all 0.2s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.borderColor = "#0F62FE";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(39, 35, 92, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.borderColor = "#27235C";
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
            }}
          >
            <div
              className="d-flex align-items-center justify-content-center"
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "12px",
                backgroundColor: "#FEE2E2",
                flexShrink: 0,
              }}
            >
              <AlertCircle size={24} style={{ color: "#EF4444" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2
                className="fw-bold mb-1"
                style={{
                  fontSize: "2rem",
                  color: "#0f172a",
                  lineHeight: "1",
                  margin: "0",
                }}
              >
                {stats.breachedSLAs}
              </h2>
              <p
                className="mb-0"
                style={{
                  fontSize: "0.75rem",
                  color: "#64748b",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Rejected
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="mb-4" style={{ padding: "1rem 0" }}>
        <div className="btn-group" role="group">
          <button
            type="button"
            className={`btn ${
              viewMode === "cards" ? "btn-primary" : "btn-outline-primary"
            }`}
            onClick={() => setViewMode("cards")}
            style={{ borderRadius: "8px 0 0 8px", padding: "0.75rem 1.5rem" }}
          >
            <PieChart size={16} className="me-2" />
            Cards View
          </button>
          <button
            type="button"
            className={`btn ${
              viewMode === "table" ? "btn-primary" : "btn-outline-primary"
            }`}
            onClick={() => setViewMode("table")}
            style={{ borderRadius: "0 8px 8px 0", padding: "0.75rem 1.5rem" }}
          >
            <BarChart3 size={16} className="me-2" />
            Table View
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          className="alert alert-warning alert-dismissible fade show"
          role="alert"
        >
          <AlertCircle size={18} className="me-2" />
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError(null)}
          />
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-3">Loading compliance data...</p>
        </div>
      ) : (
        <>
          {/* Cards View */}
          {viewMode === "cards" && (
            <div className="row g-4">
              {sortedData.map((compliance) => (
                <div
                  key={compliance.complianceId}
                  className="col-md-6 col-lg-4"
                >
                  {/* ComplianceCard component renders here with its own styling */}
                  <ComplianceCard
                    compliance={compliance}
                    slaData={allSLAs.filter(
                      (sla) => sla.departmentId === compliance.departmentId
                    )}
                    showActions={false}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Table View */}
          {viewMode === "table" && (
            <div
              className="card shadow-sm"
              style={{
                borderRadius: "12px",
                border: "1.5px solid #27235C",
              }}
            >
              <div className="table-responsive">
                <table className="table table-hover mb-0 align-middle">
                  <thead style={{ backgroundColor: "#f8f9fa" }}>
                    <tr>
                      <th style={{ padding: "1rem" }}>Department</th>
                      <th style={{ padding: "1rem", textAlign: "center" }}>
                        Total
                      </th>
                      <th style={{ padding: "1rem", textAlign: "center" }}>
                        Closed
                      </th>
                      <th style={{ padding: "1rem", textAlign: "center" }}>
                        Open
                      </th>
                      <th style={{ padding: "1rem", textAlign: "center" }}>
                        On-Time
                      </th>
                      <th style={{ padding: "1rem", textAlign: "center" }}>
                        Breached
                      </th>
                      <th style={{ padding: "1rem", textAlign: "center" }}>
                        Extended
                      </th>
                      <th style={{ padding: "1rem", textAlign: "center" }}>
                        Compliance
                      </th>
                      <th style={{ padding: "1rem" }}>Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedData.map((dept) => {
                      const ratingObj = getComplianceRating(
                        dept.compliancePercentage
                      );
                      const ratingColor = ratingObj.color;

                      return (
                        <tr key={dept.complianceId}>
                          <td style={{ padding: "1rem" }}>
                            <strong>{dept.departmentName}</strong>
                          </td>
                          <td style={{ padding: "1rem", textAlign: "center" }}>
                            {dept.totalSlas}
                          </td>
                          <td style={{ padding: "1rem", textAlign: "center" }}>
                            <span className="badge bg-success">
                              {dept.closedSlas}
                            </span>
                          </td>
                          <td style={{ padding: "1rem", textAlign: "center" }}>
                            <span className="badge bg-info">
                              {dept.openSlas}
                            </span>
                          </td>
                          <td style={{ padding: "1rem", textAlign: "center" }}>
                            <span className="badge bg-success">
                              {dept.onTimeSlas}
                            </span>
                          </td>
                          <td style={{ padding: "1rem", textAlign: "center" }}>
                            <span className="badge bg-danger">
                              {dept.breachedSlas}
                            </span>
                          </td>
                          <td style={{ padding: "1rem", textAlign: "center" }}>
                            <span className="badge bg-warning text-dark">
                              {dept.extendedSlas}
                            </span>
                          </td>
                          <td style={{ padding: "1rem", textAlign: "center" }}>
                            <div className="d-flex align-items-center justify-content-center gap-2">
                              <div
                                className="progress"
                                style={{
                                  width: "60px",
                                  height: "8px",
                                  borderRadius: "4px",
                                  backgroundColor: "#e9ecef",
                                }}
                              >
                                <div
                                  className="progress-bar"
                                  style={{
                                    width: `${dept.compliancePercentage}%`,
                                    backgroundColor: ratingColor,
                                  }}
                                />
                              </div>
                              <strong
                                style={{ color: ratingColor, minWidth: "45px" }}
                              >
                                {dept.compliancePercentage.toFixed(1)}%
                              </strong>
                            </div>
                          </td>
                          <td style={{ padding: "1rem" }}>
                            <span
                              className="badge"
                              style={{
                                backgroundColor: `${ratingColor}15`,
                                color: ratingColor,
                                border: `1px solid ${ratingColor}30`,
                              }}
                            >
                              {dept.complianceRating}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && sortedData.length === 0 && (
        <div
          className="d-flex flex-column align-items-center justify-content-center text-center"
          style={{
            minHeight: "400px",
            padding: "60px 20px",
          }}
        >
          <FileText
            size={48}
            className="mb-3"
            style={{
              strokeWidth: 1.5,
              color: "#9CA3AF",
            }}
          />
          <h5
            className="fw-semibold mb-2"
            style={{
              fontSize: "18px",
              color: "#374151",
            }}
          >
            No Compliance Data
          </h5>
          <p
            className="mb-0"
            style={{
              fontSize: "14px",
              color: "#6B7280",
            }}
          >
            No SLA data available to display
          </p>
        </div>
      )}
    </div>
  );
};

export default SLACompliance;
