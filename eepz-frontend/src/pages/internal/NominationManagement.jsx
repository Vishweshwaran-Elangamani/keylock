import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/auth/AuthContext";
import { Form } from "react-bootstrap";
import nominationService from "../../services/internal/nominationService";
import internalOpportunityService from "../../services/internal/internalOpportunityService";
import SelfNominateModal from "../../components/internal/NominationModals/SelfNominateModal";
import ManagerNominateModal from "../../components/internal/NominationModals/ManagerNominateModal";
import NominationReviewModal from "../../components/internal/NominationModals/NominationReviewModal";
import NominationGraphModal from "../../components/internal/NominationModals/NominationGraphModal";
import NominationDetailsModal from "../../components/internal/NominationModals/NominationDetailsModal";
import Breadcrumb from "../../components/common/Breadcrumb";
import { FaSearch } from "react-icons/fa";
import { toast } from "sonner";
import "../../styles/internal/NominationManagement.css";
const NominationStatusDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const options = [
    { label: "All Status", value: "" },
    { label: "Pending", value: "Pending" },
    { label: "Approved", value: "Approved" },
    { label: "Rejected", value: "Rejected" },
  ];
  const selected = options.find((o) => o.value === value) || options[0];
  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };
  return (
    <div
      className="nm-status-select custom-status-dropdown"
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
const NominationManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [nominations, setNominations] = useState([]);
  const [filteredNominations, setFilteredNominations] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const searchInputRef = useRef(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showRowsDropdown, setShowRowsDropdown] = useState(false);
  const rowsDropdownRef = useRef(null);
  const [showSelfNominateModal, setShowSelfNominateModal] = useState(false);
  const [showManagerNominateModal, setShowManagerNominateModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showGraphModal, setShowGraphModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedNomination, setSelectedNomination] = useState(null);
  const getRolePrefix = () => {
    const role = user?.role?.toLowerCase();
    return `/${role}`;
  };
  const rolePrefix = getRolePrefix();
  useEffect(() => {
    fetchData();
  }, []);
  useEffect(() => {
    applyFilters();
  }, [nominations, selectedStatus, activeSearchTerm]);
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
  const handleSearch = () => {
    setActiveSearchTerm(searchTerm);
    setCurrentPage(1);
    if (searchInputRef.current) searchInputRef.current.blur();
  };
  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };
  const clearFilters = () => {
    setSearchTerm("");
    setActiveSearchTerm("");
    setSelectedStatus("");
    setCurrentPage(1);
  };
  const fetchData = async () => {
    try {
      setLoading(true);
      let nominationsResponse;
      if (user?.role === "Manager") {
        nominationsResponse = await nominationService.getPendingManagerReview();
      } else if (user?.role === "Department Head") {
        nominationsResponse = await nominationService.getPendingDeptHeadReview();
      } else if (user?.role === "HR" || user?.role === "Admin") {
        nominationsResponse = await nominationService.getAllNominations();
      } else {
        nominationsResponse = await nominationService.getMyNominations();
      }
      const opportunitiesResponse = await internalOpportunityService.getAllOpportunities();
      if (nominationsResponse.success) {
        const data = Array.isArray(nominationsResponse.data)
          ? nominationsResponse.data
          : [];
        setNominations(data);
      } else {
        toast.error(nominationsResponse.message || "Failed to load nominations");
        setNominations([]);
      }
      if (opportunitiesResponse.success) {
        setOpportunities(
          Array.isArray(opportunitiesResponse.data) ? opportunitiesResponse.data : []
        );
      }
    } catch (error) {
      console.error("[NominationManagement] fetchData error:", error);
      toast.error("Failed to load data");
      setNominations([]);
    } finally {
      setLoading(false);
    }
  };
  const applyFilters = () => {
    let filtered = Array.isArray(nominations) ? [...nominations] : [];
    if (activeSearchTerm) {
      const term = activeSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (nom) =>
          nom.opportunityName?.toLowerCase().includes(term) ||
          nom.nomineeName?.toLowerCase().includes(term)
      );
    }
    if (selectedStatus) {
      filtered = filtered.filter((nom) => {
        const status = nom.status?.toLowerCase() || "";
        const filterStatus = selectedStatus.toLowerCase();
        if (filterStatus === "pending") {
          return status.includes("pending");
        } else if (filterStatus === "approved") {
          return status.includes("approved");
        } else if (filterStatus === "rejected") {
          return status.includes("rejected");
        }
        return status === filterStatus;
      });
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
  const handleViewHistory = () => {
    navigate("/internal/nomination-history");
  };
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredNominations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredNominations.length / rowsPerPage) || 1;
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
  const getStatusBadgeClass = (status) => {
    if (!status) return "nm-badge-inactive";
    const statusLower = status.toLowerCase();
    if (statusLower.includes("approved")) {
      return "nm-badge-approved";
    }
    if (statusLower.includes("rejected")) {
      return "nm-badge-rejected";
    }
    if (statusLower.includes("pending")) {
      return "nm-badge-pending";
    }
    return "nm-badge-inactive";
  };
  const formatStatus = (status) => {
    if (!status) return "N/A";
    return status
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };
  const getStatistics = () => {
    const total = nominations.length;
    const approved = nominations.filter((n) =>
      n.status?.toLowerCase().includes("approved")
    ).length;
    const pending = nominations.filter((n) =>
      n.status?.toLowerCase().includes("pending")
    ).length;
    const rejected = nominations.filter((n) =>
      n.status?.toLowerCase().includes("rejected")
    ).length;
    return { total, approved, pending, rejected };
  };
  const stats = getStatistics();
  if (loading) {
    return (
      <div className="nm-loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  return (
    <div className="nm-page">
      <Breadcrumb
        items={[
          {
            label: "Nominations",
          },
        ]}
      />
      {/* Statistics Cards */}
      <div className="stats-cards-nm">
        <div className="stat-card-nm stat-total-nm">
          <div className="stat-icon-nm">
            <i className="bi bi-hand-thumbs-up"></i>
          </div>
          <div className="stat-content-nm">
            <div className="stat-value-nm">{stats.total}</div>
            <div className="stat-label-nm">Total Nominations</div>
          </div>
        </div>
        <div className="stat-card-nm stat-approved-nm">
          <div className="stat-icon-nm">
            <i className="bi bi-check-circle-fill"></i>
          </div>
          <div className="stat-content-nm">
            <div className="stat-value-nm">{stats.approved}</div>
            <div className="stat-label-nm">Approved</div>
          </div>
        </div>
        <div className="stat-card-nm stat-pending-nm">
          <div className="stat-icon-nm">
            <i className="bi bi-clock-fill"></i>
          </div>
          <div className="stat-content-nm">
            <div className="stat-value-nm">{stats.pending}</div>
            <div className="stat-label-nm">Pending</div>
          </div>
        </div>
        <div className="stat-card-nm stat-rejected-nm">
          <div className="stat-icon-nm">
            <i className="bi bi-x-circle-fill"></i>
          </div>
          <div className="stat-content-nm">
            <div className="stat-value-nm">{stats.rejected}</div>
            <div className="stat-label-nm">Rejected</div>
          </div>
        </div>
      </div>
      {/* Controls */}
      <div className="nm-controls">
        <div className="nm-search-input">
          <div className="nm-search-inner">
            <span className="nm-search-icon">
              <FaSearch />
            </span>
            <Form.Control
              ref={searchInputRef}
              type="text"
              placeholder="Search nominations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleSearchKeyDown}
              className="nm-search-field"
            />
            <button type="button" className="nm-search-btn" onClick={handleSearch}>
              Search
            </button>
          </div>
        </div>
        <div className="nm-status-filter">
          <NominationStatusDropdown
            value={selectedStatus}
            onChange={(val) => {
              setSelectedStatus(val);
              setCurrentPage(1);
            }}
          />
        </div>
        <button className="nm-btn-clear" onClick={clearFilters}>
          Clear Filters
        </button>
        {!["HR", "Department Head"].includes(user?.role) && (
          <button
            className="nm-btn-graph"
            onClick={() => setShowGraphModal(true)}
            title="View Analytics Graph"
          >
            <i className="bi bi-bar-chart-fill"></i>
            View Graph
          </button>
        )}
        {user?.role === "Manager" && (
          <button
            className="nm-btn-history"
            onClick={handleViewHistory}
            title="View Nomination History"
          >
            <i className="bi bi-clock-history"></i>
            History
          </button>
        )}
        <div className="nm-results-count">
          Showing {filteredNominations.length}{" "}
          {filteredNominations.length === 1 ? "nomination" : "nominations"}
        </div>
      </div>
      {/* Table */}
      <div className="nm-table-card">
        <div className="nm-table-wrapper">
          <table className="nm-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Opportunity</th>
                <th>Nominee</th>
                <th>Nominated By</th>
                <th>Type</th>
                <th>Status</th>
                <th>Level</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan="8" className="nm-empty-state">
                    <div className="nm-empty-content">
                      <i className="bi bi-inbox"></i>
                      <h4>No nominations found</h4>
                      <p>Try adjusting your search or filter criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentItems.map((nomination) => (
                  <tr key={nomination.nominationId}>
                    <td>
                      <span className="nm-nomination-id">
                        #{nomination.nominationId}
                      </span>
                    </td>
                    <td>
                      <strong>{nomination.opportunityName}</strong>
                    </td>
                    <td>{nomination.nomineeName}</td>
                    <td>{nomination.nominatedByName}</td>
                    <td>
                      <span className="nm-type-badge">
                        {nomination.nominationType}
                      </span>
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(nomination.status)}>
                        {formatStatus(nomination.status)}
                      </span>
                    </td>
                    <td>
                      <span className="nm-level-badge">
                        Level {nomination.currentApprovalLevel || 0}
                      </span>
                    </td>
                    <td>
                      <div className="nm-table-actions">
                        {(user?.role === "Manager" || user?.role === "Department Head") &&
                          nomination.status?.toLowerCase().includes("pending") && (
                            <button
                              className="nm-action-review"
                              onClick={() => handleReviewNomination(nomination)}
                              title="Review Nomination"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                          )}
                        <button
                          className="nm-action-view"
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
        {/* Pagination */}
        {filteredNominations.length > 0 && (
          <div className="nm-pagination-container">
            <div className="nm-pagination-info">
              <span className="nm-pagination-label">Show</span>
              <div ref={rowsDropdownRef} className="nm-rows-dropdown-wrapper">
                <button
                  type="button"
                  onClick={() => setShowRowsDropdown(!showRowsDropdown)}
                  className="nm-rows-button"
                >
                  <span>{rowsPerPage}</span>
                  <i
                    className={`bi bi-chevron-${showRowsDropdown ? "up" : "down"} nm-rows-chevron`}
                  ></i>
                </button>
                {showRowsDropdown && (
                  <div className="nm-rows-dropdown">
                    {[10, 25, 50].map((size) => (
                      <div
                        key={size}
                        onClick={() => {
                          setRowsPerPage(size);
                          setCurrentPage(1);
                          setShowRowsDropdown(false);
                        }}
                        className={`nm-rows-option ${
                          rowsPerPage === size ? "nm-rows-active" : ""
                        }`}
                      >
                        {size}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <span className="nm-pagination-label">entries</span>
            </div>
            <div className="nm-pagination-status">
              Showing {indexOfFirstItem + 1} to{" "}
              {Math.min(indexOfLastItem, filteredNominations.length)} of{" "}
              {filteredNominations.length} entries
            </div>
            <nav className="nm-pagination-nav">
              <ul className="nm-pagination">
                <li className={`nm-page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button
                    className="nm-page-link"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                </li>
                {getPageNumbers().map((page, index) => (
                  <li
                    key={index}
                    className={`nm-page-item ${
                      page === currentPage ? "active" : ""
                    } ${typeof page !== "number" ? "disabled" : ""}`}
                  >
                    <button
                      className="nm-page-link"
                      onClick={() => typeof page === "number" && setCurrentPage(page)}
                      disabled={typeof page !== "number"}
                    >
                      {page}
                    </button>
                  </li>
                ))}
                <li
                  className={`nm-page-item ${
                    currentPage === totalPages ? "disabled" : ""
                  }`}
                >
                  <button
                    className="nm-page-link"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
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
