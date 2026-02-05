import { useState, useEffect, useRef } from "react";
import {
  Download,
  CheckCircle,
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
import CompleteAssignmentModal from "../../../components/lnd/modals/CompleteAssignmentModal";
import { lndService, downloadFile } from "../../../services/lnd/lndService";
import { ASSIGNMENT_STATUS } from "../../../constants/lnd/lndConstants";
import { toast } from "sonner";
import styles from "../../../styles/lnd/pages/assignments/TeamAssignments.module.css";
import { LND_TOASTS } from "../../../constants/lnd/lndToasts";

const TeamAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [rolePrefix, setRolePrefix] = useState("");
  const [expandedNotes, setExpandedNotes] = useState({});
  const [exporting, setExporting] = useState(false);

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
    fetchTeamAssignments();
  }, [
    currentPage,
    itemsPerPage,
    searchTerm,
    statusFilter,
    sortField,
    sortOrderAsc,
  ]);

  const fetchTeamAssignments = async () => {
    try {
      setLoading(true);
      const backendStatusFilter =
        statusFilter === ASSIGNMENT_STATUS.OVERDUE ? "" : statusFilter;
      const response = await lndService.getTeamAssignments({
        pageNumber: currentPage,
        statusFilter: backendStatusFilter,
        searchTerm: searchTerm,
        sortField: sortField,
        sortOrder: sortOrderAsc ? "asc" : "desc",
        pageSize: itemsPerPage,
      });
      if (response.data.success) {
        let items = response.data.data.items;
        if (statusFilter === ASSIGNMENT_STATUS.OVERDUE) {
          items = items.filter((a) => a.isOverdue === true);
        }
        setAssignments(items);
        setTotalItems(response.data.data.totalCount);
        setTotalPages(response.data.data.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch team assignments:", error);
      toast.error("Failed to load team assignments");
    } finally {
      setLoading(false);
    }
  };

  // NEW: Parse approver comments from JSON
  const parseApproverComments = (assignment) => {
    if (!assignment.completionNotes) return null;

    try {
      const parsed = JSON.parse(assignment.completionNotes);
      return {
        managerNotes: parsed.ManagerNotes || parsed.managerNotes || null,
        newDeadline: parsed.NewDeadline || parsed.newDeadline || null,
        requestNotes: parsed.RequestNotes || parsed.requestNotes || null,
        originalDeadline:
          parsed.OriginalDeadline || parsed.originalDeadline || null,
      };
    } catch (e) {
      // If not JSON, return as plain text
      return { managerNotes: assignment.completionNotes };
    }
  };

  const handleExportToExcel = async () => {
    try {
      setExporting(true);
      const response = await lndService.exportTeamAssignments({
        statusFilter:
          statusFilter === ASSIGNMENT_STATUS.OVERDUE ? "" : statusFilter,
        searchTerm: searchTerm,
        sortField: sortField,
        sortOrder: sortOrderAsc ? "asc" : "desc",
      });
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, -5);
      const filename = `TeamAssignments_${timestamp}.xlsx`;
      downloadFile(response.data, filename);
      toast.dismiss();
      toast.success(LND_TOASTS.EXCEL_EXPORTED_MESSAGE);
    } catch (error) {
      toast.dismiss();
      toast.error(LND_TOASTS.FAILED_TO_EXPORT);
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

  const handleCompleteAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setShowCompleteModal(true);
  };

  const handleCompleteSuccess = () => {
    setShowCompleteModal(false);
    toast.success(LND_TOASTS.ASSIGNMENT_COMPLETED_MESSAGE);
    fetchTeamAssignments();
  };

  const handleDownloadProof = async (assignment) => {
    try {
      const response = await lndService.downloadAssignmentProof(
        assignment.assignmentId
      );
      const filename = `${assignment.menteeName}_${assignment.skillName}_proof.pdf`;
      downloadFile(response.data, filename);
      toast.success(LND_TOASTS.DOWNLOAD_SUCCESS);
    } catch (error) {
      toast.error(LND_TOASTS.DOWNLOAD_FAILED);
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
      [ASSIGNMENT_STATUS.PENDING_MANAGER_ACKNOWLEDGEMENT]: "Your Review",
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
      label: "Your Review",
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
          { label: "Team Assignments" },
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

          {/* CUSTOM DROPDOWN */}
          <div ref={dropdownRef} className={styles.dropdownWrapper}>
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
              : "No assignments have been created for your team yet."
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
                    label: "Status",
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

              {assignments.map((assignment, idx) => {
                const approverComments = parseApproverComments(assignment);
                const hasComments =
                  approverComments && approverComments.managerNotes;

                return (
                  <div key={assignment.assignmentId}>
                    <div
                      className={`${styles.tableRow} ${styles.gridLayout} ${
                        idx < assignments.length - 1
                          ? styles.tableRowBorder
                          : ""
                      }`}
                    >
                      <div
                        className={styles.cellName}
                        title={assignment.menteeName}
                      >
                        {assignment.menteeName}
                      </div>
                      <div
                        className={styles.cellText}
                        title={assignment.skillName}
                      >
                        {assignment.skillName}
                      </div>
                      <div
                        className={`${styles.cellText} ${styles.cellSme}`}
                        title={assignment.smeName}
                      >
                        {assignment.smeName}
                      </div>
                      <div className={styles.cellCenter}>
                        <StatusBadge status={assignment.status} />
                      </div>
                      <div className={styles.cellDate}>
                        {assignment.createdOn ? (
                          new Date(assignment.createdOn).toLocaleDateString()
                        ) : (
                          <span className={styles.cellNone}>None</span>
                        )}
                      </div>
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
                      <div className={styles.cellScore}>
                        {assignment.completionRating ? (
                          `${assignment.completionRating}/10`
                        ) : (
                          <span className={styles.cellNone}>None</span>
                        )}
                      </div>
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
                      <div className={styles.cellCenter}>
                        {assignment.status ===
                        ASSIGNMENT_STATUS.PENDING_MANAGER_ACKNOWLEDGEMENT ? (
                          <button
                            onClick={() => handleCompleteAssignment(assignment)}
                            className={styles.completeButton}
                          >
                            <CheckCircle size={16} /> Complete
                          </button>
                        ) : hasComments ? (
                          <button
                            onClick={() =>
                              setExpandedNotes((prev) => ({
                                ...prev,
                                [assignment.assignmentId]:
                                  !prev[assignment.assignmentId],
                              }))
                            }
                            className={`${styles.notesButton} ${
                              expandedNotes?.[assignment.assignmentId]
                                ? styles.notesButtonExpanded
                                : ""
                            }`}
                            title={
                              expandedNotes?.[assignment.assignmentId]
                                ? "Hide notes"
                                : "Show notes"
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

                    {/* EXPANDED COMMENTS SECTION */}
                    {expandedNotes?.[assignment.assignmentId] &&
                      hasComments && (
                        <div className={styles.expandedRow}>
                          <div className={styles.commentsContainer}>
                            <h4 className={styles.commentsTitle}>
                              <i className="bi bi-chat-left-text me-2"></i>
                              Approver Comments
                            </h4>

                            {approverComments.requestNotes && (
                              <div className={styles.commentSection}>
                                <span className={styles.commentLabel}>
                                  Employee's Request:
                                </span>
                                <p className={styles.commentText}>
                                  {approverComments.requestNotes}
                                </p>
                              </div>
                            )}

                            <div className={styles.commentSection}>
                              <span className={styles.commentLabel}>
                                Approver's Response:
                              </span>
                              <p className={styles.commentText}>
                                {approverComments.managerNotes}
                              </p>
                            </div>

                            {approverComments.originalDeadline && (
                              <div className={styles.commentSection}>
                                <span className={styles.commentLabel}>
                                  Original Deadline:
                                </span>
                                <p className={styles.commentText}>
                                  {new Date(
                                    approverComments.originalDeadline
                                  ).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </p>
                              </div>
                            )}

                            {approverComments.newDeadline && (
                              <div className={styles.commentSection}>
                                <span className={styles.commentLabel}>
                                  New Deadline:
                                </span>
                                <p className={styles.commentText}>
                                  {new Date(
                                    approverComments.newDeadline
                                  ).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                );
              })}
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

      {showCompleteModal && (
        <CompleteAssignmentModal
          assignment={selectedAssignment}
          onClose={() => setShowCompleteModal(false)}
          onSuccess={handleCompleteSuccess}
        />
      )}
    </div>
  );
};

export default TeamAssignments;
