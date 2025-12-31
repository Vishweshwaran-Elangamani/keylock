
import React, { useState, useEffect, useRef } from "react";
import nominationService from "../../services/internal/nominationService";
import Breadcrumb from "../../components/common/Breadcrumb";
import { toast } from "sonner";
import "../../styles/internal/NominationHistory.css";


const CustomDropdown = ({ value, onChange, options, placeholder, name }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optionValue) => {
    onChange({ target: { name, value: optionValue } });
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="nha-custom-dropdown">
      <div
        className="nha-custom-dropdown-selected"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="nha-custom-dropdown-text">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className={`nha-custom-dropdown-arrow ${isOpen ? "open" : ""}`}>
          <i className="bi bi-chevron-down"></i>
        </span>
      </div>

      {isOpen && (
        <div className="nha-custom-dropdown-menu">
          {options.map((option) => (
            <div
              key={option.value}
              className={`nha-custom-dropdown-option ${
                value === option.value ? "selected" : ""
              }`}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const NominationHistory = () => {
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [activeTab, setActiveTab] = useState("self");
  const [searchTerm, setSearchTerm] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

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
      Approved: "nha-status-approved",
      Rejected: "nha-status-rejected",
      Withdrawn: "nha-status-withdrawn",
    };
    return `nha-status-badge ${
      statusClasses[status] || "nha-status-pending"
    }`;
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

  const clearFilters = () => {
    setStatusFilter("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  // Filter nominations based on search and status
  const getFilteredNominations = () => {
    let nominations =
      activeTab === "self"
        ? historyData?.selfNominations || []
        : historyData?.teamNominations || [];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      nominations = nominations.filter(
        (nom) =>
          nom.opportunityTitle?.toLowerCase().includes(search) ||
          nom.employeeName?.toLowerCase().includes(search) ||
          nom.employeeCompanyId?.toLowerCase().includes(search) ||
          nom.opportunityType?.toLowerCase().includes(search)
      );
    }

    return nominations;
  };

  const filteredNominations = getFilteredNominations();
  const totalPages = Math.ceil(filteredNominations.length / rowsPerPage);

  const getPaginatedNominations = () => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredNominations.slice(startIndex, endIndex);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages
        );
      }
    }

    return pages;
  };

  // Status filter options
  const statusOptions = [
    { label: "All Status", value: "" },
    { label: "Approved", value: "Approved" },
    { label: "Rejected", value: "Rejected" },
    { label: "Withdrawn", value: "Withdrawn" },
  ];

  // Rows per page options
  const rowsPerPageOptions = [
    { label: "5", value: "5" },
    { label: "10", value: "10" },
    { label: "25", value: "25" },
    { label: "50", value: "50" },
  ];

  if (loading) {
    return (
      <div className="nha-loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading nomination history...</p>
      </div>
    );
  }

  return (
    <div className="nha-nomination-history-page">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          {
            label: "Nominations",
            path: "/internal/nominations",
          },
          {
            label: "History",
          },
        ]}
      />

      {/* Statistics Cards */}
      <div className="nha-stats-grid">
        <div className="nha-stat-card">
          <div className="nha-stat-icon nha-stat-icon-primary">
            <i className="bi bi-person-check-fill"></i>
          </div>
          <div className="nha-stat-content">
            <h3 className="nha-stat-value">
              {historyData?.statistics?.totalSelfNominations || 0}
            </h3>
            <p className="nha-stat-label">Self Nominations</p>
          </div>
        </div>

        <div className="nha-stat-card">
          <div className="nha-stat-icon nha-stat-icon-info">
            <i className="bi bi-people-fill"></i>
          </div>
          <div className="nha-stat-content">
            <h3 className="nha-stat-value">
              {historyData?.statistics?.totalTeamNominations || 0}
            </h3>
            <p className="nha-stat-label">Team Nominations</p>
          </div>
        </div>

        <div className="nha-stat-card">
          <div className="nha-stat-icon nha-stat-icon-success">
            <i className="bi bi-check-circle-fill"></i>
          </div>
          <div className="nha-stat-content">
            <h3 className="nha-stat-value">
              {historyData?.statistics?.approvedCount || 0}
            </h3>
            <p className="nha-stat-label">Approved</p>
          </div>
        </div>

        <div className="nha-stat-card">
          <div className="nha-stat-icon nha-stat-icon-danger">
            <i className="bi bi-x-circle-fill"></i>
          </div>
          <div className="nha-stat-content">
            <h3 className="nha-stat-value">
              {historyData?.statistics?.rejectedCount || 0}
            </h3>
            <p className="nha-stat-label">Rejected</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="nha-nomination-tabs">
        <button
          className={`nha-tab-btn ${activeTab === "self" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("self");
            setCurrentPage(1);
          }}
        >
          <i className="bi bi-person-badge"></i>
          My Self Nominations
          <span className="badge bg-primary ms-2">
            {historyData?.selfNominations?.length || 0}
          </span>
        </button>
        <button
          className={`nha-tab-btn ${activeTab === "team" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("team");
            setCurrentPage(1);
          }}
        >
          <i className="bi bi-people"></i>
          My Team Nominations
          <span className="badge bg-primary ms-2">
            {historyData?.teamNominations?.length || 0}
          </span>
        </button>
      </div>

      {/* Filters Card */}
      <div className="nha-filters-card">
        <div className="nha-filters-content">
          <div className="nha-search-box">
            <i className="bi bi-search nha-search-icon"></i>
            <input
              type="text"
              className="nha-search-input"
              placeholder="Search by opportunity, employee, or type..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <CustomDropdown
            name="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={statusOptions}
            placeholder="All Status"
          />

          <button className="btn-clear-nha" onClick={clearFilters}>
            Clear Filters
          </button>

          <button className="btn-refresh-nha" onClick={fetchHistory}>
            <i className="bi bi-arrow-clockwise me-2"></i>
            Refresh
          </button>

          <div className="results-count-inline-nha">
            Showing {getPaginatedNominations().length} of{" "}
            {filteredNominations.length} nominations
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="nha-table-card">
        <div className="nha-table-wrapper">
          <table className="nha-nomination-table">
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
              {getPaginatedNominations().length === 0 ? (
                <tr>
                  <td colSpan="8" className="nha-empty-state">
                    <i className="bi bi-inbox"></i>
                    <p>
                      No {activeTab === "self" ? "self" : "team"} nominations
                      found
                    </p>
                    {searchTerm && (
                      <small className="text-muted">
                        Try adjusting your search criteria
                      </small>
                    )}
                  </td>
                </tr>
              ) : (
                getPaginatedNominations().map((nom) => (
                  <tr key={nom.nominationId}>
                    <td>
                      <span className="nha-nomination-id">
                        #{nom.nominationId}
                      </span>
                    </td>

                    <td>
                      <div className="nha-opportunity-cell">
                        <strong className="nha-opportunity-title">
                          {nom.opportunityTitle}
                        </strong>
                        <span className="nha-opportunity-type">
                          {nom.opportunityType}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div className="nha-employee-cell">
                        <div className="nha-employee-avatar">
                          {getInitials(nom.employeeName)}
                        </div>
                        <div>
                          <div className="nha-employee-name">
                            {nom.employeeName}
                          </div>
                          <div className="nha-employee-id">
                            @{nom.employeeCompanyId}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="nha-type-badge">
                        {nom.nominationType}
                      </span>
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
                        <div className="nha-action-cell nha-action-approved">
                          <i className="bi bi-check-circle-fill me-1"></i>
                          Approved
                          {nom.finalizedDate && (
                            <div className="nha-action-date">
                              {formatDate(nom.finalizedDate)}
                            </div>
                          )}
                        </div>
                      )}
                      {nom.currentStatus === "Rejected" && (
                        <div className="nha-action-cell nha-action-rejected">
                          <i className="bi bi-x-circle-fill me-1"></i>
                          Rejected
                          {nom.managerReviewComments && (
                            <div
                              className="nha-action-reason"
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
                        <div className="nha-action-cell nha-action-withdrawn">
                          <i className="bi bi-dash-circle-fill me-1"></i>
                          Withdrawn
                        </div>
                      )}
                    </td>

                    <td>
                      <div className="nha-action-buttons">
                        <button
                          className="action-btn action-btn-view"
                          title="View Details"
                          onClick={() =>
                            toast.info("View details functionality coming soon")
                          }
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredNominations.length > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              <span className="pagination-label">Show</span>
              <CustomDropdown
                name="rowsPerPage"
                value={rowsPerPage.toString()}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                options={rowsPerPageOptions}
                placeholder="5"
              />
              <span className="pagination-label">entries</span>
            </div>

            <div className="pagination-status">
              Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
              {Math.min(currentPage * rowsPerPage, filteredNominations.length)}{" "}
              of {filteredNominations.length} entries
            </div>

            <nav className="pagination-nav">
              <ul className="pagination">
                <li
                  className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                </li>

                {getPageNumbers().map((page, index) => (
                  <li
                    key={index}
                    className={`page-item ${
                      page === currentPage ? "active" : ""
                    } ${typeof page !== "number" ? "disabled" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() =>
                        typeof page === "number" && setCurrentPage(page)
                      }
                      disabled={typeof page !== "number"}
                    >
                      {page}
                    </button>
                  </li>
                ))}

                <li
                  className={`page-item ${
                    currentPage === totalPages ? "disabled" : ""
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default NominationHistory;
