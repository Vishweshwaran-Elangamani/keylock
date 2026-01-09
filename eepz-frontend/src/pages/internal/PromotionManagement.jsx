import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/auth/AuthContext";
import promotionService from "../../services/internal/promotionService";
import nominationService from "../../services/internal/nominationService";
import CreatePromotionModal from "../../components/internal/PromotionModals/CreatePromotionModal";
import PromotionApprovalModal from "../../components/internal/PromotionModals/PromotionApprovalModal";
import PromotionDetailsModal from "../../components/internal/PromotionModals/PromotionDetailsModal";
import Breadcrumb from "../../components/common/Breadcrumb";
import { toast } from "sonner";
import "../../styles/internal/PromotionManagement.css";
const PromotionManagement = () => {
  const { user } = useAuth();
  const [promotions, setPromotions] = useState([]);
  const [filteredPromotions, setFilteredPromotions] = useState([]);
  const [approvedNominations, setApprovedNominations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  // Get role prefix for routing
  const getRolePrefix = () => {
    const role = user?.role?.toLowerCase().replace(/\s+/g, "-");
    return `/${role}`;
  };
  const rolePrefix = getRolePrefix();
  toast.options = {
    closeButton: true,
    progressBar: true,
    positionClass: "toast-top-right",
    timeOut: 3000,
  };
  useEffect(() => {
    fetchData();
  }, []);
  useEffect(() => {
    filterPromotions();
  }, [promotions, searchTerm, selectedStatus]);
  const fetchData = async () => {
    try {
      setLoading(true);
      let promotionsResponse;
      if (user?.role === "HR") {
        promotionsResponse = await promotionService.getPendingHRApproval();
      } else if (user?.role === "Leadership") {
        promotionsResponse =
          await promotionService.getPendingLeadershipApproval();
      } else {
        promotionsResponse = await promotionService.getAllPromotions();
      }
      if (promotionsResponse.success) {
        const promotionData = Array.isArray(promotionsResponse.data)
          ? promotionsResponse.data
          : promotionsResponse.data?.promotions || [];
        setPromotions(promotionData);
      }
      const nomResponse = await nominationService.getAllNominations();
      if (nomResponse.success) {
        const nominations = Array.isArray(nomResponse.data)
          ? nomResponse.data
          : nomResponse.data?.nominations || [];
        const approved = nominations.filter(
          (n) => n.status?.toLowerCase() === "approved"
        );
        setApprovedNominations(approved);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };
  const filterPromotions = () => {
    let filtered = Array.isArray(promotions) ? [...promotions] : [];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (promo) =>
          promo.employeeName?.toLowerCase().includes(term) ||
          promo.opportunityName?.toLowerCase().includes(term) ||
          promo.positionName?.toLowerCase().includes(term)
      );
    }
    if (selectedStatus) {
      filtered = filtered.filter(
        (promo) => promo.status?.toLowerCase() === selectedStatus.toLowerCase()
      );
    }
    setFilteredPromotions(filtered);
    setCurrentPage(1);
  };
  const getPaginatedPromotions = () => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredPromotions.slice(startIndex, endIndex);
  };
  const totalPages = Math.ceil(filteredPromotions.length / rowsPerPage);
  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "status-active";
      case "rejected":
        return "status-inactive";
      case "pending_hr_approval":
      case "pending hr approval":
        return "status-pending";
      case "pending_leadership_approval":
      case "pending leadership approval":
        return "status-warning";
      default:
        return "status-inactive";
    }
  };
  const handleViewDetails = (promotion) => {
    setSelectedPromotion(promotion);
    setShowDetailsModal(true);
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
            label: "Promotions",
          },
        ]}
      />
      <div className="filters-card">
        <div className="filters-content">
          <div className="filters-left">
            <div className="search-box">
              <i className="bi bi-search search-icon"></i>
              <input
                type="text"
                className="search-input"
                placeholder="Search promotions..."
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
              <option value="approved">Approved</option>
              <option value="pending_hr_approval">Pending HR</option>
              <option value="pending_leadership_approval">
                Pending Leadership
              </option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="filters-actions">
            {user?.role === "HR" && (
              <button
                className="btn-add"
                onClick={() => setShowCreateModal(true)}
              >
                <i className="bi bi-arrow-up-circle"></i>
                Create Promotion
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-icon-primary">
            <i className="bi bi-arrow-up-circle"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{promotions.length}</h3>
            <p className="stat-label">Total Promotions</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-success">
            <i className="bi bi-check-circle-fill"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">
              {
                promotions.filter((p) => p.status?.toLowerCase() === "approved")
                  .length
              }
            </h3>
            <p className="stat-label">Approved</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-warning">
            <i className="bi bi-hourglass-split"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">
              {
                promotions.filter((p) =>
                  p.status?.toLowerCase().includes("pending")
                ).length
              }
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
              {
                promotions.filter((p) => p.status?.toLowerCase() === "rejected")
                  .length
              }
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
                <th>Employee</th>
                <th>Current Role</th>
                <th>New Role</th>
                <th>Promotion Date</th>
                <th>Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {getPaginatedPromotions().length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-state">
                    <i className="bi bi-inbox"></i>
                    <p>No promotions found</p>
                  </td>
                </tr>
              ) : (
                getPaginatedPromotions().map((promotion) => (
                  <tr key={promotion.promotionId}>
                    <td>{promotion.employeeName || "N/A"}</td>
                    <td>{promotion.oldRole || "N/A"}</td>
                    <td>
                      {promotion.newRole ||
                        promotion.positionName ||
                        promotion.opportunityName ||
                        "N/A"}
                    </td>
                    <td>
                      {promotion.promotionDate
                        ? new Date(promotion.promotionDate).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td>
                      <span
                        className={`status-badge ${getStatusBadgeClass(
                          promotion.status
                        )}`}
                      >
                        {promotion.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {(user?.role === "HR" || user?.role === "Leadership") &&
                          promotion.status
                            ?.toLowerCase()
                            .includes("pending") && (
                            <button
                              className="action-btn action-btn-edit"
                              onClick={() => {
                                setSelectedPromotion(promotion);
                                setShowApprovalModal(true);
                              }}
                              title="Review"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                          )}
                        <button
                          className="action-btn action-btn-view"
                          onClick={() => handleViewDetails(promotion)}
                          title="View"
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
        {filteredPromotions.length > 0 && (
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
      {showCreateModal && (
        <CreatePromotionModal
          show={showCreateModal}
          onHide={() => setShowCreateModal(false)}
          approvedNominations={approvedNominations}
          onPromotionCreated={() => {
            setShowCreateModal(false);
            fetchData();
          }}
        />
      )}
      {showApprovalModal && selectedPromotion && (
        <PromotionApprovalModal
          show={showApprovalModal}
          onHide={() => setShowApprovalModal(false)}
          promotion={selectedPromotion}
          userRole={user?.role}
          onApprovalSubmitted={() => {
            setShowApprovalModal(false);
            fetchData();
          }}
        />
      )}
      {showDetailsModal && selectedPromotion && (
        <PromotionDetailsModal
          show={showDetailsModal}
          onHide={() => setShowDetailsModal(false)}
          promotion={selectedPromotion}
        />
      )}
    </div>
  );
};
export default PromotionManagement;
