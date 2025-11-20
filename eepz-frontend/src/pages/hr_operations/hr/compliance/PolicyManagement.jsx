import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Form, InputGroup, Button } from "react-bootstrap";
import { FaSearch } from "react-icons/fa";
import policyService from "../../../../services/hr_operations/hr/policyService";
import AddPolicyModal from "../../../../components/hr_operations/modals/AddPolicyModal";
import EditPolicyModal from "../../../../components/hr_operations/modals/EditPolicyModal";
import { Alert, Spinner } from "react-bootstrap";
import "../../../../styles/hr_operations/hr/policyManagement.css";

const PolicyManagement = () => {
  const [policies, setPolicies] = useState([]);
  const [filteredPolicies, setFilteredPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [alert, setAlert] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Sonner toast function
  const enqueueToast = (variant, message) => {
    switch (variant) {
      case "success":
        toast.success(message);
        break;
      case "danger":
      case "error":
        toast.error(message);
        break;
      case "warning":
        toast.warning(message);
        break;
      case "info":
        toast.info(message);
        break;
      default:
        toast(message);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [policies, searchTerm, categoryFilter, statusFilter]);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  };

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const response = await policyService.getAllPolicies();
      setPolicies(response || []);
    } catch (error) {
      console.error("Error fetching policies:", error);
      showAlert("danger", "Failed to load policies");
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...policies];

    if (searchTerm) {
      filtered = filtered.filter(
        (policy) =>
          policy.policyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          policy.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(
        (policy) =>
          policy.category?.toLowerCase() === categoryFilter.toLowerCase()
      );
    }

    if (statusFilter) {
      const isPublished = statusFilter === "Published";
      filtered = filtered.filter(
        (policy) => policy.isPublished === isPublished
      );
    }

    setFilteredPolicies(filtered);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("");
    setStatusFilter("");
  };

  const uniqueCategories = [
    ...new Set(policies.map((policy) => policy.category).filter(Boolean)),
  ];

  // Pagination helpers
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredPolicies.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredPolicies.length / rowsPerPage);

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

  const handleAddSuccess = () => {
    setShowAddModal(false);
    fetchPolicies();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedPolicy(null);
    fetchPolicies();
  };

  const handleView = (policy) => {
    setSelectedPolicy(policy);
    setShowEditModal(true);
  };

  const handleDelete = async (policyId) => {
    try {
      await policyService.deletePolicy(policyId);
      enqueueToast("success", "Policy deleted successfully!");
      fetchPolicies();
    } catch (error) {
      enqueueToast("danger", "Failed to delete policy");
    }
  };

  const handlePublish = async (policyId) => {
    try {
      await policyService.publishPolicy(policyId);
      enqueueToast("success", "Policy published successfully!");
      fetchPolicies();
    } catch (error) {
      console.error("Error publishing policy:", error);
      enqueueToast("danger", "Failed to publish policy");
    }
  };

  const handleUnpublish = async (policyId) => {
    try {
      await policyService.unpublishPolicy(policyId);
      enqueueToast("warning", "Policy unpublished - Now hidden from employees");
      fetchPolicies();
    } catch (error) {
      console.error("Error unpublishing policy:", error);
      enqueueToast("danger", "Failed to unpublish policy");
    }
  };

  if (loading) {
    return (
      <div className="pm-loading-container">
        <Spinner animation="border" variant="primary" />
        <p>Loading policies...</p>
      </div>
    );
  }

  return (
    <div className="pm-root">
      {alert && (
        <Alert
          variant={alert.type}
          dismissible
          onClose={() => setAlert(null)}
          className="pm-alert"
        >
          {alert.message}
        </Alert>
      )}

      {/* Filter Section with Add Button */}
      <div className="pm-filter-section">
        <div className="pm-filter-row-single">
          <InputGroup className="pm-search-input">
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search by policy name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>

          <Form.Select
            className="pm-filter-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {uniqueCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Form.Select>

          <Form.Select
            className="pm-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
          </Form.Select>

          <Button
            variant="outline-secondary"
            onClick={clearFilters}
            className="pm-clear-btn"
          >
            Clear Filters
          </Button>
          <div className="pm-results-count-inline">
            Showing {currentItems.length} of {filteredPolicies.length} policies
          </div>

          <button className="pm-btn-add" onClick={() => setShowAddModal(true)}>
            <i className="bi bi-plus-circle"></i>
            Add Policy
          </button>
        </div>
      </div>

      {/* Policies Table */}
      <div className="table-card">
        <div className="table-wrapper">
          <table className="pm-table">
            <thead>
              <tr>
                <th>POLICY NAME</th>
                <th>CATEGORY</th>
                <th>DESCRIPTION</th>
                <th>STATUS</th>
                <th className="text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-state">
                    <i className="bi bi-inbox"></i>
                    <p>No policies found matching your filters</p>
                    <button
                      className="pm-btn-add-small"
                      onClick={() => setShowAddModal(true)}
                    >
                      Create Your First Policy
                    </button>
                  </td>
                </tr>
              ) : (
                currentItems.map((policy) => (
                  <tr key={policy.policyId}>
                    <td>
                      <strong>{policy.policyName}</strong>
                    </td>
                    <td>
                      <span className="pm-category-badge">
                        {policy.category || "General"}
                      </span>
                    </td>
                    <td>
                      <div className="pm-description">
                        {policy.description?.substring(0, 60)}
                        {policy.description?.length > 60 && "..."}
                      </div>
                    </td>
                    <td>
                      {policy.isPublished ? (
                        <span className="pm-status-badge pm-status-active">
                          Published
                        </span>
                      ) : (
                        <span className="pm-status-badge pm-status-draft">
                          Draft
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        {!policy.isPublished && (
                          <button
                            className="action-btn action-btn-publish"
                            onClick={() => handlePublish(policy.policyId)}
                            title="Publish Policy"
                          >
                            <i className="bi bi-send"></i>
                          </button>
                        )}

                        {policy.isPublished && (
                          <button
                            className="action-btn action-btn-unpublish"
                            onClick={() => handleUnpublish(policy.policyId)}
                            title="Unpublish Policy"
                          >
                            <i className="bi bi-eye-slash"></i>
                          </button>
                        )}

                        <button
                          className="action-btn action-btn-edit"
                          onClick={() => handleView(policy)}
                          title="View/Edit Policy"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>

                        <button
                          className="action-btn action-btn-delete"
                          onClick={() => handleDelete(policy.policyId)}
                          title="Delete Policy"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredPolicies.length > 0 && (
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
              Showing {indexOfFirstItem + 1} to{" "}
              {Math.min(indexOfLastItem, filteredPolicies.length)} of{" "}
              {filteredPolicies.length} entries
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

      {/* Blur overlay when modal is open */}
      {(showAddModal || showEditModal) && (
        <div className="pm-blur-backdrop"></div>
      )}

      {/* Add Policy Modal */}
      {showAddModal && (
        <AddPolicyModal
          show={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
          onToast={enqueueToast}
        />
      )}

      {/* Edit Policy Modal */}
      {showEditModal && selectedPolicy && (
        <EditPolicyModal
          show={showEditModal}
          policy={selectedPolicy}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPolicy(null);
          }}
          onSuccess={handleEditSuccess}
          onDelete={handleDelete}
          onToast={enqueueToast}
        />
      )}
    </div>
  );
};

export default PolicyManagement;
