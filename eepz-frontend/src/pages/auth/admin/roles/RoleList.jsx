import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import roleService from "../../../../services/auth/roleService";
import AddRoleModal from "../../../../components/auth/Modal/roles/AddRoleModal";
import EditRoleModal from "../../../../components/auth/Modal/roles/EditRoleModal";
import DeleteRoleModal from "../../../../components/auth/Modal/roles/DeleteRoleModal";
import Breadcrumb from "../../../../components/common/Breadcrumb";
import { toast } from "sonner";
import { FaSearch } from "react-icons/fa";
import { Form } from "react-bootstrap";
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
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  
  const [viewMode, setViewMode] = useState("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await roleService.getAllRoles();

      if (response.success) {
        setRoles(response.data || []);
        toast.dismiss();
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
      role.roleName?.toLowerCase().includes(activeSearchTerm.toLowerCase()) ||
      role.roleCode?.toLowerCase().includes(activeSearchTerm.toLowerCase()) ||
      role.description?.toLowerCase().includes(activeSearchTerm.toLowerCase())
  );

  const handleSearch = () => {
    setActiveSearchTerm(searchTerm);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setActiveSearchTerm("");
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

  const getRoleStats = () => {
    const totalRoles = filteredRoles.length;
    const systemRoles = filteredRoles.filter((r) => r.isSystemRole).length;
    const customRoles = filteredRoles.filter((r) => !r.isSystemRole).length;

    return { totalRoles, systemRoles, customRoles };
  };

  const stats = getRoleStats();

  if (loading) {
    return (
      <div className="rlm-loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rlm-page">
      <Breadcrumb
        items={[
          {
            label: "Role Management",
          },
        ]}
      />

      {/* KPI CARDS */}
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
      <div className="rlm-controls">
        <div className="rlm-search-input">
          <div className="rlm-search-inner">
            <span className="rlm-search-icon">
              <FaSearch />
            </span>
            <Form.Control
              type="text"
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              className="rlm-search-field"
            />
            <button
              type="button"
              className="rlm-search-btn"
              onClick={handleSearch}
            >
              Search
            </button>
          </div>
        </div>

        <button className="rlm-btn-clear" onClick={clearFilters}>
          Clear Filters
        </button>

        <div className="rlm-view-switcher">
          <button
            className={`rlm-view-btn ${viewMode === "table" ? "active" : ""}`}
            onClick={() => {
              setViewMode("table");
              setItemsPerPage(10);
              setCurrentPage(1);
            }}
            title="Table View"
          >
            <i className="bi bi-table"></i>
          </button>
          <button
            className={`rlm-view-btn ${viewMode === "grid" ? "active" : ""}`}
            onClick={() => {
              setViewMode("grid");
              setItemsPerPage(9);
              setCurrentPage(1);
            }}
            title="Grid View"
          >
            <i className="bi bi-grid-3x3-gap-fill"></i>
          </button>
        </div>

        <div className="rlm-results-count">
          Showing {currentItems.length} of {filteredRoles.length} roles
        </div>

        <button className="rlm-btn-create" onClick={() => setShowAddModal(true)}>
          <i className="bi bi-plus-circle"></i>
          Create Role
        </button>
      </div>

      {/* EMPTY STATE */}
      {filteredRoles.length === 0 ? (
        <div className="rlm-empty">
          <div className="rlm-empty-icon">
            <i className="bi bi-inbox"></i>
          </div>
          <h4>No roles found</h4>
          <p>Adjust your search or create a new role</p>
        </div>
      ) : (
        <>
          {/* GRID VIEW */}
          {viewMode === "grid" && (
            <>
              <div className="rlm-grid">
                {currentItems.map((role) => (
                  <div
                    key={role.roleId}
                    className="rlm-card-modern"
                    style={{
                      cursor: "pointer",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      border: "1px solid rgba(39, 35, 92, 0.75)",
                      borderRadius: "12px",
                      overflow: "hidden",
                      position: "relative",
                      background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.52)";
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.borderColor = "rgb(39, 35, 92)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.borderColor = "rgba(39, 35, 92, 0.4)";
                    }}
                  >
                    {/* Card Header */}
                    <div
                      style={{
                        backgroundColor: "rgba(248, 249, 250, 0.8)",
                        backdropFilter: "blur(10px)",
                        borderBottom: "1px solid #e9ecef",
                        padding: "0.875rem 1.25rem",
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="d-flex gap-2 flex-wrap align-items-center">
                          {role.isSystemRole ? (
                            <span
                              className="badge"
                              style={{
                                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                fontSize: "10px",
                                fontWeight: 600,
                                padding: "0.35rem 0.6rem",
                                borderRadius: "6px",
                                boxShadow: "0 2px 8px rgba(102, 126, 234, 0.3)",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.25rem",
                              }}
                            >
                              <i className="bi bi-shield-check"></i>
                              System
                            </span>
                          ) : (
                            <span
                              className="badge"
                              style={{
                                background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                                fontSize: "10px",
                                fontWeight: 600,
                                padding: "0.35rem 0.6rem",
                                borderRadius: "6px",
                                boxShadow: "0 2px 8px rgba(79, 172, 254, 0.3)",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.25rem",
                              }}
                            >
                              <i className="bi bi-gear-fill"></i>
                              Custom
                            </span>
                          )}
                        </div>

                        <code
                          style={{
                            fontSize: "10px",
                            fontWeight: 600,
                            padding: "0.35rem 0.6rem",
                            borderRadius: "6px",
                            backgroundColor: "rgba(39, 35, 92, 0.1)",
                            color: "#27235c",
                            border: "1px solid rgba(39, 35, 92, 0.2)",
                          }}
                        >
                          {role.roleCode}
                        </code>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div
                      style={{
                        padding: "1.25rem",
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      {/* Role Name */}
                      <h6
                        style={{
                          fontWeight: 700,
                          fontSize: "18px",
                          color: "#212529",
                          lineHeight: "1.4",
                          marginBottom: "0.75rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          minHeight: "2.8rem",
                          textAlign: "left",
                        }}
                      >
                        {role.roleName}
                      </h6>

                      {/* Description */}
                      <p
                        style={{
                          fontSize: "14px",
                          color: "#6c757d",
                          lineHeight: "1.5",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          minHeight: "4rem",
                          textAlign: "left",
                          marginBottom: "1rem",
                          flex: 1,
                        }}
                      >
                        {role.description || "No description available"}
                      </p>

                      {/* Meta Info */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          padding: "0.75rem",
                          backgroundColor: "#f8f9fa",
                          borderRadius: "8px",
                          fontSize: "0.8rem",
                          marginTop: "auto",
                        }}
                      >
                        <i
                          className="bi bi-calendar-check-fill"
                          style={{ fontSize: "1.1rem", color: "#0d6efd" }}
                        ></i>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: "0.7rem",
                              color: "#6c757d",
                              marginBottom: "2px",
                            }}
                          >
                            Created On
                          </div>
                          <div style={{ fontWeight: 600, color: "#212529" }}>
                            {formatDate(role.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer - Actions */}
                    <div
                      style={{
                        borderTop: "1px solid #e9ecef",
                        padding: "0.75rem 1.25rem",
                        backgroundColor: "rgba(248, 249, 250, 0.5)",
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "0.5rem",
                      }}
                    >
                      <button
                        onClick={() => handleEdit(role)}
                        title="Edit Role"
                        style={{
                          width: "36px",
                          height: "36px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px solid rgba(13, 110, 253, 0.3)",
                          borderRadius: "8px",
                          background: "transparent",
                          color: "#0d6efd",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          fontSize: "0.95rem",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(13, 110, 253, 0.1)";
                          e.currentTarget.style.borderColor = "#0d6efd";
                          e.currentTarget.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.borderColor = "rgba(13, 110, 253, 0.3)";
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        <i className="bi bi-pencil-square"></i>
                      </button>

                      <button
                        onClick={() => handleDelete(role)}
                        disabled={role.isSystemRole}
                        title={
                          role.isSystemRole
                            ? "Cannot delete system role"
                            : "Delete Role"
                        }
                        style={{
                          width: "36px",
                          height: "36px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: role.isSystemRole
                            ? "1px solid rgba(108, 117, 125, 0.3)"
                            : "1px solid rgba(220, 53, 69, 0.3)",
                          borderRadius: "8px",
                          background: "transparent",
                          color: role.isSystemRole ? "#6c757d" : "#dc3545",
                          cursor: role.isSystemRole ? "not-allowed" : "pointer",
                          transition: "all 0.2s ease",
                          fontSize: "0.95rem",
                          opacity: role.isSystemRole ? 0.5 : 1,
                        }}
                        onMouseEnter={(e) => {
                          if (!role.isSystemRole) {
                            e.currentTarget.style.background = "rgba(220, 53, 69, 0.1)";
                            e.currentTarget.style.borderColor = "#dc3545";
                            e.currentTarget.style.transform = "translateY(-2px)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!role.isSystemRole) {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.borderColor = "rgba(220, 53, 69, 0.3)";
                            e.currentTarget.style.transform = "translateY(0)";
                          }
                        }}
                      >
                        <i className="bi bi-trash3"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* GRID PAGINATION */}
              {totalPages > 1 && (
                <div className="rlm-pagination">
                  <div className="rlm-pagination-info">
                    <span>Show</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      <option value="6">6</option>
                      <option value="9">9</option>
                      <option value="12">12</option>
                      <option value="18">18</option>
                    </select>
                    <span>entries</span>
                  </div>

                  <div className="rlm-pagination-status">
                    Showing {indexOfFirstItem + 1} to{" "}
                    {Math.min(indexOfLastItem, filteredRoles.length)} of{" "}
                    {filteredRoles.length}
                  </div>

                  <nav className="rlm-pagination-nav">
                    <ul className="rlm-pagination-list">
                      <li
                        className={`rlm-page-item ${
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
                          className={`rlm-page-item ${
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
                        className={`rlm-page-item ${
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
                </div>
              )}
            </>
          )}

          {/* TABLE VIEW */}
          {viewMode === "table" && (
            <>
              <div className="rlm-table-card">
                <div className="rlm-table-wrapper">
                  <table className="rlm-table">
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
                            <div className="rlm-table-role-name">
                              <span>{role.roleName}</span>
                            </div>
                          </td>
                          <td>
                            <code>{role.roleCode}</code>
                          </td>
                          <td className="rlm-desc-cell">
                            {role.description || "N/A"}
                          </td>
                          <td>
                            {role.isSystemRole ? (
                              <span className="rlm-badge-table-system">
                                System
                              </span>
                            ) : (
                              <span className="rlm-badge-table-custom">
                                Custom
                              </span>
                            )}
                          </td>
                          <td>{formatDate(role.createdAt)}</td>
                          <td>
                            <div className="rlm-table-actions">
                              <button
                                className="rlm-action-edit"
                                onClick={() => handleEdit(role)}
                                title="Edit"
                              >
                                <i className="bi bi-pencil-square"></i>
                              </button>
                              <button
                                className="rlm-action-delete"
                                onClick={() => handleDelete(role)}
                                disabled={role.isSystemRole}
                                title={
                                  role.isSystemRole ? "Cannot delete" : "Delete"
                                }
                              >
                                <i className="bi bi-trash3"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* TABLE PAGINATION */}
                <div className="rlm-pagination">
                  <div className="rlm-pagination-info">
                    <span>Show</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                    </select>
                    <span>entries</span>
                  </div>

                  <div className="rlm-pagination-status">
                    Showing {indexOfFirstItem + 1} to{" "}
                    {Math.min(indexOfLastItem, filteredRoles.length)} of{" "}
                    {filteredRoles.length}
                  </div>

                  <nav className="rlm-pagination-nav">
                    <ul className="rlm-pagination-list">
                      <li
                        className={`rlm-page-item ${
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
                          className={`rlm-page-item ${
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
                        className={`rlm-page-item ${
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
                </div>
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
