import { useState, useEffect } from "react";
import userService from "../../../../services/auth/userService";
import roleService from "../../../../services/auth/roleService";
import departmentService from "../../../../services/auth/departmentService";
import AddUserModal from "./AddUserModal";
import EditUserModal from "./EditUserModal";
import DeactivateUserModal from "./DeactivateUserModal";
import BulkOperationsModal from "../bulk_operations/BulkOperationsModal";
import { toast } from "sonner";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  // Pagination
  const [rowsPerPage, setRowsPerPage] = useState(10);
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

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, selectedRole, selectedStatus, selectedDate]);

  // Data load
  const fetchData = async () => {
    try {
      setLoading(true);
      toast.loading("Loading users and data...");
      const [usersResponse, rolesResponse, departmentsResponse] =
        await Promise.all([
          userService.getAllUsers(),
          roleService.getAllRoles(),
          departmentService.getAllDepartments(),
        ]);
      if (usersResponse.success) {
        setUsers(usersResponse.data || []);
        toast.success("Users loaded!");
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

  // Filters
  const filterUsers = () => {
    let filtered = [...users];
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.employeeCompanyId
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }
    if (selectedRole) {
      filtered = filtered.filter((user) => user.roleName === selectedRole);
    }
    if (selectedStatus) {
      const isActive = selectedStatus === "Active";
      filtered = filtered.filter((user) => user.isActive === isActive);
    }
    if (selectedDate) {
      filtered = filtered.filter((user) => {
        const joinDate = new Date(user.joiningDate);
        const filterDate = new Date(selectedDate);
        return joinDate.toDateString() === filterDate.toDateString();
      });
    }
    setFilteredUsers(filtered);
    setCurrentPage(1);
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
      {/* Breadcrumbs */}
      <nav className="breadcrumb-nav" aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <i className="bi bi-house-door"></i>
            <span>Dashboard</span>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            User Management
          </li>
        </ol>
      </nav>

      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h2 className="page-title">User Management</h2>
            <p className="page-description">
              Manage all users in one place. Control access, assign roles, and
              monitor activity.
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="filters-card">
        <div className="filters-content">
          <div className="filters-left">
            {/* Search */}
            <div className="search-box">
              <i className="bi bi-search search-icon"></i>
              <input
                type="text"
                className="search-input"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* Role Filter */}
            <select
              className="filter-select"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="">All Roles</option>
              {roles.map((role) => (
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
            {/* Date Filter */}
            <input
              type="date"
              className="filter-date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
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
              Add User
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-icon-primary">
            <i className="bi bi-people-fill"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{users.length}</h3>
            <p className="stat-label">Total Users</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-success">
            <i className="bi bi-person-check-fill"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">
              {users.filter((u) => u.isActive).length}
            </h3>
            <p className="stat-label">Active Users</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-danger">
            <i className="bi bi-person-x-fill"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">
              {users.filter((u) => !u.isActive).length}
            </h3>
            <p className="stat-label">Inactive Users</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-warning">
            <i className="bi bi-person-plus-fill"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">
              {
                users.filter((u) => {
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

      {/* Table Card */}
      <div className="table-card">
        <div className="table-wrapper">
          <table className="user-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th style={{ textAlign: "left" }}>Email</th>
                <th>Employee Company Id</th>
                <th>Status</th>
                <th>Designation</th>
                <th>Joined Date</th>
                <th className="text-center">Actions</th>
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
                    <td style={{ textAlign: "left" }}>{user.email}</td>
                    <td className="text-muted">@{user.employeeCompanyId}</td>
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

        {/* Pagination */}
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

      {/* Modals */}
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
