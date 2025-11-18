import { useState, useEffect } from "react";
import momService from "../../services/meeting/momService";
import rsvpService from "../../services/meeting/rsvpService";
import employeeService from "../../services/meeting/employeeservice";
import toastr from "toastr";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const EmployeeMomDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [employeeMap, setEmployeeMap] = useState({});
  const [stats, setStats] = useState({
    myMoms: 0,
    pendingActionItems: 0,
    meetingInvitations: 0,
    sharedMoms: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [showCreateMomModal, setShowCreateMomModal] = useState(false);
  const [showSharedModal, setShowSharedModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
    fetchMeetings();
  }, []);

  const fetchEmployeeNames = async (employeeMasterIds) => {
    if (!employeeMasterIds || employeeMasterIds.length === 0) return {};

    try {
      const uniqueIds = [...new Set(employeeMasterIds)];
      const response = await employeeService.getEmployeesByIds(uniqueIds);

      if (response.success && response.data) {
        const nameMap = {};
        response.data.forEach((emp) => {
          nameMap[emp.employeeMasterId] = `${emp.firstName} ${emp.lastName}`;
        });
        return nameMap;
      }
      return {};
    } catch (error) {
      console.error("Error fetching employee names:", error);
      return {};
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [myMomsRes, actionItemsRes, invitationsRes, sharedRes] =
        await Promise.all([
          momService.getMyMoms(),
          momService.getMyActionItems(),
          rsvpService.getMyInvitations(),
          momService.getMomsSharedWithMe(),
        ]);

      const employeeIds = [];
      if (actionItemsRes.data) {
        actionItemsRes.data.forEach((item) => {
          if (item.assignedToEmployeeId)
            employeeIds.push(item.assignedToEmployeeId);
        });
      }
      if (myMomsRes.data) {
        myMomsRes.data.forEach((mom) => {
          if (mom.actionItems) {
            mom.actionItems.forEach((ai) => {
              if (ai.assignedToEmployeeId)
                employeeIds.push(ai.assignedToEmployeeId);
            });
          }
        });
      }

      if (employeeIds.length > 0) {
        const empNames = await fetchEmployeeNames(employeeIds);
        setEmployeeMap(empNames);
      }

      const pendingActions =
        actionItemsRes.data?.filter((item) => item.status === "Pending") || [];
      const pendingInvites =
        invitationsRes.data?.filter((inv) => inv.rsvpStatus === "Pending") ||
        [];

      setStats({
        myMoms: myMomsRes.data?.length || 0,
        pendingActionItems: pendingActions.length,
        meetingInvitations: pendingInvites.length,
        sharedMoms: sharedRes.data?.length || 0,
      });

      const activity = [];
      if (myMomsRes.data) {
        myMomsRes.data.slice(0, 3).forEach((mom) => {
          activity.push({
            type: "mom",
            title: mom.meetingTitle,
            date: mom.createdAt,
            icon: "bi-file-text",
            color: "primary",
            meetingId: mom.meetingId,
            meetingData: mom,
          });
        });
      }
      if (invitationsRes.data) {
        invitationsRes.data.slice(0, 2).forEach((inv) => {
          activity.push({
            type: "invitation",
            title: inv.meetingTitle,
            date: inv.meetingDate,
            icon: "bi-calendar-event",
            color: "warning",
            meetingId: inv.meetingId,
            meetingData: inv,
          });
        });
      }
      setRecentActivity(
        activity.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)
      );
    } catch (error) {
      toastr.error("Failed to load dashboard data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMeetings = async () => {
    try {
      const res = await momService.getMyMoms();
      setMeetings(res.data || []);
    } catch (error) {
      toastr.error("Failed to load meetings");
    }
  };

  const openMeetingDetails = (meeting) => setSelectedMeeting(meeting);
  const closeMeetingDetails = () => {
    setSelectedMeeting(null);
    setShowCreateMomModal(false);
  };
  const toggleCreateMomModal = () => setShowCreateMomModal(!showCreateMomModal);

  const handleActivityClick = (item) => {
    if (item.meetingData) {
      openMeetingDetails(item.meetingData);
    }
  };

  const openSharedModal = () => setShowSharedModal(true);
  const closeSharedModal = () => setShowSharedModal(false);

  if (loading)
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
          <p className="text-muted fw-medium">Loading dashboard...</p>
        </div>
      </div>
    );

  return (
    <div
      className="container-fluid px-4 py-4"
      style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}
    >
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2
            className="fw-bold mb-1 d-flex align-items-center gap-2"
            style={{ color: "#1e293b", fontSize: "1.75rem" }}
          >
            <i className="bi bi-journal-text"></i>
            MOM Management Dashboard
          </h2>
          <p className="text-muted mb-0" style={{ fontSize: "0.95rem" }}>
            Manage all meeting minutes across the organization
          </p>
        </div>
        <button
          className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2 shadow-sm"
          onClick={() =>
            navigate("/employee/dashboard/meetmom/create-edit-mom")
          }
          style={{
            backgroundColor: "#5046e5",
            borderColor: "#5046e5",
            fontWeight: "500",
            transition: "all 0.2s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow =
              "0 4px 12px rgba(80, 70, 229, 0.3)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.05)";
          }}
        >
          <i className="bi bi-plus-circle"></i>
          Create MOM
        </button>
      </div>

      {/* Quick Stats */}
      <div className="row g-3 mb-4">
        <StatCard
          icon="bi-file-text"
          bgColor="#e3f2fd"
          iconColor="#1976d2"
          count={stats.myMoms}
          label="My MOMs"
          onClick={() => navigate("/employee/dashboard/meetmom/my-moms")}
        />
        <StatCard
          icon="bi-clock-history"
          bgColor="#f3e5f5"
          iconColor="#7b1fa2"
          count={stats.pendingActionItems}
          label="Pending Actions"
          onClick={() => navigate("/employee/dashboard/meetmom/action-items")}
        />
        <StatCard
          icon="bi-envelope-open"
          bgColor="#e8f5e9"
          iconColor="#388e3c"
          count={stats.meetingInvitations}
          label="Invitations"
          onClick={() => navigate("/employee/dashboard/meetmom/invitations")}
        />
        <StatCard
          icon="bi-share"
          bgColor="#fff3e0"
          iconColor="#f57c00"
          count={stats.sharedMoms}
          label="Shared MOMs"
          onClick={openSharedModal}
        />
      </div>

      {/* Search & Filter Bar */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body py-3">
          <div className="row g-3 align-items-center">
            <div className="col-lg-4">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Search meetings, attendees, or action items..."
                  style={{ boxShadow: "none" }}
                />
              </div>
            </div>
            <div className="col-lg-2">
              <select className="form-select" style={{ boxShadow: "none" }}>
                <option>All Status</option>
                <option>Open</option>
                <option>Closed</option>
              </select>
            </div>
            <div className="col-lg-2">
              <select className="form-select" style={{ boxShadow: "none" }}>
                <option>All Types</option>
                <option>Team Meeting</option>
                <option>Review</option>
                <option>Planning</option>
              </select>
            </div>
            <div className="col-lg-2">
              <select className="form-select" style={{ boxShadow: "none" }}>
                <option>Date Range</option>
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
              </select>
            </div>
            <div className="col-lg-2 text-end">
              <button className="btn btn-outline-secondary d-flex align-items-center gap-2 w-100 justify-content-center">
                <i className="bi bi-funnel"></i> Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="row g-3 mb-4">
        <ActionButton
          icon="bi-file-earmark-text"
          label="My MOMs"
          color="primary"
          count={stats.myMoms}
          onClick={() => navigate("/employee/dashboard/meetmom/my-moms")}
        />
        <ActionButton
          icon="bi-share"
          label="Shared MOMs"
          color="info"
          count={stats.sharedMoms}
          onClick={openSharedModal}
        />
        <ActionButton
          icon="bi-list-check"
          label="Action Items"
          color="success"
          count={stats.pendingActionItems}
          onClick={() => navigate("/employee/dashboard/meetmom/action-items")}
        />
        <ActionButton
          icon="bi-envelope"
          label="Invitations"
          color="warning"
          count={stats.meetingInvitations}
          onClick={() => navigate("/employee/dashboard/meetmom/invitations")}
        />
      </div>

      <div className="row">
        {/* Recent Activity */}
        <div className="col-lg-6 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5
                  className="card-title fw-semibold mb-0 d-flex align-items-center gap-2"
                  style={{ color: "#1e293b" }}
                >
                  <i className="bi bi-clock-history"></i>
                  Recent Activity
                </h5>
                <span className="badge bg-light text-dark fw-medium">
                  {recentActivity.length} items
                </span>
              </div>
              {recentActivity.length === 0 ? (
                <div className="text-center py-5">
                  <div
                    className="mb-3"
                    style={{ fontSize: "3.5rem", opacity: 0.3 }}
                  >
                    <i className="bi bi-inbox"></i>
                  </div>
                  <h6 className="fw-semibold text-muted mb-2">
                    No recent activity
                  </h6>
                  <p className="text-muted small mb-0">
                    Your recent MOMs and invitations will appear here
                  </p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {recentActivity.map((item, idx) => (
                    <ActivityItem
                      key={idx}
                      item={item}
                      onClick={() => handleActivityClick(item)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Meetings List */}
        <div className="col-lg-6 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5
                  className="card-title fw-semibold mb-0 d-flex align-items-center gap-2"
                  style={{ color: "#1e293b" }}
                >
                  <i className="bi bi-calendar3"></i>
                  My Meetings
                </h5>
                <span className="badge bg-light text-dark fw-medium">
                  {meetings.length} meetings
                </span>
              </div>
              {meetings.length === 0 ? (
                <div className="text-center py-5">
                  <div
                    className="mb-3"
                    style={{ fontSize: "3.5rem", opacity: 0.3 }}
                  >
                    <i className="bi bi-calendar-x"></i>
                  </div>
                  <h6 className="fw-semibold text-muted mb-2">
                    No meetings found
                  </h6>
                  <p className="text-muted small mb-3">
                    Create your first meeting minute to get started
                  </p>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() =>
                      navigate("/employee/dashboard/meetmom/create-edit-mom")
                    }
                  >
                    <i className="bi bi-plus-circle me-2"></i>Create MOM
                  </button>
                </div>
              ) : (
                <>
                  <div className="list-group list-group-flush">
                    {meetings.slice(0, 5).map((m) => (
                      <div
                        key={m.meetingId}
                        className="list-group-item list-group-item-action border-0 px-0 py-3 rounded mb-2"
                        onClick={() => openMeetingDetails(m)}
                        style={{
                          cursor: "pointer",
                          transition: "all 0.2s",
                          backgroundColor: "transparent",
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = "#f8f9fa";
                          e.currentTarget.style.transform = "translateX(5px)";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.transform = "translateX(0)";
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <h6 className="mb-0 fw-semibold">
                                {m.meetingTitle}
                              </h6>
                              <span className="badge bg-primary-subtle text-primary small">
                                {m.meetingType}
                              </span>
                            </div>
                            <div className="d-flex align-items-center flex-wrap gap-3 text-muted small">
                              <span className="d-flex align-items-center gap-1">
                                <i className="bi bi-calendar3"></i>
                                {new Date(m.meetingDate).toLocaleDateString()}
                              </span>
                              <span className="d-flex align-items-center gap-1">
                                <i className="bi bi-clock"></i>
                                {new Date(m.meetingDate).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" }
                                )}
                              </span>
                              {m.actionItems && m.actionItems.length > 0 && (
                                <span className="d-flex align-items-center gap-1">
                                  <i className="bi bi-check-circle"></i>
                                  {m.actionItems.length} action
                                  {m.actionItems.length !== 1 ? "s" : ""}
                                </span>
                              )}
                            </div>
                          </div>
                          <i
                            className="bi bi-chevron-right text-muted"
                            style={{ fontSize: "1.2rem" }}
                          ></i>
                        </div>
                      </div>
                    ))}
                  </div>
                  {meetings.length > 5 && (
                    <div className="text-center mt-3 pt-3 border-top">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() =>
                          navigate("/employee/dashboard/meetmom/my-moms")
                        }
                      >
                        View All {meetings.length} Meetings{" "}
                        <i className="bi bi-arrow-right ms-1"></i>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Meeting Details Modal */}
      {selectedMeeting && (
        <MeetingDetailsModal
          meeting={selectedMeeting}
          onClose={closeMeetingDetails}
          showCreateMom={showCreateMomModal}
          toggleCreateMom={toggleCreateMomModal}
          employeeMap={employeeMap}
        />
      )}

      {/* Shared MOMs Modal */}
      {showSharedModal && <SharedMomsModal onClose={closeSharedModal} />}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon, bgColor, iconColor, count, label, onClick }) => (
  <div className="col-lg-3 col-md-6">
    <div
      className="card border-0 shadow-sm h-100"
      onClick={onClick}
      style={{
        transition: "all 0.3s",
        cursor: "pointer",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = "translateY(-5px)";
        e.currentTarget.style.boxShadow = "0 0.5rem 1rem rgba(0, 0, 0, 0.15)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow =
          "0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)";
      }}
    >
      <div className="card-body d-flex align-items-center p-4">
        <div
          className="rounded-circle d-flex align-items-center justify-content-center me-3"
          style={{
            width: "60px",
            height: "60px",
            backgroundColor: bgColor,
            flexShrink: 0,
          }}
        >
          <i className={`${icon} fs-3`} style={{ color: iconColor }}></i>
        </div>
        <div className="flex-grow-1">
          <h3
            className="fw-bold mb-0"
            style={{ fontSize: "2rem", color: "#1e293b" }}
          >
            {count}
          </h3>
          <p
            className="text-muted mb-0 fw-medium"
            style={{ fontSize: "0.875rem" }}
          >
            {label}
          </p>
        </div>
      </div>
    </div>
  </div>
);

// Action Button Component
const ActionButton = ({ icon, label, color, count, onClick }) => (
  <div className="col-lg-3 col-md-6">
    <button
      className={`btn btn-outline-${color} w-100 py-3 d-flex align-items-center justify-content-between position-relative shadow-sm`}
      onClick={onClick}
      style={{
        fontWeight: "500",
        transition: "all 0.2s",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.05)";
      }}
    >
      <span className="d-flex align-items-center gap-2">
        <i className={icon} style={{ fontSize: "1.1rem" }}></i>
        {label}
      </span>
      {count > 0 && (
        <span className={`badge bg-${color} rounded-pill`}>{count}</span>
      )}
    </button>
  </div>
);

// Activity Item Component
const ActivityItem = ({ item, onClick }) => {
  const iconBgColor = {
    primary: "#e3f2fd",
    warning: "#fff3e0",
    success: "#e8f5e9",
    info: "#e1f5fe",
  };

  const iconColor = {
    primary: "#1976d2",
    warning: "#f57c00",
    success: "#388e3c",
    info: "#0288d1",
  };

  return (
    <div
      className="d-flex align-items-center p-3 rounded-3"
      onClick={onClick}
      style={{
        cursor: "pointer",
        transition: "all 0.2s",
        backgroundColor: "#f8f9fa",
        border: "1px solid transparent",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#ffffff";
        e.currentTarget.style.borderColor = iconColor[item.color];
        e.currentTarget.style.transform = "translateX(8px)";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "#f8f9fa";
        e.currentTarget.style.borderColor = "transparent";
        e.currentTarget.style.transform = "translateX(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div
        className="rounded-circle d-flex align-items-center justify-content-center me-3"
        style={{
          width: "48px",
          height: "48px",
          backgroundColor: iconBgColor[item.color],
          flexShrink: 0,
        }}
      >
        <i
          className={`${item.icon} fs-5`}
          style={{ color: iconColor[item.color] }}
        ></i>
      </div>
      <div className="flex-grow-1">
        <h6 className="mb-1 fw-semibold" style={{ fontSize: "0.95rem" }}>
          {item.title}
        </h6>
        <div className="d-flex align-items-center gap-3">
          <small className="text-muted d-flex align-items-center gap-1">
            <i className="bi bi-calendar3"></i>
            {new Date(item.date).toLocaleDateString()}
          </small>
          <small className="text-muted d-flex align-items-center gap-1">
            <i className="bi bi-clock"></i>
            {new Date(item.date).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </small>
        </div>
      </div>
      <i className="bi bi-arrow-right text-muted"></i>
    </div>
  );
};

// Meeting Details Modal Component
const MeetingDetailsModal = ({
  meeting,
  onClose,
  showCreateMom,
  toggleCreateMom,
  employeeMap,
}) => (
  <div
    className="modal fade show d-block"
    tabIndex="-1"
    style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
    onClick={onClose}
  >
    <div
      className="modal-dialog modal-dialog-scrollable modal-lg modal-dialog-centered"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="modal-content border-0 shadow-lg"
        style={{ borderRadius: "16px" }}
      >
        <div
          className="modal-header border-0"
          style={{ padding: "1.5rem 1.5rem 1rem" }}
        >
          <div>
            <h5 className="modal-title fw-bold mb-2">{meeting.meetingTitle}</h5>
            <span className="badge bg-primary-subtle text-primary">
              {meeting.meetingType}
            </span>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={onClose}
          ></button>
        </div>
        <div className="modal-body" style={{ padding: "1rem 1.5rem" }}>
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <div
                className="p-3 rounded"
                style={{ backgroundColor: "#f8f9fa" }}
              >
                <div className="d-flex align-items-center gap-2 mb-2">
                  <i className="bi bi-calendar3 text-primary"></i>
                  <small className="text-muted fw-semibold">Date & Time</small>
                </div>
                <span className="d-block fw-medium">
                  {new Date(meeting.meetingDate).toLocaleString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
            <div className="col-md-6">
              <div
                className="p-3 rounded"
                style={{ backgroundColor: "#f8f9fa" }}
              >
                <div className="d-flex align-items-center gap-2 mb-2">
                  <i className="bi bi-people text-success"></i>
                  <small className="text-muted fw-semibold">Attendees</small>
                </div>
                <span className="d-block fw-medium">
                  {meeting.attendees || "Not specified"}
                </span>
              </div>
            </div>
          </div>

          {meeting.meetingLink && (
            <div className="mb-4">
              <div
                className="p-3 rounded"
                style={{
                  backgroundColor: "#e3f2fd",
                  border: "1px solid #bbdefb",
                }}
              >
                <div className="d-flex align-items-center gap-2 mb-2">
                  <i className="bi bi-link-45deg text-primary"></i>
                  <small className="text-muted fw-semibold">Meeting Link</small>
                </div>
                <a
                  href={meeting.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary text-decoration-none d-flex align-items-center gap-2 fw-medium"
                >
                  Join Meeting{" "}
                  <i className="bi bi-box-arrow-up-right small"></i>
                </a>
              </div>
            </div>
          )}

          {meeting.commentsObservations && (
            <div className="mb-4">
              <h6 className="fw-semibold mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-chat-left-text text-info"></i>
                Comments & Observations
              </h6>
              <div
                className="p-3 rounded"
                style={{
                  backgroundColor: "#f8f9fa",
                  borderLeft: "4px solid #17a2b8",
                }}
              >
                <p className="mb-0">{meeting.commentsObservations}</p>
              </div>
            </div>
          )}

          {meeting.discussionPoints && meeting.discussionPoints.length > 0 && (
            <div className="mb-4">
              <h6 className="fw-semibold mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-chat-dots text-warning"></i>
                Discussion Points
                <span className="badge bg-light text-dark">
                  {meeting.discussionPoints.length}
                </span>
              </h6>
              <div className="d-flex flex-column gap-2">
                {meeting.discussionPoints.map((dp, i) => (
                  <div
                    key={i}
                    className="p-3 rounded d-flex align-items-start gap-3"
                    style={{ backgroundColor: "#f8f9fa" }}
                  >
                    <span
                      className="badge bg-primary d-flex align-items-center justify-content-center fw-bold"
                      style={{
                        width: "28px",
                        height: "28px",
                        flexShrink: 0,
                        fontSize: "0.8rem",
                      }}
                    >
                      {i + 1}
                    </span>
                    <span className="flex-grow-1">{dp.pointText}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {meeting.actionItems && meeting.actionItems.length > 0 && (
            <div className="mb-4">
              <h6 className="fw-semibold mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-check2-square text-success"></i>
                Action Items
                <span className="badge bg-light text-dark">
                  {meeting.actionItems.length}
                </span>
              </h6>
              <div className="d-flex flex-column gap-3">
                {meeting.actionItems.map((ai, i) => (
                  <div
                    key={i}
                    className="p-3 rounded"
                    style={{
                      backgroundColor: "#f8f9fa",
                      border: "1px solid #e9ecef",
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <h6 className="fw-semibold mb-0 flex-grow-1 pe-2">
                        {ai.taskDescription}
                      </h6>
                      <span
                        className={`badge ${
                          ai.status === "Pending"
                            ? "bg-warning text-dark"
                            : "bg-success"
                        }`}
                      >
                        {ai.status}
                      </span>
                    </div>
                    <div className="d-flex flex-wrap gap-3 text-muted small">
                      <span className="d-flex align-items-center gap-2">
                        <i className="bi bi-person-circle text-primary"></i>
                        <span>
                          <strong>Assigned to:</strong>{" "}
                          <span className="text-primary fw-medium">
                            {employeeMap[ai.assignedToEmployeeId] ||
                              `Employee ${ai.assignedToEmployeeId}`}
                          </span>
                        </span>
                      </span>
                      <span className="d-flex align-items-center gap-2">
                        <i className="bi bi-calendar-event text-danger"></i>
                        <span>
                          <strong>Due:</strong>{" "}
                          {new Date(ai.dueDate).toLocaleDateString()}
                        </span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            className="btn btn-outline-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2 shadow-sm"
            onClick={toggleCreateMom}
            style={{ transition: "all 0.2s" }}
          >
            <i
              className={`bi ${
                showCreateMom ? "bi-x-circle" : "bi-plus-circle"
              }`}
            ></i>
            {showCreateMom
              ? "Cancel MOM Creation"
              : "Create MOM for this Meeting"}
          </button>

          {showCreateMom && (
            <CreateMomModal meetingData={meeting} onClose={toggleCreateMom} />
          )}
        </div>
        <div
          className="modal-footer border-0"
          style={{ padding: "1rem 1.5rem 1.5rem" }}
        >
          <button className="btn btn-secondary px-4" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Enhanced CreateMomModal Component
const CreateMomModal = ({ meetingData, onClose }) => {
  const userId = parseInt(localStorage.getItem("userId")) || 0;
  const userRole = localStorage.getItem("userRole") || "Employee";

  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    meetingId: meetingData.meetingId || 0,
    meetingTitle: meetingData.meetingTitle || "",
    meetingType: meetingData.meetingType || "",
    meetingDate: meetingData.meetingDate || new Date().toISOString(),
    meetingLink: meetingData.meetingLink || "",
    attendees: meetingData.attendees || "",
    commentsObservations: meetingData.commentsObservations || "",
    submittedByEmployeeId: userId,
    submittedByRole: userRole,
    isEditable: true,
    discussionPoints:
      meetingData.discussionPoints?.map((dp, index) => ({
        pointId: 0,
        pointText: dp.pointText || "",
        pointOrder: index + 1,
      })) || [],
    actionItems:
      meetingData.actionItems?.map((ai) => ({
        actionItemId: 0,
        taskDescription: ai.taskDescription || "",
        assignedToEmployeeId: ai.assignedToEmployeeId || "",
        dueDate: ai.dueDate || "",
        status: ai.status || "Pending",
      })) || [],
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoadingEmployees(true);
      try {
        const response = await employeeService.getAllEmployees();
        if (response.success && response.data) {
          setEmployees(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch employees:", error);
        toastr.error("Failed to load employee list");
      } finally {
        setLoadingEmployees(false);
      }
    };

    fetchEmployees();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleDiscussionPointChange = (index, value) => {
    const updated = [...formData.discussionPoints];
    updated[index].pointText = value;
    setFormData((prev) => ({ ...prev, discussionPoints: updated }));
  };

  const addDiscussionPoint = () => {
    setFormData((prev) => ({
      ...prev,
      discussionPoints: [
        ...prev.discussionPoints,
        {
          pointId: 0,
          pointText: "",
          pointOrder: prev.discussionPoints.length + 1,
        },
      ],
    }));
  };

  const removeDiscussionPoint = (index) => {
    const updated = formData.discussionPoints.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, discussionPoints: updated }));
  };

  const handleActionItemChange = (index, field, value) => {
    const updated = [...formData.actionItems];
    updated[index][field] = value;
    setFormData((prev) => ({ ...prev, actionItems: updated }));

    const errorKey = `actionItem_${index}_${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: null }));
    }
  };

  const addActionItem = () => {
    setFormData((prev) => ({
      ...prev,
      actionItems: [
        ...prev.actionItems,
        {
          actionItemId: 0,
          taskDescription: "",
          assignedToEmployeeId: "",
          dueDate: "",
          status: "Pending",
        },
      ],
    }));
  };

  const removeActionItem = (index) => {
    const updated = formData.actionItems.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, actionItems: updated }));
  };

  const validateForm = () => {
    const newErrors = {};

    formData.actionItems.forEach((item, index) => {
      if (item.taskDescription.trim()) {
        if (!item.assignedToEmployeeId) {
          newErrors[`actionItem_${index}_assignedToEmployeeId`] =
            "Please assign this task";
        }
        if (!item.dueDate) {
          newErrors[`actionItem_${index}_dueDate`] = "Please set a due date";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toastr.error("Please fix the errors before submitting");
      return;
    }

    setSubmitting(true);
    try {
      await momService.createMom(formData);
      toastr.success("MOM created successfully");
      onClose();
      window.location.reload();
    } catch (err) {
      toastr.error("Failed to create MOM");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const getEmployeeName = (employeeMasterId) => {
    const employee = employees.find(
      (e) => e.employeeMasterId === parseInt(employeeMasterId)
    );
    return employee ? `${employee.firstName} ${employee.lastName}` : "";
  };

  return (
    <div
      className="card border-0 shadow-sm mt-3"
      style={{ borderRadius: "12px" }}
    >
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h6 className="card-title fw-bold mb-0 d-flex align-items-center gap-2">
            <i className="bi bi-file-text"></i>
            Create Meeting Minutes
          </h6>
          <button
            type="button"
            className="btn-close"
            onClick={onClose}
          ></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card bg-light border-0 mb-4">
            <div className="card-body p-3">
              <h6 className="fw-semibold mb-3 text-muted small">
                MEETING INFORMATION
              </h6>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-muted">
                    Meeting Title
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={formData.meetingTitle}
                    disabled
                    style={{ backgroundColor: "#ffffff" }}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-muted">
                    Meeting Type
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={formData.meetingType}
                    disabled
                    style={{ backgroundColor: "#ffffff" }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold d-flex align-items-center gap-2">
              <i className="bi bi-chat-left-text"></i>
              Comments & Observations
            </label>
            <textarea
              className="form-control"
              rows="3"
              name="commentsObservations"
              value={formData.commentsObservations}
              onChange={handleInputChange}
              placeholder="Add any observations or notes about the meeting..."
              style={{ resize: "vertical" }}
            />
          </div>

          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <label className="form-label fw-semibold mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-chat-dots"></i>
                Discussion Points
                {formData.discussionPoints.length > 0 && (
                  <span className="badge bg-primary">
                    {formData.discussionPoints.length}
                  </span>
                )}
              </label>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2"
                onClick={addDiscussionPoint}
              >
                <i className="bi bi-plus-circle"></i> Add Point
              </button>
            </div>

            {formData.discussionPoints.length === 0 ? (
              <div className="alert alert-light border d-flex align-items-center gap-3 mb-0">
                <i
                  className="bi bi-chat-dots"
                  style={{ fontSize: "1.5rem" }}
                ></i>
                <div>
                  <p className="mb-0 fw-semibold">No discussion points added</p>
                  <small className="text-muted">
                    Click "Add Point" to document key topics discussed
                  </small>
                </div>
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {formData.discussionPoints.map((dp, index) => (
                  <div key={index} className="card bg-light border-0">
                    <div className="card-body p-3">
                      <div className="d-flex align-items-start gap-2">
                        <span
                          className="badge bg-primary d-flex align-items-center justify-content-center fw-bold"
                          style={{
                            width: "28px",
                            height: "28px",
                            flexShrink: 0,
                            fontSize: "0.8rem",
                          }}
                        >
                          {index + 1}
                        </span>
                        <input
                          type="text"
                          className="form-control flex-grow-1"
                          value={dp.pointText}
                          onChange={(e) =>
                            handleDiscussionPointChange(index, e.target.value)
                          }
                          placeholder="Enter discussion point..."
                        />
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger d-flex align-items-center"
                          onClick={() => removeDiscussionPoint(index)}
                          style={{ flexShrink: 0 }}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <label className="form-label fw-semibold mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-check2-square"></i>
                Action Items
                {formData.actionItems.length > 0 && (
                  <span className="badge bg-success">
                    {formData.actionItems.length}
                  </span>
                )}
              </label>
              <button
                type="button"
                className="btn btn-sm btn-outline-success d-flex align-items-center gap-2"
                onClick={addActionItem}
              >
                <i className="bi bi-plus-circle"></i> Add Action
              </button>
            </div>

            {formData.actionItems.length === 0 ? (
              <div className="alert alert-light border d-flex align-items-center gap-3 mb-0">
                <i
                  className="bi bi-check2-square"
                  style={{ fontSize: "1.5rem" }}
                ></i>
                <div>
                  <p className="mb-0 fw-semibold">No action items added</p>
                  <small className="text-muted">
                    Click "Add Action" to create tasks and assign them to team
                    members
                  </small>
                </div>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {formData.actionItems.map((item, index) => (
                  <div key={index} className="card border shadow-sm">
                    <div className="card-body p-3">
                      <div className="mb-3">
                        <label className="form-label small fw-semibold text-muted">
                          Task Description *
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={item.taskDescription}
                          onChange={(e) =>
                            handleActionItemChange(
                              index,
                              "taskDescription",
                              e.target.value
                            )
                          }
                          placeholder="Describe the action item..."
                        />
                      </div>

                      <div className="row g-2">
                        <div className="col-md-5">
                          <label className="form-label small fw-semibold text-muted d-flex align-items-center gap-1">
                            <i className="bi bi-person-circle"></i>
                            Assign To *
                          </label>
                          <select
                            className={`form-select form-select-sm ${
                              errors[`actionItem_${index}_assignedToEmployeeId`]
                                ? "is-invalid"
                                : ""
                            }`}
                            value={item.assignedToEmployeeId}
                            onChange={(e) =>
                              handleActionItemChange(
                                index,
                                "assignedToEmployeeId",
                                e.target.value
                              )
                            }
                            disabled={loadingEmployees}
                          >
                            <option value="">
                              {loadingEmployees
                                ? "Loading..."
                                : "Select employee..."}
                            </option>
                            {employees.map((emp) => (
                              <option
                                key={emp.employeeMasterId}
                                value={emp.employeeMasterId}
                              >
                                {emp.firstName} {emp.lastName} - {emp.roleName}
                              </option>
                            ))}
                          </select>
                          {errors[
                            `actionItem_${index}_assignedToEmployeeId`
                          ] && (
                            <div className="invalid-feedback d-block">
                              <i className="bi bi-exclamation-circle me-1"></i>
                              {
                                errors[
                                  `actionItem_${index}_assignedToEmployeeId`
                                ]
                              }
                            </div>
                          )}
                          {item.assignedToEmployeeId &&
                            getEmployeeName(item.assignedToEmployeeId) && (
                              <small className="text-success d-flex align-items-center gap-1 mt-1">
                                <i className="bi bi-check-circle"></i>
                                Assigned to:{" "}
                                <strong>
                                  {getEmployeeName(item.assignedToEmployeeId)}
                                </strong>
                              </small>
                            )}
                        </div>

                        <div className="col-md-4">
                          <label className="form-label small fw-semibold text-muted d-flex align-items-center gap-1">
                            <i className="bi bi-calendar-event"></i>
                            Due Date *
                          </label>
                          <input
                            type="date"
                            className={`form-control form-control-sm ${
                              errors[`actionItem_${index}_dueDate`]
                                ? "is-invalid"
                                : ""
                            }`}
                            value={item.dueDate}
                            onChange={(e) =>
                              handleActionItemChange(
                                index,
                                "dueDate",
                                e.target.value
                              )
                            }
                            min={new Date().toISOString().split("T")[0]}
                          />
                          {errors[`actionItem_${index}_dueDate`] && (
                            <div className="invalid-feedback d-block">
                              <i className="bi bi-exclamation-circle me-1"></i>
                              {errors[`actionItem_${index}_dueDate`]}
                            </div>
                          )}
                        </div>

                        <div className="col-md-3">
                          <label className="form-label small fw-semibold text-muted">
                            Status
                          </label>
                          <select
                            className="form-select form-select-sm"
                            value={item.status}
                            onChange={(e) =>
                              handleActionItemChange(
                                index,
                                "status",
                                e.target.value
                              )
                            }
                          >
                            <option value="Pending">Pending</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-top">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger d-flex align-items-center gap-2"
                          onClick={() => removeActionItem(index)}
                        >
                          <i className="bi bi-trash"></i>
                          Remove Action Item
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="d-flex gap-2 pt-3 border-top">
            <button
              type="submit"
              disabled={submitting || loadingEmployees}
              className="btn btn-success flex-grow-1 d-flex align-items-center justify-content-center gap-2"
              style={{ fontWeight: "500" }}
            >
              {submitting ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Creating MOM...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle"></i>
                  Create MOM
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-light px-4 d-flex align-items-center gap-2"
              disabled={submitting}
            >
              <i className="bi bi-x-lg"></i>
              Cancel
            </button>
          </div>
        </form>

        {formData.actionItems.length > 0 && (
          <div className="alert alert-info mt-3 mb-0 d-flex align-items-start gap-2">
            <i className="bi bi-info-circle mt-1 flex-shrink-0"></i>
            <div className="small">
              <strong>Note:</strong> All assigned employees will be notified via
              email about their action items.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Shared MOMs Modal Component
const SharedMomsModal = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState("sharedByMe");
  const [sharedByMeMoms, setSharedByMeMoms] = useState([]);
  const [sharedWithMeMoms, setSharedWithMeMoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMom, setSelectedMom] = useState(null);

  useEffect(() => {
    loadSharedMoms();
  }, [activeTab]);

  const loadSharedMoms = async () => {
    setLoading(true);
    try {
      if (activeTab === "sharedByMe") {
        const response = await momService.getMomsSharedByMe();
        setSharedByMeMoms(response.data || []);
      } else {
        const response = await momService.getMomsSharedWithMe();
        setSharedWithMeMoms(response.data || []);
      }
    } catch (error) {
      toastr.error("Failed to load shared MOMs");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewMom = async (momId) => {
    try {
      const response = await momService.getMomById(momId);
      setSelectedMom(response.data);
    } catch (error) {
      toastr.error("Failed to load MOM details");
      console.error(error);
    }
  };

  const currentMoms =
    activeTab === "sharedByMe" ? sharedByMeMoms : sharedWithMeMoms;

  return (
    <>
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        style={{
          backgroundColor: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
        }}
        onClick={onClose}
      >
        <div
          className="modal-dialog modal-dialog-scrollable modal-xl modal-dialog-centered"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="modal-content border-0 shadow-lg"
            style={{ borderRadius: "16px" }}
          >
            <div
              className="modal-header border-0"
              style={{ padding: "1.5rem" }}
            >
              <div className="w-100">
                <h5 className="modal-title fw-bold mb-3">Shared MOMs</h5>
                <ul className="nav nav-pills">
                  <li className="nav-item">
                    <button
                      className={`nav-link ${
                        activeTab === "sharedByMe" ? "active" : ""
                      }`}
                      onClick={() => setActiveTab("sharedByMe")}
                      style={{
                        backgroundColor:
                          activeTab === "sharedByMe"
                            ? "#5046e5"
                            : "transparent",
                        color: activeTab === "sharedByMe" ? "white" : "#6c757d",
                        transition: "all 0.2s",
                      }}
                    >
                      <i className="bi bi-share me-2"></i>Shared By Me
                    </button>
                  </li>
                  <li className="nav-item ms-2">
                    <button
                      className={`nav-link ${
                        activeTab === "sharedWithMe" ? "active" : ""
                      }`}
                      onClick={() => setActiveTab("sharedWithMe")}
                      style={{
                        backgroundColor:
                          activeTab === "sharedWithMe"
                            ? "#5046e5"
                            : "transparent",
                        color:
                          activeTab === "sharedWithMe" ? "white" : "#6c757d",
                        transition: "all 0.2s",
                      }}
                    >
                      <i className="bi bi-inbox me-2"></i>Shared With Me
                    </button>
                  </li>
                </ul>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
              ></button>
            </div>
            <div className="modal-body p-0">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="text-muted mt-3">Loading shared MOMs...</p>
                </div>
              ) : currentMoms.length === 0 ? (
                <div className="text-center py-5">
                  <div
                    className="mb-3"
                    style={{ fontSize: "3.5rem", opacity: 0.3 }}
                  >
                    <i className="bi bi-inbox"></i>
                  </div>
                  <h6 className="fw-semibold text-muted mb-2">
                    No {activeTab === "sharedByMe" ? "shared" : "received"} MOMs
                    found
                  </h6>
                  <p className="text-muted small">
                    {activeTab === "sharedByMe"
                      ? "You haven't shared any MOMs yet"
                      : "No MOMs have been shared with you"}
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead
                      style={{
                        backgroundColor: "#f8f9fa",
                        position: "sticky",
                        top: 0,
                        zIndex: 1,
                      }}
                    >
                      <tr>
                        <th className="px-4 py-3 fw-semibold">Meeting Title</th>
                        <th className="px-4 py-3 fw-semibold">Type</th>
                        <th className="px-4 py-3 fw-semibold">Date</th>
                        <th className="px-4 py-3 fw-semibold">
                          {activeTab === "sharedByMe"
                            ? "Shared With"
                            : "Shared By"}
                        </th>
                        <th className="px-4 py-3 fw-semibold text-center">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentMoms.map((mom, index) => (
                        <tr
                          key={`shared-mom-${activeTab}-${mom.momId}-${index}`}
                          style={{
                            cursor: "pointer",
                            transition: "background-color 0.2s",
                          }}
                          onMouseOver={(e) =>
                            (e.currentTarget.style.backgroundColor = "#f8f9fa")
                          }
                          onMouseOut={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              "transparent")
                          }
                        >
                          <td
                            className="px-4 py-3"
                            onClick={() => handleViewMom(mom.momId)}
                          >
                            <div className="fw-semibold">
                              {mom.meetingTitle}
                            </div>
                            {mom.meetingDate && (
                              <small className="text-muted">
                                <i className="bi bi-calendar3 me-1"></i>
                                {new Date(mom.meetingDate).toLocaleDateString()}
                              </small>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="badge bg-primary-subtle text-primary">
                              {mom.meetingType || "N/A"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {activeTab === "sharedByMe"
                              ? mom.sharedAt
                                ? new Date(mom.sharedAt).toLocaleDateString()
                                : "N/A"
                              : mom.meetingDate
                              ? new Date(mom.meetingDate).toLocaleDateString()
                              : mom.sharedAt
                              ? new Date(mom.sharedAt).toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="d-flex align-items-center gap-2">
                              <i className="bi bi-person-circle text-muted"></i>
                              {activeTab === "sharedByMe"
                                ? mom.sharedWithEmployeeName || "Unknown"
                                : mom.sharedByEmployeeName ||
                                  mom.submittedByEmployeeName ||
                                  "Unknown"}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 mx-auto"
                              onClick={() => handleViewMom(mom.momId)}
                            >
                              <i className="bi bi-eye"></i> View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div
              className="modal-footer border-0 bg-light"
              style={{ padding: "1rem 1.5rem" }}
            >
              <span className="text-muted small me-auto">
                Showing {currentMoms.length}{" "}
                {activeTab === "sharedByMe" ? "shared" : "received"} MOM
                {currentMoms.length !== 1 ? "s" : ""}
              </span>
              <button className="btn btn-secondary px-4" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedMom && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{
            backgroundColor: "rgba(0,0,0,0.7)",
            zIndex: 1060,
            backdropFilter: "blur(6px)",
          }}
          onClick={() => setSelectedMom(null)}
        >
          <div
            className="modal-dialog modal-dialog-scrollable modal-lg modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <MomDetailsView
              mom={selectedMom}
              onClose={() => setSelectedMom(null)}
            />
          </div>
        </div>
      )}
    </>
  );
};

// MOM Details View Component
const MomDetailsView = ({ mom, onClose }) => (
  <div
    className="modal-content border-0 shadow-lg"
    style={{ borderRadius: "16px" }}
  >
    <div
      className="modal-header border-0"
      style={{ padding: "1.5rem 1.5rem 1rem" }}
    >
      <div>
        <h5 className="modal-title fw-bold mb-2">{mom.meetingTitle}</h5>
        <span className="badge bg-primary-subtle text-primary">
          {mom.meetingType}
        </span>
      </div>
      <button type="button" className="btn-close" onClick={onClose}></button>
    </div>
    <div className="modal-body" style={{ padding: "1rem 1.5rem" }}>
      <div className="card bg-light border-0 mb-4">
        <div className="card-body p-3">
          <h6 className="fw-semibold mb-3 text-muted small">
            MEETING INFORMATION
          </h6>
          <div className="row g-3">
            <div className="col-md-6">
              <small className="text-muted d-block mb-1">Meeting Date:</small>
              <div className="fw-semibold d-flex align-items-center gap-2">
                <i className="bi bi-calendar3 text-primary"></i>
                {new Date(mom.meetingDate).toLocaleString()}
              </div>
            </div>
            {mom.meetingLink && (
              <div className="col-md-6">
                <small className="text-muted d-block mb-1">Meeting Link:</small>
                <a
                  href={mom.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary fw-semibold d-flex align-items-center gap-2"
                >
                  <i className="bi bi-link-45deg"></i>
                  Join Meeting
                  <i className="bi bi-box-arrow-up-right small"></i>
                </a>
              </div>
            )}
            <div className="col-md-6">
              <small className="text-muted d-block mb-1">Attendees:</small>
              <div className="fw-semibold d-flex align-items-center gap-2">
                <i className="bi bi-people text-success"></i>
                {mom.attendees || "N/A"}
              </div>
            </div>
            <div className="col-md-6">
              <small className="text-muted d-block mb-1">Submitted by:</small>
              <div className="fw-semibold d-flex align-items-center gap-2">
                <i className="bi bi-person-circle text-info"></i>
                {mom.submittedByEmployeeName} ({mom.submittedByRole})
              </div>
            </div>
          </div>
        </div>
      </div>

      {mom.commentsObservations && (
        <div className="mb-4">
          <h6 className="fw-semibold mb-3 d-flex align-items-center gap-2">
            <i className="bi bi-chat-left-text text-info"></i>
            Comments & Observations
          </h6>
          <div className="alert alert-secondary mb-0">
            {mom.commentsObservations}
          </div>
        </div>
      )}

      <div className="mb-4">
        <h6 className="fw-semibold mb-3 d-flex align-items-center gap-2">
          <i className="bi bi-chat-dots text-warning"></i>
          Discussion Points
          {mom.discussionPoints?.length > 0 && (
            <span className="badge bg-light text-dark">
              {mom.discussionPoints.length}
            </span>
          )}
        </h6>
        {mom.discussionPoints?.length > 0 ? (
          <div className="d-flex flex-column gap-2">
            {mom.discussionPoints.map((dp, index) => (
              <div
                key={index}
                className="p-3 rounded d-flex align-items-start gap-3"
                style={{ backgroundColor: "#f8f9fa" }}
              >
                <span
                  className="badge bg-primary d-flex align-items-center justify-content-center fw-bold"
                  style={{
                    width: "28px",
                    height: "28px",
                    flexShrink: 0,
                    fontSize: "0.8rem",
                  }}
                >
                  {index + 1}
                </span>
                <span className="flex-grow-1">{dp.pointText}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="alert alert-info mb-0">
            No discussion points recorded
          </div>
        )}
      </div>

      <div className="mb-4">
        <h6 className="fw-semibold mb-3 d-flex align-items-center gap-2">
          <i className="bi bi-check2-square text-success"></i>
          Action Items
          {mom.actionItems?.length > 0 && (
            <span className="badge bg-light text-dark">
              {mom.actionItems.length}
            </span>
          )}
        </h6>
        {mom.actionItems?.length > 0 ? (
          <div className="d-flex flex-column gap-3">
            {mom.actionItems.map((ai, index) => (
              <div
                key={index}
                className="p-3 rounded"
                style={{
                  backgroundColor: "#f8f9fa",
                  border: "1px solid #e9ecef",
                }}
              >
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h6 className="fw-semibold mb-0">{ai.taskDescription}</h6>
                  <span
                    className={`badge ${
                      ai.status === "Completed"
                        ? "bg-success"
                        : "bg-warning text-dark"
                    }`}
                  >
                    {ai.status}
                  </span>
                </div>
                <div className="row g-2">
                  <div className="col-md-6">
                    <small className="text-muted d-flex align-items-center gap-2">
                      <i className="bi bi-person-circle text-primary"></i>
                      <strong>Assigned to:</strong>{" "}
                      {ai.assignedToEmployeeName || "N/A"}
                    </small>
                  </div>
                  <div className="col-md-6">
                    <small className="text-muted d-flex align-items-center gap-2">
                      <i className="bi bi-calendar-event text-danger"></i>
                      <strong>Due Date:</strong>{" "}
                      {ai.dueDate
                        ? new Date(ai.dueDate).toLocaleDateString()
                        : "N/A"}
                    </small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="alert alert-info mb-0">No action items recorded</div>
        )}
      </div>
    </div>
    <div
      className="modal-footer border-0"
      style={{ padding: "1rem 1.5rem 1.5rem" }}
    >
      <button className="btn btn-secondary px-4" onClick={onClose}>
        Close
      </button>
    </div>
  </div>
);

export default EmployeeMomDashboard;
