import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/auth/AuthContext";
import nominationService from "../../services/internal/nominationService";
import internalOpportunityService from "../../services/internal/internalOpportunityService";
import SelfNominateModal from "../../components/internal/NominationModals/SelfNominateModal";
import ManagerNominateModal from "../../components/internal/NominationModals/ManagerNominateModal";
import NominationReviewModal from "../../components/internal/NominationModals/NominationReviewModal";
import NominationGraphModal from "../../components/internal/NominationModals/NominationGraphModal";
import NominationDetailsModal from "../../components/internal/NominationModals/NominationDetailsModal";
import Breadcrumb from "../../components/common/Breadcrumb";
import { toast } from "sonner";
import "../../styles/internal/NominationManagement.css";

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
  const [showManagerNominateModal, setShowManagerNominateModal] =
    useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showGraphModal, setShowGraphModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedNomination, setSelectedNomination] = useState(null);

  // Get role prefix for routing
  const getRolePrefix = () => {
    const role = user?.role?.toLowerCase();
    return `/${role}`;
  };

  const rolePrefix = getRolePrefix();

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
        nominationsResponse =
          await nominationService.getPendingDeptHeadReview();
      } else {
        nominationsResponse = await nominationService.getAllNominations();
      }
      const opportunitiesResponse =
        await internalOpportunityService.getAllOpportunities();

      if (nominationsResponse.success) {
        setNominations(
          Array.isArray(nominationsResponse.data)
            ? nominationsResponse.data
            : []
        );
      }
      if (opportunitiesResponse.success) {
        setOpportunities(
          Array.isArray(opportunitiesResponse.data)
            ? opportunitiesResponse.data
            : []
        );
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
      <Breadcrumb
        items={[
          {
            label: "Nominations",
          },
        ]}
      />

      <div className="nm-stats-grid">
        <div className="nm-stat-card">
          <div className="stat-icon stat-icon-primary">
            <i className="bi bi-hand-thumbs-up"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{nominations.length}</h3>
            <p className="stat-label">Total Nominations</p>
          </div>
        </div>

        <div className="nm-stat-card">
          <div className="stat-icon stat-icon-success">
            <i className="bi bi-check-circle-fill"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">
              {
                nominations.filter(
                  (n) => n.status?.toLowerCase() === "approved"
                ).length
              }
            </h3>
            <p className="stat-label">Approved</p>
          </div>
        </div>

        <div className="nm-stat-card">
          <div className="stat-icon stat-icon-warning">
            <i className="bi bi-clock-fill"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">
              {
                nominations.filter((n) =>
                  n.status?.toLowerCase().includes("pending")
                ).length
              }
            </h3>
            <p className="stat-label">Pending</p>
          </div>
        </div>

        <div className="nm-stat-card">
          <div className="stat-icon stat-icon-danger">
            <i className="bi bi-x-circle-fill"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">
              {
                nominations.filter((n) =>
                  n.status?.toLowerCase().includes("rejected")
                ).length
              }
            </h3>
            <p className="stat-label">Rejected</p>
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

      <div className="nm-table-card">
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
                      <span
                        className={`status-badge ${getStatusBadgeClass(
                          nomination.status
                        )}`}
                      >
                        {nomination.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {(user?.role === "Manager" ||
                          user?.role === "Department Head") &&
                          nomination.status
                            ?.toLowerCase()
                            .includes("pending") && (
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

      {showDetailsModal && selectedNomination && (
        <NominationDetailsModal
          show={showDetailsModal}
          onHide={() => setShowDetailsModal(false)}
          nomination={selectedNomination}
        />
      )}
    </div>
  );
};

export default NominationManagement;
