import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import CountUp from "react-countup";
import {
  Target,
  BookOpen,
  Calendar,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import goalService from "../../services/goals/goalService";
import lndService from "../../services/lnd/lndService";
import rsvpService from "../../services/meeting/rsvpService";
import slaService from "../../services/sla/slaService";
import {
  getApprovedProfiles,
  getStatistics,
} from "../../services/performancemanagement/hr/hrnominationapi";

import Breadcrumb from "../../components/common/Breadcrumb";
import { toast } from "sonner";
import "../../styles/auth/AdminDashboard.css";
import "../../styles/common/Dashboard.css";

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    goals: [],
    lndAssignments: [],
    lndSkills: [],
    meetings: [],
    slas: [],
    performance: {
      myRecognitions: [],
      stats: null,
    },
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const getUserData = () => {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  // SIMPLIFIED & ROBUST extractData function
  const extractData = (response) => {
    console.log("🔍 extractData input:", response);
    
    if (!response) {
      console.log("⚠️ Response is null/undefined");
      return [];
    }
    
    if (Array.isArray(response)) {
      console.log(" Direct array response:", response.length);
      return response;
    }

    // Unwrap axios response
    const data = response.data || response;
    
    // Try all possible paths and return first valid array found
    const paths = [
      data?.data?.items,           // { data: { data: { items: [...] } } }
      data?.data?.$values,         // { data: { data: { $values: [...] } } }
      data?.data?.values,          // { data: { data: { values: [...] } } }
      data?.data,                  // { data: { data: [...] } }
      data?.items,                 // { data: { items: [...] } }
      data?.$values,               // { data: { $values: [...] } }
      data?.values,                // { data: { values: [...] } }
      data,                        // { data: [...] }
    ];

    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];
      if (Array.isArray(path) && path.length >= 0) {
        console.log(` Found data at path index ${i}:`, path.length, "items");
        return path;
      }
    }

    console.log("⚠️ No valid array found, returning empty array");
    return [];
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

      const empId = user.empMasterId || user.employeeMasterId || user.id;

      const [
        selfGoalsRes,
        orgGoalsRes,
        teamGoalsRes,
        myLndAssignmentsRes,
        myLndSkillsRes,
        myMeetingsRes,
        mySlasRes,
        approvedProfilesRes,
        statsRes,
      ] = await Promise.all([
        goalService
          .queryGoals({ type: "self", pageSize: 1000 })
          .catch((err) => {
            console.error("Error fetching self goals:", err);
            return { data: [] };
          }),
        goalService
          .queryGoals({ type: "org", pageSize: 1000 })
          .catch((err) => {
            console.error(" Error fetching org goals:", err);
            return { data: [] };
          }),
        goalService
          .queryGoals({ type: "team", pageSize: 1000 })
          .catch((err) => {
            console.error(" Error fetching team goals:", err);
            return { data: [] };
          }),
        lndService
          .getMyAssignments(1, "", "", "", "", 1000)
          .catch((err) => {
            console.error("Error fetching LnD assignments:", err);
            return { data: [] };
          }),
        lndService
          .getMySkills(1, "", "", "asc", 1000)
          .catch((err) => {
            console.error(" Error fetching LnD skills:", err);
            return { data: { items: [] } };
          }),
        rsvpService.getMyInvitations().catch((err) => {
          console.error("Error fetching meetings:", err);
          return [];
        }),
        slaService.getEmployeeSLAs(empId).catch((err) => {
          console.error("Error fetching SLAs:", err);
          return { data: [] };
        }),
        getApprovedProfiles().catch((err) => {
          console.error(" Error fetching approved profiles:", err);
          return { data: [] };
        }),
        getStatistics().catch((err) => {
          console.error(" Error fetching statistics:", err);
          return { data: null };
        }),
      ]);

      console.log("===========================================");
      console.log(" RAW API RESPONSES:");
      console.log("===========================================");
      console.log("Self Goals Response:", JSON.stringify(selfGoalsRes, null, 2));
      console.log("Org Goals Response:", JSON.stringify(orgGoalsRes, null, 2));
      console.log("Team Goals Response:", JSON.stringify(teamGoalsRes, null, 2));
      console.log("LnD Assignments Response:", JSON.stringify(myLndAssignmentsRes, null, 2));
      console.log("LnD Skills Response:", JSON.stringify(myLndSkillsRes, null, 2));
      console.log("Meetings Response:", JSON.stringify(myMeetingsRes, null, 2));
      console.log("SLAs Response:", JSON.stringify(mySlasRes, null, 2));
      console.log("===========================================");

      const selfGoals = extractData(selfGoalsRes);
      const orgGoals = extractData(orgGoalsRes);
      const teamGoals = extractData(teamGoalsRes);
      const lndAssignments = extractData(myLndAssignmentsRes);
      const lndSkills = extractData(myLndSkillsRes);
      const meetings = Array.isArray(myMeetingsRes)
        ? myMeetingsRes
        : extractData(myMeetingsRes);
      const slas = extractData(mySlasRes);

      console.log("===========================================");
      console.log(" EXTRACTED DATA COUNTS:");
      console.log("===========================================");
      console.log("Self Goals:", selfGoals.length);
      console.log("Org Goals:", orgGoals.length);
      console.log("Team Goals:", teamGoals.length);
      console.log("LnD Assignments:", lndAssignments.length);
      console.log(" LnD Skills:", lndSkills.length);
      console.log("Meetings:", meetings.length);
      console.log("SLAs:", slas.length);
      console.log("===========================================");

      // Combine all goals (self, org, team)
      const allGoals = [
        ...selfGoals.map((g) => ({ ...g, goalType: "self" })),
        ...orgGoals.map((g) => ({ ...g, goalType: "org" })),
        ...teamGoals.map((g) => ({ ...g, goalType: "team" })),
      ];

      const allApprovedProfiles = extractData(approvedProfilesRes);

      const myRecognitions = allApprovedProfiles.filter((p) => {
        const nomineeId =
          p.nominee?.employeeId ||
          p.employeeId ||
          p.employeeMasterId ||
          p.nomineeEmployeeId;
        return nomineeId == empId;
      });

      const stats = statsRes?.data || statsRes?.data?.data || null;

      console.log("===========================================");
      console.log("FINAL DASHBOARD STATE:");
      console.log("===========================================");
      console.log("All Goals:", allGoals.length);
      console.log("LnD Assignments:", lndAssignments.length);
      console.log("LnD Skills:", lndSkills.length);
      console.log("Meetings:", meetings.length);
      console.log("SLAs:", slas.length);
      console.log("My Recognitions:", myRecognitions.length);
      console.log("===========================================");

      setDashboardData({
        goals: allGoals,
        lndAssignments,
        lndSkills,
        meetings,
        slas,
        performance: {
          myRecognitions,
          stats,
        },
      });
    } catch (err) {
      console.error(" FATAL ERROR in fetchAllData:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const isOverdue = (deadline) => {
    if (!deadline) return false;
    if (!slaService || typeof slaService.isOverdue !== "function")
      return false;
    return slaService.isOverdue(deadline);
  };

  const getKPIStats = () => {
    const now = new Date();
    const totalGoals = dashboardData.goals.length;
    const totalLndAssignments = dashboardData.lndAssignments.length;
    const totalMeetings = dashboardData.meetings.length;
    const totalSlas = dashboardData.slas.length;

    const upcomingMeetings = dashboardData.meetings.filter((m) => {
      const d = new Date(m.meetingDate || m.date);
      return d >= now;
    }).length;

    const overdueSlas = dashboardData.slas.filter((s) =>
      isOverdue(s.deadline || s.dueDate)
    ).length;

    return {
      totalGoals,
      totalLndAssignments,
      totalMeetings,
      upcomingMeetings,
      totalSlas,
      overdueSlas,
    };
  };

  const getPerformanceOverview = () => {
    const { myRecognitions, stats } = dashboardData.performance;
    const totalRecognitions = myRecognitions.length;

    const byRewardType = {};
    myRecognitions.forEach((r) => {
      const type =
        r.opportunity?.rewardType ||
        r.rewardTypeName ||
        r.rewardType ||
        (r.rewardTypeId ? `Type ${r.rewardTypeId}` : "Other");
      byRewardType[type] = (byRewardType[type] || 0) + 1;
    });

    const REWARD_COLORS = [
      "#2c2c54",
      "#0F62FE",
      "#10b981",
      "#f59e0b",
      "#E01950",
      "#8b5cf6",
    ];

    const chartData = Object.entries(byRewardType).map(
      ([name, value], index) => ({
        name,
        value,
        fill: REWARD_COLORS[index % REWARD_COLORS.length],
      })
    );

    const orgTotalNoms =
      stats?.data?.totalNominations ||
      stats?.data?.total ||
      stats?.data?.count ||
      stats?.data?.approvedNominations ||
      stats?.totalNominations ||
      stats?.total ||
      stats?.count ||
      0;

    return {
      totalRecognitions,
      chartData,
      orgTotalNoms,
    };
  };

  const getGoalsOverview = () => {
    const goals = dashboardData.goals;

    console.log("getGoalsOverview - goals:", goals);
    console.log("getGoalsOverview - goals count:", goals?.length || 0);

    if (!goals || goals.length === 0) {
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
        chartData: [],
      };
    }

    const completed = goals.filter(
      (g) =>
        g.status?.toLowerCase() === "completed" ||
        g.goalStatus?.toLowerCase() === "completed"
    ).length;

    const inProgress = goals.filter(
      (g) =>
        g.status?.toLowerCase() === "inprogress" ||
        g.goalStatus?.toLowerCase() === "inprogress"
    ).length;

    const pending = goals.filter((g) => {
      const status = (g.status || g.goalStatus || "").toLowerCase();
      return (
        status === "pending" || status === "open" || status === "approved"
      );
    }).length;

    const chartData = [];
    if (completed > 0)
      chartData.push({ name: "Completed", value: completed, fill: "#10b981" });
    if (inProgress > 0)
      chartData.push({
        name: "In Progress",
        value: inProgress,
        fill: "#0F62FE",
      });
    if (pending > 0)
      chartData.push({ name: "Pending", value: pending, fill: "#f59e0b" });

    console.log("Goals Chart Data:", chartData);

    return {
      total: goals.length,
      completed,
      inProgress,
      pending,
      chartData,
    };
  };

  const getLndOverview = () => {
    const skills = dashboardData.lndSkills;

    console.log("getLndOverview - skills:", skills);
    console.log("getLndOverview - skills count:", skills?.length || 0);

    if (!skills || !skills.length) {
      return {
        total: 0,
        low: 0,
        medium: 0,
        high: 0,
        chartData: [],
      };
    }

    let low = 0;
    let medium = 0;
    let high = 0;

    skills.forEach((s) => {
      const rating =
        s.rating || s.proficiency || s.proficiencyLevel || s.score || 0;
      const r = Number(rating);
      
      console.log(`Skill: ${s.skillName}, Rating: ${rating}, Parsed: ${r}`);
      
      if (isNaN(r)) return;

      if (r <= 4) low += 1;
      else if (r <= 7) medium += 1;
      else high += 1;
    });

    console.log(`Skill Distribution - Low: ${low}, Medium: ${medium}, High: ${high}`);

    const chartData = [];
    if (low > 0)
      chartData.push({ name: "Level 1-4", value: low, fill: "#f97316" });
    if (medium > 0)
      chartData.push({ name: "Level 5-7", value: medium, fill: "#0F62FE" });
    if (high > 0)
      chartData.push({ name: "Level 8-10", value: high, fill: "#10b981" });

    console.log("LnD Chart Data:", chartData);

    return {
      total: skills.length,
      low,
      medium,
      high,
      chartData,
    };
  };

  const getMeetingsOverview = () => {
    const meetings = dashboardData.meetings;
    const now = new Date();

    console.log("getMeetingsOverview - meetings:", meetings);
    console.log("getMeetingsOverview - meetings count:", meetings?.length || 0);

    const upcoming = meetings.filter((m) => {
      const d = new Date(m.meetingDate || m.date);
      return d >= now;
    }).length;

    const completed = meetings.filter((m) => {
      const d = new Date(m.meetingDate || m.date);
      return d < now;
    }).length;

    const monthlyData = {};
    meetings.forEach((m) => {
      const date = new Date(m.meetingDate || m.date || m.createdDate);
      if (isNaN(date.getTime())) return;

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      monthlyData[key] = (monthlyData[key] || 0) + 1;
    });

    const chartData = Object.entries(monthlyData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([month, count]) => ({
        month: new Date(month + "-01").toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        count,
      }));

    console.log(" Meetings Chart Data:", chartData);

    return {
      total: meetings.length,
      upcoming,
      completed,
      chartData,
    };
  };

  const getSlaOverview = () => {
    const slas = dashboardData.slas;

    console.log(" getSlaOverview - slas:", slas);
    console.log("getSlaOverview - slas count:", slas?.length || 0);

    if (!slas || slas.length === 0) {
      return {
        total: 0,
        open: 0,
        overdue: 0,
        closed: 0,
        chartData: [],
      };
    }

    const closed = slas.filter(
      (s) => (s.status || "").toLowerCase() === "closed"
    ).length;
    const open = slas.length - closed;
    const overdue = slas.filter((s) => isOverdue(s.deadline || s.dueDate))
      .length;

    const chartData = [];
    if (open > 0)
      chartData.push({
        name: "Open / In Progress",
        value: open,
        fill: "#0F62FE",
      });
    if (overdue > 0)
      chartData.push({ name: "Overdue", value: overdue, fill: "#ef4444" });
    if (closed > 0)
      chartData.push({ name: "Closed", value: closed, fill: "#10b981" });

    console.log("SLA Chart Data:", chartData);

    return {
      total: slas.length,
      open,
      overdue,
      closed,
      chartData,
    };
  };

  if (loading) {
    return (
      <div className="ada-loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const kpiStats = getKPIStats();
  const perfOverview = getPerformanceOverview();
  const goalsData = getGoalsOverview();
  const lndData = getLndOverview();
  const meetingsData = getMeetingsOverview();
  const slaData = getSlaOverview();

  return (
    <div className="hr-dashboard-container">
      <Breadcrumb
        items={[
          {
            label: "Employee Dashboard",
          },
        ]}
      />

      {/* KPI CARDS */}
      <div className="admin-kpi-grid">
        <div
          className="admin-kpi-card"
          onClick={() => navigate("/employee/dashboard/performance")}
        >
          <div className="admin-kpi-icon admin-purple">
            <i className="bi bi-trophy"></i>
          </div>
          <div className="admin-kpi-content">
            <h2>
              <CountUp end={perfOverview.totalRecognitions} duration={2} />
            </h2>
            <p>My Recognitions</p>
            <span className="admin-kpi-subtitle">
              Organization nominations: {perfOverview.orgTotalNoms}
            </span>
          </div>
        </div>

        <div
          className="admin-kpi-card"
          onClick={() => navigate("/employee/dashboard/goals")}
        >
          <div className="admin-kpi-icon admin-blue">
            <Target size={28} />
          </div>
          <div className="admin-kpi-content">
            <h2>
              <CountUp end={kpiStats.totalGoals} duration={2} />
            </h2>
            <p>My Goals</p>
            <span className="admin-kpi-subtitle">
              <TrendingUp size={12} /> Self, Team & Org
            </span>
          </div>
        </div>

        <div
          className="admin-kpi-card"
          onClick={() => navigate("/employee/lnd/dashboard")}
        >
          <div className="admin-kpi-icon admin-pink">
            <BookOpen size={28} />
          </div>
          <div className="admin-kpi-content">
            <h2>
              <CountUp end={dashboardData.lndSkills.length} duration={2} />
            </h2>
            <p>My Skills</p>
            <span className="admin-kpi-subtitle">From L&D module</span>
          </div>
        </div>

        <div
          className="admin-kpi-card"
          onClick={() => navigate("/employee/dashboard/meetmom")}
        >
          <div className="admin-kpi-icon admin-green">
            <Calendar size={28} />
          </div>
          <div className="admin-kpi-content">
            <h2>
              <CountUp end={kpiStats.totalMeetings} duration={2} />
            </h2>
            <p>Meetings</p>
            <span className="admin-kpi-subtitle">
              {kpiStats.upcomingMeetings} upcoming
            </span>
          </div>
        </div>

        <div
          className="admin-kpi-card"
          onClick={() => navigate("/employee/dashboard/sla")}
        >
          <div className="admin-kpi-icon admin-cyan">
            <AlertTriangle size={28} />
          </div>
          <div className="admin-kpi-content">
            <h2>
              <CountUp end={kpiStats.totalSlas} duration={2} />
            </h2>
            <p>My SLAs</p>
            <span className="admin-kpi-subtitle">
              {kpiStats.overdueSlas} overdue
            </span>
          </div>
        </div>
      </div>

      {/* ANALYTICS CARDS */}
      <div className="dashboard-cards-container">
        {/* ROW 1: Performance & Goals */}
        <div className="dashboard-row">
          {/* Performance card */}
          <div className="dashboard-card card-medium">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-graph-up"></i>
                <h3>Performance & Recognition</h3>
              </div>
            </div>
            <div className="card-body">
              {perfOverview.totalRecognitions > 0 ? (
                <div style={{ marginBottom: "1rem" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "0.75rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <div
                      style={{
                        background: "#f0f9ff",
                        padding: "0.75rem",
                        borderRadius: "6px",
                        textAlign: "center",
                        border: "1px solid #bfdbfe",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "1.5rem",
                          fontWeight: "bold",
                          color: "#0F62FE",
                        }}
                      >
                        {perfOverview.totalRecognitions}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#1e40af" }}>
                        My Recognitions
                      </div>
                    </div>
                    <div
                      style={{
                        background: "#f0fdf4",
                        padding: "0.75rem",
                        borderRadius: "6px",
                        textAlign: "center",
                        border: "1px solid #86efac",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "1.5rem",
                          fontWeight: "bold",
                          color: "#10b981",
                        }}
                      >
                        {perfOverview.orgTotalNoms}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#047857" }}>
                        Org Nominations
                      </div>
                    </div>
                  </div>

                  {perfOverview.chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={perfOverview.chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {perfOverview.chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="no-data-message">
                      No breakdown by reward type
                    </div>
                  )}
                </div>
              ) : (
                <div className="no-data-message">
                  No approved recognitions yet
                </div>
              )}
              <button
                className="card-view-btn"
                onClick={() => navigate("/employee/dashboard/performance")}
              >
                View Performance Details
              </button>
            </div>
          </div>

          {/* Goals card */}
          <div className="dashboard-card card-medium">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-bullseye"></i>
                <h3>Goals Overview</h3>
              </div>
            </div>
            <div className="card-body">
              {goalsData.total > 0 ? (
                <div style={{ marginBottom: "1.5rem" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "0.75rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <div
                      style={{
                        background: "#f0f9ff",
                        padding: "0.75rem",
                        borderRadius: "6px",
                        textAlign: "center",
                        border: "1px solid #bfdbfe",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "1.5rem",
                          fontWeight: "bold",
                          color: "#0F62FE",
                        }}
                      >
                        {goalsData.total}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#1e40af" }}>
                        Total
                      </div>
                    </div>
                    <div
                      style={{
                        background: "#f0fdf4",
                        padding: "0.75rem",
                        borderRadius: "6px",
                        textAlign: "center",
                        border: "1px solid #86efac",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "1.5rem",
                          fontWeight: "bold",
                          color: "#10b981",
                        }}
                      >
                        {goalsData.completed}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#047857" }}>
                        Completed
                      </div>
                    </div>
                    <div
                      style={{
                        background: "#fef3c7",
                        padding: "0.75rem",
                        borderRadius: "6px",
                        textAlign: "center",
                        border: "1px solid #fcd34d",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "1.5rem",
                          fontWeight: "bold",
                          color: "#d97706",
                        }}
                      >
                        {goalsData.inProgress}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#b45309" }}>
                        In Progress
                      </div>
                    </div>
                  </div>

                  {goalsData.chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={goalsData.chartData}
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {goalsData.chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="no-data-message">No chart data available</div>
                  )}
                </div>
              ) : (
                <div className="no-data-message">No goal data</div>
              )}
              <button
                className="card-view-btn"
                onClick={() => navigate("/employee/dashboard/goals")}
              >
                View All Goals
              </button>
            </div>
          </div>
        </div>

        {/* ROW 2: Meetings, L&D, SLAs */}
        <div className="dashboard-row">
          {/* Meetings */}
          <div className="dashboard-card card-medium">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-calendar-check"></i>
                <h3>Meetings Scheduled</h3>
              </div>
            </div>
            <div className="card-body">
              {meetingsData.total > 0 ? (
                <div style={{ marginBottom: "1rem" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "0.75rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <div
                      style={{
                        background: "#f0f9ff",
                        padding: "0.75rem",
                        borderRadius: "6px",
                        textAlign: "center",
                        border: "1px solid #bfdbfe",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "1.5rem",
                          fontWeight: "bold",
                          color: "#0F62FE",
                        }}
                      >
                        {meetingsData.total}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#1e40af" }}>
                        Total
                      </div>
                    </div>
                    <div
                      style={{
                        background: "#f0fdf4",
                        padding: "0.75rem",
                        borderRadius: "6px",
                        textAlign: "center",
                        border: "1px solid #86efac",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "1.5rem",
                          fontWeight: "bold",
                          color: "#10b981",
                        }}
                      >
                        {meetingsData.upcoming}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#047857" }}>
                        Upcoming
                      </div>
                    </div>
                    <div
                      style={{
                        background: "#fef3c7",
                        padding: "0.75rem",
                        borderRadius: "6px",
                        textAlign: "center",
                        border: "1px solid #fcd34d",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "1.5rem",
                          fontWeight: "bold",
                          color: "#d97706",
                        }}
                      >
                        {meetingsData.completed}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#b45309" }}>
                        Completed
                      </div>
                    </div>
                  </div>

                  {meetingsData.chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={meetingsData.chartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#f3f4f6"
                          vertical={false}
                        />
                        <XAxis dataKey="month" stroke="#9ca3af" fontSize={10} />
                        <YAxis stroke="#9ca3af" fontSize={11} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#fff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "6px",
                            fontSize: "12px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="#2c2c54"
                          strokeWidth={2}
                          dot={{ fill: "#2c2c54", r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="no-data-message">No chart data available</div>
                  )}
                </div>
              ) : (
                <div className="no-data-message">No meeting data</div>
              )}
              <button
                className="card-view-btn"
                onClick={() => navigate("/employee/dashboard/meetmom")}
              >
                View All Meetings
              </button>
            </div>
          </div>

          {/* L&D (skills-based) */}
          <div className="dashboard-card card-medium">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-book"></i>
                <h3>Learning & Development</h3>
              </div>
            </div>
            <div className="card-body">
              {lndData.total > 0 ? (
                <div style={{ marginBottom: "1.5rem" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr 1fr",
                      gap: "0.75rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <div
                      style={{
                        background: "#f0f9ff",
                        padding: "0.75rem",
                        borderRadius: "6px",
                        textAlign: "center",
                        border: "1px solid #bfdbfe",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "1.5rem",
                          fontWeight: "bold",
                          color: "#0F62FE",
                        }}
                      >
                        {lndData.total}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#1e40af" }}>
                        Total Skills
                      </div>
                    </div>
                    <div
                      style={{
                        background: "#fee2e2",
                        padding: "0.75rem",
                        borderRadius: "6px",
                        textAlign: "center",
                        border: "1px solid #fecaca",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "1.5rem",
                          fontWeight: "bold",
                          color: "#f97316",
                        }}
                      >
                        {lndData.low}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#c2410c" }}>
                        Level 1-4
                      </div>
                    </div>
                    <div
                      style={{
                        background: "#dbeafe",
                        padding: "0.75rem",
                        borderRadius: "6px",
                        textAlign: "center",
                        border: "1px solid #93c5fd",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "1.5rem",
                          fontWeight: "bold",
                          color: "#0F62FE",
                        }}
                      >
                        {lndData.medium}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#1d4ed8" }}>
                        Level 5-7
                      </div>
                    </div>
                    <div
                      style={{
                        background: "#f0fdf4",
                        padding: "0.75rem",
                        borderRadius: "6px",
                        textAlign: "center",
                        border: "1px solid #86efac",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "1.5rem",
                          fontWeight: "bold",
                          color: "#10b981",
                        }}
                      >
                        {lndData.high}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#047857" }}>
                        Level 8-10
                      </div>
                    </div>
                  </div>

                  {lndData.chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={lndData.chartData}
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {lndData.chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="no-data-message">No chart data available</div>
                  )}
                </div>
              ) : (
                <div className="no-data-message">
                  No skills recorded in L&D
                </div>
              )}
              <button
                className="card-view-btn"
                onClick={() => navigate("/employee/lnd/dashboard")}
              >
                View My Skills
              </button>
            </div>
          </div>

          {/* SLAs */}
          <div className="dashboard-card card-medium">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-file-earmark-check"></i>
                <h3>My SLAs</h3>
              </div>
            </div>
            <div className="card-body">
              {slaData.total > 0 ? (
                <div style={{ marginBottom: "1rem" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "0.75rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <div
                      style={{
                        background: "#f0f9ff",
                        padding: "0.75rem",
                        borderRadius: "6px",
                        textAlign: "center",
                        border: "1px solid #bfdbfe",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "1.5rem",
                          fontWeight: "bold",
                          color: "#0F62FE",
                        }}
                      >
                        {slaData.total}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#1e40af" }}>
                        Total
                      </div>
                    </div>
                    <div
                      style={{
                        background: "#fee2e2",
                        padding: "0.75rem",
                        borderRadius: "6px",
                        textAlign: "center",
                        border: "1px solid #fca5a5",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "1.5rem",
                          fontWeight: "bold",
                          color: "#ef4444",
                        }}
                      >
                        {slaData.overdue}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#dc2626" }}>
                        Overdue
                      </div>
                    </div>
                    <div
                      style={{
                        background: "#f0fdf4",
                        padding: "0.75rem",
                        borderRadius: "6px",
                        textAlign: "center",
                        border: "1px solid #86efac",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "1.5rem",
                          fontWeight: "bold",
                          color: "#10b981",
                        }}
                      >
                        {slaData.closed}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#047857" }}>
                        Closed
                      </div>
                    </div>
                  </div>

                  {slaData.chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={slaData.chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {slaData.chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="no-data-message">No chart data available</div>
                  )}
                </div>
              ) : (
                <div className="no-data-message">No SLA data</div>
              )}
              <button
                className="card-view-btn"
                onClick={() => navigate("/employee/dashboard/sla")}
              >
                View All SLAs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;


