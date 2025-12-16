import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import CountUp from "react-countup";
import {
  Users,
  Target,
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import axios from "axios";
import goalService from "../../services/goals/goalService";
import nominationService from "../../services/internal/nominationService";
import slaService from "../../services/sla/slaService";
import Breadcrumb from "../../components/common/Breadcrumb";
import { toast } from "sonner";
import "../../styles/auth/AdminDashboard.css";
import { getComplianceSummary } from "../../utils/sla/slaCalculations";

const DepartmentHeadDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    pendingGoalApprovals: [],
    pendingNominations: [],
    pendingPerformanceReviews: [],
    approvedPerformanceReviews: [],
    departmentSLAs: [],
    departmentEmployees: [],
    allGoals: [],
    approvedNominations: [],
    complianceTrend: [],
  });

  useEffect(() => {
    fetchAllData();
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

  const getToken = () => {
    return localStorage.getItem("token") || localStorage.getItem("accessToken");
  };

  const createApiPort5222 = () => {
    const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5222";
    const instance = axios.create({
      baseURL: `${BASE_URL}/api`,
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
      (error) => Promise.reject(error)
    );

    return instance;
  };

  const getDeptHeadSubmittedRatings = () => {
    const api = createApiPort5222();
    return api.get("/DeptHeadApprovals/submitted-ratings");
  };

  const getApprovedEmployees = (page = 1, pageSize = 100) => {
    const api = createApiPort5222();
    return api.get("/DeptHeadApprovals/approved-employees", {
      params: { page, pageSize },
    });
  };

  const extractData = (response) => {
    if (!response) return [];
    if (Array.isArray(response)) return response;

    if (response.success === true || response.success === false) {
      if (response.data) {
        if (Array.isArray(response.data)) return response.data;
        if (response.data.$values) return response.data.$values;
        if (response.data.items) {
          if (Array.isArray(response.data.items)) return response.data.items;
          if (response.data.items.$values) return response.data.items.$values;
        }
      }
    }

    if (response.data) {
      if (Array.isArray(response.data)) return response.data;
      if (response.data.$values) return response.data.$values;
      if (response.data.data) {
        if (Array.isArray(response.data.data)) return response.data.data;
        if (response.data.data.$values) return response.data.data.$values;
        if (response.data.data.items?.$values)
          return response.data.data.items.$values;
        if (response.data.data.items) return response.data.data.items;
      }
    }

    if (response.$values) return response.$values;
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

      const deptHeadId =
        user.empMasterId || user.employeeMasterId || user.userId || user.id;

      const [
        pendingGoalApprovalsRes,
        pendingNominationsRes,
        performanceReviewsRes,
        approvedEmployeesRes,
        allGoalsRes,
        allEmployeesRes,
        allSlasRes,
      ] = await Promise.all([
        goalService.getPendingApprovals().catch(() => ({ data: [] })),
        nominationService
          .getPendingDeptHeadReview()
          .catch(() => ({ success: false, data: [] })),
        getDeptHeadSubmittedRatings().catch((err) => {
          console.error("Performance Reviews Error:", err);
          return { data: [] };
        }),
        getApprovedEmployees(1, 100).catch((err) => {
          console.error("Approved Employees Error:", err);
          return { data: [] };
        }),
        goalService.queryGoals({ pageSize: 1000 }).catch(() => ({ data: [] })),
        slaService.getAllEmployees().catch(() => ({ data: [] })),
        slaService.getAllSLAs().catch(() => ({ success: false, data: [] })),
      ]);

      console.log("Performance Reviews raw response:", performanceReviewsRes);
      console.log("Approved Employees raw response:", approvedEmployeesRes);

      const extractedPendingGoalApprovals = extractData(
        pendingGoalApprovalsRes
      );
      const extractedPendingNominations = extractData(pendingNominationsRes);
      const extractedPerformanceReviews = extractData(performanceReviewsRes);
      const extractedApprovedEmployees = extractData(approvedEmployeesRes);
      const extractedAllGoals = extractData(allGoalsRes);
      const extractedAllEmployees = extractData(allEmployeesRes);

      console.log("Extracted Performance Reviews:", extractedPerformanceReviews);
      console.log("Extracted Approved Employees:", extractedApprovedEmployees);

      const allSlas =
        allSlasRes?.success && Array.isArray(allSlasRes.data)
          ? allSlasRes.data
          : [];

      const deptHeadEmployee = extractedAllEmployees.find((emp) => {
        const empId =
          emp.empMasterId || emp.employeeMasterId || emp.userId || emp.id;
        return String(empId) === String(deptHeadId);
      });

      let departmentId = null;
      if (deptHeadEmployee) {
        departmentId =
          deptHeadEmployee.departmentId ||
          deptHeadEmployee.deptId ||
          deptHeadEmployee.department?.departmentId ||
          deptHeadEmployee.department?.id ||
          null;
      }

      const departmentEmployees = extractedAllEmployees;

      const deptSLAs = departmentId
        ? allSlas.filter(
            (sla) => String(sla.departmentId) === String(departmentId)
          )
        : allSlas;

      const derivedPendingApprovals = extractedAllGoals.filter((g) => {
        const s = (g.status || g.goalStatus || "").toLowerCase();
        return (
          s === "pending_depthead_review" ||
          s === "submitted_to_depthead" ||
          s === "pending_approval" ||
          s === "pending"
        );
      });

      let complianceTrendData = [];
      if (deptSLAs.length > 0) {
        const summary = getComplianceSummary(deptSLAs);

        const dates = deptSLAs
          .filter((s) => s.deadline)
          .map((s) => new Date(s.deadline))
          .sort((a, b) => a - b);

        const periodStartDate = dates.length > 0 ? dates[0] : new Date();
        const periodEndDate =
          dates.length > 0 ? dates[dates.length - 1] : new Date();

        const compliancePoint = {
          month: "Current",
          compliance: Number(summary.compliancePercentage || 0),
          meta: {
            departmentId,
            departmentName: deptSLAs[0]?.departmentName || "Department",
            periodStartDate: periodStartDate.toISOString(),
            periodEndDate: periodEndDate.toISOString(),
            totalSlas: summary.totalSLAs,
            closedSlas: summary.closedSLAs,
            onTimeSlas: summary.onTimeSLAs,
            breachedSlas: summary.breachedSLAs,
          },
          totalSLAs: summary.totalSLAs,
          onTimeSLAs: summary.onTimeSLAs,
          breachedSLAs: summary.breachedSLAs,
        };

        complianceTrendData = [compliancePoint];
      }

      const pendingPerformanceReviews = extractedPerformanceReviews.filter(
        (r) => {
          const status = (r.status || r.reviewStatus || "").toLowerCase();
          return (
            status === "pending" ||
            status === "submitted" ||
            status === "awaiting_approval" ||
            status === "pending_depthead_review" ||
            status === "pending_approval"
          );
        }
      );

      const approvedPerformanceReviews = extractedApprovedEmployees;

      console.log("Final Pending Reviews:", pendingPerformanceReviews);
      console.log("Final Approved Reviews:", approvedPerformanceReviews);

      const approvedNominations = extractedPendingNominations.filter(
        (n) => n.status?.toLowerCase() === "approved"
      );

      setDashboardData({
        pendingGoalApprovals: derivedPendingApprovals,
        pendingNominations: extractedPendingNominations,
        pendingPerformanceReviews,
        approvedPerformanceReviews,
        departmentSLAs: deptSLAs,
        departmentEmployees,
        allGoals: extractedAllGoals,
        approvedNominations,
        complianceTrend: complianceTrendData,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getKPIStats = () => {
    const totalTeamMembers = dashboardData.departmentEmployees.length;
    const pendingGoalApprovals = dashboardData.pendingGoalApprovals.length;
    const pendingNominations = dashboardData.pendingNominations.length;
    const pendingPerformanceReviews =
      dashboardData.pendingPerformanceReviews.length;
    const totalDepartmentSLAs = dashboardData.departmentSLAs.length;

    const overdueSLAs = dashboardData.departmentSLAs.filter((s) => {
      const deadline = new Date(s.deadline || s.dueDate);
      const now = new Date();
      return deadline < now && s.status?.toLowerCase() !== "closed";
    }).length;

    return {
      totalTeamMembers,
      pendingGoalApprovals,
      pendingNominations,
      pendingPerformanceReviews,
      totalDepartmentSLAs,
      overdueSLAs,
    };
  };

  const getGoalsOverview = () => {
    const goals = dashboardData.allGoals;
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
    if (pending > 0)
      chartData.push({ name: "Pending", value: pending, fill: "#f59e0b" });
    if (inProgress > 0)
      chartData.push({
        name: "In Progress",
        value: inProgress,
        fill: "#0F62FE",
      });
    if (completed > 0)
      chartData.push({
        name: "Completed",
        value: completed,
        fill: "#10b981",
      });

    return {
      total: goals.length,
      completed,
      inProgress,
      pending,
      chartData:
        chartData.length > 0
          ? chartData
          : [{ name: "No Data", value: 1, fill: "#e5e7eb" }],
    };
  };

  const getPerformanceReviewsOverview = () => {
    const pending = dashboardData.pendingPerformanceReviews.length;
    const approved = dashboardData.approvedPerformanceReviews.length;
    const total = pending + approved;

    const chartData = [];
    if (pending > 0)
      chartData.push({
        name: "Pending Review",
        value: pending,
        fill: "#8b5cf6",
      });
    if (approved > 0)
      chartData.push({ name: "Approved", value: approved, fill: "#10b981" });

    return {
      total,
      pending,
      approved,
      chartData:
        chartData.length > 0
          ? chartData
          : [{ name: "No Data", value: 1, fill: "#e5e7eb" }],
    };
  };

  const getNominationsOverview = () => {
    const nominations = dashboardData.pendingNominations;

    const pending = nominations.filter(
      (n) =>
        n.status?.toLowerCase() === "pending_depthead_review" ||
        n.status?.toLowerCase().includes("pending")
    ).length;

    const approved = nominations.filter(
      (n) => n.status?.toLowerCase() === "approved"
    ).length;

    const rejected = nominations.filter((n) =>
      n.status?.toLowerCase().includes("rejected")
    ).length;

    const chartData = [];
    if (pending > 0)
      chartData.push({ name: "Pending", value: pending, fill: "#0F62FE" });
    if (approved > 0)
      chartData.push({ name: "Approved", value: approved, fill: "#10b981" });
    if (rejected > 0)
      chartData.push({ name: "Rejected", value: rejected, fill: "#ef4444" });

    return {
      total: nominations.length,
      pending,
      approved,
      rejected,
      chartData:
        chartData.length > 0
          ? chartData
          : [{ name: "No Data", value: 1, fill: "#e5e7eb" }],
    };
  };

  const getSLAOverview = () => {
    const slas = dashboardData.departmentSLAs;
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
      (s) => s.status?.toLowerCase() === "closed"
    ).length;

    const open = slas.filter(
      (s) =>
        s.status?.toLowerCase() === "open" ||
        s.status?.toLowerCase() === "inprogress"
    ).length;

    const overdue = slas.filter((s) => {
      const deadline = new Date(s.deadline || s.dueDate);
      const now = new Date();
      return deadline < now && s.status?.toLowerCase() !== "closed";
    }).length;

    const chartData = [];
    if (open > 0)
      chartData.push({ name: "Open", value: open, fill: "#0F62FE" });
    if (overdue > 0)
      chartData.push({ name: "Overdue", value: overdue, fill: "#ef4444" });
    if (closed > 0)
      chartData.push({ name: "Closed", value: closed, fill: "#10b981" });

    return {
      total: slas.length,
      open,
      overdue,
      closed,
      chartData:
        chartData.length > 0
          ? chartData
          : [{ name: "No Data", value: 1, fill: "#e5e7eb" }],
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
  const goalsData = getGoalsOverview();
  const performanceData = getPerformanceReviewsOverview();
  const nominationsData = getNominationsOverview();
  const slaData = getSLAOverview();
  const complianceTrend = dashboardData.complianceTrend || [];
  const hasCompliancePoints =
    Array.isArray(complianceTrend) &&
    complianceTrend.some((p) => !isNaN(p.compliance));

  return (
    <div className="hr-dashboard-container">
      <Breadcrumb items={[{ label: "Department Head Dashboard" }]} />

      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <div className="admin-kpi-icon admin-pink">
            <Users size={28} />
          </div>
          <div className="admin-kpi-content">
            <h2>
              <CountUp end={kpiStats.totalTeamMembers} duration={2} />
            </h2>
            <p>Team Members</p>
            <span className="admin-kpi-subtitle">
              <TrendingUp size={12} /> Department size
            </span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-icon admin-blue">
            <Target size={28} />
          </div>
          <div className="admin-kpi-content">
            <h2>
              <CountUp end={kpiStats.pendingGoalApprovals} duration={2} />
            </h2>
            <p>Goal Approvals</p>
            <span className="admin-kpi-subtitle">Pending review</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-icon admin-purple">
            <Shield size={28} />
          </div>
          <div className="admin-kpi-content">
            <h2>
              <CountUp end={kpiStats.pendingNominations} duration={2} />
            </h2>
            <p>Nominations</p>
            <span className="admin-kpi-subtitle">Pending approval</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-icon admin-green">
            <CheckCircle size={28} />
          </div>
          <div className="admin-kpi-content">
            <h2>
              <CountUp end={kpiStats.pendingPerformanceReviews} duration={2} />
            </h2>
            <p>Performance Reviews</p>
            <span className="admin-kpi-subtitle">Awaiting approval</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-icon admin-cyan">
            <AlertTriangle size={28} />
          </div>
          <div className="admin-kpi-content">
            <h2>
              <CountUp end={kpiStats.totalDepartmentSLAs} duration={2} />
            </h2>
            <p>Department SLAs</p>
            <span className="admin-kpi-subtitle">
              {kpiStats.overdueSLAs} overdue
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-cards-container">
        <div className="dashboard-row">
          <div className="dashboard-card card-medium">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-bullseye" />
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
                          <Cell key={index} fill={entry.fill} />
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
                <i className="bi bi-graph-up" />
                <h3>Performance Reviews</h3>
              </div>
            </div>
            <div className="card-body">
              {performanceData.total > 0 ? (
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
                        background: "#f3e8ff",
                        padding: "0.75rem",
                        borderRadius: "6px",
                        textAlign: "center",
                        border: "1px solid #d8b4fe",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "1.5rem",
                          fontWeight: "bold",
                          color: "#8b5cf6",
                        }}
                      >
                        {performanceData.pending}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#6b21a8" }}>
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
                        {performanceData.approved}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#047857" }}>
                        Approved
                      </div>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart
                      data={[
                        { name: "Pending", value: performanceData.pending },
                        { name: "Approved", value: performanceData.approved },
                      ]}
                      margin={{ top: 10, right: 10, bottom: 30, left: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e5e7eb"
                        vertical={false}
                      />
                      <XAxis dataKey="name" stroke="#6b7280" fontSize={11} />
                      <YAxis allowDecimals={false} stroke="#6b7280" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "6px",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        <Cell fill="#8b5cf6" />
                        <Cell fill="#10b981" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <div className="no-data-message">No pending reviews</div>
              )}
            </div>
          </div>

          <div className="dashboard-card card-medium">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-award" />
                <h3>Nomination Reviews</h3>
              </div>
            </div>
            <div className="card-body">
              {nominationsData.total > 0 ? (
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
                        {nominationsData.pending}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#1e40af" }}>
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
                        {nominationsData.approved}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#047857" }}>
                        Approved
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
                        {nominationsData.rejected}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#dc2626" }}>
                        Rejected
                      </div>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={nominationsData.chartData}
                        cx="50%"
                        cy="45%"
                        outerRadius={80}
                        dataKey="value"
                        label={false}
                      >
                        {nominationsData.chartData.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend
                        layout="horizontal"
                        align="center"
                        verticalAlign="bottom"
                        wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                        formatter={(value, entry) => {
                          const item = nominationsData.chartData.find(
                            (d) => d.name === entry.value
                          );
                          return `${item?.name || value}: ${item?.value || 0}`;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <div className="no-data-message">No nominations</div>
              )}
            </div>
          </div>
        </div>

        <div className="dashboard-row">
          <div className="dashboard-card card-medium">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-file-earmark-check" />
                <h3>Department SLAs</h3>
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
                          <Cell key={index} fill={entry.fill} />
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
                          return `${item?.name || value}: ${item?.value || 0}`;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <div className="no-data-message">No SLA data</div>
              )}
            </div>
          </div>

          <div className="dashboard-card card-medium">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-graph-up-arrow" />
                <h3>Compliance Trend</h3>
              </div>
            </div>
            <div className="card-body">
              {hasCompliancePoints ? (
                <>
                  <div style={{ marginBottom: "1rem" }}>
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
                        {complianceTrend[complianceTrend.length - 1].compliance}%
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#047857" }}>
                        Current Compliance Rate
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: "0.875rem",
                        textAlign: "center",
                        marginTop: "0.5rem",
                        color: "#065f46",
                      }}
                    >
                      Total:{" "}
                      {complianceTrend[complianceTrend.length - 1].totalSLAs} |
                      On-time:{" "}
                      {complianceTrend[complianceTrend.length - 1].onTimeSLAs} |
                      Breached:{" "}
                      {complianceTrend[complianceTrend.length - 1].breachedSLAs}
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={complianceTrend}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f3f4f6"
                        vertical={false}
                      />
                      <XAxis dataKey="month" stroke="#9ca3af" fontSize={10} />
                      <YAxis stroke="#9ca3af" fontSize={11} domain={[0, 100]} />
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
                        dataKey="compliance"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: "#10b981", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <div className="no-data-message">No compliance data</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentHeadDashboard;
