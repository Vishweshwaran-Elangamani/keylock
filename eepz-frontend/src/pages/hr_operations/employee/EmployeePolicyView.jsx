import { useState, useEffect } from "react";
import employeePolicyService from "../../../services/hr_operations/employee/employeePolicyService";
import PolicyDetailModal from "../../../components/hr_operations/modals/PolicyDetailModal";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { toast } from "sonner";
import "../../../styles/hr_operations/employee/EmployeePolicy.css";

const EmployeePolicyView = () => {
  const [policies, setPolicies] = useState([]);
  const [filteredPolicies, setFilteredPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDateFilter, setSelectedDateFilter] = useState("All");
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [searchTerm, setSearchTerm] = useState("");

  const categories = [
    "All",
    "Security",
    "Code of Conduct",
    "Attendance",
    "Leave",
    "Work Hours",
    "Remote Work",
    "Expense",
    "Health & Safety",
    "IT Policy",
    "Data Protection",
    "Compliance",
  ];

  const dateFilters = [
    { value: "All", label: "All Dates" },
    { value: "Today", label: "Today" },
    { value: "Last7Days", label: "Last 7 Days" },
    { value: "Last30Days", label: "Last 30 Days" },
    { value: "Last3Months", label: "Last 3 Months" },
    { value: "Last6Months", label: "Last 6 Months" },
    { value: "LastYear", label: "Last Year" },
  ];

  useEffect(() => {
    fetchPublishedPolicies();
  }, []);

  useEffect(() => {
    filterPolicies();
  }, [policies, selectedCategory, selectedDateFilter, searchTerm]);

  const fetchPublishedPolicies = async () => {
    try {
      setLoading(true);
      const response = await employeePolicyService.getPublishedPolicies();
      setPolicies(response);
    } catch (error) {
      console.error("Error fetching policies:", error);
      toast.error("Failed to load policies");
    } finally {
      setLoading(false);
    }
  };

  const isWithinDateRange = (publishedDate) => {
    if (selectedDateFilter === "All") return true;

    const published = new Date(publishedDate);
    const now = new Date();
    const diffTime = Math.abs(now - published);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    switch (selectedDateFilter) {
      case "Today":
        return diffDays === 0;
      case "Last7Days":
        return diffDays <= 7;
      case "Last30Days":
        return diffDays <= 30;
      case "Last3Months":
        return diffDays <= 90;
      case "Last6Months":
        return diffDays <= 180;
      case "LastYear":
        return diffDays <= 365;
      default:
        return true;
    }
  };

  const filterPolicies = () => {
    let filtered = policies;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.policyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== "All") {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    // Date filter
    filtered = filtered.filter((p) => isWithinDateRange(p.publishedAt));

    setFilteredPolicies(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleViewDetails = (policy) => {
    setSelectedPolicy(policy);
    setShowDetailModal(true);
  };

  const clearFilters = () => {
    setSelectedCategory("All");
    setSelectedDateFilter("All");
    setSearchTerm("");
    toast.info("Filters cleared");
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

  const getCategoryIcon = (category) => {
    const iconMap = {
      Security: "bi-shield-lock-fill",
      "Code of Conduct": "bi-person-check-fill",
      Attendance: "bi-calendar-check-fill",
      Leave: "bi-calendar-x-fill",
      "Work Hours": "bi-clock-fill",
      "Remote Work": "bi-house-fill",
      Expense: "bi-wallet2",
      "Health & Safety": "bi-heart-pulse-fill",
      "IT Policy": "bi-laptop-fill",
      "Data Protection": "bi-database-lock",
      Compliance: "bi-file-earmark-check-fill",
    };
    return iconMap[category] || "bi-file-text-fill";
  };

  const getCategoryStats = () => {
    const totalPolicies = filteredPolicies.length;
    const uniqueCategories = [
      ...new Set(filteredPolicies.map((p) => p.category)),
    ].length;
    const withDocuments = filteredPolicies.filter(
      (p) => p.documentUrl
    ).length;

    return { totalPolicies, uniqueCategories, withDocuments };
  };

  const stats = getCategoryStats();

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPolicies.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredPolicies.length / itemsPerPage);

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

  if (loading) {
    return (
      <div className="loading-container-epd">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="employee-policy-page">
      {/* BREADCRUMB */}
      <Breadcrumb
        items={[
          {
            label: "Company Policies",
          },
        ]}
      />

      {/* STATISTICS CARDS */}
      <div className="stats-cards-epd">
        <div className="stat-card-epd stat-total-epd">
          <div className="stat-icon-epd">
            <i className="bi bi-shield-check"></i>
          </div>
          <div className="stat-content-epd">
            <div className="stat-value-epd">{stats.totalPolicies}</div>
            <div className="stat-label-epd">Total Policies</div>
          </div>
        </div>

        <div className="stat-card-epd stat-categories-epd">
          <div className="stat-icon-epd">
            <i className="bi bi-folder-fill"></i>
          </div>
          <div className="stat-content-epd">
            <div className="stat-value-epd">{stats.uniqueCategories}</div>
            <div className="stat-label-epd">Categories</div>
          </div>
        </div>

        <div className="stat-card-epd stat-documents-epd">
          <div className="stat-icon-epd">
            <i className="bi bi-file-earmark-pdf-fill"></i>
          </div>
          <div className="stat-content-epd">
            <div className="stat-value-epd">{stats.withDocuments}</div>
            <div className="stat-label-epd">With Documents</div>
          </div>
        </div>
      </div>

      {/* CONTROLS BAR */}
      <div className="controls-bar-epd">
        <div className="search-section-epd">
          <div className="search-input-wrapper-epd">
            <i className="bi bi-search"></i>
            <input
              type="text"
              placeholder="Search policies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="clear-search-epd"
                onClick={() => setSearchTerm("")}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            )}
          </div>
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="filter-select-epd"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select
          value={selectedDateFilter}
          onChange={(e) => setSelectedDateFilter(e.target.value)}
          className="filter-select-epd"
        >
          {dateFilters.map((filter) => (
            <option key={filter.value} value={filter.value}>
              {filter.label}
            </option>
          ))}
        </select>

        <button className="btn-clear-epd" onClick={clearFilters}>
          Clear Filters
        </button>

        <div className="view-switcher-epd">
          <button
            className={`view-btn-epd ${viewMode === "grid" ? "active" : ""}`}
            onClick={() => setViewMode("grid")}
            title="Grid View"
          >
            <i className="bi bi-grid-3x3-gap-fill"></i>
          </button>
          <button
            className={`view-btn-epd ${viewMode === "table" ? "active" : ""}`}
            onClick={() => setViewMode("table")}
            title="Table View"
          >
            <i className="bi bi-table"></i>
          </button>
        </div>

        <div className="results-count-inline-epd">
          Showing{" "}
          {viewMode === "table" ? currentItems.length : filteredPolicies.length}{" "}
          of {filteredPolicies.length} policies
        </div>
      </div>

      {/* EMPTY STATE */}
      {filteredPolicies.length === 0 ? (
        <div className="empty-state-epd">
          <div className="empty-icon-epd">
            <i className="bi bi-inbox"></i>
          </div>
          <h4>No policies found</h4>
          <p>Adjust your search or filters</p>
        </div>
      ) : (
        <>
          {/* GRID VIEW */}
          {viewMode === "grid" && (
            <div className="policies-grid-epd">
              {filteredPolicies.map((policy) => (
                <div key={policy.policyId} className="policy-card-item">
                  <div className="card-header-epd">
                    <div
                      className="policy-icon-badge"
                      style={{
                        background: "#27235c",
                        boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
                      }}
                    >
                      <i className={`bi ${getCategoryIcon(policy.category)}`}></i>
                    </div>
                    <span className="category-badge-epd">{policy.category}</span>
                  </div>

                  <div className="card-body-epd">
                    <h3 className="policy-name-text">{policy.policyName}</h3>
                    <p className="policy-description-text">
                      {policy.description?.substring(0, 120)}
                      {policy.description?.length > 120 && "..."}
                    </p>

                    {policy.documentUrl && (
                      <div className="document-indicator-epd">
                        <i className="bi bi-file-earmark-pdf"></i>
                        <span>Document Available</span>
                      </div>
                    )}
                  </div>

                  <div className="card-footer-epd">
                    <div className="policy-info-date">
                      <i className="bi bi-calendar3"></i>
                      <span>{formatDate(policy.publishedAt)}</span>
                    </div>
                    <div className="card-actions-epd">
                      <button
                        className="action-btn action-btn-view"
                        onClick={() => handleViewDetails(policy)}
                        title="View Details"
                      >
                        <i className="bi bi-eye"></i>
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
              <div className="table-card-epd">
                <div className="table-wrapper-epd">
                  <table className="table-epd">
                    <thead>
                      <tr>
                        <th>Policy Name</th>
                        <th>Category</th>
                        <th>Description</th>
                        <th>Document</th>
                        <th>Published Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((policy) => (
                        <tr key={policy.policyId}>
                          <td>
                            <div className="table-policy-name">
                              <span>{policy.policyName}</span>
                            </div>
                          </td>
                          <td>
                            <span className="badge-category-epd">
                              {policy.category}
                            </span>
                          </td>
                          <td className="description-cell">
                            {policy.description || "N/A"}
                          </td>
                          <td>
                            {policy.documentUrl ? (
                              <span className="badge-document-epd">
                                <i className="bi bi-file-earmark-pdf"></i>
                                Available
                              </span>
                            ) : (
                              <span className="badge-no-document-epd">
                                None
                              </span>
                            )}
                          </td>
                          <td>{formatDate(policy.publishedAt)}</td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="action-btn action-btn-view"
                                onClick={() => handleViewDetails(policy)}
                                title="View Details"
                              >
                                <i className="bi bi-eye"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* PAGINATION */}
                {filteredPolicies.length > 0 && (
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
                        <option value="6">6</option>
                        <option value="12">12</option>
                        <option value="24">24</option>
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

      {/* POLICY DETAIL MODAL */}
      {showDetailModal && selectedPolicy && (
        <PolicyDetailModal
          show={showDetailModal}
          policy={selectedPolicy}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedPolicy(null);
          }}
        />
      )}
    </div>
  );
};

export default EmployeePolicyView;
