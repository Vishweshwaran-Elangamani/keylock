import { useState, useEffect, useRef } from "react";
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

const RoleTypeDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const options = [
    { label: "All Types", value: "" },
    { label: "System Roles", value: "system" },
    { label: "Custom Roles", value: "custom" },
  ];
  const selected = options.find((o) => o.value === value) || options[0];
  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };
  return (
    <div
      className="rlm-type-select custom-status-dropdown"
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
  const [typeFilter, setTypeFilter] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showRowsDropdown, setShowRowsDropdown] = useState(false);
  const rowsDropdownRef = useRef(null);

  useEffect(() => {
    fetchRoles();
  }, []);

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

   useEffect(() => {
    const isAnyModalOpen = showAddModal || showEditModal || showDeleteModal;
    
    if (isAnyModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showAddModal, showEditModal, showDeleteModal]);

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
    if (role.isSystemRole) {
      toast.warning("System roles cannot be edited");
      return;
    }
    setSelectedRole(role);
    setShowEditModal(true);
  };

  const applyFilters = () => {
    let filtered = [...roles];
    if (activeSearchTerm) {
      filtered = filtered.filter(
        (role) =>
          role.roleName
            ?.toLowerCase()
            .includes(activeSearchTerm.toLowerCase()) ||
          role.roleCode
            ?.toLowerCase()
            .includes(activeSearchTerm.toLowerCase()) ||
          role.description
            ?.toLowerCase()
            .includes(activeSearchTerm.toLowerCase())
      );
    }
    if (typeFilter === "system") {
      filtered = filtered.filter((role) => role.isSystemRole === true);
    } else if (typeFilter === "custom") {
      filtered = filtered.filter((role) => role.isSystemRole === false);
    }
    return filtered;
  };

  const filteredRoles = applyFilters();

  const handleSearch = () => {
    setActiveSearchTerm(searchTerm);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setActiveSearchTerm("");
    setTypeFilter("");
    setCurrentPage(1);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRoles.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage) || 1;

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
        <div className="rlm-type-filter">
          <RoleTypeDropdown
            value={typeFilter}
            onChange={(val) => {
              setTypeFilter(val);
              setCurrentPage(1);
            }}
          />
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
        <button
          className="rlm-btn-create"
          onClick={() => setShowAddModal(true)}
        >
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
                  <div key={role.roleId} className="rlm-card-modern">
                    {/* Card Header */}
                    <div className="rlm-card-header">
                      <div className="rlm-card-header-content">
                        <div className="rlm-card-badges">
                          {role.isSystemRole ? (
                            <span className="rlm-badge-status-system">
                              <i className="bi bi-shield-check"></i>
                              System
                            </span>
                          ) : (
                            <span className="rlm-badge-status-custom">
                              <i className="bi bi-gear-fill"></i>
                              Custom
                            </span>
                          )}
                        </div>
                        <code className="rlm-card-code">{role.roleCode}</code>
                      </div>
                    </div>
                    {/* Card Body */}
                    <div className="rlm-card-body">
                      <h6 className="rlm-card-title">{role.roleName}</h6>
                      <p className="rlm-card-description">
                        {role.description || "No description available"}
                      </p>
                      {/* Meta Info */}
                      <div className="rlm-card-meta">
                        <div className="rlm-meta-item-date">
                          <i className="bi bi-calendar-check-fill"></i>
                          <div className="rlm-date-content">
                            <div className="rlm-date-label">Created On</div>
                            <div className="rlm-date-value">
                              {formatDate(role.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Card Footer - Actions */}
                    <div className="rlm-card-footer">
                      {role.isSystemRole ? (
                        <button
                          disabled
                          title="Cannot edit system role"
                          className="rlm-action-disabled"
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEdit(role)}
                          title="Edit Role"
                          className="rlm-action-edit"
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>
                      )}
                      {role.isSystemRole ? (
                        <button
                          disabled
                          title="Cannot delete system role"
                          className="rlm-action-disabled"
                        >
                          <i className="bi bi-trash3"></i>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDelete(role)}
                          title="Delete Role"
                          className="rlm-action-delete"
                        >
                          <i className="bi bi-trash3"></i>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* GRID PAGINATION - WITH DROPDOWN (6, 9, 12, 18) */}
              {filteredRoles.length > 0 && (
                <div className="rlm-pagination-wrapper">
                  <div className="rlm-pagination">
                    <div className="rlm-pagination-info">
                      <span>Show</span>
                      <div
                        ref={rowsDropdownRef}
                        className="rlm-rows-dropdown-wrapper"
                      >
                        <button
                          type="button"
                          onClick={() => setShowRowsDropdown(!showRowsDropdown)}
                          className="rlm-rows-button"
                        >
                          <span>{itemsPerPage}</span>
                          <i
                            className={`bi bi-chevron-${
                              showRowsDropdown ? "up" : "down"
                            } rlm-rows-chevron`}
                          ></i>
                        </button>
                        {showRowsDropdown && (
                          <div className="rlm-rows-dropdown">
                            {[6, 9, 12, 18].map((size) => (
                              <div
                                key={size}
                                onClick={() => {
                                  setItemsPerPage(size);
                                  setCurrentPage(1);
                                  setShowRowsDropdown(false);
                                }}
                                className={`rlm-rows-option ${
                                  itemsPerPage === size ? "rlm-rows-active" : ""
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
                    <div className="rlm-pagination-status">
                      Showing {indexOfFirstItem + 1} to{" "}
                      {Math.min(indexOfLastItem, filteredRoles.length)} of{" "}
                      {filteredRoles.length} entries
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
              )}
            </>
          )}

          {/* TABLE VIEW */}
          {viewMode === "table" && (
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
                            {role.isSystemRole ? (
                              <button
                                className="rlm-action-disabled"
                                disabled
                                title="Cannot edit system role"
                              >
                                <i className="bi bi-pencil-square"></i>
                              </button>
                            ) : (
                              <button
                                className="rlm-action-edit"
                                onClick={() => handleEdit(role)}
                                title="Edit"
                              >
                                <i className="bi bi-pencil-square"></i>
                              </button>
                            )}
                            {role.isSystemRole ? (
                              <button
                                className="rlm-action-disabled"
                                disabled
                                title="Cannot delete system role"
                              >
                                <i className="bi bi-trash3"></i>
                              </button>
                            ) : (
                              <button
                                className="rlm-action-delete"
                                onClick={() => handleDelete(role)}
                                title="Delete"
                              >
                                <i className="bi bi-trash3"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredRoles.length > 0 && (
                <div className="rlm-pagination">
                  <div className="rlm-pagination-info">
                    <span>Show</span>
                    <div
                      ref={rowsDropdownRef}
                      className="rlm-rows-dropdown-wrapper"
                    >
                      <button
                        type="button"
                        onClick={() => setShowRowsDropdown(!showRowsDropdown)}
                        className="rlm-rows-button"
                      >
                        <span>{itemsPerPage}</span>
                        <i
                          className={`bi bi-chevron-${
                            showRowsDropdown ? "up" : "down"
                          } rlm-rows-chevron`}
                        ></i>
                      </button>
                      {showRowsDropdown && (
                        <div className="rlm-rows-dropdown">
                          {[5, 10, 25, 50].map((size) => (
                            <div
                              key={size}
                              onClick={() => {
                                setItemsPerPage(size);
                                setCurrentPage(1);
                                setShowRowsDropdown(false);
                              }}
                              className={`rlm-rows-option ${
                                itemsPerPage === size ? "rlm-rows-active" : ""
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
                  <div className="rlm-pagination-status">
                    Showing {indexOfFirstItem + 1} to{" "}
                    {Math.min(indexOfLastItem, filteredRoles.length)} of{" "}
                    {filteredRoles.length} entries
                  </div>
                  {totalPages > 1 && (
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
                  )}
                </div>
              )}
            </div>
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
