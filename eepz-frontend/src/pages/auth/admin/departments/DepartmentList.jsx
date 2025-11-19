/**
 * DepartmentList Component
 *
 * Main component for department management in the admin dashboard.
 * Features:
 * - View departments in Grid or Table layout
 * - Search and filter departments
 * - Create, Edit, and Delete department operations
 * - Statistics dashboard showing department counts
 * - Pagination for table view
 * - Toast notifications using Sonner for user feedback
 *
 * @component
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import departmentService from "../../../../services/auth/departmentService";
import AddDepartmentModal from "../../../../components/auth/Modal/departments/AddDepartmentModal";
import EditDepartmentModal from "../../../../components/auth/Modal/departments/EditDepartmentModal";
import DeleteDepartmentModal from "../../../../components/auth/Modal/departments/DeleteDepartmentModal";
import { toast } from "sonner";
import "../../../../styles/auth/department/DepartmentList.css";

const DepartmentList = () => {
  // ========================
  // HOOKS & NAVIGATION
  // ========================
  const navigate = useNavigate();

  // ========================
  // STATE MANAGEMENT
  // ========================

  /**
   * Data States
   * - departments: Array of all departments fetched from backend
   * - loading: Loading state for initial data fetch
   */
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  /**
   * Modal States
   * - showAddModal: Controls Add Department modal visibility
   * - showEditModal: Controls Edit Department modal visibility
   * - showDeleteModal: Controls Delete Department modal visibility
   * - selectedDepartment: Currently selected department for edit/delete operations
   */
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  /**
   * Filter & View States
   * - searchTerm: Text search across department fields
   * - viewMode: Current view mode (grid or table)
   */
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // grid or table

  /**
   * Pagination States (for table view)
   * - currentPage: Current active page number
   * - itemsPerPage: Number of items to display per page
   */
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // ========================
  // EFFECTS
  // ========================

  /**
   * Effect: Fetch Departments on Component Mount
   * Loads all departments when component first renders
   */
  useEffect(() => {
    fetchDepartments();
  }, []);

  // ========================
  // API FUNCTIONS
  // ========================

  /**
   * Fetches all departments from backend
   * Shows Sonner toast notifications for user feedback
   * Updates departments state with fetched data
   */
  const fetchDepartments = async () => {
    try {
      setLoading(true);

      // Show loading toast
      toast.loading("Loading departments...");

      // -------- API Call --------
      const response = await departmentService.getAllDepartments();

      // -------- Handle Success Response --------
      if (response.success) {
        setDepartments(response.data || []);
        toast.dismiss();
        toast.success(
          `Loaded ${response.data?.length || 0} departments successfully`
        );
      } else {
        // -------- Handle Failure Response --------
        toast.dismiss();
        toast.error(response.message || "Failed to load departments");
      }
    } catch (error) {
      // -------- Handle Exception --------
      console.error("Error loading departments:", error);
      toast.dismiss();
      toast.error(error.message || "Error loading departments");
    } finally {
      setLoading(false);
    }
  };

  // ========================
  // DELETE HANDLERS
  // ========================

  /**
   * Handles delete button click
   * Opens delete confirmation modal
   *
   * @param {Object} dept - Department object to be deleted
   */
  const handleDelete = (dept) => {
    setSelectedDepartment(dept);
    setShowDeleteModal(true);
  };

  /**
   * Handles delete confirmation
   * Makes API call to delete the department
   * Shows success/error notifications using Sonner toast
   * Refreshes department list after successful deletion
   */
  const handleDeleteConfirm = async () => {
    try {
      // Show loading toast
      toast.loading("Deleting department...");

      // -------- API Call --------
      const response = await departmentService.deleteDepartment(
        selectedDepartment.departmentId
      );

      // -------- Handle Success Response --------
      if (response.success) {
        toast.dismiss();
        toast.success("Department deleted successfully");

        // Close modal and reset selected department
        setShowDeleteModal(false);
        setSelectedDepartment(null);

        // Refresh departments list
        fetchDepartments();
      } else {
        // -------- Handle Failure Response --------
        toast.dismiss();
        toast.error(response.message || "Failed to delete department");
      }
    } catch (error) {
      // -------- Handle Exception --------
      console.error("Error deleting department:", error);
      toast.dismiss();
      toast.error(error.message || "Error deleting department");
    }
  };

  // ========================
  // EDIT HANDLER
  // ========================

  /**
   * Handles edit button click
   * Opens edit modal with selected department data
   *
   * @param {Object} department - Department object to be edited
   */
  const handleEdit = (department) => {
    setSelectedDepartment(department);
    setShowEditModal(true);
  };

  // ========================
  // FILTER FUNCTIONS
  // ========================

  /**
   * Filters departments based on search term
   * Searches across: departmentName and description
   * Returns filtered array of departments
   *
   * @returns {Array} Filtered departments array
   */
  const filteredDepartments = departments.filter(
    (dept) =>
      dept.departmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ========================
  // PAGINATION CALCULATIONS
  // ========================

  /**
   * Calculates pagination indices and data
   * Only applicable for table view
   */
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredDepartments.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage);

  // ========================
  // UI HELPER FUNCTIONS
  // ========================

  /**
   * Formats ISO date string to readable format
   *
   * @param {string} date - ISO date string
   * @returns {string} Formatted date string (e.g., "12 Jan 2024")
   */
  const formatDate = (date) => {
    return date
      ? new Date(date).toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "N/A";
  };

  /**
   * Returns appropriate Bootstrap icon class for department
   * Maps department names to specific icons
   *
   * @param {string} name - Name of the department
   * @returns {string} Bootstrap icon class name
   */
  const getDepartmentIcon = (name) => {
    const iconMap = {
      IT: "bi-laptop",
      HR: "bi-people",
      Finance: "bi-cash-coin",
      Marketing: "bi-megaphone",
      Sales: "bi-graph-up-arrow",
      Operations: "bi-gear",
      Engineering: "bi-tools",
      Support: "bi-headset",
    };

    for (const [key, icon] of Object.entries(iconMap)) {
      if (name?.toLowerCase().includes(key.toLowerCase())) {
        return icon;
      }
    }
    return "bi-building";
  };

  /**
   * Calculates statistics for department data
   * Returns count of total departments
   *
   * @returns {Object} Statistics object with department count
   */
  const getDepartmentStats = () => {
    const totalDepartments = filteredDepartments.length;
    return { totalDepartments };
  };

  const stats = getDepartmentStats();

  // ========================
  // LOADING STATE
  // ========================

  /**
   * Shows loading spinner while initial data is being fetched
   */
  if (loading) {
    return (
      <div className="loading-container-dept">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // ========================
  // MAIN RENDER
  // ========================

  return (
    <div className="department-management-page">
      {/* ======================== */}
      {/* BREADCRUMB NAVIGATION */}
      {/* ======================== */}
      <nav className="breadcrumb-nav-dept" aria-label="breadcrumb">
        <ol className="breadcrumb-dept">
          {/* Dashboard Link - Clickable */}
          <li
            className="breadcrumb-item-dept clickable"
            onClick={() => navigate("/admin/dashboard")}
          >
            <i className="bi bi-house-door"></i>
            <span>Dashboard</span>
          </li>
          {/* Current Page - Not Clickable */}
          <li className="breadcrumb-item-dept active" aria-current="page">
            Department Management
          </li>
        </ol>
      </nav>

      {/* ======================== */}
      {/* PAGE HEADER */}
      {/* ======================== */}
      <div className="page-header-dept">
        <div className="header-text-dept">
          <h2 className="page-title-dept">Department Management</h2>
          <p className="page-subtitle-dept">
            Manage organizational departments
          </p>
        </div>
        {/* Create Department Button */}
        <button
          className="btn-create-dept"
          onClick={() => setShowAddModal(true)}
        >
          <i className="bi bi-plus-circle"></i>
          Create Department
        </button>
      </div>

      {/* ======================== */}
      {/* STATISTICS CARDS */}
      {/* ======================== */}
      <div className="stats-cards-dept">
        {/* Total Departments Card */}
        <div className="stat-card-dept stat-total-dept">
          <div className="stat-icon-dept">
            <i className="bi bi-building-fill"></i>
          </div>
          <div className="stat-content-dept">
            <div className="stat-value-dept">{stats.totalDepartments}</div>
            <div className="stat-label-dept">Total Departments</div>
          </div>
        </div>

        {/* Active Departments Card */}
        <div className="stat-card-dept stat-active-dept">
          <div className="stat-icon-dept">
            <i className="bi bi-check-circle-fill"></i>
          </div>
          <div className="stat-content-dept">
            <div className="stat-value-dept">{departments.length}</div>
            <div className="stat-label-dept">Active</div>
          </div>
        </div>
      </div>

      {/* ======================== */}
      {/* CONTROLS BAR */}
      {/* ======================== */}
      <div className="controls-bar-dept">
        {/* -------- Search Section -------- */}
        <div className="search-section-dept">
          <div className="search-input-wrapper-dept">
            <i className="bi bi-search"></i>
            <input
              type="text"
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {/* Clear Search Button - Only visible when search term exists */}
            {searchTerm && (
              <button
                className="clear-search-dept"
                onClick={() => setSearchTerm("")}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            )}
          </div>
        </div>

        {/* -------- View Switcher -------- */}
        {/* Toggle between Grid and Table views */}
        <div className="view-switcher-dept">
          <button
            className={`view-btn-dept ${viewMode === "grid" ? "active" : ""}`}
            onClick={() => setViewMode("grid")}
            title="Grid View"
          >
            <i className="bi bi-grid-3x3-gap-fill"></i>
          </button>
          <button
            className={`view-btn-dept ${viewMode === "table" ? "active" : ""}`}
            onClick={() => setViewMode("table")}
            title="Table View"
          >
            <i className="bi bi-table"></i>
          </button>
        </div>
      </div>

      {/* ======================== */}
      {/* CONTENT VIEWS */}
      {/* ======================== */}

      {/* -------- Empty State -------- */}
      {/* Shown when no departments match the search/filter criteria */}
      {filteredDepartments.length === 0 ? (
        <div className="empty-state-dept">
          <div className="empty-icon-dept">
            <i className="bi bi-inbox"></i>
          </div>
          <h4>No departments found</h4>
          <p>Adjust your search or create a new department</p>
        </div>
      ) : (
        <>
          {/* ======================== */}
          {/* GRID VIEW */}
          {/* ======================== */}
          {viewMode === "grid" && (
            <div className="departments-grid-dept">
              {filteredDepartments.map((dept) => (
                <div key={dept.departmentId} className="department-card-item">
                  {/* -------- Card Header -------- */}
                  <div className="card-header-dept">
                    {/* Department Icon Badge */}
                    <div className="dept-icon-badge">
                      <i
                        className={`bi ${getDepartmentIcon(
                          dept.departmentName
                        )}`}
                      ></i>
                    </div>
                  </div>

                  {/* -------- Card Body -------- */}
                  <div className="card-body-dept">
                    <h3 className="dept-name-text">{dept.departmentName}</h3>
                    <p className="dept-description-text">
                      {dept.description || "No description available"}
                    </p>
                  </div>

                  {/* -------- Card Footer -------- */}
                  <div className="card-footer-dept">
                    {/* Created Date */}
                    <div className="dept-info-date">
                      <i className="bi bi-calendar3"></i>
                      <span>{formatDate(dept.createdAt)}</span>
                    </div>
                    {/* Action Buttons */}
                    <div className="card-actions-dept">
                      {/* Edit Button */}
                      <button
                        className="btn-icon-dept btn-edit-dept"
                        onClick={() => handleEdit(dept)}
                        title="Edit"
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      {/* Delete Button */}
                      <button
                        className="btn-icon-dept btn-delete-dept"
                        onClick={() => handleDelete(dept)}
                        title="Delete"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ======================== */}
          {/* TABLE VIEW */}
          {/* ======================== */}
          {viewMode === "table" && (
            <>
              <div className="table-container-dept">
                <table className="table-dept">
                  <thead>
                    <tr>
                      <th>Department Name</th>
                      <th>Description</th>
                      <th>Created At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((dept) => (
                      <tr key={dept.departmentId}>
                        {/* Department Name with Icon */}
                        <td>
                          <div className="table-dept-name">
                            <i
                              className={`bi ${getDepartmentIcon(
                                dept.departmentName
                              )}`}
                            ></i>
                            <span>{dept.departmentName}</span>
                          </div>
                        </td>

                        {/* Description */}
                        <td className="description-cell">
                          {dept.description || "N/A"}
                        </td>

                        {/* Created Date */}
                        <td>{formatDate(dept.createdAt)}</td>

                        {/* Action Buttons */}
                        <td>
                          <div className="table-actions-dept">
                            {/* Edit Button */}
                            <button
                              className="btn-icon-dept btn-edit-dept"
                              onClick={() => handleEdit(dept)}
                              title="Edit"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            {/* Delete Button */}
                            <button
                              className="btn-icon-dept btn-delete-dept"
                              onClick={() => handleDelete(dept)}
                              title="Delete"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ======================== */}
              {/* PAGINATION */}
              {/* ======================== */}
              {/* Only shown when there are multiple pages */}
              {totalPages > 1 && (
                <div className="pagination-dept">
                  {/* Previous Button */}
                  <button
                    className="pagination-btn"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>

                  {/* Page Info */}
                  <span className="pagination-info">
                    Page {currentPage} of {totalPages}
                  </span>

                  {/* Next Button */}
                  <button
                    className="pagination-btn"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ======================== */}
      {/* MODALS */}
      {/* ======================== */}

      {/* -------- Add Department Modal -------- */}
      {showAddModal && (
        <AddDepartmentModal
          show={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchDepartments();
          }}
        />
      )}

      {/* -------- Edit Department Modal -------- */}
      {showEditModal && selectedDepartment && (
        <EditDepartmentModal
          show={showEditModal}
          department={selectedDepartment}
          onClose={() => {
            setShowEditModal(false);
            setSelectedDepartment(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedDepartment(null);
            fetchDepartments();
          }}
        />
      )}

      {/* -------- Delete Department Modal -------- */}
      {showDeleteModal && selectedDepartment && (
        <DeleteDepartmentModal
          show={showDeleteModal}
          department={selectedDepartment}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedDepartment(null);
          }}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
};

export default DepartmentList;
