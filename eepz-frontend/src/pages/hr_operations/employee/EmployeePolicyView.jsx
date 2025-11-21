import { useState, useEffect } from "react";
import {
  Card,
  Button,
  Badge,
  Spinner,
  Modal,
} from "react-bootstrap";
import employeePolicyService from "../../../services/hr_operations/employee/employeePolicyService";
import Breadcrumb from "../../../components/common/Breadcrumb";
import "../../../styles/hr_operations/employee/employeePolicy.css";

const EmployeePolicyView = () => {
  const [policies, setPolicies] = useState([]);
  const [filteredPolicies, setFilteredPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDateFilter, setSelectedDateFilter] = useState("All");
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const categories = [
    "All",
    "Security",
    "Code of Conduct",
    "Attendance",
    "Leave",
    "Work Hours",
    "Remote Work",
    "Expense",
    "Health & Safety",
    "IT Policy",
    "Data Protection",
    "Compliance",
  ];

  const dateFilters = [
    { value: "All", label: "All Dates" },
    { value: "Today", label: "Today" },
    { value: "Last7Days", label: "Last 7 Days" },
    { value: "Last30Days", label: "Last 30 Days" },
    { value: "Last3Months", label: "Last 3 Months" },
    { value: "Last6Months", label: "Last 6 Months" },
    { value: "LastYear", label: "Last Year" },
  ];

  useEffect(() => {
    fetchPublishedPolicies();
  }, []);

  useEffect(() => {
    filterPolicies();
  }, [policies, selectedCategory, selectedDateFilter]);

  const fetchPublishedPolicies = async () => {
    try {
      setLoading(true);
      const response = await employeePolicyService.getPublishedPolicies();
      setPolicies(response);
    } catch (error) {
      console.error("Error fetching policies:", error);
    } finally {
      setLoading(false);
    }
  };

  const isWithinDateRange = (publishedDate) => {
    if (selectedDateFilter === "All") return true;

    const published = new Date(publishedDate);
    const now = new Date();
    const diffTime = Math.abs(now - published);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    switch (selectedDateFilter) {
      case "Today":
        return diffDays === 0;
      case "Last7Days":
        return diffDays <= 7;
      case "Last30Days":
        return diffDays <= 30;
      case "Last3Months":
        return diffDays <= 90;
      case "Last6Months":
        return diffDays <= 180;
      case "LastYear":
        return diffDays <= 365;
      default:
        return true;
    }
  };

  const filterPolicies = () => {
    let filtered = policies;

    if (selectedCategory !== "All") {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    filtered = filtered.filter((p) => isWithinDateRange(p.publishedAt));

    setFilteredPolicies(filtered);
  };

  const handleViewDetails = (policy) => {
    setSelectedPolicy(policy);
    setShowDetailModal(true);
  };

  const handleViewDocument = (documentUrl) => {
    const fullUrl = employeePolicyService.getFullDocumentUrl(documentUrl);
    window.open(fullUrl, "_blank");
  };

  const clearFilters = () => {
    setSelectedCategory("All");
    setSelectedDateFilter("All");
  };

  if (loading) {
    return (
      <div className="ep-loading-container">
        <Spinner animation="border" variant="primary" />
        <p>Loading policies...</p>
      </div>
    );
  }

  return (
    <div className="ep-root">
      <Breadcrumb
        items={[
          {
            label: "Company Policies",
          },
        ]}
      />

      <div className="ep-summary-cards">
        <div className="ep-summary-card total">
          <div className="summary-card-icon">
            <i className="bi bi-shield-check"></i>
          </div>
          <div className="summary-card-content">
            <div className="summary-card-value">{policies.length}</div>
            <div className="summary-card-label">Total Policies</div>
          </div>
        </div>

        <div className="ep-summary-card published">
          <div className="summary-card-icon">
            <i className="bi bi-check-circle"></i>
          </div>
          <div className="summary-card-content">
            <div className="summary-card-value">{filteredPolicies.length}</div>
            <div className="summary-card-label">Filtered Results</div>
          </div>
        </div>

        <div className="ep-summary-card categories">
          <div className="summary-card-icon">
            <i className="bi bi-folder"></i>
          </div>
          <div className="summary-card-content">
            <div className="summary-card-value">{categories.length - 1}</div>
            <div className="summary-card-label">Categories</div>
          </div>
        </div>
      </div>

      <div className="ep-filter-section">
        <div className="ep-filter-row-single">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="ep-filter-select"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={selectedDateFilter}
            onChange={(e) => setSelectedDateFilter(e.target.value)}
            className="ep-filter-select"
          >
            {dateFilters.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>

          <button className="ep-clear-btn" onClick={clearFilters}>
            Clear Filters
          </button>

          <div className="ep-results-count-inline">
            Showing {filteredPolicies.length} of {policies.length} policies
          </div>
        </div>
      </div>

      <div className="ep-grid">
        {filteredPolicies.length === 0 ? (
          <div className="ep-alert-empty">
            <i className="bi bi-inbox"></i>
            <p>No policies found matching your filters</p>
          </div>
        ) : (
          filteredPolicies.map((policy) => (
            <Card key={policy.policyId} className="ep-card">
              <Card.Body>
                <div className="ep-card-header">
                  <h5 className="ep-card-title">{policy.policyName}</h5>
                  <Badge className="ep-badge">{policy.category}</Badge>
                </div>

                <p className="ep-card-description">
                  {policy.description?.substring(0, 100)}
                  {policy.description?.length > 100 && "..."}
                </p>

                {policy.documentUrl && (
                  <div className="ep-document-badge">
                    <i className="bi bi-file-earmark-pdf"></i>
                    <span>Document Available</span>
                  </div>
                )}

                <div className="ep-card-footer">
                  <small className="ep-publish-date">
                    Published: {new Date(policy.publishedAt).toLocaleDateString()}
                  </small>
                  <Button
                    size="sm"
                    className="ep-btn-view"
                    onClick={() => handleViewDetails(policy)}
                  >
                    <i className="bi bi-eye me-1"></i>
                    View
                  </Button>
                </div>
              </Card.Body>
            </Card>
          ))
        )}
      </div>

      {selectedPolicy && (
        <Modal
          show={showDetailModal}
          onHide={() => setShowDetailModal(false)}
          size="lg"
          centered
          className="ep-modal"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              <i className="bi bi-shield-check me-2"></i>
              {selectedPolicy.policyName}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="mb-3">
              <Badge bg="primary" className="me-2">
                {selectedPolicy.category}
              </Badge>
              <Badge bg="success">Published</Badge>
            </div>

            <h6 className="fw-bold mb-2">Description</h6>
            <p>{selectedPolicy.description}</p>

            {selectedPolicy.complianceGuidance && (
              <>
                <h6 className="fw-bold mb-2 mt-3">Compliance Guidance</h6>
                <p>{selectedPolicy.complianceGuidance}</p>
              </>
            )}

            {selectedPolicy.documentUrl && (
              <div className="ep-doc-download">
                <h6 className="fw-bold mb-2">
                  <i className="bi bi-file-earmark-pdf me-2"></i>
                  Attached Document
                </h6>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{selectedPolicy.documentName}</strong>
                    {selectedPolicy.documentSizeFormatted && (
                      <small className="text-muted ms-2">
                        ({selectedPolicy.documentSizeFormatted})
                      </small>
                    )}
                  </div>
                  <Button
                    size="sm"
                    className="ep-btn-download"
                    onClick={() => handleViewDocument(selectedPolicy.documentUrl)}
                  >
                    <i className="bi bi-download me-1"></i>
                    View/Download
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-4">
              <small className="text-muted">
                Published on: {new Date(selectedPolicy.publishedAt).toLocaleString()}
              </small>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
};

export default EmployeePolicyView;
