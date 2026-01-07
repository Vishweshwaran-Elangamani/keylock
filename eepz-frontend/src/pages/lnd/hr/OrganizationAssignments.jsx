import { useState, useEffect, useRef } from "react";
import {
  Download,
  Search,
  ChevronUp,
  ChevronDown,
  Filter,
  AlertTriangle,
} from "lucide-react";
import Breadcrumb from "../../../components/common/Breadcrumb";
import Pagination from "../../../components/lnd/common/Pagination";
import StatusBadge from "../../../components/lnd/common/StatusBadge";
import EmptyState from "../../../components/lnd/common/EmptyState";
import { lndService, downloadFile } from "../../../services/lnd/lndService";
import { ASSIGNMENT_STATUS } from "../../../constants/lnd/lndConstants";
import { toast } from "sonner";
import styles from "../../../styles/lnd/pages/hr/OrganizationAssignments.module.css";

const OrganizationAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Search
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Filter
  const [statusFilter, setStatusFilter] = useState("");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const statusDropdownRef = useRef(null);

  // Sorting
  const [sortField, setSortField] = useState("");
  const [sortOrderAsc, setSortOrderAsc] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target)
      ) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [
    currentPage,
    itemsPerPage,
    searchTerm,
    statusFilter,
    sortField,
    sortOrderAsc,
  ]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);

      const backendStatusFilter =
        statusFilter === ASSIGNMENT_STATUS.OVERDUE ? "" : statusFilter;

      const response = await lndService.getAllOrganizationAssignments(
        currentPage,
        backendStatusFilter,
        searchTerm,
        sortField,
        sortOrderAsc ? "asc" : "desc",
        itemsPerPage
      );

      if (response.data.success) {
        let items = response.data.data.items;

        // Client-side filtering for overdue
        if (statusFilter === ASSIGNMENT_STATUS.OVERDUE) {
          items = items.filter((a) => a.isOverdue === true);
        }

        setAssignments(items);
        setTotalItems(response.data.data.totalCount);
        setTotalPages(response.data.data.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch assignments:", error);
      toast.error("Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  const handleExportToExcel = async () => {
    try {
      setExporting(true);
      toast.loading("Preparing Excel export...");

      const response = await lndService.exportOrganizationAssignments(
        statusFilter === ASSIGNMENT_STATUS.OVERDUE ? "" : statusFilter, // Also handle overdue for export
        searchTerm,
        sortField,
        sortOrderAsc ? "asc" : "desc"
      );

      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, -5);
      const filename = `OrganizationalAssignments_${timestamp}.xlsx`;

      downloadFile(response.data, filename);

      toast.dismiss();
      toast.success("Excel file downloaded successfully!");
    } catch (error) {
      console.error("Failed to export:", error);
      toast.dismiss();
      toast.error("Failed to export assignments to Excel");
    } finally {
      setExporting(false);
    }
  };

  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  const handleCancelSearch = () => {
    setSearchInput("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearchSubmit(e);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleItemsPerPageChange = (newSize) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getStatusLabel = (value) => {
    const statusMap = {
      "": "All Statuses",
      [ASSIGNMENT_STATUS.IN_PROGRESS]: "In Progress",
      [ASSIGNMENT_STATUS.PENDING_SME_ACKNOWLEDGEMENT]: "SME Review",
      [ASSIGNMENT_STATUS.PENDING_MANAGER_ACKNOWLEDGEMENT]: "Manager Review",
      [ASSIGNMENT_STATUS.COMPLETED]: "Completed",
      [ASSIGNMENT_STATUS.OVERDUE]: "Overdue",
    };
    return statusMap[value] || "All Statuses";
  };

  const statusOptions = [
    { value: "", label: "All Statuses" },
    { value: ASSIGNMENT_STATUS.IN_PROGRESS, label: "In Progress" },
    {
      value: ASSIGNMENT_STATUS.PENDING_SME_ACKNOWLEDGEMENT,
      label: "SME Review",
    },
    {
      value: ASSIGNMENT_STATUS.PENDING_MANAGER_ACKNOWLEDGEMENT,
      label: "Manager Review",
    },
    { value: ASSIGNMENT_STATUS.COMPLETED, label: "Completed" },
    { value: ASSIGNMENT_STATUS.OVERDUE, label: "Overdue" },
  ];

  const onSortClick = (field) => {
    if (sortField === field) {
      setSortOrderAsc(!sortOrderAsc);
    } else {
      setSortField(field);
      setSortOrderAsc(true);
    }
    setCurrentPage(1);
  };

  const renderSortIcon = (field) => {
    const isActive = sortField === field;
    const iconClass = isActive
      ? styles.sortIconActive
      : styles.sortIconInactive;

    if (!isActive) {
      return (
        <ChevronUp size={14} className={`${styles.sortIcon} ${iconClass}`} />
      );
    }
    return sortOrderAsc ? (
      <ChevronUp size={14} className={`${styles.sortIcon} ${iconClass}`} />
    ) : (
      <ChevronDown size={14} className={`${styles.sortIcon} ${iconClass}`} />
    );
  };

  const getHeaderCellClass = (field, align) => {
    const baseClass = styles.tableHeaderCell;
    const alignClass =
      align === "center"
        ? styles.tableHeaderCellCenter
        : styles.tableHeaderCellLeft;
    const sortableClass = field ? styles.tableHeaderCellSortable : "";
    const activeClass = sortField === field ? styles.tableHeaderCellActive : "";
    return `${baseClass} ${alignClass} ${sortableClass} ${activeClass}`.trim();
  };

  const getDropdownItemClass = (currentValue, optionValue) => {
    return `${styles.dropdownItem} ${
      currentValue === optionValue ? styles.dropdownItemActive : ""
    }`.trim();
  };

  if (loading && assignments.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "LnD Dashboard", path: "/hr/lnd/dashboard", icon: "" },
          { label: "Organizational Assignments" },
        ]}
      />

      <div className={styles.actionBar}>
        <div className={styles.filterGroup}>
          <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
            <div className="input-group">
              <input
                type="text"
                className={`form-control ${styles.searchInput}`}
                placeholder="Search by employee or skill..."
                value={searchInput}
                onChange={handleSearchInputChange}
                onKeyPress={handleKeyPress}
              />
              {searchTerm ? (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handleCancelSearch}
                >
                  <i className="bi bi-x-lg me-1"></i>
                  Cancel
                </button>
              ) : (
                <button type="submit" className="btn btn-primary">
                  <i className="bi bi-search me-1"></i>
                  Search
                </button>
              )}
            </div>
          </form>

          {/* STATUS FILTER DROPDOWN */}
          <div ref={statusDropdownRef} className={styles.dropdownWrapper}>
            <button
              type="button"
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className={styles.dropdownButton}
            >
              <span>{getStatusLabel(statusFilter)}</span>
              <i
                className={`bi bi-chevron-${
                  showStatusDropdown ? "up" : "down"
                } ${styles.dropdownIcon}`}
              ></i>
            </button>

            {showStatusDropdown && (
              <div className={styles.dropdownMenu}>
                {statusOptions.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => {
                      setStatusFilter(option.value);
                      setCurrentPage(1);
                      setShowStatusDropdown(false);
                    }}
                    className={getDropdownItemClass(statusFilter, option.value)}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleExportToExcel}
          disabled={exporting || assignments.length === 0}
          className={` ${styles.exportButton}`}
        >
          {exporting ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              Exporting...
            </>
          ) : (
            <>
              <Download size={16} />
              Export to Excel
            </>
          )}
        </button>
      </div>

      {assignments.length === 0 && !loading ? (
        <EmptyState
          icon={Filter}
          title="No Assignments Found"
          message={
            searchTerm || statusFilter
              ? "No assignments match your current filters."
              : "No assignments have been created yet."
          }
        />
      ) : (
        <>
          <div
            className={`${styles.tableContainer} ${
              loading ? styles.tableContainerLoading : ""
            }`}
          >
            <div className={styles.tableWrapper}>
              <div className={`${styles.tableHeader} ${styles.gridLayout}`}>
                {[
                  {
                    label: "Employee Name",
                    field: "menteeName",
                    align: "left",
                  },
                  { label: "Skill Name", field: "skillName", align: "left" },
                  { label: "SME Assigned", field: "smeName", align: "left" },
                  {
                    label: "Assignment Status",
                    field: "status",
                    align: "center",
                  },
                  { label: "Start Date", field: "createdOn", align: "left" },
                  { label: "Due Date", field: "deadline", align: "left" },
                  {
                    label: "Score",
                    field: "completionRating",
                    align: "center",
                  },
                ].map(({ label, field, align }) => (
                  <div
                    key={field || label}
                    onClick={() => field && onSortClick(field)}
                    className={getHeaderCellClass(field, align)}
                  >
                    {label}
                    {field && renderSortIcon(field)}
                  </div>
                ))}
              </div>

              {assignments.map((assignment, idx) => (
                <div key={assignment.assignmentId}>
                  <div
                    className={`${styles.tableRow} ${styles.gridLayout} ${
                      idx < assignments.length - 1 ? styles.tableRowBorder : ""
                    }`}
                  >
                    {/* Employee Name */}
                    <div
                      className={styles.cellName}
                      title={assignment.menteeName}
                    >
                      {assignment.menteeName}
                    </div>

                    {/* Skill Name */}
                    <div
                      className={styles.cellText}
                      title={assignment.skillName}
                    >
                      {assignment.skillName}
                    </div>

                    {/* SME Assigned */}
                    <div
                      className={`${styles.cellText} ${styles.cellSme}`}
                      title={assignment.smeName}
                    >
                      {assignment.smeName}
                    </div>

                    {/* Assignment Status */}
                    <div className={styles.cellStatus}>
                      <StatusBadge status={assignment.status} />
                    </div>

                    {/* Start Date */}
                    <div className={styles.cellDate}>
                      {assignment.createdOn ? (
                        new Date(assignment.createdOn).toLocaleDateString()
                      ) : (
                        <span className={styles.cellNone}>None</span>
                      )}
                    </div>

                    {/* Due Date */}
                    <div
                      className={
                        assignment.isOverdue
                          ? styles.cellDateOverdue
                          : styles.cellDate
                      }
                    >
                      {assignment.deadline ? (
                        <>
                          {assignment.isOverdue && (
                            <AlertTriangle
                              size={14}
                              className={styles.overdueIcon}
                            />
                          )}
                          {new Date(assignment.deadline).toLocaleDateString()}
                        </>
                      ) : (
                        <span className={styles.cellNone}>None</span>
                      )}
                    </div>

                    {/* Score */}
                    <div className={styles.cellScore}>
                      {assignment.completionRating ? (
                        `${assignment.completionRating}/10`
                      ) : (
                        <span className={styles.cellNone}>None</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            loading={loading}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={handleItemsPerPageChange}
            pageSizeOptions={[5, 10, 25, 50]}
          />
        </>
      )}
    </div>
  );
};

export default OrganizationAssignments;
