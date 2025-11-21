import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import roleService from "../../../../services/auth/roleService";
import AddRoleModal from "../../../../components/auth/Modal/roles/AddRoleModal";
import EditRoleModal from "../../../../components/auth/Modal/roles/EditRoleModal";
import DeleteRoleModal from "../../../../components/auth/Modal/roles/DeleteRoleModal";
import Breadcrumb from "../../../../components/common/Breadcrumb";
import { toast } from "sonner";
import "../../../../styles/auth/roles/RoleList.css";

const RoleList = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      // toast.loading("Loading roles...");

      const response = await roleService.getAllRoles();

      if (response.success) {
        setRoles(response.data || []);
        toast.dismiss();
        // toast.success(
        //   `Loaded ${response.data?.length || 0} roles successfully`
        // );
      } else {
        toast.dismiss();
        toast.error(response.message || "Failed to load roles");
      }
    } catch (error) {
      console.error("Error loading roles:", error);
      toast.dismiss();
      toast.error(error.message || "Error loading roles");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (role) => {
    if (role.isSystemRole) {
      toast.warning("System roles cannot be deleted");
      return;
    }

    setSelectedRole(role);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      toast.loading("Deleting role...");

      const response = await roleService.deleteRole(selectedRole.roleId);

      if (response.success) {
        toast.dismiss();
        toast.success("Role deleted successfully");
        setShowDeleteModal(false);
        setSelectedRole(null);
        fetchRoles();
      } else {
        toast.dismiss();
        toast.error(response.message || "Failed to delete role");
      }
    } catch (error) {
      console.error("Error deleting role:", error);
      toast.dismiss();
      toast.error(error.message || "Error deleting role");
    }
  };

  const handleEdit = (role) => {
    setSelectedRole(role);
    setShowEditModal(true);
  };

  const filteredRoles = roles.filter(
    (role) =>
      role.roleName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.roleCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const clearFilters = () => {
    setSearchTerm("");
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRoles.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);

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

  const formatDate = (date) => {
    return date
      ? new Date(date).toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "N/A";
  };

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

  const getRoleStats = () => {
    const totalRoles = filteredRoles.length;
    const systemRoles = filteredRoles.filter((r) => r.isSystemRole).length;
    const customRoles = filteredRoles.filter((r) => !r.isSystemRole).length;

    return { totalRoles, systemRoles, customRoles };
  };

  const stats = getRoleStats();

  if (loading) {
    return (
      <div className="loading-container-rl">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="role-management-page">
      {/* NEW BREADCRUMB COMPONENT */}
      <Breadcrumb
        items={[
         
          {
            label: "Role Management",
          },
        ]}
      />

      {/* COMPACT STATISTICS CARDS */}
      <div className="stats-cards-rl">
        <div className="stat-card-rl stat-total-rl">
          <div className="stat-icon-rl">
            <i className="bi bi-collection-fill"></i>
          </div>
          <div className="stat-content-rl">
            <div className="stat-value-rl">{stats.totalRoles}</div>
            <div className="stat-label-rl">Total Roles</div>
          </div>
        </div>

        <div className="stat-card-rl stat-system-rl">
          <div className="stat-icon-rl">
            <i className="bi bi-lock-fill"></i>
          </div>
          <div className="stat-content-rl">
            <div className="stat-value-rl">{stats.systemRoles}</div>
            <div className="stat-label-rl">System Roles</div>
          </div>
        </div>

        <div className="stat-card-rl stat-custom-rl">
          <div className="stat-icon-rl">
            <i className="bi bi-gear-fill"></i>
          </div>
          <div className="stat-content-rl">
            <div className="stat-value-rl">{stats.customRoles}</div>
            <div className="stat-label-rl">Custom Roles</div>
          </div>
        </div>
      </div>

      {/* CONTROLS BAR */}
      <div className="controls-bar-rl">
        <div className="search-section-rl">
          <div className="search-input-wrapper-rl">
            <i className="bi bi-search"></i>
            <input
              type="text"
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="clear-search-rl"
                onClick={() => setSearchTerm("")}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            )}
          </div>
        </div>

        <button className="btn-clear-rl" onClick={clearFilters}>
          Clear Filters
        </button>

        <div className="view-switcher-rl">
          <button
            className={`view-btn-rl ${viewMode === "grid" ? "active" : ""}`}
            onClick={() => setViewMode("grid")}
            title="Grid View"
          >
            <i className="bi bi-grid-3x3-gap-fill"></i>
          </button>
          <button
            className={`view-btn-rl ${viewMode === "table" ? "active" : ""}`}
            onClick={() => setViewMode("table")}
            title="Table View"
          >
            <i className="bi bi-table"></i>
          </button>
        </div>
        <div className="results-count-inline-rl">
          Showing{" "}
          {viewMode === "table" ? currentItems.length : filteredRoles.length} of{" "}
          {filteredRoles.length} roles
        </div>

        <button className="btn-create-rl" onClick={() => setShowAddModal(true)}>
          <i className="bi bi-plus-circle"></i>
          Create Role
        </button>

        
      </div>

      {/* EMPTY STATE */}
      {filteredRoles.length === 0 ? (
        <div className="empty-state-rl">
          <div className="empty-icon-rl">
            <i className="bi bi-inbox"></i>
          </div>
          <h4>No roles found</h4>
          <p>Adjust your search or create a new role</p>
        </div>
      ) : (
        <>
          {/* GRID VIEW */}
          {viewMode === "grid" && (
            <div className="roles-grid-rl">
              {filteredRoles.map((role) => (
                <div key={role.roleId} className="role-card-item">
                  <div className="card-header-rl">
                    <div className="role-icon-badge">
                      <i className={`bi ${getRoleIcon(role.roleName)}`}></i>
                    </div>
                    {role.isSystemRole && (
                      <span className="system-badge-rl">
                        <i className="bi bi-lock-fill"></i>
                        System
                      </span>
                    )}
                  </div>

                  <div className="card-body-rl">
                    <h3 className="role-name-text">{role.roleName}</h3>
                    <span className="role-code-text">{role.roleCode}</span>
                    <p className="role-description-text">
                      {role.description || "No description available"}
                    </p>
                  </div>

                  <div className="card-footer-rl">
                    <div className="role-info-date">
                      <i className="bi bi-calendar3"></i>
                      <span>{formatDate(role.createdAt)}</span>
                    </div>
                    <div className="card-actions-rl">
                      <button
                        className="action-btn action-btn-edit"
                        onClick={() => handleEdit(role)}
                        title="Edit"
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="action-btn action-btn-delete"
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

          {/* TABLE VIEW */}
          {viewMode === "table" && (
            <>
              <div className="table-card-rl">
                <div className="table-wrapper-rl">
                  <table className="table-rl">
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
                          <td>
                            <div className="table-role-name">
                              <i
                                className={`bi ${getRoleIcon(role.roleName)}`}
                              ></i>
                              <span>{role.roleName}</span>
                            </div>
                          </td>
                          <td>
                            <code>{role.roleCode}</code>
                          </td>
                          <td className="description-cell">
                            {role.description || "N/A"}
                          </td>
                          <td>
                            {role.isSystemRole ? (
                              <span className="badge-system">System</span>
                            ) : (
                              <span className="badge-custom">Custom</span>
                            )}
                          </td>
                          <td>{formatDate(role.createdAt)}</td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="action-btn action-btn-edit"
                                onClick={() => handleEdit(role)}
                                title="Edit"
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button
                                className="action-btn action-btn-delete"
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

                {/* PAGINATION */}
                {filteredRoles.length > 0 && (
                  <div className="pagination-container">
                    <div className="pagination-info">
                      <span className="pagination-label">Show</span>
                      <select
                        className="pagination-select"
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
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
                      Showing {indexOfFirstItem + 1} to{" "}
                      {Math.min(indexOfLastItem, filteredRoles.length)} of{" "}
                      {filteredRoles.length} entries
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
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* MODALS */}
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
