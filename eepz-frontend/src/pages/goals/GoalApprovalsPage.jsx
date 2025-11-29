import { useState, useEffect } from "react";
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
      <div className="container-fluid">
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

        <div className="row g-3 mb-4 align-items-center">
          {/* Toggle Buttons */}
          <div className="col-12 col-lg-6">
            <div
              style={{
                display: "flex",
                flex: 1,
                backgroundColor: "rgb(39, 35, 92)",
                borderRadius: "50px",
                padding: "5px",
                maxWidth: "100%",
              }}
            >
              <button
                type="button"
                onClick={() => handleViewModeChange("pending")}
                style={{
                  flex: 1,
                  padding: "15px 30px",
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
                  fontSize: "14px",
                  whiteSpace: "nowrap",
                }}
              >
                <i className="bi bi-hourglass-split me-2"></i>
                Pending ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange("history")}
                style={{
                  flex: 1,
                  padding: "15px 30px",
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
                  fontSize: "14px",
                  whiteSpace: "nowrap",
                }}
              >
                <i className="bi bi-clock-history me-2"></i>
                History ({historyCount})
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="col-12 col-md-6 col-lg-3">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Search by goal title or requester..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                style={{ minHeight: "35.7px" }}
              />
              {activeSearchTerm ? (
                <button
                  className="btn btn-outline-secondary"
                  onClick={handleCancelSearch}
                >
                  <i className="bi bi-x-lg me-1"></i>
                  Cancel
                </button>
              ) : (
                <button className="btn btn-primary" onClick={handleSearch}>
                  <i className="bi bi-search me-1"></i>
                  Search
                </button>
              )}
            </div>
          </div>

          {/* Filter Type */}
          <div className="col-6 col-md-3 col-lg-1">
            <select
              className="form-select"
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Types</option>
              {Object.entries(APPROVAL_TYPE_LABELS).map(([key, value]) => (
                <option key={key} value={key}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Date */}
          <div className="col-6 col-md-3 col-lg-2">
            <select
              className="form-select"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
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
                    borderRadius: "1.5rem 1.5rem 0rem 0rem",
                    border: "1px solid rgba(39, 35, 92, 0.24)",
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
