import React, { useState, useEffect, useRef } from "react";
import nominationService from "../../services/internal/nominationService";
import Breadcrumb from "../../components/common/Breadcrumb";
import { toast } from "sonner";
import { FaSearch } from "react-icons/fa";
import { Form } from "react-bootstrap";
import "../../styles/internal/NominationHistory.css";
const StatusDropdown = ({ value, onChange, options }) => {
  const [open, setOpen] = useState(false);
  const allOptions = [{ label: "All Status", value: "" }, ...options];
  const selected = allOptions.find((o) => o.value === value) || allOptions[0];
  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };
  return (
    <div
      className="nhad-status-select custom-nhad-dropdown"
      tabIndex={0}
      onBlur={() => setTimeout(() => setOpen(false), 200)}
    >
      <div
        className="custom-nhad-selected"
        onClick={() => setOpen((prev) => !prev)}
      >
        {selected.label}
        <span className="custom-nhad-arrow" />
      </div>
      {open && (
        <div className="custom-nhad-menu">
          {allOptions.map((opt) => (
            <div
              key={opt.value || "all-status"}
              className={
                "custom-nhad-option" +
                (opt.value === value ? " custom-nhad-option-active" : "")
              }
              onClick={() => handleSelect(opt.value)}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
const SelfNominations = ({
  nominations,
  searchTerm,
  setSearchTerm,
  activeSearchTerm,
  handleSearch,
  filterStatus,
  setFilterStatus,
  clearFilters,
  getStatusBadge,
  formatDate,
  getInitials,
  rowsPerPage,
  setRowsPerPage,
  currentPage,
  setCurrentPage,
}) => {
  const [filteredNominations, setFilteredNominations] = useState([]);
  const searchInputRef = useRef(null);
  useEffect(() => {
    applyFilters();
  }, [nominations, activeSearchTerm, filterStatus]);
  const applyFilters = () => {
    let filtered = [...nominations];
    if (activeSearchTerm.trim()) {
      const search = activeSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (nom) =>
          nom.opportunityTitle?.toLowerCase().includes(search) ||
          nom.employeeName?.toLowerCase().includes(search) ||
          nom.employeeCompanyId?.toLowerCase().includes(search) ||
          nom.opportunityType?.toLowerCase().includes(search)
      );
    }
    if (filterStatus) {
      filtered = filtered.filter((nom) => nom.currentStatus === filterStatus);
    }
    setFilteredNominations(filtered);
    setCurrentPage(1);
  };
  const totalPages = Math.ceil(filteredNominations.length / rowsPerPage) || 1;
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
  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
      if (searchInputRef.current) searchInputRef.current.blur();
    }
  };
  const statusOptions = [
    { label: "Approved", value: "Approved" },
    { label: "Rejected", value: "Rejected" },
    { label: "Withdrawn", value: "Withdrawn" },
  ];
  return (
    <>
      <div className="nhad-filters-card">
        <div className="nhad-filters-content">
          <div className="nhad-search-input">
            <div className="nhad-search-inner">
              <span className="nhad-search-icon">
                <FaSearch />
              </span>
              <Form.Control
                ref={searchInputRef}
                type="text"
                placeholder="Search oppourtunities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleSearchKeyDown}
                className="nhad-search-field"
              />
              <button
                type="button"
                className="nhad-search-btn"
                onClick={handleSearch}
              >
                Search
              </button>
            </div>
          </div>
          <StatusDropdown
            value={filterStatus}
            onChange={(val) => setFilterStatus(val)}
            options={statusOptions}
          />
          <button className="nhad-btn-clear" onClick={clearFilters}>
            Clear Filters
          </button>
          <div className="nhad-results-count">
            Showing {getPaginatedNominations().length} of{" "}
            {filteredNominations.length} nominations
          </div>
        </div>
      </div>
      <div className="nhad-table-card">
        <div className="nhad-table-wrapper">
          <table className="nhad-nomination-table">
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
                  <td colSpan="8" className="nhad-empty-state">
                    <i className="bi bi-inbox"></i>
                    <p>No self nominations found</p>
                    {activeSearchTerm && (
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
                      <span className="nhad-nomination-id">
                        #{nom.nominationId}
                      </span>
                    </td>
                    <td>
                      <div className="nhad-opportunity-cell">
                        <strong className="nhad-opportunity-title">
                          {nom.opportunityTitle}
                        </strong>
                        <span className="nhad-opportunity-type">
                          {nom.opportunityType}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="nhad-user-info">
                        <div className="nhad-user-avatar">
                          {getInitials(nom.employeeName)}
                        </div>
                        <div>
                          <span className="nhad-user-name">
                            {nom.employeeName}
                          </span>
                          <small className="nhad-user-id">
                            @{nom.employeeCompanyId}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="nhad-type-badge">
                        {nom.nominationType}
                      </span>
                    </td>
                    <td>
                      <span className={getStatusBadge(nom.currentStatus)}>
                        {nom.currentStatus}
                      </span>
                    </td>
                    <td className="text-muted">{formatDate(nom.nominatedDate)}</td>
                    <td>
                      {nom.currentStatus === "Approved" && (
                        <div className="nhad-action-cell nhad-action-approved">
                          <i className="bi bi-check-circle-fill me-1"></i>
                          Approved
                          {nom.finalizedDate && (
                            <div className="nhad-action-date">
                              {formatDate(nom.finalizedDate)}
                            </div>
                          )}
                        </div>
                      )}
                      {nom.currentStatus === "Rejected" && (
                        <div className="nhad-action-cell nhad-action-rejected">
                          <i className="bi bi-x-circle-fill me-1"></i>
                          Rejected
                          {nom.managerReviewComments && (
                            <div
                              className="nhad-action-reason"
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
                        <div className="nhad-action-cell nhad-action-withdrawn">
                          <i className="bi bi-dash-circle-fill me-1"></i>
                          Withdrawn
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="nhad-action-buttons">
                        <button
                          className="nhad-action-btn nhad-action-view"
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
        {filteredNominations.length > 0 && totalPages > 1 && (
          <div className="nhad-pagination">
            <div className="nhad-pagination-info">
              <span>Show</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>entries</span>
            </div>
            <div className="nhad-pagination-status">
              Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
              {Math.min(currentPage * rowsPerPage, filteredNominations.length)}{" "}
              of {filteredNominations.length} entries
            </div>
            <nav className="nhad-pagination-nav">
              <ul className="nhad-pagination-list">
                <li
                  className={`nhad-page-item ${
                    currentPage === 1 ? "disabled" : ""
                  }`}
                >
                  <button
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
                    className={`nhad-page-item ${
                      page === currentPage ? "active" : ""
                    } ${typeof page !== "number" ? "disabled" : ""}`}
                  >
                    <button
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
                  className={`nhad-page-item ${
                    currentPage === totalPages ? "disabled" : ""
                  }`}
                >
                  <button
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(prev + 1, totalPages)
                      )
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
    </>
  );
};
const TeamNominations = ({
  nominations,
  searchTerm,
  setSearchTerm,
  activeSearchTerm,
  handleSearch,
  filterStatus,
  setFilterStatus,
  clearFilters,
  getStatusBadge,
  formatDate,
  getInitials,
  rowsPerPage,
  setRowsPerPage,
  currentPage,
  setCurrentPage,
}) => {
  const [filteredNominations, setFilteredNominations] = useState([]);
  const searchInputRef = useRef(null);
  useEffect(() => {
    applyFilters();
  }, [nominations, activeSearchTerm, filterStatus]);
  const applyFilters = () => {
    let filtered = [...nominations];
    if (activeSearchTerm.trim()) {
      const search = activeSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (nom) =>
          nom.opportunityTitle?.toLowerCase().includes(search) ||
          nom.employeeName?.toLowerCase().includes(search) ||
          nom.employeeCompanyId?.toLowerCase().includes(search) ||
          nom.opportunityType?.toLowerCase().includes(search)
      );
    }
    if (filterStatus) {
      filtered = filtered.filter((nom) => nom.currentStatus === filterStatus);
    }
    setFilteredNominations(filtered);
    setCurrentPage(1);
  };
  const totalPages = Math.ceil(filteredNominations.length / rowsPerPage) || 1;
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
  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
      if (searchInputRef.current) searchInputRef.current.blur();
    }
  };
  const statusOptions = [
    { label: "Approved", value: "Approved" },
    { label: "Rejected", value: "Rejected" },
    { label: "Withdrawn", value: "Withdrawn" },
  ];
  return (
    <>
      <div className="nhad-filters-card">
        <div className="nhad-filters-content">
          <div className="nhad-search-input">
            <div className="nhad-search-inner">
              <span className="nhad-search-icon">
                <FaSearch />
              </span>
              <Form.Control
                ref={searchInputRef}
                type="text"
                placeholder="Search oppourtunities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleSearchKeyDown}
                className="nhad-search-field"
              />
              <button
                type="button"
                className="nhad-search-btn"
                onClick={handleSearch}
              >
                Search
              </button>
            </div>
          </div>
          <StatusDropdown
            value={filterStatus}
            onChange={(val) => setFilterStatus(val)}
            options={statusOptions}
          />
          <button className="nhad-btn-clear" onClick={clearFilters}>
            Clear Filters
          </button>
          <div className="nhad-results-count">
            Showing {getPaginatedNominations().length} of{" "}
            {filteredNominations.length} nominations
          </div>
        </div>
      </div>
      <div className="nhad-table-card">
        <div className="nhad-table-wrapper">
          <table className="nhad-nomination-table">
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
                  <td colSpan="8" className="nhad-empty-state">
                    <i className="bi bi-inbox"></i>
                    <p>No team nominations found</p>
                    {activeSearchTerm && (
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
                      <span className="nhad-nomination-id">
                        #{nom.nominationId}
                      </span>
                    </td>
                    <td>
                      <div className="nhad-opportunity-cell">
                        <strong className="nhad-opportunity-title">
                          {nom.opportunityTitle}
                        </strong>
                        <span className="nhad-opportunity-type">
                          {nom.opportunityType}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="nhad-user-info">
                        <div className="nhad-user-avatar">
                          {getInitials(nom.employeeName)}
                        </div>
                        <div>
                          <span className="nhad-user-name">
                            {nom.employeeName}
                          </span>
                          <small className="nhad-user-id">
                            @{nom.employeeCompanyId}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="nhad-type-badge">
                        {nom.nominationType}
                      </span>
                    </td>
                    <td>
                      <span className={getStatusBadge(nom.currentStatus)}>
                        {nom.currentStatus}
                      </span>
                    </td>
                    <td className="text-muted">{formatDate(nom.nominatedDate)}</td>
                    <td>
                      {nom.currentStatus === "Approved" && (
                        <div className="nhad-action-cell nhad-action-approved">
                          <i className="bi bi-check-circle-fill me-1"></i>
                          Approved
                          {nom.finalizedDate && (
                            <div className="nhad-action-date">
                              {formatDate(nom.finalizedDate)}
                            </div>
                          )}
                        </div>
                      )}
                      {nom.currentStatus === "Rejected" && (
                        <div className="nhad-action-cell nhad-action-rejected">
                          <i className="bi bi-x-circle-fill me-1"></i>
                          Rejected
                          {nom.managerReviewComments && (
                            <div
                              className="nhad-action-reason"
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
                        <div className="nhad-action-cell nhad-action-withdrawn">
                          <i className="bi bi-dash-circle-fill me-1"></i>
                          Withdrawn
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="nhad-action-buttons">
                        <button
                          className="nhad-action-btn nhad-action-view"
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
        {filteredNominations.length > 0 && totalPages > 1 && (
          <div className="nhad-pagination">
            <div className="nhad-pagination-info">
              <span>Show</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>entries</span>
            </div>
            <div className="nhad-pagination-status">
              Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
              {Math.min(currentPage * rowsPerPage, filteredNominations.length)}{" "}
              of {filteredNominations.length} entries
            </div>
            <nav className="nhad-pagination-nav">
              <ul className="nhad-pagination-list">
                <li
                  className={`nhad-page-item ${
                    currentPage === 1 ? "disabled" : ""
                  }`}
                >
                  <button
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
                    className={`nhad-page-item ${
                      page === currentPage ? "active" : ""
                    } ${typeof page !== "number" ? "disabled" : ""}`}
                  >
                    <button
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
                  className={`nhad-page-item ${
                    currentPage === totalPages ? "disabled" : ""
                  }`}
                >
                  <button
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(prev + 1, totalPages)
                      )
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
    </>
  );
};
const NominationHistory = () => {
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("self");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => {
    fetchHistory();
  }, []);
  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await nominationService.getMyNominationHistory(null);
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
  const handleSearch = () => {
    setActiveSearchTerm(searchTerm);
  };
  const clearFilters = () => {
    setSearchTerm("");
    setActiveSearchTerm("");
    setFilterStatus("");
  };
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    clearFilters();
    setCurrentPage(1);
  };
  const getStatusBadge = (status) => {
    const statusClasses = {
      Approved: "nhad-status-approved",
      Rejected: "nhad-status-rejected",
      Withdrawn: "nhad-status-withdrawn",
    };
    return `nhad-status-badge ${statusClasses[status] || "nhad-status-pending"}`;
  };
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };
  const getInitials = (name) => {
    if (!name) return "NA";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (
        parts[0].charAt(0).toUpperCase() + parts[1].charAt(0).toUpperCase()
      );
    }
    return name.substring(0, 2).toUpperCase();
  };
  if (loading) {
    return (
      <div className="nhad-loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  return (
    <div className="nhad-page">
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
      <div className="stats-cards-nhad">
        <div className="stat-card-nhad stat-total-nhad">
          <div className="stat-icon-nhad">
            <i className="bi bi-person-check-fill"></i>
          </div>
          <div className="stat-content-nhad">
            <div className="stat-value-nhad">
              {historyData?.statistics?.totalSelfNominations || 0}
            </div>
            <div className="stat-label-nhad">Self Nominations</div>
          </div>
        </div>
        <div className="stat-card-nhad stat-pending-nhad">
          <div className="stat-icon-nhad">
            <i className="bi bi-people-fill"></i>
          </div>
          <div className="stat-content-nhad">
            <div className="stat-value-nhad">
              {historyData?.statistics?.totalTeamNominations || 0}
            </div>
            <div className="stat-label-nhad">Team Nominations</div>
          </div>
        </div>
        <div className="stat-card-nhad stat-approved-nhad">
          <div className="stat-icon-nhad">
            <i className="bi bi-check-circle-fill"></i>
          </div>
          <div className="stat-content-nhad">
            <div className="stat-value-nhad">
              {historyData?.statistics?.approvedCount || 0}
            </div>
            <div className="stat-label-nhad">Approved</div>
          </div>
        </div>
        <div className="stat-card-nhad stat-rejected-nhad">
          <div className="stat-icon-nhad">
            <i className="bi bi-x-circle-fill"></i>
          </div>
          <div className="stat-content-nhad">
            <div className="stat-value-nhad">
              {historyData?.statistics?.rejectedCount || 0}
            </div>
            <div className="stat-label-nhad">Rejected</div>
          </div>
        </div>
      </div>
      <div className="nhad-nomination-tabs">
        <button
          className={`nhad-tab-btn ${activeTab === "self" ? "active" : ""}`}
          onClick={() => handleTabChange("self")}
        >
          <i className="bi bi-person-badge"></i>
          My Self Nominations
          {historyData?.selfNominations?.length > 0 && (
            <span className="badge bg-primary ms-2">
              {historyData?.selfNominations?.length || 0}
            </span>
          )}
        </button>
        <button
          className={`nhad-tab-btn ${activeTab === "team" ? "active" : ""}`}
          onClick={() => handleTabChange("team")}
        >
          <i className="bi bi-people"></i>
          My Team Nominations
          {historyData?.teamNominations?.length > 0 && (
            <span className="badge bg-primary ms-2">
              {historyData?.teamNominations?.length || 0}
            </span>
          )}
        </button>
      </div>
      <div className="tab-content-nhad">
        {activeTab === "self" ? (
          <SelfNominations
            nominations={historyData?.selfNominations || []}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            activeSearchTerm={activeSearchTerm}
            handleSearch={handleSearch}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            clearFilters={clearFilters}
            getStatusBadge={getStatusBadge}
            formatDate={formatDate}
            getInitials={getInitials}
            rowsPerPage={rowsPerPage}
            setRowsPerPage={setRowsPerPage}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        ) : (
          <TeamNominations
            nominations={historyData?.teamNominations || []}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            activeSearchTerm={activeSearchTerm}
            handleSearch={handleSearch}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            clearFilters={clearFilters}
            getStatusBadge={getStatusBadge}
            formatDate={formatDate}
            getInitials={getInitials}
            rowsPerPage={rowsPerPage}
            setRowsPerPage={setRowsPerPage}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
};
export default NominationHistory;
