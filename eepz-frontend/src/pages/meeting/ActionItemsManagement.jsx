import { useState, useEffect } from "react";
import momService from "../../services/meeting/momService";
import employeeService from "../../services/meeting/employeeservice";
import toastr from "toastr";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../../styles/mom/components/ActionItemsManagement.css";
import { Home, Search, X } from "lucide-react";

const ActionItemsManagement = () => {
  const navigate = useNavigate();
  const [actionItems, setActionItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [employeeMap, setEmployeeMap] = useState({});
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [actionItemsRes, employeesRes] = await Promise.all([
        momService.getMyActionItems(),
        employeeService.getAllEmployees(),
      ]);

      // Handle PascalCase or camelCase employee response
      const employeeData = employeesRes.data || employeesRes.Data || [];
      const employeeSuccess = employeesRes.success || employeesRes.Success;

      if (employeeSuccess && employeeData.length > 0) {
        const nameMap = {};
        employeeData.forEach((emp) => {
          const empId = emp.employeeMasterId || emp.EmployeeMasterId || emp.employeeId || emp.EmployeeId;
          const firstName = emp.firstName || emp.FirstName || '';
          const lastName = emp.lastName || emp.LastName || '';
          if (empId) {
            nameMap[empId] = `${firstName} ${lastName}`.trim();
          }
        });
        setEmployeeMap(nameMap);
      }

      // Handle PascalCase or camelCase action items response
      const items = actionItemsRes.data || actionItemsRes.Data || [];
      setActionItems(items);
    } catch (err) {
      console.error("ERROR loading data:", err);
      
      // Enhanced error handling
      if (err.retryAfter) {
        toastr.error(`Rate limit exceeded. Please wait ${err.retryAfter} seconds.`);
      } else if (err.message) {
        toastr.error(`Failed to load action items: ${err.message}`);
      } else {
        toastr.error("Failed to load action items");
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper to get property with PascalCase/camelCase fallback
  const getProperty = (obj, camelKey, pascalKey) => {
    return obj?.[camelKey] || obj?.[pascalKey] || null;
  };

  const getMeetingTitle = (item) => {
    // Try multiple possible property paths
    return (
      getProperty(item, 'meetingTitle', 'MeetingTitle') ||
      getProperty(item.mom, 'meetingTitle', 'MeetingTitle') ||
      getProperty(item.Mom, 'meetingTitle', 'MeetingTitle') ||
      "No title available"
    );
  };

  const getTaskDescription = (item) => {
    return getProperty(item, 'taskDescription', 'TaskDescription') || 'No description';
  };

  const getDueDate = (item) => {
    return getProperty(item, 'dueDate', 'DueDate');
  };

  const getStatus = (item) => {
    return getProperty(item, 'status', 'Status') || 'Pending';
  };

  const getActionItemId = (item) => {
    return getProperty(item, 'actionItemId', 'ActionItemId');
  };

  const getAssignedByName = (item) => {
    return getProperty(item, 'assignedByEmployeeName', 'AssignedByEmployeeName');
  };

  const getAssignedById = (item) => {
    return getProperty(item, 'assignedByEmployeeId', 'AssignedByEmployeeId');
  };

  const filteredItems = actionItems.filter((item) => {
    const meetingTitle = getMeetingTitle(item);
    const taskDescription = getTaskDescription(item);
    const term = searchTerm.trim().toLowerCase();

    const matchesSearch =
      term.length === 0 ||
      taskDescription.toLowerCase().includes(term) ||
      meetingTitle.toLowerCase().includes(term);

    if (!matchesSearch) return false;

    const status = getStatus(item);
    const dueDate = getDueDate(item);

    if (filter === "pending") return status === "Pending";
    if (filter === "completed") return status === "Completed";
    if (filter === "overdue") {
      return status === "Pending" && dueDate && new Date(dueDate) < new Date();
    }

    return true;
  });

  const stats = {
    total: actionItems.length,
    pending: actionItems.filter((i) => getStatus(i) === "Pending").length,
    completed: actionItems.filter((i) => getStatus(i) === "Completed").length,
    overdue: actionItems.filter((i) => {
      const status = getStatus(i);
      const dueDate = getDueDate(i);
      return status === "Pending" && dueDate && new Date(dueDate) < new Date();
    }).length,
  };

  const isOverdue = (item) => {
    const status = getStatus(item);
    const dueDate = getDueDate(item);
    return status === "Pending" && dueDate && new Date(dueDate) < new Date();
  };

  const handleSearchClick = () => {
    const trimmed = searchInput.trim();
    if (!trimmed) return;
    setSearchTerm(trimmed);
    setIsSearching(true);
  };

  const handleCancelClick = () => {
    setSearchInput("");
    setSearchTerm("");
    setIsSearching(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearchClick();
    } else if (e.key === "Escape") {
      handleCancelClick();
    }
  };

  if (loading) {
    return (
      <div className="aim-loading">
        <div className="aim-loading-inner">
          <div
            className="spinner-border text-primary mb-3 aim-loading-spinner"
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="aim-loading-text">Loading action items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="aim-page">
      <div className="aim-container container-fluid px-4 py-4">
        <nav aria-label="breadcrumb" className="aim-breadcrumb">
          <ol className="breadcrumb mb-0 d-flex align-items-center aim-breadcrumb-list">
            <li className="breadcrumb-item aim-breadcrumb-item">
              <button
                onClick={() => navigate("/employee/dashboard/")}
                className="aim-breadcrumb-link aim-breadcrumb-home"
                type="button"
                aria-label="Dashboard"
              >
                <Home size={18} className="aim-home-icon" />
              </button>
            </li>
            <li className="aim-breadcrumb-separator">/</li>
            <li className="breadcrumb-item aim-breadcrumb-item">
              <button
                onClick={() =>
                  navigate("/employee/dashboard/meetmom", {
                    state: { fromPage: "actionItems" },
                  })
                }
                className="aim-breadcrumb-link"
                type="button"
              >
                Meetings and MoM
              </button>
            </li>
            <li className="aim-breadcrumb-separator">/</li>
            <li
              className="breadcrumb-item active aim-breadcrumb-item"
              aria-current="page"
            >
              <span className="aim-breadcrumb-current">Action Items</span>
            </li>
          </ol>
        </nav>

        <div className="row g-3 mb-4">
          <div className="col-lg-3 col-md-6">
            <div
              className="card aim-stat-card"
              onClick={() => setFilter("all")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setFilter("all")}
            >
              <div className="card-body aim-stat-card-body">
                <div className="aim-stat-icon aim-stat-icon-total">
                  <i className="bi bi-card-checklist"></i>
                </div>
                <div className="aim-stat-text">
                  <h4 className="aim-stat-value">{stats.total}</h4>
                  <p className="aim-stat-label">Total Tasks</p>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6">
            <div
              className="card aim-stat-card"
              onClick={() => setFilter("pending")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setFilter("pending")}
            >
              <div className="card-body aim-stat-card-body">
                <div className="aim-stat-icon aim-stat-icon-pending">
                  <i className="bi bi-clock-history"></i>
                </div>
                <div className="aim-stat-text">
                  <h4 className="aim-stat-value">{stats.pending}</h4>
                  <p className="aim-stat-label">Pending</p>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6">
            <div
              className="card aim-stat-card"
              onClick={() => setFilter("completed")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setFilter("completed")}
            >
              <div className="card-body aim-stat-card-body">
                <div className="aim-stat-icon aim-stat-icon-completed">
                  <i className="bi bi-check-circle"></i>
                </div>
                <div className="aim-stat-text">
                  <h4 className="aim-stat-value">{stats.completed}</h4>
                  <p className="aim-stat-label">Completed</p>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6">
            <div
              className="card aim-stat-card"
              onClick={() => setFilter("overdue")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setFilter("overdue")}
            >
              <div className="card-body aim-stat-card-body">
                <div className="aim-stat-icon aim-stat-icon-overdue">
                  <i className="bi bi-exclamation-triangle"></i>
                </div>
                <div className="aim-stat-text">
                  <h4 className="aim-stat-value">{stats.overdue}</h4>
                  <p className="aim-stat-label">Overdue</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card aim-search-card">
          <div className="card-body aim-search-card-body">
            <div className="row g-3 align-items-center">
              <div className="col-lg-9">
                <div className="aim-search-wrapper">
                  <span className="aim-search-icon">
                    <Search size={18} />
                  </span>

                  <input
                    type="text"
                    className="form-control aim-search-input"
                    placeholder="Search action items by task or meeting title..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />

                  <div className="aim-search-separator" />

                  {isSearching ? (
                    <button
                      type="button"
                      onClick={handleCancelClick}
                      className="aim-search-action-btn aim-search-clear-btn"
                    >
                      <X size={14} />
                      Cancel
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSearchClick}
                      className="aim-search-action-btn aim-search-btn"
                      disabled={!searchInput.trim()}
                    >
                      <Search size={16} />
                      Search
                    </button>
                  )}
                </div>
              </div>

              <div className="col-lg-3 text-lg-end">
                <span className="aim-count-badge">
                  Showing {filteredItems.length} of {actionItems.length} tasks
                </span>
              </div>
            </div>

            {filter !== 'all' && (
              <div className="mt-3">
                <span className="badge bg-primary me-2">
                  Filter: {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setFilter('all')}
                >
                  Clear Filter
                </button>
              </div>
            )}

            {searchTerm && (
              <div className="mt-2">
                <small className="text-muted">
                  Searching for: "<strong>{searchTerm}</strong>"
                </small>
              </div>
            )}
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            {filteredItems.length === 0 ? (
              <div className="card aim-empty-card">
                <div className="card-body text-center py-5">
                  <div className="aim-empty-icon-wrapper">
                    <i className="bi bi-inbox"></i>
                  </div>
                  <h5 className="aim-empty-title">No action items found</h5>
                  <p className="aim-empty-text">
                    {searchTerm
                      ? "Try adjusting your search criteria"
                      : filter !== 'all'
                      ? `No ${filter} action items`
                      : "You have no action items assigned"}
                  </p>
                  {(searchTerm || filter !== 'all') && (
                    <button
                      className="btn btn-primary mt-3"
                      onClick={() => {
                        setSearchInput("");
                        setSearchTerm("");
                        setIsSearching(false);
                        setFilter('all');
                      }}
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="row g-3">
                {filteredItems.map((item) => {
                  const overdueStatus = isOverdue(item);
                  const meetingTitle = getMeetingTitle(item);
                  const taskDescription = getTaskDescription(item);
                  const dueDate = getDueDate(item);
                  const status = getStatus(item);
                  const actionItemId = getActionItemId(item);
                  const assignedByName = getAssignedByName(item);
                  const assignedById = getAssignedById(item);

                  return (
                    <div key={actionItemId} className="col-lg-6 col-xl-4">
                      <div className="card aim-item-card h-100">
                        <div className="card-body aim-item-card-body">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="aim-item-title flex-grow-1">
                              {taskDescription}
                            </h6>
                            <span
                              className={`badge ${
                                status === "Completed"
                                  ? "bg-success"
                                  : overdueStatus
                                  ? "bg-danger"
                                  : "bg-warning text-dark"
                              }`}
                            >
                              {overdueStatus ? "Overdue" : status}
                            </span>
                          </div>

                          <div className="aim-item-meeting">
                            <small className="aim-item-meeting-text">
                              <i className="bi bi-calendar-event text-primary"></i>
                              <strong>Meeting:</strong> {meetingTitle}
                            </small>
                          </div>

                          <div className="aim-item-meta">
                            <div className="aim-item-meta-row">
                              <strong>Due Date:</strong>
                              <span
                                className={
                                  overdueStatus ? "aim-item-due-overdue" : ""
                                }
                              >
                                {dueDate
                                  ? new Date(dueDate).toLocaleDateString(
                                      "en-US",
                                      {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                      }
                                    )
                                  : "No due date"}
                              </span>
                            </div>

                            {assignedByName && (
                              <div className="aim-item-meta-row">
                                <strong>Assigned by:</strong>
                                <span>{assignedByName}</span>
                              </div>
                            )}

                            {!assignedByName && assignedById && (
                              <div className="aim-item-meta-row">
                                <strong>Assigned by:</strong>
                                <span>
                                  {employeeMap[assignedById] || `ID: ${assignedById}`}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionItemsManagement;
