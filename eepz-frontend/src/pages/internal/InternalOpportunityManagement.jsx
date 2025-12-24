
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/auth/AuthContext";
import internalOpportunityService from "../../services/internal/internalOpportunityService";
import departmentService from "../../services/auth/departmentService";
import CreateOpportunityModal from "../../components/internal/OpportunityModals/CreateOpportunityModal";
import EditOpportunityModal from "../../components/internal/OpportunityModals/EditOpportunityModal";
import DeleteOpportunityModal from "../../components/internal/OpportunityModals/DeleteOpportunityModal";
import ViewOpportunityModal from "../../components/internal/OpportunityModals/ViewOpportunityModal";
import SelfNominateModal from "../../components/internal/NominationModals/SelfNominateModal";
import ManagerNominateModal from "../../components/internal/NominationModals/ManagerNominateModal";
import Breadcrumb from "../../components/common/Breadcrumb";
import { toast } from "sonner";
import { FaSearch } from "react-icons/fa";
import { Form } from "react-bootstrap";
import "../../styles/internal/InternalOpportunityManagement.css";

/* Simple custom status dropdown with #27235c hover */
const StatusDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);

  const options = [
    { label: "All Status", value: "" },
    { label: "Active", value: "Active" },
    { label: "Closed", value: "Closed" },
    { label: "Pending", value: "Pending" },
  ];

  const selected = options.find((o) => o.value === value) || options[0];

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div
      className="filter-select custom-status-dropdown"
      tabIndex={0}
      onBlur={() => setOpen(false)}
      onClick={() => setOpen((prev) => !prev)}
      style={{ position: "relative" }}
    >
      <div className="custom-status-selected">
        {selected.label}
        <span className="custom-status-arrow">▾</span>
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

const InternalOpportunityManagement = () => {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState([]);
  const [filteredOpportunities, setFilteredOpportunities] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Pagination
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showSelfNominateModal, setShowSelfNominateModal] = useState(false);
  const [showManagerNominateModal, setShowManagerNominateModal] =
    useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);

  toast.options = {
    closeButton: true,
    progressBar: true,
    positionClass: "toast-top-right",
    timeOut: 3000,
  };

  // Get role prefix for routing
  const getRolePrefix = () => {
    const role = user?.role?.toLowerCase();
    return `/${role}`;
  };

  const rolePrefix = getRolePrefix();

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-filter only on department/status changes (NOT searchTerm)
  useEffect(() => {
    filterOpportunities();
  }, [opportunities, selectedDepartment, selectedStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [opportunitiesResponse, departmentsResponse] = await Promise.all([
        internalOpportunityService.getAllOpportunities(),
        departmentService.getAllDepartments(),
      ]);

      if (opportunitiesResponse.success) {
        const oppArray = Array.isArray(opportunitiesResponse.data)
          ? opportunitiesResponse.data
          : [];
        setOpportunities(oppArray);
      } else {
        setOpportunities([]);
        toast.error("Failed to load opportunities");
      }

      if (departmentsResponse.success) {
        setDepartments(departmentsResponse.data || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setOpportunities([]);
      toast.error("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filterOpportunities = useCallback(() => {
    let filtered = Array.isArray(opportunities) ? [...opportunities] : [];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (opp) =>
          opp.opportunityName?.toLowerCase().includes(term) ||
          opp.description?.toLowerCase().includes(term) ||
          opp.requirements?.toLowerCase().includes(term)
      );
    }

    if (selectedDepartment) {
      filtered = filtered.filter(
        (opp) => opp.departmentId === parseInt(selectedDepartment)
      );
    }

    if (selectedStatus) {
      filtered = filtered.filter((opp) => opp.status === selectedStatus);
    }

    setFilteredOpportunities(filtered);
    setCurrentPage(1);
  }, [opportunities, searchTerm, selectedDepartment, selectedStatus]);

  const clearFilters = () => {
    // Reset all filters first
    setSearchTerm("");
    setSelectedDepartment("");
    setSelectedStatus("");
    // Force update filteredOpportunities to show ALL opportunities
    setFilteredOpportunities(opportunities);
    setCurrentPage(1);
  };

  const handleCreateOpportunity = () => {
    setShowCreateModal(true);
  };

  const handleEditOpportunity = (opportunity) => {
    setSelectedOpportunity(opportunity);
    setShowEditModal(true);
  };

  const handleDeleteOpportunity = (opportunity) => {
    setSelectedOpportunity(opportunity);
    setShowDeleteModal(true);
  };

  const handleViewOpportunity = (opportunity) => {
    setSelectedOpportunity(opportunity);
    setShowViewModal(true);
  };

  const handleSelfNominate = (opportunity) => {
    setSelectedOpportunity(opportunity);
    setShowSelfNominateModal(true);
  };

  const handleManagerNominate = (opportunity) => {
    setSelectedOpportunity(opportunity);
    setShowManagerNominateModal(true);
  };

  const handleOpportunityCreated = () => {
    setShowCreateModal(false);
    fetchData();
  };

  const handleOpportunityUpdated = () => {
    setShowEditModal(false);
    fetchData();
  };

  const handleOpportunityDeleted = () => {
    setShowDeleteModal(false);
    fetchData();
  };

  const handleNominationSubmitted = () => {
    setShowSelfNominateModal(false);
    setShowManagerNominateModal(false);
    toast.success("Nomination submitted successfully!");
    fetchData();
  };

  const getPaginatedOpportunities = () => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredOpportunities.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredOpportunities.length / rowsPerPage);

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

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "status-active";
      case "closed":
        return "status-inactive";
      case "pending":
        return "status-pending";
      default:
        return "status-inactive";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // ROLE-BASED UI RENDERING
  const isHR = user?.role === "HR";
  const isEmployee = user?.role === "Employee";
  const isManager = user?.role === "Manager";

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
            label: isHR
              ? "Manage Internal Opportunities"
              : "Internal Opportunities",
          },
        ]}
      />

      {/* Statistics Cards - Compact */}
      <div className="int-stats-grid">
        <div className="in-stat-card">
          <div className="stat-icon stat-icon-primary">
            <i className="bi bi-briefcase-fill"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{opportunities.length}</h3>
            <p className="stat-label">{isHR ? "Total Created" : "Available"}</p>
          </div>
        </div>

        <div className="in-stat-card">
          <div className="stat-icon stat-icon-success">
            <i className="bi bi-check-circle-fill"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">
              {opportunities.filter((o) => o.status === "Active").length}
            </h3>
            <p className="stat-label">Active</p>
          </div>
        </div>

        <div className="in-stat-card">
          <div className="stat-icon stat-icon-danger">
            <i className="bi bi-x-circle-fill"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">
              {opportunities.filter((o) => o.status === "Closed").length}
            </h3>
            <p className="stat-label">Closed</p>
          </div>
        </div>

        <div className="in-stat-card">
          <div className="stat-icon stat-icon-warning">
            <i className="bi bi-clock-fill"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">
              {opportunities.filter((o) => o.status === "Pending").length}
            </h3>
            <p className="stat-label">Pending</p>
          </div>
        </div>
      </div>

      {/* Filter Section with Search Button */}
      <div className="filters-card">
        <div className="filters-content">
          {/* Search with Button */}
          <div className="io-search-input">
            <div className="io-search-inner">
              <span className="io-search-icon">
                <FaSearch />
              </span>
              <Form.Control
                type="text"
                placeholder="Search opportunities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="io-search-field"
              />
              <button
                type="button"
                className="io-search-btn"
                onClick={filterOpportunities}
              >
                Search
              </button>
            </div>
          </div>

          {(isHR || isEmployee || isManager) && (
            <StatusDropdown
              value={selectedStatus}
              onChange={(val) => setSelectedStatus(val)}
            />
          )}

          <button className="btn-clear" onClick={clearFilters}>
            Clear Filters
          </button>
          <div className="results-count-inline">
            Showing {getPaginatedOpportunities().length} of{" "}
            {filteredOpportunities.length} opportunities
          </div>

          {/* ONLY HR CAN CREATE */}
          {isHR && (
            <button className="btn-add" onClick={handleCreateOpportunity}>
              <i className="bi bi-plus-circle"></i>
              Create Opportunity
            </button>
          )}
        </div>
      </div>

      {/* Table Card */}
      <div className="in-table-card">
        <div className="table-wrapper">
          <table className="user-table">
            <thead>
              <tr>
                <th>Opportunity Name</th>
                <th>Department</th>
                <th>Description</th>
                <th>Requirements</th>
                <th>Deadline</th>
                <th>Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {getPaginatedOpportunities().length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-state">
                    <i className="bi bi-inbox"></i>
                    <p>No opportunities found</p>
                  </td>
                </tr>
              ) : (
                getPaginatedOpportunities().map((opportunity) => (
                  <tr key={opportunity.opportunityId}>
                    <td>
                      <div className="opportunity-info">
                        <span className="opportunity-name">
                          {opportunity.opportunityName}
                        </span>
                      </div>
                    </td>
                    <td className="text-muted">
                      {opportunity.departmentName || "N/A"}
                    </td>
                    <td className="text-muted opportunity-desc">
                      {opportunity.description?.substring(0, 80)}
                      {opportunity.description?.length > 80 && "..."}
                    </td>
                    <td className="text-muted opportunity-req">
                      {opportunity.requirements?.substring(0, 60)}
                      {opportunity.requirements?.length > 60 && "..."}
                    </td>
                    <td>{formatDate(opportunity.deadline)}</td>
                    <td>
                      <span
                        className={`status-badge ${getStatusBadgeClass(
                          opportunity.status
                        )}`}
                      >
                        {opportunity.status || "Pending"}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {/* HR: Edit & Delete */}
                        {isHR && (
                          <>
                            <button
                              className="action-btn action-btn-edit"
                              onClick={() =>
                                handleEditOpportunity(opportunity)
                              }
                              title="Edit Opportunity"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className="action-btn action-btn-delete"
                              onClick={() =>
                                handleDeleteOpportunity(opportunity)
                              }
                              title="Delete Opportunity"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </>
                        )}

                        {/* EMPLOYEE: Self Nominate */}
                        {isEmployee && (
                          <button
                            className="action-btn action-btn-nominate"
                            onClick={() => handleSelfNominate(opportunity)}
                            title="Self Nominate"
                          >
                            <i className="bi bi-hand-thumbs-up"></i>
                          </button>
                        )}

                        {/* MANAGER: Self Nominate & Nominate Team Members */}
                        {isManager && (
                          <>
                            <button
                              className="action-btn action-btn-nominate"
                              onClick={() => handleSelfNominate(opportunity)}
                              title="Self Nominate"
                            >
                              <i className="bi bi-hand-thumbs-up"></i>
                            </button>
                            <button
                              className="action-btn action-btn-nominate-team"
                              onClick={() =>
                                handleManagerNominate(opportunity)
                              }
                              title="Nominate Team Member"
                            >
                              <i className="bi bi-person-plus"></i>
                            </button>
                          </>
                        )}

                        {/* View Details for all */}
                        <button
                          className="action-btn action-btn-view"
                          onClick={() => handleViewOpportunity(opportunity)}
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
        {filteredOpportunities.length > 0 && (
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
              Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
              {Math.min(
                currentPage * rowsPerPage,
                filteredOpportunities.length
              )}{" "}
              of {filteredOpportunities.length} entries
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
                    } ${typeof page !== "number" ? "disabled" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() =>
                        typeof page === "number" && setCurrentPage(page)
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

      {/* MODALS */}
      {isHR && showCreateModal && (
        <CreateOpportunityModal
          show={showCreateModal}
          onHide={() => setShowCreateModal(false)}
          onOpportunityCreated={handleOpportunityCreated}
          departments={departments}
        />
      )}

      {isHR && showEditModal && selectedOpportunity && (
        <EditOpportunityModal
          show={showEditModal}
          onHide={() => setShowEditModal(false)}
          onOpportunityUpdated={handleOpportunityUpdated}
          opportunity={selectedOpportunity}
          departments={departments}
        />
      )}

      {isHR && showDeleteModal && selectedOpportunity && (
        <DeleteOpportunityModal
          show={showDeleteModal}
          onHide={() => setShowDeleteModal(false)}
          onOpportunityDeleted={handleOpportunityDeleted}
          opportunity={selectedOpportunity}
        />
      )}

      {showViewModal && selectedOpportunity && (
        <ViewOpportunityModal
          show={showViewModal}
          opportunity={selectedOpportunity}
          onClose={() => {
            setShowViewModal(false);
            setSelectedOpportunity(null);
          }}
        />
      )}

      {(isEmployee || isManager) &&
        showSelfNominateModal &&
        selectedOpportunity && (
          <SelfNominateModal
            show={showSelfNominateModal}
            onHide={() => setShowSelfNominateModal(false)}
            opportunity={selectedOpportunity}
            onNominationSubmitted={handleNominationSubmitted}
          />
        )}

      {isManager && showManagerNominateModal && selectedOpportunity && (
        <ManagerNominateModal
          show={showManagerNominateModal}
          onHide={() => setShowManagerNominateModal(false)}
          opportunity={selectedOpportunity}
          onNominationSubmitted={handleNominationSubmitted}
        />
      )}
    </div>
  );
};

export default InternalOpportunityManagement;
