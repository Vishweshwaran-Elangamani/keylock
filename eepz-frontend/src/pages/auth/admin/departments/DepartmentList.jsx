import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import departmentService from "../../../../services/auth/departmentService";
import AddDepartmentModal from "../../../../components/auth/Modal/departments/AddDepartmentModal";
import EditDepartmentModal from "../../../../components/auth/Modal/departments/EditDepartmentModal";
import DeleteDepartmentModal from "../../../../components/auth/Modal/departments/DeleteDepartmentModal";
import Breadcrumb from "../../../../components/common/Breadcrumb";
import { toast } from "sonner";
import "../../../../styles/auth/department/DepartmentList.css";

const DepartmentList = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      // toast.loading("Loading departments...");

      const response = await departmentService.getAllDepartments();

      if (response.success) {
        setDepartments(response.data || []);
        toast.dismiss();
        // toast.success(
        //   `Loaded ${response.data?.length || 0} departments successfully`
        // );
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

  const filteredDepartments = departments.filter(
    (dept) =>
      dept.departmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const clearFilters = () => {
    setSearchTerm("");
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredDepartments.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage);

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

  const getDepartmentStats = () => {
    const totalDepartments = filteredDepartments.length;
    return { totalDepartments };
  };

  const stats = getDepartmentStats();

  if (loading) {
    return (
      <div className="loading-container-dept">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="department-management-page">
      {/* NEW BREADCRUMB COMPONENT */}
      <Breadcrumb
        items={[
          
          {
            label: "Department Management",
          },
        ]}
      />

      {/* COMPACT STATISTICS CARDS
      <div className="stats-cards-dept">
        <div className="stat-card-dept stat-total-dept">
          <div className="stat-icon-dept">
            <i className="bi bi-building-fill"></i>
          </div>
          <div className="stat-content-dept">
            <div className="stat-value-dept">{stats.totalDepartments}</div>
            <div className="stat-label-dept">Total Departments</div>
          </div>
        </div>

        <div className="stat-card-dept stat-active-dept">
          <div className="stat-icon-dept">
            <i className="bi bi-check-circle-fill"></i>
          </div>
          <div className="stat-content-dept">
            <div className="stat-value-dept">{departments.length}</div>
            <div className="stat-label-dept">Active</div>
          </div>
        </div>
      </div> */}

      {/* CONTROLS BAR */}
      <div className="controls-bar-dept">
        <div className="search-section-dept">
          <div className="search-input-wrapper-dept">
            <i className="bi bi-search"></i>
            <input
              type="text"
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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

        <button className="btn-clear-dept" onClick={clearFilters}>
          Clear Filters
        </button>

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
        <div className="results-count-inline-dept">
          Showing{" "}
          {viewMode === "table"
            ? currentItems.length
            : filteredDepartments.length}{" "}
          of {filteredDepartments.length} departments
        </div>

        <button
          className="btn-create-dept"
          onClick={() => setShowAddModal(true)}
        >
          <i className="bi bi-plus-circle"></i>
          Create Department
        </button>

        
      </div>

      {/* EMPTY STATE */}
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
          {/* GRID VIEW */}
          {viewMode === "grid" && (
            <div className="departments-grid-dept">
              {filteredDepartments.map((dept) => (
                <div key={dept.departmentId} className="department-card-item">
                  <div className="card-header-dept">
                    <div className="dept-icon-badge">
                      <i
                        className={`bi ${getDepartmentIcon(
                          dept.departmentName
                        )}`}
                      ></i>
                    </div>
                  </div>

                  <div className="card-body-dept">
                    <h3 className="dept-name-text">{dept.departmentName}</h3>
                  </div>

                  <div className="card-footer-dept">
                    <div className="dept-info-date">
                      <i className="bi bi-calendar3"></i>
                      <span>{formatDate(dept.createdAt)}</span>
                    </div>
                    <div className="card-actions-dept">
                      <button
                        className="action-btn action-btn-edit"
                        onClick={() => handleEdit(dept)}
                        title="Edit"
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="action-btn action-btn-delete"
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

          {/* TABLE VIEW */}
          {viewMode === "table" && (
            <>
              <div className="table-card-dept">
                <div className="table-wrapper-dept">
                  <table className="table-dept">
                    <thead>
                      <tr>
                        <th>Department Name</th>
                        <th>Created At</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((dept) => (
                        <tr key={dept.departmentId}>
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
                          <td>{formatDate(dept.createdAt)}</td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="action-btn action-btn-edit"
                                onClick={() => handleEdit(dept)}
                                title="Edit"
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button
                                className="action-btn action-btn-delete"
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

                {/* PAGINATION */}
                {filteredDepartments.length > 0 && (
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
                      {Math.min(indexOfLastItem, filteredDepartments.length)} of{" "}
                      {filteredDepartments.length} entries
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
