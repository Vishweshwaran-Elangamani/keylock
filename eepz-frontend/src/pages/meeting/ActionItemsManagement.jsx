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
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [employeeMap, setEmployeeMap] = useState({});

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
    const matchesSearch =
      item.taskDescription
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      meetingTitle.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === "pending") return item.status === "Pending";
    if (filter === "completed") return item.status === "Completed";
    if (filter === "overdue") {
      return item.status === "Pending" && new Date(item.dueDate) < new Date();
    }
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

  const isOverdue = (item) => {
    return item.status === "Pending" && new Date(item.dueDate) < new Date();
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
  }

  return (
    <div
      className="container-fluid px-4 py-4"
      style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}
    >
      {/* Breadcrumb */}
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
              onClick={() => navigate("/employee/dashboard/")}
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
              <i className="bi bi-house-door" style={{ fontSize: '1rem' }}></i>
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
             
              Meetings and MoM
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

      {/* Stat cards */}
      <div className="row g-3 mb-4">
        <div className="col-lg-3 col-md-6">
          <div
            className="card shadow-sm h-100"
            onClick={() => setFilter("all")}
            style={{
              cursor: "pointer",
              transition: "all 0.2s",
              border: "1px solid #27235c",
              borderRadius: "12px",
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
            className="card shadow-sm h-100"
            onClick={() => setFilter("overdue")}
            style={{
              cursor: "pointer",
              transition: "all 0.2s",
              border: "1px solid #27235c",
              borderRadius: "12px",
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

      {/* Search + count */}
      <div
        className="card shadow-sm mb-4"
        style={{ border: "1px solid #27235c" }}
      >
        <div className="card-body py-3">
          <div className="row g-3 align-items-center">
            <div className="col-lg-9">
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
            <div className="col-lg-3 text-end">
              <span className="badge bg-light text-dark fw-medium">
                Showing {filteredItems.length} of {actionItems.length} tasks
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action item cards */}
      <div className="row">
        <div className="col-12">
          {filteredItems.length === 0 ? (
            <div
              className="card shadow-sm"
              style={{ border: "1px solid #27235c" }}
            >
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
                const overdueStatus = isOverdue(item);
                const meetingTitle = getMeetingTitle(item);

                return (
                  <div key={item.actionItemId} className="col-lg-6 col-xl-4">
                    <div
                      className="card shadow-sm h-100"
                      style={{
                        transition: "all 0.2s",
                        border: "1px solid #27235c",
                        borderRadius: "12px",
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
                      <div
                        className="card-body p-4"
                        style={{ fontSize: "0.95rem" }} // increased text size inside card
                      >
                        <h6
                          className="fw-semibold mb-3"
                          style={{ fontSize: "1rem" }}
                        >
                          {item.taskDescription}
                        </h6>

                        <div
                          className="mb-3 p-2 rounded"
                          style={{ backgroundColor: "#f8f9fa" }}
                        >
                          <small className="text-muted d-flex align-items-center gap-2">
                            <i className="bi bi-calendar-event text-primary"></i>
                            <strong>Meeting:</strong> {meetingTitle}
                          </small>
                        </div>

                        <div className="d-flex flex-column gap-2">
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
                          </div>

                          {item.assignedByEmployeeName && (
                            <div className="d-flex align-items-center gap-2 text-muted small">
                              <i className="bi bi-person-circle text-success"></i>
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

      <style>{`
        .breadcrumb-item + .breadcrumb-item::before {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default ActionItemsManagement;
