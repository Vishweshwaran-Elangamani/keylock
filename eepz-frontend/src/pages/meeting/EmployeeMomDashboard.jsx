import { useState, useEffect } from "react";
import momService from "../../services/meeting/momService";
import rsvpService from "../../services/meeting/rsvpService";
import employeeService from "../../services/meeting/employeeservice";
import toastr from "toastr";
import { useNavigate, useLocation } from "react-router-dom";
import { Home } from "lucide-react";
import MeetingDetailsModal from "../../components/meeting/modals/MeetingDetailsModal";
import SharedMomsModal from "../../components/meeting/modals/SharedMomsModal";
import "../../styles/mom/components/EmployeeMomDashboard.css";

const EmployeeMomDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
  const [showSharedModal, setShowSharedModal] = useState(false);
  const [empMomActive, setEmpMomActive] = useState(null);

  useEffect(() => {
    loadDashboardData();
    fetchMeetings();
    loadAllEmployees();
  }, []);

  useEffect(() => {
    if (location.state?.fromPage) {
      setEmpMomActive(location.state.fromPage);
      if (location.state.fromPage === "sharedMoms") {
        setShowSharedModal(true);
      }
    }
  }, [location.state]);

  // Helper to get property with PascalCase/camelCase fallback
  const getProperty = (obj, camelKey, pascalKey) => {
    return obj?.[camelKey] ?? obj?.[pascalKey] ?? null;
  };

  const loadAllEmployees = async () => {
    try {
      const res = await employeeService.getAllEmployees();
      const employeeData = res?.data || res?.Data || [];
      const employeeSuccess = res?.success || res?.Success;

      if (employeeSuccess && Array.isArray(employeeData)) {
        const map = {};
        employeeData.forEach((emp) => {
          const empId =
            getProperty(emp, "employeeMasterId", "EmployeeMasterId") ||
            getProperty(emp, "employeeId", "EmployeeId");
          const firstName = getProperty(emp, "firstName", "FirstName") || "";
          const lastName = getProperty(emp, "lastName", "LastName") || "";
          if (empId) {
            map[empId] = `${firstName} ${lastName}`.trim();
          }
        });
        setEmployeeMap(map);
      }
    } catch (error) {
      console.error("Error loading employees:", error);
      if (error.retryAfter) {
        console.warn(`Rate limit: retry after ${error.retryAfter} seconds`);
      }
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [myMomsRes, actionItemsRes, invitationsRes, sharedRes] =
        await Promise.all([
          momService.getMyMoms({ pageNumber: 1, pageSize: 100 }),
          momService.getMyActionItems(),
          rsvpService.getMyInvitations(),
          momService.getMomsSharedWithMe(),
        ]);

      // Extract data with PascalCase/camelCase fallback
      const myMomsData =
        myMomsRes?.data?.data ||
        myMomsRes?.data?.Data ||
        myMomsRes?.Data?.Data ||
        myMomsRes?.data ||
        [];

      const actionItemsData =
        actionItemsRes?.data || actionItemsRes?.Data || [];
      const invitationsData =
        invitationsRes?.data || invitationsRes?.Data || [];
      const sharedData = sharedRes?.data || sharedRes?.Data || [];

      // Filter pending actions
      const pendingActions = actionItemsData.filter((item) => {
        const status = getProperty(item, "status", "Status");
        return status === "Pending";
      });

      // ✅ FIXED: Filter pending invitations based on numeric rsvpStatus (0 = Pending)
      const pendingInvites = invitationsData.filter((inv) => {
        const rsvpStatus = getProperty(inv, "rsvpStatus", "RsvpStatus");
        // Check for numeric 0 (Pending) or string "Pending"
        return (
          rsvpStatus === 0 || rsvpStatus === "0" || rsvpStatus === "Pending"
        );
      });

      setStats({
        myMoms: Array.isArray(myMomsData) ? myMomsData.length : 0,
        pendingActionItems: pendingActions.length,
        meetingInvitations: pendingInvites.length, // ✅ Now shows correct pending count
        sharedMoms: Array.isArray(sharedData) ? sharedData.length : 0,
      });

      const activity = [];

      // Add recent MOMs to activity
      if (Array.isArray(myMomsData) && myMomsData.length > 0) {
        myMomsData.slice(0, 3).forEach((mom) => {
          const meetingTitle = getProperty(mom, "meetingTitle", "MeetingTitle");
          const createdAt = getProperty(mom, "createdAt", "CreatedAt");
          const meetingId = getProperty(mom, "meetingId", "MeetingId");

          activity.push({
            type: "mom",
            title: meetingTitle || "Untitled Meeting",
            date: createdAt,
            icon: "bi-file-text",
            color: "primary",
            meetingId: meetingId,
            meetingData: mom,
          });
        });
      }

      // Add recent invitations to activity
      if (Array.isArray(invitationsData) && invitationsData.length > 0) {
        invitationsData.slice(0, 2).forEach((inv) => {
          const meetingTitle = getProperty(inv, "meetingTitle", "MeetingTitle");
          const meetingDate = getProperty(inv, "meetingDate", "MeetingDate");
          const meetingId = getProperty(inv, "meetingId", "MeetingId");

          activity.push({
            type: "invitation",
            title: meetingTitle || "Untitled Meeting",
            date: meetingDate,
            icon: "bi-calendar-event",
            color: "warning",
            meetingId: meetingId,
            meetingData: inv,
          });
        });
      }

      setRecentActivity(
        activity.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)
      );
    } catch (error) {
      console.error("Dashboard data error:", error);

      if (error.retryAfter) {
        toastr.error(
          `Rate limit exceeded. Please wait ${error.retryAfter} seconds.`
        );
      } else if (error.message) {
        toastr.error(`Failed to load dashboard: ${error.message}`);
      } else {
        toastr.error("Failed to load dashboard data");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMeetings = async () => {
    try {
      const res = await momService.getMyMoms({ pageNumber: 1, pageSize: 100 });

      // Extract meetings data with fallback
      const meetingsData =
        res?.data?.data ||
        res?.data?.Data ||
        res?.Data?.Data ||
        res?.data ||
        [];

      setMeetings(Array.isArray(meetingsData) ? meetingsData : []);
    } catch (error) {
      console.error("Failed to load meetings:", error);
      if (error.retryAfter) {
        console.warn(`Rate limit: retry after ${error.retryAfter} seconds`);
      } else {
        toastr.error("Failed to load meetings");
      }
    }
  };

  const openMeetingDetails = (meeting) => setSelectedMeeting(meeting);
  const closeMeetingDetails = () => setSelectedMeeting(null);

  const handleActivityClick = (item) => {
    if (item.meetingData) openMeetingDetails(item.meetingData);
  };

  const openSharedModal = () => {
    setEmpMomActive("sharedMoms");
    setShowSharedModal(true);
  };

  const closeSharedModal = () => {
    setShowSharedModal(false);
  };

  if (loading) {
    return (
      <div className="emd-loading-container">
        <div className="emd-loading-content">
          <div className="emd-spinner" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="emd-loading-text">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="emd-page">
      <div className="emd-container">
        <nav aria-label="breadcrumb" className="emd-breadcrumb">
          <ol className="emd-breadcrumb-list">
            <li className="emd-breadcrumb-item">
              <button
                onClick={() => navigate("/employee/dashboard")}
                className="emd-breadcrumb-link emd-breadcrumb-home"
                type="button"
              >
                <Home size={20} />
              </button>
            </li>
            <li className="emd-breadcrumb-separator">/</li>
            <li className="emd-breadcrumb-item emd-breadcrumb-active">
              <span>Meetings and MoM</span>
            </li>
          </ol>
        </nav>

        <div className="row g-3 emd-stats-row">
          <StatCard
            icon="bi-file-text"
            variant="moms"
            count={stats.myMoms}
            label="MY MOMS"
            onClick={() => navigate("/employee/dashboard/meetmom/my-moms")}
          />

          <StatCard
            icon="bi-clock-history"
            variant="pending"
            count={stats.pendingActionItems}
            label="PENDING ACTIONS"
            onClick={() => navigate("/employee/dashboard/meetmom/action-items")}
          />

          <StatCard
            icon="bi-envelope-open"
            variant="invites"
            count={stats.meetingInvitations}
            label="INVITATIONS"
            onClick={() => navigate("/employee/dashboard/meetmom/invitations")}
          />

          <StatCard
            icon="bi-share"
            variant="shared"
            count={stats.sharedMoms}
            label="SHARED MOMS"
            onClick={openSharedModal}
          />
        </div>

        <div className="emp-momupdate-buttons-wrapper">
          <div className="emp-momupdate-buttons-grid">
            <button
              type="button"
              className={`emp-momupdate-btn ${
                empMomActive === "myMoms" ? "active" : ""
              }`}
              onClick={() => {
                setEmpMomActive("myMoms");
                navigate("/employee/dashboard/meetmom/my-moms");
              }}
              title="My MOMs"
            >
              <span className="emp-momupdate-btn-icon">
                <i className="bi bi-person"></i>
              </span>
              <span className="emp-momupdate-btn-label">My MOMs</span>
            </button>

            <button
              type="button"
              className={`emp-momupdate-btn ${
                empMomActive === "sharedMoms" ? "active" : ""
              }`}
              onClick={() => {
                setEmpMomActive("sharedMoms");
                openSharedModal();
              }}
              title="Shared MOMs"
            >
              <span className="emp-momupdate-btn-icon">
                <i className="bi bi-people"></i>
              </span>
              <span className="emp-momupdate-btn-label">Shared MOMs</span>
            </button>

            <button
              type="button"
              className={`emp-momupdate-btn ${
                empMomActive === "actionItems" ? "active" : ""
              }`}
              onClick={() => {
                setEmpMomActive("actionItems");
                navigate("/employee/dashboard/meetmom/action-items");
              }}
              title="Action Items"
            >
              <span className="emp-momupdate-btn-icon">
                <i className="bi bi-list-check"></i>
              </span>
              <span className="emp-momupdate-btn-label">Action Items</span>
            </button>

            <button
              type="button"
              className={`emp-momupdate-btn ${
                empMomActive === "invitations" ? "active" : ""
              }`}
              onClick={() => {
                setEmpMomActive("invitations");
                navigate("/employee/dashboard/meetmom/invitations");
              }}
              title="Invitations"
            >
              <span className="emp-momupdate-btn-icon">
                <i className="bi bi-envelope"></i>
              </span>
              <span className="emp-momupdate-btn-label">Invitations</span>
            </button>
          </div>
        </div>

        <div className="row emd-content-row">
          <div className="col-lg-6 mb-4">
            <div className="emd-card">
              <div className="emd-card-body">
                <div className="emd-card-header">
                  <h5 className="emd-card-title">
                    <i className="bi bi-clock-history"></i>
                    Recent Activity
                  </h5>
                  <span className="emd-count-badge">
                    {recentActivity.length} items
                  </span>
                </div>

                {recentActivity.length === 0 ? (
                  <div className="emd-empty-state">
                    <div className="emd-empty-icon">
                      <i className="bi bi-inbox"></i>
                    </div>
                    <h6 className="emd-empty-title">No recent activity</h6>
                    <p className="emd-empty-text">
                      Your recent MOMs and invitations will appear here
                    </p>
                  </div>
                ) : (
                  <div className="emd-activity-list">
                    {recentActivity.map((item, idx) => (
                      <ActivityItem
                        key={idx}
                        item={item}
                        onClick={() => handleActivityClick(item)}
                        getProperty={getProperty}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-lg-6 mb-4">
            <div className="emd-card">
              <div className="emd-card-body">
                <div className="emd-card-header">
                  <h5 className="emd-card-title">
                    <i className="bi bi-calendar3"></i>
                    My Meetings
                  </h5>
                  <span className="emd-count-badge">
                    {meetings.length} meetings
                  </span>
                </div>

                {meetings.length === 0 ? (
                  <div className="emd-empty-state">
                    <div className="emd-empty-icon">
                      <i className="bi bi-calendar-x"></i>
                    </div>
                    <h6 className="emd-empty-title">No meetings found</h6>
                    <p className="emd-empty-text">
                      Create your first meeting minute to get started
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="emd-meetings-list">
                      {meetings.slice(0, 5).map((m) => {
                        const meetingId = getProperty(
                          m,
                          "meetingId",
                          "MeetingId"
                        );
                        const meetingTitle = getProperty(
                          m,
                          "meetingTitle",
                          "MeetingTitle"
                        );
                        const meetingType = getProperty(
                          m,
                          "meetingType",
                          "MeetingType"
                        );
                        const meetingDate = getProperty(
                          m,
                          "meetingDate",
                          "MeetingDate"
                        );
                        const actionItems =
                          getProperty(m, "actionItems", "ActionItems") || [];

                        return (
                          <div
                            key={meetingId}
                            className="emd-meeting-item"
                            onClick={() => openMeetingDetails(m)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) =>
                              e.key === "Enter" && openMeetingDetails(m)
                            }
                          >
                            <div className="emd-meeting-main">
                              <div className="emd-meeting-title-row">
                                <span className="emd-meeting-title">
                                  {meetingTitle || "Untitled Meeting"}
                                </span>
                                <span className="emd-meeting-type-pill">
                                  {meetingType || "Other"}
                                </span>
                              </div>
                              <div className="emd-meeting-meta-row">
                                <span className="emd-meta-item">
                                  <i className="bi bi-calendar3"></i>
                                  {meetingDate
                                    ? new Date(meetingDate).toLocaleDateString()
                                    : "No date"}
                                </span>
                                <span className="emd-meta-item">
                                  <i className="bi bi-clock"></i>
                                  {meetingDate
                                    ? new Date(meetingDate).toLocaleTimeString(
                                        [],
                                        {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        }
                                      )
                                    : "--:--"}
                                </span>
                                {Array.isArray(actionItems) &&
                                  actionItems.length > 0 && (
                                    <span className="emd-meta-item">
                                      <i className="bi bi-check-circle"></i>
                                      {actionItems.length} action
                                      {actionItems.length !== 1 ? "s" : ""}
                                    </span>
                                  )}
                              </div>
                            </div>
                            <i className="bi bi-chevron-right emd-meeting-arrow"></i>
                          </div>
                        );
                      })}
                    </div>

                    {meetings.length > 5 && (
                      <div className="emd-view-all">
                        <button
                          className="emd-view-all-btn"
                          onClick={() =>
                            navigate("/employee/dashboard/meetmom/my-moms")
                          }
                          type="button"
                        >
                          View All {meetings.length} Meetings
                          <i className="bi bi-arrow-right"></i>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {selectedMeeting && (
          <MeetingDetailsModal
            meeting={selectedMeeting}
            onClose={closeMeetingDetails}
            employeeMap={employeeMap}
          />
        )}

        {showSharedModal && <SharedMomsModal onClose={closeSharedModal} />}
      </div>
    </div>
  );
};

const StatCard = ({ icon, variant, count, label, onClick }) => (
  <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12">
    <div
      className="emd-stat-card-horizontal"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      <div className={`emd-stat-icon-block emd-stat-icon-block-${variant}`}>
        <i className={`${icon} emd-stat-icon emd-stat-icon-${variant}`} />
      </div>
      <div className="emd-stat-center">
        <div className="emd-stat-center-count">{count}</div>
        <div className="emd-stat-center-label">{label}</div>
      </div>
    </div>
  </div>
);

const ActivityItem = ({ item, onClick, getProperty }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "No date";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "Invalid date";
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "--:--";
    try {
      return new Date(dateString).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "--:--";
    }
  };

  return (
    <div
      className="emd-activity-item"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      <div
        className={`emd-activity-icon-wrapper emd-activity-${
          item.color || "primary"
        }`}
      >
        <i className={`${item.icon} emd-activity-icon`} />
      </div>
      <div className="emd-activity-main">
        <h6 className="emd-activity-title">{item.title}</h6>
        <div className="emd-activity-meta-row">
          <span className="emd-meta-item">
            <i className="bi bi-calendar3"></i>
            {formatDate(item.date)}
          </span>
          <span className="emd-meta-item">
            <i className="bi bi-clock"></i>
            {formatTime(item.date)}
          </span>
        </div>
      </div>
      <i className="bi bi-arrow-right emd-activity-arrow" />
    </div>
  );
};

export default EmployeeMomDashboard;
