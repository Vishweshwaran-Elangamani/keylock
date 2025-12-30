import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Routes, Route } from "react-router-dom";
import ChangeRequestService from "../../../services/auth/changeRequestService";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { toast } from "sonner";
import { FaSearch } from "react-icons/fa";
import { Form } from "react-bootstrap";
import ApproveEmailChangeModal from "../../../components/auth/Modal/changerequest/ApproveEmailChangeModal";
import RejectEmailChangeModal from "../../../components/auth/Modal/changerequest/RejectEmailChangeModal";
import "../../../styles/auth/admin/ChangeRequestManagement.css";


const StatusDropdown = ({ value, onChange, options }) => {
  const [open, setOpen] = useState(false);

  const allOptions = [{ label: "All Status", value: "" }, ...options];
  const selected = allOptions.find((o) => o.value === value) || allOptions[0];

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div
      className="crm-status-select custom-crm-dropdown"
      tabIndex={0}
      onBlur={() => setTimeout(() => setOpen(false), 200)}
    >
      <div
        className="custom-crm-selected"
        onClick={() => setOpen((prev) => !prev)}
      >
        {selected.label}
        <span className="custom-crm-arrow" />
      </div>
      {open && (
        <div className="custom-crm-menu">
          {allOptions.map((opt) => (
            <div
              key={opt.value || "all-status"}
              className={
                "custom-crm-option" +
                (opt.value === value ? " custom-crm-option-active" : "")
              }
              onClick={() => handleSelect(opt.value)}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


const PendingRequests = ({
  requests,
  searchTerm,
  setSearchTerm,
  activeSearchTerm,
  handleSearch,
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
  const searchInputRef = useRef(null);

  useEffect(() => {
    applyFilters();
  }, [requests, activeSearchTerm, filterDate]);

  const applyFilters = () => {
    let filtered = requests.filter((req) => req.status === "Pending");

    if (activeSearchTerm.trim()) {
      const search = activeSearchTerm.toLowerCase();
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

  const totalPages = Math.ceil(filteredRequests.length / rowsPerPage) || 1;

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

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
      if (searchInputRef.current) searchInputRef.current.blur();
    }
  };

  return (
    <>
      <div className="crm-filters-card">
        <div className="crm-filters-content">
          <div className="crm-search-input">
            <div className="crm-search-inner">
              <span className="crm-search-icon">
                <FaSearch />
              </span>
              <Form.Control
                ref={searchInputRef}
                type="text"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleSearchKeyDown}
                className="crm-search-field"
              />
              <button
                type="button"
                className="crm-search-btn"
                onClick={handleSearch}
              >
                Search
              </button>
            </div>
          </div>

          <input
            type="date"
            className="crm-filter-date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />

          <button className="crm-btn-clear" onClick={clearFilters}>
            Clear Filters
          </button>

          <div className="crm-results-count">
            Showing {getPaginatedRequests().length} of {filteredRequests.length}{" "}
            requests
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
                          className="crm-action-btn crm-action-approve"
                          onClick={() =>
                            handleProcessClick(request, "Approved")
                          }
                          title="Approve Request"
                        >
                          <i className="bi bi-check-circle"></i>
                        </button>
                        <button
                          className="crm-action-btn crm-action-reject"
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

        {filteredRequests.length > 0 && totalPages > 1 && (
          <div className="crm-pagination">
            <div className="crm-pagination-info">
              <span>Show</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>entries</span>
            </div>

            <div className="crm-pagination-status">
              Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
              {Math.min(currentPage * rowsPerPage, filteredRequests.length)} of{" "}
              {filteredRequests.length} entries
            </div>

            <nav className="crm-pagination-nav">
              <ul className="crm-pagination-list">
                <li
                  className={`crm-page-item ${
                    currentPage === 1 ? "disabled" : ""
                  }`}
                >
                  <button
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
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(prev + 1, totalPages)
                      )
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


const AllRequests = ({
  requests,
  searchTerm,
  setSearchTerm,
  activeSearchTerm,
  handleSearch,
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
  const searchInputRef = useRef(null);

  useEffect(() => {
    applyFilters();
  }, [requests, activeSearchTerm, filterStatus, filterDate]);

  const applyFilters = () => {
    let filtered = [...requests];

    if (activeSearchTerm.trim()) {
      const search = activeSearchTerm.toLowerCase();
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

  const totalPages = Math.ceil(filteredRequests.length / rowsPerPage) || 1;

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

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
      if (searchInputRef.current) searchInputRef.current.blur();
    }
  };

  const statusOptions = [
    { label: "Pending", value: "Pending" },
    { label: "Approved", value: "Approved" },
    { label: "Rejected", value: "Rejected" },
    { label: "Cancelled", value: "Cancelled" },
  ];

  return (
    <>
      <div className="crm-filters-card">
        <div className="crm-filters-content">
          <div className="crm-search-input">
            <div className="crm-search-inner">
              <span className="crm-search-icon">
                <FaSearch />
              </span>
              <Form.Control
                ref={searchInputRef}
                type="text"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleSearchKeyDown}
                className="crm-search-field"
              />
              <button
                type="button"
                className="crm-search-btn"
                onClick={handleSearch}
              >
                Search
              </button>
            </div>
          </div>

          <StatusDropdown
            value={filterStatus}
            onChange={(val) => setFilterStatus(val)}
            options={statusOptions}
          />

          <input
            type="date"
            className="crm-filter-date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />

          <button className="crm-btn-clear" onClick={clearFilters}>
            Clear Filters
          </button>

          <div className="crm-results-count">
            Showing {getPaginatedRequests().length} of {filteredRequests.length}{" "}
            requests
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
                              className="crm-action-btn crm-action-approve"
                              onClick={() =>
                                handleProcessClick(request, "Approved")
                              }
                              title="Approve Request"
                            >
                              <i className="bi bi-check-circle"></i>
                            </button>
                            <button
                              className="crm-action-btn crm-action-reject"
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

        {filteredRequests.length > 0 && totalPages > 1 && (
          <div className="crm-pagination">
            <div className="crm-pagination-info">
              <span>Show</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>entries</span>
            </div>

            <div className="crm-pagination-status">
              Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
              {Math.min(currentPage * rowsPerPage, filteredRequests.length)} of{" "}
              {filteredRequests.length} entries
            </div>

            <nav className="crm-pagination-nav">
              <ul className="crm-pagination-list">
                <li
                  className={`crm-page-item ${
                    currentPage === 1 ? "disabled" : ""
                  }`}
                >
                  <button
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
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(prev + 1, totalPages)
                      )
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


const ChangeRequestManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");

  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [processing, setProcessing] = useState(false);

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/pending")) return "pending";
    if (path.includes("/all")) return "all";
    return "pending";
  };

  const [activeTab, setActiveTab] = useState(getActiveTab());

  useEffect(() => {
    setActiveTab(getActiveTab());
  }, [location.pathname]);

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

  const handleSearch = () => {
    setActiveSearchTerm(searchTerm);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setActiveSearchTerm("");
    setFilterStatus("");
    setFilterDate("");
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab.key);
    navigate(tab.path);
    clearFilters();
    setCurrentPage(1);
  };

  const handleProcessClick = (request, action) => {
    setSelectedRequest(request);
    if (action === "Approved") {
      setShowApproveModal(true);
    } else {
      setShowRejectModal(true);
    }
    toast.info(`Processing email change request #${request.requestId}`);
  };

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
    <div className="crm-page">
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

      <div className="stats-cards-crm">
        <div className="stat-card-crm stat-total-crm">
          <div className="stat-icon-crm">
            <i className="bi bi-inbox-fill"></i>
          </div>
          <div className="stat-content-crm">
            <div className="stat-value-crm">{requests.length}</div>
            <div className="stat-label-crm">Total Requests</div>
          </div>
        </div>

        <div className="stat-card-crm stat-pending-crm">
          <div className="stat-icon-crm">
            <i className="bi bi-hourglass-split"></i>
          </div>
          <div className="stat-content-crm">
            <div className="stat-value-crm">
              {requests.filter((r) => r.status === "Pending").length}
            </div>
            <div className="stat-label-crm">Pending</div>
          </div>
        </div>

        <div className="stat-card-crm stat-approved-crm">
          <div className="stat-icon-crm">
            <i className="bi bi-check-circle-fill"></i>
          </div>
          <div className="stat-content-crm">
            <div className="stat-value-crm">
              {requests.filter((r) => r.status === "Approved").length}
            </div>
            <div className="stat-label-crm">Approved</div>
          </div>
        </div>

        <div className="stat-card-crm stat-rejected-crm">
          <div className="stat-icon-crm">
            <i className="bi bi-x-circle-fill"></i>
          </div>
          <div className="stat-content-crm">
            <div className="stat-value-crm">
              {requests.filter((r) => r.status === "Rejected").length}
            </div>
            <div className="stat-label-crm">Rejected</div>
          </div>
        </div>
      </div>

      <div className="crm-request-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`crm-tab-btn ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => handleTabChange(tab)}
          >
            <i className={`bi ${tab.icon}`}></i>
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

      <div className="tab-content-crm">
        <Routes>
          <Route
            path="pending"
            element={
              <PendingRequests
                requests={requests}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                activeSearchTerm={activeSearchTerm}
                handleSearch={handleSearch}
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
                activeSearchTerm={activeSearchTerm}
                handleSearch={handleSearch}
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
                activeSearchTerm={activeSearchTerm}
                handleSearch={handleSearch}
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
