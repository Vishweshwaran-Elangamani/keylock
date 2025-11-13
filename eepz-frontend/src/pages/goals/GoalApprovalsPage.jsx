import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/auth/AuthContext";
import goalService from "../../services/goals/goalService";
import ApprovalReviewModal from "../../components/goals/modals/ApprovalReviewModal";
import ConfirmationModal from "../../components/goals/modals/ConfirmationModal";
import LoadingSpinner from "../../components/goals/common/LoadingSpinner";
import Alert from "../../components/goals/common/Alert";
import { APPROVAL_TYPE_LABELS } from "../../constants/goals/goalConstants";
import Breadcrumb from "../../components/goals/common/Breadcrumb";

const GoalApprovalsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [allApprovals, setAllApprovals] = useState([]);
  const [viewMode, setViewMode] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterDate, setFilterDate] = useState("");

  // Modals
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [pendingDecision, setPendingDecision] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const approvalsPerPage = 10;

  // Role checks
  const canApprove = ["Manager", "Department Head", "Leadership"].includes(
    user.role
  );
  const isEmployee = user.role === "Employee";

  useEffect(() => {
    loadApprovals();
  }, []);

  // MINIMAL: Only remove exact duplicates (same goalId, approvalType, status, approvalId, requestedOn)
  const deduplicateApprovals = (approvals) => {
    if (!approvals || approvals.length === 0) return [];

    const seen = new Set();
    const unique = [];

    approvals.forEach((approval) => {
      // Only deduplicate EXACT duplicates with same basic properties
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

      // Only remove exact duplicates
      const dedupedApprovals = deduplicateApprovals(rawApprovals);

      // ✅ CORRECT: Filter based on userRole from backend
      const relevantApprovals = dedupedApprovals.filter((approval) => {
        // Show if user is Approver or Requester, but NOT just GoalAssignee
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

  // Filter by view mode (pending/history)
  const approvalsByMode = allApprovals.filter((approval) => {
    if (viewMode === "pending") {
      return approval.approvalStatus === "pending";
    } else {
      return approval.approvalStatus !== "pending";
    }
  });

  // Apply search and filters
  const filteredApprovals = approvalsByMode.filter((approval) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
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

  // Pagination
  const indexOfLastApproval = currentPage * approvalsPerPage;
  const indexOfFirstApproval = indexOfLastApproval - approvalsPerPage;
  const currentApprovals = filteredApprovals.slice(
    indexOfFirstApproval,
    indexOfLastApproval
  );
  const totalPages = Math.ceil(filteredApprovals.length / approvalsPerPage);

  // Counts from deduplicated data
  const pendingCount = allApprovals.filter(
    (a) => a.approvalStatus === "pending"
  ).length;
  const historyCount = allApprovals.filter(
    (a) => a.approvalStatus !== "pending"
  ).length;

  return (
    <div className="container-fluid p-4">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Dashboard", path: "/dashboard/goals", icon: "house-door" },
          { label: "Approvals", path: null, icon: "clipboard-check" },
        ]}
      />

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2
            style={{
              fontWeight: 700,
              color: "#212529",
              marginBottom: "0.5rem",
              textAlign: "left",
            }}
          >
            Approvals
          </h2>
          <p className="text-muted mb-0">
            {isEmployee
              ? "View approval requests and their status"
              : "Review and manage approval requests"}
          </p>
        </div>

        <button
          className="btn btn-outline-secondary"
          onClick={loadApprovals}
          disabled={loading}
        >
          <i
            className={`bi bi-arrow-clockwise ${loading ? "spin" : ""} me-2`}
          ></i>
          Refresh
        </button>
      </div>

      {/* Alert */}
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* View Mode Toggle */}
      <div
        className="btn-group mb-4 w-100"
        role="group"
        style={{ maxWidth: "500px" }}
      >
        <button
          type="button"
          className={`btn ${
            viewMode === "pending" ? "btn-primary" : "btn-outline-primary"
          }`}
          onClick={() => {
            setViewMode("pending");
            setCurrentPage(1);
          }}
        >
          <i className="bi bi-hourglass-split me-2"></i>
          Pending Approvals ({pendingCount})
        </button>
        <button
          type="button"
          className={`btn ${
            viewMode === "history" ? "btn-primary" : "btn-outline-primary"
          }`}
          onClick={() => {
            setViewMode("history");
            setCurrentPage(1);
          }}
        >
          <i className="bi bi-clock-history me-2"></i>
          History ({historyCount})
        </button>
      </div>

      {/* Search & Filters */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by goal title or requester..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                minHeight: "2.5em",
              }}
            />
            {searchTerm && (
              <button
                className="btn btn-outline-secondary"
                onClick={() => setSearchTerm("")}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            )}
          </div>
        </div>

        <div className="col-md-3">
          <select
            className="form-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">All Types</option>
            {Object.entries(APPROVAL_TYPE_LABELS).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-3">
          <select
            className="form-select"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          >
            <option value="">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <span style={{ fontWeight: 600, fontSize: "1rem", color: "#212529" }}>
            {filteredApprovals.length} Result
            {filteredApprovals.length !== 1 ? "s" : ""}
          </span>
        </div>

        {totalPages > 1 && (
          <div className="text-muted" style={{ fontSize: "0.9rem" }}>
            Page {currentPage} of {totalPages}
          </div>
        )}
      </div>

      {/* Loading State */}
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
          {/* Approvals List */}
          <div className="row g-3">
            {currentApprovals.map((approval) => (
              <div key={approval.approvalId} className="col-12">
                <ApprovalCard
                  approval={approval}
                  onReview={handleReviewClick}
                  canReview={true}
                />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="mt-4">
              <ul className="pagination justify-content-center">
                <li
                  className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
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

                {[...Array(totalPages)].map((_, index) => {
                  const page = index + 1;
                  if (
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1
                  ) {
                    return (
                      <li
                        key={page}
                        className={`page-item ${
                          currentPage === page ? "active" : ""
                        }`}
                      >
                        <button
                          className="page-link"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      </li>
                    );
                  } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
                    return (
                      <li key={page} className="page-item disabled">
                        <span className="page-link">...</span>
                      </li>
                    );
                  }
                  return null;
                })}

                <li
                  className={`page-item ${
                    currentPage === totalPages ? "disabled" : ""
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </>
      )}

      {/* Review Modal */}
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

      {/* Confirmation Modal */}
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
  );
};

// UPDATED: Approval Card Component - Added Auto Badge
const ApprovalCard = ({ approval, onReview, canReview }) => {
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

  // Detect auto-approval
  const isAutoApproved =
    approval.approvalStatus === "approved" &&
    approval.approverEmployeeMasterId === approval.requestedByEmployeeMasterId;

  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start">
          <div className="flex-grow-1">
            <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
              <h5 className="mb-0" style={{ fontWeight: 600 }}>
                {approval.goalTitle}
              </h5>
              {getStatusBadge(approval.approvalStatus)}
              {isAutoApproved && (
                <span
                  className="badge bg-info"
                  title="Auto-approved by Leadership without approval flow"
                  style={{
                    fontSize: "0.75rem",
                    padding: "0.35rem 0.6rem",
                    fontWeight: 600,
                  }}
                >
                  <i className="bi bi-lightning-charge-fill me-1"></i>
                  Auto
                </span>
              )}
            </div>

            <div className="text-muted mb-2" style={{ fontSize: "0.9rem" }}>
              <i className="bi bi-tag me-1"></i>
              {APPROVAL_TYPE_LABELS[approval.approvalType] ||
                approval.approvalType}
            </div>

            <div className="text-muted" style={{ fontSize: "0.875rem" }}>
              <i className="bi bi-person me-1"></i>
              Requested by <strong>{approval.requestedByName}</strong>
              <span className="mx-2">•</span>
              <i className="bi bi-calendar me-1"></i>
              {new Date(approval.requestedOn).toLocaleDateString()}
            </div>

            {approval.approvedOn && (
              <div className="text-muted mt-1" style={{ fontSize: "0.875rem" }}>
                <i className="bi bi-check2 me-1"></i>
                Decided on {new Date(approval.approvedOn).toLocaleDateString()}
                {approval.approverName && ` by ${approval.approverName}`}
              </div>
            )}
          </div>

          {canReview && (
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={() => onReview(approval)}
            >
              <i className="bi bi-eye me-1"></i>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoalApprovalsPage;
