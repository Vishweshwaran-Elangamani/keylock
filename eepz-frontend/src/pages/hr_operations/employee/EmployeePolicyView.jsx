import { useState, useEffect, useRef } from "react";
import employeePolicyService from "../../../services/hr_operations/employee/employeePolicyService";
import PolicyDetailModal from "../../../components/hr_operations/modals/PolicyDetailModal";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { toast } from "sonner";
import "../../../styles/hr_operations/employee/EmployeePolicy.css";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [showRowsDropdown, setShowRowsDropdown] = useState(false);
  const searchInputRef = useRef(null);
  const rowsDropdownRef = useRef(null);

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
    <div className="employee-policy-page-epd">
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
        <div className="search-section-epd policy-search-revamp-epd">
          <div className="policy-search-input-epd">
            <div className="policy-search-inner-epd">
              <span className="policy-search-icon-epd">
                <i className="bi bi-search"></i>
              </span>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search policies..."
                value={searchTerm}
                onChange={handleSearchInput}
                onKeyDown={handleSearchKeyDown}
                className="policy-search-field-epd"
              />
              {searchTerm && (
                <button
                  type="button"
                  className="policy-clear-search-btn-epd"
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              )}
              <button
                type="button"
                className="policy-search-btn-epd"
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

        <div className="results-count-inline-epd">
          Showing {currentItems.length} of {filteredPolicies.length} policies
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
                      <div className="table-policy-name-epd">
                        <span>{policy.policyName}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge-category-epd">
                        {policy.category}
                      </span>
                    </td>
                    <td className="description-cell-epd">
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
                      <div className="action-buttons-epd">
                        <button
                          className="action-btn-epd action-btn-view-epd"
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
          {filteredPolicies.length > 0 && totalPages > 1 && (
            <div className="pagination-container-epd">
              <div className="pagination-info-epd">
                <span className="pagination-label-epd">Show</span>
                <div ref={rowsDropdownRef} className="rows-dropdown-wrapper-epd">
                  <button
                    type="button"
                    onClick={() => setShowRowsDropdown(!showRowsDropdown)}
                    className="rows-button-epd"
                  >
                    <span>{itemsPerPage}</span>
                    <i
                      className={`bi bi-chevron-${showRowsDropdown ? "up" : "down"} rows-chevron-epd`}
                    ></i>
                  </button>

                  {showRowsDropdown && (
                    <div className="rows-dropdown-epd">
                      {[5, 10, 25, 50].map((size) => (
                        <div
                          key={size}
                          onClick={() => {
                            setItemsPerPage(size);
                            setCurrentPage(1);
                            setShowRowsDropdown(false);
                          }}
                          className={`rows-option-epd ${
                            itemsPerPage === size ? "rows-active-epd" : ""
                          }`}
                        >
                          {size}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <span className="pagination-label-epd">entries</span>
              </div>

              <div className="pagination-status-epd">
                Showing {indexOfFirstItem + 1} to{" "}
                {Math.min(indexOfLastItem, filteredPolicies.length)} of{" "}
                {filteredPolicies.length} entries
              </div>

              <nav className="pagination-nav-epd">
                <ul className="pagination-epd">
                  <li
                    className={`page-item-epd ${
                      currentPage === 1 ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="page-link-epd"
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
                      className={`page-item-epd ${
                        page === currentPage ? "active" : ""
                      } ${typeof page !== "number" ? "disabled" : ""}`}
                    >
                      <button
                        className="page-link-epd"
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
                    className={`page-item-epd ${
                      currentPage === totalPages ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="page-link-epd"
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
