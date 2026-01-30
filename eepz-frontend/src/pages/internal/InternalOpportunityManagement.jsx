import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../contexts/auth/AuthContext";
import { useNavigate } from "react-router-dom";
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

const StatusDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const options = [
    { label: "All Status", value: "" },
    { label: "Active", value: "Active" },
    { label: "Closed", value: "Closed" },
  ];

  const selected = options.find((o) => o.value === value) || options[0];

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div
      className="ioma-status-select custom-status-dropdown"
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

const InternalOpportunityManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState([]);
  const [filteredOpportunities, setFilteredOpportunities] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showItemsDropdown, setShowItemsDropdown] = useState(false);
  const itemsDropdownRef = useRef(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showSelfNominateModal, setShowSelfNominateModal] = useState(false);
  const [showManagerNominateModal, setShowManagerNominateModal] = useState(false);
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

  // Auto-filter when dependencies change
  useEffect(() => {
    filterOpportunities();
  }, [opportunities, selectedDepartment, selectedStatus, activeSearchTerm]);

  // Click outside handler for items dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        itemsDropdownRef.current &&
        !itemsDropdownRef.current.contains(event.target)
      ) {
        setShowItemsDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
        toast.dismiss();
      } else {
        setOpportunities([]);
        toast.dismiss();
        toast.error("Failed to load opportunities");
      }

      if (departmentsResponse.success) {
        setDepartments(departmentsResponse.data || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setOpportunities([]);
      toast.dismiss();
      toast.error("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filterOpportunities = useCallback(() => {
    let filtered = Array.isArray(opportunities) ? [...opportunities] : [];

    if (activeSearchTerm) {
      const term = activeSearchTerm.toLowerCase();
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
  }, [opportunities, activeSearchTerm, selectedDepartment, selectedStatus]);

  const handleSearch = () => {
    setActiveSearchTerm(searchTerm);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setActiveSearchTerm("");
    setSelectedDepartment("");
    setSelectedStatus("");
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

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOpportunities.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredOpportunities.length / itemsPerPage) || 1;

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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "ioma-badge-active";
      case "closed":
        return "ioma-badge-closed";
      default:
        return "ioma-badge-inactive";
    }
  };

  // ROLE-BASED UI RENDERING
  const isHR = user?.role === "HR";
  const isEmployee = user?.role === "Employee";
  const isManager = user?.role === "Manager";

  const getOppStats = () => {
    const total = opportunities.length;
    const active = opportunities.filter((o) => o.status === "Active").length;
    const closed = opportunities.filter((o) => o.status === "Closed").length;
    const departmentCount = [...new Set(opportunities.map(o => o.departmentId))].length;

    return {
      totalOpportunities: total,
      activeOpportunities: active,
      closedOpportunities: closed,
      departmentsCount: departmentCount,
    };
  };

  const stats = getOppStats();

  if (loading) {
    return (
      <div className="ioma-loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="ioma-page">
      <Breadcrumb
        items={[
          {
            label: isHR
              ? "Manage Internal Opportunities"
              : "Internal Opportunities",
          },
        ]}
      />

      {/* KPI CARDS */}
      <div className="stats-cards-ioma">
        <div className="stat-card-ioma stat-total-ioma">
          <div className="stat-icon-ioma">
            <i className="bi bi-briefcase-fill"></i>
          </div>
          <div className="stat-content-ioma">
            <div className="stat-value-ioma">{stats.totalOpportunities}</div>
            <div className="stat-label-ioma">Total Opportunities</div>
          </div>
        </div>

        <div className="stat-card-ioma stat-active-ioma">
          <div className="stat-icon-ioma">
            <i className="bi bi-check2-circle"></i>
          </div>
          <div className="stat-content-ioma">
            <div className="stat-value-ioma">{stats.activeOpportunities}</div>
            <div className="stat-label-ioma">Active</div>
          </div>
        </div>

        <div className="stat-card-ioma stat-closed-ioma">
          <div className="stat-icon-ioma">
            <i className="bi bi-x-circle"></i>
          </div>
          <div className="stat-content-ioma">
            <div className="stat-value-ioma">{stats.closedOpportunities}</div>
            <div className="stat-label-ioma">Closed</div>
          </div>
        </div>

        <div className="stat-card-ioma stat-departments-ioma">
          <div className="stat-icon-ioma">
            <i className="bi bi-building"></i>
          </div>
          <div className="stat-content-ioma">
            <div className="stat-value-ioma">{stats.departmentsCount}</div>
            <div className="stat-label-ioma">Departments</div>
          </div>
        </div>
      </div>

      {/* CONTROLS BAR */}
      <div className="ioma-controls">
        <div className="ioma-search-input">
          <div className="ioma-search-inner">
            <span className="ioma-search-icon">
              <FaSearch />
            </span>
            <Form.Control
              type="text"
              placeholder="Search opportunities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              className="ioma-search-field"
            />
            <button
              type="button"
              className="ioma-search-btn"
              onClick={handleSearch}
            >
              Search
            </button>
          </div>
        </div>

        <div className="ioma-status-filter">
          <StatusDropdown
            value={selectedStatus}
            onChange={(val) => {
              setSelectedStatus(val);
              setCurrentPage(1);
            }}
          />
        </div>

        <button className="ioma-btn-clear" onClick={clearFilters}>
          Clear Filters
        </button>

        <div className="ioma-results-count">
          Showing {filteredOpportunities.length}{" "}
          {filteredOpportunities.length === 1 ? "opportunity" : "opportunities"}
        </div>

        {/* ONLY HR CAN CREATE */}
        {isHR && (
          <button className="ioma-btn-create" onClick={handleCreateOpportunity}>
            <i className="bi bi-plus-circle"></i>
            Create Opportunity
          </button>
        )}
      </div>

      {/* TABLE */}
      <div className="ioma-table-card">
        <div className="ioma-table-wrapper">
          <table className="ioma-table">
            <thead>
              <tr>
                <th>Opportunity Name</th>
                <th>Department</th>
                <th>Description</th>
                <th>Requirements</th>
                <th>Deadline</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="ioma-empty-state">
                    <div className="ioma-empty-content">
                      <i className="bi bi-inbox"></i>
                      <h4>No opportunities found</h4>
                      <p>Try adjusting your search or filter criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentItems.map((opportunity) => {
                  const isClosed = opportunity.status?.toLowerCase() === "closed";
                  
                  return (
                    <tr key={opportunity.opportunityId}>
                      <td>
                        <strong>{opportunity.opportunityName}</strong>
                      </td>
                      <td>
                        <span className="ioma-department-badge">
                          {opportunity.departmentName || "N/A"}
                        </span>
                      </td>
                      <td className="ioma-opp-desc">
                        {opportunity.description?.substring(0, 80)}
                        {opportunity.description?.length > 80 && "..."}
                      </td>
                      <td className="ioma-opp-req">
                        {opportunity.requirements?.substring(0, 60)}
                        {opportunity.requirements?.length > 60 && "..."}
                      </td>
                      <td>{formatDate(opportunity.deadline)}</td>
                      <td>
                        <span className={getStatusBadgeClass(opportunity.status)}>
                          {opportunity.status}
                        </span>
                      </td>
                      <td>
                        <div className="ioma-table-actions">
                          {/* HR: Edit & Delete */}
                          {isHR && (
                            <>
                              <button
                                className="ioma-action-edit"
                                onClick={() => handleEditOpportunity(opportunity)}
                                title="Edit Opportunity"
                              >
                                <i className="bi bi-pencil-square"></i>
                              </button>
                              <button
                                className="ioma-action-delete"
                                onClick={() => handleDeleteOpportunity(opportunity)}
                                title="Delete Opportunity"
                              >
                                <i className="bi bi-trash3"></i>
                              </button>
                            </>
                          )}

                          {/* EMPLOYEE: Self Nominate (disabled if closed) */}
                          {isEmployee && (
                            <button
                              className="ioma-action-nominate"
                              onClick={() => !isClosed && handleSelfNominate(opportunity)}
                              title={isClosed ? "Opportunity Closed" : "Self Nominate"}
                              disabled={isClosed}
                              style={{ opacity: isClosed ? 0.5 : 1, cursor: isClosed ? 'not-allowed' : 'pointer' }}
                            >
                              <i className="bi bi-hand-thumbs-up"></i>
                            </button>
                          )}

                          {/* MANAGER: Self Nominate & Nominate Team Members (disabled if closed) */}
                          {isManager && (
                            <>
                              <button
                                className="ioma-action-nominate"
                                onClick={() => !isClosed && handleSelfNominate(opportunity)}
                                title={isClosed ? "Opportunity Closed" : "Self Nominate"}
                                disabled={isClosed}
                                style={{ opacity: isClosed ? 0.5 : 1, cursor: isClosed ? 'not-allowed' : 'pointer' }}
                              >
                                <i className="bi bi-hand-thumbs-up"></i>
                              </button>
                              <button
                                className="ioma-action-nominate-team"
                                onClick={() => !isClosed && handleManagerNominate(opportunity)}
                                title={isClosed ? "Opportunity Closed" : "Nominate Team Member"}
                                disabled={isClosed}
                                style={{ opacity: isClosed ? 0.5 : 1, cursor: isClosed ? 'not-allowed' : 'pointer' }}
                              >
                                <i className="bi bi-person-plus"></i>
                              </button>
                            </>
                          )}

                          {/* View Details for all */}
                          <button
                            className="ioma-action-view"
                            onClick={() => handleViewOpportunity(opportunity)}
                            title="View Details"
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredOpportunities.length > 0 && (
          <div className="ioma-pagination-container">
            <div className="ioma-pagination-info">
              <span className="ioma-pagination-label">Show</span>
              <div ref={itemsDropdownRef} className="ioma-items-dropdown-wrapper">
                <button
                  type="button"
                  onClick={() => setShowItemsDropdown(!showItemsDropdown)}
                  className="ioma-items-button"
                >
                  <span>{itemsPerPage}</span>
                  <i
                    className={`bi bi-chevron-${showItemsDropdown ? "up" : "down"} ioma-items-chevron`}
                  ></i>
                </button>
                {showItemsDropdown && (
                  <div className="ioma-items-dropdown">
                    {[5, 10, 25, 50].map((size) => (
                      <div
                        key={size}
                        onClick={() => {
                          setItemsPerPage(size);
                          setCurrentPage(1);
                          setShowItemsDropdown(false);
                        }}
                        className={`ioma-items-option ${
                          itemsPerPage === size ? "ioma-items-active" : ""
                        }`}
                      >
                        {size}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <span className="ioma-pagination-label">entries</span>
            </div>

            <div className="ioma-pagination-status">
              Showing {indexOfFirstItem + 1} to{" "}
              {Math.min(indexOfLastItem, filteredOpportunities.length)} of{" "}
              {filteredOpportunities.length} entries
            </div>

            <nav className="ioma-pagination-nav">
              <ul className="ioma-pagination">
                <li
                  className={`ioma-page-item ${
                    currentPage === 1 ? "disabled" : ""
                  }`}
                >
                  <button
                    className="ioma-page-link"
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
                    className={`ioma-page-item ${
                      page === currentPage ? "active" : ""
                    } ${typeof page !== "number" ? "disabled" : ""}`}
                  >
                    <button
                      className="ioma-page-link"
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
                  className={`ioma-page-item ${
                    currentPage === totalPages ? "disabled" : ""
                  }`}
                >
                  <button
                    className="ioma-page-link"
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
