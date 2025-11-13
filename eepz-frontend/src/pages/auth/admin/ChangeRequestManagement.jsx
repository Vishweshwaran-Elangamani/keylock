/**
 * ChangeRequestManagement Component
 * 
 * Admin interface for managing employee change requests (Email & Employee Company ID).
 * Features:
 * - Tab-based view: Pending requests vs All requests
 * - Advanced filtering: Search, type, status, date filters
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

  /**
   * Data States
   * - requests: All requests fetched from backend
   * - filteredRequests: Requests after applying filters
   * - loading: Loading state for initial data fetch
   * - lastUpdated: Timestamp of last data refresh
   */
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  /**
   * Tab State
   * Controls which tab is active: "pending" or "all"
   */
  const [activeTab, setActiveTab] = useState("pending");

  /**
   * Filter States
   * - searchTerm: Text search across multiple fields
   * - filterType: Filter by change type (Email/EmployeeCompanyId)
   * - filterStatus: Filter by request status (Pending/Approved/Rejected/Cancelled)
   * - filterDate: Filter by specific date
   */
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState("");

  /**
   * Pagination States
   * - rowsPerPage: Number of rows to display per page
   * - currentPage: Current active page number
   */
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  /**
   * Modal States
   * - showProcessModal: Controls process modal visibility
   * - selectedRequest: Currently selected request for processing
   * - processAction: Action to perform (Approved/Rejected)
   * - adminRemarks: Admin's comments/remarks for the action
   * - processing: Loading state during request processing
   */
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [processAction, setProcessAction] = useState("");
  const [adminRemarks, setAdminRemarks] = useState("");
  const [processing, setProcessing] = useState(false);

  // ========================
  // EFFECTS
  // ========================

  /**
   * Effect: Fetch Data & Setup Auto-Refresh
   * Runs when component mounts and when activeTab changes
   * Sets up 30-second interval for auto-refresh
   */
  useEffect(() => {
    fetchRequests();

    // Setup auto-refresh interval
    const refreshInterval = setInterval(() => {
      fetchRequests(true); // Silent refresh (no loading toast)
    }, 30000); // 30 seconds

    // Cleanup interval on unmount
    return () => clearInterval(refreshInterval);
  }, [activeTab]);

  /**
   * Effect: Apply Filters
   * Runs whenever requests data or any filter criteria changes
   * Automatically refilters and resets pagination
   */
  useEffect(() => {
    applyFilters();
  }, [requests, searchTerm, filterType, filterStatus, filterDate]);

  // ========================
  // API FUNCTIONS
  // ========================

  /**
   * Fetches change requests from backend
   * Fetches pending requests for "pending" tab, all requests for "all" tab
   * Shows Sonner toast notifications for user feedback
   * 
   * @param {boolean} silent - If true, skips loading toast (for auto-refresh)
   */
  const fetchRequests = async (silent = false) => {
    try {
      setLoading(true);
      
      // Show loading toast only if not silent refresh
      if (!silent) {
        toast.loading("Loading change requests...");
      }

      // Fetch data based on active tab
      let response;
      if (activeTab === "pending") {
        response = await ChangeRequestService.getPendingRequests();
      } else {
        response = await ChangeRequestService.getAllChangeRequests();
      }

      // -------- Handle Success Response --------
      if (response.success) {
        setRequests(response.data || []);
        setLastUpdated(new Date());
        
        if (!silent) {
          toast.dismiss();
          toast.success(
            `Loaded ${response.data?.length || 0} change requests successfully`
          );
        }
      } else {
        // -------- Handle Failure Response --------
        toast.dismiss();
        toast.error(response.message || "Failed to fetch requests");
      }
    } catch (error) {
      // -------- Handle Exception --------
      console.error("Error fetching change requests:", error);
      toast.dismiss();
      toast.error("Failed to fetch change requests");
    } finally {
      setLoading(false);
    }
  };

  // ========================
  // FILTER FUNCTIONS
  // ========================

  /**
   * Applies all active filters to requests
   * Filters by: tab (pending/all), search term, type, status, and date
   * Updates filteredRequests state and resets pagination to page 1
   */
  const applyFilters = () => {
    let filtered = [...requests];

    // -------- Tab Filter --------
    // For pending tab, show only Pending status requests
    if (activeTab === "pending") {
      filtered = filtered.filter((req) => req.status === "Pending");
    }

    // -------- Search Filter --------
    // Search across employee name, company ID, change type, and values
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (req) =>
          req.employeeName?.toLowerCase().includes(search) ||
          req.employeeCompanyId?.toLowerCase().includes(search) ||
          req.changeType?.toLowerCase().includes(search) ||
          req.currentValue?.toLowerCase().includes(search) ||
          req.newValue?.toLowerCase().includes(search)
      );
    }

    // -------- Type Filter --------
    // Filter by change type (Email or EmployeeCompanyId)
    if (filterType) {
      filtered = filtered.filter((req) => req.changeType === filterType);
    }

    // -------- Status Filter --------
    // Only applicable in 'all' tab
    if (filterStatus && activeTab === "all") {
      filtered = filtered.filter((req) => req.status === filterStatus);
    }

    // -------- Date Filter --------
    // Filter by specific date (matches day, ignores time)
    if (filterDate) {
      filtered = filtered.filter((req) => {
        const requestDate = new Date(req.requestedAt);
        const filterDateObj = new Date(filterDate);
        return requestDate.toDateString() === filterDateObj.toDateString();
      });
    }

    // Update filtered requests and reset pagination
    setFilteredRequests(filtered);
    setCurrentPage(1);
  };

  // ========================
  // PROCESS REQUEST HANDLERS
  // ========================

  /**
   * Opens the process modal for approve/reject action
   * Sets selected request and action type, resets remarks
   * Shows informational toast
   * 
   * @param {Object} request - The request object to process
   * @param {string} action - Action type ("Approved" or "Rejected")
   */
  const handleProcessClick = (request, action) => {
    setSelectedRequest(request);
    setProcessAction(action);
    setAdminRemarks("");
    setShowProcessModal(true);
    toast.info(`Processing request #${request.requestId}`);
  };

  /**
   * Submits the approve/reject action
   * Validates admin remarks (required for rejection, min 5 chars)
   * Calls backend API and shows Sonner toast notifications
   * Refreshes data after successful processing
   */
  const handleProcessSubmit = async () => {
    if (!selectedRequest) return;

    // -------- Validation --------
    // Remarks are required for rejection
    if (processAction === "Rejected" && !adminRemarks.trim()) {
      toast.error("Please provide remarks for rejection");
      return;
    }

    // Remarks must be at least 5 characters if provided
    if (adminRemarks.trim() && adminRemarks.trim().length < 5) {
      toast.error("Remarks must be at least 5 characters");
      return;
    }

    try {
      setProcessing(true);
      
      // Show loading toast
      toast.loading(
        `${processAction === "Approved" ? "Approving" : "Rejecting"} request...`
      );

      // -------- Prepare Payload --------
      const processData = {
        RequestId: selectedRequest.requestId,
        Status: processAction,
        AdminRemarks: adminRemarks.trim() || null,
      };

      // -------- API Call --------
      const response = await ChangeRequestService.processChangeRequest(processData);

      // -------- Handle Success Response --------
      if (response.success) {
        toast.dismiss();
        toast.success(
          response.message || `Request ${processAction.toLowerCase()} successfully!`
        );
        
        // Close modal and reset states
        setShowProcessModal(false);
        setSelectedRequest(null);
        setAdminRemarks("");
        
        // Refresh data (silent refresh)
        fetchRequests(true);
      } else {
        // -------- Handle Failure Response --------
        toast.dismiss();
        toast.error(response.message || "Failed to process request");
      }
    } catch (error) {
      // -------- Handle Exception --------
      console.error("Error processing request:", error);
      toast.dismiss();
      toast.error(
        error.response?.data?.message || error.message || "Failed to process request"
      );
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Closes the process modal and resets all modal-related states
   */
  const handleModalClose = () => {
    setShowProcessModal(false);
    setSelectedRequest(null);
    setAdminRemarks("");
    setProcessAction("");
  };

  // ========================
  // UI HELPER FUNCTIONS
  // ========================

  /**
   * Returns appropriate CSS class for status badge
   * 
   * @param {string} status - Request status
   * @returns {string} CSS class name
   */
  const getStatusBadge = (status) => {
    const statusClasses = {
      Pending: "crm-status-pending",
      Approved: "crm-status-approved",
      Rejected: "crm-status-rejected",
      Cancelled: "crm-status-cancelled",
    };
    return `crm-status-badge ${statusClasses[status] || "crm-status-badge-default"}`;
  };

  /**
   * Returns appropriate CSS class for change type badge
   * 
   * @param {string} type - Change type (Email/EmployeeCompanyId)
   * @returns {string} CSS class name
   */
  const getChangeTypeBadge = (type) => {
    const typeClasses = {
      Email: "crm-type-email",
      EmployeeCompanyId: "crm-type-empid",
    };
    return `crm-type-badge ${typeClasses[type] || "crm-type-badge-default"}`;
  };

  /**
   * Formats ISO date string to readable format
   * 
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date string
   */
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

  /**
   * Formats Date object to time string
   * 
   * @param {Date} date - Date object
   * @returns {string} Formatted time string
   */
  const formatTime = (date) => {
    if (!date) return "";
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  /**
   * Generates user initials from full name
   * Used for avatar display
   * 
   * @param {string} name - Full name
   * @returns {string} Initials (2 characters)
   */
  const getInitials = (name) => {
    if (!name) return "NA";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return parts[0].charAt(0).toUpperCase() + parts[1].charAt(0).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // ========================
  // PAGINATION FUNCTIONS
  // ========================

  /**
   * Calculates total number of pages based on filtered requests
   */
  const totalPages = Math.ceil(filteredRequests.length / rowsPerPage);

  /**
   * Returns the slice of requests for current page
   * 
   * @returns {Array} Paginated requests array
   */
  const getPaginatedRequests = () => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredRequests.slice(startIndex, endIndex);
  };

  /**
   * Generates array of page numbers for pagination UI
   * Shows first, last, current, and nearby pages with ellipsis
   * 
   * @returns {Array} Array of page numbers and ellipsis ("...")
   */
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      // Show all pages if total pages <= 5
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages with ellipsis for better UX
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

  /**
   * Renders the Process Request Modal
   * Shows request details and allows admin to approve/reject with remarks
   * 
   * @returns {JSX.Element|null} Modal component or null if not shown
   */
  const renderProcessModal = () => {
    if (!showProcessModal || !selectedRequest) return null;

    return (
      <>
        {/* Modal Backdrop */}
        <div className="crm-modal-backdrop-process"></div>
        
        {/* Modal Wrapper */}
        <div className="crm-modal-wrapper-process">
          <div className="crm-modal-dialog-process">
            
            {/* ======================== */}
            {/* MODAL HEADER */}
            {/* ======================== */}
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
                  ? "Approve Change Request"
                  : "Reject Change Request"}
              </h5>
              {/* Close Button */}
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

            {/* ======================== */}
            {/* MODAL BODY */}
            {/* ======================== */}
            <div className="crm-modal-body-process">
              
              {/* -------- Request Details Box -------- */}
              <div className="crm-request-details-box">
                <h6 className="crm-details-title">
                  <i className="bi bi-info-circle me-2"></i>
                  Request Details
                </h6>

                {/* Details Grid - Horizontal Layout */}
                <div className="crm-details-grid-horizontal">
                  
                  {/* Request ID */}
                  <div className="crm-detail-row">
                    <div className="crm-detail-label">Request ID:</div>
                    <div className="crm-detail-value">#{selectedRequest.requestId}</div>
                  </div>

                  {/* Employee Info */}
                  <div className="crm-detail-row">
                    <div className="crm-detail-label">Employee:</div>
                    <div className="crm-detail-value">
                      <strong>{selectedRequest.employeeName}</strong>
                      <small className="text-muted d-block">
                        @{selectedRequest.employeeCompanyId}
                      </small>
                    </div>
                  </div>

                  {/* Change Type */}
                  <div className="crm-detail-row">
                    <div className="crm-detail-label">Change Type:</div>
                    <div className="crm-detail-value">
                      <span className={getChangeTypeBadge(selectedRequest.changeType)}>
                        {selectedRequest.changeType === "EmployeeCompanyId"
                          ? "Employee Company ID"
                          : "Email Address"}
                      </span>
                    </div>
                  </div>

                  {/* Current Value */}
                  <div className="crm-detail-row">
                    <div className="crm-detail-label">Current Value:</div>
                    <div className="crm-detail-value">
                      <code className="crm-value-code crm-current-value">
                        {selectedRequest.currentValue || "Not set"}
                      </code>
                    </div>
                  </div>

                  {/* New Value */}
                  <div className="crm-detail-row">
                    <div className="crm-detail-label">New Value:</div>
                    <div className="crm-detail-value">
                      <code className="crm-value-code crm-new-value">{selectedRequest.newValue}</code>
                    </div>
                  </div>

                  {/* Requested Date */}
                  <div className="crm-detail-row">
                    <div className="crm-detail-label">Requested At:</div>
                    <div className="crm-detail-value">{formatDate(selectedRequest.requestedAt)}</div>
                  </div>

                  {/* Employee Reason - Full Width */}
                  <div className="crm-detail-row crm-full-width">
                    <div className="crm-detail-label">Employee Reason:</div>
                    <div className="crm-detail-value">
                      <div className="crm-reason-box">{selectedRequest.reason}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* -------- Admin Remarks Form Group -------- */}
              <div className="crm-form-group-process">
                <label className="crm-form-label-process">
                  Admin Remarks{" "}
                  {processAction === "Rejected" && <span className="crm-required-mark">*</span>}
                </label>
                <textarea
                  className="crm-form-textarea-process"
                  rows="4"
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  placeholder={
                    processAction === "Approved"
                      ? "Optional: Add remarks for approval (e.g., Approved as requested)"
                      : "Required: Provide detailed reason for rejection"
                  }
                  disabled={processing}
                  maxLength={500}
                ></textarea>
                <small className="crm-helper-text-process">
                  {adminRemarks.length}/500 characters
                </small>
              </div>

              {/* -------- Info/Warning Alerts -------- */}
              {processAction === "Approved" && (
                <div className="crm-info-alert-process">
                  <i className="bi bi-info-circle"></i>
                  <div>
                    <strong>Note:</strong> The change will be applied automatically after approval.
                    The employee will be notified via email.
                  </div>
                </div>
              )}

              {processAction === "Rejected" && (
                <div className="crm-warning-alert-process">
                  <i className="bi bi-exclamation-triangle"></i>
                  <div>
                    <strong>Warning:</strong> Please provide a clear reason for rejection. The employee will
                    be able to see your remarks.
                  </div>
                </div>
              )}
            </div>

            {/* ======================== */}
            {/* MODAL FOOTER */}
            {/* ======================== */}
            <div className="crm-modal-footer-process">
              {/* Cancel Button */}
              <button
                type="button"
                className="crm-btn-cancel-process"
                onClick={handleModalClose}
                disabled={processing}
              >
                <i className="bi bi-x-circle"></i>
                Cancel
              </button>
              
              {/* Submit Button (Approve/Reject) */}
              <button
                type="button"
                className={`crm-btn-submit-process ${
                  processAction === "Approved" ? "crm-btn-success-process" : "crm-btn-danger-process"
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
                        processAction === "Approved" ? "bi-check-circle" : "bi-x-circle"
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

  // ========================
  // MAIN RENDER - LOADING STATE
  // ========================

  /**
   * Show loading spinner while initial data is being fetched
   */
  if (loading) {
    return (
      <div className="crm-loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // ========================
  // MAIN RENDER - PAGE CONTENT
  // ========================

  return (
    <div className="crm-change-request-page">
      
      {/* ======================== */}
      {/* BREADCRUMB NAVIGATION */}
      {/* ======================== */}
      <nav className="crm-breadcrumb-nav" aria-label="breadcrumb">
        <ol className="crm-breadcrumb">
          <li className="crm-breadcrumb-item">
            <i className="bi bi-house-door"></i>
            <span>Dashboard</span>
          </li>
          <li className="crm-breadcrumb-item active" aria-current="page">
            Change Request Management
          </li>
        </ol>
      </nav>

      {/* ======================== */}
      {/* PAGE HEADER */}
      {/* ======================== */}
      <div className="crm-page-header">
        <div className="crm-header-content">
          <div className="crm-header-text">
            <h2 className="crm-page-title">Change Request Management</h2>
            <p className="crm-page-description">
              Review and manage employee change requests for Email and Employee Company ID
            </p>
          </div>
        </div>
        <div className="crm-header-actions">
          {/* Last Updated Timestamp */}
          {lastUpdated && (
            <span className="crm-last-updated-text">
              <i className="bi bi-clock-history"></i>
              Last updated: {formatTime(lastUpdated)}
            </span>
          )}
          {/* Refresh Button */}
          <button className="crm-btn-refresh" onClick={() => fetchRequests()}>
            <i className="bi bi-arrow-clockwise"></i>
            Refresh
          </button>
        </div>
      </div>

      {/* ======================== */}
      {/* TABS (Pending vs All) */}
      {/* ======================== */}
      <div className="crm-request-tabs">
        {/* Pending Requests Tab */}
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
        
        {/* All Requests Tab */}
        <button
          className={`crm-tab-btn ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          <i className="bi bi-list-ul me-2"></i>
          All Requests
        </button>
      </div>

      {/* ======================== */}
      {/* FILTERS SECTION */}
      {/* ======================== */}
      <div className="crm-filters-card">
        <div className="crm-filters-content">
          <div className="crm-filters-left">
            
            {/* -------- Search Box -------- */}
            <div className="crm-search-box">
              <i className="bi bi-search crm-search-icon"></i>
              <input
                type="text"
                className="crm-search-input"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* -------- Type Filter -------- */}
            <select
              className="crm-filter-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="Email">Email</option>
              <option value="EmployeeCompanyId">Employee Company ID</option>
            </select>

            {/* -------- Status Filter (Only for 'All' tab) -------- */}
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

            {/* -------- Date Filter -------- */}
            <input
              type="date"
              className="crm-filter-date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ======================== */}
      {/* STATISTICS CARDS */}
      {/* ======================== */}
      <div className="crm-stats-grid">
        
        {/* Total Requests Card */}
        <div className="crm-stat-card">
          <div className="crm-stat-icon crm-stat-icon-primary">
            <i className="bi bi-inbox-fill"></i>
          </div>
          <div className="crm-stat-content">
            <h3 className="crm-stat-value">{requests.length}</h3>
            <p className="crm-stat-label">Total Requests</p>
          </div>
        </div>

        {/* Pending Requests Card */}
        <div className="crm-stat-card">
          <div className="crm-stat-icon crm-stat-icon-warning">
            <i className="bi bi-hourglass-split"></i>
          </div>
          <div className="crm-stat-content">
            <h3 className="crm-stat-value">{requests.filter((r) => r.status === "Pending").length}</h3>
            <p className="crm-stat-label">Pending</p>
          </div>
        </div>

        {/* Approved Requests Card */}
        <div className="crm-stat-card">
          <div className="crm-stat-icon crm-stat-icon-success">
            <i className="bi bi-check-circle-fill"></i>
          </div>
          <div className="crm-stat-content">
            <h3 className="crm-stat-value">{requests.filter((r) => r.status === "Approved").length}</h3>
            <p className="crm-stat-label">Approved</p>
          </div>
        </div>

        {/* Rejected Requests Card */}
        <div className="crm-stat-card">
          <div className="crm-stat-icon crm-stat-icon-danger">
            <i className="bi bi-x-circle-fill"></i>
          </div>
          <div className="crm-stat-content">
            <h3 className="crm-stat-value">{requests.filter((r) => r.status === "Rejected").length}</h3>
            <p className="crm-stat-label">Rejected</p>
          </div>
        </div>
      </div>

      {/* ======================== */}
      {/* REQUESTS TABLE */}
      {/* ======================== */}
      <div className="crm-table-card">
        <div className="crm-table-wrapper">
          <table className="crm-request-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Employee</th>
                <th>Type</th>
                <th>Current Value</th>
                <th>New Value</th>
                <th>Status</th>
                <th>Requested</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {getPaginatedRequests().length === 0 ? (
                // -------- Empty State --------
                <tr>
                  <td colSpan="8" className="crm-empty-state">
                    <i className="bi bi-inbox"></i>
                    <p>No change requests found</p>
                  </td>
                </tr>
              ) : (
                // -------- Request Rows --------
                getPaginatedRequests().map((request) => (
                  <tr key={request.requestId}>
                    {/* Request ID */}
                    <td>
                      <span className="crm-request-id">#{request.requestId}</span>
                    </td>
                    
                    {/* Employee Info */}
                    <td>
                      <div className="crm-user-info">
                        <div className="crm-user-avatar">{getInitials(request.employeeName)}</div>
                        <div>
                          <span className="crm-user-name">{request.employeeName}</span>
                          <small className="crm-user-id">@{request.employeeCompanyId}</small>
                        </div>
                      </div>
                    </td>
                    
                    {/* Change Type Badge */}
                    <td>
                      <span className={getChangeTypeBadge(request.changeType)}>
                        {request.changeType === "EmployeeCompanyId" ? "Emp ID" : "Email"}
                      </span>
                    </td>
                    
                    {/* Current Value */}
                    <td>
                      <code className="crm-value-display crm-current-value">
                        {request.currentValue || "N/A"}
                      </code>
                    </td>
                    
                    {/* New Value */}
                    <td>
                      <code className="crm-value-display crm-new-value">{request.newValue}</code>
                    </td>
                    
                    {/* Status Badge */}
                    <td>
                      <span className={getStatusBadge(request.status)}>{request.status}</span>
                    </td>
                    
                    {/* Requested Date */}
                    <td className="text-muted">{formatDate(request.requestedAt)}</td>
                    
                    {/* Actions */}
                    <td>
                      <div className="crm-action-buttons">
                        {request.status === "Pending" ? (
                          // Show Approve/Reject buttons for pending requests
                          <>
                            <button
                              className="crm-action-btn crm-action-btn-approve"
                              onClick={() => handleProcessClick(request, "Approved")}
                              title="Approve Request"
                            >
                              <i className="bi bi-check-circle"></i>
                            </button>
                            <button
                              className="crm-action-btn crm-action-btn-reject"
                              onClick={() => handleProcessClick(request, "Rejected")}
                              title="Reject Request"
                            >
                              <i className="bi bi-x-circle"></i>
                            </button>
                          </>
                        ) : (
                          // Show processed date and remarks icon for processed requests
                          <div className="crm-processed-info">
                            <small className="text-muted">{formatDate(request.processedAt)}</small>
                            {request.adminRemarks && (
                              <div className="crm-admin-remarks-tooltip" title={request.adminRemarks}>
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

        {/* ======================== */}
        {/* PAGINATION */}
        {/* ======================== */}
        {filteredRequests.length > 0 && (
          <div className="crm-pagination-container">
            
            {/* Rows Per Page Selector */}
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

            {/* Pagination Status Text */}
            <div className="crm-pagination-status">
              Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
              {Math.min(currentPage * rowsPerPage, filteredRequests.length)} of{" "}
              {filteredRequests.length} entries
            </div>

            {/* Pagination Navigation */}
            <nav className="crm-pagination-nav">
              <ul className="crm-pagination">
                {/* Previous Button */}
                <li className={`crm-page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button
                    className="crm-page-link"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                </li>

                {/* Page Numbers */}
                {getPageNumbers().map((page, index) => (
                  <li
                    key={index}
                    className={`crm-page-item ${
                      page === currentPage ? "active" : ""
                    } ${typeof page !== "number" ? "disabled" : ""}`}
                  >
                    <button
                      className="crm-page-link"
                      onClick={() => typeof page === "number" && setCurrentPage(page)}
                      disabled={typeof page !== "number"}
                    >
                      {page}
                    </button>
                  </li>
                ))}

                {/* Next Button */}
                <li className={`crm-page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                  <button
                    className="crm-page-link"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
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

      {/* ======================== */}
      {/* PROCESS MODAL */}
      {/* ======================== */}
      {renderProcessModal()}
    </div>
  );
};

export default ChangeRequestManagement;
