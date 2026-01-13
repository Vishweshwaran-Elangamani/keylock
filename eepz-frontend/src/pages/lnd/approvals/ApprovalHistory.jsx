import { useState, useEffect, useRef } from "react";
import { Download, Filter, ChevronUp, ChevronDown, Search } from "lucide-react";
import Breadcrumb from "../../../components/common/Breadcrumb";
import Pagination from "../../../components/lnd/common/Pagination";
import StatusBadge from "../../../components/lnd/common/StatusBadge";
import EmptyState from "../../../components/lnd/common/EmptyState";
import { lndService, downloadFile } from "../../../services/lnd/lndService";
import {
  APPROVAL_TYPE,
  APPROVAL_STATUS,
} from "../../../constants/lnd/lndConstants";
import { toast } from "sonner";
import styles from "../../../styles/lnd/pages/approvals/ApprovalHistory.module.css";
import { LND_TOASTS } from "../../../constants/lnd/lndToasts";

const ApprovalHistory = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const [rolePrefix, setRolePrefix] = useState("");
  const [expandedNotes, setExpandedNotes] = useState({});

  // Search
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Filters
  const [roleFilter, setRoleFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Dropdown states
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Dropdown refs
  const roleDropdownRef = useRef(null);
  const typeDropdownRef = useRef(null);
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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        roleDropdownRef.current &&
        !roleDropdownRef.current.contains(event.target)
      ) {
        setShowRoleDropdown(false);
      }
      if (
        typeDropdownRef.current &&
        !typeDropdownRef.current.contains(event.target)
      ) {
        setShowTypeDropdown(false);
      }
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
    fetchApprovalHistory();
  }, [
    currentPage,
    itemsPerPage,
    searchTerm,
    roleFilter,
    typeFilter,
    statusFilter,
    sortField,
    sortOrderAsc,
  ]);

  const fetchApprovalHistory = async () => {
    try {
      setLoading(true);

      // UPDATED: Pass parameters as an object
      const response = await lndService.getApprovalHistory({
        pageNumber: currentPage,
        role: roleFilter,
        approvalType: typeFilter,
        status: statusFilter,
        searchTerm: searchTerm,
        sortField: sortField,
        sortOrder: sortOrderAsc ? "asc" : "desc",
        pageSize: itemsPerPage,
      });

      if (response.data.success) {
        setApprovals(response.data.data.items);
        setTotalItems(response.data.data.totalCount);
        setTotalPages(response.data.data.totalPages);
      }
    } catch (error) {
      toast.error(LND_TOASTS.FAILED_TO_LOAD_APPROVAL_HISTORY);
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

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearchSubmit(e);
    }
  };

  const handleCancelSearch = () => {
    setSearchInput("");
    setSearchTerm("");
    setCurrentPage(1);
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

  const handleDownload = async (approval) => {
    try {
      const response = await lndService.downloadApprovalAttachment(
        approval.approvalId
      );
      const typeLabel = getApprovalTypeLabel(approval.approvalType);
      const filename = `${approval.requesterName}_${typeLabel}${approval.approvalId}`;
      downloadFile(response.data, filename);
      toast.success(LND_TOASTS.DOWNLOAD_SUCCESS);
    } catch (error) {
      toast.error(LND_TOASTS.DOWNLOAD_FAILED);
    }
  };

  const getApprovalTypeLabel = (type) => {
    const labels = {
      [APPROVAL_TYPE.SME_REGISTRATION]: "SME Registration",
      [APPROVAL_TYPE.SME_REQUEST]: "SME Request",
      [APPROVAL_TYPE.ASSIGNMENT_ACKNOWLEDGEMENT]: "Assignment Acknowledgement",
      [APPROVAL_TYPE.ASSIGNMENT_COMPLETION]: "Assignment Completion",
    };
    return labels[type] || type;
  };

  const getRoleLabel = (value) => {
    const roleMap = {
      all: "All Roles",
      requester: "As Requester",
      approver: "As Approver",
    };
    return roleMap[value] || "All Roles";
  };

  const getTypeLabel = (value) => {
    if (!value) return "All Types";
    return getApprovalTypeLabel(value);
  };

  const getStatusLabel = (value) => {
    const statusMap = {
      "": "All Statuses",
      [APPROVAL_STATUS.APPROVED]: "Approved",
      [APPROVAL_STATUS.REJECTED]: "Rejected",
      [APPROVAL_STATUS.PENDING]: "Pending",
    };
    return statusMap[value] || "All Statuses";
  };

  const roleOptions = [
    { value: "all", label: "All Roles" },
    { value: "requester", label: "As Requester" },
    { value: "approver", label: "As Approver" },
  ];

  const typeOptions = [
    { value: "", label: "All Types" },
    { value: APPROVAL_TYPE.SME_REGISTRATION, label: "SME Registration" },
    { value: APPROVAL_TYPE.SME_REQUEST, label: "SME Request" },
    {
      value: APPROVAL_TYPE.ASSIGNMENT_ACKNOWLEDGEMENT,
      label: "Assignment Acknowledgement",
    },
    {
      value: APPROVAL_TYPE.ASSIGNMENT_COMPLETION,
      label: "Assignment Completion",
    },
  ];

  const statusOptions = [
    { value: "", label: "All Statuses" },
    { value: APPROVAL_STATUS.APPROVED, label: "Approved" },
    { value: APPROVAL_STATUS.REJECTED, label: "Rejected" },
    { value: APPROVAL_STATUS.PENDING, label: "Pending" },
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

  const getHeaderCellClass = (field) => {
    const baseClass = styles.tableHeaderCell;
    const sortableClass = field ? styles.tableHeaderCellSortable : "";
    const activeClass = sortField === field ? styles.tableHeaderCellActive : "";
    return `${baseClass} ${sortableClass} ${activeClass}`.trim();
  };

  const getDropdownItemClass = (currentValue, optionValue) => {
    return `${styles.dropdownItem} ${
      currentValue === optionValue ? styles.dropdownItemActive : ""
    }`.trim();
  };

  // Show initial loading spinner only when no data
  if (loading && approvals.length === 0) {
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
          { label: "Approval History" },
        ]}
      />

      {/* Filters and search inline */}
      <div className={styles.filtersContainer}>
        <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
          <div className="input-group">
            <input
              type="text"
              className={`form-control ${styles.searchInput}`}
              placeholder="Search approvals..."
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

        {/* ROLE FILTER DROPDOWN */}
        <div ref={roleDropdownRef} className={styles.dropdownWrapper}>
          <button
            type="button"
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className={`${styles.dropdownButton} ${styles.dropdownButtonRole}`}
          >
            <span>{getRoleLabel(roleFilter)}</span>
            <i
              className={`bi bi-chevron-${showRoleDropdown ? "up" : "down"} ${
                styles.dropdownIcon
              }`}
            ></i>
          </button>

          {showRoleDropdown && (
            <div
              className={`${styles.dropdownMenu} ${styles.dropdownMenuRole}`}
            >
              {roleOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => {
                    setRoleFilter(option.value);
                    setCurrentPage(1);
                    setShowRoleDropdown(false);
                  }}
                  className={getDropdownItemClass(roleFilter, option.value)}
                >
                  {option.label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TYPE FILTER DROPDOWN */}
        <div ref={typeDropdownRef} className={styles.dropdownWrapper}>
          <button
            type="button"
            onClick={() => setShowTypeDropdown(!showTypeDropdown)}
            className={`${styles.dropdownButton} ${styles.dropdownButtonType}`}
          >
            <span>{getTypeLabel(typeFilter)}</span>
            <i
              className={`bi bi-chevron-${showTypeDropdown ? "up" : "down"} ${
                styles.dropdownIcon
              }`}
            ></i>
          </button>

          {showTypeDropdown && (
            <div
              className={`${styles.dropdownMenu} ${styles.dropdownMenuType}`}
            >
              {typeOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => {
                    setTypeFilter(option.value);
                    setCurrentPage(1);
                    setShowTypeDropdown(false);
                  }}
                  className={getDropdownItemClass(typeFilter, option.value)}
                >
                  {option.label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* STATUS FILTER DROPDOWN */}
        <div ref={statusDropdownRef} className={styles.dropdownWrapper}>
          <button
            type="button"
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            className={`${styles.dropdownButton} ${styles.dropdownButtonStatus}`}
          >
            <span>{getStatusLabel(statusFilter)}</span>
            <i
              className={`bi bi-chevron-${showStatusDropdown ? "up" : "down"} ${
                styles.dropdownIcon
              }`}
            ></i>
          </button>

          {showStatusDropdown && (
            <div
              className={`${styles.dropdownMenu} ${styles.dropdownMenuStatus}`}
            >
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

      {/* Approval History Table */}
      {approvals.length === 0 && !loading ? (
        <EmptyState
          icon={Filter}
          title="No Approvals Found"
          message="No approvals match your current filters."
        />
      ) : (
        <>
          <div
            className={`${styles.tableContainer} ${
              loading ? styles.tableContainerLoading : ""
            }`}
          >
            <div className={styles.tableWrapper}>
              {/* Table Header */}
              <div className={styles.tableHeader}>
                {[
                  { label: "Request Type", field: "approvalType" },
                  { label: "Skill", field: "skillName" },
                  { label: "Submitted By", field: "requesterName" },
                  { label: "Assigned To", field: "approverName" },
                  { label: "Status", field: "status" },
                  { label: "Date", field: "requestedOn" },
                  { label: "Attachment", field: null },
                  { label: "Comments", field: null },
                ].map(({ label, field }) => (
                  <div
                    key={field || label}
                    onClick={() => field && onSortClick(field)}
                    className={getHeaderCellClass(field)}
                  >
                    {label}
                    {field && renderSortIcon(field)}
                  </div>
                ))}
              </div>

              {/* Table Rows */}
              {approvals.map((approval, idx) => (
                <div key={approval.approvalId}>
                  <div
                    className={`${styles.tableRow} ${
                      idx < approvals.length - 1 ? styles.tableRowBorder : ""
                    }`}
                  >
                    <div className={styles.cellRequestType}>
                      {getApprovalTypeLabel(approval.approvalType)}
                    </div>
                    <div className={styles.cellSkill}>
                      {approval.skillName || "None"}
                    </div>
                    <div
                      className={styles.cellName}
                      title={approval.requesterName}
                    >
                      {approval.requesterName}
                    </div>
                    <div
                      className={styles.cellName}
                      title={approval.approverName}
                    >
                      {approval.approverName || "None"}
                    </div>
                    <div>
                      <StatusBadge status={approval.status} />
                    </div>
                    <div className={styles.cellDate}>
                      {approval.requestedOn
                        ? new Date(approval.requestedOn).toLocaleDateString()
                        : "None"}
                    </div>
                    <div className={styles.cellAttachment}>
                      {approval.attachmentPath ? (
                        <button
                          onClick={() => handleDownload(approval)}
                          title="Download Attachment"
                          className={styles.downloadButton}
                        >
                          <Download size={15} />
                        </button>
                      ) : (
                        <span className={styles.cellNone}>None</span>
                      )}
                    </div>

                    <div className={styles.cellComments}>
                      {approval.approvalType === "SME_REQUEST" ? (
                        <span className={styles.cellNone}>None</span>
                      ) : approval.notes ? (
                        <button
                          onClick={() =>
                            setExpandedNotes((prev) => ({
                              ...prev,
                              [approval.approvalId]: !prev[approval.approvalId],
                            }))
                          }
                          className={`${styles.commentsButton} ${
                            expandedNotes?.[approval.approvalId]
                              ? styles.commentsButtonExpanded
                              : ""
                          }`}
                          title={
                            expandedNotes?.[approval.approvalId]
                              ? "Hide comments"
                              : "Show comments"
                          }
                        >
                          {expandedNotes?.[approval.approvalId]
                            ? "Hide"
                            : "View"}
                        </button>
                      ) : (
                        <span className={styles.cellNone}>None</span>
                      )}
                    </div>
                  </div>

                  {/* Expanded notes */}
                  {approval.approvalType !== "SME_REQUEST" &&
                    expandedNotes?.[approval.approvalId] &&
                    approval.notes && (
                      <div
                        className={`${styles.expandedNotes} ${
                          idx < approvals.length - 1
                            ? styles.expandedNotesBorder
                            : ""
                        }`}
                      >
                        <strong className={styles.expandedNotesLabel}>
                          Approver Comments:
                        </strong>
                        {approval.notes}
                      </div>
                    )}
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
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

export default ApprovalHistory;
