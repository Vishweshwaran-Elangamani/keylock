import { useState, useEffect } from "react";
import { Modal } from "react-bootstrap";
import { useAuth } from "../../contexts/auth/AuthContext";
import nominationService from "../../services/internal/nominationService";
import internalOpportunityService from "../../services/internal/internalOpportunityService";
import SelfNominateModal from "./NominationModals/SelfNominateModal";
import ManagerNominateModal from "./NominationModals/ManagerNominateModal";
import NominationReviewModal from "./NominationModals/NominationReviewModal";
import NominationGraphModal from "./NominationModals/NominationGraphModal";
import { toast } from "sonner";
import "../../styles/internal/nominationManagement.css";
 
const NominationManagement = () => {
  const { user } = useAuth();
  const [nominations, setNominations] = useState([]);
  const [filteredNominations, setFilteredNominations] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showSelfNominateModal, setShowSelfNominateModal] = useState(false);
  const [showManagerNominateModal, setShowManagerNominateModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showGraphModal, setShowGraphModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedNomination, setSelectedNomination] = useState(null);
 
  useEffect(() => {
    fetchData();
  }, []);
 
  useEffect(() => {
    filterNominations();
  }, [nominations, searchTerm, selectedStatus]);
 
  const fetchData = async () => {
    try {
      setLoading(true);
      let nominationsResponse;
      if (user?.role === "Manager") {
        nominationsResponse = await nominationService.getPendingManagerReview();
      } else if (user?.role === "Department Head") {
        nominationsResponse = await nominationService.getPendingDeptHeadReview();
      } else {
        nominationsResponse = await nominationService.getAllNominations();
      }
      const opportunitiesResponse = await internalOpportunityService.getAllOpportunities();
 
      if (nominationsResponse.success) {
        setNominations(Array.isArray(nominationsResponse.data) ? nominationsResponse.data : []);
      }
      if (opportunitiesResponse.success) {
        setOpportunities(Array.isArray(opportunitiesResponse.data) ? opportunitiesResponse.data : []);
      }
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };
 
  const filterNominations = () => {
    let filtered = Array.isArray(nominations) ? [...nominations] : [];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (nom) =>
          nom.opportunityName?.toLowerCase().includes(term) ||
          nom.nomineeName?.toLowerCase().includes(term)
      );
    }
    if (selectedStatus) {
      filtered = filtered.filter((nom) => nom.status === selectedStatus);
    }
    setFilteredNominations(filtered);
    setCurrentPage(1);
  };
 
  const handleSelfNominate = () => {
    if (!opportunities || opportunities.length === 0) {
      toast.error("No opportunities available");
      return;
    }
    setShowSelfNominateModal(true);
  };
 
  const handleManagerNominate = () => setShowManagerNominateModal(true);
 
  const handleReviewNomination = (nomination) => {
    setSelectedNomination(nomination);
    setShowReviewModal(true);
  };
 
  const handleViewDetails = (nomination) => {
    setSelectedNomination(nomination);
    setShowDetailsModal(true);
  };
 
  const handleNominationSubmitted = () => {
    setShowSelfNominateModal(false);
    setShowManagerNominateModal(false);
    fetchData();
  };
 
  const handleReviewSubmitted = () => {
    setShowReviewModal(false);
    fetchData();
  };
 
  const getPaginatedNominations = () => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredNominations.slice(startIndex, endIndex);
  };
 
  const totalPages = Math.ceil(filteredNominations.length / rowsPerPage);
 
  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "status-active";
      case "rejected":
        return "status-inactive";
      case "pending":
      case "pending_manager_review":
      case "pending_dept_head_approval":
        return "status-pending";
      default:
        return "status-inactive";
    }
  };
 
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };
 
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
 
  return (
    <div className="user-list-page">
      <nav className="breadcrumb-nav" aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <i className="bi bi-house-door"></i>
            <span>Dashboard</span>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Nominations
          </li>
        </ol>
      </nav>
 
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h2 className="page-title">Nominations</h2>
            <p className="page-description">
              Manage employee nominations for internal opportunities
            </p>
          </div>
        </div>
      </div>
 
      <div className="filters-card">
        <div className="filters-content">
          <div className="filters-left">
            <div className="search-box">
              <i className="bi bi-search search-icon"></i>
              <input
                type="text"
                className="search-input"
                placeholder="Search nominations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="filter-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
 
          <div className="filters-actions">
            {user?.role !== "HR" && (
              <button
                className="btn-graph"
                onClick={() => setShowGraphModal(true)}
                title="View Analytics Graph"
              >
                <i className="bi bi-bar-chart-fill"></i> View Graph
              </button>
            )}
 
            {user?.role === "Employee" && (
              <button className="btn-add" onClick={handleSelfNominate}>
                <i className="bi bi-hand-thumbs-up"></i> Self Nominate
              </button>
            )}
          </div>
        </div>
      </div>
 
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-icon-primary">
            <i className="bi bi-hand-thumbs-up"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{nominations.length}</h3>
            <p className="stat-label">Total Nominations</p>
          </div>
        </div>
 
        <div className="stat-card">
          <div className="stat-icon stat-icon-success">
            <i className="bi bi-check-circle-fill"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">
              {nominations.filter((n) => n.status?.toLowerCase() === "approved").length}
            </h3>
            <p className="stat-label">Approved</p>
          </div>
        </div>
 
        <div className="stat-card">
          <div className="stat-icon stat-icon-warning">
            <i className="bi bi-clock-fill"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">
              {nominations.filter((n) => n.status?.toLowerCase().includes("pending")).length}
            </h3>
            <p className="stat-label">Pending</p>
          </div>
        </div>
 
        <div className="stat-card">
          <div className="stat-icon stat-icon-danger">
            <i className="bi bi-x-circle-fill"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">
              {nominations.filter((n) => n.status?.toLowerCase().includes("rejected")).length}
            </h3>
            <p className="stat-label">Rejected</p>
          </div>
        </div>
      </div>
 
      <div className="table-card">
        <div className="table-wrapper">
          <table className="user-table">
            <thead>
              <tr>
                <th>Opportunity</th>
                <th>Nominee</th>
                <th>Nominated By</th>
                <th>Type</th>
                <th>Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {getPaginatedNominations().length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-state">
                    <i className="bi bi-inbox"></i>
                    <p>No nominations found</p>
                  </td>
                </tr>
              ) : (
                getPaginatedNominations().map((nomination) => (
                  <tr key={nomination.nominationId}>
                    <td>{nomination.opportunityName}</td>
                    <td>{nomination.nomineeName}</td>
                    <td>{nomination.nominatedByName}</td>
                    <td>{nomination.nominationType}</td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(nomination.status)}`}>
                        {nomination.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {(user?.role === "Manager" ||
                          user?.role === "Department Head") &&
                          nomination.status?.toLowerCase().includes("pending") && (
                            <button
                              className="action-btn action-btn-edit"
                              onClick={() => handleReviewNomination(nomination)}
                              title="Review Nomination"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                          )}
                        <button
                          className="action-btn action-btn-view"
                          onClick={() => handleViewDetails(nomination)}
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
 
        {filteredNominations.length > 0 && (
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
          </div>
        )}
      </div>
 
      {/* Modals */}
      {showSelfNominateModal && (
        <SelfNominateModal
          show={showSelfNominateModal}
          onHide={() => setShowSelfNominateModal(false)}
          opportunities={opportunities}
          onNominationSubmitted={handleNominationSubmitted}
        />
      )}
      {showManagerNominateModal && (
        <ManagerNominateModal
          show={showManagerNominateModal}
          onHide={() => setShowManagerNominateModal(false)}
          opportunities={opportunities}
          onNominationSubmitted={handleNominationSubmitted}
        />
      )}
      {showReviewModal && selectedNomination && (
        <NominationReviewModal
          show={showReviewModal}
          onHide={() => setShowReviewModal(false)}
          nomination={selectedNomination}
          userRole={user?.role}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
      {showGraphModal && (
        <NominationGraphModal
          show={showGraphModal}
          onHide={() => setShowGraphModal(false)}
        />
      )}
 
      {/* Responsive Details Modal */}
      {showDetailsModal && selectedNomination && (
        <Modal
          show={showDetailsModal}
          onHide={() => setShowDetailsModal(false)}
          size="lg"
          centered
          className="nomination-details-modal"
        >
          <Modal.Header closeButton style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #dee2e6" }}>
            <Modal.Title>
              <i className="bi bi-info-circle me-2" style={{ color: "#27235c" }}></i>
              Nomination Details
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ padding: "24px" }}>
            {/* Opportunity Information */}
            <div style={{ marginBottom: "24px", padding: "16px", backgroundColor: "#f0f4ff", borderRadius: "8px" }}>
              <h6 style={{ color: "#27235c", fontWeight: "600", marginBottom: "12px", fontSize: "14px" }}>
                <i className="bi bi-briefcase me-2"></i>
                Opportunity Information
              </h6>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", color: "#6c757d", fontWeight: "500" }}>Opportunity Name:</label>
                  <p style={{ margin: "4px 0 0 0", fontWeight: "600", color: "#27235c" }}>
                    {selectedNomination.opportunityName || "N/A"}
                  </p>
                </div>
                <div>
                  <label style={{ fontSize: "12px", color: "#6c757d", fontWeight: "500" }}>Opportunity ID:</label>
                  <p style={{ margin: "4px 0 0 0", fontWeight: "600", color: "#27235c" }}>
                    #{selectedNomination.opportunityId || "N/A"}
                  </p>
                </div>
              </div>
            </div>
            {/* Nominee Information */}
            <div style={{ marginBottom: "24px", padding: "16px", backgroundColor: "#f0fdf4", borderRadius: "8px" }}>
              <h6 style={{ color: "#166534", fontWeight: "600", marginBottom: "12px", fontSize: "14px" }}>
                <i className="bi bi-person me-2"></i>
                Nominee Information
              </h6>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", color: "#6c757d", fontWeight: "500" }}>Nominee Email:</label>
                  <p style={{ margin: "4px 0 0 0", fontWeight: "600", color: "#166534" }}>
                    {selectedNomination.nomineeName || "N/A"}
                  </p>
                </div>
                <div>
                  <label style={{ fontSize: "12px", color: "#6c757d", fontWeight: "500" }}>Nominee User ID:</label>
                  <p style={{ margin: "4px 0 0 0", fontWeight: "600", color: "#166534" }}>
                    #{selectedNomination.nomineeUserId || "N/A"}
                  </p>
                </div>
              </div>
            </div>
            {/* Nomination Details */}
            <div style={{ marginBottom: "24px", padding: "16px", backgroundColor: "#fef3c7", borderRadius: "8px" }}>
              <h6 style={{ color: "#92400e", fontWeight: "600", marginBottom: "12px", fontSize: "14px" }}>
                <i className="bi bi-file-text me-2"></i>
                Nomination Details
              </h6>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", color: "#6c757d", fontWeight: "500" }}>Nominated By Email:</label>
                  <p style={{ margin: "4px 0 0 0", fontWeight: "600", color: "#92400e" }}>
                    {selectedNomination.nominatedByName || "N/A"}
                  </p>
                </div>
                <div>
                  <label style={{ fontSize: "12px", color: "#6c757d", fontWeight: "500" }}>Nomination Type:</label>
                  <p style={{ margin: "4px 0 0 0", fontWeight: "600", color: "#92400e" }}>
                    {selectedNomination.nominationType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || "N/A"}
                  </p>
                </div>
                <div>
                  <label style={{ fontSize: "12px", color: "#6c757d", fontWeight: "500" }}>Submitted Date:</label>
                  <p style={{ margin: "4px 0 0 0", fontWeight: "600", color: "#92400e" }}>
                    {formatDate(selectedNomination.submittedAt)}
                  </p>
                </div>
                <div>
                  <label style={{ fontSize: "12px", color: "#6c757d", fontWeight: "500" }}>Status:</label>
                  <p style={{ margin: "4px 0 0 0" }}>
                    <span className={`status-badge ${getStatusBadgeClass(selectedNomination.status)}`}>
                      {selectedNomination.status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || "N/A"}
                    </span>
                  </p>
                </div>
              </div>
              {selectedNomination.justification && (
                <div style={{ marginTop: "12px" }}>
                  <label style={{ fontSize: "12px", color: "#6c757d", fontWeight: "500" }}>Justification:</label>
                  <p style={{ margin: "4px 0 0 0", color: "#374151", lineHeight: "1.6", wordBreak: "break-word" }}>
                    {selectedNomination.justification}
                  </p>
                </div>
              )}
            </div>
            {/* Review Information (if available) */}
            {(selectedNomination.reviewRemarks || selectedNomination.reviewedByName) && (
              <div style={{ padding: "16px", backgroundColor: "#e0e7ff", borderRadius: "8px" }}>
                <h6 style={{ color: "#1e40af", fontWeight: "600", marginBottom: "12px", fontSize: "14px" }}>
                  <i className="bi bi-chat-left-text me-2"></i>
                  Review Information
                </h6>
                {selectedNomination.reviewedByName && (
                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ fontSize: "12px", color: "#6c757d", fontWeight: "500" }}>Reviewed By:</label>
                    <p style={{ margin: "4px 0 0 0", color: "#374151", lineHeight: "1.6" }}>
                      {selectedNomination.reviewedByName}
                    </p>
                  </div>
                )}
                {selectedNomination.reviewedAt && (
                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ fontSize: "12px", color: "#6c757d", fontWeight: "500" }}>Reviewed At:</label>
                    <p style={{ margin: "4px 0 0 0", color: "#374151", lineHeight: "1.6" }}>
                      {formatDate(selectedNomination.reviewedAt)}
                    </p>
                  </div>
                )}
                {selectedNomination.reviewRemarks && (
                  <div>
                    <label style={{ fontSize: "12px", color: "#6c757d", fontWeight: "500" }}>Review Remarks:</label>
                    <p style={{ margin: "4px 0 0 0", color: "#374151", lineHeight: "1.6" }}>
                      {selectedNomination.reviewRemarks}
                    </p>
                  </div>
                )}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer style={{ backgroundColor: "#f8f9fa", borderTop: "2px solid #dee2e6" }}>
            <button
              className="btn btn-secondary"
              onClick={() => setShowDetailsModal(false)}
              style={{ padding: "8px 20px" }}
            >
              <i className="bi bi-x-circle me-2"></i>
              Close
            </button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
};
 
export default NominationManagement;
 
 