import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Form } from "react-bootstrap";
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
      className="ci-status-select custom-status-dropdown"
      tabIndex={0}
      onBlur={() => setTimeout(() => setOpen(false), 200)}
      style={{ position: "relative" }}
    >
      <div
        className="custom-status-selected"
        onClick={() => setOpen((prev) => !prev)}
      >
        {selected.label}
        <span className="custom-status-arrow" />
      </div>
      {open && (
        <div className="custom-status-menu">
          {options.map((opt) => (
            <div
              key={opt.value || "all"}
              className={
                "custom-status-option" +
                (opt.value === value ? " custom-status-option-active" : "")
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
      className="ci-level-select custom-status-dropdown"
      tabIndex={0}
      onBlur={() => setTimeout(() => setOpen(false), 200)}
      style={{ position: "relative" }}
    >
      <div
        className="custom-status-selected"
        onClick={() => setOpen((prev) => !prev)}
      >
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
const ComplianceIssues = () => {
  const [slaEscalations, setSlaEscalations] = useState([]);
  const [filteredEscalations, setFilteredEscalations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEscalationDetailModal, setShowEscalationDetailModal] = useState(false);
  const [selectedEscalation, setSelectedEscalation] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showRowsDropdown, setShowRowsDropdown] = useState(false);
  const rowsDropdownRef = useRef(null);
  useEffect(() => {
    fetchSlaEscalations();
  }, []);
  useEffect(() => {
    applyFilters();
  }, [slaEscalations, selectedStatus, selectedLevel, activeSearchTerm]);
  // Click outside handler for rows dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        rowsDropdownRef.current &&
        !rowsDropdownRef.current.contains(event.target)
      ) {
        setShowRowsDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const fetchSlaEscalations = async () => {
    try {
      setLoading(true);
      const response = await violationService.getAllSlaEscalations();
      if (response.success) {
        setSlaEscalations(response.data || []);
      }
    } catch (error) {
      toast.error("Failed to load escalations");
      setSlaEscalations([]);
    } finally {
      setLoading(false);
    }
  };
  const handleSearch = () => {
    setActiveSearchTerm(searchTerm);
    setCurrentPage(1);
  };
  const applyFilters = () => {
    let filtered = [...slaEscalations];
    if (activeSearchTerm) {
      filtered = filtered.filter(
        (e) =>
          e.employeeName?.toLowerCase().includes(activeSearchTerm.toLowerCase()) ||
          e.employeeEmail?.toLowerCase().includes(activeSearchTerm.toLowerCase()) ||
          e.slaType?.toLowerCase().includes(activeSearchTerm.toLowerCase()) ||
          e.reason?.toLowerCase().includes(activeSearchTerm.toLowerCase())
      );
    }
    if (selectedStatus) {
      filtered = filtered.filter((e) => e.escalationStatus === selectedStatus);
    }
    if (selectedLevel) {
      filtered = filtered.filter((e) => e.escalationLevel === selectedLevel);
    }
    setFilteredEscalations(filtered);
    setCurrentPage(1);
  };
  const clearFilters = () => {
    setSearchTerm("");
    setActiveSearchTerm("");
    setSelectedStatus("");
    setSelectedLevel("");
    setCurrentPage(1);
  };
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredEscalations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredEscalations.length / itemsPerPage) || 1;
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
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };
  const handleViewEscalationDetails = (escalation) => {
    setSelectedEscalation(escalation);
    setShowEscalationDetailModal(true);
  };
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
  const getEscalationStats = () => {
    const total = filteredEscalations.length;
    const open = filteredEscalations.filter((e) => e.escalationStatus === "Open").length;
    const pending = filteredEscalations.filter((e) => e.escalationStatus === "Pending").length;
    const resolved = filteredEscalations.filter((e) => e.escalationStatus === "Resolved").length;
    return {
      totalEscalations: total,
      openEscalations: open,
      pendingEscalations: pending,
      resolvedEscalations: resolved,
    };
  };
  const stats = getEscalationStats();
  if (loading) {
    return (
      <div className="ci-loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  return (
    <div className="ci-page">
      <div className="stats-cards-ci">
        <div className="stat-card-ci stat-total-ci">
          <div className="stat-icon-ci">
            <i className="bi bi-exclamation-triangle"></i>
          </div>
          <div className="stat-content-ci">
            <div className="stat-value-ci">{stats.totalEscalations}</div>
            <div className="stat-label-ci">Total Escalations</div>
          </div>
        </div>
        <div className="stat-card-ci stat-open-ci">
          <div className="stat-icon-ci">
            <i className="bi bi-clock-history"></i>
          </div>
          <div className="stat-content-ci">
            <div className="stat-value-ci">{stats.openEscalations}</div>
            <div className="stat-label-ci">Open</div>
          </div>
        </div>
        <div className="stat-card-ci stat-pending-ci">
          <div className="stat-icon-ci">
            <i className="bi bi-hourglass-split"></i>
          </div>
          <div className="stat-content-ci">
            <div className="stat-value-ci">{stats.pendingEscalations}</div>
            <div className="stat-label-ci">Pending</div>
          </div>
        </div>
        <div className="stat-card-ci stat-resolved-ci">
          <div className="stat-icon-ci">
            <i className="bi bi-check-circle"></i>
          </div>
          <div className="stat-content-ci">
            <div className="stat-value-ci">{stats.resolvedEscalations}</div>
            <div className="stat-label-ci">Resolved</div>
          </div>
        </div>
      </div>
      <div className="ci-controls">
        <div className="ci-search-input">
          <div className="ci-search-inner">
            <span className="ci-search-icon">
              <FaSearch />
            </span>
            <Form.Control
              type="text"
              placeholder="Search escalations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              className="ci-search-field"
            />
            <button
              type="button"
              className="ci-search-btn"
              onClick={handleSearch}
            >
              Search
            </button>
          </div>
        </div>
        <div className="ci-status-filter">
          <StatusDropdown
            value={selectedStatus}
            onChange={(val) => {
              setSelectedStatus(val);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="ci-level-filter">
          <LevelDropdown
            value={selectedLevel}
            onChange={(val) => {
              setSelectedLevel(val);
              setCurrentPage(1);
            }}
          />
        </div>
        <button className="ci-btn-clear" onClick={clearFilters}>
          Clear Filters
        </button>
        <div className="ci-results-count">
          Showing {currentItems.length} of {filteredEscalations.length} escalations
        </div>
      </div>
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
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan="8" className="ci-empty-state">
                    <div className="ci-empty-content">
                      <i className="bi bi-inbox"></i>
                      <h4>No escalations found</h4>
                      <p>Try adjusting your search or filter criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentItems.map((escalation) => (
                  <tr key={escalation.escalationId}>
                    <td>
                      <div className="ci-table-employee">
                        <strong className="ci-table-employee-name">
                          {escalation.employeeName || "Unknown Employee"}
                        </strong>
                        <span className="ci-table-employee-id">
                          ID: {escalation.employeeCompanyId}
                        </span>
                      </div>
                    </td>
                    <td>{escalation.slaType || "N/A"}</td>
                    <td>
                      <span className="ci-level-badge">
                        {escalation.escalationLevel}
                      </span>
                    </td>
                    <td>
                      <span className="ci-overdue-badge">
                        {escalation.daysOverdue} days
                      </span>
                    </td>
                    <td>
                      {escalation.severity === "Low" && (
                        <span className="ci-badge-severity-low">Low</span>
                      )}
                      {escalation.severity === "Medium" && (
                        <span className="ci-badge-severity-medium">Medium</span>
                      )}
                      {escalation.severity === "High" && (
                        <span className="ci-badge-severity-high">High</span>
                      )}
                      {escalation.severity === "Critical" && (
                        <span className="ci-badge-severity-critical">Critical</span>
                      )}
                    </td>
                    <td>
                      {escalation.escalationStatus === "Open" && (
                        <span className="ci-badge-status-open">Open</span>
                      )}
                      {escalation.escalationStatus === "Pending" && (
                        <span className="ci-badge-status-pending">Pending</span>
                      )}
                      {escalation.escalationStatus === "Resolved" && (
                        <span className="ci-badge-status-resolved">Resolved</span>
                      )}
                    </td>
                    <td>{escalation.escalatedToName || "Not Assigned"}</td>
                    <td>
                      <div className="ci-table-actions">
                        <button
                          className="ci-action-view"
                          onClick={() => handleViewEscalationDetails(escalation)}
                          title="View Details"
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
        {totalPages > 1 && filteredEscalations.length > 0 && (
          <div className="ci-pagination">
            <div className="ci-pagination-info">
              <span>Show</span>
              <div ref={rowsDropdownRef} className="ci-rows-dropdown-wrapper">
                <button
                  type="button"
                  onClick={() => setShowRowsDropdown(!showRowsDropdown)}
                  className="ci-rows-button"
                >
                  <span>{itemsPerPage}</span>
                  <i
                    className={`bi bi-chevron-${showRowsDropdown ? "up" : "down"} ci-rows-chevron`}
                  ></i>
                </button>
                {showRowsDropdown && (
                  <div className="ci-rows-dropdown">
                    {[5, 10, 25, 50].map((size) => (
                      <div
                        key={size}
                        onClick={() => {
                          setItemsPerPage(size);
                          setCurrentPage(1);
                          setShowRowsDropdown(false);
                        }}
                        className={`ci-rows-option ${
                          itemsPerPage === size ? "ci-rows-active" : ""
                        }`}
                      >
                        {size}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <span>entries</span>
            </div>
            <div className="ci-pagination-status">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredEscalations.length)} of {filteredEscalations.length} entries
            </div>
            <nav className="ci-pagination-nav">
              <ul className="ci-pagination-list">
                <li className={`ci-page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                </li>
                {getPageNumbers().map((page, index) => (
                  <li
                    key={index}
                    className={`ci-page-item ${
                      page === currentPage ? "active" : ""
                    } ${typeof page !== "number" ? "disabled" : ""}`}
                  >
                    <button
                      onClick={() => typeof page === "number" && setCurrentPage(page)}
                      disabled={typeof page !== "number"}
                    >
                      {page}
                    </button>
                  </li>
                ))}
                <li className={`ci-page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
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
      {showEscalationDetailModal && selectedEscalation && (
        <EscalationDetailModal
          show={showEscalationDetailModal}
          onHide={() => {
            setShowEscalationDetailModal(false);
            setSelectedEscalation(null);
          }}
          escalation={selectedEscalation}
          getSeverityBadge={getSeverityBadge}
          getStatusBadge={getStatusBadge}
        />
      )}
    </div>
  );
};
export default ComplianceIssues;
