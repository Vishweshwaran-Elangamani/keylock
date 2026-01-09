import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Form, Alert } from "react-bootstrap";
import { FaSearch } from "react-icons/fa";
import policyService from "../../../../services/hr_operations/hr/policyService";
import AddPolicyModal from "../../../../components/hr_operations/modals/AddPolicyModal";
import EditPolicyModal from "../../../../components/hr_operations/modals/EditPolicyModal";
import PublishPolicyModal from "../../../../components/hr_operations/modals/PublishPolicyModal";
import UnpublishPolicyModal from "../../../../components/hr_operations/modals/UnpublishPolicyModal";
import "../../../../styles/hr_operations/hr/PolicyManagement.css";
const PolicyStatusDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const options = [
    { label: "All Status", value: "" },
    { label: "Published", value: "Published" },
    { label: "Draft", value: "Draft" },
  ];
  const selected = options.find((o) => o.value === value) || options[0];
  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };
  return (
    <div
      className="pma-status-select custom-status-dropdown"
      tabIndex={0}
      onBlur={() => setTimeout(() => setOpen(false), 200)}
      style={{ position: "relative" }}
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
const PolicyCategoryDropdown = ({ value, onChange, categories }) => {
  const [open, setOpen] = useState(false);
  const allOptions = [
    { label: "All Categories", value: "" },
    ...categories.map((cat) => ({ label: cat, value: cat })),
  ];
  const selected = allOptions.find((o) => o.value === value) || allOptions[0];
  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };
  return (
    <div
      className="pma-category-select custom-status-dropdown"
      tabIndex={0}
      onBlur={() => setTimeout(() => setOpen(false), 200)}
      style={{ position: "relative" }}
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
              key={opt.value || "all-cat"}
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
const PolicyManagement = () => {
  const [policies, setPolicies] = useState([]);
  const [filteredPolicies, setFilteredPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showUnpublishModal, setShowUnpublishModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
  const [alert, setAlert] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showRowsDropdown, setShowRowsDropdown] = useState(false);
  const rowsDropdownRef = useRef(null);
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
  }, [policies, categoryFilter, statusFilter, activeSearchTerm]);
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
      showAlert("danger", "Failed to load policies");
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  };
  const handleSearch = () => {
    setActiveSearchTerm(searchTerm);
    setCurrentPage(1);
  };
  const applyFilters = () => {
    let filtered = [...policies];
    if (activeSearchTerm) {
      filtered = filtered.filter(
        (policy) =>
          policy.policyName?.toLowerCase().includes(activeSearchTerm.toLowerCase()) ||
          policy.description?.toLowerCase().includes(activeSearchTerm.toLowerCase())
      );
    }
    if (categoryFilter) {
      filtered = filtered.filter(
        (policy) => policy.category?.toLowerCase() === categoryFilter.toLowerCase()
      );
    }
    if (statusFilter) {
      const isPublished = statusFilter === "Published";
      filtered = filtered.filter((policy) => policy.isPublished === isPublished);
    }
    setFilteredPolicies(filtered);
    setCurrentPage(1);
  };
  const clearFilters = () => {
    setSearchTerm("");
    setActiveSearchTerm("");
    setCategoryFilter("");
    setStatusFilter("");
    setCurrentPage(1);
  };
  const uniqueCategories = [
    ...new Set(policies.map((policy) => policy.category).filter(Boolean)),
  ];
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPolicies.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPolicies.length / itemsPerPage) || 1;
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
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
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
  const handlePublishClick = (policy) => {
    setSelectedPolicy(policy);
    setShowPublishModal(true);
  };
  const handlePublishConfirm = async () => {
    if (!selectedPolicy) return;
    try {
      setPublishing(true);
      await policyService.publishPolicy(selectedPolicy.policyId);
      enqueueToast("success", "Policy published successfully!");
      setShowPublishModal(false);
      setSelectedPolicy(null);
      fetchPolicies();
    } catch (error) {
      enqueueToast("danger", "Failed to publish policy");
    } finally {
      setPublishing(false);
    }
  };
  const handleUnpublishClick = (policy) => {
    setSelectedPolicy(policy);
    setShowUnpublishModal(true);
  };
  const handleUnpublishConfirm = async () => {
    if (!selectedPolicy) return;
    try {
      setUnpublishing(true);
      await policyService.unpublishPolicy(selectedPolicy.policyId);
      enqueueToast("warning", "Policy unpublished - Now hidden from employees");
      setShowUnpublishModal(false);
      setSelectedPolicy(null);
      fetchPolicies();
    } catch (error) {
      enqueueToast("danger", "Failed to unpublish policy");
    } finally {
      setUnpublishing(false);
    }
  };
  const getPolicyStats = () => {
    const total = filteredPolicies.length;
    const published = filteredPolicies.filter((p) => p.isPublished).length;
    const draft = filteredPolicies.filter((p) => !p.isPublished).length;
    const categories = [...new Set(filteredPolicies.map((p) => p.category).filter(Boolean))].length;
    return {
      totalPolicies: total,
      publishedPolicies: published,
      draftPolicies: draft,
      totalCategories: categories,
    };
  };
  const stats = getPolicyStats();
  if (loading) {
    return (
      <div className="pma-loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  return (
    <div className="pma-page">
      {alert && (
        <Alert
          variant={alert.type}
          dismissible
          onClose={() => setAlert(null)}
          className="pma-alert"
        >
          {alert.message}
        </Alert>
      )}
      <div className="stats-cards-pma">
        <div className="stat-card-pma stat-total-pma">
          <div className="stat-icon-pma">
            <i className="bi bi-file-earmark-text"></i>
          </div>
          <div className="stat-content-pma">
            <div className="stat-value-pma">{stats.totalPolicies}</div>
            <div className="stat-label-pma">Total Policies</div>
          </div>
        </div>
        <div className="stat-card-pma stat-published-pma">
          <div className="stat-icon-pma">
            <i className="bi bi-check2-circle"></i>
          </div>
          <div className="stat-content-pma">
            <div className="stat-value-pma">{stats.publishedPolicies}</div>
            <div className="stat-label-pma">Published</div>
          </div>
        </div>
        <div className="stat-card-pma stat-draft-pma">
          <div className="stat-icon-pma">
            <i className="bi bi-pencil-square"></i>
          </div>
          <div className="stat-content-pma">
            <div className="stat-value-pma">{stats.draftPolicies}</div>
            <div className="stat-label-pma">Draft</div>
          </div>
        </div>
        <div className="stat-card-pma stat-categories-pma">
          <div className="stat-icon-pma">
            <i className="bi bi-grid-3x3-gap"></i>
          </div>
          <div className="stat-content-pma">
            <div className="stat-value-pma">{stats.totalCategories}</div>
            <div className="stat-label-pma">Categories</div>
          </div>
        </div>
      </div>
      <div className="pma-controls">
        <div className="pma-search-input">
          <div className="pma-search-inner">
            <span className="pma-search-icon">
              <FaSearch />
            </span>
            <Form.Control
              type="text"
              placeholder="Search policies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              className="pma-search-field"
            />
            <button
              type="button"
              className="pma-search-btn"
              onClick={handleSearch}
            >
              Search
            </button>
          </div>
        </div>
        <div className="pma-category-filter">
          <PolicyCategoryDropdown
            value={categoryFilter}
            onChange={(val) => {
              setCategoryFilter(val);
              setCurrentPage(1);
            }}
            categories={uniqueCategories}
          />
        </div>
        <div className="pma-status-filter">
          <PolicyStatusDropdown
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
          />
        </div>
        <button className="pma-btn-clear" onClick={clearFilters}>
          Clear Filters
        </button>
        <div className="pma-results-count">
          Showing {currentItems.length} of {filteredPolicies.length} policies
        </div>
        <button className="pma-btn-create" onClick={() => setShowAddModal(true)}>
          <i className="bi bi-plus-circle"></i>
          Add Policy
        </button>
      </div>
      <div className="pma-table-card">
        <div className="pma-table-wrapper">
          <table className="pma-table">
            <thead>
              <tr>
                <th>Policy Name</th>
                <th>Category</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan="5" className="pma-empty-state">
                    <div className="pma-empty-content">
                      <i className="bi bi-inbox"></i>
                      <h4>No policies found</h4>
                      <p>Try adjusting your search or filter criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentItems.map((policy) => (
                  <tr key={policy.policyId}>
                    <td>
                      <strong>{policy.policyName}</strong>
                    </td>
                    <td>
                      <span className="pma-category-badge">
                        {policy.category || "General"}
                      </span>
                    </td>
                    <td>
                      <div className="pma-description">
                        {policy.description?.substring(0, 60)}
                        {policy.description?.length > 60 && "..."}
                      </div>
                    </td>
                    <td>
                      {policy.isPublished ? (
                        <span className="pma-badge-table-active">Published</span>
                      ) : (
                        <span className="pma-badge-table-draft">Draft</span>
                      )}
                    </td>
                    <td>
                      <div className="pma-table-actions">
                        {!policy.isPublished && (
                          <button
                            className="pma-action-publish"
                            onClick={() => handlePublishClick(policy)}
                            title="Publish Policy"
                          >
                            <i className="bi bi-send"></i>
                          </button>
                        )}
                        {policy.isPublished && (
                          <button
                            className="pma-action-unpublish"
                            onClick={() => handleUnpublishClick(policy)}
                            title="Unpublish Policy"
                          >
                            <i className="bi bi-eye-slash"></i>
                          </button>
                        )}
                        <button
                          className="pma-action-edit"
                          onClick={() => handleView(policy)}
                          title="View/Edit Policy"
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && filteredPolicies.length > 0 && (
          <div className="pma-pagination">
            <div className="pma-pagination-info">
              <span>Show</span>
              <div ref={rowsDropdownRef} className="pma-rows-dropdown-wrapper">
                <button
                  type="button"
                  onClick={() => setShowRowsDropdown(!showRowsDropdown)}
                  className="pma-rows-button"
                >
                  <span>{itemsPerPage}</span>
                  <i
                    className={`bi bi-chevron-${showRowsDropdown ? "up" : "down"} pma-rows-chevron`}
                  ></i>
                </button>
                {showRowsDropdown && (
                  <div className="pma-rows-dropdown">
                    {[5, 10, 25, 50].map((size) => (
                      <div
                        key={size}
                        onClick={() => {
                          setItemsPerPage(size);
                          setCurrentPage(1);
                          setShowRowsDropdown(false);
                        }}
                        className={`pma-rows-option ${
                          itemsPerPage === size ? "pma-rows-active" : ""
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
            <div className="pma-pagination-status">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredPolicies.length)} of {filteredPolicies.length} entries
            </div>
            <nav className="pma-pagination-nav">
              <ul className="pma-pagination-list">
                <li className={`pma-page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                </li>
                {getPageNumbers().map((page, index) => (
                  <li
                    key={index}
                    className={`pma-page-item ${
                      page === currentPage ? "active" : ""
                    } ${typeof page !== "number" ? "disabled" : ""}`}
                  >
                    <button
                      onClick={() => typeof page === "number" && setCurrentPage(page)}
                      disabled={typeof page !== "number"}
                    >
                      {page}
                    </button>
                  </li>
                ))}
                <li className={`pma-page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
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
      {showAddModal && (
        <AddPolicyModal
          show={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
          onToast={enqueueToast}
        />
      )}
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
      {showPublishModal && selectedPolicy && (
        <PublishPolicyModal
          show={showPublishModal}
          policy={selectedPolicy}
          onHide={() => {
            setShowPublishModal(false);
            setSelectedPolicy(null);
          }}
          onPublish={handlePublishConfirm}
          publishing={publishing}
        />
      )}
      {showUnpublishModal && selectedPolicy && (
        <UnpublishPolicyModal
          show={showUnpublishModal}
          policy={selectedPolicy}
          onHide={() => {
            setShowUnpublishModal(false);
            setSelectedPolicy(null);
          }}
          onUnpublish={handleUnpublishConfirm}
          unpublishing={unpublishing}
        />
      )}
    </div>
  );
};
export default PolicyManagement;
