import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import momService from "../../services/meeting/momService";
import meetingService from "../../services/meeting/meetingService";
import rsvpService from "../../services/meeting/rsvpService";
import employeeService from "../../services/meeting/employeeservice";
import toastr from "toastr";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import ManagerMeetingDetailsModal from "../../components/meeting/modals/ManagerMeetingDetailsModal";
import PaginationFooter from "../../components/project-management/common/PaginationFooter";
import ManagerSharedMomsModal from "../../components/meeting/modals/ManagerSharedMomsModal";
import "../../styles/mom/components/ManagerMomDashboard.css";

const ManagerMomDashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    teamMomsCount: 0,
    oneOnOnesCount: 0,
    overdueActionsCount: 0,
    totalMeetingsCount: 0,
  });

  const [showSharedMoms, setShowSharedMoms] = useState(false);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [recentTeamMoms, setRecentTeamMoms] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [employeeMap, setEmployeeMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState("table");
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [actionItemFilter, setActionItemFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Helper to get property with PascalCase/camelCase fallback
  const getProperty = (obj, camelKey, pascalKey) => {
    return obj?.[camelKey] ?? obj?.[pascalKey] ?? null;
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage, viewMode]);

  const loadDashboardData = async (silentRefresh = false) => {
    try {
      if (!silentRefresh) setLoading(true);
      else setRefreshing(true);

      const [myMomsRes, meetingsRes, employeesRes, actionItemsAssignedByMeRes] =
        await Promise.all([
          momService.getMyMoms({ pageNumber: 1, pageSize: 100 }),
          meetingService.getMyMeetings(),
          employeeService.getAllEmployees(),
          momService.getActionItemsAssignedByMe(),
        ]);

      // Extract employee data
      const employeeData = employeesRes?.data || employeesRes?.Data || [];
      const employeeSuccess = employeesRes?.success || employeesRes?.Success;

      if (employeeSuccess && Array.isArray(employeeData)) {
        const nameMap = {};
        employeeData.forEach((emp) => {
          const empId =
            getProperty(emp, "employeeMasterId", "EmployeeMasterId") ||
            getProperty(emp, "employeeId", "EmployeeId");
          const firstName = getProperty(emp, "firstName", "FirstName") || "";
          const lastName = getProperty(emp, "lastName", "LastName") || "";
          if (empId) {
            nameMap[empId] = `${firstName} ${lastName}`.trim();
          }
        });
        setEmployeeMap(nameMap);
      }

      // Extract action items
      const allActionItems =
        actionItemsAssignedByMeRes?.data ||
        actionItemsAssignedByMeRes?.Data ||
        [];

      const overdueCount = Array.isArray(allActionItems)
        ? allActionItems.filter((ai) => {
            const dueDate = getProperty(ai, "dueDate", "DueDate");
            const status = getProperty(ai, "status", "Status");
            const isOverdue = getProperty(ai, "isOverdue", "IsOverdue");

            if (isOverdue) return true;
            if (status === "Pending" && dueDate) {
              return new Date(dueDate) < new Date();
            }
            return false;
          }).length
        : 0;

let meetings = [];

if (Array.isArray(meetingsRes?.data)) {
  meetings = meetingsRes.data;
} else if (Array.isArray(meetingsRes?.Data)) {
  meetings = meetingsRes.Data;
} else if (Array.isArray(meetingsRes?.data?.meetings)) {
  meetings = meetingsRes.data.meetings;
} else if (Array.isArray(meetingsRes?.data?.Meetings)) {
  meetings = meetingsRes.data.Meetings;
} else if (Array.isArray(meetingsRes?.Data?.meetings)) {
  meetings = meetingsRes.Data.meetings;
} else if (Array.isArray(meetingsRes?.Data?.Meetings)) {
  meetings = meetingsRes.Data.Meetings;
}

console.log("ALL MEETINGS FROM API:", meetings);


      const totalMeetingsCount =
        meetingsRes?.data?.totalCount ||
        meetingsRes?.data?.TotalCount ||
        meetingsRes?.Data?.totalCount ||
        meetingsRes?.Data?.TotalCount ||
        meetings.length;

      // Extract MOMs data
      const momsData =
        myMomsRes?.data?.data ||
        myMomsRes?.data?.Data ||
        myMomsRes?.Data?.Data ||
        myMomsRes?.data ||
        myMomsRes?.Data ||
        [];

      const momsArray = Array.isArray(momsData) ? momsData : [];

      // Count One-on-One meetings
      const oneOnOnesCount = meetings.filter((m) => {
        const meetingType = getProperty(m, "meetingType", "MeetingType");
        return meetingType === "One-on-One";
      }).length;

      setStats({
        teamMomsCount: momsArray.length,
        oneOnOnesCount: oneOnOnesCount,
        overdueActionsCount: overdueCount,
        totalMeetingsCount: totalMeetingsCount,
      });

      setActionItems(allActionItems);

      // Fetch RSVP data for each meeting
      const meetingsWithRsvp = await Promise.all(
        meetings.map(async (meeting) => {
          try {
            const meetingId = getProperty(meeting, "meetingId", "MeetingId");
            const rsvpSummaryResponse = await rsvpService.getMeetingRsvpSummary(
              meetingId
            );

            const rsvpData =
              rsvpSummaryResponse?.data ||
              rsvpSummaryResponse?.Data ||
              rsvpSummaryResponse;

            return {
              ...meeting,
              rsvpAcceptedCount:
                getProperty(rsvpData, "acceptedCount", "AcceptedCount") || 0,
              rsvpTotalInvitations:
                getProperty(rsvpData, "totalInvitations", "TotalInvitations") ||
                0,
              rsvpParticipants:
                getProperty(rsvpData, "participants", "Participants") || [],
            };
          } catch (error) {
            const meetingId = getProperty(meeting, "meetingId", "MeetingId");
            console.error(
              `Failed to get RSVP summary for meeting ${meetingId}`,
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
      setRecentTeamMoms(momsArray.slice(0, 5));
    } catch (err) {
      console.error("Dashboard load error:", err);

      // Enhanced error handling
      if (err.retryAfter) {
        if (!silentRefresh) {
          toastr.error(
            `Rate limit exceeded. Please wait ${err.retryAfter} seconds.`
          );
        }
      } else if (err.message) {
        toastr.error(`Failed to load dashboard: ${err.message}`);
      } else {
        toastr.error("Failed to load Manager MOM dashboard");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const openMeetingDetails = (meeting) => setSelectedMeeting(meeting);
  const closeMeetingDetails = () => setSelectedMeeting(null);

  const formatDateTime = (isoString) => {
    if (!isoString) return "−";
    try {
      const date = new Date(isoString);
      const dd = String(date.getDate()).padStart(2, "0");
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const yyyy = date.getFullYear();
      const hh = String(date.getHours()).padStart(2, "0");
      const min = String(date.getMinutes()).padStart(2, "0");
      return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
    } catch {
      return "−";
    }
  };

  const safeTotal = upcomingMeetings.length;
  const perPage = itemsPerPage;
  const totalPages = Math.max(1, Math.ceil(safeTotal / perPage));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = safeTotal === 0 ? 0 : (validCurrentPage - 1) * perPage;
  const endIndex =
    safeTotal === 0 ? 0 : Math.min(validCurrentPage * perPage, safeTotal);

  const paginatedMeetings = upcomingMeetings.slice(startIndex, endIndex);

  const getProgressWidthClass = (accepted, total) => {
    if (!total || total <= 0) return "mm-bar-w-0";
    const pct = Math.round((accepted / total) * 100);
    const safe = Math.max(0, Math.min(100, pct));
    return `mm-bar-w-${safe}`;
  };

  if (loading) {
    return (
      <div className="managermom-loading">
        <div
          className="spinner-border text-primary managermom-loading-spinner"
          role="status"
        >
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="managermom-loading-text">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="managermom-page">
      <div className="row justify-content-center">
        <div className="col-lg-10 col-xl-9">
          <nav
            aria-label="breadcrumb"
            className="sched-breadcrumb-nav-dashboard"
          >
            <ol className="breadcrumb mb-0 d-flex align-items-center sched-breadcrumb">
              <li className="breadcrumb-item d-flex align-items-center">
                <button
                  type="button"
                  onClick={() => navigate("/manager/dashboard")}
                  className="sched-breadcrumb-link"
                  aria-label="Dashboard"
                >
                  <Home size={18} />
                </button>
              </li>

              <li className="breadcrumb-separator">/</li>

              <li className="breadcrumb-item active" aria-current="page">
                <span className="sched-breadcrumb-active">
                  Meetings and MoM
                </span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="managermom-container">
        {/* Stats Cards */}
        <div className="row g-3 mb-4">
          <StatCard
            icon="bi-file-text"
            variant="moms"
            count={stats.teamMomsCount}
            label="Team MoMs"
          />
          <StatCard
            icon="bi-person-lines-fill"
            variant="oneonone"
            count={stats.oneOnOnesCount}
            label="1:1 Meetings"
          />
          <StatCard
            icon="bi-exclamation-triangle"
            variant="overdue"
            count={stats.overdueActionsCount}
            label="Overdue Action Items"
          />
          <StatCard
            icon="bi-people"
            variant="meetings"
            count={stats.totalMeetingsCount}
            label="Total Meetings"
          />
        </div>

        {/* Refresh indicator */}
        {refreshing && (
          <div className="alert alert-info py-2 mb-3">
            <small>
              <i className="bi bi-arrow-clockwise me-2"></i>
              Refreshing data...
            </small>
          </div>
        )}

        {/* Toolbar */}
        <div className="managermom-toolbar">
          <div
            className="managermom-view-switch"
            role="group"
            aria-label="View switcher"
          >
            <button
              type="button"
              className={`mmview-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => {
                setViewMode("table");
                setCurrentPage(1);
              }}
              title="Table View"
              aria-pressed={viewMode === "table"}
            >
              <i className="bi bi-table"></i>
            </button>

            <button
              type="button"
              className={`mmview-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => {
                setViewMode("grid");
                setCurrentPage(1);
              }}
              title="Grid View"
              aria-pressed={viewMode === "grid"}
            >
              <i className="bi bi-grid-3x3-gap-fill"></i>
            </button>
          </div>

  <div className="managermom-toolbar-right d-flex gap-2">
  <button
    className="btn managermom-shared-btn"
    onClick={() => setShowSharedMoms(true)}>
      
    <i className="bi bi-share-fill me-1"></i>
    Shared MOMs
  </button>

  <button
    className="btn managermom-schedule-btn"
    onClick={() => navigate("/manager/dashboard/meetmom/schedule")}
  >
    <i className="bi bi-calendar-plus"></i>
    Schedule Meeting
  </button>
</div>

        </div>

        {/* Upcoming Meetings Header */}
        <div className="managermom-upcoming-header">
          <h5 className="managermom-upcoming-title">Upcoming Meetings</h5>
          <span className="badge managermom-upcoming-count">
            {upcomingMeetings.length} Meetings
          </span>
        </div>

        {/* Table View */}
        {viewMode === "table" ? (
          <div className="managermom-table-shell">
            <div className="table-responsive">
              <table className="table align-middle managermom-table">
                <thead>
                  <tr>
                    <th>Meeting Title</th>
                    <th>Date &amp; Time</th>
                    <th>Type</th>
                    <th>Attendance</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedMeetings.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="managermom-empty-cell">
                        <i className="bi bi-calendar-x managermom-empty-icon"></i>
                        <p className="managermom-empty-text">
                          No upcoming meetings
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedMeetings.map((meeting) => {
                      const meetingId = getProperty(
                        meeting,
                        "meetingId",
                        "MeetingId"
                      );
                      const meetingTitle = getProperty(
                        meeting,
                        "meetingTitle",
                        "MeetingTitle"
                      );
                      const meetingDate = getProperty(
                        meeting,
                        "meetingDate",
                        "MeetingDate"
                      );
                      const meetingType = getProperty(
                        meeting,
                        "meetingType",
                        "MeetingType"
                      );

                      const widthClass = getProgressWidthClass(
                        meeting.rsvpAcceptedCount,
                        meeting.rsvpTotalInvitations
                      );

                      return (
                        <tr
                          key={meetingId}
                          className="managermom-table-row"
                          onClick={() => openMeetingDetails(meeting)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) =>
                            e.key === "Enter" && openMeetingDetails(meeting)
                          }
                        >
                          <td>
                            <div className="managermom-meeting-title-cell">
                              <span className="fw-semibold">
                                {meetingTitle || "Untitled Meeting"}
                              </span>
                            </div>
                          </td>

                          <td>
                            <span className="text-muted">
                              {formatDateTime(meetingDate)}
                            </span>
                          </td>

                          <td>
                            <span className="badge managermom-type-badge">
                              {meetingType || "General"}
                            </span>
                          </td>

                          <td>
                            <div className="managermom-attendance">
                              <div className="progress managermom-progress">
                                <div
                                  className={`progress-bar bg-success ${widthClass}`}
                                  role="progressbar"
                                  aria-valuenow={meeting.rsvpAcceptedCount}
                                  aria-valuemin="0"
                                  aria-valuemax={meeting.rsvpTotalInvitations}
                                ></div>
                              </div>
                              <small className="text-muted">
                                {meeting.rsvpAcceptedCount}/
                                {meeting.rsvpTotalInvitations}
                              </small>
                            </div>
                          </td>

                          <td>
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

                          <td>
                            <button
                              className="btn btn-sm managermom-view-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                openMeetingDetails(meeting);
                              }}
                              aria-label={`View ${meetingTitle}`}
                            >
                              <i className="bi bi-eye me-1"></i>
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

           {safeTotal > 0 && (
  <div className="managermom-pf-wrap">
    <PaginationFooter
      totalItems={safeTotal}
      currentPage={validCurrentPage}
      setCurrentPage={setCurrentPage}
      itemsPerPage={itemsPerPage}
      setItemsPerPage={(size) => {
        setItemsPerPage(size);
        setCurrentPage(1);
      }}
    />
  </div>
)}

          </div>
        ) : (
          /* Grid View */
          <>
            <div className="row g-3 mb-4">
              {paginatedMeetings.length === 0 ? (
                <div className="col-12 managermom-empty-card-wrapper">
                  <i className="bi bi-calendar-x managermom-empty-icon"></i>
                  <p className="managermom-empty-text">No upcoming meetings</p>
                </div>
              ) : (
                paginatedMeetings.map((meeting) => {
                  const meetingId = getProperty(
                    meeting,
                    "meetingId",
                    "MeetingId"
                  );
                  const meetingTitle = getProperty(
                    meeting,
                    "meetingTitle",
                    "MeetingTitle"
                  );
                  const meetingDate = getProperty(
                    meeting,
                    "meetingDate",
                    "MeetingDate"
                  );
                  const meetingType = getProperty(
                    meeting,
                    "meetingType",
                    "MeetingType"
                  );

                  const widthClass = getProgressWidthClass(
                    meeting.rsvpAcceptedCount,
                    meeting.rsvpTotalInvitations
                  );

                  return (
                    <div key={meetingId} className="col-lg-4 col-md-6">
                      <div
                        className="h-100 managermom-meeting-card"
                        onClick={() => openMeetingDetails(meeting)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) =>
                          e.key === "Enter" && openMeetingDetails(meeting)
                        }
                      >
                        <div className="card-body">
                          <div className="managermom-meeting-card-header">
                            <div className="managermom-card-avatar">
                              <i className="bi bi-calendar-event managermom-card-avatar-icon"></i>
                            </div>
                            <span className="badge managermom-type-badge">
                              {meetingType || "General"}
                            </span>
                          </div>

                          <h6 className="card-title fw-semibold mb-2">
                            {meetingTitle || "Untitled Meeting"}
                          </h6>

                          <p className="text-muted small mb-3">
                            <i className="bi bi-clock me-1"></i>
                            {formatDateTime(meetingDate)}
                          </p>

                          <div className="managermom-meeting-card-footer">
                            <div>
                              <small className="text-muted">Attendance</small>
                              <div className="fw-semibold">
                                {meeting.rsvpAcceptedCount}/
                                {meeting.rsvpTotalInvitations}
                              </div>
                            </div>

                            <div className="progress managermom-card-progress">
                              <div
                                className={`progress-bar bg-success ${widthClass}`}
                                role="progressbar"
                                aria-valuenow={meeting.rsvpAcceptedCount}
                                aria-valuemin="0"
                                aria-valuemax={meeting.rsvpTotalInvitations}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

           {safeTotal > 0 && viewMode === "grid" && (
  <div className="managermom-pf-wrap">
    <PaginationFooter
      totalItems={safeTotal}
      currentPage={validCurrentPage}
      setCurrentPage={setCurrentPage}
      itemsPerPage={itemsPerPage}
      setItemsPerPage={(size) => {
        setItemsPerPage(size);
        setCurrentPage(1);
      }}
    />
  </div>
)}

          </>
        )}

        {selectedMeeting && (
          <ManagerMeetingDetailsModal
            meeting={selectedMeeting}
            onClose={closeMeetingDetails}
          />
        )}
        
{showSharedMoms && (
<ManagerSharedMomsModal onClose={() => setShowSharedMoms(false)} />
)}
      </div>
    </div>
  );
};

const StatCard = ({ icon, variant, count, label }) => (
  <div className="col-lg-3 col-md-6 col-sm-6">
    <div className="managermom-stat-card">
      <div className="managermom-stat-inner">
        <div className={`managermom-stat-icon managermom-stat-icon-${variant}`}>
          <i className={`${icon} managermom-stat-icon-glyph`}></i>
        </div>
        <div className="managermom-stat-center">
          <div className="managermom-stat-count">{count}</div>
          <div className="managermom-stat-label">{label}</div>
        </div>
      </div>
    </div>
  </div>
);

export default ManagerMomDashboard;
