import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Tooltip, Legend, ResponsiveContainer, XAxis, YAxis } from "recharts";
import CountUp from "react-countup";
import { Users, Target, Shield, TrendingUp, Calendar, AlertTriangle, Briefcase, Award, ChevronDown, ChevronUp } from "lucide-react";
import goalService from "../../services/goals/goalService";
import lndService from "../../services/lnd/lndService";
import { getTeamMembers, getMyNominations } from "../../services/performancemanagement/manager/managernominationapi";
import meetingService from "../../services/meeting/meetingService";
import rsvpService from "../../services/meeting/rsvpService";
import slaService from "../../services/sla/slaService";
import internalOpportunityService from "../../services/internal/internalOpportunityService";
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
  const [showAllNominations, setShowAllNominations] = useState(false);
  const [showAllOpportunities, setShowAllOpportunities] = useState(false);
  const [showAllGoals, setShowAllGoals] = useState(false);
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
    managerEscalations: [],
    opportunities: []
  });


  const BLUE_COLORS = ["#1E40AF", "#3B82F6", "#60A5FA", "#93C5FD", "#DBEAFE", "#2563EB"];


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
        dashboardSummaryRes,
        allGoalsRes,
        myProjectsRes,
        pendingApprovalsRes,
        managerNominationsRes,
        teamMembersRes,
        teamAssignmentsRes,
        subordinateEmployeesRes,
        myMeetingsRes,
        managerEscalationsRes,
        opportunitiesRes
      ] = await Promise.all([
        goalService.getDashboardSummary().catch(() => ({ data: null })),
        goalService.queryGoals({ pageSize: 1000, status: "" }).catch(() => ({ data: [] })),
        goalService.getUserProjects().catch(() => ({ data: [] })),
        goalService.getPendingApprovals().catch(() => ({ data: [] })),
        getMyNominations(managerId).catch(() => ({ data: [] })),
        getTeamMembers(managerId).catch(() => ({ data: [] })),
        lndService.getTeamAssignments(1).catch(() => ({ data: { data: { items: [] } } })),
        lndService.getSubordinateEmployees(1).catch(() => ({ data: { data: { items: [] } } })),
        meetingService.getMyMeetings().catch(() => ({ data: { meetings: [] } })),
        slaService.getManagerEscalations(managerId).catch(() => ({ data: [] })),
        internalOpportunityService.getActiveOpportunities().catch(() => ({ data: [] }))
      ]);


      const allGoalsExtracted = extractData(allGoalsRes);


      const extractedSelfGoals = allGoalsExtracted.filter(g => {
        const title = (g.title || "").toLowerCase();
        const type = (g.goalType || g.type || "").toLowerCase();
        return title.includes("self") || title.includes("personal") || type === "self";
      });


      const extractedTeamGoals = allGoalsExtracted.filter(g => {
        const title = (g.title || "").toLowerCase();
        const type = (g.goalType || g.type || "").toLowerCase();
        return (title.includes("team") || type === "team") && !title.includes("self") && !title.includes("personal");
      });


      const extractedOrgGoals = allGoalsExtracted.filter(g => {
        const title = (g.title || "").toLowerCase();
        const type = (g.goalType || g.type || "").toLowerCase();
        return title.includes("org") || type === "org" || type === "organization";
      });


      const allGoalsCombined = [
        ...extractedSelfGoals.map(g => ({ ...g, goalType: "self" })),
        ...extractedTeamGoals.map(g => ({ ...g, goalType: "team" })),
        ...extractedOrgGoals.map(g => ({ ...g, goalType: "org" }))
      ];


      const allMeetings = myMeetingsRes?.data?.meetings || [];


      const oneOnOneReports = allMeetings.filter(m => {
        const title = (m.title || m.meetingTitle || m.subject || "").toLowerCase();
        const type = (m.meetingType || m.type || "").toLowerCase();
        const description = (m.description || "").toLowerCase();
        return title.includes("one-on-one") || title.includes("1-on-1") || title.includes("1:1") || 
               title.includes("one on one") || type === "one-on-one" || type === "1-on-1" || 
               type === "oneonone" || description.includes("one-on-one") || description.includes("1:1");
      });


      const opportunities = extractData(opportunitiesRes);


      setDashboardData({
        dashboardSummary: dashboardSummaryRes?.data || null,
        allGoals: allGoalsCombined,
        pendingApprovals: extractData(pendingApprovalsRes),
        myProjects: extractData(myProjectsRes),
        managerNominations: extractData(managerNominationsRes),
        teamMembers: extractData(teamMembersRes),
        teamAssignments: teamAssignmentsRes?.data?.data?.items?.$values || teamAssignmentsRes?.data?.data?.items || extractData(teamAssignmentsRes),
        subordinateEmployees: subordinateEmployeesRes?.data?.data?.items?.$values || subordinateEmployeesRes?.data?.data?.items || extractData(subordinateEmployeesRes),
        myMeetings: allMeetings,
        oneOnOneReports: oneOnOneReports,
        managerEscalations: extractData(managerEscalationsRes),
        opportunities
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
    const totalNominations = dashboardData.managerNominations.length;
    const ongoingGoalsCount = dashboardData.allGoals.filter(g => {
      const status = (g.status || g.goalStatus || "").toLowerCase();
      return status === "inprogress" || status === "pending" || status === "approved" || status === "open";
    }).length;


    const pendingEscalations = dashboardData.managerEscalations.filter(e => 
      (e.escalationStatus?.toLowerCase() || "") === "pending"
    ).length;


    const upcomingMeetings = dashboardData.myMeetings.filter(m => {
      const meetingDate = new Date(m.meetingDate || m.date);
      return meetingDate >= new Date();
    }).length;


    return {
      totalTeamMembers,
      totalNominations,
      ongoingGoalsCount,
      myProjectsCount: dashboardData.myProjects.length,
      pendingEscalations,
      upcomingMeetings,
      totalEscalations: dashboardData.managerEscalations.length,
      totalMeetings: dashboardData.myMeetings.length,
      totalOpportunities: dashboardData.opportunities.length
    };
  };


  const getGoalsByType = () => {
    const goals = dashboardData.allGoals.filter(g => {
      const goalTypeLower = (g.goalType || g.type || "").toLowerCase();
      if (goalType === "self") return goalTypeLower === "self" || goalTypeLower === "personal";
      if (goalType === "team") return goalTypeLower === "team";
      if (goalType === "org") return goalTypeLower === "org" || goalTypeLower === "organization";
      return false;
    });


    if (!goals || goals.length === 0) {
      return { 
        total: 0, 
        completed: 0, 
        inProgress: 0, 
        pending: 0, 
        chartData: [],
        goalList: []
      };
    }


    const completed = goals.filter(g => (g.status || g.goalStatus || "").toLowerCase() === "completed").length;
    const inProgress = goals.filter(g => (g.status || g.goalStatus || "").toLowerCase() === "inprogress").length;
    const pending = goals.filter(g => {
      const status = (g.status || g.goalStatus || "").toLowerCase();
      return status === "pending" || status === "open" || status === "approved";
    }).length;


    const chartData = [
      completed > 0 && { name: "Completed", value: completed, fill: BLUE_COLORS[0] },
      inProgress > 0 && { name: "In Progress", value: inProgress, fill: BLUE_COLORS[1] },
      pending > 0 && { name: "Pending", value: pending, fill: BLUE_COLORS[2] }
    ].filter(Boolean);

    const goalList = goals.map(g => ({
      name: g.goalName || g.name || g.title || "Unnamed Goal",
      type: g.goalType || "team",
      id: g.id || g.goalId
    }));


    return { 
      total: goals.length, 
      completed, 
      inProgress, 
      pending, 
      chartData,
      goalList
    };
  };


  const getOpportunitiesOverview = () => {
    const opportunities = dashboardData.opportunities;
    if (!opportunities?.length) return { total: 0, opportunityList: [], chartData: [] };


    const byOpportunity = {};
    opportunities.forEach(opp => {
      const name = opp.title || opp.opportunityName || opp.name || "Unnamed Opportunity";
      if (!byOpportunity[name]) {
        byOpportunity[name] = { name: name, count: 0, id: opp.id || opp.opportunityId };
      }
      byOpportunity[name].count += 1;
    });


    const opportunityList = Object.values(byOpportunity);
    const chartData = opportunityList.map((item, i) => ({
      name: item.name,
      value: item.count,
      fill: BLUE_COLORS[i % BLUE_COLORS.length]
    }));


    return { total: opportunities.length, opportunityList, chartData };
  };


  const getTeamAssignmentStatus = () => {
    const statusCount = {};
    dashboardData.teamAssignments.forEach(assignment => {
      const rawStatus = assignment.assignmentStatus || assignment.status || "Unknown";
      const key = formatStatusLabel(rawStatus);
      statusCount[key] = (statusCount[key] || 0) + 1;
    });


    return Object.entries(statusCount)
      .map(([name, value], index) => ({
        name,
        value,
        fill: BLUE_COLORS[index % BLUE_COLORS.length]
      }))
      .filter(item => item.value > 0);
  };


  const getEscalationHistory = () => {
    const ESCALATION_COLORS = {
      "Pending": BLUE_COLORS[2],
      "Resolved": BLUE_COLORS[0],
      "Rejected": BLUE_COLORS[1],
      "In Progress": BLUE_COLORS[1],
      "Inprogress": BLUE_COLORS[1],
      "InProgress": BLUE_COLORS[1]
    };


    const escalations = dashboardData.managerEscalations;
    const statusCount = {};
    escalations.forEach(esc => {
      const rawStatus = esc.escalationStatus || "Unknown";
      const key = formatStatusLabel(rawStatus);
      statusCount[key] = (statusCount[key] || 0) + 1;
    });


    const chartData = Object.entries(statusCount).map(([name, value]) => ({
      name,
      value,
      fill: ESCALATION_COLORS[name] || BLUE_COLORS[2]
    }));


    return {
      total: escalations.length,
      pending: escalations.filter(e => (e.escalationStatus?.toLowerCase() || "") === "pending").length,
      resolved: escalations.filter(e => (e.escalationStatus?.toLowerCase() || "") === "resolved").length,
      rejected: escalations.filter(e => (e.escalationStatus?.toLowerCase() || "") === "rejected").length,
      chartData: chartData.filter(item => item.value > 0)
    };
  };


  const getNominationOverview = () => {
    const nominations = dashboardData.managerNominations;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();


    const total = nominations.length;


    const thisMonth = nominations.filter(nom => {
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


    const pending = nominations.filter(nom => {
      const status = (nom.status || nom.nominationStatus || nom.currentStatus || "").toLowerCase();
      return status.includes("pending") || status === "submitted" || status === "open";
    }).length;


    const byRewardType = {};
    nominations.forEach(nom => {
      const rewardType = nom.rewardType || nom.rewardTypeName || nom.awardType || nom.opportunity?.rewardType || "Other";
      if (!byRewardType[rewardType]) {
        byRewardType[rewardType] = { name: rewardType, count: 0 };
      }
      byRewardType[rewardType].count += 1;
    });


    const rewardTypeList = Object.values(byRewardType);


    const statusCount = {};
    nominations.forEach(nom => {
      const rawStatus = nom.status || nom.nominationStatus || nom.currentStatus || "Unknown";
      const key = formatStatusLabel(rawStatus);
      statusCount[key] = (statusCount[key] || 0) + 1;
    });


    const chartData = Object.entries(statusCount).map(([name, value]) => ({
      name,
      value,
      fill: name.toLowerCase().includes("pending") ? BLUE_COLORS[2] : 
            name.toLowerCase().includes("approved") ? BLUE_COLORS[0] : 
            name.toLowerCase().includes("reject") ? BLUE_COLORS[1] : BLUE_COLORS[1]
    }));


    return {
      total,
      thisMonth,
      pending,
      chartData: chartData.filter(item => item.value > 0),
      rewardTypeList
    };
  };


  const getMeetingScheduleData = () => {
    const meetings = dashboardData.myMeetings;
    const monthlyData = {};


    meetings.forEach(meeting => {
      const date = new Date(meeting.meetingDate || meeting.date || meeting.createdDate);
      if (!isNaN(date.getTime())) {
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        monthlyData[key] = (monthlyData[key] || 0) + 1;
      }
    });


    const chartData = Object.entries(monthlyData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([month, count]) => ({
        month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        count
      }));


    return { total: meetings.length, chartData };
  };


  const getMeetingOverview = () => {
    const now = new Date();
    const total = dashboardData.myMeetings.length;
    const upcoming = dashboardData.myMeetings.filter(m => new Date(m.meetingDate || m.date) >= now).length;
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
  const opportunitiesData = getOpportunitiesOverview();
  const teamAssignmentStatus = getTeamAssignmentStatus();
  const escalationHistory = getEscalationHistory();
  const nominationOverview = getNominationOverview();
  const meetingScheduleData = getMeetingScheduleData();
  const meetingOverview = getMeetingOverview();


  const kpiCards = [
    { icon: Users, value: kpiStats.totalTeamMembers, label: "Team Members", trend: `${kpiStats.totalTeamMembers} total`, iconClass: "ada-stat-icon-primary" },
    { icon: Target, value: kpiStats.ongoingGoalsCount, label: "Ongoing Goals", trend: `${kpiStats.myProjectsCount} projects`, iconClass: "ada-stat-icon-info", up: true },
    { icon: Shield, value: kpiStats.totalNominations, label: "Nominations", trend: `${nominationOverview.thisMonth} this month`, iconClass: "ada-stat-icon-warning" },
    { icon: Briefcase, value: kpiStats.totalOpportunities, label: "Opportunities", trend: "Internal opportunities", iconClass: "ada-stat-icon-pink" },
    { icon: AlertTriangle, value: kpiStats.totalEscalations, label: "Escalations", trend: `${kpiStats.pendingEscalations} pending`, iconClass: "ada-stat-icon-purple" }
  ];


  // CALCULATE DISPLAYED ITEMS INLINE
  const displayedNominations = showAllNominations ? nominationOverview.rewardTypeList : nominationOverview.rewardTypeList.slice(0, 3);
  const displayedOpportunities = showAllOpportunities ? opportunitiesData.opportunityList : opportunitiesData.opportunityList.slice(0, 3);
  const displayedGoals = showAllGoals ? goalsData.goalList : goalsData.goalList.slice(0, 3);


  return (
    <div className="ada-dashboard">
      <Breadcrumb items={[{ label: "Manager Dashboard" }]} />


      <div className="ada-stats-grid">
        {kpiCards.map(({ icon: Icon, value, label, trend, iconClass, up }, i) => (
          <div key={i} className="ada-stat-card">
            <div className={iconClass}>
              <Icon size={28} />
            </div>
            <div className="ada-stat-content">
              <h2><CountUp end={value} duration={2} /></h2>
              <p>{label}</p>
              <span className="ada-stat-trend">
                {up !== undefined && up ? <TrendingUp size={12} className="ada-trend-icon-up" /> : null}
                {trend}
              </span>
            </div>
          </div>
        ))}
      </div>


      <div className="manager-cards-container">
        <div className="manager-row">
          {/* NOMINATIONS CARD - FIRST POSITION */}
          <div className="ada-chart-card ada-nominations-card">
            <div className="ada-card-header">
              <div className="ada-card-title">
                <i className="bi bi-award"></i> Nominations
              </div>
            </div>
            <div className="ada-card-body">
              {nominationOverview.total > 0 ? (
                <>
                  <div className="ada-perf-stats-grid">
                    <div className="ada-perf-stat-card">
                      <div className="ada-perf-stat-value">{nominationOverview.total}</div>
                      <div className="ada-perf-stat-label">Total</div>
                    </div>
                    <div className="ada-perf-stat-card ada-success">
                      <div className="ada-perf-stat-value">{nominationOverview.thisMonth}</div>
                      <div className="ada-perf-stat-label">This Month</div>
                    </div>
                    <div className="ada-perf-stat-card ada-warning">
                      <div className="ada-perf-stat-value">{nominationOverview.pending}</div>
                      <div className="ada-perf-stat-label">Pending</div>
                    </div>
                  </div>
                  {nominationOverview.chartData.length > 0 && (
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={nominationOverview.chartData} cx="50%" cy="45%" outerRadius={60} dataKey="value" label={false}>
                          {nominationOverview.chartData.map((entry, i) => <Cell key={`cell-${i}`} fill={entry.fill} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  {nominationOverview.rewardTypeList.length > 0 && (
                    <>
                      <div className="ada-nomination-list">
                        {displayedNominations.map((item, i) => (
                          <div key={i} className="ada-nomination-item">
                            <Award size={18} style={{ color: BLUE_COLORS[i % BLUE_COLORS.length], flexShrink: 0 }} />
                            <div className="ada-nomination-info">
                              <div className="ada-nomination-name">{item.name}</div>
                              <div className="ada-nomination-bar">
                                <div className="ada-nomination-fill" style={{ width: `${(item.count / nominationOverview.total) * 100}%`, backgroundColor: BLUE_COLORS[i % BLUE_COLORS.length] }} />
                              </div>
                            </div>
                            <span className="ada-nomination-count" style={{ color: BLUE_COLORS[i % BLUE_COLORS.length] }}>{item.count}</span>
                          </div>
                        ))}
                      </div>
                      {nominationOverview.rewardTypeList.length > 3 && (
                        <button 
                          className="ada-nomination-toggle-btn" 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowAllNominations(prev => !prev);
                          }}
                        >
                          {showAllNominations ? <><ChevronUp size={16} /> Show Less</> : <><ChevronDown size={16} /> View All Nominations</>}
                        </button>
                      )}
                    </>
                  )}
                </>
              ) : (
                <div className="ada-no-data">No nominations data</div>
              )}
            </div>
          </div>


          {/* GOALS OVERVIEW CARD - SECOND POSITION */}
          <div className="ada-chart-card ada-goals-card">
            <div className="ada-card-header">
              <div className="ada-card-title">
                <i className="bi bi-bullseye"></i> Goals Overview
              </div>
              <div className="ada-btn-group">
                <button onClick={() => { setGoalType("self"); setShowAllGoals(false); }} className={goalType === "self" ? "ada-active" : ""}>Self</button>
                <button onClick={() => { setGoalType("team"); setShowAllGoals(false); }} className={goalType === "team" ? "ada-active" : ""}>Team</button>
                <button onClick={() => { setGoalType("org"); setShowAllGoals(false); }} className={goalType === "org" ? "ada-active" : ""}>Org</button>
              </div>
            </div>
            <div className="ada-card-body">
              {goalsData.total > 0 ? (
                <>
                  <div className="ada-perf-stats-grid">
                    <div className="ada-perf-stat-card">
                      <div className="ada-perf-stat-value">{goalsData.total}</div>
                      <div className="ada-perf-stat-label">Total</div>
                    </div>
                    <div className="ada-perf-stat-card ada-success">
                      <div className="ada-perf-stat-value">{goalsData.completed}</div>
                      <div className="ada-perf-stat-label">Completed</div>
                    </div>
                    <div className="ada-perf-stat-card ada-info">
                      <div className="ada-perf-stat-value">{goalsData.inProgress}</div>
                      <div className="ada-perf-stat-label">In Progress</div>
                    </div>
                  </div>
                  {goalsData.chartData.length > 0 && (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={goalsData.chartData} cx="50%" cy="45%" outerRadius={75} dataKey="value" label={false}>
                          {goalsData.chartData.map((entry, i) => <Cell key={`cell-${i}`} fill={entry.fill} />)}
                        </Pie>
                        <Tooltip />
                        <Legend layout="horizontal" align="center" verticalAlign="bottom" wrapperStyle={{ fontSize: "11px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  
                  {goalsData.goalList.length > 0 && (
                    <>
                      <div className="ada-goal-list">
                        {displayedGoals.map((goal, i) => (
                          <div key={i} className="ada-goal-item">
                            <Target size={18} className="ada-goal-icon" style={{ color: BLUE_COLORS[i % BLUE_COLORS.length] }} />
                            <div className="ada-goal-info">
                              <div className="ada-goal-name">{goal.name}</div>
                              <span className={`ada-goal-type ada-goal-type-${goal.type}`}>
                                {goal.type.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {goalsData.goalList.length > 3 && (
                        <button 
                          className="ada-goal-toggle-btn" 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowAllGoals(!showAllGoals);
                          }}
                        >
                          {showAllGoals ? <><ChevronUp size={16} /> Show Less</> : <><ChevronDown size={16} /> View All Goals</>}
                        </button>
                      )}
                    </>
                  )}
                </>
              ) : (
                <div className="ada-no-data">No goals data available</div>
              )}
            </div>
          </div>


          {/* OPPORTUNITIES CARD - THIRD POSITION */}
          <div className="ada-chart-card ada-opportunities-card">
            <div className="ada-card-header">
              <div className="ada-card-title">
                <i className="bi bi-briefcase"></i> Internal Opportunities
              </div>
            </div>
            <div className="ada-card-body">
              {opportunitiesData.total > 0 ? (
                <>
                  <div className="ada-perf-stats-grid ada-perf-stats-1col">
                    <div className="ada-perf-stat-card">
                      <div className="ada-perf-stat-value">{opportunitiesData.total}</div>
                      <div className="ada-perf-stat-label">Opportunities Awaiting</div>
                    </div>
                  </div>
                  {opportunitiesData.chartData.length > 0 && (
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={opportunitiesData.chartData} cx="50%" cy="50%" outerRadius={60} dataKey="value" label={false}>
                          {opportunitiesData.chartData.map((entry, i) => <Cell key={`cell-${i}`} fill={entry.fill} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  {opportunitiesData.opportunityList.length > 0 && (
                    <>
                      <div className="ada-opportunity-list">
                        {displayedOpportunities.map((item, i) => (
                          <div key={i} className="ada-opportunity-item">
                            <Briefcase size={18} style={{ color: BLUE_COLORS[i % BLUE_COLORS.length], flexShrink: 0 }} />
                            <div className="ada-opportunity-info">
                              <div className="ada-opportunity-name">{item.name}</div>
                              <div className="ada-opportunity-bar">
                                <div className="ada-opportunity-fill" style={{ width: `${(item.count / opportunitiesData.total) * 100}%`, backgroundColor: BLUE_COLORS[i % BLUE_COLORS.length] }} />
                              </div>
                            </div>
                            <span className="ada-opportunity-count" style={{ color: BLUE_COLORS[i % BLUE_COLORS.length] }}>{item.count}</span>
                          </div>
                        ))}
                      </div>
                      {opportunitiesData.opportunityList.length > 3 && (
                        <button 
                          className="ada-opportunity-toggle-btn" 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowAllOpportunities(prev => !prev);
                          }}
                        >
                          {showAllOpportunities ? <><ChevronUp size={16} /> Show Less</> : <><ChevronDown size={16} /> View All Opportunities</>}
                        </button>
                      )}
                    </>
                  )}
                </>
              ) : (
                <div className="ada-no-data">No opportunities available</div>
              )}
            </div>
          </div>
        </div>


        {/* ROW 2 */}
        <div className="manager-row">
          <div className="ada-chart-card">
            <div className="ada-card-header">
              <div className="ada-card-title"><i className="bi bi-people-fill"></i> Team L&D</div>
              <span className="ada-card-badge">Assignments</span>
            </div>
            <div className="ada-card-body">
              {teamAssignmentStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={teamAssignmentStatus} cx="50%" cy="45%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" label={false}>
                      {teamAssignmentStatus.map((entry, i) => <Cell key={`cell-${i}`} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip />
                    <Legend layout="horizontal" align="center" verticalAlign="bottom" wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="ada-no-data">No L&D assignments</div>
              )}
            </div>
          </div>


          <div className="ada-chart-card">
            <div className="ada-card-header">
              <div className="ada-card-title"><i className="bi bi-exclamation-triangle-fill"></i> Escalations</div>
            </div>
            <div className="ada-card-body">
              {escalationHistory.total > 0 ? (
                <>
                  <div className="ada-perf-stats-grid">
                    <div className="ada-perf-stat-card">
                      <div className="ada-perf-stat-value">{escalationHistory.total}</div>
                      <div className="ada-perf-stat-label">Total</div>
                    </div>
                    <div className="ada-perf-stat-card ada-warning">
                      <div className="ada-perf-stat-value">{escalationHistory.pending}</div>
                      <div className="ada-perf-stat-label">Pending</div>
                    </div>
                    <div className="ada-perf-stat-card ada-success">
                      <div className="ada-perf-stat-value">{escalationHistory.resolved}</div>
                      <div className="ada-perf-stat-label">Resolved</div>
                    </div>
                  </div>
                  {escalationHistory.chartData.length > 0 && (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={escalationHistory.chartData} cx="50%" cy="45%" innerRadius={50} outerRadius={70} dataKey="value" label={false}>
                          {escalationHistory.chartData.map((entry, i) => <Cell key={`cell-${i}`} fill={entry.fill} />)}
                        </Pie>
                        <Tooltip />
                        <Legend layout="horizontal" align="center" verticalAlign="bottom" wrapperStyle={{ fontSize: "11px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </>
              ) : (
                <div className="ada-no-data">No escalations</div>
              )}
            </div>
          </div>


          <div className="ada-chart-card">
            <div className="ada-card-header">
              <div className="ada-card-title"><i className="bi bi-calendar-check"></i> Meetings</div>
              <span className="ada-card-badge">Scheduled</span>
            </div>
            <div className="ada-card-body">
              {meetingOverview.total > 0 ? (
                <>
                  <div className="ada-perf-stats-grid">
                    <div className="ada-perf-stat-card">
                      <div className="ada-perf-stat-value">{meetingOverview.total}</div>
                      <div className="ada-perf-stat-label">Total</div>
                    </div>
                    <div className="ada-perf-stat-card ada-primary">
                      <div className="ada-perf-stat-value">{meetingOverview.upcoming}</div>
                      <div className="ada-perf-stat-label">Upcoming</div>
                    </div>
                    <div className="ada-perf-stat-card ada-success">
                      <div className="ada-perf-stat-value">{meetingOverview.completed}</div>
                      <div className="ada-perf-stat-label">Completed</div>
                    </div>
                  </div>
                  {meetingScheduleData.chartData.length > 0 && (
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={meetingScheduleData.chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                        <XAxis dataKey="month" stroke="#6c757d" fontSize={11} />
                        <YAxis stroke="#6c757d" fontSize={11} />
                        <Tooltip />
                        <Line type="monotone" dataKey="count" stroke={BLUE_COLORS[2]} strokeWidth={3} dot={{ fill: BLUE_COLORS[2], r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </>
              ) : (
                <div className="ada-no-data">No meetings scheduled</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default ManagerDashboard;
