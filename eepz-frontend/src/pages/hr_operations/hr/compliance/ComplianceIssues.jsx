import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Spinner, Badge, InputGroup, Form, Button } from "react-bootstrap";
import { FaSearch } from "react-icons/fa";
import violationService from "../../../../services/hr_operations/hr/violationService";
import EscalationDetailModal from "../../../../components/hr_operations/modals/EscalationDetailModal";
import "../../../../styles/hr_operations/hr/complianceIssues.css";

const ComplianceIssues = () => {
  // ===== STATE MANAGEMENT =====
  const [slaEscalations, setSlaEscalations] = useState([]);
  const [filteredEscalations, setFilteredEscalations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showEscalationDetailModal, setShowEscalationDetailModal] = useState(false);
  const [selectedEscalation, setSelectedEscalation] = useState(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ===== EFFECTS =====
  useEffect(() => {
    fetchData();
  }, []);

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
          (e.employeeName && e.employeeName.toLowerCase().includes(searchLower)) ||
          (e.employeeEmail && e.employeeEmail.toLowerCase().includes(searchLower)) ||
          (e.slaType && e.slaType.toLowerCase().includes(searchLower)) ||
          (e.reason && e.reason.toLowerCase().includes(searchLower))
      );
    }

    setFilteredEscalations(filtered);
    setCurrentPage(1);
  };

  // ===== CLEAR FILTERS =====
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("");
    setSelectedLevel("");
  };

  // ===== PAGINATION HELPERS =====
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredEscalations.slice(indexOfFirstItem, indexOfLastItem);
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
      {/* Escalation Filters */}
      <div className="ci-filter-section">
        <div className="ci-filter-row-single">
          <InputGroup className="ci-search-input">
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search by employee, SLA type, reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>

          <select
            className="ci-filter-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="Open">Open</option>
            <option value="Pending">Pending</option>
            <option value="Resolved">Resolved</option>
          </select>

          <select
            className="ci-filter-select"
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
          >
            <option value="">All Levels</option>
            <option value="Level 1">Level 1</option>
            <option value="Level 2">Level 2</option>
            <option value="Level 3">Level 3</option>
          </select>

          <Button
            variant="outline-secondary"
            onClick={clearFilters}
            className="ci-clear-btn"
          >
            Clear Filters
          </Button>

          <div className="ci-results-count-inline">
            Showing {currentItems.length} of {filteredEscalations.length} escalations
          </div>
        </div>
      </div>

      {/* Escalations Container with Pagination */}
      <div className="ci-table-card">
        <div className="ci-violations-container">
          {currentItems.length === 0 ? (
            <div className="empty-state">
              <i className="bi bi-inbox"></i>
              <p>No SLA escalations found matching your filters</p>
            </div>
          ) : (
            currentItems.map((escalation) => (
              <div key={escalation.escalationId} className="ci-violation-card">
                <div className="ci-violation-header">
                  <div>
                    <h5 className="ci-employee-name">
                      {escalation.employeeName || "Unknown Employee"}
                      <Badge bg={getSeverityBadge(escalation.severity)} className="ms-2">
                        {escalation.severity} Severity
                      </Badge>
                    </h5>
                    <p className="ci-employee-id">
                      User ID: {escalation.employeeUserId} • {escalation.employeeEmail || "N/A"}
                    </p>
                  </div>
                  <Badge bg={getStatusBadge(escalation.escalationStatus)} className="ci-status-badge">
                    {escalation.escalationStatus}
                  </Badge>
                </div>

                <div className="ci-violation-details">
                  <div className="ci-detail-row">
                    <span className="ci-detail-label">SLA Type</span>
                    <span className="ci-detail-value">{escalation.slaType || "N/A"}</span>
                  </div>
                  <div className="ci-detail-row">
                    <span className="ci-detail-label">Escalation Level</span>
                    <span className="ci-detail-value">{escalation.escalationLevel}</span>
                  </div>
                  <div className="ci-detail-row">
                    <span className="ci-detail-label">Days Overdue</span>
                    <span className="ci-detail-value ci-highlight-danger">
                      {escalation.daysOverdue} days
                    </span>
                  </div>
                  <div className="ci-detail-row">
                    <span className="ci-detail-label">Escalated To</span>
                    <span className="ci-detail-value">{escalation.escalatedToName || "N/A"}</span>
                  </div>
                </div>

                <div className="ci-violation-description">
                  <strong>Reason</strong>
                  <p>{escalation.reason || "No reason provided"}</p>
                  {escalation.description && (
                    <>
                      <strong className="mt-2 d-block">Description</strong>
                      <p>{escalation.description}</p>
                    </>
                  )}
                </div>

                <div className="ci-violation-actions">
                  <button
                    className="action-btn action-btn-edit"
                    onClick={() => handleViewEscalationDetails(escalation)}
                    title="View Details"
                  >
                    <i className="bi bi-eye"></i>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
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
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <span className="pagination-label">entries</span>
            </div>

            <div className="pagination-status">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredEscalations.length)} of{" "}
              {filteredEscalations.length} entries
            </div>

            <nav className="pagination-nav">
              <ul className="pagination">
                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                </li>

                {getPageNumbers().map((page, index) => (
                  <li
                    key={index}
                    className={`page-item ${page === currentPage ? "active" : ""} ${
                      typeof page !== "number" ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => typeof page === "number" && setCurrentPage(page)}
                      disabled={typeof page !== "number"}
                    >
                      {page}
                    </button>
                  </li>
                ))}

                <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                  <button
                    className="page-link"
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
