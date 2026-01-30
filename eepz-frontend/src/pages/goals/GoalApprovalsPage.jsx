import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/auth/AuthContext";
import goalService from "../../services/goals/goalService";
import ApprovalReviewModal from "../../components/goals/modals/ApprovalReviewModal";
import ConfirmationModal from "../../components/goals/modals/ConfirmationModal";
import LoadingSpinner from "../../components/goals/common/LoadingSpinner";
import Alert from "../../components/goals/common/Alert";
import Pagination from "../../components/goals/common/Pagination";
import { APPROVAL_TYPE_LABELS } from "../../constants/goals/goalConstants";
import Breadcrumb from "../../components/common/Breadcrumb";
import styles from "../../styles/goals/pages/GoalApprovalsPage.module.css";

const GoalApprovalsPage = () => {
  const { user } = useAuth();
  const getRolePrefix = (role) =>
    ({
      Manager: "/manager",
      "Department Head": "/department-head",
      Leadership: "/leadership",
      Employee: "/employee",
    }[role] || "/employee");

  const rolePrefix = getRolePrefix(user.role);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [allApprovals, setAllApprovals] = useState([]);
  const [viewMode, setViewMode] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterDate, setFilterDate] = useState("");

  // Dropdown states
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  // Dropdown refs
  const typeDropdownRef = useRef(null);
  const dateDropdownRef = useRef(null);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [pendingDecision, setPendingDecision] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const canApprove = ["Manager", "Department Head", "Leadership"].includes(
    user.role
  );
  const isEmployee = user.role === "Employee";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        typeDropdownRef.current &&
        !typeDropdownRef.current.contains(event.target)
      ) {
        setShowTypeDropdown(false);
      }
      if (
        dateDropdownRef.current &&
        !dateDropdownRef.current.contains(event.target)
      ) {
        setShowDateDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    loadApprovals();
  }, []);

  const deduplicateApprovals = (approvals) => {
    if (!approvals || approvals.length === 0) return [];

    const seen = new Set();
    const unique = [];

    approvals.forEach((approval) => {
      const key = `${approval.goalId}-${approval.approvalType}-${approval.approvalStatus}-${approval.approvalId}`;

      if (!seen.has(key)) {
        seen.add(key);
        unique.push(approval);
      }
    });

    return unique.sort(
      (a, b) => new Date(b.requestedOn) - new Date(a.requestedOn)
    );
  };

  const loadApprovals = async () => {
    setLoading(true);
    setAlert(null);
    try {
      const response = await goalService.getMyApprovals({});
      const rawApprovals = response.data?.items || [];

      const dedupedApprovals = deduplicateApprovals(rawApprovals);

      const relevantApprovals = dedupedApprovals.filter((approval) => {
        return (
          approval.userRole === "Approver" || approval.userRole === "Requester"
        );
      });

      setAllApprovals(relevantApprovals);
    } catch (error) {
      setAlert({
        type: "danger",
        message: "Failed to load approvals",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReviewClick = (approval) => {
    setSelectedApproval(approval);
    setShowReviewModal(true);
  };

  const handleDecisionRequest = (decision) => {
    setPendingDecision(decision);
    setShowReviewModal(false);
    setShowConfirmModal(true);
  };

  const handleConfirmDecision = async () => {
    try {
      await goalService.decideApproval(
        selectedApproval.approvalId,
        pendingDecision
      );
      setShowConfirmModal(false);
      setSelectedApproval(null);
      setPendingDecision(null);
      setAlert({
        type: "success",
        message: `Approval ${
          pendingDecision.decision === "approved" ? "approved" : "rejected"
        } successfully`,
      });
      await loadApprovals();
    } catch (error) {
      setAlert({
        type: "danger",
        message: error.response?.data?.message || "Failed to process decision",
      });
      setShowConfirmModal(false);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleItemsPerPageChange = (newSize) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearch = () => {
    setActiveSearchTerm(searchTerm);
    setCurrentPage(1);
  };

  const handleCancelSearch = () => {
    setSearchTerm("");
    setActiveSearchTerm("");
    setCurrentPage(1);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setCurrentPage(1);
  };

  const getTypeLabel = (value) => {
    if (!value) return "All Types";
    return APPROVAL_TYPE_LABELS[value] || value;
  };

  const getDateLabel = (value) => {
    const dateMap = {
      "": "All Time",
      today: "Today",
      week: "Last 7 Days",
      month: "Last 30 Days",
    };
    return dateMap[value] || "All Time";
  };

  const typeOptions = [
    { value: "", label: "All Types" },
    ...Object.entries(APPROVAL_TYPE_LABELS).map(([key, value]) => ({
      value: key,
      label: value,
    })),
  ];

  const dateOptions = [
    { value: "", label: "All Time" },
    { value: "today", label: "Today" },
    { value: "week", label: "Last 7 Days" },
    { value: "month", label: "Last 30 Days" },
  ];

  const approvalsByMode = allApprovals.filter((approval) => {
    if (viewMode === "pending") {
      return approval.approvalStatus === "pending";
    } else {
      return approval.approvalStatus !== "pending";
    }
  });

  const filteredApprovals = approvalsByMode.filter((approval) => {
    if (activeSearchTerm) {
      const searchLower = activeSearchTerm.toLowerCase();
      const matchesSearch =
        approval.goalTitle?.toLowerCase().includes(searchLower) ||
        approval.requestedByName?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    if (filterType && approval.approvalType !== filterType) {
      return false;
    }

    if (filterDate) {
      const requestDate = new Date(approval.requestedOn);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (filterDate === "today") {
        const reqDate = new Date(approval.requestedOn);
        reqDate.setHours(0, 0, 0, 0);
        if (reqDate.getTime() !== today.getTime()) return false;
      } else if (filterDate === "week") {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        if (requestDate < weekAgo) return false;
      } else if (filterDate === "month") {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        if (requestDate < monthAgo) return false;
      }
    }

    return true;
  });

  const totalItems = filteredApprovals.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastApproval = currentPage * itemsPerPage;
  const indexOfFirstApproval = indexOfLastApproval - itemsPerPage;
  const currentApprovals = filteredApprovals.slice(
    indexOfFirstApproval,
    indexOfLastApproval
  );

  const pendingCount = allApprovals.filter(
    (a) => a.approvalStatus === "pending"
  ).length;
  const historyCount = allApprovals.filter(
    (a) => a.approvalStatus !== "pending"
  ).length;

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: "warning", text: "Pending", icon: "hourglass-split" },
      approved: { bg: "success", text: "Approved", icon: "check-circle-fill" },
      rejected: { bg: "danger", text: "Rejected", icon: "x-circle-fill" },
    };
    const badge = badges[status] || badges.pending;

    return (
      <span className={`badge bg-${badge.bg}`}>
        <i className={`bi bi-${badge.icon} me-1`}></i>
        {badge.text}
      </span>
    );
  };

  const getToggleButtonClass = (mode) => {
    return `${styles.toggleButton} ${
      viewMode === mode
        ? styles.toggleButtonActive
        : styles.toggleButtonInactive
    }`;
  };

  const getDropdownItemClass = (currentValue, optionValue) => {
    return `${styles.dropdownItem} ${
      currentValue === optionValue
        ? styles.dropdownItemActive
        : styles.dropdownItemInactive
    }`;
  };

  return (
    <>
      <div className={`container-fluid ${styles.container}`}>
        <Breadcrumb
          items={[
            { label: "Goals Dashboard", path: `${rolePrefix}/dashboard/goals` },
            { label: "Approvals", path: null, icon: "" },
          ]}
        />

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        <div className="row g-2 mb-4 align-items-center">
          {/* Toggle Buttons */}
          <div className="col-12 col-lg-4">
            <div className={styles.toggleContainer}>
              <button
                type="button"
                onClick={() => handleViewModeChange("pending")}
                className={getToggleButtonClass("pending")}
              >
                <i className="bi bi-hourglass-split me-1"></i>
                Pending ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange("history")}
                className={getToggleButtonClass("history")}
              >
                <i className="bi bi-clock-history me-1"></i>
                History ({historyCount})
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="col-12 col-md-6 col-lg-4">
            <div className="input-group">
              <input
                type="text"
                className={`form-control ${styles.searchInput}`}
                placeholder="Search by goal title or requester..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleSearchKeyPress}
              />
              {activeSearchTerm ? (
                <button
                  className={`btn btn-outline-secondary ${styles.searchButton}`}
                  onClick={handleCancelSearch}
                >
                  <i className="bi bi-x-lg me-1"></i>
                  Cancel
                </button>
              ) : (
                <button
                  className={`btn btn-primary ${styles.searchButton}`}
                  onClick={handleSearch}
                >
                  <i className="bi bi-search me-1"></i>
                  Search
                </button>
              )}
            </div>
          </div>

          {/* Filter Type - Custom Dropdown */}
          <div className="col-6 col-md-3 col-lg-2">
            <div ref={typeDropdownRef} className={styles.dropdownWrapper}>
              <button
                type="button"
                onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                className={`${styles.dropdownButton} ${styles.typeDropdownButton}`}
              >
                <span
                  className={`${styles.dropdownButtonText} ${styles.typeDropdownButtonText}`}
                >
                  {getTypeLabel(filterType)}
                </span>
                <i
                  className={`bi bi-chevron-${
                    showTypeDropdown ? "up" : "down"
                  } ${styles.dropdownIcon}`}
                ></i>
              </button>

              {showTypeDropdown && (
                <div
                  className={`${styles.dropdownMenu} ${styles.typeDropdownMenu}`}
                >
                  {typeOptions.map((option) => (
                    <div
                      key={option.value}
                      onClick={() => {
                        setFilterType(option.value);
                        setCurrentPage(1);
                        setShowTypeDropdown(false);
                      }}
                      className={getDropdownItemClass(filterType, option.value)}
                    >
                      {option.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Filter Date - Custom Dropdown */}
          <div className={`col-6 col-md-3 col-lg-2`}>
            <div ref={dateDropdownRef} className={styles.dropdownWrapper}>
              <button
                type="button"
                onClick={() => setShowDateDropdown(!showDateDropdown)}
                className={`${styles.dropdownButton}`}
              >
                <span className={styles.dropdownButtonText}>
                  {getDateLabel(filterDate)}
                </span>
                <i
                  className={`bi bi-chevron-${
                    showDateDropdown ? "up" : "down"
                  } ${styles.dropdownIcon}`}
                ></i>
              </button>

              {showDateDropdown && (
                <div
                  className={`${styles.dropdownMenu} ${styles.dateDropdownMenu}`}
                >
                  {dateOptions.map((option) => (
                    <div
                      key={option.value}
                      onClick={() => {
                        setFilterDate(option.value);
                        setCurrentPage(1);
                        setShowDateDropdown(false);
                      }}
                      className={getDropdownItemClass(filterDate, option.value)}
                    >
                      {option.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading approvals..." />
        ) : currentApprovals.length === 0 ? (
          <div className={`card text-center ${styles.emptyStateCard}`}>
            <i className={`bi bi-inbox ${styles.emptyStateIcon}`}></i>
            <h6 className={`mt-3 mb-2 ${styles.emptyStateTitle}`}>
              No approvals found
            </h6>
          </div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <div className={styles.tableContent}>
                <div className={`table-responsive ${styles.tableResponsive}`}>
                  <table className={`table table-hover align-start mb-0`}>
                    <thead className={styles.tableHeader}>
                      <tr>
                        <th
                          className={`${styles.tableHeaderCell} ${styles.titleColumn}`}
                        >
                          TITLE
                        </th>
                        <th
                          className={`${styles.tableHeaderCell} ${styles.typeColumn}`}
                        >
                          TYPE
                        </th>
                        <th
                          className={`${styles.tableHeaderCell} ${styles.statusColumn}`}
                        >
                          STATUS
                        </th>
                        <th
                          className={`${styles.tableHeaderCell} ${styles.requestorColumn}`}
                        >
                          REQUESTOR
                        </th>
                        <th
                          className={`${styles.tableHeaderCell} ${styles.dateColumn}`}
                        >
                          REQUESTED ON
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentApprovals.map((approval) => {
                        return (
                          <tr
                            key={approval.approvalId}
                            onClick={() => handleReviewClick(approval)}
                            className={styles.tableRow}
                          >
                            <td className={styles.tableCell}>
                              <div className={styles.titleCell}>
                                {approval.goalTitle}
                              </div>
                            </td>

                            <td
                              className={`${styles.tableCell} ${styles.typeCell}`}
                            >
                              <span className={`text-muted ${styles.cellText}`}>
                                {APPROVAL_TYPE_LABELS[approval.approvalType] ||
                                  approval.approvalType}
                              </span>
                            </td>

                            <td className={styles.tableCell}>
                              {getStatusBadge(approval.approvalStatus)}
                            </td>

                            <td
                              className={`${styles.tableCell} ${styles.requestorCell}`}
                            >
                              <span className={styles.cellText}>
                                {approval.requestedByName}
                              </span>
                            </td>

                            <td className={styles.tableCell}>
                              <span className={`text-muted ${styles.cellText}`}>
                                {new Date(
                                  approval.requestedOn
                                ).toLocaleDateString()}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
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
            </div>
          </>
        )}

        {selectedApproval && (
          <ApprovalReviewModal
            isOpen={showReviewModal}
            onClose={() => {
              setShowReviewModal(false);
              setSelectedApproval(null);
            }}
            approval={selectedApproval}
            onDecisionRequest={handleDecisionRequest}
            canDecide={
              selectedApproval.userRole === "Approver" &&
              selectedApproval.approvalStatus === "pending"
            }
            isReadOnly={
              isEmployee || selectedApproval.approvalStatus !== "pending"
            }
          />
        )}

        {showConfirmModal && pendingDecision && (
          <ConfirmationModal
            isOpen={showConfirmModal}
            onClose={() => {
              setShowConfirmModal(false);
              setPendingDecision(null);
              setShowReviewModal(true);
            }}
            onConfirm={handleConfirmDecision}
            title={
              pendingDecision.decision === "approved"
                ? "Approve Request"
                : "Reject Request"
            }
            message={`Are you sure you want to ${
              pendingDecision.decision === "approved" ? "approve" : "reject"
            } this request?`}
            confirmText={
              pendingDecision.decision === "approved" ? "Approve" : "Reject"
            }
            confirmVariant={
              pendingDecision.decision === "approved" ? "success" : "danger"
            }
          />
        )}
      </div>
    </>
  );
};

export default GoalApprovalsPage;
