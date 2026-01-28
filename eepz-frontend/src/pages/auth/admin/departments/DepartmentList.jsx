import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import departmentService from "../../../../services/auth/departmentService";
import AddDepartmentModal from "../../../../components/auth/Modal/departments/AddDepartmentModal";
import EditDepartmentModal from "../../../../components/auth/Modal/departments/EditDepartmentModal";
import DeleteDepartmentModal from "../../../../components/auth/Modal/departments/DeleteDepartmentModal";
import Breadcrumb from "../../../../components/common/Breadcrumb";
import { toast } from "sonner";
import { FaSearch } from "react-icons/fa";
import { Form } from "react-bootstrap";
import "../../../../styles/auth/department/DepartmentList.css";

const StatusDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const options = [
    { label: "All Status", value: "All" },
    { label: "Active", value: "Active" },
    { label: "Inactive", value: "Inactive" },
  ];
  const selected = options.find((o) => o.value === value) || options[0];
  const handleSelect = (val) => {
    onChange({ target: { value: val } });
    setOpen(false);
  };
  return (
    <div
      className="dlm-status-select custom-status-dropdown"
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
              key={opt.value}
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

const DepartmentList = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewMode, setViewMode] = useState("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showRowsDropdown, setShowRowsDropdown] = useState(false);
  const rowsDropdownRef = useRef(null);

  useEffect(() => {
    fetchDepartments();
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

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await departmentService.getAllDepartments();
      if (response.success) {
        setDepartments(response.data || []);
        toast.dismiss();
      } else {
        toast.dismiss();
        toast.error(response.message || "Failed to load departments");
      }
    } catch (error) {
      console.error("Error loading departments:", error);
      toast.dismiss();
      toast.error(error.message || "Error loading departments");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (dept) => {
    setSelectedDepartment(dept);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      toast.loading("Deleting department...");
      const response = await departmentService.deleteDepartment(
        selectedDepartment.departmentId
      );
      if (response.success) {
        toast.dismiss();
        toast.success("Department deleted successfully");
        setShowDeleteModal(false);
        setSelectedDepartment(null);
        fetchDepartments();
      } else {
        toast.dismiss();
        toast.error(response.message || "Failed to delete department");
      }
    } catch (error) {
      console.error("Error deleting department:", error);
      toast.dismiss();
      toast.error(error.message || "Error deleting department");
    }
  };

  const handleEdit = (department) => {
    setSelectedDepartment(department);
    setShowEditModal(true);
  };

  const handleSearch = () => {
    setActiveSearchTerm(searchTerm);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setActiveSearchTerm("");
    setStatusFilter("All");
    setCurrentPage(1);
  };

  const applyFilters = () => {
    let filtered = [...departments];
    if (activeSearchTerm) {
      const term = activeSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (dept) =>
          dept.departmentName?.toLowerCase().includes(term) ||
          dept.departmentCode?.toLowerCase().includes(term) ||
          dept.description?.toLowerCase().includes(term)
      );
    }
    if (statusFilter !== "All") {
      filtered = filtered.filter((dept) => dept.status === statusFilter);
    }
    return filtered;
  };

  const filteredDepartments = applyFilters();
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredDepartments.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage) || 1;

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

  const getDeptStats = () => {
    const total = filteredDepartments.length;
    const active = filteredDepartments.filter(
      (d) => d.status === "Active"
    ).length;
    const inactive = filteredDepartments.filter(
      (d) => d.status === "Inactive"
    ).length;
    return {
      totalDepartments: total,
      activeDepartments: active,
      inactiveDepartments: inactive,
    };
  };

  const stats = getDeptStats();

  if (loading) {
    return (
      <div className="dlm-loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dlm-page">
      <Breadcrumb
        items={[
          {
            label: "Department Management",
          },
        ]}
      />

      {/* KPI CARDS */}
      <div className="stats-cards-dl">
        <div className="stat-card-dl stat-total-dl">
          <div className="stat-icon-dl">
            <i className="bi bi-diagram-3-fill"></i>
          </div>
          <div className="stat-content-dl">
            <div className="stat-value-dl">{stats.totalDepartments}</div>
            <div className="stat-label-dl">Total Departments</div>
          </div>
        </div>
        <div className="stat-card-dl stat-active-dl">
          <div className="stat-icon-dl">
            <i className="bi bi-check2-circle"></i>
          </div>
          <div className="stat-content-dl">
            <div className="stat-value-dl">{stats.activeDepartments}</div>
            <div className="stat-label-dl">Active</div>
          </div>
        </div>
        <div className="stat-card-dl stat-inactive-dl">
          <div className="stat-icon-dl">
            <i className="bi bi-slash-circle"></i>
          </div>
          <div className="stat-content-dl">
            <div className="stat-value-dl">{stats.inactiveDepartments}</div>
            <div className="stat-label-dl">Inactive</div>
          </div>
        </div>
      </div>

      {/* CONTROLS BAR */}
      <div className="dlm-controls">
        <div className="dlm-search-input">
          <div className="dlm-search-inner">
            <span className="dlm-search-icon">
              <FaSearch />
            </span>
            <Form.Control
              type="text"
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              className="dlm-search-field"
            />
            <button
              type="button"
              className="dlm-search-btn"
              onClick={handleSearch}
            >
              Search
            </button>
          </div>
        </div>

        <div className="dlm-status-filter">
          <StatusDropdown
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <button className="dlm-btn-clear" onClick={clearFilters}>
          Clear Filters
        </button>

        <div className="dlm-view-switcher">
          <button
            className={`dlm-view-btn ${viewMode === "table" ? "active" : ""}`}
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
            className={`dlm-view-btn ${viewMode === "grid" ? "active" : ""}`}
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

        <div className="dlm-results-count">
          Showing {currentItems.length} of {filteredDepartments.length}{" "}
          departments
        </div>

        <button
          className="dlm-btn-create"
          onClick={() => setShowAddModal(true)}
        >
          <i className="bi bi-plus-circle"></i>
          Create Department
        </button>
      </div>

      {/* EMPTY STATE */}
      {filteredDepartments.length === 0 ? (
        <div className="dlm-empty">
          <div className="dlm-empty-icon">
            <i className="bi bi-inbox"></i>
          </div>
          <h4>No departments found</h4>
          <p>
            {activeSearchTerm || statusFilter !== "All"
              ? "Adjust your search or clear filters"
              : "Create a new department to get started"}
          </p>
        </div>
      ) : (
        <>
          {/* GRID VIEW */}
          {viewMode === "grid" && (
            <>
              <div className="dlm-grid">
                {currentItems.map((dept) => (
                  <div key={dept.departmentId} className="dlm-card-modern">
                    {/* Card Header */}
                    <div className="dlm-card-header">
                      <div className="dlm-card-header-content">
                        <div className="dlm-card-badges">
                          {dept.status === "Active" ? (
                            <span className="dlm-badge-status-active">
                              <i className="bi bi-check-circle-fill"></i>
                              Active
                            </span>
                          ) : (
                            <span className="dlm-badge-status-inactive">
                              <i className="bi bi-x-circle-fill"></i>
                              Inactive
                            </span>
                          )}
                        </div>
                        <code className="dlm-card-code">
                          {dept.departmentCode}
                        </code>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="dlm-card-body">
                      <h6 className="dlm-card-title">{dept.departmentName}</h6>
                      <p className="dlm-card-description">
                        {dept.description || "No description available"}
                      </p>

                      {/* Meta Info */}
                      <div className="dlm-card-meta">
                        <div className="dlm-meta-item">
                          <i className="bi bi-diagram-3 dlm-meta-icon-primary"></i>
                          <span className="dlm-meta-text">
                            Parent:{" "}
                            <strong>
                              {dept.parentDepartmentName || "Root"}
                            </strong>
                          </span>
                        </div>
                        <div className="dlm-meta-item">
                          <i className="bi bi-person-badge dlm-meta-icon-secondary"></i>
                          <span className="dlm-meta-text">
                            HOD:{" "}
                            <strong>
                              {dept.hodEmployeeName || "Not assigned"}
                            </strong>
                          </span>
                        </div>
                        <div className="dlm-meta-item">
                          <i className="bi bi-diagram-3-fill dlm-meta-icon-info"></i>
                          <span className="dlm-meta-text">
                            Children:{" "}
                            <strong>
                              {dept.hasChildren
                                ? dept.childDepartmentCount
                                : "None"}
                            </strong>
                          </span>
                        </div>
                        <div className="dlm-meta-item-date">
                          <i className="bi bi-calendar-check-fill"></i>
                          <div className="dlm-date-content">
                            <div className="dlm-date-label">Created On</div>
                            <div className="dlm-date-value">
                              {formatDate(dept.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer - Actions */}
                    <div className="dlm-card-footer">
                      <button
                        onClick={() => handleEdit(dept)}
                        title="Edit Department"
                        className="dlm-action-edit"
                      >
                        <i className="bi bi-pencil-square"></i>
                      </button>
                      <button
                        onClick={() => handleDelete(dept)}
                        title="Delete Department"
                        className="dlm-action-delete"
                      >
                        <i className="bi bi-trash3"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* GRID PAGINATION WITH DROPDOWN (6, 9, 12, 18) */}
              {filteredDepartments.length > 0 && (
                <div className="dlm-pagination-wrapper">
                  <div className="dlm-pagination">
                    <div className="dlm-pagination-info">
                      <span>Show</span>
                      <div
                        ref={rowsDropdownRef}
                        className="dlm-rows-dropdown-wrapper"
                      >
                        <button
                          type="button"
                          onClick={() => setShowRowsDropdown(!showRowsDropdown)}
                          className="dlm-rows-button"
                        >
                          <span>{itemsPerPage}</span>
                          <i
                            className={`bi bi-chevron-${
                              showRowsDropdown ? "up" : "down"
                            } dlm-rows-chevron`}
                          ></i>
                        </button>
                        {showRowsDropdown && (
                          <div className="dlm-rows-dropdown">
                            {[6, 9, 12, 18].map((size) => (
                              <div
                                key={size}
                                onClick={() => {
                                  setItemsPerPage(size);
                                  setCurrentPage(1);
                                  setShowRowsDropdown(false);
                                }}
                                className={`dlm-rows-option ${
                                  itemsPerPage === size ? "dlm-rows-active" : ""
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

                    <div className="dlm-pagination-status">
                      Showing {indexOfFirstItem + 1} to{" "}
                      {Math.min(indexOfLastItem, filteredDepartments.length)} of{" "}
                      {filteredDepartments.length} entries
                    </div>

                    {totalPages > 1 && (
                      <nav className="dlm-pagination-nav">
                        <ul className="dlm-pagination-list">
                          <li
                            className={`dlm-page-item ${
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
                              className={`dlm-page-item ${
                                page === currentPage ? "active" : ""
                              } ${typeof page !== "number" ? "disabled" : ""}`}
                            >
                              <button
                                onClick={() =>
                                  typeof page === "number" &&
                                  setCurrentPage(page)
                                }
                                disabled={typeof page !== "number"}
                              >
                                {page}
                              </button>
                            </li>
                          ))}
                          <li
                            className={`dlm-page-item ${
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
                </div>
              )}
            </>
          )}

          {/* TABLE VIEW */}
          {viewMode === "table" && (
            <div className="dlm-table-card">
              <div className="dlm-table-wrapper">
                <table className="dlm-table">
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th>Code</th>
                      <th>Status</th>
                      <th>Parent Department</th>
                      <th>HOD</th>
                      <th>Children</th>
                      <th>Created At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((dept) => (
                      <tr key={dept.departmentId}>
                        <td>
                          <div className="dlm-table-dept-name">
                            <strong>{dept.departmentName}</strong>
                          </div>
                        </td>
                        <td>
                          <code>{dept.departmentCode}</code>
                        </td>
                        <td>
                          {dept.status === "Active" ? (
                            <span className="dlm-badge-table-active">
                              <i className="bi bi-check-circle-fill"></i>
                              Active
                            </span>
                          ) : (
                            <span className="dlm-badge-table-inactive">
                              <i className="bi bi-x-circle-fill"></i>
                              Inactive
                            </span>
                          )}
                        </td>
                        <td>
                          {dept.parentDepartmentName || "Root Department"}
                        </td>
                        <td>{dept.hodEmployeeName || "Not assigned"}</td>
                        <td>
                          {dept.hasChildren ? dept.childDepartmentCount : "−"}
                        </td>
                        <td>{formatDate(dept.createdAt)}</td>
                        <td>
                          <div className="dlm-table-actions">
                            <button
                              className="dlm-action-edit"
                              onClick={() => handleEdit(dept)}
                              title="Edit Department"
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>
                            <button
                              className="dlm-action-delete"
                              onClick={() => handleDelete(dept)}
                              title="Delete Department"
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

              {filteredDepartments.length > 0 && (
                <div className="dlm-pagination">
                  <div className="dlm-pagination-info">
                    <span>Show</span>
                    <div
                      ref={rowsDropdownRef}
                      className="dlm-rows-dropdown-wrapper"
                    >
                      <button
                        type="button"
                        onClick={() => setShowRowsDropdown(!showRowsDropdown)}
                        className="dlm-rows-button"
                      >
                        <span>{itemsPerPage}</span>
                        <i
                          className={`bi bi-chevron-${
                            showRowsDropdown ? "up" : "down"
                          } dlm-rows-chevron`}
                        ></i>
                      </button>
                      {showRowsDropdown && (
                        <div className="dlm-rows-dropdown">
                          {[5, 10, 25, 50].map((size) => (
                            <div
                              key={size}
                              onClick={() => {
                                setItemsPerPage(size);
                                setCurrentPage(1);
                                setShowRowsDropdown(false);
                              }}
                              className={`dlm-rows-option ${
                                itemsPerPage === size ? "dlm-rows-active" : ""
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

                  <div className="dlm-pagination-status">
                    Showing {indexOfFirstItem + 1} to{" "}
                    {Math.min(indexOfLastItem, filteredDepartments.length)} of{" "}
                    {filteredDepartments.length} entries
                  </div>

                  {totalPages > 1 && (
                    <nav className="dlm-pagination-nav">
                      <ul className="dlm-pagination-list">
                        <li
                          className={`dlm-page-item ${
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
                            className={`dlm-page-item ${
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
                          className={`dlm-page-item ${
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
        <AddDepartmentModal
          show={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchDepartments();
          }}
        />
      )}
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
