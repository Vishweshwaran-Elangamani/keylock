import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/auth/AuthContext";
import goalService from "../../services/goals/goalService";
import ApprovalReviewModal from "../../components/goals/modals/ApprovalReviewModal";
import ConfirmationModal from "../../components/goals/modals/ConfirmationModal";
import LoadingSpinner from "../../components/goals/common/LoadingSpinner";
import Alert from "../../components/goals/common/Alert";
import Pagination from "../../components/goals/common/Pagination";
import { APPROVAL_TYPE_LABELS } from "../../constants/goals/goalConstants";
import Breadcrumb from "../../components/goals/common/Breadcrumb";

const GoalApprovalsPage = () => {
  const { user } = useAuth();
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

  // Pagination - itemsPerPage is now state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const canApprove = ["Manager", "Department Head", "Leadership"].includes(
    user.role
  );
  const isEmployee = user.role === "Employee";

  // Close dropdowns when clicking outside
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

  // Calculate pagination
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

  return (
    <>
      <div className="container-fluid" style={{ paddingRight: "20px" }}>
        <Breadcrumb
          items={[
            { label: "", path: "/dashboard", icon: "house-door" },
            { label: "Goals Dashboard", path: "/dashboard/goals", icon: "" },
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
          {/* Toggle Buttons - SLIGHTLY INCREASED */}
          <div className="col-12 col-lg-4">
            <div
              style={{
                display: "flex",
                flex: 1,
                backgroundColor: "rgb(39, 35, 92)",
                borderRadius: "50px",
                padding: "4px",
                maxWidth: "100%",
              }}
            >
              <button
                type="button"
                onClick={() => handleViewModeChange("pending")}
                style={{
                  flex: 1,
                  padding: "11px 22px",
                  border: "none",
                  borderRadius: "50px",
                  backgroundColor:
                    viewMode === "pending" ? "#ffffff" : "rgb(39, 35, 92)",
                  color: viewMode === "pending" ? "#000000" : "white",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow:
                    viewMode === "pending"
                      ? "0 2px 4px rgba(0,0,0,0.1)"
                      : "none",
                  fontSize: "12.5px",
                  whiteSpace: "nowrap",
                }}
              >
                <i className="bi bi-hourglass-split me-1"></i>
                Pending ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange("history")}
                style={{
                  flex: 1,
                  padding: "11px 22px",
                  border: "none",
                  borderRadius: "50px",
                  backgroundColor:
                    viewMode === "history" ? "#ffffff" : "rgb(39, 35, 92)",
                  color: viewMode === "history" ? "#000000" : "white",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow:
                    viewMode === "history"
                      ? "0 2px 4px rgba(0,0,0,0.1)"
                      : "none",
                  fontSize: "12.5px",
                  whiteSpace: "nowrap",
                }}
              >
                <i className="bi bi-clock-history me-1"></i>
                History ({historyCount})
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="col-12 col-md-6 col-lg-5">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Search by goal title or requester..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                style={{ minHeight: "37px", fontSize: "0.875rem" }}
              />
              {activeSearchTerm ? (
                <button
                  className="btn btn-outline-secondary"
                  onClick={handleCancelSearch}
                  style={{ fontSize: "0.875rem" }}
                >
                  <i className="bi bi-x-lg me-1"></i>
                  Cancel
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={handleSearch}
                  style={{ fontSize: "0.875rem" }}
                >
                  <i className="bi bi-search me-1"></i>
                  Search
                </button>
              )}
            </div>
          </div>

          {/* Filter Type - CUSTOM DROPDOWN */}
          <div className="col-6 col-md-3 col-lg-2">
            <div ref={typeDropdownRef} style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                style={{
                  padding: "0.45rem 0.75rem",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  background: "#fff",
                  color: "black",
                  width: "100%",
                  minWidth: "140px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontWeight: "500",
                  transition: "all 0.2s",
                  height: "37px",
                }}
              >
                <span
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "calc(100% - 20px)",
                  }}
                >
                  {getTypeLabel(filterType)}
                </span>
                <i
                  className={`bi bi-chevron-${
                    showTypeDropdown ? "up" : "down"
                  }`}
                  style={{
                    fontSize: "0.7rem",
                    marginLeft: "0.5rem",
                    flexShrink: 0,
                  }}
                ></i>
              </button>

              {showTypeDropdown && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    left: 0,
                    right: 0,
                    minWidth: "180px",
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    zIndex: 1000,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    overflow: "hidden",
                    maxHeight: "300px",
                    overflowY: "auto",
                  }}
                >
                  {typeOptions.map((option) => (
                    <div
                      key={option.value}
                      onClick={() => {
                        setFilterType(option.value);
                        setCurrentPage(1);
                        setShowTypeDropdown(false);
                      }}
                      style={{
                        padding: "0.625rem 0.875rem",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                        color: "#212529",
                        textAlign: "left",
                        transition: "all 0.2s",
                        background:
                          filterType === option.value ? "#f3f4f6" : "#fff",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgb(39, 35, 92)";
                        e.currentTarget.style.color = "white";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          filterType === option.value ? "#f3f4f6" : "#fff";
                        e.currentTarget.style.color = "#212529";
                      }}
                    >
                      {option.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Filter Date - CUSTOM DROPDOWN WITH RIGHT MARGIN */}
          <div className="col-6 col-md-3 col-lg-1" style={{ paddingRight: "8px" }}>
            <div ref={dateDropdownRef} style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setShowDateDropdown(!showDateDropdown)}
                style={{
                  padding: "0.45rem 0.75rem",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  background: "#fff",
                  color: "black",
                  width: "100%",
                  minWidth: "125px",
                  maxWidth: "130px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontWeight: "500",
                  transition: "all 0.2s",
                  height: "37px",
                }}
              >
                <span
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {getDateLabel(filterDate)}
                </span>
                <i
                  className={`bi bi-chevron-${
                    showDateDropdown ? "up" : "down"
                  }`}
                  style={{
                    fontSize: "0.7rem",
                    marginLeft: "0.5rem",
                    flexShrink: 0,
                  }}
                ></i>
              </button>

              {showDateDropdown && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    right: 0,
                    minWidth: "140px",
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    zIndex: 1000,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    overflow: "hidden",
                  }}
                >
                  {dateOptions.map((option) => (
                    <div
                      key={option.value}
                      onClick={() => {
                        setFilterDate(option.value);
                        setCurrentPage(1);
                        setShowDateDropdown(false);
                      }}
                      style={{
                        padding: "0.625rem 0.875rem",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                        color: "#212529",
                        textAlign: "left",
                        transition: "all 0.2s",
                        background:
                          filterDate === option.value ? "#f3f4f6" : "#fff",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgb(39, 35, 92)";
                        e.currentTarget.style.color = "white";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          filterDate === option.value ? "#f3f4f6" : "#fff";
                        e.currentTarget.style.color = "#212529";
                      }}
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
          <div
            className="card text-center"
            style={{ padding: "3rem", backgroundColor: "#f8f9fa" }}
          >
            <i
              className="bi bi-inbox"
              style={{ fontSize: "4rem", color: "#dee2e6" }}
            ></i>
            <h6 className="mt-3 mb-2" style={{ color: "#6c757d" }}>
              No approvals found
            </h6>
            <p className="text-muted mb-0">
              {viewMode === "pending"
                ? "You have no pending approvals at the moment"
                : "No approval history available"}
            </p>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                minHeight: "70vh",
              }}
            >
              <div style={{ flexGrow: 1 }}>
                <div
                  className="table-responsive"
                  style={{
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.12)"
                  }}
                >
                  <table className="table table-hover align-start mb-0">
                    <thead
                      style={{
                        height: "50px",
                        fontWeight: 600,
                        verticalAlign: "middle",
                      }}
                    >
                      <tr>
                        <th
                          style={{
                            width: "25%",
                            color: "white",
                            backgroundColor: "rgb(39, 35, 92)",
                          }}
                        >
                          TITLE
                        </th>
                        <th
                          style={{
                            width: "20%",
                            color: "white",
                            backgroundColor: "rgb(39, 35, 92)",
                          }}
                        >
                          TYPE
                        </th>
                        <th
                          style={{
                            width: "20%",
                            color: "white",
                            backgroundColor: "rgb(39, 35, 92)",
                          }}
                        >
                          STATUS
                        </th>
                        <th
                          style={{
                            width: "15%",
                            color: "white",
                            backgroundColor: "rgb(39, 35, 92)",
                          }}
                        >
                          REQUESTOR
                        </th>
                        <th
                          style={{
                            width: "20%",
                            color: "white",
                            backgroundColor: "rgb(39, 35, 92)",
                          }}
                        >
                          REQUESTED ON
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentApprovals.map((approval) => {
                        const isAutoApproved =
                          approval.approvalStatus === "approved" &&
                          approval.approverEmployeeMasterId ===
                            approval.requestedByEmployeeMasterId;

                        return (
                          <tr
                            key={approval.approvalId}
                            onClick={() => handleReviewClick(approval)}
                            style={{ cursor: "pointer", height: "60px" }}
                          >
                            <td
                              style={{
                                fontSize: "14px",
                                paddingTop: "20px",
                                paddingBottom: "20px",
                              }}
                            >
                              <div
                                style={{
                                  fontWeight: 500,
                                  paddingLeft: "50px",
                                  textAlign: "left",
                                }}
                              >
                                {approval.goalTitle}
                              </div>
                            </td>

                            <td
                              style={{
                                paddingLeft: "50px",
                                textAlign: "left",
                                paddingTop: "20px",
                                paddingBottom: "20px",
                              }}
                            >
                              <span
                                className="text-muted"
                                style={{ fontSize: "14px" }}
                              >
                                {APPROVAL_TYPE_LABELS[approval.approvalType] ||
                                  approval.approvalType}
                              </span>
                            </td>

                            <td
                              style={{
                                paddingTop: "20px",
                                paddingBottom: "20px",
                              }}
                            >
                              {getStatusBadge(approval.approvalStatus)}
                            </td>

                            <td
                              style={{
                                paddingLeft: "30px",
                                textAlign: "left",
                                paddingTop: "20px",
                                paddingBottom: "20px",
                              }}
                            >
                              <span style={{ fontSize: "14px" }}>
                                {approval.requestedByName}
                              </span>
                            </td>

                            <td
                              style={{
                                paddingTop: "20px",
                                paddingBottom: "20px",
                              }}
                            >
                              <span
                                className="text-muted"
                                style={{ fontSize: "14px" }}
                              >
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

              {/* Updated Pagination with new props */}
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
