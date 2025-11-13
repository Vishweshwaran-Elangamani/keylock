import { useState, useEffect } from "react";
import {
  Card,
  Button,
  Badge,
  Spinner,
  Form,
  Row,
  Col,
  Modal,
} from "react-bootstrap";
import employeePolicyService from "../../../services/hr_operations/employee/employeePolicyService";
import "../../../styles/hr_operations/employee/employeePolicy.css";

const EmployeePolicyView = () => {
  const [policies, setPolicies] = useState([]);
  const [filteredPolicies, setFilteredPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDateFilter, setSelectedDateFilter] = useState("All");
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Categories
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

  // Date filters
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

    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    // Filter by date
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

  if (loading) {
    return (
      <div className="ep-loading-container">
        <Spinner animation="border" variant="primary" />
        <p>Loading policies...</p>
      </div>
    );
  }

  return (
    <div className="ep-container">
      <div className="ep-header">
        <h2 className="ep-title">
          <i className="bi bi-shield-check"></i>
          Company Policies
        </h2>
        <p className="ep-subtitle">
          View and download published organizational policies
        </p>
      </div>

      {/* Filters - Category and Date */}
      <div className="ep-filter-wrapper">
        <Row className="g-3">
          <Col md={6}>
            <Form.Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="ep-filter-select"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col md={6}>
            <Form.Select
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              className="ep-filter-select"
            >
              {dateFilters.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </Form.Select>
          </Col>
        </Row>
      </div>

      <div className="ep-grid">
        {filteredPolicies.length === 0 ? (
          <div className="ep-empty">
            <i className="bi bi-inbox"></i>
            <p>No policies found</p>
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
                    Published:{" "}
                    {new Date(policy.publishedAt).toLocaleDateString()}
                  </small>
                  <Button
                    size="sm"
                    className="ep-btn-view"
                    onClick={() => handleViewDetails(policy)}
                  >
                    <i className="bi bi-eye me-1"></i>
                    View Details
                  </Button>
                </div>
              </Card.Body>
            </Card>
          ))
        )}
      </div>

      {/* Modal */}
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
                    onClick={() =>
                      handleViewDocument(selectedPolicy.documentUrl)
                    }
                  >
                    <i className="bi bi-download me-1"></i>
                    View/Download
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-4">
              <small className="text-muted">
                Published on:{" "}
                {new Date(selectedPolicy.publishedAt).toLocaleString()}
              </small>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowDetailModal(false)}
            >
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
};

export default EmployeePolicyView;
