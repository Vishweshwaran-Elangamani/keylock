import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import CountUp from "react-countup";
import {
  Users,
  Target,
  Shield,
  TrendingUp,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import goalService from "../../services/goals/goalService";
import nominationService from "../../services/internal/nominationService";
import lndService from "../../services/lnd/lndService";
import { getTeamMembers } from "../../services/performancemanagement/manager/managernominationapi";
import meetingService from "../../services/meeting/meetingService";
import slaService from "../../services/sla/slaService";
import internalApi from "../../services/internal/internalApi";
import Breadcrumb from "../../components/common/Breadcrumb";
import { toast } from "sonner";
import "../../styles/auth/AdminDashboard.css";

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
    myNominationsPerfMgmt: [],
    pendingManagerReviews: [],
    teamMembers: [],
    teamAssignments: [],
    subordinateEmployees: [],
    myMeetings: [],
    oneOnOneReports: [],
    managerEscalations: [],
  });

  useEffect(() => {
    fetchAllData();

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchAllData();
      }
    };

    const handleFocus = () => {
      fetchAllData();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const getUserData = () => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  };

  const extractData = (response) => {
    if (!response) return [];
    if (Array.isArray(response)) return response;

    if (response.success === true || response.success === false) {
      if (response.data) {
        if (Array.isArray(response.data)) return response.data;
        if (response.data.$values) return response.data.$values;
        if (response.data.nominations) {
          if (Array.isArray(response.data.nominations)) return response.data.nominations;
          if (response.data.nominations.$values) return response.data.nominations.$values;
        }
        if (response.data.items) {
          if (Array.isArray(response.data.items)) return response.data.items;
          if (response.data.items.$values) return response.data.items.$values;
        }
      }
    }

    if (response.data) {
      if (Array.isArray(response.data)) return response.data;
      if (response.data.$values) return response.data.$values;
      if (response.data.nominations) {
        if (Array.isArray(response.data.nominations)) return response.data.nominations;
        if (response.data.nominations.$values) return response.data.nominations.$values;
      }
      if (response.data.data) {
        if (Array.isArray(response.data.data)) return response.data.data;
        if (response.data.data.$values) return response.data.data.$values;
        if (response.data.data.nominations) return response.data.data.nominations;
        if (response.data.data.items?.$values) return response.data.data.items.$values;
        if (response.data.data.items) return response.data.data.items;
      }
    }

    if (response.$values) return response.$values;
    if (response.nominations) {
      if (Array.isArray(response.nominations)) return response.nominations;
      if (response.nominations.$values) return response.nominations.$values;
    }

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

      const managerId = user.empMasterId || user.employeeMasterId || user.id;

      const [
        dashboardSummaryRes,
        allGoalsRes,
        myProjectsRes,
        pendingApprovalsRes,
        managerTeamNominationsRes,
        managerApprovedNominationsRes,
        pendingManagerReviewsRes,
        teamMembersRes,
        teamAssignmentsRes,
        subordinateEmployeesRes,
        myMeetingsRes,
        oneOnOneReportsRes,
        managerEscalationsRes,
      ] = await Promise.all([
        goalService.getDashboardSummary().catch(() => ({ data: null })),
        goalService
          .queryGoals({ pageSize: 1000, status: "" })
          .catch(() => ({ data: [] })),
        goalService.getUserProjects().catch(() => ({ data: [] })),
        goalService.getPendingApprovals().catch(() => ({ data: [] })),
        internalApi.get(`/ManagerNomination/team/${managerId}`).catch(() => ({ data: [] })),
        internalApi.get(`/ManagerNomination/approved/${managerId}`).catch(() => ({ data: [] })),
        nominationService
          .getPendingManagerReview()
          .catch(() => ({ success: false, data: [] })),
        getTeamMembers(managerId).catch(() => ({ data: [] })),
        lndService
          .getTeamAssignments(1)
          .catch(() => ({ data: { data: { items: [] } } })),
        lndService
          .getSubordinateEmployees(1)
          .catch(() => ({ data: { data: { items: [] } } })),
        meetingService.getMyMeetings().catch(() => ({ data: [] })),
        meetingService.getOneOnOneReports().catch(() => ({ data: [] })),
        slaService.getManagerEscalations(managerId).catch(() => ({ data: [] })),
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
        return (
          (title.includes("team") || type === "team") &&
          !title.includes("self") &&
          !title.includes("personal")
        );
      });

      const extractedOrgGoals = allGoalsExtracted.filter((g) => {
        const title = (g.title || "").toLowerCase();
        const type = (g.goalType || g.type || "").toLowerCase();
        return title.includes("org") || type === "org" || type === "organization";
      });

      const extractedProjects = extractData(myProjectsRes);
      const extractedPendingApprovals = extractData(pendingApprovalsRes);

      // Extract all nominations from different sources
      let extractedManagerNominations = extractData(managerTeamNominationsRes);
      let extractedApprovedNominations = extractData(managerApprovedNominationsRes);
      let extractedPendingManagerReviews = extractData(pendingManagerReviewsRes);

      console.log("===== MANAGER TEAM NOMINATIONS (Pending) =====", extractedManagerNominations);
      console.log("===== MANAGER APPROVED NOMINATIONS =====", extractedApprovedNominations);
      console.log("===== PENDING MANAGER REVIEWS =====", extractedPendingManagerReviews);

      // Combine all sources
      const allNominationsCombined = [
        ...extractedManagerNominations,
        ...extractedApprovedNominations,
        ...extractedPendingManagerReviews
      ];

      // Remove duplicates based on nominationId or id
      const uniqueNominations = Array.from(
        new Map(allNominationsCombined.map(item => [item.nominationId || item.id, item])).values()
      );

      console.log("===== UNIQUE NOMINATIONS =====", uniqueNominations.length);
      uniqueNominations.forEach(nom => {
        const status = nom.status || nom.nominationStatus;
        const id = nom.nominationId || nom.id;
        console.log(`- ID: ${id}, Status: ${status}`);
      });

      const extractedTeamMembers = extractData(teamMembersRes);

      const extractedTeamAssignments =
        teamAssignmentsRes?.data?.data?.items?.$values ||
        teamAssignmentsRes?.data?.data?.items ||
        extractData(teamAssignmentsRes);

      const extractedSubordinateEmployees =
        subordinateEmployeesRes?.data?.data?.items?.$values ||
        subordinateEmployeesRes?.data?.data?.items ||
        extractData(subordinateEmployeesRes);

      const extractedMeetings = extractData(myMeetingsRes);
      const extractedOneOnOneReports = extractData(oneOnOneReportsRes);
      const extractedManagerEscalations = extractData(managerEscalationsRes);

      const allGoalsCombined = [
        ...extractedSelfGoals.map((g) => ({ ...g, goalType: "self" })),
        ...extractedTeamGoals.map((g) => ({ ...g, goalType: "team" })),
        ...extractedOrgGoals.map((g) => ({ ...g, goalType: "org" })),
      ];

      let summaryData = null;
      if (dashboardSummaryRes) {
        if (dashboardSummaryRes.data) {
          summaryData = dashboardSummaryRes.data;
        } else {
          summaryData = dashboardSummaryRes;
        }
      }

      setDashboardData({
        dashboardSummary: summaryData,
        allGoals: allGoalsCombined,
        pendingApprovals: extractedPendingApprovals,
        myProjects: extractedProjects,
        myNominationsPerfMgmt: uniqueNominations,
        pendingManagerReviews: extractedPendingManagerReviews,
        teamMembers: extractedTeamMembers,
        teamAssignments: extractedTeamAssignments,
        subordinateEmployees: extractedSubordinateEmployees,
        myMeetings: extractedMeetings,
        oneOnOneReports: extractedOneOnOneReports,
        managerEscalations: extractedManagerEscalations,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getKPIStats = () => {
    const totalTeamMembers =
      dashboardData.subordinateEmployees.length || dashboardData.teamMembers.length;
    const pendingApprovals = dashboardData.pendingApprovals.length;
    const pendingNominationReviews = dashboardData.pendingManagerReviews.length;

    const ongoingGoalsCount = dashboardData.allGoals.filter((g) => {
      const status = (g.status || g.goalStatus || "").toLowerCase();
      return (
        status === "inprogress" ||
        status === "pending" ||
        status === "approved" ||
        status === "open"
      );
    }).length;

    const myProjectsCount = dashboardData.myProjects.length;
    const teamAssignmentsCount = dashboardData.teamAssignments.length;
    const pendingEscalations = dashboardData.managerEscalations.filter(
      (e) => e.escalationStatus?.toLowerCase() === "pending"
    ).length;
    const upcomingMeetings = dashboardData.myMeetings.filter((m) => {
      const meetingDate = new Date(m.meetingDate || m.date);
      const now = new Date();
      return meetingDate > now;
    }).length;

    return {
      totalTeamMembers,
      pendingApprovals,
      pendingNominationReviews,
      ongoingGoalsCount,
      myProjectsCount,
      teamAssignmentsCount,
      pendingEscalations,
      upcomingMeetings,
      totalEscalations: dashboardData.managerEscalations.length,
      totalMeetings: dashboardData.myMeetings.length,
      totalNominations: dashboardData.myNominationsPerfMgmt.length,
    };
  };

  const getGoalsByType = () => {
    const goals = dashboardData.allGoals.filter((g) => {
      const goalTypeLower = (g.goalType || g.type || "").toLowerCase();

      if (goalType === "self") {
        return goalTypeLower === "self" || goalTypeLower === "personal";
      }
      if (goalType === "team") {
        return goalTypeLower === "team";
      }
      if (goalType === "org") {
        return goalTypeLower === "org" || goalTypeLower === "organization";
      }

      return false;
    });

    if (!goals || goals.length === 0) {
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
        overdue: 0,
        chartData: [],
      };
    }

    const now = new Date();
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

    const overdue = goals.filter((g) => {
      const deadline = new Date(g.deadline || g.endDate);
      const status = (g.status || g.goalStatus || "").toLowerCase();
      return deadline < now && status !== "completed";
    }).length;

    const total = goals.length;

    const chartData = [];
    if (completed > 0)
      chartData.push({ name: "Completed", value: completed, fill: "#10b981" });
    if (inProgress > 0)
      chartData.push({ name: "In Progress", value: inProgress, fill: "#0F62FE" });
    if (pending > 0) chartData.push({ name: "Pending", value: pending, fill: "#f59e0b" });
    if (overdue > 0) chartData.push({ name: "Overdue", value: overdue, fill: "#ef4444" });

    return {
      total,
      completed,
      inProgress,
      pending,
      overdue,
      chartData:
        chartData.length > 0
          ? chartData
          : [{ name: "No Data", value: 1, fill: "#e5e7eb" }],
    };
  };

  const getTeamAssignmentStatus = () => {
    const CHART_COLORS_LOCAL = [
      "#10b981",
      "#f59e0b",
      "#0F62FE",
      "#ef4444",
      "#8b5cf6",
      "#2c2c54",
    ];

    const statusCount = {};
    dashboardData.teamAssignments.forEach((assignment) => {
      const rawStatus = assignment.assignmentStatus || assignment.status || "Unknown";
      const key = formatStatusLabel(rawStatus);
      statusCount[key] = (statusCount[key] || 0) + 1;
    });

    return Object.entries(statusCount)
      .map(([name, value], index) => ({
        name,
        value,
        fill: CHART_COLORS_LOCAL[index % CHART_COLORS_LOCAL.length],
      }))
      .filter((item) => item.value > 0);
  };

  const getEscalationHistory = () => {
    const escalations = dashboardData.managerEscalations;

    const ESCALATION_COLORS = {
      "Pending": "#f59e0b",
      "Resolved": "#10b981",
      "Rejected": "#ef4444",
      "In Progress": "#0F62FE",
    };

    const statusCount = {};
    escalations.forEach((esc) => {
      const rawStatus = esc.escalationStatus || "Unknown";
      const key = formatStatusLabel(rawStatus);
      statusCount[key] = (statusCount[key] || 0) + 1;
    });

    const chartData = Object.entries(statusCount).map(([name, value]) => ({
      name,
      value,
      fill: ESCALATION_COLORS[name] || "#6b7280",
    }));

    return {
      total: escalations.length,
      pending: escalations.filter(
        (e) => e.escalationStatus?.toLowerCase() === "pending"
      ).length,
      resolved: escalations.filter(
        (e) => e.escalationStatus?.toLowerCase() === "resolved"
      ).length,
      rejected: escalations.filter(
        (e) => e.escalationStatus?.toLowerCase() === "rejected"
      ).length,
      chartData: chartData.filter((item) => item.value > 0),
    };
  };

  const getNominationHistory = () => {
    const nominations = dashboardData.myNominationsPerfMgmt;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const statusCount = {};
    nominations.forEach((nom) => {
      const rawStatus = nom.status || nom.nominationStatus || "Unknown";
      const key = formatStatusLabel(rawStatus);
      statusCount[key] = (statusCount[key] || 0) + 1;
    });

    console.log("===== NOMINATION STATUS COUNT =====", statusCount);

    // Count approved nominations (all variations)
    const approvedCount = nominations.filter(n => {
      const status = (n.status || n.nominationStatus || "").toLowerCase();
      return status.includes("approved") || 
             status === "manager_approved" || 
             status === "managerapproved" ||
             status === "hr_approved" ||
             status === "hrapproved";
    }).length;

    const pendingCount = nominations.filter(n => {
      const status = (n.status || n.nominationStatus || "").toLowerCase();
      return status.includes("pending");
    }).length;

    const rejectedCount = nominations.filter(n => {
      const status = (n.status || n.nominationStatus || "").toLowerCase();
      return status.includes("rejected");
    }).length;

    console.log("Approved:", approvedCount, "Pending:", pendingCount, "Rejected:", rejectedCount);

    const statusChartData = Object.entries(statusCount).map(([name, value]) => ({
      name,
      value,
      fill:
        name.toLowerCase().includes("pending") ? "#f59e0b" :
        name.toLowerCase().includes("approved") ? "#10b981" :
        name.toLowerCase().includes("rejected") ? "#ef4444" :
        "#0F62FE"
    }));

    const thisMonthNominations = nominations.filter((nom) => {
      const dateFields = [
        nom.createdDate,
        nom.submittedDate,
        nom.nominationDate,
        nom.createdAt,
        nom.submittedAt,
        nom.dateCreated,
        nom.dateSubmitted,
        nom.created,
        nom.submitted,
      ];

      for (const df of dateFields) {
        if (df) {
          const d = new Date(df);
          if (!isNaN(d.getTime())) {
            return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
          }
        }
      }
      return false;
    });

    return {
      total: nominations.length,
      thisMonth: thisMonthNominations.length,
      approved: approvedCount,
      pending: pendingCount,
      rejected: rejectedCount,
      chartData: statusChartData.filter(item => item.value > 0),
    };
  };

  const getMeetingScheduleData = () => {
    const meetings = dashboardData.myMeetings;

    const monthlyData = {};
    meetings.forEach((meeting) => {
      const date = new Date(meeting.meetingDate || meeting.date || meeting.createdDate);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
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
      thisMonth: Object.values(monthlyData).slice(-1)[0] || 0,
      chartData,
    };
  };

  const getMeetingOverview = () => {
    const total = dashboardData.myMeetings.length;
    const upcoming = dashboardData.myMeetings.filter((m) => {
      const meetingDate = new Date(m.meetingDate || m.date);
      return meetingDate > new Date();
    }).length;
    const completed = dashboardData.myMeetings.filter((m) => {
      const meetingDate = new Date(m.meetingDate || m.date);
      return meetingDate <= new Date();
    }).length;

    return {
      total,
      upcoming,
      completed,
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
  const goalsData = getGoalsByType();
  const teamAssignmentStatus = getTeamAssignmentStatus();
  const escalationHistory = getEscalationHistory();
  const nominationHistory = getNominationHistory();
  const meetingScheduleData = getMeetingScheduleData();
  const meetingOverview = getMeetingOverview();

  return (
    <div className="hr-dashboard-container">
      <Breadcrumb items={[{ label: "Manager Dashboard" }]} />

      <div className="admin-kpi-grid">
        <div className="admin-kpi-card" onClick={() => navigate("")}>
          <div className="admin-kpi-icon admin-pink">
            <Users size={28} />
          </div>
          <div className="admin-kpi-content">
            <h2>
              <CountUp end={kpiStats.totalTeamMembers} duration={2} />
            </h2>
            <p>Team Members</p>
            <span className="admin-kpi-subtitle">
              <TrendingUp size={12} /> Your team size
            </span>
          </div>
        </div>

        <div className="admin-kpi-card" onClick={() => navigate("")}>
          <div className="admin-kpi-icon admin-blue">
            <Target size={28} />
          </div>
          <div className="admin-kpi-content">
            <h2>
              <CountUp end={kpiStats.ongoingGoalsCount} duration={2} />
            </h2>
            <p>Ongoing Goals</p>
            <span className="admin-kpi-subtitle">
              {kpiStats.myProjectsCount} projects
            </span>
          </div>
        </div>

        <div className="admin-kpi-card" onClick={() => navigate("")}>
          <div className="admin-kpi-icon admin-purple">
            <Shield size={28} />
          </div>
          <div className="admin-kpi-content">
            <h2>
              <CountUp end={kpiStats.totalNominations} duration={2} />
            </h2>
            <p>Nominations</p>
            <span className="admin-kpi-subtitle">
              {kpiStats.pendingNominationReviews} pending
            </span>
          </div>
        </div>

        <div className="admin-kpi-card" onClick={() => navigate("")}>
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

        <div className="admin-kpi-card" onClick={() => navigate("")}>
          <div className="admin-kpi-icon admin-cyan">
            <AlertTriangle size={28} />
          </div>
          <div className="admin-kpi-content">
            <h2>
              <CountUp end={kpiStats.totalEscalations} duration={2} />
            </h2>
            <p>Escalations</p>
            <span className="admin-kpi-subtitle">
              {kpiStats.pendingEscalations} pending
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-cards-container">
        <div className="dashboard-row">
          <div className="dashboard-card card-medium">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-bullseye"></i>
                <h3>Goals Overview</h3>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => setGoalType("self")}
                  style={{
                    padding: "0.4rem 0.75rem",
                    fontSize: "0.75rem",
                    borderRadius: "6px",
                    border:
                      goalType === "self"
                        ? "1px solid #fff"
                        : "1px solid rgba(255,255,255,0.3)",
                    background:
                      goalType === "self"
                        ? "rgba(255,255,255,0.25)"
                        : "rgba(255,255,255,0.1)",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: goalType === "self" ? "600" : "500",
                    transition: "all 0.2s",
                  }}
                >
                  Self
                </button>
                <button
                  onClick={() => setGoalType("team")}
                  style={{
                    padding: "0.4rem 0.75rem",
                    fontSize: "0.75rem",
                    borderRadius: "6px",
                    border:
                      goalType === "team"
                        ? "1px solid #fff"
                        : "1px solid rgba(255,255,255,0.3)",
                    background:
                      goalType === "team"
                        ? "rgba(255,255,255,0.25)"
                        : "rgba(255,255,255,0.1)",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: goalType === "team" ? "600" : "500",
                    transition: "all 0.2s",
                  }}
                >
                  Team
                </button>
                <button
                  onClick={() => setGoalType("org")}
                  style={{
                    padding: "0.4rem 0.75rem",
                    fontSize: "0.75rem",
                    borderRadius: "6px",
                    border:
                      goalType === "org"
                        ? "1px solid #fff"
                        : "1px solid rgba(255,255,255,0.3)",
                    background:
                      goalType === "org"
                        ? "rgba(255,255,255,0.25)"
                        : "rgba(255,255,255,0.1)",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: goalType === "org" ? "600" : "500",
                    transition: "all 0.2s",
                  }}
                >
                  Org
                </button>
              </div>
            </div>
            <div className="card-body">
              {goalsData.total > 0 ? (
                <>
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
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={goalsData.chartData}
                        cx="50%"
                        cy="45%"
                        outerRadius={70}
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
                          const item = goalsData.chartData.find(d => d.name === entry.value);
                          return `${item?.name || value}: ${item?.value || 0}`;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <div className="no-data-message">No goal data</div>
              )}
            </div>
          </div>

          <div className="dashboard-card card-medium">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-award"></i>
                <h3>Nomination Status</h3>
              </div>
            </div>
            <div className="card-body">
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
                      {nominationHistory.total}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#1e40af" }}>
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
                      {nominationHistory.approved}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#047857" }}>
                      Approved
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
                      {nominationHistory.pending}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#b45309" }}>
                      Pending
                    </div>
                  </div>
                </div>
              </div>
              {nominationHistory.total > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={nominationHistory.chartData}
                      cx="50%"
                      cy="45%"
                      outerRadius={70}
                      dataKey="value"
                      label={false}
                    >
                      {nominationHistory.chartData.map((entry, index) => (
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
                        const item = nominationHistory.chartData.find(d => d.name === entry.value);
                        return `${item?.name || value}: ${item?.value || 0}`;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
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
                      {meetingOverview.total}
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
                      {meetingOverview.upcoming}
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
                      {meetingOverview.completed}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#b45309" }}>
                      Completed
                    </div>
                  </div>
                </div>
              </div>
              {meetingScheduleData.chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={meetingScheduleData.chartData}>
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
                <div className="no-data-message">No meeting data</div>
              )}
            </div>
          </div>
        </div>

        <div className="dashboard-row">
          <div className="dashboard-card card-medium">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-exclamation-triangle"></i>
                <h3>Escalation History</h3>
              </div>
            </div>
            <div className="card-body">
              <div style={{ marginBottom: "1rem" }}>
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
                      {escalationHistory.total}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#1e40af" }}>
                      Total
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
                      {escalationHistory.pending}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#b45309" }}>
                      Pending
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
                      {escalationHistory.resolved}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#047857" }}>
                      Resolved
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
                      {escalationHistory.rejected}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#dc2626" }}>
                      Rejected
                    </div>
                  </div>
                </div>
              </div>
              {escalationHistory.chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={escalationHistory.chartData}
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                      label={false}
                    >
                      {escalationHistory.chartData.map((entry, index) => (
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
                        const item = escalationHistory.chartData.find(d => d.name === entry.value);
                        return `${item?.name || value}: ${item?.value || 0}`;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-data-message">No escalation data</div>
              )}
            </div>
          </div>

          <div className="dashboard-card card-medium">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-book"></i>
                <h3>L&D Team Assignments</h3>
              </div>
            </div>
            <div className="card-body">
              {teamAssignmentStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={teamAssignmentStatus}
                      cx="50%"
                      cy="45%"
                      outerRadius={70}
                      dataKey="value"
                      label={false}
                    >
                      {teamAssignmentStatus.map((entry, index) => (
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
                        const item = teamAssignmentStatus.find(d => d.name === entry.value);
                        return `${item?.name || value}: ${item?.value || 0}`;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-data-message">No team assignments</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
