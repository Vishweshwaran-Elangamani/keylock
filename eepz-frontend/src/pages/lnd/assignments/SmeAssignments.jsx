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
import styles from "../../../styles/lnd/pages/assignments/SmeAssignments.module.css";

const SmeAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const [rolePrefix, setRolePrefix] = useState("");
  const [expandedNotes, setExpandedNotes] = useState({});

  // Search
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Filter
  const [statusFilter, setStatusFilter] = useState("");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Sorting
  const [sortField, setSortField] = useState("");
  const [sortOrderAsc, setSortOrderAsc] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const roleName = user?.role || "";
    setUserRole(roleName);
    setRolePrefix(getRolePrefix(roleName));
  }, []);

  const getRolePrefix = (role) => {
    const prefixMap = {
      Manager: "/manager",
      "Department Head": "/department-head",
      Leadership: "/leadership",
      Employee: "/employee",
      HR: "/hr",
      Admin: "/admin",
    };
    return prefixMap[role] || "/employee";
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    fetchSmeAssignments();
  }, [
    currentPage,
    itemsPerPage,
    searchTerm,
    statusFilter,
    sortField,
    sortOrderAsc,
  ]);

  const fetchSmeAssignments = async () => {
    try {
      setLoading(true);

      // Pass empty string to backend when overdue is selected
      const backendStatusFilter =
        statusFilter === ASSIGNMENT_STATUS.OVERDUE ? "" : statusFilter;

      const response = await lndService.getSmeAssignments(
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
      console.error("Failed to fetch SME assignments:", error);
      toast.error("Failed to load SME assignments");
    } finally {
      setLoading(false);
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

  const handleDownloadProof = async (assignment) => {
    try {
      const response = await lndService.downloadAssignmentProof(
        assignment.assignmentId
      );
      const filename = `${assignment.menteeName}_${assignment.skillName}_proof.pdf`;
      downloadFile(response.data, filename);
      toast.success("File downloaded successfully");
    } catch (error) {
      console.error("Failed to download:", error);
      toast.error("Failed to download proof");
    }
  };

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

  const getStatusLabel = (value) => {
    const statusMap = {
      "": "All Statuses",
      [ASSIGNMENT_STATUS.IN_PROGRESS]: "In Progress",
      [ASSIGNMENT_STATUS.PENDING_SME_ACKNOWLEDGEMENT]: "SME Review",
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
    { value: ASSIGNMENT_STATUS.COMPLETED, label: "Completed" },
    { value: ASSIGNMENT_STATUS.OVERDUE, label: "Overdue" },
  ];

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
          { label: "LnD Dashboard", path: `${rolePrefix}/lnd/dashboard` },
          { label: "SME Assignments" },
        ]}
      />

      <div className={styles.filterContainer}>
        <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
          <div className="input-group">
            <input
              type="text"
              className={`form-control ${styles.searchInput}`}
              placeholder="Search by mentee or skill..."
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

        {/* CUSTOM DROPDOWN */}
        <div ref={dropdownRef} className={styles.dropdownWrapper}>
          <button
            type="button"
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            className={styles.dropdownButton}
          >
            <span>{getStatusLabel(statusFilter)}</span>
            <i
              className={`bi bi-chevron-${showStatusDropdown ? "up" : "down"} ${
                styles.dropdownIcon
              }`}
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

      {assignments.length === 0 && !loading ? (
        <EmptyState
          icon={Filter}
          title="No SME Assignments Found"
          message={
            searchTerm || statusFilter
              ? "No assignments match your current filters."
              : "You don't have any SME assignments yet."
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
              <div className={styles.tableHeader}>
                {[
                  { label: "Mentee Name", field: "menteeName", align: "left" },
                  { label: "Skill Name", field: "skillName", align: "left" },
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
                  { label: "Proof", field: null, align: "center" },
                  { label: "Comments", field: null, align: "center" },
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
                    className={`${styles.tableRow} ${
                      idx < assignments.length - 1 ? styles.tableRowBorder : ""
                    }`}
                  >
                    {/* Mentee Name */}
                    <div
                      className={styles.cellMenteeName}
                      title={assignment.menteeName}
                    >
                      {assignment.menteeName}
                    </div>

                    {/* Skill Name */}
                    <div
                      className={styles.cellSkillName}
                      title={assignment.skillName}
                    >
                      {assignment.skillName}
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

                    {/* Due Date - Overdue logic applied */}
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

                    {/* Proof */}
                    <div className={styles.cellCenter}>
                      {assignment.proofFilePath ? (
                        <button
                          onClick={() => handleDownloadProof(assignment)}
                          title="Download Proof"
                          className={styles.downloadButton}
                        >
                          <Download size={15} />
                        </button>
                      ) : (
                        <span className={styles.cellNone}>None</span>
                      )}
                    </div>

                    {/* Comments */}
                    <div className={styles.cellCenter}>
                      {assignment.completionNotes ? (
                        <button
                          onClick={() =>
                            setExpandedNotes((prev) => ({
                              ...prev,
                              [assignment.assignmentId]:
                                !prev[assignment.assignmentId],
                            }))
                          }
                          className={`${styles.commentsButton} ${
                            expandedNotes?.[assignment.assignmentId]
                              ? styles.commentsButtonExpanded
                              : ""
                          }`}
                          title={
                            expandedNotes?.[assignment.assignmentId]
                              ? "Hide comments"
                              : "Show comments"
                          }
                        >
                          {expandedNotes?.[assignment.assignmentId]
                            ? "Hide"
                            : "View"}
                        </button>
                      ) : (
                        <span className={styles.cellNone}>None</span>
                      )}
                    </div>
                  </div>

                  {/* Expanded Notes */}
                  {expandedNotes?.[assignment.assignmentId] &&
                    assignment.completionNotes && (
                      <div
                        className={`${styles.expandedNotes} ${
                          idx < assignments.length - 1
                            ? styles.expandedNotesBorder
                            : ""
                        }`}
                      >
                        <strong className={styles.notesLabel}>
                          Mentee's Completion Notes:
                        </strong>
                        {assignment.completionNotes}
                      </div>
                    )}
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

export default SmeAssignments;
