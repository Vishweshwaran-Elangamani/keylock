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
    const initDashboard = async () => {
      const empMap = await loadAllEmployees();
      await loadDashboardData();
      await fetchMeetings(empMap);
    };
    initDashboard();
  }, []);

  useEffect(() => {
    if (location.state?.fromPage) {
      setEmpMomActive(location.state.fromPage);
      if (location.state.fromPage === "sharedMoms") {
        setShowSharedModal(true);
      }
    }
  }, [location.state]);

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
            emp.employeeMasterId ||
            emp.EmployeeMasterId ||
            emp.employeeId ||
            emp.EmployeeId ||
            emp.id ||
            emp.Id;

          const firstName = emp.firstName || emp.FirstName || "";
          const lastName = emp.lastName || emp.LastName || "";

          if (empId) {
            const fullName = `${firstName} ${lastName}`.trim();
            map[String(empId)] = fullName || `Employee ${empId}`;
          }
        });

        setEmployeeMap(map);
        return map;
      }
      return {};
    } catch (error) {
      console.error("Error loading employees:", error);
      return {};
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

      const myMomsData =
        myMomsRes?.Data?.Data ||
        myMomsRes?.data?.data ||
        myMomsRes?.data ||
        myMomsRes ||
        [];

      const actionItemsData =
        actionItemsRes?.data || actionItemsRes?.Data || [];
      const invitationsData =
        invitationsRes?.data || invitationsRes?.Data || [];
      const sharedData = sharedRes?.data || sharedRes?.Data || [];

      const pendingActions = actionItemsData.filter(
        (item) => getProperty(item, "status", "Status") === "Pending",
      );

      const pendingInvites = invitationsData.filter((inv) => {
        const rsvpStatus = getProperty(inv, "rsvpStatus", "RsvpStatus");
        return (
          rsvpStatus === 0 || rsvpStatus === "0" || rsvpStatus === "Pending"
        );
      });

      setStats({
        myMoms: Array.isArray(myMomsData) ? myMomsData.length : 0,
        pendingActionItems: pendingActions.length,
        meetingInvitations: pendingInvites.length,
        sharedMoms: Array.isArray(sharedData) ? sharedData.length : 0,
      });

      const activity = [];

      myMomsData.forEach((mom) => {
        const meetingTitle = getProperty(mom, "meetingTitle", "MeetingTitle");
        const date =
          getProperty(mom, "createdAt", "CreatedAt") ||
          getProperty(mom, "meetingDate", "MeetingDate");

       activity.push({
  type: "mom",
  title: `MOM created for ${meetingTitle || "Meeting"}`,

          date,
icon: "bi-check2-circle",
          color: "primary",
          meetingData: mom,
        });
      });

      const acceptedInvites = invitationsData.filter((inv) => {
        const rsvpStatus = getProperty(inv, "rsvpStatus", "RsvpStatus");

        return (
          rsvpStatus === 1 ||
          rsvpStatus === "1" ||
          rsvpStatus === true ||
          rsvpStatus === "Accepted"
        );
      });

      const momMeetingIds = new Set(
        myMomsData.map((m) => String(getProperty(m, "meetingId", "MeetingId"))),
      );

      acceptedInvites.forEach((inv) => {
        const meetingId = String(getProperty(inv, "meetingId", "MeetingId"));

        if (!momMeetingIds.has(meetingId)) {
          activity.push({
            type: "invitation",
            title:
              getProperty(inv, "meetingTitle", "MeetingTitle") ||
              "Accepted Meeting",
            date: getProperty(inv, "meetingDate", "MeetingDate"),
            icon: "bi-calendar-check",
            color: "success",
            meetingData: inv,
          });
        }
      });

      setRecentActivity(
        activity
          .filter((a) => a.date)
          .sort((a, b) => new Date(b.date) - new Date(a.date)),
      );
    } catch (error) {
      console.error("Dashboard data error:", error);
      toastr.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchMeetings = async (empMap = employeeMap) => {
    try {
      const res = await momService.getMyMoms({ pageNumber: 1, pageSize: 100 });
      const backendMeetings =
        res?.Data?.Data || 
        res?.data?.data ||
        res?.data ||
        res ||
        [];

      console.log("Processed MOMs:", backendMeetings);

      console.log("Processed MOMs:", backendMeetings);

      const processedMeetings = backendMeetings.map((mom) => {
        const actionItems = mom.ActionItems || mom.actionItems || [];
        const processedActionItems = actionItems.map((item) => {
          const assignedId =
            item.AssignedToEmployeeId || item.assignedToEmployeeId;
          const existingName =
            item.AssignedToEmployeeName || item.assignedToEmployeeName;
          const mappedName = empMap[String(assignedId)];
          const finalName =
            existingName || mappedName || `Employee ${assignedId}`;

          return {
            ...item,
            AssignedToEmployeeName: finalName,
            assignedToEmployeeName: finalName,
          };
        });

        return {
          ...mom,
          ActionItems: processedActionItems,
          actionItems: processedActionItems,
        };
      });

      setMeetings(processedMeetings);
    } catch (error) {
      console.error("Failed to load MOMs:", error);
      toastr.error("Failed to load MOM records");
    }
  };

 const handleMomCreated = (newMom) => {
  const meetingId =
    newMom.meetingId || newMom.MeetingId;

  setMeetings((prev) => {
    const exists = prev.some(
      (m) =>
        String(getProperty(m, "meetingId", "MeetingId")) ===
        String(meetingId)
    );

    if (exists) return prev;

    return [newMom, ...prev];
  });

  setStats((prev) => ({
    ...prev,
    myMoms: prev.myMoms + 1,
  }));

  setRecentActivity((prev) => {
    const filtered = prev.filter((item) => {
      const itemMeetingId =
        item.meetingData?.meetingId ||
        item.meetingData?.MeetingId;

      if (
        item.type === "invitation" &&
        String(itemMeetingId) === String(meetingId)
      ) {
        return false;
      }

      return true;
    });

    return [
      {
        type: "mom",
        title: `MOM created for ${
          newMom.MeetingTitle || newMom.meetingTitle || "Meeting"
        }`,
        date:
          newMom.CreatedAt ||
          newMom.createdAt ||
          newMom.MeetingDate ||
          newMom.meetingDate,
        icon: "bi-check2-circle",
        color: "primary",
        meetingData: newMom,
      },
      ...filtered,
    ];
  });
};


  const allMeetings = meetings;

  const openMeetingDetails = (meeting, hasMomAlready = false) =>
    setSelectedMeeting({ ...meeting, hasMomAlready });
  const closeMeetingDetails = () => setSelectedMeeting(null);

const handleActivityClick = (item) => {
  if (!item.meetingData) return;

  const hasMomAlready = item.type === "mom"; 
  openMeetingDetails(item.meetingData, hasMomAlready);
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
          <div className="emd-spinner" role="status"></div>
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
                  <div className="emd-activity-list emd-scroll-area">
                    {recentActivity.map((item, idx) => (
                      <ActivityItem
                        key={`${item.type}-${
                          item.meetingData?.meetingId ||
                          item.meetingData?.MeetingId ||
                          idx
                        }`}
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
                    My MOMs
                  </h5>
                  <span className="emd-count-badge">
                    {allMeetings.length} meetings
                  </span>
                </div>

                {allMeetings.length === 0 ? (
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
                    <div className="emd-meetings-list emd-scroll-area">
                      {allMeetings.map((m) => {
                        const meetingId = getProperty(
                          m,
                          "meetingId",
                          "MeetingId",
                        );
                        const meetingTitle = getProperty(
                          m,
                          "meetingTitle",
                          "MeetingTitle",
                        );
                        const meetingType = getProperty(
                          m,
                          "meetingType",
                          "MeetingType",
                        );
                        const meetingDate = getProperty(
                          m,
                          "meetingDate",
                          "MeetingDate",
                        );
                        const actionItems =
                          getProperty(m, "actionItems", "ActionItems") || [];
                        const isOptimistic = m.isOptimistic;

                        return (
                          <div
                            key={meetingId}
                            className={`emd-meeting-item ${isOptimistic ? "emd-meeting-optimistic" : ""}`}
                            onClick={() => openMeetingDetails(m, true)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) =>
                              e.key === "Enter" && openMeetingDetails(m)
                            }
                          >
                            <div className="emd-meeting-main">
                              <div className="emd-meeting-title-row">
                                <span className="emd-meeting-title">
                                  {meetingTitle || "Untitled MOM"}
                                  {isOptimistic && (
                                    <span
                                      className="emd-syncing-badge"
                                      title="Syncing with server..."
                                    >
                                      <i className="bi bi-arrow-repeat"></i>
                                    </span>
                                  )}
                                </span>
                                <span className="emd-meeting-type-pill">
                                  {meetingType || "General"}
                                </span>
                              </div>

                              <div className="emd-meeting-meta-row">
                                <span className="emd-meta-item">
                                  <i className="bi bi-calendar3"></i>
                                  {meetingDate
                                    ? new Date(meetingDate).toLocaleDateString()
                                    : "No date"}
                                </span>

                                {Array.isArray(actionItems) && (
                                  <span className="emd-meta-item">
                                    <i className="bi bi-check2-square"></i>
                                    {actionItems.length} actions
                                  </span>
                                )}

                                {m.commentsObservations && (
                                  <span className="emd-meta-item">
                                    <i className="bi bi-chat-left-text"></i>
                                    Notes Added
                                  </span>
                                )}
                              </div>
                            </div>

                            <i className="bi bi-chevron-right emd-meeting-arrow"></i>
                          </div>
                        );
                      })}
                    </div>

                    {allMeetings.length > 5 && (
                      <div className="emd-view-all">
                        <button
                          className="emd-view-all-btn"
                          onClick={() =>
                            navigate("/employee/dashboard/meetmom/my-moms")
                          }
                          type="button"
                        >
                          View All {allMeetings.length} Meetings
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
            onMomCreated={handleMomCreated}
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

const ActivityItem = ({ item, onClick }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "No date";
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString) => {
    if (!dateString) return "--:--";
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
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
        className={`emd-activity-icon-wrapper emd-activity-${item.color || "primary"}`}
      >
        <i className={`${item.icon} emd-activity-icon`} />
      </div>

      <div className="emd-activity-main">
<h6 className="emd-activity-title">
  {item.type === "mom" ? " " : " "}
  {item.title}
</h6>
        <div className="emd-activity-meta-row">
          <span>
            <i className="bi bi-calendar3"></i> {formatDate(item.date)}
          </span>
          <span>
            <i className="bi bi-clock"></i> {formatTime(item.date)}
          </span>
        </div>
      </div>

      <i className="bi bi-chevron-right emd-activity-arrow" />
    </div>
  );
};

export default EmployeeMomDashboard;
