import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Spinner, Badge, Button } from "react-bootstrap";
import { FaSearch } from "react-icons/fa";
import violationService from "../../../../services/hr_operations/hr/violationService";
import EscalationDetailModal from "../../../../components/hr_operations/modals/EscalationDetailModal";
import "../../../../styles/hr_operations/hr/ComplianceIssues.css";

const StatusDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);

  const options = [
    { label: "All Status", value: "" },
    { label: "Open", value: "Open" },
    { label: "Pending", value: "Pending" },
    { label: "Resolved", value: "Resolved" },
  ];

  const selected = options.find((o) => o.value === value) || options[0];

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div
      className="ci-filter-select custom-status-dropdown"
      tabIndex={0}
      onBlur={() => setOpen(false)}
      onClick={() => setOpen((prev) => !prev)}
      style={{ position: "relative" }}
    >
      <div className="custom-status-selected">
        {selected.label}
        <span className="custom-status-arrow" />
      </div>
      {open && (
        <div className="custom-status-menu">
          {options.map((opt) => (
            <div
              key={opt.value || "all-status"}
              className={
                "custom-status-option" +
                (opt.value === value ? " custom-status-option-active" : "")
              }
              onMouseDown={() => handleSelect(opt.value)}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const LevelDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);

  const options = [
    { label: "All Levels", value: "" },
    { label: "L1", value: "L1" },
    { label: "L2", value: "L2" },
  ];

  const selected = options.find((o) => o.value === value) || options[0];

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div
      className="ci-filter-select custom-status-dropdown"
      tabIndex={0}
      onBlur={() => setOpen(false)}
      onClick={() => setOpen((prev) => !prev)}
      style={{ position: "relative" }}
    >
      <div className="custom-status-selected">
        {selected.label}
        <span className="custom-status-arrow" />
      </div>
      {open && (
        <div className="custom-status-menu">
          {options.map((opt) => (
            <div
              key={opt.value || "all-levels"}
              className={
                "custom-status-option" +
                (opt.value === value ? " custom-status-option-active" : "")
              }
              onMouseDown={() => handleSelect(opt.value)}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ComplianceIssues = () => {
  // ===== STATE MANAGEMENT =====
  const [slaEscalations, setSlaEscalations] = useState([]);
  const [filteredEscalations, setFilteredEscalations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showEscalationDetailModal, setShowEscalationDetailModal] =
    useState(false);
  const [selectedEscalation, setSelectedEscalation] = useState(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState(""); // applied search
  const [searchInput, setSearchInput] = useState(""); // text in box
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");

  // View Mode State
  const [viewMode, setViewMode] = useState("table");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ===== EFFECTS =====
  useEffect(() => {
    fetchData();
  }, []);

  // Apply filters whenever data / filters / applied search term change
  useEffect(() => {
    applyEscalationFilters();
  }, [searchTerm, selectedStatus, selectedLevel, slaEscalations]);

  // ===== DATA FETCHING =====
  const fetchData = async () => {
    try {
      setLoading(true);
      await fetchSlaEscalations();
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSlaEscalations = async () => {
    try {
      const response = await violationService.getAllSlaEscalations();
      if (response.success) {
        setSlaEscalations(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching SLA escalations:", error);
      toast.error("Error loading SLA escalations");
    }
  };

  // ===== FILTER LOGIC =====
  const applyEscalationFilters = () => {
    let filtered = [...slaEscalations];

    if (selectedStatus) {
      filtered = filtered.filter((e) => e.escalationStatus === selectedStatus);
    }

    if (selectedLevel) {
      filtered = filtered.filter((e) => e.escalationLevel === selectedLevel);
    }

    if (searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          (e.employeeName &&
            e.employeeName.toLowerCase().includes(searchLower)) ||
          (e.employeeEmail &&
            e.employeeEmail.toLowerCase().includes(searchLower)) ||
          (e.slaType && e.slaType.toLowerCase().includes(searchLower)) ||
          (e.reason && e.reason.toLowerCase().includes(searchLower))
      );
    }

    setFilteredEscalations(filtered);
    setCurrentPage(1);
  };

  // Triggered when user presses the Search button
  const handleSearchClick = () => {
    setSearchTerm(searchInput.trim());
  };

  // ===== CLEAR FILTERS =====
  const clearFilters = () => {
    setSearchInput("");
    setSearchTerm("");
    setSelectedStatus("");
    setSelectedLevel("");

    // reset to full list explicitly
    setFilteredEscalations(slaEscalations);
    setCurrentPage(1);
  };

  // ===== PAGINATION HELPERS =====
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredEscalations.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredEscalations.length / rowsPerPage);

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

  // ===== MODAL HANDLERS =====
  const handleViewEscalationDetails = (escalation) => {
    setSelectedEscalation(escalation);
    setShowEscalationDetailModal(true);
  };

  // ===== BADGE HELPERS =====
  const getSeverityBadge = (severity) => {
    const badges = {
      Low: "success",
      Medium: "warning",
      High: "danger",
      Critical: "dark",
    };
    return badges[severity] || "secondary";
  };

  const getStatusBadge = (status) => {
    const badges = {
      Open: "primary",
      Pending: "warning",
      Resolved: "success",
    };
    return badges[status] || "secondary";
  };

  // ===== FORMAT DATE (unused currently but kept) =====
  const formatDate = (date) => {
    return date
      ? new Date(date).toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "N/A";
  };

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="ci-loading-container">
        <Spinner animation="border" variant="primary" />
        <p>Loading compliance data...</p>
      </div>
    );
  }

  // ===== RENDER =====
  return (
    <div className="ci-root">
      {/* CONTROLS BAR */}
      <div className="ci-filter-section">
        <div className="ci-filter-row-single">
          {/* Combined search input + button */}
          <div className="ci-search-input-wrapper">
            <div className="ci-search-inner">
              <span className="ci-search-icon">
                <FaSearch />
              </span>
              <input
                type="text"
                placeholder="Search by employee, SLA type, reason..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="ci-search-field"
              />
              <button
                type="button"
                className="ci-search-btn"
                onClick={handleSearchClick}
              >
                Search
              </button>
            </div>
          </div>

          <StatusDropdown
            value={selectedStatus}
            onChange={setSelectedStatus}
          />

          <LevelDropdown value={selectedLevel} onChange={setSelectedLevel} />

          <Button
            variant="outline-secondary"
            onClick={clearFilters}
            className="ci-clear-btn"
          >
            Clear Filters
          </Button>

          <div className="ci-view-switcher">
            <button
              className={`ci-view-btn ${viewMode === "card" ? "active" : ""}`}
              onClick={() => setViewMode("card")}
              title="Card View"
            >
              <i className="bi bi-grid-3x3-gap-fill"></i>
            </button>
            <button
              className={`ci-view-btn ${
                viewMode === "table" ? "active" : ""
              }`}
              onClick={() => setViewMode("table")}
              title="Table View"
            >
              <i className="bi bi-table"></i>
            </button>
          </div>
        </div>
      </div>

      {/* EMPTY STATE */}
      {filteredEscalations.length === 0 ? (
        <div className="ci-empty-state">
          <div className="ci-empty-icon">
            <i className="bi bi-inbox"></i>
          </div>
          <h4>No escalations found</h4>
          <p>Adjust your search or filters</p>
        </div>
      ) : (
        <>
          {/* CARD VIEW WITH PAGINATION */}
          {viewMode === "card" && (
            <>
              <div className="ci-violations-grid">
                {currentItems.map((escalation) => (
                  <div key={escalation.escalationId} className="ci-card-item">
                    <div className="ci-card-header">
                      <div className="ci-card-icon-badge">
                        <i className="bi bi-exclamation-triangle-fill"></i>
                      </div>
                      <Badge
                        bg={getStatusBadge(escalation.escalationStatus)}
                        className="ci-card-status-badge"
                      >
                        {escalation.escalationStatus}
                      </Badge>
                    </div>

                    <div className="ci-card-body">
                      <h3 className="ci-card-employee-name">
                        {escalation.employeeName || "Unknown Employee"}
                      </h3>
                      <span className="ci-card-user-id">
                        User ID: {escalation.employeeCompanyId}
                      </span>
                      <p className="ci-card-email">
                        {escalation.employeeEmail || "N/A"}
                      </p>

                      <div className="ci-card-details-grid">
                        <div className="ci-card-detail-item">
                          <span className="ci-card-detail-label">SLA Type</span>
                          <span className="ci-card-detail-value">
                            {escalation.slaType || "N/A"}
                          </span>
                        </div>
                        <div className="ci-card-detail-item">
                          <span className="ci-card-detail-label">Level</span>
                          <span className="ci-card-detail-value">
                            {escalation.escalationLevel}
                          </span>
                        </div>
                        <div className="ci-card-detail-item">
                          <span className="ci-card-detail-label">
                            Days Overdue
                          </span>
                          <span className="ci-card-detail-value ci-card-highlight-danger">
                            {escalation.daysOverdue} days
                          </span>
                        </div>
                        <div className="ci-card-detail-item">
                          <span className="ci-card-detail-label">Severity</span>
                          <Badge
                            bg={getSeverityBadge(escalation.severity)}
                            className="ci-card-severity-badge"
                          >
                            {escalation.severity}
                          </Badge>
                        </div>
                      </div>

                      <div className="ci-card-reason">
                        <strong>Reason:</strong>
                        <p>{escalation.reason || "No reason provided"}</p>
                      </div>
                    </div>

                    <div className="ci-card-footer">
                      <div className="ci-card-escalated-to">
                        <i className="bi bi-person-fill"></i>
                        <span>
                          {escalation.escalatedToName || "Not Assigned"}
                        </span>
                      </div>
                      <div className="ci-card-actions">
                        <button
                          className="action-btn action-btn-edit"
                          onClick={() =>
                            handleViewEscalationDetails(escalation)
                          }
                          title="View Details"
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* PAGINATION FOR CARD VIEW */}
              {filteredEscalations.length > 0 && (
                <div className="ci-pagination-wrapper">
                  <div className="pagination-container">
                    <div className="pagination-info">
                      <span className="pagination-label">Show</span>
                      <select
                        className="pagination-select"
                        value={rowsPerPage}
                        onChange={(e) => {
                          setRowsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                      >
                        <option value="6">6</option>
                        <option value="9">9</option>
                        <option value="12">12</option>
                        <option value="24">24</option>
                      </select>
                      <span className="pagination-label">entries</span>
                    </div>

                    <div className="pagination-status">
                      Showing {indexOfFirstItem + 1} to{" "}
                      {Math.min(
                        indexOfLastItem,
                        filteredEscalations.length
                      )}{" "}
                      of {filteredEscalations.length} entries
                    </div>

                    <nav className="pagination-nav">
                      <ul className="pagination">
                        <li
                          className={`page-item ${
                            currentPage === 1 ? "disabled" : ""
                          }`}
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
                            } ${
                              typeof page !== "number" ? "disabled" : ""
                            }`}
                          >
                            <button
                              className="page-link"
                              onClick={() =>
                                typeof page === "number" &&
                                setCurrentPage(page)
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
                </div>
              )}
            </>
          )}

          {/* TABLE VIEW WITH PAGINATION */}
          {viewMode === "table" && (
            <>
              <div className="ci-table-card">
                <div className="ci-table-wrapper">
                  <table className="ci-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>SLA Type</th>
                        <th>Level</th>
                        <th>Days Overdue</th>
                        <th>Severity</th>
                        <th>Status</th>
                        <th>Escalated To</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((escalation) => (
                        <tr key={escalation.escalationId}>
                          <td>
                            <div className="ci-table-employee">
                              <span className="ci-table-employee-name">
                                {escalation.employeeName ||
                                  "Unknown Employee"}
                              </span>
                              <span className="ci-table-employee-id">
                                ID: {escalation.employeeUserId}
                              </span>
                            </div>
                          </td>
                          <td>{escalation.slaType || "N/A"}</td>
                          <td>{escalation.escalationLevel}</td>
                          <td>
                            <span className="ci-table-highlight-danger">
                              {escalation.daysOverdue} days
                            </span>
                          </td>
                          <td>
                            <Badge bg={getSeverityBadge(escalation.severity)}>
                              {escalation.severity}
                            </Badge>
                          </td>
                          <td>
                            <Badge
                              bg={getStatusBadge(escalation.escalationStatus)}
                            >
                              {escalation.escalationStatus}
                            </Badge>
                          </td>
                          <td>
                            {escalation.escalatedToName || "Not Assigned"}
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="action-btn action-btn-edit"
                                onClick={() =>
                                  handleViewEscalationDetails(escalation)
                                }
                                title="View Details"
                              >
                                <i className="bi bi-eye"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* PAGINATION FOR TABLE VIEW */}
                {filteredEscalations.length > 0 && (
                  <div className="pagination-container">
                    <div className="pagination-info">
                      <span className="pagination-label">Show</span>
                      <select
                        className="pagination-select"
                        value={rowsPerPage}
                        onChange={(e) => {
                          setRowsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                      >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                      </select>
                      <span className="pagination-label">entries</span>
                    </div>

                    <div className="pagination-status">
                      Showing {indexOfFirstItem + 1} to{" "}
                      {Math.min(
                        indexOfLastItem,
                        filteredEscalations.length
                      )}{" "}
                      of {filteredEscalations.length} entries
                    </div>

                    <nav className="pagination-nav">
                      <ul className="pagination">
                        <li
                          className={`page-item ${
                            currentPage === 1 ? "disabled" : ""
                          }`}
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
                            } ${
                              typeof page !== "number" ? "disabled" : ""
                            }`}
                          >
                            <button
                              className="page-link"
                              onClick={() =>
                                typeof page === "number" &&
                                setCurrentPage(page)
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
          )}
        </>
      )}

      {/* ESCALATION DETAIL MODAL */}
      <EscalationDetailModal
        show={showEscalationDetailModal}
        onHide={() => setShowEscalationDetailModal(false)}
        escalation={selectedEscalation}
        getSeverityBadge={getSeverityBadge}
        getStatusBadge={getStatusBadge}
      />
    </div>
  );
};

export default ComplianceIssues;
