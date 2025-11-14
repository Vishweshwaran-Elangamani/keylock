import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Modal, Button, Form, Spinner, Badge } from "react-bootstrap";
import violationService from "../../../../services/hr_operations/hr/violationService";
import "../../../../styles/hr_operations/hr/complianceIssues.css";


const ComplianceIssues = () => {
  const [violations, setViolations] = useState([]);
  const [filteredViolations, setFilteredViolations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState("");


  // Filter State
  const [filters, setFilters] = useState({
    status: "All",
    severity: "All",
    searchTerm: "",
  });


  useEffect(() => {
    fetchData();
  }, []);


  useEffect(() => {
    applyFilters();
  }, [filters, violations]);


  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchViolations(), fetchStats()]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };


  const fetchViolations = async () => {
    try {
      const response = await violationService.getAllViolations();
      if (response.success) {
        setViolations(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching violations:", error);
      toast.error("Error loading violations");
    }
  };


  const fetchStats = async () => {
    try {
      const response = await violationService.getViolationStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };


  // Apply Filters
  const applyFilters = () => {
    let filtered = [...violations];


    // Filter by Status
    if (filters.status !== "All") {
      filtered = filtered.filter((v) => v.status === filters.status);
    }


    // Filter by Severity
    if (filters.severity !== "All") {
      filtered = filtered.filter((v) => v.severity === filters.severity);
    }


    // Filter by Search Term
    if (filters.searchTerm.trim() !== "") {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          (v.employeeName &&
            v.employeeName.toLowerCase().includes(searchLower)) ||
          (v.employeeEmail &&
            v.employeeEmail.toLowerCase().includes(searchLower)) ||
          (v.violationType &&
            v.violationType.toLowerCase().includes(searchLower)) ||
          (v.policyName && v.policyName.toLowerCase().includes(searchLower))
      );
    }


    setFilteredViolations(filtered);
  };


  const handleViewDetails = (violation) => {
    setSelectedViolation(violation);
    setShowDetailModal(true);
  };


  const handleResolve = (violation) => {
    setSelectedViolation(violation);
    setResolutionNotes("");
    setShowResolveModal(true);
  };


  const submitResolve = async () => {
    if (!resolutionNotes.trim()) {
      toast.warning("Please enter resolution notes");
      return;
    }


    try {
      const response = await violationService.resolveViolation(
        selectedViolation.violationId,
        { resolutionNotes }
      );


      if (response.success) {
        toast.success("Violation resolved successfully!");
        setShowResolveModal(false);
        setSelectedViolation(null);
        setResolutionNotes("");
        fetchData();
      }
    } catch (error) {
      toast.error("Failed to resolve violation");
    }
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
      Reported: "primary",
      UnderReview: "info",
      Escalated: "warning",
      Resolved: "success",
      Closed: "secondary",
    };
    return badges[status] || "secondary";
  };


  const getStatusLabel = (status) => {
    return status === "UnderReview" ? "Under Review" : status;
  };


  // Calculate stats
  const calculateStats = () => {
    const totalViolations = violations.length;
    const activeViolations = violations.filter(
      (v) => v.status !== "Resolved" && v.status !== "Closed"
    ).length;
    const resolvedViolations = violations.filter(
      (v) => v.status === "Resolved"
    ).length;


    return {
      totalViolations,
      activeViolations,
      resolvedViolations,
      ...stats,
    };
  };


  const displayStats = calculateStats();


  if (loading) {
    return (
      <div className="ci-loading-container">
        <Spinner animation="border" variant="primary" />
        <p>Loading violations...</p>
      </div>
    );
  }


  return (
    <div className="ci-root">
      {/* Header */}
      <div className="ci-header">
        <h2 className="ci-page-title">
          <i className="bi bi-shield-exclamation"></i>
          Compliance Issues & Violations
        </h2>
        <p className="ci-subtitle">
          View adherence to organizational rules and identify violations
        </p>
      </div>


      {/* Stats Cards */}
      <div className="ci-stats-row">
        <div className="ci-stat-card stat-total">
          <div className="ci-stat-icon">
            <i className="bi bi-exclamation-triangle-fill"></i>
          </div>
          <div className="ci-stat-content">
            <div className="ci-stat-label">Total Violations</div>
            <div className="ci-stat-value">
              {displayStats.totalViolations || 0}
            </div>
          </div>
        </div>


        <div className="ci-stat-card stat-active">
          <div className="ci-stat-icon">
            <i className="bi bi-hourglass-split"></i>
          </div>
          <div className="ci-stat-content">
            <div className="ci-stat-label">Active Cases</div>
            <div className="ci-stat-value">
              {displayStats.activeViolations || 0}
            </div>
          </div>
        </div>


        <div className="ci-stat-card stat-resolved">
          <div className="ci-stat-icon">
            <i className="bi bi-check-circle-fill"></i>
          </div>
          <div className="ci-stat-content">
            <div className="ci-stat-label">Resolved</div>
            <div className="ci-stat-value">
              {displayStats.resolvedViolations || 0}
            </div>
          </div>
        </div>
      </div>


      {/* Enhanced Filters Section */}
      <div className="ci-filters-container">
        {/* Filters Header */}
        <div className="ci-filters-header">
          <h3 className="ci-filters-title">
            <i className="bi bi-sliders me-2"></i>
            Filter Violations
          </h3>
          {(filters.searchTerm ||
            filters.status !== "All" ||
            filters.severity !== "All") && (
            <button
              className="ci-btn-clear-link"
              onClick={() =>
                setFilters({ status: "All", severity: "All", searchTerm: "" })
              }
            >
              Reset all filters
            </button>
          )}
        </div>


        <div className="ci-filters-row">
          <div className="ci-filter-group ci-filter-search">
            <label className="ci-filter-label">
              <i className="bi bi-search me-2"></i>Search
            </label>
            <input
              type="text"
              className="ci-filter-input"
              placeholder="Search by employee, email, violation type..."
              value={filters.searchTerm}
              onChange={(e) =>
                setFilters({ ...filters, searchTerm: e.target.value })
              }
            />
          </div>


          <div className="ci-filter-group">
            <label className="ci-filter-label">
              <i className="bi bi-funnel me-2"></i>Status
            </label>
            <select
              className="ci-filter-select"
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
            >
              <option value="All">All Status</option>
              <option value="Reported">Reported</option>
              <option value="UnderReview">Under Review</option>
              <option value="Escalated">Escalated</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>


          <div className="ci-filter-group">
            <label className="ci-filter-label">
              <i className="bi bi-exclamation-triangle me-2"></i>Severity
            </label>
            <select
              className="ci-filter-select"
              value={filters.severity}
              onChange={(e) =>
                setFilters({ ...filters, severity: e.target.value })
              }
            >
              <option value="All">All Severity</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>


          {/* Clear Filters Button */}
          <div className="ci-filter-group">
            <label className="ci-filter-label" style={{ visibility: "hidden" }}>
              Actions
            </label>
            <button
              className="ci-btn-clear-filters"
              onClick={() =>
                setFilters({ status: "All", severity: "All", searchTerm: "" })
              }
            >
              <i className="bi bi-x-circle me-2"></i>
              Clear Filters
            </button>
          </div>
        </div>


        {/* Results Count */}
        <div className="ci-results-count">
          <span className="ci-results-text">
            Showing <strong>{filteredViolations.length}</strong> of{" "}
            <strong>{violations.length}</strong> violations
          </span>
          {filteredViolations.length === 0 && violations.length > 0 && (
            <span className="ci-no-results-hint">
              No violations match your current filters
            </span>
          )}
        </div>
      </div>


      {/* Violations List */}
      <div className="ci-violations-container">
        {filteredViolations.length === 0 ? (
          <div className="ci-empty-state">
            <i
              className="bi bi-inbox"
              style={{ fontSize: "64px", color: "#cbd5e1" }}
            ></i>
            <p>No violations found matching your filters</p>
            {(filters.searchTerm ||
              filters.status !== "All" ||
              filters.severity !== "All") && (
              <button
                className="ci-btn ci-btn-view"
                onClick={() =>
                  setFilters({ status: "All", severity: "All", searchTerm: "" })
                }
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          filteredViolations.map((violation) => (
            <div key={violation.violationId} className="ci-violation-card">
              <div className="ci-violation-header">
                <div>
                  <h5 className="ci-employee-name">
                    {violation.employeeName || "Unknown Employee"}
                    <Badge
                      bg={getSeverityBadge(violation.severity)}
                      className="ms-2"
                    >
                      {violation.severity} Severity
                    </Badge>
                  </h5>
                  <p className="ci-employee-id">
                    User ID: {violation.employeeUserId} •{" "}
                    {violation.employeeEmail || "N/A"}
                  </p>
                </div>
                <Badge
                  bg={getStatusBadge(violation.status)}
                  className="ci-status-badge"
                >
                  {getStatusLabel(violation.status)}
                </Badge>
              </div>


              <div className="ci-violation-details">
                <div className="ci-detail-row">
                  <span className="ci-detail-label">Violation Type</span>
                  <span className="ci-detail-value">
                    {violation.violationType || "N/A"}
                  </span>
                </div>
                <div className="ci-detail-row">
                  <span className="ci-detail-label">Policy</span>
                  <span className="ci-detail-value">
                    {violation.policyName || "N/A"}
                  </span>
                </div>
                <div className="ci-detail-row">
                  <span className="ci-detail-label">Date Reported</span>
                  <span className="ci-detail-value">
                    {new Date(violation.reportedDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="ci-detail-row">
                  <span className="ci-detail-label">Reported By</span>
                  <span className="ci-detail-value">
                    {violation.reportedByEmail || "N/A"}
                  </span>
                </div>
              </div>


              <div className="ci-violation-description">
                <strong>Description</strong>
                <p>{violation.description || "No description provided"}</p>
              </div>


              <div className="ci-violation-actions">
                <button
                  className="ci-btn ci-btn-view"
                  onClick={() => handleViewDetails(violation)}
                >
                  <i className="bi bi-eye me-1"></i>
                  View Details
                </button>


                {violation.status !== "Resolved" &&
                  violation.status !== "Closed" && (
                    <button
                      className="ci-btn ci-btn-resolve"
                      onClick={() => handleResolve(violation)}
                    >
                      <i className="bi bi-check-circle me-1"></i>
                      Take Action
                    </button>
                  )}
              </div>
            </div>
          ))
        )}
      </div>


      {/* Detail Modal */}
      <Modal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="ci-modal-header">
          <Modal.Title>Violation Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedViolation && (
            <div className="ci-detail-grid">
              <div className="ci-detail-item">
                <label>Employee Name:</label>
                <span>{selectedViolation.employeeName || "N/A"}</span>
              </div>
              <div className="ci-detail-item">
                <label>Employee ID:</label>
                <span>{selectedViolation.employeeUserId}</span>
              </div>
              <div className="ci-detail-item">
                <label>Email:</label>
                <span>{selectedViolation.employeeEmail || "N/A"}</span>
              </div>
              <div className="ci-detail-item">
                <label>Policy:</label>
                <span>{selectedViolation.policyName || "N/A"}</span>
              </div>
              <div className="ci-detail-item">
                <label>Violation Type:</label>
                <span>{selectedViolation.violationType}</span>
              </div>
              <div className="ci-detail-item">
                <label>Severity:</label>
                <Badge bg={getSeverityBadge(selectedViolation.severity)}>
                  {selectedViolation.severity}
                </Badge>
              </div>
              <div className="ci-detail-item">
                <label>Status:</label>
                <Badge bg={getStatusBadge(selectedViolation.status)}>
                  {getStatusLabel(selectedViolation.status)}
                </Badge>
              </div>
              <div className="ci-detail-item">
                <label>Date Reported:</label>
                <span>
                  {new Date(
                    selectedViolation.reportedDate
                  ).toLocaleDateString()}
                </span>
              </div>
              <div className="ci-detail-item">
                <label>Reported By:</label>
                <span>{selectedViolation.reportedByEmail || "N/A"}</span>
              </div>
              {selectedViolation.escalatedToEmail && (
                <div className="ci-detail-item">
                  <label>Escalated To:</label>
                  <span>{selectedViolation.escalatedToEmail}</span>
                </div>
              )}
              <div className="ci-detail-item ci-detail-full">
                <label>Description:</label>
                <p>{selectedViolation.description}</p>
              </div>
              {selectedViolation.resolutionNotes && (
                <div className="ci-detail-item ci-detail-full">
                  <label>Resolution Notes:</label>
                  <p>{selectedViolation.resolutionNotes}</p>
                </div>
              )}
              {selectedViolation.resolvedAt && (
                <div className="ci-detail-item">
                  <label>Resolved At:</label>
                  <span>
                    {new Date(selectedViolation.resolvedAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
      </Modal>


      {/* Resolve Modal */}
      <Modal
        show={showResolveModal}
        onHide={() => setShowResolveModal(false)}
        centered
      >
        <Modal.Header closeButton className="ci-modal-header">
          <Modal.Title>Take Corrective Action</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            <strong>Employee:</strong> {selectedViolation?.employeeName}
          </p>
          <p>
            <strong>Violation Type:</strong> {selectedViolation?.violationType}
          </p>


          <Form.Group className="mt-3">
            <Form.Label>Action Taken / Resolution Notes *</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Describe the corrective action taken..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowResolveModal(false)}
          >
            Cancel
          </Button>
          <Button variant="success" onClick={submitResolve}>
            <i className="bi bi-check-circle me-1"></i>
            Mark as Resolved
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};


export default ComplianceIssues;
