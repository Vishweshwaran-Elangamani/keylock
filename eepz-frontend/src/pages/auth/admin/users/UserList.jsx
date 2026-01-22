import { useState, useEffect, useRef } from "react";
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
const RoleDropdown = ({ value, onChange, roles }) => {
  const [open, setOpen] = useState(false);
  const allOptions = [
    { label: "All Roles", value: "" },
    ...roles
      .filter((role) => role.roleName !== "Admin")
      .map((role) => ({ label: role.roleName, value: role.roleName })),
  ];
  const selected = allOptions.find((o) => o.value === value) || allOptions[0];
  const handleSelect = (val) => {
    onChange({ target: { value: val } });
    setOpen(false);
  };
  return (
    <div
      className="ul-filter-select custom-status-dropdown"
      tabIndex={0}
      onBlur={() => setTimeout(() => setOpen(false), 200)}
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
          {allOptions.map((opt) => (
            <div
              key={opt.value || "all-roles"}
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
const StatusDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const allOptions = [
    { label: "All Status", value: "" },
    { label: "Active", value: "Active" },
    { label: "Inactive", value: "Inactive" },
  ];
  const selected = allOptions.find((o) => o.value === value) || allOptions[0];
  const handleSelect = (val) => {
    onChange({ target: { value: val } });
    setOpen(false);
  };
  return (
    <div
      className="ul-filter-select custom-status-dropdown"
      tabIndex={0}
      onBlur={() => setTimeout(() => setOpen(false), 200)}
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
          {allOptions.map((opt) => (
            <div
              key={opt.value || "all-status"}
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
const UserList = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showRowsDropdown, setShowRowsDropdown] = useState(false);
  const rowsDropdownRef = useRef(null);
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
  }, [users, activeSearchTerm, selectedRole, selectedStatus]);
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
    } finally {
      setLoading(false);
    }
  };
  const getNonAdminUsers = () => {
    return users.filter((user) => user.roleName !== "Admin");
  };
  const filterUsers = () => {
    let filtered = getNonAdminUsers();
    if (activeSearchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.firstName
            ?.toLowerCase()
            .includes(activeSearchTerm.toLowerCase()) ||
          user.lastName
            ?.toLowerCase()
            .includes(activeSearchTerm.toLowerCase()) ||
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
  const handleSearch = () => {
    setActiveSearchTerm(searchTerm);
  };
  const clearFilters = () => {
    setSearchTerm("");
    setActiveSearchTerm("");
    setSelectedRole("");
    setSelectedStatus("");
  };
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
  };
  const getPaginatedUsers = () => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  };
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage) || 1;
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
  const getInitials = (firstName, lastName) => {
    const first = firstName?.charAt(0)?.toUpperCase() || "";
    const last = lastName?.charAt(0)?.toUpperCase() || "";
    return `${first}${last}`;
  };
  if (loading) {
    return (
      <div className="ul-loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  return (
    <div className="ul-page">
      <Breadcrumb
        items={[
          {
            label: "User Management",
          },
        ]}
      />
      <div className="stats-cards-ul">
        <div className="stat-card-ul stat-total-ul">
          <div className="stat-icon-ul">
            <i className="bi bi-people-fill"></i>
          </div>
          <div className="stat-content-ul">
            <div className="stat-value-ul">{getNonAdminUsers().length}</div>
            <div className="stat-label-ul">Total Users</div>
          </div>
        </div>
        <div className="stat-card-ul stat-active-ul">
          <div className="stat-icon-ul">
            <i className="bi bi-person-check-fill"></i>
          </div>
          <div className="stat-content-ul">
            <div className="stat-value-ul">
              {getNonAdminUsers().filter((u) => u.isActive).length}
            </div>
            <div className="stat-label-ul">Active Users</div>
          </div>
        </div>
        <div className="stat-card-ul stat-inactive-ul">
          <div className="stat-icon-ul">
            <i className="bi bi-person-x-fill"></i>
          </div>
          <div className="stat-content-ul">
            <div className="stat-value-ul">
              {getNonAdminUsers().filter((u) => !u.isActive).length}
            </div>
            <div className="stat-label-ul">Inactive Users</div>
          </div>
        </div>
        <div className="stat-card-ul stat-new-ul">
          <div className="stat-icon-ul">
            <i className="bi bi-person-plus-fill"></i>
          </div>
          <div className="stat-content-ul">
            <div className="stat-value-ul">
              {
                getNonAdminUsers().filter((u) => {
                  const joinDate = new Date(u.joiningDate);
                  const thirtyDaysAgo = new Date();
                  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                  return joinDate > thirtyDaysAgo;
                }).length
              }
            </div>
            <div className="stat-label-ul">New (Last 30 Days)</div>
          </div>
        </div>
      </div>
      <div className="ul-filters-card">
        <div className="ul-filters-content">
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
          <div className="ul-role-filter">
            <RoleDropdown
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              roles={roles}
            />
          </div>
          <div className="ul-status-filter">
            <StatusDropdown
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            />
          </div>
          <button className="ul-btn-clear" onClick={clearFilters}>
            Clear Filters
          </button>
          <div className="ul-results-count">
            Showing {getPaginatedUsers().length} of {filteredUsers.length} users
          </div>
          <button
            className="ul-btn-bulk"
            onClick={() => setShowBulkOperations(true)}
          >
            <i className="bi bi-database"></i>
            Bulk Operations
          </button>
          <button className="ul-btn-create" onClick={handleAddUser}>
            <i className="bi bi-plus-circle"></i>
            Create User
          </button>
        </div>
      </div>
      <div className="ul-table-card">
        <div className="ul-table-wrapper">
          <table className="ul-table">
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
                  <td colSpan="7" className="ul-empty-state">
                    <div className="ul-empty-content">
                      <i className="bi bi-inbox"></i>
                      <h4>No users found</h4>
                      <p>Try adjusting your search or filter criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                getPaginatedUsers().map((user) => (
                  <tr key={user.userId}>
                    <td>
                      <div className="ul-user-info">
                        <div className="ul-user-avatar">
                          {getInitials(user.firstName, user.lastName)}
                        </div>
                        <span className="ul-user-name">{`${user.firstName} ${user.lastName}`}</span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td className="text-muted">{user.employeeCompanyId}</td>
                    <td>
                      {user.isActive ? (
                        <span className="ul-badge-table-active">
                          <i className="bi bi-check-circle-fill"></i>
                          Active
                        </span>
                      ) : (
                        <span className="ul-badge-table-inactive">
                          <i className="bi bi-x-circle-fill"></i>
                          Inactive
                        </span>
                      )}
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
                      <div className="ul-table-actions">
                        {user.isActive ? (
                          <button
                            className="ul-action-edit"
                            onClick={() => handleEditUser(user)}
                            title="Edit User"
                          >
                            <i className="bi bi-pencil-square"></i>
                          </button>
                        ) : (
                          <button
                            className="ul-action-disabled"
                            disabled
                            title="Cannot Edit Inactive User"
                          >
                            <i className="bi bi-pencil-square"></i>
                          </button>
                        )}
                        {user.isActive ? (
                          <button
                            className="ul-action-delete"
                            onClick={() => handleDeactivate(user)}
                            title="Deactivate User"
                          >
                            <i className="bi bi-trash3"></i>
                          </button>
                        ) : (
                          <button
                            className="ul-action-disabled"
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
        {filteredUsers.length > 0 && (
          <div className="ul-pagination">
            <div className="ul-pagination-info">
              <span>Show</span>
              <div ref={rowsDropdownRef} className="ul-rows-dropdown-wrapper">
                <button
                  type="button"
                  onClick={() => setShowRowsDropdown(!showRowsDropdown)}
                  className="ul-rows-button"
                >
                  <span>{rowsPerPage}</span>
                  <i
                    className={`bi bi-chevron-${
                      showRowsDropdown ? "up" : "down"
                    } ul-rows-chevron`}
                  ></i>
                </button>
                {showRowsDropdown && (
                  <div className="ul-rows-dropdown">
                    {[5, 10, 25, 50].map((size) => (
                      <div
                        key={size}
                        onClick={() => {
                          setRowsPerPage(size);
                          setCurrentPage(1);
                          setShowRowsDropdown(false);
                        }}
                        className={`ul-rows-option ${
                          rowsPerPage === size ? "ul-rows-active" : ""
                        }`}
                      >
                        {size}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <span>entries</span>
            </div>
            <div className="ul-pagination-status">
              Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
              {Math.min(currentPage * rowsPerPage, filteredUsers.length)} of{" "}
              {filteredUsers.length} entries
            </div>
            {totalPages > 1 && (
              <nav className="ul-pagination-nav">
                <ul className="ul-pagination-list">
                  <li
                    className={`ul-page-item ${
                      currentPage === 1 ? "disabled" : ""
                    }`}
                  >
                    <button
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
                      className={`ul-page-item ${
                        page === currentPage ? "active" : ""
                      } ${typeof page !== "number" ? "disabled" : ""}`}
                    >
                      <button
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
                    className={`ul-page-item ${
                      currentPage === totalPages ? "disabled" : ""
                    }`}
                  >
                    <button
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(prev + 1, totalPages)
                        )
                      }
                      disabled={currentPage === totalPages}
                    >
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </div>
        )}
      </div>
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
