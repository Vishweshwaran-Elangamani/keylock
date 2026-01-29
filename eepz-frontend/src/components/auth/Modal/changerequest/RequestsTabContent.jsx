import { useState, useEffect, useRef } from "react";
import { Form } from "react-bootstrap";
import { FaSearch } from "react-icons/fa";
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
const PaginationRowsDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const options = [5, 10, 25, 50];
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  return (
    <div ref={dropdownRef} className="crm-rows-dropdown-wrapper">
      <button
        type="button"
        className="crm-rows-button"
        onClick={() => setOpen(!open)}
      >
        <span>{value}</span>
        <i
          className={`bi bi-chevron-${open ? "up" : "down"} crm-rows-chevron`}
        ></i>
      </button>
      {open && (
        <div className="crm-rows-dropdown">
          {options.map((size) => (
            <div
              key={size}
              onClick={() => {
                onChange(size);
                setOpen(false);
              }}
              className={`crm-rows-option ${
                value === size ? "crm-rows-active" : ""
              }`}
            >
              {size}
            </div>
          ))}
        </div>
      )}
    </div>
  );
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
    return parts[0].charAt(0).toUpperCase() + parts[1].charAt(0).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};
export const PendingRequests = ({ requests, handleProcessClick }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
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
  const handleSearch = () => {
    setActiveSearchTerm(searchTerm);
  };
  const clearFilters = () => {
    setSearchTerm("");
    setActiveSearchTerm("");
    setFilterDate("");
  };
  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
      if (searchInputRef.current) searchInputRef.current.blur();
    }
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
        {filteredRequests.length > 0 && (
          <div className="crm-pagination">
            <div className="crm-pagination-info">
              <span>Show</span>
              <PaginationRowsDropdown
                value={rowsPerPage}
                onChange={(size) => {
                  setRowsPerPage(size);
                  setCurrentPage(1);
                }}
              />
              <span>entries</span>
            </div>
            <div className="crm-pagination-status">
              Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
              {Math.min(currentPage * rowsPerPage, filteredRequests.length)} of{" "}
              {filteredRequests.length} entries
            </div>
            {totalPages > 1 && (
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
          </div>
        )}
      </div>
    </>
  );
};
export const AllRequests = ({ requests, handleProcessClick }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
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
  const handleSearch = () => {
    setActiveSearchTerm(searchTerm);
  };
  const clearFilters = () => {
    setSearchTerm("");
    setActiveSearchTerm("");
    setFilterStatus("");
    setFilterDate("");
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
        {filteredRequests.length > 0 && (
          <div className="crm-pagination">
            <div className="crm-pagination-info">
              <span>Show</span>
              <PaginationRowsDropdown
                value={rowsPerPage}
                onChange={(size) => {
                  setRowsPerPage(size);
                  setCurrentPage(1);
                }}
              />
              <span>entries</span>
            </div>
            <div className="crm-pagination-status">
              Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
              {Math.min(currentPage * rowsPerPage, filteredRequests.length)} of{" "}
              {filteredRequests.length} entries
            </div>
            {totalPages > 1 && (
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
          </div>
        )}
      </div>
    </>
  );
};
