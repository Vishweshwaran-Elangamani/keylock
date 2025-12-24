import { useState, useEffect, useRef } from "react";
import employeePolicyService from "../../../services/hr_operations/employee/employeePolicyService";
import PolicyDetailModal from "../../../components/hr_operations/modals/PolicyDetailModal";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { toast } from "sonner";
import "../../../styles/hr_operations/employee/EmployeePolicy.css";

/* Custom Category Dropdown Component */
const CategoryDropdown = ({ value, onChange, categories }) => {
  const [open, setOpen] = useState(false);

  const selected = categories.find((cat) => cat === value) || categories[0];

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div
      className="filter-select-epd custom-category-dropdown-epd"
      tabIndex={0}
      onBlur={() => setTimeout(() => setOpen(false), 200)}
      style={{ position: "relative" }}
    >
      <div
        className="custom-category-selected-epd"
        onClick={() => setOpen((prev) => !prev)}
      >
        {selected}
        <span className="custom-category-arrow-epd" />
      </div>

      {open && (
        <div className="custom-category-menu-epd">
          {categories.map((cat) => (
            <div
              key={cat}
              className={
                "custom-category-option-epd" +
                (cat === value ? " custom-category-option-active-epd" : "")
              }
              onClick={() => handleSelect(cat)}
            >
              {cat}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* Custom Date Filter Dropdown Component */
const DateFilterDropdown = ({ value, onChange, dateFilters }) => {
  const [open, setOpen] = useState(false);

  const selected =
    dateFilters.find((filter) => filter.value === value) || dateFilters[0];

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div
      className="filter-select-epd custom-date-dropdown-epd"
      tabIndex={0}
      onBlur={() => setTimeout(() => setOpen(false), 200)}
      style={{ position: "relative" }}
    >
      <div
        className="custom-date-selected-epd"
        onClick={() => setOpen((prev) => !prev)}
      >
        {selected.label}
        <span className="custom-date-arrow-epd" />
      </div>

      {open && (
        <div className="custom-date-menu-epd">
          {dateFilters.map((filter) => (
            <div
              key={filter.value}
              className={
                "custom-date-option-epd" +
                (filter.value === value ? " custom-date-option-active-epd" : "")
              }
              onClick={() => handleSelect(filter.value)}
            >
              {filter.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

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
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef(null);

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
    applyFilters();
    // eslint-disable-next-line
  }, [policies, selectedCategory, selectedDateFilter]);

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

  const applyFilters = () => {
    let filtered = policies;

    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (p) =>
          p.policyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "All") {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    filtered = filtered.filter((p) => isWithinDateRange(p.publishedAt));

    setFilteredPolicies(filtered);
    setCurrentPage(1);
  };

  const handleSearchInput = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      applyFilters();
      if (searchInputRef.current) searchInputRef.current.blur();
    }
  };

  const handleSearchButton = () => {
    applyFilters();
    if (searchInputRef.current) searchInputRef.current.blur();
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setTimeout(() => applyFilters(), 0);
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  const clearFilters = () => {
    setSelectedCategory("All");
    setSelectedDateFilter("All");
    setSearchTerm("");
    setTimeout(() => {
      setFilteredPolicies(policies);
      setCurrentPage(1);
    }, 0);
    toast.info("Filters cleared");
    if (searchInputRef.current) searchInputRef.current.value = "";
  };

  useEffect(() => {
    if (searchTerm === "") applyFilters();
    // eslint-disable-next-line
  }, [searchTerm]);

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
    const withDocuments = filteredPolicies.filter((p) => p.documentUrl).length;

    return { totalPolicies, uniqueCategories, withDocuments };
  };

  const stats = getCategoryStats();

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPolicies.slice(indexOfFirstItem, indexOfLastItem);
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

  const handleViewDetails = (policy) => {
    setSelectedPolicy(policy);
    setShowDetailModal(true);
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
        <div className="search-section-epd policy-search-revamp">
          <div className="policy-search-input">
            <div className="policy-search-inner">
              <span className="policy-search-icon">
                <i className="bi bi-search"></i>
              </span>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by policy name, category or description..."
                value={searchTerm}
                onChange={handleSearchInput}
                onKeyDown={handleSearchKeyDown}
                className="policy-search-field"
              />
              {searchTerm && (
                <button
                  type="button"
                  className="policy-clear-search-btn"
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              )}
              <button
                type="button"
                className="policy-search-btn"
                onClick={handleSearchButton}
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Custom Category Dropdown */}
        <CategoryDropdown
          value={selectedCategory}
          onChange={(val) => setSelectedCategory(val)}
          categories={categories}
        />

        {/* Custom Date Filter Dropdown */}
        <DateFilterDropdown
          value={selectedDateFilter}
          onChange={(val) => setSelectedDateFilter(val)}
          dateFilters={dateFilters}
        />

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
          {/* GRID VIEW - MODERN DESIGN */}
          {viewMode === "grid" && (
            <div className="policies-grid-epd">
              {filteredPolicies.map((policy) => (
                <div
                  key={policy.policyId}
                  className="policy-card-modern"
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
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "8px",
                            background:
                              "linear-gradient(135deg, #27235c 0%, #1f1c4b 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#ffffff",
                            fontSize: "1rem",
                            boxShadow: "0 2px 8px rgba(39, 35, 92, 0.3)",
                          }}
                        >
                          <i
                            className={`bi ${getCategoryIcon(policy.category)}`}
                          ></i>
                        </div>
                        <span
                          className="badge"
                          style={{
                            background:
                              "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            fontSize: "10px",
                            fontWeight: 600,
                            padding: "0.35rem 0.6rem",
                            borderRadius: "6px",
                            boxShadow: "0 2px 8px rgba(102, 126, 234, 0.3)",
                          }}
                        >
                          {policy.category}
                        </span>
                      </div>

                      {policy.documentUrl && (
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 600,
                            padding: "0.35rem 0.6rem",
                            borderRadius: "6px",
                            background:
                              "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                            color: "#ffffff",
                            boxShadow: "0 2px 8px rgba(79, 172, 254, 0.3)",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                          }}
                        >
                          <i className="bi bi-file-earmark-pdf"></i> PDF
                        </span>
                      )}
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
                    {/* Policy Name */}
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
                      {policy.policyName}
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
                      {policy.description || "No description available"}
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
                          Published On
                        </div>
                        <div style={{ fontWeight: 600, color: "#212529" }}>
                          {formatDate(policy.publishedAt)}
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
                      onClick={() => handleViewDetails(policy)}
                      title="View Policy Details"
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
                      <i className="bi bi-eye"></i>
                    </button>
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
                                <i className="bi bi-file-earmark-pdf"></i> Available
                              </span>
                            ) : (
                              <span className="badge-no-document-epd">None</span>
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
                        <option value="5">5</option>
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
