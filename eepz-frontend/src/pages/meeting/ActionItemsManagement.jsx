import { useState, useEffect } from "react";
import momService from "../../services/meeting/momService";
import employeeService from "../../services/meeting/employeeservice";
import toastr from "toastr";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const ActionItemsManagement = () => {
  const navigate = useNavigate();
  const [actionItems, setActionItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [completionNotes, setCompletionNotes] = useState("");
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [employeeMap, setEmployeeMap] = useState({});

  useEffect(() => {
    loadActionItems();
    fetchEmployeeNames();
  }, []);

  const fetchEmployeeNames = async () => {
    try {
      const response = await employeeService.getAllEmployees();
      if (response.success && response.data) {
        const nameMap = {};
        response.data.forEach((emp) => {
          nameMap[emp.employeeMasterId] = `${emp.firstName} ${emp.lastName}`;
        });
        setEmployeeMap(nameMap);
      }
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    }
  };

  const loadActionItems = async () => {
    setLoading(true);
    try {
      const response = await momService.getMyActionItems();
      setActionItems(response.data || []);
    } catch (err) {
      console.error(err);
      toastr.error("Failed to load action items");
    } finally {
      setLoading(false);
    }
  };

  const openCompleteModal = (item) => {
    setSelectedItem(item);
    setCompletionNotes("");
  };

  const closeModal = () => {
    setSelectedItem(null);
    setCompletionNotes("");
  };

  const markAsCompleted = async () => {
    if (!selectedItem) return;
    try {
      await momService.updateActionItemStatus(
        selectedItem.actionItemId,
        "Completed"
      );
      toastr.success("Action item marked as completed");
      closeModal();
      loadActionItems();
    } catch (err) {
      toastr.error("Failed to update action item");
    }
  };

  // Filter and search logic
  const filteredItems = actionItems.filter((item) => {
    const matchesSearch =
      item.taskDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.meetingTitle?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === "pending") return item.status === "Pending";
    if (filter === "completed") return item.status === "Completed";
    if (filter === "overdue") {
      return item.status === "Pending" && new Date(item.dueDate) < new Date();
    }
    return true;
  });

  // Calculate stats
  const stats = {
    total: actionItems.length,
    pending: actionItems.filter((i) => i.status === "Pending").length,
    completed: actionItems.filter((i) => i.status === "Completed").length,
    overdue: actionItems.filter(
      (i) => i.status === "Pending" && new Date(i.dueDate) < new Date()
    ).length,
  };

  const isOverdue = (item) => {
    return item.status === "Pending" && new Date(item.dueDate) < new Date();
  };

  const getPriority = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const daysUntilDue = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

    if (daysUntilDue < 0) return { label: "Overdue", color: "danger" };
    if (daysUntilDue <= 2) return { label: "Urgent", color: "danger" };
    if (daysUntilDue <= 7) return { label: "High", color: "warning" };
    return { label: "Normal", color: "info" };
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center min-vh-100"
        style={{ backgroundColor: "#f8f9fa" }}
      >
        <div className="text-center">
          <div
            className="spinner-border text-primary mb-3"
            role="status"
            style={{ width: "3rem", height: "3rem" }}
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted fw-medium">Loading action items...</p>
        </div>
      </div>
    );
  };

  return (
    <div
      className="container-fluid px-4 py-4"
      style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}
    >
      {/* Breadcrumb Navigation */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol
          className="breadcrumb mb-0 d-flex align-items-center"
          style={{
            backgroundColor: "transparent",
            padding: 0,
            margin: 0,
          }}
        >
          <li
            className="breadcrumb-item"
            style={{ display: "flex", alignItems: "center" }}
          >
            <button
              onClick={() => navigate("/employee/dashboard/meetmom")}
              style={{
                background: "none",
                border: "none",
                color: "#97247E",
                cursor: "pointer",
                padding: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.875rem",
                fontWeight: 500,
                textDecoration: "none",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#7a1d65")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#97247E")}
            >
              <i className="bi bi-house-door" style={{ fontSize: "1rem" }}></i>
              Dashboard
            </button>
          </li>
          <li
            style={{
              display: "flex",
              alignItems: "center",
              color: "#97247E",
              margin: "0 8px",
              fontSize: "1rem",
            }}
          >
            /
          </li>
          <li
            className="breadcrumb-item active"
            aria-current="page"
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <span
              style={{
                color: "#1e293b",
                fontSize: "0.875rem",
                fontWeight: 600,
              }}
            >
              Action Items
            </span>
          </li>
        </ol>
      </nav>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-lg-3 col-md-6">
          <div
            className={`card border-0 shadow-sm h-100 ${
              filter === "all" ? "border-primary" : ""
            }`}
            onClick={() => setFilter("all")}
            style={{
              cursor: "pointer",
              transition: "all 0.2s",
              borderWidth: filter === "all" ? "2px" : "0",
              
            }}
          >
            <div className="card-body d-flex align-items-center p-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center me-3"
                style={{
                  width: "50px",
                  height: "50px",
                  backgroundColor: "#e3f2fd",
                  flexShrink: 0,
                }}
              >
                <i
                  className="bi bi-card-checklist fs-4"
                  style={{ color: "#1976d2" }}
                ></i>
              </div>
              <div>
                <h4
                  className="fw-bold mb-0"
                  style={{ fontSize: "1.5rem", color: "#1e293b" }}
                >
                  {stats.total}
                </h4>
                <p className="text-muted mb-0 small fw-medium">Total Tasks</p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div
            className={`card border-0 shadow-sm h-100 ${
              filter === "pending" ? "border-warning" : ""
            }`}
            onClick={() => setFilter("pending")}
            style={{
              cursor: "pointer",
              transition: "all 0.2s",
              borderWidth: filter === "pending" ? "2px" : "0",
            }}
          >
            <div className="card-body d-flex align-items-center p-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center me-3"
                style={{
                  width: "50px",
                  height: "50px",
                  backgroundColor: "#fff3e0",
                  flexShrink: 0,
                }}
              >
                <i
                  className="bi bi-clock-history fs-4"
                  style={{ color: "#f57c00" }}
                ></i>
              </div>
              <div>
                <h4
                  className="fw-bold mb-0"
                  style={{ fontSize: "1.5rem", color: "#1e293b" }}
                >
                  {stats.pending}
                </h4>
                <p className="text-muted mb-0 small fw-medium">Pending</p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div
            className={`card border-0 shadow-sm h-100 ${
              filter === "completed" ? "border-success" : ""
            }`}
            onClick={() => setFilter("completed")}
            style={{
              cursor: "pointer",
              transition: "all 0.2s",
              borderWidth: filter === "completed" ? "2px" : "0",
            }}
          >
            <div className="card-body d-flex align-items-center p-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center me-3"
                style={{
                  width: "50px",
                  height: "50px",
                  backgroundColor: "#e8f5e9",
                  flexShrink: 0,
                }}
              >
                <i
                  className="bi bi-check-circle fs-4"
                  style={{ color: "#388e3c" }}
                ></i>
              </div>
              <div>
                <h4
                  className="fw-bold mb-0"
                  style={{ fontSize: "1.5rem", color: "#1e293b" }}
                >
                  {stats.completed}
                </h4>
                <p className="text-muted mb-0 small fw-medium">Completed</p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div
            className={`card border-0 shadow-sm h-100 ${
              filter === "overdue" ? "border-danger" : ""
            }`}
            onClick={() => setFilter("overdue")}
            style={{
              cursor: "pointer",
              transition: "all 0.2s",
              borderWidth: filter === "overdue" ? "2px" : "0",
            }}
          >
            <div className="card-body d-flex align-items-center p-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center me-3"
                style={{
                  width: "50px",
                  height: "50px",
                  backgroundColor: "#ffebee",
                  flexShrink: 0,
                }}
              >
                <i
                  className="bi bi-exclamation-triangle fs-4"
                  style={{ color: "#d32f2f" }}
                ></i>
              </div>
              <div>
                <h4
                  className="fw-bold mb-0"
                  style={{ fontSize: "1.5rem", color: "#1e293b" }}
                >
                  {stats.overdue}
                </h4>
                <p className="text-muted mb-0 small fw-medium">Overdue</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body py-3">
          <div className="row g-3 align-items-center">
            <div className="col-lg-6">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Search action items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ boxShadow: "none" }}
                />
              </div>
            </div>
            <div className="col-lg-3">
              <select
                className="form-select"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={{ boxShadow: "none" }}
              >
                <option value="all">All Tasks ({stats.total})</option>
                <option value="pending">Pending ({stats.pending})</option>
                <option value="completed">Completed ({stats.completed})</option>
                <option value="overdue">Overdue ({stats.overdue})</option>
              </select>
            </div>
            <div className="col-lg-3 text-end">
              <span className="badge bg-light text-dark fw-medium">
                Showing {filteredItems.length} of {actionItems.length} tasks
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Items List */}
      <div className="row">
        <div className="col-12">
          {filteredItems.length === 0 ? (
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <div
                  className="mb-3"
                  style={{ fontSize: "4rem", opacity: 0.3 }}
                >
                  <i className="bi bi-inbox"></i>
                </div>
                <h5 className="fw-semibold text-muted mb-2">
                  No action items found
                </h5>
                <p className="text-muted mb-0">
                  {searchTerm
                    ? "Try adjusting your search criteria"
                    : "You have no action items assigned"}
                </p>
              </div>
            </div>
          ) : (
            <div className="row g-3">
              {filteredItems.map((item) => {
                const priority = getPriority(item.dueDate);
                const overdueStatus = isOverdue(item);

                return (
                  <div key={item.actionItemId} className="col-lg-6 col-xl-4">
                    <div
                      className="card border-0 shadow-sm h-100"
                      style={{
                        transition: "all 0.2s",
                        borderLeft: `4px solid ${
                          overdueStatus
                            ? "#d32f2f"
                            : item.status === "Completed"
                            ? "#388e3c"
                            : "#f57c00"
                        }`,
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = "translateY(-5px)";
                        e.currentTarget.style.boxShadow =
                          "0 0.5rem 1rem rgba(0, 0, 0, 0.15)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow =
                          "0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)";
                      }}
                    >
                      <div className="card-body p-4">
                        {/* Header with Status Badge */}
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <span
                                className={`badge bg-${priority.color}-subtle text-${priority.color}`}
                              >
                                {priority.label}
                              </span>
                              <span
                                className={`badge ${
                                  item.status === "Completed"
                                    ? "bg-success"
                                    : "bg-warning text-dark"
                                }`}
                              >
                                {item.status}
                              </span>
                            </div>
                            <h6
                              className="fw-semibold mb-2"
                              style={{ fontSize: "1rem" }}
                            >
                              {item.taskDescription}
                            </h6>
                          </div>
                        </div>

                        {/* Meeting Info */}
                        <div
                          className="mb-3 p-2 rounded"
                          style={{ backgroundColor: "#f8f9fa" }}
                        >
                          <small className="text-muted d-flex align-items-center gap-2">
                            <i className="bi bi-calendar-event text-primary"></i>
                            <strong>Meeting:</strong>{" "}
                            {item.meetingTitle || "N/A"}
                          </small>
                        </div>

                        {/* Details */}
                        <div className="d-flex flex-column gap-2 mb-3">
                          <div className="d-flex align-items-center gap-2 text-muted small">
                            <i className="bi bi-calendar3 text-danger"></i>
                            <strong>Due Date:</strong>
                            <span
                              className={
                                overdueStatus ? "text-danger fw-semibold" : ""
                              }
                            >
                              {new Date(item.dueDate).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </span>
                            {overdueStatus && (
                              <span className="badge bg-danger ms-auto">
                                <i className="bi bi-exclamation-circle me-1"></i>
                                Overdue
                              </span>
                            )}
                          </div>

                          {item.assignedByEmployeeId && (
                            <div className="d-flex align-items-center gap-2 text-muted small">
                              <i className="bi bi-person-circle text-success"></i>
                              <strong>Assigned by:</strong>
                              <span>
                                {employeeMap[item.assignedByEmployeeId] ||
                                  `Employee ${item.assignedByEmployeeId}`}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Action Button with Gradient */}
                        {item.status === "Pending" && (
                          <button
                            className="btn w-100 d-flex align-items-center justify-content-center gap-2"
                            onClick={() => openCompleteModal(item)}
                            style={{ 
                              background: 'linear-gradient(90deg, #97247E 0%, #E01950 100%)',
                              color: '#fff',
                              border: 'none',
                              fontWeight: '500',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.opacity = '0.9';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(151, 36, 126, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.opacity = '1';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            <i className="bi bi-check-circle"></i>
                            Mark as Completed
                          </button>
                        )}

                        {item.status === "Completed" && (
                          <div
                            className="alert alert-success mb-0 d-flex align-items-center gap-2"
                            style={{ padding: "0.5rem 0.75rem" }}
                          >
                            <i className="bi bi-check-circle-fill"></i>
                            <span className="small fw-medium">
                              Task completed successfully
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Completion Modal */}
      {selectedItem && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{
            backgroundColor: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
          }}
          onClick={closeModal}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="modal-content border-0 shadow-lg"
              style={{ borderRadius: "12px" }}
            >
              <div
                className="modal-header border-0"
                style={{ padding: "1.5rem" }}
              >
                <div>
                  <h5 className="modal-title fw-bold mb-1">
                    Mark as Completed
                  </h5>
                  <p className="text-muted small mb-0">
                    Confirm task completion
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModal}
                ></button>
              </div>
              <div
                className="modal-body"
                style={{ padding: "0 1.5rem 1.5rem" }}
              >
                {/* Task Details */}
                <div className="card bg-light border-0 mb-3">
                  <div className="card-body p-3">
                    <h6 className="fw-semibold mb-3">
                      {selectedItem.taskDescription}
                    </h6>
                    <div className="d-flex flex-column gap-2">
                      <div className="d-flex align-items-center gap-2 text-muted small">
                        <i className="bi bi-calendar-event text-primary"></i>
                        <strong>Meeting:</strong>{" "}
                        {selectedItem.meetingTitle || "N/A"}
                      </div>
                      <div className="d-flex align-items-center gap-2 text-muted small">
                        <i className="bi bi-calendar3 text-danger"></i>
                        <strong>Due Date:</strong>{" "}
                        {new Date(selectedItem.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Completion Notes */}
                <div className="mb-3">
                  <label className="form-label fw-semibold d-flex align-items-center gap-2">
                    <i className="bi bi-chat-left-text"></i>
                    Completion Notes (Optional)
                  </label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                    placeholder="Add any notes about how you completed this task..."
                    style={{ resize: "vertical" }}
                  />
                  <small className="text-muted">
                    These notes will be saved with the action item for future
                    reference
                  </small>
                </div>

                {/* Alert */}
                <div className="alert alert-info d-flex align-items-start gap-2 mb-0">
                  <i className="bi bi-info-circle mt-1 flex-shrink-0"></i>
                  <div className="small">
                    This action cannot be undone. Make sure the task is fully
                    completed before confirming.
                  </div>
                </div>
              </div>
              <div
                className="modal-footer border-0"
                style={{ padding: "0 1.5rem 1.5rem" }}
              >
                <button className="btn btn-danger px-4" onClick={closeModal}>
                  <i className="bi bi-x-circle me-2"></i>
                  Cancel
                </button>
                <button
                  className="btn px-4 d-flex align-items-center gap-2"
                  onClick={markAsCompleted}
                  style={{ 
                    background: 'linear-gradient(90deg, #97247E 0%, #E01950 100%)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.9';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(151, 36, 126, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <i className="bi bi-check-circle"></i>
                  Confirm Completion
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .breadcrumb-item + .breadcrumb-item::before {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default ActionItemsManagement;
