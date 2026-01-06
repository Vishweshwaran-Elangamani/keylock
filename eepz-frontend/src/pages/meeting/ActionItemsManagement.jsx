import { useState, useEffect } from "react";
import momService from "../../services/meeting/momService";
import employeeService from "../../services/meeting/employeeservice";
import toastr from "toastr";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../../styles/mom/components/ActionItemsManagement.css";

import { Home } from "lucide-react";

const PRIMARY = "#5E4B9A";

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

      if (employeesRes.success && employeesRes.data) {
        const nameMap = {};
        employeesRes.data.forEach((emp) => {
          nameMap[emp.employeeMasterId] = `${emp.firstName} ${emp.lastName}`;
        });
        setEmployeeMap(nameMap);
      }

      const items = actionItemsRes.data || [];
      setActionItems(items);
    } catch (err) {
      console.error("ERROR loading data:", err);
      toastr.error("Failed to load action items");
    } finally {
      setLoading(false);
    }
  };

  const getMeetingTitle = (item) => {
    return (
      item.meetingTitle ||
      item.MeetingTitle ||
      item.mom?.meetingTitle ||
      item.mom?.MeetingTitle ||
      item.Mom?.meetingTitle ||
      item.Mom?.MeetingTitle ||
      "No title available"
    );
  };

  const filteredItems = actionItems.filter((item) => {
    const meetingTitle = getMeetingTitle(item);
    const term = searchTerm.trim().toLowerCase();

    const matchesSearch =
      term.length === 0 ||
      item.taskDescription?.toLowerCase().includes(term) ||
      meetingTitle.toLowerCase().includes(term);

    if (!matchesSearch) return false;

    if (filter === "pending") return item.status === "Pending";
    if (filter === "completed") return item.status === "Completed";
    if (filter === "overdue") return item.status === "Pending" && new Date(item.dueDate) < new Date();

    return true;
  });

  const stats = {
    total: actionItems.length,
    pending: actionItems.filter((i) => i.status === "Pending").length,
    completed: actionItems.filter((i) => i.status === "Completed").length,
    overdue: actionItems.filter(
      (i) => i.status === "Pending" && new Date(i.dueDate) < new Date()
    ).length,
  };

  const isOverdue = (item) => item.status === "Pending" && new Date(item.dueDate) < new Date();

  const handleSearchClick = () => {
    const trimmed = searchInput.trim();
    setSearchTerm(trimmed);
    setIsSearching(trimmed.length > 0);
  };

  const handleCancelClick = () => {
    setSearchInput("");
    setSearchTerm("");
    setIsSearching(false);
  };

  if (loading) {
    return (
      <div className="aim-loading">
        <div className="aim-loading-inner">
          <div className="spinner-border text-primary mb-3 aim-loading-spinner" role="status">
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
        <nav aria-label="breadcrumb" className="aim-breadcrumb" style={{ "--bs-breadcrumb-divider": "''" }}>
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
    onClick={() => navigate("/employee/dashboard/meetmom", { state: { fromPage: "actionItems" } })}
    className="aim-breadcrumb-link"
    type="button"
  >
    Meetings and MoM
  </button>
</li>


            <li className="aim-breadcrumb-separator">/</li>

            <li className="breadcrumb-item active aim-breadcrumb-item" aria-current="page">
              <span className="aim-breadcrumb-current">Action Items</span>
            </li>
          </ol>
        </nav>

        <div className="row g-3 mb-4">
          <div className="col-lg-3 col-md-6">
            <div className="card aim-stat-card" onClick={() => setFilter("all")}>
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
            <div className="card aim-stat-card" onClick={() => setFilter("overdue")}>
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
                <div className="aim-search-shell">
                  <span className="aim-search-icon">
                    <i className="bi bi-search" />
                  </span>

                  <input
                    type="text"
                    className="form-control aim-search-input"
                    placeholder="Search action items..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSearchClick();
                    }}
                  />

                  {isSearching ? (
                    <button
                      type="button"
                      onClick={handleCancelClick}
                      className="aim-search-btn aim-search-btn-cancel"
                    >
                      <i className="bi bi-x" />
                      Cancel
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSearchClick}
                      className="aim-search-btn aim-search-btn-primary"
                    >
                      <i className="bi bi-search" />
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
                    {searchTerm ? "Try adjusting your search criteria" : "You have no action items assigned"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="row g-3">
                {filteredItems.map((item) => {
                  const overdueStatus = isOverdue(item);
                  const meetingTitle = getMeetingTitle(item);

                  return (
                    <div key={item.actionItemId} className="col-lg-6 col-xl-4">
                      <div className="card aim-item-card h-100">
                        <div className="card-body aim-item-card-body">
                          <h6 className="aim-item-title">{item.taskDescription}</h6>

                          <div className="aim-item-meeting">
                            <small className="aim-item-meeting-text">
                              <i className="bi bi-calendar-event text-primary"></i>
                              <strong>Meeting:</strong> {meetingTitle}
                            </small>
                          </div>

                          <div className="aim-item-meta">
                            <div className="aim-item-meta-row">
                              <strong>Due Date:</strong>
                              <span className={overdueStatus ? "aim-item-due-overdue" : ""}>
                                {new Date(item.dueDate).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>

                            {item.assignedByEmployeeName && (
                              <div className="aim-item-meta-row">
                                <strong>Assigned by:</strong>
                                <span>{item.assignedByEmployeeName}</span>
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
