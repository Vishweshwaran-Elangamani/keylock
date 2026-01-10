import { useState, useEffect, useRef } from "react";
import {
  Download,
  Eye,
  CheckCircle,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import Breadcrumb from "../../../components/common/Breadcrumb";
import Pagination from "../../../components/lnd/common/Pagination";
import StatusBadge from "../../../components/lnd/common/StatusBadge";
import EmptyState from "../../../components/lnd/common/EmptyState";
import ApprovalDecisionModal from "../../../components/lnd/modals/ApprovalDecisionModal";
import { lndService, downloadFile } from "../../../services/lnd/lndService";
import { APPROVAL_TYPE } from "../../../constants/lnd/lndConstants";
import { toast } from "sonner";
import styles from "../../../styles/lnd/pages/approvals/PendingApprovals.module.css";
import { LND_TOASTS } from "../../../constants/lnd/lndToasts";

const PendingApprovals = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [rolePrefix, setRolePrefix] = useState("");

  // Search
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Filter
  const [typeFilter, setTypeFilter] = useState("");
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const typeDropdownRef = useRef(null);

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
      if (
        typeDropdownRef.current &&
        !typeDropdownRef.current.contains(event.target)
      ) {
        setShowTypeDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    fetchPendingApprovals();
  }, [
    currentPage,
    itemsPerPage,
    searchTerm,
    typeFilter,
    sortField,
    sortOrderAsc,
  ]);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);

      const response = await lndService.getMyApprovals({
        pageNumber: currentPage,
        approvalType: typeFilter,
        status: "PENDING",
        sortField: sortField,
        sortOrder: sortOrderAsc ? "asc" : "desc",
        pageSize: itemsPerPage,
        searchTerm: searchTerm,
      });

      if (response.data.success) {
        setApprovals(response.data.data.items);
        setTotalItems(response.data.data.totalCount);
        setTotalPages(response.data.data.totalPages);
      }
    } catch (error) {
      toast.error(LND_TOASTS.FAILED_TO_LOAD_PENDING_APPROVALS);
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

  const handleReview = (approval) => {
    setSelectedApproval(approval);
    setShowDecisionModal(true);
  };

  const handleDecisionSuccess = () => {
    setShowDecisionModal(false);
    fetchPendingApprovals();
  };

  const handleDownload = async (approval) => {
    try {
      const response = await lndService.downloadApprovalAttachment(
        approval.approvalId
      );
      const filename = `approval_${approval.approvalId}_attachment`;
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

  const getTypeLabel = (value) => {
    if (!value) return "All Types";
    return getApprovalTypeLabel(value);
  };

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
          { label: "Pending Approval" },
        ]}
      />

      {/* Search and Filter */}
      <div className={styles.filterContainer}>
        {/* Search Bar */}
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

        {/* TYPE FILTER DROPDOWN */}
        <div ref={typeDropdownRef} className={styles.dropdownWrapper}>
          <button
            type="button"
            onClick={() => setShowTypeDropdown(!showTypeDropdown)}
            className={styles.dropdownButton}
          >
            <span>{getTypeLabel(typeFilter)}</span>
            <i
              className={`bi bi-chevron-${showTypeDropdown ? "up" : "down"} ${
                styles.dropdownIcon
              }`}
            ></i>
          </button>

          {showTypeDropdown && (
            <div className={styles.dropdownMenu}>
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
      </div>

      {/* Pending Approvals Table */}
      {approvals.length === 0 && !loading ? (
        <EmptyState
          icon={CheckCircle}
          title="No Pending Approvals"
          message={
            searchTerm || typeFilter
              ? "No approvals match your current search or filters."
              : "You don't have any pending approval requests at the moment."
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
              {/* Table Header */}
              <div className={styles.tableHeader}>
                {[
                  {
                    label: "Request Type",
                    field: "approvalType",
                    align: "left",
                  },
                  {
                    label: "Submitted By",
                    field: "requesterName",
                    align: "left",
                  },
                  {
                    label: "Assigned To",
                    field: "approverName",
                    align: "left",
                  },
                  {
                    label: "Submission Date",
                    field: "requestedOn",
                    align: "left",
                  },
                  { label: "Quick Actions", field: null, align: "center" },
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

              {/* Table Rows */}
              {approvals.map((approval, idx) => (
                <div
                  key={approval.approvalId}
                  className={`${styles.tableRow} ${
                    idx < approvals.length - 1 ? styles.tableRowBorder : ""
                  }`}
                >
                  <div className={styles.cellRequestType}>
                    {getApprovalTypeLabel(approval.approvalType)}
                  </div>
                  <div>
                    <div className={styles.cellName}>
                      {approval.requesterName}
                    </div>
                  </div>
                  <div>
                    <div className={styles.cellName}>
                      {approval.approverName || "-"}
                    </div>
                  </div>
                  <div className={styles.cellDate}>
                    {approval.requestedOn
                      ? new Date(approval.requestedOn).toLocaleDateString()
                      : "-"}
                  </div>
                  <div className={styles.cellActions}>
                    {approval.attachmentPath && (
                      <button
                        onClick={() => handleDownload(approval)}
                        className={styles.downloadButton}
                        title="Download Attachment"
                      >
                        <Download size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => handleReview(approval)}
                      className={styles.reviewButton}
                      title="Review Approval"
                    >
                      <Eye size={16} />
                      Review
                    </button>
                  </div>
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

      {showDecisionModal && (
        <ApprovalDecisionModal
          approval={selectedApproval}
          onClose={() => setShowDecisionModal(false)}
          onSuccess={handleDecisionSuccess}
        />
      )}
    </div>
  );
};

export default PendingApprovals;
