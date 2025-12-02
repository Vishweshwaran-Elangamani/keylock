
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import momService from "../../services/meeting/momService";
import meetingService from "../../services/meeting/meetingService";
import rsvpService from "../../services/meeting/rsvpService";
import employeeService from "../../services/meeting/employeeservice";
import toastr from "toastr";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import ManagerMeetingDetailsModal from "../../components/meeting/modals/ManagerMeetingDetailsModal";


const ManagerMomDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    teamMomsCount: 0,
    oneOnOnesCount: 0,
    overdueActionsCount: 0,
    totalMeetingsCount: 0,
  });
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [recentTeamMoms, setRecentTeamMoms] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [employeeMap, setEmployeeMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showTableView, setShowTableView] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [actionItemFilter, setActionItemFilter] = useState("all");


  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      loadDashboardData(true); 
    }, 30000); 

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);


  const loadDashboardData = async (silentRefresh = false) => {
    try {
      if (!silentRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      
    
      const [myMomsRes, meetingsRes, employeesRes, actionItemsAssignedByMeRes] = await Promise.all([
        momService.getMyMoms(),
        meetingService.getMyMeetings(),
        employeeService.getAllEmployees(),
        momService.getActionItemsAssignedByMe(), // This gets action items assigned BY manager
      ]);

      if (employeesRes.success && employeesRes.data) {
        const nameMap = {};
        employeesRes.data.forEach((emp) => {
          nameMap[emp.employeeMasterId] = `${emp.firstName} ${emp.lastName}`;
        });
        setEmployeeMap(nameMap);
      }

      const allActionItems = actionItemsAssignedByMeRes.data || [];
      
      console.log(" Action Items Assigned By Manager:", allActionItems);

      const overdueCount = allActionItems.filter((ai) => {
        const dueDate = new Date(ai.dueDate);
        return ai.status === "Pending" && dueDate < new Date();
      }).length;

      setStats({
        teamMomsCount: myMomsRes.data?.length || 0,
        oneOnOnesCount:
          meetingsRes.data?.filter((m) => m.meetingType === "One-on-One")
            .length || 0,
        overdueActionsCount: overdueCount,
        totalMeetingsCount: meetingsRes.data?.length || 0,
      });

      // Set action items
      setActionItems(allActionItems);

      const meetingsWithRsvp = await Promise.all(
        (meetingsRes.data || []).map(async (meeting) => {
          try {
            const rsvpSummaryResponse = await rsvpService.getMeetingRsvpSummary(
              meeting.meetingId
            );
            const rsvpSummary = rsvpSummaryResponse.data;
            return {
              ...meeting,
              rsvpAcceptedCount: rsvpSummary?.acceptedCount || 0,
              rsvpTotalInvitations: rsvpSummary?.totalInvitations || 0,
              rsvpParticipants: rsvpSummary?.participants || [],
            };
          } catch (error) {
            console.error(
              `Failed to get RSVP summary for meeting ${meeting.meetingId}`,
              error
            );
            return {
              ...meeting,
              rsvpAcceptedCount: 0,
              rsvpTotalInvitations: 0,
              rsvpParticipants: [],
            };
          }
        })
      );

      setUpcomingMeetings(meetingsWithRsvp);
      setRecentTeamMoms(myMomsRes.data?.slice(0, 5) || []);
    } catch (err) {
      toastr.error("Failed to load Manager MOM dashboard");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  const openMeetingDetails = (meeting) => {
    setSelectedMeeting(meeting);
  };


  const closeMeetingDetails = () => {
    setSelectedMeeting(null);
  };


  const formatDateTime = (isoString) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
  };

  const formatDate = (isoString) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isOverdue = (dueDate, status) => {
    return status === "Pending" && new Date(dueDate) < new Date();
  };

  const getFilteredActionItems = () => {
    return actionItems.filter((item) => {
      if (actionItemFilter === "all") return true;
      if (actionItemFilter === "pending") return item.status === "Pending";
      if (actionItemFilter === "completed") return item.status === "Completed";
      if (actionItemFilter === "overdue") return isOverdue(item.dueDate, item.status);
      return true;
    });
  };


  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div
          className="spinner-border text-primary"
          role="status"
          style={{ width: "3rem", height: "3rem" }}
        >
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }


  return (
    <div
      className="container-fluid px-4 py-4"
      style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}
    >
      {/* Statistics Cards */}
      <div className="row g-3 mb-4">
        <StatCard
          icon="bi-file-text"
          bgColor="#e3f2fd"
          iconColor="#1976d2"
          count={stats.teamMomsCount}
          label="Team MOMs"
          sublabel="This Month"
        />
        <StatCard
          icon="bi-person-circle"
          bgColor="#e8f5e9"
          iconColor="#388e3c"
          count={stats.oneOnOnesCount}
          label="1-on-1s"
          sublabel="This Month"
        />
        <StatCard
          icon="bi-exclamation-triangle"
          bgColor="#fff3e0"
          iconColor="#f57c00"
          count={stats.overdueActionsCount}
          label="Overdue Actions"
          sublabel="Needs Attention"
        />
        <StatCard
          icon="bi-calendar-check"
          bgColor="#f3e5f5"
          iconColor="#7b1fa2"
          count={stats.totalMeetingsCount}
          label="Total Meetings"
          sublabel="All Time"
        />
      </div>


    
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-3">
       
        <div className="btn-group" role="group">
          <button
            type="button"
            className={`btn ${
              showTableView ? "btn-primary" : "btn-outline-primary"
            }`}
            onClick={() => setShowTableView(true)}
            style={{ fontWeight: "500" }}
          >
            <i className="bi bi-table me-1"></i>
            Table View
          </button>
          <button
            type="button"
            className={`btn ${
              !showTableView ? "btn-primary" : "btn-outline-primary"
            }`}
            onClick={() => setShowTableView(false)}
            style={{ fontWeight: "500" }}
          >
            <i className="bi bi-grid-3x3-gap me-1"></i>
            Card View
          </button>
        </div>


        {/* Right: Refresh and Schedule Meeting Buttons */}
        <div className="d-flex gap-2">
         
          
          <button
            className="btn d-flex align-items-center gap-2 px-3 py-2"
            onClick={() => navigate("/manager/dashboard/meetmom/schedule")}
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
            <i className="bi bi-calendar-plus"></i>
            Schedule Meeting
          </button>
        </div>
      </div>


      {/* Upcoming Meetings */}
      <div className="card shadow-sm mb-4" style={{ border: '1px solid #27235c', borderRadius: '12px' }}>
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h5
              className="card-title fw-semibold mb-0"
              style={{ color: "#1e293b" }}
            >
              Upcoming Meetings
            </h5>
            <span className="badge bg-primary rounded-pill">
              {upcomingMeetings.length} Meetings
            </span>
          </div>


          {showTableView ? (
            <div className="table-responsive" style={{ borderRadius: '8px', overflow: 'hidden' }}>
              <table className="table align-middle" style={{ marginBottom: 0 }}>
                <thead>
                  <tr style={{ backgroundColor: "#27235c" }}>
                    <th
                      className="fw-semibold text-uppercase"
                      style={{
                        color: "#ffffff",
                        padding: "16px 12px",
                        backgroundColor: "#27235c",
                        borderBottom: "none",
                        fontSize: "0.75rem",
                        letterSpacing: "0.5px"
                      }}
                    >
                      MEETING TITLE
                    </th>
                    <th
                      className="fw-semibold text-uppercase"
                      style={{
                        color: "#ffffff",
                        padding: "16px 12px",
                        backgroundColor: "#27235c",
                        borderBottom: "none",
                        fontSize: "0.75rem",
                        letterSpacing: "0.5px"
                      }}
                    >
                      DATE & TIME
                    </th>
                    <th
                      className="fw-semibold text-uppercase"
                      style={{
                        color: "#ffffff",
                        padding: "16px 12px",
                        backgroundColor: "#27235c",
                        borderBottom: "none",
                        fontSize: "0.75rem",
                        letterSpacing: "0.5px"
                      }}
                    >
                      TYPE
                    </th>
                    <th
                      className="fw-semibold text-uppercase"
                      style={{
                        color: "#ffffff",
                        padding: "16px 12px",
                        backgroundColor: "#27235c",
                        borderBottom: "none",
                        fontSize: "0.75rem",
                        letterSpacing: "0.5px"
                      }}
                    >
                      ATTENDANCE
                    </th>
                    <th
                      className="fw-semibold text-uppercase"
                      style={{
                        color: "#ffffff",
                        padding: "16px 12px",
                        backgroundColor: "#27235c",
                        borderBottom: "none",
                        fontSize: "0.75rem",
                        letterSpacing: "0.5px"
                      }}
                    >
                      STATUS
                    </th>
                    <th
                      className="fw-semibold text-uppercase"
                      style={{
                        color: "#ffffff",
                        padding: "16px 12px",
                        backgroundColor: "#27235c",
                        borderBottom: "none",
                        fontSize: "0.75rem",
                        letterSpacing: "0.5px"
                      }}
                    >
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingMeetings.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-5 text-muted">
                        <i
                          className="bi bi-calendar-x"
                          style={{ fontSize: "2rem" }}
                        ></i>
                        <p className="mt-2 mb-0">No upcoming meetings</p>
                      </td>
                    </tr>
                  ) : (
                    upcomingMeetings.map((meeting) => (
                      <tr
                        key={meeting.meetingId}
                        style={{
                          cursor: "pointer",
                          transition: "background-color 0.2s"
                        }}
                        onClick={() => openMeetingDetails(meeting)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#f8f9fa";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <td style={{ padding: "12px" }}>
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center"
                              style={{
                                width: "36px",
                                height: "36px",
                                backgroundColor: "#e3f2fd",
                              }}
                            >
                              <i
                                className="bi bi-calendar-event"
                                style={{ color: "#1976d2" }}
                              ></i>
                            </div>
                            <span className="fw-semibold">
                              {meeting.meetingTitle}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <span className="text-muted">
                            <i className="bi bi-clock me-1"></i>
                            {formatDateTime(meeting.meetingDate)}
                          </span>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <span className="badge bg-light text-dark border">
                            {meeting.meetingType || "General"}
                          </span>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="progress"
                              style={{ width: "60px", height: "6px" }}
                            >
                              <div
                                className="progress-bar bg-success"
                                role="progressbar"
                                style={{
                                  width: `${
                                    meeting.rsvpTotalInvitations > 0
                                      ? (meeting.rsvpAcceptedCount /
                                          meeting.rsvpTotalInvitations) *
                                        100
                                      : 0
                                  }%`,
                                }}
                              ></div>
                            </div>
                            <small className="text-muted">
                              {meeting.rsvpAcceptedCount}/
                              {meeting.rsvpTotalInvitations}
                            </small>
                          </div>
                        </td>
                        <td style={{ padding: "12px" }}>
                          {meeting.rsvpAcceptedCount ===
                            meeting.rsvpTotalInvitations &&
                          meeting.rsvpTotalInvitations > 0 ? (
                            <span className="badge bg-success">
                              All Accepted
                            </span>
                          ) : meeting.rsvpAcceptedCount > 0 ? (
                            <span className="badge bg-warning text-dark">
                              Pending
                            </span>
                          ) : (
                            <span className="badge bg-secondary">
                              No Response
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "12px" }}>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              openMeetingDetails(meeting);
                            }}
                          >
                            <i className="bi bi-eye me-1"></i>
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="row g-3">
              {upcomingMeetings.length === 0 ? (
                <div className="col-12 text-center py-5 text-muted">
                  <i
                    className="bi bi-calendar-x"
                    style={{ fontSize: "2rem" }}
                  ></i>
                  <p className="mt-2 mb-0">No upcoming meetings</p>
                </div>
              ) : (
                upcomingMeetings.map((meeting) => (
                  <div key={meeting.meetingId} className="col-lg-4 col-md-6">
                    <div
                      className="card h-100 shadow-sm"
                      style={{
                        cursor: "pointer",
                        transition: "transform 0.2s",
                        border: '1px solid #27235c',
                      }}
                      onClick={() => openMeetingDetails(meeting)}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.transform = "translateY(-4px)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.transform = "translateY(0)")
                      }
                    >
                      <div className="card-body">
                        <div className="d-flex align-items-start justify-content-between mb-3">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center"
                            style={{
                              width: "48px",
                              height: "48px",
                              backgroundColor: "#e3f2fd",
                              flexShrink: 0,
                            }}
                          >
                            <i
                              className="bi bi-calendar-event fs-5"
                              style={{ color: "#1976d2" }}
                            ></i>
                          </div>
                          <span className="badge bg-light text-dark border">
                            {meeting.meetingType || "General"}
                          </span>
                        </div>
                        <h6 className="card-title fw-semibold mb-2">
                          {meeting.meetingTitle}
                        </h6>
                        <p className="text-muted small mb-3">
                          <i className="bi bi-clock me-1"></i>
                          {formatDateTime(meeting.meetingDate)}
                        </p>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <small className="text-muted">Attendance</small>
                            <div className="fw-semibold">
                              {meeting.rsvpAcceptedCount}/
                              {meeting.rsvpTotalInvitations}
                            </div>
                          </div>
                          <div
                            className="progress"
                            style={{ width: "80px", height: "8px" }}
                          >
                            <div
                              className="progress-bar bg-success"
                              role="progressbar"
                              style={{
                                width: `${
                                  meeting.rsvpTotalInvitations > 0
                                    ? (meeting.rsvpAcceptedCount /
                                        meeting.rsvpTotalInvitations) *
                                      100
                                    : 0
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>



      {/*  Modal Component */}
      {selectedMeeting && (
        <ManagerMeetingDetailsModal 
          meeting={selectedMeeting}
          onClose={closeMeetingDetails}
        />
      )}
    </div>
  );
};

const StatCard = ({ icon, bgColor, iconColor, count, label, sublabel }) => (
  <div className="col-lg-3 col-md-6">
    <div
      className="card shadow-sm h-100"   
      style={{
        border: "1px solid #27235c",    
        borderRadius: "0.5rem"         
      }}
    >
      <div className="card-body d-flex align-items-center p-4">
        <div
          className="rounded-circle d-flex align-items-center justify-content-center me-3"
          style={{
            width: "56px",
            height: "56px",
            backgroundColor: bgColor,
          }}
        >
          <i className={`${icon} fs-4`} style={{ color: iconColor }}></i>
        </div>
        <div>
          <h3
            className="fw-bold mb-0"
            style={{ fontSize: "1.75rem", color: "#1e293b" }}
          >
            {count}
          </h3>
          <p
            className="mb-0 fw-semibold"
            style={{ fontSize: "0.875rem", color: "#64748b" }}
          >
            {label}
          </p>
          <p className="mb-0 text-muted" style={{ fontSize: "0.75rem" }}>
            {sublabel}
          </p>
        </div>
      </div>
    </div>
  </div>
);


export default ManagerMomDashboard;
