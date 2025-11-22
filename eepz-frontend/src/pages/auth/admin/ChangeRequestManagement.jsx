import { useState, useEffect } from "react";
import { useNavigate, useLocation, Routes, Route } from "react-router-dom";
import ChangeRequestService from "../../../services/auth/changeRequestService";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { toast } from "sonner";
import ApproveEmailChangeModal from "../../../components/auth/Modal/changerequest/ApproveEmailChangeModal";
import RejectEmailChangeModal from "../../../components/auth/Modal/changerequest/RejectEmailChangeModal";
import "../../../styles/auth/admin/ChangeRequestManagement.css";

// Separate component for Pending Requests
const PendingRequests = ({
  requests,
  searchTerm,
  setSearchTerm,
  filterDate,
  setFilterDate,
  clearFilters,
  handleProcessClick,
  getStatusBadge,
  formatDate,
  getInitials,
  rowsPerPage,
  setRowsPerPage,
  currentPage,
  setCurrentPage,
}) => {
  const [filteredRequests, setFilteredRequests] = useState([]);

  useEffect(() => {
    applyFilters();
  }, [requests, searchTerm, filterDate]);

  const applyFilters = () => {
    let filtered = requests.filter((req) => req.status === "Pending");

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

  return (
    <>
      {/* FILTERS CARD */}
      <div className="crm-filters-card">
        <div className="crm-filters-content">
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

          <input
            type="date"
            className="crm-filter-date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />

          <button className="btn-clear-crm" onClick={clearFilters}>
            Clear Filters
          </button>

          <div className="results-count-inline-crm">
            Showing {getPaginatedRequests().length} of {filteredRequests.length}{" "}
            requests
          </div>
        </div>
      </div>

      {/* TABLE CARD */}
      <div className="crm-table-card">
        <div className="crm-table-wrapper">
          <table className="crm-request-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Employee</th>
                <th>Current Email</th>
                <th>New Email</th>
                <th>Status</th>
                <th>Requested</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {getPaginatedRequests().length === 0 ? (
                <tr>
                  <td colSpan="7" className="crm-empty-state">
                    <i className="bi bi-inbox"></i>
                    <p>No pending email change requests found</p>
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
                        <button
                          className="action-btn action-btn-approve"
                          onClick={() =>
                            handleProcessClick(request, "Approved")
                          }
                          title="Approve Request"
                        >
                          <i className="bi bi-check-circle"></i>
                        </button>
                        <button
                          className="action-btn action-btn-reject"
                          onClick={() =>
                            handleProcessClick(request, "Rejected")
                          }
                          title="Reject Request"
                        >
                          <i className="bi bi-x-circle"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {filteredRequests.length > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              <span className="pagination-label">Show</span>
              <select
                className="pagination-select"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <span className="pagination-label">entries</span>
            </div>

            <div className="pagination-status">
              Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
              {Math.min(currentPage * rowsPerPage, filteredRequests.length)} of{" "}
              {filteredRequests.length} entries
            </div>

            <nav className="pagination-nav">
              <ul className="pagination">
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

                {getPageNumbers().map((page, index) => (
                  <li
                    key={index}
                    className={`page-item ${
                      page === currentPage ? "active" : ""
                    } ${typeof page !== "number" ? "disabled" : ""}`}
                  >
                    <button
                      className="page-link"
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
          </div>
        )}
      </div>
    </>
  );
};

// Separate component for All Requests
const AllRequests = ({
  requests,
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  filterDate,
  setFilterDate,
  clearFilters,
  handleProcessClick,
  getStatusBadge,
  formatDate,
  getInitials,
  rowsPerPage,
  setRowsPerPage,
  currentPage,
  setCurrentPage,
}) => {
  const [filteredRequests, setFilteredRequests] = useState([]);

  useEffect(() => {
    applyFilters();
  }, [requests, searchTerm, filterStatus, filterDate]);

  const applyFilters = () => {
    let filtered = [...requests];

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

    if (filterStatus) {
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

  return (
    <>
      {/* FILTERS CARD */}
      <div className="crm-filters-card">
        <div className="crm-filters-content">
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

          <input
            type="date"
            className="crm-filter-date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />

          <button className="btn-clear-crm" onClick={clearFilters}>
            Clear Filters
          </button>

          <div className="results-count-inline-crm">
            Showing {getPaginatedRequests().length} of {filteredRequests.length}{" "}
            requests
          </div>
        </div>
      </div>

      {/* TABLE CARD */}
      <div className="crm-table-card">
        <div className="crm-table-wrapper">
          <table className="crm-request-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Employee</th>
                <th>Current Email</th>
                <th>New Email</th>
                <th>Status</th>
                <th>Requested</th>
                <th>Actions</th>
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
                              className="action-btn action-btn-approve"
                              onClick={() =>
                                handleProcessClick(request, "Approved")
                              }
                              title="Approve Request"
                            >
                              <i className="bi bi-check-circle"></i>
                            </button>
                            <button
                              className="action-btn action-btn-reject"
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

        {/* PAGINATION */}
        {filteredRequests.length > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              <span className="pagination-label">Show</span>
              <select
                className="pagination-select"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <span className="pagination-label">entries</span>
            </div>

            <div className="pagination-status">
              Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
              {Math.min(currentPage * rowsPerPage, filteredRequests.length)} of{" "}
              {filteredRequests.length} entries
            </div>

            <nav className="pagination-nav">
              <ul className="pagination">
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

                {getPageNumbers().map((page, index) => (
                  <li
                    key={index}
                    className={`page-item ${
                      page === currentPage ? "active" : ""
                    } ${typeof page !== "number" ? "disabled" : ""}`}
                  >
                    <button
                      className="page-link"
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
          </div>
        )}
      </div>
    </>
  );
};

// Main Component
const ChangeRequestManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState("");

  // Pagination States
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal States
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Get active tab based on current route
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/pending")) return "pending";
    if (path.includes("/all")) return "all";
    return "pending";
  };

  const [activeTab, setActiveTab] = useState(getActiveTab());

  // Update active tab when route changes
  useEffect(() => {
    setActiveTab(getActiveTab());
  }, [location.pathname]);

  // Define tabs
  const tabs = [
    {
      key: "pending",
      label: "Pending Requests",
      path: "/admin/change-requests/pending",
      icon: "bi-hourglass-split",
    },
    {
      key: "all",
      label: "All Requests",
      path: "/admin/change-requests/all",
      icon: "bi-list-ul",
    },
  ];

  // FETCH ALL REQUESTS ONLY ONCE ON MOUNT
  useEffect(() => {
    fetchRequests();

    const refreshInterval = setInterval(() => {
      fetchRequests(true);
    }, 30000000);

    return () => clearInterval(refreshInterval);
  }, []);

  const fetchRequests = async (silent = false) => {
    try {
      setLoading(true);

      const response = await ChangeRequestService.getAllChangeRequests();

      if (response.success) {
        setRequests(response.data || []);
        setLastUpdated(new Date());

        if (!silent) {
          toast.dismiss();
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

  const clearFilters = () => {
    setSearchTerm("");
    setFilterStatus("");
    setFilterDate("");
  };

  // TAB SWITCHING HANDLER
  const handleTabChange = (tab) => {
    setActiveTab(tab.key);
    navigate(tab.path);
    clearFilters();
    setCurrentPage(1);
  };

  // Updated Process Click Handler
  const handleProcessClick = (request, action) => {
    setSelectedRequest(request);
    if (action === "Approved") {
      setShowApproveModal(true);
    } else {
      setShowRejectModal(true);
    }
    toast.info(`Processing email change request #${request.requestId}`);
  };

  // Approve Handler
  const handleApprove = async (adminRemarks) => {
    try {
      setProcessing(true);
      toast.loading("Approving email change request...");

      const processData = {
        RequestId: selectedRequest.requestId,
        Status: "Approved",
        AdminRemarks: adminRemarks.trim() || null,
      };

      const response = await ChangeRequestService.processChangeRequest(
        processData
      );

      if (response.success) {
        toast.dismiss();
        toast.success(
          response.message || "Email change request approved successfully!"
        );
        setShowApproveModal(false);
        setSelectedRequest(null);
        fetchRequests(true);
      } else {
        toast.dismiss();
        toast.error(
          response.message || "Failed to approve email change request"
        );
      }
    } catch (error) {
      console.error("Error approving email change request:", error);
      toast.dismiss();
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to approve email change request"
      );
    } finally {
      setProcessing(false);
    }
  };

  // Reject Handler
  const handleReject = async (adminRemarks) => {
    try {
      setProcessing(true);
      toast.loading("Rejecting email change request...");

      const processData = {
        RequestId: selectedRequest.requestId,
        Status: "Rejected",
        AdminRemarks: adminRemarks.trim(),
      };

      const response = await ChangeRequestService.processChangeRequest(
        processData
      );

      if (response.success) {
        toast.dismiss();
        toast.success(
          response.message || "Email change request rejected successfully!"
        );
        setShowRejectModal(false);
        setSelectedRequest(null);
        fetchRequests(true);
      } else {
        toast.dismiss();
        toast.error(
          response.message || "Failed to reject email change request"
        );
      }
    } catch (error) {
      console.error("Error rejecting email change request:", error);
      toast.dismiss();
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to reject email change request"
      );
    } finally {
      setProcessing(false);
    }
  };

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

  // Get current tab label for breadcrumb
  const getCurrentTabLabel = () => {
    const currentTab = tabs.find((tab) => tab.key === activeTab);
    return currentTab ? currentTab.label : "Pending Requests";
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
      {/* BREADCRUMB */}
      <Breadcrumb
        items={[
          {
            label: "Email Change Requests",
            path: "/admin/change-requests/pending",
          },
          {
            label: getCurrentTabLabel(),
          },
        ]}
      />

      {/* STATISTICS CARDS */}
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

      {/* TAB NAVIGATION BAR - Like HROperations */}
      <div className="tab-navigation-bar-hr">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`tab-button-hr ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => handleTabChange(tab)}
          >
            <i className={`bi ${tab.icon} me-2`}></i>
            {tab.label}
            {tab.key === "pending" &&
              requests.filter((r) => r.status === "Pending").length > 0 && (
                <span className="badge bg-warning ms-2">
                  {requests.filter((r) => r.status === "Pending").length}
                </span>
              )}
          </button>
        ))}
      </div>

      {/* TAB CONTENT WITH ROUTES */}
      <div className="tab-content-hr">
        <Routes>
          <Route
            path="pending"
            element={
              <PendingRequests
                requests={requests}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterDate={filterDate}
                setFilterDate={setFilterDate}
                clearFilters={clearFilters}
                handleProcessClick={handleProcessClick}
                getStatusBadge={getStatusBadge}
                formatDate={formatDate}
                getInitials={getInitials}
                rowsPerPage={rowsPerPage}
                setRowsPerPage={setRowsPerPage}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
              />
            }
          />
          <Route
            path="all"
            element={
              <AllRequests
                requests={requests}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                filterDate={filterDate}
                setFilterDate={setFilterDate}
                clearFilters={clearFilters}
                handleProcessClick={handleProcessClick}
                getStatusBadge={getStatusBadge}
                formatDate={formatDate}
                getInitials={getInitials}
                rowsPerPage={rowsPerPage}
                setRowsPerPage={setRowsPerPage}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
              />
            }
          />
          <Route
            path="*"
            element={
              <PendingRequests
                requests={requests}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterDate={filterDate}
                setFilterDate={setFilterDate}
                clearFilters={clearFilters}
                handleProcessClick={handleProcessClick}
                getStatusBadge={getStatusBadge}
                formatDate={formatDate}
                getInitials={getInitials}
                rowsPerPage={rowsPerPage}
                setRowsPerPage={setRowsPerPage}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
              />
            }
          />
        </Routes>
      </div>

      {/* MODALS */}
      <ApproveEmailChangeModal
        show={showApproveModal}
        request={selectedRequest}
        onHide={() => setShowApproveModal(false)}
        onApprove={handleApprove}
        processing={processing}
      />

      <RejectEmailChangeModal
        show={showRejectModal}
        request={selectedRequest}
        onHide={() => setShowRejectModal(false)}
        onReject={handleReject}
        processing={processing}
      />
    </div>
  );
};

export default ChangeRequestManagement;
