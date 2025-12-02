import React, { useState, useEffect } from "react";
import nominationService from "../../services/internal/nominationService";
import Breadcrumb from "../../components/common/Breadcrumb";
import { toast } from "sonner";
import "../../styles/internal/NominationHistory.css";

const NominationHistory = () => {
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [activeTab, setActiveTab] = useState("self"); // "self" or "team"

  useEffect(() => {
    fetchHistory();
  }, [statusFilter]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await nominationService.getMyNominationHistory(
        statusFilter || null
      );

      if (response.success) {
        setHistoryData(response.data);
        toast.success("History loaded successfully");
      } else {
        toast.error(response.message || "Failed to load history");
      }
    } catch (error) {
      console.error("Error fetching history:", error);
      toast.error("Failed to load nomination history");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      Approved: "status-badge status-approved",
      Rejected: "status-badge status-rejected",
      Withdrawn: "status-badge status-withdrawn",
    };
    return statusClasses[status] || "status-badge status-pending";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name) => {
    if (!name) return "NA";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return (
      <div className="history-loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading nomination history...</p>
      </div>
    );
  }

  const currentNominations =
    activeTab === "self"
      ? historyData?.selfNominations || []
      : historyData?.teamNominations || [];

  return (
    <div className="nomination-history-container">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          {
            label: "Nominations",
            path: "/employee/nominations",
          },
          {
            label: "History",
          },
        ]}
      />

      {/* Header */}
      <div className="history-header">
        <div>
          <h2 className="history-title">
            <i className="bi bi-clock-history me-2"></i>
            Nomination History
          </h2>
          <p className="history-subtitle">
            View your past self-nominations and team nominations
          </p>
        </div>
        <button className="btn btn-outline-primary" onClick={fetchHistory}>
          <i className="bi bi-arrow-clockwise me-2"></i>
          Refresh
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="history-stats-grid">
        <div className="history-stat-card stat-primary">
          <div className="stat-icon">
            <i className="bi bi-person-check-fill"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">
              {historyData?.statistics?.totalSelfNominations || 0}
            </h3>
            <p className="stat-label">Self Nominations</p>
          </div>
        </div>

        <div className="history-stat-card stat-info">
          <div className="stat-icon">
            <i className="bi bi-people-fill"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">
              {historyData?.statistics?.totalTeamNominations || 0}
            </h3>
            <p className="stat-label">Team Nominations</p>
          </div>
        </div>

        <div className="history-stat-card stat-success">
          <div className="stat-icon">
            <i className="bi bi-check-circle-fill"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">
              {historyData?.statistics?.approvedCount || 0}
            </h3>
            <p className="stat-label">Approved</p>
          </div>
        </div>

        <div className="history-stat-card stat-danger">
          <div className="stat-icon">
            <i className="bi bi-x-circle-fill"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">
              {historyData?.statistics?.rejectedCount || 0}
            </h3>
            <p className="stat-label">Rejected</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="history-tabs-container">
        <div className="history-tabs">
          <button
            className={`history-tab ${activeTab === "self" ? "active" : ""}`}
            onClick={() => setActiveTab("self")}
          >
            <i className="bi bi-person-badge me-2"></i>
            My Self Nominations
            <span className="tab-badge">
              {historyData?.selfNominations?.length || 0}
            </span>
          </button>
          <button
            className={`history-tab ${activeTab === "team" ? "active" : ""}`}
            onClick={() => setActiveTab("team")}
          >
            <i className="bi bi-people me-2"></i>
            My Team Nominations
            <span className="tab-badge">
              {historyData?.teamNominations?.length || 0}
            </span>
          </button>
        </div>

        {/* Status Filter */}
        <div className="history-filter">
          <label htmlFor="statusFilter" className="filter-label">
            Filter by Status:
          </label>
          <select
            id="statusFilter"
            className="form-select filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Withdrawn">Withdrawn</option>
          </select>
        </div>
      </div>

      {/* Nominations Table */}
      <div className="history-table-card">
        {currentNominations.length === 0 ? (
          <div className="history-empty-state">
            <i className="bi bi-inbox empty-icon"></i>
            <h4>
              No {activeTab === "self" ? "Self" : "Team"} Nominations Found
            </h4>
            <p className="text-muted">
              {activeTab === "self"
                ? "You haven't completed any self-nominations yet."
                : "You haven't nominated any team members yet."}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="history-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Opportunity</th>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Final Action</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentNominations.map((nom) => (
                  <tr key={nom.nominationId}>
                    <td>
                      <span className="nomination-id">#{nom.nominationId}</span>
                    </td>
                    <td>
                      <div className="opportunity-cell">
                        <strong className="opportunity-title">
                          {nom.opportunityTitle}
                        </strong>
                        <span className="opportunity-type">
                          {nom.opportunityType}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="employee-cell">
                        <div className="employee-avatar">
                          {getInitials(nom.employeeName)}
                        </div>
                        <div>
                          <div className="employee-name">
                            {nom.employeeName}
                          </div>
                          <div className="employee-id">
                            @{nom.employeeCompanyId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="type-badge">{nom.nominationType}</span>
                    </td>
                    <td>
                      <span className={getStatusBadge(nom.currentStatus)}>
                        {nom.currentStatus}
                      </span>
                    </td>
                    <td className="text-muted">
                      {formatDate(nom.nominatedDate)}
                    </td>
                    <td>
                      {nom.currentStatus === "Approved" && (
                        <div className="action-cell action-approved">
                          <i className="bi bi-check-circle-fill me-1"></i>
                          Approved
                          {nom.finalizedDate && (
                            <div className="action-date">
                              {formatDate(nom.finalizedDate)}
                            </div>
                          )}
                        </div>
                      )}
                      {nom.currentStatus === "Rejected" && (
                        <div className="action-cell action-rejected">
                          <i className="bi bi-x-circle-fill me-1"></i>
                          Rejected
                          {nom.managerReviewComments && (
                            <div
                              className="action-reason"
                              title={nom.managerReviewComments}
                            >
                              {nom.managerReviewComments.length > 30
                                ? nom.managerReviewComments.substring(0, 30) +
                                  "..."
                                : nom.managerReviewComments}
                            </div>
                          )}
                        </div>
                      )}
                      {nom.currentStatus === "Withdrawn" && (
                        <div className="action-cell action-withdrawn">
                          <i className="bi bi-dash-circle-fill me-1"></i>
                          Withdrawn
                        </div>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary action-btn-view"
                        title="View Details"
                        onClick={() =>
                          toast.info("View details functionality coming soon")
                        }
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default NominationHistory;
