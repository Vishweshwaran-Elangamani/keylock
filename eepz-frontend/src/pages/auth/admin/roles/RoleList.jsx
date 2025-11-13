/**
 * RoleList Component
 * 
 * Main component for role management in the admin dashboard.
 * Features:
 * - View roles in Grid or Table layout
 * - Search and filter roles
 * - Create, Edit, and Delete role operations
 * - Statistics dashboard showing role counts
 * - Pagination for table view
 * - Protection for system roles (cannot be deleted)
 * - Toast notifications using Sonner for user feedback
 * 
 * @component
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import roleService from "../../../../services/auth/roleService";
import AddRoleModal from "./AddRoleModal";
import EditRoleModal from "./EditRoleModal";
import DeleteRoleModal from "./DeleteRoleModal";
import { toast } from "sonner";
import "../../../../styles/auth/roles/RoleList.css";

const RoleList = () => {
  // ========================
  // HOOKS & NAVIGATION
  // ========================
  const navigate = useNavigate();

  // ========================
  // STATE MANAGEMENT
  // ========================

  /**
   * Data States
   * - roles: Array of all roles fetched from backend
   * - loading: Loading state for initial data fetch
   */
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  /**
   * Modal States
   * - showAddModal: Controls Add Role modal visibility
   * - showEditModal: Controls Edit Role modal visibility
   * - showDeleteModal: Controls Delete Role modal visibility
   * - selectedRole: Currently selected role for edit/delete operations
   */
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  /**
   * Filter & View States
   * - searchTerm: Text search across role fields
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
   * Effect: Fetch Roles on Component Mount
   * Loads all roles when component first renders
   */
  useEffect(() => {
    fetchRoles();
  }, []);

  // ========================
  // API FUNCTIONS
  // ========================

  /**
   * Fetches all roles from backend
   * Shows Sonner toast notifications for user feedback
   * Updates roles state with fetched data
   */
  const fetchRoles = async () => {
    try {
      setLoading(true);
      
      // Show loading toast
      toast.loading("Loading roles...");

      // -------- API Call --------
      const response = await roleService.getAllRoles();

      // -------- Handle Success Response --------
      if (response.success) {
        setRoles(response.data || []);
        toast.dismiss();
        toast.success(`Loaded ${response.data?.length || 0} roles successfully`);
      } else {
        // -------- Handle Failure Response --------
        toast.dismiss();
        toast.error(response.message || "Failed to load roles");
      }
    } catch (error) {
      // -------- Handle Exception --------
      console.error("Error loading roles:", error);
      toast.dismiss();
      toast.error(error.message || "Error loading roles");
    } finally {
      setLoading(false);
    }
  };

  // ========================
  // DELETE HANDLERS
  // ========================

  /**
   * Handles delete button click
   * Validates if role can be deleted (system roles are protected)
   * Opens delete confirmation modal
   * 
   * @param {Object} role - Role object to be deleted
   */
  const handleDelete = (role) => {
    // -------- System Role Protection --------
    // Prevent deletion of system roles
    if (role.isSystemRole) {
      toast.warning("System roles cannot be deleted");
      return;
    }
    
    // Open delete confirmation modal
    setSelectedRole(role);
    setShowDeleteModal(true);
  };

  /**
   * Handles delete confirmation
   * Makes API call to delete the role
   * Shows success/error notifications using Sonner toast
   * Refreshes role list after successful deletion
   */
  const handleDeleteConfirm = async () => {
    try {
      // Show loading toast
      toast.loading("Deleting role...");

      // -------- API Call --------
      const response = await roleService.deleteRole(selectedRole.roleId);

      // -------- Handle Success Response --------
      if (response.success) {
        toast.dismiss();
        toast.success("Role deleted successfully");
        
        // Close modal and reset selected role
        setShowDeleteModal(false);
        setSelectedRole(null);
        
        // Refresh roles list
        fetchRoles();
      } else {
        // -------- Handle Failure Response --------
        toast.dismiss();
        toast.error(response.message || "Failed to delete role");
      }
    } catch (error) {
      // -------- Handle Exception --------
      console.error("Error deleting role:", error);
      toast.dismiss();
      toast.error(error.message || "Error deleting role");
    }
  };

  // ========================
  // EDIT HANDLER
  // ========================

  /**
   * Handles edit button click
   * Opens edit modal with selected role data
   * 
   * @param {Object} role - Role object to be edited
   */
  const handleEdit = (role) => {
    setSelectedRole(role);
    setShowEditModal(true);
  };

  // ========================
  // FILTER FUNCTIONS
  // ========================

  /**
   * Filters roles based on search term
   * Searches across: roleName, roleCode, and description
   * Returns filtered array of roles
   * 
   * @returns {Array} Filtered roles array
   */
  const filteredRoles = roles.filter(
    (role) =>
      role.roleName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.roleCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description?.toLowerCase().includes(searchTerm.toLowerCase())
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
  const currentItems = filteredRoles.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);

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
   * Returns appropriate Bootstrap icon class for role
   * Maps role names to specific icons
   * 
   * @param {string} roleName - Name of the role
   * @returns {string} Bootstrap icon class name
   */
  const getRoleIcon = (roleName) => {
    const iconMap = {
      Admin: "bi-shield-lock-fill",
      HR: "bi-person-badge",
      Manager: "bi-briefcase",
      Employee: "bi-person",
      "Department Head": "bi-building",
      Leadership: "bi-award",
    };
    return iconMap[roleName] || "bi-shield";
  };

  /**
   * Calculates statistics for role data
   * Returns counts of total, system, and custom roles
   * 
   * @returns {Object} Statistics object with role counts
   */
  const getRoleStats = () => {
    const totalRoles = filteredRoles.length;
    const systemRoles = filteredRoles.filter((r) => r.isSystemRole).length;
    const customRoles = filteredRoles.filter((r) => !r.isSystemRole).length;

    return { totalRoles, systemRoles, customRoles };
  };

  const stats = getRoleStats();

  // ========================
  // LOADING STATE
  // ========================

  /**
   * Shows loading spinner while initial data is being fetched
   */
  if (loading) {
    return (
      <div className="loading-container-role">
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
    <div className="role-management-page">
      
      {/* ======================== */}
      {/* BREADCRUMB NAVIGATION */}
      {/* ======================== */}
      <nav className="breadcrumb-nav-role" aria-label="breadcrumb">
        <ol className="breadcrumb-role">
          {/* Dashboard Link - Clickable */}
          <li
            className="breadcrumb-item-role clickable"
            onClick={() => navigate("/admin/dashboard")}
          >
            <i className="bi bi-house-door"></i>
            <span>Dashboard</span>
          </li>
          {/* Current Page - Not Clickable */}
          <li className="breadcrumb-item-role active" aria-current="page">
            Role Management
          </li>
        </ol>
      </nav>

      {/* ======================== */}
      {/* PAGE HEADER */}
      {/* ======================== */}
      <div className="page-header-role">
        <div className="header-text-role">
          <h2 className="page-title-role">Role Management</h2>
          <p className="page-subtitle-role">
            Manage user roles and permissions
          </p>
        </div>
        {/* Create Role Button */}
        <button
          className="btn-create-role"
          onClick={() => setShowAddModal(true)}
        >
          <i className="bi bi-plus-circle"></i>
          Create Role
        </button>
      </div>

      {/* ======================== */}
      {/* STATISTICS CARDS */}
      {/* ======================== */}
      <div className="stats-cards-role">
        
        {/* Total Roles Card */}
        <div className="stat-card-role stat-total-role">
          <div className="stat-icon-role">
            <i className="bi bi-collection-fill"></i>
          </div>
          <div className="stat-content-role">
            <div className="stat-value-role">{stats.totalRoles}</div>
            <div className="stat-label-role">Total Roles</div>
          </div>
        </div>

        {/* System Roles Card */}
        <div className="stat-card-role stat-system-role">
          <div className="stat-icon-role">
            <i className="bi bi-lock-fill"></i>
          </div>
          <div className="stat-content-role">
            <div className="stat-value-role">{stats.systemRoles}</div>
            <div className="stat-label-role">System Roles</div>
          </div>
        </div>

        {/* Custom Roles Card */}
        <div className="stat-card-role stat-custom-role">
          <div className="stat-icon-role">
            <i className="bi bi-gear-fill"></i>
          </div>
          <div className="stat-content-role">
            <div className="stat-value-role">{stats.customRoles}</div>
            <div className="stat-label-role">Custom Roles</div>
          </div>
        </div>
      </div>

      {/* ======================== */}
      {/* CONTROLS BAR */}
      {/* ======================== */}
      <div className="controls-bar-role">
        
        {/* -------- Search Section -------- */}
        <div className="search-section-role">
          <div className="search-input-wrapper-role">
            <i className="bi bi-search"></i>
            <input
              type="text"
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {/* Clear Search Button - Only visible when search term exists */}
            {searchTerm && (
              <button
                className="clear-search-role"
                onClick={() => setSearchTerm("")}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            )}
          </div>
        </div>

        {/* -------- View Switcher -------- */}
        {/* Toggle between Grid and Table views */}
        <div className="view-switcher-role">
          <button
            className={`view-btn-role ${viewMode === "grid" ? "active" : ""}`}
            onClick={() => setViewMode("grid")}
            title="Grid View"
          >
            <i className="bi bi-grid-3x3-gap-fill"></i>
          </button>
          <button
            className={`view-btn-role ${viewMode === "table" ? "active" : ""}`}
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
      {/* Shown when no roles match the search/filter criteria */}
      {filteredRoles.length === 0 ? (
        <div className="empty-state-role">
          <div className="empty-icon-role">
            <i className="bi bi-inbox"></i>
          </div>
          <h4>No roles found</h4>
          <p>Adjust your search or create a new role</p>
        </div>
      ) : (
        <>
          {/* ======================== */}
          {/* GRID VIEW */}
          {/* ======================== */}
          {viewMode === "grid" && (
            <div className="roles-grid-role">
              {filteredRoles.map((role) => (
                <div key={role.roleId} className="role-card-item">
                  
                  {/* -------- Card Header -------- */}
                  <div className="card-header-role">
                    {/* Role Icon Badge */}
                    <div className="role-icon-badge">
                      <i className={`bi ${getRoleIcon(role.roleName)}`}></i>
                    </div>
                    {/* System Role Badge - Only shown for system roles */}
                    {role.isSystemRole && (
                      <span className="system-badge-role">
                        <i className="bi bi-lock-fill"></i>
                        System
                      </span>
                    )}
                  </div>

                  {/* -------- Card Body -------- */}
                  <div className="card-body-role">
                    <h3 className="role-name-text">{role.roleName}</h3>
                    <span className="role-code-text">{role.roleCode}</span>
                    <p className="role-description-text">
                      {role.description || "No description available"}
                    </p>
                  </div>

                  {/* -------- Card Footer -------- */}
                  <div className="card-footer-role">
                    {/* Created Date */}
                    <div className="role-info-date">
                      <i className="bi bi-calendar3"></i>
                      <span>{formatDate(role.createdAt)}</span>
                    </div>
                    {/* Action Buttons */}
                    <div className="card-actions-role">
                      {/* Edit Button */}
                      <button
                        className="btn-icon-role btn-edit-role"
                        onClick={() => handleEdit(role)}
                        title="Edit"
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      {/* Delete Button - Disabled for system roles */}
                      <button
                        className="btn-icon-role btn-delete-role"
                        onClick={() => handleDelete(role)}
                        disabled={role.isSystemRole}
                        title={
                          role.isSystemRole
                            ? "Cannot delete system role"
                            : "Delete"
                        }
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
              <div className="table-container-role">
                <table className="table-role">
                  <thead>
                    <tr>
                      <th>Role Name</th>
                      <th>Role Code</th>
                      <th>Description</th>
                      <th>Type</th>
                      <th>Created At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((role) => (
                      <tr key={role.roleId}>
                        {/* Role Name with Icon */}
                        <td>
                          <div className="table-role-name">
                            <i
                              className={`bi ${getRoleIcon(role.roleName)}`}
                            ></i>
                            <span>{role.roleName}</span>
                          </div>
                        </td>
                        
                        {/* Role Code */}
                        <td>
                          <code>{role.roleCode}</code>
                        </td>
                        
                        {/* Description */}
                        <td className="description-cell">
                          {role.description || "N/A"}
                        </td>
                        
                        {/* Type Badge (System/Custom) */}
                        <td>
                          {role.isSystemRole ? (
                            <span className="badge-system">System</span>
                          ) : (
                            <span className="badge-custom">Custom</span>
                          )}
                        </td>
                        
                        {/* Created Date */}
                        <td>{formatDate(role.createdAt)}</td>
                        
                        {/* Action Buttons */}
                        <td>
                          <div className="table-actions-role">
                            {/* Edit Button */}
                            <button
                              className="btn-icon-role btn-edit-role"
                              onClick={() => handleEdit(role)}
                              title="Edit"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            {/* Delete Button - Disabled for system roles */}
                            <button
                              className="btn-icon-role btn-delete-role"
                              onClick={() => handleDelete(role)}
                              disabled={role.isSystemRole}
                              title={
                                role.isSystemRole ? "Cannot delete" : "Delete"
                              }
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
                <div className="pagination-role">
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
      
      {/* -------- Add Role Modal -------- */}
      {showAddModal && (
        <AddRoleModal
          show={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchRoles();
          }}
        />
      )}

      {/* -------- Edit Role Modal -------- */}
      {showEditModal && selectedRole && (
        <EditRoleModal
          show={showEditModal}
          role={selectedRole}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRole(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedRole(null);
            fetchRoles();
          }}
        />
      )}

      {/* -------- Delete Role Modal -------- */}
      {showDeleteModal && selectedRole && (
        <DeleteRoleModal
          show={showDeleteModal}
          role={selectedRole}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedRole(null);
          }}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
};

export default RoleList;
