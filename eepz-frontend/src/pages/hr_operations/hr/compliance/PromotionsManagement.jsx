import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import careerProgressionService from "../../../../services/hr_operations/hr/careerProgressionService.js";
import CreatePromotionModal from "../../../../components/hr_operations/modals/CreatePromotionModal.jsx";
import FairnessCheckModal from "../../../../components/hr_operations/modals/FairnessCheckModal.jsx";
import ApproveRejectModal from "../../../../components/hr_operations/modals/ApproveRejectModal.jsx.jsx";
import PayrollUpdateModal from "../../../../components/hr_operations/modals/PayrollUpdateModal.jsx";
import SubmitToLeadershipModal from "../../../../components/hr_operations/modals/SubmitToLeadershipModal.jsx";
import PromotionDetailsModal from "../../../../components/hr_operations/modals/PromotionDetailsModal.jsx";
import "../../../../styles/hr_operations/hr/promotionsManagement.css";

const PromotionsManagement = () => {
  const [promotions, setPromotions] = useState([]);
  const [filteredPromotions, setFilteredPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View & Pagination States
  const [viewType, setViewType] = useState("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter States
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    department: "",
    role: "",
  });

  // Filter Options
  const [filterOptions, setFilterOptions] = useState({
    statuses: [],
    departments: [],
    roles: [],
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFairnessModal, setShowFairnessModal] = useState(false);
  const [showApproveRejectModal, setShowApproveRejectModal] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [showSubmitLeadershipModal, setShowSubmitLeadershipModal] =
    useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [payrollData, setPayrollData] = useState(null);

  const currentUserId = parseInt(localStorage.getItem("userId"));
  const userRole = localStorage.getItem("userRole");
  const isManager = userRole === "Manager";
  const isDeptHead = userRole === "Department Head";
  const isHR = userRole === "HR";
  const isLeadership = userRole === "Leadership";

  useEffect(() => {
    fetchPromotions();
  }, []);

  useEffect(() => {
    applyFilters();
    setCurrentPage(1);
  }, [promotions, filters]);

  const fetchPromotions = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching promotions...");
      const response = await careerProgressionService.getAllPromotions();
      const data = Array.isArray(response) ? response : [];
      setPromotions(data);
      setFilteredPromotions(data);
      generateFilterOptions(data);
    } catch (err) {
      console.error("Error fetching promotions:", err);
      setError(err.message || "Failed to fetch promotions");
      showToast("Error", err.message || "Failed to fetch promotions", "danger");
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  };

  const generateFilterOptions = (data) => {
    const statuses = [
      ...new Set(data.map((p) => p.status).filter(Boolean)),
    ].sort();
    const departments = [
      ...new Set(data.map((p) => p.departmentName).filter(Boolean)),
    ].sort();
    const roles = [
      ...new Set(data.map((p) => p.newRole).filter(Boolean)),
    ].sort();

    setFilterOptions({
      statuses,
      departments,
      roles,
    });
  };

  const applyFilters = () => {
    let filtered = promotions;

    // Search filter
    if (filters.search.trim()) {
      const query = filters.search.toLowerCase();
      filtered = filtered.filter((p) => {
        const email = (p.employeeEmail || "").toLowerCase();
        const name = (p.employeeName || "").toLowerCase();
        const oldRole = (p.oldRole || "").toLowerCase();
        const newRole = (p.newRole || "").toLowerCase();
        const dept = (p.departmentName || "").toLowerCase();
        return (
          email.includes(query) ||
          name.includes(query) ||
          oldRole.includes(query) ||
          newRole.includes(query) ||
          dept.includes(query)
        );
      });
    }

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter((p) => p.status === filters.status);
    }

    // Department filter
    if (filters.department) {
      filtered = filtered.filter(
        (p) => p.departmentName === filters.department
      );
    }

    // Role filter
    if (filters.role) {
      filtered = filtered.filter((p) => p.newRole === filters.role);
    }

    setFilteredPromotions(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearchChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      search: e.target.value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      status: "all",
      department: "",
      role: "",
    });
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // PAGINATION LOGIC
  const totalPages = Math.ceil(filteredPromotions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageData = filteredPromotions.slice(startIndex, endIndex);

  const handleCreatePromotion = () => {
    setShowCreateModal(true);
  };

  const handlePromotionCreated = () => {
    setShowCreateModal(false);
    fetchPromotions();
    showToast("Success", "Promotion proposal created successfully", "success");
  };

  const handleViewDetails = (promotion) => {
    setSelectedPromotion(promotion);
    setShowDetailsModal(true);
  };

  const handleCheckFairness = (promotion) => {
    setSelectedPromotion(promotion);
    setShowFairnessModal(true);
  };

  const handleFairnessReviewed = () => {
    setShowFairnessModal(false);
    setTimeout(() => {
      setShowApproveRejectModal(true);
    }, 300);
  };

  const handleApproveRejectClick = (promotion) => {
    setSelectedPromotion(promotion);
    setShowApproveRejectModal(true);
  };

  const handlePromotionApprovedRejected = () => {
    setShowApproveRejectModal(false);
    setSelectedPromotion(null);
    fetchPromotions();
    showToast("Success", "Promotion decision recorded successfully", "success");
  };

  const handleUpdatePayrollClick = (promotion) => {
    setSelectedPromotion(promotion);
    setShowPayrollModal(true);
  };

  const handlePayrollUpdated = (updatedPayroll) => {
    setPayrollData(updatedPayroll);
    setShowPayrollModal(false);
    showToast("Success", "Payroll updated successfully", "success");
    setTimeout(() => {
      fetchPromotions();
    }, 500);
  };

  const handleSubmitToLeadershipClick = (promotion) => {
    setSelectedPromotion(promotion);
    const payroll = {
      newSalary: promotion.newSalary,
      oldSalary: promotion.oldSalary,
      incrementPercentage: promotion.incrementPercentage,
      effectiveDate: promotion.promotionDate,
    };
    setPayrollData(payroll);
    setShowSubmitLeadershipModal(true);
  };

  const handleSubmittedToLeadership = () => {
    setShowSubmitLeadershipModal(false);
    setSelectedPromotion(null);
    setPayrollData(null);
    fetchPromotions();
    showToast("Success", "Promotion submitted to Leadership", "success");
  };

  const showToast = (title, message, type) => {
    const fullMessage = `${title}: ${message}`;

    switch (type) {
      case "success":
        toast.success(fullMessage);
        break;
      case "danger":
      case "error":
        toast.error(fullMessage);
        break;
      case "warning":
        toast.warning(fullMessage);
        break;
      case "info":
        toast.info(fullMessage);
        break;
      default:
        toast(fullMessage);
    }
  };

  const getStatusBadgeStyle = (status) => {
    const statusStyles = {
      Approved: { background: "#dcfce7", color: "#166534" },
      Pending: { background: "#fef3c7", color: "#92400e" },
      Rejected: { background: "#fee2e2", color: "#991b1b" },
      "Submitted to Leadership": { background: "#dbeafe", color: "#1e40af" },
    };
    return statusStyles[status] || { background: "#e5e7eb", color: "#374151" };
  };

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return "Not Set";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getInitials = (name) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getEmployeeDisplay = (promotion) => {
    return promotion.employeeName || promotion.employeeEmail || "Unknown";
  };

  return (
    <div className="promo-root">
      {error && (
        <div className="alert alert-danger promo-alert" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}

      {/* FILTER BAR WITH TOGGLES */}
      <div className="promo-filters-container">
        <div className="filters-header">
          <h5 className="filters-title">
            <i className="bi bi-funnel"></i>
            Filters
          </h5>
          <div className="filters-right-section">
            {/* VIEW TOGGLE BUTTONS */}
            <div className="promo-view-toggle">
              <button
                className={`toggle-btn ${viewType === "card" ? "active" : ""}`}
                onClick={() => setViewType("card")}
                title="Card View"
              >
                <i className="bi bi-grid-3x2-gap"></i>
              </button>
              <button
                className={`toggle-btn ${viewType === "table" ? "active" : ""}`}
                onClick={() => setViewType("table")}
                title="Table View"
              >
                <i className="bi bi-list-ul"></i>
              </button>
            </div>

            {/* CLEAR BUTTON */}
            <button
              className="btn-clear-filters"
              onClick={clearFilters}
              title="Clear all filters"
            >
              <i className="bi bi-x-circle"></i> Clear
            </button>
          </div>
        </div>

        <div className="filters-grid">
          {/* SEARCH */}
          <div className="filter-group">
            <label className="filter-label">Search</label>
            <div className="search-wrapper">
              <i className="bi bi-search"></i>
              <input
                type="text"
                name="search"
                placeholder="Search by name, email, role..."
                value={filters.search}
                onChange={handleSearchChange}
                className="filter-search"
              />
            </div>
          </div>

          {/* STATUS FILTER */}
          <div className="filter-group">
            <label className="filter-label">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="all">All Status</option>
              {filterOptions.statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* DEPARTMENT FILTER */}
          <div className="filter-group">
            <label className="filter-label">Department</label>
            <select
              name="department"
              value={filters.department}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Departments</option>
              {filterOptions.departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* NEW ROLE FILTER */}
          <div className="filter-group">
            <label className="filter-label">New Role</label>
            <select
              name="role"
              value={filters.role}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Roles</option>
              {filterOptions.roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="promo-loading-container">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading promotions...</p>
        </div>
      ) : filteredPromotions.length === 0 ? (
        <div className="promo-table-empty">
          <i className="bi bi-inbox"></i>
          <p>
            {filters.search ||
            filters.status !== "all" ||
            filters.department ||
            filters.role
              ? "No promotions found matching your filters"
              : "No promotions found"}
          </p>
          {isManager &&
            !filters.search &&
            filters.status === "all" &&
            !filters.department &&
            !filters.role && (
              <button
                className="promo-btn-add-small"
                onClick={handleCreatePromotion}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Create First Promotion
              </button>
            )}
        </div>
      ) : viewType === "card" ? (
        <>
          {/* CARD VIEW */}
          <div className="promo-cards-grid">
            {currentPageData.map((promotion) => {
              const increment =
                (promotion.newSalary || 0) - (promotion.oldSalary || 0);
              const incrementPercent =
                promotion.oldSalary > 0
                  ? ((increment / promotion.oldSalary) * 100).toFixed(2)
                  : 0;
              const statusStyle = getStatusBadgeStyle(promotion.status);
              const employeeDisplay = getEmployeeDisplay(promotion);

              return (
                <div key={promotion.promotionId} className="promo-card">
                  {/* CARD HEADER */}
                  <div className="promo-card-header">
                    <div className="promo-card-avatar">
                      {getInitials(employeeDisplay)}
                    </div>
                    <div className="promo-card-header-info">
                      <h5 className="promo-card-title">{employeeDisplay}</h5>
                      <p className="promo-card-subtitle">
                        {promotion.departmentName || "—"}
                      </p>
                    </div>
                  </div>

                  {/* CARD BODY */}
                  <div className="promo-card-body">
                    <div className="promo-card-row">
                      <span className="promo-card-label">Current Role</span>
                      <span className="promo-card-value">
                        {promotion.oldRole || "—"}
                      </span>
                    </div>

                    <div className="promo-card-row">
                      <span className="promo-card-label">New Role</span>
                      <span className="promo-card-value promo-new-role">
                        {promotion.newRole || "—"}
                      </span>
                    </div>

                    <div className="promo-card-row">
                      <span className="promo-card-label">Old Salary</span>
                      <span className="promo-card-value">
                        {formatCurrency(promotion.oldSalary)}
                      </span>
                    </div>

                    <div className="promo-card-row">
                      <span className="promo-card-label">New Salary</span>
                      <span className="promo-card-value promo-new-salary">
                        {formatCurrency(promotion.newSalary)}
                      </span>
                    </div>

                    <div className="promo-card-row">
                      <span className="promo-card-label">Increment</span>
                      <span
                        className="promo-card-value"
                        style={{
                          color: incrementPercent > 0 ? "#10b981" : "#ef4444",
                        }}
                      >
                        {incrementPercent > 0 ? "+" : ""}
                        {incrementPercent}%
                      </span>
                    </div>

                    <div className="promo-card-row">
                      <span className="promo-card-label">Status</span>
                      <span className="promo-status-badge" style={statusStyle}>
                        {promotion.status || "Unknown"}
                      </span>
                    </div>
                  </div>

                  {/* CARD ACTIONS */}
                  <div className="promo-card-actions">
                    <button
                      className="promo-btn-card-action"
                      onClick={() => handleViewDetails(promotion)}
                      style={{ background: "#3b82f6", color: "#fff" }}
                      title="View Details"
                    >
                      <i className="bi bi-eye"></i>
                      <span>View</span>
                    </button>

                    {isDeptHead && promotion.status === "Pending" && (
                      <>
                        <button
                          className="promo-btn-card-action"
                          onClick={() => handleCheckFairness(promotion)}
                          style={{ background: "#8b5cf6", color: "#fff" }}
                          title="Check Fairness"
                        >
                          <i className="bi bi-shield-check"></i>
                          <span>Fairness</span>
                        </button>
                        <button
                          className="promo-btn-card-action"
                          onClick={() => handleApproveRejectClick(promotion)}
                          style={{ background: "#10b981", color: "#fff" }}
                          title="Approve/Reject"
                        >
                          <i className="bi bi-check-circle"></i>
                          <span>Decide</span>
                        </button>
                      </>
                    )}

                    {isHR && promotion.status === "Approved" && (
                      <>
                        <button
                          className="promo-btn-card-action"
                          onClick={() => handleUpdatePayrollClick(promotion)}
                          style={{ background: "#f59e0b", color: "#fff" }}
                          title="Update Payroll"
                        >
                          <i className="bi bi-cash-coin"></i>
                          <span>Payroll</span>
                        </button>
                        {promotion.newSalary > 0 && (
                          <button
                            className="promo-btn-card-action"
                            onClick={() =>
                              handleSubmitToLeadershipClick(promotion)
                            }
                            style={{ background: "#06b6d4", color: "#fff" }}
                            title="Submit to Leadership"
                          >
                            <i className="bi bi-send"></i>
                            <span>Submit</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* PAGINATION */}
          <div className="pagination-container">
            <div className="pagination-left">
              <label className="pagination-label">Records per page:</label>
              <select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="pagination-select"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </div>

            <div className="pagination-center">
              <span className="pagination-info">
                Page {currentPage} of {totalPages} | Showing{" "}
                {Math.min(startIndex + 1, filteredPromotions.length)}-
                {Math.min(endIndex, filteredPromotions.length)} of{" "}
                {filteredPromotions.length}
              </span>
            </div>

            <div className="pagination-right">
              <button
                className="pagination-btn"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <i className="bi bi-chevron-left"></i> Prev
              </button>

              <div className="pagination-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .slice(
                    Math.max(0, currentPage - 2),
                    Math.min(totalPages, currentPage + 1)
                  )
                  .map((page) => (
                    <button
                      key={page}
                      className={`pagination-number ${
                        currentPage === page ? "active" : ""
                      }`}
                      onClick={() => goToPage(page)}
                    >
                      {page}
                    </button>
                  ))}
              </div>

              <button
                className="pagination-btn"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* TABLE VIEW */}
          <div className="promo-table-container">
            <table className="promo-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Current Role</th>
                  <th>New Role</th>
                  {isHR && <th>Salary Change</th>}
                  <th>Effective Date</th>
                  <th>Status</th>
                  <th className="promo-table-actions-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentPageData.map((promotion) => {
                  const increment =
                    (promotion.newSalary || 0) - (promotion.oldSalary || 0);
                  const incrementPercent =
                    promotion.oldSalary > 0
                      ? ((increment / promotion.oldSalary) * 100).toFixed(2)
                      : 0;
                  const statusStyle = getStatusBadgeStyle(promotion.status);
                  const employeeDisplay = getEmployeeDisplay(promotion);

                  return (
                    <tr key={promotion.promotionId}>
                      <td>
                        <div className="promo-employee-cell">
                          {employeeDisplay}
                        </div>
                      </td>
                      <td>{promotion.departmentName || "—"}</td>
                      <td>{promotion.oldRole || "—"}</td>
                      <td>
                        <strong className="promo-new-role">
                          {promotion.newRole || "—"}
                        </strong>
                      </td>
                      {isHR && (
                        <td>
                          <div className="promo-salary-change">
                            <div>{formatCurrency(promotion.oldSalary)}</div>
                            <i className="bi bi-arrow-right"></i>
                            <div className="promo-new-salary">
                              {formatCurrency(promotion.newSalary)}
                            </div>
                            {promotion.incrementPercentage &&
                              promotion.incrementPercentage > 0 && (
                                <span className="promo-increment-badge">
                                  +{promotion.incrementPercentage}%
                                </span>
                              )}
                          </div>
                        </td>
                      )}
                      <td>{formatDate(promotion.promotionDate)}</td>
                      <td>
                        <span
                          className="promo-status-badge"
                          style={statusStyle}
                        >
                          {promotion.status || "Unknown"}
                        </span>
                      </td>
                      <td>
                        <div className="promo-table-actions">
                          <button
                            className="promo-btn-icon promo-btn-view"
                            onClick={() => handleViewDetails(promotion)}
                            title="View Details"
                          >
                            <i className="bi bi-eye"></i>
                          </button>

                          {isDeptHead && promotion.status === "Pending" && (
                            <>
                              <button
                                className="promo-btn-icon"
                                onClick={() => handleCheckFairness(promotion)}
                                title="Check Fairness"
                                style={{ background: "#8b5cf6", color: "#fff" }}
                              >
                                <i className="bi bi-shield-check"></i>
                              </button>
                              <button
                                className="promo-btn-icon promo-btn-approve"
                                onClick={() =>
                                  handleApproveRejectClick(promotion)
                                }
                                title="Approve/Reject"
                              >
                                <i className="bi bi-check-circle"></i>
                              </button>
                            </>
                          )}

                          {isHR && promotion.status === "Approved" && (
                            <>
                              <button
                                className="promo-btn-icon"
                                onClick={() =>
                                  handleUpdatePayrollClick(promotion)
                                }
                                title="Update Payroll"
                                style={{ background: "#f59e0b", color: "#fff" }}
                              >
                                <i className="bi bi-cash-coin"></i>
                              </button>
                              {promotion.newSalary > 0 && (
                                <button
                                  className="promo-btn-icon"
                                  onClick={() =>
                                    handleSubmitToLeadershipClick(promotion)
                                  }
                                  title="Submit to Leadership"
                                  style={{
                                    background: "#06b6d4",
                                    color: "#fff",
                                  }}
                                >
                                  <i className="bi bi-send"></i>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="pagination-container">
            <div className="pagination-left">
              <label className="pagination-label">Records per page:</label>
              <select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="pagination-select"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </div>

            <div className="pagination-center">
              <span className="pagination-info">
                Page {currentPage} of {totalPages} | Showing{" "}
                {Math.min(startIndex + 1, filteredPromotions.length)}-
                {Math.min(endIndex, filteredPromotions.length)} of{" "}
                {filteredPromotions.length}
              </span>
            </div>

            <div className="pagination-right">
              <button
                className="pagination-btn"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <i className="bi bi-chevron-left"></i> Prev
              </button>

              <div className="pagination-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .slice(
                    Math.max(0, currentPage - 2),
                    Math.min(totalPages, currentPage + 1)
                  )
                  .map((page) => (
                    <button
                      key={page}
                      className={`pagination-number ${
                        currentPage === page ? "active" : ""
                      }`}
                      onClick={() => goToPage(page)}
                    >
                      {page}
                    </button>
                  ))}
              </div>

              <button
                className="pagination-btn"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>
        </>
      )}

      {/* MODALS */}
      {showCreateModal && (
        <CreatePromotionModal
          show={showCreateModal}
          onHide={() => setShowCreateModal(false)}
          onPromotionCreated={handlePromotionCreated}
        />
      )}

      {showFairnessModal && selectedPromotion && (
        <FairnessCheckModal
          show={showFairnessModal}
          promotion={selectedPromotion}
          onHide={() => {
            setShowFairnessModal(false);
            setSelectedPromotion(null);
          }}
          onFairnessReviewed={handleFairnessReviewed}
        />
      )}

      {showApproveRejectModal && selectedPromotion && (
        <ApproveRejectModal
          show={showApproveRejectModal}
          promotion={selectedPromotion}
          onHide={() => {
            setShowApproveRejectModal(false);
            setSelectedPromotion(null);
          }}
          onPromotionApproved={handlePromotionApprovedRejected}
        />
      )}

      {showPayrollModal && selectedPromotion && (
        <PayrollUpdateModal
          show={showPayrollModal}
          promotion={selectedPromotion}
          onHide={() => {
            setShowPayrollModal(false);
            setSelectedPromotion(null);
          }}
          onPayrollUpdated={handlePayrollUpdated}
        />
      )}

      {showSubmitLeadershipModal && selectedPromotion && (
        <SubmitToLeadershipModal
          show={showSubmitLeadershipModal}
          nomination={selectedPromotion}
          payrollData={payrollData}
          onHide={() => {
            setShowSubmitLeadershipModal(false);
            setSelectedPromotion(null);
            setPayrollData(null);
          }}
          onSubmitted={handleSubmittedToLeadership}
        />
      )}

      {showDetailsModal && selectedPromotion && (
        <PromotionDetailsModal
          show={showDetailsModal}
          promotion={selectedPromotion}
          onHide={() => {
            setShowDetailsModal(false);
            setSelectedPromotion(null);
          }}
        />
      )}

      {/* BLUR BACKDROP */}
      <div
        className="promo-blur-backdrop"
        style={{
          display:
            showCreateModal ||
            showFairnessModal ||
            showApproveRejectModal ||
            showPayrollModal ||
            showSubmitLeadershipModal ||
            showDetailsModal
              ? "block"
              : "none",
        }}
      ></div>
    </div>
  );
};

export default PromotionsManagement;
