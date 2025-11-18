/**
 * ChangeRequestManagement Component
 *
 * Admin interface for managing employee EMAIL change requests ONLY.
 * Employee Company ID functionality completely removed.
 *
 * Features:
 * - Tab-based view: Pending requests vs All requests
 * - Advanced filtering: Search, status, date filters (NO type filter)
 * - Real-time statistics dashboard
 * - Approve/Reject workflow with admin remarks
 * - Auto-refresh every 30 seconds
 * - Pagination with customizable rows per page
 * - Toast notifications using Sonner for user feedback
 *
 * @component
 */

import { useState, useEffect } from "react";
import ChangeRequestService from "../../../services/auth/changeRequestService";
import { toast } from "sonner";
import "../../../styles/auth/admin/ChangeRequestManagement.css";

const ChangeRequestManagement = () => {
  // ========================
  // STATE MANAGEMENT
  // ========================

  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");

  // Filter States (filterType REMOVED - email only)
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState("");

  // Pagination States
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal States
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [processAction, setProcessAction] = useState("");
  const [adminRemarks, setAdminRemarks] = useState("");
  const [processing, setProcessing] = useState(false);

  // ========================
  // EFFECTS
  // ========================

  useEffect(() => {
    fetchRequests();

    const refreshInterval = setInterval(() => {
      fetchRequests(true);
    }, 30000000);

    return () => clearInterval(refreshInterval);
  }, [activeTab]);

  useEffect(() => {
    applyFilters();
  }, [requests, searchTerm, filterStatus, filterDate]); // filterType removed

  // ========================
  // API FUNCTIONS
  // ========================

  const fetchRequests = async (silent = false) => {
    try {
      setLoading(true);

      if (!silent) {
        toast.loading("Loading email change requests...");
      }

      let response;
      if (activeTab === "pending") {
        response = await ChangeRequestService.getPendingRequests();
      } else {
        response = await ChangeRequestService.getAllChangeRequests();
      }

      if (response.success) {
        setRequests(response.data || []);
        setLastUpdated(new Date());

        if (!silent) {
          toast.dismiss();
          toast.success(
            `Loaded ${
              response.data?.length || 0
            } email change requests successfully`
          );
        }
      } else {
        toast.dismiss();
        toast.error(response.message || "Failed to fetch requests");
      }
    } catch (error) {
      console.error("Error fetching email change requests:", error);
      toast.dismiss();
      toast.error("Failed to fetch email change requests");
    } finally {
      setLoading(false);
    }
  };

  // ========================
  // FILTER FUNCTIONS
  // ========================

  const applyFilters = () => {
    let filtered = [...requests];

    if (activeTab === "pending") {
      filtered = filtered.filter((req) => req.status === "Pending");
    }

    // Search filter (removed changeType search)
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (req) =>
          req.employeeName?.toLowerCase().includes(search) ||
          req.employeeCompanyId?.toLowerCase().includes(search) ||
          req.currentValue?.toLowerCase().includes(search) ||
          req.newValue?.toLowerCase().includes(search)
      );
    }

    // Type filter REMOVED

    if (filterStatus && activeTab === "all") {
      filtered = filtered.filter((req) => req.status === filterStatus);
    }

    if (filterDate) {
      filtered = filtered.filter((req) => {
        const requestDate = new Date(req.requestedAt);
        const filterDateObj = new Date(filterDate);
        return requestDate.toDateString() === filterDateObj.toDateString();
      });
    }

    setFilteredRequests(filtered);
    setCurrentPage(1);
  };

  // ========================
  // PROCESS REQUEST HANDLERS
  // ========================

  const handleProcessClick = (request, action) => {
    setSelectedRequest(request);
    setProcessAction(action);
    setAdminRemarks("");
    setShowProcessModal(true);
    toast.info(`Processing email change request #${request.requestId}`);
  };

  const handleProcessSubmit = async () => {
    if (!selectedRequest) return;

    if (processAction === "Rejected" && !adminRemarks.trim()) {
      toast.error("Please provide remarks for rejection");
      return;
    }

    if (adminRemarks.trim() && adminRemarks.trim().length < 5) {
      toast.error("Remarks must be at least 5 characters");
      return;
    }

    try {
      setProcessing(true);

      toast.loading(
        `${
          processAction === "Approved" ? "Approving" : "Rejecting"
        } email change request...`
      );

      const processData = {
        RequestId: selectedRequest.requestId,
        Status: processAction,
        AdminRemarks: adminRemarks.trim() || null,
      };

      const response = await ChangeRequestService.processChangeRequest(
        processData
      );

      if (response.success) {
        toast.dismiss();
        toast.success(
          response.message ||
            `Email change request ${processAction.toLowerCase()} successfully!`
        );

        setShowProcessModal(false);
        setSelectedRequest(null);
        setAdminRemarks("");

        fetchRequests(true);
      } else {
        toast.dismiss();
        toast.error(
          response.message || "Failed to process email change request"
        );
      }
    } catch (error) {
      console.error("Error processing email change request:", error);
      toast.dismiss();
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to process email change request"
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleModalClose = () => {
    setShowProcessModal(false);
    setSelectedRequest(null);
    setAdminRemarks("");
    setProcessAction("");
  };

  // ========================
  // UI HELPER FUNCTIONS
  // ========================

  const getStatusBadge = (status) => {
    const statusClasses = {
      Pending: "crm-status-pending",
      Approved: "crm-status-approved",
      Rejected: "crm-status-rejected",
      Cancelled: "crm-status-cancelled",
    };
    return `crm-status-badge ${
      statusClasses[status] || "crm-status-badge-default"
    }`;
  };

  // getChangeTypeBadge REMOVED - not needed for email only

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (date) => {
    if (!date) return "";
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getInitials = (name) => {
    if (!name) return "NA";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (
        parts[0].charAt(0).toUpperCase() + parts[1].charAt(0).toUpperCase()
      );
    }
    return name.substring(0, 2).toUpperCase();
  };

  // ========================
  // PAGINATION FUNCTIONS
  // ========================

  const totalPages = Math.ceil(filteredRequests.length / rowsPerPage);

  const getPaginatedRequests = () => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredRequests.slice(startIndex, endIndex);
  };

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

  // ========================
  // RENDER FUNCTIONS
  // ========================

  const renderProcessModal = () => {
    if (!showProcessModal || !selectedRequest) return null;

    return (
      <>
        <div className="crm-modal-backdrop-process"></div>

        <div className="crm-modal-wrapper-process">
          <div className="crm-modal-dialog-process">
            <div
              className={`crm-modal-header-process ${
                processAction === "Approved"
                  ? "crm-modal-header-success"
                  : "crm-modal-header-danger"
              }`}
            >
              <h5 className="crm-modal-title-process">
                <i
                  className={`bi ${
                    processAction === "Approved"
                      ? "bi-check-circle-fill"
                      : "bi-x-circle-fill"
                  }`}
                ></i>
                {processAction === "Approved"
                  ? "Approve Email Change Request"
                  : "Reject Email Change Request"}
              </h5>
              <button
                type="button"
                className="crm-modal-close-btn-process"
                onClick={handleModalClose}
                disabled={processing}
                aria-label="Close"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="crm-modal-body-process">
              <div className="crm-request-details-box">
                <h6 className="crm-details-title">
                  <i className="bi bi-info-circle me-2"></i>
                  Request Details
                </h6>

                <div className="crm-details-grid-horizontal">
                  <div className="crm-detail-row">
                    <div className="crm-detail-label">Request ID:</div>
                    <div className="crm-detail-value">
                      #{selectedRequest.requestId}
                    </div>
                  </div>

                  <div className="crm-detail-row">
                    <div className="crm-detail-label">Employee:</div>
                    <div className="crm-detail-value">
                      <strong>{selectedRequest.employeeName}</strong>
                      <small className="text-muted d-block">
                        @{selectedRequest.employeeCompanyId}
                      </small>
                    </div>
                  </div>

                  {/* Change Type row REMOVED */}

                  <div className="crm-detail-row">
                    <div className="crm-detail-label">Current Email:</div>
                    <div className="crm-detail-value">
                      <code className="crm-value-code crm-current-value">
                        {selectedRequest.currentValue || "Not set"}
                      </code>
                    </div>
                  </div>

                  <div className="crm-detail-row">
                    <div className="crm-detail-label">New Email:</div>
                    <div className="crm-detail-value">
                      <code className="crm-value-code crm-new-value">
                        {selectedRequest.newValue}
                      </code>
                    </div>
                  </div>

                  <div className="crm-detail-row">
                    <div className="crm-detail-label">Requested At:</div>
                    <div className="crm-detail-value">
                      {formatDate(selectedRequest.requestedAt)}
                    </div>
                  </div>

                  {selectedRequest.reason && (
                    <div className="crm-detail-row crm-full-width">
                      <div className="crm-detail-label">Employee Reason:</div>
                      <div className="crm-detail-value">
                        <div className="crm-reason-box">
                          {selectedRequest.reason}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="crm-form-group-process">
                <label className="crm-form-label-process">
                  Admin Remarks{" "}
                  {processAction === "Rejected" && (
                    <span className="crm-required-mark">*</span>
                  )}
                </label>
                <textarea
                  className="crm-form-textarea-process"
                  rows="4"
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  placeholder={
                    processAction === "Approved"
                      ? "Optional: Add remarks for approval (e.g., Email change approved as requested)"
                      : "Required: Provide detailed reason for rejection"
                  }
                  disabled={processing}
                  maxLength={500}
                ></textarea>
                <small className="crm-helper-text-process">
                  {adminRemarks.length}/500 characters
                </small>
              </div>

              {processAction === "Approved" && (
                <div className="crm-info-alert-process">
                  <i className="bi bi-info-circle"></i>
                  <div>
                    <strong>Note:</strong> The email will be updated
                    automatically after approval. The employee will be notified
                    via email.
                  </div>
                </div>
              )}

              {processAction === "Rejected" && (
                <div className="crm-warning-alert-process">
                  <i className="bi bi-exclamation-triangle"></i>
                  <div>
                    <strong>Warning:</strong> Please provide a clear reason for
                    rejection. The employee will be able to see your remarks.
                  </div>
                </div>
              )}
            </div>

            <div className="crm-modal-footer-process">
              <button
                type="button"
                className="crm-btn-cancel-process"
                onClick={handleModalClose}
                disabled={processing}
              >
                <i className="bi bi-x-circle"></i>
                Cancel
              </button>

              <button
                type="button"
                className={`crm-btn-submit-process ${
                  processAction === "Approved"
                    ? "crm-btn-success-process"
                    : "crm-btn-danger-process"
                }`}
                onClick={handleProcessSubmit}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <span className="crm-spinner-process"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <i
                      className={`bi ${
                        processAction === "Approved"
                          ? "bi-check-circle"
                          : "bi-x-circle"
                      }`}
                    ></i>
                    {processAction === "Approved" ? "Approve" : "Reject"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };

  if (loading) {
    return (
      <div className="crm-loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="crm-change-request-page">
      <nav className="crm-breadcrumb-nav" aria-label="breadcrumb">
        <ol className="crm-breadcrumb">
          <li className="crm-breadcrumb-item">
            <i className="bi bi-house-door"></i>
            <span>Dashboard</span>
          </li>
          <li className="crm-breadcrumb-item active" aria-current="page">
            Email Change Request Management
          </li>
        </ol>
      </nav>

      <div className="crm-page-header">
        <div className="crm-header-content">
          <div className="crm-header-text">
            <h2 className="crm-page-title">Email Change Request Management</h2>
            <p className="crm-page-description">
              Review and manage employee email change requests
            </p>
          </div>
        </div>
        <div className="crm-header-actions">
          {lastUpdated && (
            <span className="crm-last-updated-text">
              <i className="bi bi-clock-history"></i>
              Last updated: {formatTime(lastUpdated)}
            </span>
          )}
          <button className="crm-btn-refresh" onClick={() => fetchRequests()}>
            <i className="bi bi-arrow-clockwise"></i>
            Refresh
          </button>
        </div>
      </div>

      <div className="crm-request-tabs">
        <button
          className={`crm-tab-btn ${activeTab === "pending" ? "active" : ""}`}
          onClick={() => setActiveTab("pending")}
        >
          <i className="bi bi-hourglass-split me-2"></i>
          Pending Requests
          {requests.filter((r) => r.status === "Pending").length > 0 && (
            <span className="badge bg-warning ms-2">
              {requests.filter((r) => r.status === "Pending").length}
            </span>
          )}
        </button>

        <button
          className={`crm-tab-btn ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          <i className="bi bi-list-ul me-2"></i>
          All Requests
        </button>
      </div>

      <div className="crm-filters-card">
        <div className="crm-filters-content">
          <div className="crm-filters-left">
            <div className="crm-search-box">
              <i className="bi bi-search crm-search-icon"></i>
              <input
                type="text"
                className="crm-search-input"
                placeholder="Search by name, ID, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Type Filter REMOVED */}

            {activeTab === "all" && (
              <select
                className="crm-filter-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            )}

            <input
              type="date"
              className="crm-filter-date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="crm-stats-grid">
        <div className="crm-stat-card">
          <div className="crm-stat-icon crm-stat-icon-primary">
            <i className="bi bi-inbox-fill"></i>
          </div>
          <div className="crm-stat-content">
            <h3 className="crm-stat-value">{requests.length}</h3>
            <p className="crm-stat-label">Total Requests</p>
          </div>
        </div>

        <div className="crm-stat-card">
          <div className="crm-stat-icon crm-stat-icon-warning">
            <i className="bi bi-hourglass-split"></i>
          </div>
          <div className="crm-stat-content">
            <h3 className="crm-stat-value">
              {requests.filter((r) => r.status === "Pending").length}
            </h3>
            <p className="crm-stat-label">Pending</p>
          </div>
        </div>

        <div className="crm-stat-card">
          <div className="crm-stat-icon crm-stat-icon-success">
            <i className="bi bi-check-circle-fill"></i>
          </div>
          <div className="crm-stat-content">
            <h3 className="crm-stat-value">
              {requests.filter((r) => r.status === "Approved").length}
            </h3>
            <p className="crm-stat-label">Approved</p>
          </div>
        </div>

        <div className="crm-stat-card">
          <div className="crm-stat-icon crm-stat-icon-danger">
            <i className="bi bi-x-circle-fill"></i>
          </div>
          <div className="crm-stat-content">
            <h3 className="crm-stat-value">
              {requests.filter((r) => r.status === "Rejected").length}
            </h3>
            <p className="crm-stat-label">Rejected</p>
          </div>
        </div>
      </div>

      <div className="crm-table-card">
        <div className="crm-table-wrapper">
          <table className="crm-request-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Employee</th>
                {/* Type column REMOVED */}
                <th>Current Email</th>
                <th>New Email</th>
                <th>Status</th>
                <th>Requested</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {getPaginatedRequests().length === 0 ? (
                <tr>
                  <td colSpan="7" className="crm-empty-state">
                    <i className="bi bi-inbox"></i>
                    <p>No email change requests found</p>
                  </td>
                </tr>
              ) : (
                getPaginatedRequests().map((request) => (
                  <tr key={request.requestId}>
                    <td>
                      <span className="crm-request-id">
                        #{request.requestId}
                      </span>
                    </td>

                    <td>
                      <div className="crm-user-info">
                        <div className="crm-user-avatar">
                          {getInitials(request.employeeName)}
                        </div>
                        <div>
                          <span className="crm-user-name">
                            {request.employeeName}
                          </span>
                          <small className="crm-user-id">
                            @{request.employeeCompanyId}
                          </small>
                        </div>
                      </div>
                    </td>

                    {/* Type badge column REMOVED */}

                    <td>
                      <code className="crm-value-display crm-current-value">
                        {request.currentValue || "N/A"}
                      </code>
                    </td>

                    <td>
                      <code className="crm-value-display crm-new-value">
                        {request.newValue}
                      </code>
                    </td>

                    <td>
                      <span className={getStatusBadge(request.status)}>
                        {request.status}
                      </span>
                    </td>

                    <td className="text-muted">
                      {formatDate(request.requestedAt)}
                    </td>

                    <td>
                      <div className="crm-action-buttons">
                        {request.status === "Pending" ? (
                          <>
                            <button
                              className="crm-action-btn crm-action-btn-approve"
                              onClick={() =>
                                handleProcessClick(request, "Approved")
                              }
                              title="Approve Request"
                            >
                              <i className="bi bi-check-circle"></i>
                            </button>
                            <button
                              className="crm-action-btn crm-action-btn-reject"
                              onClick={() =>
                                handleProcessClick(request, "Rejected")
                              }
                              title="Reject Request"
                            >
                              <i className="bi bi-x-circle"></i>
                            </button>
                          </>
                        ) : (
                          <div className="crm-processed-info">
                            <small className="text-muted">
                              {formatDate(request.processedAt)}
                            </small>
                            {request.adminRemarks && (
                              <div
                                className="crm-admin-remarks-tooltip"
                                title={request.adminRemarks}
                              >
                                <i className="bi bi-chat-left-text"></i>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredRequests.length > 0 && (
          <div className="crm-pagination-container">
            <div className="crm-pagination-info">
              <span className="crm-pagination-label">Show</span>
              <select
                className="crm-pagination-select"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <span className="crm-pagination-label">entries</span>
            </div>

            <div className="crm-pagination-status">
              Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
              {Math.min(currentPage * rowsPerPage, filteredRequests.length)} of{" "}
              {filteredRequests.length} entries
            </div>

            <nav className="crm-pagination-nav">
              <ul className="crm-pagination">
                <li
                  className={`crm-page-item ${
                    currentPage === 1 ? "disabled" : ""
                  }`}
                >
                  <button
                    className="crm-page-link"
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
                    className={`crm-page-item ${
                      page === currentPage ? "active" : ""
                    } ${typeof page !== "number" ? "disabled" : ""}`}
                  >
                    <button
                      className="crm-page-link"
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
                  className={`crm-page-item ${
                    currentPage === totalPages ? "disabled" : ""
                  }`}
                >
                  <button
                    className="crm-page-link"
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
          </div>
        )}
      </div>

      {renderProcessModal()}
    </div>
  );
};

export default ChangeRequestManagement;
