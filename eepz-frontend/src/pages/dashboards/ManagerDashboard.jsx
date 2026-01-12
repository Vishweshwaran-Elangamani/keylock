import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Tooltip, Legend, ResponsiveContainer, XAxis, YAxis } from "recharts";
import CountUp from "react-countup";
import { Users, Target, Shield, TrendingUp, Calendar, AlertTriangle } from "lucide-react";
import goalService from "../../services/goals/goalService";
import lndService from "../../services/lnd/lndService";
import { getTeamMembers, getMyNominations } from "../../services/performancemanagement/manager/managernominationapi";
import meetingService from "../../services/meeting/meetingService";
import slaService from "../../services/sla/slaService";
import Breadcrumb from "../../components/common/Breadcrumb";
import { toast } from "sonner";
import "../../styles/auth/ManagerDashboard.css";

const formatStatusLabel = (raw) => {
  if (!raw) return "";
  const lower = String(raw).toLowerCase().replace(/_/g, " ");
  return lower.replace(/\b\w/g, (c) => c.toUpperCase());
};

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [goalType, setGoalType] = useState("team");
  const [dashboardData, setDashboardData] = useState({
    dashboardSummary: null,
    allGoals: [],
    pendingApprovals: [],
    myProjects: [],
    managerNominations: [],
    teamMembers: [],
    teamAssignments: [],
    subordinateEmployees: [],
    myMeetings: [],
    oneOnOneReports: [],
    managerEscalations: []
  });

  useEffect(() => { fetchAllData(); }, []);

  const getUserData = () => {
    try { return JSON.parse(localStorage.getItem("user")); }
    catch { return null; }
  };

  const extractData = (response) => {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    const data = response.data || response;
    const paths = [data?.data?.items, data?.data?.$values, data?.data, data?.items, data?.$values, data];
    return paths.find(p => Array.isArray(p)) || [];
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const user = getUserData();
      if (!user) {
        toast.error("User not found. Please login again.");
        navigate("/login");
        return;
      }

      const managerId = user.empMasterId || user.employeeMasterId || user.id;

      const [
        dashboardSummaryRes, allGoalsRes, myProjectsRes, pendingApprovalsRes,
        managerNominationsRes, teamMembersRes, teamAssignmentsRes,
        subordinateEmployeesRes, myMeetingsRes, oneOnOneReportsRes, managerEscalationsRes
      ] = await Promise.all([
        goalService.getDashboardSummary().catch(() => ({ data: null })),
        goalService.queryGoals({ pageSize: 1000, status: "" }).catch(() => ({ data: [] })),
        goalService.getUserProjects().catch(() => ({ data: [] })),
        goalService.getPendingApprovals().catch(() => ({ data: [] })),
        getMyNominations(managerId).catch(() => ({ data: [] })),
        getTeamMembers(managerId).catch(() => ({ data: [] })),
        lndService.getTeamAssignments(1).catch(() => ({ data: { data: { items: [] } } })),
        lndService.getSubordinateEmployees(1).catch(() => ({ data: { data: { items: [] } } })),
        meetingService.getMyMeetings().catch(() => ({ data: [] })),
        meetingService.getOneOnOneReports().catch(() => ({ data: [] })),
        slaService.getManagerEscalations(managerId).catch(() => ({ data: [] }))
      ]);

      const allGoalsExtracted = extractData(allGoalsRes);

      const extractedSelfGoals = allGoalsExtracted.filter((g) => {
        const title = (g.title || "").toLowerCase();
        const type = (g.goalType || g.type || "").toLowerCase();
        return title.includes("self") || title.includes("personal") || type === "self";
      });

      const extractedTeamGoals = allGoalsExtracted.filter((g) => {
        const title = (g.title || "").toLowerCase();
        const type = (g.goalType || g.type || "").toLowerCase();
        return (title.includes("team") || type === "team") && !title.includes("self") && !title.includes("personal");
      });

      const extractedOrgGoals = allGoalsExtracted.filter((g) => {
        const title = (g.title || "").toLowerCase();
        const type = (g.goalType || g.type || "").toLowerCase();
        return title.includes("org") || type === "org" || type === "organization";
      });

      const extractedProjects = extractData(myProjectsRes);
      const extractedPendingApprovals = extractData(pendingApprovalsRes);
      const extractedManagerNominations = extractData(managerNominationsRes);
      const extractedTeamMembers = extractData(teamMembersRes);
      const extractedTeamAssignments = teamAssignmentsRes?.data?.data?.items?.$values || teamAssignmentsRes?.data?.data?.items || extractData(teamAssignmentsRes);
      const extractedSubordinateEmployees = subordinateEmployeesRes?.data?.data?.items?.$values || subordinateEmployeesRes?.data?.data?.items || extractData(subordinateEmployeesRes);
      const extractedMeetings = extractData(myMeetingsRes);
      const extractedOneOnOneReports = extractData(oneOnOneReportsRes);
      const extractedManagerEscalations = extractData(managerEscalationsRes);

      const allGoalsCombined = [
        ...extractedSelfGoals.map((g) => ({ ...g, goalType: "self" })),
        ...extractedTeamGoals.map((g) => ({ ...g, goalType: "team" })),
        ...extractedOrgGoals.map((g) => ({ ...g, goalType: "org" }))
      ];

      let summaryData = null;
      if (dashboardSummaryRes) {
        summaryData = dashboardSummaryRes.data ? dashboardSummaryRes.data : dashboardSummaryRes;
      }

      setDashboardData({
        dashboardSummary: summaryData,
        allGoals: allGoalsCombined,
        pendingApprovals: extractedPendingApprovals,
        myProjects: extractedProjects,
        managerNominations: extractedManagerNominations,
        teamMembers: extractedTeamMembers,
        teamAssignments: extractedTeamAssignments,
        subordinateEmployees: extractedSubordinateEmployees,
        myMeetings: extractedMeetings,
        oneOnOneReports: extractedOneOnOneReports,
        managerEscalations: extractedManagerEscalations
      });
    } catch (err) {
      console.error("Error in fetchAllData:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getKPIStats = () => {
    const totalTeamMembers = dashboardData.subordinateEmployees.length || dashboardData.teamMembers.length;
    const pendingApprovals = dashboardData.pendingApprovals.length;
    const totalNominations = dashboardData.managerNominations.length;
    const ongoingGoalsCount = dashboardData.allGoals.filter((g) => {
      const status = (g.status || g.goalStatus || "").toLowerCase();
      return status === "inprogress" || status === "pending" || status === "approved" || status === "open";
    }).length;
    const myProjectsCount = dashboardData.myProjects.length;
    const teamAssignmentsCount = dashboardData.teamAssignments.length;
    const pendingEscalations = dashboardData.managerEscalations.filter((e) => e.escalationStatus?.toLowerCase() === "pending").length;
    const upcomingMeetings = dashboardData.myMeetings.filter((m) => {
      const meetingDate = new Date(m.meetingDate || m.date);
      return meetingDate > new Date();
    }).length;

    return {
      totalTeamMembers, pendingApprovals, totalNominations, ongoingGoalsCount,
      myProjectsCount, teamAssignmentsCount, pendingEscalations, upcomingMeetings,
      totalEscalations: dashboardData.managerEscalations.length,
      totalMeetings: dashboardData.myMeetings.length
    };
  };

  const getGoalsByType = () => {
    const goals = dashboardData.allGoals.filter((g) => {
      const goalTypeLower = (g.goalType || g.type || "").toLowerCase();
      if (goalType === "self") return goalTypeLower === "self" || goalTypeLower === "personal";
      if (goalType === "team") return goalTypeLower === "team";
      if (goalType === "org") return goalTypeLower === "org" || goalTypeLower === "organization";
      return false;
    });

    if (!goals || goals.length === 0) {
      return { total: 0, completed: 0, inProgress: 0, overdue: 0, chartData: [] };
    }

    const now = new Date();
    const completed = goals.filter((g) => g.status?.toLowerCase() === "completed" || g.goalStatus?.toLowerCase() === "completed").length;
    const inProgress = goals.filter((g) => g.status?.toLowerCase() === "inprogress" || g.goalStatus?.toLowerCase() === "inprogress").length;
    const pending = goals.filter((g) => {
      const status = (g.status || g.goalStatus || "").toLowerCase();
      return status === "pending" || status === "open" || status === "approved";
    }).length;

    const chartData = [
      completed > 0 && { name: "Completed", value: completed, fill: "#7077a1" },
      inProgress > 0 && { name: "In Progress", value: inProgress, fill: "#b9b4c7" },
      pending > 0 && { name: "Pending", value: pending, fill: "#9891af" }
    ].filter(Boolean);

    return { total: goals.length, completed, inProgress, pending, chartData };
  };

  const getTeamAssignmentStatus = () => {
    const CHART_COLORS_LOCAL = ["#7077a1", "#b9b4c7", "#9891af", "#5d6389", "#a39bb5"];
    const statusCount = {};
    dashboardData.teamAssignments.forEach((assignment) => {
      const rawStatus = assignment.assignmentStatus || assignment.status || "Unknown";
      const key = formatStatusLabel(rawStatus);
      statusCount[key] = (statusCount[key] || 0) + 1;
    });
    return Object.entries(statusCount)
      .map(([name, value], index) => ({ name, value, fill: CHART_COLORS_LOCAL[index % CHART_COLORS_LOCAL.length] }))
      .filter((item) => item.value > 0);
  };

  const getEscalationHistory = () => {
    const escalations = dashboardData.managerEscalations;
    const ESCALATION_COLORS = {
      "Pending": "#f59e0b", "Resolved": "#7077a1",
      "Rejected": "#662222", "In Progress": "#b9b4c7"
    };
    const statusCount = {};
    escalations.forEach((esc) => {
      const rawStatus = esc.escalationStatus || "Unknown";
      const key = formatStatusLabel(rawStatus);
      statusCount[key] = (statusCount[key] || 0) + 1;
    });
    const chartData = Object.entries(statusCount).map(([name, value]) => ({
      name, value, fill: ESCALATION_COLORS[name] || "#6b7280"
    }));

    return {
      total: escalations.length,
      pending: escalations.filter((e) => e.escalationStatus?.toLowerCase() === "pending").length,
      resolved: escalations.filter((e) => e.escalationStatus?.toLowerCase() === "resolved").length,
      rejected: escalations.filter((e) => e.escalationStatus?.toLowerCase() === "rejected").length,
      chartData: chartData.filter((item) => item.value > 0)
    };
  };

  const getNominationOverview = () => {
    const nominations = dashboardData.managerNominations;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const total = nominations.length;

    const thisMonth = nominations.filter((nom) => {
      const dateFields = [nom.createdDate, nom.submittedDate, nom.nominationDate, nom.createdAt, nom.submittedAt];
      for (const df of dateFields) {
        if (df) {
          const d = new Date(df);
          if (!isNaN(d.getTime())) {
            return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
          }
        }
      }
      return false;
    }).length;

    const pending = nominations.filter((nom) => {
      const status = (nom.status || nom.nominationStatus || nom.currentStatus || "").toLowerCase();
      return status.includes("pending") || status === "submitted" || status === "open";
    }).length;

    const statusCount = {};
    nominations.forEach((nom) => {
      const rawStatus = nom.status || nom.nominationStatus || nom.currentStatus || "Unknown";
      const key = formatStatusLabel(rawStatus);
      statusCount[key] = (statusCount[key] || 0) + 1;
    });

    const chartData = Object.entries(statusCount).map(([name, value]) => ({
      name, value,
      fill: name.toLowerCase().includes("pending") ? "#f59e0b" :
            name.toLowerCase().includes("approved") ? "#7077a1" :
            name.toLowerCase().includes("reject") ? "#662222" : "#b9b4c7"
    }));

    return { total, thisMonth, pending, chartData: chartData.filter((item) => item.value > 0) };
  };

  const getMeetingScheduleData = () => {
    const meetings = dashboardData.myMeetings;
    const monthlyData = {};
    meetings.forEach((meeting) => {
      const date = new Date(meeting.meetingDate || meeting.date || meeting.createdDate);
      if (!isNaN(date.getTime())) {
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        monthlyData[key] = (monthlyData[key] || 0) + 1;
      }
    });
    const chartData = Object.entries(monthlyData).sort((a, b) => a[0].localeCompare(b[0])).slice(-6)
      .map(([month, count]) => ({ month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" }), count }));
    return { total: meetings.length, thisMonth: Object.values(monthlyData).slice(-1)[0] || 0, chartData };
  };

  const getMeetingOverview = () => {
    const now = new Date();
    const total = dashboardData.myMeetings.length;
    const upcoming = dashboardData.myMeetings.filter((m) => new Date(m.meetingDate || m.date) >= now).length;
    const completed = total - upcoming;
    return { total, upcoming, completed };
  };

  if (loading) return (
    <div className="ada-loading-container">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );

  const kpiStats = getKPIStats();
  const goalsData = getGoalsByType();
  const teamAssignmentStatus = getTeamAssignmentStatus();
  const escalationHistory = getEscalationHistory();
  const nominationOverview = getNominationOverview();
  const meetingScheduleData = getMeetingScheduleData();
  const meetingOverview = getMeetingOverview();

  const kpiCards = [
    { icon: Users, value: kpiStats.totalTeamMembers, label: "Team Members", subtitle: "Your team size", iconClass: "admin-purple" },
    { icon: Target, value: kpiStats.ongoingGoalsCount, label: "Ongoing Goals", subtitle: `${kpiStats.myProjectsCount} projects`, iconClass: "admin-blue", showTrend: true },
    { icon: Shield, value: kpiStats.totalNominations, label: "My Nominations", subtitle: `${nominationOverview.thisMonth} this month`, iconClass: "admin-pink" },
    { icon: Calendar, value: kpiStats.totalMeetings, label: "Meetings", subtitle: `${kpiStats.upcomingMeetings} upcoming`, iconClass: "admin-green" },
    { icon: AlertTriangle, value: kpiStats.totalEscalations, label: "Escalations", subtitle: `${kpiStats.pendingEscalations} pending`, iconClass: "admin-cyan" }
  ];

  const StatCard = ({ bg, border, value, label, color }) => (
    <div className="emp-stat-card" style={{ background: bg, border: `2px solid ${border}` }}>
      <div className="emp-stat-value" style={{ color }}>{value}</div>
      <div className="emp-stat-label" style={{ color }}>{label}</div>
    </div>
  );

  return (
    <div className="hr-dashboard-container">
      <Breadcrumb items={[{ label: "Manager Dashboard" }]} />

      <div className="admin-kpi-grid">
        {kpiCards.map(({ icon: IconComponent, value, label, subtitle, iconClass, showTrend }, i) => (
          <div key={i} className="admin-kpi-card">
            <div className={`admin-kpi-icon ${iconClass}`}>
              <IconComponent size={28} />
            </div>
            <div className="admin-kpi-content">
              <h2><CountUp end={value} duration={2} /></h2>
              <p>{label}</p>
              <span className="admin-kpi-subtitle">
                {showTrend && <TrendingUp size={12} />} {subtitle}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-cards-container">
        {/* FIRST ROW - 3 CARDS */}
        <div className="dashboard-row">
          <div className="dashboard-card card-medium">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-bullseye"></i>
                <h3>Goals Overview</h3>
              </div>
              <div className="mgr-btn-group">
                <button onClick={() => setGoalType("self")} className={goalType === "self" ? "mgr-active" : ""}>Self</button>
                <button onClick={() => setGoalType("team")} className={goalType === "team" ? "mgr-active" : ""}>Team</button>
                <button onClick={() => setGoalType("org")} className={goalType === "org" ? "mgr-active" : ""}>Org</button>
              </div>
            </div>
            <div className="card-body">
              {goalsData.total > 0 ? (
                <>
                  <div className="emp-stats-grid">
                    <StatCard bg="#f0eff5" border="#b9b4c7" value={goalsData.total} label="Total" color="#7077a1" />
                    <StatCard bg="#4e5473" border="#7077a1" value={goalsData.completed} label="Completed" color="#ffffff" />
                    <StatCard bg="#e8e7ef" border="#b9b4c7" value={goalsData.inProgress} label="In Progress" color="#7077a1" />
                  </div>
                  {goalsData.chartData.length > 0 && (
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie data={goalsData.chartData} cx="50%" cy="45%" outerRadius={80} dataKey="value" label={false}>
                          {goalsData.chartData.map((entry, i) => <Cell key={`cell-${i}`} fill={entry.fill} />)}
                        </Pie>
                        <Tooltip />
                        <Legend layout="horizontal" align="center" verticalAlign="bottom" wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                          formatter={(value, entry) => {
                            const item = goalsData.chartData.find(d => d.name === entry.value);
                            return `${item?.name || value}: ${item?.value || 0}`;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </>
              ) : (
                <div className="no-data-message">No goals overview data</div>
              )}
            </div>
          </div>

          <div className="dashboard-card card-medium">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-award"></i>
                <h3> Nominations</h3>
              </div>
            </div>
            <div className="card-body">
              {nominationOverview.total > 0 ? (
                <>
                  <div className="emp-stats-grid">
                    <StatCard bg="#f0eff5" border="#b9b4c7" value={nominationOverview.total} label="Total" color="#7077a1" />
                    <StatCard bg="#4e5473" border="#7077a1" value={nominationOverview.thisMonth} label="This Month" color="#ffffff" />
                    <StatCard bg="#fef3c7" border="#fbbf24" value={nominationOverview.pending} label="Pending" color="#d97706" />
                  </div>
                  {nominationOverview.chartData.length > 0 && (
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie data={nominationOverview.chartData} cx="50%" cy="45%" outerRadius={80} dataKey="value" label={false}>
                          {nominationOverview.chartData.map((entry, i) => <Cell key={`cell-${i}`} fill={entry.fill} />)}
                        </Pie>
                        <Tooltip />
                        <Legend layout="horizontal" align="center" verticalAlign="bottom" wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                          formatter={(value, entry) => {
                            const item = nominationOverview.chartData.find(d => d.name === entry.value);
                            return `${item?.name || value}: ${item?.value || 0}`;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </>
              ) : (
                <div className="no-data-message">No nominations yet</div>
              )}
            </div>
          </div>

          <div className="dashboard-card card-medium">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-calendar-check"></i>
                <h3>Meetings Scheduled</h3>
              </div>
            </div>
            <div className="card-body">
              {meetingOverview.total > 0 ? (
                <>
                  <div className="emp-stats-grid">
                    <StatCard bg="#f0eff5" border="#b9b4c7" value={meetingOverview.total} label="Total" color="#7077a1" />
                    <StatCard bg="#4e5473" border="#7077a1" value={meetingOverview.upcoming} label="Upcoming" color="#ffffff" />
                    <StatCard bg="#e8e7ef" border="#b9b4c7" value={meetingOverview.completed} label="Completed" color="#7077a1" />
                  </div>
                  {meetingScheduleData.chartData.length > 0 && (
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart data={meetingScheduleData.chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                        <XAxis dataKey="month" stroke="#9ca3af" fontSize={10} />
                        <YAxis stroke="#9ca3af" fontSize={11} />
                        <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "12px" }} />
                        <Line type="monotone" dataKey="count" stroke="#7077a1" strokeWidth={2} dot={{ fill: "#7077a1", r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </>
              ) : (
                <div className="no-data-message">No meetings data</div>
              )}
            </div>
          </div>
        </div>

        {/* SECOND ROW - 2 CARDS AUTO-ADJUST */}
        <div className="dashboard-row dashboard-row-2">
          <div className="dashboard-card">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-people-fill"></i>
                <h3>Team L&D Assignments</h3>
              </div>
            </div>
            <div className="card-body">
              {teamAssignmentStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={teamAssignmentStatus} cx="50%" cy="45%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" label={false}>
                      {teamAssignmentStatus.map((entry, i) => <Cell key={`cell-${i}`} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip />
                    <Legend layout="horizontal" align="center" verticalAlign="bottom" wrapperStyle={{ fontSize: "12px", paddingTop: "15px" }}
                      formatter={(value, entry) => {
                        const item = teamAssignmentStatus.find(d => d.name === entry.value);
                        return `${item?.name || value}: ${item?.value || 0}`;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-data-message">No team assignment data</div>
              )}
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-exclamation-triangle-fill"></i>
                <h3>Escalation History</h3>
              </div>
            </div>
            <div className="card-body">
              {escalationHistory.total > 0 ? (
                <>
                  <div className="emp-stats-grid">
                    <StatCard bg="#f0eff5" border="#b9b4c7" value={escalationHistory.total} label="Total" color="#7077a1" />
                    <StatCard bg="#fef3c7" border="#fbbf24" value={escalationHistory.pending} label="Pending" color="#d97706" />
                    <StatCard bg="#4e5473" border="#7077a1" value={escalationHistory.resolved} label="Resolved" color="#ffffff" />
                  </div>
                  {escalationHistory.chartData.length > 0 && (
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie data={escalationHistory.chartData} cx="50%" cy="45%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value" label={false}>
                          {escalationHistory.chartData.map((entry, i) => <Cell key={`cell-${i}`} fill={entry.fill} />)}
                        </Pie>
                        <Tooltip />
                        <Legend layout="horizontal" align="center" verticalAlign="bottom" wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                          formatter={(value, entry) => {
                            const item = escalationHistory.chartData.find(d => d.name === entry.value);
                            return `${item?.name || value}: ${item?.value || 0}`;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </>
              ) : (
                <div className="no-data-message">No escalation data</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
