import { useState, useEffect } from "react";
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

  const allOptions = [
    { label: "All Status", value: "All" },
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
      className="dlm-status-select custom-dlm-dropdown"
      tabIndex={0}
      onBlur={() => setOpen(false)}
      onClick={() => setOpen((prev) => !prev)}
      style={{ position: "relative" }}
    >
      <div className="custom-dlm-selected">
        {selected.label}
        <span className="custom-dlm-arrow" />
      </div>
      {open && (
        <div className="custom-dlm-menu">
          {allOptions.map((opt) => (
            <div
              key={opt.value}
              className={
                "custom-dlm-option" +
                (opt.value === value ? " custom-dlm-option-active" : "")
              }
              onMouseDown={() => handleSelect(opt.value)}
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

  useEffect(() => {
    fetchDepartments();
  }, []);

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

  const filteredDepartments = departments.filter((dept) => {
    const term = activeSearchTerm.toLowerCase();
    const matchesSearch =
      dept.departmentName?.toLowerCase().includes(term) ||
      dept.departmentCode?.toLowerCase().includes(term) ||
      dept.description?.toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === "All" || dept.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
          {(activeSearchTerm || statusFilter !== "All") && (
            <button className="dlm-btn-clear" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* GRID VIEW */}
          {viewMode === "grid" && (
            <>
              <div className="dlm-grid">
                {currentItems.map((dept) => (
                  <div
                    key={dept.departmentId}
                    className="dlm-card-modern"
                    style={{
                      cursor: "pointer",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      border: "1px solid rgba(39, 35, 92, 0.75)",
                      borderRadius: "12px",
                      overflow: "hidden",
                      position: "relative",
                      background:
                        "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow =
                        "0 8px 24px rgba(0, 0, 0, 0.15)";
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.borderColor = "rgb(39, 35, 92)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow =
                        "0 2px 8px rgba(0, 0, 0, 0.08)";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.borderColor =
                        "rgba(39, 35, 92, 0.4)";
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
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: "16px",
                              color: "#27235C",
                            }}
                          >
                            {dept.departmentName}
                          </span>
                          <span
                            style={{
                              fontSize: "11px",
                              padding: "0.25rem 0.6rem",
                              borderRadius: "999px",
                              backgroundColor:
                                dept.status === "Active"
                                  ? "rgba(16, 185, 129, 0.1)"
                                  : "rgba(239, 68, 68, 0.1)",
                              color:
                                dept.status === "Active"
                                  ? "#047857"
                                  : "#b91c1c",
                              border:
                                dept.status === "Active"
                                  ? "1px solid rgba(16, 185, 129, 0.4)"
                                  : "1px solid rgba(239, 68, 68, 0.4)",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem",
                            }}
                          >
                            <i
                              className={
                                dept.status === "Active"
                                  ? "bi bi-check-circle-fill"
                                  : "bi bi-x-circle-fill"
                              }
                            ></i>
                            {dept.status}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "0.35rem 0.6rem",
                            borderRadius: "6px",
                            backgroundColor: "rgba(39, 35, 92, 0.06)",
                            color: "#27235C",
                            border: "1px solid rgba(39, 35, 92, 0.15)",
                            fontFamily: "monospace",
                          }}
                        >
                          {dept.departmentCode}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div
                      style={{
                        padding: "1.25rem",
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "14px",
                          color: "#6c757d",
                          lineHeight: 1.5,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          minHeight: "3.5rem",
                          marginBottom: "0.5rem",
                        }}
                      >
                        {dept.description || "No description available"}
                      </p>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.4rem",
                          marginTop: "auto",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            fontSize: "12px",
                            color: "#475569",
                          }}
                        >
                          <i
                            className="bi bi-diagram-3"
                            style={{ color: "#27235C" }}
                          ></i>
                          <span>
                            Parent:{" "}
                            {dept.parentDepartmentName || "Root Department"}
                          </span>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            fontSize: "12px",
                            color: "#475569",
                          }}
                        >
                          <i
                            className="bi bi-person-badge"
                            style={{ color: "#97247E" }}
                          ></i>
                          <span>
                            HOD: {dept.hodEmployeeName || "Not assigned"}
                          </span>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            fontSize: "12px",
                            color: "#475569",
                          }}
                        >
                          <i
                            className="bi bi-diagram-3-fill"
                            style={{ color: "#0d6efd" }}
                          ></i>
                          <span>
                            Children:{" "}
                            {dept.hasChildren
                              ? dept.childDepartmentCount
                              : "None"}
                          </span>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.75rem",
                            backgroundColor: "#f8f9fa",
                            borderRadius: "8px",
                            fontSize: "12px",
                            marginTop: "0.5rem",
                          }}
                        >
                          <i
                            className="bi bi-calendar-check-fill"
                            style={{ fontSize: "1.1rem", color: "#0d6efd" }}
                          ></i>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontSize: "11px",
                                color: "#6c757d",
                                marginBottom: "2px",
                              }}
                            >
                              Created On
                            </div>
                            <div
                              style={{ fontWeight: 600, color: "#212529" }}
                            >
                              {formatDate(dept.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
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
                        onClick={() => handleEdit(dept)}
                        title="Edit Department"
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
                          e.currentTarget.style.background =
                            "rgba(13, 110, 253, 0.1)";
                          e.currentTarget.style.borderColor = "#0d6efd";
                          e.currentTarget.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.borderColor =
                            "rgba(13, 110, 253, 0.3)";
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        <i className="bi bi-pencil-square"></i>
                      </button>

                      <button
                        onClick={() => handleDelete(dept)}
                        title="Delete Department"
                        style={{
                          width: "36px",
                          height: "36px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px solid rgba(220,53,69,0.3)",
                          borderRadius: "8px",
                          background: "transparent",
                          color: "#dc3545",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          fontSize: "0.95rem",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            "rgba(220, 53, 69, 0.1)";
                          e.currentTarget.style.borderColor = "#dc3545";
                          e.currentTarget.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.borderColor =
                            "rgba(220, 53, 69, 0.3)";
                          e.currentTarget.style.transform = "translateY(0)";
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
                <div className="dlm-pagination">
                  <div className="dlm-pagination-info">
                    <span>Show</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      <option value={6}>6</option>
                      <option value={9}>9</option>
                      <option value={12}>12</option>
                      <option value={18}>18</option>
                    </select>
                    <span>entries</span>
                  </div>

                  <div className="dlm-pagination-status">
                    Showing {indexOfFirstItem + 1} to{" "}
                    {Math.min(indexOfLastItem, filteredDepartments.length)} of{" "}
                    {filteredDepartments.length} entries
                  </div>

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
                </div>
              )}
            </>
          )}

          {/* TABLE VIEW */}
          {viewMode === "table" && (
            <>
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
                              <span>{dept.departmentName}</span>
                              {dept.description && (
                                <small>{dept.description}</small>
                              )}
                            </div>
                          </td>
                          <td>
                            <code>{dept.departmentCode}</code>
                          </td>
                          <td>
                            <span
                              className={
                                dept.status === "Active"
                                  ? "dlm-badge-table-active"
                                  : "dlm-badge-table-inactive"
                              }
                            >
                              {dept.status}
                            </span>
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

                {/* TABLE PAGINATION */}
                <div className="dlm-pagination">
                  <div className="dlm-pagination-info">
                    <span>Show</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                    <span>entries</span>
                  </div>

                  <div className="dlm-pagination-status">
                    Showing {indexOfFirstItem + 1} to{" "}
                    {Math.min(indexOfLastItem, filteredDepartments.length)} of{" "}
                    {filteredDepartments.length} entries
                  </div>

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
                </div>
              </div>
            </>
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
