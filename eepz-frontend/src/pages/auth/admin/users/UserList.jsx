import { useState, useEffect } from "react";
import userService from "../../../../services/auth/userService";
import roleService from "../../../../services/auth/roleService";
import departmentService from "../../../../services/auth/departmentService";
import AddUserModal from "../../../../components/auth/Modal/users/AddUserModal";
import EditUserModal from "../../../../components/auth/Modal/users/EditUserModal";
import DeactivateUserModal from "../../../../components/auth/Modal/users/DeactivateUserModal";
import BulkOperationsModal from "../../../../components/auth/Modal/bulk_operations/BulkOperationsModal";
import Breadcrumb from "../../../../components/common/Breadcrumb";
import { toast } from "sonner";
import { FaSearch } from "react-icons/fa";
import { Form } from "react-bootstrap";
import "../../../../styles/auth/user/UserList.css";

/**
 * UserList Component
 * Main admin user management listing, filtering, and modal launching.
 * All notifications use Sonner.
 */
const UserList = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState(""); // What user types
  const [activeSearchTerm, setActiveSearchTerm] = useState(""); // What's actually used for filtering
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Pagination
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showBulkOperations, setShowBulkOperations] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  // ✅ FIXED: Use activeSearchTerm instead of searchTerm
  useEffect(() => {
    filterUsers();
  }, [users, activeSearchTerm, selectedRole, selectedStatus]);

  // Data load
  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersResponse, rolesResponse, departmentsResponse] =
        await Promise.all([
          userService.getAllUsers(),
          roleService.getAllRoles(),
          departmentService.getAllDepartments(),
        ]);
      if (usersResponse.success) {
        setUsers(usersResponse.data || []);
      }
      if (rolesResponse.success) setRoles(rolesResponse.data || []);
      if (departmentsResponse.success)
        setDepartments(departmentsResponse.data || []);
      toast.dismiss();
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to load data.");
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter out Admin users from display
  const getNonAdminUsers = () => {
    return users.filter((user) => user.roleName !== "Admin");
  };

  // Filters
  const filterUsers = () => {
    // Start with non-admin users only
    let filtered = getNonAdminUsers();

    // ✅ Use activeSearchTerm instead of searchTerm
    if (activeSearchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.firstName?.toLowerCase().includes(activeSearchTerm.toLowerCase()) ||
          user.lastName?.toLowerCase().includes(activeSearchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(activeSearchTerm.toLowerCase()) ||
          user.employeeCompanyId
            ?.toLowerCase()
            .includes(activeSearchTerm.toLowerCase())
      );
    }
    if (selectedRole) {
      filtered = filtered.filter((user) => user.roleName === selectedRole);
    }
    if (selectedStatus) {
      const isActive = selectedStatus === "Active";
      filtered = filtered.filter((user) => user.isActive === isActive);
    }
    setFilteredUsers(filtered);
    setCurrentPage(1);
  };

  // ✅ NEW: Handle search button click
  const handleSearch = () => {
    setActiveSearchTerm(searchTerm);
  };

  // ✅ FIXED: Clear all filters including activeSearchTerm
  const clearFilters = () => {
    setSearchTerm("");
    setActiveSearchTerm("");
    setSelectedRole("");
    setSelectedStatus("");
  };

  // Modal triggers
  const handleAddUser = () => setShowAddModal(true);
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };
  const handleDeactivate = (user) => {
    setSelectedUser(user);
    setShowDeactivateModal(true);
  };
  const handleUserAdded = () => {
    setShowAddModal(false);
    fetchData();
  };
  const handleUserUpdated = () => {
    setShowEditModal(false);
    fetchData();
  };
  const handleUserDeactivated = () => {
    setShowDeactivateModal(false);
    fetchData();
  };
  const handleBulkOperationsSuccess = () => {
    fetchData();
    toast.success("Operation completed successfully!");
  };

  // Pagination helpers
  const getPaginatedUsers = () => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  };
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
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

  // User initials for avatar
  const getInitials = (firstName, lastName) => {
    const first = firstName?.charAt(0)?.toUpperCase() || "";
    const last = lastName?.charAt(0)?.toUpperCase() || "";
    return `${first}${last}`;
  };

  // Loading indicator
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
      {/* BREADCRUMB COMPONENT */}
      <Breadcrumb
        items={[
          {
            label: "User Management",
          },
        ]}
      />

      {/* STATISTICS CARDS - EXCLUDE ADMIN USERS */}
      <div className="ad-stats-grid">
        <div className="ad-stat-card">
          <div className="stat-icon stat-icon-primary">
            <i className="bi bi-people-fill"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{getNonAdminUsers().length}</h3>
            <p className="stat-label">Total Users</p>
          </div>
        </div>
        <div className="ad-stat-card">
          <div className="stat-icon stat-icon-success">
            <i className="bi bi-person-check-fill"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">
              {getNonAdminUsers().filter((u) => u.isActive).length}
            </h3>
            <p className="stat-label">Active Users</p>
          </div>
        </div>
        <div className="ad-stat-card">
          <div className="stat-icon stat-icon-danger">
            <i className="bi bi-person-x-fill"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">
              {getNonAdminUsers().filter((u) => !u.isActive).length}
            </h3>
            <p className="stat-label">Inactive Users</p>
          </div>
        </div>
        <div className="ad-stat-card">
          <div className="stat-icon stat-icon-warning">
            <i className="bi bi-person-plus-fill"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">
              {
                getNonAdminUsers().filter((u) => {
                  const joinDate = new Date(u.joiningDate);
                  const thirtyDaysAgo = new Date();
                  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                  return joinDate > thirtyDaysAgo;
                }).length
              }
            </h3>
            <p className="stat-label">New (Last 30 Days)</p>
          </div>
        </div>
      </div>

      {/* FILTERS AND ACTIONS */}
      <div className="filters-card">
        <div className="filters-content">
          <div className="filters-left">
            {/* Search with Button */}
            <div className="ul-search-input">
              <div className="ul-search-inner">
                <span className="ul-search-icon">
                  <FaSearch />
                </span>
                <Form.Control
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  className="ul-search-field"
                />
                <button
                  type="button"
                  className="ul-search-btn"
                  onClick={handleSearch}
                >
                  Search
                </button>
              </div>
            </div>

            {/* Role Filter - EXCLUDE ADMIN ROLE */}
            <select
              className="filter-select"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="">All Roles</option>
              {roles
                .filter((role) => role.roleName !== "Admin")
                .map((role) => (
                  <option key={role.roleId} value={role.roleName}>
                    {role.roleName}
                  </option>
                ))}
            </select>

            {/* Status Filter */}
            <select
              className="filter-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            {/* Clear Filters Button */}
            <button className="btn-clear-filters" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
          <div className="filters-actions">
            <button
              className="btn-bulk"
              onClick={() => setShowBulkOperations(true)}
            >
              <i className="bi bi-database"></i>
              Bulk Operations
            </button>
            <button className="btn-add" onClick={handleAddUser}>
              <i className="bi bi-plus-circle"></i>
              Create User
            </button>
          </div>
        </div>
      </div>

      {/* TABLE CARD */}
      <div className="us-table-card">
        <div className="table-wrapper">
          <table className="user-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Email</th>
                <th>Employee Id</th>
                <th>Status</th>
                <th>Designation</th>
                <th>Joined Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {getPaginatedUsers().length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-state">
                    <i className="bi bi-inbox"></i>
                    <p>No users found</p>
                  </td>
                </tr>
              ) : (
                getPaginatedUsers().map((user) => (
                  <tr key={user.userId}>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar">
                          {getInitials(user.firstName, user.lastName)}
                        </div>
                        <span className="user-name">{`${user.firstName} ${user.lastName}`}</span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td className="text-muted">{user.employeeCompanyId}</td>
                    <td>
                      <span
                        className={`status-badge ${
                          user.isActive ? "status-active" : "status-inactive"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      {user.roleName || (
                        <span className="text-muted">Not Assigned</span>
                      )}
                    </td>
                    <td>
                      {new Date(user.joiningDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="action-btn action-btn-edit"
                          onClick={() => handleEditUser(user)}
                          title="Edit User"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        {user.isActive ? (
                          <button
                            className="action-btn action-btn-delete"
                            onClick={() => handleDeactivate(user)}
                            title="Deactivate User"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        ) : (
                          <button
                            className="action-btn action-btn-disabled"
                            disabled
                            title="Permanently Deactivated"
                          >
                            <i className="bi bi-lock"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {filteredUsers.length > 0 && (
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
              {Math.min(currentPage * rowsPerPage, filteredUsers.length)} of{" "}
              {filteredUsers.length} entries
            </div>
            <nav className="pagination-nav">
              <ul className="pagination">
                <li
                  className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
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
      {showAddModal && (
        <AddUserModal
          show={showAddModal}
          onHide={() => setShowAddModal(false)}
          onUserAdded={handleUserAdded}
          roles={roles}
          departments={departments}
        />
      )}
      {showEditModal && selectedUser && (
        <EditUserModal
          show={showEditModal}
          onHide={() => setShowEditModal(false)}
          onUserUpdated={handleUserUpdated}
          user={selectedUser}
          roles={roles}
          departments={departments}
        />
      )}
      {showDeactivateModal && selectedUser && (
        <DeactivateUserModal
          show={showDeactivateModal}
          onHide={() => setShowDeactivateModal(false)}
          onUserDeactivated={handleUserDeactivated}
          user={selectedUser}
        />
      )}
      {showBulkOperations && (
        <BulkOperationsModal
          show={showBulkOperations}
          onClose={() => setShowBulkOperations(false)}
          onSuccess={handleBulkOperationsSuccess}
        />
      )}
    </div>
  );
};

export default UserList;
