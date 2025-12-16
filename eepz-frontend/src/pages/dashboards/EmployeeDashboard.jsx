
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
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
import axios from "axios";
import goalService from "../../services/goals/goalService";
import lndService from "../../services/lnd/lndService";
import rsvpService from "../../services/meeting/rsvpService";
import slaService from "../../services/sla/slaService";

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

  const getToken = () => {
    return localStorage.getItem("token") || localStorage.getItem("accessToken");
  };

  const extractData = (response) => {
    if (!response) return [];
    if (Array.isArray(response)) return response;

    const data = response.data || response;

    const paths = [
      data?.data?.items,
      data?.data?.$values,
      data?.data?.values,
      data?.data,
      data?.items,
      data?.$values,
      data?.values,
      data,
    ];

    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];
      if (Array.isArray(path) && path.length >= 0) {
        return path;
      }
    }

    return [];
  };

  // Create axios instance for port 5113
  const createApiPort5113 = () => {
    const BASE_URL = import.meta.env.VITE_PERFORMANCE_API_URL + "/api";
    const BASE_URL_5113 = BASE_URL.replace("5108", "5113");

    const instance = axios.create({
      baseURL: BASE_URL_5113,
      headers: { "Content-Type": "application/json" },
      timeout: 30000,
    });

    instance.interceptors.request.use(
      (config) => {
        const token = getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    return instance;
  };

  // API functions using port 5113
  const getApprovedProfiles = () => {
    const api = createApiPort5113();
    return api.get("/HRNomination/approved-profiles");
  };

  const getStatistics = () => {
    const api = createApiPort5113();
    return api.get("/HRNomination/statistics");
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
            console.error("Self Goals Error:", err);
            return { data: [] };
          }),
        goalService
          .queryGoals({ type: "org", pageSize: 1000 })
          .catch((err) => {
            console.error("Org Goals Error:", err);
            return { data: [] };
          }),
        goalService
          .queryGoals({ type: "team", pageSize: 1000 })
          .catch((err) => {
            console.error("Team Goals Error:", err);
            return { data: [] };
          }),
        lndService
          .getMyAssignments(1, "", "", "", "", 1000)
          .catch((err) => {
            console.error("LND Assignments Error:", err);
            return { data: [] };
          }),
        lndService
          .getMySkills(1, "", "", "asc", 1000)
          .catch((err) => {
            console.error("LND Skills Error:", err);
            return { data: { items: [] } };
          }),
        rsvpService.getMyInvitations().catch((err) => {
          console.error("Meetings Error:", err);
          return [];
        }),
        slaService.getEmployeeSLAs(empId).catch((err) => {
          console.error("SLAs Error:", err);
          return { data: [] };
        }),
        getApprovedProfiles().catch((err) => {
          console.error("Approved Profiles Error:", err);
          console.error("  Error Details:", err.response?.data || err.message);
          console.error("  Status Code:", err.response?.status);
          return { data: [] };
        }),
        getStatistics().catch((err) => {
          console.error("Statistics Error:", err);
          console.error("  Error Details:", err.response?.data || err.message);
          console.error("  Status Code:", err.response?.status);
          return { data: null };
        }),
      ]);

      console.log("Approved Profiles raw response:", approvedProfilesRes);
      console.log("Statistics raw response:", statsRes);

      const selfGoals = extractData(selfGoalsRes);
      const orgGoals = extractData(orgGoalsRes);
      const teamGoals = extractData(teamGoalsRes);
      const lndAssignments = extractData(myLndAssignmentsRes);
      const lndSkills = extractData(myLndSkillsRes);
      const meetings = Array.isArray(myMeetingsRes)
        ? myMeetingsRes
        : extractData(myMeetingsRes);
      const slas = extractData(mySlasRes);

      const allGoals = [
        ...selfGoals.map((g) => ({ ...g, goalType: "self" })),
        ...orgGoals.map((g) => ({ ...g, goalType: "org" })),
        ...teamGoals.map((g) => ({ ...g, goalType: "team" })),
      ];

      const allApprovedProfiles = extractData(approvedProfilesRes);
      console.log("Total approved profiles:", allApprovedProfiles.length);
      if (allApprovedProfiles.length > 0) {
        console.log("Sample approved profile:", allApprovedProfiles[0]);
      }

      const myRecognitions = allApprovedProfiles.filter((p) => {
        const nomineeId =
          p.nominee?.employeeId ||
          p.employeeId ||
          p.employeeMasterId ||
          p.nomineeEmployeeId;
        const match = nomineeId == empId;
        console.log(
          `Checking profile - nomineeId: ${nomineeId}, empId: ${empId}, match: ${match}`
        );
        return match;
      });

      console.log("My recognitions count:", myRecognitions.length);

      const stats =
        statsRes?.data?.data ||
        statsRes?.data ||
        statsRes?.totalNominations ||
        statsRes ||
        null;
      console.log("Statistics parsed object:", stats);

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
      console.error("Error in fetchAllData:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const isOverdue = (deadline) => {
    if (!deadline) return false;
    if (!slaService || typeof slaService.isOverdue !== "function") return false;
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
      return status === "pending" || status === "open" || status === "approved";
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

      if (isNaN(r)) return;

      if (r <= 4) low += 1;
      else if (r <= 7) medium += 1;
      else high += 1;
    });

    const chartData = [];
    if (low > 0)
      chartData.push({ name: "Rating 1-4", value: low, fill: "#f97316" });
    if (medium > 0)
      chartData.push({ name: "Rating 5-7", value: medium, fill: "#0F62FE" });
    if (high > 0)
      chartData.push({ name: "Rating 8-10", value: high, fill: "#10b981" });

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

      const key = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
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

    return {
      total: meetings.length,
      upcoming,
      completed,
      chartData,
    };
  };

  const getSlaOverview = () => {
    const slas = dashboardData.slas;

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

      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
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

        <div className="admin-kpi-card">
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

        <div className="admin-kpi-card">
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

        <div className="admin-kpi-card">
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

        <div className="admin-kpi-card">
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

      <div className="dashboard-cards-container">
        <div className="dashboard-row">
          <div className="dashboard-card card-medium">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-graph-up"></i>
                <h3>Performance & Recognition</h3>
              </div>
            </div>
            <div className="card-body">
              {perfOverview.totalRecognitions > 0 ? (
                <>
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
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={perfOverview.chartData}
                          cx="50%"
                          cy="45%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                          label={false}
                        >
                          {perfOverview.chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend
                          layout="horizontal"
                          align="center"
                          verticalAlign="bottom"
                          wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                          formatter={(value, entry) => {
                            const item = perfOverview.chartData.find(
                              (d) => d.name === entry.value
                            );
                            return `${item?.name || value}: ${
                              item?.value || 0
                            }`;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="no-data-message">
                      No breakdown by reward type
                    </div>
                  )}
                </>
              ) : (
                <div className="no-data-message">
                  No approved recognitions yet
                </div>
              )}
            </div>
          </div>

          <div className="dashboard-card card-medium">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-bullseye"></i>
                <h3>Goals Overview</h3>
              </div>
            </div>
            <div className="card-body">
              {goalsData.total > 0 ? (
                <>
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
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={goalsData.chartData}
                          cx="50%"
                          cy="45%"
                          outerRadius={80}
                          dataKey="value"
                          label={false}
                        >
                          {goalsData.chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend
                          layout="horizontal"
                          align="center"
                          verticalAlign="bottom"
                          wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                          formatter={(value, entry) => {
                            const item = goalsData.chartData.find(
                              (d) => d.name === entry.value
                            );
                            return `${item?.name || value}: ${
                              item?.value || 0
                            }`;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="no-data-message">No chart data available</div>
                  )}
                </>
              ) : (
                <div className="no-data-message">No goal data</div>
              )}
            </div>
          </div>

          <div className="dashboard-card card-medium">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-book"></i>
                <h3>Learning & Development</h3>
              </div>
            </div>
            <div className="card-body">
              {lndData.total > 0 ? (
                <>
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
                        Rating 1-4
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
                        Rating 5-7
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
                        Rating 8-10
                      </div>
                    </div>
                  </div>

                  {lndData.chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={lndData.chartData}
                          cx="50%"
                          cy="45%"
                          outerRadius={80}
                          dataKey="value"
                          label={false}
                        >
                          {lndData.chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend
                          layout="horizontal"
                          align="center"
                          verticalAlign="bottom"
                          wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                          formatter={(value, entry) => {
                            const item = lndData.chartData.find(
                              (d) => d.name === entry.value
                            );
                            return `${item?.name || value}: ${
                              item?.value || 0
                            }`;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="no-data-message">No chart data available</div>
                  )}
                </>
              ) : (
                <div className="no-data-message">
                  No skills recorded in L&D
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="dashboard-row">
          <div className="dashboard-card card-medium">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-calendar-check"></i>
                <h3>Meetings Scheduled</h3>
              </div>
            </div>
            <div className="card-body">
              {meetingsData.total > 0 ? (
                <>
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
                    <ResponsiveContainer width="100%" height={240}>
                      <AreaChart data={meetingsData.chartData}>
                        <defs>
                          <linearGradient
                            id="colorCount"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#2c2c54"
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="95%"
                              stopColor="#2c2c54"
                              stopOpacity={0.1}
                            />
                          </linearGradient>
                        </defs>
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
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke="#2c2c54"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorCount)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="no-data-message">No chart data available</div>
                  )}
                </>
              ) : (
                <div className="no-data-message">No meeting data</div>
              )}
            </div>
          </div>

          <div className="dashboard-card card-medium">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-file-earmark-check"></i>
                <h3>My SLAs</h3>
              </div>
            </div>
            <div className="card-body">
              {slaData.total > 0 ? (
                <>
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
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={slaData.chartData}
                          cx="50%"
                          cy="45%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                          label={false}
                        >
                          {slaData.chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend
                          layout="horizontal"
                          align="center"
                          verticalAlign="bottom"
                          wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                          formatter={(value, entry) => {
                            const item = slaData.chartData.find(
                              (d) => d.name === entry.value
                            );
                            return `${item?.name || value}: ${
                              item?.value || 0
                            }`;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="no-data-message">No chart data available</div>
                  )}
                </>
              ) : (
                <div className="no-data-message">No SLA data</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
