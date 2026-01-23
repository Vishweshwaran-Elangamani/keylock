import React, { useState, useEffect, useMemo } from "react";
import { FileText, AlertCircle, Users, CheckCircle, Clock } from "lucide-react";
import ComplianceCard from "../../components/sla/cards/ComplianceCard";
import Breadcrumb from "../../components/sla/common/Breadcrumbs";
import slaService from "../../services/sla/slaService";
import {
  getComplianceSummary,
  getComplianceRating,
} from "../../utils/sla/slaCalculations";
import "../../styles/sla/components/SLACompliance.css";

const SLACompliance = () => {
  const [allSLAs, setAllSLAs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("table");

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

    return {
      ...totals,
      avgCompliance: avgCompliance.toFixed(1),
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

  const getRatingClassName = (ratingObj, dept) => {
    const color = ratingObj?.color?.toLowerCase() || "";
    if (color.includes("green")) return "sla-compliance-rating-green";
    if (color.includes("red")) return "sla-compliance-rating-red";
    if (color.includes("yellow") || color.includes("orange"))
      return "sla-compliance-rating-yellow";
    if (dept?.complianceRating?.toLowerCase()?.includes("good"))
      return "sla-compliance-rating-green";
    return "sla-compliance-rating-blue";
  };

  return (
    <div className="sla-compliance-wrapper">
      <div className="sla-compliance-breadcrumbs">
        <Breadcrumb items={[{ label: "SLA Compliance" }]} />
      </div>

      <div className="sla-compliance-header">
        <div className="sla-compliance-header-text">
          <p className="sla-compliance-subtitle">
            Department-wise SLA compliance metrics (Based on Closed SLAs)
          </p>
        </div>
      </div>

      <div className="sla-compliance-stats-grid">
        <div className="sla-compliance-stat-card">
          <div className="sla-compliance-stat-icon-wrapper sla-compliance-stat-icon-blue">
            <Users size={24} />
          </div>
          <div className="sla-compliance-stat-content">
            <h2 className="sla-compliance-stat-value">{stats.totalSLAs}</h2>
            <p className="sla-compliance-stat-label">Total Escalations</p>
          </div>
        </div>

        <div className="sla-compliance-stat-card">
          <div className="sla-compliance-stat-icon-wrapper sla-compliance-stat-icon-green">
            <CheckCircle size={24} />
          </div>
          <div className="sla-compliance-stat-content">
            <h2 className="sla-compliance-stat-value">{stats.closedSLAs}</h2>
            <p className="sla-compliance-stat-label">Approved</p>
          </div>
        </div>

        <div className="sla-compliance-stat-card">
          <div className="sla-compliance-stat-icon-wrapper sla-compliance-stat-icon-yellow">
            <Clock size={24} />
          </div>
          <div className="sla-compliance-stat-content">
            <h2 className="sla-compliance-stat-value">{stats.openSLAs}</h2>
            <p className="sla-compliance-stat-label">Pending</p>
          </div>
        </div>

        <div className="sla-compliance-stat-card">
          <div className="sla-compliance-stat-icon-wrapper sla-compliance-stat-icon-red">
            <AlertCircle size={24} />
          </div>
          <div className="sla-compliance-stat-content">
            <h2 className="sla-compliance-stat-value">{stats.breachedSLAs}</h2>
            <p className="sla-compliance-stat-label">Rejected</p>
          </div>
        </div>
      </div>

      <div className="sla-compliance-view-toggle-wrapper">
        <div
          className="sla-compliance-view-toggle"
          role="group"
          aria-label="View switcher"
        >
          <button
            type="button"
            className={`sla-compliance-toggle-btn ${
              viewMode === "table" ? "sla-compliance-toggle-btn-active" : ""
            }`}
            onClick={() => setViewMode("table")}
            title="Table View"
            aria-pressed={viewMode === "table"}
          >
            <i className="bi bi-table sla-toggle-icon" aria-hidden="true"></i>
            <span className="visually-hidden">Table View</span>
          </button>

          <button
            type="button"
            className={`sla-compliance-toggle-btn ${
              viewMode === "cards" ? "sla-compliance-toggle-btn-active" : ""
            }`}
            onClick={() => setViewMode("cards")}
            title="Cards View"
            aria-pressed={viewMode === "cards"}
          >
            <i
              className="bi bi-grid-3x3-gap-fill sla-toggle-icon"
              aria-hidden="true"
            ></i>
            <span className="visually-hidden">Cards View</span>
          </button>
        </div>
      </div>

      <div className="sla-compliance-section-heading">
        <h5 className="sla-compliance-section-title">
          Department Compliance Overview
        </h5>
      </div>

      {error && (
        <div className="sla-compliance-alert">
          <AlertCircle size={18} className="sla-compliance-alert-icon" />
          <span className="sla-compliance-alert-text">{error}</span>
          <button
            type="button"
            className="sla-compliance-alert-close"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}

      {loading ? (
        <div className="sla-compliance-loading">
          <div className="sla-compliance-spinner" />
          <p className="sla-compliance-loading-text">
            Loading compliance data...
          </p>
        </div>
      ) : (
        <>
          {viewMode === "cards" && (
            <div className="sla-compliance-cards-grid">
              {sortedData.map((compliance) => (
                <ComplianceCard
                  key={compliance.complianceId}
                  compliance={compliance}
                  slaData={allSLAs.filter(
                    (sla) => sla.departmentId === compliance.departmentId
                  )}
                  showActions={false}
                />
              ))}
            </div>
          )}

          {viewMode === "table" && (
            <div className="sla-compliance-table-card">
              <div className="sla-compliance-table-responsive">
                <table className="sla-compliance-table">
                  <thead className="sla-compliance-table-header">
                    <tr>
                      <th>Department</th>
                      <th className="sla-compliance-table-header-center">
                        Total
                      </th>
                      <th className="sla-compliance-table-header-center">
                        Closed
                      </th>
                      <th className="sla-compliance-table-header-center">
                        Open
                      </th>
                      <th className="sla-compliance-table-header-center">
                        On-Time
                      </th>
                      <th className="sla-compliance-table-header-center">
                        Breached
                      </th>
                      <th className="sla-compliance-table-header-center">
                        Extended
                      </th>
                      <th className="sla-compliance-table-header-center-compliance">
                        Compliance
                      </th>
                      <th className="sla-compliance-table-header-center">
                        Rating
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {sortedData.map((dept) => {
                      const ratingObj = getComplianceRating(
                        dept.compliancePercentage
                      );
                      const ratingClassName = getRatingClassName(
                        ratingObj,
                        dept
                      );

                      return (
                        <tr key={dept.complianceId}>
                          <td className="sla-compliance-table-dept-name">
                            {dept.departmentName}
                          </td>

                          <td className="sla-compliance-table-cell-center">
                            {dept.totalSlas}
                          </td>

                          <td className="sla-compliance-table-cell-center">
                            {dept.closedSlas}
                          </td>

                          <td className="sla-compliance-table-cell-center">
                            {dept.openSlas}
                          </td>

                          <td className="sla-compliance-table-cell-center">
                            {dept.onTimeSlas}
                          </td>

                          <td className="sla-compliance-table-cell-center">
                            {dept.breachedSlas}
                          </td>

                          <td className="sla-compliance-table-cell-center">
                            {dept.extendedSlas}
                          </td>

                          <td className="sla-compliance-table-cell-center">
                            <div className="sla-compliance-progress-wrapper">
                              <progress
                                className={`sla-compliance-progress-bar ${ratingClassName}`}
                                value={Math.min(100, dept.compliancePercentage)}
                                max={100}
                              />
                              <span
                                className={`sla-compliance-progress-text ${ratingClassName}`}
                              >
                                {dept.compliancePercentage.toFixed(1)}%
                              </span>
                            </div>
                          </td>

                          <td className="sla-compliance-table-cell-center">
                            {dept.complianceRating}
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

      {!loading && sortedData.length === 0 && (
        <div className="sla-compliance-empty">
          <FileText size={48} className="sla-compliance-empty-icon" />
          <h5 className="sla-compliance-empty-title">No Compliance Data</h5>
          <p className="sla-compliance-empty-text">
            No SLA data available to display
          </p>
        </div>
      )}
    </div>
  );
};

export default SLACompliance;
